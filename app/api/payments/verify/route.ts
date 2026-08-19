import {
  createHmac,
  timingSafeEqual,
} from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  PaymentStatus,
  PlanType,
  SubscriptionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getUserIdFromToken } from "@/lib/auth";
import {
  recordPaymentSuccessActivity,
} from "@/lib/activity";

export async function POST(
  request: NextRequest
) {
  try {
    // ============================================================
    // 1. AUTHENTICATE USER
    // ============================================================

    const token =
      request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
        }
      );
    }

    // ============================================================
    // 2. READ RAZORPAY RESPONSE
    // ============================================================

    const body =
      await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      typeof razorpay_order_id !==
        "string" ||
      typeof razorpay_payment_id !==
        "string" ||
      typeof razorpay_signature !==
        "string" ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing payment verification details.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 3. FIND PAYMENT CREATED BY OUR SERVER
    // ============================================================

    const payment =
      await prisma.payment.findUnique({
        where: {
          razorpayOrderId:
            razorpay_order_id,
        },
      });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment order not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // 4. VERIFY PAYMENT OWNERSHIP
    // ============================================================

    if (
      payment.userId !==
      userId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment does not belong to this user.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // 5. IDEMPOTENCY
    // ============================================================

    if (
      payment.status ===
      PaymentStatus.SUCCESS
    ) {
      return NextResponse.json({
        success: true,
        message:
          "Payment was already processed.",
      });
    }

    // ============================================================
    // 6. CHECK SERVER PAYMENT ORDER ID
    // ============================================================

    const serverOrderId =
      payment.razorpayOrderId;

    if (!serverOrderId) {
      console.error(
        "Payment record does not contain a Razorpay order ID:",
        payment.id
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment configuration error.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      serverOrderId !==
      razorpay_order_id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment order mismatch.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 7. VERIFY RAZORPAY SIGNATURE
    // ============================================================

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error(
        "RAZORPAY_KEY_SECRET is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment configuration error.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * IMPORTANT:
     *
     * Razorpay recommends using the order ID stored on our
     * server when constructing the signature rather than
     * trusting the order ID supplied by the browser.
     */

    const generatedSignature =
      createHmac(
        "sha256",
        keySecret
      )
        .update(
          `${serverOrderId}|${razorpay_payment_id}`
        )
        .digest("hex");

    // ============================================================
    // TIMING-SAFE SIGNATURE COMPARISON
    // ============================================================

    const generatedBuffer =
      Buffer.from(
        generatedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpay_signature,
        "utf8"
      );

    const signatureMatches =
      generatedBuffer.length ===
        receivedBuffer.length &&
      timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      );

    if (!signatureMatches) {
      console.error(
        "Razorpay signature verification failed for payment:",
        payment.id
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment signature verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 8. FETCH PAYMENT DIRECTLY FROM RAZORPAY
    // ============================================================

    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    // ============================================================
    // 9. VERIFY RAZORPAY ORDER
    // ============================================================

    if (
      razorpayPayment.order_id !==
      serverOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment order mismatch.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 10. VERIFY PAYMENT STATUS
    // ============================================================

    if (
      razorpayPayment.status !==
      "captured"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Payment is not captured. Current status: ${razorpayPayment.status}`,
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 11. VERIFY AMOUNT
    // ============================================================

    const razorpayAmount =
      Number(
        razorpayPayment.amount
      );

    if (
      !Number.isFinite(
        razorpayAmount
      ) ||
      razorpayAmount !==
        payment.amount
    ) {
      console.error(
        "Payment amount mismatch:",
        {
          localPaymentId:
            payment.id,
          expectedAmount:
            payment.amount,
          razorpayAmount,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment amount verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 12. VERIFY CURRENCY
    // ============================================================

    if (
      razorpayPayment.currency !==
      payment.currency
    ) {
      console.error(
        "Payment currency mismatch:",
        {
          localPaymentId:
            payment.id,
          expectedCurrency:
            payment.currency,
          razorpayCurrency:
            razorpayPayment.currency,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment currency verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 13. CALCULATE SUBSCRIPTION EXPIRY
    // ============================================================

    const now =
      new Date();

    const expiresAt =
      new Date(now);

    if (
      payment.billingCycle ===
      "MONTHLY"
    ) {
      expiresAt.setMonth(
        expiresAt.getMonth() +
          1
      );
    }

    if (
      payment.billingCycle ===
      "SIX_MONTHS"
    ) {
      expiresAt.setMonth(
        expiresAt.getMonth() +
          6
      );
    }

    if (
      payment.billingCycle ===
      "YEARLY"
    ) {
      expiresAt.setFullYear(
        expiresAt.getFullYear() +
          1
      );
    }

    // ============================================================
    // 14. MARK PAYMENT SUCCESSFUL + ACTIVATE PRO
    // ============================================================

    await prisma.$transaction(
      async (tx) => {
        await tx.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            status:
              PaymentStatus.SUCCESS,

            razorpayPaymentId:
              razorpay_payment_id,

            razorpaySignature:
              razorpay_signature,
          },
        });

        await tx.subscription.upsert({
          where: {
            userId,
          },

          create: {
            userId,

            plan:
              PlanType.PRO,

            billingCycle:
              payment.billingCycle,

            status:
              SubscriptionStatus.ACTIVE,

            source:
              "PAYMENT",

            grantedById:
              null,

            grantReason:
              null,

            startedAt:
              now,

            expiresAt,
          },

          update: {
            plan:
              PlanType.PRO,

            billingCycle:
              payment.billingCycle,

            status:
              SubscriptionStatus.ACTIVE,

            source:
              "PAYMENT",

            /*
             * Important if a user previously had
             * administrator-granted PRO.
             */
            grantedById:
              null,

            grantReason:
              null,

            startedAt:
              now,

            expiresAt,
          },
        });
      }
    );

    // ============================================================
    // 15. RECORD PAYMENT ACTIVITY
    // ============================================================

    await recordPaymentSuccessActivity(
      userId,
      payment.id
    );

    // ============================================================
    // 16. RETURN SUCCESS
    // ============================================================

    return NextResponse.json({
      success: true,

      message:
        "Payment verified successfully.",

      subscription: {
        plan: "PRO",

        billingCycle:
          payment.billingCycle,

        expiresAt,
      },
    });
  } catch (error) {
    console.error(
      "========== PAYMENT VERIFICATION ERROR =========="
    );

    console.error(
      error
    );

    console.error(
      "================================================"
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify payment.",
      },
      {
        status: 500,
      }
    );
  }
}
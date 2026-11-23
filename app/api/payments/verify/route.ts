import {
  createHmac,
  timingSafeEqual,
} from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  BillingCycle,
  PaymentStatus,
  PlanType,
  SubscriptionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getSessionUserId } from "@/lib/session";
import {
  recordPaymentSuccessActivity,
} from "@/lib/activity";

const TEAM_PLAN_AMOUNT = 14500000;
const TEAM_PLAN_CURRENCY = "INR";

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * ========================================================================
     * 1. AUTHENTICATE USER
     * ========================================================================
     */

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
      await getSessionUserId(token);

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

    /*
     * ========================================================================
     * 2. READ RAZORPAY RESPONSE
     * ========================================================================
     */

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

    /*
     * ========================================================================
     * 3. FIND SERVER-SIDE PAYMENT
     * ========================================================================
     */

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

    /*
     * ========================================================================
     * 4. VERIFY PAYMENT OWNERSHIP
     * ========================================================================
     */

    if (
      payment.userId !== userId
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

    /*
     * ========================================================================
     * 5. IDEMPOTENCY
     * ========================================================================
     *
     * A previously successful payment should not be processed again.
     *
     * For Team payments, also return the existing workspace information.
     */

    if (
      payment.status ===
      PaymentStatus.SUCCESS
    ) {
      if (
        payment.billingCycle ===
        BillingCycle.TEAM_YEARLY
      ) {
        const workspace =
          await prisma.teamWorkspace.findUnique(
            {
              where: {
                ownerId: userId,
              },

              select: {
                id: true,
                name: true,
                status: true,
                startedAt: true,
                expiresAt: true,
              },
            }
          );

        return NextResponse.json({
          success: true,
          checkoutType: "TEAM",
          message:
            "Team payment was already processed.",
          workspace,
        });
      }

      return NextResponse.json({
        success: true,
        checkoutType: "PRO",
        message:
          "Payment was already processed.",
      });
    }

    /*
     * ========================================================================
     * 6. VERIFY SERVER ORDER ID
     * ========================================================================
     */

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

    /*
     * ========================================================================
     * 7. VERIFY RAZORPAY SIGNATURE
     * ========================================================================
     */

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
     * Always build the signature from the order ID stored on our server.
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

    /*
     * ========================================================================
     * 8. FETCH PAYMENT DIRECTLY FROM RAZORPAY
     * ========================================================================
     */

    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    /*
     * ========================================================================
     * 9. VERIFY RAZORPAY ORDER
     * ========================================================================
     */

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

    /*
     * ========================================================================
     * 10. VERIFY CAPTURED STATUS
     * ========================================================================
     */

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

    /*
     * ========================================================================
     * 11. VERIFY AMOUNT
     * ========================================================================
     */

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

    /*
     * ========================================================================
     * 12. VERIFY CURRENCY
     * ========================================================================
     */

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

    /*
     * ========================================================================
     * 13. DETERMINE PURCHASE TYPE
     * ========================================================================
     */

    const isTeamPurchase =
      payment.billingCycle ===
      BillingCycle.TEAM_YEARLY;

    /*
     * Extra server-side Team amount validation.
     *
     * The order was created by our server, but this gives us another explicit
     * guard at the final entitlement boundary.
     */

    if (
      isTeamPurchase &&
      payment.amount !==
        TEAM_PLAN_AMOUNT
    ) {
      console.error(
        "Team payment amount is invalid:",
        {
          paymentId:
            payment.id,
          amount:
            payment.amount,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Team payment amount verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      isTeamPurchase &&
      payment.currency !==
        TEAM_PLAN_CURRENCY
    ) {
      console.error(
        "Team payment currency is invalid:",
        {
          paymentId:
            payment.id,
          currency:
            payment.currency,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Team payment currency verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================================
     * 14. TEAM PURCHASE
     * ========================================================================
     *
     * Team purchase does NOT create a personal subscription record.
     *
     * The buyer receives PRO through the active Team Workspace entitlement.
     * Team members later receive PRO through their TeamMembership records.
     */

    if (isTeamPurchase) {
      const now =
        new Date();

      const expiresAt =
        new Date(now);

      expiresAt.setFullYear(
        expiresAt.getFullYear() +
          1
      );

      const result =
        await prisma.$transaction(
          async (tx) => {
            /*
             * Re-check inside the transaction so a duplicate browser request
             * cannot create two Team Workspaces for the same owner.
             */
            const existingWorkspace =
              await tx.teamWorkspace.findUnique(
                {
                  where: {
                    ownerId: userId,
                  },

                  select: {
                    id: true,
                    name: true,
                    status: true,
                    startedAt: true,
                    expiresAt: true,
                  },
                }
              );

            if (existingWorkspace) {
              throw new Error(
                "TEAM_WORKSPACE_ALREADY_EXISTS"
              );
            }

            /*
             * Mark the Razorpay payment successful.
             */
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

            /*
             * Create exactly ONE Team Workspace.
             *
             * The workspace name is deliberately left to the post-payment
             * setup flow. The customer will name it from /team.
             */
            const workspace =
              await tx.teamWorkspace.create({
                data: {
                  ownerId: userId,

                  name:
                    "Team Intelligence Workspace",

                  status:
                    "ACTIVE",

                  startedAt:
                    now,

                  expiresAt,
                },

                select: {
                  id: true,
                  name: true,
                  status: true,
                  startedAt: true,
                  expiresAt: true,
                },
              });

            return workspace;
          }
        );

      await recordPaymentSuccessActivity(
        userId,
        payment.id
      );

      return NextResponse.json({
        success: true,

        checkoutType: "TEAM",

        message:
          "Team payment verified successfully.",

        team: {
          workspaceId:
            result.id,

          workspaceName:
            result.name,

          status:
            result.status,

          startedAt:
            result.startedAt,

          expiresAt:
            result.expiresAt,

          maxMembers: 20,

          durationMonths: 12,

          price:
            TEAM_PLAN_AMOUNT,

          currency:
            TEAM_PLAN_CURRENCY,
        },
      });
    }

    /*
     * ========================================================================
     * 15. PERSONAL PRO PURCHASE
     * ========================================================================
     *
     * Existing personal PRO behaviour remains intact.
     */

    const now =
      new Date();

    const expiresAt =
      new Date(now);

    if (
      payment.billingCycle ===
      BillingCycle.MONTHLY
    ) {
      expiresAt.setMonth(
        expiresAt.getMonth() +
          1
      );
    }

    if (
      payment.billingCycle ===
      BillingCycle.SIX_MONTHS
    ) {
      expiresAt.setMonth(
        expiresAt.getMonth() +
          6
      );
    }

    if (
      payment.billingCycle ===
      BillingCycle.YEARLY
    ) {
      expiresAt.setFullYear(
        expiresAt.getFullYear() +
          1
      );
    }

    if (
      payment.billingCycle ===
      BillingCycle.TEAM_YEARLY
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Team payments must be processed as Team checkout.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================================
     * 16. MARK PERSONAL PAYMENT SUCCESSFUL + ACTIVATE PRO
     * ========================================================================
     */

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

    await recordPaymentSuccessActivity(
      userId,
      payment.id
    );

    /*
     * ========================================================================
     * 17. RETURN PERSONAL PRO SUCCESS
     * ========================================================================
     */

    return NextResponse.json({
      success: true,

      checkoutType: "PRO",

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
    /*
     * Duplicate Team purchase race.
     *
     * A unique ownerId constraint should prevent a second workspace from
     * being created. Return a controlled response instead of a generic 500
     * where possible.
     */
    if (
      error instanceof Error &&
      error.message ===
        "TEAM_WORKSPACE_ALREADY_EXISTS"
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "TEAM_WORKSPACE_ALREADY_EXISTS",
          message:
            "A Team Workspace already exists for this account.",
        },
        {
          status: 409,
        }
      );
    }

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
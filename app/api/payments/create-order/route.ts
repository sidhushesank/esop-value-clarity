import { NextRequest, NextResponse } from "next/server";

import {
  BillingCycle,
  PaymentStatus,
  PlanType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { PRICING } from "@/lib/pricing";
import { getSessionUserId } from "@/lib/session";

const TEAM_PLAN_AMOUNT = 14500000; // ₹1,45,000 in paise
const TEAM_PLAN_CURRENCY = "INR";
const TEAM_PLAN_BILLING_CYCLE = "TEAM_YEARLY";

type CheckoutType =
  | "PRO"
  | "TEAM";

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * ------------------------------------------------------------------------
     * 1. AUTHENTICATE USER
     * ------------------------------------------------------------------------
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
     * ------------------------------------------------------------------------
     * 2. LOAD USER + EXISTING TEAM WORKSPACE
     * ------------------------------------------------------------------------
     */

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          subscription: true,
          ownedTeamWorkspace: {
            select: {
              id: true,
              status: true,
              expiresAt: true,
            },
          },
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Founder keeps the existing rule for normal PRO checkout.
     *
     * Team purchase is still allowed for the founder only if we deliberately
     * want to test Team purchase. For safety, this route returns a controlled
     * response for a real Team purchase only if the founder does not already
     * have a Team Workspace.
     */

    /*
     * ------------------------------------------------------------------------
     * 3. READ CHECKOUT REQUEST
     * ------------------------------------------------------------------------
     */

    const body =
      await request.json();

    const checkoutType =
      body.checkoutType as CheckoutType;

    /*
     * Backward compatibility:
     *
     * Existing frontend calls only send billingCycle.
     * Those continue to mean a normal PRO purchase.
     */
    const resolvedCheckoutType: CheckoutType =
      checkoutType === "TEAM"
        ? "TEAM"
        : "PRO";

    /*
     * ------------------------------------------------------------------------
     * 4. TEAM CHECKOUT
     * ------------------------------------------------------------------------
     */

    if (
      resolvedCheckoutType ===
      "TEAM"
    ) {
      /*
       * A user may create only ONE Team Workspace.
       *
       * If an existing active or pending workspace exists, do not allow a
       * second Team purchase through this endpoint.
       */
      if (
        user.ownedTeamWorkspace
      ) {
        const existing =
          user.ownedTeamWorkspace;

        if (
          existing.status ===
            "ACTIVE" &&
          existing.expiresAt >
            new Date()
        ) {
          return NextResponse.json(
            {
              success: false,
              code: "TEAM_WORKSPACE_ALREADY_ACTIVE",
              message:
                "You already have an active Team Workspace.",
            },
            {
              status: 400,
            }
          );
        }

        return NextResponse.json(
          {
            success: false,
            code: "TEAM_WORKSPACE_ALREADY_EXISTS",
            message:
              "This account already has a Team Workspace. Please renew the existing Team plan rather than creating another workspace.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Create a Team payment using the same Payment table and Razorpay
       * infrastructure already used by personal PRO.
       *
       * The billingCycle field is stored as TEAM_YEARLY in the payment
       * record. The payment schema therefore needs to permit that enum/value.
       */
      const order =
        await razorpay.orders.create({
          amount:
            TEAM_PLAN_AMOUNT,
          currency:
            TEAM_PLAN_CURRENCY,
          receipt:
            `team_${user.id}_${Date.now()}`,
        });

      /*
       * IMPORTANT:
       *
       * This uses the existing Payment architecture. Do not create a second
       * payment storage system just for Team.
       */
      const payment =
        await prisma.payment.create({
          data: {
            userId: user.id,

            plan: PlanType.PRO,

            /*
             * This assignment assumes BillingCycle has been extended with
             * TEAM_YEARLY in Prisma.
             */
            billingCycle:
              TEAM_PLAN_BILLING_CYCLE as BillingCycle,

            amount:
              TEAM_PLAN_AMOUNT,

            currency:
              TEAM_PLAN_CURRENCY,

            status:
              PaymentStatus.PENDING,

            razorpayOrderId:
              order.id,
          },
        });

      return NextResponse.json({
        success: true,

        checkoutType: "TEAM",

        paymentId:
          payment.id,

        order,

        key:
          process.env
            .NEXT_PUBLIC_RAZORPAY_KEY_ID,

        teamPlan: {
          amount:
            TEAM_PLAN_AMOUNT,

          displayAmount:
            145000,

          currency:
            TEAM_PLAN_CURRENCY,

          billingCycle:
            TEAM_PLAN_BILLING_CYCLE,

          workspaceLimit: 1,

          maxMembers: 20,

          durationMonths: 12,
        },
      });
    }

    /*
     * ------------------------------------------------------------------------
     * 5. NORMAL PERSONAL PRO CHECKOUT
     * ------------------------------------------------------------------------
     */

    /*
     * Founder gets lifetime PRO and therefore does not need the normal
     * personal PRO checkout.
     */
    if (
      user.email ===
      process.env.FOUNDER_EMAIL
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Founder account already has lifetime PRO.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Already active personal PRO.
     *
     * Team-sponsored PRO is deliberately NOT checked here because a Team
     * member may already have Team-sponsored access while still being
     * eligible for their own independent personal subscription.
     */
    if (
      user.subscription &&
      user.subscription.plan ===
        PlanType.PRO &&
      user.subscription.status ===
        "ACTIVE" &&
      user.subscription.expiresAt !==
        null &&
      user.subscription.expiresAt >
        new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You already have PRO.",
        },
        {
          status: 400,
        }
      );
    }

    const billingCycle =
      body.billingCycle as BillingCycle;

    if (!billingCycle) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Billing cycle is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Object.values(
        BillingCycle
      ).includes(billingCycle)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid billing cycle.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * TEAM_YEARLY is handled exclusively by checkoutType=TEAM above.
     *
     * Prevent accidental personal checkout requests from using the Team
     * billing value.
     */
    if (
      billingCycle ===
      TEAM_PLAN_BILLING_CYCLE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Team billing must use Team checkout.",
        },
        {
          status: 400,
        }
      );
    }

    const pricing =
      PRICING[billingCycle];

    if (!pricing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pricing configuration could not be found.",
        },
        {
          status: 500,
        }
      );
    }

    const order =
      await razorpay.orders.create({
        amount:
          pricing.amount,
        currency:
          "INR",
        receipt:
          `receipt_${user.id}_${Date.now()}`,
      });

    const payment =
      await prisma.payment.create({
        data: {
          userId: user.id,

          plan: PlanType.PRO,

          billingCycle,

          amount:
            pricing.amount,

          currency:
            "INR",

          status:
            PaymentStatus.PENDING,

          razorpayOrderId:
            order.id,
        },
      });

    return NextResponse.json({
      success: true,

      checkoutType: "PRO",

      paymentId:
        payment.id,

      order,

      key:
        process.env
          .NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(
      "[PAYMENT_CREATE_ORDER_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while creating the payment order.",
      },
      {
        status: 500,
      }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { BillingCycle, PaymentStatus, PlanType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { PRICING } from "@/lib/pricing";
import { getUserIdFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get JWT
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Decode JWT
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    // Logged in user
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Founder gets PRO forever
    if (user.email === process.env.FOUNDER_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          message: "Founder account already has lifetime PRO.",
        },
        { status: 400 }
      );
    }

    // Already PRO
    if (
      user.subscription &&
      user.subscription.plan === PlanType.PRO &&
      user.subscription.status === "ACTIVE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have PRO.",
        },
        { status: 400 }
      );
    }

    // Billing cycle selected by frontend
    const body = await request.json();

const billingCycle = body.billingCycle as BillingCycle;

    if (!billingCycle) {
      return NextResponse.json(
        {
          success: false,
          message: "Billing cycle is required.",
        },
        { status: 400 }
      );
    }

    // Validate enum
    if (!Object.values(BillingCycle).includes(billingCycle)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid billing cycle.",
        },
        { status: 400 }
      );
    }

    const pricing = PRICING[billingCycle];

    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: pricing.amount,
      currency: "INR",
      receipt: `receipt_${user.id}_${Date.now()}`,
    });

    // Save payment
    await prisma.payment.create({
      data: {
        userId: user.id,
        plan: PlanType.PRO,
        billingCycle,
        amount: pricing.amount,
        currency: "INR",
        status: PaymentStatus.PENDING,
        razorpayOrderId: order.id,
      },
    });

    return NextResponse.json({
      success: true,
      order,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}
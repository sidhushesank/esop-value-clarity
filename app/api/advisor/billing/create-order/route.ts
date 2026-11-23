import { NextRequest, NextResponse } from "next/server";
import { PaymentStatus, SubscriptionSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getSessionUserId } from "@/lib/session";
import { ADVISOR_PLAN, addMonths } from "@/lib/advisor-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message: string, status: number, code?: string) {
  return NextResponse.json(
    { success: false, message, code },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * POST /api/advisor/billing/create-order
 *
 * Starts an annual Advisor plan purchase (or renewal). Separate from the
 * PRO / Team checkout: it only writes AdvisorFirm / AdvisorPayment rows.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return fail("Unauthorized", 401);

    const userId = await getSessionUserId(token);
    if (!userId) return fail("Invalid token", 401);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, accountStatus: true },
    });

    if (!user) return fail("User not found.", 404);
    if (user.accountStatus !== "ACTIVE") {
      return fail("This account cannot make purchases.", 403);
    }

    // Founder has unlimited access and never pays.
    if (
      process.env.FOUNDER_EMAIL &&
      user.email === process.env.FOUNDER_EMAIL
    ) {
      return fail(
        "Founder accounts have unlimited Advisor access. No payment is needed.",
        400,
        "FOUNDER_NO_PAYMENT"
      );
    }

    const now = new Date();

    // The firm must exist because AdvisorPayment points at it. A brand-new
    // firm stays locked (EXPIRED, ends now) until the payment is verified.
    let firm = await prisma.advisorFirm.findUnique({
      where: { ownerId: user.id },
    });

    if (!firm) {
      firm = await prisma.advisorFirm.create({
        data: {
          name: user.name ? `${user.name}'s firm` : "My firm",
          ownerId: user.id,
          status: "EXPIRED",
          clientLimit: ADVISOR_PLAN.includedClients,
          source: SubscriptionSource.PAYMENT,
          startedAt: now,
          expiresAt: now,
        },
      });
    }

    const order = await razorpay.orders.create({
      amount: ADVISOR_PLAN.amountPaise,
      currency: ADVISOR_PLAN.currency,
      receipt: `adv_${firm.id.slice(-12)}_${Date.now().toString(36)}`,
    });

    const base =
      firm.status === "ACTIVE" && firm.expiresAt > now ? firm.expiresAt : now;

    const payment = await prisma.advisorPayment.create({
      data: {
        firmId: firm.id,
        userId: user.id,
        amount: ADVISOR_PLAN.amountPaise,
        currency: ADVISOR_PLAN.currency,
        status: PaymentStatus.PENDING,
        razorpayOrderId: order.id,
        startedAt: base,
        expiresAt: addMonths(base, ADVISOR_PLAN.termMonths),
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      order,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[ADVISOR_CREATE_ORDER]", error);
    return fail("We could not start the payment. Please try again.", 500);
  }
}

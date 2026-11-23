import { NextRequest, NextResponse } from "next/server";
import { PaymentStatus, SubscriptionSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getSessionUserId } from "@/lib/session";
import { STARTUP_PLAN, addMonths } from "@/lib/company-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message: string, status: number, code?: string) {
  return NextResponse.json(
    { success: false, message, code },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * POST /api/company/billing/create-order
 *
 * Starts an annual Startup plan purchase (or renewal). Separate from the
 * PRO / Team checkout: it only writes CompanyWorkspace / CompanyPayment rows.
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
        "Founder accounts have unlimited Startup Equity Desk access. No payment is needed.",
        400,
        "FOUNDER_NO_PAYMENT"
      );
    }

    const now = new Date();

    // The workspace must exist because CompanyPayment points at it. A brand-new
    // workspace stays locked (EXPIRED, ends now) until the payment is verified.
    let workspace = await prisma.companyWorkspace.findUnique({
      where: { ownerId: user.id },
    });

    if (!workspace) {
      workspace = await prisma.companyWorkspace.create({
        data: {
          name: user.name ? `${user.name}'s company` : "My company",
          ownerId: user.id,
          status: "EXPIRED",
          holderLimit: STARTUP_PLAN.includedOptionHolders,
          source: SubscriptionSource.PAYMENT,
          startedAt: now,
          expiresAt: now,
        },
      });
    }

    const order = await razorpay.orders.create({
      amount: STARTUP_PLAN.amountPaise,
      currency: STARTUP_PLAN.currency,
      receipt: `cmp_${workspace.id.slice(-12)}_${Date.now().toString(36)}`,
    });

    const base =
      workspace.status === "ACTIVE" && workspace.expiresAt > now ? workspace.expiresAt : now;

    const payment = await prisma.companyPayment.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        amount: STARTUP_PLAN.amountPaise,
        currency: STARTUP_PLAN.currency,
        status: PaymentStatus.PENDING,
        razorpayOrderId: order.id,
        startedAt: base,
        expiresAt: addMonths(base, STARTUP_PLAN.termMonths),
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      order,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[COMPANY_CREATE_ORDER]", error);
    return fail("We could not start the payment. Please try again.", 500);
  }
}

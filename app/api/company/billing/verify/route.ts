import { createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { PaymentStatus, SubscriptionSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getUserIdFromToken } from "@/lib/auth";
import { STARTUP_PLAN, addMonths } from "@/lib/company-pricing";
import { sendStartupPlanEmail } from "@/lib/company-billing-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * POST /api/company/billing/verify
 *
 * Same verification steps as the PRO/Team flow: server-side order lookup,
 * HMAC signature, then a check with Razorpay itself (captured, same order,
 * same amount and currency). Then the workspace's term is extended.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return fail("Unauthorized", 401);

    const userId = getUserIdFromToken(token);
    if (!userId) return fail("Invalid token", 401);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid request.", 400);
    }

    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string" ||
      !orderId ||
      !paymentId ||
      !signature
    ) {
      return fail("Missing payment verification details.", 400);
    }

    const payment = await prisma.companyPayment.findUnique({
      where: { razorpayOrderId: orderId },
      include: { workspace: true },
    });

    if (!payment) return fail("Payment order not found.", 404);
    if (payment.userId !== userId) {
      return fail("Payment does not belong to this user.", 403);
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return NextResponse.json({
        success: true,
        message: "Payment was already processed.",
        expiresAt: payment.workspace.expiresAt,
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("[COMPANY_VERIFY] RAZORPAY_KEY_SECRET is missing.");
      return fail("Payment configuration error.", 500);
    }

    const expected = Buffer.from(
      createHmac("sha256", keySecret)
        .update(`${payment.razorpayOrderId}|${paymentId}`)
        .digest("hex"),
      "utf8"
    );
    const received = Buffer.from(signature, "utf8");

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      console.error("[COMPANY_VERIFY] signature mismatch:", payment.id);
      await prisma.companyPayment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED },
      });
      return fail("Payment verification failed.", 400);
    }

    // Confirm with Razorpay that the money was really captured.
    const remote = await razorpay.payments.fetch(paymentId);

    if (
      remote.order_id !== payment.razorpayOrderId ||
      remote.status !== "captured" ||
      Number(remote.amount) !== payment.amount ||
      remote.currency !== payment.currency
    ) {
      console.error("[COMPANY_VERIFY] Razorpay check failed:", payment.id, {
        status: remote.status,
      });
      return fail("Payment could not be confirmed with Razorpay.", 400);
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Only one request may flip PENDING -> SUCCESS (double-click safe).
      const claimed = await tx.companyPayment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.SUCCESS,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        },
      });

      if (claimed.count === 0) return null;

      const workspace = await tx.companyWorkspace.findUniqueOrThrow({
        where: { id: payment.workspaceId },
      });

      const base =
        workspace.status === "ACTIVE" && workspace.expiresAt > now
          ? workspace.expiresAt
          : now;
      const newExpiry = addMonths(base, STARTUP_PLAN.termMonths);

      const updated = await tx.companyWorkspace.update({
        where: { id: workspace.id },
        data: {
          status: "ACTIVE",
          expiresAt: newExpiry,
          holderLimit: Math.max(workspace.holderLimit, STARTUP_PLAN.includedOptionHolders),
          source: SubscriptionSource.PAYMENT,
          paymentReference: paymentId,
          expiryReminderFor: null,
        },
      });

      await tx.companyPayment.update({
        where: { id: payment.id },
        data: { startedAt: base, expiresAt: newExpiry },
      });

      return updated;
    });

    if (!result) {
      return NextResponse.json({
        success: true,
        message: "Payment was already processed.",
      });
    }

    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (owner) {
      await sendStartupPlanEmail({
        to: owner.email,
        kind: "PURCHASED",
        ownerName: owner.name,
        companyName: result.name,
        expiresAt: result.expiresAt,
        holderLimit: result.holderLimit,
        reference: paymentId,
        duration: "1 year",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Your Startup plan is active.",
      expiresAt: result.expiresAt,
      holderLimit: result.holderLimit,
    });
  } catch (error) {
    console.error("[COMPANY_VERIFY]", error);
    return fail("We could not verify the payment. Please contact us.", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { sendAdvisorPlanEmail } from "@/lib/advisor-billing-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CLIENT_LIMIT = 10_000;

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * PATCH /api/admin/advisors/[firmId]
 *   { action: "REVOKE", sendEmail?: boolean }
 *   { action: "UPDATE", clientLimit?: number, firmName?: string }
 *
 * Revoke = lock out immediately (end date set to now). Data is kept, so
 * granting or renewing later restores everything.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ firmId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) return auth.response;

    const { firmId } = await context.params;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid request.", 400);
    }

    const firm = await prisma.advisorFirm.findUnique({
      where: { id: firmId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    if (!firm) return fail("Advisor firm not found.", 404);

    const isFounderFirm =
      !!process.env.FOUNDER_EMAIL &&
      firm.owner.email === process.env.FOUNDER_EMAIL;

    if (isFounderFirm) {
      return fail("The founder's firm cannot be changed here.", 400);
    }

    if (body.action === "REVOKE") {
      const now = new Date();

      const updated = await prisma.$transaction(async (tx) => {
        const saved = await tx.advisorFirm.update({
          where: { id: firm.id },
          data: { status: "EXPIRED", expiresAt: now },
        });

        await tx.adminAuditLog.create({
          data: {
            adminId: auth.admin.id,
            targetUserId: firm.owner.id,
            action: "ADVISOR_FIRM_REVOKED",
            metadata: {
              firmId: firm.id,
              previousExpiresAt: firm.expiresAt,
            },
          },
        });

        return saved;
      });

      let emailSent = false;
      if (body.sendEmail === true) {
        emailSent = await sendAdvisorPlanEmail({
          to: firm.owner.email,
          kind: "REVOKED",
          ownerName: firm.owner.name,
          firmName: updated.name,
          expiresAt: updated.expiresAt,
          clientLimit: updated.clientLimit,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Access revoked.",
        emailSent,
      });
    }

    if (body.action === "UPDATE") {
      const data: { clientLimit?: number; name?: string } = {};

      if (body.clientLimit !== undefined) {
        const n = Number(body.clientLimit);
        if (!Number.isInteger(n) || n < 1 || n > MAX_CLIENT_LIMIT) {
          return fail(
            `Client limit must be a whole number from 1 to ${MAX_CLIENT_LIMIT}.`,
            400
          );
        }
        data.clientLimit = n;
      }

      if (typeof body.firmName === "string" && body.firmName.trim()) {
        data.name = body.firmName.trim().slice(0, 120);
      }

      if (Object.keys(data).length === 0) {
        return fail("Nothing to update.", 400);
      }

      await prisma.$transaction(async (tx) => {
        await tx.advisorFirm.update({ where: { id: firm.id }, data });

        await tx.adminAuditLog.create({
          data: {
            adminId: auth.admin.id,
            targetUserId: firm.owner.id,
            action: "ADVISOR_FIRM_UPDATED",
            metadata: {
              firmId: firm.id,
              previousClientLimit: firm.clientLimit,
              clientLimit: data.clientLimit ?? firm.clientLimit,
              previousName: firm.name,
              name: data.name ?? firm.name,
            },
          },
        });
      });

      return NextResponse.json({ success: true, message: "Firm updated." });
    }

    return fail("Unknown action.", 400);
  } catch (error) {
    console.error("[ADMIN_ADVISORS_PATCH]", error);
    return fail("We could not save this change.", 500);
  }
}

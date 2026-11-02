import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { sendStartupPlanEmail } from "@/lib/company-billing-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HOLDER_LIMIT = 10_000;

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * PATCH /api/admin/companies/[workspaceId]
 *   { action: "REVOKE", sendEmail?: boolean }
 *   { action: "UPDATE", holderLimit?: number, companyName?: string }
 *
 * Revoke = lock out immediately (end date set to now). Data is kept, so
 * granting or renewing later restores everything.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) return auth.response;

    const { workspaceId } = await context.params;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid request.", 400);
    }

    const workspace = await prisma.companyWorkspace.findUnique({
      where: { id: workspaceId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    if (!workspace) return fail("Company workspace not found.", 404);

    const isOwnerWorkspace =
      !!process.env.FOUNDER_EMAIL &&
      workspace.owner.email === process.env.FOUNDER_EMAIL;

    if (isOwnerWorkspace) {
      return fail("Your own test workspace cannot be changed here.", 400);
    }

    if (body.action === "REVOKE") {
      const now = new Date();

      const updated = await prisma.$transaction(async (tx) => {
        const saved = await tx.companyWorkspace.update({
          where: { id: workspace.id },
          data: { status: "EXPIRED", expiresAt: now },
        });

        await tx.adminAuditLog.create({
          data: {
            adminId: auth.admin.id,
            targetUserId: workspace.owner.id,
            action: "COMPANY_WORKSPACE_REVOKED",
            metadata: {
              workspaceId: workspace.id,
              previousExpiresAt: workspace.expiresAt,
            },
          },
        });

        return saved;
      });

      let emailSent = false;
      if (body.sendEmail === true) {
        emailSent = await sendStartupPlanEmail({
          to: workspace.owner.email,
          kind: "REVOKED",
          ownerName: workspace.owner.name,
          companyName: updated.name,
          expiresAt: updated.expiresAt,
          holderLimit: updated.holderLimit,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Access revoked.",
        emailSent,
      });
    }

    if (body.action === "UPDATE") {
      const data: { holderLimit?: number; name?: string } = {};

      if (body.holderLimit !== undefined) {
        const n = Number(body.holderLimit);
        if (!Number.isInteger(n) || n < 1 || n > MAX_HOLDER_LIMIT) {
          return fail(
            `Option-holder limit must be a whole number from 1 to ${MAX_HOLDER_LIMIT}.`,
            400
          );
        }
        data.holderLimit = n;
      }

      if (typeof body.companyName === "string" && body.companyName.trim()) {
        data.name = body.companyName.trim().slice(0, 120);
      }

      if (Object.keys(data).length === 0) {
        return fail("Nothing to update.", 400);
      }

      await prisma.$transaction(async (tx) => {
        await tx.companyWorkspace.update({ where: { id: workspace.id }, data });

        await tx.adminAuditLog.create({
          data: {
            adminId: auth.admin.id,
            targetUserId: workspace.owner.id,
            action: "COMPANY_WORKSPACE_UPDATED",
            metadata: {
              workspaceId: workspace.id,
              previousHolderLimit: workspace.holderLimit,
              holderLimit: data.holderLimit ?? workspace.holderLimit,
              previousName: workspace.name,
              name: data.name ?? workspace.name,
            },
          },
        });
      });

      return NextResponse.json({ success: true, message: "Company updated." });
    }

    return fail("Unknown action.", 400);
  } catch (error) {
    console.error("[ADMIN_COMPANIES_PATCH]", error);
    return fail("We could not save this change.", 500);
  }
}

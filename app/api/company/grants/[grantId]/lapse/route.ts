import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse } from "@/lib/company-http";
import { logCompanyChange } from "@/lib/change-log";

type Ctx = { params: Promise<{ grantId: string }> };

/**
 * POST /api/company/grants/[grantId]/lapse
 * Everything not exercised lapses (for example the leaver's window ended,
 * or the grant was cancelled). Lapsed options return to the pool.
 */
export async function POST(_request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const { grantId } = await params;

    const grant = await prisma.optionGrant.findFirst({
      where: { id: grantId, workspaceId: workspace.id },
    });
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);
    if (grant.status === "DRAFT") return badRequest("Delete a draft instead of lapsing it.", "BAD_STATUS", 409);
    if (grant.status === "LAPSED") return badRequest("This grant has already lapsed.", "BAD_STATUS", 409);

    const updated = await prisma.optionGrant.update({
      where: { id: grant.id },
      data: {
        status: "LAPSED",
        optionsLapsed: Math.max(0, grant.options - grant.optionsExercised),
      },
    });

    await logCompanyChange({ user, workspace }, {
      action: "grant.lapsed",
      entityType: "grant",
      entityId: updated.id,
      summary: `Lapsed the remaining ${updated.optionsLapsed.toLocaleString(workspace.jurisdiction === "US" ? "en-US" : "en-IN")} options of ${updated.employeeName}; they return to the pool.`,
      details: { optionsLapsed: updated.optionsLapsed, statusBefore: grant.status },
    });
    return NextResponse.json({ success: true, grant: updated });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

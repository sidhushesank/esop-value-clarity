import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { grantLeftSchema } from "@/lib/company/schemas";
import { vestedOn } from "@/lib/company/grants";
import { termsOf } from "@/lib/company/grants-data";
import { logCompanyChange } from "@/lib/change-log";

type Ctx = { params: Promise<{ grantId: string }> };

/**
 * POST /api/company/grants/[grantId]/left  { leftOn }
 * Employee leaves: unvested options lapse back to the pool. Vested options
 * stay exercisable until the post-exit window ends.
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace();
    const { grantId } = await params;

    const body = await request.json().catch(() => null);
    const parsed = grantLeftSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const { leftOn } = parsed.data;

    const grant = await prisma.optionGrant.findFirst({
      where: { id: grantId, workspaceId: workspace.id },
    });
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);
    if (grant.status !== "ISSUED" && grant.status !== "ACCEPTED") {
      return badRequest("Only an issued or accepted grant can be marked as left.", "BAD_STATUS", 409);
    }
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);
    if (leftOn.getTime() > endOfToday.getTime()) {
      return badRequest("The leaving date cannot be in the future. Record it on or after the day they leave.");
    }
    if (leftOn.getTime() < grant.grantDate.getTime()) {
      return badRequest("The leaving date cannot be before the grant date.");
    }

    const vested = vestedOn(termsOf(grant), leftOn);
    const unvested = Math.max(0, grant.options - vested);

    const updated = await prisma.optionGrant.update({
      where: { id: grant.id },
      data: { status: "LEFT", leftOn, optionsLapsed: unvested },
    });

    await logCompanyChange({ user, workspace }, {
      action: "grant.left",
      entityType: "grant",
      entityId: updated.id,
      summary: `Marked ${updated.employeeName} as left on ${leftOn.toISOString().slice(0, 10)}: ${vested.toLocaleString(workspace.jurisdiction === "US" ? "en-US" : "en-IN")} vested, ${unvested.toLocaleString(workspace.jurisdiction === "US" ? "en-US" : "en-IN")} unvested options lapsed.`,
      details: { leftOn, vested, lapsed: unvested },
    });
    return NextResponse.json({ success: true, grant: updated, vestedAtLeaving: vested, lapsed: unvested });
  } catch (error) {
    return companyErrorResponse(error);
  }
}
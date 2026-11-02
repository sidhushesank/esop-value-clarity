import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  assertCanAddOptionHolder,
  holderKeyFor,
  requireCompanyWorkspace,
} from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { optionGrantSchema } from "@/lib/company/schemas";
import { listGrants, termsOf, warningsFor } from "@/lib/company/grants-data";

export const dynamic = "force-dynamic";

/** GET /api/company/grants: every grant with today's vesting position. */
export async function GET() {
  try {
    const { workspace } = await requireCompanyWorkspace();
    return NextResponse.json({ success: true, grants: await listGrants(workspace.id) });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/**
 * POST /api/company/grants: create a grant as a DRAFT.
 * Returns the rule warnings so the founder sees them before issuing.
 */
export async function POST(request: Request) {
  try {
    const { workspace, holderLimit, isEvcOwner } = await requireCompanyWorkspace();

    const body = await request.json().catch(() => null);
    const parsed = optionGrantSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const input = parsed.data;

    const scheme = await prisma.esopScheme.findFirst({
      where: { id: input.schemeId, workspaceId: workspace.id, archivedAt: null },
    });
    if (!scheme) return badRequest("Choose a valid ESOP scheme.", "NOT_FOUND", 404);

    const holderKey = holderKeyFor({
      employeeEmail: input.employeeEmail ?? null,
      employeeName: input.employeeName,
    });

    await assertCanAddOptionHolder(workspace.id, holderKey, holderLimit, isEvcOwner);

    const grant = await prisma.optionGrant.create({
      data: {
        workspaceId: workspace.id,
        schemeId: scheme.id,
        employeeName: input.employeeName,
        employeeEmail: input.employeeEmail ?? null,
        employeeRef: input.employeeRef,
        holderKey,
        isPromoterOver10Pct: input.isPromoterOver10Pct,
        grantDate: input.grantDate,
        options: input.options,
        exercisePrice: input.exercisePrice,
        vestingStart: input.vestingStart,
        vestingMonths: input.vestingMonths,
        cliffMonths: input.cliffMonths,
        expiryDate: input.expiryDate ?? null,
        postExitDays: input.postExitDays,
        note: input.note,
        status: "DRAFT",
      },
    });

    const warnings = await warningsFor(
      termsOf(grant),
      scheme,
      workspace,
      grant.isPromoterOver10Pct,
      grant.id
    );

    return NextResponse.json({ success: true, grant, warnings }, { status: 201 });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

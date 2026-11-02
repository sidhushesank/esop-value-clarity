import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse } from "@/lib/company-http";
import { termsOf, warningsFor } from "@/lib/company/grants-data";

type Ctx = { params: Promise<{ grantId: string }> };

/**
 * POST /api/company/grants/[grantId]/issue
 * Marks a draft as issued. Refused only if the pool is not big enough;
 * other rule warnings are shown but do not block.
 */
export async function POST(_request: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { grantId } = await params;

    const grant = await prisma.optionGrant.findFirst({
      where: { id: grantId, workspaceId: workspace.id },
      include: { scheme: true },
    });
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);
    if (grant.status !== "DRAFT") return badRequest("This grant is already issued.", "NOT_DRAFT", 409);

    const warnings = await warningsFor(
      termsOf(grant),
      grant.scheme,
      workspace,
      grant.isPromoterOver10Pct,
      grant.id
    );
    const block = warnings.find((w) => w.severity === "BLOCK");
    if (block) return badRequest(block.message, block.code, 409);

    const updated = await prisma.optionGrant.update({
      where: { id: grant.id },
      data: { status: "ISSUED", issuedAt: new Date() },
    });

    return NextResponse.json({ success: true, grant: updated, warnings });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

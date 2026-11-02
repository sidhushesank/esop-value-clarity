import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse, validationError } from "@/lib/company-http";
import { companyDetailsSchema } from "@/lib/company/schemas";

export const dynamic = "force-dynamic";

/** GET /api/company/workspace: the signed-in company's workspace and plan state. */
export async function GET() {
  try {
    const { workspace, isEvcOwner, holderLimit } = await requireCompanyWorkspace();

    const holders = await prisma.optionGrant.findMany({
      where: {
        workspaceId: workspace.id,
        status: { in: ["DRAFT", "ISSUED", "ACCEPTED", "LEFT", "EXERCISED"] },
      },
      distinct: ["holderKey"],
      select: { holderKey: true },
    });

    return NextResponse.json({
      success: true,
      workspace,
      isEvcOwner,
      holderLimit: isEvcOwner ? null : holderLimit,
      optionHolders: holders.length,
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** PATCH /api/company/workspace: edit company details (name, CIN, type, dates). */
export async function PATCH(request: Request) {
  try {
    const { workspace } = await requireCompanyWorkspace();

    const body = await request.json().catch(() => null);
    const parsed = companyDetailsSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const updated = await prisma.companyWorkspace.update({
      where: { id: workspace.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        cin: true,
        companyType: true,
        incorporationDate: true,
        dpiitRecognised: true,
        currentFmvPerShare: true,
        fmvValuationDate: true,
        fmvValuerName: true,
      },
    });

    return NextResponse.json({ success: true, workspace: updated });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

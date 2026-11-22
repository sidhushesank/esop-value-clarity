import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { companyDetailsSchema } from "@/lib/company/schemas";
import { logCompanyChange } from "@/lib/change-log";

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
      jurisdictionLocked: await hasEquityRecords(workspace.id),
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/**
 * The country decides the currency, the rules and the wording. Changing it
 * after amounts have been entered would silently turn rupees into dollars,
 * so it can only change while the cap table and grants are still empty.
 */
async function hasEquityRecords(workspaceId: string): Promise<boolean> {
  const [classes, movements, grants, schemes] = await Promise.all([
    prisma.securityClass.count({ where: { workspaceId } }),
    prisma.shareMovement.count({ where: { workspaceId } }),
    prisma.optionGrant.count({ where: { workspaceId } }),
    prisma.esopScheme.count({ where: { workspaceId } }),
  ]);
  return classes + movements + grants + schemes > 0;
}

/** PATCH /api/company/workspace: edit company details (country, name, IDs, dates, FMV). */
export async function PATCH(request: Request) {
  try {
    const { workspace, user } = await requireCompanyWorkspace();

    const body = await request.json().catch(() => null);
    const parsed = companyDetailsSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const data = { ...parsed.data };

    if (data.jurisdiction && data.jurisdiction !== workspace.jurisdiction) {
      if (await hasEquityRecords(workspace.id)) {
        return badRequest(
          "The country can't be changed after share classes, movements, a plan or grants have been added, because every amount is stored in that country's currency. Contact support if it was set wrongly.",
          "JURISDICTION_LOCKED",
          409
        );
      }
    }

    const target = data.jurisdiction ?? workspace.jurisdiction;
    if (target === "US") {
      // India-only fields have no meaning for a US company.
      data.dpiitRecognised = null;
    } else {
      data.usStateOfIncorporation = null;
    }

    const updated = await prisma.companyWorkspace.update({
      where: { id: workspace.id },
      data,
      select: {
        id: true,
        name: true,
        cin: true,
        companyType: true,
        incorporationDate: true,
        dpiitRecognised: true,
        jurisdiction: true,
        usStateOfIncorporation: true,
        currentFmvPerShare: true,
        fmvValuationDate: true,
        fmvValuerName: true,
      },
    });

    await logCompanyChange({ user, workspace }, {
      action: "company.details_updated",
      entityType: "company",
      entityId: workspace.id,
      summary:
        data.jurisdiction && data.jurisdiction !== workspace.jurisdiction
          ? `Set the company country to ${data.jurisdiction === "US" ? "United States" : "India"} and updated company details.`
          : "Updated company details.",
      details: {
        name: updated.name,
        country: updated.jurisdiction,
        valuePerShare: updated.currentFmvPerShare,
        valuationDate: updated.fmvValuationDate,
        previousValuePerShare: workspace.currentFmvPerShare,
      },
    });
    return NextResponse.json({ success: true, workspace: updated });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

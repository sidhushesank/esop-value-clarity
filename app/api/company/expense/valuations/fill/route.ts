import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse } from "@/lib/company-http";
import { logCompanyChange } from "@/lib/change-log";

/** POST: use the company's current value per share for every grant that has no grant-date value yet. */
export async function POST() {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const fmv = workspace.currentFmvPerShare;
    if (!fmv) return badRequest("Add the company's value per share on the Company details tab first.", "NO_FMV");
    const grants = await prisma.optionGrant.findMany({
      where: { workspaceId: workspace.id, status: { not: "DRAFT" } },
      select: { id: true, valuation: { select: { fmvPerShare: true } } },
    });
    const blank = grants.filter((g) => g.valuation?.fmvPerShare == null);
    for (const g of blank) {
      await prisma.grantValuation.upsert({
        where: { grantId: g.id },
        update: { fmvPerShare: fmv },
        create: { grantId: g.id, workspaceId: workspace.id, fmvPerShare: fmv },
      });
    }
    if (blank.length) {
      await logCompanyChange({ user, workspace }, {
        action: "expense.valuation",
        entityType: "expense",
        summary: `Filled the grant-date value per share for ${blank.length} grant(s) with the company's current value (${fmv}).`,
        details: { grants: blank.length, fmvPerShare: fmv },
      });
    }
    return NextResponse.json({ success: true, filled: blank.length });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

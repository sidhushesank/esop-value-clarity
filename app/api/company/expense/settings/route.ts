import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse, validationError } from "@/lib/company-http";
import { logCompanyChange } from "@/lib/change-log";
import { expenseSettingsSchema } from "@/lib/company/expense-schemas";

const LABEL: Record<string, string> = {
  IND_AS_102: "Ind AS 102",
  ICAI_GUIDANCE_NOTE: "ICAI Guidance Note",
  ASC_718: "ASC 718",
  GRADED: "graded",
  STRAIGHT_LINE: "straight-line",
  FAIR_VALUE: "fair value",
  INTRINSIC: "intrinsic value",
};
const pct = (v: number | null) => (v === null ? "not set" : `${Math.round(v * 10000) / 100}%`);

/** PUT: save the company's expense policy and default assumptions. */
export async function PUT(request: Request) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const parsed = expenseSettingsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const d = parsed.data;
    // Keep the policy consistent with the standard.
    const data = {
      ...d,
      attribution: d.standard === "ASC_718" ? d.attribution : ("GRADED" as const),
      valuationBasis: d.standard === "ICAI_GUIDANCE_NOTE" ? d.valuationBasis : ("FAIR_VALUE" as const),
      confirmedAt: new Date(),
    };
    await prisma.expenseSettings.upsert({
      where: { workspaceId: workspace.id },
      update: data,
      create: { workspaceId: workspace.id, ...data },
    });
    await logCompanyChange({ user, workspace }, {
      action: "expense.settings",
      entityType: "expense",
      summary: `Set the ESOP expense policy: ${LABEL[data.standard]}, ${LABEL[data.attribution]}, ${LABEL[data.valuationBasis]}; volatility ${pct(data.volatility)}, risk-free ${pct(
        data.riskFreeRate
      )}, dividend ${pct(data.dividendYield)}, leaving rate ${pct(data.forfeitureRate)}, year ends month ${data.fyEndMonth}.`,
      details: data,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

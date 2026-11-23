import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { logCompanyChange } from "@/lib/change-log";
import { grantValuationSchema } from "@/lib/company/expense-schemas";

type Ctx = { params: Promise<{ grantId: string }> };

const KEYS = ["fmvPerShare", "volatility", "riskFreeRate", "dividendYield", "expectedTermYears", "fairValueOverride", "note"] as const;
const LABEL: Record<string, string> = {
  fmvPerShare: "value per share",
  volatility: "volatility",
  riskFreeRate: "risk-free rate",
  dividendYield: "dividend yield",
  expectedTermYears: "expected term",
  fairValueOverride: "valuer's value per option",
  note: "note",
};

/** PUT: grant-date valuation inputs for one grant (blank = company default). */
export async function PUT(request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const { grantId } = await params;
    const parsed = grantValuationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const grant = await prisma.optionGrant.findFirst({ where: { id: grantId, workspaceId: workspace.id }, include: { valuation: true } });
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);

    const data: Record<string, number | string | null> = {};
    for (const k of KEYS) if (parsed.data[k] !== undefined) data[k] = parsed.data[k] ?? null;
    const saved = await prisma.grantValuation.upsert({
      where: { grantId: grant.id },
      update: data,
      create: { grantId: grant.id, workspaceId: workspace.id, ...data },
    });
    const before = (grant.valuation ?? {}) as Record<string, unknown>;
    const changed = KEYS.filter((k) => (before[k] ?? null) !== ((saved as Record<string, unknown>)[k] ?? null));
    if (changed.length) {
      await logCompanyChange({ user, workspace }, {
        action: "expense.valuation",
        entityType: "expense",
        entityId: grant.id,
        summary: `Valuation inputs for ${grant.employeeName}'s grant of ${grant.grantDate.toISOString().slice(0, 10)}: ${changed
          .map((k) => `${LABEL[k]} ${(saved as Record<string, unknown>)[k] ?? "default"}`)
          .join(", ")}.`,
        details: Object.fromEntries(changed.map((k) => [k, { from: before[k] ?? null, to: (saved as Record<string, unknown>)[k] ?? null }])),
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

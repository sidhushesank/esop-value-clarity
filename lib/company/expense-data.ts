import type { CompanyWorkspace, ExpenseSettings } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildExpenseReport, fyEndYearOf, type ExpensePolicy, type GrantForExpense } from "@/lib/company/expense";

export function defaultPolicy(jurisdiction: "IN" | "US"): ExpensePolicy {
  return {
    standard: jurisdiction === "US" ? "ASC_718" : "ICAI_GUIDANCE_NOTE",
    attribution: "GRADED",
    valuationBasis: "FAIR_VALUE",
    volatility: null,
    riskFreeRate: null,
    dividendYield: 0,
    forfeitureRate: 0,
    contractualYears: 10,
    fyEndMonth: jurisdiction === "US" ? 12 : 3,
  };
}

export function policyOf(s: ExpenseSettings | null, jurisdiction: "IN" | "US"): ExpensePolicy {
  if (!s) return defaultPolicy(jurisdiction);
  return {
    standard: s.standard,
    attribution: s.attribution,
    valuationBasis: s.valuationBasis,
    volatility: s.volatility,
    riskFreeRate: s.riskFreeRate,
    dividendYield: s.dividendYield,
    forfeitureRate: s.forfeitureRate,
    contractualYears: s.contractualYears,
    fyEndMonth: s.fyEndMonth,
  };
}

export async function loadGrantsForExpense(workspaceId: string): Promise<GrantForExpense[]> {
  const rows = await prisma.optionGrant.findMany({
    where: { workspaceId, status: { in: ["ISSUED", "ACCEPTED", "LEFT", "LAPSED", "EXERCISED"] } },
    orderBy: [{ grantDate: "asc" }, { createdAt: "asc" }],
    include: {
      scheme: { select: { name: true } },
      exercises: { select: { exerciseDate: true, options: true } },
      valuation: true,
    },
  });
  return rows.map((g) => ({
    id: g.id,
    employeeName: g.employeeName,
    schemeName: g.scheme.name,
    status: g.status as GrantForExpense["status"],
    grantDate: g.grantDate,
    options: g.options,
    exercisePrice: g.exercisePrice,
    vestingStart: g.vestingStart,
    vestingMonths: g.vestingMonths,
    cliffMonths: g.cliffMonths,
    expiryDate: g.expiryDate,
    leftOn: g.leftOn,
    lapsedOn: g.lapsedOn,
    updatedAt: g.updatedAt,
    optionsLapsed: g.optionsLapsed,
    optionsExercised: g.optionsExercised,
    exercises: g.exercises.map((e) => ({ date: e.exerciseDate, options: e.options })),
    valuation: g.valuation
      ? {
          fmvPerShare: g.valuation.fmvPerShare,
          volatility: g.valuation.volatility,
          riskFreeRate: g.valuation.riskFreeRate,
          dividendYield: g.valuation.dividendYield,
          expectedTermYears: g.valuation.expectedTermYears,
          fairValueOverride: g.valuation.fairValueOverride,
        }
      : null,
  }));
}

/** Everything the Expense tab and the downloads need for one financial year. */
export async function loadExpense(workspace: Pick<CompanyWorkspace, "id" | "jurisdiction" | "currentFmvPerShare" | "fmvValuationDate">, fyParam: string | null) {
  const j: "IN" | "US" = workspace.jurisdiction === "US" ? "US" : "IN";
  const [settings, grants] = await Promise.all([
    prisma.expenseSettings.findUnique({ where: { workspaceId: workspace.id } }),
    loadGrantsForExpense(workspace.id),
  ]);
  const policy = policyOf(settings, j);
  const today = new Date();
  const currentFy = fyEndYearOf(today, policy.fyEndMonth);
  const firstFy = grants.length ? fyEndYearOf(grants[0].grantDate, policy.fyEndMonth) : currentFy;
  const years: number[] = [];
  for (let y = Math.min(firstFy, currentFy); y <= currentFy + 1; y++) years.push(y);
  const asked = Number(fyParam);
  // Default: the last completed year if there is one with grants, else the current year.
  const fy = Number.isInteger(asked) && years.includes(asked) ? asked : firstFy < currentFy ? currentFy - 1 : currentFy;
  const report = buildExpenseReport(grants, policy, fy, today);
  return {
    jurisdiction: j,
    confirmed: Boolean(settings?.confirmedAt),
    settings: policy,
    years,
    fy,
    report,
    companyFmv: workspace.currentFmvPerShare
      ? { value: workspace.currentFmvPerShare, date: workspace.fmvValuationDate ? workspace.fmvValuationDate.toISOString().slice(0, 10) : null }
      : null,
  };
}

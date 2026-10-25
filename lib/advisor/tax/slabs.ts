/**
 * Income-tax slab calculator for an individual (resident, below 60).
 *
 * Figures: FY 2026-27 (secondary sources say the FY 2025-26 new-regime slabs
 * are unchanged). Rule code: TAX_SLABS. This is an ESTIMATE helper:
 * surcharge marginal relief, special-rate income and age-based old-regime
 * exemptions are not modelled.
 */

import { CESS_RATE } from "./rules";

export type Regime = "NEW" | "OLD";

type Band = { upTo: number; rate: number };

const NEW_BANDS: Band[] = [
  { upTo: 400_000, rate: 0 },
  { upTo: 800_000, rate: 0.05 },
  { upTo: 1_200_000, rate: 0.1 },
  { upTo: 1_600_000, rate: 0.15 },
  { upTo: 2_000_000, rate: 0.2 },
  { upTo: 2_400_000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

const OLD_BANDS: Band[] = [
  { upTo: 250_000, rate: 0 },
  { upTo: 500_000, rate: 0.05 },
  { upTo: 1_000_000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 },
];

/** Slab tables are held for this financial year only (year it ends). */
export const SLAB_TABLE_FY_END = 2027;

function slabTax(income: number, bands: Band[]): number {
  let tax = 0;
  let lower = 0;

  for (const b of bands) {
    if (income <= lower) break;
    const slice = Math.min(income, b.upTo) - lower;
    tax += slice * b.rate;
    lower = b.upTo;
  }

  return tax;
}

function surchargeRate(income: number, regime: Regime): number {
  if (income > 50_000_000) return regime === "NEW" ? 0.25 : 0.37;
  if (income > 20_000_000) return 0.25;
  if (income > 10_000_000) return 0.15;
  if (income > 5_000_000) return 0.1;
  return 0;
}

export type TaxBreakdown = {
  income: number;
  regime: Regime;
  slabTax: number;
  rebate: number;
  taxAfterRebate: number;
  surchargeRate: number;
  surcharge: number;
  cess: number;
  total: number;
};

/** Total tax on `taxableIncome` (already net of deductions). */
export function computeIncomeTax(
  taxableIncome: number,
  regime: Regime
): TaxBreakdown {
  const income = Math.max(0, taxableIncome);
  const bands = regime === "NEW" ? NEW_BANDS : OLD_BANDS;
  const gross = slabTax(income, bands);

  let rebate = 0;

  if (regime === "NEW") {
    if (income <= 1_200_000) {
      rebate = Math.min(gross, 60_000);
    } else if (gross > income - 1_200_000) {
      // marginal relief just above the rebate limit
      rebate = gross - (income - 1_200_000);
    }
  } else if (income <= 500_000) {
    rebate = Math.min(gross, 12_500);
  }

  const taxAfterRebate = gross - rebate;
  const sRate = surchargeRate(income, regime);
  const surcharge = taxAfterRebate * sRate;
  const cess = (taxAfterRebate + surcharge) * CESS_RATE;

  return {
    income,
    regime,
    slabTax: gross,
    rebate,
    taxAfterRebate,
    surchargeRate: sRate,
    surcharge,
    cess,
    total: taxAfterRebate + surcharge + cess,
  };
}

export function roundTds(amount: number, step: number): number {
  return Math.round(amount / step) * step;
}
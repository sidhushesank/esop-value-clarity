/**
 * ============================================================================
 * EMPLOYEE GRANT PAGE: VALUE AND TAX ILLUSTRATIONS (pure, runs in the browser)
 * ============================================================================
 *
 * Everything here is an ILLUSTRATION the employee can change, not a forecast.
 *
 * Assumptions (shown on the page):
 * - Options are exercised at today's value per share (FMV), so the
 *   perquisite taxed as salary = (FMV - exercise price) x options.
 * - The perquisite tax is the extra slab tax on top of the employee's own
 *   annual taxable income (from the shared slab calculator).
 * - Shares are later sold at the scenario price after being held long
 *   enough for long-term treatment (unlisted: over 24 months), so the gain
 *   above FMV is taxed at 12.5% plus 4% cess.
 * - If the scenario price is at or below the exercise price, the options
 *   are not worth exercising and the take-home is zero.
 * ============================================================================
 */

import { computeIncomeTax, type Regime } from "@/lib/advisor/tax/slabs";

export const LTCG_RATE_UNLISTED = 0.125;
export const CESS = 0.04;

export type ScenarioInput = {
  label: string;
  /** Value-per-share multiple on today's FMV, before dilution. */
  multiple: number;
};

export type MathsInput = {
  options: number;
  exercisePrice: number;
  fmvPerShare: number;
  annualIncome: number;
  regime: Regime;
  /** 0-90 (%): ownership lost to future fundraising before an exit. */
  dilutionPct: number;
  scenarios: ScenarioInput[];
};

export type ExerciseTax = {
  perquisitePerShare: number;
  perquisite: number;
  tax: number;
  effectiveRate: number;
};

export type ScenarioResult = {
  label: string;
  multiple: number;
  pricePerShare: number;
  grossValue: number;
  exerciseCost: number;
  exerciseTax: number;
  saleTax: number;
  takeHome: number;
  underwater: boolean;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : 0));
}

export function exerciseTax(
  options: number,
  exercisePrice: number,
  fmvPerShare: number,
  annualIncome: number,
  regime: Regime
): ExerciseTax {
  const perShare = Math.max(0, fmvPerShare - exercisePrice);
  const perquisite = perShare * Math.max(0, options);
  const base = Math.max(0, annualIncome);

  const tax =
    perquisite > 0
      ? computeIncomeTax(base + perquisite, regime).total -
        computeIncomeTax(base, regime).total
      : 0;

  return {
    perquisitePerShare: perShare,
    perquisite,
    tax: Math.max(0, Math.round(tax)),
    effectiveRate: perquisite > 0 ? tax / perquisite : 0,
  };
}

export function runScenarios(input: MathsInput): {
  today: { value: number; exerciseCost: number; exerciseTax: ExerciseTax };
  scenarios: ScenarioResult[];
} {
  const n = Math.max(0, Math.floor(input.options));
  const x = Math.max(0, input.exercisePrice);
  const fmv = Math.max(0, input.fmvPerShare);
  const dilution = clamp(input.dilutionPct, 0, 90) / 100;

  const exTax = exerciseTax(n, x, fmv, input.annualIncome, input.regime);
  const exerciseCost = n * x;

  const scenarios = input.scenarios.map((s) => {
    const multiple = clamp(s.multiple, 0, 1000);
    const price = fmv * multiple * (1 - dilution);
    const gross = n * price;

    if (price <= x || n === 0) {
      return {
        label: s.label,
        multiple,
        pricePerShare: price,
        grossValue: gross,
        exerciseCost,
        exerciseTax: 0,
        saleTax: 0,
        takeHome: 0,
        underwater: true,
      };
    }

    const saleGain = Math.max(0, price - fmv) * n;
    const saleTax = Math.round(saleGain * LTCG_RATE_UNLISTED * (1 + CESS));
    const takeHome = Math.max(0, gross - exerciseCost - exTax.tax - saleTax);

    return {
      label: s.label,
      multiple,
      pricePerShare: price,
      grossValue: gross,
      exerciseCost,
      exerciseTax: exTax.tax,
      saleTax,
      takeHome,
      underwater: false,
    };
  });

  return {
    today: { value: n * fmv, exerciseCost, exerciseTax: exTax },
    scenarios,
  };
}

/**
 * ============================================================================
 * ESOP EXPENSE: Ind AS 102 / ICAI Guidance Note / ASC 718 (pure functions)
 * ============================================================================
 *
 * Equity-settled options with service vesting (cliff, then monthly):
 *
 * 1. Value per option at the grant date:
 *    - Fair value: Black-Scholes with dividend yield,
 *        C = S e^(-qT) N(d1) - K e^(-rT) N(d2)
 *    - Intrinsic value (ICAI Guidance Note only): max(0, S - K)
 *    - or a value per option from an outside valuer (override).
 *    Expected term defaults to the "simplified" estimate:
 *      (average time to vest + contractual term) / 2.
 *
 * 2. Attribution over the service period (from the grant date):
 *    - GRADED: each vesting date is its own tranche, expensed over its own
 *      period (Ind AS 102 IG11; ICAI Guidance Note; ASC 718 choice).
 *    - STRAIGHT_LINE (ASC 718 only, service-only awards): the whole award
 *      evenly to the last vesting date, never less than the vested portion.
 *
 * 3. Forfeitures:
 *    - Unvested options of a leaver (or a grant lapsed while employed) are
 *      forfeited on that date: their expense to date is reversed then.
 *    - Optional estimate: an annual leaving rate reduces tranches not yet
 *      vested; the estimate trues up as tranches vest.
 *    - Vested options that lapse unexercised are NOT reversed.
 *
 * All figures are estimates for the company's accountant and auditor.
 * ============================================================================
 */

export type Standard = "IND_AS_102" | "ICAI_GUIDANCE_NOTE" | "ASC_718";
export type Attribution = "GRADED" | "STRAIGHT_LINE";
export type ValuationBasis = "FAIR_VALUE" | "INTRINSIC";

export type ExpensePolicy = {
  standard: Standard;
  attribution: Attribution;
  valuationBasis: ValuationBasis;
  volatility: number | null;
  riskFreeRate: number | null;
  dividendYield: number;
  forfeitureRate: number;
  contractualYears: number;
  fyEndMonth: number; // 1-12
};

export type GrantForExpense = {
  id: string;
  employeeName: string;
  schemeName: string;
  status: "ISSUED" | "ACCEPTED" | "LEFT" | "LAPSED" | "EXERCISED";
  grantDate: Date;
  options: number;
  exercisePrice: number;
  vestingStart: Date;
  vestingMonths: number;
  cliffMonths: number;
  expiryDate: Date | null;
  leftOn: Date | null;
  lapsedOn: Date | null;
  /** Used when a lapsed grant has no lapse date (lapsed before W2b). */
  updatedAt: Date;
  optionsLapsed: number;
  optionsExercised: number;
  exercises: { date: Date; options: number }[];
  valuation: {
    fmvPerShare: number | null;
    volatility: number | null;
    riskFreeRate: number | null;
    dividendYield: number | null;
    expectedTermYears: number | null;
    fairValueOverride: number | null;
  } | null;
};

export type Warning = { level: "BLOCK" | "WARN" | "INFO"; message: string };

const DAY = 86_400_000;
const YEAR = 365.25 * DAY;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

/* ------------------------------------------------------------------ */
/* Dates and vesting                                                   */
/* ------------------------------------------------------------------ */

export function addMonths(d: Date, months: number) {
  const r = utc(d.getUTCFullYear(), d.getUTCMonth() + months, 1);
  const last = utc(r.getUTCFullYear(), r.getUTCMonth() + 1, 0).getUTCDate();
  return utc(r.getUTCFullYear(), r.getUTCMonth(), Math.min(d.getUTCDate(), last));
}

function wholeMonths(from: Date, to: Date) {
  if (to.getTime() < from.getTime()) return 0;
  let m = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) m -= 1;
  return Math.max(0, m);
}

/** Same rule as the Grants tab: nothing before the cliff, then monthly. */
export function vestedOn(g: Pick<GrantForExpense, "options" | "vestingStart" | "vestingMonths" | "cliffMonths">, asOf: Date) {
  if (g.vestingMonths <= 0) return g.options;
  const months = wholeMonths(g.vestingStart, asOf);
  if (months < g.cliffMonths) return 0;
  if (months >= g.vestingMonths) return g.options;
  return Math.floor((g.options * months) / g.vestingMonths);
}

export type Tranche = { date: Date; options: number };

/** One tranche per vesting date (cliff date, then each month). */
export function tranchesOf(g: Pick<GrantForExpense, "options" | "vestingStart" | "vestingMonths" | "cliffMonths">): Tranche[] {
  if (g.vestingMonths <= 0) return [{ date: g.vestingStart, options: g.options }];
  const out: Tranche[] = [];
  let prev = 0;
  for (let m = Math.max(1, g.cliffMonths); m <= g.vestingMonths; m++) {
    const date = addMonths(g.vestingStart, m);
    const v = vestedOn(g, date);
    if (v > prev) out.push({ date, options: v - prev });
    prev = v;
  }
  return out;
}

/** The date unvested options were forfeited: leaving, else a lapse while employed. */
export function forfeitDate(g: GrantForExpense): Date | null {
  if (g.leftOn) return g.leftOn;
  if (g.status === "LAPSED") return g.lapsedOn ?? utc(g.updatedAt.getUTCFullYear(), g.updatedAt.getUTCMonth(), g.updatedAt.getUTCDate());
  return null;
}

/* ------------------------------------------------------------------ */
/* Valuation                                                           */
/* ------------------------------------------------------------------ */

/** Standard normal CDF (Abramowitz & Stegun 26.2.17, error < 7.5e-8). */
export function normCdf(x: number) {
  const k = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly = k * (0.31938153 + k * (-0.356563782 + k * (1.781477937 + k * (-1.821255978 + k * 1.330274429))));
  const tail = (Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)) * poly;
  return x >= 0 ? 1 - tail : tail;
}

/** Black-Scholes call value with continuous dividend yield. */
export function blackScholesCall(S: number, K: number, T: number, r: number, sigma: number, q = 0) {
  if (S <= 0) return 0;
  if (K <= 0) return S * Math.exp(-q * T);
  if (T <= 0 || sigma <= 0) return Math.max(0, S * Math.exp(-q * T) - K * Math.exp(-r * T));
  const sq = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + (sigma * sigma) / 2) * T) / sq;
  const d2 = d1 - sq;
  return S * Math.exp(-q * T) * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2);
}

/** Simplified expected term: (average time to vest + contractual term) / 2, in years from the grant date. */
export function simplifiedTerm(g: GrantForExpense, contractualYearsDefault: number) {
  const tr = tranchesOf(g);
  const total = tr.reduce((a, t) => a + t.options, 0) || 1;
  const avgVest = tr.reduce((a, t) => a + t.options * Math.max(0, (t.date.getTime() - g.grantDate.getTime()) / YEAR), 0) / total;
  const contractual = g.expiryDate ? Math.max(0, (g.expiryDate.getTime() - g.grantDate.getTime()) / YEAR) : contractualYearsDefault;
  return { term: Math.max(avgVest, (avgVest + contractual) / 2), contractual, contractualFromExpiry: Boolean(g.expiryDate) };
}

export type GrantValue = {
  fmvPerShare: number | null;
  volatility: number | null;
  riskFreeRate: number | null;
  dividendYield: number;
  expectedTermYears: number;
  termIsDefault: boolean;
  valuePerOption: number | null;
  source: "OVERRIDE" | "BLACK_SCHOLES" | "INTRINSIC" | "MISSING";
  missing: string[];
};

export function valueGrant(g: GrantForExpense, p: ExpensePolicy): GrantValue {
  const v = g.valuation;
  const S = v?.fmvPerShare ?? null;
  const sigma = v?.volatility ?? p.volatility;
  const r = v?.riskFreeRate ?? p.riskFreeRate;
  const q = v?.dividendYield ?? p.dividendYield ?? 0;
  const simple = simplifiedTerm(g, p.contractualYears);
  const T = v?.expectedTermYears ?? simple.term;
  const base = { fmvPerShare: S, volatility: sigma, riskFreeRate: r, dividendYield: q, expectedTermYears: T, termIsDefault: v?.expectedTermYears == null };

  if (v?.fairValueOverride != null && v.fairValueOverride >= 0) {
    return { ...base, valuePerOption: v.fairValueOverride, source: "OVERRIDE", missing: [] };
  }
  if (p.valuationBasis === "INTRINSIC") {
    if (S == null) return { ...base, valuePerOption: null, source: "MISSING", missing: ["value per share on the grant date"] };
    return { ...base, valuePerOption: Math.max(0, S - g.exercisePrice), source: "INTRINSIC", missing: [] };
  }
  const missing: string[] = [];
  if (S == null) missing.push("value per share on the grant date");
  if (sigma == null) missing.push("volatility");
  if (r == null) missing.push("risk-free rate");
  if (missing.length) return { ...base, valuePerOption: null, source: "MISSING", missing };
  return {
    ...base,
    valuePerOption: blackScholesCall(S as number, g.exercisePrice, T, r as number, sigma as number, q),
    source: "BLACK_SCHOLES",
    missing: [],
  };
}

/* ------------------------------------------------------------------ */
/* Attribution                                                         */
/* ------------------------------------------------------------------ */

/** Share of a tranche still expected to vest at `t` (estimate only; vested = 1). */
function survival(p: ExpensePolicy, grantDate: Date, trancheDate: Date, t: Date) {
  if (t.getTime() >= trancheDate.getTime() || p.forfeitureRate <= 0) return 1;
  const years = Math.max(0, (trancheDate.getTime() - grantDate.getTime()) / YEAR);
  return Math.pow(1 - Math.min(0.99, p.forfeitureRate), years);
}

/** Cumulative expense recognised for a grant by the end of day `t`. */
export function cumulativeExpense(g: GrantForExpense, valuePerOption: number, p: ExpensePolicy, t: Date) {
  const g0 = g.grantDate.getTime();
  if (t.getTime() < g0 || valuePerOption <= 0) return 0;
  const F = forfeitDate(g);
  const live = tranchesOf(g).filter((tr) => !(F && tr.date.getTime() > F.getTime() && t.getTime() >= F.getTime()));
  // Tranches forfeited later than t still count until the forfeit date.
  const frac = (d: Date) => (d.getTime() <= g0 ? 1 : Math.min(1, Math.max(0, (t.getTime() - g0) / (d.getTime() - g0))));

  if (p.attribution === "STRAIGHT_LINE" && p.standard === "ASC_718") {
    const all = tranchesOf(g);
    const last = all.length ? all[all.length - 1].date : g.grantDate;
    const expected = live.reduce((a, tr) => a + tr.options * survival(p, g.grantDate, tr.date, t), 0);
    const straight = valuePerOption * expected * frac(last);
    const vestedFloor = valuePerOption * live.filter((tr) => tr.date.getTime() <= t.getTime()).reduce((a, tr) => a + tr.options, 0);
    return Math.max(straight, vestedFloor);
  }
  return live.reduce((a, tr) => a + valuePerOption * tr.options * survival(p, g.grantDate, tr.date, t) * frac(tr.date), 0);
}

/** Total expense the grant is expected to cost, as known at `t`. */
export function expectedTotal(g: GrantForExpense, valuePerOption: number, p: ExpensePolicy, t: Date) {
  const F = forfeitDate(g);
  return tranchesOf(g)
    .filter((tr) => !(F && tr.date.getTime() > F.getTime() && t.getTime() >= F.getTime()))
    .reduce((a, tr) => a + valuePerOption * tr.options * survival(p, g.grantDate, tr.date, t), 0);
}

/* ------------------------------------------------------------------ */
/* Financial years                                                     */
/* ------------------------------------------------------------------ */

export type Period = { label: string; start: Date; end: Date };

/** The financial year ending in `endYear` (e.g. India FY 2025-26 ends 31 Mar 2026). */
export function financialYear(endYear: number, fyEndMonth: number): Period {
  const end = utc(endYear, fyEndMonth, 0); // last day of fyEndMonth (1-12)
  const start = new Date(addMonths(utc(endYear, fyEndMonth, 1), -12).getTime());
  const label =
    fyEndMonth === 12
      ? `FY ${endYear}`
      : `FY ${start.getUTCFullYear()}-${String(endYear).slice(2)}`;
  return { label, start, end };
}

export function fyEndYearOf(d: Date, fyEndMonth: number) {
  return d.getUTCMonth() + 1 <= fyEndMonth ? d.getUTCFullYear() : d.getUTCFullYear() + 1;
}

export function quartersOf(fy: Period): Period[] {
  return [0, 1, 2, 3].map((i) => {
    const start = addMonths(fy.start, i * 3);
    const end = new Date(addMonths(fy.start, (i + 1) * 3).getTime() - DAY);
    return { label: `Q${i + 1} (to ${iso(end)})`, start, end };
  });
}

const dayBefore = (d: Date) => new Date(d.getTime() - DAY);

/* ------------------------------------------------------------------ */
/* Option movement (for the notes to accounts)                         */
/* ------------------------------------------------------------------ */

type Event = { date: Date | null; count: number };

function lapseEvents(g: GrantForExpense): Event[] {
  const out: Event[] = [];
  let unvestedAtLeaving = 0;
  if (g.leftOn) {
    unvestedAtLeaving = Math.max(0, g.options - vestedOn(g, g.leftOn));
    if (unvestedAtLeaving > 0) out.push({ date: g.leftOn, count: unvestedAtLeaving });
  }
  if (g.status === "LAPSED") {
    const rest = Math.max(0, g.optionsLapsed - unvestedAtLeaving);
    if (rest > 0) out.push({ date: g.lapsedOn ?? utc(g.updatedAt.getUTCFullYear(), g.updatedAt.getUTCMonth(), g.updatedAt.getUTCDate()), count: rest });
  }
  return out;
}

function exerciseEvents(g: GrantForExpense): Event[] {
  const dated = g.exercises.map((e) => ({ date: e.date, count: e.options }));
  const datedTotal = dated.reduce((a, e) => a + e.count, 0);
  const undated = Math.max(0, g.optionsExercised - datedTotal);
  return undated > 0 ? [...dated, { date: null, count: undated }] : dated;
}

const upTo = (events: Event[], t: Date) => events.reduce((a, e) => a + (e.date === null || e.date.getTime() <= t.getTime() ? e.count : 0), 0);
const within = (events: Event[], a: Date, b: Date) =>
  events.reduce((s, e) => s + (e.date !== null && e.date.getTime() >= a.getTime() && e.date.getTime() <= b.getTime() ? e.count : 0), 0);

function outstandingAt(g: GrantForExpense, t: Date) {
  if (g.grantDate.getTime() > t.getTime()) return 0;
  return Math.max(0, g.options - upTo(exerciseEvents(g), t) - upTo(lapseEvents(g), t));
}

function exercisableAt(g: GrantForExpense, t: Date) {
  if (g.grantDate.getTime() > t.getTime()) return 0;
  const lapsedAll = g.status === "LAPSED" && (g.lapsedOn ?? g.updatedAt).getTime() <= t.getTime();
  if (lapsedAll) return 0;
  if (g.expiryDate && g.expiryDate.getTime() < t.getTime()) return 0;
  const asOf = g.leftOn && g.leftOn.getTime() < t.getTime() ? g.leftOn : t;
  return Math.max(0, vestedOn(g, asOf) - upTo(exerciseEvents(g), t));
}

/* ------------------------------------------------------------------ */
/* The report                                                          */
/* ------------------------------------------------------------------ */

export type GrantExpenseRow = {
  id: string;
  employeeName: string;
  schemeName: string;
  status: string;
  grantDate: string;
  options: number;
  exercisePrice: number;
  value: GrantValue;
  totalFairValue: number | null;
  expenseOpening: number | null;
  expenseThisYear: number | null;
  expenseClosing: number | null;
  unrecognised: number | null;
  quarters: (number | null)[];
  forfeitedOn: string | null;
};

export function buildExpenseReport(grants: GrantForExpense[], p: ExpensePolicy, fyEndYear: number, today = new Date()) {
  const fy = financialYear(fyEndYear, p.fyEndMonth);
  const quarters = quartersOf(fy);
  const warnings: Warning[] = [];
  const opening = dayBefore(fy.start);
  const inScope = grants.filter((g) => g.grantDate.getTime() <= fy.end.getTime());

  if (p.attribution === "STRAIGHT_LINE" && p.standard !== "ASC_718") {
    warnings.push({ level: "WARN", message: "Straight-line is only allowed under ASC 718; graded attribution is used for Ind AS 102 and the ICAI Guidance Note." });
  }
  if (p.valuationBasis === "INTRINSIC" && p.standard !== "ICAI_GUIDANCE_NOTE") {
    warnings.push({ level: "WARN", message: "Intrinsic value is only allowed under the ICAI Guidance Note; Ind AS 102 and ASC 718 need fair value." });
  }
  const policy: ExpensePolicy = {
    ...p,
    attribution: p.standard === "ASC_718" ? p.attribution : "GRADED",
    valuationBasis: p.standard === "ICAI_GUIDANCE_NOTE" ? p.valuationBasis : "FAIR_VALUE",
  };

  const rows: GrantExpenseRow[] = inScope.map((g) => {
    const value = valueGrant(g, policy);
    const v = value.valuePerOption;
    if (v === null) {
      warnings.push({ level: "BLOCK", message: `${g.employeeName} (granted ${iso(g.grantDate)}): add the ${value.missing.join(", ")} to value this grant.` });
    }
    if (value.source === "BLACK_SCHOLES" && value.termIsDefault && !g.expiryDate) {
      warnings.push({ level: "INFO", message: `${g.employeeName}: no option expiry on the grant, so a ${policy.contractualYears}-year contractual term was assumed for the expected term.` });
    }
    const F = forfeitDate(g);
    const cum = (t: Date) => (v === null ? null : cumulativeExpense(g, v, policy, t));
    const o = cum(opening);
    const c = cum(fy.end);
    const qs = quarters.map((q) => {
      const a = cum(dayBefore(q.start));
      const b = cum(q.end);
      return a === null || b === null ? null : b - a;
    });
    return {
      id: g.id,
      employeeName: g.employeeName,
      schemeName: g.schemeName,
      status: g.status,
      grantDate: iso(g.grantDate),
      options: g.options,
      exercisePrice: g.exercisePrice,
      value,
      totalFairValue: v === null ? null : v * g.options,
      expenseOpening: o,
      expenseThisYear: o === null || c === null ? null : c - o,
      expenseClosing: c,
      unrecognised: v === null || c === null ? null : Math.max(0, expectedTotal(g, v, policy, fy.end) - c),
      quarters: qs,
      forfeitedOn: F ? iso(F) : null,
    };
  });

  const sum = (xs: (number | null)[]) => xs.reduce<number>((a, x) => a + (x ?? 0), 0);
  const totals = {
    expenseThisYear: sum(rows.map((r) => r.expenseThisYear)),
    expenseOpening: sum(rows.map((r) => r.expenseOpening)),
    expenseClosing: sum(rows.map((r) => r.expenseClosing)),
    unrecognised: sum(rows.map((r) => r.unrecognised)),
    quarters: quarters.map((_, i) => sum(rows.map((r) => r.quarters[i]))),
    incomplete: rows.some((r) => r.value.valuePerOption === null),
  };

  // Expense still to come, by financial year (from the year after this one).
  const future: { label: string; expense: number }[] = [];
  for (let y = fyEndYear + 1; y <= fyEndYear + 6; y++) {
    const f = financialYear(y, policy.fyEndMonth);
    const e = sum(
      inScope.map((g) => {
        const v = valueGrant(g, policy).valuePerOption;
        if (v === null) return null;
        return cumulativeExpense(g, v, policy, f.end) - cumulativeExpense(g, v, policy, dayBefore(f.start));
      })
    );
    if (Math.abs(e) >= 0.5) future.push({ label: f.label, expense: e });
  }

  // Option movement for the year.
  const allGrants = grants;
  const waep = (pairs: [number, number][]) => {
    const n = pairs.reduce((a, [c]) => a + c, 0);
    return n ? pairs.reduce((a, [c, k]) => a + c * k, 0) / n : null;
  };
  const line = (fn: (g: GrantForExpense) => number) => {
    const pairs = allGrants.map((g) => [fn(g), g.exercisePrice] as [number, number]).filter(([c]) => c > 0);
    return { options: pairs.reduce((a, [c]) => a + c, 0), waep: waep(pairs) };
  };
  const movement = {
    opening: line((g) => outstandingAt(g, opening)),
    granted: line((g) => (g.grantDate.getTime() >= fy.start.getTime() && g.grantDate.getTime() <= fy.end.getTime() ? g.options : 0)),
    forfeited: line((g) => within(lapseEvents(g), fy.start, fy.end)),
    exercised: line((g) => within(exerciseEvents(g), fy.start, fy.end)),
    closing: line((g) => outstandingAt(g, fy.end)),
    exercisable: line((g) => exercisableAt(g, fy.end)),
  };
  const undated = allGrants.reduce((a, g) => a + exerciseEvents(g).filter((e) => e.date === null).reduce((s, e) => s + e.count, 0), 0);
  if (undated > 0) {
    warnings.push({
      level: "WARN",
      message: `${undated} exercised options have no exercise date (imported before exercises were recorded); they are treated as exercised before this year. Record them on the Exercises tab for an exact movement table.`,
    });
  }
  if (allGrants.some((g) => g.status === "LAPSED" && !g.lapsedOn && !g.leftOn)) {
    warnings.push({ level: "INFO", message: "Some grants lapsed before lapse dates were recorded; the date of their last change is used as the lapse date." });
  }

  // Weighted remaining contractual life of options outstanding at year end.
  const outstandingWithExpiry = allGrants
    .map((g) => ({ n: outstandingAt(g, fy.end), g }))
    .filter((x) => x.n > 0 && x.g.expiryDate);
  const wrcl = outstandingWithExpiry.length
    ? outstandingWithExpiry.reduce((a, x) => a + x.n * Math.max(0, ((x.g.expiryDate as Date).getTime() - fy.end.getTime()) / YEAR), 0) /
      outstandingWithExpiry.reduce((a, x) => a + x.n, 0)
    : null;

  // Weighted average value per option of grants made this year.
  const grantedThisYear = rows.filter((r) => r.grantDate >= iso(fy.start) && r.grantDate <= iso(fy.end) && r.value.valuePerOption !== null);
  const wavGranted = grantedThisYear.length
    ? grantedThisYear.reduce((a, r) => a + r.options * (r.value.valuePerOption as number), 0) / grantedThisYear.reduce((a, r) => a + r.options, 0)
    : null;

  const journal =
    policy.standard === "ASC_718"
      ? { debit: "Stock-based compensation expense", credit: "Additional paid-in capital", amount: totals.expenseThisYear }
      : { debit: "Employee benefits expense: share-based payment", credit: "Employee stock options outstanding (other equity)", amount: totals.expenseThisYear };

  if (rows.length === 0) warnings.push({ level: "INFO", message: `No issued grants on or before ${iso(fy.end)}.` });
  if (fy.end.getTime() > today.getTime()) {
    warnings.push({ level: "INFO", message: `${fy.label} is not over yet: figures run to ${iso(fy.end)} assuming nobody else leaves.` });
  }

  return {
    period: { label: fy.label, start: iso(fy.start), end: iso(fy.end) },
    quarters: quarters.map((q) => ({ label: q.label, start: iso(q.start), end: iso(q.end) })),
    policy,
    rows,
    totals,
    future,
    movement,
    weightedRemainingLifeYears: wrcl === null ? null : round(wrcl, 2),
    weightedValueGrantedThisYear: wavGranted,
    journal,
    warnings,
  };
}

export type ExpenseReport = ReturnType<typeof buildExpenseReport>;

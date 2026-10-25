/**
 * Tax-Event Ledger engine. Pure: no database, no clock.
 *
 * Input: one employee, the company's uploaded valuation reports, and the
 * employee's events (exercise, sale, leave, buyback). Output: a ledger with
 * a result per event, share lots with carried-forward cost basis, TDS
 * obligations (including the start-up deferral clock) and a deadline list.
 *
 * Every number carries an audit record: the inputs used, the working steps,
 * the rule codes and whether each rule is verified. Everything is an
 * ESTIMATE; unverified rules flag the figure as such.
 */

import {
  addDays,
  addMonths,
  daysBetween,
  earliest,
  fyOf,
  form16Due,
  isoDay,
  quarterlyReturnDue,
  tdsDepositDue,
  utcDate,
} from "./dates";
import {
  DEFERRAL_TDS_DAYS,
  DEFERRAL_WINDOW_YEARS_AFTER_FY_END,
  FMV_MAX_AGE_DAYS,
  LTCG_RATE,
  LTCG_UNLISTED_MONTHS,
  NEW_ACT_START,
  PAS3_DAYS,
  TAX_RULE_SET_VERSION,
  TDS_ROUND_TO,
  CESS_RATE,
  taxRule,
} from "./rules";
import { computeIncomeTax, roundTds, SLAB_TABLE_FY_END, type Regime } from "./slabs";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type TaxEventType = "EXERCISE" | "SALE" | "LEAVE" | "BUYBACK";

export type ValuationInput = {
  id: string;
  valuationDate: Date;
  fmvPerShare: number;
};

export type EmployeeInput = {
  id: string;
  name: string;
  regime: Regime;
  /** Estimated annual taxable income for the year, EXCLUDING the ESOP perquisite. */
  estimatedIncomeExclPerq: number;
  /** Net pay available in the month to deduct TDS from (null = unknown). */
  monthlyNetPay: number | null;
  isPromoter: boolean;
};

export type CompanyInput = {
  /** DPIIT-recognised and IMB-certified start-up using the deferral. */
  deferralEligible: boolean;
  listed: boolean;
};

export type EventInput = {
  id: string;
  type: TaxEventType;
  eventDate: Date;
  shares: number; // ignored for LEAVE
  exercisePrice?: number; // EXERCISE
  /** Overrides valuation lookup only when the advisor has attached a report. */
  valuationId?: string | null; // EXERCISE
  pricePerShare?: number; // SALE and BUYBACK
  lotId?: string | null; // SALE/BUYBACK may target one exercise
};

export type Flag = {
  code: string;
  severity: "RED" | "AMBER" | "INFO";
  message: string;
};

export type Audit = {
  ruleSetVersion: string;
  rules: { code: string; title: string; verified: boolean }[];
  inputs: Record<string, string | number | boolean | null>;
  steps: string[];
};

export type Deadline = {
  code: string;
  label: string;
  dueDate: Date;
  ruleCode: string;
  owner: string;
  eventId: string | null;
  note?: string;
};

export type TdsObligation = {
  lotId: string;
  eventId: string;
  status: "DUE_NOW" | "DEFERRED" | "TRIGGERED";
  amount: number;
  shares: number;
  trigger: "EXERCISE" | "WINDOW_END" | "SALE" | "LEAVE" | null;
  deductOnOrBefore: Date | null;
  depositBy: Date | null;
  shortfall: number | null;
  shortfallOptions: string[];
};

export type EventResult = {
  eventId: string;
  type: TaxEventType;
  eventDate: Date;
  perquisite?: {
    fmvPerShare: number | null;
    valuationId: string | null;
    valuationDate: Date | null;
    valuationAgeDays: number | null;
    perquisitePerShare: number | null;
    perquisite: number | null;
    incrementalTax: number | null;
    averageRate: number | null;
    deferred: boolean;
  };
  capitalGain?: {
    proceeds: number;
    cost: number;
    gain: number;
    longTerm: boolean;
    rateLabel: string;
    estimatedTax: number | null;
  };
  tds: TdsObligation[];
  flags: Flag[];
  audit: Audit;
};

export type Lot = {
  id: string; // = exercise event id
  employeeId: string;
  allotmentDate: Date;
  sharesAllotted: number;
  sharesRemaining: number;
  costBasisPerShare: number | null;
  perquisiteTotal: number | null;
  tdsTotal: number | null;
  deferred: boolean;
  deferralWindowEnd: Date | null;
};

export type Ledger = {
  employeeId: string;
  ruleSetVersion: string;
  results: EventResult[];
  lots: Lot[];
  deadlines: Deadline[];
  totals: {
    perquisite: number;
    tdsDueNow: number;
    tdsDeferred: number;
    tdsTriggered: number;
  };
  estimateNotice: string;
};

export type RuleVerification = Record<string, boolean>;

export const ESTIMATE_NOTICE =
  "All figures are estimates for professional review. They are not tax advice and rest on rules not yet independently verified.";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeAudit(
  codes: string[],
  verification: RuleVerification,
  inputs: Audit["inputs"],
  steps: string[]
): Audit {
  const unique = Array.from(new Set(codes));

  return {
    ruleSetVersion: TAX_RULE_SET_VERSION,
    rules: unique.map((code) => ({
      code,
      title: taxRule(code)?.title ?? code,
      verified: verification[code] === true,
    })),
    inputs,
    steps,
  };
}

export function inr(n: number): string {
  return `Rs.${Math.round(n).toLocaleString("en-IN")}`;
}

function pickValuation(
  valuations: ValuationInput[],
  exerciseDate: Date,
  valuationId?: string | null
): ValuationInput | null {
  if (valuationId) {
    const hit = valuations.find((v) => v.id === valuationId);
    if (hit) return hit;
  }

  let best: ValuationInput | null = null;

  for (const v of valuations) {
    if (v.valuationDate.getTime() > exerciseDate.getTime()) continue;
    if (!best || v.valuationDate.getTime() > best.valuationDate.getTime()) best = v;
  }

  return best;
}

function incrementalTax(
  base: number,
  addition: number,
  regime: Regime
): { tax: number; rate: number } {
  const before = computeIncomeTax(base, regime).total;
  const after = computeIncomeTax(base + addition, regime).total;
  const tax = roundTds(after - before, TDS_ROUND_TO);

  return { tax, rate: addition > 0 ? (after - before) / addition : 0 };
}

/* ------------------------------------------------------------------ */
/* Ledger                                                              */
/* ------------------------------------------------------------------ */

type Ctx = {
  employee: EmployeeInput;
  company: CompanyInput;
  valuations: ValuationInput[];
  verification: RuleVerification;
};

export function buildLedger(
  employee: EmployeeInput,
  company: CompanyInput,
  valuations: ValuationInput[],
  events: EventInput[],
  verification: RuleVerification,
  asOf: Date
): Ledger {
  const ctx: Ctx = { employee, company, valuations, verification };

  const sorted = [...events].sort((a, b) => {
    const t = a.eventDate.getTime() - b.eventDate.getTime();
    if (t !== 0) return t;
    // exercise before sale before leave on the same day
    const rank: Record<TaxEventType, number> = { EXERCISE: 0, SALE: 1, BUYBACK: 2, LEAVE: 3 };
    return rank[a.type] - rank[b.type];
  });

  const lots: Lot[] = [];
  const results: EventResult[] = [];
  const deadlines: Deadline[] = [];

  // Deferred tax that is still open, per lot (amount of tax per remaining share).
  const leaveDates = sorted.filter((e) => e.type === "LEAVE").map((e) => e.eventDate);

  for (const ev of sorted) {
    switch (ev.type) {
      case "EXERCISE":
        results.push(handleExercise(ev, ctx, lots, deadlines, leaveDates, asOf));
        break;
      case "SALE":
      case "BUYBACK":
        results.push(handleDisposal(ev, ctx, lots, deadlines));
        break;
      case "LEAVE":
        results.push(handleLeave(ev, ctx, lots, deadlines));
        break;
    }
  }

  // Window-end obligations for deferred shares still held.
  for (const lot of lots) {
    if (lot.deferred && lot.sharesRemaining > 0 && lot.deferralWindowEnd && lot.tdsTotal) {
      const due = addDays(lot.deferralWindowEnd, DEFERRAL_TDS_DAYS);
      const amount = roundTds(
        (lot.tdsTotal * lot.sharesRemaining) / lot.sharesAllotted,
        TDS_ROUND_TO
      );

      deadlines.push({
        code: "DEFERRAL_WINDOW_END",
        label: `Deferred TDS on ${lot.sharesRemaining} shares falls due if still held (${inr(amount)} estimate)`,
        dueDate: due,
        ruleCode: "TAX_DEFERRAL",
        owner: "Advisory firm",
        eventId: lot.id,
        note: `Window ends ${isoDay(lot.deferralWindowEnd)}; deduct within ${DEFERRAL_TDS_DAYS} days. An earlier sale or exit brings this forward.`,
      });
    }
  }

  deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Totals
  let perquisite = 0;
  let tdsDueNow = 0;
  let tdsDeferred = 0;
  let tdsTriggered = 0;

  // A sale or exit moves tax from "deferred" to "triggered". Count each rupee
  // once: the triggered amount is taken off the deferred amount of its lot.
  const deferredByLot = new Map<string, number>();

  for (const r of results) {
    if (r.perquisite?.perquisite) perquisite += r.perquisite.perquisite;
    for (const t of r.tds) {
      if (t.status === "DUE_NOW") tdsDueNow += t.amount;
      else if (t.status === "DEFERRED") {
        deferredByLot.set(t.lotId, (deferredByLot.get(t.lotId) ?? 0) + t.amount);
      } else {
        tdsTriggered += t.amount;
        deferredByLot.set(t.lotId, (deferredByLot.get(t.lotId) ?? 0) - t.amount);
      }
    }
  }

  for (const v of deferredByLot.values()) {
    if (v > 0) tdsDeferred += v;
  }

  void asOf;

  return {
    employeeId: employee.id,
    ruleSetVersion: TAX_RULE_SET_VERSION,
    results,
    lots,
    deadlines,
    totals: { perquisite, tdsDueNow, tdsDeferred, tdsTriggered },
    estimateNotice: ESTIMATE_NOTICE,
  };
}

/* ------------------------------------------------------------------ */
/* Exercise                                                            */
/* ------------------------------------------------------------------ */

function handleExercise(
  ev: EventInput,
  ctx: Ctx,
  lots: Lot[],
  deadlines: Deadline[],
  leaveDates: Date[],
  asOf: Date
): EventResult {
  const { employee, company, valuations, verification } = ctx;
  const flags: Flag[] = [];
  const steps: string[] = [];
  const codes = ["TAX_PERQ_VALUE", "TAX_FMV_UNLISTED", "TAX_SLABS", "TAX_TDS_SALARY"];

  const exercisePrice = ev.exercisePrice ?? 0;
  const val = pickValuation(valuations, ev.eventDate, ev.valuationId);
  const fy = fyOf(ev.eventDate);

  let fmv: number | null = null;
  let age: number | null = null;

  if (company.listed) {
    flags.push({
      code: "LISTED_NOT_MODELLED",
      severity: "RED",
      message:
        "Listed-company FMV (exchange price on the exercise date) is not computed. Enter the figure through a valuation entry or review manually.",
    });
  }

  if (!val) {
    flags.push({
      code: "NO_VALUATION",
      severity: "RED",
      message:
        "No uploaded valuation report on or before the exercise date. The perquisite cannot be estimated.",
    });
  } else {
    fmv = val.fmvPerShare;
    age = daysBetween(val.valuationDate, ev.eventDate);
    steps.push(
      `FMV ${inr(fmv)} per share from valuation report dated ${isoDay(val.valuationDate)}`
    );

    if (val.valuationDate.getTime() > ev.eventDate.getTime()) {
      flags.push({
        code: "VALUATION_AFTER_EXERCISE",
        severity: "RED",
        message: "The selected valuation is dated after the exercise.",
      });
    } else if (age > FMV_MAX_AGE_DAYS) {
      flags.push({
        code: "FMV_STALE",
        severity: "RED",
        message: `Valuation is ${age} days old at exercise. The FMV must be as on the exercise date or an earlier date not more than ${FMV_MAX_AGE_DAYS} days before. Get a fresh report.`,
      });
    }
  }

  const perqPerShare = fmv === null ? null : Math.max(0, fmv - exercisePrice);
  const perq = perqPerShare === null ? null : perqPerShare * ev.shares;

  if (fmv !== null && fmv < exercisePrice) {
    flags.push({
      code: "FMV_BELOW_EXERCISE_PRICE",
      severity: "AMBER",
      message: "FMV is below the exercise price, so the perquisite is nil.",
    });
  }

  if (perq !== null) {
    steps.push(
      `Perquisite = (${inr(fmv!)} - ${inr(exercisePrice)}) x ${ev.shares} = ${inr(perq)}`
    );
  }

  // Tax on the perquisite
  let tax: number | null = null;
  let rate: number | null = null;

  if (perq !== null && perq > 0) {
    if (fy.endYear !== SLAB_TABLE_FY_END) {
      flags.push({
        code: "SLABS_FY_MISMATCH",
        severity: "AMBER",
        message: `Slab rates in the library are for FY 2026-27; the exercise falls in FY ${fy.label}. The FY 2026-27 table was used.`,
      });
    }

    const inc = incrementalTax(employee.estimatedIncomeExclPerq, perq, employee.regime);
    tax = inc.tax;
    rate = inc.rate;

    steps.push(
      `Tax on ${inr(employee.estimatedIncomeExclPerq)} = ${inr(
        computeIncomeTax(employee.estimatedIncomeExclPerq, employee.regime).total
      )}; with perquisite ${inr(
        computeIncomeTax(employee.estimatedIncomeExclPerq + perq, employee.regime).total
      )} (${employee.regime === "NEW" ? "new" : "old"} regime, incl. surcharge and 4% cess)`
    );
    steps.push(`Estimated TDS on perquisite ${inr(tax)} (average rate ${(rate * 100).toFixed(2)}%)`);
  }

  // Deferral?
  const deferred = company.deferralEligible && perq !== null && perq > 0;
  let windowEnd: Date | null = null;

  if (deferred) {
    codes.push("TAX_DEFERRAL", "TAX_DEFERRAL_WINDOW");
    windowEnd = utcDate(fy.endYear + DEFERRAL_WINDOW_YEARS_AFTER_FY_END, 2, 31);
    steps.push(
      `Start-up deferral: window ends ${isoDay(windowEnd)}; tax at FY ${fy.label} rates`
    );
    flags.push({
      code: "DEFERRAL_ASSUMED",
      severity: "INFO",
      message:
        "Deferral assumes the company holds a valid DPIIT recognition and Inter-Ministerial Board certificate. Confirm both.",
    });
  }

  // TDS obligation
  const tds: TdsObligation[] = [];

  if (tax !== null && tax > 0) {
    if (deferred && windowEnd) {
      const earlierLeave = earliest(
        leaveDates.filter((d) => d.getTime() >= ev.eventDate.getTime())
      );

      tds.push({
        lotId: ev.id,
        eventId: ev.id,
        status: "DEFERRED",
        amount: tax,
        shares: ev.shares,
        trigger: null,
        deductOnOrBefore: addDays(
          earliest([windowEnd, earlierLeave]) as Date,
          DEFERRAL_TDS_DAYS
        ),
        depositBy: null,
        shortfall: null,
        shortfallOptions: [],
      });
    } else {
      const deposit = tdsDepositDue(ev.eventDate);
      let shortfall: number | null = null;
      const options: string[] = [];

      if (employee.monthlyNetPay === null) {
        flags.push({
          code: "SALARY_UNKNOWN",
          severity: "AMBER",
          message:
            "Monthly net pay is not entered, so the funding check could not run. TDS must come out of salary or be recovered from the employee.",
        });
      } else if (tax > employee.monthlyNetPay) {
        shortfall = tax - employee.monthlyNetPay;
        options.push(
          "Recover the shortfall from the employee before the deposit date.",
          `Sell-to-cover: sell about ${
            fmv ? Math.ceil(shortfall / fmv) : "n/a"
          } shares at FMV and remit the proceeds as TDS (check the plan rules and the capital-gains effect).`
        );
        flags.push({
          code: "FUNDING_SHORTFALL",
          severity: "RED",
          message: `TDS of ${inr(tax)} exceeds net pay of ${inr(
            employee.monthlyNetPay
          )}. Shortfall ${inr(shortfall)}.`,
        });
      }

      tds.push({
        lotId: ev.id,
        eventId: ev.id,
        status: "DUE_NOW",
        amount: tax,
        shares: ev.shares,
        trigger: "EXERCISE",
        deductOnOrBefore: ev.eventDate,
        depositBy: deposit,
        shortfall,
        shortfallOptions: options,
      });

      deadlines.push({
        code: "TDS_DEPOSIT",
        label: `Deposit TDS on perquisite (${inr(tax)} estimate)`,
        dueDate: deposit,
        ruleCode: "TAX_TDS_DEPOSIT",
        owner: "Company Secretary",
        eventId: ev.id,
      });
      codes.push("TAX_TDS_DEPOSIT");
    }
  }

  // Lot with carried-forward cost basis
  lots.push({
    id: ev.id,
    employeeId: employee.id,
    allotmentDate: ev.eventDate,
    sharesAllotted: ev.shares,
    sharesRemaining: ev.shares,
    costBasisPerShare: fmv === null ? null : Math.max(fmv, exercisePrice),
    perquisiteTotal: perq,
    tdsTotal: tax,
    deferred,
    deferralWindowEnd: windowEnd,
  });

  if (fmv !== null) {
    steps.push(
      `Cost basis carried forward ${inr(Math.max(fmv, exercisePrice))} per share (FMV on exercise); holding period from ${isoDay(ev.eventDate)}`
    );
  }

  // Compliance deadlines
  deadlines.push({
    code: "PAS3",
    label: `File PAS-3 for ${ev.shares} shares allotted to ${employee.name}`,
    dueDate: addDays(ev.eventDate, PAS3_DAYS),
    ruleCode: "TAX_PAS3",
    owner: "Company Secretary",
    eventId: ev.id,
  });
  codes.push("TAX_PAS3");

  if (tax !== null && tax > 0 && !deferred) {
    const q = quarterlyReturnDue(ev.eventDate);

    deadlines.push({
      code: "TDS_RETURN",
      label: `File ${q.quarter} quarterly TDS return (24Q / Form 138) with this perquisite`,
      dueDate: q.dueDate,
      ruleCode: "TAX_RETURN_QUARTERLY",
      owner: "Company Secretary",
      eventId: ev.id,
    });
    deadlines.push({
      code: "FORM16",
      label: `Issue Form 16 with the perquisite statement for FY ${fy.label}`,
      dueDate: form16Due(fy.endYear),
      ruleCode: "TAX_FORM16",
      owner: "Company Secretary",
      eventId: ev.id,
    });
    codes.push("TAX_RETURN_QUARTERLY", "TAX_FORM16");
  }

  if (val && age !== null && age <= FMV_MAX_AGE_DAYS) {
    const expires = addDays(val.valuationDate, FMV_MAX_AGE_DAYS);

    if (expires.getTime() >= asOf.getTime()) {
      deadlines.push({
        code: "FMV_VALIDITY",
        label: "Valuation report stops covering exercises",
        dueDate: expires,
        ruleCode: "TAX_FMV_UNLISTED",
        owner: "Merchant banker / Valuer",
        eventId: ev.id,
        note: `Report dated ${isoDay(val.valuationDate)}; ${FMV_MAX_AGE_DAYS}-day limit.`,
      });
    }
  }

  return {
    eventId: ev.id,
    type: "EXERCISE",
    eventDate: ev.eventDate,
    perquisite: {
      fmvPerShare: fmv,
      valuationId: val?.id ?? null,
      valuationDate: val?.valuationDate ?? null,
      valuationAgeDays: age,
      perquisitePerShare: perqPerShare,
      perquisite: perq,
      incrementalTax: tax,
      averageRate: rate,
      deferred,
    },
    tds,
    flags: withUnverifiedFlag(flags, codes, verification),
    audit: makeAudit(
      codes,
      verification,
      {
        employee: employee.name,
        exerciseDate: isoDay(ev.eventDate),
        shares: ev.shares,
        exercisePrice,
        fmvPerShare: fmv,
        valuationId: val?.id ?? null,
        estimatedIncomeExclPerq: employee.estimatedIncomeExclPerq,
        regime: employee.regime,
        monthlyNetPay: employee.monthlyNetPay,
        deferralEligible: company.deferralEligible,
      },
      steps
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Sale and buyback                                                    */
/* ------------------------------------------------------------------ */

function handleDisposal(
  ev: EventInput,
  ctx: Ctx,
  lots: Lot[],
  deadlines: Deadline[]
): EventResult {
  const { employee, company, verification } = ctx;
  const flags: Flag[] = [];
  const steps: string[] = [];
  const isBuyback = ev.type === "BUYBACK";
  const codes = [isBuyback ? "TAX_BUYBACK_2026" : "TAX_CG_UNLISTED", "TAX_SLABS"];

  const price = ev.pricePerShare ?? 0;
  let remaining = ev.shares;
  let cost = 0;
  let costKnown = true;
  let longTermShares = 0;
  let shortTermShares = 0;
  const tds: TdsObligation[] = [];

  const candidates = lots
    .filter((l) => l.sharesRemaining > 0 && (!ev.lotId || l.id === ev.lotId))
    .sort((a, b) => a.allotmentDate.getTime() - b.allotmentDate.getTime());

  let ltGain = 0;
  let stGain = 0;

  for (const lot of candidates) {
    if (remaining <= 0) break;

    const take = Math.min(remaining, lot.sharesRemaining);

    if (lot.costBasisPerShare === null) {
      costKnown = false;
    } else {
      const lotCost = lot.costBasisPerShare * take;
      const lotGain = price * take - lotCost;
      cost += lotCost;

      const longTerm =
        ev.eventDate.getTime() >
        addMonths(lot.allotmentDate, LTCG_UNLISTED_MONTHS).getTime();

      if (longTerm) {
        ltGain += lotGain;
        longTermShares += take;
      } else {
        stGain += lotGain;
        shortTermShares += take;
      }

      steps.push(
        `${take} shares from exercise of ${isoDay(lot.allotmentDate)}: proceeds ${inr(price * take)} - cost ${inr(lotCost)} = ${inr(lotGain)} (${longTerm ? "long" : "short"} term)`
      );
    }

    // Deferred TDS on these shares becomes due
    if (lot.deferred && lot.tdsTotal && lot.tdsTotal > 0) {
      const amount = roundTds((lot.tdsTotal * take) / lot.sharesAllotted, TDS_ROUND_TO);
      const due = addDays(ev.eventDate, DEFERRAL_TDS_DAYS);

      tds.push({
        lotId: lot.id,
        eventId: ev.id,
        status: "TRIGGERED",
        amount,
        shares: take,
        trigger: "SALE",
        deductOnOrBefore: due,
        depositBy: tdsDepositDue(due),
        shortfall: null,
        shortfallOptions: [],
      });

      deadlines.push({
        code: "DEFERRED_TDS_ON_SALE",
        label: `Deduct deferred TDS on ${take} shares ${isBuyback ? "bought back" : "sold"} (${inr(amount)} estimate)`,
        dueDate: due,
        ruleCode: "TAX_DEFERRAL",
        owner: "Advisory firm",
        eventId: ev.id,
        note: `14 days from ${isoDay(ev.eventDate)}.`,
      });
      codes.push("TAX_DEFERRAL");
    }

    lot.sharesRemaining -= take;
    remaining -= take;
  }

  if (remaining > 0) {
    flags.push({
      code: "SHARES_NOT_IN_LEDGER",
      severity: "RED",
      message: `${remaining} of ${ev.shares} shares are not covered by an exercise in this ledger, so their cost basis is unknown. Add the missing exercise.`,
    });
    costKnown = false;
  }

  if (!costKnown) {
    flags.push({
      code: "COST_BASIS_INCOMPLETE",
      severity: "RED",
      message: "Cost basis is incomplete, so the capital-gains figure is partial.",
    });
  }

  const proceeds = price * ev.shares;
  const gain = ltGain + stGain;

  // Estimated tax
  let est: number | null = null;
  let rateLabel = "";

  if (isBuyback && ev.eventDate.getTime() < NEW_ACT_START.getTime()) {
    flags.push({
      code: "BUYBACK_OLD_REGIME",
      severity: "RED",
      message:
        "Buybacks before 1 April 2026 were taxed as deemed dividend. That treatment is not modelled; tax is not estimated.",
    });
    rateLabel = "Not modelled (pre-1 Apr 2026)";
  } else if (company.listed) {
    flags.push({
      code: "LISTED_NOT_MODELLED",
      severity: "AMBER",
      message: "Listed-share capital-gains rates are not modelled; tax is not estimated.",
    });
  } else {
    let tax = 0;

    if (ltGain > 0) {
      tax += ltGain * LTCG_RATE * (1 + CESS_RATE);
      steps.push(`Long-term gain ${inr(ltGain)} at 12.5% plus 4% cess`);
    }

    if (stGain > 0) {
      const st = incrementalTax(employee.estimatedIncomeExclPerq, stGain, employee.regime);
      tax += st.tax;
      steps.push(
        `Short-term gain ${inr(stGain)} added to income at slab rates = ${inr(st.tax)} (uses the income estimate entered for this employee)`
      );
    }

    est = Math.round(tax);
    rateLabel =
      longTermShares > 0 && shortTermShares > 0
        ? "Mixed: long term 12.5%, short term slab"
        : longTermShares > 0
        ? "Long term, 12.5%"
        : "Short term, slab rates";
  }

  if (isBuyback && ev.eventDate.getTime() >= NEW_ACT_START.getTime()) {
    flags.push({
      code: "BUYBACK_PROMOTER_NOT_COMPUTED",
      severity: employee.isPromoter ? "RED" : "INFO",
      message: employee.isPromoter
        ? "Promoter: an additional tax applies to buyback proceeds from 1 April 2026. Sources disagree on the rate, so it is not included."
        : "Promoter additional tax does not apply to this employee as entered.",
    });
  }

  flags.push({
    code: "SALE_TCS_TDS_NOT_MODELLED",
    severity: "INFO",
    message:
      "Withholding by the buyer or company on the sale is not modelled. The employee reports the gain in their own return.",
  });

  return {
    eventId: ev.id,
    type: ev.type,
    eventDate: ev.eventDate,
    capitalGain: {
      proceeds,
      cost,
      gain,
      longTerm: shortTermShares === 0 && longTermShares > 0,
      rateLabel,
      estimatedTax: est,
    },
    tds,
    flags: withUnverifiedFlag(flags, codes, verification),
    audit: makeAudit(
      codes,
      verification,
      {
        employee: employee.name,
        eventDate: isoDay(ev.eventDate),
        shares: ev.shares,
        pricePerShare: price,
        costBasisCarriedForward: costKnown ? cost : null,
        isPromoter: employee.isPromoter,
      },
      steps
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Leave                                                               */
/* ------------------------------------------------------------------ */

function handleLeave(
  ev: EventInput,
  ctx: Ctx,
  lots: Lot[],
  deadlines: Deadline[]
): EventResult {
  const { verification } = ctx;
  const flags: Flag[] = [];
  const steps: string[] = [];
  const codes = ["TAX_DEFERRAL"];
  const tds: TdsObligation[] = [];

  for (const lot of lots) {
    if (!lot.deferred || lot.sharesRemaining <= 0 || !lot.tdsTotal) continue;

    const amount = roundTds(
      (lot.tdsTotal * lot.sharesRemaining) / lot.sharesAllotted,
      TDS_ROUND_TO
    );
    const due = addDays(ev.eventDate, DEFERRAL_TDS_DAYS);

    tds.push({
      lotId: lot.id,
      eventId: ev.id,
      status: "TRIGGERED",
      amount,
      shares: lot.sharesRemaining,
      trigger: "LEAVE",
      deductOnOrBefore: due,
      depositBy: tdsDepositDue(due),
      shortfall: null,
      shortfallOptions: [],
    });

    deadlines.push({
      code: "DEFERRED_TDS_ON_EXIT",
      label: `Deduct deferred TDS on ${lot.sharesRemaining} shares on exit (${inr(amount)} estimate)`,
      dueDate: due,
      ruleCode: "TAX_DEFERRAL",
      owner: "Advisory firm",
      eventId: ev.id,
      note: `14 days from the last working day, ${isoDay(ev.eventDate)}. Final settlement may be the only pay left to deduct from.`,
    });

    steps.push(
      `Lot of ${isoDay(lot.allotmentDate)}: ${lot.sharesRemaining} deferred shares, ${inr(amount)} due by ${isoDay(due)}`
    );

    // Shares stay with the employee; the deferral on them ends.
    lot.deferred = false;
  }

  if (tds.length === 0) {
    steps.push("No deferred TDS outstanding at exit.");
  } else {
    flags.push({
      code: "EXIT_FUNDING",
      severity: "AMBER",
      message:
        "On exit there may be no salary left to deduct from. Plan recovery from final settlement or from the employee.",
    });
  }

  return {
    eventId: ev.id,
    type: "LEAVE",
    eventDate: ev.eventDate,
    tds,
    flags: withUnverifiedFlag(flags, codes, verification),
    audit: makeAudit(
      codes,
      verification,
      { employee: ctx.employee.name, exitDate: isoDay(ev.eventDate) },
      steps
    ),
  };
}

/* ------------------------------------------------------------------ */

function withUnverifiedFlag(
  flags: Flag[],
  codes: string[],
  verification: RuleVerification
): Flag[] {
  const unverified = Array.from(new Set(codes)).filter(
    (c) => verification[c] !== true
  );

  if (unverified.length === 0) return flags;

  return [
    ...flags,
    {
      code: "RULES_UNVERIFIED",
      severity: "INFO",
      message: `Estimate: rests on rules not yet verified (${unverified.join(", ")}).`,
    },
  ];
}
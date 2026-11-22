/**
 * ============================================================================
 * STARTUP EQUITY DESK: GRANT ENGINE (pure functions)
 * ============================================================================
 *
 * Vesting model: nothing vests before the cliff; at the cliff the months
 * served so far vest together; after that, options vest monthly in equal
 * parts until the vesting period ends. With a 12-month cliff over 48 months
 * this is the common "25% after one year, then monthly" schedule.
 *
 * Rule warnings are shown while the founder creates a grant. They are
 * warnings, not blocks: the rules come from secondary sources and stay
 * marked "verify" until a CS or lawyer confirms them. The only hard block
 * is arithmetic: a grant cannot be issued beyond the approved pool.
 * ============================================================================
 */

export type GrantTerms = {
  grantDate: Date;
  options: number;
  exercisePrice: number;
  vestingStart: Date;
  vestingMonths: number;
  cliffMonths: number;
  expiryDate: Date | null;
  postExitDays: number;
  optionsLapsed?: number;
  optionsExercised?: number;
  leftOn?: Date | null;
};

export type GrantWarning = {
  code: string;
  severity: "BLOCK" | "WARN" | "INFO";
  message: string;
  source: string;
};

const DAY = 86_400_000;

export function addMonthsUtc(d: Date, months: number): Date {
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + months);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
}

export function addDaysUtc(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY);
}

/** Whole months from `from` to `to` (0 if `to` is before `from`). */
export function wholeMonths(from: Date, to: Date): number {
  if (to.getTime() < from.getTime()) return 0;
  let m =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) m -= 1;
  return Math.max(0, m);
}

/** Options vested on `asOf` under the cliff + monthly model. */
export function vestedOn(t: GrantTerms, asOf: Date): number {
  const months = wholeMonths(t.vestingStart, asOf);
  if (t.vestingMonths <= 0) return t.options;
  if (months < t.cliffMonths) return 0;
  if (months >= t.vestingMonths) return t.options;
  return Math.floor((t.options * months) / t.vestingMonths);
}

export function firstVestDate(t: GrantTerms): Date {
  return addMonthsUtc(t.vestingStart, Math.max(t.cliffMonths, 1));
}

export function fullyVestedDate(t: GrantTerms): Date {
  return addMonthsUtc(t.vestingStart, t.vestingMonths);
}

export type VestingMilestone = { date: Date; vestedTotal: number; vestedPct: number };

/** Cliff date, then every 12 months, then the final date. For summaries and PDFs. */
export function vestingMilestones(t: GrantTerms): VestingMilestone[] {
  const out: VestingMilestone[] = [];
  const seen = new Set<number>();
  const push = (date: Date) => {
    if (seen.has(date.getTime())) return;
    seen.add(date.getTime());
    const v = vestedOn(t, date);
    out.push({ date, vestedTotal: v, vestedPct: t.options > 0 ? (v / t.options) * 100 : 0 });
  };

  push(firstVestDate(t));
  for (let m = 12; m < t.vestingMonths; m += 12) {
    if (m > t.cliffMonths) push(addMonthsUtc(t.vestingStart, m));
  }
  push(fullyVestedDate(t));

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Snapshot of a grant on a date: vested, unvested, lapsed, outstanding, exercise window. */
export function grantPosition(t: GrantTerms, asOf: Date) {
  const lapsed = t.optionsLapsed ?? 0;
  const exercised = t.optionsExercised ?? 0;
  const hasLeft = !!t.leftOn && t.leftOn.getTime() <= asOf.getTime();
  const vested = vestedOn(t, hasLeft ? (t.leftOn as Date) : asOf);
  const vestedUnexercised = Math.max(0, vested - exercised);
  const outstanding = Math.max(0, t.options - lapsed - exercised);

  const exerciseWindowEnds = t.leftOn ? addDaysUtc(t.leftOn, t.postExitDays) : null;

  return {
    vested,
    // After leaving, nothing more vests: the unvested part has lapsed.
    unvested: hasLeft ? 0 : Math.max(0, t.options - vested),
    vestedUnexercised,
    outstanding,
    lapsed,
    exercised,
    exerciseWindowEnds,
    exerciseCostOfVested: vestedUnexercised * t.exercisePrice,
  };
}

/* ------------------------------------------------------------------ */
/* US: ISO $100,000 limit                                              */
/* ------------------------------------------------------------------ */

export const ISO_ANNUAL_LIMIT_USD = 100_000;

/**
 * Value of options that first become exercisable (vest) in each calendar
 * year, valued at the exercise price. For an ISO granted at fair market
 * value the exercise price equals the grant-date FMV, which is what the
 * $100,000 rule uses, so this is a close estimate without storing FMV
 * history. Vesting stops at the leaving date.
 */
export function exercisableValueByYear(t: GrantTerms): Map<number, number> {
  const out = new Map<number, number>();
  if (t.options <= 0) return out;
  const startYear = t.vestingStart.getUTCFullYear();
  const end = t.leftOn && t.leftOn < fullyVestedDate(t) ? t.leftOn : fullyVestedDate(t);
  const endYear = end.getUTCFullYear();
  let before = 0;
  for (let y = startYear; y <= endYear; y += 1) {
    const yearEnd = new Date(Date.UTC(y, 11, 31));
    const cap = t.leftOn && t.leftOn < yearEnd ? t.leftOn : yearEnd;
    const vested = vestedOn(t, cap);
    const newly = Math.max(0, vested - before);
    before = Math.max(before, vested);
    if (newly > 0) out.set(y, (out.get(y) ?? 0) + newly * t.exercisePrice);
  }
  return out;
}

/** Years in which this person's ISOs (this grant plus others) exceed $100,000. */
export function isoLimitBreaches(
  thisGrant: GrantTerms,
  others: GrantTerms[]
): { year: number; value: number }[] {
  const total = new Map<number, number>();
  for (const g of [thisGrant, ...others]) {
    for (const [y, v] of exercisableValueByYear(g)) total.set(y, (total.get(y) ?? 0) + v);
  }
  const thisYears = new Set(exercisableValueByYear(thisGrant).keys());
  return [...total.entries()]
    .filter(([y, v]) => thisYears.has(y) && v > ISO_ANNUAL_LIMIT_USD)
    .map(([year, value]) => ({ year, value }))
    .sort((a, b) => a.year - b.year);
}

/* ------------------------------------------------------------------ */
/* Warnings                                                            */
/* ------------------------------------------------------------------ */

export type WarningContext = {
  /** Company country. Defaults to India so older callers keep working. */
  jurisdiction?: "IN" | "US";
  poolSize: number;
  /** Options already used from this scheme's pool by OTHER issued grants (net of lapsed). */
  poolUsedByOthers: number;
  shareholderApprovedOn: Date | null;
  boardApprovedOn: Date | null;
  dpiitRecognised: boolean | null;
  incorporationDate: Date | null;
  /** India: promoter / >10% director. US: owns >10% of voting stock (ISO 10% holder). */
  isPromoterOver10Pct: boolean;
  /** US only. */
  usOptionType?: "ISO" | "NSO" | null;
  /** US only: latest 409A value and its date. */
  fmvPerShare?: number | null;
  fmvValuationDate?: Date | null;
  /** US only: this person's other ISO grants, for the $100,000 limit. */
  otherIsoGrants?: GrantTerms[];
};

const fmtCount = (n: number, j: "IN" | "US") =>
  n.toLocaleString(j === "US" ? "en-US" : "en-IN");

export function grantWarnings(t: GrantTerms, ctx: WarningContext): GrantWarning[] {
  const j = ctx.jurisdiction ?? "IN";
  const w: GrantWarning[] = [];

  // Pool (arithmetic, the only hard block), same in every country
  const remaining = ctx.poolSize - ctx.poolUsedByOthers;
  if (t.options > remaining) {
    w.push({
      code: "POOL_EXCEEDED",
      severity: "BLOCK",
      message: `This grant needs ${fmtCount(t.options, j)} options but only ${fmtCount(Math.max(0, remaining), j)} are left in the pool. Reduce the grant or increase the pool (which needs ${j === "US" ? "board and stockholder" : "shareholder"} approval).`,
      source: `Pool size you recorded for this ${j === "US" ? "plan" : "scheme"}`,
    });
  }

  if (j === "US") {
    w.push(...usWarnings(t, ctx));
  } else {
    w.push(...indiaWarnings(t, ctx));
  }

  // Expiry before full vesting (every country)
  if (t.expiryDate && t.expiryDate.getTime() < fullyVestedDate(t).getTime()) {
    w.push({
      code: "EXPIRY_BEFORE_VESTING",
      severity: "WARN",
      message: "The expiry date is before the options finish vesting, so some options could never be exercised.",
      source: "Grant terms",
    });
  }

  return w;
}

/* ------------------------------- India ------------------------------- */

function indiaWarnings(t: GrantTerms, ctx: WarningContext): GrantWarning[] {
  const w: GrantWarning[] = [];

  // Shareholder approval before grant
  if (!ctx.shareholderApprovedOn) {
    w.push({
      code: "NO_SHAREHOLDER_APPROVAL",
      severity: "WARN",
      message: "No shareholder approval date is recorded for this scheme. Options are normally granted only after shareholders approve the scheme.",
      source: "Companies Act s.62(1)(b), Share Capital Rules r.12(1) (verify)",
    });
  } else if (t.grantDate.getTime() < ctx.shareholderApprovedOn.getTime()) {
    w.push({
      code: "GRANT_BEFORE_APPROVAL",
      severity: "WARN",
      message: "The grant date is before the shareholders approved the scheme.",
      source: "Companies Act s.62(1)(b), Share Capital Rules r.12(1) (verify)",
    });
  }

  // Minimum one year between grant and first vesting
  const first = firstVestDate(t);
  if (first.getTime() < addMonthsUtc(t.grantDate, 12).getTime()) {
    w.push({
      code: "MIN_VESTING_PERIOD",
      severity: "WARN",
      message: "The first options vest less than one year after the grant date. A minimum of one year between grant and vesting is commonly required.",
      source: "Share Capital Rules r.12(6)(a) (verify)",
    });
  }

  // Vesting start before grant date
  if (t.vestingStart.getTime() < t.grantDate.getTime()) {
    w.push({
      code: "VESTING_BEFORE_GRANT",
      severity: "INFO",
      message: "Vesting starts before the grant date (back-dated vesting, for example from the joining date). Check this is intended and that the one-year minimum is still met from the grant date.",
      source: "Company practice",
    });
  }

  // Promoter / director holding more than 10%
  if (ctx.isPromoterOver10Pct) {
    const withinTenYears =
      ctx.incorporationDate !== null &&
      addMonthsUtc(ctx.incorporationDate, 120).getTime() > t.grantDate.getTime();
    w.push({
      code: "PROMOTER_OVER_10",
      severity: "WARN",
      message:
        ctx.dpiitRecognised && withinTenYears
          ? "This person is marked as a promoter or a director holding more than 10%. They are normally not eligible, but a relaxation exists for DPIIT-recognised startups within 10 years of incorporation, which appears to apply here."
          : "This person is marked as a promoter or a director holding more than 10%. They are normally not eligible for ESOPs unless the startup relaxation applies (DPIIT-recognised, within 10 years of incorporation).",
      source: "Share Capital Rules r.12(1) Explanation (verify)",
    });
  }

  return w;
}

/* --------------------------------- US -------------------------------- */

function usWarnings(t: GrantTerms, ctx: WarningContext): GrantWarning[] {
  const w: GrantWarning[] = [];
  const iso = ctx.usOptionType === "ISO";
  const tenPct = ctx.isPromoterOver10Pct;
  const fmv = ctx.fmvPerShare && ctx.fmvPerShare > 0 ? ctx.fmvPerShare : null;
  const fmvDate = ctx.fmvValuationDate ?? null;

  if (!ctx.usOptionType) {
    w.push({
      code: "US_NO_OPTION_TYPE",
      severity: "WARN",
      message: "Choose whether this is an ISO or an NSO. The type decides the employee's tax, and ISOs can only go to employees (not advisors or contractors).",
      source: "IRC s.422 (verify)",
    });
  }

  // Plan adoption by the board
  if (!ctx.boardApprovedOn) {
    w.push({
      code: "US_NO_BOARD_ADOPTION",
      severity: "WARN",
      message: "No board adoption date is recorded for this plan. Options are normally granted under a plan the board has adopted, and each grant is approved by the board or its delegate.",
      source: "Plan practice (verify)",
    });
  } else if (t.grantDate.getTime() < ctx.boardApprovedOn.getTime()) {
    w.push({
      code: "US_GRANT_BEFORE_PLAN",
      severity: "WARN",
      message: "The grant date is before the board adopted the plan.",
      source: "Plan practice (verify)",
    });
  }

  // 409A: strike price against fair market value
  if (!fmv) {
    w.push({
      code: "US_NO_409A",
      severity: "WARN",
      message: "No 409A value is recorded under Company details. Strike prices should be at least the fair market value on the grant date, normally taken from an independent 409A valuation.",
      source: "IRC s.409A, Treas. Reg. 1.409A-1(b)(5) (verify)",
    });
  } else if (fmvDate && fmvDate.getTime() > t.grantDate.getTime()) {
    w.push({
      code: "US_409A_AFTER_GRANT",
      severity: "INFO",
      message: "The 409A value on file is dated after this grant. Check the strike price against the valuation that was in force on the grant date.",
      source: "IRC s.409A (verify)",
    });
  } else {
    if (fmvDate && addMonthsUtc(fmvDate, 12).getTime() < t.grantDate.getTime()) {
      w.push({
        code: "US_409A_STALE",
        severity: "WARN",
        message: "The 409A valuation on file is more than 12 months older than this grant. The safe harbor generally needs a valuation no older than 12 months, and a material event (such as a priced round) can make it stale sooner.",
        source: "Treas. Reg. 1.409A-1(b)(5)(iv)(B) (verify)",
      });
    }
    if (t.exercisePrice < fmv) {
      w.push({
        code: "US_STRIKE_BELOW_FMV",
        severity: "WARN",
        message: `The strike price is below the 409A value of $${fmv.toLocaleString("en-US", { maximumFractionDigits: 4 })}. A discounted option can trigger 409A penalties for the employee (tax at vesting plus an extra 20%), and it cannot be an ISO.`,
        source: "IRC s.409A, s.422(b)(4) (verify)",
      });
    } else if (iso && tenPct && t.exercisePrice < fmv * 1.1) {
      w.push({
        code: "US_ISO_10PCT_PRICE",
        severity: "WARN",
        message: `For an ISO to a 10% holder the strike must be at least 110% of fair market value (at least $${(fmv * 1.1).toLocaleString("en-US", { maximumFractionDigits: 4 })}). Otherwise it is treated as an NSO.`,
        source: "IRC s.422(c)(5) (verify)",
      });
    }
  }

  if (iso) {
    // Stockholder approval within 12 months of board adoption
    if (!ctx.shareholderApprovedOn) {
      w.push({
        code: "US_ISO_NO_STOCKHOLDER_APPROVAL",
        severity: "WARN",
        message: "No stockholder approval date is recorded for this plan. ISOs need the plan approved by stockholders within 12 months before or after the board adopts it; otherwise the options are treated as NSOs.",
        source: "IRC s.422(b)(1) (verify)",
      });
    } else if (
      ctx.boardApprovedOn &&
      Math.abs(wholeMonthsSigned(ctx.boardApprovedOn, ctx.shareholderApprovedOn)) > 12
    ) {
      w.push({
        code: "US_ISO_STOCKHOLDER_APPROVAL_LATE",
        severity: "WARN",
        message: "Stockholder approval is more than 12 months away from the board adoption date. ISOs need approval within 12 months before or after adoption; otherwise they are treated as NSOs.",
        source: "IRC s.422(b)(1) (verify)",
      });
    }

    // No ISO more than 10 years after the plan was adopted or approved
    const planStart = earliest(ctx.boardApprovedOn, ctx.shareholderApprovedOn);
    if (planStart && addMonthsUtc(planStart, 120).getTime() < t.grantDate.getTime()) {
      w.push({
        code: "US_ISO_PLAN_TOO_OLD",
        severity: "WARN",
        message: "This grant is more than 10 years after the plan was adopted or approved. ISOs can't be granted under it any more; a new or restated plan is needed.",
        source: "IRC s.422(b)(2) (verify)",
      });
    }

    // Term: 10 years (5 for a 10% holder)
    const maxYears = tenPct ? 5 : 10;
    if (!t.expiryDate) {
      w.push({
        code: "US_ISO_NO_EXPIRY",
        severity: "INFO",
        message: `Record an expiry date. An ISO must expire no later than ${maxYears} years after the grant date${tenPct ? " for a 10% holder" : ""}.`,
        source: "IRC s.422(b)(3), s.422(c)(5) (verify)",
      });
    } else if (t.expiryDate.getTime() > addMonthsUtc(t.grantDate, maxYears * 12).getTime()) {
      w.push({
        code: "US_ISO_TERM_TOO_LONG",
        severity: "WARN",
        message: `The expiry is more than ${maxYears} years after the grant date. An ISO${tenPct ? " to a 10% holder" : ""} can't run longer than that; otherwise it is treated as an NSO.`,
        source: "IRC s.422(b)(3), s.422(c)(5) (verify)",
      });
    }

    // Post-termination window over 3 months loses ISO treatment for later exercises
    if (t.postExitDays > 90) {
      w.push({
        code: "US_ISO_LONG_EXIT_WINDOW",
        severity: "INFO",
        message: `The exercise window after leaving is ${t.postExitDays} days. ISO tax treatment generally needs exercise within 3 months of leaving employment (12 months for disability); exercises after that are taxed as NSOs.`,
        source: "IRC s.422(a)(2) (verify)",
      });
    }

    // $100,000 limit
    const breaches = isoLimitBreaches(t, ctx.otherIsoGrants ?? []);
    if (breaches.length) {
      const list = breaches
        .map((b) => `${b.year} (about $${Math.round(b.value).toLocaleString("en-US")})`)
        .join(", ");
      w.push({
        code: "US_ISO_100K_LIMIT",
        severity: "WARN",
        message: `This person's ISOs that first vest in ${list} are worth more than $100,000 in that year, valued at the strike price. The part above $100,000 each year is treated as an NSO.`,
        source: "IRC s.422(d) (verify)",
      });
    }
  }

  if (t.vestingStart.getTime() < t.grantDate.getTime()) {
    w.push({
      code: "VESTING_BEFORE_GRANT",
      severity: "INFO",
      message: "Vesting starts before the grant date (for example from the start date). Check this is intended.",
      source: "Company practice",
    });
  }

  return w;
}

function earliest(a: Date | null, b: Date | null): Date | null {
  if (a && b) return a.getTime() <= b.getTime() ? a : b;
  return a ?? b;
}

/** Whole months from a to b, negative if b is before a. */
function wholeMonthsSigned(a: Date, b: Date): number {
  return b.getTime() >= a.getTime() ? wholeMonths(a, b) : -wholeMonths(b, a);
}

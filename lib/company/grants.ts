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
/* Warnings                                                            */
/* ------------------------------------------------------------------ */

export type WarningContext = {
  poolSize: number;
  /** Options already used from this scheme's pool by OTHER issued grants (net of lapsed). */
  poolUsedByOthers: number;
  shareholderApprovedOn: Date | null;
  boardApprovedOn: Date | null;
  dpiitRecognised: boolean | null;
  incorporationDate: Date | null;
  isPromoterOver10Pct: boolean;
};

export function grantWarnings(t: GrantTerms, ctx: WarningContext): GrantWarning[] {
  const w: GrantWarning[] = [];

  // Pool (arithmetic, the only hard block)
  const remaining = ctx.poolSize - ctx.poolUsedByOthers;
  if (t.options > remaining) {
    w.push({
      code: "POOL_EXCEEDED",
      severity: "BLOCK",
      message: `This grant needs ${t.options.toLocaleString("en-IN")} options but only ${Math.max(0, remaining).toLocaleString("en-IN")} are left in the pool. Reduce the grant or increase the pool (which needs shareholder approval).`,
      source: "Pool size you recorded for this scheme",
    });
  }

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

  // Expiry before full vesting
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
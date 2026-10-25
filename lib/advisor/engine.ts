import type {
  CapTableRow,
  ClientCompany,
  ClientResolution,
  ClientValuation,
  FindingSeverity,
  RegisterExercise,
  RegisterGrant,
} from "@prisma/client";

/* ------------------------------------------------------------------ */
/* Types: plain slices of the Prisma rows, so the engine has no DB use */
/* ------------------------------------------------------------------ */

export type EngineClient = Pick<
  ClientCompany,
  | "companyType"
  | "approvedPoolSize"
  | "dpiitRecognised"
  | "imbCertificate"
  | "overseasParent"
  | "incorporationDate"
>;

export type EngineResolution = Pick<
  ClientResolution,
  "kind" | "vote" | "passedOn" | "mgt14Filed" | "explanatoryStatementOnFile"
>;

export type EngineValuation = Pick<
  ClientValuation,
  | "id"
  | "valuationDate"
  | "fmvPerShare"
  | "valuerName"
  | "signedBySebiCat1MerchantBanker"
  | "reference"
>;

export type EngineGrant = Pick<
  RegisterGrant,
  | "id"
  | "sourceRow"
  | "employeeName"
  | "grantDate"
  | "optionsGranted"
  | "exercisePrice"
  | "vestingMonths"
  | "cliffMonths"
  | "expiryDate"
  | "postExitExerciseDays"
  | "optionsLapsed"
  | "status"
  | "leftOn"
  | "letterOptions"
  | "letterExercisePrice"
  | "letterGrantDate"
>;

export type EngineExercise = Pick<
  RegisterExercise,
  | "id"
  | "grantId"
  | "exerciseDate"
  | "optionsExercised"
  | "allotmentDate"
  | "pas3FiledOn"
>;

export type EngineCapRow = Pick<
  CapTableRow,
  "holderName" | "holderType" | "shares"
>;

export type EngineRule = {
  code: string;
  title: string;
  source: string;
  verified: boolean;
  severityVerified: FindingSeverity;
  severityUnverified: FindingSeverity;
};

export type EngineInput = {
  asOf: Date;
  client: EngineClient;
  resolutions: EngineResolution[];
  valuations: EngineValuation[];
  grants: EngineGrant[];
  exercises: EngineExercise[];
  capTable: EngineCapRow[];
  rules: EngineRule[];
};

export type EngineFinding = {
  ruleCode: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  sourceRef: Record<string, unknown>;
  suggestedOwner: string | null;
  dueDate: Date | null;
  ruleVerified: boolean;
  count: number;
};

export type EngineResult = {
  asOf: string;
  score: number;
  summary: { red: number; amber: number; info: number; green: number };
  findings: EngineFinding[];
  skipped: string[];
};

/* ------------------------------------------------------------------ */
/* Date and text helpers                                               */
/* ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function utcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((utcDay(to) - utcDay(from)) / DAY_MS);
}

function addDays(d: Date, days: number): Date {
  return new Date(utcDay(d) + days * DAY_MS);
}

function fmt(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function listNames(names: string[], max = 5): string {
  const unique = [...new Set(names)];
  if (unique.length <= max) return unique.join(", ");
  return `${unique.slice(0, max).join(", ")} and ${unique.length - max} more`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function earliest(dates: Date[]): Date | null {
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (utcDay(a) <= utcDay(b) ? a : b));
}

const OWNER = {
  cs: "Company Secretary",
  finance: "Finance / Payroll",
  valuer: "Merchant banker / Valuer",
  firm: "Advisory firm",
  hr: "HR / Company",
};

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

export function runDiligence(input: EngineInput): EngineResult {
  const { client, resolutions, valuations, grants, exercises, capTable } = input;

  const asOfDay = new Date(utcDay(input.asOf));
  const ruleMap = new Map(input.rules.map((r) => [r.code, r]));
  const findings: EngineFinding[] = [];
  const skipped: string[] = [];

  const grantById = new Map(grants.map((g) => [g.id, g]));

  const exercisedByGrant = new Map<string, number>();
  for (const ex of exercises) {
    exercisedByGrant.set(
      ex.grantId,
      (exercisedByGrant.get(ex.grantId) ?? 0) + ex.optionsExercised
    );
  }

  const remainingOf = (g: EngineGrant) =>
    g.optionsGranted - g.optionsLapsed - (exercisedByGrant.get(g.id) ?? 0);

  const nameOf = (grantId: string) =>
    grantById.get(grantId)?.employeeName ?? "Unknown employee";

  function ruleOf(code: string): EngineRule {
    return (
      ruleMap.get(code) ?? {
        code,
        title: code,
        source: "",
        verified: false,
        severityVerified: "RED",
        severityUnverified: "AMBER",
      }
    );
  }

  type Opts = {
    count?: number;
    refs?: Record<string, unknown>;
    owner?: string;
    due?: Date | null;
  };

  function add(
    code: string,
    level: "rule" | FindingSeverity,
    title: string,
    detail: string,
    opts: Opts = {}
  ) {
    const rule = ruleOf(code);
    const severity: FindingSeverity =
      level === "rule"
        ? rule.verified
          ? rule.severityVerified
          : rule.severityUnverified
        : level;

    findings.push({
      ruleCode: code,
      severity,
      title,
      detail,
      sourceRef: { ruleSource: rule.source, ...(opts.refs ?? {}) },
      suggestedOwner: opts.owner ?? null,
      dueDate: opts.due ?? null,
      ruleVerified: rule.verified,
      count: Math.max(1, opts.count ?? 1),
    });
  }

  /* ================================================================ */
  /* 1. Approval trail                                                 */
  /* ================================================================ */

  const shareholder = resolutions
    .filter((r) => r.kind === "SHAREHOLDER_SCHEME_APPROVAL")
    .sort((a, b) => utcDay(a.passedOn) - utcDay(b.passedOn));

  if (shareholder.length === 0) {
    if (grants.length > 0 || exercises.length > 0) {
      add(
        "APPROVAL_NO_SHAREHOLDER_RESOLUTION",
        "rule",
        "No shareholder approval recorded for the ESOP scheme",
        `${plural(grants.length, "grant is", "grants are")} on the register, but no shareholder resolution approving the scheme has been entered. Enter the resolution date, or obtain the resolution and explanatory statement from the company.`,
        { owner: OWNER.cs, refs: { grants: grants.length } }
      );
    } else {
      skipped.push("Approval trail: no grants or resolutions entered yet.");
    }
  } else {
    const first = shareholder[0];

    add(
      "APPROVAL_NO_SHAREHOLDER_RESOLUTION",
      "GREEN",
      "Shareholder approval recorded",
      `Scheme approved by ${first.vote.toLowerCase()} resolution on ${fmt(first.passedOn)}.`
    );

    const early = grants.filter((g) => utcDay(g.grantDate) < utcDay(first.passedOn));
    if (early.length > 0) {
      add(
        "APPROVAL_GRANT_BEFORE_APPROVAL",
        "rule",
        "Options granted before shareholder approval",
        `${plural(early.length, "grant is", "grants are")} dated before the earliest shareholder approval (${fmt(first.passedOn)}): ${listNames(early.map((g) => g.employeeName))}.`,
        {
          count: early.length,
          owner: OWNER.cs,
          refs: {
            approvalDate: isoDay(first.passedOn),
            rows: early.slice(0, 30).map((g) => g.sourceRow),
          },
        }
      );
    } else if (grants.length > 0) {
      add(
        "APPROVAL_GRANT_BEFORE_APPROVAL",
        "GREEN",
        "All grants are dated on or after shareholder approval",
        `${plural(grants.length, "grant", "grants")} checked against the approval date of ${fmt(first.passedOn)}.`
      );
    }

    const hasOrdinary = shareholder.some((r) => r.vote === "ORDINARY");

    if (hasOrdinary && client.companyType === "PRIVATE_LIMITED") {
      add(
        "APPROVAL_PRIVATE_VOTE_TYPE",
        "rule",
        "Scheme approved by ordinary resolution (private company)",
        "Sources conflict on whether a private company may approve an ESOP scheme by ordinary resolution under the MCA exemption, or whether Rule 12 still requires a special resolution. Confirm against the exemption notification before relying on it.",
        { owner: OWNER.cs }
      );
    }

    if (hasOrdinary && client.companyType === "UNLISTED_PUBLIC") {
      add(
        "APPROVAL_PUBLIC_VOTE_TYPE",
        "rule",
        "Scheme approved by ordinary resolution (unlisted public company)",
        "An unlisted public company is expected to approve the scheme by special resolution. Confirm the resolution type and re-pass if required.",
        { owner: OWNER.cs }
      );
    }

    // MGT-14: checked for special resolutions only. Whether it is needed
    // for board or ordinary resolutions is unresolved, so it is not tested.
    const special = shareholder.filter((r) => r.vote === "SPECIAL");

    if (special.length === 0) {
      add(
        "APPROVAL_MGT14",
        "INFO",
        "MGT-14 not assessed",
        "MGT-14 is checked for special resolutions only. Confirm separately whether the approval you hold needs one."
      );
    } else {
      const missingOverdue: ClientResolution["passedOn"][] = [];
      const missingUpcoming: Date[] = [];
      const late: { passedOn: Date; days: number }[] = [];

      for (const r of special) {
        const deadline = addDays(r.passedOn, 30);

        if (!r.mgt14Filed) {
          if (utcDay(asOfDay) > utcDay(deadline)) missingOverdue.push(r.passedOn);
          else missingUpcoming.push(deadline);
        } else {
          const days = daysBetween(r.passedOn, r.mgt14Filed);
          if (days > 30) late.push({ passedOn: r.passedOn, days });
        }
      }

      if (missingOverdue.length > 0) {
        add(
          "APPROVAL_MGT14",
          "rule",
          "MGT-14 not recorded and the 30-day period has passed",
          `No MGT-14 filing date is recorded for the special resolution(s) passed on ${listNames(missingOverdue.map(fmt))}.`,
          {
            count: missingOverdue.length,
            owner: OWNER.cs,
            due: earliest(missingOverdue.map((d) => addDays(d, 30))),
          }
        );
      }

      if (missingUpcoming.length > 0) {
        add(
          "APPROVAL_MGT14",
          "INFO",
          "MGT-14 due soon",
          `MGT-14 for a recent special resolution is due by ${fmt(earliest(missingUpcoming)!)}.`,
          { owner: OWNER.cs, due: earliest(missingUpcoming) }
        );
      }

      if (late.length > 0) {
        add(
          "APPROVAL_MGT14",
          "rule",
          "MGT-14 filed after the 30-day period",
          `${plural(late.length, "resolution was", "resolutions were")} filed late (up to ${Math.max(...late.map((l) => l.days))} days after passing).`,
          { count: late.length, owner: OWNER.cs }
        );
      }

      if (
        missingOverdue.length === 0 &&
        missingUpcoming.length === 0 &&
        late.length === 0
      ) {
        add(
          "APPROVAL_MGT14",
          "GREEN",
          "MGT-14 filed within 30 days",
          `${plural(special.length, "special resolution", "special resolutions")} checked.`
        );
      }
    }

    const noStatement = shareholder.filter((r) => !r.explanatoryStatementOnFile);
    if (noStatement.length > 0) {
      add(
        "APPROVAL_EXPLANATORY_STATEMENT",
        "rule",
        "Rule 12 explanatory statement not confirmed on file",
        `Not confirmed for the resolution(s) of ${listNames(noStatement.map((r) => fmt(r.passedOn)))}. Obtain the notice and explanatory statement from the company.`,
        { count: noStatement.length, owner: OWNER.cs }
      );
    } else {
      add(
        "APPROVAL_EXPLANATORY_STATEMENT",
        "GREEN",
        "Explanatory statement confirmed on file",
        "Marked as held for every shareholder resolution."
      );
    }
  }

  /* ================================================================ */
  /* 2. Grant completeness                                             */
  /* ================================================================ */

  if (grants.length === 0) {
    skipped.push("Grant completeness: the register has no grants.");
  } else {
    const missingBy = {
      "vesting period": grants.filter((g) => g.vestingMonths === null),
      cliff: grants.filter((g) => g.cliffMonths === null),
      "expiry date": grants.filter((g) => g.expiryDate === null),
      "post-exit exercise window": grants.filter(
        (g) => g.postExitExerciseDays === null
      ),
    };

    const incomplete = new Set<string>();
    const parts: string[] = [];

    for (const [label, list] of Object.entries(missingBy)) {
      if (list.length > 0) {
        parts.push(`${label} (${plural(list.length, "grant", "grants")})`);
        for (const g of list) incomplete.add(g.id);
      }
    }

    if (incomplete.size === 0) {
      add(
        "GRANT_INCOMPLETE",
        "GREEN",
        "All grants record the key terms",
        `${plural(grants.length, "grant", "grants")} checked for vesting, cliff, expiry and post-exit window.`
      );
    } else {
      add(
        "GRANT_INCOMPLETE",
        "rule",
        "Grant records are missing key terms",
        `Missing: ${parts.join("; ")}. Forfeiture terms are not imported yet and are not checked here.`,
        {
          count: incomplete.size,
          owner: OWNER.hr,
          refs: {
            rows: grants
              .filter((g) => incomplete.has(g.id))
              .slice(0, 30)
              .map((g) => g.sourceRow),
          },
        }
      );
    }
  }

  /* ================================================================ */
  /* 3. Pool adequacy                                                  */
  /* ================================================================ */

  if (client.approvedPoolSize === null) {
    skipped.push("Pool adequacy: the approved pool size has not been entered for this client.");
  } else if (grants.length === 0) {
    skipped.push("Pool adequacy: the register has no grants.");
  } else {
    const netGranted = grants.reduce(
      (sum, g) => sum + (g.optionsGranted - g.optionsLapsed),
      0
    );
    const pool = client.approvedPoolSize;
    const pct = Math.round((netGranted / pool) * 1000) / 10;

    if (netGranted > pool) {
      add(
        "POOL_EXCEEDED",
        "rule",
        "Options granted exceed the approved pool",
        `${netGranted.toLocaleString("en-IN")} options are outstanding or exercised against an approved pool of ${pool.toLocaleString("en-IN")} (${pct}%). Increase the pool through the proper approvals, or correct the register.`,
        { owner: OWNER.cs, refs: { netGranted, pool } }
      );
    } else if (pct >= 90) {
      add(
        "POOL_EXCEEDED",
        "INFO",
        "Approved pool nearly fully used",
        `${pct}% of the approved pool is used (${netGranted.toLocaleString("en-IN")} of ${pool.toLocaleString("en-IN")}).`,
        { refs: { netGranted, pool } }
      );
    } else {
      add(
        "POOL_EXCEEDED",
        "GREEN",
        "Grants are within the approved pool",
        `${pct}% of the approved pool is used (${netGranted.toLocaleString("en-IN")} of ${pool.toLocaleString("en-IN")}).`,
        { refs: { netGranted, pool } }
      );
    }
  }

  /* ================================================================ */
  /* 4. Valuation freshness                                            */
  /* ================================================================ */

  if (exercises.length === 0) {
    skipped.push("Valuation freshness and PAS-3 clocks: no exercises have been imported.");
  } else {
    const sortedVals = [...valuations].sort(
      (a, b) => utcDay(a.valuationDate) - utcDay(b.valuationDate)
    );

    const missing: EngineExercise[] = [];
    const stale: { ex: EngineExercise; age: number }[] = [];
    const used = new Map<string, EngineValuation>();
    let fresh = 0;

    for (const ex of exercises) {
      let chosen: EngineValuation | null = null;
      for (const v of sortedVals) {
        if (utcDay(v.valuationDate) <= utcDay(ex.exerciseDate)) chosen = v;
      }

      if (!chosen) {
        missing.push(ex);
        continue;
      }

      used.set(chosen.id, chosen);
      const age = daysBetween(chosen.valuationDate, ex.exerciseDate);

      if (age > 180) stale.push({ ex, age });
      else fresh++;
    }

    if (missing.length > 0) {
      add(
        "FMV_MISSING",
        "rule",
        "No valuation report on or before the exercise date",
        `${plural(missing.length, "exercise has", "exercises have")} no valuation dated on or before the exercise: ${listNames(missing.map((e) => nameOf(e.grantId)))}. Enter the merchant banker's report details.`,
        {
          count: missing.length,
          owner: OWNER.valuer,
          refs: {
            exercises: missing.slice(0, 30).map((e) => ({
              employee: nameOf(e.grantId),
              exerciseDate: isoDay(e.exerciseDate),
            })),
          },
        }
      );
    }

    if (stale.length > 0) {
      const oldest = Math.max(...stale.map((s) => s.age));
      add(
        "FMV_STALE",
        "rule",
        "Valuation report older than 180 days at exercise",
        `${plural(stale.length, "exercise used", "exercises used")} a valuation more than 180 days old (oldest ${oldest} days): ${listNames(stale.map((s) => nameOf(s.ex.grantId)))}. A fresh report is needed for these exercises.`,
        {
          count: stale.length,
          owner: OWNER.valuer,
          refs: {
            exercises: stale.slice(0, 30).map((s) => ({
              employee: nameOf(s.ex.grantId),
              exerciseDate: isoDay(s.ex.exerciseDate),
              valuationAgeDays: s.age,
            })),
          },
        }
      );
    }

    const unsigned = [...used.values()].filter(
      (v) => !v.signedBySebiCat1MerchantBanker
    );
    if (unsigned.length > 0) {
      add(
        "FMV_SIGNATORY",
        "rule",
        "Valuation not marked as signed by a Category I merchant banker",
        `${plural(unsigned.length, "valuation", "valuations")} used for exercises ${unsigned.length === 1 ? "is" : "are"} not marked as signed by a SEBI-registered Category I merchant banker (dated ${listNames(unsigned.map((v) => fmt(v.valuationDate)))}).`,
        { count: unsigned.length, owner: OWNER.valuer }
      );
    }

    if (missing.length === 0 && stale.length === 0 && unsigned.length === 0) {
      add(
        "FMV_STALE",
        "GREEN",
        "Valuations are current and signed",
        `${plural(fresh, "exercise", "exercises")} checked against valuations within 180 days.`
      );
    }

    /* ============================================================== */
    /* 5. Filing clocks (PAS-3)                                        */
    /* ============================================================== */

    const noAllotment: EngineExercise[] = [];
    const overdue: { ex: EngineExercise; deadline: Date }[] = [];
    const upcoming: { ex: EngineExercise; deadline: Date }[] = [];
    const late: { ex: EngineExercise; days: number }[] = [];
    let onTime = 0;

    for (const ex of exercises) {
      if (!ex.allotmentDate) {
        noAllotment.push(ex);
        continue;
      }

      const deadline = addDays(ex.allotmentDate, 30);

      if (ex.pas3FiledOn) {
        const days = daysBetween(ex.allotmentDate, ex.pas3FiledOn);
        if (days > 30) late.push({ ex, days });
        else onTime++;
      } else if (utcDay(asOfDay) > utcDay(deadline)) {
        overdue.push({ ex, deadline });
      } else {
        upcoming.push({ ex, deadline });
      }
    }

    if (noAllotment.length > 0) {
      add(
        "PAS3_NO_ALLOTMENT_DATE",
        "rule",
        "Exercises recorded without a board allotment date",
        `${plural(noAllotment.length, "exercise has", "exercises have")} no allotment date, so the 30-day PAS-3 period cannot be measured. The clock runs from the board allotment resolution, not the exercise request: ${listNames(noAllotment.map((e) => nameOf(e.grantId)))}.`,
        { count: noAllotment.length, owner: OWNER.cs }
      );
    }

    if (overdue.length > 0) {
      add(
        "PAS3_MISSING",
        "rule",
        "PAS-3 not recorded and the 30-day period has passed",
        `${plural(overdue.length, "allotment has", "allotments have")} no PAS-3 filing date and ${overdue.length === 1 ? "is" : "are"} past 30 days: ${listNames(overdue.map((o) => nameOf(o.ex.grantId)))}. Oldest was due ${fmt(earliest(overdue.map((o) => o.deadline))!)}.`,
        {
          count: overdue.length,
          owner: OWNER.cs,
          due: earliest(overdue.map((o) => o.deadline)),
          refs: {
            exercises: overdue.slice(0, 30).map((o) => ({
              employee: nameOf(o.ex.grantId),
              allotmentDate: isoDay(o.ex.allotmentDate!),
              dueBy: isoDay(o.deadline),
            })),
          },
        }
      );
    }

    if (upcoming.length > 0) {
      const soonest = earliest(upcoming.map((u) => u.deadline))!;
      add(
        "PAS3_MISSING",
        "INFO",
        "PAS-3 due soon",
        `${plural(upcoming.length, "allotment has", "allotments have")} a PAS-3 due within the 30-day period. Soonest due date: ${fmt(soonest)} (${daysBetween(asOfDay, soonest)} days).`,
        { count: upcoming.length, owner: OWNER.cs, due: soonest }
      );
    }

    if (late.length > 0) {
      add(
        "PAS3_LATE",
        "rule",
        "PAS-3 filed after the 30-day period",
        `${plural(late.length, "PAS-3 was", "PAS-3 filings were")} filed late (up to ${Math.max(...late.map((l) => l.days))} days after allotment): ${listNames(late.map((l) => nameOf(l.ex.grantId)))}. Check for additional fees.`,
        {
          count: late.length,
          owner: OWNER.cs,
          refs: {
            exercises: late.slice(0, 30).map((l) => ({
              employee: nameOf(l.ex.grantId),
              daysAfterAllotment: l.days,
            })),
          },
        }
      );
    }

    if (
      noAllotment.length === 0 &&
      overdue.length === 0 &&
      late.length === 0
    ) {
      add(
        "PAS3_LATE",
        "GREEN",
        "PAS-3 filed within 30 days of allotment",
        upcoming.length > 0
          ? `${plural(onTime, "filing", "filings")} on time; ${plural(upcoming.length, "more is", "more are")} still inside the period.`
          : `${plural(onTime, "allotment", "allotments")} checked.`
      );
    }
  }

  /* ================================================================ */
  /* SH-6 / cap table consistency                                      */
  /* A cap table does not hold SH-6 entries, so this compares the      */
  /* ESOP pool row with the approved pool size.                        */
  /* ================================================================ */

  if (capTable.length === 0) {
    skipped.push("Register and cap-table consistency: no cap table imported.");
  } else if (client.approvedPoolSize === null) {
    skipped.push("Register and cap-table consistency: the approved pool size has not been entered.");
  } else {
    const poolShares = capTable
      .filter((r) => r.holderType === "ESOP_POOL")
      .reduce((sum, r) => sum + r.shares, 0);

    if (poolShares === 0) {
      add(
        "SH6_CONSISTENCY",
        "rule",
        "No ESOP pool row in the cap table",
        "The cap table has no row marked as the ESOP pool. Confirm how the pool is shown, or re-import with a holder type column.",
        { owner: OWNER.cs }
      );
    } else if (poolShares !== client.approvedPoolSize) {
      add(
        "SH6_CONSISTENCY",
        "rule",
        "Cap-table ESOP pool differs from the approved pool",
        `The cap table shows ${poolShares.toLocaleString("en-IN")} shares for the ESOP pool, but the approved pool is ${client.approvedPoolSize.toLocaleString("en-IN")}. The difference may be exercised options moved out of the pool; confirm with the company secretary.`,
        { owner: OWNER.cs, refs: { poolShares, approved: client.approvedPoolSize } }
      );
    } else {
      add(
        "SH6_CONSISTENCY",
        "GREEN",
        "Cap-table ESOP pool matches the approved pool",
        `${poolShares.toLocaleString("en-IN")} shares.`
      );
    }
  }

  /* ================================================================ */
  /* 6. Startup deferral eligibility                                   */
  /* ================================================================ */

  {
    const dpiit = client.dpiitRecognised;
    const imb = client.imbCertificate;

    const items = [
      `DPIIT recognition: ${dpiit === null ? "not answered" : dpiit ? "yes" : "no"}`,
      `Inter-Ministerial Board (80-IAC) certificate: ${imb === null ? "not answered" : imb ? "yes" : "no"}`,
      `Incorporation date: ${client.incorporationDate ? fmt(client.incorporationDate) : "not entered"}`,
      "Turnover within the limit: not captured, confirm manually",
      "Not formed by splitting up or reconstructing an existing business: not captured, confirm manually",
    ];

    if (dpiit === false || imb === false) {
      add(
        "DEFERRAL_ELIGIBILITY",
        "INFO",
        "Startup TDS deferral looks unavailable",
        `Without DPIIT recognition and the IMB certificate the deferral does not apply, so TDS falls due at exercise. ${items.join("; ")}.`,
        { owner: OWNER.firm }
      );
    } else if (dpiit === true && imb === true) {
      add(
        "DEFERRAL_ELIGIBILITY",
        "INFO",
        "Deferral: DPIIT and IMB confirmed, other conditions to confirm",
        `${items.join("; ")}. The conditions and window (48 or 60 months by allotment date) must be verified against the Act.`,
        { owner: OWNER.firm }
      );
    } else {
      add(
        "DEFERRAL_ELIGIBILITY",
        "rule",
        "Startup TDS deferral eligibility not yet assessed",
        `${items.join("; ")}.`,
        { owner: OWNER.firm }
      );
    }
  }

  /* ================================================================ */
  /* 7. Overseas parent / FEMA (manual attestation)                    */
  /* ================================================================ */

  if (client.overseasParent === true) {
    add(
      "FEMA_OVERSEAS_PARENT",
      "rule",
      "Overseas parent: confirm FEMA reporting",
      "The company has an overseas parent. FEMA treatment of ESOPs and the related reporting must be confirmed manually; the tool does not compute it.",
      { owner: OWNER.firm }
    );
  } else if (client.overseasParent === false) {
    add(
      "FEMA_OVERSEAS_PARENT",
      "GREEN",
      "No overseas parent declared",
      "Marked as having no overseas parent."
    );
  } else {
    add(
      "FEMA_OVERSEAS_PARENT",
      "INFO",
      "Overseas parent not answered",
      "Ask the company whether it has an overseas parent or holding entity.",
      { owner: OWNER.firm }
    );
  }

  /* ================================================================ */
  /* 8. Expiry radar and leavers                                       */
  /* ================================================================ */

  if (grants.length === 0) {
    skipped.push("Expiry radar and leavers: the register has no grants.");
  } else {
    const horizon = addDays(asOfDay, 365);

    const expired = grants.filter(
      (g) =>
        g.status === "ACTIVE" &&
        g.expiryDate !== null &&
        utcDay(g.expiryDate) < utcDay(asOfDay) &&
        remainingOf(g) > 0
    );

    const expiring = grants.filter(
      (g) =>
        g.status === "ACTIVE" &&
        g.expiryDate !== null &&
        utcDay(g.expiryDate) >= utcDay(asOfDay) &&
        utcDay(g.expiryDate) <= utcDay(horizon) &&
        remainingOf(g) > 0
    );

    if (expired.length > 0) {
      add(
        "EXPIRY_RADAR",
        "rule",
        "Grants past their expiry date still show unexercised options",
        `${plural(expired.length, "grant", "grants")} expired with options remaining: ${listNames(expired.map((g) => g.employeeName))}. These should be marked lapsed in the register.`,
        {
          count: expired.length,
          owner: OWNER.cs,
          refs: { rows: expired.slice(0, 30).map((g) => g.sourceRow) },
        }
      );
    }

    if (expiring.length > 0) {
      const soonest = earliest(expiring.map((g) => g.expiryDate as Date))!;
      add(
        "EXPIRY_RADAR",
        "rule",
        "Grants expiring within 12 months",
        `${plural(expiring.length, "grant expires", "grants expire")} within a year, the first on ${fmt(soonest)}: ${listNames(expiring.map((g) => g.employeeName))}. Remind the employees.`,
        {
          count: expiring.length,
          owner: OWNER.hr,
          due: soonest,
          refs: { rows: expiring.slice(0, 30).map((g) => g.sourceRow) },
        }
      );
    }

    if (expired.length === 0 && expiring.length === 0) {
      add(
        "EXPIRY_RADAR",
        "GREEN",
        "No grants expiring within 12 months",
        "Based on the expiry dates in the register."
      );
    }

    const leavers = grants.filter(
      (g) => (g.status === "LEFT" || g.leftOn !== null) && remainingOf(g) > 0
    );

    const inWindow: { g: EngineGrant; end: Date }[] = [];
    const closed: { g: EngineGrant; end: Date }[] = [];
    const cannotAssess: EngineGrant[] = [];

    for (const g of leavers) {
      if (g.leftOn === null || g.postExitExerciseDays === null) {
        cannotAssess.push(g);
        continue;
      }
      const end = addDays(g.leftOn, g.postExitExerciseDays);
      if (utcDay(asOfDay) <= utcDay(end)) inWindow.push({ g, end });
      else closed.push({ g, end });
    }

    if (inWindow.length > 0) {
      const soonest = earliest(inWindow.map((w) => w.end))!;
      add(
        "LEAVER_WINDOW",
        "rule",
        "Leavers still inside their exercise window",
        `${plural(inWindow.length, "leaver has", "leavers have")} options they can still exercise; the first window closes ${fmt(soonest)}: ${listNames(inWindow.map((w) => w.g.employeeName))}.`,
        { count: inWindow.length, owner: OWNER.hr, due: soonest }
      );
    }

    if (closed.length > 0) {
      add(
        "LEAVER_WINDOW",
        "rule",
        "Leaver exercise window closed but options still on the register",
        `${plural(closed.length, "leaver's window has", "leavers' windows have")} closed with options remaining: ${listNames(closed.map((w) => w.g.employeeName))}. Mark these lapsed.`,
        { count: closed.length, owner: OWNER.cs }
      );
    }

    if (cannotAssess.length > 0) {
      add(
        "LEAVER_WINDOW",
        "INFO",
        "Leaver window cannot be assessed",
        `${plural(cannotAssess.length, "leaver is", "leavers are")} missing a leaving date or post-exit window: ${listNames(cannotAssess.map((g) => g.employeeName))}.`,
        { count: cannotAssess.length, owner: OWNER.hr }
      );
    }
  }

  /* ================================================================ */
  /* 9. Contradiction check (register vs grant letter)                 */
  /* Letter values are not imported yet; this runs when they exist.    */
  /* ================================================================ */

  {
    const withLetter = grants.filter(
      (g) =>
        g.letterOptions !== null ||
        g.letterExercisePrice !== null ||
        g.letterGrantDate !== null
    );

    if (withLetter.length === 0) {
      skipped.push("Register vs grant-letter check: no grant-letter values have been entered.");
    } else {
      const mismatches: { name: string; what: string[] }[] = [];

      for (const g of withLetter) {
        const what: string[] = [];

        if (g.letterOptions !== null && g.letterOptions !== g.optionsGranted) {
          what.push(`options (register ${g.optionsGranted}, letter ${g.letterOptions})`);
        }
        if (
          g.letterExercisePrice !== null &&
          Math.abs(g.letterExercisePrice - g.exercisePrice) > 0.005
        ) {
          what.push(`exercise price (register ${g.exercisePrice}, letter ${g.letterExercisePrice})`);
        }
        if (
          g.letterGrantDate !== null &&
          utcDay(g.letterGrantDate) !== utcDay(g.grantDate)
        ) {
          what.push(`grant date (register ${fmt(g.grantDate)}, letter ${fmt(g.letterGrantDate)})`);
        }

        if (what.length > 0) mismatches.push({ name: g.employeeName, what });
      }

      if (mismatches.length === 0) {
        add(
          "CONTRADICTION",
          "GREEN",
          "Register agrees with the grant letters",
          `${plural(withLetter.length, "grant", "grants")} compared.`
        );
      } else {
        add(
          "CONTRADICTION",
          "rule",
          "Register and grant letters disagree",
          mismatches
            .slice(0, 10)
            .map((m) => `${m.name}: ${m.what.join("; ")}`)
            .join(" | "),
          { count: mismatches.length, owner: OWNER.hr }
        );
      }
    }
  }

  /* ================================================================ */
  /* Score and summary                                                 */
  /* ================================================================ */

  let penalty = 0;
  const summary = { red: 0, amber: 0, info: 0, green: 0 };

  for (const f of findings) {
    if (f.severity === "RED") {
      summary.red++;
      penalty += Math.min(20, 8 + 2 * (f.count - 1));
    } else if (f.severity === "AMBER") {
      summary.amber++;
      penalty += Math.min(8, 3 + (f.count - 1));
    } else if (f.severity === "INFO") {
      summary.info++;
    } else {
      summary.green++;
    }
  }

  const order: Record<FindingSeverity, number> = {
    RED: 0,
    AMBER: 1,
    INFO: 2,
    GREEN: 3,
  };

  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    asOf: isoDay(asOfDay),
    score: Math.max(0, 100 - penalty),
    summary,
    findings,
    skipped,
  };
}
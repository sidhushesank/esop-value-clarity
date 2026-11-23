/**
 * ============================================================================
 * STARTUP EQUITY DESK: EXERCISES → ALLOTMENT → FILINGS (pure functions)
 * ============================================================================
 *
 * For each exercise, the filings it creates and when they are due. Rules come
 * from secondary sources and are marked "verify" in the UI:
 *
 * India
 * - PAS-3 (return of allotment): within 30 days of allotment (Companies Act
 *   s.39(4) with Rule 12 of the Prospectus and Allotment Rules).
 * - Share certificate: within two months of allotment (s.56(4)); private
 *   companies other than small companies issue securities in demat form.
 * - TDS on the perquisite ((value per share on exercise - exercise price) x
 *   shares) under s.192 / s.392 of the Income-tax Act 2025: deducted when the
 *   shares are allotted, deposited by the 7th of the next month (30 April for
 *   March).
 * - Eligible start-ups (s.80-IAC / IMB certificate) may defer: tax is deducted
 *   within 14 days of the earliest of leaving the company, the employee's sale,
 *   or the end of the window (48 months from the end of the assessment year for
 *   allotments before 1 April 2026; 60 months from the end of the tax year for
 *   allotments from 1 April 2026).
 *
 * United States
 * - ISO exercise: Form 3921 Copy B to the employee by 31 January of the next
 *   year; Copy A to the IRS by 28 February on paper or 31 March electronically
 *   (electronic is required when the company files 10 or more information
 *   returns in total).
 * - NSO exercise: the spread is wages, withheld through payroll.
 * ============================================================================
 */

export type ExerciseFacts = {
  exerciseDate: Date;
  options: number;
  exercisePrice: number;
  fmvPerShare: number | null;
  allotmentDate: Date | null;
  pas3FiledOn: Date | null;
  shareCertificateOn: Date | null;
  tdsDeferred: boolean;
  tdsDeductedOn: Date | null;
  tdsDepositedOn: Date | null;
  form3921FurnishedOn: Date | null;
  form3921FiledOn: Date | null;
};

export type GrantFacts = {
  usOptionType: "ISO" | "NSO" | null;
  leftOn: Date | null;
};

export type ObligationStatus = "DONE" | "OVERDUE" | "DUE" | "TODO" | "INFO";

export type Obligation = {
  code: string;
  label: string;
  due: string | null;
  done: string | null;
  status: ObligationStatus;
  note: string;
};

const DAY = 86_400_000;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

export function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * DAY);
}

export function addMonths(d: Date, n: number) {
  const r = utc(d.getUTCFullYear(), d.getUTCMonth() + n, 1);
  const last = utc(r.getUTCFullYear(), r.getUTCMonth() + 1, 0).getUTCDate();
  return utc(r.getUTCFullYear(), r.getUTCMonth(), Math.min(d.getUTCDate(), last));
}

/** End of the Indian financial (tax) year containing d: 31 March. */
export function fyEnd(d: Date) {
  const y = d.getUTCMonth() >= 3 ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
  return utc(y, 2, 31);
}

/** TDS deducted in a month is deposited by the 7th of the next month; March deductions by 30 April. */
export function tdsDepositDue(deductedOn: Date) {
  if (deductedOn.getUTCMonth() === 2) return utc(deductedOn.getUTCFullYear(), 3, 30);
  return utc(deductedOn.getUTCFullYear(), deductedOn.getUTCMonth() + 1, 7);
}

export const NEW_ACT_FROM = utc(2026, 3, 1);

/** Eligible start-up deferral: the latest date tax can be deducted (14 days after the trigger). */
export function deferredTdsDeadline(allottedOn: Date, leftOn: Date | null) {
  const windowEnd =
    allottedOn.getTime() < NEW_ACT_FROM.getTime()
      ? addMonths(addMonths(fyEnd(allottedOn), 12), 48) // 48 months from the end of the assessment year
      : addMonths(fyEnd(allottedOn), 60); // 60 months from the end of the tax year
  const trigger = leftOn && leftOn.getTime() >= allottedOn.getTime() && leftOn.getTime() < windowEnd.getTime() ? leftOn : windowEnd;
  return { windowEnd, trigger, deductBy: addDays(trigger, 14), triggeredByLeaving: trigger === leftOn };
}

/** (Value per share - exercise price) x shares, never below zero. Null when the value isn't known. */
export function perquisiteOf(e: Pick<ExerciseFacts, "fmvPerShare" | "exercisePrice" | "options">) {
  if (e.fmvPerShare == null) return null;
  return Math.max(0, e.fmvPerShare - e.exercisePrice) * e.options;
}

function status(due: Date | null, done: Date | null, today: Date): ObligationStatus {
  if (done) return "DONE";
  if (!due) return "TODO";
  return due.getTime() < today.getTime() ? "OVERDUE" : "DUE";
}

function ob(code: string, label: string, due: Date | null, done: Date | null, today: Date, note: string): Obligation {
  return { code, label, due: due ? iso(due) : null, done: done ? iso(done) : null, status: status(due, done, today), note };
}

export function obligationsFor(
  e: ExerciseFacts,
  g: GrantFacts,
  jurisdiction: "IN" | "US",
  today: Date = new Date()
): Obligation[] {
  const out: Obligation[] = [];
  const spread = perquisiteOf(e);

  if (jurisdiction === "IN") {
    out.push(
      ob("ALLOT", "Allot the shares (board or committee resolution)", null, e.allotmentDate, today, "Record the allotment date and class; the cap table updates automatically.")
    );
    if (e.allotmentDate) {
      out.push(ob("PAS3", "File PAS-3 (return of allotment)", addDays(e.allotmentDate, 30), e.pas3FiledOn, today, "Within 30 days of allotment, with the list of allottees (verify)."));
      out.push(
        ob(
          "CERT",
          "Issue the share certificate / credit to demat",
          addMonths(e.allotmentDate, 2),
          e.shareCertificateOn,
          today,
          "Within two months of allotment; private companies other than small companies issue in demat form (verify)."
        )
      );
    }

    if (spread === null) {
      out.push(ob("TDS", "TDS on the perquisite", null, null, today, "Enter the value per share on the exercise date (merchant banker valuation) to work out the perquisite."));
    } else if (spread === 0) {
      out.push({ code: "TDS", label: "TDS on the perquisite", due: null, done: null, status: "INFO", note: "No perquisite: value per share is not above the exercise price." });
    } else if (e.tdsDeferred) {
      const allotted = e.allotmentDate ?? e.exerciseDate;
      const d = deferredTdsDeadline(allotted, g.leftOn);
      const deductBy = e.tdsDeductedOn ? tdsDepositDue(e.tdsDeductedOn) : d.deductBy;
      out.push(
        ob(
          "TDS",
          e.tdsDeductedOn ? "Deposit the deferred TDS" : "Deferred TDS (eligible start-up)",
          deductBy,
          e.tdsDepositedOn,
          today,
          e.tdsDeductedOn
            ? `Deducted on ${iso(e.tdsDeductedOn)}: deposit by the 7th of the next month (30 April for March).`
            : `Deduct within 14 days of the earliest of: the employee selling the shares, leaving${d.triggeredByLeaving ? ` (left on ${iso(d.trigger)})` : ""}, or ${iso(d.windowEnd)} (end of the ${
                allotted.getTime() < NEW_ACT_FROM.getTime() ? "48" : "60"
              }-month window). Only for start-ups with the IMB certificate (verify). If the employee sells earlier, record the deduction date.`
        )
      );
    } else {
      const base = e.tdsDeductedOn ?? e.allotmentDate ?? e.exerciseDate;
      out.push(
        ob(
          "TDS",
          "Deduct and deposit TDS on the perquisite",
          tdsDepositDue(base),
          e.tdsDepositedOn,
          today,
          `Perquisite is salary in the month of allotment; deposit by the 7th of the next month (30 April for March), then show it in Form 24Q and Form 16 (verify).`
        )
      );
    }
  } else {
    out.push(ob("ALLOT", "Issue the shares (board consent, stock ledger)", null, e.allotmentDate, today, "Record the issue date and class; the cap table updates automatically."));
    const nextYear = e.exerciseDate.getUTCFullYear() + 1;
    if (g.usOptionType === "ISO") {
      out.push(ob("F3921B", "Form 3921: Copy B to the employee", utc(nextYear, 0, 31), e.form3921FurnishedOn, today, "By 31 January of the year after the exercise (verify)."));
      out.push(
        ob(
          "F3921A",
          "Form 3921: Copy A to the IRS",
          utc(nextYear, 2, 31),
          e.form3921FiledOn,
          today,
          "By 31 March if filed electronically (28 February on paper). Electronic filing is required at 10 or more information returns in total (verify)."
        )
      );
    } else if (g.usOptionType === "NSO") {
      out.push({
        code: "NSO",
        label: "NSO spread is wages",
        due: null,
        done: null,
        status: "INFO",
        note:
          spread === null
            ? "Enter the fair market value on the exercise date: the spread is wages on Form W-2, with income tax and FICA withheld through payroll (verify)."
            : `Spread ${spread.toFixed(2)} is wages on Form W-2: withhold income tax and FICA through payroll (verify).`,
      });
    } else {
      out.push({ code: "TYPE", label: "Set the option type", due: null, done: null, status: "TODO", note: "Set ISO or NSO on the grant to see the filings this exercise needs." });
    }
  }
  return out;
}

/** Options a holder can still exercise on `on`: vested (frozen at leaving) minus already exercised. */
export function exercisableOn(vestedAt: (d: Date) => number, on: Date, leftOn: Date | null, alreadyExercised: number) {
  const vestDate = leftOn && leftOn.getTime() < on.getTime() ? leftOn : on;
  return Math.max(0, vestedAt(vestDate) - alreadyExercised);
}

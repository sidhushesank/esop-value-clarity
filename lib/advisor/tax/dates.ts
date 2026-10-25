/**
 * Date helpers for the Tax-Event Ledger.
 *
 * Every date in the ledger is a calendar day held at UTC midnight (this is
 * what Prisma returns for `@db.Date` columns). Nothing here reads the clock;
 * callers pass `asOf` in.
 */

const DAY_MS = 86_400_000;

export function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

export function startOfUtcDay(d: Date): Date {
  return utcDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

/** Whole calendar days from `a` to `b` (negative when `b` is earlier). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfUtcDay(b).getTime() - startOfUtcDay(a).getTime()) / DAY_MS);
}

/** Adds calendar months, clamping the day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(d: Date, months: number): Date {
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + months;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return utcDate(year, month, Math.min(d.getUTCDate(), lastDay));
}

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseIsoDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** The year in which the financial year containing `d` ends (31 March). */
export function fyEndYear(d: Date): number {
  return d.getUTCMonth() >= 3 ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
}

/** "2026-27" for any date from 1 Apr 2026 to 31 Mar 2027. */
export function fyLabel(endYear: number): string {
  return `${endYear - 1}-${String(endYear).slice(2)}`;
}

export function fyOf(d: Date): { endYear: number; label: string; start: Date; end: Date } {
  const endYear = fyEndYear(d);
  return {
    endYear,
    label: fyLabel(endYear),
    start: utcDate(endYear - 1, 3, 1),
    end: utcDate(endYear, 2, 31),
  };
}

/** Parses "2026-27" into the year the FY ends (2027). */
export function parseFyLabel(label: string): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(label.trim());
  if (!m) return null;

  const start = Number(m[1]);
  const end = Number(m[2]);

  if ((start + 1) % 100 !== end) return null;
  return start + 1;
}

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

/** Quarter of the financial year that contains `d`. */
export function quarterOf(d: Date): Quarter {
  const m = d.getUTCMonth();
  if (m >= 3 && m <= 5) return "Q1";
  if (m >= 6 && m <= 8) return "Q2";
  if (m >= 9 && m <= 11) return "Q3";
  return "Q4";
}

/** Due date of the quarterly TDS return for the quarter containing `d`. */
export function quarterlyReturnDue(d: Date): { quarter: Quarter; dueDate: Date } {
  const quarter = quarterOf(d);
  const y = d.getUTCFullYear();

  switch (quarter) {
    case "Q1":
      return { quarter, dueDate: utcDate(y, 6, 31) }; // 31 July
    case "Q2":
      return { quarter, dueDate: utcDate(y, 9, 31) }; // 31 October
    case "Q3":
      return { quarter, dueDate: utcDate(y + 1, 0, 31) }; // 31 January next year
    default:
      return { quarter, dueDate: utcDate(y, 4, 31) }; // 31 May
  }
}

/** Last day of the quarter containing `d`. */
export function quarterEnd(d: Date): Date {
  const q = quarterOf(d);
  const fy = fyOf(d);

  switch (q) {
    case "Q1":
      return utcDate(fy.endYear - 1, 5, 30);
    case "Q2":
      return utcDate(fy.endYear - 1, 8, 30);
    case "Q3":
      return utcDate(fy.endYear - 1, 11, 31);
    default:
      return utcDate(fy.endYear, 2, 31);
  }
}

/**
 * Deposit date for tax deducted in the month of `d`: the 7th of the next
 * month, except March deductions, which are due by 30 April.
 */
export function tdsDepositDue(d: Date): Date {
  if (d.getUTCMonth() === 2) return utcDate(d.getUTCFullYear(), 3, 30);
  return utcDate(d.getUTCFullYear(), d.getUTCMonth() + 1, 7);
}

/** Form 16 is due on 15 June after the financial year ends. */
export function form16Due(fyEnd: number): Date {
  return utcDate(fyEnd, 5, 15);
}

export function earliest(dates: (Date | null | undefined)[]): Date | null {
  let best: Date | null = null;

  for (const d of dates) {
    if (!d) continue;
    if (!best || d.getTime() < best.getTime()) best = d;
  }

  return best;
}
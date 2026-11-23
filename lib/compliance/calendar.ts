/**
 * ============================================================================
 * COMPLIANCE CALENDAR (pure functions: no database, no sending)
 * ============================================================================
 * One list of dated to-dos across the Startup Equity Desk and the Advisor
 * Console. Each item has a stable key, so "done" marks and sent reminders
 * survive recalculation. Rules come from secondary sources: "verify".
 * ============================================================================
 */

export type Category = "MCA" | "TAX" | "ESOP" | "VALUATION";
export type ItemStatus = "DONE" | "OVERDUE" | "DUE_SOON" | "UPCOMING";

export type CalendarItem = {
  key: string;
  category: Category;
  /** Company, client or individual the item belongs to. */
  subject: string;
  title: string;
  detail: string;
  due: string; // YYYY-MM-DD
  /** Done date from the source record (e.g. PAS-3 filed on), else from a manual mark. */
  done: string | null;
  /** Where to go to deal with it. */
  href: string;
  /** Already covered by the Advisor Console's own TDS reminders: not emailed again. */
  remindedElsewhere?: boolean;
  status?: ItemStatus;
};

const DAY = 86_400_000;
export const REMINDER_STEPS = [30, 7, 1, 0] as const;

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export const utcDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
export function addMonths(d: Date, n: number) {
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth(), Math.min(d.getUTCDate(), last)));
}
export const daysUntil = (due: string, today: Date) => Math.round((new Date(`${due}T00:00:00Z`).getTime() - utcDay(today).getTime()) / DAY);

export function statusOf(item: Pick<CalendarItem, "due" | "done">, today: Date): ItemStatus {
  if (item.done) return "DONE";
  const left = daysUntil(item.due, today);
  if (left < 0) return "OVERDUE";
  if (left <= 30) return "DUE_SOON";
  return "UPCOMING";
}

/** Applies manual "done" marks, sets status and sorts (overdue first, then by date). */
export function finalise(items: CalendarItem[], manualDone: Map<string, string>, today: Date) {
  const out = items.map((i) => {
    const done = i.done ?? manualDone.get(i.key) ?? null;
    return { ...i, done, status: statusOf({ due: i.due, done }, today) };
  });
  const rank: Record<ItemStatus, number> = { OVERDUE: 0, DUE_SOON: 1, UPCOMING: 2, DONE: 3 };
  return out.sort((a, b) => rank[a.status] - rank[b.status] || a.due.localeCompare(b.due) || a.subject.localeCompare(b.subject));
}

/** The reminder step reached today (30, 7, 1 or 0 days), or null. Overdue up to 7 days still counts as 0. */
export function reminderStep(due: string, today: Date): number | null {
  const left = daysUntil(due, today);
  if (left < -7) return null;
  if (left <= 0) return 0;
  const reached = REMINDER_STEPS.filter((s) => left <= s);
  return reached.length ? Math.min(...reached) : null;
}

/* ------------------------------------------------------------------ */
/* India: individual's foreign-equity tax dates                        */
/* ------------------------------------------------------------------ */

/** Financial year label "2025-26" -> dates. */
export function fyBounds(fy: string) {
  const start = Number(fy.slice(0, 4));
  return { start: new Date(Date.UTC(start, 3, 1)), end: new Date(Date.UTC(start + 1, 2, 31)), startYear: start };
}

export function fyLabelOf(d: Date) {
  const y = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return `${y}-${String(y + 1).slice(2)}`;
}

/**
 * Advance tax instalments for income that arose during the year: 15 Jun,
 * 15 Sep, 15 Dec, 15 Mar. Capital gains and dividends arising after an
 * instalment date are covered by the later instalments (interest relief);
 * income arising after 15 March is paid by 31 March (verify).
 */
export function advanceTaxDates(fy: string, firstIncome: Date) {
  const { startYear } = fyBounds(fy);
  const all = [
    { date: new Date(Date.UTC(startYear, 5, 15)), share: "15%" },
    { date: new Date(Date.UTC(startYear, 8, 15)), share: "45%" },
    { date: new Date(Date.UTC(startYear, 11, 15)), share: "75%" },
    { date: new Date(Date.UTC(startYear + 1, 2, 15)), share: "100%" },
  ];
  const left = all.filter((a) => a.date.getTime() >= utcDay(firstIncome).getTime());
  return left.length ? left : [{ date: new Date(Date.UTC(startYear + 1, 2, 31)), share: "100%" }];
}

/** Return due date for individuals without a tax audit: 31 July after the year (verify each year for extensions). */
export function itrDueDate(fy: string) {
  return new Date(Date.UTC(fyBounds(fy).startYear + 1, 6, 31));
}

/* ------------------------------------------------------------------ */
/* Calendar file (.ics) for Google / Outlook / Apple Calendar          */
/* ------------------------------------------------------------------ */

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildIcs(calendarName: string, items: CalendarItem[], siteUrl: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ESOP Value Clarity//Compliance calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${icsEscape(calendarName)}`),
  ];
  for (const i of items) {
    if (i.done) continue;
    const day = i.due.replace(/-/g, "");
    const next = isoDay(addDays(new Date(`${i.due}T00:00:00Z`), 1)).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:${icsEscape(i.key)}@esopvalueclarity.com`),
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${next}`,
      fold(`SUMMARY:${icsEscape(`${i.title} · ${i.subject}`)}`),
      fold(`DESCRIPTION:${icsEscape(`${i.detail}\n${siteUrl}${i.href}`)}`),
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-P7D",
      fold(`DESCRIPTION:${icsEscape(i.title)}`),
      "END:VALARM",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/* ------------------------------------------------------------------ */
/* Reminder email                                                      */
/* ------------------------------------------------------------------ */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function buildDigest(ownerName: string, items: (CalendarItem & { step: number })[], siteUrl: string, calendarPath: string, today: Date) {
  const overdue = items.filter((i) => daysUntil(i.due, today) < 0).length;
  const subject = `${overdue ? `${overdue} overdue · ` : ""}${items.length} compliance date${items.length > 1 ? "s" : ""} coming up · ${ownerName}`;
  const when = (i: CalendarItem) => {
    const d = daysUntil(i.due, today);
    return d < 0 ? `overdue by ${-d} day${d === -1 ? "" : "s"}` : d === 0 ? "due today" : `due in ${d} day${d === 1 ? "" : "s"}`;
  };
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;white-space:nowrap;font-weight:700;color:${daysUntil(i.due, today) < 0 ? "#b91c1c" : "#111827"}">${esc(
          i.due
        )}<br><span style="font-weight:400;font-size:12px;color:#6b7280">${esc(when(i))}</span></td><td style="padding:8px 10px;border-bottom:1px solid #e5e7eb"><b>${esc(i.title)}</b><br><span style="font-size:13px;color:#374151">${esc(
          i.subject
        )}</span><br><span style="font-size:12px;color:#6b7280">${esc(i.detail)}</span></td></tr>`
    )
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827">
<h2 style="color:#12203f;margin-bottom:4px">Compliance dates for ${esc(ownerName)}</h2>
<p style="color:#4b5563;margin-top:0">These dates have reached a reminder point (30, 7 or 1 day before, or due).</p>
<table style="border-collapse:collapse;width:100%">${rows}</table>
<p style="margin-top:18px"><a href="${siteUrl}${calendarPath}" style="background:#12203f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Open the calendar</a></p>
<p style="font-size:12px;color:#6b7280">Mark an item done in the calendar to stop its reminders. Dates come from secondary sources: verify with your CS or CA. ESOP Value Clarity.</p></div>`;
  const text = [
    `Compliance dates for ${ownerName}`,
    "",
    ...items.map((i) => `${i.due} (${when(i)}): ${i.title} · ${i.subject}\n  ${i.detail}`),
    "",
    `Open the calendar: ${siteUrl}${calendarPath}`,
  ].join("\n");
  return { subject, html, text };
}

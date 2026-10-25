/**
 * Deadline reminders: which ones are due today, and the email text.
 * Pure (no database, no sending); the cron route supplies the clock,
 * the sent-log and the transport.
 */

import { daysBetween, isoDay, startOfUtcDay } from "./dates";
import { REMINDER_OFFSETS_DAYS } from "./rules";

export type ReminderCandidate = {
  clientId: string;
  clientName: string;
  deadlineKey: string;
  offsetDays: number;
  daysLeft: number;
  label: string;
  employeeName: string;
  dueDate: Date;
  owner: string;
};

export type DeadlineLike = {
  code: string;
  label: string;
  dueDate: Date;
  owner: string;
  eventId: string | null;
  employeeId: string;
  employeeName: string;
};

export function deadlineKey(d: DeadlineLike): string {
  return `${d.eventId ?? d.employeeId}:${d.code}:${isoDay(d.dueDate)}`;
}

/**
 * The most urgent reminder step already reached for a deadline, or null.
 * Overdue by up to 7 days still counts as step 0 so a missed cron day
 * does not silence a deadline.
 */
export function reminderStep(dueDate: Date, asOf: Date): number | null {
  const left = daysBetween(startOfUtcDay(asOf), dueDate);

  if (left < -7) return null;
  if (left <= 0) return 0;

  const reached = REMINDER_OFFSETS_DAYS.filter((o) => left <= o);
  return reached.length ? Math.min(...reached) : null;
}

export function findReminders(
  clientId: string,
  clientName: string,
  deadlines: DeadlineLike[],
  asOf: Date,
  alreadySent: Set<string>
): ReminderCandidate[] {
  const out: ReminderCandidate[] = [];

  for (const d of deadlines) {
    const step = reminderStep(d.dueDate, asOf);
    if (step === null) continue;

    const key = deadlineKey(d);
    if (alreadySent.has(`${key}|${step}`)) continue;

    out.push({
      clientId,
      clientName,
      deadlineKey: key,
      offsetDays: step,
      daysLeft: daysBetween(startOfUtcDay(asOf), d.dueDate),
      label: d.label,
      employeeName: d.employeeName,
      dueDate: d.dueDate,
      owner: d.owner,
    });
  }

  return out;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function when(daysLeft: number): string {
  if (daysLeft < 0) return `overdue by ${-daysLeft} day${daysLeft === -1 ? "" : "s"}`;
  if (daysLeft === 0) return "due today";
  if (daysLeft === 1) return "due tomorrow";
  return `due in ${daysLeft} days`;
}

export function buildReminderEmail(
  brand: string,
  items: ReminderCandidate[]
): { subject: string; html: string; text: string } {
  const sorted = [...items].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const urgent = sorted.filter((i) => i.daysLeft <= 1).length;

  const subject =
    urgent > 0
      ? `${urgent} ESOP tax deadline${urgent === 1 ? "" : "s"} due now (${sorted.length} upcoming)`
      : `${sorted.length} upcoming ESOP tax deadline${sorted.length === 1 ? "" : "s"}`;

  const text =
    `${brand}: ESOP tax deadlines\n\n` +
    sorted
      .map(
        (i) =>
          `- ${isoDay(i.dueDate)} (${when(i.daysLeft)}) | ${i.clientName} | ${i.employeeName}\n  ${i.label}\n  Owner: ${i.owner}`
      )
      .join("\n") +
    "\n\nDates and amounts are estimates for professional review, not tax advice.";

  const rows = sorted
    .map(
      (i) => `<tr>
<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap">${esc(isoDay(i.dueDate))}<br><span style="color:${i.daysLeft <= 1 ? "#b42318" : "#64748b"};font-size:12px">${esc(when(i.daysLeft))}</span></td>
<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0"><strong>${esc(i.clientName)}</strong><br><span style="color:#64748b;font-size:12px">${esc(i.employeeName)}</span></td>
<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${esc(i.label)}<br><span style="color:#64748b;font-size:12px">Owner: ${esc(i.owner)}</span></td>
</tr>`
    )
    .join("");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:680px">
<h2 style="margin:0 0 4px">${esc(brand)}</h2>
<p style="margin:0 0 16px;color:#475569">ESOP tax deadlines needing attention</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
<p style="margin-top:16px;color:#64748b;font-size:12px">Dates and amounts are estimates for professional review, not tax advice.</p>
</div>`;

  return { subject, html, text };
}
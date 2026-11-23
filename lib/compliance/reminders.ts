import { prisma } from "@/lib/prisma";
import { sendAdvisorReminderEmail } from "@/lib/mail";
import { buildDigest, reminderStep, type CalendarItem } from "@/lib/compliance/calendar";
import { collectDesk, collectFirm } from "@/lib/compliance/collect";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://esopvalueclarity.com";

type Scope = "COMPANY" | "ADVISOR";

/** Items that reached a reminder step today and weren't sent at that step yet. */
async function due(scope: Scope, ownerId: string, items: CalendarItem[], today: Date) {
  const steps = items
    .filter((i) => i.status !== "DONE" && !i.remindedElsewhere)
    .map((i) => ({ ...i, step: reminderStep(i.due, today) }))
    .filter((i): i is CalendarItem & { step: number } => i.step !== null);
  if (!steps.length) return [];
  const sent = await prisma.complianceReminderLog.findMany({
    where: { scope, ownerId, itemKey: { in: steps.map((s) => s.key) } },
    select: { itemKey: true, offsetDays: true },
  });
  const seen = new Set(sent.map((s) => `${s.itemKey}|${s.offsetDays}`));
  return steps.filter((s) => !seen.has(`${s.key}|${s.step}`));
}

async function sendAndLog(scope: Scope, ownerId: string, ownerName: string, to: string, path: string, items: (CalendarItem & { step: number })[], today: Date) {
  const mail = buildDigest(ownerName, items, SITE, path, today);
  await sendAdvisorReminderEmail(to, mail.subject, mail.html, mail.text);
  await prisma.complianceReminderLog.createMany({
    data: items.map((i) => ({ scope, ownerId, itemKey: i.key, offsetDays: i.step, sentTo: to })),
    skipDuplicates: true,
  });
}

/**
 * Daily (called from the existing cron): one digest per company and per
 * advisor firm. A failed send logs nothing, so it is retried tomorrow.
 */
export async function sendComplianceReminders(now = new Date()) {
  let emails = 0;
  let items = 0;
  let failures = 0;

  const workspaces = await prisma.companyWorkspace.findMany({
    where: { status: "ACTIVE", expiresAt: { gt: now } },
    select: { id: true, name: true, jurisdiction: true, fmvValuationDate: true, owner: { select: { email: true } } },
  });
  for (const w of workspaces) {
    try {
      const list = await due("COMPANY", w.id, await collectDesk(w, now), now);
      if (!list.length) continue;
      await sendAndLog("COMPANY", w.id, w.name, w.owner.email, "/company?tab=CALENDAR", list, now);
      emails += 1;
      items += list.length;
    } catch (error) {
      failures += 1;
      console.error("[compliance-reminders] company failed", w.id, error);
    }
  }

  const firms = await prisma.advisorFirm.findMany({
    where: { status: "ACTIVE", expiresAt: { gt: now } },
    select: { id: true, name: true, brandName: true, reminderEmail: true, owner: { select: { email: true } } },
  });
  for (const f of firms) {
    try {
      const list = await due("ADVISOR", f.id, await collectFirm(f, now), now);
      if (!list.length) continue;
      await sendAndLog("ADVISOR", f.id, f.brandName || f.name, f.reminderEmail || f.owner.email, "/advisor/calendar", list, now);
      emails += 1;
      items += list.length;
    } catch (error) {
      failures += 1;
      console.error("[compliance-reminders] firm failed", f.id, error);
    }
  }

  return { emails, items, failures };
}

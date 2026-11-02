import { prisma } from "@/lib/prisma";
import { sendStartupPlanEmail } from "@/lib/company-billing-mail";

/**
 * Startup plan ending notice: once per term, 14 days before access lapses.
 * Called from the existing daily cron (/api/cron/tax-reminders) so no new
 * cron job is needed. The EVC owner's workspace ends in 2099 and never matches.
 */
export async function sendStartupPlanEndingReminders(now = new Date()) {
  let sent = 0;
  let failures = 0;

  const ending = await prisma.companyWorkspace.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: now, lte: new Date(now.getTime() + 14 * 86_400_000) },
    },
    select: {
      id: true,
      name: true,
      holderLimit: true,
      expiresAt: true,
      expiryReminderFor: true,
      owner: { select: { email: true, name: true } },
    },
  });

  for (const ws of ending) {
    if (ws.expiryReminderFor && ws.expiryReminderFor.getTime() === ws.expiresAt.getTime()) {
      continue;
    }

    const ok = await sendStartupPlanEmail({
      to: ws.owner.email,
      kind: "ENDING_SOON",
      ownerName: ws.owner.name,
      companyName: ws.name,
      expiresAt: ws.expiresAt,
      holderLimit: ws.holderLimit,
    });

    if (!ok) {
      failures += 1;
      continue;
    }

    await prisma.companyWorkspace.update({
      where: { id: ws.id },
      data: { expiryReminderFor: ws.expiresAt },
    });
    sent += 1;
  }

  return { sent, failures };
}

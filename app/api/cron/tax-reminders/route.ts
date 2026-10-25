import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendAdvisorReminderEmail } from "@/lib/mail";
import { sendAdvisorPlanEmail } from "@/lib/advisor-billing-mail";
import { computeClientLedger, dayStart } from "@/lib/advisor/tax/ledger-data";
import {
  buildReminderEmail,
  findReminders,
  type ReminderCandidate,
} from "@/lib/advisor/tax/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  const a = Buffer.from(header);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Daily job (see vercel.json). One email per firm listing every deadline
 * that has reached a reminder step (30, 7, 1 days, or due/overdue) and was
 * not already sent. Founder's firm is included like any other.
 */
export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const now = new Date();
  const asOf = dayStart(now);

  const firms = await prisma.advisorFirm.findMany({
    where: { status: "ACTIVE", expiresAt: { gt: now } },
    select: {
      id: true,
      name: true,
      brandName: true,
      reminderEmail: true,
      owner: { select: { email: true } },
      clients: {
        where: { archivedAt: null },
        select: { id: true, name: true },
      },
    },
  });

  let emails = 0;
  let reminders = 0;
  let failures = 0;

  for (const firm of firms) {
    const items: ReminderCandidate[] = [];

    for (const client of firm.clients) {
      try {
        const ledger = await computeClientLedger(client.id, asOf);
        if (ledger.deadlines.length === 0) continue;

        const logs = await prisma.taxReminderLog.findMany({
          where: { clientId: client.id, status: "SENT" },
          select: { deadlineKey: true, offsetDays: true },
        });

        const sent = new Set(logs.map((l) => `${l.deadlineKey}|${l.offsetDays}`));

        items.push(
          ...findReminders(client.id, client.name, ledger.deadlines, asOf, sent)
        );
      } catch (error) {
        failures += 1;
        console.error("[tax-reminders] client failed:", client.id, error);
      }
    }

    if (items.length === 0) continue;

    const to = firm.reminderEmail || firm.owner.email;
    const mail = buildReminderEmail(firm.brandName || firm.name, items);

    try {
      await sendAdvisorReminderEmail(to, mail.subject, mail.html, mail.text);
    } catch (error) {
      // Nothing is logged, so the same reminders are tried again tomorrow.
      failures += 1;
      console.error("[tax-reminders] send failed for firm:", firm.id, error);
      continue;
    }

    await prisma.taxReminderLog.createMany({
      data: items.map((i) => ({
        clientId: i.clientId,
        deadlineKey: i.deadlineKey,
        offsetDays: i.offsetDays,
        sentTo: to,
        status: "SENT" as const,
      })),
      skipDuplicates: true,
    });

    emails += 1;
    reminders += items.length;
  }

  // Plan-ending notice: once per term, 14 days before access lapses.
  // (Founder's firm ends in 2099, so it never matches.)
  let expiryEmails = 0;

  const ending = await prisma.advisorFirm.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: {
        gt: now,
        lte: new Date(now.getTime() + 14 * 86_400_000),
      },
    },
    select: {
      id: true,
      name: true,
      clientLimit: true,
      expiresAt: true,
      expiryReminderFor: true,
      owner: { select: { email: true, name: true } },
    },
  });

  for (const firm of ending) {
    if (
      firm.expiryReminderFor &&
      firm.expiryReminderFor.getTime() === firm.expiresAt.getTime()
    ) {
      continue;
    }

    const sent = await sendAdvisorPlanEmail({
      to: firm.owner.email,
      kind: "ENDING_SOON",
      ownerName: firm.owner.name,
      firmName: firm.name,
      expiresAt: firm.expiresAt,
      clientLimit: firm.clientLimit,
    });

    if (!sent) {
      failures += 1;
      continue;
    }

    await prisma.advisorFirm.update({
      where: { id: firm.id },
      data: { expiryReminderFor: firm.expiresAt },
    });
    expiryEmails += 1;
  }

  return NextResponse.json({
    success: true,
    firms: firms.length,
    emails,
    reminders,
    expiryEmails,
    failures,
  });
}

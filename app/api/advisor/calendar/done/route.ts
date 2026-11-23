import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { logAdvisorChange } from "@/lib/change-log";
import { markDoneSchema } from "@/lib/compliance/done-schema";

/** POST { key, done }: mark a calendar item done (stops its reminders) or undo that. */
export async function POST(request: Request) {
  try {
    const ctx = await requireAdvisorFirm({ write: true });
    const parsed = markDoneSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const { key, done, doneOn, title, subject } = parsed.data;
    if (done) {
      const on = new Date(`${doneOn ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
      await prisma.complianceDone.upsert({
        where: { ownerId_itemKey: { ownerId: ctx.firm.id, itemKey: key } },
        update: { doneOn: on, userId: ctx.user.id },
        create: { scope: "ADVISOR", ownerId: ctx.firm.id, itemKey: key, doneOn: on, userId: ctx.user.id },
      });
    } else {
      await prisma.complianceDone.deleteMany({ where: { ownerId: ctx.firm.id, itemKey: key } });
    }
    await logAdvisorChange(ctx, null, {
      action: done ? "calendar.done" : "calendar.undone",
      entityType: "calendar",
      entityId: key.slice(0, 190),
      summary: `${done ? "Marked done" : "Reopened"}: ${title ?? key}${subject ? ` (${subject})` : ""}.`.slice(0, 500),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

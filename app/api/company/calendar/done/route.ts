import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse, validationError } from "@/lib/company-http";
import { logCompanyChange } from "@/lib/change-log";
import { markDoneSchema } from "@/lib/compliance/done-schema";

/** POST { key, done }: mark a calendar item done (stops its reminders) or undo that. */
export async function POST(request: Request) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const parsed = markDoneSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const { key, done, doneOn, title, subject } = parsed.data;
    if (done) {
      const on = new Date(`${doneOn ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
      await prisma.complianceDone.upsert({
        where: { ownerId_itemKey: { ownerId: workspace.id, itemKey: key } },
        update: { doneOn: on, userId: user.id },
        create: { scope: "COMPANY", ownerId: workspace.id, itemKey: key, doneOn: on, userId: user.id },
      });
    } else {
      await prisma.complianceDone.deleteMany({ where: { ownerId: workspace.id, itemKey: key } });
    }
    await logCompanyChange({ user, workspace }, {
      action: done ? "calendar.done" : "calendar.undone",
      entityType: "calendar",
      entityId: key.slice(0, 190),
      summary: `${done ? "Marked done" : "Reopened"}: ${title ?? key}${subject ? ` (${subject})` : ""}.`.slice(0, 500),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

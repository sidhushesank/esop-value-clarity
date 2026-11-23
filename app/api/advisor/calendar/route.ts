import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { collectFirm } from "@/lib/compliance/collect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET: every dated compliance item across the firm's client companies and individuals. */
export async function GET() {
  try {
    const { firm, role } = await requireAdvisorFirm();
    const [items, info] = await Promise.all([
      collectFirm(firm),
      prisma.advisorFirm.findUnique({ where: { id: firm.id }, select: { reminderEmail: true, owner: { select: { email: true } } } }),
    ]);
    return NextResponse.json({
      success: true,
      items,
      canEdit: role !== "VIEWER",
      reminderEmail: info?.reminderEmail || info?.owner.email || null,
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

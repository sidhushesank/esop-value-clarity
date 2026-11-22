import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { logAdvisorChange } from "@/lib/change-log";

type RouteContext = {
  params: Promise<{ clientId: string; id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { firm, user } = await requireAdvisorFirm();
    const { clientId, id } = await params;
    await requireClientInFirm(firm.id, clientId);

    const result = await prisma.clientValuation.deleteMany({
      where: { id, clientId },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, code: "NOT_FOUND", message: "Valuation not found." },
        { status: 404 }
      );
    }

    await logAdvisorChange({ user, firm }, clientId, {
      action: "valuation.deleted",
      entityType: "valuation",
      entityId: id,
      summary: "Deleted a valuation record.",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
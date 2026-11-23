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
    const { firm, user } = await requireAdvisorFirm({ write: true });
    const { clientId, id } = await params;
    await requireClientInFirm(firm.id, clientId);

    const result = await prisma.clientResolution.deleteMany({
      where: { id, clientId },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, code: "NOT_FOUND", message: "Resolution not found." },
        { status: 404 }
      );
    }

    await logAdvisorChange({ user, firm }, clientId, {
      action: "resolution.deleted",
      entityType: "resolution",
      entityId: id,
      summary: "Deleted a scheme approval record.",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
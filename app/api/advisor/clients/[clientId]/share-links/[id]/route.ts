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

    const result = await prisma.shareLink.updateMany({
      where: { id, clientId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          success: false,
          code: "NOT_FOUND",
          message: "Link not found or already revoked.",
        },
        { status: 404 }
      );
    }

    await logAdvisorChange({ user, firm }, clientId, {
      action: "sharelink.revoked",
      entityType: "sharelink",
      entityId: id,
      summary: "Turned off a client share link.",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
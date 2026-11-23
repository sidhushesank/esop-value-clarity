import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { logAdvisorChange } from "@/lib/change-log";
import { requireFxClient } from "@/lib/fx/data";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ fxClientId: string; txnId: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await requireAdvisorFirm({ write: true });
    const { fxClientId, txnId } = await params;
    const client = await requireFxClient(ctx.firm.id, fxClientId);
    const txn = await prisma.fxTransaction.findFirst({ where: { id: txnId, clientId: client.id } });
    if (!txn) {
      return NextResponse.json({ success: false, code: "NOT_FOUND", message: "Transaction not found." }, { status: 404 });
    }
    await prisma.fxTransaction.delete({ where: { id: txn.id } });
    await logAdvisorChange(ctx, client.id, {
      action: "fx.txn.deleted",
      entityType: "fx",
      entityId: txn.id,
      summary: `Deleted a ${txn.type.toLowerCase().replace("_", " ")} of ${txn.symbol} on ${txn.date.toISOString().slice(0, 10)} for "${client.name}".`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

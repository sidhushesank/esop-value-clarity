import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { logAdvisorChange } from "@/lib/change-log";
import { requireFxClient } from "@/lib/fx/data";
import { FX_MAX_ROWS } from "@/lib/fx/import";
import { fxTxnSchema, validationError } from "@/lib/fx/schemas";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ fxClientId: string }> };

const LABEL: Record<string, string> = {
  VEST: "vest",
  BUY: "purchase",
  SELL: "sale",
  DIVIDEND: "dividend",
  TAX_WITHHELD: "tax withheld",
};

/** POST: add one transaction by hand. */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const ctx = await requireAdvisorFirm({ write: true });
    const { fxClientId } = await params;
    const client = await requireFxClient(ctx.firm.id, fxClientId);
    const parsed = fxTxnSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json(validationError(parsed.error.issues[0]?.message), { status: 400 });

    const count = await prisma.fxTransaction.count({ where: { clientId: client.id } });
    if (count >= FX_MAX_ROWS) {
      return NextResponse.json(
        { success: false, code: "FX_TXN_LIMIT", message: `A client can have up to ${FX_MAX_ROWS} transactions.` },
        { status: 400 }
      );
    }

    const v = parsed.data;
    const shares = v.type === "VEST" || v.type === "BUY" || v.type === "SELL";
    const txn = await prisma.fxTransaction.create({
      data: {
        firmId: ctx.firm.id,
        clientId: client.id,
        type: v.type,
        date: new Date(`${v.date}T00:00:00.000Z`),
        symbol: v.symbol.toUpperCase().replace(/\s+/g, ""),
        company: v.company || null,
        broker: v.broker || null,
        account: v.account || null,
        quantity: shares ? Math.abs(v.quantity ?? 0) : 0,
        priceUsd: shares && v.priceUsd ? Math.abs(v.priceUsd) : null,
        amountUsd: shares ? null : Math.abs(v.amountUsd ?? 0),
        feesUsd: v.feesUsd ? Math.abs(v.feesUsd) : null,
        currency: (v.currency || "USD").toUpperCase(),
        lotRef: v.lotRef || null,
        costInrPerShare: v.costInrPerShare ?? null,
        fmvCost: v.type === "BUY" && Boolean(v.fmvCost),
        source: "manual",
      },
    });
    await logAdvisorChange(ctx, client.id, {
      action: "fx.txn.added",
      entityType: "fx",
      entityId: txn.id,
      summary: `Added a ${LABEL[txn.type]} of ${txn.symbol} on ${v.date} for "${client.name}".`,
      details: { quantity: txn.quantity || undefined, priceUsd: txn.priceUsd ?? undefined, amountUsd: txn.amountUsd ?? undefined },
    });
    return NextResponse.json({ success: true, transaction: txn }, { status: 201 });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

/** DELETE ?all=1: remove every transaction (to re-import from scratch). */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const ctx = await requireAdvisorFirm({ write: true });
    const { fxClientId } = await params;
    const client = await requireFxClient(ctx.firm.id, fxClientId);
    if (new URL(request.url).searchParams.get("all") !== "1") {
      return NextResponse.json(validationError("Add ?all=1 to remove every transaction."), { status: 400 });
    }
    const { count } = await prisma.fxTransaction.deleteMany({ where: { clientId: client.id } });
    await logAdvisorChange(ctx, client.id, {
      action: "fx.txn.cleared",
      entityType: "fx",
      entityId: client.id,
      summary: `Removed all ${count} transactions for "${client.name}".`,
    });
    return NextResponse.json({ success: true, removed: count });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

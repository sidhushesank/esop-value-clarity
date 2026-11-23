import { NextResponse } from "next/server";

import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { loadTransactions, requireFxClient } from "@/lib/fx/data";
import { ensureMarketData } from "@/lib/fx/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST: fetch SBI rates and share prices for this client now (at most every 5 minutes per source). */
export async function POST(_request: Request, { params }: { params: Promise<{ fxClientId: string }> }) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { fxClientId } = await params;
    const client = await requireFxClient(firm.id, fxClientId);
    const txns = await loadTransactions(client.id);
    const dataStatus = await ensureMarketData(txns, true);
    return NextResponse.json({ success: true, dataStatus });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

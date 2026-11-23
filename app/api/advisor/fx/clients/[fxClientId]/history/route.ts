import { NextResponse } from "next/server";

import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { listChanges } from "@/lib/change-log";
import { requireFxClient } from "@/lib/fx/data";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ fxClientId: string }> };

/** GET: one individual client's change history, newest first. */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { fxClientId } = await params;
    await requireFxClient(firm.id, fxClientId);
    const url = new URL(request.url);
    const result = await listChanges(
      { scope: "ADVISOR", firmId: firm.id, clientId: fxClientId },
      { before: url.searchParams.get("before"), entityType: null }
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

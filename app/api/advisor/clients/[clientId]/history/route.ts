import { NextResponse } from "next/server";

import { requireAdvisorFirm, requireClientInFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { listChanges } from "@/lib/change-log";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ clientId: string }> };

const TYPES = new Set([
  "client",
  "import",
  "resolution",
  "valuation",
  "diligence",
  "sharelink",
  "tax_employee",
  "tax_event",
]);

/** GET: one client's change history, newest first. */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;
    await requireClientInFirm(firm.id, clientId);

    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    const result = await listChanges(
      { scope: "ADVISOR", firmId: firm.id, clientId },
      { before: url.searchParams.get("before"), entityType: type && TYPES.has(type) ? type : null }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

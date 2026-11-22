import { NextResponse } from "next/server";

import { requireAdvisorFirm, requireClientInFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { listChanges } from "@/lib/change-log";
import { buildChangeLogWorkbook, changeLogFileName } from "@/lib/change-log-excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ clientId: string }> };

/** GET: one client's full change history as Excel. */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;
    const client = await requireClientInFirm(firm.id, clientId);

    const { rows } = await listChanges({ scope: "ADVISOR", firmId: firm.id, clientId }, { all: true });
    const bytes = await buildChangeLogWorkbook(client.name, rows);

    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${changeLogFileName(client.name)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

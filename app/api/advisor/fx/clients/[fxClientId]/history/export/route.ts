import { NextResponse } from "next/server";

import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { listChanges } from "@/lib/change-log";
import { buildChangeLogWorkbook, changeLogFileName } from "@/lib/change-log-excel";
import { requireFxClient } from "@/lib/fx/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ fxClientId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { fxClientId } = await params;
    const client = await requireFxClient(firm.id, fxClientId);
    const { rows } = await listChanges({ scope: "ADVISOR", firmId: firm.id, clientId: client.id }, { all: true });
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

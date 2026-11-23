import { NextResponse } from "next/server";

import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { logAdvisorChange } from "@/lib/change-log";
import { buildClientReport, requireFxClient, settingsOf } from "@/lib/fx/data";
import { buildFxWorkbook } from "@/lib/fx/excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ fxClientId: string }> };

/** GET: the full tax workings workbook (CG, Schedule FA, dividends, FTC). */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await requireAdvisorFirm();
    const { fxClientId } = await params;
    const client = await requireFxClient(ctx.firm.id, fxClientId);
    const { txns, report } = await buildClientReport(ctx.firm.id, client);
    const bytes = await buildFxWorkbook({
      firmName: ctx.firm.brandName || ctx.firm.name,
      clientName: client.name,
      settings: settingsOf(client),
      txns,
      report,
    });
    await logAdvisorChange(ctx, client.id, {
      action: "fx.report.exported",
      entityType: "fx",
      entityId: client.id,
      summary: `Downloaded the foreign equity tax workbook for "${client.name}".`,
    });
    const safe = client.name.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40) || "client";
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safe}_foreign_equity_tax.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

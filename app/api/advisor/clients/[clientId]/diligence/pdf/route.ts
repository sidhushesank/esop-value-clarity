import { NextResponse } from "next/server";

import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { loadReportData, reportFileName } from "@/lib/advisor/report-data";
import { buildReportPdf } from "@/lib/advisor/report-pdf";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;

    await requireClientInFirm(firm.id, clientId);

    const runId = new URL(request.url).searchParams.get("runId");
    const data = await loadReportData(clientId, runId);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_RUN",
          message: "Run the diligence check first.",
        },
        { status: 404 }
      );
    }

    const bytes = await buildReportPdf(data);

    return new NextResponse(new Uint8Array(bytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportFileName(data, "pdf")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
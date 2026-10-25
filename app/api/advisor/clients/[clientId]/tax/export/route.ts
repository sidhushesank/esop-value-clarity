import { NextResponse } from "next/server";

import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { validationFailure } from "@/lib/advisor-schemas";
import { parseFyLabel } from "@/lib/advisor/tax/dates";
import {
  buildAnnualWorkbook,
  buildQuarterlyWorkbook,
} from "@/lib/advisor/tax/exports";
import { computeClientLedger, dayStart } from "@/lib/advisor/tax/ledger-data";
import { formatIst } from "@/lib/advisor/report-data";

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

function safeName(s: string) {
  return s.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 60) || "client";
}

// GET ?type=quarterly&fy=2026-27&q=Q2   |   ?type=annual&fy=2026-27
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;

    const client = await requireClientInFirm(firm.id, clientId);

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const fyEnd = parseFyLabel(url.searchParams.get("fy") ?? "");
    const q = url.searchParams.get("q") as (typeof QUARTERS)[number] | null;

    if (type !== "quarterly" && type !== "annual") {
      return NextResponse.json(validationFailure("Choose quarterly or annual."), { status: 400 });
    }

    if (!fyEnd) {
      return NextResponse.json(validationFailure("Financial year must look like 2026-27."), { status: 400 });
    }

    if (type === "quarterly" && (!q || !QUARTERS.includes(q))) {
      return NextResponse.json(validationFailure("Choose a quarter: Q1, Q2, Q3 or Q4."), { status: 400 });
    }

    const now = new Date();
    const ledger = await computeClientLedger(clientId, dayStart(now));
    const generatedAt = formatIst(now);

    const fyText = url.searchParams.get("fy") as string;

    const buffer =
      type === "quarterly"
        ? await buildQuarterlyWorkbook(ledger, client.name, fyEnd, q!, generatedAt)
        : await buildAnnualWorkbook(ledger, client.name, fyEnd, generatedAt);

    const file =
      type === "quarterly"
        ? `${safeName(client.name)}_perquisite_${fyText}_${q}.xlsx`
        : `${safeName(client.name)}_perquisite_annual_${fyText}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${file}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
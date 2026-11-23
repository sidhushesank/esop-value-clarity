import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { logAdvisorChange } from "@/lib/change-log";
import { iso } from "@/lib/fx/engine";
import { fileFromForm, parseRates, readTable } from "@/lib/fx/import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST multipart: file (Date + TT BUY columns, e.g. the SBI rates archive),
 * currency (default USD), scope ("firm" = this firm's own rates; "shared" = EVC's
 * rates for every firm, founder only). Existing days are overwritten.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireAdvisorFirm({ write: true });
    const form = await request.formData();
    const { buffer, fileName } = await fileFromForm(form);
    const currency = String(form.get("currency") ?? "USD").trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency) || currency === "INR") {
      return NextResponse.json({ success: false, code: "VALIDATION_ERROR", message: "Currency should be a 3-letter code like USD." }, { status: 400 });
    }
    const shared = form.get("scope") === "shared";
    if (shared && !ctx.isFounder) {
      return NextResponse.json({ success: false, code: "FORBIDDEN", message: "Only EVC can update the shared rates." }, { status: 403 });
    }
    const firmId = shared ? "" : ctx.firm.id;

    const { headers, rows } = await readTable(buffer, fileName, 2);
    const parsed = parseRates(headers, rows);

    // One row per day: if the file has several (SBI publishes more than once a day), keep the last.
    const byDay = new Map<string, { date: Date; ttbr: number }>();
    for (const r of parsed.rows) byDay.set(iso(r.date), r);
    const list = [...byDay.values()];
    const source = `upload:${fileName.slice(0, 80)}`;

    for (let i = 0; i < list.length; i += 500) {
      const chunk = list.slice(i, i + 500);
      await prisma.$transaction(
        chunk.map((r) =>
          prisma.fxRate.upsert({
            where: { firmId_currency_date: { firmId, currency, date: r.date } },
            update: { ttbr: r.ttbr, source },
            create: { firmId, currency, date: r.date, ttbr: r.ttbr, source },
          })
        )
      );
    }
    const dates = list.map((r) => iso(r.date)).sort();
    await logAdvisorChange(ctx, null, {
      action: "fx.rates.uploaded",
      entityType: "fx",
      summary: `Uploaded ${list.length} ${currency} TT buying rates (${dates[0]} to ${dates[dates.length - 1]})${shared ? " to EVC's shared rates" : ""}.`,
      details: { skippedRows: parsed.skipped },
    });
    return NextResponse.json({ success: true, saved: list.length, skipped: parsed.skipped, from: dates[0], to: dates[dates.length - 1] });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { logAdvisorChange } from "@/lib/change-log";
import { iso } from "@/lib/fx/engine";
import { fileFromForm, parsePrices, readTable } from "@/lib/fx/import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST multipart: file (Date + Close columns, e.g. a Yahoo / Nasdaq history download),
 * symbol, dateOrder (MDY default, as US sites use). Existing days are overwritten.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireAdvisorFirm({ write: true });
    const form = await request.formData();
    const { buffer, fileName } = await fileFromForm(form);
    const symbol = String(form.get("symbol") ?? "").trim().toUpperCase().replace(/\s+/g, "");
    if (!symbol || symbol.length > 20) {
      return NextResponse.json({ success: false, code: "VALIDATION_ERROR", message: "Enter the share symbol, e.g. GOOGL." }, { status: 400 });
    }
    const order = form.get("dateOrder") === "DMY" ? "DMY" : "MDY";

    const { headers, rows } = await readTable(buffer, fileName, 2);
    const parsed = parsePrices(headers, rows, order);

    const byDay = new Map<string, { date: Date; close: number }>();
    for (const r of parsed.rows) byDay.set(iso(r.date), r);
    const list = [...byDay.values()];

    for (let i = 0; i < list.length; i += 500) {
      const chunk = list.slice(i, i + 500);
      await prisma.$transaction(
        chunk.map((r) =>
          prisma.fxPrice.upsert({
            where: { firmId_symbol_date: { firmId: ctx.firm.id, symbol, date: r.date } },
            update: { close: r.close },
            create: { firmId: ctx.firm.id, symbol, date: r.date, close: r.close },
          })
        )
      );
    }
    const dates = list.map((r) => iso(r.date)).sort();
    await logAdvisorChange(ctx, null, {
      action: "fx.prices.uploaded",
      entityType: "fx",
      summary: `Uploaded ${list.length} daily ${symbol} closing prices (${dates[0]} to ${dates[dates.length - 1]}).`,
      details: { skippedRows: parsed.skipped, dateOrder: order },
    });
    return NextResponse.json({ success: true, saved: list.length, skipped: parsed.skipped, from: dates[0], to: dates[dates.length - 1] });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

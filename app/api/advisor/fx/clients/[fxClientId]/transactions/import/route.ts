import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { logAdvisorChange } from "@/lib/change-log";
import { requireFxClient } from "@/lib/fx/data";
import {
  FX_FIELDS,
  FX_MAX_ROWS,
  detectDateOrder,
  fileFromForm,
  parseTransactions,
  readTable,
  type DateOrder,
} from "@/lib/fx/import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ fxClientId: string }> };

/**
 * POST multipart: file (.xlsx/.csv), broker (optional default), dateOrder (AUTO|DMY|MDY),
 * dryRun ("1" = check only). All-or-nothing: any bad row and nothing is saved.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const ctx = await requireAdvisorFirm({ write: true });
    const { fxClientId } = await params;
    const client = await requireFxClient(ctx.firm.id, fxClientId);

    const form = await request.formData();
    const { buffer, fileName } = await fileFromForm(form);
    const broker = String(form.get("broker") ?? "").trim().slice(0, 120) || null;
    const asked = String(form.get("dateOrder") ?? "AUTO");
    const dryRun = form.get("dryRun") === "1";

    const { headers, rows } = await readTable(buffer, fileName, 3);
    let dateOrder: DateOrder;
    let dateNote: string;
    if (asked === "MDY" || asked === "DMY") {
      dateOrder = asked;
      dateNote = asked === "MDY" ? "Dates read as MM/DD/YYYY (you chose this)." : "Dates read as DD/MM/YYYY (you chose this).";
    } else {
      const found = detectDateOrder(rows);
      if (!found) {
        const hasText = rows.some((r) => r.cells.some((c) => typeof c === "string" && /^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/.test(c.trim())));
        if (hasText) {
          return NextResponse.json(
            {
              success: false,
              code: "FX_DATE_ORDER",
              message: "Every date in this file could be read either way (e.g. 03/04/2025). Choose DD/MM or MM/DD under 'Dates in the file' and check again.",
            },
            { status: 400 }
          );
        }
      }
      dateOrder = found ?? "DMY";
      dateNote = found
        ? `Dates detected as ${found === "MDY" ? "MM/DD/YYYY (US style)" : "DD/MM/YYYY"}.`
        : "Dates are real Excel dates, so no day/month guess was needed.";
    }
    const { valid, errors, mapping, gainsReport, skipped } = parseTransactions(headers, rows, { broker, dateOrder });
    const skippedCount = skipped.reduce((a, [, n]) => a + n, 0);
    const skipNote = skippedCount
      ? `Skipped ${skippedCount} row(s) the tax pack doesn't use: ${skipped
          .slice(0, 12)
          .map(([label, n]) => `${label} (${n})`)
          .join(", ")}${skipped.length > 12 ? ", ..." : ""}. Check none of these is a vest, purchase, sale, dividend or tax row.`
      : null;
    const modeNote = gainsReport
      ? "Read as a realised gains report: each row became one lot (acquired) and its sale. Shares still held are not in such a report; add them from the holdings statement."
      : null;
    const matched = FX_FIELDS.filter((f) => mapping[f.key] !== null).map((f) => ({
      field: gainsReport && f.key === "date" ? "Date sold" : gainsReport && f.key === "price" ? "Proceeds" : f.label,
      column: headers[mapping[f.key] as number],
    }));
    const notes = [dateNote, modeNote, skipNote].filter(Boolean);

    if (errors.length) {
      return NextResponse.json(
        {
          success: false,
          code: "FX_IMPORT_ROWS",
          message: `${errors.length} row(s) need fixing. Nothing was saved.`,
          errors: errors.slice(0, 200),
          matched,
          notes,
          validCount: valid.length,
        },
        { status: 400 }
      );
    }
    if (!valid.length) {
      return NextResponse.json({ success: false, code: "FX_IMPORT_EMPTY", message: "No transaction rows found.", matched, notes }, { status: 400 });
    }

    const existing = await prisma.fxTransaction.count({ where: { clientId: client.id } });
    if (existing + valid.length > FX_MAX_ROWS) {
      return NextResponse.json(
        { success: false, code: "FX_TXN_LIMIT", message: `A client can have up to ${FX_MAX_ROWS} transactions.` },
        { status: 400 }
      );
    }

    if (dryRun) {
      return NextResponse.json({ success: true, dryRun: true, count: valid.length, matched, notes });
    }

    const source = `import:${fileName.slice(0, 80)}`;
    await prisma.fxTransaction.createMany({
      data: valid.map((v) => ({ ...v, firmId: ctx.firm.id, clientId: client.id, source })),
    });
    const byType = valid.reduce<Record<string, number>>((acc, v) => ((acc[v.type] = (acc[v.type] ?? 0) + 1), acc), {});
    await logAdvisorChange(ctx, client.id, {
      action: "fx.txn.imported",
      entityType: "fx",
      entityId: client.id,
      summary: `Imported ${valid.length} transactions for "${client.name}" from ${fileName}.`,
      details: { ...byType, dateOrder, gainsReport, broker: broker ?? undefined },
    });
    return NextResponse.json({ success: true, count: valid.length, matched, notes });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

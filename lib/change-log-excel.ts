import ExcelJS from "exceljs";

import type { ChangeRow } from "@/lib/change-log";

/** Change history as an Excel file: one row per change, newest first. */
export async function buildChangeLogWorkbook(title: string, rows: ChangeRow[]): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ESOP Value Clarity";
  wb.created = new Date();

  const ws = wb.addWorksheet("Change history");
  ws.columns = [
    { header: "When (UTC)", key: "when", width: 20, style: { numFmt: "dd-mmm-yyyy hh:mm" } },
    { header: "Who", key: "who", width: 34 },
    { header: "Area", key: "area", width: 14 },
    { header: "What happened", key: "summary", width: 80 },
    { header: "Details", key: "details", width: 60 },
    { header: "Action code", key: "action", width: 24 },
  ];

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF12203F" } };
  header.alignment = { vertical: "middle" };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  for (const r of rows) {
    ws.addRow({
      when: new Date(r.createdAt),
      who: r.actorLabel,
      area: r.entityType.replace(/_/g, " "),
      summary: r.summary,
      details: r.details ? JSON.stringify(r.details) : "",
      action: r.action,
    }).alignment = { vertical: "top", wrapText: true };
  }

  ws.addRow([]);
  ws.addRow([`${title}: change history exported ${new Date().toISOString().slice(0, 10)} from ESOP Value Clarity.`]);
  ws.addRow(["Entries are written automatically when a change is saved and cannot be edited or deleted in EVC."]).font = {
    italic: true,
    color: { argb: "FF64748B" },
  };

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

export function changeLogFileName(name: string): string {
  const safe = name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "history";
  return `${safe}-change-history-${new Date().toISOString().slice(0, 10)}.xlsx`;
}

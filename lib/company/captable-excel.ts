import ExcelJS from "exceljs";

import type { loadCapTable } from "@/lib/company/captable-data";
import { plainCurrencyTag, type Jurisdiction } from "@/lib/jurisdiction";

type CapTableData = Awaited<ReturnType<typeof loadCapTable>>;

const HEADER_FILL = "FF12203F";
const DATE_FMT = "dd-mmm-yyyy";

const KIND_LABEL: Record<string, string> = {
  ALLOTMENT: "Allotment",
  TRANSFER: "Transfer",
  CONVERSION: "Conversion",
  BUYBACK: "Buyback",
};

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 22;
}

export async function buildCapTableWorkbook(
  companyName: string,
  data: CapTableData,
  jurisdiction: Jurisdiction = "IN"
): Promise<Uint8Array> {
  const us = jurisdiction === "US";
  const tag = plainCurrencyTag(jurisdiction);
  const wb = new ExcelJS.Workbook();
  wb.creator = "ESOP Value Clarity";
  wb.created = new Date();

  const { snapshot } = data;
  const shareClasses = snapshot.classes.filter((c) => !c.amountBased);
  const amountClasses = snapshot.classes.filter((c) => c.amountBased);

  /* ---------------- Cap table ---------------- */
  const ws = wb.addWorksheet("Cap table");

  ws.addRow([`${companyName}: cap table`]).font = { bold: true, size: 14 };
  ws.addRow([
    snapshot.asOf
      ? `As of ${snapshot.asOf.toISOString().slice(0, 10)}`
      : `Generated ${new Date().toISOString().slice(0, 10)}`,
  ]);
  ws.addRow([]);

  const header = [
    us ? "Stockholder" : "Shareholder",
    "Type",
    ...shareClasses.map((c) => c.name),
    ...amountClasses.map((c) => `${c.name} ${tag} amount`),
    us ? "Common shares" : "Equity shares",
    "Issued %",
    "Fully diluted shares",
    "Fully diluted %",
  ];
  styleHeader(ws.addRow(header));
  const headerRowNo = ws.rowCount;

  for (const r of snapshot.rows) {
    ws.addRow([
      r.name,
      r.type,
      ...shareClasses.map((c) => r.units[c.id] ?? 0),
      ...amountClasses.map((c) => r.amounts[c.id] ?? 0),
      r.equityShares,
      r.issuedPct / 100,
      r.fullyDilutedShares,
      r.fullyDilutedPct / 100,
    ]);
  }

  ws.addRow([
    us ? "Option pool (outstanding + unallocated)" : "ESOP pool (outstanding + unallocated)",
    us ? "Options" : "ESOP",
    ...shareClasses.map(() => null),
    ...amountClasses.map(() => null),
    null,
    null,
    snapshot.esop.fullyDilutedShares,
    snapshot.esop.fullyDilutedPct / 100,
  ]);

  const total = ws.addRow([
    "Total",
    "",
    ...shareClasses.map((c) => c.totalUnits),
    ...amountClasses.map((c) => c.totalUnits),
    snapshot.totals.equityShares,
    snapshot.totals.equityShares > 0 ? 1 : 0,
    snapshot.totals.fullyDilutedShares,
    snapshot.totals.fullyDilutedShares > 0 ? 1 : 0,
  ]);
  total.font = { bold: true };

  const pctCols = [header.length - 2, header.length];
  for (let i = headerRowNo + 1; i <= ws.rowCount; i++) {
    for (const col of pctCols) ws.getCell(i, col).numFmt = "0.00%";
    for (let col = 3; col <= header.length; col++) {
      if (!pctCols.includes(col)) ws.getCell(i, col).numFmt = "#,##0";
    }
  }

  ws.columns.forEach((col, idx) => {
    col.width = idx === 0 ? 34 : idx === 1 ? 12 : 18;
  });
  ws.views = [{ state: "frozen", ySplit: headerRowNo }];

  if (snapshot.notes.length) {
    ws.addRow([]);
    ws.addRow(["Notes"]).font = { bold: true };
    for (const n of snapshot.notes) ws.addRow([n]);
  }
  ws.addRow([]);
  ws.addRow([
    "Prepared from the share-movement log in ESOP Value Clarity. A record-keeping aid, not legal or tax advice.",
  ]).font = { italic: true, color: { argb: "FF64748B" } };

  /* ---------------- Movement log ---------------- */
  const log = wb.addWorksheet("Movement log");
  log.columns = [
    { header: "Date", key: "date", width: 14, style: { numFmt: DATE_FMT } },
    { header: "Type", key: "kind", width: 14 },
    { header: "Class", key: "cls", width: 20 },
    { header: "From", key: "from", width: 26 },
    { header: "To", key: "to", width: 26 },
    { header: "Quantity", key: "qty", width: 14, style: { numFmt: "#,##0" } },
    { header: "Converts into", key: "toCls", width: 20 },
    { header: "Units received", key: "toQty", width: 14, style: { numFmt: "#,##0" } },
    { header: `Price per share ${tag}`, key: "price", width: 18, style: { numFmt: us ? "#,##0.0000" : "#,##0.00" } },
    { header: "Note", key: "note", width: 40 },
  ];
  styleHeader(log.getRow(1));
  log.views = [{ state: "frozen", ySplit: 1 }];

  for (const m of [...data.movements].reverse()) {
    log.addRow({
      date: m.date,
      kind: KIND_LABEL[m.kind] ?? m.kind,
      cls: m.className,
      from: m.fromHolderName ?? (m.kind === "ALLOTMENT" ? "Company (new issue)" : ""),
      to: m.toHolderName ?? (m.kind === "BUYBACK" ? "Company (bought back)" : m.kind === "CONVERSION" ? m.fromHolderName ?? "" : ""),
      qty: m.quantity,
      toCls: m.toClassName ?? "",
      toQty: m.toQuantity ?? null,
      price: m.pricePerShare ?? null,
      note: m.note ?? "",
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

export function capTableFileName(companyName: string) {
  const safe = companyName.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "company";
  return `${safe}-cap-table-${new Date().toISOString().slice(0, 10)}.xlsx`;
}

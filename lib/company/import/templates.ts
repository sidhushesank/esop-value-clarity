import ExcelJS from "exceljs";

import { fieldsFor, type ImportKind } from "@/lib/company/import/fields";

const HEADER_FILL = "FF12203F";

const EXAMPLES: Record<ImportKind, (string | number)[][]> = {
  captable: [
    ["Priya Sharma", "Founder", "priya@company.com", "Yes", "Equity shares", "Equity", 60000, "01/01/2024", 10],
    ["Arjun Mehta", "Founder", "", "Yes", "Equity shares", "Equity", 40000, "01/01/2024", 10],
    ["Seed Angels LLP", "Investor", "", "Yes", "Seed CCPS", "CCPS", 5000, "15/06/2025", 500],
  ],
  grants: [
    ["Ravi Kumar", "ravi@company.com", "E-014", 4800, 10, "15/01/2025", "", "48", "12", "", "90", "Issued", "", 0, "No"],
    ["Meera Iyer", "meera@company.com", "E-009", 2400, 10, "15/03/2025", "", "4 years", "1 year", "", "", "Left", "01/10/2026", 0, "No"],
    ["Kiran Rao", "", "E-003", 1200, 10, "01/12/2024", "", "", "", "", "", "Exercised", "", 500, "No"],
  ],
};

const NOTES: Record<ImportKind, string[]> = {
  captable: [
    "One row per shareholding: a shareholder can have several rows (one per class).",
    "Each row is recorded as an opening allotment on its date (or the date you choose when importing).",
    "Shareholders and classes are matched by name to what is already in EVC; new ones are created.",
    "Convertible notes / iSAFE: put the amount in rupees in 'Number of shares'.",
    "Employees who exercised options and hold shares belong here too (type Employee).",
  ],
  grants: [
    "One row per grant. An employee with two grants has two rows.",
    "Leave vesting, cliff and exercise window blank to use the scheme's defaults.",
    "Leavers: status Left and the date of leaving; unvested options go back to the pool automatically.",
    "Exercised options do not add shares to the cap table: record those shares in the cap table import.",
    "The import only goes ahead if every row is valid and the pool is big enough.",
  ],
};

export async function buildImportTemplate(kind: ImportKind): Promise<Uint8Array> {
  const fields = fieldsFor(kind);
  const wb = new ExcelJS.Workbook();
  wb.creator = "ESOP Value Clarity";

  const data = wb.addWorksheet(kind === "captable" ? "Cap table" : "Grants");
  data.columns = fields.map((f) => ({ header: f.label, key: f.key, width: Math.max(16, f.label.length + 4) }));
  const head = data.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  head.height = 22;
  data.views = [{ state: "frozen", ySplit: 1 }];

  const help = wb.addWorksheet("Instructions");
  help.getColumn(1).width = 38;
  help.getColumn(2).width = 12;
  help.getColumn(3).width = 70;
  help.addRow([kind === "captable" ? "Cap table import" : "Grants import"]).font = { bold: true, size: 14 };
  help.addRow(["Fill in the first sheet (one row per line below the header). Do not rename the header row."]);
  help.addRow([]);
  for (const n of NOTES[kind]) help.addRow([`• ${n}`]);
  help.addRow([]);

  const colHead = help.addRow(["Column", "Required", "What to enter"]);
  colHead.font = { bold: true };
  for (const f of fields) help.addRow([f.label, f.required ? "Yes" : "", f.hint]);

  help.addRow([]);
  help.addRow(["Example rows (copy the format, not the data)"]).font = { bold: true };
  const exHead = help.addRow(fields.map((f) => f.label));
  exHead.font = { bold: true, color: { argb: "FF64748B" } };
  for (const ex of EXAMPLES[kind]) help.addRow(ex);

  help.addRow([]);
  help.addRow(["Dates: 15/01/2025, 15-Jan-2025 or 2025-01-15 all work (day first)."]);

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

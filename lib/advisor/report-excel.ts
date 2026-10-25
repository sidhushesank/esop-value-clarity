import ExcelJS from "exceljs";
import type { FindingSeverity } from "@prisma/client";

import {
  buildFixList,
  companyTypeLabel,
  formatIst,
  type ReportData,
} from "@/lib/advisor/report-data";

const SEV_LABEL: Record<FindingSeverity, string> = {
  RED: "Action needed",
  AMBER: "Review",
  INFO: "Note",
  GREEN: "Passed",
};

const SEV_FILL: Record<FindingSeverity, string> = {
  RED: "FFF8D7DA",
  AMBER: "FFFFF3CD",
  INFO: "FFDCE8FA",
  GREEN: "FFD9F2E3",
};

const DATE_FMT = "dd-mmm-yyyy";
const HEADER_FILL = "FF12203F";

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 22;
}

function addTable(
  ws: ExcelJS.Worksheet,
  columns: { header: string; key: string; width: number; date?: boolean; number?: string }[]
) {
  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
    style: {
      alignment: { vertical: "top", wrapText: true },
      ...(c.date ? { numFmt: DATE_FMT } : {}),
      ...(c.number ? { numFmt: c.number } : {}),
    },
  }));

  styleHeader(ws.getRow(1));
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
}

function borderAll(ws: ExcelJS.Worksheet) {
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD9DCE1" } },
        left: { style: "thin", color: { argb: "FFD9DCE1" } },
        bottom: { style: "thin", color: { argb: "FFD9DCE1" } },
        right: { style: "thin", color: { argb: "FFD9DCE1" } },
      };
    });
  });
}

export async function buildAnnexWorkbook(data: ReportData): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = data.brand;
  wb.created = new Date();

  /* ---------------- Summary ---------------- */

  const summary = wb.addWorksheet("Summary");
  summary.columns = [
    { key: "k", width: 30 },
    { key: "v", width: 90 },
  ];

  const flagged = data.findings.filter(
    (f) => f.severity === "RED" || f.severity === "AMBER"
  );
  const unverified = flagged.filter((f) => !f.ruleVerified).length;

  const rows: [string, string | number | Date][] = [
    ["Report", "ESOP Diligence Report (annex)"],
    ["Prepared by", data.brand],
    ["Company", data.client.name],
    ["CIN", data.client.cin ?? "Not entered"],
    ["Company type", companyTypeLabel(data.client.companyType)],
    ["Position as of", data.run.asOf],
    ["Report generated", formatIst(data.run.createdAt)],
    ["Score (out of 100)", data.run.score],
    ["Action needed", data.summary.red],
    ["Review", data.summary.amber],
    ["Notes", data.summary.info],
    ["Passed", data.summary.green],
    [
      "Rule verification",
      unverified > 0
        ? `${unverified} of ${flagged.length} flagged findings rest on rules not yet verified against the Act or Rules text.`
        : "All flagged findings rest on verified rules.",
    ],
    [
      "Note on data",
      "The Register and Exercises sheets show the data as currently held. It may differ from the data at the time of the run.",
    ],
    [
      "Disclaimer",
      "Preparation aid for professional review. Not legal, tax or financial advice.",
    ],
  ];

  for (const [k, v] of rows) {
    const r = summary.addRow({ k, v });
    r.getCell("k").font = { bold: true };
    r.alignment = { vertical: "top", wrapText: true };
    if (v instanceof Date) r.getCell("v").numFmt = DATE_FMT;
    r.getCell("v").alignment = { vertical: "top", horizontal: "left", wrapText: true };
  }
  borderAll(summary);

  /* ---------------- Findings ---------------- */

  const fs = wb.addWorksheet("Findings");
  addTable(fs, [
    { header: "Severity", key: "sev", width: 15 },
    { header: "Finding", key: "title", width: 42 },
    { header: "Detail", key: "detail", width: 70 },
    { header: "Affected items", key: "count", width: 10 },
    { header: "Register rows", key: "rows", width: 22 },
    { header: "Rule", key: "rule", width: 48 },
    { header: "Rule status", key: "status", width: 18 },
    { header: "Suggested owner", key: "owner", width: 22 },
    { header: "Due date", key: "due", width: 14, date: true },
  ]);

  for (const f of data.findings) {
    const row = fs.addRow({
      sev: SEV_LABEL[f.severity],
      title: f.title,
      detail: f.detail,
      count: f.count,
      rows: f.rows.length > 0 ? f.rows.join(", ") : "",
      rule: f.ruleSource ?? "",
      status: f.ruleVerified ? "Verified" : "Needs verification",
      owner: f.owner ?? "",
      due: f.dueDate ?? null,
    });
    row.getCell("sev").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: SEV_FILL[f.severity] },
    };
    row.getCell("sev").font = { bold: true };
  }
  borderAll(fs);

  /* ---------------- Fix list ---------------- */

  const fixes = buildFixList(data.findings);

  const fl = wb.addWorksheet("Fix list");
  addTable(fl, [
    { header: "#", key: "n", width: 5 },
    { header: "Priority", key: "sev", width: 15 },
    { header: "Action", key: "title", width: 46 },
    { header: "Detail", key: "detail", width: 70 },
    { header: "Owner", key: "owner", width: 22 },
    { header: "Due date", key: "due", width: 14, date: true },
    { header: "Status (firm to fill)", key: "status", width: 20 },
    { header: "Notes (firm to fill)", key: "notes", width: 30 },
  ]);

  fixes.forEach((f, i) => {
    const row = fl.addRow({
      n: i + 1,
      sev: SEV_LABEL[f.severity],
      title: f.title,
      detail: f.detail,
      owner: f.owner ?? "To be assigned",
      due: f.dueDate ?? null,
      status: "",
      notes: "",
    });
    row.getCell("sev").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: SEV_FILL[f.severity] },
    };
  });
  borderAll(fl);

  /* ---------------- Skipped checks ---------------- */

  if (data.skipped.length > 0) {
    const sk = wb.addWorksheet("Checks not run");
    addTable(sk, [{ header: "Check that could not run", key: "t", width: 110 }]);
    for (const s of data.skipped) sk.addRow({ t: s });
    borderAll(sk);
  }

  /* ---------------- Register ---------------- */

  const rg = wb.addWorksheet("Register");
  addTable(rg, [
    { header: "Source row", key: "row", width: 10 },
    { header: "Employee", key: "name", width: 26 },
    { header: "Grant date", key: "grant", width: 14, date: true },
    { header: "Options granted", key: "granted", width: 14, number: "#,##0" },
    { header: "Lapsed", key: "lapsed", width: 10, number: "#,##0" },
    { header: "Exercised", key: "exercised", width: 11, number: "#,##0" },
    { header: "Remaining", key: "remaining", width: 11, number: "#,##0" },
    { header: "Exercise price", key: "price", width: 14, number: "#,##0.00" },
    { header: "Vesting (months)", key: "vesting", width: 12 },
    { header: "Cliff (months)", key: "cliff", width: 12 },
    { header: "Expiry date", key: "expiry", width: 14, date: true },
    { header: "Post-exit window (days)", key: "window", width: 14 },
    { header: "Status", key: "status", width: 16 },
    { header: "Left on", key: "left", width: 14, date: true },
  ]);

  for (const g of data.grants) {
    rg.addRow({
      row: g.sourceRow ?? "",
      name: g.employeeName,
      grant: g.grantDate,
      granted: g.optionsGranted,
      lapsed: g.optionsLapsed,
      exercised: g.optionsExercised,
      remaining: g.optionsGranted - g.optionsLapsed - g.optionsExercised,
      price: g.exercisePrice,
      vesting: g.vestingMonths ?? "",
      cliff: g.cliffMonths ?? "",
      expiry: g.expiryDate ?? null,
      window: g.postExitExerciseDays ?? "",
      status: g.status,
      left: g.leftOn ?? null,
    });
  }
  borderAll(rg);

  /* ---------------- Exercises ---------------- */

  const ex = wb.addWorksheet("Exercises");
  addTable(ex, [
    { header: "Employee", key: "name", width: 26 },
    { header: "Exercise date", key: "ex", width: 14, date: true },
    { header: "Options exercised", key: "qty", width: 14, number: "#,##0" },
    { header: "Allotment date", key: "allot", width: 14, date: true },
    { header: "PAS-3 due (allotment + 30 days)", key: "due", width: 18, date: true },
    { header: "PAS-3 filed on", key: "filed", width: 14, date: true },
    { header: "Days from allotment to PAS-3", key: "days", width: 16 },
  ]);

  for (const e of data.exercises) {
    const due = e.allotmentDate
      ? new Date(e.allotmentDate.getTime() + 30 * 86_400_000)
      : null;
    const days =
      e.allotmentDate && e.pas3FiledOn
        ? Math.round(
            (Date.UTC(
              e.pas3FiledOn.getUTCFullYear(),
              e.pas3FiledOn.getUTCMonth(),
              e.pas3FiledOn.getUTCDate()
            ) -
              Date.UTC(
                e.allotmentDate.getUTCFullYear(),
                e.allotmentDate.getUTCMonth(),
                e.allotmentDate.getUTCDate()
              )) /
              86_400_000
          )
        : "";

    ex.addRow({
      name: e.employeeName,
      ex: e.exerciseDate,
      qty: e.optionsExercised,
      allot: e.allotmentDate ?? null,
      due,
      filed: e.pas3FiledOn ?? null,
      days,
    });
  }
  borderAll(ex);

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}
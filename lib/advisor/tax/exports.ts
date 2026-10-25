/**
 * Excel exports for the Tax-Event Ledger.
 *
 *  1. Quarterly perquisite data sheet: one row per deduction falling in the
 *     chosen quarter, shaped to help prepare the salary TDS return
 *     (24Q, Form 138 from FY 2026-27).
 *  2. Annual per-employee perquisite breakup: one row per exercise in the
 *     financial year, for the salary annexure / Form 16 perquisite statement.
 *
 * Both are DATA AIDS. They are not a filed return or a certificate, and
 * every figure is an estimate until the rules are verified.
 */

import ExcelJS from "exceljs";

import type { ClientLedger } from "./ledger-data";
import { fyOf, isoDay, quarterOf, type Quarter } from "./dates";
import { ESTIMATE_NOTICE } from "./engine";
import { TAX_RULE_SEEDS, TAX_RULE_SET_VERSION } from "./rules";

const HEADER_FILL = "FF0F172A";

function maskPan(pan: string | null): string {
  return pan ?? "";
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 30;
}

function addAuditSheet(
  wb: ExcelJS.Workbook,
  ledger: ClientLedger,
  clientName: string,
  title: string,
  generatedAt: string
) {
  const ws = wb.addWorksheet("Rules & audit");
  ws.columns = [
    { header: "Item", key: "a", width: 34 },
    { header: "Detail", key: "b", width: 110 },
  ];
  styleHeader(ws.getRow(1));

  ws.addRows([
    { a: "Export", b: title },
    { a: "Client", b: clientName },
    { a: "Generated", b: generatedAt },
    { a: "Rule-set version", b: TAX_RULE_SET_VERSION },
    { a: "Notice", b: ESTIMATE_NOTICE },
    { a: "", b: "" },
    { a: "Rules not yet verified", b: ledger.unverifiedRules.join(", ") || "None" },
    { a: "", b: "" },
  ]);

  for (const r of TAX_RULE_SEEDS) {
    ws.addRow({
      a: `${r.code}${ledger.unverifiedRules.includes(r.code) ? " (unverified)" : ""}`,
      b: `${r.title}. Source: ${r.source}. ${r.note}`,
    });
  }

  ws.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });
}

/* ------------------------------------------------------------------ */
/* Quarterly                                                           */
/* ------------------------------------------------------------------ */

export async function buildQuarterlyWorkbook(
  ledger: ClientLedger,
  clientName: string,
  fyEndYear: number,
  quarter: Quarter,
  generatedAt: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Perquisite ${quarter}`);

  ws.columns = [
    { header: "Employee", key: "emp", width: 24 },
    { header: "PAN", key: "pan", width: 14 },
    { header: "Employee ref", key: "ref", width: 14 },
    { header: "Event", key: "event", width: 22 },
    { header: "Date of deduction", key: "ded", width: 16 },
    { header: "Perquisite value (Rs.)", key: "perq", width: 20 },
    { header: "Tax to deduct (Rs.) - estimate", key: "tax", width: 22 },
    { header: "Deposit by", key: "dep", width: 14 },
    { header: "Status", key: "status", width: 16 },
    { header: "Rule-set version", key: "ver", width: 16 },
  ];
  styleHeader(ws.getRow(1));

  let total = 0;
  let rows = 0;

  for (const e of ledger.employees) {
    for (const r of e.ledger.results) {
      for (const t of r.tds) {
        const ded = t.deductOnOrBefore;
        if (!ded) continue;

        const fy = fyOf(ded);
        if (fy.endYear !== fyEndYear || quarterOf(ded) !== quarter) continue;
        if (t.status === "DEFERRED") continue;

        const perqValue = r.perquisite?.perquisite ?? null;

        ws.addRow({
          emp: e.employee.name,
          pan: maskPan(e.employee.pan),
          ref: e.employee.employeeRef ?? "",
          event:
            t.status === "TRIGGERED"
              ? `Deferred TDS on ${t.trigger === "SALE" ? "sale" : "exit"}`
              : "Exercise",
          ded: isoDay(ded),
          perq: perqValue,
          tax: t.amount,
          dep: t.depositBy ? isoDay(t.depositBy) : "",
          status: t.status === "TRIGGERED" ? "Deferral ended" : "Due at exercise",
          ver: r.audit.ruleSetVersion,
        });

        total += t.amount;
        rows += 1;
      }
    }
  }

  ws.getColumn("perq").numFmt = "#,##0";
  ws.getColumn("tax").numFmt = "#,##0";

  const totalRow = ws.addRow({ emp: "Total", tax: total });
  totalRow.font = { bold: true };

  ws.addRow({});
  ws.addRow({
    emp: rows === 0 ? "No deductions fall in this quarter." : ESTIMATE_NOTICE,
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];

  addAuditSheet(
    wb,
    ledger,
    clientName,
    `Quarterly perquisite data sheet, FY ${fyOf(new Date(Date.UTC(fyEndYear - 1, 5, 1))).label} ${quarter}`,
    generatedAt
  );

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/* ------------------------------------------------------------------ */
/* Annual                                                              */
/* ------------------------------------------------------------------ */

export async function buildAnnualWorkbook(
  ledger: ClientLedger,
  clientName: string,
  fyEndYear: number,
  generatedAt: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Perquisite breakup");

  ws.columns = [
    { header: "Employee", key: "emp", width: 24 },
    { header: "PAN", key: "pan", width: 14 },
    { header: "Exercise date", key: "date", width: 14 },
    { header: "Shares", key: "shares", width: 10 },
    { header: "Exercise price (Rs.)", key: "price", width: 16 },
    { header: "FMV on exercise (Rs.)", key: "fmv", width: 16 },
    { header: "Perquisite per share (Rs.)", key: "pps", width: 16 },
    { header: "Perquisite value (Rs.)", key: "perq", width: 18 },
    { header: "Estimated tax (Rs.)", key: "tax", width: 16 },
    { header: "TDS treatment", key: "tds", width: 22 },
    { header: "Valuation report date", key: "vdate", width: 16 },
    { header: "Rule-set version", key: "ver", width: 16 },
  ];
  styleHeader(ws.getRow(1));

  let totalPerq = 0;
  let totalTax = 0;

  for (const e of ledger.employees) {
    let empPerq = 0;
    let empTax = 0;
    let n = 0;

    for (const r of e.ledger.results) {
      if (r.type !== "EXERCISE" || !r.perquisite) continue;
      if (fyOf(r.eventDate).endYear !== fyEndYear) continue;

      const p = r.perquisite;
      const shares = Number(r.audit.inputs.shares ?? 0);
      const price = Number(r.audit.inputs.exercisePrice ?? 0);

      ws.addRow({
        emp: e.employee.name,
        pan: maskPan(e.employee.pan),
        date: isoDay(r.eventDate),
        shares,
        price,
        fmv: p.fmvPerShare,
        pps: p.perquisitePerShare,
        perq: p.perquisite,
        tax: p.incrementalTax,
        tds: p.deferred ? "Deferred (start-up)" : "Deducted at exercise",
        vdate: p.valuationDate ? isoDay(p.valuationDate) : "",
        ver: r.audit.ruleSetVersion,
      });

      empPerq += p.perquisite ?? 0;
      empTax += p.incrementalTax ?? 0;
      n += 1;
    }

    if (n > 0) {
      const sub = ws.addRow({
        emp: `${e.employee.name} total`,
        perq: empPerq,
        tax: empTax,
      });
      sub.font = { bold: true };
      totalPerq += empPerq;
      totalTax += empTax;
    }
  }

  for (const k of ["price", "fmv", "pps", "perq", "tax"]) {
    ws.getColumn(k).numFmt = "#,##0.00";
  }

  const grand = ws.addRow({ emp: "All employees", perq: totalPerq, tax: totalTax });
  grand.font = { bold: true };
  ws.addRow({});
  ws.addRow({ emp: ESTIMATE_NOTICE });
  ws.views = [{ state: "frozen", ySplit: 1 }];

  addAuditSheet(
    wb,
    ledger,
    clientName,
    `Annual perquisite breakup, FY ${fyOf(new Date(Date.UTC(fyEndYear - 1, 5, 1))).label}`,
    generatedAt
  );

  return Buffer.from(await wb.xlsx.writeBuffer());
}
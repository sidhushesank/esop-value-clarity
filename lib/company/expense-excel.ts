import ExcelJS from "exceljs";

import type { ExpenseReport } from "@/lib/company/expense";

const STD: Record<string, string> = {
  IND_AS_102: "Ind AS 102 Share-based Payment",
  ICAI_GUIDANCE_NOTE: "ICAI Guidance Note on Accounting for Employee Share-based Payments",
  ASC_718: "ASC 718 Compensation: Stock Compensation",
};

function header(ws: ExcelJS.Worksheet) {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF12203F" } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 32;
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

const r2 = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100);

export async function buildExpenseWorkbook(companyName: string, jurisdiction: "IN" | "US", rep: ExpenseReport) {
  const us = jurisdiction === "US";
  const money = us ? '"$"#,##0.00' : '"Rs." #,##0.00';
  const pct = "0.00%";
  const wb = new ExcelJS.Workbook();
  wb.creator = "ESOP Value Clarity";
  wb.created = new Date();
  const p = rep.policy;

  /* Summary */
  const s = wb.addWorksheet("Summary");
  s.columns = [{ width: 52 }, { width: 22 }, { width: 22 }];
  s.addRow([`${companyName}: ${us ? "stock-based compensation" : "ESOP expense"}, ${rep.period.label}`]).font = { bold: true, size: 14 };
  s.addRow([`${rep.period.start} to ${rep.period.end} · ${STD[p.standard]}`]);
  s.addRow([
    `Attribution: ${p.attribution === "GRADED" ? "graded (each vesting date expensed as a separate tranche)" : "straight-line over the whole award, never below the vested portion"} · Valuation: ${
      p.valuationBasis === "INTRINSIC" ? "intrinsic value" : "fair value (Black-Scholes unless a valuer's value is entered)"
    } · Forfeitures: ${p.forfeitureRate > 0 ? `estimated at ${(p.forfeitureRate * 100).toFixed(2)}% a year, trued up` : "recorded when they happen"}`,
  ]).alignment = { wrapText: true };
  s.addRow([]);
  const t = rep.totals;
  const lines: [string, number | null][] = [
    [`Expense recognised in ${rep.period.label}`, t.expenseThisYear],
    [`Cumulative expense at ${rep.period.start} (opening)`, t.expenseOpening],
    [`Cumulative expense at ${rep.period.end} (closing)`, t.expenseClosing],
    [`Expense still to be recognised after ${rep.period.end}`, t.unrecognised],
  ];
  for (const [k, v] of lines) s.addRow([k, r2(v)]).getCell(2).numFmt = money;
  if (t.incomplete) s.addRow(["Incomplete: some grants have no value yet (see Warnings)."]).font = { color: { argb: "FFB91C1C" }, bold: true };
  s.addRow([]);
  s.addRow(["Journal entry for the year", "Debit", "Credit"]).font = { bold: true };
  const pos = rep.journal.amount >= 0;
  const amt = Math.abs(r2(rep.journal.amount) ?? 0);
  const a = s.addRow([pos ? rep.journal.debit : rep.journal.credit, amt, null]);
  const b = s.addRow([`   To ${pos ? rep.journal.credit : rep.journal.debit}`, null, amt]);
  a.getCell(2).numFmt = money;
  b.getCell(3).numFmt = money;
  s.addRow([]);
  s.addRow(["Quarter", "Expense"]).font = { bold: true };
  rep.quarters.forEach((q, i) => (s.addRow([q.label, r2(t.quarters[i])]).getCell(2).numFmt = money));
  s.addRow([]);
  s.addRow(["Expense still to come, by year", "Expense"]).font = { bold: true };
  for (const f of rep.future) s.addRow([f.label, r2(f.expense)]).getCell(2).numFmt = money;
  s.addRow([]);
  s.addRow([
    "Prepared with ESOP Value Clarity as a working for the company's accountant and auditor. The valuation inputs (value per share, volatility, risk-free rate, expected term) are the company's own assumptions and should be supported by a valuation report. Verify before use.",
  ]).font = { italic: true, color: { argb: "FF64748B" } };

  /* Grants */
  const g = wb.addWorksheet("Grants");
  g.columns = [
    { header: "Employee", key: "name", width: 22 },
    { header: us ? "Plan" : "Scheme", key: "scheme", width: 16 },
    { header: "Status", key: "status", width: 10 },
    { header: "Grant date", key: "date", width: 11 },
    { header: "Options", key: "options", width: 9 },
    { header: us ? "Strike price" : "Exercise price", key: "k", width: 11, style: { numFmt: money } },
    { header: "Value per share at grant", key: "s", width: 12, style: { numFmt: money } },
    { header: "Volatility", key: "sigma", width: 10, style: { numFmt: pct } },
    { header: "Risk-free rate", key: "r", width: 10, style: { numFmt: pct } },
    { header: "Dividend yield", key: "q", width: 9, style: { numFmt: pct } },
    { header: "Expected term (years)", key: "term", width: 10, style: { numFmt: "0.00" } },
    { header: "Value per option", key: "fv", width: 12, style: { numFmt: money } },
    { header: "Basis", key: "basis", width: 14 },
    { header: "Total value of grant", key: "total", width: 14, style: { numFmt: money } },
    { header: "Cumulative at opening", key: "open", width: 14, style: { numFmt: money } },
    { header: `Expense ${rep.period.label}`, key: "year", width: 14, style: { numFmt: money } },
    { header: "Cumulative at closing", key: "close", width: 14, style: { numFmt: money } },
    { header: "Still to recognise", key: "unrec", width: 14, style: { numFmt: money } },
    { header: "Unvested forfeited on", key: "forf", width: 12 },
  ];
  header(g);
  for (const row of rep.rows) {
    g.addRow({
      name: row.employeeName,
      scheme: row.schemeName,
      status: row.status,
      date: row.grantDate,
      options: row.options,
      k: row.exercisePrice,
      s: row.value.fmvPerShare,
      sigma: row.value.source === "BLACK_SCHOLES" ? row.value.volatility : null,
      r: row.value.source === "BLACK_SCHOLES" ? row.value.riskFreeRate : null,
      q: row.value.source === "BLACK_SCHOLES" ? row.value.dividendYield : null,
      term: row.value.source === "BLACK_SCHOLES" ? row.value.expectedTermYears : null,
      fv: r2(row.value.valuePerOption),
      basis: { OVERRIDE: "Valuer's value", BLACK_SCHOLES: "Black-Scholes", INTRINSIC: "Intrinsic value", MISSING: "Missing inputs" }[row.value.source],
      total: r2(row.totalFairValue),
      open: r2(row.expenseOpening),
      year: r2(row.expenseThisYear),
      close: r2(row.expenseClosing),
      unrec: r2(row.unrecognised),
      forf: row.forfeitedOn ?? "",
    });
  }
  const tot = g.addRow({ name: "Total", open: r2(t.expenseOpening), year: r2(t.expenseThisYear), close: r2(t.expenseClosing), unrec: r2(t.unrecognised) });
  tot.font = { bold: true };

  /* Quarterly by grant */
  const qws = wb.addWorksheet("By quarter");
  qws.columns = [{ header: "Employee", key: "name", width: 22 }, { header: "Grant date", key: "date", width: 11 }, ...rep.quarters.map((q, i) => ({ header: q.label, key: `q${i}`, width: 16, style: { numFmt: money } }))];
  header(qws);
  for (const row of rep.rows) {
    const o: Record<string, unknown> = { name: row.employeeName, date: row.grantDate };
    row.quarters.forEach((v, i) => (o[`q${i}`] = r2(v)));
    qws.addRow(o);
  }
  const qt: Record<string, unknown> = { name: "Total" };
  t.quarters.forEach((v, i) => (qt[`q${i}`] = r2(v)));
  qws.addRow(qt).font = { bold: true };

  /* Option movement */
  const m = wb.addWorksheet("Option movement");
  m.columns = [{ header: "", key: "k", width: 42 }, { header: "Options", key: "n", width: 12 }, { header: "Weighted average exercise price", key: "w", width: 18, style: { numFmt: money } }];
  header(m);
  const mv = rep.movement;
  const rows: [string, { options: number; waep: number | null }][] = [
    [`Outstanding at ${rep.period.start}`, mv.opening],
    ["Granted during the year", mv.granted],
    ["Forfeited / lapsed during the year", mv.forfeited],
    ["Exercised during the year", mv.exercised],
    [`Outstanding at ${rep.period.end}`, mv.closing],
    [`Exercisable at ${rep.period.end}`, mv.exercisable],
  ];
  for (const [k, v] of rows) m.addRow({ k, n: v.options, w: r2(v.waep) });
  m.addRow({});
  m.addRow({ k: "Weighted average remaining contractual life (years)", n: rep.weightedRemainingLifeYears ?? "no expiry dates" });
  const wv = m.addRow({ k: "Weighted average value per option granted in the year", n: r2(rep.weightedValueGrantedThisYear) });
  wv.getCell(2).numFmt = money;

  /* Warnings */
  const w = wb.addWorksheet("Warnings");
  w.columns = [{ header: "Level", key: "l", width: 10 }, { header: "What to check", key: "m", width: 120 }];
  header(w);
  for (const x of rep.warnings) w.addRow({ l: x.level, m: x.message }).alignment = { wrapText: true };
  if (!rep.warnings.length) w.addRow({ l: "OK", m: "No problems found." });

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

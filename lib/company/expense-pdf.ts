import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { ExpenseReport } from "@/lib/company/expense";

/** ESOP expense note for the year: summary, per-grant schedule, option movement, journal entry. */

const W = 595.28;
const H = 841.89;
const M = 40;
const C = {
  navy: rgb(0.07, 0.12, 0.25),
  text: rgb(0.1, 0.1, 0.12),
  grey: rgb(0.42, 0.44, 0.48),
  light: rgb(0.95, 0.96, 0.97),
  line: rgb(0.85, 0.86, 0.88),
  red: rgb(0.72, 0.11, 0.11),
  white: rgb(1, 1, 1),
};

const STD: Record<string, string> = {
  IND_AS_102: "Ind AS 102",
  ICAI_GUIDANCE_NOTE: "ICAI Guidance Note on Employee Share-based Payments",
  ASC_718: "ASC 718",
};

export async function buildExpensePdf(companyName: string, jurisdiction: "IN" | "US", rep: ExpenseReport): Promise<Uint8Array> {
  const us = jurisdiction === "US";
  const locale = us ? "en-US" : "en-IN";
  const cur = us ? "$" : "Rs. ";
  const money = (n: number | null) => (n === null ? "-" : `${n < 0 ? "-" : ""}${cur}${Math.abs(n).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  const num = (n: number | null) => (n === null ? "-" : n.toLocaleString(locale, { maximumFractionDigits: 2 }));

  const doc = await PDFDocument.create();
  doc.setTitle(`${us ? "Stock-based compensation" : "ESOP expense"} ${rep.period.label} - ${companyName}`);
  doc.setProducer("ESOP Value Clarity");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(regular.getCharacterSet());
  const clean = (s: string) => {
    let out = "";
    for (const ch of s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/₹/g, "Rs.")) out += supported.has(ch.codePointAt(0) ?? 0) ? ch : "?";
    return out;
  };

  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;
  const ensure = (h: number) => {
    if (y - h < 50) {
      page = doc.addPage([W, H]);
      y = H - M;
    }
  };
  const text = (s: string, x: number, size: number, font: PDFFont = regular, color = C.text) => page.drawText(clean(s), { x, y, size, font, color });
  const right = (s: string, xRight: number, size: number, font: PDFFont = regular, color = C.text) =>
    page.drawText(clean(s), { x: xRight - font.widthOfTextAtSize(clean(s), size), y, size, font, color });
  const wrap = (s: string, size: number, width: number, font: PDFFont = regular) => {
    const words = clean(s).split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > width && cur) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const para = (s: string, size = 9, color = C.grey, font: PDFFont = regular) => {
    for (const l of wrap(s, size, W - 2 * M, font)) {
      ensure(size + 4);
      text(l, M, size, font, color);
      y -= size + 4;
    }
  };
  const heading = (s: string) => {
    ensure(30);
    y -= 8;
    text(s, M, 12, bold, C.navy);
    y -= 18;
  };

  // Header band
  page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: C.navy });
  y = H - 40;
  text(clean(companyName), M, 16, bold, C.white);
  y -= 22;
  text(`${us ? "Stock-based compensation" : "ESOP expense"} · ${rep.period.label} (${rep.period.start} to ${rep.period.end})`, M, 10, regular, C.white);
  y -= 14;
  text(`Basis: ${STD[rep.policy.standard]}`, M, 9, regular, C.white);
  y = H - 120;

  // Summary
  heading("Summary");
  const t = rep.totals;
  const sum: [string, number][] = [
    [`Expense for ${rep.period.label}`, t.expenseThisYear],
    ["Cumulative expense, opening", t.expenseOpening],
    ["Cumulative expense, closing", t.expenseClosing],
    ["Still to be recognised in later years", t.unrecognised],
  ];
  for (const [k, v] of sum) {
    ensure(16);
    text(k, M, 10);
    right(money(v), W - M, 10, bold);
    y -= 16;
  }
  if (t.incomplete) para("Incomplete: some grants have no value yet. See the points to check below.", 9, C.red, bold);

  heading("Journal entry for the year");
  const pos = rep.journal.amount >= 0;
  const amt = money(Math.abs(rep.journal.amount));
  ensure(30);
  text(`Dr  ${pos ? rep.journal.debit : rep.journal.credit}`, M, 10);
  right(amt, W - M - 90, 10);
  y -= 15;
  text(`     Cr  ${pos ? rep.journal.credit : rep.journal.debit}`, M, 10);
  right(amt, W - M, 10);
  y -= 18;

  // Grants table
  heading("Expense by grant");
  const cols = [
    { h: "Employee", x: M, w: 120, r: false },
    { h: "Grant date", x: M + 122, w: 58, r: false },
    { h: "Options", x: M + 228, w: 46, r: true },
    { h: "Value/option", x: M + 292, w: 60, r: true },
    { h: "This year", x: M + 364, w: 60, r: true },
    { h: "Cumulative", x: M + 436, w: 60, r: true },
    { h: "To come", x: W - M, w: 50, r: true },
  ];
  const tableHeader = () => {
    ensure(18);
    page.drawRectangle({ x: M - 4, y: y - 4, width: W - 2 * M + 8, height: 16, color: C.light });
    for (const c of cols) (c.r ? right(c.h, c.x, 8, bold, C.grey) : text(c.h, c.x, 8, bold, C.grey));
    y -= 18;
  };
  tableHeader();
  for (const r of rep.rows) {
    if (y < 70) {
      ensure(1000);
      tableHeader();
    }
    const cells = [
      r.employeeName.slice(0, 26),
      r.grantDate,
      num(r.options),
      r.value.valuePerOption === null ? "missing" : money(r.value.valuePerOption),
      money(r.expenseThisYear),
      money(r.expenseClosing),
      money(r.unrecognised),
    ];
    cols.forEach((c, i) => (c.r ? right(cells[i], c.x, 8) : text(cells[i], c.x, 8)));
    y -= 13;
    page.drawLine({ start: { x: M - 4, y: y + 4 }, end: { x: W - M + 4, y: y + 4 }, thickness: 0.4, color: C.line });
  }

  // Option movement
  heading("Option movement");
  const mv = rep.movement;
  const mrows: [string, { options: number; waep: number | null }][] = [
    [`Outstanding at ${rep.period.start}`, mv.opening],
    ["Granted", mv.granted],
    ["Forfeited / lapsed", mv.forfeited],
    ["Exercised", mv.exercised],
    [`Outstanding at ${rep.period.end}`, mv.closing],
    [`Exercisable at ${rep.period.end}`, mv.exercisable],
  ];
  ensure(16);
  right("Options", W - M - 130, 8, bold, C.grey);
  right("Wtd. avg. exercise price", W - M, 8, bold, C.grey);
  y -= 14;
  for (const [k, v] of mrows) {
    ensure(14);
    text(k, M, 9);
    right(num(v.options), W - M - 130, 9);
    right(money(v.waep), W - M, 9);
    y -= 14;
  }
  if (rep.weightedRemainingLifeYears !== null) para(`Weighted average remaining contractual life: ${rep.weightedRemainingLifeYears} years.`, 9, C.text);
  if (rep.weightedValueGrantedThisYear !== null) para(`Weighted average value per option granted in the year: ${money(rep.weightedValueGrantedThisYear)}.`, 9, C.text);

  heading("Method");
  const p = rep.policy;
  para(
    `${p.attribution === "GRADED" ? "Graded attribution: each vesting date is expensed as a separate tranche over its own service period." : "Straight-line attribution over the whole award, never less than the value of options already vested."} ${
      p.valuationBasis === "INTRINSIC"
        ? "Options are measured at intrinsic value (value per share less exercise price) at the grant date."
        : "Options are measured at grant-date fair value using Black-Scholes (or a valuer's value where entered); the expected term defaults to the average of the time to vest and the contractual term."
    } ${p.forfeitureRate > 0 ? `Expected leavers are estimated at ${(p.forfeitureRate * 100).toFixed(2)}% a year and trued up.` : "Forfeitures are recorded when employees leave."} Unvested options of leavers are reversed; vested options that lapse are not.`,
    9,
    C.text
  );

  if (rep.warnings.length) {
    heading("Points to check");
    for (const w of rep.warnings) para(`${w.level}: ${w.message}`, 8.5, w.level === "BLOCK" ? C.red : C.grey);
  }
  y -= 6;
  para(
    "Prepared with ESOP Value Clarity as a working for the company's accountant and auditor. The valuation inputs are the company's own assumptions and should be supported by a valuation report. Not an audit opinion; verify before use.",
    8,
    C.grey
  );

  const pages = doc.getPages();
  pages.forEach((pg, i) => pg.drawText(clean(`${companyName} · ${rep.period.label} · page ${i + 1} of ${pages.length}`), { x: M, y: 24, size: 7.5, font: regular, color: C.grey }));
  return doc.save();
}

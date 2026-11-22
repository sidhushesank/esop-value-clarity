import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { GrantWarning, VestingMilestone } from "@/lib/company/grants";
import { numberLocale, plainCurrencyPrefix, type Jurisdiction } from "@/lib/jurisdiction";

/**
 * Grant summary PDF, in two versions:
 * - COMPANY (default): a draft for the founder's CS or lawyer, with the
 *   points to review.
 * - EMPLOYEE: the employee's own summary, without internal review points,
 *   with what is vested today and its value.
 * Neither is a grant letter. EVC does not generate legal wording.
 */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 48;
const CONTENT_W = PAGE_W - M * 2;

const C = {
  navy: rgb(0.07, 0.12, 0.25),
  text: rgb(0.1, 0.1, 0.12),
  grey: rgb(0.42, 0.44, 0.48),
  light: rgb(0.95, 0.96, 0.97),
  line: rgb(0.85, 0.86, 0.88),
  amber: rgb(0.85, 0.52, 0.04),
  red: rgb(0.78, 0.16, 0.16),
  white: rgb(1, 1, 1),
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: Date | null): string {
  if (!d) return "-";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

let NUM_LOCALE = "en-IN";

function fmtNum(n: number, maxDecimals = 2): string {
  return n.toLocaleString(NUM_LOCALE, { maximumFractionDigits: maxDecimals });
}

function makeCleaner(font: PDFFont) {
  const supported = new Set(font.getCharacterSet());
  return (input: string): string => {
    const text = input
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-")
      .replace(/…/g, "...")
      .replace(/₹/g, "Rs.")
      .replace(/[\r\n\t]+/g, " ");
    let out = "";
    for (const ch of text) out += supported.has(ch.codePointAt(0) ?? 0) ? ch : "?";
    return out;
  };
}

export type GrantSummaryInput = {
  audience?: "COMPANY" | "EMPLOYEE";
  /** Company country: decides currency and wording. Defaults to India. */
  jurisdiction?: Jurisdiction;
  /** US only: ISO or NSO. */
  usOptionType?: "ISO" | "NSO" | null;
  vestedToday?: number;
  fmvPerShare?: number | null;
  fmvDate?: Date | null;
  leftOn?: Date | null;
  exerciseWindowEnds?: Date | null;
  companyName: string;
  companyCin: string | null;
  schemeName: string;
  employeeName: string;
  employeeRef: string | null;
  status: string;
  grantDate: Date;
  options: number;
  exercisePrice: number;
  vestingStart: Date;
  vestingMonths: number;
  cliffMonths: number;
  expiryDate: Date | null;
  postExitDays: number;
  milestones: VestingMilestone[];
  warnings: GrantWarning[];
};

export async function buildGrantSummaryPdf(input: GrantSummaryInput): Promise<Uint8Array> {
  const employee = input.audience === "EMPLOYEE";
  const j: Jurisdiction = input.jurisdiction ?? "IN";
  const us = j === "US";
  NUM_LOCALE = numberLocale(j);
  const cur = plainCurrencyPrefix(j);
  const priceDecimals = us ? 4 : 2;
  const doc = await PDFDocument.create();
  doc.setTitle(`${employee ? "Grant summary" : "Draft grant summary"} - ${input.employeeName}`);
  doc.setProducer("ESOP Value Clarity");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const clean = makeCleaner(regular);

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - M;

  const ensure = (h: number) => {
    if (y - h < 64) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - M;
    }
  };

  const text = (s: string, x: number, size: number, font = regular, color = C.text) => {
    page.drawText(clean(s), { x, y, size, font, color });
  };

  const wrap = (s: string, size: number, font: PDFFont, width: number): string[] => {
    const words = clean(s).split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = w;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const paragraph = (s: string, size = 9.5, font = regular, color = C.text, x = M, width = CONTENT_W) => {
    for (const l of wrap(s, size, font, width)) {
      ensure(size + 4);
      page.drawText(l, { x, y, size, font, color });
      y -= size + 4;
    }
  };

  /* Header band */
  page.drawRectangle({ x: 0, y: PAGE_H - 108, width: PAGE_W, height: 108, color: C.navy });
  y = PAGE_H - 44;
  text("ESOP VALUE CLARITY", M, 8, bold, rgb(0.58, 0.77, 0.99));
  y -= 24;
  text(employee ? `${input.employeeName}: your grant summary` : "Draft grant summary", M, 20, bold, C.white);
  y -= 18;
  text(`${input.companyName}${!us && input.companyCin ? `  ·  CIN ${input.companyCin}` : ""}`, M, 9.5, regular, rgb(0.8, 0.84, 0.9));

  /* Draft banner */
  y = PAGE_H - 108 - 26;
  page.drawRectangle({ x: M, y: y - 30, width: CONTENT_W, height: 44, color: rgb(1, 0.97, 0.88), borderColor: C.amber, borderWidth: 0.8 });
  y -= 2;
  const legalDoc = us ? "GRANT AGREEMENT" : "GRANT LETTER";
  text(employee ? `SUMMARY - NOT YOUR ${legalDoc}` : `DRAFT - NOT A ${legalDoc}`, M + 12, 9.5, bold, C.amber);
  y -= 13;
  text(
    employee
      ? us
        ? "A summary of your grant as recorded by your company. Your grant agreement and the equity plan are the documents that count."
        : "A summary of your grant as recorded by your company. Your grant letter and the ESOP scheme are the documents that count."
      : us
        ? "A summary of the terms entered in EVC. Have the grant agreement prepared or reviewed by your lawyer before issuing."
        : "A summary of the terms entered in EVC. Have the grant letter prepared or reviewed by your CS or lawyer before issuing.",
    M + 12, 8.5, regular, C.text
  );
  y -= 36;

  /* Key terms */
  const rows: [string, string][] = [
    ["Employee", `${input.employeeName}${input.employeeRef ? ` (${input.employeeRef})` : ""}`],
    [us ? "Equity incentive plan" : "ESOP scheme", input.schemeName],
    ...(us
      ? ([["Option type", input.usOptionType === "ISO" ? "Incentive stock option (ISO)" : input.usOptionType === "NSO" ? "Non-qualified stock option (NSO)" : "Not recorded"]] as [string, string][])
      : []),
    ["Status in EVC", input.status],
    ["Grant date", fmtDate(input.grantDate)],
    ["Number of options", fmtNum(input.options)],
    ["Exercise price per option", `${cur}${fmtNum(input.exercisePrice, priceDecimals)}`],
    ["Total exercise cost (all options)", `${cur}${fmtNum(input.options * input.exercisePrice)}`],
    ["Vesting starts", fmtDate(input.vestingStart)],
    ["Vesting period", `${input.vestingMonths} months, ${input.cliffMonths}-month cliff, then monthly`],
    ["Option expiry", input.expiryDate ? fmtDate(input.expiryDate) : "Not entered"],
    ["Exercise window after leaving", `${input.postExitDays} days`],
  ];

  if (employee) {
    if (input.vestedToday !== undefined) {
      rows.push(["Vested today", fmtNum(input.vestedToday)]);
    }
    if (input.fmvPerShare && input.vestedToday !== undefined) {
      rows.push([
        "Value of vested options today",
        `${cur}${fmtNum(input.vestedToday * input.fmvPerShare)} at ${cur}${fmtNum(input.fmvPerShare, priceDecimals)} per share${us ? " (409A)" : ""}${input.fmvDate ? ` (valued ${fmtDate(input.fmvDate)})` : ""}`,
      ]);
    }
    if (input.leftOn) {
      rows.push(["Left the company on", fmtDate(input.leftOn)]);
      if (input.exerciseWindowEnds) rows.push(["Exercise vested options by", fmtDate(input.exerciseWindowEnds)]);
    }
  }

  text("Grant terms", M, 12, bold, C.navy);
  y -= 16;
  for (const [k, v] of rows) {
    ensure(22);
    page.drawLine({ start: { x: M, y: y - 6 }, end: { x: M + CONTENT_W, y: y - 6 }, thickness: 0.5, color: C.line });
    text(k, M, 9.5, regular, C.grey);
    text(v, M + 200, 9.5, bold);
    y -= 20;
  }

  /* Vesting schedule */
  y -= 10;
  ensure(60);
  text("Vesting schedule", M, 12, bold, C.navy);
  y -= 18;
  page.drawRectangle({ x: M, y: y - 6, width: CONTENT_W, height: 20, color: C.light });
  text("Date", M + 8, 8.5, bold, C.grey);
  text("Options vested (total)", M + 170, 8.5, bold, C.grey);
  text("Share of grant", M + 360, 8.5, bold, C.grey);
  y -= 22;
  for (const m of input.milestones) {
    ensure(18);
    text(fmtDate(m.date), M + 8, 9.5);
    text(fmtNum(m.vestedTotal), M + 170, 9.5);
    text(`${m.vestedPct.toFixed(1)}%`, M + 360, 9.5);
    y -= 18;
  }
  y -= 2;
  paragraph("Between these dates options vest in equal monthly parts after the cliff.", 8.5, regular, C.grey);

  /* Points to review */
  if (!employee && input.warnings.length) {
    y -= 10;
    ensure(40);
    text(us ? "Points to review with your lawyer" : "Points to review with your CS or lawyer", M, 12, bold, C.navy);
    y -= 16;
    for (const w of input.warnings) {
      ensure(30);
      text(w.severity === "BLOCK" ? "MUST FIX" : w.severity === "WARN" ? "REVIEW" : "NOTE", M, 8, bold, w.severity === "BLOCK" ? C.red : w.severity === "WARN" ? C.amber : C.grey);
      y -= 12;
      paragraph(w.message, 9, regular, C.text);
      paragraph(`Basis: ${w.source}`, 8, regular, C.grey);
      y -= 4;
    }
  }

  /* Footer on every page */
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(
      clean(
        employee
          ? `Prepared for you by ${input.companyName} using ESOP Value Clarity on ${fmtDate(new Date())}. Not legal, tax or investment advice.`
          : `Prepared in ESOP Value Clarity on ${fmtDate(new Date())}. A preparation aid, not legal or tax advice. Rules marked (verify) are from secondary sources.`
      ),
      { x: M, y: 32, size: 7, font: regular, color: C.grey }
    );
    p.drawText(`${i + 1} / ${pages.length}`, { x: PAGE_W - M - 20, y: 32, size: 7, font: regular, color: C.grey });
  });

  return doc.save();
}

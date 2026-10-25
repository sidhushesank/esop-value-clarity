import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { FindingSeverity } from "@prisma/client";

import {
  buildFixList,
  companyTypeLabel,
  formatIst,
  type ReportData,
  type ReportFinding,
} from "@/lib/advisor/report-data";

type Colour = ReturnType<typeof rgb>;

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 44;
const CONTENT_W = PAGE_W - M * 2;
const BOTTOM = 58;

const C = {
  navy: rgb(0.07, 0.12, 0.25),
  text: rgb(0.1, 0.1, 0.12),
  grey: rgb(0.42, 0.44, 0.48),
  light: rgb(0.95, 0.96, 0.97),
  line: rgb(0.85, 0.86, 0.88),
  white: rgb(1, 1, 1),
};

const SEV_COLOUR: Record<FindingSeverity, Colour> = {
  RED: rgb(0.78, 0.16, 0.16),
  AMBER: rgb(0.85, 0.52, 0.04),
  INFO: rgb(0.2, 0.4, 0.75),
  GREEN: rgb(0.13, 0.58, 0.32),
};

const SEV_LABEL: Record<FindingSeverity, string> = {
  RED: "Action needed",
  AMBER: "Review",
  INFO: "Notes",
  GREEN: "Passed",
};

const SEV_ORDER: FindingSeverity[] = ["RED", "AMBER", "INFO", "GREEN"];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function fmtIsoDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? iso : fmtDate(d);
}

/**
 * Standard PDF fonts cannot draw every character (for example the rupee
 * symbol). Replace what we can, and anything else with "?", so a stray
 * character can never crash report generation.
 */
function makeCleaner(font: PDFFont) {
  const supported = new Set(font.getCharacterSet());

  return (input: string): string => {
    const text = input
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/\u20B9/g, "Rs.")
      .replace(/[\r\n\t]+/g, " ");

    let out = "";
    for (const ch of text) {
      const cp = ch.codePointAt(0) ?? 63;
      out += supported.has(cp) ? ch : "?";
    }
    return out;
  };
}

export async function buildReportPdf(data: ReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`ESOP Diligence Report - ${data.client.name}`.slice(0, 200));
  doc.setAuthor(data.brand.slice(0, 200));
  doc.setCreator("EVC Advisor Console");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const clean = makeCleaner(regular);

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - M;

  /* -------------------------------------------------------------- */
  /* Layout helpers                                                  */
  /* -------------------------------------------------------------- */

  function newPage() {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - M;
  }

  function ensure(height: number) {
    if (y - height < BOTTOM) newPage();
  }

  function wrap(
    text: string,
    font: PDFFont,
    size: number,
    width: number
  ): string[] {
    const words = clean(text).split(" ").filter(Boolean);
    const lines: string[] = [];
    let line = "";

    for (const original of words) {
      let word = original;

      while (font.widthOfTextAtSize(word, size) > width && word.length > 1) {
        let cut = word.length;
        while (cut > 1 && font.widthOfTextAtSize(word.slice(0, cut), size) > width) {
          cut--;
        }
        if (line) {
          lines.push(line);
          line = "";
        }
        lines.push(word.slice(0, cut));
        word = word.slice(cut);
      }

      if (!word) continue;

      const attempt = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(attempt, size) <= width) {
        line = attempt;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }

    if (line) lines.push(line);
    return lines.length > 0 ? lines : [""];
  }

  function truncate(text: string, font: PDFFont, size: number, max: number) {
    let t = clean(text);
    if (font.widthOfTextAtSize(t, size) <= max) return t;
    while (t.length > 1 && font.widthOfTextAtSize(`${t}...`, size) > max) {
      t = t.slice(0, -1);
    }
    return `${t}...`;
  }

  function para(
    text: string,
    o: {
      font?: PDFFont;
      size?: number;
      color?: Colour;
      x?: number;
      width?: number;
      lineH?: number;
    } = {}
  ) {
    const font = o.font ?? regular;
    const size = o.size ?? 9.5;
    const color = o.color ?? C.text;
    const x = o.x ?? M;
    const width = o.width ?? CONTENT_W;
    const lineH = o.lineH ?? size * 1.4;

    for (const line of wrap(text, font, size, width)) {
      ensure(lineH);
      page.drawText(line, { x, y: y - size, size, font, color });
      y -= lineH;
    }
  }

  function centred(
    text: string,
    font: PDFFont,
    size: number,
    boxX: number,
    boxW: number,
    baseline: number,
    color: Colour
  ) {
    const t = clean(text);
    const w = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: boxX + (boxW - w) / 2, y: baseline, size, font, color });
  }

  /* -------------------------------------------------------------- */
  /* Header band                                                     */
  /* -------------------------------------------------------------- */

  page.drawRectangle({
    x: 0,
    y: PAGE_H - 96,
    width: PAGE_W,
    height: 96,
    color: C.navy,
  });

  page.drawText(truncate(data.brand.toUpperCase(), bold, 10, CONTENT_W - 120), {
    x: M,
    y: PAGE_H - 34,
    size: 10,
    font: bold,
    color: C.white,
  });

  page.drawText("ESOP Diligence Report", {
    x: M,
    y: PAGE_H - 66,
    size: 22,
    font: bold,
    color: C.white,
  });

  const scoreColour =
    data.run.score >= 80
      ? SEV_COLOUR.GREEN
      : data.run.score >= 50
        ? SEV_COLOUR.AMBER
        : SEV_COLOUR.RED;

  const boxX = PAGE_W - M - 92;
  page.drawRectangle({
    x: boxX,
    y: PAGE_H - 84,
    width: 92,
    height: 62,
    color: C.white,
  });
  centred("SCORE", bold, 8, boxX, 92, PAGE_H - 36, C.grey);
  centred(String(data.run.score), bold, 28, boxX, 92, PAGE_H - 66, scoreColour);
  centred("out of 100", regular, 7.5, boxX, 92, PAGE_H - 79, C.grey);

  y = PAGE_H - 96 - 24;

  /* -------------------------------------------------------------- */
  /* Client block                                                    */
  /* -------------------------------------------------------------- */

  para(data.client.name, { font: bold, size: 15, lineH: 20 });

  const meta = [
    companyTypeLabel(data.client.companyType),
    data.client.cin ? `CIN ${data.client.cin}` : null,
  ]
    .filter(Boolean)
    .join("   |   ");
  para(meta, { color: C.grey, size: 9 });

  para(
    `Position as of ${fmtIsoDay(data.run.asOf)}   |   Report generated ${formatIst(data.run.createdAt)}`,
    { color: C.grey, size: 9 }
  );

  y -= 12;

  /* -------------------------------------------------------------- */
  /* Summary boxes                                                   */
  /* -------------------------------------------------------------- */

  ensure(60);

  const gap = 8;
  const boxW = (CONTENT_W - gap * 3) / 4;
  const counts: [FindingSeverity, number][] = [
    ["RED", data.summary.red],
    ["AMBER", data.summary.amber],
    ["INFO", data.summary.info],
    ["GREEN", data.summary.green],
  ];

  counts.forEach(([sev, n], i) => {
    const bx = M + i * (boxW + gap);
    page.drawRectangle({ x: bx, y: y - 46, width: boxW, height: 46, color: C.light });
    page.drawRectangle({ x: bx, y: y - 3, width: boxW, height: 3, color: SEV_COLOUR[sev] });
    page.drawText(String(n), {
      x: bx + 10,
      y: y - 30,
      size: 20,
      font: bold,
      color: SEV_COLOUR[sev],
    });
    page.drawText(SEV_LABEL[sev], {
      x: bx + 10,
      y: y - 41,
      size: 8,
      font: regular,
      color: C.grey,
    });
  });

  y -= 46 + 14;

  /* -------------------------------------------------------------- */
  /* At a glance: severity mix, owner workload, deadlines            */
  /* -------------------------------------------------------------- */

  {
    const panelH = 128;
    const innerPad = 16;
    const colW = CONTENT_W / 2 - innerPad * 1.5;
    const leftX = M + innerPad;
    const rightX = M + CONTENT_W / 2 + innerPad / 2;

    ensure(panelH + 40);

    const top = y;

    page.drawRectangle({
      x: M,
      y: top - panelH,
      width: CONTENT_W,
      height: panelH,
      color: C.light,
    });

    /* Left: findings by severity ---------------------------------- */

    page.drawText("FINDINGS BY SEVERITY", {
      x: leftX,
      y: top - 22,
      size: 7.5,
      font: bold,
      color: C.grey,
    });

    const sevTotal = counts.reduce((sum, [, n]) => sum + n, 0);
    const barY = top - 42;

    page.drawRectangle({
      x: leftX,
      y: barY,
      width: colW,
      height: 8,
      color: C.line,
    });

    if (sevTotal > 0) {
      let bx = leftX;
      for (const [sev, n] of counts) {
        if (n === 0) continue;
        const w = (colW * n) / sevTotal;
        page.drawRectangle({
          x: bx,
          y: barY,
          width: w,
          height: 8,
          color: SEV_COLOUR[sev],
        });
        bx += w;
      }
    }

    counts.forEach(([sev, n], i) => {
      const ly = top - 66 - i * 14;

      page.drawRectangle({
        x: leftX,
        y: ly,
        width: 6,
        height: 6,
        color: SEV_COLOUR[sev],
      });
      page.drawText(SEV_LABEL[sev], {
        x: leftX + 14,
        y: ly,
        size: 8.5,
        font: regular,
        color: C.text,
      });

      const num = String(n);
      page.drawText(num, {
        x: leftX + colW - bold.widthOfTextAtSize(num, 8.5),
        y: ly,
        size: 8.5,
        font: bold,
        color: C.text,
      });
    });

    /* Right: open items by owner ---------------------------------- */

    page.drawText("OPEN ITEMS BY OWNER", {
      x: rightX,
      y: top - 22,
      size: 7.5,
      font: bold,
      color: C.grey,
    });

    const ownerMap = new Map<string, { action: number; review: number }>();
    for (const f of data.findings) {
      if (f.severity !== "RED" && f.severity !== "AMBER") continue;
      const key = f.owner?.trim() || "Unassigned";
      const row = ownerMap.get(key) ?? { action: 0, review: 0 };
      if (f.severity === "RED") row.action++;
      else row.review++;
      ownerMap.set(key, row);
    }

    const owners = [...ownerMap.entries()]
      .sort((a, b) => b[1].action + b[1].review - (a[1].action + a[1].review))
      .slice(0, 4);

    if (owners.length === 0) {
      page.drawText("Nothing is waiting on anyone.", {
        x: rightX,
        y: top - 46,
        size: 8.5,
        font: regular,
        color: C.grey,
      });
    } else {
      const maxOwner = Math.max(
        ...owners.map(([, v]) => v.action + v.review),
        1
      );

      owners.forEach(([name, v], i) => {
        const ly = top - 44 - i * 21;
        const total = v.action + v.review;

        page.drawText(truncate(name, regular, 8.5, colW - 24), {
          x: rightX,
          y: ly,
          size: 8.5,
          font: regular,
          color: C.text,
        });

        const num = String(total);
        page.drawText(num, {
          x: rightX + colW - bold.widthOfTextAtSize(num, 8.5),
          y: ly,
          size: 8.5,
          font: bold,
          color: C.text,
        });

        const by = ly - 9;
        page.drawRectangle({
          x: rightX,
          y: by,
          width: colW,
          height: 4,
          color: C.line,
        });

        const redW = (colW * v.action) / maxOwner;
        const amberW = (colW * v.review) / maxOwner;

        if (redW > 0) {
          page.drawRectangle({
            x: rightX,
            y: by,
            width: redW,
            height: 4,
            color: SEV_COLOUR.RED,
          });
        }
        if (amberW > 0) {
          page.drawRectangle({
            x: rightX + redW,
            y: by,
            width: amberW,
            height: 4,
            color: SEV_COLOUR.AMBER,
          });
        }
      });
    }

    y = top - panelH - 10;

    /* Deadline strip ---------------------------------------------- */

    const baseParsed = Date.parse(`${data.run.asOf}T00:00:00.000Z`);
    const baseMs = Number.isNaN(baseParsed)
      ? data.run.createdAt.getTime()
      : baseParsed;

    let overdue = 0;
    let dueSoon = 0;

    for (const f of data.findings) {
      if (!f.dueDate || f.severity === "GREEN") continue;
      const days = Math.round((f.dueDate.getTime() - baseMs) / 86_400_000);
      if (days < 0) overdue++;
      else if (days <= 30) dueSoon++;
    }

    const flaggedForGlance = data.findings.filter(
      (f) => f.severity === "RED" || f.severity === "AMBER"
    );
    const unverifiedForGlance = flaggedForGlance.filter(
      (f) => !f.ruleVerified
    ).length;

    para(
      `Past due: ${overdue}   |   Due within 30 days: ${dueSoon}   |   Rules to verify: ${unverifiedForGlance} of ${flaggedForGlance.length}   |   Checks not run: ${data.skipped.length}`,
      { size: 8.5, color: C.grey, font: bold }
    );

    y -= 8;
  }

  /* -------------------------------------------------------------- */
  /* Reading notes                                                   */
  /* -------------------------------------------------------------- */

  const flagged = data.findings.filter(
    (f) => f.severity === "RED" || f.severity === "AMBER"
  );
  const unverified = flagged.filter((f) => !f.ruleVerified).length;

  para(
    "This report is a preparation aid for professional review. It is not legal, tax or financial advice, and each finding should be confirmed against the source documents before action.",
    { size: 8.5, color: C.grey }
  );

  if (unverified > 0) {
    y -= 3;
    para(
      `${unverified} of the ${flagged.length} flagged finding${flagged.length === 1 ? "" : "s"} rest on rules that have not yet been verified against the Act or Rules text. Confirm these before relying on them.`,
      { size: 8.5, color: SEV_COLOUR.AMBER, font: bold }
    );
  }

  y -= 10;

  /* -------------------------------------------------------------- */
  /* Findings                                                        */
  /* -------------------------------------------------------------- */

  function metaLines(f: ReportFinding): string[] {
    const lines: string[] = [];

    if (f.ruleSource) lines.push(`Rule: ${f.ruleSource}`);

    if (f.rows.length > 0) {
      const shown = f.rows.slice(0, 15).join(", ");
      lines.push(
        `Register rows: ${shown}${f.rows.length > 15 ? ", ..." : ""}`
      );
    }

    const parts: string[] = [];
    if (f.owner) parts.push(`Owner: ${f.owner}`);
    if (f.dueDate) parts.push(`Due: ${fmtDate(f.dueDate)}`);
    parts.push(`Rule status: ${f.ruleVerified ? "verified" : "needs verification"}`);
    lines.push(parts.join("   |   "));

    return lines;
  }

  function findingBlock(f: ReportFinding, compact: boolean) {
    const x = M + 12;
    const width = CONTENT_W - 12;

    const titleLines = wrap(f.title, bold, 10.5, width);
    const detailLines = wrap(f.detail, regular, 9.5, width);
    const metaWrapped = compact
      ? []
      : metaLines(f).flatMap((m) => wrap(m, regular, 8.5, width));

    const height =
      titleLines.length * 14 +
      detailLines.length * 12.5 +
      metaWrapped.length * 11.5 +
      12;

    ensure(Math.min(height, 200));

    const top = y;

    page.drawRectangle({
      x: M,
      y: top - height + 6,
      width: 3.5,
      height: height - 6,
      color: SEV_COLOUR[f.severity],
    });

    let cy = top;

    for (const line of titleLines) {
      page.drawText(line, { x, y: cy - 10.5, size: 10.5, font: bold, color: C.text });
      cy -= 14;
    }
    for (const line of detailLines) {
      page.drawText(line, { x, y: cy - 9.5, size: 9.5, font: regular, color: C.text });
      cy -= 12.5;
    }
    for (const line of metaWrapped) {
      page.drawText(line, { x, y: cy - 8.5, size: 8.5, font: regular, color: C.grey });
      cy -= 11.5;
    }

    y = top - height;
  }

  for (const sev of SEV_ORDER) {
    const group = data.findings.filter((f) => f.severity === sev);
    if (group.length === 0) continue;

    ensure(70);

    page.drawRectangle({
      x: M,
      y: y - 11,
      width: 9,
      height: 9,
      color: SEV_COLOUR[sev],
    });
    page.drawText(`${SEV_LABEL[sev]} (${group.length})`, {
      x: M + 15,
      y: y - 10,
      size: 12,
      font: bold,
      color: C.text,
    });
    y -= 24;

    for (const f of group) {
      findingBlock(f, sev === "GREEN");
    }

    y -= 6;
  }

  /* -------------------------------------------------------------- */
  /* Fix list                                                        */
  /* -------------------------------------------------------------- */

  const fixes = buildFixList(data.findings);

  if (fixes.length > 0) {
    ensure(80);
    y -= 4;

    page.drawText("Fix list", { x: M, y: y - 13, size: 14, font: bold, color: C.text });
    y -= 24;

    para("Ordered by severity, then by due date.", { size: 8.5, color: C.grey });
    y -= 4;

    fixes.forEach((f, i) => {
      const lead = `${i + 1}.`;
      const x = M + 20;
      const width = CONTENT_W - 20;

      const titleLines = wrap(f.title, bold, 9.5, width);
      const info = [
        f.owner ? `Owner: ${f.owner}` : "Owner: to be assigned",
        f.dueDate ? `Due: ${fmtDate(f.dueDate)}` : "Due: not time-bound",
      ].join("   |   ");

      const height = titleLines.length * 13 + 12 + 8;
      ensure(height);

      const top = y;
      page.drawText(lead, { x: M, y: top - 9.5, size: 9.5, font: bold, color: SEV_COLOUR[f.severity] });

      let cy = top;
      for (const line of titleLines) {
        page.drawText(line, { x, y: cy - 9.5, size: 9.5, font: bold, color: C.text });
        cy -= 13;
      }
      page.drawText(clean(info), { x, y: cy - 8.5, size: 8.5, font: regular, color: C.grey });

      y = top - height;
    });
  }

  /* -------------------------------------------------------------- */
  /* Checks not run                                                  */
  /* -------------------------------------------------------------- */

  if (data.skipped.length > 0) {
    ensure(70);
    y -= 8;

    page.drawText("Checks not run", { x: M, y: y - 13, size: 14, font: bold, color: C.text });
    y -= 24;

    para(
      "These checks could not run because the information was not available. They are not passes.",
      { size: 8.5, color: C.grey }
    );
    y -= 4;

    for (const s of data.skipped) {
      para(`- ${s}`, { size: 9, x: M + 4, width: CONTENT_W - 4 });
    }
  }

  /* -------------------------------------------------------------- */
  /* Footer on every page                                            */
  /* -------------------------------------------------------------- */

  const pages = doc.getPages();
  const footerLeft = truncate(data.footer ?? data.brand, regular, 7.5, CONTENT_W - 90);

  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: M, y: 44 },
      end: { x: PAGE_W - M, y: 44 },
      thickness: 0.5,
      color: C.line,
    });

    p.drawText(footerLeft, { x: M, y: 32, size: 7.5, font: regular, color: C.grey });

    p.drawText("Preparation aid for professional review. Not legal, tax or financial advice.", {
      x: M,
      y: 22,
      size: 7,
      font: regular,
      color: C.grey,
    });

    const label = `Page ${i + 1} of ${pages.length}`;
    const w = regular.widthOfTextAtSize(label, 7.5);
    p.drawText(label, {
      x: PAGE_W - M - w,
      y: 32,
      size: 7.5,
      font: regular,
      color: C.grey,
    });
  });

  return doc.save();
}
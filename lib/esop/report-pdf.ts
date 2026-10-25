import type { PDFFont, PDFPage } from "pdf-lib";

/* ============================================================
   EMPLOYEE EQUITY REPORT (PDF)

   A one-page, client-ready summary built from the live EVC model
   on the Reports page. Layout: header band, honesty banner,
   key figures, ownership & dilution, Bear/Base/Bull take-home
   table, plain-language reading, assumptions, footer band.

   Everything printed here is passed in from the Reports model.
   Nothing is invented, and unknown values are omitted rather
   than shown as zero.
============================================================ */

export type PdfScenario = {
  label: string; // "Bear" | "Base" | "Bull"
  valuation: number;
  salePrice: number;
  gross: number;
  estimatedTax: number;
  proceeds: number; // estimated take-home
  multiple: number; // take-home / exercise cost
  retained: number; // % kept after cost and tax
};

export type EmployeeReportInput = {
  companyName: string;
  grantName?: string | null;
  confirmedGrant: boolean;
  basisLabel: "Full grant" | "Currently vested options";

  optionsGranted: number;
  modeledOptions: number;
  modeledPercent: number;
  exercisePrice: number;
  exerciseCost: number;

  companyShares: number;
  currentOwnershipPct: number;
  dilutedOwnershipPct: number;
  dilutionPct: number;
  currentCompanyValuation: number;
  currentStakeValue: number;

  scenarios: [PdfScenario, PdfScenario, PdfScenario]; // bear, base, bull

  equityType: "UNLISTED" | "LISTED";
  taxRegime: "NEW" | "OLD";
  exerciseFMV: number;
  holdingPeriodMonths: number;
  otherAnnualIncome: number;

  generatedAt: Date;
};

/* ============================================================
   FORMATTING
============================================================ */

const inr = (value: number) =>
  `₹${Math.round(
    Number.isFinite(value) ? value : 0
  ).toLocaleString("en-IN")}`;

const inr2 = (value: number) =>
  `₹${(Number.isFinite(value)
    ? value
    : 0
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const num = (value: number) =>
  Math.round(
    Number.isFinite(value) ? value : 0
  ).toLocaleString("en-IN");

function trim(value: number, digits: number) {
  return Number(value.toFixed(digits)).toString();
}

/* "₹50 Cr", "₹7.5 Cr", "₹40 L" for table headers. */
function crore(value: number) {
  if (value >= 10_000_000) {
    return `₹${trim(value / 10_000_000, 2)} Cr`;
  }

  if (value >= 100_000) {
    return `₹${trim(value / 100_000, 2)} L`;
  }

  return inr(value);
}

/* "₹17.9 lakh" / "₹2.4 crore" for the plain-language reading. */
function words(value: number) {
  if (value >= 10_000_000) {
    return `₹${trim(value / 10_000_000, 2)} crore`;
  }

  if (value >= 100_000) {
    return `₹${trim(value / 100_000, 1)} lakh`;
  }

  return inr(value);
}

const pct = (value: number, digits = 1) =>
  `${trim(Number.isFinite(value) ? value : 0, digits)}%`;

const mult = (value: number) =>
  `${trim(Number.isFinite(value) ? value : 0, 2)}×`;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ============================================================
   PDF DRAWING HELPERS
============================================================ */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;

type Fonts = {
  regular: PDFFont;
  bold: PDFFont;
};

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    const tokens = paragraph.split(" ");
    let line = "";

    for (const token of tokens) {
      const attempt = line
        ? `${line} ${token}`
        : token;

      if (
        font.widthOfTextAtSize(
          attempt,
          size
        ) > maxWidth &&
        line
      ) {
        lines.push(line);
        line = token;
      } else {
        line = attempt;
      }
    }

    lines.push(line);
  }

  return lines;
}

/* ============================================================
   MAIN
============================================================ */

export type FontLoader = () => Promise<{
  regularBytes: ArrayBuffer | Uint8Array;
  boldBytes: ArrayBuffer | Uint8Array;
}>;

/**
 * Builds the PDF and returns its bytes.
 *
 * Fonts are loaded from /fonts (DejaVu Sans) and embedded so the
 * rupee sign ₹ renders correctly; the standard PDF fonts cannot
 * draw it.
 */
export async function buildEmployeeReportPdf(
  input: EmployeeReportInput,
  options?: {
    loadFonts?: FontLoader;
    /* Test hook: supply already-embedded fonts. */
    fontsOverride?: (
      doc: import("pdf-lib").PDFDocument
    ) => Promise<Fonts>;
  }
): Promise<Uint8Array> {
  const { PDFDocument, rgb } = await import(
    "pdf-lib"
  );

  const doc = await PDFDocument.create();

  doc.setTitle(
    `EVC Equity Report - ${input.companyName}`
  );
  doc.setAuthor("ESOP Value Clarity");
  doc.setCreator("ESOP Value Clarity");
  doc.setProducer("ESOP Value Clarity");
  doc.setCreationDate(input.generatedAt);

  let fonts: Fonts;

  if (options?.fontsOverride) {
    fonts = await options.fontsOverride(doc);
  } else {
    const fontkit = (
      await import("@pdf-lib/fontkit")
    ).default;

    doc.registerFontkit(fontkit);

    const { regularBytes, boldBytes } =
      await (
        options?.loadFonts ??
        defaultFontLoader
      )();

    fonts = {
      regular: await doc.embedFont(
        regularBytes,
        { subset: true }
      ),
      bold: await doc.embedFont(boldBytes, {
        subset: true,
      }),
    };
  }

  const page: PDFPage = doc.addPage([
    PAGE_W,
    PAGE_H,
  ]);

  const NAVY = rgb(0.043, 0.122, 0.227);
  const SLATE = rgb(0.278, 0.333, 0.412);
  const INK = rgb(0.059, 0.09, 0.165);
  const PALE = rgb(0.933, 0.957, 1);
  const PALE_LINE = rgb(0.78, 0.84, 0.93);
  const HILITE = rgb(0.859, 0.91, 1);
  const BLUE = rgb(0.114, 0.306, 0.847);
  const WHITE = rgb(1, 1, 1);

  // Cursor measured from the TOP of the page.
  let y = MARGIN;

  const toY = (top: number, height = 0) =>
    PAGE_H - top - height;

  const text = (
    value: string,
    x: number,
    top: number,
    size: number,
    font: PDFFont,
    color = INK
  ) => {
    page.drawText(value, {
      x,
      y: toY(top) - size * 0.8,
      size,
      font,
      color,
    });
  };

  const rightText = (
    value: string,
    rightX: number,
    top: number,
    size: number,
    font: PDFFont,
    color = INK
  ) => {
    text(
      value,
      rightX -
        font.widthOfTextAtSize(
          value,
          size
        ),
      top,
      size,
      font,
      color
    );
  };

  const paragraph = (
    value: string,
    x: number,
    top: number,
    size: number,
    width: number,
    color = SLATE,
    font = fonts.regular,
    lineHeight = size * 1.45
  ) => {
    const lines = wrap(
      value,
      font,
      size,
      width
    );

    lines.forEach((line, index) =>
      text(
        line,
        x,
        top + index * lineHeight,
        size,
        font,
        color
      )
    );

    return lines.length * lineHeight;
  };

  const heading = (value: string) => {
    text(value, MARGIN + 4, y, 11.5, fonts.bold, NAVY);
    y += 22;
  };

  /* ---------------- header band ---------------- */

  const subtitle = [
    input.confirmedGrant
      ? `Grant: ${input.companyName}${
          input.grantName
            ? ` (${input.grantName})`
            : ""
        }`
      : `Company: ${input.companyName}`,
    `Basis: ${input.basisLabel.toLowerCase()}`,
    `Generated in EVC PRO, ${formatDate(
      input.generatedAt
    )}`,
  ].join(" · ");

  const subtitleLines = wrap(
    subtitle,
    fonts.regular,
    9,
    CONTENT_W - 28
  );

  const headerH =
    38 + subtitleLines.length * 13 + 12;

  page.drawRectangle({
    x: MARGIN,
    y: toY(y, headerH),
    width: CONTENT_W,
    height: headerH,
    color: NAVY,
  });

  text(
    "ESOP Value Clarity — Employee Equity Report",
    MARGIN + 14,
    y + 14,
    16,
    fonts.bold,
    WHITE
  );

  subtitleLines.forEach((line, index) =>
    text(
      line,
      MARGIN + 14,
      y + 38 + index * 13,
      9,
      fonts.regular,
      rgb(0.82, 0.87, 0.95)
    )
  );

  y += headerH + 8;

  /* ---------------- honesty banner ---------------- */

  const bannerText = input.confirmedGrant
    ? "ESTIMATES, NOT TAX ADVICE. Decision support only. Built from the grant document confirmed in EVC, with the assumptions listed in section 4."
    : "ESTIMATES, NOT TAX ADVICE. Decision support only. Built from manually entered figures, not from a confirmed grant document.";

  const bannerLines = wrap(
    bannerText,
    fonts.regular,
    8.5,
    CONTENT_W - 24
  );

  const bannerH =
    bannerLines.length * 12 + 14;

  page.drawRectangle({
    x: MARGIN,
    y: toY(y, bannerH),
    width: CONTENT_W,
    height: bannerH,
    color: rgb(0.996, 0.953, 0.78),
  });

  bannerLines.forEach((line, index) =>
    text(
      line,
      MARGIN + 12,
      y + 7 + index * 12,
      8.5,
      fonts.regular,
      rgb(0.573, 0.251, 0.055)
    )
  );

  y += bannerH + 18;

  /* ---------------- 1. key figures ---------------- */

  heading("1. What the employee holds");

  const modeledLabel =
    input.basisLabel === "Full grant"
      ? `modelled: full grant (${pct(
          input.modeledPercent,
          0
        )})`
      : `vested today (${pct(
          input.modeledPercent,
          0
        )})`;

  const kpis: [string, string][] = [
    [num(input.optionsGranted), "options granted"],
    [num(input.modeledOptions), modeledLabel],
    [
      inr2(input.exercisePrice),
      "exercise price per option",
    ],
    [
      inr(input.exerciseCost),
      `cash needed to exercise ${
        input.basisLabel === "Full grant"
          ? "the full grant"
          : "vested options"
      }`,
    ],
  ];

  const kpiW = CONTENT_W / 4;
  const kpiTopH = 30;
  const kpiBotH = 30;

  page.drawRectangle({
    x: MARGIN,
    y: toY(y, kpiTopH + kpiBotH),
    width: CONTENT_W,
    height: kpiTopH + kpiBotH,
    color: PALE,
    borderColor: PALE_LINE,
    borderWidth: 0.7,
  });

  kpis.forEach(([value, label], index) => {
    const x = MARGIN + index * kpiW;

    if (index > 0) {
      page.drawLine({
        start: { x, y: toY(y) },
        end: {
          x,
          y: toY(y, kpiTopH + kpiBotH),
        },
        thickness: 0.7,
        color: PALE_LINE,
      });
    }

    text(value, x + 10, y + 9, 14, fonts.bold, INK);

    paragraph(
      label,
      x + 10,
      y + kpiTopH + 8,
      7.5,
      kpiW - 18,
      SLATE
    );
  });

  y += kpiTopH + kpiBotH + 18;

  /* ---------------- 2. ownership ---------------- */

  heading("2. Ownership and dilution");

  const ownership =
    `${num(input.modeledOptions)} options on ${num(
      input.companyShares
    )} company shares = ${trim(
      input.currentOwnershipPct,
      3
    )}% ownership today. After the modelled future dilution of ${pct(
      input.dilutionPct
    )}, that becomes ${trim(
      input.dilutedOwnershipPct,
      3
    )}%.` +
    (input.currentCompanyValuation > 0
      ? ` At the current ${crore(
          input.currentCompanyValuation
        )} company valuation, this stake is worth about ${inr(
          input.currentStakeValue
        )} on paper.`
      : "");

  y +=
    paragraph(
      ownership,
      MARGIN + 4,
      y,
      9,
      CONTENT_W - 8
    ) + 14;

  /* ---------------- 3. exit table ---------------- */

  heading("3. What could be left in hand at exit");

  const [bear, base, bull] = input.scenarios;

  const rows: {
    label: string;
    cells: string[];
    highlight?: boolean;
  }[] = [
    {
      label: "Company exit valuation",
      cells: input.scenarios.map((s) =>
        crore(s.valuation)
      ),
    },
    {
      label: "Price per share after dilution",
      cells: input.scenarios.map((s) =>
        inr2(s.salePrice)
      ),
    },
    {
      label: "Gross value of stake",
      cells: input.scenarios.map((s) =>
        inr(s.gross)
      ),
    },
    {
      label: "Less: exercise cost",
      cells: input.scenarios.map(
        () => `– ${inr(input.exerciseCost)}`
      ),
    },
    {
      label: "Less: estimated tax",
      cells: input.scenarios.map(
        (s) => `– ${inr(s.estimatedTax)}`
      ),
    },
    {
      label: "Estimated take-home",
      cells: input.scenarios.map((s) =>
        inr(s.proceeds)
      ),
      highlight: true,
    },
  ];

  if (input.exerciseCost > 0) {
    rows.push({
      label: "Take-home ÷ exercise cost",
      cells: input.scenarios.map((s) =>
        mult(s.multiple)
      ),
    });
  }

  rows.push({
    label: "Value kept after cost and tax",
    cells: input.scenarios.map((s) =>
      pct(s.retained)
    ),
  });

  const labelW = CONTENT_W * 0.4;
  const colW = (CONTENT_W - labelW) / 3;
  const rowH = 20;

  // header row
  page.drawRectangle({
    x: MARGIN,
    y: toY(y, rowH),
    width: CONTENT_W,
    height: rowH,
    color: PALE,
    borderColor: PALE_LINE,
    borderWidth: 0.7,
  });

  input.scenarios.forEach((scenario, index) =>
    rightText(
      scenario.label,
      MARGIN + labelW + colW * (index + 1) - 10,
      y + 6,
      9,
      fonts.bold,
      INK
    )
  );

  y += rowH;

  rows.forEach((row) => {
    page.drawRectangle({
      x: MARGIN,
      y: toY(y, rowH),
      width: CONTENT_W,
      height: rowH,
      color: row.highlight ? HILITE : WHITE,
      borderColor: PALE_LINE,
      borderWidth: 0.7,
    });

    text(
      row.label,
      MARGIN + 10,
      y + 6,
      9,
      row.highlight ? fonts.bold : fonts.regular,
      INK
    );

    row.cells.forEach((cell, index) =>
      rightText(
        cell,
        MARGIN + labelW + colW * (index + 1) - 10,
        y + 6,
        9,
        row.highlight
          ? fonts.bold
          : fonts.regular,
        row.highlight ? BLUE : INK
      )
    );

    y += rowH;
  });

  y += 10;

  const reading =
    `Plain reading (Base case): ${words(
      base.gross
    )} on paper becomes about ${words(
      base.proceeds
    )} in hand, after ${words(
      input.exerciseCost
    )} to exercise and ${words(
      base.estimatedTax
    )} in estimated tax. Across Bear to Bull, take-home ranges from about ${words(
      bear.proceeds
    )} to ${words(bull.proceeds)}.`;

  y +=
    paragraph(
      reading,
      MARGIN + 4,
      y,
      9,
      CONTENT_W - 8
    ) + 14;

  /* ---------------- 4. assumptions ---------------- */

  heading("4. Assumptions behind these numbers");

  const assumptions =
    `${
      input.equityType === "LISTED"
        ? "Listed"
        : "Unlisted"
    } shares · ${
      input.taxRegime === "NEW" ? "New" : "Old"
    } tax regime · Bear / Bull = 0.5× / 2× the Base exit valuation · Future dilution ${pct(
      input.dilutionPct
    )} · Fair market value at exercise ${inr2(
      input.exerciseFMV
    )} per share · Holding period ${num(
      input.holdingPeriodMonths
    )} months · Other annual income ${inr(
      input.otherAnnualIncome
    )}. Tax includes perquisite at exercise and capital gains at sale, with surcharge and cess where they apply. Every assumption is visible and editable in EVC; change one and the whole chain recalculates.`;

  y += paragraph(
    assumptions,
    MARGIN + 4,
    y,
    8.5,
    CONTENT_W - 8
  );

  y += 4;

  y +=
    paragraph(
      "Not modelled: liquidation preferences, multiple share classes, company share buybacks taxed as deemed dividend, transaction costs, special ESOP tax deferral cases. Outcomes are not guaranteed payouts.",
      MARGIN + 4,
      y,
      8.5,
      CONTENT_W - 8
    ) + 14;

  /* ---------------- footer band ---------------- */

  const footerH = 40;
  const footerTop = Math.max(
    y,
    PAGE_H - MARGIN - footerH - 20
  );

  page.drawRectangle({
    x: MARGIN,
    y: toY(footerTop, footerH),
    width: CONTENT_W,
    height: footerH,
    color: NAVY,
  });

  text(
    "ESOP Value Clarity · Grant PDF → vesting → exercise → dilution → tax → Bear/Base/Bull take-home → report",
    MARGIN + 12,
    footerTop + 10,
    7.5,
    fonts.regular,
    WHITE
  );

  text(
    "sheshank@esopvalueclarity.com · esopvalueclarity.com",
    MARGIN + 12,
    footerTop + 24,
    7.5,
    fonts.regular,
    WHITE
  );

  return doc.save();
}

async function defaultFontLoader() {
  const [regular, bold] = await Promise.all([
    fetch("/fonts/DejaVuSans.ttf"),
    fetch("/fonts/DejaVuSans-Bold.ttf"),
  ]);

  if (!regular.ok || !bold.ok) {
    throw new Error(
      "Could not load the report fonts."
    );
  }

  return {
    regularBytes: await regular.arrayBuffer(),
    boldBytes: await bold.arrayBuffer(),
  };
}

/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   LOCAL / API-FREE OFFER LETTER PARSER

   Responsibilities:
   - parse extracted offer-letter TEXT locally
   - identify common Indian compensation terminology
   - identify ESOP / RSU terminology
   - understand Indian money formats
   - attach source evidence to extracted values
   - assign extraction confidence
   - produce a ScannedOfferLetter
   - run scanner validation after extraction

   IMPORTANT:
   This file DOES NOT:
   - upload PDFs
   - extract text from PDF binary
   - use OpenAI / Gemini / Groq / Anthropic
   - use any paid API
   - use OCR
   - calculate offer economics
   - modify Phase 1–3 state

   FLOW:

   PDF
     ↓
   local text extraction
     ↓
   THIS PARSER
     ↓
   ScannedOfferLetter
     ↓
   scanner-validation.ts
     ↓
   Review & Confirm
     ↓
   scanner-normalize.ts
     ↓
   OfferInput
============================================================ */

import type {
  OfferScannerCompanyStatus,
  OfferScannerConfidence,
  OfferScannerCurrency,
  OfferScannerDocumentMetadata,
  OfferScannerDocumentType,
  OfferScannerEmployerFields,
  OfferScannerEquityFields,
  OfferScannerEquityType,
  OfferScannerField,
  OfferScannerFileType,
  OfferScannerCashFields,
  OfferScannerBenefitFields,
  OfferScannerSpecialConditions,
  OfferScannerVestingFrequency,
  OfferScannerWorkMode,
  OfferScannerEmploymentType,
  ScannedOfferLetter,
} from "./scanner-types";

import {
  createEmptyScannerField,
  createExtractedScannerField,
  createMissingScannerField,
} from "./scanner-types";

import {
  applyScannerValidation,
  applyScannerHardFilters,
} from "./scanner-validation";

/* ============================================================
   PUBLIC INPUT
============================================================ */

export type ParseOfferLetterTextInput = {
  text: string;

  documentId?: string;

  fileName?: string;

  fileType?: OfferScannerFileType;

  documentTypeHint?: OfferScannerDocumentType;

  currencyHint?: OfferScannerCurrency;

  pageCount?: number;

  detectedLanguage?: string;
};

/* ============================================================
   INTERNAL TYPES
============================================================ */

type TextLine = {
  text: string;

  normalized: string;

  lineNumber: number;
};

type LineMatch = {
  line: TextLine;

  match: RegExpMatchArray;
};

type MoneyMatchResult = {
  value: number;

  rawValue: string;

  currency:
    OfferScannerCurrency;

  confidence:
    OfferScannerConfidence;
};

/* ============================================================
   BASIC HELPERS
============================================================ */

function nowISO(): string {
  return new Date()
    .toISOString();
}

function createId(): string {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `scan-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeWhitespace(
  value: string
): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeLine(
  value: string
): string {
  return normalizeWhitespace(
    value
  ).toLowerCase();
}

function splitIntoLines(
  text: string
): TextLine[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(
      (
        raw,
        index
      ): TextLine => ({
        text:
          normalizeWhitespace(
            raw
          ),

        normalized:
          normalizeLine(
            raw
          ),

        lineNumber:
          index + 1,
      })
    )
    .filter(
      (line) =>
        line.text.length > 0
    );
}

function firstMatch(
  lines: TextLine[],
  patterns: RegExp[]
): LineMatch | null {
  for (
    const line of
    lines
  ) {
    for (
      const pattern of
      patterns
    ) {
      const match =
        line.text.match(
          pattern
        );

      if (match) {
        return {
          line,
          match,
        };
      }
    }
  }

  return null;
}

function allMatches(
  lines: TextLine[],
  patterns: RegExp[]
): LineMatch[] {
  const results:
    LineMatch[] =
    [];

  for (
    const line of
    lines
  ) {
    for (
      const pattern of
      patterns
    ) {
      const match =
        line.text.match(
          pattern
        );

      if (match) {
        results.push({
          line,
          match,
        });

        break;
      }
    }
  }

  return results;
}

function evidenceFromLine(
  line: TextLine,
  label?: string
) {
  return [
    {
      label:
        label ??
        undefined,

      excerpt:
        line.text,
    },
  ];
}

/* ============================================================
   MONEY PARSING

   Supports examples such as:

   ₹24,00,000
   Rs. 24,00,000
   INR 24,00,000
   2400000
   24 lakh
   24 lakhs
   24 L
   24 LPA
   24.5 lakh
   2.4 million
   1 crore
   1.2 cr
============================================================ */

function cleanNumericString(
  value: string
): number {
  const cleaned =
    value
      .replace(/,/g, "")
      .replace(/\s/g, "")
      .trim();

  const parsed =
    Number(cleaned);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function detectCurrencyFromText(
  value: string
): OfferScannerCurrency {
  const lower =
    value.toLowerCase();

  if (
    /₹|\binr\b|\brs\.?\b|\brupees?\b/.test(
      lower
    )
  ) {
    return "INR";
  }

  if (
    /\busd\b|\$/.test(
      lower
    )
  ) {
    return "USD";
  }

  if (
    /\beur\b|€/.test(
      lower
    )
  ) {
    return "EUR";
  }

  if (
    /\bgbp\b|£/.test(
      lower
    )
  ) {
    return "GBP";
  }

  if (
    /\baed\b/.test(
      lower
    )
  ) {
    return "AED";
  }

  if (
    /\bsgd\b/.test(
      lower
    )
  ) {
    return "SGD";
  }

  return "UNKNOWN";
}

function parseMoneyFromText(
  text: string,
  fallbackCurrency:
    OfferScannerCurrency =
      "UNKNOWN"
): MoneyMatchResult | null {
  const normalized =
    normalizeWhitespace(
      text
    );

  /*
   * Crore / Cr
   */
  const crore =
    normalized.match(
      /(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:crores?|cr)\b/i
    );

  if (crore) {
    const number =
      cleanNumericString(
        crore[1]
      );

    return {
      value:
        number *
        10_000_000,

      rawValue:
        crore[0],

      currency:
        detectCurrencyFromText(
          crore[0]
        ) !== "UNKNOWN"
          ? detectCurrencyFromText(
              crore[0]
            )
          : fallbackCurrency,

      confidence:
        "HIGH",
    };
  }

  /*
   * Lakh / Lac / L / LPA
   */
  const lakh =
    normalized.match(
      /(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:lakhs?|lacs?|lpa|l)\b/i
    );

  if (lakh) {
    const number =
      cleanNumericString(
        lakh[1]
      );

    return {
      value:
        number *
        100_000,

      rawValue:
        lakh[0],

      currency:
        detectCurrencyFromText(
          lakh[0]
        ) !== "UNKNOWN"
          ? detectCurrencyFromText(
              lakh[0]
            )
          : fallbackCurrency,

      confidence:
        "HIGH",
    };
  }

  /*
   * Million
   */
  const million =
    normalized.match(
      /(?:₹|rs\.?|inr|\$|usd|eur|gbp)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:million|mn)\b/i
    );

  if (million) {
    return {
      value:
        cleanNumericString(
          million[1]
        ) *
        1_000_000,

      rawValue:
        million[0],

      currency:
        detectCurrencyFromText(
          million[0]
        ) !== "UNKNOWN"
          ? detectCurrencyFromText(
              million[0]
            )
          : fallbackCurrency,

      confidence:
        "HIGH",
    };
  }

  /*
   * Explicit currency + normal amount
   */
  const explicit =
    normalized.match(
      /(?:₹|rs\.?|inr|usd|\$|eur|€|gbp|£|aed|sgd)\s*[:\-]?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i
    );

  if (explicit) {
    return {
      value:
        cleanNumericString(
          explicit[1]
        ),

      rawValue:
        explicit[0],

      currency:
        detectCurrencyFromText(
          explicit[0]
        ) !== "UNKNOWN"
          ? detectCurrencyFromText(
              explicit[0]
            )
          : fallbackCurrency,

      confidence:
        "HIGH",
    };
  }

  /*
   * Plain large number.

   * Require at least 4 digits to avoid accidentally treating
   * "12 months" or "90 days" as compensation.
   */
  const plain =
    normalized.match(
      /\b([0-9][0-9,]{3,}(?:\.[0-9]+)?)\b/
    );

  if (plain) {
    return {
      value:
        cleanNumericString(
          plain[1]
        ),

      rawValue:
        plain[0],

      currency:
        fallbackCurrency,

      confidence:
        "MEDIUM",
    };
  }

  return null;
}

/* ============================================================
   MONEY FIELD EXTRACTION
============================================================ */

function extractMoneyField(
  lines: TextLine[],
  labelPatterns: RegExp[],
  fallbackCurrency:
    OfferScannerCurrency,
  label: string
): OfferScannerField<number> {
  const candidates =
    allMatches(
      lines,
      labelPatterns
    );

  for (
    const candidate of
    candidates
  ) {
    const money =
      parseMoneyFromText(
        candidate.line.text,
        fallbackCurrency
      );

    if (
      money &&
      money.value >= 0
    ) {
      return createExtractedScannerField(
        money.value,
        {
          rawValue:
            money.rawValue,

          confidence:
            money.confidence,

          evidence:
            evidenceFromLine(
              candidate.line,
              label
            ),
        }
      );
    }
  }

  return createMissingScannerField<number>();
}

/* ============================================================
   PERCENTAGE-OF-BASE CASH EXTRACTION

   Indian offer letters often state variable compensation as
   "10% of base salary" instead of an INR amount. Derive it only
   when the base salary was directly extracted from the same offer.
============================================================ */

function extractPercentageOfBaseSalary(
  lines: TextLine[],
  labelPatterns: RegExp[],
  baseSalary: OfferScannerField<number>,
  label: string
): OfferScannerField<number> {
  if (
    !baseSalary.value ||
    baseSalary.value <= 0
  ) {
    return createMissingScannerField<number>();
  }

  for (
    const candidate of allMatches(
      lines,
      labelPatterns
    )
  ) {
    const match =
      candidate.line.text.match(
        /([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:of\s+)?(?:base|basic)\s+(?:salary|pay)\b/i
      );

    if (!match) {
      continue;
    }

    const percentage =
      Number(match[1]);

    if (
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      continue;
    }

    return createExtractedScannerField(
      Math.round(
        (baseSalary.value * percentage) / 100
      ),
      {
        rawValue:
          `${match[1]}% of base salary`,
        confidence: "MEDIUM",
        evidence: evidenceFromLine(
          candidate.line,
          label
        ),
        inferred: true,
        notes: [
          `Calculated from ${match[1]}% of the directly extracted base salary.`,
        ],
      }
    );
  }

  return createMissingScannerField<number>();
}

function extractTargetVariablePayField(
  lines: TextLine[],
  currency: OfferScannerCurrency,
  basicSalary: OfferScannerField<number>
): OfferScannerField<number> {
  const explicitlyLabelled = extractMoneyField(
    lines,
    [
      /^\s*(?:target\s+variable\s+pay|annual\s+variable\s+pay|variable\s+pay)\b/i,
      /^\s*(?:target\s+bonus|performance\s+bonus)\b/i,
    ],
    currency,
    "Target variable pay"
  );

  if (explicitlyLabelled.value !== null) {
    return explicitlyLabelled;
  }

  return extractPercentageOfBaseSalary(
    lines,
    [
      /\bperformance\s+bonus\b/i,
      /\bperformance\s+incentive\b/i,
      /\btarget\s+variable\s+pay\b/i,
      /\btarget\s+bonus\b/i,
    ],
    basicSalary,
    "Target variable pay"
  );
}

/* ============================================================
   NUMBER EXTRACTION
============================================================ */

function extractNumberField(
  lines: TextLine[],
  patterns: RegExp[],
  label: string,
  options?: {
    allowZero?: boolean;

    max?: number;
  }
): OfferScannerField<number> {
  const candidate =
    firstMatch(
      lines,
      patterns
    );

  if (!candidate) {
    return createMissingScannerField<number>();
  }

  const captured =
    candidate.match[1];

  if (!captured) {
    return createMissingScannerField<number>();
  }

  const value =
    cleanNumericString(
      captured
    );

  if (
    !Number.isFinite(
      value
    ) ||
    (
      !options?.allowZero &&
      value <= 0
    ) ||
    (
      options?.max !==
        undefined &&
      value >
        options.max
    )
  ) {
    return createMissingScannerField<number>();
  }

  return createExtractedScannerField(
    value,
    {
      rawValue:
        captured,

      confidence:
        "HIGH",

      evidence:
        evidenceFromLine(
          candidate.line,
          label
        ),
    }
  );
}

/* ============================================================
   MONTH / YEAR DURATION
============================================================ */

function parseDurationMonths(
  text: string
): number | null {
  const years =
    text.match(
      /([0-9]+(?:\.[0-9]+)?)\s*(?:-\s*)?(?:years?|yrs?)\b/i
    );

  if (years) {
    const value =
      Number(
        years[1]
      );

    if (
      Number.isFinite(value)
    ) {
      return Math.round(
        value * 12
      );
    }
  }

  const months =
    text.match(
      /([0-9]+)\s*(?:-\s*)?(?:months?|mos?)\b/i
    );

  if (months) {
    const value =
      Number(
        months[1]
      );

    return Number.isFinite(
      value
    )
      ? Math.round(value)
      : null;
  }

  return null;
}

function extractDurationField(
  lines: TextLine[],
  patterns: RegExp[],
  label: string
): OfferScannerField<number> {
  const candidates =
    allMatches(
      lines,
      patterns
    );

  for (
    const candidate of
    candidates
  ) {
    const months =
      parseDurationMonths(
        candidate.line.text
      );

    if (
      months !== null &&
      months >= 0
    ) {
      return createExtractedScannerField(
        months,
        {
          rawValue:
            candidate.line.text,

          confidence:
            "HIGH",

          evidence:
            evidenceFromLine(
              candidate.line,
              label
            ),
        }
      );
    }
  }

  return createMissingScannerField<number>();
}

/* ============================================================
   BOOLEAN FIELD
============================================================ */

function extractBooleanMention(
  lines: TextLine[],
  patterns: RegExp[],
  label: string
): OfferScannerField<boolean> {
  const candidate =
    firstMatch(
      lines,
      patterns
    );

  if (!candidate) {
    return createMissingScannerField<boolean>();
  }

  return createExtractedScannerField(
    true,
    {
      rawValue:
        candidate.line.text,

      confidence:
        "MEDIUM",

      evidence:
        evidenceFromLine(
          candidate.line,
          label
        ),
    }
  );
}

/* ============================================================
   TEXT FIELD
============================================================ */

function extractTextAfterLabel(
  lines: TextLine[],
  patterns: RegExp[],
  label: string
): OfferScannerField<string> {
  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const line =
      lines[index];

    for (
      const pattern of
      patterns
    ) {
      const match =
        line.text.match(
          pattern
        );

      if (!match) {
        continue;
      }

      /* ------------------------------------------------------
         CASE 1
         Traditional same-line field:

         Position: Senior Software Engineer
         Company - Northstar Technologies Private Limited
      ------------------------------------------------------ */

      const capturedValue =
        match[1]
          ? normalizeWhitespace(
              match[1]
            )
          : "";

      if (
        capturedValue
      ) {
        return createExtractedScannerField(
          capturedValue,
          {
            rawValue:
              capturedValue,

            confidence:
              "HIGH",

            evidence:
              evidenceFromLine(
                line,
                label
              ),

            inferred:
              false,
          }
        );
      }

      /* ------------------------------------------------------
         CASE 2
         PDF table extraction:

         Position
         Senior Software Engineer

         Company
         Northstar Technologies Private Limited

         pdf-parse frequently turns table cells into separate
         text lines. When the current line is an exact field
         label, inspect the next non-empty extracted line.
      ------------------------------------------------------ */

      const nextLine =
        lines[
          index + 1
        ];

      if (
        nextLine &&
        nextLine.text
      ) {
        const nextValue =
          normalizeWhitespace(
            nextLine.text
          );

        /*
         * Do not accidentally consume another known label as
         * this field's value.
         */

        const looksLikeAnotherLabel =
          /^(?:company(?:\s+name)?|employer|organisation|organization|designation|position|role|job\s+title|role\s*&\s*employment|role\s+and\s+employment|department|work\s+location|location|place\s+of\s+work|employment\s+type|work\s+mode|joining\s+date|date\s+of\s+joining|start\s+date|commencement\s+date|annual\s+ctc|total\s+ctc|annual\s+fixed\s+compensation|fixed\s+compensation|basic\s+salary|hra|special\s+allowance|target\s+variable\s+pay|joining\s+bonus|employer\s+pf|gratuity|equity\s+grant)$/i.test(
            nextValue
          );

        if (
          !looksLikeAnotherLabel
        ) {
          return createExtractedScannerField(
            nextValue,
            {
              rawValue:
                nextValue,

              confidence:
                "MEDIUM",

              evidence: [
                {
                  label,

                  excerpt:
                    `${line.text} → ${nextLine.text}`,
                },
              ],

              inferred:
                false,

              notes: [
                "Value was extracted from the line immediately following the field label, which is common in PDF table extraction.",
              ],
            }
          );
        }
      }
    }
  }

  return createMissingScannerField<string>();
}

/* ============================================================
   DATE EXTRACTION

   We intentionally preserve detected text rather than attempting
   aggressive locale conversion.

   scanner-normalize.ts / Review UI can handle user confirmation.
============================================================ */

function extractDateField(
  lines: TextLine[],
  patterns: RegExp[],
  label: string
): OfferScannerField<string> {
  const candidate =
    firstMatch(
      lines,
      patterns
    );

  if (!candidate) {
    return createMissingScannerField<string>();
  }

  const date =
    candidate.match[1]
      ? normalizeWhitespace(
          candidate.match[1]
        )
      : "";

  if (!date) {
    return createMissingScannerField<string>();
  }

  return createExtractedScannerField(
    date,
    {
      rawValue:
        date,

      confidence:
        "MEDIUM",

      evidence:
        evidenceFromLine(
          candidate.line,
          label
        ),
    }
  );
}

/* ============================================================
   CURRENCY DETECTION
============================================================ */

function detectDocumentCurrency(
  text: string,
  hint?:
    OfferScannerCurrency
): OfferScannerCurrency {
  if (
    hint &&
    hint !== "UNKNOWN"
  ) {
    return hint;
  }

  const detected =
    detectCurrencyFromText(
      text
    );

  if (
    detected !== "UNKNOWN"
  ) {
    return detected;
  }

  /*
   * Indian offer letters frequently use lakh/LPA without
   * repeating INR.
   */
  if (
    /\b(?:lpa|lakhs?|lacs?|crores?)\b/i.test(
      text
    )
  ) {
    return "INR";
  }

  return "UNKNOWN";
}

/* ============================================================
   DOCUMENT TYPE
============================================================ */

function detectDocumentType(
  text: string,
  hint?:
    OfferScannerDocumentType
): OfferScannerDocumentType {
  if (
    hint &&
    hint !== "UNKNOWN"
  ) {
    return hint;
  }

  const lower =
    text.toLowerCase();

  const hasOffer =
    /\boffer\s+letter\b|\boffer\s+of\s+employment\b|\bemployment\s+offer\b/.test(
      lower
    );

  const hasGrant =
    /\bgrant\s+letter\b|\boption\s+grant\b|\besop\s+grant\b|\brsu\s+grant\b/.test(
      lower
    );

  const hasCompensation =
    /\bcompensation\s+annexure\b|\bsalary\s+annexure\b|\bctc\s+breakup\b|\bcompensation\s+structure\b/.test(
      lower
    );

  if (
    hasOffer &&
    hasGrant
  ) {
    return "MULTI_DOCUMENT";
  }

  if (hasGrant) {
    if (
      /\brsu\b|\brestricted\s+stock\s+units?\b/.test(
        lower
      )
    ) {
      return "RSU_GRANT";
    }

    return "ESOP_GRANT";
  }

  if (hasCompensation) {
    return "COMPENSATION_ANNEXURE";
  }

  if (hasOffer) {
    return "OFFER_LETTER";
  }

  if (
    /\bemployment\s+agreement\b/.test(
      lower
    )
  ) {
    return "EMPLOYMENT_AGREEMENT";
  }

  return "UNKNOWN";
}

/* ============================================================
   EQUITY TYPE
============================================================ */

function detectEquityType(
  lines: TextLine[]
): OfferScannerField<OfferScannerEquityType> {
  const text =
    lines
      .map(
        (line) =>
          line.text
      )
      .join("\n");

  /* ==========================================================
     NEGATIVE EQUITY DETECTION

     IMPORTANT:
     This MUST run before positive ESOP / RSU / stock detection.

     Examples:

     "No ESOPs are offered."
     "No equity component."
     "This offer does not include any ESOP, RSU or stock option."
     "You are not eligible for stock options."
     "There is no equity compensation."
     "No options or shares are being granted."

     Without this check, a simple keyword parser sees "RSU" or
     "ESOP" inside a negative sentence and incorrectly concludes
     that the employee received equity.
  ========================================================== */

  const negativeEquityPatterns: RegExp[] =
    [
      /\bno\s+(?:esops?|rsus?|stock\s+options?|equity|equity\s+compensation|stock[- ]based\s+compensation)\b/i,

      /\bdoes\s+not\s+include\s+(?:any\s+)?(?:esops?|rsus?|stock\s+options?|equity|equity\s+compensation)\b/i,

      /\bdoesn't\s+include\s+(?:any\s+)?(?:esops?|rsus?|stock\s+options?|equity|equity\s+compensation)\b/i,

      /\bdo\s+not\s+include\s+(?:any\s+)?(?:esops?|rsus?|stock\s+options?|equity|equity\s+compensation)\b/i,

      /\bnot\s+include(?:d)?\s+(?:any\s+)?(?:esops?|rsus?|stock\s+options?|equity|equity\s+compensation)\b/i,

      /\bnot\s+eligible\s+for\s+(?:any\s+)?(?:esops?|rsus?|stock\s+options?|equity|equity\s+compensation)\b/i,

      /\bno\s+(?:stock\s+)?options?\s+(?:are\s+)?(?:offered|granted|included|provided)\b/i,

      /\bno\s+(?:equity\s+)?shares?\s+(?:are\s+)?(?:offered|granted|included|provided)\b/i,

      /\bno\s+(?:equity|stock[- ]based)\s+component\b/i,

      /\bthere\s+is\s+no\s+(?:equity|stock[- ]based)\s+compensation\b/i,

      /\bwithout\s+(?:any\s+)?(?:equity|esops?|rsus?|stock\s+options?)\b/i,
    ];

  const negativeMatch =
    firstMatch(
      lines,
      negativeEquityPatterns
    );

  if (
    negativeMatch
  ) {
    return createExtractedScannerField(
      "NONE",
      {
        rawValue:
          "NONE",

        confidence:
          "HIGH",

        evidence:
          evidenceFromLine(
            negativeMatch.line,
            "No equity compensation"
          ),

        inferred:
          false,

        notes: [
          "The document explicitly states that equity compensation is not included.",
        ],
      }
    );
  }

  /* ==========================================================
     POSITIVE RSU DETECTION
  ========================================================== */

  if (
    /\brestricted\s+stock\s+units?\b|\brsus?\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "RSU",
      {
        rawValue:
          "RSU",

        confidence:
          "HIGH",
      }
    );
  }

  /* ==========================================================
     POSITIVE ESOP / STOCK OPTION DETECTION
  ========================================================== */

  if (
    /\besops?\b|\bemployee\s+stock\s+options?\b|\bstock\s+options?\b|\boption\s+grant\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "ESOP",
      {
        rawValue:
          "ESOP",

        confidence:
          "HIGH",
      }
    );
  }

  /* ==========================================================
     POSITIVE DIRECT STOCK DETECTION
  ========================================================== */

  if (
    /\bequity\s+shares?\b|\bshare\s+award\b|\bstock\s+award\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "STOCK",
      {
        rawValue:
          "STOCK",

        confidence:
          "MEDIUM",
      }
    );
  }

  /* ==========================================================
     UNKNOWN

     Absence of equity terminology does NOT automatically mean
     NONE.

     NONE is reserved for cases where the document explicitly
     tells us that no equity is included.

     Otherwise the user must confirm.
  ========================================================== */

  return createExtractedScannerField(
    "UNKNOWN",
    {
      rawValue:
        null,

      confidence:
        "UNKNOWN",

      inferred:
        true,

      notes: [
        "No clear ESOP, RSU or stock terminology was detected.",
      ],
    }
  );
}

/* ============================================================
   COMPANY STATUS
============================================================ */

function detectCompanyStatus(
  lines: TextLine[]
): OfferScannerField<OfferScannerCompanyStatus> {
  const text =
    lines
      .map(
        (line) =>
          line.text
      )
      .join("\n");

  if (/\bunlisted\b/i.test(text)) {
    return createExtractedScannerField(
      "UNLISTED",
      {
        rawValue:
          "UNLISTED",

        confidence:
          "MEDIUM",

        inferred:
          true,

        notes: [
          "Company status was inferred from explicit unlisted terminology and should be confirmed.",
        ],
      }
    );
  }

  if (
    /\blisted\s+company\b|\bpublicly\s+traded\b|\bnse\b|\bbse\b|\bnasdaq\b|\bnyse\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "LISTED",
      {
        rawValue:
          "LISTED",

        confidence:
          "MEDIUM",

        inferred:
          true,

        notes: [
          "Listed status was inferred from document terminology and should be confirmed.",
        ],
      }
    );
  }

  return createExtractedScannerField(
    "UNKNOWN",
    {
      rawValue:
        null,

      confidence:
        "UNKNOWN",

      inferred:
        true,
    }
  );
}

/* ============================================================
   EMPLOYMENT TYPE
============================================================ */

function detectEmploymentType(
  lines: TextLine[]
): OfferScannerField<OfferScannerEmploymentType> {
  const text =
    lines
      .map(
        (line) =>
          line.text
      )
      .join("\n");

  if (
    /\bfull[- ]time\b|\bpermanent\s+employee\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "FULL_TIME",
      {
        rawValue:
          "FULL_TIME",

        confidence:
          "MEDIUM",
      }
    );
  }

  if (
    /\binternship\b|\bintern\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "INTERNSHIP",
      {
        rawValue:
          "INTERNSHIP",

        confidence:
          "HIGH",
      }
    );
  }

  if (
    /\bconsultant\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "CONSULTANT",
      {
        rawValue:
          "CONSULTANT",

        confidence:
          "HIGH",
      }
    );
  }

  if (
    /\bpart[- ]time\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "PART_TIME",
      {
        rawValue:
          "PART_TIME",

        confidence:
          "HIGH",
      }
    );
  }

  if (
    /\bcontract(?:ual)?\s+(?:employee|employment|role)\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "CONTRACT",
      {
        rawValue:
          "CONTRACT",

        confidence:
          "MEDIUM",
      }
    );
  }

  return createExtractedScannerField(
    "UNKNOWN",
    {
      rawValue:
        null,

      confidence:
        "UNKNOWN",

      inferred:
        true,
    }
  );
}

/* ============================================================
   WORK MODE
============================================================ */

function detectWorkMode(
  lines: TextLine[]
): OfferScannerField<OfferScannerWorkMode> {
  const text =
    lines
      .map(
        (line) =>
          line.text
      )
      .join("\n");

  if (
    /\bhybrid\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "HYBRID",
      {
        rawValue:
          "HYBRID",

        confidence:
          "HIGH",
      }
    );
  }

  if (
    /\bremote\b|\bwork\s+from\s+home\b|\bwfh\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "REMOTE",
      {
        rawValue:
          "REMOTE",

        confidence:
          "MEDIUM",
      }
    );
  }

  if (
    /\bon[- ]site\b|\bwork\s+from\s+office\b|\bwfo\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "ONSITE",
      {
        rawValue:
          "ONSITE",

        confidence:
          "MEDIUM",
      }
    );
  }

  return createExtractedScannerField(
    "UNKNOWN",
    {
      rawValue:
        null,

      confidence:
        "UNKNOWN",

      inferred:
        true,
    }
  );
}

/* ============================================================
   VESTING FREQUENCY
============================================================ */

function detectVestingFrequency(
  lines: TextLine[]
): OfferScannerField<OfferScannerVestingFrequency> {
  const text =
    lines
      .map(
        (line) =>
          line.text
      )
      .join("\n");

  if (
    /\bmonthly\s+vesting\b|\bvest(?:s|ed|ing)?\s+monthly\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "MONTHLY",
      {
        rawValue:
          "MONTHLY",

        confidence:
          "HIGH",
      }
    );
  }

  if (
    /\bquarterly\s+vesting\b|\bvest(?:s|ed|ing)?\s+quarterly\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "QUARTERLY",
      {
        rawValue:
          "QUARTERLY",

        confidence:
          "HIGH",
      }
    );
  }

  if (
    /\bsemi[- ]annual\b|\bhalf[- ]yearly\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "HALF_YEARLY",
      {
        rawValue:
          "HALF_YEARLY",

        confidence:
          "HIGH",
      }
    );
  }

  if (
    /\bannual(?:ly)?\s+vesting\b|\bvest(?:s|ed|ing)?\s+annually\b/i.test(
      text
    )
  ) {
    return createExtractedScannerField(
      "YEARLY",
      {
        rawValue:
          "YEARLY",

        confidence:
          "HIGH",
      }
    );
  }

  return createExtractedScannerField(
    "UNKNOWN",
    {
      rawValue:
        null,

      confidence:
        "UNKNOWN",

      inferred:
        true,
    }
  );
}

/* ============================================================
   EMPLOYER FIELDS
============================================================ */

function parseEmployerFields(
  lines: TextLine[]
): OfferScannerEmployerFields {
  /* ==========================================================
     LABELED COMPANY EXTRACTION

     IMPORTANT:
     Employer labels are anchored to the START of a line.

     This prevents prose such as:

     "contains no real personal or company-confidential
      information"

     from being interpreted as:

     Company = "confidential information"
  ========================================================== */

  let companyName =
    extractTextAfterLabel(
      lines,
      [
        /^(?:employer\s*\/\s*company\s+name|company\s+name|company|employer|organisation|organization)\s*(?::|\-)?\s*(.*)$/i,
      ],
      "Company name"
    );

  /* ==========================================================
     COMPANY HEADING FALLBACK

     Real offer PDFs frequently contain the legal company name
     as a heading instead of:

       Company: ABC Private Limited

     Example:

       NORTHSTAR TECHNOLOGIES PRIVATE LIMITED

     Use this only when explicit labeled extraction failed.
  ========================================================== */

  if (
    !companyName.value
  ) {
    const companyHeading =
      lines.find(
        (line) => {
          const text =
            line.text.trim();

          if (
            text.length < 4 ||
            text.length > 140
          ) {
            return false;
          }

          /*
           * Strong Indian legal-entity suffixes.
           */

          const hasLegalSuffix =
            /\b(?:private\s+limited|pvt\.?\s+ltd\.?|limited|ltd\.?|llp)\b/i.test(
              text
            );

          if (
            !hasLegalSuffix
          ) {
            return false;
          }

          /*
           * Exclude obvious prose/disclaimer sentences.

           * Company headings tend to be compact entity names,
           * not sentences.
           */

          if (
            /(?:information|confidential|employment\s+offer|scanner|software|generated|document\s+is|for\s+testing|for\s+qa)/i.test(
              text
            )
          ) {
            return false;
          }

          /*
           * Avoid compensation labels that happen to contain
           * the word "company".
           */

          if (
            /(?:company\s+valuation|cost\s+to\s+company|company\s+pf)/i.test(
              text
            )
          ) {
            return false;
          }

          return true;
        }
      );

    if (
      companyHeading
    ) {
      companyName =
        createExtractedScannerField(
          normalizeWhitespace(
            companyHeading.text
          ),
          {
            rawValue:
              companyHeading.text,

            confidence:
              "MEDIUM",

            evidence:
              evidenceFromLine(
                companyHeading,
                "Company legal name heading"
              ),

            inferred:
              true,

            notes: [
              "Company name was inferred from a legal-entity heading because no explicit Company/Employer field was detected.",
            ],
          }
        );
    }
  }

  return {
    companyName,

    roleTitle:
      extractTextAfterLabel(
        lines,
        [
          /^(?:designation|position|role|job\s+title)\s*(?::|\-)\s*(.+)$/i,
          /^(?:designation|position|role|job\s+title)\s*$/i,
          /^(?:designation|position|role|job\s+title)\s+((?!&\s*employment\b|and\s+employment\b|details?\b).+)$/i,
        ],
        "Role title"
      ),

    department:
      extractTextAfterLabel(
        lines,
        [
          /^department\s*(?::|\-)?\s*(.*)$/i,
        ],
        "Department"
      ),

    location:
      extractTextAfterLabel(
        lines,
        [
          /^(?:work\s+location|location|place\s+of\s+work)\s*(?::|\-)?\s*(.*)$/i,
        ],
        "Work location"
      ),

    employmentType:
      detectEmploymentType(
        lines
      ),

    workMode:
      detectWorkMode(
        lines
      ),

    joiningDate:
      (() => {
        /* ----------------------------------------------------
           SAME-LINE DATE

           Joining Date: 01 October 2026
        ---------------------------------------------------- */

        const sameLine =
          extractDateField(
            lines,
            [
              /^(?:joining\s+date|date\s+of\s+joining|start\s+date|commencement\s+date)\s*[:\-]\s*(.+)$/i,
            ],
            "Joining date"
          );

        if (
          sameLine.value
        ) {
          return sameLine;
        }

        /* ----------------------------------------------------
           PDF TABLE DATE

           Joining Date
           01 October 2026
        ---------------------------------------------------- */

        return extractTextAfterLabel(
          lines,
          [
            /^(?:joining\s+date|date\s+of\s+joining|start\s+date|commencement\s+date)\s*(?::|\-)?\s*(.*)$/i,
          ],
          "Joining date"
        );
      })(),

    probationMonths:
      extractDurationField(
        lines,
        [
          /\bprobation\b/i,
        ],
        "Probation period"
      ),

    noticePeriodDays:
      extractNumberField(
        lines,
        [
          /notice\s+period[^\d]*([0-9]+)\s*days?/i,
        ],
        "Notice period"
      ),
  };
}

/* ============================================================
   CASH FIELDS
============================================================ */

function parseCashFields(
  lines: TextLine[],
  currency:
    OfferScannerCurrency
): OfferScannerCashFields {
  const basicSalary =
    extractMoneyField(
      lines,
      [
        /\bbasic\s+salary\b/i,
        /\bbase\s+salary\b/i,
        /\bbasic\s+pay\b/i,
        /\bbase\s+pay\b/i,
        /^\s*basic\b/i,
      ],
      currency,
      "Basic salary"
    );

  const statedPerformanceBonus =
    extractMoneyField(
      lines,
      [
        /\bperformance\s+bonus\b/i,
        /\bperformance\s+incentive\b/i,
      ],
      currency,
      "Performance bonus"
    );

  const performanceBonus =
    statedPerformanceBonus.value !== null
      ? statedPerformanceBonus
      : extractPercentageOfBaseSalary(
          lines,
          [
            /\bperformance\s+bonus\b/i,
            /\bperformance\s+incentive\b/i,
          ],
          basicSalary,
          "Performance bonus"
        );

  return {
    headlineCTC:
      extractMoneyField(
        lines,
        [
          /\bannual\s+ctc\b/i,
          /\btotal\s+ctc\b/i,
          /\bcost\s+to\s+company\b/i,
          /\bctc\b/i,
          /\bannual\s+compensation\b/i,
        ],
        currency,
        "Headline CTC"
      ),

    fixedSalary:
      extractMoneyField(
        lines,
        [
          /\bannual\s+fixed\s+compensation\b/i,
          /\bfixed\s+compensation\b/i,
          /\bannual\s+fixed\s+pay\b/i,
          /\bfixed\s+pay\b/i,
          /\bfixed\s+salary\b/i,
          /\bguaranteed\s+compensation\b/i,
        ],
        currency,
        "Fixed salary"
      ),

    basicSalary,

    hra:
      extractMoneyField(
        lines,
        [
          /\bhouse\s+rent\s+allowance\b/i,
          /\bhra\b/i,
        ],
        currency,
        "HRA"
      ),

    specialAllowance:
      extractMoneyField(
        lines,
        [
          /\bspecial\s+allowance\b/i,
        ],
        currency,
        "Special allowance"
      ),

    otherFixedAllowance:
      extractMoneyField(
        lines,
        [
          /\bother\s+fixed\s+allowance\b/i,
          /\bflexible\s+allowance\b/i,
        ],
        currency,
        "Other fixed allowance"
      ),

    targetVariablePay:
      extractTargetVariablePayField(
        lines,
        currency,
        basicSalary
      ),

    maximumVariablePay:
      extractMoneyField(
        lines,
        [
          /\bmaximum\s+variable\s+pay\b/i,
          /\bmax(?:imum)?\s+bonus\b/i,
        ],
        currency,
        "Maximum variable pay"
      ),

    joiningBonus:
      extractMoneyField(
        lines,
        [
          /\bjoining\s+bonus\b/i,
          /\bsign[- ]on\s+bonus\b/i,
          /\bsigning\s+bonus\b/i,
          /\bjoining\s+incentive\b/i,
        ],
        currency,
        "Joining bonus"
      ),

    retentionBonus:
      extractMoneyField(
        lines,
        [
          /\bretention\s+bonus\b/i,
          /\bstay\s+bonus\b/i,
        ],
        currency,
        "Retention bonus"
      ),

    relocationBonus:
      extractMoneyField(
        lines,
        [
          /\brelocation\s+(?:bonus|allowance|assistance)\b/i,
        ],
        currency,
        "Relocation benefit"
      ),

    performanceBonus,

    employerPF:
      extractMoneyField(
        lines,
        [
          /\bemployer(?:'s)?\s+(?:pf|provident\s+fund)\b/i,
          /\bcompany\s+pf\s+contribution\b/i,
          /\bprovident\s+fund\s+contribution\b/i,
        ],
        currency,
        "Employer PF"
      ),

    gratuity:
      extractMoneyField(
        lines,
        [
          /\bgratuity\b/i,
        ],
        currency,
        "Gratuity"
      ),

    insuranceValue:
      extractMoneyField(
        lines,
        [
          /\binsurance\s+(?:premium|value|benefit)\b/i,
        ],
        currency,
        "Insurance value"
      ),

    otherEmployerBenefits:
      extractMoneyField(
        lines,
        [
          /\bother\s+employer\s+benefits\b/i,
          /\bother\s+benefits\b/i,
        ],
        currency,
        "Other employer benefits"
      ),
  };
}

/* ============================================================
   EQUITY FIELDS
============================================================ */

function parseEquityFields(
  lines: TextLine[],
  currency:
    OfferScannerCurrency
): OfferScannerEquityFields {
  const equityType =
    detectEquityType(
      lines
    );

  return {
    type:
      equityType,

    companyStatus:
      detectCompanyStatus(
        lines
      ),

    employerHeadlineEquityValue:
      extractMoneyField(
        lines,
        [
          /\besop(?:s)?\s+(?:worth|value|valued\s+at)\b/i,
          /\bequity\s+(?:worth|value|valued\s+at)\b/i,
          /\bstock\s+option\s+value\b/i,
          /\brsu\s+value\b/i,
        ],
        currency,
        "Employer-stated equity value"
      ),

    totalOptionsOrShares:
      extractNumberField(
        lines,
        [
          /(?:number\s+of\s+options|options\s+granted|grant\s+of|granted)\D{0,25}([0-9][0-9,]*)\s*(?:options?)?/i,

          /(?:number\s+of\s+rsus?|rsus?\s+granted|restricted\s+stock\s+units?)\D{0,25}([0-9][0-9,]*)/i,

          /([0-9][0-9,]*)\s+(?:stock\s+options?|esops?|rsus?|restricted\s+stock\s+units?)\b/i,
        ],
        "Options / shares granted"
      ),

    exercisePrice:
      extractMoneyField(
        lines,
        [
          /\bexercise\s+price\b/i,
          /\bstrike\s+price\b/i,
          /\boption\s+price\b/i,
        ],
        currency,
        "Exercise price"
      ),

    currentFMV:
      extractMoneyField(
        lines,
        [
          /\bfair\s+market\s+value\b/i,
          /\bfmv\b/i,
        ],
        currency,
        "Current FMV"
      ),

    listedSharePrice:
      extractMoneyField(
        lines,
        [
          /\bshare\s+price\b/i,
          /\bmarket\s+price\s+per\s+share\b/i,
          /\bcurrent\s+market\s+price\b/i,
        ],
        currency,
        "Listed share price"
      ),

    companyValuation:
      extractMoneyField(
        lines,
        [
          /\bcompany\s+valuation\b/i,
          /\bcurrent\s+valuation\b/i,
          /\benterprise\s+valuation\b/i,
        ],
        currency,
        "Company valuation"
      ),

    totalCompanyShares:
      extractNumberField(
        lines,
        [
          /(?:total\s+(?:company\s+)?shares|fully\s+diluted\s+shares|shares\s+outstanding)\D{0,20}([0-9][0-9,]*)/i,
        ],
        "Total company shares"
      ),

    ownershipPercentage:
      (() => {
        const match =
          firstMatch(
            lines,
            [
              /(?:ownership|equity\s+ownership|stake)\D{0,20}([0-9]+(?:\.[0-9]+)?)\s*%/i,
            ]
          );

        if (!match) {
          return createMissingScannerField<number>();
        }

        const value =
          Number(
            match.match[1]
          );

        return createExtractedScannerField(
          value,
          {
            rawValue:
              `${match.match[1]}%`,

            confidence:
              "HIGH",

            evidence:
              evidenceFromLine(
                match.line,
                "Ownership percentage"
              ),
          }
        );
      })(),

    vestingDurationMonths:
      extractDurationField(
        lines,
        [
          /\bvesting\s+(?:period|duration)\b/i,
          /\bvest(?:ed|ing)?\s+over\b/i,
          /\bover\s+(?:a\s+period\s+of\s+)?[0-9]+\s+(?:years?|months?)\b/i,
        ],
        "Vesting duration"
      ),

    cliffMonths:
      extractDurationField(
        lines,
        [
          /\bcliff\b/i,
        ],
        "Cliff"
      ),

    vestingFrequency:
      detectVestingFrequency(
        lines
      ),

    vestingStartDate:
      extractDateField(
        lines,
        [
          /(?:vesting\s+start\s+date|vesting\s+commencement\s+date)\s*[:\-]\s*(.+)$/i,
        ],
        "Vesting start date"
      ),

    grantDate:
      extractDateField(
        lines,
        [
          /(?:grant\s+date|date\s+of\s+grant)\s*[:\-]\s*(.+)$/i,
        ],
        "Grant date"
      ),

    expiryDate:
      extractDateField(
        lines,
        [
          /(?:expiry\s+date|expiration\s+date|option\s+expiry)\s*[:\-]\s*(.+)$/i,
        ],
        "Grant expiry date"
      ),

    postTerminationExerciseDays:
      extractNumberField(
        lines,
        [
          /(?:post[- ]termination\s+exercise(?:\s+window|\s+period)?|exercise\s+after\s+termination|following\s+termination)\D{0,50}([0-9]+)\s*days?/i,
          /(?:exercise|exercised)\D{0,30}within\s+([0-9]+)\s*days?\D{0,30}(?:after|following|from)\s+(?:the\s+date\s+of\s+)?termination/i,
          /([0-9]+)\s*[- ]?day\s+post[- ]termination\s+exercise(?:\s+window|\s+period)?/i,
          /([0-9]+)\s*days?\s+(?:after|following|from)\s+(?:the\s+date\s+of\s+)?termination/i,
        ],
        "Post-termination exercise window"
      ),

    expectedDilutionPercentage:
      (() => {
        const match =
          firstMatch(
            lines,
            [
              /(?:expected\s+dilution|dilution)\D{0,20}([0-9]+(?:\.[0-9]+)?)\s*%/i,
            ]
          );

        if (!match) {
          return createMissingScannerField<number>();
        }

        return createExtractedScannerField(
          Number(
            match.match[1]
          ),
          {
            rawValue:
              `${match.match[1]}%`,

            confidence:
              "MEDIUM",

            evidence:
              evidenceFromLine(
                match.line,
                "Expected dilution"
              ),
          }
        );
      })(),
  };
}

/* ============================================================
   BENEFITS
============================================================ */

function parseBenefits(
  lines: TextLine[],
  currency:
    OfferScannerCurrency
): OfferScannerBenefitFields {
  return {
    healthInsuranceValue:
      extractMoneyField(
        lines,
        [
          /\bhealth\s+insurance\b/i,
          /\bmedical\s+insurance\b/i,
        ],
        currency,
        "Health insurance"
      ),

    lifeInsuranceValue:
      extractMoneyField(
        lines,
        [
          /\blife\s+insurance\b/i,
        ],
        currency,
        "Life insurance"
      ),

    learningBudgetValue:
      extractMoneyField(
        lines,
        [
          /\blearning\s+budget\b/i,
          /\blearning\s+allowance\b/i,
          /\btraining\s+budget\b/i,
        ],
        currency,
        "Learning budget"
      ),

    mealBenefitValue:
      extractMoneyField(
        lines,
        [
          /\bmeal\s+(?:allowance|benefit|card|voucher)\b/i,
          /\bfood\s+(?:allowance|benefit|card)\b/i,
        ],
        currency,
        "Meal benefit"
      ),

    transportBenefitValue:
      extractMoneyField(
        lines,
        [
          /\btransport\s+(?:allowance|benefit)\b/i,
          /\btravel\s+allowance\b/i,
          /\bcommute\s+benefit\b/i,
        ],
        currency,
        "Transport benefit"
      ),

    internetBenefitValue:
      extractMoneyField(
        lines,
        [
          /\binternet\s+(?:allowance|reimbursement|benefit)\b/i,
          /\bbroadband\s+(?:allowance|reimbursement)\b/i,
        ],
        currency,
        "Internet benefit"
      ),

    wellnessBenefitValue:
      extractMoneyField(
        lines,
        [
          /\bwellness\s+(?:allowance|benefit|budget)\b/i,
        ],
        currency,
        "Wellness benefit"
      ),

    otherAnnualBenefitValue:
      extractMoneyField(
        lines,
        [
          /\bother\s+annual\s+benefits?\b/i,
        ],
        currency,
        "Other annual benefits"
      ),
  };
}

/* ============================================================
   SPECIAL CONDITIONS
============================================================ */

function parseSpecialConditions(
  lines: TextLine[]
): OfferScannerSpecialConditions {
  return {
    joiningBonusClawback:
      extractBooleanMention(
        lines,
        [
          /joining\s+bonus.*(?:repay|repayment|clawback|recover|refund)/i,
          /(?:repay|refund).*joining\s+bonus/i,
        ],
        "Joining-bonus clawback"
      ),

    joiningBonusClawbackMonths:
      extractDurationField(
        lines,
        [
          /joining\s+bonus.*(?:repay|repayment|clawback|recover|refund)/i,
        ],
        "Joining-bonus clawback period"
      ),

    retentionBonusClawback:
      extractBooleanMention(
        lines,
        [
          /retention\s+bonus.*(?:repay|repayment|clawback|recover|refund)/i,
        ],
        "Retention-bonus clawback"
      ),

    nonCompeteMentioned:
      extractBooleanMention(
        lines,
        [
          /\bnon[- ]compete\b/i,
          /\bnoncompetition\b/i,
        ],
        "Non-compete"
      ),

    bondMentioned:
      extractBooleanMention(
        lines,
        [
          /\bemployment\s+bond\b/i,
          /\bservice\s+bond\b/i,
          /\bminimum\s+service\s+period\b/i,
        ],
        "Employment bond"
      ),

    bondAmount:
      extractMoneyField(
        lines,
        [
          /\b(?:employment|service)\s+bond\b/i,
          /\bbond\s+amount\b/i,
        ],
        "INR",
        "Employment bond amount"
      ),

    bondDurationMonths:
      extractDurationField(
        lines,
        [
          /\b(?:employment|service)\s+bond\b/i,
          /\bminimum\s+service\s+period\b/i,
        ],
        "Employment bond duration"
      ),

    variablePayDiscretionary:
      extractBooleanMention(
        lines,
        [
          /variable\s+(?:pay|compensation).*discretion/i,
          /bonus.*discretion/i,
        ],
        "Discretionary variable pay"
      ),

    equitySubjectToBoardApproval:
      extractBooleanMention(
        lines,
        [
          /(?:esop|option|equity|rsu).*board\s+approval/i,
          /subject\s+to\s+(?:the\s+)?board(?:'s)?\s+approval/i,
        ],
        "Equity subject to board approval"
      ),

    equityForfeitureOnLeaving:
      extractBooleanMention(
        lines,
        [
          /unvested.*(?:forfeit|forfeited|lapse|cancel)/i,
          /(?:forfeit|lapse).*unvested/i,
        ],
        "Equity forfeiture on leaving"
      ),

    postTerminationExerciseWindowMentioned:
      extractBooleanMention(
        lines,
        [
          /\bpost[- ]termination\s+exercise(?:\s+window|\s+period)?\b/i,
          /(?:exercise|exercised).*?(?:termination|cessation|leaving)/i,
          /(?:termination|cessation|leaving).*?(?:exercise|exercised)/i,
          /\b[0-9]+\s*[- ]?days?\s+(?:after|following|from)\s+(?:the\s+date\s+of\s+)?termination\b/i,
        ],
        "Post-termination exercise window"
      ),

    notes:
      createEmptyScannerField<string[]>(),
  };
}

/* ============================================================
   SCANNER SUMMARY
============================================================ */

function buildScannerSummary(
  scan:
    Omit<
      ScannedOfferLetter,
      | "scannerSummary"
      | "completeness"
      | "readiness"
      | "issues"
    >
): string {
  const pieces:
    string[] =
    [];

  if (
    scan.employer
      .companyName.value
  ) {
    pieces.push(
      `Employer: ${scan.employer.companyName.value}.`
    );
  }

  if (
    scan.employer
      .roleTitle.value
  ) {
    pieces.push(
      `Role: ${scan.employer.roleTitle.value}.`
    );
  }

  if (
    scan.cash
      .headlineCTC.value
  ) {
    pieces.push(
      `Headline CTC detected: ${scan.cash.headlineCTC.value}.`
    );
  }

  if (
    scan.cash
      .fixedSalary.value
  ) {
    pieces.push(
      `Fixed compensation detected: ${scan.cash.fixedSalary.value}.`
    );
  }

  if (
    scan.equity.type.value &&
    scan.equity.type.value !==
      "UNKNOWN"
  ) {
    pieces.push(
      `Equity detected: ${scan.equity.type.value}.`
    );
  }

  if (
    scan.equity
      .totalOptionsOrShares
      .value
  ) {
    pieces.push(
      `Grant quantity detected: ${scan.equity.totalOptionsOrShares.value}.`
    );
  }

  if (
    pieces.length === 0
  ) {
    return "The local parser extracted limited structured information. Review the source document manually.";
  }

  return pieces.join(
    " "
  );
}

/* ============================================================
   MAIN PARSER
============================================================ */

export function parseOfferLetterText(
  input:
    ParseOfferLetterTextInput
): ScannedOfferLetter {
  const rawText =
    typeof input.text ===
      "string"
      ? input.text
      : "";

  const lines =
    splitIntoLines(
      rawText
    );

  const currency =
    detectDocumentCurrency(
      rawText,
      input.currencyHint
    );

  const documentType =
    detectDocumentType(
      rawText,
      input.documentTypeHint
    );

  const scanId =
    createId();

  const timestamp =
    nowISO();

  const metadata:
    OfferScannerDocumentMetadata = {
    documentId:
      input.documentId ??
      scanId,

    fileName:
      input.fileName ??
      "offer-letter",

    fileType:
      input.fileType ??
      "TEXT",

    documentType,

    pageCount:
      input.pageCount,

    detectedLanguage:
      input.detectedLanguage ??
      "en",

    currency,

    scannedAt:
      timestamp,
  };

  const employer =
    parseEmployerFields(
      lines
    );

  const cash =
    parseCashFields(
      lines,
      currency
    );

  const equity =
    parseEquityFields(
      lines,
      currency
    );

  const benefits =
    parseBenefits(
      lines,
      currency
    );

  const specialConditions =
    parseSpecialConditions(
      lines
    );

  const baseScan:
    ScannedOfferLetter = {
    scanId,

    metadata,

    employer,

    cash,

    equity,

    benefits,

    specialConditions,

    completeness: {
      totalFields: 0,

      populatedFields: 0,

      confirmedFields: 0,

      editedFields: 0,

      missingFields: 0,

      highConfidenceFields: 0,

      mediumConfidenceFields: 0,

      lowConfidenceFields: 0,

      completionPercentage: 0,

      confirmationPercentage: 0,
    },

    readiness: {
      modelReadiness:
        "REVIEW_REQUIRED",

      equityReadiness:
        "PARTIAL",

      canCreateOffer:
        false,

      canRunComparison:
        false,

      canModelEquity:
        false,

      blockingIssueCount:
        0,

      warningCount:
        0,

      explanation:
        "Local extraction completed. Review and confirm the extracted values.",
    },

    issues: [],

    rawTextAvailable:
      rawText.trim()
        .length > 0,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,
  };

  const withSummary:
    ScannedOfferLetter = {
    ...baseScan,

    scannerSummary:
      buildScannerSummary(
        baseScan
      ),
  };

  /*
   * Validation runs immediately after deterministic extraction.
   *
   * Because extracted fields remain UNREVIEWED, even a very good
   * extraction normally remains REVIEW_REQUIRED until the user
   * confirms the critical values.
   */

  return applyScannerValidation(
    applyScannerHardFilters(withSummary)
  );
}

/* ============================================================
   PARSER CAPABILITY CHECK
============================================================ */

export function canParseOfferText(
  text: string
): boolean {
  return (
    typeof text ===
      "string" &&
    text.trim().length >=
      20
  );
}

/* ============================================================
   PARSER DIAGNOSTICS

   Useful during scanner QA.
============================================================ */

export function getOfferParserDiagnostics(
  scan:
    ScannedOfferLetter
): {
  documentType:
    OfferScannerDocumentType;

  currency:
    OfferScannerCurrency;

  companyDetected:
    boolean;

  roleDetected:
    boolean;

  headlineCTCDetected:
    boolean;

  fixedSalaryDetected:
    boolean;

  equityType:
    OfferScannerEquityType | null;

  equityQuantityDetected:
    boolean;

  exercisePriceDetected:
    boolean;

  fmvDetected:
    boolean;

  vestingDetected:
    boolean;

  cliffDetected:
    boolean;

  readiness:
    string;

  blockingIssues:
    number;

  warnings:
    number;
} {
  return {
    documentType:
      scan.metadata
        .documentType,

    currency:
      scan.metadata
        .currency,

    companyDetected:
      Boolean(
        scan.employer
          .companyName.value
      ),

    roleDetected:
      Boolean(
        scan.employer
          .roleTitle.value
      ),

    headlineCTCDetected:
      scan.cash
        .headlineCTC.value !==
      null,

    fixedSalaryDetected:
      scan.cash
        .fixedSalary.value !==
      null,

    equityType:
      scan.equity.type.value,

    equityQuantityDetected:
      scan.equity
        .totalOptionsOrShares
        .value !== null,

    exercisePriceDetected:
      scan.equity
        .exercisePrice.value !==
      null,

    fmvDetected:
      scan.equity
        .currentFMV.value !==
      null,

    vestingDetected:
      scan.equity
        .vestingDurationMonths
        .value !== null,

    cliffDetected:
      scan.equity
        .cliffMonths.value !==
      null,

    readiness:
      scan.readiness
        .modelReadiness,

    blockingIssues:
      scan.readiness
        .blockingIssueCount,

    warnings:
      scan.readiness
        .warningCount,
  };
}

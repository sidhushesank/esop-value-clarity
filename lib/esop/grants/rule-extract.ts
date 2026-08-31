/* ============================================================================
 * ESOP VALUE CLARITY
 * LOCAL GRANT INTELLIGENCE ENGINE
 *
 * Zero paid API usage.
 *
 * Responsibilities:
 * - classify the document
 * - extract common grant terms
 * - preserve page-level evidence
 * - assign confidence + review status
 * - detect important clauses
 *
 * IMPORTANT:
 * This engine is deliberately conservative.
 * Missing/ambiguous information is NEVER invented.
 * ========================================================================== */

/* ============================================================================
 * TYPES
 * ========================================================================== */

export type LocalDocumentType =
  | "ESOP_GRANT"
  | "OPTION_AGREEMENT"
  | "ESOP_PLAN"
  | "AMENDMENT"
  | "NON_ESOP"
  | "UNKNOWN";

export type LocalFieldStatus =
  | "VERIFIED"
  | "REVIEW"
  | "NOT_FOUND";

export type LocalVestingFrequency =
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI_ANNUAL"
  | "ANNUAL"
  | "CUSTOM"
  | "UNKNOWN";

export type LocalClauseType =
  | "TERMINATION"
  | "EXERCISE_WINDOW"
  | "FORFEITURE"
  | "CHANGE_OF_CONTROL"
  | "ACCELERATION"
  | "EXPIRY"
  | "VESTING"
  | "TRANSFER_RESTRICTION"
  | "REPURCHASE"
  | "LIQUIDITY"
  | "TAX"
  | "OTHER";

export type LocalClauseImportance =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type LocalExtractedField<T> = {
  value: T | null;

  status: LocalFieldStatus;

  confidence: number;

  evidence: string | null;

  sourcePage: number | null;
};

export type LocalExtractedClause = {
  type: LocalClauseType;

  importance: LocalClauseImportance;

  title: string;

  summary: string | null;

  extractedText: string | null;

  fieldStatus: LocalFieldStatus;

  confidence: number;

  sourcePage: number | null;
};

export type LocalGrantExtraction = {
  documentType: LocalDocumentType;

  documentTypeReason: string;

  documentConfidence: number;

  companyName: LocalExtractedField<string>;

  grantName: LocalExtractedField<string>;

  grantDate: LocalExtractedField<string>;

  optionCount: LocalExtractedField<number>;

  strikePrice: LocalExtractedField<number>;

  currency: LocalExtractedField<string>;

  vestingStartDate: LocalExtractedField<string>;

  vestingDurationMonths: LocalExtractedField<number>;

  cliffMonths: LocalExtractedField<number>;

  vestingFrequency: LocalExtractedField<LocalVestingFrequency>;

  expiryDate: LocalExtractedField<string>;

  postTerminationExerciseDays: LocalExtractedField<number>;

  clauses: LocalExtractedClause[];

  warnings: string[];
};

/* ============================================================================
 * PAGE MODEL
 * ========================================================================== */

type ParsedPage = {
  pageNumber: number;

  text: string;

  normalized: string;

  lines: string[];
};

type MatchCandidate<T> = {
  value: T;

  evidence: string;

  pageNumber: number;

  confidence: number;
};

/* ============================================================================
 * PUBLIC ENTRY
 * ========================================================================== */

export function ruleExtractGrant(
  documentText: string
): LocalGrantExtraction {
  const pages =
    parsePages(documentText);

  const combined =
    pages
      .map((page) => page.normalized)
      .join("\n");

  const classification =
    classifyDocument(
      combined
    );

  /*
   * Reject obviously unrelated documents.
   *
   * Do this before field extraction so an invoice does not accidentally
   * produce a "strike price" from a currency amount.
   */
  if (
    classification.documentType ===
    "NON_ESOP"
  ) {
    return {
      documentType:
        classification.documentType,

      documentTypeReason:
        classification.reason,

      documentConfidence:
        classification.confidence,

      companyName:
        missingField(),

      grantName:
        missingField(),

      grantDate:
        missingField(),

      optionCount:
        missingField(),

      strikePrice:
        missingField(),

      currency:
        missingField(),

      vestingStartDate:
        missingField(),

      vestingDurationMonths:
        missingField(),

      cliffMonths:
        missingField(),

      vestingFrequency:
        missingField(),

      expiryDate:
        missingField(),

      postTerminationExerciseDays:
        missingField(),

      clauses: [],

      warnings: [
        "This document does not appear to be an ESOP, stock option, equity grant, or employee equity plan document.",
      ],
    };
  }

  const companyName =
    extractCompanyName(pages);

  const grantName =
    extractGrantName(pages);

  const grantDate =
    extractGrantDate(pages);

  const optionCount =
    extractOptionCount(pages);

  const strikePrice =
    extractStrikePrice(pages);

  const currency =
    extractCurrency(
      pages,
      strikePrice.evidence
    );

  const vestingStartDate =
    extractVestingStartDate(
      pages
    );

  const vestingDurationMonths =
    extractVestingDurationMonths(
      pages
    );

  const cliffMonths =
    extractCliffMonths(pages);

  const vestingFrequency =
    extractVestingFrequency(
      pages
    );

  const expiryDate =
    extractExpiryDate(pages);

  const postTerminationExerciseDays =
    extractPostTerminationExerciseDays(
      pages
    );

  const clauses =
    extractClauses(pages);

  const warnings: string[] =
    [];

  if (
    classification.documentType ===
    "UNKNOWN"
  ) {
    warnings.push(
      "The document contains some equity-related language, but could not be confidently classified."
    );
  }

  if (
    optionCount.status ===
    "NOT_FOUND"
  ) {
    warnings.push(
      "The number of granted options/shares could not be identified."
    );
  }

  if (
    strikePrice.status ===
    "NOT_FOUND"
  ) {
    warnings.push(
      "The exercise or strike price could not be identified."
    );
  }

  if (
    vestingStartDate.status ===
      "NOT_FOUND" &&
    vestingDurationMonths.status ===
      "NOT_FOUND"
  ) {
    warnings.push(
      "A clear vesting schedule could not be identified."
    );
  }

  return {
    documentType:
      classification.documentType,

    documentTypeReason:
      classification.reason,

    documentConfidence:
      classification.confidence,

    companyName,

    grantName,

    grantDate,

    optionCount,

    strikePrice,

    currency,

    vestingStartDate,

    vestingDurationMonths,

    cliffMonths,

    vestingFrequency,

    expiryDate,

    postTerminationExerciseDays,

    clauses,

    warnings,
  };
}

/* ============================================================================
 * DOCUMENT CLASSIFICATION
 * ========================================================================== */

function classifyDocument(
  text: string
): {
  documentType: LocalDocumentType;

  reason: string;

  confidence: number;
} {
  const lower =
    text.toLowerCase();

  let equityScore = 0;

  let invoiceScore = 0;

  let amendmentScore = 0;

  let planScore = 0;

  let grantScore = 0;

  const equitySignals = [
    "stock option",
    "share option",
    "employee stock option",
    "employee share option",
    "equity award",
    "equity grant",
    "option grant",
    "grant notice",
    "vesting",
    "exercise price",
    "strike price",
    "option agreement",
    "share option agreement",
    "esop",
    "employee stock ownership",
  ];

  for (
    const signal of equitySignals
  ) {
    if (
      lower.includes(
        signal
      )
    ) {
      equityScore += 1;
    }
  }

  const invoiceSignals = [
    "invoice",
    "invoice number",
    "amount due",
    "subtotal",
    "billing address",
    "tax invoice",
    "payment due",
    "total due",
  ];

  for (
    const signal of
    invoiceSignals
  ) {
    if (
      lower.includes(
        signal
      )
    ) {
      invoiceScore += 1;
    }
  }

  const amendmentSignals = [
    "amendment",
    "amended",
    "modification",
    "supplement",
    "restatement",
  ];

  for (
    const signal of
    amendmentSignals
  ) {
    if (
      lower.includes(
        signal
      )
    ) {
      amendmentScore += 1;
    }
  }

  const planSignals = [
    "employee stock option plan",
    "employee share option plan",
    "equity incentive plan",
    "stock incentive plan",
    "share incentive plan",
    "scheme rules",
    "plan rules",
  ];

  for (
    const signal of
    planSignals
  ) {
    if (
      lower.includes(
        signal
      )
    ) {
      planScore += 1;
    }
  }

  const grantSignals = [
    "number of options",
    "options granted",
    "number of shares",
    "grant date",
    "exercise price",
    "vesting commencement",
    "vesting start",
    "recipient",
    "participant",
    "grantee",
  ];

  for (
    const signal of
    grantSignals
  ) {
    if (
      lower.includes(
        signal
      )
    ) {
      grantScore += 1;
    }
  }

  if (
    invoiceScore >= 3 &&
    grantScore === 0 &&
    planScore === 0
  ) {
    return {
      documentType:
        "NON_ESOP",

      reason:
        "The document strongly resembles an invoice or payment document and does not contain meaningful employee grant terms.",

      confidence: 0.99,
    };
  }

  if (
    invoiceScore >= 2 &&
    equityScore <= 1 &&
    grantScore === 0
  ) {
    return {
      documentType:
        "NON_ESOP",

      reason:
        "The document contains strong invoice/payment terminology but insufficient evidence of an employee equity grant.",

      confidence: 0.96,
    };
  }

  if (
    amendmentScore >= 1 &&
    equityScore >= 2
  ) {
    return {
      documentType:
        "AMENDMENT",

      reason:
        "The document contains equity terminology together with amendment or modification language.",

      confidence:
        clampConfidence(
          0.75 +
            Math.min(
              equityScore,
              5
            ) *
              0.03
        ),
    };
  }

  if (
    planScore >= 1 &&
    grantScore <= 1
  ) {
    return {
      documentType:
        "ESOP_PLAN",

      reason:
        "The document appears to describe a general employee equity or stock option plan rather than an individual grant.",

      confidence:
        clampConfidence(
          0.78 +
            Math.min(
              equityScore,
              5
            ) *
              0.03
        ),
    };
  }

  if (
    equityScore >= 3 &&
    grantScore >= 2
  ) {
    const agreement =
      lower.includes(
        "option agreement"
      ) ||
      lower.includes(
        "share option agreement"
      );

    return {
      documentType:
        agreement
          ? "OPTION_AGREEMENT"
          : "ESOP_GRANT",

      reason:
        agreement
          ? "The document contains employee-specific option terms and agreement language."
          : "The document contains employee-specific grant, vesting, and exercise terminology.",

      confidence:
        clampConfidence(
          0.84 +
            Math.min(
              grantScore,
              4
            ) *
              0.025
        ),
    };
  }

  if (
    equityScore >= 1
  ) {
    return {
      documentType:
        "UNKNOWN",

      reason:
        "Some employee-equity terminology was detected, but there is not enough evidence to confidently classify the document.",

      confidence: 0.55,
    };
  }

  return {
    documentType:
      "NON_ESOP",

    reason:
      "No meaningful employee stock-option or equity-grant terminology was detected.",

    confidence: 0.92,
  };
}

/* ============================================================================
 * COMPANY
 * ========================================================================== */

function extractCompanyName(
  pages: ParsedPage[]
): LocalExtractedField<string> {
  const candidates: MatchCandidate<string>[] = [];

  const labelledPatterns = [
    /(?:company|employer|issuer)\s*(?:name)?\s*[:\-]\s*(.+)$/i,
    /(?:issued\s+by|granted\s+by)\s*[:\-]?\s*(.+)$/i,
  ];

  for (const page of pages) {
    for (const line of page.lines) {
      for (const pattern of labelledPatterns) {
        const match = line.match(pattern);

        if (!match?.[1]) {
          continue;
        }

        const value = cleanupCompanyName(match[1]);

        if (!looksLikeCompanyName(value)) {
          continue;
        }

        candidates.push({
          value,
          evidence: line.trim(),
          pageNumber: page.pageNumber,
          confidence: 0.97,
        });
      }
    }
  }

  /*
   * Corporate-name heuristic.
   *
   * Capture the whole corporate name rather than only a suffix such as
   * "Private Limited".
   */
  const corporatePattern =
    /\b([A-Z][A-Za-z0-9&.'()\-]*(?:\s+[A-Z][A-Za-z0-9&.'()\-]*){0,8}\s+(?:Private\s+Limited|Pvt\.?\s+Ltd\.?|Limited|Ltd\.?|Incorporated|Inc\.?|Corporation|Corp\.?|LLC|PLC))\b/i;

  for (const page of pages.slice(0, 2)) {
    for (const line of page.lines.slice(0, 60)) {
      const match = line.match(corporatePattern);

      if (!match?.[1]) {
        continue;
      }

      const value = cleanupCompanyName(match[1]);

      if (!looksLikeCompanyName(value)) {
        continue;
      }

      candidates.push({
        value,
        evidence: line.trim(),
        pageNumber: page.pageNumber,
        confidence: 0.92,
      });
    }
  }

  /*
   * Last-resort heading heuristic.
   *
   * Grant letters commonly place the issuer near the top of the first page.
   */
  if (candidates.length === 0) {
    const firstPage = pages[0];

    if (firstPage) {
      for (const line of firstPage.lines.slice(0, 20)) {
        const cleaned = cleanupCompanyName(line);

        if (
          looksLikeCompanyName(cleaned) &&
          /\b(?:limited|ltd|private|inc|corporation|corp|llc|plc)\b/i.test(
            cleaned
          )
        ) {
          candidates.push({
            value: cleaned,
            evidence: line.trim(),
            pageNumber: firstPage.pageNumber,
            confidence: 0.76,
          });
        }
      }
    }
  }

  return bestCompanyCandidate(candidates);
}

/* ============================================================================
 * GRANT NAME
 * ========================================================================== */

function extractGrantName(
  pages: ParsedPage[]
): LocalExtractedField<string> {
  const candidates: MatchCandidate<string>[] = [];

  const labelledPatterns = [
    /(?:grant|award)\s+(?:name|title)\s*[:\-]\s*(.+)$/i,
    /(?:award type|grant type)\s*[:\-]\s*(.+)$/i,
    /(?:grant notice|award notice)\s*[:\-]\s*(.+)$/i,
  ];

  for (const page of pages) {
    for (const line of page.lines) {
      for (const pattern of labelledPatterns) {
        const match = line.match(pattern);

        if (!match?.[1]) {
          continue;
        }

        const value = cleanupGrantName(match[1]);

        if (!value) {
          continue;
        }

        candidates.push({
          value,
          evidence: line.trim(),
          pageNumber: page.pageNumber,
          confidence: 0.94,
        });
      }
    }
  }

  /*
   * Common document titles are useful fallbacks when the document does not
   * contain a dedicated "Grant name" field.
   */
  const titlePatterns: Array<{
    pattern: RegExp;
    value: string;
  }> = [
    {
      pattern: /\bemployee stock option grant notice\b/i,
      value: "Employee Stock Option Grant",
    },
    {
      pattern: /\bstock option grant notice\b/i,
      value: "Stock Option Grant",
    },
    {
      pattern: /\bshare option grant notice\b/i,
      value: "Share Option Grant",
    },
    {
      pattern: /\bemployee stock option agreement\b/i,
      value: "Employee Stock Option Agreement",
    },
    {
      pattern: /\bstock option agreement\b/i,
      value: "Stock Option Agreement",
    },
    {
      pattern: /\bshare option agreement\b/i,
      value: "Share Option Agreement",
    },
    {
      pattern: /\bequity award agreement\b/i,
      value: "Equity Award Agreement",
    },
  ];

  for (const page of pages.slice(0, 2)) {
    for (const line of page.lines.slice(0, 50)) {
      for (const title of titlePatterns) {
        if (!title.pattern.test(line)) {
          continue;
        }

        candidates.push({
          value: title.value,
          evidence: line.trim(),
          pageNumber: page.pageNumber,
          confidence: 0.88,
        });
      }
    }
  }

  return bestStringCandidate(candidates);
}

/* ============================================================================
 * GRANT DATE
 * ========================================================================== */

function extractGrantDate(
  pages: ParsedPage[]
): LocalExtractedField<string> {
  return extractDateField(
    pages,
    [
      /\bgrant\s+date\s*[:\-]?\s*(.+)$/i,

      /\bdate\s+of\s+grant\s*[:\-]?\s*(.+)$/i,

      /\baward\s+date\s*[:\-]?\s*(.+)$/i,
    ]
  );
}

/* ============================================================================
 * OPTION COUNT
 * ========================================================================== */

function extractOptionCount(
  pages: ParsedPage[]
): LocalExtractedField<number> {
  const candidates: MatchCandidate<number>[] =
    [];

  const patterns = [
    /(?:number\s+of\s+)?options?\s+(?:granted|awarded)\s*[:\-]?\s*([\d,]+)/i,

    /(?:number\s+of\s+)?options?\s*[:\-]\s*([\d,]+)/i,

    /(?:shares?|units?)\s+(?:granted|awarded)\s*[:\-]?\s*([\d,]+)/i,

    /(?:number\s+of\s+shares?|number\s+of\s+units?)\s*[:\-]\s*([\d,]+)/i,

    /grant(?:ed)?\s+([\d,]+)\s+(?:options?|shares?)/i,
  ];

  for (
    const page of pages
  ) {
    for (
      const line of
      page.lines
    ) {
      for (
        const pattern of
        patterns
      ) {
        const match =
          line.match(
            pattern
          );

        if (!match?.[1]) {
          continue;
        }

        const parsed =
          parseInteger(
            match[1]
          );

        if (
          parsed === null ||
          parsed <= 0
        ) {
          continue;
        }

        candidates.push({
          value: parsed,

          evidence:
            line.trim(),

          pageNumber:
            page.pageNumber,

          confidence: 0.95,
        });
      }
    }
  }

  return bestNumberCandidate(
    candidates
  );
}

/* ============================================================================
 * STRIKE / EXERCISE PRICE
 * ========================================================================== */

function extractStrikePrice(
  pages: ParsedPage[]
): LocalExtractedField<number> {
  const candidates: MatchCandidate<number>[] =
    [];

  const patterns = [
    /(?:exercise|strike|option)\s+price(?:\s+per\s+(?:share|option))?\s*[:\-]?\s*(?:INR|USD|EUR|GBP|₹|\$|€|£)?\s*([\d,.]+)/i,

    /price\s+per\s+(?:option|share)\s*[:\-]?\s*(?:INR|USD|EUR|GBP|₹|\$|€|£)?\s*([\d,.]+)/i,
  ];

  for (
    const page of pages
  ) {
    for (
      const line of
      page.lines
    ) {
      for (
        const pattern of
        patterns
      ) {
        const match =
          line.match(
            pattern
          );

        if (!match?.[1]) {
          continue;
        }

        const parsed =
          parseDecimal(
            match[1]
          );

        if (
          parsed === null ||
          parsed < 0
        ) {
          continue;
        }

        candidates.push({
          value: parsed,

          evidence:
            line.trim(),

          pageNumber:
            page.pageNumber,

          confidence: 0.96,
        });
      }
    }
  }

  return bestNumberCandidate(
    candidates
  );
}

/* ============================================================================
 * CURRENCY
 * ========================================================================== */

function extractCurrency(
  pages: ParsedPage[],
  preferredEvidence:
    | string
    | null
): LocalExtractedField<string> {
  if (
    preferredEvidence
  ) {
    const currency =
      detectCurrency(
        preferredEvidence
      );

    if (currency) {
      return {
        value: currency,

        status:
          "VERIFIED",

        confidence: 0.96,

        evidence:
          preferredEvidence,

        sourcePage:
          findEvidencePage(
            pages,
            preferredEvidence
          ),
      };
    }
  }

  for (
    const page of pages
  ) {
    for (
      const line of
      page.lines
    ) {
      if (
        !/(exercise|strike|option price|purchase price)/i.test(
          line
        )
      ) {
        continue;
      }

      const currency =
        detectCurrency(
          line
        );

      if (currency) {
        return {
          value: currency,

          status:
            "VERIFIED",

          confidence: 0.92,

          evidence:
            line.trim(),

          sourcePage:
            page.pageNumber,
        };
      }
    }
  }

  return missingField();
}

/* ============================================================================
 * VESTING START
 * ========================================================================== */

function extractVestingStartDate(
  pages: ParsedPage[]
): LocalExtractedField<string> {
  return extractDateField(
    pages,
    [
      /\bvesting\s+(?:commencement|start)\s+date\s*[:\-]?\s*(.+)$/i,

      /\bvesting\s+commences?\s+(?:on|from)\s+(.+)$/i,

      /\bcommencement\s+date\s*[:\-]?\s*(.+)$/i,
    ]
  );
}

/* ============================================================================
 * VESTING DURATION
 * ========================================================================== */

function extractVestingDurationMonths(
  pages: ParsedPage[]
): LocalExtractedField<number> {
  const candidates: MatchCandidate<number>[] =
    [];

  const patterns = [
    /vest(?:s|ing)?\s+(?:over|during)\s+(?:a\s+period\s+of\s+)?(\d+)\s+months?/i,

    /vesting\s+period\s*[:\-]?\s*(\d+)\s+months?/i,

    /vest(?:s|ing)?\s+(?:over|during)\s+(?:a\s+period\s+of\s+)?(\d+)\s+years?/i,

    /vesting\s+period\s*[:\-]?\s*(\d+)\s+years?/i,
  ];

  for (
    const page of pages
  ) {
    for (
      const line of
      page.lines
    ) {
      for (
        let index = 0;
        index <
        patterns.length;
        index += 1
      ) {
        const match =
          line.match(
            patterns[index]
          );

        if (!match?.[1]) {
          continue;
        }

        let value =
          Number(
            match[1]
          );

        if (
          index >= 2
        ) {
          value *= 12;
        }

        if (
          !Number.isFinite(
            value
          ) ||
          value <= 0 ||
          value > 240
        ) {
          continue;
        }

        candidates.push({
          value,

          evidence:
            line.trim(),

          pageNumber:
            page.pageNumber,

          confidence: 0.92,
        });
      }
    }
  }

  return bestNumberCandidate(
    candidates
  );
}

/* ============================================================================
 * CLIFF
 * ========================================================================== */

function extractCliffMonths(
  pages: ParsedPage[]
): LocalExtractedField<number> {
  const candidates: MatchCandidate<number>[] =
    [];

  const monthPattern =
    /(?:cliff|cliff period)\s*(?:of|is|:|-)?\s*(\d+)\s+months?/i;

  const yearPattern =
    /(?:cliff|cliff period)\s*(?:of|is|:|-)?\s*(\d+)\s+years?/i;

  const oneYearPhrase =
    /\b(?:one|1)[ -]?year cliff\b/i;

  for (
    const page of pages
  ) {
    for (
      const line of
      page.lines
    ) {
      const monthMatch =
        line.match(
          monthPattern
        );

      if (
        monthMatch?.[1]
      ) {
        candidates.push({
          value:
            Number(
              monthMatch[1]
            ),

          evidence:
            line.trim(),

          pageNumber:
            page.pageNumber,

          confidence: 0.96,
        });
      }

      const yearMatch =
        line.match(
          yearPattern
        );

      if (
        yearMatch?.[1]
      ) {
        candidates.push({
          value:
            Number(
              yearMatch[1]
            ) * 12,

          evidence:
            line.trim(),

          pageNumber:
            page.pageNumber,

          confidence: 0.96,
        });
      }

      if (
        oneYearPhrase.test(
          line
        )
      ) {
        candidates.push({
          value: 12,

          evidence:
            line.trim(),

          pageNumber:
            page.pageNumber,

          confidence: 0.98,
        });
      }
    }
  }

  return bestNumberCandidate(
    candidates
  );
}

/* ============================================================================
 * VESTING FREQUENCY
 * ========================================================================== */

function extractVestingFrequency(
  pages: ParsedPage[]
): LocalExtractedField<LocalVestingFrequency> {
  const tests: Array<{
    value:
      LocalVestingFrequency;

    pattern:
      RegExp;

    confidence:
      number;
  }> = [
    {
      value:
        "MONTHLY",

      pattern:
        /\b(?:monthly|each month|every month)\b/i,

      confidence: 0.94,
    },

    {
      value:
        "QUARTERLY",

      pattern:
        /\b(?:quarterly|each quarter|every quarter|three months?)\b/i,

      confidence: 0.92,
    },

    {
      value:
        "SEMI_ANNUAL",

      pattern:
        /\b(?:semi[- ]?annual|every six months?|half[- ]yearly)\b/i,

      confidence: 0.92,
    },

    {
      value:
        "ANNUAL",

      pattern:
        /\b(?:annually|annual vesting|each year|yearly)\b/i,

      confidence: 0.9,
    },
  ];

  for (
    const page of pages
  ) {
    for (
      const line of
      page.lines
    ) {
      if (
        !/\bvest/i.test(
          line
        )
      ) {
        continue;
      }

      for (
        const test of
        tests
      ) {
        if (
          test.pattern.test(
            line
          )
        ) {
          return {
            value:
              test.value,

            status:
              "VERIFIED",

            confidence:
              test.confidence,

            evidence:
              line.trim(),

            sourcePage:
              page.pageNumber,
          };
        }
      }

      if (
        /\b(?:schedule|milestone|custom|tranche)\b/i.test(
          line
        )
      ) {
        return {
          value:
            "CUSTOM",

          status:
            "REVIEW",

          confidence: 0.72,

          evidence:
            line.trim(),

          sourcePage:
            page.pageNumber,
        };
      }
    }
  }

  return missingField();
}

/* ============================================================================
 * EXPIRY
 * ========================================================================== */

function extractExpiryDate(
  pages: ParsedPage[]
): LocalExtractedField<string> {
  return extractDateField(
    pages,
    [
      /\b(?:option\s+)?expiry\s+date\s*[:\-]?\s*(.+)$/i,

      /\bexpiration\s+date\s*[:\-]?\s*(.+)$/i,

      /\boptions?\s+(?:expire|expires)\s+(?:on\s+)?(.+)$/i,

      /\blast\s+date\s+to\s+exercise\s*[:\-]?\s*(.+)$/i,
    ]
  );
}

/* ============================================================================
 * POST TERMINATION EXERCISE WINDOW
 * ========================================================================== */

function extractPostTerminationExerciseDays(
  pages: ParsedPage[]
): LocalExtractedField<number> {
  const candidates: MatchCandidate<number>[] =
    [];

  const dayPatterns = [
    /(?:within|for a period of|up to)?\s*(\d+)\s+days?\s+(?:after|following)\s+(?:termination|cessation|employment ends|leaving)/i,

    /post[- ]termination\s+(?:exercise\s+)?(?:period|window)\s*[:\-]?\s*(\d+)\s+days?/i,

    /exercise\s+(?:the\s+)?(?:vested\s+)?options?\s+within\s+(\d+)\s+days?/i,
  ];

  const monthPattern =
    /(?:post[- ]termination\s+(?:exercise\s+)?(?:period|window)|exercise\s+period)\s*[:\-]?\s*(\d+)\s+months?/i;

  for (
    const page of pages
  ) {
    for (
      const line of
      page.lines
    ) {
      for (
        const pattern of
        dayPatterns
      ) {
        const match =
          line.match(
            pattern
          );

        if (
          match?.[1]
        ) {
          candidates.push({
            value:
              Number(
                match[1]
              ),

            evidence:
              line.trim(),

            pageNumber:
              page.pageNumber,

            confidence: 0.95,
          });
        }
      }

      const monthMatch =
        line.match(
          monthPattern
        );

      if (
        monthMatch?.[1]
      ) {
        candidates.push({
          value:
            Number(
              monthMatch[1]
            ) * 30,

          evidence:
            line.trim(),

          pageNumber:
            page.pageNumber,

          confidence: 0.76,
        });
      }
    }
  }

  return bestNumberCandidate(
    candidates
  );
}

/* ============================================================================
 * CLAUSE EXTRACTION
 * ========================================================================== */

function extractClauses(
  pages: ParsedPage[]
): LocalExtractedClause[] {
  const clauses: LocalExtractedClause[] =
    [];

  const definitions: Array<{
    type:
      LocalClauseType;

    title:
      string;

    importance:
      LocalClauseImportance;

    patterns:
      RegExp[];

    summary:
      string;
  }> = [
    {
      type:
        "TERMINATION",

      title:
        "Termination of employment",

      importance:
        "HIGH",

      patterns: [
        /\btermination\b/i,
        /\bcessation of employment\b/i,
        /\bemployment terminates\b/i,
        /\bleaver\b/i,
      ],

      summary:
        "The agreement contains terms that may affect options when employment ends.",
    },

    {
      type:
        "FORFEITURE",

      title:
        "Forfeiture",

      importance:
        "HIGH",

      patterns: [
        /\bforfeit(?:ed|ure)?\b/i,
        /\blapse(?:d|s)?\b/i,
        /\bautomatically cancelled\b/i,
      ],

      summary:
        "The agreement contains language under which some options or rights may be forfeited or lapse.",
    },

    {
      type:
        "EXERCISE_WINDOW",

      title:
        "Exercise window",

      importance:
        "HIGH",

      patterns: [
        /\bexercise period\b/i,
        /\bexercise window\b/i,
        /\bwithin \d+ days\b/i,
        /\bpost[- ]termination\b/i,
      ],

      summary:
        "The agreement includes timing restrictions on exercising options.",
    },

    {
      type:
        "ACCELERATION",

      title:
        "Acceleration",

      importance:
        "HIGH",

      patterns: [
        /\baccelerat(?:e|ed|ion)\b/i,
        /\baccelerated vesting\b/i,
      ],

      summary:
        "The agreement includes provisions that may accelerate vesting.",
    },

    {
      type:
        "CHANGE_OF_CONTROL",

      title:
        "Change of control",

      importance:
        "HIGH",

      patterns: [
        /\bchange of control\b/i,
        /\bchange in control\b/i,
        /\bacquisition\b/i,
        /\bmerger\b/i,
      ],

      summary:
        "The agreement contains terms addressing a change of control or corporate transaction.",
    },

    {
      type:
        "TRANSFER_RESTRICTION",

      title:
        "Transfer restrictions",

      importance:
        "MEDIUM",

      patterns: [
        /\bnon[- ]?transferable\b/i,
        /\bmay not be transferred\b/i,
        /\btransfer restriction\b/i,
        /\bassignment\b/i,
      ],

      summary:
        "The agreement restricts the transfer or assignment of options or related rights.",
    },

    {
      type:
        "REPURCHASE",

      title:
        "Repurchase rights",

      importance:
        "HIGH",

      patterns: [
        /\brepurchase\b/i,
        /\bbuyback\b/i,
        /\bright to purchase\b/i,
      ],

      summary:
        "The agreement contains repurchase or buyback provisions.",
    },

    {
      type:
        "EXPIRY",

      title:
        "Expiry",

      importance:
        "HIGH",

      patterns: [
        /\bexpir(?:y|ation|e|es)\b/i,
        /\boption term\b/i,
      ],

      summary:
        "The agreement contains option expiry or term provisions.",
    },

    {
      type:
        "VESTING",

      title:
        "Vesting conditions",

      importance:
        "MEDIUM",

      patterns: [
        /\bvesting schedule\b/i,
        /\bvest(?:ed|ing)\b/i,
        /\bcliff\b/i,
      ],

      summary:
        "The agreement contains conditions governing when options become vested.",
    },

    {
      type:
        "LIQUIDITY",

      title:
        "Liquidity or exit",

      importance:
        "MEDIUM",

      patterns: [
        /\bliquidity event\b/i,
        /\bexit event\b/i,
        /\bipo\b/i,
        /\binitial public offering\b/i,
      ],

      summary:
        "The agreement refers to liquidity or exit-related events.",
    },

    {
      type:
        "TAX",

      title:
        "Tax responsibilities",

      importance:
        "MEDIUM",

      patterns: [
        /\btax(?:es|ation)?\b/i,
        /\bwithholding\b/i,
        /\btax liability\b/i,
      ],

      summary:
        "The agreement contains tax or withholding-related provisions.",
    },
  ];

  const seen =
    new Set<string>();

  for (
    const definition of
    definitions
  ) {
    for (
      const page of pages
    ) {
      const matchedLine =
        findBestClauseLine(
          page.lines,
          definition.patterns
        );

      if (
        !matchedLine
      ) {
        continue;
      }

      const key =
        `${definition.type}:${page.pageNumber}`;

      if (
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);

      clauses.push({
        type:
          definition.type,

        importance:
          definition.importance,

        title:
          definition.title,

        summary:
          definition.summary,

        extractedText:
          matchedLine.trim(),

        fieldStatus:
          "REVIEW",

        confidence: 0.78,

        sourcePage:
          page.pageNumber,
      });

      /*
       * One strongest hit per clause type is enough for the first review.
       */
      break;
    }
  }

  return clauses;
}

/* ============================================================================
 * GENERIC STRING EXTRACTION
 * ========================================================================== */

function extractStringByPatterns(
  pages: ParsedPage[],
  patterns: RegExp[],
  confidence: number
): LocalExtractedField<string> {
  const candidates: MatchCandidate<string>[] =
    [];

  for (
    const page of pages
  ) {
    for (
      const line of
      page.lines
    ) {
      for (
        const pattern of
        patterns
      ) {
        const match =
          line.match(
            pattern
          );

        if (
          !match?.[1]
        ) {
          continue;
        }

        const value =
          cleanupText(
            match[1]
          );

        if (!value) {
          continue;
        }

        candidates.push({
          value,

          evidence:
            line.trim(),

          pageNumber:
            page.pageNumber,

          confidence,
        });
      }
    }
  }

  return bestStringCandidate(
    candidates
  );
}

/* ============================================================================
 * DATE EXTRACTION
 * ========================================================================== */

function extractDateField(
  pages: ParsedPage[],
  patterns: RegExp[]
): LocalExtractedField<string> {
  const candidates: MatchCandidate<string>[] =
    [];

  for (
    const page of pages
  ) {
    for (
      const line of
      page.lines
    ) {
      for (
        const pattern of
        patterns
      ) {
        const match =
          line.match(
            pattern
          );

        if (
          !match?.[1]
        ) {
          continue;
        }

        const date =
          parseDateFromText(
            match[1]
          );

        if (!date) {
          continue;
        }

        candidates.push({
          value: date,

          evidence:
            line.trim(),

          pageNumber:
            page.pageNumber,

          confidence: 0.94,
        });
      }
    }
  }

  return bestStringCandidate(
    candidates
  );
}

/* ============================================================================
 * PAGE PARSING
 * ========================================================================== */

function parsePages(
  text: string
): ParsedPage[] {
  const pagePattern =
    /--- PAGE (\d+) ---/g;

  const matches =
    [...text.matchAll(
      pagePattern
    )];

  /*
   * Backward-compatible fallback if the text has no page markers.
   */
  if (
    matches.length === 0
  ) {
    const cleaned =
      normalizePageText(
        text
      );

    return [
      {
        pageNumber: 1,

        text,

        normalized:
          cleaned,

        lines:
          createLines(
            cleaned
          ),
      },
    ];
  }

  const pages: ParsedPage[] =
    [];

  for (
    let index = 0;
    index <
    matches.length;
    index += 1
  ) {
    const match =
      matches[index];

    const pageNumber =
      Number(
        match[1]
      );

    const contentStart =
      (match.index ?? 0) +
      match[0].length;

    const contentEnd =
      index + 1 <
      matches.length
        ? matches[
            index + 1
          ].index ??
          text.length
        : text.length;

    const pageText =
      text
        .slice(
          contentStart,
          contentEnd
        )
        .trim();

    const normalized =
      normalizePageText(
        pageText
      );

    pages.push({
      pageNumber,

      text:
        pageText,

      normalized,

      lines:
        createLines(
          normalized
        ),
    });
  }

  return pages;
}

/* ============================================================================
 * CANDIDATE RESOLUTION
 * ========================================================================== */

function bestStringCandidate(
  candidates:
    MatchCandidate<string>[]
): LocalExtractedField<string> {
  if (
    candidates.length === 0
  ) {
    return missingField();
  }

  candidates.sort(
    (a, b) =>
      b.confidence -
      a.confidence
  );

  const best =
    candidates[0];

  const conflicting =
    candidates.some(
      (candidate) =>
        candidate.value
          .toLowerCase() !==
        best.value
          .toLowerCase()
    );

  return {
    value:
      best.value,

    status:
      conflicting
        ? "REVIEW"
        : best.confidence >=
          0.85
        ? "VERIFIED"
        : "REVIEW",

    confidence:
      conflicting
        ? Math.min(
            best.confidence,
            0.74
          )
        : best.confidence,

    evidence:
      best.evidence,

    sourcePage:
      best.pageNumber,
  };
}

function bestNumberCandidate(
  candidates:
    MatchCandidate<number>[]
): LocalExtractedField<number> {
  if (
    candidates.length === 0
  ) {
    return missingField();
  }

  candidates.sort(
    (a, b) =>
      b.confidence -
      a.confidence
  );

  const best =
    candidates[0];

  const conflicting =
    candidates.some(
      (candidate) =>
        candidate.value !==
        best.value
    );

  return {
    value:
      best.value,

    status:
      conflicting
        ? "REVIEW"
        : best.confidence >=
          0.85
        ? "VERIFIED"
        : "REVIEW",

    confidence:
      conflicting
        ? Math.min(
            best.confidence,
            0.74
          )
        : best.confidence,

    evidence:
      best.evidence,

    sourcePage:
      best.pageNumber,
  };
}

function missingField<T>():
  LocalExtractedField<T> {
  return {
    value: null,

    status:
      "NOT_FOUND",

    confidence: 0,

    evidence: null,

    sourcePage: null,
  };
}

/* ============================================================================
 * DATE NORMALIZATION
 * ========================================================================== */

function parseDateFromText(
  input: string
): string | null {
  const value =
    input
      .replace(
        /[.,;]+$/,
        ""
      )
      .trim();

  const isoMatch =
    value.match(
      /\b(20\d{2}|19\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/
    );

  if (
    isoMatch
  ) {
    return makeIsoDate(
      Number(
        isoMatch[1]
      ),

      Number(
        isoMatch[2]
      ),

      Number(
        isoMatch[3]
      )
    );
  }

  /*
   * dd/mm/yyyy or dd-mm-yyyy
   *
   * We intentionally interpret this as day-first because ESOP Value Clarity
   * currently targets Indian users primarily.
   */
  const numericMatch =
    value.match(
      /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2}|19\d{2})\b/
    );

  if (
    numericMatch
  ) {
    return makeIsoDate(
      Number(
        numericMatch[3]
      ),

      Number(
        numericMatch[2]
      ),

      Number(
        numericMatch[1]
      )
    );
  }

  const monthNames: Record<
    string,
    number
  > = {
    january: 1,
    jan: 1,

    february: 2,
    feb: 2,

    march: 3,
    mar: 3,

    april: 4,
    apr: 4,

    may: 5,

    june: 6,
    jun: 6,

    july: 7,
    jul: 7,

    august: 8,
    aug: 8,

    september: 9,
    sep: 9,
    sept: 9,

    october: 10,
    oct: 10,

    november: 11,
    nov: 11,

    december: 12,
    dec: 12,
  };

  const dayMonthYear =
    value.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*,?\s+(20\d{2}|19\d{2})\b/i
    );

  if (
    dayMonthYear
  ) {
    const month =
      monthNames[
        dayMonthYear[2]
          .toLowerCase()
      ];

    if (month) {
      return makeIsoDate(
        Number(
          dayMonthYear[3]
        ),

        month,

        Number(
          dayMonthYear[1]
        )
      );
    }
  }

  const monthDayYear =
    value.match(
      /\b([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s+(20\d{2}|19\d{2})\b/i
    );

  if (
    monthDayYear
  ) {
    const month =
      monthNames[
        monthDayYear[1]
          .toLowerCase()
      ];

    if (month) {
      return makeIsoDate(
        Number(
          monthDayYear[3]
        ),

        month,

        Number(
          monthDayYear[2]
        )
      );
    }
  }

  return null;
}

function makeIsoDate(
  year: number,
  month: number,
  day: number
): string | null {
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    return null;
  }

  return [
    year,
    String(
      month
    ).padStart(
      2,
      "0"
    ),
    String(
      day
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
}

/* ============================================================================
 * NUMBER HELPERS
 * ========================================================================== */

function parseInteger(
  value: string
): number | null {
  const cleaned =
    value.replace(
      /,/g,
      ""
    );

  const parsed =
    Number.parseInt(
      cleaned,
      10
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}

function parseDecimal(
  value: string
): number | null {
  const cleaned =
    value
      .replace(
        /,/g,
        ""
      )
      .trim();

  const parsed =
    Number.parseFloat(
      cleaned
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}

/* ============================================================================
 * CURRENCY
 * ========================================================================== */

function detectCurrency(
  text: string
): string | null {
  if (
    /\bINR\b|₹/i.test(
      text
    )
  ) {
    return "INR";
  }

  if (
    /\bUSD\b|US\$|\$/i.test(
      text
    )
  ) {
    return "USD";
  }

  if (
    /\bGBP\b|£/i.test(
      text
    )
  ) {
    return "GBP";
  }

  if (
    /\bEUR\b|€/i.test(
      text
    )
  ) {
    return "EUR";
  }

  if (
    /\bAED\b/i.test(
      text
    )
  ) {
    return "AED";
  }

  if (
    /\bSGD\b/i.test(
      text
    )
  ) {
    return "SGD";
  }

  return null;
}

/* ============================================================================
 * CLAUSE HELPERS
 * ========================================================================== */

function findBestClauseLine(
  lines: string[],
  patterns: RegExp[]
): string | null {
  let best:
    | string
    | null = null;

  for (
    const line of lines
  ) {
    let score = 0;

    for (
      const pattern of
      patterns
    ) {
      if (
        pattern.test(line)
      ) {
        score += 1;
      }
    }

    if (
      score === 0
    ) {
      continue;
    }

    if (
      !best ||
      line.length >
        best.length
    ) {
      best = line;
    }
  }

  return best;
}

/* ============================================================================
 * TEXT HELPERS
 * ========================================================================== */

function normalizePageText(
  value: string
): string {
  return value
    .replace(
      /\u0000/g,
      ""
    )
    .replace(
      /\r\n/g,
      "\n"
    )
    .replace(
      /\r/g,
      "\n"
    )
    .replace(
      /[ \t]+/g,
      " "
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

function createLines(
  value: string
): string[] {
  return value
    .split("\n")
    .map(
      (line) =>
        line.trim()
    )
    .filter(Boolean);
}

function cleanupText(
  value: string
): string {
  return value
    .replace(
      /\s+/g,
      " "
    )
    .replace(
      /^[\s:;-]+/,
      ""
    )
    .replace(
      /[\s;]+$/,
      ""
    )
    .trim();
}

function cleanupCompanyName(
  value: string
): string {
  return cleanupText(
    value
  )
    .replace(
      /\s{2,}/g,
      " "
    )
    .slice(
      0,
      120
    );
}


function looksLikeCompanyName(
  value: string
): boolean {
  const cleaned = value.trim();

  if (cleaned.length < 4 || cleaned.length > 140) {
    return false;
  }

  /*
   * Reject a bare legal suffix such as "Private Limited".
   */
  if (
    /^(?:private\s+limited|pvt\.?\s*ltd\.?|limited|ltd\.?|inc\.?|incorporated|corporation|corp\.?|llc|plc)$/i.test(
      cleaned
    )
  ) {
    return false;
  }

  /*
   * Reject obvious labels that are not company names.
   */
  if (
    /^(?:company|issuer|employer|grant|grant date|participant|employee|grantee)$/i.test(
      cleaned
    )
  ) {
    return false;
  }

  return /[A-Za-z]/.test(cleaned);
}

function bestCompanyCandidate(
  candidates: MatchCandidate<string>[]
): LocalExtractedField<string> {
  if (candidates.length === 0) {
    return missingField();
  }

  candidates.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }

    return b.value.length - a.value.length;
  });

  const best = candidates[0];

  const normalizedBest = normalizeCompanyForComparison(
    best.value
  );

  const materiallyDifferent = candidates.some(
    (candidate) =>
      normalizeCompanyForComparison(candidate.value) !==
      normalizedBest
  );

  return {
    value: best.value,

    status:
      materiallyDifferent && candidates.length > 1
        ? "REVIEW"
        : best.confidence >= 0.85
          ? "VERIFIED"
          : "REVIEW",

    confidence:
      materiallyDifferent && candidates.length > 1
        ? Math.min(best.confidence, 0.78)
        : best.confidence,

    evidence: best.evidence,

    sourcePage: best.pageNumber,
  };
}

function normalizeCompanyForComparison(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupGrantName(
  value: string
): string {
  return cleanupText(value)
    .replace(/\s+/g, " ")
    .slice(0, 140);
}

function findEvidencePage(
  pages: ParsedPage[],
  evidence: string
): number | null {
  const normalized =
    evidence
      .trim()
      .toLowerCase();

  for (
    const page of pages
  ) {
    if (
      page.normalized
        .toLowerCase()
        .includes(
          normalized
        )
    ) {
      return page.pageNumber;
    }
  }

  return null;
}

function clampConfidence(
  value: number
): number {
  return Math.max(
    0,
    Math.min(
      1,
      Number(
        value.toFixed(
          2
        )
      )
    )
  );
}
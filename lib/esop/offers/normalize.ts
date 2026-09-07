/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   NORMALIZATION

   Responsibilities:
   - create safe empty/default offers
   - normalize manual/scanner values
   - protect the calculation engine from NaN / negative values
   - normalize dates, strings, enums and percentages
   - preserve Offer A / Offer B separation

   IMPORTANT:
   This file DOES NOT:
   - compare offers
   - value equity
   - calculate vesting
   - calculate tax
   - calculate break-even
   - generate negotiation targets
============================================================ */

import type {
  OfferBenefits,
  OfferCashCompensation,
  OfferCompanyEquityStatus,
  OfferConfidence,
  OfferCurrency,
  OfferDocumentSource,
  OfferDocumentStatus,
  OfferEmployerDetails,
  OfferEmploymentType,
  OfferEquityCompensation,
  OfferEquityType,
  OfferExtractedField,
  OfferFieldStatus,
  OfferInput,
  OfferInputMode,
  OfferSide,
  OfferVestingFrequency,
  OfferWorkMode,
} from "./types";

/* ============================================================
   GENERIC HELPERS
============================================================ */

export function normalizeOfferNumber(
  value: unknown,
  fallback = 0
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/\s+/g, "")
      .trim();

    if (!cleaned) {
      return fallback;
    }

    const parsed = Number(cleaned);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function normalizePositiveOfferNumber(
  value: unknown,
  fallback = 0
): number {
  return Math.max(
    normalizeOfferNumber(
      value,
      fallback
    ),
    0
  );
}

export function normalizeOfferInteger(
  value: unknown,
  fallback = 0
): number {
  return Math.max(
    Math.round(
      normalizeOfferNumber(
        value,
        fallback
      )
    ),
    0
  );
}

export function normalizeOfferPercentage(
  value: unknown,
  fallback = 0
): number {
  return Math.min(
    Math.max(
      normalizeOfferNumber(
        value,
        fallback
      ),
      0
    ),
    100
  );
}

export function normalizeOfferMultiplier(
  value: unknown,
  fallback = 1
): number {
  return Math.max(
    normalizeOfferNumber(
      value,
      fallback
    ),
    0
  );
}

export function normalizeOfferString(
  value: unknown,
  fallback = ""
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

export function normalizeNullableOfferString(
  value: unknown
): string | null {
  const normalized =
    normalizeOfferString(value);

  return normalized
    ? normalized
    : null;
}

/* ============================================================
   DATE NORMALIZATION
============================================================ */

export function normalizeOfferDate(
  value: unknown
): string | null {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed.toISOString();
}

/* ============================================================
   ENUM NORMALIZATION
============================================================ */

function normalizeEnumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

  const matched =
    allowed.find(
      (item) =>
        item === normalized
    );

  return matched ?? fallback;
}

/* ============================================================
   SIDE
============================================================ */

export function normalizeOfferSide(
  value: unknown
): OfferSide {
  return normalizeEnumValue(
    value,
    ["A", "B"] as const,
    "A"
  );
}

/* ============================================================
   INPUT MODE
============================================================ */

export function normalizeOfferInputMode(
  value: unknown
): OfferInputMode {
  return normalizeEnumValue(
    value,
    [
      "MANUAL",
      "DOCUMENT",
    ] as const,
    "MANUAL"
  );
}

/* ============================================================
   CURRENCY
============================================================ */

export function normalizeOfferCurrency(
  value: unknown
): OfferCurrency {
  return normalizeEnumValue(
    value,
    [
      "INR",
      "USD",
      "EUR",
      "GBP",
      "OTHER",
    ] as const,
    "INR"
  );
}

/* ============================================================
   EMPLOYMENT TYPE
============================================================ */

export function normalizeOfferEmploymentType(
  value: unknown
): OfferEmploymentType {
  return normalizeEnumValue(
    value,
    [
      "FULL_TIME",
      "CONTRACT",
      "INTERNSHIP",
      "OTHER",
    ] as const,
    "FULL_TIME"
  );
}

/* ============================================================
   WORK MODE
============================================================ */

export function normalizeOfferWorkMode(
  value: unknown
): OfferWorkMode {
  return normalizeEnumValue(
    value,
    [
      "ONSITE",
      "HYBRID",
      "REMOTE",
      "UNKNOWN",
    ] as const,
    "UNKNOWN"
  );
}

/* ============================================================
   EQUITY TYPE
============================================================ */

export function normalizeOfferEquityType(
  value: unknown
): OfferEquityType {
  return normalizeEnumValue(
    value,
    [
      "NONE",
      "ESOP",
      "RSU",
      "STOCK",
      "UNKNOWN",
      "OTHER",
    ] as const,
    "UNKNOWN"
  );
}

/* ============================================================
   COMPANY EQUITY STATUS
============================================================ */

export function normalizeOfferCompanyEquityStatus(
  value: unknown
): OfferCompanyEquityStatus {
  return normalizeEnumValue(
    value,
    [
      "LISTED",
      "UNLISTED",
      "UNKNOWN",
    ] as const,
    "UNKNOWN"
  );
}

/* ============================================================
   VESTING FREQUENCY
============================================================ */

export function normalizeOfferVestingFrequency(
  value: unknown
): OfferVestingFrequency {
  return normalizeEnumValue(
    value,
    [
      "MONTHLY",
      "QUARTERLY",
      "SEMI_ANNUAL",
      "ANNUAL",
      "CUSTOM",
      "UNKNOWN",
    ] as const,
    "UNKNOWN"
  );
}

/* ============================================================
   FIELD STATUS
============================================================ */

export function normalizeOfferFieldStatus(
  value: unknown
): OfferFieldStatus {
  return normalizeEnumValue(
    value,
    [
      "VERIFIED",
      "REVIEW",
      "NOT_FOUND",
      "USER_CONFIRMED",
    ] as const,
    "REVIEW"
  );
}

/* ============================================================
   CONFIDENCE
============================================================ */

export function normalizeOfferConfidence(
  value: unknown
): OfferConfidence {
  return normalizeEnumValue(
    value,
    [
      "HIGH",
      "MEDIUM",
      "LOW",
      "UNKNOWN",
    ] as const,
    "UNKNOWN"
  );
}

/* ============================================================
   DOCUMENT STATUS
============================================================ */

export function normalizeOfferDocumentStatus(
  value: unknown
): OfferDocumentStatus {
  return normalizeEnumValue(
    value,
    [
      "NOT_UPLOADED",
      "UPLOADED",
      "PROCESSING",
      "REVIEW_REQUIRED",
      "CONFIRMED",
      "FAILED",
    ] as const,
    "NOT_UPLOADED"
  );
}

/* ============================================================
   DEFAULT EMPLOYER
============================================================ */

export function createDefaultEmployerDetails():
  OfferEmployerDetails {
  return {
    companyName: "",
    roleTitle: "",
    location: "",
    employmentType:
      "FULL_TIME",
    workMode:
      "UNKNOWN",
    joiningDate:
      null,
  };
}

/* ============================================================
   DEFAULT CASH COMPENSATION
============================================================ */

export function createDefaultCashCompensation():
  OfferCashCompensation {
  return {
    headlineCTC: 0,

    fixedSalary: 0,

    basicSalary: 0,

    hra: 0,

    specialAllowance: 0,

    flexibleBenefits: 0,

    otherRecurringCash: 0,

    targetVariablePay: 0,

    maximumVariablePay: 0,

    targetBonus: 0,

    performanceBonus: 0,

    otherVariablePay: 0,

    joiningBonus: 0,

    retentionBonus: 0,

    relocationAllowance: 0,

    otherOneTimeCash: 0,

    employerPF: 0,

    gratuity: 0,

    insuranceValue: 0,

    otherBenefitsValue: 0,
  };
}

/* ============================================================
   DEFAULT EQUITY
============================================================ */

export function createDefaultEquityCompensation():
  OfferEquityCompensation {
  return {
    type:
      "NONE",

    companyStatus:
      "UNKNOWN",

    employerHeadlineEquityValue:
      0,

    totalOptionsOrShares:
      0,

    exercisePrice:
      0,

    currentFMV:
      0,

    listedSharePrice:
      0,

    companyValuation:
      0,

    totalCompanyShares:
      0,

    ownershipPercentage:
      0,

    vestingStartDate:
      null,

    vestingDurationMonths:
      48,

    cliffMonths:
      12,

    vestingFrequency:
      "MONTHLY",

    expiryDate:
      null,

    postTerminationExerciseDays:
      null,

    expectedDilutionPercentage:
      0,

    bearEquityMultiplier:
      0.5,

    baseEquityMultiplier:
      1,

    bullEquityMultiplier:
      2,
  };
}

/* ============================================================
   DEFAULT BENEFITS
============================================================ */

export function createDefaultBenefits():
  OfferBenefits {
  return {
    healthInsuranceValue:
      0,

    lifeInsuranceValue:
      0,

    mealBenefitsValue:
      0,

    transportBenefitsValue:
      0,

    wellnessBenefitsValue:
      0,

    learningBudgetValue:
      0,

    otherBenefitsValue:
      0,

    notes:
      "",
  };
}

/* ============================================================
   DEFAULT DOCUMENT SOURCE
============================================================ */

export function createDefaultOfferDocumentSource():
  OfferDocumentSource {
  return {
    documentId:
      null,

    originalFileName:
      null,

    mimeType:
      null,

    fileSizeBytes:
      null,

    status:
      "NOT_UPLOADED",

    uploadedAt:
      null,

    processedAt:
      null,

    confirmedAt:
      null,
  };
}

/* ============================================================
   DEFAULT OFFER

   IMPORTANT:
   Each call creates a fresh object.
============================================================ */

export function createDefaultOffer(
  side: OfferSide
): OfferInput {
  return {
    id:
      `offer-${side.toLowerCase()}`,

    side,

    inputMode:
      "MANUAL",

    currency:
      "INR",

    employer:
      createDefaultEmployerDetails(),

    cash:
      createDefaultCashCompensation(),

    equity:
      createDefaultEquityCompensation(),

    benefits:
      createDefaultBenefits(),

    sourceDocument:
      null,

    fields:
      [],

    notes:
      "",

    createdAt:
      null,

    updatedAt:
      null,
  };
}

/* ============================================================
   EMPLOYER NORMALIZATION
============================================================ */

export function normalizeEmployerDetails(
  value:
    | Partial<OfferEmployerDetails>
    | null
    | undefined
): OfferEmployerDetails {
  const source =
    value ?? {};

  return {
    companyName:
      normalizeOfferString(
        source.companyName
      ),

    roleTitle:
      normalizeOfferString(
        source.roleTitle
      ),

    location:
      normalizeOfferString(
        source.location
      ),

    employmentType:
      normalizeOfferEmploymentType(
        source.employmentType
      ),

    workMode:
      normalizeOfferWorkMode(
        source.workMode
      ),

    joiningDate:
      normalizeOfferDate(
        source.joiningDate
      ),
  };
}

/* ============================================================
   CASH NORMALIZATION
============================================================ */

export function normalizeCashCompensation(
  value:
    | Partial<OfferCashCompensation>
    | null
    | undefined
): OfferCashCompensation {
  const source =
    value ?? {};

  return {
    headlineCTC:
      normalizePositiveOfferNumber(
        source.headlineCTC
      ),

    fixedSalary:
      normalizePositiveOfferNumber(
        source.fixedSalary
      ),

    basicSalary:
      normalizePositiveOfferNumber(
        source.basicSalary
      ),

    hra:
      normalizePositiveOfferNumber(
        source.hra
      ),

    specialAllowance:
      normalizePositiveOfferNumber(
        source.specialAllowance
      ),

    flexibleBenefits:
      normalizePositiveOfferNumber(
        source.flexibleBenefits
      ),

    otherRecurringCash:
      normalizePositiveOfferNumber(
        source.otherRecurringCash
      ),

    targetVariablePay:
      normalizePositiveOfferNumber(
        source.targetVariablePay
      ),

    maximumVariablePay:
      normalizePositiveOfferNumber(
        source.maximumVariablePay
      ),

    targetBonus:
      normalizePositiveOfferNumber(
        source.targetBonus
      ),

    performanceBonus:
      normalizePositiveOfferNumber(
        source.performanceBonus
      ),

    otherVariablePay:
      normalizePositiveOfferNumber(
        source.otherVariablePay
      ),

    joiningBonus:
      normalizePositiveOfferNumber(
        source.joiningBonus
      ),

    retentionBonus:
      normalizePositiveOfferNumber(
        source.retentionBonus
      ),

    relocationAllowance:
      normalizePositiveOfferNumber(
        source.relocationAllowance
      ),

    otherOneTimeCash:
      normalizePositiveOfferNumber(
        source.otherOneTimeCash
      ),

    employerPF:
      normalizePositiveOfferNumber(
        source.employerPF
      ),

    gratuity:
      normalizePositiveOfferNumber(
        source.gratuity
      ),

    insuranceValue:
      normalizePositiveOfferNumber(
        source.insuranceValue
      ),

    otherBenefitsValue:
      normalizePositiveOfferNumber(
        source.otherBenefitsValue
      ),
  };
}

/* ============================================================
   EQUITY NORMALIZATION
============================================================ */

export function normalizeEquityCompensation(
  value:
    | Partial<OfferEquityCompensation>
    | null
    | undefined
): OfferEquityCompensation {
  const source =
    value ?? {};

  const type =
    normalizeOfferEquityType(
      source.type
    );

  const noEquity =
    type === "NONE";

  const vestingDurationMonths =
    Math.max(
      normalizeOfferInteger(
        source.vestingDurationMonths,
        0
      ),
      0
    );

  const cliffMonths =
    Math.min(
      normalizeOfferInteger(
        source.cliffMonths,
        0
      ),
      vestingDurationMonths
    );

  return {
    type:
      type,

    companyStatus:
      noEquity
        ? "UNKNOWN"
        : normalizeOfferCompanyEquityStatus(
            source.companyStatus
          ),

    employerHeadlineEquityValue:
      normalizePositiveOfferNumber(
        source.employerHeadlineEquityValue
      ),

    totalOptionsOrShares:
      normalizeOfferInteger(
        source.totalOptionsOrShares
      ),

    exercisePrice:
      normalizePositiveOfferNumber(
        source.exercisePrice
      ),

    currentFMV:
      normalizePositiveOfferNumber(
        source.currentFMV
      ),

    listedSharePrice:
      normalizePositiveOfferNumber(
        source.listedSharePrice
      ),

    companyValuation:
      normalizePositiveOfferNumber(
        source.companyValuation
      ),

    totalCompanyShares:
      normalizePositiveOfferNumber(
        source.totalCompanyShares
      ),

    ownershipPercentage:
      normalizeOfferPercentage(
        source.ownershipPercentage
      ),

    vestingStartDate:
      normalizeOfferDate(
        source.vestingStartDate
      ),

    vestingDurationMonths:
      noEquity
        ? 0
        : vestingDurationMonths,

    cliffMonths:
      noEquity
        ? 0
        : cliffMonths,

    vestingFrequency:
      noEquity
        ? "UNKNOWN"
        : normalizeOfferVestingFrequency(
            source.vestingFrequency
          ),

    expiryDate:
      normalizeOfferDate(
        source.expiryDate
      ),

    postTerminationExerciseDays:
      source.postTerminationExerciseDays ===
        null ||
      source.postTerminationExerciseDays ===
        undefined
        ? null
        : normalizeOfferInteger(
            source.postTerminationExerciseDays
          ),

    expectedDilutionPercentage:
      normalizeOfferPercentage(
        source.expectedDilutionPercentage
      ),

    bearEquityMultiplier:
      normalizeOfferMultiplier(
        source.bearEquityMultiplier,
        0.5
      ),

    baseEquityMultiplier:
      normalizeOfferMultiplier(
        source.baseEquityMultiplier,
        1
      ),

    bullEquityMultiplier:
      normalizeOfferMultiplier(
        source.bullEquityMultiplier,
        2
      ),
  };
}

/* ============================================================
   BENEFITS NORMALIZATION
============================================================ */

export function normalizeBenefits(
  value:
    | Partial<OfferBenefits>
    | null
    | undefined
): OfferBenefits {
  const source =
    value ?? {};

  return {
    healthInsuranceValue:
      normalizePositiveOfferNumber(
        source.healthInsuranceValue
      ),

    lifeInsuranceValue:
      normalizePositiveOfferNumber(
        source.lifeInsuranceValue
      ),

    mealBenefitsValue:
      normalizePositiveOfferNumber(
        source.mealBenefitsValue
      ),

    transportBenefitsValue:
      normalizePositiveOfferNumber(
        source.transportBenefitsValue
      ),

    wellnessBenefitsValue:
      normalizePositiveOfferNumber(
        source.wellnessBenefitsValue
      ),

    learningBudgetValue:
      normalizePositiveOfferNumber(
        source.learningBudgetValue
      ),

    otherBenefitsValue:
      normalizePositiveOfferNumber(
        source.otherBenefitsValue
      ),

    notes:
      normalizeOfferString(
        source.notes
      ),
  };
}

/* ============================================================
   DOCUMENT SOURCE NORMALIZATION
============================================================ */

export function normalizeOfferDocumentSource(
  value:
    | Partial<OfferDocumentSource>
    | null
    | undefined
): OfferDocumentSource | null {
  if (!value) {
    return null;
  }

  return {
    documentId:
      normalizeNullableOfferString(
        value.documentId
      ),

    originalFileName:
      normalizeNullableOfferString(
        value.originalFileName
      ),

    mimeType:
      normalizeNullableOfferString(
        value.mimeType
      ),

    fileSizeBytes:
      value.fileSizeBytes ===
        null ||
      value.fileSizeBytes ===
        undefined
        ? null
        : normalizeOfferInteger(
            value.fileSizeBytes
          ),

    status:
      normalizeOfferDocumentStatus(
        value.status
      ),

    uploadedAt:
      normalizeOfferDate(
        value.uploadedAt
      ),

    processedAt:
      normalizeOfferDate(
        value.processedAt
      ),

    confirmedAt:
      normalizeOfferDate(
        value.confirmedAt
      ),
  };
}

/* ============================================================
   EXTRACTED FIELD NORMALIZATION
============================================================ */

export function normalizeExtractedField<T>(
  value:
    | Partial<
        OfferExtractedField<T>
      >
    | null
    | undefined
): OfferExtractedField<T> {
  const source =
    value ?? {};

  return {
    key:
      normalizeOfferString(
        source.key
      ),

    label:
      normalizeOfferString(
        source.label
      ),

    extractedValue:
      source.extractedValue ??
      null,

    confirmedValue:
      source.confirmedValue ??
      null,

    status:
      normalizeOfferFieldStatus(
        source.status
      ),

    confidence:
      normalizeOfferConfidence(
        source.confidence
      ),

    sourceText:
      normalizeNullableOfferString(
        source.sourceText
      ),

    sourcePage:
      source.sourcePage ===
        null ||
      source.sourcePage ===
        undefined
        ? null
        : normalizeOfferInteger(
            source.sourcePage
          ),

    reviewedAt:
      normalizeOfferDate(
        source.reviewedAt
      ),
  };
}

/* ============================================================
   COMPLETE OFFER NORMALIZATION
============================================================ */

export function normalizeOfferInput(
  value:
    | Partial<OfferInput>
    | null
    | undefined,
  fallbackSide: OfferSide
): OfferInput {
  const source =
    value ?? {};

  const side =
    source.side
      ? normalizeOfferSide(
          source.side
        )
      : fallbackSide;

  const fields =
    Array.isArray(source.fields)
      ? source.fields.map(
          (field) =>
            normalizeExtractedField(
              field
            )
        )
      : [];

  return {
    id:
      normalizeOfferString(
        source.id,
        `offer-${side.toLowerCase()}`
      ),

    side,

    inputMode:
      normalizeOfferInputMode(
        source.inputMode
      ),

    currency:
      normalizeOfferCurrency(
        source.currency
      ),

    employer:
      normalizeEmployerDetails(
        source.employer
      ),

    cash:
      normalizeCashCompensation(
        source.cash
      ),

    equity:
      normalizeEquityCompensation(
        source.equity
      ),

    benefits:
      normalizeBenefits(
        source.benefits
      ),

    sourceDocument:
      normalizeOfferDocumentSource(
        source.sourceDocument
      ),

    fields,

    decisionReadiness:
      source.decisionReadiness,

    notes:
      normalizeOfferString(
        source.notes
      ),

    createdAt:
      normalizeOfferDate(
        source.createdAt
      ),

    updatedAt:
      normalizeOfferDate(
        source.updatedAt
      ),
  };
}

/* ============================================================
   CREATE NORMALIZED OFFER PAIR
============================================================ */

export function createDefaultOfferPair(): {
  offerA: OfferInput;
  offerB: OfferInput;
} {
  return {
    offerA:
      createDefaultOffer("A"),

    offerB:
      createDefaultOffer("B"),
  };
}

/* ============================================================
   NORMALIZE OFFER PAIR
============================================================ */

export function normalizeOfferPair(
  offerA:
    | Partial<OfferInput>
    | null
    | undefined,
  offerB:
    | Partial<OfferInput>
    | null
    | undefined
): {
  offerA: OfferInput;
  offerB: OfferInput;
} {
  return {
    offerA:
      normalizeOfferInput(
        offerA,
        "A"
      ),

    offerB:
      normalizeOfferInput(
        offerB,
        "B"
      ),
  };
}

/* ============================================================
   EQUITY DATA COMPLETENESS

   This is intentionally conservative.

   We do not want the future UI to claim that an ESOP grant has
   been economically valued when the inputs are insufficient.
============================================================ */

export function getMissingEquityFields(
  offer: OfferInput
): string[] {
  const equity =
    offer.equity;

  if (equity.type === "NONE") {
    return [];
  }

  if (equity.type === "UNKNOWN") {
    return ["Equity type"];
  }

  const missing: string[] =
    [];

  if (
    equity.totalOptionsOrShares <=
    0
  ) {
    missing.push(
      "Option / share quantity"
    );
  }

  if (
    equity.type === "ESOP" &&
    equity.exercisePrice <= 0
  ) {
    missing.push(
      "Exercise price"
    );
  }

  if (
    equity.vestingDurationMonths <=
    0
  ) {
    missing.push(
      "Vesting duration"
    );
  }

  if (
    equity.companyStatus ===
    "LISTED"
  ) {
    if (
      equity.listedSharePrice <=
      0 &&
      equity.currentFMV <= 0
    ) {
      missing.push(
        "Listed share price / FMV"
      );
    }
  }

  if (
    equity.companyStatus ===
    "UNLISTED"
  ) {
    const hasUnitValue =
      equity.currentFMV > 0;

    const hasValuationBasis =
      equity.companyValuation > 0 &&
      equity.totalCompanyShares >
        0;

    if (
      !hasUnitValue &&
      !hasValuationBasis
    ) {
      missing.push(
        "FMV or company valuation basis"
      );
    }
  }

  if (
    equity.companyStatus ===
    "UNKNOWN"
  ) {
    missing.push(
      "Listed / unlisted company status"
    );
  }

  return missing;
}

/* ============================================================
   SUFFICIENT EQUITY DATA
============================================================ */

export function hasSufficientEquityData(
  offer: OfferInput
): boolean {
  if (
    offer.equity.type === "NONE"
  ) {
    return true;
  }

  return (
    getMissingEquityFields(
      offer
    ).length === 0
  );
}

/* ============================================================
   OFFER READINESS

   Used later by the review screen before comparison is allowed.
============================================================ */

export function getOfferReadiness(
  offer: OfferInput
): {
  ready: boolean;
  missing: string[];
} {
  const missing: string[] =
    [];

  if (
    !offer.employer.companyName
  ) {
    missing.push(
      "Company name"
    );
  }

  if (
    offer.cash.fixedSalary <=
      0 &&
    offer.cash.headlineCTC <=
      0
  ) {
    missing.push(
      "Fixed salary or headline CTC"
    );
  }

  const equityMissing =
    getMissingEquityFields(
      offer
    );

  missing.push(
    ...equityMissing
  );

  return {
    ready:
      missing.length === 0,

    missing,
  };
}

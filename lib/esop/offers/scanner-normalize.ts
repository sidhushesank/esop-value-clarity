/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   SCANNER -> OFFER NORMALIZATION BRIDGE

   Responsibilities:
   - convert reviewed scanner data into OfferInput
   - preserve document provenance
   - preserve extracted-field evidence
   - map scanner enums to established Phase 4 enums
   - prevent unreviewed AI extraction from silently becoming
     trusted modeling input
   - use safe neutral defaults where appropriate

   IMPORTANT:
   This file DOES NOT:
   - scan documents
   - call AI
   - validate whether an offer is ready for comparison
   - calculate compensation
   - calculate equity
   - modify the seven validated Phase 4 engines

   TRUST RULE:
   Scanner values become modeling inputs only when the user has
   CONFIRMED or EDITED them.

   Extracted-but-unreviewed values remain visible in provenance,
   but do not silently become trusted OfferInput values.
============================================================ */

import type {
  OfferCompanyEquityStatus,
  OfferCurrency,
  OfferDocumentSource,
  OfferEmploymentType,
  OfferEquityType,
  OfferExtractedField,
  OfferFieldStatus,
  OfferInput,
  OfferSide,
  OfferVestingFrequency,
  OfferWorkMode,
} from "./types";

import {
  createDefaultOffer,
  normalizeOfferInput,
} from "./normalize";

import type {
  OfferScannerCompanyStatus,
  OfferScannerCurrency,
  OfferScannerEmploymentType,
  OfferScannerEquityType,
  OfferScannerField,
  OfferScannerReviewStatus,
  OfferScannerVestingFrequency,
  OfferScannerWorkMode,
  ScannedOfferLetter,
} from "./scanner-types";

import {
  hasScannerFieldValue,
  isAcceptedScannerField,
} from "./scanner-types";

/* ============================================================
   RESULT TYPES
============================================================ */

export type ScannerNormalizationMode =
  | "CONFIRMED_ONLY"
  | "ALLOW_UNREVIEWED";

export type ScannerNormalizationOptions = {
  side?: OfferSide;

  offerId?: string;

  mode?: ScannerNormalizationMode;

  notes?: string;
};

export type ScannerNormalizationResult = {
  offer: OfferInput;

  acceptedPaths: string[];

  ignoredPaths: string[];

  warnings: string[];
};

/* ============================================================
   BASIC HELPERS
============================================================ */

function safeString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function safeNumber(
  value: unknown
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : 0;
}

function safePositiveNumber(
  value: unknown
): number {
  return Math.max(
    safeNumber(value),
    0
  );
}

function safeNullableString(
  value: unknown
): string | null {
  const normalized =
    safeString(value);

  return normalized
    ? normalized
    : null;
}

function uniqueStrings(
  values: string[]
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) =>
          value.trim()
        )
        .filter(Boolean)
    )
  );
}

/* ============================================================
   TRUST / ACCEPTANCE

   CONFIRMED_ONLY:
   only CONFIRMED / EDITED fields become model inputs.

   ALLOW_UNREVIEWED:
   useful later for previews, but should NOT be used for final
   comparison without validation / user confirmation.
============================================================ */

function canUseScannerField<T>(
  field: OfferScannerField<T>,
  mode: ScannerNormalizationMode
): boolean {
  if (
    !hasScannerFieldValue(
      field
    )
  ) {
    return false;
  }

  if (
    mode ===
    "ALLOW_UNREVIEWED"
  ) {
    return (
      field.reviewStatus !==
        "REJECTED" &&
      field.reviewStatus !==
        "MISSING"
    );
  }

  return isAcceptedScannerField(
    field
  );
}

function acceptedValue<T>(
  field: OfferScannerField<T>,
  mode: ScannerNormalizationMode
): T | null {
  if (
    !canUseScannerField(
      field,
      mode
    )
  ) {
    return null;
  }

  return field.value;
}

function acceptedNumber(
  field: OfferScannerField<number>,
  mode: ScannerNormalizationMode
): number {
  return safePositiveNumber(
    acceptedValue(
      field,
      mode
    )
  );
}

function acceptedText(
  field: OfferScannerField<string>,
  mode: ScannerNormalizationMode
): string {
  return safeString(
    acceptedValue(
      field,
      mode
    )
  );
}

function acceptedDate(
  field: OfferScannerField<string>,
  mode: ScannerNormalizationMode
): string | null {
  return safeNullableString(
    acceptedValue(
      field,
      mode
    )
  );
}

/* ============================================================
   ENUM MAPPERS
============================================================ */

export function mapScannerCurrency(
  value: OfferScannerCurrency
): OfferCurrency {
  switch (value) {
    case "INR":
      return "INR";

    case "USD":
      return "USD";

    case "EUR":
      return "EUR";

    case "GBP":
      return "GBP";

    /*
     * Core Phase 4 currently has no AED / SGD enum.
     * Preserve scanner metadata separately, while OfferInput
     * safely falls back to OTHER.
     */

    case "AED":
    case "SGD":
    case "OTHER":
    case "UNKNOWN":
    default:
      return "OTHER";
  }
}

export function mapScannerEmploymentType(
  value:
    OfferScannerEmploymentType
): OfferEmploymentType {
  switch (value) {
    case "FULL_TIME":
      return "FULL_TIME";

    case "CONTRACT":
      return "CONTRACT";

    case "INTERNSHIP":
      return "INTERNSHIP";

    /*
     * Core type intentionally has no PART_TIME or CONSULTANT.
     */

    case "PART_TIME":
    case "CONSULTANT":
    case "UNKNOWN":
    default:
      return "OTHER";
  }
}

export function mapScannerWorkMode(
  value: OfferScannerWorkMode
): OfferWorkMode {
  switch (value) {
    case "ONSITE":
      return "ONSITE";

    case "HYBRID":
      return "HYBRID";

    case "REMOTE":
      return "REMOTE";

    case "UNKNOWN":
    default:
      return "UNKNOWN";
  }
}

export function mapScannerEquityType(
  value: OfferScannerEquityType
): OfferEquityType {
  switch (value) {
    case "NONE":
      return "NONE";

    case "ESOP":
      return "ESOP";

    case "RSU":
      return "RSU";

    case "STOCK":
      return "STOCK";

    case "UNKNOWN":
    default:
      return "OTHER";
  }
}

export function mapScannerCompanyStatus(
  value:
    OfferScannerCompanyStatus
): OfferCompanyEquityStatus {
  switch (value) {
    case "LISTED":
      return "LISTED";

    case "UNLISTED":
      return "UNLISTED";

    case "UNKNOWN":
    default:
      return "UNKNOWN";
  }
}

export function mapScannerVestingFrequency(
  value:
    OfferScannerVestingFrequency
): OfferVestingFrequency {
  switch (value) {
    case "MONTHLY":
      return "MONTHLY";

    case "QUARTERLY":
      return "QUARTERLY";

    case "HALF_YEARLY":
      return "SEMI_ANNUAL";

    case "YEARLY":
      return "ANNUAL";

    case "CUSTOM":
      return "CUSTOM";

    case "UNKNOWN":
    default:
      return "UNKNOWN";
  }
}

/* ============================================================
   SCANNER REVIEW STATUS -> CORE FIELD STATUS
============================================================ */

export function mapScannerReviewStatus(
  status:
    OfferScannerReviewStatus
): OfferFieldStatus {
  switch (status) {
    case "CONFIRMED":
      return "USER_CONFIRMED";

    case "EDITED":
      return "USER_CONFIRMED";

    case "REJECTED":
      return "NOT_FOUND";

    case "MISSING":
      return "NOT_FOUND";

    case "UNREVIEWED":
    default:
      return "REVIEW";
  }
}

/* ============================================================
   FIELD PROVENANCE

   Core OfferInput already supports OfferExtractedField[].

   We preserve scanner evidence here so the production UI can
   later show:
      value
      confidence
      source text
      page
      confirmation status
============================================================ */

function toCoreExtractedField<T>(
  path: string,
  label: string,
  field: OfferScannerField<T>
): OfferExtractedField<unknown> {
  const firstEvidence =
    field.evidence[0];

  const sourceText =
    firstEvidence?.excerpt ??
    firstEvidence?.label ??
    field.rawValue ??
    null;

  const sourcePage =
    typeof firstEvidence?.pageNumber ===
      "number"
      ? firstEvidence.pageNumber
      : null;

  const extractedValue =
    field.value === undefined
      ? null
      : field.value;

  const confirmedValue =
    isAcceptedScannerField(
      field
    )
      ? extractedValue
      : null;

  return {
    key:
      path,

    label,

    extractedValue,

    confirmedValue,

    status:
      mapScannerReviewStatus(
        field.reviewStatus
      ),

    confidence:
      field.confidence,

    sourceText,

    sourcePage,

    reviewedAt:
      isAcceptedScannerField(
        field
      )
        ? new Date().toISOString()
        : null,
  };
}

/* ============================================================
   FIELD REGISTRATION

   Keeps accepted / ignored paths and provenance in sync.
============================================================ */

type RegisterFieldOptions = {
  path: string;

  label: string;

  field:
    OfferScannerField<unknown>;

  mode:
    ScannerNormalizationMode;

  fields:
    OfferExtractedField<unknown>[];

  acceptedPaths:
    string[];

  ignoredPaths:
    string[];
};

function registerField(
  options:
    RegisterFieldOptions
): void {
  options.fields.push(
    toCoreExtractedField(
      options.path,
      options.label,
      options.field
    )
  );

  if (
    canUseScannerField(
      options.field,
      options.mode
    )
  ) {
    options.acceptedPaths.push(
      options.path
    );

    return;
  }

  if (
    hasScannerFieldValue(
      options.field
    )
  ) {
    options.ignoredPaths.push(
      options.path
    );
  }
}

/* ============================================================
   DOCUMENT SOURCE
============================================================ */

function buildSourceDocument(
  scan:
    ScannedOfferLetter
): OfferDocumentSource {
  return {
    documentId:
      scan.metadata.documentId ||
      scan.scanId ||
      null,

    originalFileName:
      scan.metadata.fileName ||
      null,

    /*
     * scanner-types currently stores normalized file type rather
     * than original MIME type. We therefore do not manufacture a
     * MIME value here.
     */

    mimeType:
      null,

    fileSizeBytes:
      null,

    status:
      scan.readiness
        .modelReadiness ===
      "READY"
        ? "CONFIRMED"
        : "REVIEW_REQUIRED",

    uploadedAt:
      scan.createdAt ||
      null,

    processedAt:
      scan.metadata.scannedAt ||
      scan.updatedAt ||
      null,

    confirmedAt:
      scan.readiness
        .modelReadiness ===
      "READY"
        ? scan.updatedAt ||
          null
        : null,
  };
}

/* ============================================================
   REGISTER ALL SCANNER FIELDS

   This is intentionally explicit.

   We do not recursively flatten arbitrary scanner objects because
   explicit mappings protect the production contract when scanner
   fields evolve independently of OfferInput.
============================================================ */

function buildCoreFieldProvenance(
  scan:
    ScannedOfferLetter,
  mode:
    ScannerNormalizationMode
): {
  fields:
    OfferExtractedField<unknown>[];

  acceptedPaths:
    string[];

  ignoredPaths:
    string[];
} {
  const fields:
    OfferExtractedField<unknown>[] =
    [];

  const acceptedPaths:
    string[] =
    [];

  const ignoredPaths:
    string[] =
    [];

  const register = (
    path: string,
    label: string,
    field:
      OfferScannerField<unknown>
  ) => {
    registerField({
      path,
      label,
      field,
      mode,
      fields,
      acceptedPaths,
      ignoredPaths,
    });
  };

  /* ----------------------------------------------------------
     EMPLOYER
  ---------------------------------------------------------- */

  register(
    "employer.companyName",
    "Company name",
    scan.employer.companyName
  );

  register(
    "employer.roleTitle",
    "Role / designation",
    scan.employer.roleTitle
  );

  register(
    "employer.department",
    "Department",
    scan.employer.department
  );

  register(
    "employer.location",
    "Work location",
    scan.employer.location
  );

  register(
    "employer.employmentType",
    "Employment type",
    scan.employer.employmentType
  );

  register(
    "employer.workMode",
    "Work mode",
    scan.employer.workMode
  );

  register(
    "employer.joiningDate",
    "Joining date",
    scan.employer.joiningDate
  );

  register(
    "employer.probationMonths",
    "Probation period",
    scan.employer.probationMonths
  );

  register(
    "employer.noticePeriodDays",
    "Notice period",
    scan.employer.noticePeriodDays
  );

  /* ----------------------------------------------------------
     CASH
  ---------------------------------------------------------- */

  register(
    "cash.headlineCTC",
    "Headline CTC",
    scan.cash.headlineCTC
  );

  register(
    "cash.fixedSalary",
    "Fixed salary",
    scan.cash.fixedSalary
  );

  register(
    "cash.basicSalary",
    "Basic salary",
    scan.cash.basicSalary
  );

  register(
    "cash.hra",
    "HRA",
    scan.cash.hra
  );

  register(
    "cash.specialAllowance",
    "Special allowance",
    scan.cash.specialAllowance
  );

  register(
    "cash.otherFixedAllowance",
    "Other fixed allowance",
    scan.cash.otherFixedAllowance
  );

  register(
    "cash.targetVariablePay",
    "Target variable pay",
    scan.cash.targetVariablePay
  );

  register(
    "cash.maximumVariablePay",
    "Maximum variable pay",
    scan.cash.maximumVariablePay
  );

  register(
    "cash.joiningBonus",
    "Joining bonus",
    scan.cash.joiningBonus
  );

  register(
    "cash.retentionBonus",
    "Retention bonus",
    scan.cash.retentionBonus
  );

  register(
    "cash.relocationBonus",
    "Relocation bonus",
    scan.cash.relocationBonus
  );

  register(
    "cash.performanceBonus",
    "Performance bonus",
    scan.cash.performanceBonus
  );

  register(
    "cash.employerPF",
    "Employer PF",
    scan.cash.employerPF
  );

  register(
    "cash.gratuity",
    "Gratuity",
    scan.cash.gratuity
  );

  register(
    "cash.insuranceValue",
    "Insurance value",
    scan.cash.insuranceValue
  );

  register(
    "cash.otherEmployerBenefits",
    "Other employer benefits",
    scan.cash.otherEmployerBenefits
  );

  /* ----------------------------------------------------------
     EQUITY
  ---------------------------------------------------------- */

  register(
    "equity.type",
    "Equity type",
    scan.equity.type
  );

  register(
    "equity.companyStatus",
    "Company status",
    scan.equity.companyStatus
  );

  register(
    "equity.employerHeadlineEquityValue",
    "Employer-stated equity value",
    scan.equity
      .employerHeadlineEquityValue
  );

  register(
    "equity.totalOptionsOrShares",
    "Options / shares granted",
    scan.equity.totalOptionsOrShares
  );

  register(
    "equity.exercisePrice",
    "Exercise / strike price",
    scan.equity.exercisePrice
  );

  register(
    "equity.currentFMV",
    "Current FMV",
    scan.equity.currentFMV
  );

  register(
    "equity.listedSharePrice",
    "Listed share price",
    scan.equity.listedSharePrice
  );

  register(
    "equity.companyValuation",
    "Company valuation",
    scan.equity.companyValuation
  );

  register(
    "equity.totalCompanyShares",
    "Total company shares",
    scan.equity.totalCompanyShares
  );

  register(
    "equity.ownershipPercentage",
    "Ownership percentage",
    scan.equity.ownershipPercentage
  );

  register(
    "equity.vestingDurationMonths",
    "Vesting duration",
    scan.equity.vestingDurationMonths
  );

  register(
    "equity.cliffMonths",
    "Cliff",
    scan.equity.cliffMonths
  );

  register(
    "equity.vestingFrequency",
    "Vesting frequency",
    scan.equity.vestingFrequency
  );

  register(
    "equity.vestingStartDate",
    "Vesting start date",
    scan.equity.vestingStartDate
  );

  register(
    "equity.grantDate",
    "Grant date",
    scan.equity.grantDate
  );

  register(
    "equity.expiryDate",
    "Grant expiry date",
    scan.equity.expiryDate
  );

  register(
    "equity.postTerminationExerciseDays",
    "Post-termination exercise window",
    scan.equity
      .postTerminationExerciseDays
  );

  register(
    "equity.expectedDilutionPercentage",
    "Expected dilution",
    scan.equity
      .expectedDilutionPercentage
  );

  /* ----------------------------------------------------------
     BENEFITS
  ---------------------------------------------------------- */

  register(
    "benefits.healthInsuranceValue",
    "Health insurance value",
    scan.benefits.healthInsuranceValue
  );

  register(
    "benefits.lifeInsuranceValue",
    "Life insurance value",
    scan.benefits.lifeInsuranceValue
  );

  register(
    "benefits.learningBudgetValue",
    "Learning budget value",
    scan.benefits.learningBudgetValue
  );

  register(
    "benefits.mealBenefitValue",
    "Meal benefit value",
    scan.benefits.mealBenefitValue
  );

  register(
    "benefits.transportBenefitValue",
    "Transport benefit value",
    scan.benefits.transportBenefitValue
  );

  register(
    "benefits.internetBenefitValue",
    "Internet benefit value",
    scan.benefits.internetBenefitValue
  );

  register(
    "benefits.wellnessBenefitValue",
    "Wellness benefit value",
    scan.benefits.wellnessBenefitValue
  );

  register(
    "benefits.otherAnnualBenefitValue",
    "Other annual benefit value",
    scan.benefits.otherAnnualBenefitValue
  );

  /* ----------------------------------------------------------
     SPECIAL CONDITIONS

     These do not currently map directly into the Phase 4
     economic engine, but provenance MUST be preserved.
  ---------------------------------------------------------- */

  register(
    "specialConditions.joiningBonusClawback",
    "Joining-bonus clawback",
    scan.specialConditions
      .joiningBonusClawback
  );

  register(
    "specialConditions.joiningBonusClawbackMonths",
    "Joining-bonus clawback period",
    scan.specialConditions
      .joiningBonusClawbackMonths
  );

  register(
    "specialConditions.retentionBonusClawback",
    "Retention-bonus clawback",
    scan.specialConditions
      .retentionBonusClawback
  );

  register(
    "specialConditions.nonCompeteMentioned",
    "Non-compete mentioned",
    scan.specialConditions
      .nonCompeteMentioned
  );

  register(
    "specialConditions.bondMentioned",
    "Employment bond mentioned",
    scan.specialConditions
      .bondMentioned
  );

  register(
    "specialConditions.bondAmount",
    "Employment bond amount",
    scan.specialConditions
      .bondAmount
  );

  register(
    "specialConditions.bondDurationMonths",
    "Employment bond duration",
    scan.specialConditions
      .bondDurationMonths
  );

  register(
    "specialConditions.variablePayDiscretionary",
    "Variable pay discretionary",
    scan.specialConditions
      .variablePayDiscretionary
  );

  register(
    "specialConditions.equitySubjectToBoardApproval",
    "Equity subject to board approval",
    scan.specialConditions
      .equitySubjectToBoardApproval
  );

  register(
    "specialConditions.equityForfeitureOnLeaving",
    "Equity forfeiture on leaving",
    scan.specialConditions
      .equityForfeitureOnLeaving
  );

  register(
    "specialConditions.postTerminationExerciseWindowMentioned",
    "Post-termination exercise window mentioned",
    scan.specialConditions
      .postTerminationExerciseWindowMentioned
  );

  register(
    "specialConditions.notes",
    "Special-condition notes",
    scan.specialConditions.notes
  );

  return {
    fields,

    acceptedPaths:
      uniqueStrings(
        acceptedPaths
      ),

    ignoredPaths:
      uniqueStrings(
        ignoredPaths
      ),
  };
}

/* ============================================================
   MAIN NORMALIZER
============================================================ */

export function normalizeScannedOfferToOfferInput(
  scan:
    ScannedOfferLetter,
  options?:
    ScannerNormalizationOptions
): ScannerNormalizationResult {
  const side =
    options?.side ??
    "A";

  const mode =
    options?.mode ??
    "CONFIRMED_ONLY";

  const base =
    createDefaultOffer(
      side
    );

  const provenance =
    buildCoreFieldProvenance(
      scan,
      mode
    );

  const warnings:
    string[] =
    [];

  /* ----------------------------------------------------------
     EMPLOYER
  ---------------------------------------------------------- */

  const companyName =
    acceptedText(
      scan.employer.companyName,
      mode
    );

  const roleTitle =
    acceptedText(
      scan.employer.roleTitle,
      mode
    );

  const location =
    acceptedText(
      scan.employer.location,
      mode
    );

  const employmentTypeValue =
    acceptedValue(
      scan.employer.employmentType,
      mode
    );

  const workModeValue =
    acceptedValue(
      scan.employer.workMode,
      mode
    );

  /* ----------------------------------------------------------
     EQUITY ENUMS
  ---------------------------------------------------------- */

  const equityTypeValue =
    acceptedValue(
      scan.equity.type,
      mode
    );

  const companyStatusValue =
    acceptedValue(
      scan.equity.companyStatus,
      mode
    );

  const vestingFrequencyValue =
    acceptedValue(
      scan.equity.vestingFrequency,
      mode
    );

  /* ----------------------------------------------------------
     SPECIAL BENEFIT AGGREGATION

     Core OfferBenefits does not yet have an internet-specific
     field. Preserve internet benefit economically under
     otherBenefitsValue while retaining exact provenance in
     OfferInput.fields.
  ---------------------------------------------------------- */

  const internetBenefit =
    acceptedNumber(
      scan.benefits.internetBenefitValue,
      mode
    );

  const otherAnnualBenefit =
    acceptedNumber(
      scan.benefits.otherAnnualBenefitValue,
      mode
    );

  const otherBenefitsValue =
    internetBenefit +
    otherAnnualBenefit;

  /* ----------------------------------------------------------
     OTHER RECURRING CASH

     scanner otherFixedAllowance maps to the established core
     otherRecurringCash bucket.
  ---------------------------------------------------------- */

  const otherRecurringCash =
    acceptedNumber(
      scan.cash.otherFixedAllowance,
      mode
    );

  /* ----------------------------------------------------------
     RELOCATION

     scanner uses relocationBonus.
     core engine uses relocationAllowance.
  ---------------------------------------------------------- */

  const relocationAllowance =
    acceptedNumber(
      scan.cash.relocationBonus,
      mode
    );

  /* ----------------------------------------------------------
     WARNINGS ABOUT IGNORED EXTRACTION
  ---------------------------------------------------------- */

  if (
    mode ===
      "CONFIRMED_ONLY" &&
    provenance
      .ignoredPaths
      .length > 0
  ) {
    warnings.push(
      `${provenance.ignoredPaths.length} extracted field(s) were not used because they have not been confirmed or edited by the user.`
    );
  }

  if (
    scan.metadata.currency ===
      "AED" ||
    scan.metadata.currency ===
      "SGD"
  ) {
    warnings.push(
      `${scan.metadata.currency} is preserved in scanner metadata, but the current Phase 4 OfferInput currency enum does not model it directly. The normalized offer uses OTHER.`
    );
  }

  if (
    employmentTypeValue ===
      "PART_TIME" ||
    employmentTypeValue ===
      "CONSULTANT"
  ) {
    warnings.push(
      `${employmentTypeValue} is preserved in scanner provenance, but the current Phase 4 core employment enum maps it to OTHER.`
    );
  }

  if (
    scan.specialConditions
      .bondMentioned.value ===
      true
  ) {
    warnings.push(
      "An employment bond was detected. Bond economics are preserved in scanner provenance but are not yet included in Phase 4 economic-value calculations."
    );
  }

  if (
    scan.specialConditions
      .joiningBonusClawback.value ===
      true
  ) {
    warnings.push(
      "A joining-bonus clawback was detected. The condition is preserved in scanner provenance but the current comparison engine does not yet probability-adjust or amortize clawback risk."
    );
  }

  if (
    scan.specialConditions
      .equitySubjectToBoardApproval.value ===
      true
  ) {
    warnings.push(
      "The scanner detected that equity may be subject to board approval. Treat the grant as conditional until the underlying grant is confirmed."
    );
  }

  /* ----------------------------------------------------------
     BUILD OFFER INPUT

     Neutral defaults remain from createDefaultOffer() whenever
     a scanner value is not accepted.
  ---------------------------------------------------------- */

  const candidate:
    OfferInput = {
    ...base,

    id:
      options?.offerId ??
      `offer-from-scan-${scan.scanId}`,

    side,

    inputMode:
      "DOCUMENT",

    currency:
      mapScannerCurrency(
        scan.metadata.currency
      ),

    employer: {
      ...base.employer,

      companyName,

      roleTitle,

      location,

      employmentType:
        employmentTypeValue
          ? mapScannerEmploymentType(
              employmentTypeValue
            )
          : base.employer
              .employmentType,

      workMode:
        workModeValue
          ? mapScannerWorkMode(
              workModeValue
            )
          : base.employer
              .workMode,

      joiningDate:
        acceptedDate(
          scan.employer.joiningDate,
          mode
        ),
    },

    cash: {
      ...base.cash,

      headlineCTC:
        acceptedNumber(
          scan.cash.headlineCTC,
          mode
        ),

      fixedSalary:
        acceptedNumber(
          scan.cash.fixedSalary,
          mode
        ),

      basicSalary:
        acceptedNumber(
          scan.cash.basicSalary,
          mode
        ),

      hra:
        acceptedNumber(
          scan.cash.hra,
          mode
        ),

      specialAllowance:
        acceptedNumber(
          scan.cash.specialAllowance,
          mode
        ),

      /*
       * Scanner currently has no dedicated flexible-benefits
       * compensation field.
       */

      flexibleBenefits:
        base.cash
          .flexibleBenefits,

      otherRecurringCash,

      targetVariablePay:
        acceptedNumber(
          scan.cash.targetVariablePay,
          mode
        ),

      maximumVariablePay:
        acceptedNumber(
          scan.cash.maximumVariablePay,
          mode
        ),

      /*
       * Keep targetBonus separate from performanceBonus.
       *
       * Scanner currently exposes performanceBonus but not a
       * second independent targetBonus field.
       */

      targetBonus:
        base.cash.targetBonus,

      performanceBonus:
        acceptedNumber(
          scan.cash.performanceBonus,
          mode
        ),

      otherVariablePay:
        base.cash
          .otherVariablePay,

      joiningBonus:
        acceptedNumber(
          scan.cash.joiningBonus,
          mode
        ),

      retentionBonus:
        acceptedNumber(
          scan.cash.retentionBonus,
          mode
        ),

      relocationAllowance,

      otherOneTimeCash:
        base.cash
          .otherOneTimeCash,

      employerPF:
        acceptedNumber(
          scan.cash.employerPF,
          mode
        ),

      gratuity:
        acceptedNumber(
          scan.cash.gratuity,
          mode
        ),

      insuranceValue:
        acceptedNumber(
          scan.cash.insuranceValue,
          mode
        ),

      otherBenefitsValue:
        acceptedNumber(
          scan.cash.otherEmployerBenefits,
          mode
        ),
    },

    equity: {
      ...base.equity,

      type:
        equityTypeValue
          ? mapScannerEquityType(
              equityTypeValue
            )
          : base.equity.type,

      companyStatus:
        companyStatusValue
          ? mapScannerCompanyStatus(
              companyStatusValue
            )
          : base.equity
              .companyStatus,

      employerHeadlineEquityValue:
        acceptedNumber(
          scan.equity
            .employerHeadlineEquityValue,
          mode
        ),

      totalOptionsOrShares:
        acceptedNumber(
          scan.equity
            .totalOptionsOrShares,
          mode
        ),

      exercisePrice:
        acceptedNumber(
          scan.equity.exercisePrice,
          mode
        ),

      currentFMV:
        acceptedNumber(
          scan.equity.currentFMV,
          mode
        ),

      listedSharePrice:
        acceptedNumber(
          scan.equity.listedSharePrice,
          mode
        ),

      companyValuation:
        acceptedNumber(
          scan.equity.companyValuation,
          mode
        ),

      totalCompanyShares:
        acceptedNumber(
          scan.equity.totalCompanyShares,
          mode
        ),

      ownershipPercentage:
        acceptedNumber(
          scan.equity.ownershipPercentage,
          mode
        ),

      vestingStartDate:
        acceptedDate(
          scan.equity.vestingStartDate,
          mode
        ),

      vestingDurationMonths:
        acceptedNumber(
          scan.equity
            .vestingDurationMonths,
          mode
        ),

      cliffMonths:
        acceptedNumber(
          scan.equity.cliffMonths,
          mode
        ),

      vestingFrequency:
        vestingFrequencyValue
          ? mapScannerVestingFrequency(
              vestingFrequencyValue
            )
          : base.equity
              .vestingFrequency,

      expiryDate:
        acceptedDate(
          scan.equity.expiryDate,
          mode
        ),

      postTerminationExerciseDays:
        canUseScannerField(
          scan.equity
            .postTerminationExerciseDays,
          mode
        )
          ? acceptedNumber(
              scan.equity
                .postTerminationExerciseDays,
              mode
            )
          : null,

      expectedDilutionPercentage:
        acceptedNumber(
          scan.equity
            .expectedDilutionPercentage,
          mode
        ),

      /*
       * Scanner does not decide future Bear/Base/Bull assumptions.
       * Preserve the established defaults from normalize.ts.
       */

      bearEquityMultiplier:
        base.equity
          .bearEquityMultiplier,

      baseEquityMultiplier:
        base.equity
          .baseEquityMultiplier,

      bullEquityMultiplier:
        base.equity
          .bullEquityMultiplier,
    },

    benefits: {
      ...base.benefits,

      healthInsuranceValue:
        acceptedNumber(
          scan.benefits
            .healthInsuranceValue,
          mode
        ),

      lifeInsuranceValue:
        acceptedNumber(
          scan.benefits
            .lifeInsuranceValue,
          mode
        ),

      mealBenefitsValue:
        acceptedNumber(
          scan.benefits
            .mealBenefitValue,
          mode
        ),

      transportBenefitsValue:
        acceptedNumber(
          scan.benefits
            .transportBenefitValue,
          mode
        ),

      wellnessBenefitsValue:
        acceptedNumber(
          scan.benefits
            .wellnessBenefitValue,
          mode
        ),

      learningBudgetValue:
        acceptedNumber(
          scan.benefits
            .learningBudgetValue,
          mode
        ),

      otherBenefitsValue,

      notes:
        [
          "Normalized from reviewed offer-letter scanner data.",

          options?.notes ??
            "",

          scan.scannerSummary ??
            "",
        ]
          .filter(Boolean)
          .join(" "),
    },

    sourceDocument:
      buildSourceDocument(
        scan
      ),

    fields:
      provenance.fields,

    notes:
      [
        "Created from Offer Intelligence scanner.",

        `Scanner readiness: ${scan.readiness.modelReadiness}.`,

        options?.notes ??
          "",
      ]
        .filter(Boolean)
        .join(" "),

    createdAt:
      scan.createdAt ||
      new Date().toISOString(),

    updatedAt:
      scan.updatedAt ||
      new Date().toISOString(),
  };

  /*
   * Run through the already-tested Phase 4 normalizer.
   *
   * This preserves the exact invariants expected by:
   * compensation.ts
   * equity.ts
   * compare.ts
   * breakeven.ts
   * negotiation.ts
   */

  const offer =
    normalizeOfferInput(
      candidate,
      side
    );

  return {
    offer,

    acceptedPaths:
      provenance
        .acceptedPaths,

    ignoredPaths:
      provenance
        .ignoredPaths,

    warnings:
      uniqueStrings(
        warnings
      ),
  };
}

/* ============================================================
   PREVIEW NORMALIZATION

   Useful for the Review & Confirm screen.

   IMPORTANT:
   This may include UNREVIEWED extracted values.

   Do not use this output as the final persisted / trusted offer.
============================================================ */

export function normalizeScannedOfferPreview(
  scan:
    ScannedOfferLetter,
  side:
    OfferSide = "A"
): ScannerNormalizationResult {
  return normalizeScannedOfferToOfferInput(
    scan,
    {
      side,

      mode:
        "ALLOW_UNREVIEWED",
    }
  );
}

/* ============================================================
   CONFIRMED NORMALIZATION

   This is the production-safe path for creating a real OfferInput.
============================================================ */

export function normalizeConfirmedScannedOffer(
  scan:
    ScannedOfferLetter,
  side:
    OfferSide = "A",
  offerId?:
    string
): ScannerNormalizationResult {
  return normalizeScannedOfferToOfferInput(
    scan,
    {
      side,

      offerId,

      mode:
        "CONFIRMED_ONLY",
    }
  );
}

/* ============================================================
   QUICK TRUST CHECK

   This does NOT replace scanner-validation.ts.

   It simply tells callers whether the scanner itself says the
   model is ready and no blocking issue remains.
============================================================ */

export function isScannedOfferReadyForNormalization(
  scan:
    ScannedOfferLetter
): boolean {
  return (
    scan.readiness
      .modelReadiness ===
      "READY" &&
    scan.readiness
      .canCreateOffer &&
    scan.readiness
      .blockingIssueCount ===
      0
  );
}
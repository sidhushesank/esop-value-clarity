/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   OFFER LETTER SCANNER TYPES

   Responsibilities:
   - define the contract between document extraction and UI
   - preserve extraction confidence
   - preserve source evidence
   - distinguish extracted values from user-confirmed values
   - identify missing / suspicious fields
   - support Indian compensation + ESOP / RSU offer letters

   IMPORTANT:
   This file DOES NOT:
   - perform OCR
   - call an AI model
   - normalize into OfferInput
   - calculate offer economics
   - persist anything
   - modify Phase 1–3 PRO state

   PRODUCT PRINCIPLE:
   Extracted data is NOT automatically trusted.

   Scanner:
      document -> candidate values

   User:
      reviews / edits / confirms

   Only then:
      confirmed values -> OfferInput -> Phase 4 engines
============================================================ */

/* ============================================================
   DOCUMENT TYPES
============================================================ */

export type OfferScannerDocumentType =
  | "OFFER_LETTER"
  | "COMPENSATION_ANNEXURE"
  | "ESOP_GRANT"
  | "RSU_GRANT"
  | "EMPLOYMENT_AGREEMENT"
  | "MULTI_DOCUMENT"
  | "UNKNOWN";

export type OfferScannerFileType =
  | "PDF"
  | "DOCX"
  | "IMAGE"
  | "TEXT"
  | "UNKNOWN";

/* ============================================================
   EXTRACTION CONFIDENCE

   HIGH:
   value is explicitly stated and strongly associated with field

   MEDIUM:
   value appears likely but surrounding context is ambiguous

   LOW:
   scanner inferred or weakly matched the value

   UNKNOWN:
   no meaningful confidence available
============================================================ */

export type OfferScannerConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "UNKNOWN";

/* ============================================================
   FIELD REVIEW STATUS
============================================================ */

export type OfferScannerReviewStatus =
  | "UNREVIEWED"
  | "CONFIRMED"
  | "EDITED"
  | "REJECTED"
  | "MISSING";

/* ============================================================
   EXTRACTION SOURCE
============================================================ */

export type OfferScannerSource = {
  documentId?: string;

  fileName?: string;

  pageNumber?: number;

  section?: string;

  label?: string;

  excerpt?: string;
};

/* ============================================================
   GENERIC EXTRACTED FIELD

   rawValue:
   what scanner originally found

   value:
   current value after possible user edit

   evidence:
   exact source context

   reviewStatus:
   user confirmation state
============================================================ */

export type OfferScannerField<T> = {
  value: T | null;

  rawValue?: string | null;

  confidence: OfferScannerConfidence;

  reviewStatus: OfferScannerReviewStatus;

  evidence: OfferScannerSource[];

  notes?: string[];

  inferred?: boolean;
};

/* ============================================================
   CONVENIENCE FIELD TYPES
============================================================ */

export type OfferScannerTextField =
  OfferScannerField<string>;

export type OfferScannerNumberField =
  OfferScannerField<number>;

export type OfferScannerBooleanField =
  OfferScannerField<boolean>;

export type OfferScannerDateField =
  OfferScannerField<string>;

/* ============================================================
   CURRENCY
============================================================ */

export type OfferScannerCurrency =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "SGD"
  | "OTHER"
  | "UNKNOWN";

/* ============================================================
   COMPANY STATUS
============================================================ */

export type OfferScannerCompanyStatus =
  | "LISTED"
  | "UNLISTED"
  | "UNKNOWN";

/* ============================================================
   EQUITY TYPE
============================================================ */

export type OfferScannerEquityType =
  | "ESOP"
  | "RSU"
  | "STOCK"
  | "NONE"
  | "UNKNOWN";

/* ============================================================
   EMPLOYMENT TYPE
============================================================ */

export type OfferScannerEmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "CONSULTANT"
  | "UNKNOWN";

/* ============================================================
   WORK MODE
============================================================ */

export type OfferScannerWorkMode =
  | "ONSITE"
  | "HYBRID"
  | "REMOTE"
  | "UNKNOWN";

/* ============================================================
   VESTING FREQUENCY
============================================================ */

export type OfferScannerVestingFrequency =
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "YEARLY"
  | "CUSTOM"
  | "UNKNOWN";

/* ============================================================
   EMPLOYER / ROLE EXTRACTION
============================================================ */

export type OfferScannerEmployerFields = {
  companyName: OfferScannerTextField;

  roleTitle: OfferScannerTextField;

  department: OfferScannerTextField;

  location: OfferScannerTextField;

  employmentType:
    OfferScannerField<OfferScannerEmploymentType>;

  workMode:
    OfferScannerField<OfferScannerWorkMode>;

  joiningDate: OfferScannerDateField;

  probationMonths: OfferScannerNumberField;

  noticePeriodDays: OfferScannerNumberField;
};

/* ============================================================
   COMPENSATION EXTRACTION

   IMPORTANT:
   These are deliberately separate.

   Example:
   Headline CTC ₹30L does NOT mean fixed salary ₹30L.

   We preserve:
   - headline CTC
   - fixed salary
   - salary components
   - variable pay
   - one-time compensation
   - employer-side benefits
============================================================ */

export type OfferScannerCashFields = {
  headlineCTC: OfferScannerNumberField;

  fixedSalary: OfferScannerNumberField;

  basicSalary: OfferScannerNumberField;

  hra: OfferScannerNumberField;

  specialAllowance: OfferScannerNumberField;

  otherFixedAllowance: OfferScannerNumberField;

  targetVariablePay: OfferScannerNumberField;

  maximumVariablePay: OfferScannerNumberField;

  joiningBonus: OfferScannerNumberField;

  retentionBonus: OfferScannerNumberField;

  relocationBonus: OfferScannerNumberField;

  performanceBonus: OfferScannerNumberField;

  employerPF: OfferScannerNumberField;

  gratuity: OfferScannerNumberField;

  insuranceValue: OfferScannerNumberField;

  otherEmployerBenefits:
    OfferScannerNumberField;
};

/* ============================================================
   EQUITY EXTRACTION

   employerHeadlineEquityValue:
   whatever headline number the employer presents.

   This is NOT automatically a reliable valuation basis.

   Example:
      "ESOPs worth ₹15 lakh"

   without:
      option quantity
      strike price
      FMV
      company valuation/share count

   is insufficient for reliable modeling.
============================================================ */

export type OfferScannerEquityFields = {
  type:
    OfferScannerField<OfferScannerEquityType>;

  companyStatus:
    OfferScannerField<OfferScannerCompanyStatus>;

  employerHeadlineEquityValue:
    OfferScannerNumberField;

  totalOptionsOrShares:
    OfferScannerNumberField;

  exercisePrice:
    OfferScannerNumberField;

  currentFMV:
    OfferScannerNumberField;

  listedSharePrice:
    OfferScannerNumberField;

  companyValuation:
    OfferScannerNumberField;

  totalCompanyShares:
    OfferScannerNumberField;

  ownershipPercentage:
    OfferScannerNumberField;

  vestingDurationMonths:
    OfferScannerNumberField;

  cliffMonths:
    OfferScannerNumberField;

  vestingFrequency:
    OfferScannerField<OfferScannerVestingFrequency>;

  vestingStartDate:
    OfferScannerDateField;

  grantDate:
    OfferScannerDateField;

  expiryDate:
    OfferScannerDateField;

  postTerminationExerciseDays:
    OfferScannerNumberField;

  expectedDilutionPercentage:
    OfferScannerNumberField;
};

/* ============================================================
   BENEFIT EXTRACTION
============================================================ */

export type OfferScannerBenefitFields = {
  healthInsuranceValue:
    OfferScannerNumberField;

  lifeInsuranceValue:
    OfferScannerNumberField;

  learningBudgetValue:
    OfferScannerNumberField;

  mealBenefitValue:
    OfferScannerNumberField;

  transportBenefitValue:
    OfferScannerNumberField;

  internetBenefitValue:
    OfferScannerNumberField;

  wellnessBenefitValue:
    OfferScannerNumberField;

  otherAnnualBenefitValue:
    OfferScannerNumberField;
};

/* ============================================================
   SPECIAL CONDITIONS

   These are commercially important even when they cannot be
   converted directly into money.
============================================================ */

export type OfferScannerSpecialConditions = {
  joiningBonusClawback:
    OfferScannerBooleanField;

  joiningBonusClawbackMonths:
    OfferScannerNumberField;

  retentionBonusClawback:
    OfferScannerBooleanField;

  nonCompeteMentioned:
    OfferScannerBooleanField;

  bondMentioned:
    OfferScannerBooleanField;

  bondAmount:
    OfferScannerNumberField;

  bondDurationMonths:
    OfferScannerNumberField;

  variablePayDiscretionary:
    OfferScannerBooleanField;

  equitySubjectToBoardApproval:
    OfferScannerBooleanField;

  equityForfeitureOnLeaving:
    OfferScannerBooleanField;

  postTerminationExerciseWindowMentioned:
    OfferScannerBooleanField;

  notes:
    OfferScannerField<string[]>;
};

/* ============================================================
   DOCUMENT METADATA
============================================================ */

export type OfferScannerDocumentMetadata = {
  documentId: string;

  fileName: string;

  fileType: OfferScannerFileType;

  documentType: OfferScannerDocumentType;

  pageCount?: number;

  detectedLanguage?: string;

  currency:
    OfferScannerCurrency;

  scannedAt:
    string;
};

/* ============================================================
   MISSING FIELD SEVERITY
============================================================ */

export type OfferScannerIssueSeverity =
  | "INFO"
  | "WARNING"
  | "BLOCKING";

/* ============================================================
   VALIDATION ISSUE CODE
============================================================ */

export type OfferScannerIssueCode =
  | "MISSING_COMPANY_NAME"
  | "MISSING_ROLE_TITLE"

  | "MISSING_FIXED_SALARY"
  | "MISSING_HEADLINE_CTC"
  | "CTC_COMPONENT_MISMATCH"

  | "UNKNOWN_EQUITY_TYPE"
  | "MISSING_EQUITY_QUANTITY"
  | "MISSING_EXERCISE_PRICE"
  | "MISSING_FMV"
  | "MISSING_LISTED_SHARE_PRICE"
  | "MISSING_VESTING_DURATION"
  | "MISSING_CLIFF"

  | "HEADLINE_EQUITY_VALUE_ONLY"
  | "UNRELIABLE_EQUITY_VALUE_BASIS"

  | "VARIABLE_PAY_AMBIGUOUS"
  | "JOINING_BONUS_CLAWBACK_UNKNOWN"

  | "POST_TERMINATION_WINDOW_UNKNOWN"

  | "LOW_CONFIDENCE_FIELD"
  | "UNREVIEWED_CRITICAL_FIELD"

  | "SUSPICIOUS_PERCENTAGE"
  | "SUSPICIOUS_MONETARY_VALUE"

  | "CURRENCY_UNKNOWN"
  | "OTHER";

/* ============================================================
   VALIDATION ISSUE
============================================================ */

export type OfferScannerIssue = {
  code: OfferScannerIssueCode;

  severity: OfferScannerIssueSeverity;

  field?: string;

  title: string;

  message: string;

  recommendation?: string;
};

/* ============================================================
   FIELD COMPLETENESS
============================================================ */

export type OfferScannerCompleteness = {
  totalFields: number;

  populatedFields: number;

  confirmedFields: number;

  editedFields: number;

  missingFields: number;

  highConfidenceFields: number;

  mediumConfidenceFields: number;

  lowConfidenceFields: number;

  completionPercentage: number;

  confirmationPercentage: number;
};

/* ============================================================
   EQUITY MODEL READINESS

   READY:
   sufficient confirmed data for meaningful equity modeling

   PARTIAL:
   some modeling possible but important limitations remain

   NOT_READY:
   reliable modeling should not proceed
============================================================ */

export type OfferScannerEquityReadiness =
  | "READY"
  | "PARTIAL"
  | "NOT_READY"
  | "NOT_APPLICABLE";

/* ============================================================
   OFFER MODEL READINESS
============================================================ */

export type OfferScannerModelReadiness =
  | "READY"
  | "REVIEW_REQUIRED"
  | "BLOCKED";

/* ============================================================
   SCANNER READINESS SUMMARY
============================================================ */

export type OfferScannerReadiness = {
  modelReadiness:
    OfferScannerModelReadiness;

  equityReadiness:
    OfferScannerEquityReadiness;

  canCreateOffer:
    boolean;

  canRunComparison:
    boolean;

  canModelEquity:
    boolean;

  blockingIssueCount:
    number;

  warningCount:
    number;

  explanation:
    string;
};

/* ============================================================
   COMPLETE EXTRACTED OFFER

   This is the central scanner object.

   IMPORTANT:
   This is NOT OfferInput.

   It remains scanner/review data until confirmation.
============================================================ */

export type ScannedOfferLetter = {
  scanId: string;

  metadata:
    OfferScannerDocumentMetadata;

  employer:
    OfferScannerEmployerFields;

  cash:
    OfferScannerCashFields;

  equity:
    OfferScannerEquityFields;

  benefits:
    OfferScannerBenefitFields;

  specialConditions:
    OfferScannerSpecialConditions;

  completeness:
    OfferScannerCompleteness;

  readiness:
    OfferScannerReadiness;

  issues:
    OfferScannerIssue[];

  scannerSummary?: string;

  rawTextAvailable:
    boolean;

  createdAt:
    string;

  updatedAt:
    string;
};

/* ============================================================
   SCANNER API REQUEST / RESPONSE
============================================================ */

export type OfferScannerRequest = {
  fileName: string;

  mimeType?: string;

  documentTypeHint?:
    OfferScannerDocumentType;

  currencyHint?:
    OfferScannerCurrency;
};

export type OfferScannerSuccessResponse = {
  success: true;

  scan:
    ScannedOfferLetter;
};

export type OfferScannerErrorResponse = {
  success: false;

  message: string;

  code?:
    string;
};

export type OfferScannerResponse =
  | OfferScannerSuccessResponse
  | OfferScannerErrorResponse;

/* ============================================================
   USER REVIEW UPDATE

   Used by Review & Confirm UI.

   Example:

   {
     path: "cash.fixedSalary",
     value: 2400000,
     reviewStatus: "CONFIRMED"
   }
============================================================ */

export type OfferScannerFieldUpdate = {
  path: string;

  value:
    | string
    | number
    | boolean
    | string[]
    | null;

  reviewStatus:
    Extract<
      OfferScannerReviewStatus,
      "CONFIRMED" | "EDITED" | "REJECTED"
    >;
};

/* ============================================================
   CONFIRMATION STATE
============================================================ */

export type OfferScannerConfirmationState = {
  scanId: string;

  allCriticalFieldsReviewed:
    boolean;

  userConfirmed:
    boolean;

  confirmedAt?:
    string;

  confirmedByUserId?:
    string;
};

/* ============================================================
   EMPTY FIELD FACTORIES

   These keep scanner-normalize.ts and API code consistent.
============================================================ */

export function createEmptyScannerField<T>():
  OfferScannerField<T> {
  return {
    value: null,

    rawValue: null,

    confidence:
      "UNKNOWN",

    reviewStatus:
      "UNREVIEWED",

    evidence: [],

    notes: [],

    inferred:
      false,
  };
}

export function createMissingScannerField<T>():
  OfferScannerField<T> {
  return {
    value: null,

    rawValue: null,

    confidence:
      "UNKNOWN",

    reviewStatus:
      "MISSING",

    evidence: [],

    notes: [],

    inferred:
      false,
  };
}

/* ============================================================
   POPULATED FIELD FACTORY

   Useful later for AI extraction adapters.

   The scanner still leaves it UNREVIEWED.
============================================================ */

export function createExtractedScannerField<T>(
  value: T,
  options?: {
    rawValue?: string | null;

    confidence?:
      OfferScannerConfidence;

    evidence?:
      OfferScannerSource[];

    notes?:
      string[];

    inferred?:
      boolean;
  }
): OfferScannerField<T> {
  return {
    value,

    rawValue:
      options?.rawValue ??
      null,

    confidence:
      options?.confidence ??
      "UNKNOWN",

    reviewStatus:
      "UNREVIEWED",

    evidence:
      options?.evidence ??
      [],

    notes:
      options?.notes ??
      [],

    inferred:
      options?.inferred ??
      false,
  };
}

/* ============================================================
   CONFIRMED FIELD FACTORY

   Primarily useful for manual entry / tests.
============================================================ */

export function createConfirmedScannerField<T>(
  value: T,
  options?: {
    rawValue?: string | null;

    confidence?:
      OfferScannerConfidence;

    evidence?:
      OfferScannerSource[];

    notes?:
      string[];
  }
): OfferScannerField<T> {
  return {
    value,

    rawValue:
      options?.rawValue ??
      null,

    confidence:
      options?.confidence ??
      "HIGH",

    reviewStatus:
      "CONFIRMED",

    evidence:
      options?.evidence ??
      [],

    notes:
      options?.notes ??
      [],

    inferred:
      false,
  };
}

/* ============================================================
   TYPE GUARDS
============================================================ */

export function isReviewedScannerField<T>(
  field: OfferScannerField<T>
): boolean {
  return (
    field.reviewStatus ===
      "CONFIRMED" ||
    field.reviewStatus ===
      "EDITED" ||
    field.reviewStatus ===
      "REJECTED"
  );
}

export function isAcceptedScannerField<T>(
  field: OfferScannerField<T>
): boolean {
  return (
    field.reviewStatus ===
      "CONFIRMED" ||
    field.reviewStatus ===
      "EDITED"
  );
}

export function hasScannerFieldValue<T>(
  field: OfferScannerField<T>
): boolean {
  return (
    field.value !== null &&
    field.value !== undefined
  );
}

/* ============================================================
   CRITICAL REVIEW PATHS

   scanner-validation.ts will use this list.

   Not every offer needs every field.

   These are the globally important review paths.
   Equity-specific requirements are determined dynamically.
============================================================ */

export const OFFER_SCANNER_CRITICAL_PATHS =
  [
    "employer.companyName",

    "employer.roleTitle",

    "cash.fixedSalary",

    "cash.targetVariablePay",

    "cash.joiningBonus",

    "equity.type",
  ] as const;

export type OfferScannerCriticalPath =
  (typeof OFFER_SCANNER_CRITICAL_PATHS)[number];

/* ============================================================
   EQUITY-SPECIFIC REVIEW PATHS
============================================================ */

export const OFFER_SCANNER_EQUITY_PATHS =
  [
    "equity.companyStatus",

    "equity.totalOptionsOrShares",

    "equity.exercisePrice",

    "equity.currentFMV",

    "equity.listedSharePrice",

    "equity.vestingDurationMonths",

    "equity.cliffMonths",

    "equity.vestingFrequency",

    "equity.expectedDilutionPercentage",
  ] as const;

/* ============================================================
   DISPLAY LABELS

   Used later by Review & Confirm UI.
============================================================ */

export const OFFER_SCANNER_FIELD_LABELS:
  Record<string, string> = {
  "employer.companyName":
    "Company name",

  "employer.roleTitle":
    "Role / designation",

  "employer.department":
    "Department",

  "employer.location":
    "Work location",

  "employer.employmentType":
    "Employment type",

  "employer.workMode":
    "Work mode",

  "employer.joiningDate":
    "Joining date",

  "employer.probationMonths":
    "Probation period",

  "employer.noticePeriodDays":
    "Notice period",

  "cash.headlineCTC":
    "Headline CTC",

  "cash.fixedSalary":
    "Fixed salary",

  "cash.basicSalary":
    "Basic salary",

  "cash.hra":
    "HRA",

  "cash.specialAllowance":
    "Special allowance",

  "cash.otherFixedAllowance":
    "Other fixed allowance",

  "cash.targetVariablePay":
    "Target variable pay",

  "cash.maximumVariablePay":
    "Maximum variable pay",

  "cash.joiningBonus":
    "Joining bonus",

  "cash.retentionBonus":
    "Retention bonus",

  "cash.relocationBonus":
    "Relocation bonus",

  "cash.performanceBonus":
    "Performance bonus",

  "cash.employerPF":
    "Employer PF",

  "cash.gratuity":
    "Gratuity",

  "cash.insuranceValue":
    "Insurance value",

  "cash.otherEmployerBenefits":
    "Other employer benefits",

  "equity.type":
    "Equity type",

  "equity.companyStatus":
    "Company status",

  "equity.employerHeadlineEquityValue":
    "Employer-stated equity value",

  "equity.totalOptionsOrShares":
    "Options / shares granted",

  "equity.exercisePrice":
    "Exercise / strike price",

  "equity.currentFMV":
    "Current FMV",

  "equity.listedSharePrice":
    "Listed share price",

  "equity.companyValuation":
    "Company valuation",

  "equity.totalCompanyShares":
    "Total company shares",

  "equity.ownershipPercentage":
    "Ownership percentage",

  "equity.vestingDurationMonths":
    "Vesting duration",

  "equity.cliffMonths":
    "Cliff",

  "equity.vestingFrequency":
    "Vesting frequency",

  "equity.vestingStartDate":
    "Vesting start date",

  "equity.grantDate":
    "Grant date",

  "equity.expiryDate":
    "Grant expiry date",

  "equity.postTerminationExerciseDays":
    "Post-termination exercise window",

  "equity.expectedDilutionPercentage":
    "Expected dilution",

  "specialConditions.joiningBonusClawback":
    "Joining-bonus clawback",

  "specialConditions.joiningBonusClawbackMonths":
    "Joining-bonus clawback period",

  "specialConditions.variablePayDiscretionary":
    "Variable pay discretionary",

  "specialConditions.equitySubjectToBoardApproval":
    "Equity subject to board approval",

  "specialConditions.equityForfeitureOnLeaving":
    "Equity forfeiture on leaving",

  "specialConditions.postTerminationExerciseWindowMentioned":
    "Post-termination exercise window mentioned",
};
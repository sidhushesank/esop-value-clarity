/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   CORE TYPES

   This file defines the shared contracts used by:
   - offer-letter extraction
   - manual offer entry
   - compensation normalization
   - equity modeling
   - offer comparison
   - break-even analysis
   - negotiation intelligence

   IMPORTANT:
   This file contains TYPES ONLY.
   No calculations should live here.
============================================================ */

/* ============================================================
   GENERIC TYPES
============================================================ */

export type OfferSide = "A" | "B";

export type OfferInputMode =
  | "MANUAL"
  | "DOCUMENT";

export type OfferDocumentStatus =
  | "NOT_UPLOADED"
  | "UPLOADED"
  | "PROCESSING"
  | "REVIEW_REQUIRED"
  | "CONFIRMED"
  | "FAILED";

export type OfferFieldStatus =
  | "VERIFIED"
  | "REVIEW"
  | "NOT_FOUND"
  | "USER_CONFIRMED";

export type OfferConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "UNKNOWN";

export type OfferCurrency =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "OTHER";

export type OfferEmploymentType =
  | "FULL_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "OTHER";

export type OfferWorkMode =
  | "ONSITE"
  | "HYBRID"
  | "REMOTE"
  | "UNKNOWN";

/* ============================================================
   EQUITY TYPES
============================================================ */

export type OfferEquityType =
  | "NONE"
  | "ESOP"
  | "RSU"
  | "STOCK"
  | "OTHER";

export type OfferCompanyEquityStatus =
  | "LISTED"
  | "UNLISTED"
  | "UNKNOWN";

export type OfferVestingFrequency =
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI_ANNUAL"
  | "ANNUAL"
  | "CUSTOM"
  | "UNKNOWN";

/* ============================================================
   SCENARIO / HORIZON TYPES
============================================================ */

export type OfferScenarioKey =
  | "BEAR"
  | "BASE"
  | "BULL";

export type OfferComparisonHorizon =
  | 12
  | 24
  | 36
  | 48;

/* ============================================================
   RISK TYPES
============================================================ */

export type OfferRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "UNKNOWN";

export type OfferLiquidityLevel =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "UNKNOWN";

export type OfferWinner =
  | "A"
  | "B"
  | "TIE"
  | "UNDETERMINED";

/* ============================================================
   EXTRACTION / REVIEW TYPES
============================================================ */

export type OfferExtractedField<T> = {
  key: string;

  label: string;

  extractedValue: T | null;

  confirmedValue: T | null;

  status: OfferFieldStatus;

  confidence: OfferConfidence;

  sourceText: string | null;

  sourcePage: number | null;

  reviewedAt: string | null;
};

export type OfferDocumentSource = {
  documentId: string | null;

  originalFileName: string | null;

  mimeType: string | null;

  fileSizeBytes: number | null;

  status: OfferDocumentStatus;

  uploadedAt: string | null;

  processedAt: string | null;

  confirmedAt: string | null;
};

/* ============================================================
   EMPLOYER / ROLE
============================================================ */

export type OfferEmployerDetails = {
  companyName: string;

  roleTitle: string;

  location: string;

  employmentType: OfferEmploymentType;

  workMode: OfferWorkMode;

  joiningDate: string | null;
};

/* ============================================================
   CASH COMPENSATION

   All monetary values should represent ANNUAL amounts unless
   the field explicitly says otherwise.
============================================================ */

export type OfferCashCompensation = {
  /* ----------------------------------------------------------
     HEADLINE
  ---------------------------------------------------------- */

  headlineCTC: number;

  /* ----------------------------------------------------------
     RECURRING CASH
  ---------------------------------------------------------- */

  fixedSalary: number;

  basicSalary: number;

  hra: number;

  specialAllowance: number;

  flexibleBenefits: number;

  otherRecurringCash: number;

  /* ----------------------------------------------------------
     VARIABLE
  ---------------------------------------------------------- */

  targetVariablePay: number;

  maximumVariablePay: number;

  targetBonus: number;

  performanceBonus: number;

  otherVariablePay: number;

  /* ----------------------------------------------------------
     ONE-TIME
  ---------------------------------------------------------- */

  joiningBonus: number;

  retentionBonus: number;

  relocationAllowance: number;

  otherOneTimeCash: number;

  /* ----------------------------------------------------------
     EMPLOYER / CTC COMPONENTS
  ---------------------------------------------------------- */

  employerPF: number;

  gratuity: number;

  insuranceValue: number;

  otherBenefitsValue: number;
};

/* ============================================================
   EQUITY COMPENSATION
============================================================ */

export type OfferEquityCompensation = {
  type: OfferEquityType;

  companyStatus: OfferCompanyEquityStatus;

  /* ----------------------------------------------------------
     EMPLOYER HEADLINE VALUE

     Example:
     Employer says "ESOPs worth ₹10 lakh".

     This is NOT automatically treated as economic value.
  ---------------------------------------------------------- */

  employerHeadlineEquityValue: number;

  /* ----------------------------------------------------------
     GRANT QUANTITY
  ---------------------------------------------------------- */

  totalOptionsOrShares: number;

  /* ----------------------------------------------------------
     PRICE INFORMATION
  ---------------------------------------------------------- */

  exercisePrice: number;

  currentFMV: number;

  listedSharePrice: number;

  /* ----------------------------------------------------------
     COMPANY INFORMATION
  ---------------------------------------------------------- */

  companyValuation: number;

  totalCompanyShares: number;

  ownershipPercentage: number;

  /* ----------------------------------------------------------
     VESTING
  ---------------------------------------------------------- */

  vestingStartDate: string | null;

  vestingDurationMonths: number;

  cliffMonths: number;

  vestingFrequency: OfferVestingFrequency;

  /* ----------------------------------------------------------
     EXPIRY / TERMINATION
  ---------------------------------------------------------- */

  expiryDate: string | null;

  postTerminationExerciseDays: number | null;

  /* ----------------------------------------------------------
     DILUTION
  ---------------------------------------------------------- */

  expectedDilutionPercentage: number;

  /* ----------------------------------------------------------
     OPTIONAL USER / MODEL ASSUMPTIONS
  ---------------------------------------------------------- */

  bearEquityMultiplier: number;

  baseEquityMultiplier: number;

  bullEquityMultiplier: number;
};

/* ============================================================
   BENEFITS
============================================================ */

export type OfferBenefits = {
  healthInsuranceValue: number;

  lifeInsuranceValue: number;

  mealBenefitsValue: number;

  transportBenefitsValue: number;

  wellnessBenefitsValue: number;

  learningBudgetValue: number;

  otherBenefitsValue: number;

  notes: string;
};

/* ============================================================
   COMPLETE OFFER INPUT

   This is the normalized object used by the Phase 4 engine.
============================================================ */

export type OfferInput = {
  id: string;

  side: OfferSide;

  inputMode: OfferInputMode;

  currency: OfferCurrency;

  employer: OfferEmployerDetails;

  cash: OfferCashCompensation;

  equity: OfferEquityCompensation;

  benefits: OfferBenefits;

  sourceDocument: OfferDocumentSource | null;

  fields: OfferExtractedField<unknown>[];

  notes: string;

  createdAt: string | null;

  updatedAt: string | null;
};

/* ============================================================
   NORMALIZED CASH RESULT
============================================================ */

export type OfferNormalizedCash = {
  headlineCTC: number;

  guaranteedRecurringCash: number;

  targetVariableCash: number;

  maximumVariableCash: number;

  oneTimeCash: number;

  employerBenefits: number;

  targetAnnualCompensation: number;

  maximumAnnualCompensation: number;

  firstYearTargetCash: number;

  firstYearMaximumCash: number;
};

/* ============================================================
   VESTING RESULT AT A SPECIFIC HORIZON
============================================================ */

export type OfferVestingAtHorizon = {
  horizonMonths: OfferComparisonHorizon;

  totalOptionsOrShares: number;

  vestedOptionsOrShares: number;

  unvestedOptionsOrShares: number;

  vestedPercentage: number;

  cliffReached: boolean;

  fullyVested: boolean;
};

/* ============================================================
   EQUITY SCENARIO RESULT
============================================================ */

export type OfferEquityScenarioResult = {
  scenario: OfferScenarioKey;

  horizonMonths: OfferComparisonHorizon;

  vestedOptionsOrShares: number;

  modeledUnitValue: number;

  grossEquityValue: number;

  exerciseCost: number;

  modeledExerciseTax: number;

  modeledSaleTax: number;

  totalModeledTax: number;

  totalCapitalRequired: number;

  modeledNetEquityValue: number;

  postDilutionNetEquityValue: number;

  liquidity: OfferLiquidityLevel;

  risk: OfferRiskLevel;
};

/* ============================================================
   COMPLETE HORIZON RESULT

   Represents the economics of ONE offer at ONE time horizon.
============================================================ */

export type OfferHorizonResult = {
  horizonMonths: OfferComparisonHorizon;

  years: number;

  /* ----------------------------------------------------------
     CASH
  ---------------------------------------------------------- */

  cumulativeGuaranteedCash: number;

  cumulativeTargetVariableCash: number;

  cumulativeOneTimeCash: number;

  cumulativeBenefits: number;

  cumulativeTargetCashCompensation: number;

  /* ----------------------------------------------------------
     EQUITY
  ---------------------------------------------------------- */

  vesting: OfferVestingAtHorizon;

  bearEquity: OfferEquityScenarioResult;

  baseEquity: OfferEquityScenarioResult;

  bullEquity: OfferEquityScenarioResult;

  /* ----------------------------------------------------------
     TOTAL ECONOMIC VALUE
  ---------------------------------------------------------- */

  bearTotalEconomicValue: number;

  baseTotalEconomicValue: number;

  bullTotalEconomicValue: number;
};

/* ============================================================
   OFFER ANALYSIS RESULT
============================================================ */

export type OfferAnalysisResult = {
  offerId: string;

  side: OfferSide;

  employer: OfferEmployerDetails;

  normalizedCash: OfferNormalizedCash;

  horizons: Record<
    OfferComparisonHorizon,
    OfferHorizonResult
  >;

  liquidity: OfferLiquidityLevel;

  equityRisk: OfferRiskLevel;

  cashCertainty: OfferRiskLevel;

  hasEquity: boolean;

  hasSufficientEquityData: boolean;

  missingEquityFields: string[];

  assumptions: string[];

  warnings: string[];
};

/* ============================================================
   HORIZON COMPARISON
============================================================ */

export type OfferHorizonComparison = {
  horizonMonths: OfferComparisonHorizon;

  scenario: OfferScenarioKey;

  offerAValue: number;

  offerBValue: number;

  difference: number;

  winner: OfferWinner;
};

/* ============================================================
   DECISION MATRIX
============================================================ */

export type OfferDecisionCategory =
  | "GUARANTEED_CASH"
  | "FIRST_YEAR"
  | "TWO_YEAR"
  | "THREE_YEAR"
  | "FOUR_YEAR"
  | "EQUITY_UPSIDE"
  | "LIQUIDITY"
  | "CASH_CERTAINTY"
  | "LOWER_EXERCISE_BURDEN"
  | "LOWER_EQUITY_RISK";

export type OfferDecisionMatrixItem = {
  category: OfferDecisionCategory;

  label: string;

  winner: OfferWinner;

  offerAValue: string;

  offerBValue: string;

  explanation: string;
};

/* ============================================================
   BREAK-EVEN RESULT
============================================================ */

export type OfferBreakEvenResult = {
  found: boolean;

  scenario: OfferScenarioKey;

  breakEvenMonth: number | null;

  leaderBeforeBreakEven: OfferWinner;

  leaderAfterBreakEven: OfferWinner;

  valueAtBreakEvenA: number;

  valueAtBreakEvenB: number;

  explanation: string;
};

/* ============================================================
   NEGOTIATION INTELLIGENCE
============================================================ */

export type OfferNegotiationTarget = {
  weakerOffer: OfferWinner;

  strongerOffer: OfferWinner;

  horizonMonths: OfferComparisonHorizon;

  scenario: OfferScenarioKey;

  economicGap: number;

  /* ----------------------------------------------------------
     POSSIBLE WAYS TO CLOSE THE GAP
  ---------------------------------------------------------- */

  additionalAnnualFixedSalary: number;

  additionalJoiningBonus: number;

  additionalOptionsOrShares: number;

  /* ----------------------------------------------------------
     TARGET LEVELS
  ---------------------------------------------------------- */

  minimumAcceptableFixedSalary: number;

  competitiveFixedSalary: number;

  strongFixedSalary: number;

  minimumAdditionalOptionsOrShares: number;

  competitiveAdditionalOptionsOrShares: number;

  strongAdditionalOptionsOrShares: number;

  explanation: string;

  warnings: string[];
};

/* ============================================================
   COMPLETE OFFER COMPARISON RESULT
============================================================ */

export type OfferComparisonResult = {
  offerA: OfferAnalysisResult;

  offerB: OfferAnalysisResult;

  comparisons: OfferHorizonComparison[];

  decisionMatrix: OfferDecisionMatrixItem[];

  breakEven: OfferBreakEvenResult;

  negotiation: OfferNegotiationTarget | null;

  baseCaseWinner: OfferWinner;

  shortTermWinner: OfferWinner;

  longTermWinner: OfferWinner;

  summary: string;

  assumptions: string[];

  warnings: string[];
};

/* ============================================================
   OFFER INTELLIGENCE STATE

   This will later power the Phase 4 UI.
============================================================ */

export type OfferIntelligenceState = {
  offerA: OfferInput;

  offerB: OfferInput;

  selectedHorizon: OfferComparisonHorizon;

  selectedScenario: OfferScenarioKey;

  comparison: OfferComparisonResult | null;

  lastCalculatedAt: string | null;
};

/* ============================================================
   DEFAULT CONSTANTS
============================================================ */

export const OFFER_COMPARISON_HORIZONS: OfferComparisonHorizon[] =
  [12, 24, 36, 48];

export const OFFER_SCENARIOS: OfferScenarioKey[] =
  ["BEAR", "BASE", "BULL"];

/* ============================================================
   TYPE GUARDS
============================================================ */

export function hasOfferEquity(
  offer: OfferInput
): boolean {
  return (
    offer.equity.type !== "NONE" &&
    offer.equity.totalOptionsOrShares > 0
  );
}

export function isPrivateEquityOffer(
  offer: OfferInput
): boolean {
  return (
    offer.equity.type === "ESOP" &&
    offer.equity.companyStatus === "UNLISTED"
  );
}

export function isListedEquityOffer(
  offer: OfferInput
): boolean {
  return (
    offer.equity.companyStatus === "LISTED"
  );
}
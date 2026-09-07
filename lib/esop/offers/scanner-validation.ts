/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   SCANNER VALIDATION / TRUST GATE

   Responsibilities:
   - validate scanned offer-letter data
   - calculate field completeness
   - identify missing / suspicious fields
   - determine equity-model readiness
   - determine complete-offer readiness
   - prevent unreliable scanner output from entering comparison
   - distinguish warnings from true blockers

   IMPORTANT:
   This file DOES NOT:
   - scan documents
   - call AI
   - mutate scanner values
   - normalize into OfferInput
   - calculate offer economics
   - modify the seven QA-passed Phase 4 engines

   PRODUCT PRINCIPLE:

   EXTRACTED
      ↓
   VALIDATED
      ↓
   USER REVIEWED
      ↓
   CONFIRMED
      ↓
   NORMALIZED
      ↓
   COMPARED

   Scanner confidence alone is NEVER equivalent to confirmation.
============================================================ */

import type {
  OfferScannerCompleteness,
  OfferScannerEquityReadiness,
  OfferScannerField,
  OfferScannerIssue,
  OfferScannerIssueCode,
  OfferScannerIssueSeverity,
  OfferScannerModelReadiness,
  OfferScannerReadiness,
  ScannedOfferLetter,
} from "./scanner-types";

import {
  hasScannerFieldValue,
  isAcceptedScannerField,
  isReviewedScannerField,
} from "./scanner-types";

/* ============================================================
   RESULT TYPE
============================================================ */

export type OfferScannerValidationResult = {
  completeness:
    OfferScannerCompleteness;

  readiness:
    OfferScannerReadiness;

  issues:
    OfferScannerIssue[];

  blockingIssues:
    OfferScannerIssue[];

  warnings:
    OfferScannerIssue[];

  informationalIssues:
    OfferScannerIssue[];

  criticalFieldsReviewed:
    boolean;

  equityCriticalFieldsReviewed:
    boolean;
};

/* ============================================================
   INTERNAL FIELD ENTRY
============================================================ */

type ScannerFieldEntry = {
  path: string;

  field:
    OfferScannerField<unknown>;

  critical:
    boolean;

  equityCritical:
    boolean;
};

/* ============================================================
   SAFE HELPERS
============================================================ */

function safeNumber(
  value: unknown
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : 0;
}

function safePositive(
  value: unknown
): number {
  return Math.max(
    safeNumber(value),
    0
  );
}

function percentage(
  numerator: number,
  denominator: number
): number {
  if (
    denominator <= 0
  ) {
    return 0;
  }

  return Math.min(
    Math.max(
      (numerator / denominator) *
        100,
      0
    ),
    100
  );
}

function uniqueIssues(
  issues:
    OfferScannerIssue[]
): OfferScannerIssue[] {
  const seen =
    new Set<string>();

  return issues.filter(
    (issue) => {
      const key =
        [
          issue.code,
          issue.field ?? "",
          issue.message,
        ].join("|");

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}

/* ============================================================
   ISSUE FACTORY
============================================================ */

function issue(
  code:
    OfferScannerIssueCode,
  severity:
    OfferScannerIssueSeverity,
  title:
    string,
  message:
    string,
  options?: {
    field?: string;

    recommendation?: string;
  }
): OfferScannerIssue {
  return {
    code,

    severity,

    field:
      options?.field,

    title,

    message,

    recommendation:
      options?.recommendation,
  };
}

/* ============================================================
   FIELD COLLECTION

   Explicit collection is intentional.

   We don't recursively walk arbitrary objects because scanner
   metadata / readiness / issues are not reviewable offer fields.
============================================================ */

function collectScannerFields(
  scan:
    ScannedOfferLetter
): ScannerFieldEntry[] {
  const fields:
    ScannerFieldEntry[] =
    [];

  const add = (
    path: string,
    field:
      OfferScannerField<unknown>,
    options?: {
      critical?: boolean;

      equityCritical?: boolean;
    }
  ) => {
    fields.push({
      path,

      field,

      critical:
        options?.critical ??
        false,

      equityCritical:
        options
          ?.equityCritical ??
        false,
    });
  };

  /* ----------------------------------------------------------
     EMPLOYER
  ---------------------------------------------------------- */

  add(
    "employer.companyName",
    scan.employer.companyName,
    {
      critical: true,
    }
  );

  add(
    "employer.roleTitle",
    scan.employer.roleTitle,
    {
      critical: true,
    }
  );

  add(
    "employer.department",
    scan.employer.department
  );

  add(
    "employer.location",
    scan.employer.location
  );

  add(
    "employer.employmentType",
    scan.employer
      .employmentType
  );

  add(
    "employer.workMode",
    scan.employer.workMode
  );

  add(
    "employer.joiningDate",
    scan.employer.joiningDate
  );

  add(
    "employer.probationMonths",
    scan.employer
      .probationMonths
  );

  add(
    "employer.noticePeriodDays",
    scan.employer
      .noticePeriodDays
  );

  /* ----------------------------------------------------------
     CASH
  ---------------------------------------------------------- */

  add(
    "cash.headlineCTC",
    scan.cash.headlineCTC
  );

  add(
    "cash.fixedSalary",
    scan.cash.fixedSalary,
    {
      critical: true,
    }
  );

  add(
    "cash.basicSalary",
    scan.cash.basicSalary
  );

  add(
    "cash.hra",
    scan.cash.hra
  );

  add(
    "cash.specialAllowance",
    scan.cash.specialAllowance
  );

  add(
    "cash.otherFixedAllowance",
    scan.cash
      .otherFixedAllowance
  );

  add(
    "cash.targetVariablePay",
    scan.cash.targetVariablePay
  );

  add(
    "cash.maximumVariablePay",
    scan.cash
      .maximumVariablePay
  );

  add(
    "cash.joiningBonus",
    scan.cash.joiningBonus
  );

  add(
    "cash.retentionBonus",
    scan.cash.retentionBonus
  );

  add(
    "cash.relocationBonus",
    scan.cash.relocationBonus
  );

  add(
    "cash.performanceBonus",
    scan.cash.performanceBonus
  );

  add(
    "cash.employerPF",
    scan.cash.employerPF
  );

  add(
    "cash.gratuity",
    scan.cash.gratuity
  );

  add(
    "cash.insuranceValue",
    scan.cash.insuranceValue
  );

  add(
    "cash.otherEmployerBenefits",
    scan.cash
      .otherEmployerBenefits
  );

  /* ----------------------------------------------------------
     EQUITY
  ---------------------------------------------------------- */

  add(
    "equity.type",
    scan.equity.type,
    {
      critical: true,
      equityCritical: true,
    }
  );

  add(
    "equity.companyStatus",
    scan.equity.companyStatus,
    {
      equityCritical: true,
    }
  );

  add(
    "equity.employerHeadlineEquityValue",
    scan.equity
      .employerHeadlineEquityValue
  );

  add(
    "equity.totalOptionsOrShares",
    scan.equity
      .totalOptionsOrShares,
    {
      equityCritical: true,
    }
  );

  add(
    "equity.exercisePrice",
    scan.equity.exercisePrice,
    {
      equityCritical: true,
    }
  );

  add(
    "equity.currentFMV",
    scan.equity.currentFMV,
    {
      equityCritical: true,
    }
  );

  add(
    "equity.listedSharePrice",
    scan.equity
      .listedSharePrice,
    {
      equityCritical: true,
    }
  );

  add(
    "equity.companyValuation",
    scan.equity
      .companyValuation
  );

  add(
    "equity.totalCompanyShares",
    scan.equity
      .totalCompanyShares
  );

  add(
    "equity.ownershipPercentage",
    scan.equity
      .ownershipPercentage
  );

  add(
    "equity.vestingDurationMonths",
    scan.equity
      .vestingDurationMonths,
    {
      equityCritical: true,
    }
  );

  add(
    "equity.cliffMonths",
    scan.equity.cliffMonths,
    {
      equityCritical: true,
    }
  );

  add(
    "equity.vestingFrequency",
    scan.equity
      .vestingFrequency,
    {
      equityCritical: true,
    }
  );

  add(
    "equity.vestingStartDate",
    scan.equity
      .vestingStartDate
  );

  add(
    "equity.grantDate",
    scan.equity.grantDate
  );

  add(
    "equity.expiryDate",
    scan.equity.expiryDate
  );

  add(
    "equity.postTerminationExerciseDays",
    scan.equity
      .postTerminationExerciseDays
  );

  add(
    "equity.expectedDilutionPercentage",
    scan.equity
      .expectedDilutionPercentage
  );

  /* ----------------------------------------------------------
     BENEFITS
  ---------------------------------------------------------- */

  add(
    "benefits.healthInsuranceValue",
    scan.benefits
      .healthInsuranceValue
  );

  add(
    "benefits.lifeInsuranceValue",
    scan.benefits
      .lifeInsuranceValue
  );

  add(
    "benefits.learningBudgetValue",
    scan.benefits
      .learningBudgetValue
  );

  add(
    "benefits.mealBenefitValue",
    scan.benefits
      .mealBenefitValue
  );

  add(
    "benefits.transportBenefitValue",
    scan.benefits
      .transportBenefitValue
  );

  add(
    "benefits.internetBenefitValue",
    scan.benefits
      .internetBenefitValue
  );

  add(
    "benefits.wellnessBenefitValue",
    scan.benefits
      .wellnessBenefitValue
  );

  add(
    "benefits.otherAnnualBenefitValue",
    scan.benefits
      .otherAnnualBenefitValue
  );

  /* ----------------------------------------------------------
     SPECIAL CONDITIONS
  ---------------------------------------------------------- */

  add(
    "specialConditions.joiningBonusClawback",
    scan.specialConditions
      .joiningBonusClawback
  );

  add(
    "specialConditions.joiningBonusClawbackMonths",
    scan.specialConditions
      .joiningBonusClawbackMonths
  );

  add(
    "specialConditions.retentionBonusClawback",
    scan.specialConditions
      .retentionBonusClawback
  );

  add(
    "specialConditions.nonCompeteMentioned",
    scan.specialConditions
      .nonCompeteMentioned
  );

  add(
    "specialConditions.bondMentioned",
    scan.specialConditions
      .bondMentioned
  );

  add(
    "specialConditions.bondAmount",
    scan.specialConditions
      .bondAmount
  );

  add(
    "specialConditions.bondDurationMonths",
    scan.specialConditions
      .bondDurationMonths
  );

  add(
    "specialConditions.variablePayDiscretionary",
    scan.specialConditions
      .variablePayDiscretionary
  );

  add(
    "specialConditions.equitySubjectToBoardApproval",
    scan.specialConditions
      .equitySubjectToBoardApproval
  );

  add(
    "specialConditions.equityForfeitureOnLeaving",
    scan.specialConditions
      .equityForfeitureOnLeaving
  );

  add(
    "specialConditions.postTerminationExerciseWindowMentioned",
    scan.specialConditions
      .postTerminationExerciseWindowMentioned
  );

  add(
    "specialConditions.notes",
    scan.specialConditions.notes
  );

  return fields;
}

/* ============================================================
   DETERMINISTIC HARD FILTERS

   A clean extraction should not require the user to retype every
   value. These filters auto-confirm only values that satisfy all
   of the following:

   - a supported value is present
   - the parser marked it HIGH confidence, or MEDIUM confidence
     with explicit non-inferred evidence
   - inferred company status is accepted only as a bounded enum
     (LISTED / UNLISTED) because the parser has already matched
     a strong legal/status term
   - the value passes basic type/range checks

   Medium/low-confidence values, inferred values, and missing
   values remain visible for review. This preserves the trust
   boundary without turning optional missing fields into manual
   data-entry work.
============================================================ */

function passesHardFilter(
  entry: ScannerFieldEntry
): boolean {
  const field = entry.field;

  if (
    field.reviewStatus !== "UNREVIEWED" ||
    !hasScannerFieldValue(field) ||
    (field.confidence !== "HIGH" && field.confidence !== "MEDIUM")
  ) {
    return false;
  }

  const boundedInferredStatus =
    entry.path === "equity.companyStatus" &&
    field.inferred === true &&
    (field.value === "LISTED" || field.value === "UNLISTED") &&
    Boolean(field.rawValue);

  if (field.inferred === true && !boundedInferredStatus) {
    return false;
  }

  if (
    field.confidence === "MEDIUM" &&
    !boundedInferredStatus &&
    !field.rawValue &&
    field.evidence.length === 0
  ) {
    return false;
  }

  const value = field.value;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      return false;
    }

    if (
      entry.path.toLowerCase().includes("percentage") &&
      value > 100
    ) {
      return false;
    }

    return true;
  }

  if (typeof value === "string") {
    if (!value.trim()) {
      return false;
    }

    if (
      entry.path === "equity.type" &&
      value === "UNKNOWN"
    ) {
      return false;
    }

    return Boolean(field.rawValue || field.evidence.length > 0);
  }

  if (typeof value === "boolean") {
    return Boolean(field.rawValue || field.evidence.length > 0);
  }

  return false;
}

function updateScannerField(
  scan: ScannedOfferLetter,
  path: string,
  updater: (
    field: OfferScannerField<unknown>
  ) => OfferScannerField<unknown>
): ScannedOfferLetter {
  const [section, fieldName] = path.split(".");

  if (!section || !fieldName) {
    return scan;
  }

  const sectionValue = scan[section as keyof ScannedOfferLetter];

  if (!sectionValue || typeof sectionValue !== "object") {
    return scan;
  }

  const currentField =
    (sectionValue as Record<string, unknown>)[fieldName];

  if (!currentField || typeof currentField !== "object") {
    return scan;
  }

  return {
    ...scan,
    [section]: {
      ...(sectionValue as Record<string, unknown>),
      [fieldName]: updater(
        currentField as OfferScannerField<unknown>
      ),
    },
  } as ScannedOfferLetter;
}

export function applyScannerHardFilters(
  scan: ScannedOfferLetter
): ScannedOfferLetter {
  let next = scan;

  for (const entry of collectScannerFields(scan)) {
    if (!passesHardFilter(entry)) {
      continue;
    }

    next = updateScannerField(next, entry.path, (field) => ({
      ...field,
      reviewStatus: "CONFIRMED",
      notes: [
        ...(field.notes ?? []),
        "Automatically confirmed by deterministic scanner hard filters: explicit high-confidence value passed validation.",
      ],
    }));
  }

  return next;
}

/* ============================================================
   COMPLETENESS
============================================================ */

export function calculateScannerCompleteness(
  scan:
    ScannedOfferLetter
): OfferScannerCompleteness {
  const entries =
    collectScannerFields(
      scan
    );

  const totalFields =
    entries.length;

  let populatedFields =
    0;

  let confirmedFields =
    0;

  let editedFields =
    0;

  let missingFields =
    0;

  let highConfidenceFields =
    0;

  let mediumConfidenceFields =
    0;

  let lowConfidenceFields =
    0;

  for (
    const entry of
    entries
  ) {
    const field =
      entry.field;

    if (
      hasScannerFieldValue(
        field
      )
    ) {
      populatedFields += 1;
    } else {
      missingFields += 1;
    }

    if (
      field.reviewStatus ===
      "CONFIRMED"
    ) {
      confirmedFields += 1;
    }

    if (
      field.reviewStatus ===
      "EDITED"
    ) {
      editedFields += 1;
    }

    if (
      field.confidence ===
        "HIGH" &&
      hasScannerFieldValue(
        field
      )
    ) {
      highConfidenceFields +=
        1;
    }

    if (
      field.confidence ===
        "MEDIUM" &&
      hasScannerFieldValue(
        field
      )
    ) {
      mediumConfidenceFields +=
        1;
    }

    if (
      field.confidence ===
        "LOW" &&
      hasScannerFieldValue(
        field
      )
    ) {
      lowConfidenceFields +=
        1;
    }
  }

  const acceptedCount =
    confirmedFields +
    editedFields;

  return {
    totalFields,

    populatedFields,

    confirmedFields,

    editedFields,

    missingFields,

    highConfidenceFields,

    mediumConfidenceFields,

    lowConfidenceFields,

    completionPercentage:
      percentage(
        populatedFields,
        totalFields
      ),

    confirmationPercentage:
      percentage(
        acceptedCount,
        totalFields
      ),
  };
}

/* ============================================================
   CRITICAL REVIEW CHECK
============================================================ */

function areCriticalFieldsReviewed(
  scan:
    ScannedOfferLetter
): boolean {
  return collectScannerFields(
    scan
  )
    .filter(
      (entry) => {
        if (!entry.critical) {
          return false;
        }

        /*
         * A document which is silent about equity can still be
         * saved for cash comparison. UNKNOWN is not equivalent to
         * NONE, but it is not a reason to block confirmed cash.
         */
        return !(
          entry.path === "equity.type" &&
          entry.field.value === "UNKNOWN"
        );
      }
    )
    .every(
      (entry) =>
        isReviewedScannerField(
          entry.field
        )
    );
}

/* ============================================================
   LOW CONFIDENCE / UNREVIEWED ISSUES
============================================================ */

function buildReviewIssues(
  scan:
    ScannedOfferLetter
): OfferScannerIssue[] {
  const issues:
    OfferScannerIssue[] =
    [];

  for (
    const entry of
    collectScannerFields(
      scan
    )
  ) {
    const field =
      entry.field;

    if (
      !hasScannerFieldValue(
        field
      )
    ) {
      continue;
    }

    if (
      field.confidence ===
        "LOW" &&
      !isAcceptedScannerField(
        field
      )
    ) {
      issues.push(
        issue(
          "LOW_CONFIDENCE_FIELD",
          entry.critical
            ? "WARNING"
            : "INFO",
          "Low-confidence extraction",
          `${entry.path} was extracted with low confidence and should be reviewed.`,
          {
            field:
              entry.path,

            recommendation:
              "Compare the extracted value with the source offer letter before confirming it.",
          }
        )
      );
    }

    if (
      entry.critical &&
      field.reviewStatus ===
        "UNREVIEWED"
    ) {
      issues.push(
        issue(
          "UNREVIEWED_CRITICAL_FIELD",
          "WARNING",
          "Critical field needs review",
          `${entry.path} has not yet been confirmed by the user.`,
          {
            field:
              entry.path,

            recommendation:
              "Confirm, edit or reject this value before creating the final offer model.",
          }
        )
      );
    }
  }

  return issues;
}

/* ============================================================
   EMPLOYER VALIDATION
============================================================ */

function validateEmployer(
  scan:
    ScannedOfferLetter
): OfferScannerIssue[] {
  const issues:
    OfferScannerIssue[] =
    [];

  if (
    !hasScannerFieldValue(
      scan.employer.companyName
    ) ||
    !String(
      scan.employer
        .companyName.value ??
        ""
    ).trim()
  ) {
    issues.push(
      issue(
        "MISSING_COMPANY_NAME",
        "BLOCKING",
        "Company name missing",
        "The scanner could not identify the employer name.",
        {
          field:
            "employer.companyName",

          recommendation:
            "Enter the employer name before creating this offer.",
        }
      )
    );
  }

  if (
    !hasScannerFieldValue(
      scan.employer.roleTitle
    ) ||
    !String(
      scan.employer
        .roleTitle.value ??
        ""
    ).trim()
  ) {
    issues.push(
      issue(
        "MISSING_ROLE_TITLE",
        "WARNING",
        "Role title missing",
        "The scanner could not identify the role or designation.",
        {
          field:
            "employer.roleTitle",

          recommendation:
            "Confirm the role title from the offer letter.",
        }
      )
    );
  }

  return issues;
}

/* ============================================================
   CASH VALIDATION
============================================================ */

function validateCash(
  scan:
    ScannedOfferLetter
): OfferScannerIssue[] {
  const issues:
    OfferScannerIssue[] =
    [];

  const headlineCTC =
    safePositive(
      scan.cash
        .headlineCTC.value
    );

  const fixedSalary =
    safePositive(
      scan.cash
        .fixedSalary.value
    );

  const basicSalary =
    safePositive(
      scan.cash
        .basicSalary.value
    );

  const hra =
    safePositive(
      scan.cash.hra.value
    );

  const specialAllowance =
    safePositive(
      scan.cash
        .specialAllowance.value
    );

  const otherFixedAllowance =
    safePositive(
      scan.cash
        .otherFixedAllowance
        .value
    );

  const targetVariable =
    safePositive(
      scan.cash
        .targetVariablePay
        .value
    );

  const maximumVariable =
    safePositive(
      scan.cash
        .maximumVariablePay
        .value
    );

  if (
    headlineCTC <= 0
  ) {
    issues.push(
      issue(
        "MISSING_HEADLINE_CTC",
        fixedSalary > 0
          ? "INFO"
          : "WARNING",
        "Headline CTC not found",
        "The offer letter does not provide a usable headline CTC value.",
        {
          field:
            "cash.headlineCTC",

          recommendation:
            "This is not necessarily a blocker if fixed compensation is clearly available.",
        }
      )
    );
  }

  if (
    fixedSalary <= 0
  ) {
    issues.push(
      issue(
        "MISSING_FIXED_SALARY",
        "BLOCKING",
        "Fixed salary missing",
        "Guaranteed recurring compensation cannot be reliably compared without a fixed-salary value.",
        {
          field:
            "cash.fixedSalary",

          recommendation:
            "Confirm the annual fixed or guaranteed compensation from the offer letter.",
        }
      )
    );
  }

  const fixedComponents =
    basicSalary +
    hra +
    specialAllowance +
    otherFixedAllowance;

  if (
    fixedSalary > 0 &&
    fixedComponents >
      fixedSalary * 1.05
  ) {
    issues.push(
      issue(
        "CTC_COMPONENT_MISMATCH",
        "WARNING",
        "Fixed-pay components exceed fixed salary",
        "The extracted Basic, HRA and allowance components add up to more than the stated fixed salary.",
        {
          field:
            "cash.fixedSalary",

          recommendation:
            "Review whether one of the extracted components is already included elsewhere or was read from the wrong compensation column.",
        }
      )
    );
  }

  if (
    targetVariable > 0 &&
    maximumVariable > 0 &&
    maximumVariable <
      targetVariable
  ) {
    issues.push(
      issue(
        "VARIABLE_PAY_AMBIGUOUS",
        "WARNING",
        "Variable-pay values look inconsistent",
        "Maximum variable pay is lower than target variable pay.",
        {
          field:
            "cash.maximumVariablePay",

          recommendation:
            "Review the target and maximum variable compensation values.",
        }
      )
    );
  }

  if (
    fixedSalary > 0 &&
    targetVariable >
      fixedSalary
  ) {
    issues.push(
      issue(
        "VARIABLE_PAY_AMBIGUOUS",
        "WARNING",
        "Variable pay is unusually high",
        "Extracted target variable compensation exceeds fixed salary.",
        {
          field:
            "cash.targetVariablePay",

          recommendation:
            "Verify whether the scanner captured annual variable compensation or another CTC figure.",
        }
      )
    );
  }

  const moneyFields: Array<{
    path: string;

    value: number | null;
  }> = [
    {
      path:
        "cash.headlineCTC",

      value:
        scan.cash
          .headlineCTC.value,
    },

    {
      path:
        "cash.fixedSalary",

      value:
        scan.cash
          .fixedSalary.value,
    },

    {
      path:
        "cash.basicSalary",

      value:
        scan.cash
          .basicSalary.value,
    },

    {
      path:
        "cash.targetVariablePay",

      value:
        scan.cash
          .targetVariablePay
          .value,
    },

    {
      path:
        "cash.joiningBonus",

      value:
        scan.cash
          .joiningBonus.value,
    },
  ];

  for (
    const moneyField of
    moneyFields
  ) {
    if (
      moneyField.value !==
        null &&
      (
        !Number.isFinite(
          moneyField.value
        ) ||
        moneyField.value < 0
      )
    ) {
      issues.push(
        issue(
          "SUSPICIOUS_MONETARY_VALUE",
          "WARNING",
          "Suspicious monetary value",
          `${moneyField.path} contains an invalid or negative monetary value.`,
          {
            field:
              moneyField.path,

            recommendation:
              "Review the extracted compensation value.",
          }
        )
      );
    }
  }

  return issues;
}

/* ============================================================
   EQUITY PRESENCE
============================================================ */

function scannerHasEquity(
  scan:
    ScannedOfferLetter
): boolean {
  const type =
    scan.equity.type.value;

  if (
    type === "NONE"
  ) {
    return false;
  }

  if (
    type === "ESOP" ||
    type === "RSU" ||
    type === "STOCK"
  ) {
    return true;
  }

  return (
    safePositive(
      scan.equity
        .totalOptionsOrShares
        .value
    ) > 0 ||
    safePositive(
      scan.equity
        .employerHeadlineEquityValue
        .value
    ) > 0
  );
}

/* ============================================================
   EQUITY VALIDATION
============================================================ */

function validateEquity(
  scan:
    ScannedOfferLetter
): {
  issues:
    OfferScannerIssue[];

  readiness:
    OfferScannerEquityReadiness;

  criticalReviewed:
    boolean;
} {
  const issues:
    OfferScannerIssue[] =
    [];

  const hasEquity =
    scannerHasEquity(
      scan
    );

  if (
    !hasEquity
  ) {
    return {
      issues,

      readiness:
        "NOT_APPLICABLE",

      criticalReviewed:
        true,
    };
  }

  const type =
    scan.equity.type.value;

  const companyStatus =
    scan.equity
      .companyStatus.value;

  const quantity =
    safePositive(
      scan.equity
        .totalOptionsOrShares
        .value
    );

  const exercisePrice =
    safePositive(
      scan.equity
        .exercisePrice.value
    );

  const currentFMV =
    safePositive(
      scan.equity
        .currentFMV.value
    );

  const listedSharePrice =
    safePositive(
      scan.equity
        .listedSharePrice.value
    );

  const companyValuation =
    safePositive(
      scan.equity
        .companyValuation.value
    );

  const totalCompanyShares =
    safePositive(
      scan.equity
        .totalCompanyShares.value
    );

  const headlineEquity =
    safePositive(
      scan.equity
        .employerHeadlineEquityValue
        .value
    );

  const vestingDuration =
    safePositive(
      scan.equity
        .vestingDurationMonths
        .value
    );

  const cliff =
    safePositive(
      scan.equity
        .cliffMonths.value
    );

  const dilution =
    scan.equity
      .expectedDilutionPercentage
      .value;

  if (
    !type ||
    type === "UNKNOWN"
  ) {
    issues.push(
      issue(
        "UNKNOWN_EQUITY_TYPE",
        "BLOCKING",
        "Equity type is unclear",
        "The scanner detected equity-related terms but could not reliably determine whether the grant is ESOP, RSU or stock.",
        {
          field:
            "equity.type",

          recommendation:
            "Confirm the equity instrument before modeling the offer.",
        }
      )
    );
  }

  if (
    quantity <= 0
  ) {
    issues.push(
      issue(
        "MISSING_EQUITY_QUANTITY",
        "BLOCKING",
        "Equity quantity missing",
        "The offer appears to contain equity, but the number of options or shares was not identified.",
        {
          field:
            "equity.totalOptionsOrShares",

          recommendation:
            "Find the actual option/share quantity in the offer or equity grant documentation.",
        }
      )
    );
  }

  if (
    type === "ESOP" &&
    (
      !hasScannerFieldValue(
        scan.equity
          .exercisePrice
      ) ||
      scan.equity
        .exercisePrice.value ===
        null
    )
  ) {
    issues.push(
      issue(
        "MISSING_EXERCISE_PRICE",
        "BLOCKING",
        "Exercise price missing",
        "The ESOP grant cannot be economically modeled reliably without the exercise or strike price.",
        {
          field:
            "equity.exercisePrice",

          recommendation:
            "Confirm the exercise price from the grant letter, ESOP plan or employer.",
        }
      )
    );
  }

  if (
    companyStatus ===
      "LISTED" &&
    listedSharePrice <= 0 &&
    currentFMV <= 0
  ) {
    issues.push(
      issue(
        "MISSING_LISTED_SHARE_PRICE",
        "BLOCKING",
        "Listed equity price missing",
        "The scanner identified listed equity but no usable share-price or FMV basis.",
        {
          field:
            "equity.listedSharePrice",

          recommendation:
            "Confirm the relevant share price or FMV before modeling equity.",
        }
      )
    );
  }

  if (
    companyStatus ===
      "UNLISTED"
  ) {
    const hasFMVBasis =
      currentFMV > 0;

    const hasValuationBasis =
      companyValuation > 0 &&
      totalCompanyShares > 0;

    if (
      !hasFMVBasis &&
      !hasValuationBasis
    ) {
      issues.push(
        issue(
          "MISSING_FMV",
          "BLOCKING",
          "Private-company value basis missing",
          "The private-company grant does not have a usable FMV or company-valuation/share-count basis.",
          {
            field:
              "equity.currentFMV",

            recommendation:
              "Provide current FMV, or both company valuation and total company shares, before relying on modeled equity value.",
          }
        )
      );
    }
  }

  const hasReliableValueBasis =
    (
      companyStatus ===
        "LISTED" &&
      (
        listedSharePrice >
          0 ||
        currentFMV > 0
      )
    ) ||
    (
      companyStatus ===
        "UNLISTED" &&
      (
        currentFMV > 0 ||
        (
          companyValuation >
            0 &&
          totalCompanyShares >
            0
        )
      )
    );

  if (
    headlineEquity > 0 &&
    !hasReliableValueBasis
  ) {
    issues.push(
      issue(
        "HEADLINE_EQUITY_VALUE_ONLY",
        "BLOCKING",
        "Only headline equity value is available",
        "The employer states an equity value, but the underlying grant information is insufficient to verify or model that value.",
        {
          field:
            "equity.employerHeadlineEquityValue",

          recommendation:
            "Do not treat the employer-stated equity amount as equivalent to cash. Confirm quantity, strike/FMV and valuation information.",
        }
      )
    );
  }

  if (
    companyStatus ===
      "UNKNOWN"
  ) {
    issues.push(
      issue(
        "UNRELIABLE_EQUITY_VALUE_BASIS",
        "WARNING",
        "Listed/unlisted status is unknown",
        "The model cannot confidently determine the appropriate liquidity and equity-value basis.",
        {
          field:
            "equity.companyStatus",

          recommendation:
            "Confirm whether the employer's equity is listed or private-company equity.",
        }
      )
    );
  }

  if (
    vestingDuration <= 0
  ) {
    issues.push(
      issue(
        "MISSING_VESTING_DURATION",
        "BLOCKING",
        "Vesting duration missing",
        "The equity grant cannot be compared across 1Y/2Y/3Y/4Y horizons without a vesting duration.",
        {
          field:
            "equity.vestingDurationMonths",

          recommendation:
            "Confirm the total vesting period.",
        }
      )
    );
  }

  /*
   * Cliff = 0 is valid.
   *
   * Therefore we distinguish missing from an explicit zero.
   */

  if (
    !hasScannerFieldValue(
      scan.equity.cliffMonths
    )
  ) {
    issues.push(
      issue(
        "MISSING_CLIFF",
        "WARNING",
        "Cliff information missing",
        "The scanner could not determine whether the equity schedule has a cliff.",
        {
          field:
            "equity.cliffMonths",

          recommendation:
            "Confirm whether there is a cliff and its duration.",
        }
      )
    );
  }

  if (
    vestingDuration > 0 &&
    cliff >
      vestingDuration
  ) {
    issues.push(
      issue(
        "SUSPICIOUS_PERCENTAGE",
        "WARNING",
        "Cliff exceeds vesting duration",
        "The extracted cliff period is longer than the total vesting period.",
        {
          field:
            "equity.cliffMonths",

          recommendation:
            "Review the vesting schedule.",
        }
      )
    );
  }

  if (
    dilution !== null &&
    (
      !Number.isFinite(
        dilution
      ) ||
      dilution < 0 ||
      dilution > 100
    )
  ) {
    issues.push(
      issue(
        "SUSPICIOUS_PERCENTAGE",
        "WARNING",
        "Dilution percentage looks invalid",
        "Expected dilution should normally be between 0% and 100%.",
        {
          field:
            "equity.expectedDilutionPercentage",

          recommendation:
            "Review the dilution assumption before comparison.",
        }
      )
    );
  }

  const equityEntries =
    collectScannerFields(
      scan
    ).filter(
      (entry) =>
        entry.equityCritical
    );

  /*
   * Not every equity-critical field is required for every type.
   *
   * We therefore consider critical review complete when the
   * actually populated equity-critical fields have been reviewed
   * AND the equity type itself has been reviewed.
   */

  const populatedEquityReviewed =
    equityEntries
      .filter(
        (entry) =>
          hasScannerFieldValue(
            entry.field
          )
      )
      .every(
        (entry) =>
          isReviewedScannerField(
            entry.field
          )
      );

  const typeReviewed =
    isReviewedScannerField(
      scan.equity.type
    );

  const criticalReviewed =
    populatedEquityReviewed &&
    typeReviewed;

  const blockingCount =
    issues.filter(
      (item) =>
        item.severity ===
        "BLOCKING"
    ).length;

  const warningCount =
    issues.filter(
      (item) =>
        item.severity ===
        "WARNING"
    ).length;

  let readiness:
    OfferScannerEquityReadiness;

  if (
    blockingCount > 0
  ) {
    readiness =
      "NOT_READY";
  } else if (
    warningCount > 0 ||
    !criticalReviewed
  ) {
    readiness =
      "PARTIAL";
  } else {
    readiness =
      "READY";
  }

  return {
    issues,

    readiness,

    criticalReviewed,
  };
}

/* ============================================================
   SPECIAL-CONDITION VALIDATION
============================================================ */

function validateSpecialConditions(
  scan:
    ScannedOfferLetter
): OfferScannerIssue[] {
  const issues:
    OfferScannerIssue[] =
    [];

  const joiningBonus =
    safePositive(
      scan.cash
        .joiningBonus.value
    );

  if (
    joiningBonus > 0 &&
    !hasScannerFieldValue(
      scan.specialConditions
        .joiningBonusClawback
    )
  ) {
    issues.push(
      issue(
        "JOINING_BONUS_CLAWBACK_UNKNOWN",
        "INFO",
        "Joining-bonus clawback is unknown",
        "A joining bonus exists, but the scanner did not identify whether repayment conditions apply.",
        {
          field:
            "specialConditions.joiningBonusClawback",

          recommendation:
            "Review the offer for minimum-service or repayment conditions.",
        }
      )
    );
  }

  if (
    scan.specialConditions
      .variablePayDiscretionary
      .value ===
      true
  ) {
    issues.push(
      issue(
        "VARIABLE_PAY_AMBIGUOUS",
        "INFO",
        "Variable compensation is discretionary",
        "The offer indicates that some variable compensation may depend on employer discretion or performance conditions.",
        {
          field:
            "specialConditions.variablePayDiscretionary",

          recommendation:
            "Treat variable compensation separately from guaranteed recurring cash.",
        }
      )
    );
  }

  if (
    scan.equity.type.value ===
      "ESOP" &&
    !hasScannerFieldValue(
      scan.equity
        .postTerminationExerciseDays
    )
  ) {
    issues.push(
      issue(
        "POST_TERMINATION_WINDOW_UNKNOWN",
        "INFO",
        "Post-termination exercise window unknown",
        "The ESOP offer does not currently contain a confirmed post-termination exercise window.",
        {
          field:
            "equity.postTerminationExerciseDays",

          recommendation:
            "This becomes important when evaluating future stay-vs-leave decisions.",
        }
      )
    );
  }

  return issues;
}

/* ============================================================
   CURRENCY VALIDATION
============================================================ */

function validateCurrency(
  scan:
    ScannedOfferLetter
): OfferScannerIssue[] {
  if (
    scan.metadata.currency !==
      "UNKNOWN"
  ) {
    return [];
  }

  return [
    issue(
      "CURRENCY_UNKNOWN",
      "BLOCKING",
      "Offer currency is unknown",
      "The scanner could not reliably identify the compensation currency.",
      {
        recommendation:
          "Confirm the currency before comparing monetary values.",
      }
    ),
  ];
}

/* ============================================================
   MODEL READINESS
============================================================ */

function determineModelReadiness(
  scan:
    ScannedOfferLetter,
  issues:
    OfferScannerIssue[],
  criticalFieldsReviewed:
    boolean,
  equityReadiness:
    OfferScannerEquityReadiness
): OfferScannerReadiness {
  const blockingIssueCount =
    issues.filter(
      (item) =>
        item.severity ===
        "BLOCKING"
    ).length;

  const warningCount =
    issues.filter(
      (item) =>
        item.severity ===
        "WARNING"
    ).length;

  let modelReadiness:
    OfferScannerModelReadiness;

  if (
    blockingIssueCount > 0
  ) {
    modelReadiness =
      "BLOCKED";
  } else if (
    !criticalFieldsReviewed ||
    equityReadiness ===
      "PARTIAL"
  ) {
    modelReadiness =
      "REVIEW_REQUIRED";
  } else {
    modelReadiness =
      "READY";
  }

  const missingCashFields: string[] = [];

  if (!String(scan.employer.companyName.value ?? "").trim()) {
    missingCashFields.push("Company name");
  }

  if (!String(scan.employer.roleTitle.value ?? "").trim()) {
    missingCashFields.push("Role / designation");
  }

  if (safePositive(scan.cash.fixedSalary.value) <= 0) {
    missingCashFields.push("Fixed salary");
  }

  const cashBlockingIssueCount = issues.filter(
    (item) =>
      item.severity === "BLOCKING" &&
      !item.field?.startsWith("equity.")
  ).length;

  const canCompareGuaranteedCash =
    missingCashFields.length === 0 &&
    cashBlockingIssueCount === 0;

  const equityType = scan.equity.type.value;

  const equityState =
    equityType === "NONE"
      ? "NO_EQUITY_CONFIRMED"
      : equityType === "UNKNOWN"
      ? "EQUITY_UNKNOWN"
      : equityReadiness === "READY"
      ? "EQUITY_READY"
      : "EQUITY_INCOMPLETE";

  const missingEquityFields = issues
    .filter(
      (item) =>
        item.severity === "BLOCKING" &&
        item.field?.startsWith("equity.")
    )
    .map((item) => item.title);

  const clarificationQuestions: string[] = [];

  if (equityState === "EQUITY_UNKNOWN") {
    clarificationQuestions.push(
      "Does this offer include ESOPs, RSUs, shares, or any other equity grant?"
    );
  }

  if (missingEquityFields.includes("Equity quantity missing")) {
    clarificationQuestions.push(
      "What is the exact number of options, RSUs, or shares offered?"
    );
  }

  if (missingEquityFields.includes("Exercise price missing")) {
    clarificationQuestions.push(
      "What is the exercise or strike price per option?"
    );
  }

  if (missingEquityFields.includes("Private-company value basis missing")) {
    clarificationQuestions.push(
      "What is the latest FMV per share, or the latest valuation and fully diluted share count?"
    );
  }

  const canCreateOffer =
    canCompareGuaranteedCash &&
    criticalFieldsReviewed;

  const canModelEquity =
    equityReadiness ===
      "READY" ||
    equityReadiness ===
      "NOT_APPLICABLE";

  const canRunFullComparison =
    canCreateOffer &&
    canModelEquity;

  const canRunComparison = canRunFullComparison;

  const decisionState =
    !canCompareGuaranteedCash
      ? "NEEDS_CLARIFICATION"
      : equityState === "NO_EQUITY_CONFIRMED"
      ? "CASH_ONLY_READY"
      : equityState === "EQUITY_READY"
      ? "FULL_DECISION_READY"
      : "CASH_READY_EQUITY_INCOMPLETE";

  let explanation:
    string;

  if (
    modelReadiness ===
      "BLOCKED"
  ) {
    explanation =
      "Critical information is missing or unreliable. Resolve the blocking items before using this offer in comparison.";
  } else if (
    modelReadiness ===
      "REVIEW_REQUIRED"
  ) {
    explanation =
      "The scanner found useful offer information, but important fields still require user review or confirmation.";
  } else {
    explanation =
      "The critical offer fields have been reviewed and no blocking validation issue remains.";
  }

  return {
    modelReadiness,

    equityReadiness,

    canCreateOffer,

    canRunComparison,

    canModelEquity,

    canCompareGuaranteedCash,

    canRunFullComparison,

    equityState,

    decisionState,

    missingCashFields,

    missingEquityFields,

    clarificationQuestions,

    blockingIssueCount,

    warningCount,

    explanation,
  };
}

/* ============================================================
   COMPLETE VALIDATION
============================================================ */

export function validateScannedOffer(
  scan:
    ScannedOfferLetter
): OfferScannerValidationResult {
  const completeness =
    calculateScannerCompleteness(
      scan
    );

  const reviewIssues =
    buildReviewIssues(
      scan
    );

  const employerIssues =
    validateEmployer(
      scan
    );

  const cashIssues =
    validateCash(
      scan
    );

  const equityValidation =
    validateEquity(
      scan
    );

  const specialIssues =
    validateSpecialConditions(
      scan
    );

  const currencyIssues =
    validateCurrency(
      scan
    );

  const issues =
    uniqueIssues([
      ...employerIssues,

      ...cashIssues,

      ...equityValidation
        .issues,

      ...specialIssues,

      ...currencyIssues,

      ...reviewIssues,
    ]);

  const criticalFieldsReviewed =
    areCriticalFieldsReviewed(
      scan
    );

  const readiness =
    determineModelReadiness(
      scan,
      issues,
      criticalFieldsReviewed,
      equityValidation
        .readiness
    );

  const blockingIssues =
    issues.filter(
      (item) =>
        item.severity ===
        "BLOCKING"
    );

  const warnings =
    issues.filter(
      (item) =>
        item.severity ===
        "WARNING"
    );

  const informationalIssues =
    issues.filter(
      (item) =>
        item.severity ===
        "INFO"
    );

  return {
    completeness,

    readiness,

    issues,

    blockingIssues,

    warnings,

    informationalIssues,

    criticalFieldsReviewed,

    equityCriticalFieldsReviewed:
      equityValidation
        .criticalReviewed,
  };
}

/* ============================================================
   APPLY VALIDATION RESULT

   Returns a new scanner object.

   Does NOT mutate the original.
============================================================ */

export function applyScannerValidation(
  scan:
    ScannedOfferLetter
): ScannedOfferLetter {
  const validation =
    validateScannedOffer(
      scan
    );

  return {
    ...scan,

    completeness:
      validation
        .completeness,

    readiness:
      validation
        .readiness,

    issues:
      validation.issues,

    updatedAt:
      new Date()
        .toISOString(),
  };
}

/* ============================================================
   QUICK CHECKS
============================================================ */

export function canCreateOfferFromScan(
  scan:
    ScannedOfferLetter
): boolean {
  return validateScannedOffer(
    scan
  ).readiness
    .canCreateOffer;
}

export function canCompareScannedOffer(
  scan:
    ScannedOfferLetter
): boolean {
  return validateScannedOffer(
    scan
  ).readiness
    .canRunComparison;
}

export function canModelScannedEquity(
  scan:
    ScannedOfferLetter
): boolean {
  return validateScannedOffer(
    scan
  ).readiness
    .canModelEquity;
}

/* ============================================================
   HEADLINE-EQUITY-ONLY CHECK

   This is one of the important paid-product trust features.

   Example:

   Employer says:
      "ESOP value ₹15 lakh"

   But we have:
      no option quantity
      no FMV
      no valuation/share-count basis

   => DO NOT treat ₹15L as real economic value.
============================================================ */

export function hasHeadlineEquityOnly(
  scan:
    ScannedOfferLetter
): boolean {
  const headline =
    safePositive(
      scan.equity
        .employerHeadlineEquityValue
        .value
    );

  if (
    headline <= 0
  ) {
    return false;
  }

  const quantity =
    safePositive(
      scan.equity
        .totalOptionsOrShares
        .value
    );

  const currentFMV =
    safePositive(
      scan.equity
        .currentFMV.value
    );

  const listedPrice =
    safePositive(
      scan.equity
        .listedSharePrice.value
    );

  const valuation =
    safePositive(
      scan.equity
        .companyValuation.value
    );

  const totalShares =
    safePositive(
      scan.equity
        .totalCompanyShares.value
    );

  const hasValueBasis =
    currentFMV > 0 ||
    listedPrice > 0 ||
    (
      valuation > 0 &&
      totalShares > 0
    );

  return (
    quantity <= 0 ||
    !hasValueBasis
  );
}

/* ============================================================
   REVIEW QUEUE

   Used later by the Review & Confirm UI to surface exactly the
   fields requiring human attention.
============================================================ */

export function getScannerReviewQueue(
  scan:
    ScannedOfferLetter
): Array<{
  path: string;

  reason:
    | "UNREVIEWED"
    | "LOW_CONFIDENCE"
    | "MISSING"
    | "BLOCKING_ISSUE"
    | "WARNING";

  message: string;
}> {
  const queue: Array<{
    path: string;

    reason:
      | "UNREVIEWED"
      | "LOW_CONFIDENCE"
      | "MISSING"
      | "BLOCKING_ISSUE"
      | "WARNING";

    message: string;
  }> = [];

  const validation =
    validateScannedOffer(
      scan
    );

  for (
    const entry of
    collectScannerFields(
      scan
    )
  ) {
    if (
      entry.critical &&
      entry.field
        .reviewStatus ===
        "UNREVIEWED"
    ) {
      queue.push({
        path:
          entry.path,

        reason:
          "UNREVIEWED",

        message:
          "Critical extracted value requires confirmation.",
      });
    }

    if (
      entry.field
        .confidence ===
        "LOW" &&
      hasScannerFieldValue(
        entry.field
      ) &&
      !isAcceptedScannerField(
        entry.field
      )
    ) {
      queue.push({
        path:
          entry.path,

        reason:
          "LOW_CONFIDENCE",

        message:
          "Scanner confidence is low. Compare this value with the source document.",
      });
    }

    if (
      entry.critical &&
      !hasScannerFieldValue(
        entry.field
      )
    ) {
      queue.push({
        path:
          entry.path,

        reason:
          "MISSING",

        message:
          "Critical value was not found.",
      });
    }
  }

  for (
    const validationIssue of
    validation.issues
  ) {
    if (
      !validationIssue.field
    ) {
      continue;
    }

    if (
      validationIssue.severity ===
      "BLOCKING"
    ) {
      queue.push({
        path:
          validationIssue.field,

        reason:
          "BLOCKING_ISSUE",

        message:
          validationIssue.message,
      });
    } else if (
      validationIssue.severity ===
      "WARNING"
    ) {
      queue.push({
        path:
          validationIssue.field,

        reason:
          "WARNING",

        message:
          validationIssue.message,
      });
    }
  }

  const seen =
    new Set<string>();

  return queue.filter(
    (item) => {
      const key =
        `${item.path}|${item.reason}|${item.message}`;

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}

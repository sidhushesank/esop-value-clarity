/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   COMPENSATION ENGINE

   Responsibilities:
   - normalize the cash side of an offer
   - separate guaranteed / variable / one-time compensation
   - separate cash from employer-side CTC components
   - calculate first-year compensation
   - calculate cumulative compensation at 1Y / 2Y / 3Y / 4Y
   - expose CTC reality-check metrics

   IMPORTANT:
   This file DOES NOT:
   - value ESOPs / RSUs
   - calculate vesting
   - calculate exercise tax
   - calculate sale tax
   - compare Offer A vs Offer B
   - calculate break-even
   - generate negotiation targets

   All amounts are modeled as annual INR-equivalent values unless
   the surrounding OfferInput explicitly uses another currency.
============================================================ */

import type {
  OfferBenefits,
  OfferCashCompensation,
  OfferComparisonHorizon,
  OfferInput,
  OfferNormalizedCash,
} from "./types";

import {
  normalizeBenefits,
  normalizeCashCompensation,
  normalizePositiveOfferNumber,
} from "./normalize";

/* ============================================================
   RESULT TYPES LOCAL TO THIS ENGINE
============================================================ */

export type OfferCashBreakdown = {
  /* ----------------------------------------------------------
     HEADLINE
  ---------------------------------------------------------- */

  headlineCTC: number;

  /* ----------------------------------------------------------
     GUARANTEED RECURRING CASH
  ---------------------------------------------------------- */

  fixedSalary: number;

  otherGuaranteedRecurringCash: number;

  guaranteedRecurringCash: number;

  /* ----------------------------------------------------------
     VARIABLE
  ---------------------------------------------------------- */

  targetVariablePay: number;

  maximumVariablePay: number;

  /* ----------------------------------------------------------
     ONE-TIME
  ---------------------------------------------------------- */

  joiningBonus: number;

  retentionBonus: number;

  relocationAllowance: number;

  otherOneTimeCash: number;

  oneTimeCash: number;

  /* ----------------------------------------------------------
     EMPLOYER / CTC COMPONENTS
  ---------------------------------------------------------- */

  employerPF: number;

  gratuity: number;

  insuranceValue: number;

  otherEmployerBenefits: number;

  employerBenefits: number;

  /* ----------------------------------------------------------
     NON-CASH / PERK VALUE
  ---------------------------------------------------------- */

  additionalBenefits: number;

  /* ----------------------------------------------------------
     ANNUAL / FIRST-YEAR TOTALS
  ---------------------------------------------------------- */

  targetAnnualCompensation: number;

  maximumAnnualCompensation: number;

  firstYearTargetCash: number;

  firstYearMaximumCash: number;

  firstYearTargetEconomicCompensation: number;

  /* ----------------------------------------------------------
     CTC REALITY
  ---------------------------------------------------------- */

  guaranteedShareOfHeadlineCTC: number;

  variableShareOfHeadlineCTC: number;

  oneTimeShareOfHeadlineCTC: number;

  employerBenefitShareOfHeadlineCTC: number;

  unexplainedHeadlineCTC: number;
};

export type OfferCumulativeCashResult = {
  horizonMonths: OfferComparisonHorizon;

  years: number;

  cumulativeGuaranteedCash: number;

  cumulativeTargetVariableCash: number;

  cumulativeMaximumVariableCash: number;

  cumulativeOneTimeCash: number;

  cumulativeEmployerBenefits: number;

  cumulativeAdditionalBenefits: number;

  cumulativeTargetCashCompensation: number;

  cumulativeMaximumCashCompensation: number;

  cumulativeTargetEconomicCompensation: number;
};

export type OfferCompensationAnalysis = {
  normalizedCash: OfferNormalizedCash;

  breakdown: OfferCashBreakdown;

  horizons: Record<
    OfferComparisonHorizon,
    OfferCumulativeCashResult
  >;

  warnings: string[];

  assumptions: string[];
};

/* ============================================================
   SAFE HELPERS
============================================================ */

function safeMoney(
  value: unknown
): number {
  return normalizePositiveOfferNumber(
    value
  );
}

function safePercentage(
  numerator: number,
  denominator: number
): number {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return 0;
  }

  return Math.max(
    (numerator / denominator) *
      100,
    0
  );
}

/* ============================================================
   GUARANTEED RECURRING CASH

   IMPORTANT:
   fixedSalary is treated as the authoritative recurring cash
   total when it is supplied.

   We DO NOT add:
   basic + HRA + special allowance + flexible benefits
   on top of fixedSalary because those fields are normally the
   BREAKDOWN of fixed salary in Indian offer letters.

   If fixedSalary is missing, we reconstruct recurring cash from
   the known components.
============================================================ */

export function calculateGuaranteedRecurringCash(
  cashInput:
    | OfferCashCompensation
    | Partial<OfferCashCompensation>
): {
  fixedSalary: number;

  otherGuaranteedRecurringCash: number;

  guaranteedRecurringCash: number;
} {
  const cash =
    normalizeCashCompensation(
      cashInput
    );

  const componentBasedFixed =
    safeMoney(cash.basicSalary) +
    safeMoney(cash.hra) +
    safeMoney(
      cash.specialAllowance
    ) +
    safeMoney(
      cash.flexibleBenefits
    );

  const fixedSalary =
    cash.fixedSalary > 0
      ? cash.fixedSalary
      : componentBasedFixed;

  const otherGuaranteedRecurringCash =
    safeMoney(
      cash.otherRecurringCash
    );

  const guaranteedRecurringCash =
    fixedSalary +
    otherGuaranteedRecurringCash;

  return {
    fixedSalary,

    otherGuaranteedRecurringCash,

    guaranteedRecurringCash,
  };
}

/* ============================================================
   VARIABLE PAY

   Avoid double-counting overlapping offer-letter labels.

   targetVariablePay is treated as authoritative when supplied.
   Otherwise we reconstruct target variable compensation from:
   - targetBonus
   - performanceBonus
   - otherVariablePay

   maximumVariablePay is used only when it exceeds the target.
============================================================ */

export function calculateVariableCash(
  cashInput:
    | OfferCashCompensation
    | Partial<OfferCashCompensation>
): {
  targetVariableCash: number;

  maximumVariableCash: number;
} {
  const cash =
    normalizeCashCompensation(
      cashInput
    );

  const componentTarget =
    safeMoney(cash.targetBonus) +
    safeMoney(
      cash.performanceBonus
    ) +
    safeMoney(
      cash.otherVariablePay
    );

  const targetVariableCash =
    cash.targetVariablePay > 0
      ? cash.targetVariablePay
      : componentTarget;

  const maximumVariableCash =
    Math.max(
      safeMoney(
        cash.maximumVariablePay
      ),
      targetVariableCash
    );

  return {
    targetVariableCash,

    maximumVariableCash,
  };
}

/* ============================================================
   ONE-TIME CASH
============================================================ */

export function calculateOneTimeCash(
  cashInput:
    | OfferCashCompensation
    | Partial<OfferCashCompensation>
): {
  joiningBonus: number;

  retentionBonus: number;

  relocationAllowance: number;

  otherOneTimeCash: number;

  oneTimeCash: number;
} {
  const cash =
    normalizeCashCompensation(
      cashInput
    );

  const joiningBonus =
    safeMoney(
      cash.joiningBonus
    );

  const retentionBonus =
    safeMoney(
      cash.retentionBonus
    );

  const relocationAllowance =
    safeMoney(
      cash.relocationAllowance
    );

  const otherOneTimeCash =
    safeMoney(
      cash.otherOneTimeCash
    );

  const oneTimeCash =
    joiningBonus +
    retentionBonus +
    relocationAllowance +
    otherOneTimeCash;

  return {
    joiningBonus,

    retentionBonus,

    relocationAllowance,

    otherOneTimeCash,

    oneTimeCash,
  };
}

/* ============================================================
   EMPLOYER-SIDE CTC COMPONENTS
============================================================ */

export function calculateEmployerBenefits(
  cashInput:
    | OfferCashCompensation
    | Partial<OfferCashCompensation>
): {
  employerPF: number;

  gratuity: number;

  insuranceValue: number;

  otherEmployerBenefits: number;

  employerBenefits: number;
} {
  const cash =
    normalizeCashCompensation(
      cashInput
    );

  const employerPF =
    safeMoney(
      cash.employerPF
    );

  const gratuity =
    safeMoney(
      cash.gratuity
    );

  const insuranceValue =
    safeMoney(
      cash.insuranceValue
    );

  const otherEmployerBenefits =
    safeMoney(
      cash.otherBenefitsValue
    );

  const employerBenefits =
    employerPF +
    gratuity +
    insuranceValue +
    otherEmployerBenefits;

  return {
    employerPF,

    gratuity,

    insuranceValue,

    otherEmployerBenefits,

    employerBenefits,
  };
}

/* ============================================================
   ADDITIONAL BENEFITS / PERKS

   These values are kept separate from salary because:
   ₹1 of insurance / meal / wellness benefit is not necessarily
   equivalent to ₹1 of employee cash.

   Later comparison UI can display this distinction explicitly.
============================================================ */

export function calculateAdditionalBenefits(
  benefitsInput:
    | OfferBenefits
    | Partial<OfferBenefits>
): number {
  const benefits =
    normalizeBenefits(
      benefitsInput
    );

  return (
    safeMoney(
      benefits.healthInsuranceValue
    ) +
    safeMoney(
      benefits.lifeInsuranceValue
    ) +
    safeMoney(
      benefits.mealBenefitsValue
    ) +
    safeMoney(
      benefits.transportBenefitsValue
    ) +
    safeMoney(
      benefits.wellnessBenefitsValue
    ) +
    safeMoney(
      benefits.learningBudgetValue
    ) +
    safeMoney(
      benefits.otherBenefitsValue
    )
  );
}

/* ============================================================
   CASH BREAKDOWN
============================================================ */

export function calculateOfferCashBreakdown(
  cashInput:
    | OfferCashCompensation
    | Partial<OfferCashCompensation>,
  benefitsInput:
    | OfferBenefits
    | Partial<OfferBenefits>
): OfferCashBreakdown {
  const cash =
    normalizeCashCompensation(
      cashInput
    );

  const headlineCTC =
    safeMoney(
      cash.headlineCTC
    );

  const guaranteed =
    calculateGuaranteedRecurringCash(
      cash
    );

  const variable =
    calculateVariableCash(
      cash
    );

  const oneTime =
    calculateOneTimeCash(
      cash
    );

  const employer =
    calculateEmployerBenefits(
      cash
    );

  const additionalBenefits =
    calculateAdditionalBenefits(
      benefitsInput
    );

  /* ----------------------------------------------------------
     NORMAL ANNUAL COMPENSATION

     One-time amounts are deliberately excluded.
  ---------------------------------------------------------- */

  const targetAnnualCompensation =
    guaranteed.guaranteedRecurringCash +
    variable.targetVariableCash;

  const maximumAnnualCompensation =
    guaranteed.guaranteedRecurringCash +
    variable.maximumVariableCash;

  /* ----------------------------------------------------------
     FIRST-YEAR CASH

     Joining / relocation / other one-time amounts appear here.
  ---------------------------------------------------------- */

  const firstYearTargetCash =
    targetAnnualCompensation +
    oneTime.oneTimeCash;

  const firstYearMaximumCash =
    maximumAnnualCompensation +
    oneTime.oneTimeCash;

  /* ----------------------------------------------------------
     ECONOMIC COMPENSATION

     Employer CTC components + perks are shown separately but can
     be included in an economic-compensation view.
  ---------------------------------------------------------- */

  const firstYearTargetEconomicCompensation =
    firstYearTargetCash +
    employer.employerBenefits +
    additionalBenefits;

  /* ----------------------------------------------------------
     CTC REALITY CHECK

     headlineCTC is employer-presented CTC.
     We explain how much of it maps to the known categories.

     Equity is intentionally NOT included here. equity.ts owns it.
  ---------------------------------------------------------- */

  const knownHeadlineComponents =
    targetAnnualCompensation +
    oneTime.oneTimeCash +
    employer.employerBenefits;

  const unexplainedHeadlineCTC =
    headlineCTC > 0
      ? Math.max(
          headlineCTC -
            knownHeadlineComponents,
          0
        )
      : 0;

  return {
    headlineCTC,

    fixedSalary:
      guaranteed.fixedSalary,

    otherGuaranteedRecurringCash:
      guaranteed.otherGuaranteedRecurringCash,

    guaranteedRecurringCash:
      guaranteed.guaranteedRecurringCash,

    targetVariablePay:
      variable.targetVariableCash,

    maximumVariablePay:
      variable.maximumVariableCash,

    joiningBonus:
      oneTime.joiningBonus,

    retentionBonus:
      oneTime.retentionBonus,

    relocationAllowance:
      oneTime.relocationAllowance,

    otherOneTimeCash:
      oneTime.otherOneTimeCash,

    oneTimeCash:
      oneTime.oneTimeCash,

    employerPF:
      employer.employerPF,

    gratuity:
      employer.gratuity,

    insuranceValue:
      employer.insuranceValue,

    otherEmployerBenefits:
      employer.otherEmployerBenefits,

    employerBenefits:
      employer.employerBenefits,

    additionalBenefits,

    targetAnnualCompensation,

    maximumAnnualCompensation,

    firstYearTargetCash,

    firstYearMaximumCash,

    firstYearTargetEconomicCompensation,

    guaranteedShareOfHeadlineCTC:
      safePercentage(
        guaranteed.guaranteedRecurringCash,
        headlineCTC
      ),

    variableShareOfHeadlineCTC:
      safePercentage(
        variable.targetVariableCash,
        headlineCTC
      ),

    oneTimeShareOfHeadlineCTC:
      safePercentage(
        oneTime.oneTimeCash,
        headlineCTC
      ),

    employerBenefitShareOfHeadlineCTC:
      safePercentage(
        employer.employerBenefits,
        headlineCTC
      ),

    unexplainedHeadlineCTC,
  };
}

/* ============================================================
   NORMALIZED CASH RESULT

   This maps directly into OfferNormalizedCash from types.ts.
============================================================ */

export function calculateNormalizedCash(
  cashInput:
    | OfferCashCompensation
    | Partial<OfferCashCompensation>,
  benefitsInput:
    | OfferBenefits
    | Partial<OfferBenefits>
): OfferNormalizedCash {
  const breakdown =
    calculateOfferCashBreakdown(
      cashInput,
      benefitsInput
    );

  return {
    headlineCTC:
      breakdown.headlineCTC,

    guaranteedRecurringCash:
      breakdown.guaranteedRecurringCash,

    targetVariableCash:
      breakdown.targetVariablePay,

    maximumVariableCash:
      breakdown.maximumVariablePay,

    oneTimeCash:
      breakdown.oneTimeCash,

    employerBenefits:
      breakdown.employerBenefits +
      breakdown.additionalBenefits,

    targetAnnualCompensation:
      breakdown.targetAnnualCompensation,

    maximumAnnualCompensation:
      breakdown.maximumAnnualCompensation,

    firstYearTargetCash:
      breakdown.firstYearTargetCash,

    firstYearMaximumCash:
      breakdown.firstYearMaximumCash,
  };
}

/* ============================================================
   CUMULATIVE CASH AT HORIZON

   Assumptions for Phase 4 V1:
   - fixed recurring cash stays constant each year
   - variable target stays constant each year
   - benefits stay constant each year
   - one-time compensation is counted ONCE
   - salary growth is NOT modeled yet

   We can add salary-growth assumptions later without changing
   the basic OfferInput contract.
============================================================ */

export function calculateCumulativeCashAtHorizon(
  cashInput:
    | OfferCashCompensation
    | Partial<OfferCashCompensation>,
  benefitsInput:
    | OfferBenefits
    | Partial<OfferBenefits>,
  horizonMonths:
    OfferComparisonHorizon
): OfferCumulativeCashResult {
  const breakdown =
    calculateOfferCashBreakdown(
      cashInput,
      benefitsInput
    );

  const years =
    horizonMonths / 12;

  const cumulativeGuaranteedCash =
    breakdown.guaranteedRecurringCash *
    years;

  const cumulativeTargetVariableCash =
    breakdown.targetVariablePay *
    years;

  const cumulativeMaximumVariableCash =
    breakdown.maximumVariablePay *
    years;

  /*
   * One-time compensation is intentionally counted once.
   *
   * A future version can add retention-bonus timing when we
   * introduce explicit payment dates / clawback terms.
   */
  const cumulativeOneTimeCash =
    breakdown.oneTimeCash;

  const cumulativeEmployerBenefits =
    breakdown.employerBenefits *
    years;

  const cumulativeAdditionalBenefits =
    breakdown.additionalBenefits *
    years;

  const cumulativeTargetCashCompensation =
    cumulativeGuaranteedCash +
    cumulativeTargetVariableCash +
    cumulativeOneTimeCash;

  const cumulativeMaximumCashCompensation =
    cumulativeGuaranteedCash +
    cumulativeMaximumVariableCash +
    cumulativeOneTimeCash;

  const cumulativeTargetEconomicCompensation =
    cumulativeTargetCashCompensation +
    cumulativeEmployerBenefits +
    cumulativeAdditionalBenefits;

  return {
    horizonMonths,

    years,

    cumulativeGuaranteedCash,

    cumulativeTargetVariableCash,

    cumulativeMaximumVariableCash,

    cumulativeOneTimeCash,

    cumulativeEmployerBenefits,

    cumulativeAdditionalBenefits,

    cumulativeTargetCashCompensation,

    cumulativeMaximumCashCompensation,

    cumulativeTargetEconomicCompensation,
  };
}

/* ============================================================
   ALL STANDARD HORIZONS
============================================================ */

export function calculateCashHorizons(
  cashInput:
    | OfferCashCompensation
    | Partial<OfferCashCompensation>,
  benefitsInput:
    | OfferBenefits
    | Partial<OfferBenefits>
): Record<
  OfferComparisonHorizon,
  OfferCumulativeCashResult
> {
  return {
    12:
      calculateCumulativeCashAtHorizon(
        cashInput,
        benefitsInput,
        12
      ),

    24:
      calculateCumulativeCashAtHorizon(
        cashInput,
        benefitsInput,
        24
      ),

    36:
      calculateCumulativeCashAtHorizon(
        cashInput,
        benefitsInput,
        36
      ),

    48:
      calculateCumulativeCashAtHorizon(
        cashInput,
        benefitsInput,
        48
      ),
  };
}

/* ============================================================
   WARNINGS
============================================================ */

export function getCompensationWarnings(
  offer: OfferInput,
  breakdown:
    OfferCashBreakdown
): string[] {
  const warnings: string[] =
    [];

  const notStated = (key: string): boolean =>
    offer.inputMode === "DOCUMENT" &&
    offer.fields.some(
      (field) =>
        field.key === key &&
        field.status === "NOT_FOUND"
    );

  if (
    breakdown.headlineCTC <= 0
  ) {
    warnings.push(
      "Headline CTC is not available. The comparison will use the known compensation components."
    );
  }

  if (
    breakdown.guaranteedRecurringCash <=
    0
  ) {
    warnings.push(
      "Guaranteed recurring cash could not be identified."
    );
  }

  if (
    breakdown.headlineCTC > 0 &&
    breakdown.unexplainedHeadlineCTC >
      breakdown.headlineCTC *
        0.05
  ) {
    warnings.push(
      "Part of the headline CTC is not explained by the confirmed cash and employer-benefit components."
    );
  }

  if (
    breakdown.targetVariablePay >
    breakdown.guaranteedRecurringCash
  ) {
    warnings.push(
      "Target variable compensation is unusually high relative to guaranteed recurring cash. Review the extracted offer terms."
    );
  }

  if (notStated("cash.targetVariablePay")) {
    warnings.push(
      "Target variable pay is not stated in this offer letter and is excluded from the guaranteed-cash comparison."
    );
  }

  if (notStated("cash.joiningBonus")) {
    warnings.push(
      "A joining bonus is not stated in this offer letter and is not assumed to be ₹0 or included in the comparison."
    );
  }

  if (
    notStated("benefits.healthInsuranceValue") &&
    notStated("cash.insuranceValue")
  ) {
    warnings.push(
      "Insurance or health-benefit value is not stated in this offer letter and is excluded from the economic comparison."
    );
  }

  if (
    breakdown.maximumVariablePay >
      0 &&
    breakdown.maximumVariablePay <
      breakdown.targetVariablePay
  ) {
    warnings.push(
      "Maximum variable compensation is below target variable compensation. Review the offer terms."
    );
  }

  if (
    offer.cash.retentionBonus > 0
  ) {
    warnings.push(
      "Retention bonus timing and service conditions are not yet modeled. Phase 4 V1 counts the amount once."
    );
  }

  return warnings;
}

/* ============================================================
   ASSUMPTIONS
============================================================ */

export function getCompensationAssumptions():
  string[] {
  return [
    "Fixed recurring compensation is assumed to remain constant across the modeled horizon.",
    "Target variable compensation is modeled at the stated target amount each year.",
    "Maximum variable compensation is shown separately and is not treated as guaranteed.",
    "Joining, relocation, retention and other one-time compensation are counted once.",
    "Employer PF, gratuity, insurance and other employer-side components are kept separate from employee cash compensation.",
    "Benefits and perks are shown as economic value rather than guaranteed employee cash.",
    "Basic salary, HRA, special allowance and flexible benefits are treated as components of fixed salary when fixed salary is supplied, preventing double counting.",
    "Salary increments, promotions and inflation are not modeled in Phase 4 V1.",
    "Equity compensation is intentionally excluded from this engine and is modeled separately.",
    "Tax and monthly in-hand salary are not calculated by this compensation engine.",
  ];
}

/* ============================================================
   COMPLETE COMPENSATION ANALYSIS
============================================================ */

export function analyzeOfferCompensation(
  offer: OfferInput
): OfferCompensationAnalysis {
  const breakdown =
    calculateOfferCashBreakdown(
      offer.cash,
      offer.benefits
    );

  const normalizedCash =
    calculateNormalizedCash(
      offer.cash,
      offer.benefits
    );

  const horizons =
    calculateCashHorizons(
      offer.cash,
      offer.benefits
    );

  const warnings =
    getCompensationWarnings(
      offer,
      breakdown
    );

  const assumptions =
    getCompensationAssumptions();

  return {
    normalizedCash,

    breakdown,

    horizons,

    warnings,

    assumptions,
  };
}

/* ============================================================
   CTC REALITY SUMMARY

   This will later power a simple sentence in the Phase 4 UI:

   "Your ₹34L headline CTC contains ₹24L of guaranteed recurring
   cash, ₹3L target variable and ₹2L one-time compensation."
============================================================ */

export function getCTCRealitySummary(
  offer: OfferInput
): {
  headlineCTC: number;

  guaranteedRecurringCash: number;

  targetVariableCash: number;

  oneTimeCash: number;

  employerBenefits: number;

  unexplainedHeadlineCTC: number;
} {
  const breakdown =
    calculateOfferCashBreakdown(
      offer.cash,
      offer.benefits
    );

  return {
    headlineCTC:
      breakdown.headlineCTC,

    guaranteedRecurringCash:
      breakdown.guaranteedRecurringCash,

    targetVariableCash:
      breakdown.targetVariablePay,

    oneTimeCash:
      breakdown.oneTimeCash,

    employerBenefits:
      breakdown.employerBenefits +
      breakdown.additionalBenefits,

    unexplainedHeadlineCTC:
      breakdown.unexplainedHeadlineCTC,
  };
}

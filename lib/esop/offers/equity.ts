/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   EQUITY ENGINE

   Responsibilities:
   - model ESOP / RSU / stock vesting at 1Y / 2Y / 3Y / 4Y
   - determine an available unit-value basis
   - model Bear / Base / Bull equity outcomes
   - apply expected dilution
   - calculate ESOP exercise capital
   - distinguish listed vs unlisted liquidity
   - identify missing equity information
   - expose risk / warning / assumption information

   IMPORTANT:
   This engine DOES NOT independently calculate Indian tax.

   Phase 1–3 already established Tax / Exercise as connected
   sources of truth. Phase 4 must not introduce a competing tax
   implementation.

   Therefore:
   - modeledExerciseTax = 0
   - modeledSaleTax = 0
   - totalModeledTax = 0

   until Phase 4 explicitly connects to the established tax
   engine.

   This means the equity values produced here are PRE-TAX
   modeled values, with tax clearly identified as pending.
============================================================ */

import type {
  OfferComparisonHorizon,
  OfferCompanyEquityStatus,
  OfferEquityCompensation,
  OfferEquityScenarioResult,
  OfferEquityType,
  OfferInput,
  OfferLiquidityLevel,
  OfferRiskLevel,
  OfferScenarioKey,
  OfferVestingAtHorizon,
} from "./types";

import {
  getMissingEquityFields,
  hasSufficientEquityData,
  normalizeEquityCompensation,
  normalizeOfferPercentage,
  normalizePositiveOfferNumber,
} from "./normalize";

/* ============================================================
   LOCAL RESULT TYPES
============================================================ */

export type OfferEquityValueBasis =
  | "NONE"
  | "LISTED_SHARE_PRICE"
  | "CURRENT_FMV"
  | "VALUATION_PER_SHARE"
  | "EMPLOYER_HEADLINE"
  | "UNAVAILABLE";

export type OfferEquityBasisResult = {
  basis: OfferEquityValueBasis;

  unitValue: number;

  reliableForModeling: boolean;

  explanation: string;
};

export type OfferEquityHorizonAnalysis = {
  horizonMonths: OfferComparisonHorizon;

  vesting: OfferVestingAtHorizon;

  bear: OfferEquityScenarioResult;

  base: OfferEquityScenarioResult;

  bull: OfferEquityScenarioResult;
};

export type OfferEquityAnalysis = {
  hasEquity: boolean;

  hasSufficientData: boolean;

  missingFields: string[];

  basis: OfferEquityBasisResult;

  liquidity: OfferLiquidityLevel;

  risk: OfferRiskLevel;

  horizons: Record<
    OfferComparisonHorizon,
    OfferEquityHorizonAnalysis
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
  value: unknown
): number {
  return normalizeOfferPercentage(
    value
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    Math.max(
      Number.isFinite(value)
        ? value
        : minimum,
      minimum
    ),
    maximum
  );
}

/* ============================================================
   EQUITY PRESENCE
============================================================ */

export function offerHasEquity(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>
): boolean {
  const equity =
    normalizeEquityCompensation(
      equityInput
    );

  return (
    equity.type !== "NONE" &&
    equity.totalOptionsOrShares > 0
  );
}

/* ============================================================
   EQUITY VALUE BASIS

   Priority:

   LISTED:
   1. listed share price
   2. current FMV

   UNLISTED:
   1. current FMV
   2. company valuation / total company shares

   UNKNOWN:
   1. current FMV
   2. listed share price
   3. valuation / total shares

   Employer headline value is intentionally NOT treated as a
   reliable unit-value basis.

   It is returned only as informational fallback context.
============================================================ */

export function determineEquityValueBasis(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>
): OfferEquityBasisResult {
  const equity =
    normalizeEquityCompensation(
      equityInput
    );

  if (equity.type === "UNKNOWN") {
    return {
      basis: "UNAVAILABLE",
      unitValue: 0,
      reliableForModeling: false,
      explanation:
        "The offer letter does not clearly establish whether equity is included, so no equity value is modeled.",
    };
  }

  if (
    equity.type === "NONE" ||
    equity.totalOptionsOrShares <= 0
  ) {
    return {
      basis: "NONE",

      unitValue: 0,

      reliableForModeling: true,

      explanation:
        "This offer does not contain modeled equity compensation.",
    };
  }

  if (
    equity.companyStatus === "LISTED"
  ) {
    if (
      equity.listedSharePrice > 0
    ) {
      return {
        basis:
          "LISTED_SHARE_PRICE",

        unitValue:
          equity.listedSharePrice,

        reliableForModeling:
          true,

        explanation:
          "The listed share price is used as the current equity unit-value basis.",
      };
    }

    if (
      equity.currentFMV > 0
    ) {
      return {
        basis:
          "CURRENT_FMV",

        unitValue:
          equity.currentFMV,

        reliableForModeling:
          true,

        explanation:
          "Current FMV is used because a listed share price was not supplied.",
      };
    }
  }

  if (
    equity.companyStatus === "UNLISTED"
  ) {
    if (
      equity.currentFMV > 0
    ) {
      return {
        basis:
          "CURRENT_FMV",

        unitValue:
          equity.currentFMV,

        reliableForModeling:
          true,

        explanation:
          "Current FMV is used as the private-company equity unit-value basis.",
      };
    }

    if (
      equity.companyValuation > 0 &&
      equity.totalCompanyShares > 0
    ) {
      return {
        basis:
          "VALUATION_PER_SHARE",

        unitValue:
          equity.companyValuation /
          equity.totalCompanyShares,

        reliableForModeling:
          true,

        explanation:
          "The modeled unit value is derived from company valuation divided by total company shares.",
      };
    }
  }

  if (
    equity.currentFMV > 0
  ) {
    return {
      basis:
        "CURRENT_FMV",

      unitValue:
        equity.currentFMV,

      reliableForModeling:
        equity.companyStatus !==
        "UNKNOWN",

      explanation:
        equity.companyStatus ===
        "UNKNOWN"
          ? "FMV is available, but listed/unlisted company status should still be confirmed."
          : "Current FMV is used as the equity unit-value basis.",
    };
  }

  if (
    equity.listedSharePrice > 0
  ) {
    return {
      basis:
        "LISTED_SHARE_PRICE",

      unitValue:
        equity.listedSharePrice,

      reliableForModeling:
        equity.companyStatus ===
        "LISTED",

      explanation:
        equity.companyStatus ===
        "LISTED"
          ? "The listed share price is used as the equity unit-value basis."
          : "A share price is available, but listed/unlisted company status should be confirmed.",
    };
  }

  if (
    equity.companyValuation > 0 &&
    equity.totalCompanyShares > 0
  ) {
    return {
      basis:
        "VALUATION_PER_SHARE",

      unitValue:
        equity.companyValuation /
        equity.totalCompanyShares,

      reliableForModeling:
        equity.companyStatus ===
        "UNLISTED",

      explanation:
        equity.companyStatus ===
        "UNLISTED"
          ? "The modeled unit value is derived from company valuation divided by total company shares."
          : "A valuation-based unit value can be derived, but company status should be confirmed.",
    };
  }

  if (
    equity.employerHeadlineEquityValue >
      0 &&
    equity.totalOptionsOrShares > 0
  ) {
    return {
      basis:
        "EMPLOYER_HEADLINE",

      unitValue:
        equity.employerHeadlineEquityValue /
        equity.totalOptionsOrShares,

      reliableForModeling:
        false,

      explanation:
        "Only the employer-presented headline equity value is available. It is shown as context and is not treated as independently verified economic value.",
    };
  }

  return {
    basis:
      "UNAVAILABLE",

    unitValue:
      0,

    reliableForModeling:
      false,

    explanation:
      "There is not enough information to establish a usable equity unit-value basis.",
  };
}

/* ============================================================
   STANDARD VESTING

   Phase 4 V1 supports the same core schedule we validated in
   the existing Vesting product:

   - nothing vests before the cliff
   - 25% vests at the cliff
   - remaining 75% vests over the remaining vesting period
   - fully vested at the end of the vesting duration

   IMPORTANT:
   This is used for OFFER comparison horizons, not to overwrite
   the user's existing Phase 2 current vesting state.
============================================================ */

export function calculateOfferVestingAtMonth(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>,
  monthsCompleted: number
): {
  totalOptionsOrShares: number;

  vestedOptionsOrShares: number;

  unvestedOptionsOrShares: number;

  vestedPercentage: number;

  cliffReached: boolean;

  fullyVested: boolean;
} {
  const equity =
    normalizeEquityCompensation(
      equityInput
    );

  const total =
    safeMoney(
      equity.totalOptionsOrShares
    );

  if (
    equity.type === "NONE" ||
    total <= 0
  ) {
    return {
      totalOptionsOrShares:
        0,

      vestedOptionsOrShares:
        0,

      unvestedOptionsOrShares:
        0,

      vestedPercentage:
        0,

      cliffReached:
        false,

      fullyVested:
        false,
    };
  }

  const vestingDurationMonths =
    Math.max(
      equity.vestingDurationMonths,
      1
    );

  const cliffMonths =
    clamp(
      equity.cliffMonths,
      0,
      vestingDurationMonths
    );

  const completed =
    clamp(
      Math.round(
        safeMoney(
          monthsCompleted
        )
      ),
      0,
      vestingDurationMonths
    );

  const cliffReached =
    completed >= cliffMonths;

  const fullyVested =
    completed >=
    vestingDurationMonths;

  let vested = 0;

  if (
    fullyVested
  ) {
    vested =
      total;
  } else if (
    completed < cliffMonths
  ) {
    vested =
      0;
  } else if (
    cliffMonths === 0
  ) {
    /*
     * No cliff:
     * straight-line vesting over the full schedule.
     */
    vested =
      total *
      (completed /
        vestingDurationMonths);
  } else {
    const cliffVesting =
      total * 0.25;

    const remainingOptions =
      total -
      cliffVesting;

    const remainingMonths =
      vestingDurationMonths -
      cliffMonths;

    const monthsAfterCliff =
      completed -
      cliffMonths;

    const monthlyVesting =
      remainingMonths > 0
        ? remainingOptions /
          remainingMonths
        : 0;

    vested =
      cliffVesting +
      monthlyVesting *
        monthsAfterCliff;
  }

  vested =
    clamp(
      vested,
      0,
      total
    );

  const unvested =
    Math.max(
      total -
      vested,
      0
    );

  const vestedPercentage =
    total > 0
      ? (vested / total) *
        100
      : 0;

  return {
    totalOptionsOrShares:
      total,

    vestedOptionsOrShares:
      vested,

    unvestedOptionsOrShares:
      unvested,

    vestedPercentage,

    cliffReached,

    fullyVested,
  };
}

/* ============================================================
   VESTING AT STANDARD COMPARISON HORIZON
============================================================ */

export function calculateOfferVestingAtHorizon(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>,
  horizonMonths:
    OfferComparisonHorizon
): OfferVestingAtHorizon {
  const result =
    calculateOfferVestingAtMonth(
      equityInput,
      horizonMonths
    );

  return {
    horizonMonths,

    totalOptionsOrShares:
      result.totalOptionsOrShares,

    vestedOptionsOrShares:
      result.vestedOptionsOrShares,

    unvestedOptionsOrShares:
      result.unvestedOptionsOrShares,

    vestedPercentage:
      result.vestedPercentage,

    cliffReached:
      result.cliffReached,

    fullyVested:
      result.fullyVested,
  };
}

/* ============================================================
   SCENARIO MULTIPLIER
============================================================ */

export function getEquityScenarioMultiplier(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>,
  scenario:
    OfferScenarioKey
): number {
  const equity =
    normalizeEquityCompensation(
      equityInput
    );

  if (
    scenario === "BEAR"
  ) {
    return Math.max(
      equity.bearEquityMultiplier,
      0
    );
  }

  if (
    scenario === "BULL"
  ) {
    return Math.max(
      equity.bullEquityMultiplier,
      0
    );
  }

  return Math.max(
    equity.baseEquityMultiplier,
    0
  );
}

/* ============================================================
   DILUTION MULTIPLIER

   25% dilution => 75% remaining economic basis.

   This is a simplified Phase 4 offer-comparison assumption.
============================================================ */

export function calculateOfferDilutionMultiplier(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>
): number {
  const equity =
    normalizeEquityCompensation(
      equityInput
    );

  const dilution =
    safePercentage(
      equity.expectedDilutionPercentage
    );

  return Math.max(
    1 -
      dilution / 100,
    0
  );
}

/* ============================================================
   LIQUIDITY
============================================================ */

export function determineOfferLiquidity(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>
): OfferLiquidityLevel {
  const equity =
    normalizeEquityCompensation(
      equityInput
    );

  if (
    equity.type === "NONE"
  ) {
    return "HIGH";
  }

  if (
    equity.companyStatus ===
    "LISTED"
  ) {
    return "HIGH";
  }

  if (
    equity.companyStatus ===
    "UNLISTED"
  ) {
    return "LOW";
  }

  return "UNKNOWN";
}

/* ============================================================
   EQUITY RISK
============================================================ */

export function determineOfferEquityRisk(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>,
  basis:
    OfferEquityBasisResult
): OfferRiskLevel {
  const equity =
    normalizeEquityCompensation(
      equityInput
    );

  if (
    equity.type === "NONE"
  ) {
    return "LOW";
  }

  if (
    !basis.reliableForModeling
  ) {
    return "HIGH";
  }

  if (
    equity.companyStatus ===
    "UNLISTED"
  ) {
    return "HIGH";
  }

  if (
    equity.companyStatus ===
    "LISTED"
  ) {
    return "MEDIUM";
  }

  return "UNKNOWN";
}

/* ============================================================
   EXERCISE COST

   ESOP:
   vested options × strike price

   RSU / STOCK:
   no option exercise price is assumed in this Phase 4 engine.

   Tax is separate.
============================================================ */

export function calculateOfferExerciseCost(
  equityType:
    OfferEquityType,
  vestedOptionsOrShares: number,
  exercisePrice: number
): number {
  if (
    equityType !== "ESOP"
  ) {
    return 0;
  }

  return (
    safeMoney(
      vestedOptionsOrShares
    ) *
    safeMoney(
      exercisePrice
    )
  );
}

/* ============================================================
   SCENARIO RESULT
============================================================ */

export function calculateOfferEquityScenario(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>,
  horizonMonths:
    OfferComparisonHorizon,
  scenario:
    OfferScenarioKey,
  basisInput?:
    OfferEquityBasisResult
): OfferEquityScenarioResult {
  const equity =
    normalizeEquityCompensation(
      equityInput
    );

  const vesting =
    calculateOfferVestingAtHorizon(
      equity,
      horizonMonths
    );

  const basis =
    basisInput ??
    determineEquityValueBasis(
      equity
    );

  const liquidity =
    determineOfferLiquidity(
      equity
    );

  const risk =
    determineOfferEquityRisk(
      equity,
      basis
    );

  if (
    equity.type === "NONE" ||
    vesting.vestedOptionsOrShares <=
      0 ||
    basis.unitValue <= 0
  ) {
    return {
      scenario,

      horizonMonths,

      vestedOptionsOrShares:
        vesting.vestedOptionsOrShares,

      modeledUnitValue:
        0,

      grossEquityValue:
        0,

      exerciseCost:
        calculateOfferExerciseCost(
          equity.type,
          vesting.vestedOptionsOrShares,
          equity.exercisePrice
        ),

      modeledExerciseTax:
        0,

      modeledSaleTax:
        0,

      totalModeledTax:
        0,

      totalCapitalRequired:
        calculateOfferExerciseCost(
          equity.type,
          vesting.vestedOptionsOrShares,
          equity.exercisePrice
        ),

      modeledNetEquityValue:
        0,

      postDilutionNetEquityValue:
        0,

      liquidity,

      risk,
    };
  }

  const scenarioMultiplier =
    getEquityScenarioMultiplier(
      equity,
      scenario
    );

  const modeledUnitValue =
    basis.unitValue *
    scenarioMultiplier;

  const grossEquityValue =
    vesting.vestedOptionsOrShares *
    modeledUnitValue;

  const exerciseCost =
    calculateOfferExerciseCost(
      equity.type,
      vesting.vestedOptionsOrShares,
      equity.exercisePrice
    );

  /*
   * Tax intentionally remains zero in this engine.
   *
   * We will connect the established Phase 3 tax engine later.
   */
  const modeledExerciseTax =
    0;

  const modeledSaleTax =
    0;

  const totalModeledTax =
    modeledExerciseTax +
    modeledSaleTax;

  const totalCapitalRequired =
    exerciseCost +
    modeledExerciseTax;

  /*
   * Pre-tax economic value before dilution.
   *
   * For ESOPs:
   * gross modeled equity value - strike/exercise capital.
   *
   * For RSU / STOCK:
   * exercise cost is zero.
   */
  const modeledNetEquityValue =
    Math.max(
      grossEquityValue -
        exerciseCost -
        totalModeledTax,
      0
    );

  const dilutionMultiplier =
    calculateOfferDilutionMultiplier(
      equity
    );

  const postDilutionNetEquityValue =
    modeledNetEquityValue *
    dilutionMultiplier;

  return {
    scenario,

    horizonMonths,

    vestedOptionsOrShares:
      vesting.vestedOptionsOrShares,

    modeledUnitValue,

    grossEquityValue,

    exerciseCost,

    modeledExerciseTax,

    modeledSaleTax,

    totalModeledTax,

    totalCapitalRequired,

    modeledNetEquityValue,

    postDilutionNetEquityValue,

    liquidity,

    risk,
  };
}

/* ============================================================
   COMPLETE HORIZON
============================================================ */

export function calculateOfferEquityHorizon(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>,
  horizonMonths:
    OfferComparisonHorizon,
  basisInput?:
    OfferEquityBasisResult
): OfferEquityHorizonAnalysis {
  const equity =
    normalizeEquityCompensation(
      equityInput
    );

  const basis =
    basisInput ??
    determineEquityValueBasis(
      equity
    );

  return {
    horizonMonths,

    vesting:
      calculateOfferVestingAtHorizon(
        equity,
        horizonMonths
      ),

    bear:
      calculateOfferEquityScenario(
        equity,
        horizonMonths,
        "BEAR",
        basis
      ),

    base:
      calculateOfferEquityScenario(
        equity,
        horizonMonths,
        "BASE",
        basis
      ),

    bull:
      calculateOfferEquityScenario(
        equity,
        horizonMonths,
        "BULL",
        basis
      ),
  };
}

/* ============================================================
   ALL STANDARD HORIZONS
============================================================ */

export function calculateOfferEquityHorizons(
  equityInput:
    | OfferEquityCompensation
    | Partial<OfferEquityCompensation>,
  basisInput?:
    OfferEquityBasisResult
): Record<
  OfferComparisonHorizon,
  OfferEquityHorizonAnalysis
> {
  const equity =
    normalizeEquityCompensation(
      equityInput
    );

  const basis =
    basisInput ??
    determineEquityValueBasis(
      equity
    );

  return {
    12:
      calculateOfferEquityHorizon(
        equity,
        12,
        basis
      ),

    24:
      calculateOfferEquityHorizon(
        equity,
        24,
        basis
      ),

    36:
      calculateOfferEquityHorizon(
        equity,
        36,
        basis
      ),

    48:
      calculateOfferEquityHorizon(
        equity,
        48,
        basis
      ),
  };
}

/* ============================================================
   WARNINGS
============================================================ */

export function getOfferEquityWarnings(
  offer: OfferInput,
  basis:
    OfferEquityBasisResult
): string[] {
  const warnings: string[] =
    [];

  const equity =
    offer.equity;

  if (
    equity.type === "NONE"
  ) {
    return warnings;
  }

  if (equity.type === "UNKNOWN") {
    warnings.push(
      "The offer letter does not clearly confirm whether equity is included. This is not treated as zero equity or as no equity."
    );
  }

  const missing =
    getMissingEquityFields(
      offer
    );

  if (
    missing.length > 0
  ) {
    warnings.push(
      `Equity analysis is missing: ${missing.join(
        ", "
      )}.`
    );
  }

  if (
    basis.basis ===
    "EMPLOYER_HEADLINE"
  ) {
    warnings.push(
      "Only the employer-presented headline equity value is available. It is not treated as independently verified economic value."
    );
  }

  if (
    !basis.reliableForModeling
  ) {
    warnings.push(
      "The available equity value basis is not sufficient for a high-confidence economic comparison."
    );
  }

  if (
    equity.companyStatus ===
    "UNLISTED"
  ) {
    warnings.push(
      "Private-company equity may be illiquid and may not have an immediate market for sale."
    );
  }

  if (
    equity.expectedDilutionPercentage >
    0
  ) {
    warnings.push(
      `The model applies ${equity.expectedDilutionPercentage.toFixed(
        2
      )}% expected dilution to the modeled equity value.`
    );
  }

  if (
    equity.type === "ESOP"
  ) {
    warnings.push(
      "ESOP exercise may require employee capital and may create tax consequences. Phase 4 tax integration is intentionally not active in this equity engine yet."
    );
  }

  if (
    equity.vestingFrequency ===
    "CUSTOM"
  ) {
    warnings.push(
      "Custom vesting schedules are not fully modeled in Phase 4 V1. The standard cliff-plus-monthly model is used for comparison."
    );
  }

  if (
    equity.vestingFrequency ===
    "QUARTERLY" ||
    equity.vestingFrequency ===
    "SEMI_ANNUAL" ||
    equity.vestingFrequency ===
    "ANNUAL"
  ) {
    warnings.push(
      "Phase 4 V1 models vesting continuously after the cliff for horizon comparison. Exact non-monthly vesting dates may differ."
    );
  }

  return warnings;
}

/* ============================================================
   ASSUMPTIONS
============================================================ */

export function getOfferEquityAssumptions():
  string[] {
  return [
    "Offer equity is modeled separately from guaranteed cash compensation.",
    "Employer-presented headline ESOP or equity value is not automatically treated as verified economic value.",
    "The model uses listed share price, current FMV or a valuation-per-share basis when available.",
    "A standard 25% cliff vest followed by monthly vesting of the remaining 75% is used for standard ESOP comparison schedules.",
    "No-cliff schedules are modeled using straight-line vesting across the full vesting duration.",
    "Bear, Base and Bull values use the scenario multipliers supplied with the offer model.",
    "Expected dilution reduces modeled post-dilution equity value using a simplified relative-dilution assumption.",
    "For ESOPs, exercise capital equals vested options multiplied by the exercise price.",
    "RSUs and direct stock awards are modeled without an option exercise-price requirement in this engine.",
    "Private-company equity is treated as lower-liquidity and higher-risk than listed equity.",
    "Modeled equity value is not the same as guaranteed realizable cash.",
    "Indian exercise-stage and sale-stage tax are intentionally not calculated here. Phase 4 will connect to the established tax engine rather than duplicating tax logic.",
    "Salary, bonus and other cash compensation are not calculated in this equity engine.",
  ];
}

/* ============================================================
   COMPLETE EQUITY ANALYSIS
============================================================ */

export function analyzeOfferEquity(
  offer: OfferInput
): OfferEquityAnalysis {
  const hasEquity =
    offerHasEquity(
      offer.equity
    );

  const missingFields =
    getMissingEquityFields(
      offer
    );

  const hasSufficientData =
    hasSufficientEquityData(
      offer
    );

  const basis =
    determineEquityValueBasis(
      offer.equity
    );

  const liquidity =
    determineOfferLiquidity(
      offer.equity
    );

  const risk =
    determineOfferEquityRisk(
      offer.equity,
      basis
    );

  const horizons =
    calculateOfferEquityHorizons(
      offer.equity,
      basis
    );

  const warnings =
    getOfferEquityWarnings(
      offer,
      basis
    );

  const assumptions =
    getOfferEquityAssumptions();

  return {
    hasEquity,

    hasSufficientData,

    missingFields,

    basis,

    liquidity,

    risk,

    horizons,

    warnings,

    assumptions,
  };
}

/* ============================================================
   EQUITY REALITY SUMMARY

   This will later power cards such as:

   EMPLOYER HEADLINE
   ₹12,00,000

   BASE MODELED 4Y
   ₹9,60,000

   EXERCISE CAPITAL
   ₹2,31,250

   LIQUIDITY
   LOW
============================================================ */

export function getEquityRealitySummary(
  offer: OfferInput
): {
  hasEquity: boolean;

  employerHeadlineEquityValue: number;

  basis: OfferEquityValueBasis;

  basisUnitValue: number;

  vestedAt12Months: number;

  vestedAt24Months: number;

  vestedAt36Months: number;

  vestedAt48Months: number;

  baseValueAt12Months: number;

  baseValueAt24Months: number;

  baseValueAt36Months: number;

  baseValueAt48Months: number;

  exerciseCapitalAt48Months: number;

  liquidity: OfferLiquidityLevel;

  risk: OfferRiskLevel;

  taxIntegrated: boolean;
} {
  const analysis =
    analyzeOfferEquity(
      offer
    );

  return {
    hasEquity:
      analysis.hasEquity,

    employerHeadlineEquityValue:
      safeMoney(
        offer.equity
          .employerHeadlineEquityValue
      ),

    basis:
      analysis.basis.basis,

    basisUnitValue:
      analysis.basis.unitValue,

    vestedAt12Months:
      analysis.horizons[12]
        .vesting
        .vestedOptionsOrShares,

    vestedAt24Months:
      analysis.horizons[24]
        .vesting
        .vestedOptionsOrShares,

    vestedAt36Months:
      analysis.horizons[36]
        .vesting
        .vestedOptionsOrShares,

    vestedAt48Months:
      analysis.horizons[48]
        .vesting
        .vestedOptionsOrShares,

    baseValueAt12Months:
      analysis.horizons[12]
        .base
        .postDilutionNetEquityValue,

    baseValueAt24Months:
      analysis.horizons[24]
        .base
        .postDilutionNetEquityValue,

    baseValueAt36Months:
      analysis.horizons[36]
        .base
        .postDilutionNetEquityValue,

    baseValueAt48Months:
      analysis.horizons[48]
        .base
        .postDilutionNetEquityValue,

    exerciseCapitalAt48Months:
      analysis.horizons[48]
        .base
        .exerciseCost,

    liquidity:
      analysis.liquidity,

    risk:
      analysis.risk,

    taxIntegrated:
      false,
  };
}

import {
  calculateAdvancedTax,
  type AdvancedTaxResult,
} from "@/lib/esop/tax";

import {
  calculateVesting,
} from "@/lib/esop/vesting";

/* ============================================================
   PHASE 3 — EXERCISE DECISION INTELLIGENCE
============================================================ */

export type ExerciseStrategyPercent = 0 | 25 | 50 | 75 | 100;
export type ExerciseScenarioName = "Bear" | "Base" | "Bull";
export type ExerciseAnalysisContext = "TODAY" | "FUTURE_PLANNER";
export type ExerciseRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ExerciseDecisionSignal =
  | "FAVORABLE"
  | "BALANCED"
  | "CAUTION"
  | "UNAVAILABLE";

export type ExerciseTimingStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "NO_EXPIRY";

export type ExerciseInput = {
  /* CONFIRMED / SHARED GRANT FACTS */
  totalOptions: number;
  vestedOptions: number;
  strikePrice: number;
  currency: string;

  totalCompanyShares: number;
  currentCompanyValuation: number;

  vestingPeriodMonths: number;
  cliffMonths: number;
  monthsCompleted: number;

  expiryDate?: string | null;
  postTerminationExerciseDays?: number | null;

  /* TODAY EXERCISE SCENARIO */
  exerciseFMV: number;
  exercisePercentage: number;
  customExerciseOptions?: number;

  /* SHARED EXIT / TAX ASSUMPTIONS */
  exitValuation: number;
  futureDilutionPercentage: number;
  otherAnnualIncome: number;
  holdingPeriodMonths: number;
  equityType: "UNLISTED" | "LISTED";
  taxRegime: "NEW" | "OLD";

  /* USER PLANNING ASSUMPTIONS */
  opportunityCostRate: number;
  expectedYearsToLiquidity: number;

  waitMonths: number;
  futureExerciseFMV: number;

  /* PHASE 3 — CASH BUDGET MODE */
  exerciseBudget?: number;
};

export type ExerciseScenarioResult = {
  name: ExerciseScenarioName;
  description: string;
  exitValuation: number;
  postDilutionSharePrice: number;
  grossSaleValue: number;
  exerciseCost: number;
  estimatedTax: number;
  estimatedIncomeTax: number;
  estimatedCapitalGainsTax: number;
  estimatedTakeHome: number;
  netEconomicOutcome: number;
  returnMultiple: number;
  roiPercentage: number;
  tax: AdvancedTaxResult;
};

export type ExerciseStrategyResult = {
  percentage: ExerciseStrategyPercent;
  options: number;
  exerciseCost: number;
  exerciseStageTax: number;
  totalCashRequired: number;
  baseEstimatedTakeHome: number;
  baseNetEconomicOutcome: number;
  baseReturnMultiple: number;
};

export type ExerciseStrategyIntelligence = {
  lowestCashStrategy: ExerciseStrategyResult | null;
  lowestTaxStrategy: ExerciseStrategyResult | null;
  highestTakeHomeStrategy: ExerciseStrategyResult | null;
  highestReturnStrategy: ExerciseStrategyResult | null;
  balancedStrategy: ExerciseStrategyResult | null;
  maximumOptionalityStrategy: ExerciseStrategyResult | null;
};

export type ExerciseBudgetResult = {
  budget: number;
  affordableOptions: number;
  affordablePercentage: number;
  exerciseCost: number;
  exerciseStageTax: number;
  totalCashRequired: number;
  unusedBudget: number;
  baseEstimatedTakeHome: number;
  baseReturnMultiple: number;
};

export type ExerciseNowVsWaitIntelligence = {
  optionsDifference: number;
  cashDifference: number;
  taxDifference: number;
  takeHomeDifference: number;
  cashPreservedToday: number;
  interpretation: string;
};

export type ExerciseDecisionScorecard = {
  capitalBurden: ExerciseRiskLevel;
  taxBurden: ExerciseRiskLevel;
  liquidityExposure: ExerciseRiskLevel;
  deadlinePressure: ExerciseRiskLevel;
  optionality: ExerciseRiskLevel;
  modeledUpsideMultiple: number;
  headline: string;
  summary: string;
};

export type ExerciseBreakEvenResult = {
  strikeBreakEvenSharePrice: number;
  cashRecoverySharePrice: number;
  cashRecoveryCompanyValuation: number;
  baseExitSharePrice: number;
  marginAboveRecoveryPrice: number;
};

export type FutureExerciseResult = {
  waitMonths: number;
  futureMonthsCompleted: number;
  futureVestedOptions: number;
  newlyVestedOptions: number;
  futureVestedPercentage: number;
  futureExerciseFMV: number;

  selectedFutureOptions: number;
  futureExerciseCost: number;
  futureExerciseStageTax: number;
  futureTotalCashRequired: number;

  cashIncreaseVsToday: number;
  taxIncreaseVsToday: number;

  futureBaseEstimatedTakeHome: number;
  futureBaseNetEconomicOutcome: number;

  daysConsumedFromExpiry: number;
  remainingDaysToExpiry: number | null;
};

export type ExerciseTimingComparison = {
  exerciseNow: {
    options: number;
    exerciseCost: number;
    exerciseStageTax: number;
    totalCashRequired: number;
    opportunityCost: number;
    economicCashCommitment: number;
    baseEstimatedTakeHome: number;
    baseNetEconomicOutcome: number;
  };

  wait: {
    waitMonths: number;
    futureVestedOptions: number;
    selectedFutureOptions: number;
    futureExerciseFMV: number;
    cashRequiredToday: number;
    taxRequiredToday: number;
    cashPreservedToday: number;
    futureExerciseCost: number;
    futureExerciseStageTax: number;
    futureTotalCashRequired: number;
    futureBaseEstimatedTakeHome: number;
    futureBaseNetEconomicOutcome: number;
    optionalityPreserved: boolean;
    expiryRisk: ExerciseRiskLevel;
    terminationWindowRisk: ExerciseRiskLevel;
  };
};

export type LeaveCompanyResult = {
  postTerminationExerciseDays: number | null;
  modeledExerciseDeadline: string | null;
  vestedOptionsIfLeavingToday: number;
  unvestedOptionsAtRisk: number;
  exerciseCostForAllVested: number;
  exerciseStageTaxForAllVested: number;
  totalCashPotentiallyRequired: number;
  risk: ExerciseRiskLevel;
  message: string;
};

export type ExerciseDecisionFactor = {
  key:
    | "INTRINSIC_VALUE"
    | "CASH_REQUIREMENT"
    | "TAX_BURDEN"
    | "LIQUIDITY"
    | "DILUTION"
    | "EXPIRY"
    | "TERMINATION_WINDOW"
    | "OPTIONALITY";

  label: string;
  signal: ExerciseDecisionSignal;
  risk: ExerciseRiskLevel;
  headline: string;
  explanation: string;

  /* Context shown by the UI so TODAY and FUTURE are never confused. */
  context: ExerciseAnalysisContext;
  contextLabel: string;
};

export type ExerciseTimingResult = {
  status: ExerciseTimingStatus;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  postTerminationExerciseDays: number | null;
  expiryRisk: ExerciseRiskLevel;
  terminationWindowRisk: ExerciseRiskLevel;
};

export type ExerciseDecisionResult = {
  availableOptions: number;
  selectedOptions: number;
  selectedPercentage: number;
  unexercisedVestedOptions: number;

  currentShareValue: number;
  intrinsicValuePerOption: number;
  intrinsicValueTotal: number;

  exerciseCost: number;
  exerciseStageTax: number;
  totalCashRequired: number;

  opportunityCost: number;
  economicCashCommitment: number;

  currentOwnershipPercentage: number;
  postDilutionOwnershipPercentage: number;

  breakEven: ExerciseBreakEvenResult;
  scenarios: ExerciseScenarioResult[];
  strategies: ExerciseStrategyResult[];

  strategyIntelligence: ExerciseStrategyIntelligence;
  budget: ExerciseBudgetResult;
  nowVsWaitIntelligence: ExerciseNowVsWaitIntelligence;
  scorecard: ExerciseDecisionScorecard;

  future: FutureExerciseResult;
  timingComparison: ExerciseTimingComparison;
  leaveCompany: LeaveCompanyResult;

  timing: ExerciseTimingResult;
  decisionFactors: ExerciseDecisionFactor[];
  overallSignal: ExerciseDecisionSignal;

  isFuturePlanningMode: boolean;

  /* Single source of truth for page labels and premium exports. */
  analysisContext: ExerciseAnalysisContext;
  analysisContextLabel: string;
  analysisWaitMonths: number;
  analysisAvailableOptions: number;
  analysisSelectedOptions: number;
  analysisExerciseFMV: number;
  analysisExerciseCost: number;
  analysisExerciseStageTax: number;
  analysisTotalCashRequired: number;

  assumptions: string[];
};

/* ============================================================
   LOGGING
============================================================ */

const LOG_PREFIX = "[EVC:EXERCISE]";

function logExercise(
  event: string,
  payload?: Record<string, unknown>
) {
  if (process.env.NODE_ENV === "production") return;
  console.info(LOG_PREFIX, event, payload ?? {});
}

function warnExercise(
  event: string,
  payload?: Record<string, unknown>
) {
  console.warn(LOG_PREFIX, event, payload ?? {});
}

/* ============================================================
   SAFE HELPERS
============================================================ */

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function positiveNumber(value: number) {
  return Math.max(safeNumber(value), 0);
}

function clampPercentage(value: number) {
  return Math.min(Math.max(safeNumber(value), 0), 100);
}

function roundOptions(value: number) {
  return Math.max(Math.floor(positiveNumber(value)), 0);
}

function safeDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/* ============================================================
   SELECTED OPTIONS
============================================================ */

function calculateSelectedOptions(
  availableOptions: number,
  percentage: number,
  customExerciseOptions?: number
) {
  if (
    customExerciseOptions !== undefined &&
    Number.isFinite(customExerciseOptions)
  ) {
    return Math.min(
      roundOptions(customExerciseOptions),
      availableOptions
    );
  }

  return Math.min(
    roundOptions(
      availableOptions *
        (clampPercentage(percentage) / 100)
    ),
    availableOptions
  );
}

/* ============================================================
   POST-DILUTION SHARE PRICE
============================================================ */

function calculatePostDilutionSharePrice(
  exitValuation: number,
  totalCompanyShares: number,
  dilutionPercentage: number
) {
  if (totalCompanyShares <= 0) return 0;

  return (
    (positiveNumber(exitValuation) /
      totalCompanyShares) *
    (1 - clampPercentage(dilutionPercentage) / 100)
  );
}

/* ============================================================
   EXERCISE-STAGE TAX
============================================================ */

function calculateExerciseStageTax(
  options: number,
  input: ExerciseInput,
  exerciseFMV = input.exerciseFMV
) {
  if (options <= 0) return 0;

  const tax = calculateAdvancedTax({
    vestedShares: options,
    strikePrice: positiveNumber(input.strikePrice),
    exerciseFMV: positiveNumber(exerciseFMV),

    /*
     * Sale price = exercise FMV isolates the exercise-stage
     * perquisite tax because modeled capital gain becomes zero.
     */
    salePrice: positiveNumber(exerciseFMV),

    otherAnnualIncome: positiveNumber(
      input.otherAnnualIncome
    ),
    holdingPeriodMonths: 0,
    equityType: input.equityType,
    taxRegime: input.taxRegime,
  });

  return Math.max(tax.estimatedIncomeTax, 0);
}

/* ============================================================
   OPPORTUNITY COST
============================================================ */

function calculateOpportunityCost(
  cash: number,
  annualRate: number,
  years: number
) {
  const principal = positiveNumber(cash);
  const rate = clampPercentage(annualRate) / 100;
  const duration = positiveNumber(years);

  if (
    principal <= 0 ||
    rate <= 0 ||
    duration <= 0
  ) {
    return 0;
  }

  return Math.max(
    principal *
      (Math.pow(1 + rate, duration) - 1),
    0
  );
}

/* ============================================================
   TIMING
============================================================ */

function calculateTiming(
  expiryDate?: string | null,
  postTerminationExerciseDays?: number | null
): ExerciseTimingResult {
  const expiry = safeDate(expiryDate);

  let daysUntilExpiry: number | null = null;
  let status: ExerciseTimingStatus = "NO_EXPIRY";
  let expiryRisk: ExerciseRiskLevel = "LOW";

  if (expiry) {
    const difference =
      expiry.getTime() - Date.now();

    daysUntilExpiry = Math.ceil(
      difference / 86_400_000
    );

    if (daysUntilExpiry < 0) {
      status = "EXPIRED";
      expiryRisk = "CRITICAL";
    } else if (daysUntilExpiry <= 90) {
      status = "EXPIRING_SOON";
      expiryRisk = "CRITICAL";
    } else if (daysUntilExpiry <= 365) {
      status = "EXPIRING_SOON";
      expiryRisk = "HIGH";
    } else if (daysUntilExpiry <= 730) {
      status = "ACTIVE";
      expiryRisk = "MODERATE";
    } else {
      status = "ACTIVE";
      expiryRisk = "LOW";
    }
  }

  const terminationDays =
    postTerminationExerciseDays === null ||
    postTerminationExerciseDays === undefined
      ? null
      : Math.max(
          Math.floor(
            positiveNumber(
              postTerminationExerciseDays
            )
          ),
          0
        );

  let terminationWindowRisk:
    ExerciseRiskLevel = "LOW";

  if (terminationDays !== null) {
    if (terminationDays <= 30) {
      terminationWindowRisk = "CRITICAL";
    } else if (terminationDays <= 90) {
      terminationWindowRisk = "HIGH";
    } else if (terminationDays <= 180) {
      terminationWindowRisk = "MODERATE";
    }
  }

  return {
    status,
    expiryDate:
      expiry?.toISOString() ?? null,
    daysUntilExpiry,
    postTerminationExerciseDays:
      terminationDays,
    expiryRisk,
    terminationWindowRisk,
  };
}

/* ============================================================
   SCENARIO CALCULATION
============================================================ */

function calculateScenario(
  name: ExerciseScenarioName,
  description: string,
  exitValuation: number,
  selectedOptions: number,
  input: ExerciseInput,
  exerciseFMV = input.exerciseFMV
): ExerciseScenarioResult {
  const totalCompanyShares = Math.max(
    positiveNumber(input.totalCompanyShares),
    1
  );

  const postDilutionSharePrice =
    calculatePostDilutionSharePrice(
      exitValuation,
      totalCompanyShares,
      input.futureDilutionPercentage
    );

  const exerciseCost =
    selectedOptions *
    positiveNumber(input.strikePrice);

  const tax = calculateAdvancedTax({
    vestedShares: selectedOptions,
    strikePrice: positiveNumber(input.strikePrice),
    exerciseFMV: positiveNumber(exerciseFMV),
    salePrice: postDilutionSharePrice,
    otherAnnualIncome: positiveNumber(
      input.otherAnnualIncome
    ),
    holdingPeriodMonths: positiveNumber(
      input.holdingPeriodMonths
    ),
    equityType: input.equityType,
    taxRegime: input.taxRegime,
  });

  const grossSaleValue =
    selectedOptions *
    postDilutionSharePrice;

  const estimatedTakeHome =
    Math.max(tax.netTakeHome, 0);

  /*
   * IMPORTANT:
   * tax.netTakeHome already deducts exercise cost
   * and modeled tax. Do not subtract those again.
   */
  const netEconomicOutcome =
    estimatedTakeHome;

  const initialCashOutlay =
    exerciseCost +
    Math.max(tax.estimatedIncomeTax, 0);

  const returnMultiple =
    initialCashOutlay > 0
      ? estimatedTakeHome /
        initialCashOutlay
      : 0;

  const roiPercentage =
    initialCashOutlay > 0
      ? ((estimatedTakeHome -
          initialCashOutlay) /
          initialCashOutlay) *
        100
      : 0;

  return {
    name,
    description,
    exitValuation:
      positiveNumber(exitValuation),
    postDilutionSharePrice,
    grossSaleValue,
    exerciseCost,
    estimatedTax:
      tax.totalEstimatedTax,
    estimatedIncomeTax:
      tax.estimatedIncomeTax,
    estimatedCapitalGainsTax:
      tax.capitalGainsTax,
    estimatedTakeHome,
    netEconomicOutcome,
    returnMultiple,
    roiPercentage,
    tax,
  };
}

/* ============================================================
   BREAK EVEN
============================================================ */

function calculateBreakEven(
  selectedOptions: number,
  totalCompanyShares: number,
  dilutionPercentage: number,
  exerciseCost: number,
  exerciseStageTax: number,
  strikePrice: number,
  baseExitValuation: number
): ExerciseBreakEvenResult {
  const dilutionMultiplier =
    1 -
    clampPercentage(dilutionPercentage) /
      100;

  const totalCash =
    exerciseCost +
    exerciseStageTax;

  const cashRecoverySharePrice =
    selectedOptions > 0
      ? totalCash /
        selectedOptions
      : 0;

  const cashRecoveryCompanyValuation =
    dilutionMultiplier > 0
      ? (cashRecoverySharePrice *
          totalCompanyShares) /
        dilutionMultiplier
      : 0;

  const baseExitSharePrice =
    totalCompanyShares > 0
      ? (positiveNumber(
          baseExitValuation
        ) /
          totalCompanyShares) *
        dilutionMultiplier
      : 0;

  return {
    strikeBreakEvenSharePrice:
      positiveNumber(strikePrice),

    cashRecoverySharePrice,

    cashRecoveryCompanyValuation,

    baseExitSharePrice,

    marginAboveRecoveryPrice:
      baseExitSharePrice -
      cashRecoverySharePrice,
  };
}

/* ============================================================
   PARTIAL STRATEGIES
============================================================ */

function calculateStrategy(
  percentage: ExerciseStrategyPercent,
  availableOptions: number,
  input: ExerciseInput
): ExerciseStrategyResult {
  const options =
    calculateSelectedOptions(
      availableOptions,
      percentage
    );

  const exerciseCost =
    options *
    positiveNumber(input.strikePrice);

  const exerciseStageTax =
    calculateExerciseStageTax(
      options,
      input
    );

  const totalCashRequired =
    exerciseCost +
    exerciseStageTax;

  const base =
    calculateScenario(
      "Base",
      "Your current exit assumption",
      input.exitValuation,
      options,
      input
    );

  return {
    percentage,
    options,
    exerciseCost,
    exerciseStageTax,
    totalCashRequired,
    baseEstimatedTakeHome:
      base.estimatedTakeHome,
    baseNetEconomicOutcome:
      base.netEconomicOutcome,
    baseReturnMultiple:
      base.returnMultiple,
  };
}

/* ============================================================
   PHASE 3 — STRATEGY INTELLIGENCE
============================================================ */

function buildStrategyIntelligence(
  strategies: ExerciseStrategyResult[]
): ExerciseStrategyIntelligence {
  const active = strategies.filter(
    (strategy) => strategy.options > 0
  );

  if (active.length === 0) {
    return {
      lowestCashStrategy: null,
      lowestTaxStrategy: null,
      highestTakeHomeStrategy: null,
      highestReturnStrategy: null,
      balancedStrategy: null,
      maximumOptionalityStrategy: null,
    };
  }

  const lowestCashStrategy = active.reduce(
    (best, current) =>
      current.totalCashRequired < best.totalCashRequired
        ? current
        : best
  );

  const lowestTaxStrategy = active.reduce(
    (best, current) =>
      current.exerciseStageTax < best.exerciseStageTax
        ? current
        : best
  );

  const highestTakeHomeStrategy = active.reduce(
    (best, current) =>
      current.baseEstimatedTakeHome > best.baseEstimatedTakeHome
        ? current
        : best
  );

  const highestReturnStrategy = active.reduce(
    (best, current) =>
      current.baseReturnMultiple > best.baseReturnMultiple
        ? current
        : best
  );

  const balancedStrategy =
    active.find(
      (strategy) => strategy.percentage === 50
    ) ??
    active[Math.floor(active.length / 2)] ??
    null;

  return {
    lowestCashStrategy,
    lowestTaxStrategy,
    highestTakeHomeStrategy,
    highestReturnStrategy,
    balancedStrategy,
    maximumOptionalityStrategy: lowestCashStrategy,
  };
}

/* ============================================================
   PHASE 3 — CASH BUDGET MODE
============================================================ */

function calculateBudgetPlan(
  budget: number,
  availableOptions: number,
  input: ExerciseInput
): ExerciseBudgetResult {
  const safeBudget = positiveNumber(budget);
  const available = roundOptions(availableOptions);

  if (safeBudget <= 0 || available <= 0) {
    return {
      budget: safeBudget,
      affordableOptions: 0,
      affordablePercentage: 0,
      exerciseCost: 0,
      exerciseStageTax: 0,
      totalCashRequired: 0,
      unusedBudget: safeBudget,
      baseEstimatedTakeHome: 0,
      baseReturnMultiple: 0,
    };
  }

  let low = 0;
  let high = available;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    const exerciseCost =
      mid * positiveNumber(input.strikePrice);

    const exerciseStageTax =
      calculateExerciseStageTax(
        mid,
        input
      );

    const cash =
      exerciseCost + exerciseStageTax;

    if (cash <= safeBudget) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const exerciseCost =
    best * positiveNumber(input.strikePrice);

  const exerciseStageTax =
    calculateExerciseStageTax(
      best,
      input
    );

  const totalCashRequired =
    exerciseCost + exerciseStageTax;

  const base =
    calculateScenario(
      "Base",
      "Cash-budget Base outcome",
      input.exitValuation,
      best,
      input
    );

  return {
    budget: safeBudget,
    affordableOptions: best,
    affordablePercentage:
      available > 0
        ? (best / available) * 100
        : 0,
    exerciseCost,
    exerciseStageTax,
    totalCashRequired,
    unusedBudget:
      Math.max(
        safeBudget - totalCashRequired,
        0
      ),
    baseEstimatedTakeHome:
      base.estimatedTakeHome,
    baseReturnMultiple:
      base.returnMultiple,
  };
}

/* ============================================================
   PHASE 3 — NOW VS WAIT INTELLIGENCE
============================================================ */

function buildNowVsWaitIntelligence(
  comparison: ExerciseTimingComparison
): ExerciseNowVsWaitIntelligence {
  const optionsDifference =
    comparison.wait.selectedFutureOptions -
    comparison.exerciseNow.options;

  const cashDifference =
    comparison.wait.futureTotalCashRequired -
    comparison.exerciseNow.totalCashRequired;

  const taxDifference =
    comparison.wait.futureExerciseStageTax -
    comparison.exerciseNow.exerciseStageTax;

  const takeHomeDifference =
    comparison.wait.futureBaseEstimatedTakeHome -
    comparison.exerciseNow.baseEstimatedTakeHome;

  let interpretation =
    "Waiting preserves cash today but changes future vesting, FMV, tax and timing exposure.";

  if (
    comparison.exerciseNow.options <= 0 &&
    comparison.wait.selectedFutureOptions > 0
  ) {
    interpretation =
      "Nothing is exercisable today. Waiting reaches a modeled future vesting position, but future FMV, tax and liquidity remain uncertain.";
  } else if (
    cashDifference > 0 &&
    takeHomeDifference > 0
  ) {
    interpretation =
      "Waiting models greater future cash commitment and greater Base take-home. The additional modeled upside comes with more capital and future-assumption risk.";
  } else if (
    cashDifference > 0 &&
    takeHomeDifference <= 0
  ) {
    interpretation =
      "Waiting requires more modeled cash without improving Base take-home under the current assumptions.";
  } else if (
    cashDifference <= 0 &&
    takeHomeDifference > 0
  ) {
    interpretation =
      "Under the current assumptions, waiting models lower or similar cash commitment with higher Base take-home, while future inputs remain uncertain.";
  }

  return {
    optionsDifference,
    cashDifference,
    taxDifference,
    takeHomeDifference,
    cashPreservedToday:
      comparison.wait.cashPreservedToday,
    interpretation,
  };
}

/* ============================================================
   PHASE 3 — DECISION SCORECARD
============================================================ */

function buildDecisionScorecard(
  input: ExerciseInput,
  selectedOptions: number,
  availableOptions: number,
  totalCashRequired: number,
  exerciseStageTax: number,
  timing: ExerciseTimingResult,
  baseScenario: ExerciseScenarioResult
): ExerciseDecisionScorecard {
  const income =
    positiveNumber(
      input.otherAnnualIncome
    );

  const cashRatio =
    income > 0
      ? totalCashRequired / income
      : 0;

  const capitalBurden: ExerciseRiskLevel =
    totalCashRequired <= 0
      ? "LOW"
      : cashRatio >= 0.5
        ? "CRITICAL"
        : cashRatio >= 0.25
          ? "HIGH"
          : cashRatio >= 0.1
            ? "MODERATE"
            : "LOW";

  const taxRatio =
    totalCashRequired > 0
      ? exerciseStageTax /
        totalCashRequired
      : 0;

  const taxBurden: ExerciseRiskLevel =
    exerciseStageTax <= 0
      ? "LOW"
      : taxRatio >= 0.5
        ? "HIGH"
        : taxRatio >= 0.25
          ? "MODERATE"
          : "LOW";

  const liquidityExposure: ExerciseRiskLevel =
    selectedOptions > 0
      ? "HIGH"
      : "LOW";

  const deadlinePressure: ExerciseRiskLevel =
    timing.expiryRisk === "CRITICAL" ||
    timing.terminationWindowRisk === "CRITICAL"
      ? "CRITICAL"
      : timing.expiryRisk === "HIGH" ||
          timing.terminationWindowRisk === "HIGH"
        ? "HIGH"
        : timing.expiryRisk === "MODERATE" ||
            timing.terminationWindowRisk === "MODERATE"
          ? "MODERATE"
          : "LOW";

  const selectedShare =
    availableOptions > 0
      ? selectedOptions /
        availableOptions
      : 0;

  const optionality: ExerciseRiskLevel =
    selectedShare >= 1
      ? "HIGH"
      : selectedShare >= 0.5
        ? "MODERATE"
        : "LOW";

  const modeledUpsideMultiple =
    Math.max(
      baseScenario.returnMultiple,
      0
    );

  let headline =
    "The exercise decision contains meaningful trade-offs.";

  if (selectedOptions <= 0) {
    headline =
      "No immediate exercise commitment is modeled in this context.";
  } else if (
    capitalBurden === "HIGH" ||
    capitalBurden === "CRITICAL" ||
    deadlinePressure === "HIGH" ||
    deadlinePressure === "CRITICAL"
  ) {
    headline =
      "Capital or timing pressure deserves careful review before committing.";
  } else if (
    modeledUpsideMultiple >= 5 &&
    capitalBurden === "LOW"
  ) {
    headline =
      "The modeled upside is strong relative to the current cash burden, subject to liquidity and company-outcome risk.";
  }

  return {
    capitalBurden,
    taxBurden,
    liquidityExposure,
    deadlinePressure,
    optionality,
    modeledUpsideMultiple,
    headline,
    summary:
      `Capital burden ${capitalBurden.toLowerCase()}, ` +
      `tax burden ${taxBurden.toLowerCase()}, ` +
      `liquidity exposure ${liquidityExposure.toLowerCase()}, ` +
      `deadline pressure ${deadlinePressure.toLowerCase()}, ` +
      `with a Base modeled return of ${modeledUpsideMultiple.toFixed(2)}x.`,
  };
}

/* ============================================================
   FUTURE EXERCISE PLANNER
============================================================ */

function calculateFutureExercise(
  input: ExerciseInput,
  todaySelectedOptions: number,
  todayTotalCashRequired: number,
  todayExerciseStageTax: number,
  timing: ExerciseTimingResult
): FutureExerciseResult {
  const waitMonths = Math.max(
    Math.round(
      positiveNumber(input.waitMonths)
    ),
    0
  );

  const futureMonthsCompleted =
    Math.min(
      Math.max(
        Math.round(
          positiveNumber(
            input.monthsCompleted
          )
        ) + waitMonths,
        0
      ),
      Math.max(
        Math.round(
          positiveNumber(
            input.vestingPeriodMonths
          )
        ),
        1
      )
    );

  const futureVesting =
    calculateVesting({
      totalOptions:
        positiveNumber(
          input.totalOptions
        ),
      exercisePrice:
        positiveNumber(
          input.strikePrice
        ),
      vestingPeriodMonths:
        Math.max(
          Math.round(
            positiveNumber(
              input.vestingPeriodMonths
            )
          ),
          1
        ),
      cliffMonths:
        Math.max(
          Math.round(
            positiveNumber(
              input.cliffMonths
            )
          ),
          0
        ),
      monthsCompleted:
        futureMonthsCompleted,
    });

  const futureVestedOptions =
    roundOptions(
      futureVesting.vestedOptions
    );

  const currentVested =
    roundOptions(
      input.vestedOptions
    );

  const newlyVestedOptions =
    Math.max(
      futureVestedOptions -
        currentVested,
      0
    );

  const futureExerciseFMV =
    positiveNumber(
      input.futureExerciseFMV
    );

  /*
   * The future planner applies the same selected %
   * to the future vested pool. Custom quantity remains
   * capped to what is vested at that future date.
   */
  const selectedFutureOptions =
    calculateSelectedOptions(
      futureVestedOptions,
      input.exercisePercentage,
      input.customExerciseOptions
    );

  const futureExerciseCost =
    selectedFutureOptions *
    positiveNumber(
      input.strikePrice
    );

  const futureExerciseStageTax =
    calculateExerciseStageTax(
      selectedFutureOptions,
      input,
      futureExerciseFMV
    );

  const futureTotalCashRequired =
    futureExerciseCost +
    futureExerciseStageTax;

  const futureBase =
    calculateScenario(
      "Base",
      "Base exit after waiting",
      input.exitValuation,
      selectedFutureOptions,
      input,
      futureExerciseFMV
    );

  const daysConsumedFromExpiry =
    Math.round(
      waitMonths *
      30.4375
    );

  const remainingDaysToExpiry =
    timing.daysUntilExpiry === null
      ? null
      : timing.daysUntilExpiry -
        daysConsumedFromExpiry;

  return {
    waitMonths,
    futureMonthsCompleted,
    futureVestedOptions,
    newlyVestedOptions,
    futureVestedPercentage:
      futureVesting.vestedPercent,
    futureExerciseFMV,

    selectedFutureOptions,
    futureExerciseCost,
    futureExerciseStageTax,
    futureTotalCashRequired,

    cashIncreaseVsToday:
      futureTotalCashRequired -
      todayTotalCashRequired,

    taxIncreaseVsToday:
      futureExerciseStageTax -
      todayExerciseStageTax,

    futureBaseEstimatedTakeHome:
      futureBase.estimatedTakeHome,

    futureBaseNetEconomicOutcome:
      futureBase.netEconomicOutcome,

    daysConsumedFromExpiry,
    remainingDaysToExpiry,
  };
}

/* ============================================================
   LEAVING-COMPANY MODEL
============================================================ */

function calculateLeaveCompany(
  input: ExerciseInput,
  timing: ExerciseTimingResult
): LeaveCompanyResult {
  const vested =
    roundOptions(
      input.vestedOptions
    );

  const total =
    roundOptions(
      input.totalOptions
    );

  const unvestedOptionsAtRisk =
    Math.max(
      total - vested,
      0
    );

  const exerciseCostForAllVested =
    vested *
    positiveNumber(
      input.strikePrice
    );

  const exerciseStageTaxForAllVested =
    calculateExerciseStageTax(
      vested,
      input
    );

  const totalCashPotentiallyRequired =
    exerciseCostForAllVested +
    exerciseStageTaxForAllVested;

  const days =
    timing.postTerminationExerciseDays;

  const deadline =
    days === null
      ? null
      : addDays(
          new Date(),
          days
        ).toISOString();

  let message =
    "The connected grant does not provide a confirmed post-termination exercise window.";

  if (days !== null) {
    message =
      vested > 0
        ? `If employment ended today, the connected grant indicates a ${days}-day modeled window for vested options.`
        : `If employment ended today, no options are currently vested; unvested options are modeled as at risk of forfeiture.`;
  }

  return {
    postTerminationExerciseDays:
      days,

    modeledExerciseDeadline:
      deadline,

    vestedOptionsIfLeavingToday:
      vested,

    unvestedOptionsAtRisk,

    exerciseCostForAllVested,

    exerciseStageTaxForAllVested,

    totalCashPotentiallyRequired,

    risk:
      timing
        .terminationWindowRisk,

    message,
  };
}

/* ============================================================
   DECISION FACTORS
============================================================ */

function buildDecisionFactors(
  input: ExerciseInput,
  selectedOptions: number,
  intrinsicValuePerOption: number,
  totalCashRequired: number,
  exerciseStageTax: number,
  timing: ExerciseTimingResult,
  context: ExerciseAnalysisContext,
  waitMonths: number
): ExerciseDecisionFactor[] {
  const factors:
    ExerciseDecisionFactor[] = [];

  const contextLabel =
    context === "FUTURE_PLANNER"
      ? `Future +${waitMonths}m`
      : "Today";

  const withContext = (
    factor: Omit<
      ExerciseDecisionFactor,
      "context" | "contextLabel"
    >
  ): ExerciseDecisionFactor => ({
    ...factor,
    context,
    contextLabel,
  });

  if (selectedOptions <= 0) {
    factors.push(withContext({
      key: "INTRINSIC_VALUE",
      label: "Intrinsic value",
      signal: "UNAVAILABLE",
      risk: "LOW",
      headline:
        context === "FUTURE_PLANNER"
          ? "No options selected in this future plan"
          : "No options selected today",
      explanation:
        context === "FUTURE_PLANNER"
          ? `The +${waitMonths} month scenario currently has no selected options. Choose an exercise percentage or quantity to model the future decision.`
          : "Use Future Exercise Planner when no options are currently vested, or select a vested exercise quantity when available.",
    }));
  } else if (
    intrinsicValuePerOption > 0
  ) {
    factors.push(withContext({
      key: "INTRINSIC_VALUE",
      label: "Intrinsic value",
      signal: "FAVORABLE",
      risk: "LOW",
      headline: "FMV is above strike",
      explanation:
        context === "FUTURE_PLANNER"
          ? `At +${waitMonths} months, the modeled FMV is above the strike price, so the selected future options have a positive intrinsic spread.`
          : "The modeled exercise FMV is above the strike price, so the selected vested options have a positive intrinsic spread.",
    }));
  } else {
    factors.push(withContext({
      key: "INTRINSIC_VALUE",
      label: "Intrinsic value",
      signal: "CAUTION",
      risk: "HIGH",
      headline: "No positive intrinsic spread",
      explanation:
        "The modeled exercise FMV is at or below strike price.",
    }));
  }

  const income =
    positiveNumber(
      input.otherAnnualIncome
    );

  const cashToIncome =
    income > 0
      ? totalCashRequired /
        income
      : 0;

  const cashRisk:
    ExerciseRiskLevel =
      cashToIncome >= 0.5
        ? "CRITICAL"
        : cashToIncome >= 0.25
          ? "HIGH"
          : cashToIncome >= 0.1
            ? "MODERATE"
            : "LOW";

  factors.push(withContext({
    key: "CASH_REQUIREMENT",
    label: "Cash commitment",
    signal:
      cashRisk === "LOW"
        ? "FAVORABLE"
        : cashRisk === "MODERATE"
          ? "BALANCED"
          : "CAUTION",
    risk: cashRisk,
    headline:
      totalCashRequired > 0
        ? "Capital is committed before liquidity"
        : "No immediate exercise capital",
    explanation:
      context === "FUTURE_PLANNER"
        ? `The +${waitMonths} month plan requires modeled exercise cash before liquidity. Compare that future requirement with your expected liquidity and reserves.`
        : "Compare exercise cash with your own liquidity needs and emergency reserves.",
  }));

  const taxShare =
    totalCashRequired > 0
      ? exerciseStageTax /
        totalCashRequired
      : 0;

  const taxRisk:
    ExerciseRiskLevel =
      taxShare >= 0.5
        ? "HIGH"
        : taxShare >= 0.25
          ? "MODERATE"
          : "LOW";

  factors.push(withContext({
    key: "TAX_BURDEN",
    label: "Exercise tax",
    signal:
      taxRisk === "LOW"
        ? "FAVORABLE"
        : taxRisk === "MODERATE"
          ? "BALANCED"
          : "CAUTION",
    risk: taxRisk,
    headline:
      exerciseStageTax > 0
        ? "Exercise may create tax before liquidity"
        : "No modeled exercise-stage tax",
    explanation:
      context === "FUTURE_PLANNER"
        ? `The +${waitMonths} month estimate uses the shared India Tax model with the future FMV assumption, current strike, income and tax regime.`
        : "The estimate uses the shared India Tax model and current FMV, strike, income and regime assumptions.",
  }));

  factors.push(withContext({
    key: "LIQUIDITY",
    label: "Liquidity",
    signal: "CAUTION",
    risk: "HIGH",
    headline: "Liquidity is not guaranteed",
    explanation:
      "Exercised shares may remain illiquid. Exit valuation is a scenario, not a promised transaction.",
  }));

  const dilution =
    clampPercentage(
      input.futureDilutionPercentage
    );

  const dilutionRisk:
    ExerciseRiskLevel =
      dilution >= 50
        ? "HIGH"
        : dilution >= 25
          ? "MODERATE"
          : "LOW";

  factors.push(withContext({
    key: "DILUTION",
    label: "Dilution",
    signal:
      dilutionRisk === "LOW"
        ? "FAVORABLE"
        : "BALANCED",
    risk: dilutionRisk,
    headline:
      `${dilution.toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 1,
        }
      )}% relative dilution modeled`,
    explanation:
      "Dilution reduces modeled ownership value without changing the number of exercised shares.",
  }));

  factors.push(withContext({
    key: "EXPIRY",
    label: "Grant expiry",
    signal:
      timing.expiryRisk === "LOW"
        ? "FAVORABLE"
        : timing.expiryRisk ===
            "MODERATE"
          ? "BALANCED"
          : "CAUTION",
    risk: timing.expiryRisk,
    headline:
      timing.daysUntilExpiry === null
        ? "No expiry date available"
        : timing.daysUntilExpiry < 0
          ? "Modeled grant expiry has passed"
          : `${timing.daysUntilExpiry.toLocaleString(
              "en-IN"
            )} days until expiry`,
    explanation:
      "Waiting preserves optionality but consumes remaining time before grant expiry.",
  }));

  factors.push(withContext({
    key: "TERMINATION_WINDOW",
    label: "Leaving-company window",
    signal:
      timing
        .postTerminationExerciseDays ===
      null
        ? "UNAVAILABLE"
        : timing
              .terminationWindowRisk ===
            "LOW"
          ? "FAVORABLE"
          : timing
                .terminationWindowRisk ===
              "MODERATE"
            ? "BALANCED"
            : "CAUTION",
    risk:
      timing
        .terminationWindowRisk,
    headline:
      timing
        .postTerminationExerciseDays ===
      null
        ? "Exercise window not confirmed"
        : `${timing.postTerminationExerciseDays} day post-termination window`,
    explanation:
      "Actual treatment after leaving depends on the plan, grant and company rules.",
  }));

  factors.push(withContext({
    key: "OPTIONALITY",
    label: "Optionality",
    signal: "BALANCED",
    risk: "MODERATE",
    headline:
      "Waiting preserves cash and choice",
    explanation:
      "Waiting can preserve cash today, but future FMV, tax, vesting, expiry and liquidity can change.",
  }));

  return factors;
}

function calculateOverallSignal(
  factors: ExerciseDecisionFactor[]
): ExerciseDecisionSignal {
  const critical =
    factors.filter(
      (f) =>
        f.risk === "CRITICAL"
    ).length;

  const high =
    factors.filter(
      (f) =>
        f.risk === "HIGH"
    ).length;

  const favorable =
    factors.filter(
      (f) =>
        f.signal ===
        "FAVORABLE"
    ).length;

  if (
    critical > 0 ||
    high >= 3
  ) {
    return "CAUTION";
  }

  if (
    favorable >= 4 &&
    high === 0
  ) {
    return "FAVORABLE";
  }

  return "BALANCED";
}

/* ============================================================
   MAIN CALCULATION
============================================================ */

export function calculateExerciseDecision(
  input: ExerciseInput
): ExerciseDecisionResult {
  logExercise(
    "calculation_started",
    {
      totalOptions:
        input.totalOptions,
      vestedOptions:
        input.vestedOptions,
      exercisePercentage:
        input.exercisePercentage,
      waitMonths:
        input.waitMonths,
      futureExerciseFMV:
        input.futureExerciseFMV,
      dilution:
        input.futureDilutionPercentage,
      exitValuation:
        input.exitValuation,
    }
  );

  const totalOptions =
    roundOptions(
      input.totalOptions
    );

  const availableOptions =
    Math.min(
      roundOptions(
        input.vestedOptions
      ),
      totalOptions
    );

  const selectedPercentage =
    clampPercentage(
      input.exercisePercentage
    );

  const selectedOptions =
    calculateSelectedOptions(
      availableOptions,
      selectedPercentage,
      input.customExerciseOptions
    );

  const unexercisedVestedOptions =
    Math.max(
      availableOptions -
        selectedOptions,
      0
    );

  const strikePrice =
    positiveNumber(
      input.strikePrice
    );

  const exerciseFMV =
    positiveNumber(
      input.exerciseFMV
    );

  const totalCompanyShares =
    Math.max(
      positiveNumber(
        input.totalCompanyShares
      ),
      1
    );

  const currentCompanyValuation =
    positiveNumber(
      input.currentCompanyValuation
    );

  const currentShareValue =
    currentCompanyValuation /
    totalCompanyShares;

  const intrinsicValuePerOption =
    Math.max(
      exerciseFMV -
        strikePrice,
      0
    );

  const intrinsicValueTotal =
    intrinsicValuePerOption *
    selectedOptions;

  const exerciseCost =
    selectedOptions *
    strikePrice;

  const exerciseStageTax =
    calculateExerciseStageTax(
      selectedOptions,
      input
    );

  const totalCashRequired =
    exerciseCost +
    exerciseStageTax;

  const opportunityCost =
    calculateOpportunityCost(
      totalCashRequired,
      input.opportunityCostRate,
      input.expectedYearsToLiquidity
    );

  const economicCashCommitment =
    totalCashRequired +
    opportunityCost;

  const currentOwnershipPercentage =
    (selectedOptions /
      totalCompanyShares) *
    100;

  const postDilutionOwnershipPercentage =
    currentOwnershipPercentage *
    (1 -
      clampPercentage(
        input.futureDilutionPercentage
      ) /
        100);

  const timing =
    calculateTiming(
      input.expiryDate,
      input.postTerminationExerciseDays
    );

  /*
   * Resolve the analytical context once.
   *
   * TODAY: currently vested options drive the downstream model.
   * FUTURE_PLANNER: when nothing is vested today, the selected future
   * vesting milestone becomes the analytical context for break-even,
   * frontier, Bear/Base/Bull and decision factors.
   *
   * The Now vs Wait and What If I Leave sections still retain today's
   * position separately.
   */
  const future =
    calculateFutureExercise(
      input,
      selectedOptions,
      totalCashRequired,
      exerciseStageTax,
      timing
    );

  const isFuturePlanningMode =
    availableOptions <= 0;

  const analysisAvailableOptions =
    isFuturePlanningMode
      ? future.futureVestedOptions
      : availableOptions;

  const analysisSelectedOptions =
    isFuturePlanningMode
      ? future.selectedFutureOptions
      : selectedOptions;

  const analysisExerciseCost =
    isFuturePlanningMode
      ? future.futureExerciseCost
      : exerciseCost;

  const analysisExerciseStageTax =
    isFuturePlanningMode
      ? future.futureExerciseStageTax
      : exerciseStageTax;

  const analysisInput: ExerciseInput =
    isFuturePlanningMode
      ? {
          ...input,
          vestedOptions:
            future.futureVestedOptions,
          exerciseFMV:
            future.futureExerciseFMV,
        }
      : input;

  logExercise(
    "analytical_context_resolved",
    {
      mode:
        isFuturePlanningMode
          ? "FUTURE_PLANNER"
          : "TODAY",
      waitMonths:
        isFuturePlanningMode
          ? future.waitMonths
          : 0,
      availableOptions:
        analysisAvailableOptions,
      selectedOptions:
        analysisSelectedOptions,
      exerciseFMV:
        analysisInput.exerciseFMV,
      exerciseCost:
        analysisExerciseCost,
      exerciseStageTax:
        analysisExerciseStageTax,
    }
  );

  const breakEven =
    calculateBreakEven(
      analysisSelectedOptions,
      totalCompanyShares,
      input.futureDilutionPercentage,
      analysisExerciseCost,
      analysisExerciseStageTax,
      strikePrice,
      input.exitValuation
    );

  /*
   * Exercise scenarios intentionally keep dilution constant.
   * Only exit valuation changes. In Future Planner mode they use the
   * future selected quantity and future FMV/tax context.
   */
  const baseExit =
    positiveNumber(
      input.exitValuation
    );

  const scenarios:
    ExerciseScenarioResult[] = [
      calculateScenario(
        "Bear",
        "Lower-growth outcome",
        baseExit * 0.5,
        analysisSelectedOptions,
        analysisInput
      ),

      calculateScenario(
        "Base",
        "Your current exit assumption",
        baseExit,
        analysisSelectedOptions,
        analysisInput
      ),

      calculateScenario(
        "Bull",
        "Strong-growth outcome",
        baseExit * 2,
        analysisSelectedOptions,
        analysisInput
      ),
    ];

  const strategies =
    (
      [
        0,
        25,
        50,
        75,
        100,
      ] as ExerciseStrategyPercent[]
    ).map(
      (percentage) =>
        calculateStrategy(
          percentage,
          analysisAvailableOptions,
          analysisInput
        )
    );

  const baseScenario =
    scenarios.find(
      (s) =>
        s.name === "Base"
    )!;

  /*
   * Today's Base scenario is preserved for the left side of Now vs Wait.
   * This prevents Future Planner mode from rewriting the meaning of
   * "Exercise now" when zero options are vested today.
   */
  const todayBaseScenario =
    calculateScenario(
      "Base",
      "Exercise today",
      baseExit,
      selectedOptions,
      input
    );

  const futureExpiryRisk:
    ExerciseRiskLevel =
      future
        .remainingDaysToExpiry ===
      null
        ? timing.expiryRisk
        : future
              .remainingDaysToExpiry <
            0
          ? "CRITICAL"
          : future
                .remainingDaysToExpiry <=
              90
            ? "CRITICAL"
            : future
                  .remainingDaysToExpiry <=
                365
              ? "HIGH"
              : future
                    .remainingDaysToExpiry <=
                  730
                ? "MODERATE"
                : "LOW";

  const timingComparison:
    ExerciseTimingComparison = {
      exerciseNow: {
        options:
          selectedOptions,
        exerciseCost,
        exerciseStageTax,
        totalCashRequired,
        opportunityCost,
        economicCashCommitment,
        baseEstimatedTakeHome:
          todayBaseScenario
            .estimatedTakeHome,
        baseNetEconomicOutcome:
          todayBaseScenario
            .netEconomicOutcome,
      },

      wait: {
        waitMonths:
          future.waitMonths,
        futureVestedOptions:
          future
            .futureVestedOptions,
        selectedFutureOptions:
          future
            .selectedFutureOptions,
        futureExerciseFMV:
          future
            .futureExerciseFMV,

        cashRequiredToday: 0,
        taxRequiredToday: 0,

        cashPreservedToday:
          totalCashRequired,

        futureExerciseCost:
          future
            .futureExerciseCost,

        futureExerciseStageTax:
          future
            .futureExerciseStageTax,

        futureTotalCashRequired:
          future
            .futureTotalCashRequired,

        futureBaseEstimatedTakeHome:
          future
            .futureBaseEstimatedTakeHome,

        futureBaseNetEconomicOutcome:
          future
            .futureBaseNetEconomicOutcome,

        optionalityPreserved: true,

        expiryRisk:
          futureExpiryRisk,

        terminationWindowRisk:
          timing
            .terminationWindowRisk,
      },
    };

  const strategyIntelligence =
    buildStrategyIntelligence(
      strategies
    );

  const budget =
    calculateBudgetPlan(
      input.exerciseBudget ?? 0,
      analysisAvailableOptions,
      analysisInput
    );

  const nowVsWaitIntelligence =
    buildNowVsWaitIntelligence(
      timingComparison
    );

  const analysisTotalCashRequired =
    analysisExerciseCost +
    analysisExerciseStageTax;

  const scorecard =
    buildDecisionScorecard(
      analysisInput,
      analysisSelectedOptions,
      analysisAvailableOptions,
      analysisTotalCashRequired,
      analysisExerciseStageTax,
      timing,
      baseScenario
    );

  logExercise(
    "phase3_decision_intelligence_resolved",
    {
      mode:
        isFuturePlanningMode
          ? "FUTURE_PLANNER"
          : "TODAY",
      lowestCashPercentage:
        strategyIntelligence
          .lowestCashStrategy
          ?.percentage ?? null,
      highestTakeHomePercentage:
        strategyIntelligence
          .highestTakeHomeStrategy
          ?.percentage ?? null,
      budget:
        budget.budget,
      affordableOptions:
        budget.affordableOptions,
      capitalBurden:
        scorecard.capitalBurden,
      taxBurden:
        scorecard.taxBurden,
      deadlinePressure:
        scorecard.deadlinePressure,
    }
  );

  const leaveCompany =
    calculateLeaveCompany(
      input,
      timing
    );

  const analysisContext: ExerciseAnalysisContext =
    isFuturePlanningMode
      ? "FUTURE_PLANNER"
      : "TODAY";

  const analysisWaitMonths =
    isFuturePlanningMode
      ? future.waitMonths
      : 0;

  const analysisContextLabel =
    analysisContext === "FUTURE_PLANNER"
      ? `Future +${analysisWaitMonths}m`
      : "Today";

  const analysisIntrinsicValuePerOption =
    Math.max(
      analysisInput.exerciseFMV -
        strikePrice,
      0
    );

  const decisionFactors =
    buildDecisionFactors(
      analysisInput,
      analysisSelectedOptions,
      analysisIntrinsicValuePerOption,
      analysisTotalCashRequired,
      analysisExerciseStageTax,
      timing,
      analysisContext,
      analysisWaitMonths
    );

  const overallSignal =
    calculateOverallSignal(
      decisionFactors
    );

  const assumptions = [
    "Only currently vested options are treated as exercisable today.",
    "Future Exercise Planner uses the same vesting engine as the Vesting workspace.",
    "Future FMV is a user planning assumption and is not a company forecast.",
    "Exercise-stage tax is estimated through the shared India Tax model.",
    "Bear, Base and Bull change exit valuation while keeping shared relative dilution constant.",
    "Waiting preserves cash today but future FMV, tax rules, vesting, company value and liquidity can change.",
    "Opportunity cost uses compound annual growth on exercise cash committed today.",
    "Unvested options are modeled as at risk if employment ends, consistent with the current vesting assumptions.",
    "Post-termination exercise rights and grant expiry ultimately depend on the grant agreement and plan rules.",
    "Cash Budget Mode solves for the largest whole-option quantity whose modeled strike cost plus exercise-stage tax stays within the entered budget.",
    "Strategy Intelligence labels trade-offs such as lowest cash, lowest tax and highest modeled take-home; these labels are not recommendations.",
    "The Exercise Decision Scorecard summarizes modeled burdens and risks without converting them into personalized investment advice.",
    "This is decision-support modeling and not personalized tax, legal or investment advice.",
  ];

  if (
    availableOptions <= 0
  ) {
    warnExercise(
      "future_planning_mode_activated",
      {
        totalOptions,
        currentVestedOptions:
          availableOptions,
        futureVestedOptions:
          future
            .futureVestedOptions,
        waitMonths:
          future.waitMonths,
      }
    );
  }

  if (
    timing.expiryRisk ===
      "CRITICAL" ||
    timing
      .terminationWindowRisk ===
      "CRITICAL"
  ) {
    warnExercise(
      "critical_timing_risk",
      {
        daysUntilExpiry:
          timing.daysUntilExpiry,
        postTerminationExerciseDays:
          timing
            .postTerminationExerciseDays,
      }
    );
  }

  logExercise(
    "calculation_completed",
    {
      mode:
        isFuturePlanningMode
          ? "FUTURE_PLANNER"
          : "TODAY",
      availableOptions,
      selectedOptions,
      totalCashRequired,
      futureSelectedOptions:
        future
          .selectedFutureOptions,
      futureTotalCashRequired:
        future
          .futureTotalCashRequired,
      baseEstimatedTakeHome:
        baseScenario
          .estimatedTakeHome,
      overallSignal,
      analysisContext,
      analysisContextLabel,
      analysisAvailableOptions,
      analysisSelectedOptions,
      analysisExerciseFMV:
        analysisInput.exerciseFMV,
      analysisTotalCashRequired,
    }
  );

  return {
    availableOptions,
    selectedOptions,
    selectedPercentage,
    unexercisedVestedOptions,

    currentShareValue,
    intrinsicValuePerOption,
    intrinsicValueTotal,

    exerciseCost,
    exerciseStageTax,
    totalCashRequired,

    opportunityCost,
    economicCashCommitment,

    currentOwnershipPercentage,
    postDilutionOwnershipPercentage,

    breakEven,
    scenarios,
    strategies,

    strategyIntelligence,
    budget,
    nowVsWaitIntelligence,
    scorecard,

    future,
    timingComparison,
    leaveCompany,

    timing,
    decisionFactors,
    overallSignal,

    isFuturePlanningMode,

    analysisContext,
    analysisContextLabel,
    analysisWaitMonths,
    analysisAvailableOptions,
    analysisSelectedOptions,
    analysisExerciseFMV:
      analysisInput.exerciseFMV,
    analysisExerciseCost,
    analysisExerciseStageTax,
    analysisTotalCashRequired,

    assumptions,
  };
}

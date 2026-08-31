export type AdvancedSimulatorInput = {
  totalShares: number;

  esopsGranted: number;

  vestedPercentage: number;

  /**
   * Optional explicit option quantity to model.
   *
   * When supplied, this takes precedence over the quantity derived
   * from esopsGranted × vestedPercentage.
   *
   * This allows Exercise Planner to send an exact selected option
   * quantity into Exit without converting that quantity back into
   * a percentage.
   */
  modeledOptions?: number;

  strikePrice: number;

  currentValuation: number;

  futureDilutionPercentage: number;

  exitValuation: number;
};

export type ScenarioResult = {
  name: "Bear" | "Base" | "Bull";

  description: string;

  exitValuation: number;

  dilutionPercentage: number;

  grossExitValue: number;

  netExitProceeds: number;

  returnMultiple: number;
};

export type AdvancedSimulatorResult = {
  vestedShares: number;

  unvestedShares: number;

  ownershipPercentage: number;

  currentSharePrice: number;

  exerciseCost: number;

  grossValueToday: number;

  netValueToday: number;

  exitSharePriceBeforeDilution: number;

  exitSharePriceAfterDilution: number;

  grossExitValue: number;

  netExitProceeds: number;

  valueCreated: number;

  returnMultiple: number;

  roiPercentage: number;

  dilutionImpact: number;

  breakEvenExitValuation: number;

  scenarios: ScenarioResult[];

  status:
    | "strong"
    | "positive"
    | "neutral"
    | "underwater";
};

/* ============================================================
   SAFE NUMBER
============================================================ */

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

/* ============================================================
   CLAMP PERCENTAGE
============================================================ */

function clampPercentage(value: number) {
  return Math.min(
    Math.max(safeNumber(value), 0),
    100
  );
}

/* ============================================================
   NORMALIZE OPTION QUANTITY
============================================================ */

/**
 * ESOP quantities represent whole options.
 *
 * Exercise Planner may pass an explicit modeled quantity into
 * the simulator. We keep that quantity bounded by the confirmed
 * grant and ensure fractional options do not leak into Exit.
 */
function normalizeOptionQuantity(
  value: number,
  maximum: number
) {
  return Math.min(
    Math.max(
      Math.floor(safeNumber(value)),
      0
    ),
    Math.max(
      Math.floor(safeNumber(maximum)),
      0
    )
  );
}

/* ============================================================
   CALCULATE SCENARIO
============================================================ */

function calculateScenario(
  name: "Bear" | "Base" | "Bull",

  description: string,

  exitValuation: number,

  dilutionPercentage: number,

  input: AdvancedSimulatorInput,

  modeledShares: number,

  exerciseCost: number
): ScenarioResult {
  const totalShares = Math.max(
    safeNumber(input.totalShares),
    1
  );

  const dilutionMultiplier =
    1 -
    clampPercentage(dilutionPercentage) /
      100;

  const exitSharePrice =
    (Math.max(exitValuation, 0) /
      totalShares) *
    dilutionMultiplier;

  const grossExitValue =
    modeledShares * exitSharePrice;

  const netExitProceeds =
    Math.max(
      grossExitValue - exerciseCost,
      0
    );

  const returnMultiple =
    exerciseCost > 0
      ? netExitProceeds / exerciseCost
      : 0;

  return {
    name,

    description,

    exitValuation,

    dilutionPercentage,

    grossExitValue,

    netExitProceeds,

    returnMultiple,
  };
}

/* ============================================================
   ADVANCED ESOP CALCULATOR
============================================================ */

export function calculateAdvancedESOP(
  input: AdvancedSimulatorInput
): AdvancedSimulatorResult {
  const totalShares = Math.max(
    safeNumber(input.totalShares),
    1
  );

  const esopsGranted = Math.max(
    safeNumber(input.esopsGranted),
    0
  );

  const vestedPercentage =
    clampPercentage(
      input.vestedPercentage
    );

  const strikePrice = Math.max(
    safeNumber(input.strikePrice),
    0
  );

  const currentValuation = Math.max(
    safeNumber(input.currentValuation),
    0
  );

  const futureDilutionPercentage =
    clampPercentage(
      input.futureDilutionPercentage
    );

  const exitValuation = Math.max(
    safeNumber(input.exitValuation),
    0
  );

  /**
   * ---------------------------------------------------------
   * VESTING / MODELED OPTION BASIS
   * ---------------------------------------------------------
   *
   * Historically the simulator calculated the modeled option
   * quantity only from:
   *
   *   esopsGranted × vestedPercentage
   *
   * That behavior remains the fallback.
   *
   * Phase 2 Exercise → Exit integration can now provide an
   * explicit modeledOptions quantity. When supplied, that exact
   * whole-option quantity becomes the analytical basis.
   */

  const percentageBasedShares =
    (esopsGranted *
      vestedPercentage) /
    100;

  const hasExplicitModeledOptions =
    typeof input.modeledOptions ===
      "number" &&
    Number.isFinite(
      input.modeledOptions
    );

  const vestedShares =
    hasExplicitModeledOptions
      ? normalizeOptionQuantity(
          input.modeledOptions as number,
          esopsGranted
        )
      : percentageBasedShares;

  /**
   * Unvested shares here means the portion of the confirmed
   * grant that is outside the currently modeled quantity.
   *
   * Existing consumers retain their historical behavior when
   * modeledOptions is not supplied.
   */

  const unvestedShares =
    Math.max(
      esopsGranted - vestedShares,
      0
    );

  /**
   * ---------------------------------------------------------
   * OWNERSHIP
   * ---------------------------------------------------------
   */

  const ownershipPercentage =
    (vestedShares /
      totalShares) *
    100;

  /**
   * ---------------------------------------------------------
   * CURRENT VALUE
   * ---------------------------------------------------------
   */

  const currentSharePrice =
    currentValuation /
    totalShares;

  const grossValueToday =
    vestedShares *
    currentSharePrice;

  /**
   * ---------------------------------------------------------
   * EXERCISE COST
   * ---------------------------------------------------------
   */

  const exerciseCost =
    vestedShares *
    strikePrice;

  const netValueToday =
    grossValueToday -
    exerciseCost;

  /**
   * ---------------------------------------------------------
   * EXIT VALUE
   * ---------------------------------------------------------
   */

  const exitSharePriceBeforeDilution =
    exitValuation /
    totalShares;

  const dilutionMultiplier =
    1 -
    futureDilutionPercentage /
      100;

  const exitSharePriceAfterDilution =
    exitSharePriceBeforeDilution *
    dilutionMultiplier;

  const grossExitValue =
    vestedShares *
    exitSharePriceAfterDilution;

  const netExitProceeds =
    Math.max(
      grossExitValue -
        exerciseCost,
      0
    );

  /**
   * ---------------------------------------------------------
   * RETURN ANALYSIS
   * ---------------------------------------------------------
   */

  const valueCreated =
    netExitProceeds -
    netValueToday;

  const returnMultiple =
    exerciseCost > 0
      ? netExitProceeds /
        exerciseCost
      : 0;

  const roiPercentage =
    exerciseCost > 0
      ? ((netExitProceeds -
          exerciseCost) /
          exerciseCost) *
        100
      : 0;

  /**
   * ---------------------------------------------------------
   * DILUTION IMPACT
   * ---------------------------------------------------------
   */

  const grossExitWithoutDilution =
    vestedShares *
    exitSharePriceBeforeDilution;

  const dilutionImpact =
    Math.max(
      grossExitWithoutDilution -
        grossExitValue,
      0
    );

  /**
   * ---------------------------------------------------------
   * BREAK-EVEN EXIT
   * ---------------------------------------------------------
   *
   * Exit valuation where gross proceeds after dilution equal
   * the exercise cost.
   */

  const breakEvenExitValuation =
    vestedShares > 0 &&
    dilutionMultiplier > 0
      ? (exerciseCost *
          totalShares) /
        (vestedShares *
          dilutionMultiplier)
      : 0;

  /**
   * ---------------------------------------------------------
   * STATUS
   * ---------------------------------------------------------
   */

  let status:
    | "strong"
    | "positive"
    | "neutral"
    | "underwater";

  if (
    currentSharePrice <
    strikePrice
  ) {
    status = "underwater";
  } else if (
    returnMultiple >= 5
  ) {
    status = "strong";
  } else if (
    returnMultiple >= 2
  ) {
    status = "positive";
  } else {
    status = "neutral";
  }

  /**
   * ---------------------------------------------------------
   * SCENARIOS
   * ---------------------------------------------------------
   *
   * Every Bear / Base / Bull scenario now uses the same modeled
   * option quantity selected by the analytical basis.
   */

  const bearExit =
    exitValuation * 0.5;

  const bullExit =
    exitValuation * 2;

  const scenarios: ScenarioResult[] = [
    calculateScenario(
      "Bear",

      "Lower-growth outcome",

      bearExit,

      Math.min(
        futureDilutionPercentage +
          10,
        100
      ),

      input,

      vestedShares,

      exerciseCost
    ),

    calculateScenario(
      "Base",

      "Your current assumption",

      exitValuation,

      futureDilutionPercentage,

      input,

      vestedShares,

      exerciseCost
    ),

    calculateScenario(
      "Bull",

      "Strong-growth outcome",

      bullExit,

      Math.max(
        futureDilutionPercentage -
          10,
        0
      ),

      input,

      vestedShares,

      exerciseCost
    ),
  ];

  return {
    vestedShares,

    unvestedShares,

    ownershipPercentage,

    currentSharePrice,

    exerciseCost,

    grossValueToday,

    netValueToday,

    exitSharePriceBeforeDilution,

    exitSharePriceAfterDilution,

    grossExitValue,

    netExitProceeds,

    valueCreated,

    returnMultiple,

    roiPercentage,

    dilutionImpact,

    breakEvenExitValuation,

    scenarios,

    status,
  };
}
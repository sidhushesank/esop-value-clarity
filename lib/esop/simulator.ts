export type AdvancedSimulatorInput = {
  totalShares: number;
  esopsGranted: number;
  vestedPercentage: number;
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

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function clampPercentage(value: number) {
  return Math.min(Math.max(safeNumber(value), 0), 100);
}

function calculateScenario(
  name: "Bear" | "Base" | "Bull",
  description: string,
  exitValuation: number,
  dilutionPercentage: number,
  input: AdvancedSimulatorInput,
  vestedShares: number,
  exerciseCost: number
): ScenarioResult {
  const totalShares = Math.max(
    safeNumber(input.totalShares),
    1
  );

  const dilutionMultiplier =
    1 - clampPercentage(dilutionPercentage) / 100;

  const exitSharePrice =
    (Math.max(exitValuation, 0) / totalShares) *
    dilutionMultiplier;

  const grossExitValue =
    vestedShares * exitSharePrice;

  const netExitProceeds =
    Math.max(grossExitValue - exerciseCost, 0);

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

  const vestedPercentage = clampPercentage(
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

  const futureDilutionPercentage = clampPercentage(
    input.futureDilutionPercentage
  );

  const exitValuation = Math.max(
    safeNumber(input.exitValuation),
    0
  );

  /*
   * ---------------------------------------------------------
   * VESTING
   * ---------------------------------------------------------
   */

  const vestedShares =
    (esopsGranted * vestedPercentage) / 100;

  const unvestedShares =
    Math.max(esopsGranted - vestedShares, 0);

  /*
   * ---------------------------------------------------------
   * OWNERSHIP
   * ---------------------------------------------------------
   */

  const ownershipPercentage =
    (vestedShares / totalShares) * 100;

  /*
   * ---------------------------------------------------------
   * CURRENT VALUE
   * ---------------------------------------------------------
   */

  const currentSharePrice =
    currentValuation / totalShares;

  const grossValueToday =
    vestedShares * currentSharePrice;

  /*
   * ---------------------------------------------------------
   * EXERCISE COST
   * ---------------------------------------------------------
   */

  const exerciseCost =
    vestedShares * strikePrice;

  const netValueToday =
    grossValueToday - exerciseCost;

  /*
   * ---------------------------------------------------------
   * EXIT VALUE
   * ---------------------------------------------------------
   */

  const exitSharePriceBeforeDilution =
    exitValuation / totalShares;

  const dilutionMultiplier =
    1 - futureDilutionPercentage / 100;

  const exitSharePriceAfterDilution =
    exitSharePriceBeforeDilution *
    dilutionMultiplier;

  const grossExitValue =
    vestedShares *
    exitSharePriceAfterDilution;

  const netExitProceeds =
    Math.max(
      grossExitValue - exerciseCost,
      0
    );

  /*
   * ---------------------------------------------------------
   * RETURN ANALYSIS
   * ---------------------------------------------------------
   */

  const valueCreated =
    netExitProceeds - netValueToday;

  const returnMultiple =
    exerciseCost > 0
      ? netExitProceeds / exerciseCost
      : 0;

  const roiPercentage =
    exerciseCost > 0
      ? ((netExitProceeds - exerciseCost) /
          exerciseCost) *
        100
      : 0;

  /*
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

  /*
   * ---------------------------------------------------------
   * BREAK-EVEN EXIT
   *
   * Exit valuation where gross proceeds after
   * dilution equal the exercise cost.
   * ---------------------------------------------------------
   */

  const breakEvenExitValuation =
    vestedShares > 0 &&
    dilutionMultiplier > 0
      ? (exerciseCost * totalShares) /
        (vestedShares * dilutionMultiplier)
      : 0;

  /*
   * ---------------------------------------------------------
   * STATUS
   * ---------------------------------------------------------
   */

  let status:
    | "strong"
    | "positive"
    | "neutral"
    | "underwater";

  if (currentSharePrice < strikePrice) {
    status = "underwater";
  } else if (returnMultiple >= 5) {
    status = "strong";
  } else if (returnMultiple >= 2) {
    status = "positive";
  } else {
    status = "neutral";
  }

  /*
   * ---------------------------------------------------------
   * SCENARIOS
   * ---------------------------------------------------------
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
        futureDilutionPercentage + 10,
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
        futureDilutionPercentage - 10,
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
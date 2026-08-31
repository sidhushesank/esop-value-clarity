import {
  calculateAdvancedESOP,
  type AdvancedSimulatorInput,
  type AdvancedSimulatorResult,
} from "@/lib/esop/simulator";

import {
  calculateAdvancedTax,
  type AdvancedTaxInput,
  type AdvancedTaxResult,
} from "@/lib/esop/tax";

/* ============================================================
   EXIT SCENARIOS
============================================================ */

export type ExitScenario =
  | "Bear"
  | "Base"
  | "Bull";

/* ============================================================
   EXIT INPUT
============================================================ */

export type AdvancedExitInput = {
  /* ==========================================================
     CORE EQUITY
  ========================================================== */

  totalShares: number;

  esopsGranted: number;

  vestedPercentage: number;

  /**
   * Optional explicit option quantity.
   *
   * When provided, Exit models exactly this many options rather
   * than deriving the quantity from vestedPercentage.
   *
   * Used by Exercise Intelligence -> Exit integration.
   */
  modeledOptions?: number;

  strikePrice: number;

  currentValuation: number;

  /* ==========================================================
     DILUTION
  ========================================================== */

  futureDilutionPercentage: number;

  /* ==========================================================
     EXIT
  ========================================================== */

  exitValuation: number;

  selectedScenario: ExitScenario;

  /* ==========================================================
     TAX
  ========================================================== */

  exerciseFMV: number;

  otherAnnualIncome: number;

  holdingPeriodMonths: number;

  equityType:
    | "UNLISTED"
    | "LISTED";

  taxRegime:
    | "NEW"
    | "OLD";
};

/* ============================================================
   SCENARIO RESULT
============================================================ */

export type ExitScenarioResult = {
  name: ExitScenario;

  description: string;

  exitValuation: number;

  dilutionPercentage: number;

  grossExitValue: number;

  exerciseCost: number;

  estimatedTax: number;

  estimatedTakeHome: number;

  returnMultiple: number;

  roiPercentage: number;

  exitSharePriceAfterDilution: number;
};

/* ============================================================
   EXIT RESULT
============================================================ */

export type AdvancedExitResult = {
  selectedScenario: ExitScenario;

  exitValuation: number;

  simulator: AdvancedSimulatorResult;

  tax: AdvancedTaxResult;

  grossExitValue: number;

  exerciseCost: number;

  preTaxProceeds: number;

  estimatedTax: number;

  estimatedTakeHome: number;

  returnMultiple: number;

  roiPercentage: number;

  exitSharePriceBeforeDilution: number;

  exitSharePriceAfterDilution: number;

  vestedShares: number;

  unvestedShares: number;

  ownershipPercentage: number;

  estimatedIncomeTax: number;

  estimatedCapitalGainsTax: number;

  effectiveTaxRate: number;

  dilutionImpact: number;

  status:
    | "strong"
    | "positive"
    | "neutral"
    | "underwater";

  moneyJourney: {
    label: string;
    value: number;
  }[];

  scenarios: ExitScenarioResult[];
};

/* ============================================================
   LOGGING
============================================================ */

const LOG =
  "[EVC:EXIT:ENGINE]";

function devLog(
  event: string,
  payload?: Record<
    string,
    unknown
  >
) {
  if (
    process.env.NODE_ENV !==
    "production"
  ) {
    console.info(
      LOG,
      event,
      payload ?? {}
    );
  }
}

/* ============================================================
   HELPERS
============================================================ */

function safeNumber(
  value: number
) {
  return Number.isFinite(value)
    ? value
    : 0;
}

function positiveNumber(
  value: number
) {
  return Math.max(
    safeNumber(value),
    0
  );
}

function clampPercentage(
  value: number
) {
  return Math.min(
    Math.max(
      safeNumber(value),
      0
    ),
    100
  );
}

/* ============================================================
   EXPLICIT MODELED OPTIONS
============================================================ */

function normalizeModeledOptions(
  value: number | undefined,
  totalGranted: number
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return Math.min(
    Math.max(
      Math.floor(value),
      0
    ),
    Math.max(
      Math.floor(totalGranted),
      0
    )
  );
}

/* ============================================================
   SCENARIO VALUATION
============================================================ */

export function getScenarioExitValuation(
  baseExitValuation: number,
  scenario: ExitScenario
) {
  const valuation =
    positiveNumber(
      baseExitValuation
    );

  switch (scenario) {
    case "Bear":
      return valuation * 0.5;

    case "Bull":
      return valuation * 2;

    default:
      return valuation;
  }
}

/* ============================================================
   SCENARIO DILUTION
============================================================ */

export function getScenarioDilution(
  baseDilution: number,
  scenario: ExitScenario
) {
  const dilution =
    clampPercentage(
      baseDilution
    );

  switch (scenario) {
    case "Bear":
      return Math.min(
        dilution + 10,
        100
      );

    case "Bull":
      return Math.max(
        dilution - 10,
        0
      );

    default:
      return dilution;
  }
}

/* ============================================================
   CALCULATE ONE SCENARIO
============================================================ */

function calculateScenario(
  input: AdvancedExitInput,
  scenario: ExitScenario
) {
  const exitValuation =
    getScenarioExitValuation(
      input.exitValuation,
      scenario
    );

  const dilutionPercentage =
    getScenarioDilution(
      input.futureDilutionPercentage,
      scenario
    );

  const esopsGranted =
    positiveNumber(
      input.esopsGranted
    );

  const modeledOptions =
    normalizeModeledOptions(
      input.modeledOptions,
      esopsGranted
    );

  /* ==========================================================
     SIMULATOR
  ========================================================== */

  const simulatorInput:
    AdvancedSimulatorInput = {
      totalShares:
        positiveNumber(
          input.totalShares
        ),

      esopsGranted,

      vestedPercentage:
        clampPercentage(
          input.vestedPercentage
        ),

      /*
       * Explicit Exercise-plan quantity.
       *
       * Undefined means the Simulator retains its historical
       * percentage-based behavior.
       */
      modeledOptions,

      strikePrice:
        positiveNumber(
          input.strikePrice
        ),

      currentValuation:
        positiveNumber(
          input.currentValuation
        ),

      futureDilutionPercentage:
        dilutionPercentage,

      exitValuation,
    };

  const simulator =
    calculateAdvancedESOP(
      simulatorInput
    );

  /* ==========================================================
     TAX
  ========================================================== */

  const taxInput:
    AdvancedTaxInput = {
      /*
       * This is deliberately taken from Simulator.
       *
       * Therefore Full Grant, Currently Vested and Exercise Plan
       * all send the SAME modeled option quantity downstream
       * into the Tax engine.
       */
      vestedShares:
        simulator.vestedShares,

      strikePrice:
        positiveNumber(
          input.strikePrice
        ),

      exerciseFMV:
        positiveNumber(
          input.exerciseFMV
        ),

      /*
       * Tax uses the same post-dilution share price calculated
       * by Simulator.
       */
      salePrice:
        simulator
          .exitSharePriceAfterDilution,

      otherAnnualIncome:
        positiveNumber(
          input.otherAnnualIncome
        ),

      holdingPeriodMonths:
        positiveNumber(
          input.holdingPeriodMonths
        ),

      equityType:
        input.equityType,

      taxRegime:
        input.taxRegime,
    };

  const tax =
    calculateAdvancedTax(
      taxInput
    );

  /* ==========================================================
     EXIT ECONOMICS
  ========================================================== */

  const grossExitValue =
    simulator.grossExitValue;

  const exerciseCost =
    simulator.exerciseCost;

  const preTaxProceeds =
    Math.max(
      grossExitValue -
        exerciseCost,
      0
    );

  const estimatedTax =
    tax.totalEstimatedTax;

  const estimatedTakeHome =
    Math.max(
      tax.netTakeHome,
      0
    );

  const returnMultiple =
    exerciseCost > 0
      ? estimatedTakeHome /
        exerciseCost
      : 0;

  const roiPercentage =
    exerciseCost > 0
      ? (
          (
            estimatedTakeHome -
            exerciseCost
          ) /
          exerciseCost
        ) *
        100
      : 0;

  devLog(
    "scenario_calculated",
    {
      scenario,

      explicitModeledOptions:
        modeledOptions ??
        null,

      simulatorModeledShares:
        simulator.vestedShares,

      exitValuation,

      dilutionPercentage,

      exerciseFMV:
        input.exerciseFMV,

      exerciseCost,

      estimatedTax,

      estimatedTakeHome,
    }
  );

  return {
    scenario,

    exitValuation,

    dilutionPercentage,

    simulator,

    tax,

    grossExitValue,

    exerciseCost,

    preTaxProceeds,

    estimatedTax,

    estimatedTakeHome,

    returnMultiple,

    roiPercentage,
  };
}

/* ============================================================
   MAIN EXIT CALCULATION
============================================================ */

export function calculateAdvancedExit(
  input: AdvancedExitInput
): AdvancedExitResult {
  const selectedScenario =
    input.selectedScenario;

  /* ==========================================================
     SELECTED SCENARIO
  ========================================================== */

  const selected =
    calculateScenario(
      input,
      selectedScenario
    );

  /* ==========================================================
     ALL SCENARIOS

     These power the interactive Bear/Base/Bull comparison.
  ========================================================== */

  const scenarioResults =
    (
      [
        "Bear",
        "Base",
        "Bull",
      ] as ExitScenario[]
    ).map(
      (scenario) => {
        const result =
          calculateScenario(
            input,
            scenario
          );

        let description =
          "Your current assumption";

        if (
          scenario === "Bear"
        ) {
          description =
            "Lower-growth outcome";
        }

        if (
          scenario === "Bull"
        ) {
          description =
            "Strong-growth outcome";
        }

        return {
          name:
            scenario,

          description,

          exitValuation:
            result.exitValuation,

          dilutionPercentage:
            result
              .dilutionPercentage,

          grossExitValue:
            result.grossExitValue,

          exerciseCost:
            result.exerciseCost,

          estimatedTax:
            result.estimatedTax,

          estimatedTakeHome:
            result
              .estimatedTakeHome,

          returnMultiple:
            result.returnMultiple,

          roiPercentage:
            result.roiPercentage,

          exitSharePriceAfterDilution:
            result.simulator
              .exitSharePriceAfterDilution,
        };
      }
    );

  /* ==========================================================
     MONEY JOURNEY
  ========================================================== */

  const moneyJourney = [
    {
      label:
        "Gross exit value",

      value:
        selected.grossExitValue,
    },

    {
      label:
        "Exercise cost",

      value:
        -selected.exerciseCost,
    },

    {
      label:
        "Estimated tax",

      value:
        -selected.estimatedTax,
    },

    {
      label:
        "Estimated take-home",

      value:
        selected
          .estimatedTakeHome,
    },
  ];

  /* ==========================================================
     FINAL LOG
  ========================================================== */

  devLog(
    "exit_calculated",
    {
      selectedScenario,

      requestedModeledOptions:
        input.modeledOptions ??
        null,

      actualModeledOptions:
        selected.simulator
          .vestedShares,

      exerciseFMV:
        input.exerciseFMV,

      exerciseCost:
        selected.exerciseCost,

      estimatedTax:
        selected.estimatedTax,

      estimatedTakeHome:
        selected
          .estimatedTakeHome,
    }
  );

  /* ==========================================================
     RETURN
  ========================================================== */

  return {
    selectedScenario,

    exitValuation:
      selected.exitValuation,

    simulator:
      selected.simulator,

    tax:
      selected.tax,

    grossExitValue:
      selected.grossExitValue,

    exerciseCost:
      selected.exerciseCost,

    preTaxProceeds:
      selected.preTaxProceeds,

    estimatedTax:
      selected.estimatedTax,

    estimatedTakeHome:
      selected
        .estimatedTakeHome,

    returnMultiple:
      selected.returnMultiple,

    roiPercentage:
      selected.roiPercentage,

    exitSharePriceBeforeDilution:
      selected.simulator
        .exitSharePriceBeforeDilution,

    exitSharePriceAfterDilution:
      selected.simulator
        .exitSharePriceAfterDilution,

    vestedShares:
      selected.simulator
        .vestedShares,

    unvestedShares:
      selected.simulator
        .unvestedShares,

    ownershipPercentage:
      selected.simulator
        .ownershipPercentage,

    estimatedIncomeTax:
      selected.tax
        .estimatedIncomeTax,

    estimatedCapitalGainsTax:
      selected.tax
        .capitalGainsTax,

    effectiveTaxRate:
      selected.tax
        .effectiveTaxRate,

    dilutionImpact:
      selected.simulator
        .dilutionImpact,

    status:
      selected.simulator
        .status,

    moneyJourney,

    scenarios:
      scenarioResults,
  };
}
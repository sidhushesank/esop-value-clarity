import type { ProEquityState } from "@/lib/esop/pro-state";
import { normalizeProNumber } from "@/lib/esop/pro-state";
import { calculateAdvancedTax } from "@/lib/esop/tax";

export type PresentationScenarioKey = "bear" | "base" | "bull";

export type PresentationAnalysisBasis =
  | "FULL_GRANT"
  | "CURRENTLY_VESTED";

export type PresentationScenario = {
  key: PresentationScenarioKey;
  label: "BEAR" | "BASE" | "BULL";
  title: string;
  factor: number;
  exitValuation: number;
  salePrice: number;
  grossEquityValue: number;
  exerciseCost: number;
  preTaxProceeds: number;
  estimatedTax: number;
  estimatedTakeHome: number;
  returnMultiple: number;
  valueRetained: number;
};

export type PresentationWaterfallStep = {
  key:
    | "gross"
    | "exercise"
    | "tax"
    | "takeHome";
  label: string;
  value: number;
  direction: "positive" | "negative" | "result";
};

export type PresentationOwnershipPoint = {
  key:
    | "granted"
    | "vested"
    | "currentOwnership"
    | "dilutedOwnership";
  label: string;
  value: number;
  displayValue: number;
};

export type PresentationSensitivityItem = {
  key:
    | "valuation"
    | "dilution"
    | "exercise"
    | "tax"
    | "vesting";
  label: string;
  value: number;
  displayValue: number;
  unit: "INR" | "%" | "options";
  description: string;
};

export type PresentationData = {
  metadata: {
    companyName: string;
    grantName: string;
    currency: string;
    analysisBasis: PresentationAnalysisBasis;
    confirmedGrant: boolean;
    generatedAt: string;
  };

  grant: {
    totalOptions: number;
    vestedOptions: number;
    vestedPercentage: number;
    modeledOptions: number;
    exercisePrice: number;
    exerciseCost: number;
  };

  vesting: {
    vestingPeriodMonths: number;
    cliffMonths: number;
    monthsCompleted: number;
    vestedPercentage: number;
    vestedOptions: number;
    unvestedOptions: number;
  };

  ownership: {
    totalCompanyShares: number;
    currentOwnership: number;
    futureDilution: number;
    dilutedOwnership: number;
  };

  valuation: {
    currentCompanyValuation: number;
    currentModeledEquityValue: number;
    baseExitValuation: number;
  };

  tax: {
    exerciseFMV: number;
    otherAnnualIncome: number;
    holdingPeriodMonths: number;
    equityType: "UNLISTED" | "LISTED";
    taxRegime: "NEW" | "OLD";
  };

  scenarios: PresentationScenario[];

  selectedScenario: PresentationScenarioKey;

  waterfall: PresentationWaterfallStep[];

  ownershipJourney: PresentationOwnershipPoint[];

  sensitivity: PresentationSensitivityItem[];

  summary: {
    bearToBullRange: number;
    bearToBaseChange: number;
    baseToBullChange: number;
    bullUpsidePercentage: number;
    bearDownsidePercentage: number;
  };

  modelContext: {
    sourceGrantId: string | null;
    sourceDocumentId: string | null;
    sourceConfirmedAt: string | null;
    vestingStartDate: string | null;
    expiryDate: string | null;
    postTerminationExerciseDays: number | null;
    exercisePlanOptions: number;
    exercisePlanWaitMonths: number;
    exercisePlanFMV: number;
  };
};

type BuildPresentationOptions = {
  analysisBasis?: PresentationAnalysisBasis;
  selectedScenario?: PresentationScenarioKey;
};

/**
 * Builds the Presentation Mode read model from the existing shared
 * EVC PRO state.
 *
 * IMPORTANT:
 * This function is intentionally read-only.
 * It does not update Pro state, localStorage, grants, tax assumptions,
 * simulator assumptions, or any existing EVC workflow.
 */
export function buildPresentationModel(
  proState: ProEquityState,
  options: BuildPresentationOptions = {},
): PresentationData {
  const analysisBasis =
    options.analysisBasis ?? "FULL_GRANT";

  const selectedScenarioKey =
    options.selectedScenario ?? "base";

  const totalOptions = Math.max(
    0,
    normalizeProNumber(proState.totalOptions),
  );

  const vestedOptions = Math.max(
    0,
    normalizeProNumber(proState.vestedOptions),
  );

  const modeledOptions =
    analysisBasis === "FULL_GRANT"
      ? totalOptions
      : vestedOptions;

  const vestedPercentage =
    totalOptions > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (vestedOptions / totalOptions) * 100,
          ),
        )
      : Math.max(
          0,
          normalizeProNumber(proState.vestedPercentage),
        );

  const normalizedModeledVestingPercentage =
    totalOptions > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (modeledOptions / totalOptions) * 100,
          ),
        )
      : 0;

  const unvestedOptions = Math.max(
    0,
    totalOptions - vestedOptions,
  );

  const exercisePrice = Math.max(
    0,
    normalizeProNumber(proState.exercisePrice),
  );

  const companyShares = Math.max(
    0,
    normalizeProNumber(proState.totalCompanyShares),
  );

  const currentCompanyValuation = Math.max(
    0,
    normalizeProNumber(
      proState.currentCompanyValuation,
    ),
  );

  const exitValuation = Math.max(
    0,
    normalizeProNumber(proState.exitValuation),
  );

  const dilution = Math.min(
    100,
    Math.max(
      0,
      normalizeProNumber(
        proState.futureDilutionPercentage,
      ),
    ),
  );

  const exerciseFMV = Math.max(
    0,
    normalizeProNumber(proState.exerciseFMV),
  );

  const otherAnnualIncome = Math.max(
    0,
    normalizeProNumber(
      proState.otherAnnualIncome,
    ),
  );

  const holdingPeriodMonths = Math.max(
    0,
    normalizeProNumber(
      proState.holdingPeriodMonths,
    ),
  );

  const currentOwnership =
    companyShares > 0
      ? (modeledOptions / companyShares) * 100
      : 0;

  const dilutedOwnership =
    currentOwnership * (1 - dilution / 100);

  const exerciseCost =
    modeledOptions * exercisePrice;

  const currentModeledEquityValue =
    (currentOwnership / 100) *
    currentCompanyValuation;

  const scenarioDefinitions: Array<{
    key: PresentationScenarioKey;
    label: "BEAR" | "BASE" | "BULL";
    title: string;
    factor: number;
  }> = [
    {
      key: "bear",
      label: "BEAR",
      title: "Lower-growth outcome",
      factor: 0.5,
    },
    {
      key: "base",
      label: "BASE",
      title: "Current assumption",
      factor: 1,
    },
    {
      key: "bull",
      label: "BULL",
      title: "Strong-growth outcome",
      factor: 2,
    },
  ];

  const scenarios: PresentationScenario[] =
    scenarioDefinitions.map(
      ({
        key,
        label,
        title,
        factor,
      }) => {
        const scenarioExitValuation =
          exitValuation * factor;

        const grossEquityValue =
          (dilutedOwnership / 100) *
          scenarioExitValuation;

        const preTaxProceeds = Math.max(
          0,
          grossEquityValue - exerciseCost,
        );

        const salePrice =
          companyShares > 0
            ? (scenarioExitValuation /
                companyShares) *
              (1 - dilution / 100)
            : 0;

        const tax = calculateAdvancedTax({
          vestedShares: modeledOptions,
          strikePrice: exercisePrice,
          exerciseFMV,
          salePrice,
          otherAnnualIncome,
          holdingPeriodMonths,
          equityType: proState.equityType,
          taxRegime: proState.taxRegime,
        });

        const estimatedTakeHome = Math.max(
          0,
          tax.netTakeHome,
        );

        const returnMultiple =
          exerciseCost > 0
            ? estimatedTakeHome /
              exerciseCost
            : 0;

        const valueRetained =
          grossEquityValue > 0
            ? (estimatedTakeHome /
                grossEquityValue) *
              100
            : 0;

        return {
          key,
          label,
          title,
          factor,
          exitValuation:
            scenarioExitValuation,
          salePrice,
          grossEquityValue,
          exerciseCost,
          preTaxProceeds,
          estimatedTax:
            tax.totalEstimatedTax,
          estimatedTakeHome,
          returnMultiple,
          valueRetained,
        };
      },
    );

  const bear =
    scenarios.find(
      (scenario) => scenario.key === "bear",
    )!;

  const base =
    scenarios.find(
      (scenario) => scenario.key === "base",
    )!;

  const bull =
    scenarios.find(
      (scenario) => scenario.key === "bull",
    )!;

  const selectedScenario =
    scenarios.find(
      (scenario) =>
        scenario.key === selectedScenarioKey,
    ) ?? base;

  const bearToBullRange = Math.max(
    0,
    bull.estimatedTakeHome -
      bear.estimatedTakeHome,
  );

  const bearToBaseChange = Math.max(
    0,
    base.estimatedTakeHome -
      bear.estimatedTakeHome,
  );

  const baseToBullChange = Math.max(
    0,
    bull.estimatedTakeHome -
      base.estimatedTakeHome,
  );

  const bullUpsidePercentage =
    base.estimatedTakeHome > 0
      ? ((bull.estimatedTakeHome -
          base.estimatedTakeHome) /
          base.estimatedTakeHome) *
        100
      : 0;

  const bearDownsidePercentage =
    base.estimatedTakeHome > 0
      ? ((base.estimatedTakeHome -
          bear.estimatedTakeHome) /
          base.estimatedTakeHome) *
        100
      : 0;

  const waterfall: PresentationWaterfallStep[] =
    [
      {
        key: "gross",
        label: "Gross equity value",
        value:
          selectedScenario.grossEquityValue,
        direction: "positive",
      },
      {
        key: "exercise",
        label: "Exercise cost",
        value: selectedScenario.exerciseCost,
        direction: "negative",
      },
      {
        key: "tax",
        label: "Estimated tax",
        value:
          selectedScenario.estimatedTax,
        direction: "negative",
      },
      {
        key: "takeHome",
        label: "Estimated take-home",
        value:
          selectedScenario.estimatedTakeHome,
        direction: "result",
      },
    ];

  const ownershipJourney: PresentationOwnershipPoint[] =
    [
      {
        key: "granted",
        label: "Granted",
        value: totalOptions,
        displayValue: totalOptions,
      },
      {
        key: "vested",
        label: "Vested",
        value: vestedOptions,
        displayValue: vestedOptions,
      },
      {
        key: "currentOwnership",
        label: "Current ownership",
        value: currentOwnership,
        displayValue: currentOwnership,
      },
      {
        key: "dilutedOwnership",
        label: "After dilution",
        value: dilutedOwnership,
        displayValue: dilutedOwnership,
      },
    ];

  const sensitivity: PresentationSensitivityItem[] =
    [
      {
        key: "valuation",
        label: "Exit valuation",
        value: selectedScenario.exitValuation,
        displayValue:
          selectedScenario.exitValuation,
        unit: "INR",
        description:
          "The company outcome is the largest scenario driver in this model.",
      },
      {
        key: "dilution",
        label: "Future dilution",
        value: dilution,
        displayValue: dilution,
        unit: "%",
        description:
          "Future dilution reduces the modeled ownership stake before exit value is calculated.",
      },
      {
        key: "exercise",
        label: "Exercise cost",
        value: exerciseCost,
        displayValue: exerciseCost,
        unit: "INR",
        description:
          "The modeled capital required to exercise the selected option basis.",
      },
      {
        key: "tax",
        label: "Estimated tax",
        value:
          selectedScenario.estimatedTax,
        displayValue:
          selectedScenario.estimatedTax,
        unit: "INR",
        description:
          "Illustrative tax estimated from the existing EVC tax model.",
      },
      {
        key: "vesting",
        label: "Vesting",
        value: vestedPercentage,
        displayValue: vestedPercentage,
        unit: "%",
        description:
          "The currently vested position determines how much of the confirmed grant is already active.",
      },
    ];

  return {
    metadata: {
      companyName:
        proState.sourceCompanyName ||
        "Confirmed ESOP grant",
      grantName:
        proState.sourceGrantName ||
        "Current grant",
      currency:
        proState.sourceCurrency ||
        "INR",
      analysisBasis,
      confirmedGrant:
        Boolean(proState.sourceGrantId),
      generatedAt:
        new Date().toISOString(),
    },

    grant: {
      totalOptions,
      vestedOptions,
      vestedPercentage,
      modeledOptions,
      exercisePrice,
      exerciseCost,
    },

    vesting: {
      vestingPeriodMonths: Math.max(
        0,
        normalizeProNumber(
          proState.vestingPeriodMonths,
        ),
      ),
      cliffMonths: Math.max(
        0,
        normalizeProNumber(
          proState.cliffMonths,
        ),
      ),
      monthsCompleted: Math.max(
        0,
        normalizeProNumber(
          proState.monthsCompleted,
        ),
      ),
      vestedPercentage,
      vestedOptions,
      unvestedOptions,
    },

    ownership: {
      totalCompanyShares:
        companyShares,
      currentOwnership,
      futureDilution: dilution,
      dilutedOwnership,
    },

    valuation: {
      currentCompanyValuation,
      currentModeledEquityValue,
      baseExitValuation:
        exitValuation,
    },

    tax: {
      exerciseFMV,
      otherAnnualIncome,
      holdingPeriodMonths,
      equityType:
        proState.equityType,
      taxRegime:
        proState.taxRegime,
    },

    scenarios,

    selectedScenario:
      selectedScenario.key,

    waterfall,

    ownershipJourney,

    sensitivity,

    summary: {
      bearToBullRange,
      bearToBaseChange,
      baseToBullChange,
      bullUpsidePercentage,
      bearDownsidePercentage,
    },

    modelContext: {
      sourceGrantId:
        proState.sourceGrantId,
      sourceDocumentId:
        proState.sourceDocumentId,
      sourceConfirmedAt:
        proState.sourceConfirmedAt,
      vestingStartDate:
        proState.sourceVestingStartDate,
      expiryDate:
        proState.sourceExpiryDate,
      postTerminationExerciseDays:
        proState.sourcePostTerminationExerciseDays,
      exercisePlanOptions: Math.max(
        0,
        normalizeProNumber(
          proState.exercisePlanOptions,
        ),
      ),
      exercisePlanWaitMonths: Math.max(
        0,
        normalizeProNumber(
          proState.exercisePlanWaitMonths,
        ),
      ),
      exercisePlanFMV: Math.max(
        0,
        normalizeProNumber(
          proState.exercisePlanFMV,
        ),
      ),
    },
  };
}

/**
 * Small helper for Presentation Mode selectors.
 */
export function presentationScenarioLabel(
  key: PresentationScenarioKey,
) {
  if (key === "bear") return "BEAR";
  if (key === "bull") return "BULL";
  return "BASE";
}

/**
 * Small helper for the two analysis bases.
 */
export function presentationAnalysisLabel(
  basis: PresentationAnalysisBasis,
) {
  return basis === "FULL_GRANT"
    ? "Full grant"
    : "Currently vested";
}
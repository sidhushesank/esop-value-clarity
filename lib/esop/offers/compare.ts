/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   COMPARISON ENGINE

   Responsibilities:
   - analyze Offer A and Offer B independently
   - combine cash compensation + modeled equity economics
   - calculate 1Y / 2Y / 3Y / 4Y outcomes
   - compare Bear / Base / Bull scenarios
   - identify short-term and long-term winners
   - create the Offer Decision Matrix
   - surface assumptions and warnings

   IMPORTANT:
   This file DOES NOT:
   - calculate break-even tenure
   - calculate negotiation targets
   - scan offer letters
   - persist offer data
   - write to Phase 1–3 PRO state

   TAX NOTE:
   equity.ts intentionally leaves Phase 4 equity tax at zero
   until the established PRO tax engine is connected.

   Therefore the equity component used here is currently a
   PRE-TAX modeled equity value.
============================================================ */

import type {
  OfferAnalysisResult,
  OfferComparisonHorizon,
  OfferDecisionCategory,
  OfferDecisionMatrixItem,
  OfferHorizonComparison,
  OfferHorizonResult,
  OfferInput,
  OfferLiquidityLevel,
  OfferRiskLevel,
  OfferScenarioKey,
  OfferWinner,
} from "./types";

import {
  OFFER_COMPARISON_HORIZONS,
  OFFER_SCENARIOS,
} from "./types";

import {
  analyzeOfferCompensation,
} from "./compensation";

import {
  analyzeOfferEquity,
} from "./equity";

import {
  normalizeOfferInput,
} from "./normalize";

/* ============================================================
   LOCAL RESULT TYPE

   File 7 will later wrap this result with:
   - break-even
   - negotiation intelligence

   We intentionally do not manufacture placeholder results here.
============================================================ */

export type CoreOfferComparisonResult = {
  offerA: OfferAnalysisResult;

  offerB: OfferAnalysisResult;

  comparisons:
    OfferHorizonComparison[];

  decisionMatrix:
    OfferDecisionMatrixItem[];

  baseCaseWinner:
    OfferWinner;

  shortTermWinner:
    OfferWinner;

  longTermWinner:
    OfferWinner;

  summary: string;

  assumptions: string[];

  warnings: string[];
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

function uniqueStrings(
  values: string[]
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) =>
          value.trim()
        )
        .filter(Boolean)
    )
  );
}

/* ============================================================
   WINNER HELPERS

   We use a small tolerance to avoid declaring a winner because
   of floating-point noise.
============================================================ */

function determineNumericWinner(
  offerAValue: number,
  offerBValue: number,
  tolerance = 0.01
): OfferWinner {
  const a =
    safeNumber(
      offerAValue
    );

  const b =
    safeNumber(
      offerBValue
    );

  if (
    Math.abs(a - b) <=
    tolerance
  ) {
    return "TIE";
  }

  return a > b
    ? "A"
    : "B";
}

function determineLowerValueWinner(
  offerAValue: number,
  offerBValue: number,
  tolerance = 0.01
): OfferWinner {
  const a =
    safeNumber(
      offerAValue
    );

  const b =
    safeNumber(
      offerBValue
    );

  if (
    Math.abs(a - b) <=
    tolerance
  ) {
    return "TIE";
  }

  return a < b
    ? "A"
    : "B";
}

/* ============================================================
   RISK / LIQUIDITY SCORES

   These are ordinal comparison scores only.
   They are NOT financial probabilities.
============================================================ */

function liquidityScore(
  value: OfferLiquidityLevel
): number {
  switch (value) {
    case "HIGH":
      return 3;

    case "MEDIUM":
      return 2;

    case "LOW":
      return 1;

    default:
      return 0;
  }
}

function riskScore(
  value: OfferRiskLevel
): number {
  switch (value) {
    case "LOW":
      return 1;

    case "MEDIUM":
      return 2;

    case "HIGH":
      return 3;

    default:
      return 4;
  }
}

/* ============================================================
   CASH CERTAINTY

   OfferRiskLevel is used here as a risk classification:

   LOW risk    = high cash certainty
   MEDIUM risk = moderate variable dependence
   HIGH risk   = high variable dependence
============================================================ */

export function determineCashCertainty(
  guaranteedRecurringCash: number,
  targetVariableCash: number
): OfferRiskLevel {
  const guaranteed =
    safePositive(
      guaranteedRecurringCash
    );

  const variable =
    safePositive(
      targetVariableCash
    );

  const total =
    guaranteed +
    variable;

  if (total <= 0) {
    return "UNKNOWN";
  }

  const variableShare =
    variable / total;

  if (
    variableShare <= 0.1
  ) {
    return "LOW";
  }

  if (
    variableShare <= 0.25
  ) {
    return "MEDIUM";
  }

  return "HIGH";
}

/* ============================================================
   SCENARIO EQUITY VALUE SELECTOR
============================================================ */

export function getScenarioEquityValue(
  horizon:
    OfferHorizonResult,
  scenario:
    OfferScenarioKey
): number {
  if (
    scenario === "BEAR"
  ) {
    return safePositive(
      horizon.bearEquity
        .postDilutionNetEquityValue
    );
  }

  if (
    scenario === "BULL"
  ) {
    return safePositive(
      horizon.bullEquity
        .postDilutionNetEquityValue
    );
  }

  return safePositive(
    horizon.baseEquity
      .postDilutionNetEquityValue
  );
}

/* ============================================================
   TOTAL ECONOMIC VALUE SELECTOR
============================================================ */

export function getScenarioTotalValue(
  horizon:
    OfferHorizonResult,
  scenario:
    OfferScenarioKey
): number {
  if (
    scenario === "BEAR"
  ) {
    return safePositive(
      horizon.bearTotalEconomicValue
    );
  }

  if (
    scenario === "BULL"
  ) {
    return safePositive(
      horizon.bullTotalEconomicValue
    );
  }

  return safePositive(
    horizon.baseTotalEconomicValue
  );
}

/* ============================================================
   ANALYZE ONE OFFER

   Combines:
   compensation.ts
   +
   equity.ts

   Both underlying engines remain independent.
============================================================ */

export function analyzeOffer(
  offerInput:
    OfferInput
): OfferAnalysisResult {
  const offer =
    normalizeOfferInput(
      offerInput,
      offerInput.side
    );

  const compensation =
    analyzeOfferCompensation(
      offer
    );

  const equity =
    analyzeOfferEquity(
      offer
    );

  const cashCertainty =
    determineCashCertainty(
      compensation
        .normalizedCash
        .guaranteedRecurringCash,

      compensation
        .normalizedCash
        .targetVariableCash
    );

  const buildHorizon = (
    horizonMonths:
      OfferComparisonHorizon
  ): OfferHorizonResult => {
    const cash =
      compensation
        .horizons[
          horizonMonths
        ];

    const equityHorizon =
      equity
        .horizons[
          horizonMonths
        ];

    /*
     * IMPORTANT:
     *
     * Headline CTC is NOT used as the comparison value.
     *
     * Economic cash value includes:
     * - guaranteed recurring cash
     * - target variable compensation
     * - one-time compensation
     * - employer-side benefits
     * - additional modeled benefits
     */

    const cashEconomicValue =
      safePositive(
        cash
          .cumulativeTargetEconomicCompensation
      );

    const bearEquityValue =
      safePositive(
        equityHorizon
          .bear
          .postDilutionNetEquityValue
      );

    const baseEquityValue =
      safePositive(
        equityHorizon
          .base
          .postDilutionNetEquityValue
      );

    const bullEquityValue =
      safePositive(
        equityHorizon
          .bull
          .postDilutionNetEquityValue
      );

    return {
      horizonMonths,

      years:
        cash.years,

      cumulativeGuaranteedCash:
        cash
          .cumulativeGuaranteedCash,

      cumulativeTargetVariableCash:
        cash
          .cumulativeTargetVariableCash,

      cumulativeOneTimeCash:
        cash
          .cumulativeOneTimeCash,

      cumulativeBenefits:
        cash
          .cumulativeEmployerBenefits +
        cash
          .cumulativeAdditionalBenefits,

      cumulativeTargetCashCompensation:
        cash
          .cumulativeTargetCashCompensation,

      vesting:
        equityHorizon
          .vesting,

      bearEquity:
        equityHorizon
          .bear,

      baseEquity:
        equityHorizon
          .base,

      bullEquity:
        equityHorizon
          .bull,

      bearTotalEconomicValue:
        cashEconomicValue +
        bearEquityValue,

      baseTotalEconomicValue:
        cashEconomicValue +
        baseEquityValue,

      bullTotalEconomicValue:
        cashEconomicValue +
        bullEquityValue,
    };
  };

  const horizons: Record<
    OfferComparisonHorizon,
    OfferHorizonResult
  > = {
    12:
      buildHorizon(12),

    24:
      buildHorizon(24),

    36:
      buildHorizon(36),

    48:
      buildHorizon(48),
  };

  return {
    offerId:
      offer.id,

    side:
      offer.side,

    employer:
      offer.employer,

    normalizedCash:
      compensation
        .normalizedCash,

    horizons,

    liquidity:
      equity.liquidity,

    equityRisk:
      equity.risk,

    cashCertainty,

    hasEquity:
      equity.hasEquity,

    hasSufficientEquityData:
      equity
        .hasSufficientData,

    missingEquityFields:
      equity
        .missingFields,

    assumptions:
      uniqueStrings([
        ...compensation
          .assumptions,

        ...equity
          .assumptions,
      ]),

    warnings:
      uniqueStrings([
        ...compensation
          .warnings,

        ...equity
          .warnings,
      ]),
  };
}

/* ============================================================
   COMPARE ONE HORIZON / ONE SCENARIO
============================================================ */

export function compareOfferHorizon(
  offerA:
    OfferAnalysisResult,
  offerB:
    OfferAnalysisResult,
  horizonMonths:
    OfferComparisonHorizon,
  scenario:
    OfferScenarioKey
): OfferHorizonComparison {
  const valueA =
    getScenarioTotalValue(
      offerA
        .horizons[
          horizonMonths
        ],
      scenario
    );

  const valueB =
    getScenarioTotalValue(
      offerB
        .horizons[
          horizonMonths
        ],
      scenario
    );

  return {
    horizonMonths,

    scenario,

    offerAValue:
      valueA,

    offerBValue:
      valueB,

    difference:
      Math.abs(
        valueA -
        valueB
      ),

    winner:
      determineNumericWinner(
        valueA,
        valueB
      ),
  };
}

/* ============================================================
   ALL STANDARD COMPARISONS

   4 horizons × 3 scenarios = 12 comparisons
============================================================ */

export function buildHorizonComparisons(
  offerA:
    OfferAnalysisResult,
  offerB:
    OfferAnalysisResult
): OfferHorizonComparison[] {
  const comparisons:
    OfferHorizonComparison[] =
    [];

  for (
    const horizon of
    OFFER_COMPARISON_HORIZONS
  ) {
    for (
      const scenario of
      OFFER_SCENARIOS
    ) {
      comparisons.push(
        compareOfferHorizon(
          offerA,
          offerB,
          horizon,
          scenario
        )
      );
    }
  }

  return comparisons;
}

/* ============================================================
   DECISION MATRIX HELPERS
============================================================ */

function formatMoneyForDecision(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    safeNumber(value)
  );
}

function formatRiskForDecision(
  value: OfferRiskLevel
): string {
  if (
    value === "UNKNOWN"
  ) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .replace(
      /^./,
      (character) =>
        character.toUpperCase()
    );
}

function formatLiquidityForDecision(
  value: OfferLiquidityLevel
): string {
  if (
    value === "UNKNOWN"
  ) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .replace(
      /^./,
      (character) =>
        character.toUpperCase()
    );
}

/* ============================================================
   DECISION MATRIX ITEM
============================================================ */

function createDecisionItem(
  category:
    OfferDecisionCategory,
  label: string,
  winner:
    OfferWinner,
  offerAValue:
    string,
  offerBValue:
    string,
  explanation:
    string
): OfferDecisionMatrixItem {
  return {
    category,

    label,

    winner,

    offerAValue,

    offerBValue,

    explanation,
  };
}

/* ============================================================
   DECISION MATRIX
============================================================ */

export function buildDecisionMatrix(
  offerA:
    OfferAnalysisResult,
  offerB:
    OfferAnalysisResult
): OfferDecisionMatrixItem[] {
  const matrix:
    OfferDecisionMatrixItem[] =
    [];

  /* ----------------------------------------------------------
     GUARANTEED CASH
  ---------------------------------------------------------- */

  const guaranteedA =
    offerA
      .normalizedCash
      .guaranteedRecurringCash;

  const guaranteedB =
    offerB
      .normalizedCash
      .guaranteedRecurringCash;

  matrix.push(
    createDecisionItem(
      "GUARANTEED_CASH",

      "Guaranteed recurring cash",

      determineNumericWinner(
        guaranteedA,
        guaranteedB
      ),

      formatMoneyForDecision(
        guaranteedA
      ),

      formatMoneyForDecision(
        guaranteedB
      ),

      "Compares recurring compensation before variable pay, one-time amounts and equity."
    )
  );

  /* ----------------------------------------------------------
     1 / 2 / 3 / 4 YEAR — BASE CASE
  ---------------------------------------------------------- */

  const horizonCategories: Array<{
    horizon:
      OfferComparisonHorizon;

    category:
      OfferDecisionCategory;

    label:
      string;
  }> = [
    {
      horizon: 12,
      category:
        "FIRST_YEAR",
      label:
        "1-year modeled economics",
    },

    {
      horizon: 24,
      category:
        "TWO_YEAR",
      label:
        "2-year modeled economics",
    },

    {
      horizon: 36,
      category:
        "THREE_YEAR",
      label:
        "3-year modeled economics",
    },

    {
      horizon: 48,
      category:
        "FOUR_YEAR",
      label:
        "4-year modeled economics",
    },
  ];

  for (
    const item of
    horizonCategories
  ) {
    const valueA =
      offerA
        .horizons[
          item.horizon
        ]
        .baseTotalEconomicValue;

    const valueB =
      offerB
        .horizons[
          item.horizon
        ]
        .baseTotalEconomicValue;

    matrix.push(
      createDecisionItem(
        item.category,

        item.label,

        determineNumericWinner(
          valueA,
          valueB
        ),

        formatMoneyForDecision(
          valueA
        ),

        formatMoneyForDecision(
          valueB
        ),

        "Uses cumulative target compensation plus the Base modeled post-dilution equity value."
      )
    );
  }

  /* ----------------------------------------------------------
     EQUITY UPSIDE — 4 YEAR BULL
  ---------------------------------------------------------- */

  const bullEquityA =
    offerA
      .horizons[48]
      .bullEquity
      .postDilutionNetEquityValue;

  const bullEquityB =
    offerB
      .horizons[48]
      .bullEquity
      .postDilutionNetEquityValue;

  matrix.push(
    createDecisionItem(
      "EQUITY_UPSIDE",

      "Modeled equity upside",

      determineNumericWinner(
        bullEquityA,
        bullEquityB
      ),

      formatMoneyForDecision(
        bullEquityA
      ),

      formatMoneyForDecision(
        bullEquityB
      ),

      "Compares the 4-year Bull modeled equity value after the simplified dilution assumption."
    )
  );

  /* ----------------------------------------------------------
     LIQUIDITY
  ---------------------------------------------------------- */

  matrix.push(
    createDecisionItem(
      "LIQUIDITY",

      "Equity liquidity",

      determineNumericWinner(
        liquidityScore(
          offerA.liquidity
        ),
        liquidityScore(
          offerB.liquidity
        )
      ),

      formatLiquidityForDecision(
        offerA.liquidity
      ),

      formatLiquidityForDecision(
        offerB.liquidity
      ),

      "Listed equity is generally modeled as more liquid than private-company equity."
    )
  );

  /* ----------------------------------------------------------
     CASH CERTAINTY

     Lower risk score wins.
  ---------------------------------------------------------- */

  matrix.push(
    createDecisionItem(
      "CASH_CERTAINTY",

      "Cash certainty",

      determineLowerValueWinner(
        riskScore(
          offerA.cashCertainty
        ),
        riskScore(
          offerB.cashCertainty
        )
      ),

      formatRiskForDecision(
        offerA.cashCertainty
      ),

      formatRiskForDecision(
        offerB.cashCertainty
      ),

      "Lower dependence on target variable compensation produces greater modeled cash certainty."
    )
  );

  /* ----------------------------------------------------------
     LOWER EXERCISE BURDEN

     Compare 4Y Base exercise capital.
  ---------------------------------------------------------- */

  const exerciseBurdenA =
    offerA
      .horizons[48]
      .baseEquity
      .totalCapitalRequired;

  const exerciseBurdenB =
    offerB
      .horizons[48]
      .baseEquity
      .totalCapitalRequired;

  matrix.push(
    createDecisionItem(
      "LOWER_EXERCISE_BURDEN",

      "Lower exercise capital",

      determineLowerValueWinner(
        exerciseBurdenA,
        exerciseBurdenB
      ),

      formatMoneyForDecision(
        exerciseBurdenA
      ),

      formatMoneyForDecision(
        exerciseBurdenB
      ),

      "Compares modeled employee capital required for the 4-year Base equity position. Phase 4 tax integration is not yet included."
    )
  );

  /* ----------------------------------------------------------
     LOWER EQUITY RISK
  ---------------------------------------------------------- */

  matrix.push(
    createDecisionItem(
      "LOWER_EQUITY_RISK",

      "Lower equity risk",

      determineLowerValueWinner(
        riskScore(
          offerA.equityRisk
        ),
        riskScore(
          offerB.equityRisk
        )
      ),

      formatRiskForDecision(
        offerA.equityRisk
      ),

      formatRiskForDecision(
        offerB.equityRisk
      ),

      "Compares the model's qualitative equity-risk classification rather than a probability of loss."
    )
  );

  return matrix;
}

/* ============================================================
   LABEL HELPERS
============================================================ */

function offerLabel(
  offer:
    OfferAnalysisResult
): string {
  const company =
    offer.employer
      .companyName
      .trim();

  return company
    ? company
    : `Offer ${offer.side}`;
}

function winnerLabel(
  winner:
    OfferWinner,
  offerA:
    OfferAnalysisResult,
  offerB:
    OfferAnalysisResult
): string {
  if (
    winner === "A"
  ) {
    return offerLabel(
      offerA
    );
  }

  if (
    winner === "B"
  ) {
    return offerLabel(
      offerB
    );
  }

  if (
    winner === "TIE"
  ) {
    return "Both offers";
  }

  return "Neither offer";
}

/* ============================================================
   SUMMARY
============================================================ */

export function buildComparisonSummary(
  offerA:
    OfferAnalysisResult,
  offerB:
    OfferAnalysisResult,
  shortTermWinner:
    OfferWinner,
  longTermWinner:
    OfferWinner
): string {
  const shortLabel =
    winnerLabel(
      shortTermWinner,
      offerA,
      offerB
    );

  const longLabel =
    winnerLabel(
      longTermWinner,
      offerA,
      offerB
    );

  if (
    shortTermWinner ===
      "UNDETERMINED" ||
    longTermWinner ===
      "UNDETERMINED"
  ) {
    return "The available offer information is not sufficient to produce a complete comparison.";
  }

  if (
    shortTermWinner ===
      "TIE" &&
    longTermWinner ===
      "TIE"
  ) {
    return "The two offers are approximately equal under the modeled 1-year and 4-year Base assumptions.";
  }

  if (
    shortTermWinner ===
    longTermWinner
  ) {
    if (
      shortTermWinner ===
      "TIE"
    ) {
      return "The offers remain approximately equal across the modeled short-term and long-term Base horizons.";
    }

    return `${shortLabel} leads under both the modeled 1-year and 4-year Base scenarios. Review liquidity, equity risk and exercise capital before treating that lead as guaranteed compensation.`;
  }

  return `${shortLabel} leads at the modeled 1-year Base horizon, while ${longLabel} leads at the modeled 4-year Base horizon. The trade-off changes over time as cash compensation and equity vesting accumulate.`;
}

/* ============================================================
   COMPARISON WARNINGS
============================================================ */

function buildComparisonWarnings(
  offerA:
    OfferAnalysisResult,
  offerB:
    OfferAnalysisResult
): string[] {
  const warnings =
    uniqueStrings([
      ...offerA.warnings.map(
        (warning) =>
          `Offer A: ${warning}`
      ),

      ...offerB.warnings.map(
        (warning) =>
          `Offer B: ${warning}`
      ),
    ]);

  if (
    offerA.hasEquity ||
    offerB.hasEquity
  ) {
    warnings.push(
      "Phase 4 equity values are currently pre-tax. The established PRO tax engine has not yet been connected to Offer Intelligence."
    );
  }

  if (
    offerA.hasEquity &&
    !offerA
      .hasSufficientEquityData
  ) {
    warnings.push(
      "Offer A equity data is incomplete, so its modeled economic value may be understated or unavailable."
    );
  }

  if (
    offerB.hasEquity &&
    !offerB
      .hasSufficientEquityData
  ) {
    warnings.push(
      "Offer B equity data is incomplete, so its modeled economic value may be understated or unavailable."
    );
  }

  return uniqueStrings(
    warnings
  );
}

/* ============================================================
   COMPLETE CORE COMPARISON

   THIS IS ONE OF THE EXPORTS REQUIRED BY negotiation.ts
============================================================ */

export function compareOffers(
  offerAInput:
    OfferInput,
  offerBInput:
    OfferInput
): CoreOfferComparisonResult {
  /*
   * Force A/B sides so accidentally copied objects cannot
   * silently become the same side.
   */

  const normalizedA =
    normalizeOfferInput(
      {
        ...offerAInput,
        side: "A",
      },
      "A"
    );

  const normalizedB =
    normalizeOfferInput(
      {
        ...offerBInput,
        side: "B",
      },
      "B"
    );

  const offerA =
    analyzeOffer(
      normalizedA
    );

  const offerB =
    analyzeOffer(
      normalizedB
    );

  const comparisons =
    buildHorizonComparisons(
      offerA,
      offerB
    );

  const decisionMatrix =
    buildDecisionMatrix(
      offerA,
      offerB
    );

  /*
   * Base assumptions drive headline winner language.
   *
   * 12 months = short-term
   * 48 months = long-term
   */

  const shortTermWinner =
    compareOfferHorizon(
      offerA,
      offerB,
      12,
      "BASE"
    ).winner;

  const longTermWinner =
    compareOfferHorizon(
      offerA,
      offerB,
      48,
      "BASE"
    ).winner;

  const baseCaseWinner =
    longTermWinner;

  const summary =
    buildComparisonSummary(
      offerA,
      offerB,
      shortTermWinner,
      longTermWinner
    );

  const assumptions =
    uniqueStrings([
      ...offerA.assumptions,

      ...offerB.assumptions,

      "Offer comparison uses target compensation rather than maximum variable compensation.",

      "Headline CTC is not used as the primary economic comparison value.",

      "The 1-year Base scenario is treated as the short-term comparison.",

      "The 4-year Base scenario is treated as the long-term comparison.",

      "Bear, Base and Bull change the modeled equity value while confirmed cash-compensation inputs remain unchanged.",

      "Modeled equity value is not guaranteed realizable cash.",

      "Break-even tenure is calculated separately by the Phase 4 break-even engine.",

      "Negotiation targets are calculated separately by the Phase 4 negotiation engine.",
    ]);

  const warnings =
    buildComparisonWarnings(
      offerA,
      offerB
    );

  return {
    offerA,

    offerB,

    comparisons,

    decisionMatrix,

    baseCaseWinner,

    shortTermWinner,

    longTermWinner,

    summary,

    assumptions,

    warnings,
  };
}

/* ============================================================
   LOOK UP A SPECIFIC COMPARISON

   THIS IS THE SECOND EXPORT REQUIRED BY negotiation.ts
============================================================ */

export function getOfferComparison(
  result:
    CoreOfferComparisonResult,
  horizonMonths:
    OfferComparisonHorizon,
  scenario:
    OfferScenarioKey
): OfferHorizonComparison {
  const existing =
    result.comparisons.find(
      (comparison) =>
        comparison.horizonMonths ===
          horizonMonths &&
        comparison.scenario ===
          scenario
    );

  if (existing) {
    return existing;
  }

  return compareOfferHorizon(
    result.offerA,
    result.offerB,
    horizonMonths,
    scenario
  );
}

/* ============================================================
   HEADLINE COMPARISON SNAPSHOT

   Later UI:

   1 YEAR
   Offer A ₹31.4L
   Offer B ₹28.8L

   4 YEAR
   Offer A ₹1.31Cr
   Offer B ₹1.48Cr
============================================================ */

export function getComparisonSnapshot(
  result:
    CoreOfferComparisonResult,
  scenario:
    OfferScenarioKey = "BASE"
): Array<{
  horizonMonths:
    OfferComparisonHorizon;

  offerAValue:
    number;

  offerBValue:
    number;

  difference:
    number;

  winner:
    OfferWinner;
}> {
  return OFFER_COMPARISON_HORIZONS.map(
    (horizonMonths) => {
      const comparison =
        getOfferComparison(
          result,
          horizonMonths,
          scenario
        );

      return {
        horizonMonths,

        offerAValue:
          comparison.offerAValue,

        offerBValue:
          comparison.offerBValue,

        difference:
          comparison.difference,

        winner:
          comparison.winner,
      };
    }
  );
}
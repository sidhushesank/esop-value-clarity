/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   BREAK-EVEN ENGINE

   Responsibilities:
   - compare Offer A vs Offer B month-by-month
   - calculate economic value from month 1 through month 48
   - detect when one offer overtakes the other
   - support Bear / Base / Bull break-even analysis
   - distinguish a real crossover from a permanent winner
   - provide UI-ready timeline information

   IMPORTANT:
   This file DOES NOT:
   - modify either offer
   - calculate negotiation targets
   - scan documents
   - write to PRO shared state
   - independently calculate tax

   It consumes the same compensation and equity assumptions
   already established by the Phase 4 engines.

   TAX NOTE:
   Phase 4 equity values remain pre-tax until the established
   PRO tax engine is connected.
============================================================ */

import type {
  OfferBreakEvenResult,
  OfferInput,
  OfferScenarioKey,
  OfferWinner,
} from "./types";

import {
  calculateOfferCashBreakdown,
} from "./compensation";

import {
  calculateOfferEquityScenario,
  determineEquityValueBasis,
} from "./equity";

import {
  normalizeOfferInput,
} from "./normalize";

/* ============================================================
   LOCAL TYPES
============================================================ */

export type OfferMonthlyEconomicPoint = {
  month: number;

  yearsElapsed: number;

  offerAValue: number;

  offerBValue: number;

  difference: number;

  signedDifference: number;

  winner: OfferWinner;
};

export type OfferBreakEvenAnalysis = {
  scenario: OfferScenarioKey;

  result: OfferBreakEvenResult;

  timeline: OfferMonthlyEconomicPoint[];

  firstMonthWinner: OfferWinner;

  finalMonthWinner: OfferWinner;

  crossoverCount: number;

  crossoverMonths: number[];

  warnings: string[];

  assumptions: string[];
};

/* ============================================================
   CONSTANTS
============================================================ */

const DEFAULT_MAX_MONTHS =
  48;

const WINNER_TOLERANCE =
  0.01;

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

function clampMonth(
  value: number,
  maximum: number
): number {
  return Math.min(
    Math.max(
      Math.round(
        safePositive(value)
      ),
      1
    ),
    Math.max(
      Math.round(
        safePositive(maximum)
      ),
      1
    )
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
   WINNER
============================================================ */

function determineWinner(
  offerAValue: number,
  offerBValue: number,
  tolerance =
    WINNER_TOLERANCE
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

/* ============================================================
   SCENARIO MULTIPLIER

   We need a generic month-by-month equity calculation.

   equity.ts exposes scenario calculations for standard comparison
   horizons (12 / 24 / 36 / 48). Break-even requires every month.

   We therefore use the same scenario multiplier values from the
   normalized equity model.
============================================================ */

function getScenarioMultiplier(
  offer: OfferInput,
  scenario: OfferScenarioKey
): number {
  if (
    scenario === "BEAR"
  ) {
    return safePositive(
      offer.equity
        .bearEquityMultiplier
    );
  }

  if (
    scenario === "BULL"
  ) {
    return safePositive(
      offer.equity
        .bullEquityMultiplier
    );
  }

  return safePositive(
    offer.equity
      .baseEquityMultiplier
  );
}

/* ============================================================
   MONTHLY CASH VALUE

   Compensation V1 assumptions:
   - recurring cash accrues evenly through the year
   - target variable accrues evenly for comparison purposes
   - employer / additional benefits accrue evenly
   - one-time compensation is recognized once at the beginning
     of the modeled employment period

   This is an economic-comparison convention.

   It does NOT claim that an employer literally pays annual bonus
   every month.
============================================================ */

export function calculateOfferCashValueAtMonth(
  offerInput: OfferInput,
  month: number
): number {
  const offer =
    normalizeOfferInput(
      offerInput,
      offerInput.side
    );

  const completedMonth =
    Math.max(
      Math.round(
        safePositive(month)
      ),
      0
    );

  if (
    completedMonth <= 0
  ) {
    return 0;
  }

  const breakdown =
    calculateOfferCashBreakdown(
      offer.cash,
      offer.benefits
    );

  const annualRecurringEconomicValue =
    breakdown
      .targetAnnualCompensation +
    breakdown
      .employerBenefits +
    breakdown
      .additionalBenefits;

  const recurringAccrued =
    annualRecurringEconomicValue *
    (completedMonth / 12);

  /*
   * Joining / relocation / retention / other one-time amounts
   * are counted once.

   * Later scanner versions can attach explicit payment dates and
   * clawback periods.
   */
  const oneTimeValue =
    breakdown.oneTimeCash;

  return Math.max(
    recurringAccrued +
      oneTimeValue,
    0
  );
}

/* ============================================================
   MONTHLY VESTING

   This mirrors the Phase 4 equity engine's standard schedule:

   - before cliff = 0
   - at cliff = 25%
   - remaining 75% monthly
   - no cliff = straight-line
   - fully vested at end of schedule

   IMPORTANT:
   This models a NEW OFFER.

   It never writes to Phase 2 Vesting or shared PRO state.
============================================================ */

export function calculateOfferVestedQuantityAtMonth(
  offerInput: OfferInput,
  month: number
): number {
  const offer =
    normalizeOfferInput(
      offerInput,
      offerInput.side
    );

  const equity =
    offer.equity;

  if (
    equity.type === "NONE" ||
    equity.totalOptionsOrShares <=
      0
  ) {
    return 0;
  }

  const total =
    safePositive(
      equity.totalOptionsOrShares
    );

  const duration =
    Math.max(
      Math.round(
        safePositive(
          equity
            .vestingDurationMonths
        )
      ),
      1
    );

  const cliff =
    Math.min(
      Math.max(
        Math.round(
          safePositive(
            equity.cliffMonths
          )
        ),
        0
      ),
      duration
    );

  const completed =
    Math.min(
      Math.max(
        Math.round(
          safePositive(month)
        ),
        0
      ),
      duration
    );

  if (
    completed >= duration
  ) {
    return total;
  }

  if (
    completed < cliff
  ) {
    return 0;
  }

  /*
   * No cliff:
   * straight-line vesting.
   */
  if (
    cliff === 0
  ) {
    return Math.min(
      total *
        (completed /
          duration),
      total
    );
  }

  const cliffVesting =
    total * 0.25;

  const remaining =
    total -
    cliffVesting;

  const remainingMonths =
    duration -
    cliff;

  const monthsAfterCliff =
    completed -
    cliff;

  const monthlyVesting =
    remainingMonths > 0
      ? remaining /
        remainingMonths
      : 0;

  return Math.min(
    Math.max(
      cliffVesting +
        monthlyVesting *
          monthsAfterCliff,
      0
    ),
    total
  );
}

/* ============================================================
   MONTHLY EQUITY VALUE

   This uses the same economic structure as equity.ts:

   vested quantity
   × scenario-adjusted unit value
   - ESOP exercise capital
   × dilution multiplier

   Tax remains intentionally excluded until the established PRO
   tax engine is connected.
============================================================ */

export function calculateOfferEquityValueAtMonth(
  offerInput: OfferInput,
  month: number,
  scenario: OfferScenarioKey
): number {
  const offer =
    normalizeOfferInput(
      offerInput,
      offerInput.side
    );

  const equity =
    offer.equity;

  if (
    equity.type === "NONE"
  ) {
    return 0;
  }

  const vested =
    calculateOfferVestedQuantityAtMonth(
      offer,
      month
    );

  if (
    vested <= 0
  ) {
    return 0;
  }

  const basis =
    determineEquityValueBasis(
      equity
    );

  /*
   * Employer headline value is not independently verified.
   *
   * Even if determineEquityValueBasis can surface it for context,
   * we do not use an unreliable basis to manufacture a break-even
   * result.
   */
  if (
    !basis.reliableForModeling ||
    basis.unitValue <= 0
  ) {
    return 0;
  }

  const scenarioMultiplier =
    getScenarioMultiplier(
      offer,
      scenario
    );

  const modeledUnitValue =
    basis.unitValue *
    scenarioMultiplier;

  const grossEquityValue =
    vested *
    modeledUnitValue;

  const exerciseCost =
    equity.type === "ESOP"
      ? vested *
        safePositive(
          equity.exercisePrice
        )
      : 0;

  const preDilutionNetValue =
    Math.max(
      grossEquityValue -
        exerciseCost,
      0
    );

  const dilution =
    Math.min(
      Math.max(
        safePositive(
          equity
            .expectedDilutionPercentage
        ),
        0
      ),
      100
    );

  const dilutionMultiplier =
    Math.max(
      1 -
        dilution / 100,
      0
    );

  return (
    preDilutionNetValue *
    dilutionMultiplier
  );
}

/* ============================================================
   COMPLETE ECONOMIC VALUE AT MONTH
============================================================ */

export function calculateOfferEconomicValueAtMonth(
  offerInput: OfferInput,
  month: number,
  scenario: OfferScenarioKey
): number {
  const cash =
    calculateOfferCashValueAtMonth(
      offerInput,
      month
    );

  const equity =
    calculateOfferEquityValueAtMonth(
      offerInput,
      month,
      scenario
    );

  return Math.max(
    cash +
      equity,
    0
  );
}

/* ============================================================
   MONTHLY POINT
============================================================ */

export function calculateMonthlyComparisonPoint(
  offerAInput: OfferInput,
  offerBInput: OfferInput,
  month: number,
  scenario: OfferScenarioKey
): OfferMonthlyEconomicPoint {
  const normalizedMonth =
    Math.max(
      Math.round(
        safePositive(month)
      ),
      1
    );

  const offerAValue =
    calculateOfferEconomicValueAtMonth(
      offerAInput,
      normalizedMonth,
      scenario
    );

  const offerBValue =
    calculateOfferEconomicValueAtMonth(
      offerBInput,
      normalizedMonth,
      scenario
    );

  const signedDifference =
    offerAValue -
    offerBValue;

  return {
    month:
      normalizedMonth,

    yearsElapsed:
      normalizedMonth / 12,

    offerAValue,

    offerBValue,

    difference:
      Math.abs(
        signedDifference
      ),

    signedDifference,

    winner:
      determineWinner(
        offerAValue,
        offerBValue
      ),
  };
}

/* ============================================================
   BUILD MONTHLY TIMELINE
============================================================ */

export function buildOfferMonthlyTimeline(
  offerAInput: OfferInput,
  offerBInput: OfferInput,
  scenario: OfferScenarioKey = "BASE",
  maxMonths =
    DEFAULT_MAX_MONTHS
): OfferMonthlyEconomicPoint[] {
  const offerA =
    normalizeOfferInput(
      {
        ...offerAInput,
        side: "A",
      },
      "A"
    );

  const offerB =
    normalizeOfferInput(
      {
        ...offerBInput,
        side: "B",
      },
      "B"
    );

  const finalMonth =
    Math.max(
      Math.round(
        safePositive(
          maxMonths
        )
      ),
      1
    );

  const timeline:
    OfferMonthlyEconomicPoint[] =
    [];

  for (
    let month = 1;
    month <= finalMonth;
    month += 1
  ) {
    timeline.push(
      calculateMonthlyComparisonPoint(
        offerA,
        offerB,
        month,
        scenario
      )
    );
  }

  return timeline;
}

/* ============================================================
   EFFECTIVE WINNER

   Ties can occur exactly at the crossover.

   For crossover detection, we want the most recent non-tie
   leader.
============================================================ */

function getPreviousNonTieWinner(
  timeline:
    OfferMonthlyEconomicPoint[],
  index: number
): OfferWinner {
  for (
    let cursor =
      index - 1;
    cursor >= 0;
    cursor -= 1
  ) {
    const winner =
      timeline[cursor]
        .winner;

    if (
      winner === "A" ||
      winner === "B"
    ) {
      return winner;
    }
  }

  return "UNDETERMINED";
}

function getNextNonTieWinner(
  timeline:
    OfferMonthlyEconomicPoint[],
  index: number
): OfferWinner {
  for (
    let cursor =
      index + 1;
    cursor <
    timeline.length;
    cursor += 1
  ) {
    const winner =
      timeline[cursor]
        .winner;

    if (
      winner === "A" ||
      winner === "B"
    ) {
      return winner;
    }
  }

  return "UNDETERMINED";
}

/* ============================================================
   CROSSOVER MONTHS

   A crossover exists when the economic leader changes from A→B
   or B→A.

   If one month is an exact tie, the tie month is treated as the
   crossover point when the leader differs on either side.
============================================================ */

export function findCrossoverMonths(
  timeline:
    OfferMonthlyEconomicPoint[]
): number[] {
  const crossovers:
    number[] =
    [];

  if (
    timeline.length < 2
  ) {
    return crossovers;
  }

  for (
    let index = 1;
    index <
    timeline.length;
    index += 1
  ) {
    const previous =
      timeline[index - 1];

    const current =
      timeline[index];

    /* --------------------------------------------------------
       Direct A ↔ B change
    -------------------------------------------------------- */

    if (
      (
        previous.winner === "A" &&
        current.winner === "B"
      ) ||
      (
        previous.winner === "B" &&
        current.winner === "A"
      )
    ) {
      crossovers.push(
        current.month
      );

      continue;
    }

    /* --------------------------------------------------------
       Tie at crossover
    -------------------------------------------------------- */

    if (
      current.winner ===
      "TIE"
    ) {
      const before =
        getPreviousNonTieWinner(
          timeline,
          index
        );

      const after =
        getNextNonTieWinner(
          timeline,
          index
        );

      if (
        (
          before === "A" &&
          after === "B"
        ) ||
        (
          before === "B" &&
          after === "A"
        )
      ) {
        crossovers.push(
          current.month
        );
      }
    }
  }

  return Array.from(
    new Set(
      crossovers
    )
  );
}

/* ============================================================
   FIRST / FINAL NON-TIE WINNER
============================================================ */

function getFirstNonTieWinner(
  timeline:
    OfferMonthlyEconomicPoint[]
): OfferWinner {
  for (
    const point of
    timeline
  ) {
    if (
      point.winner === "A" ||
      point.winner === "B"
    ) {
      return point.winner;
    }
  }

  if (
    timeline.some(
      (point) =>
        point.winner ===
        "TIE"
    )
  ) {
    return "TIE";
  }

  return "UNDETERMINED";
}

function getFinalNonTieWinner(
  timeline:
    OfferMonthlyEconomicPoint[]
): OfferWinner {
  for (
    let index =
      timeline.length - 1;
    index >= 0;
    index -= 1
  ) {
    const winner =
      timeline[index]
        .winner;

    if (
      winner === "A" ||
      winner === "B"
    ) {
      return winner;
    }
  }

  if (
    timeline.some(
      (point) =>
        point.winner ===
        "TIE"
    )
  ) {
    return "TIE";
  }

  return "UNDETERMINED";
}

/* ============================================================
   OFFER LABEL
============================================================ */

function getOfferLabel(
  offer: OfferInput
): string {
  const company =
    offer.employer
      .companyName
      .trim();

  return company
    ? company
    : `Offer ${offer.side}`;
}

function getWinnerLabel(
  winner: OfferWinner,
  offerA: OfferInput,
  offerB: OfferInput
): string {
  if (
    winner === "A"
  ) {
    return getOfferLabel(
      offerA
    );
  }

  if (
    winner === "B"
  ) {
    return getOfferLabel(
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
   BREAK-EVEN RESULT
============================================================ */

export function calculateOfferBreakEven(
  offerAInput: OfferInput,
  offerBInput: OfferInput,
  scenario: OfferScenarioKey = "BASE",
  maxMonths =
    DEFAULT_MAX_MONTHS
): OfferBreakEvenResult {
  const offerA =
    normalizeOfferInput(
      {
        ...offerAInput,
        side: "A",
      },
      "A"
    );

  const offerB =
    normalizeOfferInput(
      {
        ...offerBInput,
        side: "B",
      },
      "B"
    );

  const timeline =
    buildOfferMonthlyTimeline(
      offerA,
      offerB,
      scenario,
      maxMonths
    );

  if (
    timeline.length === 0
  ) {
    return {
      found:
        false,

      scenario,

      breakEvenMonth:
        null,

      leaderBeforeBreakEven:
        "UNDETERMINED",

      leaderAfterBreakEven:
        "UNDETERMINED",

      valueAtBreakEvenA:
        0,

      valueAtBreakEvenB:
        0,

      explanation:
        "A break-even comparison could not be calculated.",
    };
  }

  const crossovers =
    findCrossoverMonths(
      timeline
    );

  const firstWinner =
    getFirstNonTieWinner(
      timeline
    );

  const finalWinner =
    getFinalNonTieWinner(
      timeline
    );

  /* ----------------------------------------------------------
     No crossover
  ---------------------------------------------------------- */

  if (
    crossovers.length === 0
  ) {
    if (
      firstWinner ===
        "TIE" &&
      finalWinner ===
        "TIE"
    ) {
      return {
        found:
          false,

        scenario,

        breakEvenMonth:
          null,

        leaderBeforeBreakEven:
          "TIE",

        leaderAfterBreakEven:
          "TIE",

        valueAtBreakEvenA:
          timeline[
            timeline.length - 1
          ].offerAValue,

        valueAtBreakEvenB:
          timeline[
            timeline.length - 1
          ].offerBValue,

        explanation:
          "The two offers remain approximately equal across the modeled period.",
      };
    }

    const leader =
      finalWinner !==
      "UNDETERMINED"
        ? finalWinner
        : firstWinner;

    const leaderLabel =
      getWinnerLabel(
        leader,
        offerA,
        offerB
      );

    return {
      found:
        false,

      scenario,

      breakEvenMonth:
        null,

      leaderBeforeBreakEven:
        leader,

      leaderAfterBreakEven:
        leader,

      valueAtBreakEvenA:
        timeline[
          timeline.length - 1
        ].offerAValue,

      valueAtBreakEvenB:
        timeline[
          timeline.length - 1
        ].offerBValue,

      explanation:
        leader ===
        "UNDETERMINED"
          ? "The available data is not sufficient to identify a break-even point."
          : `${leaderLabel} remains economically ahead throughout the modeled ${timeline.length}-month ${scenario} scenario.`,
    };
  }

  /* ----------------------------------------------------------
     First crossover

     Phase 4 headline UI uses the FIRST economically meaningful
     crossover.

     If multiple crossovers occur, the full analysis exposes them
     separately.
  ---------------------------------------------------------- */

  const breakEvenMonth =
    crossovers[0];

  const breakEvenIndex =
    timeline.findIndex(
      (point) =>
        point.month ===
        breakEvenMonth
    );

  const breakEvenPoint =
    breakEvenIndex >= 0
      ? timeline[
          breakEvenIndex
        ]
      : timeline[0];

  const beforeWinner =
    breakEvenIndex > 0
      ? getPreviousNonTieWinner(
          timeline,
          breakEvenIndex
        )
      : firstWinner;

  const afterWinner =
    getNextNonTieWinner(
      timeline,
      breakEvenIndex
    );

  const resolvedAfterWinner =
    afterWinner !==
    "UNDETERMINED"
      ? afterWinner
      : breakEvenPoint
          .winner !==
        "TIE"
        ? breakEvenPoint
            .winner
        : finalWinner;

  const beforeLabel =
    getWinnerLabel(
      beforeWinner,
      offerA,
      offerB
    );

  const afterLabel =
    getWinnerLabel(
      resolvedAfterWinner,
      offerA,
      offerB
    );

  return {
    found:
      true,

    scenario,

    breakEvenMonth,

    leaderBeforeBreakEven:
      beforeWinner,

    leaderAfterBreakEven:
      resolvedAfterWinner,

    valueAtBreakEvenA:
      breakEvenPoint
        .offerAValue,

    valueAtBreakEvenB:
      breakEvenPoint
        .offerBValue,

    explanation:
      `${beforeLabel} leads before approximately month ${breakEvenMonth}. ${afterLabel} becomes economically stronger around that point under the modeled ${scenario} assumptions.`,
  };
}

/* ============================================================
   WARNINGS
============================================================ */

function buildBreakEvenWarnings(
  offerA: OfferInput,
  offerB: OfferInput,
  timeline:
    OfferMonthlyEconomicPoint[],
  crossoverMonths:
    number[]
): string[] {
  const warnings:
    string[] =
    [];

  if (
    offerA.equity.type !==
      "NONE" ||
    offerB.equity.type !==
      "NONE"
  ) {
    warnings.push(
      "Break-even equity values are currently pre-tax until Offer Intelligence is connected to the established PRO tax engine."
    );
  }

  if (
    offerA.cash.retentionBonus >
      0 ||
    offerB.cash.retentionBonus >
      0
  ) {
    warnings.push(
      "Retention-bonus payment timing is not yet modeled month-by-month. Phase 4 V1 counts confirmed one-time compensation once."
    );
  }

  if (
    crossoverMonths.length >
    1
  ) {
    warnings.push(
      `The modeled offers change leadership more than once (${crossoverMonths.join(
        ", "
      )} months). The headline break-even result uses the first crossover.`
    );
  }

  if (
    timeline.length <
    DEFAULT_MAX_MONTHS
  ) {
    warnings.push(
      "The break-even search period is shorter than the standard 48-month comparison horizon."
    );
  }

  return uniqueStrings(
    warnings
  );
}

/* ============================================================
   ASSUMPTIONS
============================================================ */

function getBreakEvenAssumptions():
  string[] {
  return [
    "Break-even is modeled month-by-month rather than interpolated only between annual comparison points.",

    "Recurring compensation is accrued proportionally through the modeled employment period.",

    "Target variable compensation is used for economic comparison and does not represent guaranteed monthly payment.",

    "Confirmed one-time compensation is counted once in the modeled employment period.",

    "Standard offer equity follows the Phase 4 cliff-plus-monthly vesting assumptions.",

    "Bear, Base and Bull affect modeled equity value while confirmed cash-compensation inputs remain unchanged.",

    "Expected dilution is applied using the same simplified relative-dilution assumption as the Phase 4 equity engine.",

    "Employer headline equity value is not used to manufacture a break-even result when the equity basis is not independently modelable.",

    "Break-even economic value is not guaranteed realizable cash.",

    "Indian equity tax is intentionally excluded until Offer Intelligence connects to the established PRO tax engine.",

    "Salary increments, promotions and inflation are not modeled in Phase 4 V1.",
  ];
}

/* ============================================================
   COMPLETE BREAK-EVEN ANALYSIS
============================================================ */

export function analyzeOfferBreakEven(
  offerAInput: OfferInput,
  offerBInput: OfferInput,
  scenario: OfferScenarioKey = "BASE",
  maxMonths =
    DEFAULT_MAX_MONTHS
): OfferBreakEvenAnalysis {
  const offerA =
    normalizeOfferInput(
      {
        ...offerAInput,
        side: "A",
      },
      "A"
    );

  const offerB =
    normalizeOfferInput(
      {
        ...offerBInput,
        side: "B",
      },
      "B"
    );

  const finalMonth =
    clampMonth(
      maxMonths,
      Math.max(
        maxMonths,
        1
      )
    );

  const timeline =
    buildOfferMonthlyTimeline(
      offerA,
      offerB,
      scenario,
      finalMonth
    );

  const crossoverMonths =
    findCrossoverMonths(
      timeline
    );

  const result =
    calculateOfferBreakEven(
      offerA,
      offerB,
      scenario,
      finalMonth
    );

  const firstMonthWinner =
    getFirstNonTieWinner(
      timeline
    );

  const finalMonthWinner =
    getFinalNonTieWinner(
      timeline
    );

  const warnings =
    buildBreakEvenWarnings(
      offerA,
      offerB,
      timeline,
      crossoverMonths
    );

  return {
    scenario,

    result,

    timeline,

    firstMonthWinner,

    finalMonthWinner,

    crossoverCount:
      crossoverMonths.length,

    crossoverMonths,

    warnings,

    assumptions:
      getBreakEvenAssumptions(),
  };
}

/* ============================================================
   ALL THREE SCENARIOS

   This will later let the UI show:

   BEAR
   No crossover — Offer A remains ahead

   BASE
   Offer B overtakes around month 29

   BULL
   Offer B overtakes around month 18
============================================================ */

export function analyzeAllOfferBreakEvens(
  offerA: OfferInput,
  offerB: OfferInput,
  maxMonths =
    DEFAULT_MAX_MONTHS
): Record<
  OfferScenarioKey,
  OfferBreakEvenAnalysis
> {
  return {
    BEAR:
      analyzeOfferBreakEven(
        offerA,
        offerB,
        "BEAR",
        maxMonths
      ),

    BASE:
      analyzeOfferBreakEven(
        offerA,
        offerB,
        "BASE",
        maxMonths
      ),

    BULL:
      analyzeOfferBreakEven(
        offerA,
        offerB,
        "BULL",
        maxMonths
      ),
  };
}

/* ============================================================
   BREAK-EVEN SNAPSHOT

   Lightweight structure for cards / Overview / reports.
============================================================ */

export function getBreakEvenSnapshot(
  offerA: OfferInput,
  offerB: OfferInput,
  scenario: OfferScenarioKey = "BASE"
): {
  found: boolean;

  month: number | null;

  years: number | null;

  leaderBefore: OfferWinner;

  leaderAfter: OfferWinner;

  explanation: string;
} {
  const result =
    calculateOfferBreakEven(
      offerA,
      offerB,
      scenario
    );

  return {
    found:
      result.found,

    month:
      result.breakEvenMonth,

    years:
      result.breakEvenMonth
        ? result.breakEvenMonth /
          12
        : null,

    leaderBefore:
      result
        .leaderBeforeBreakEven,

    leaderAfter:
      result
        .leaderAfterBreakEven,

    explanation:
      result.explanation,
  };
}
/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   NEGOTIATION ENGINE

   Responsibilities:
   - identify the weaker offer at a selected horizon/scenario
   - calculate the modeled economic gap
   - convert that gap into:
       • additional annual fixed salary
       • additional joining bonus
       • additional options / shares
   - create minimum / competitive / strong targets
   - produce actionable negotiation intelligence

   IMPORTANT:
   This engine DOES NOT:
   - modify Offer A or Offer B
   - claim a negotiation outcome is guaranteed
   - use employer headline ESOP value as a reliable option basis
   - independently calculate Indian tax
   - write into Phase 1–3 PRO state

   TAX NOTE:
   Phase 4 equity values are still pre-tax until Offer
   Intelligence connects to the established PRO tax engine.
============================================================ */

import type {
  OfferComparisonHorizon,
  OfferInput,
  OfferNegotiationTarget,
  OfferScenarioKey,
  OfferWinner,
} from "./types";

import {
  compareOffers,
  getOfferComparison,
} from "./compare";

import {
  calculateOfferDilutionMultiplier,
  determineEquityValueBasis,
  getEquityScenarioMultiplier,
} from "./equity";

import {
  normalizeOfferInput,
} from "./normalize";

/* ============================================================
   LOCAL TYPES
============================================================ */

export type OfferNegotiationAnalysis = {
  target: OfferNegotiationTarget | null;

  canNegotiateWithSalary: boolean;

  canNegotiateWithJoiningBonus: boolean;

  canNegotiateWithEquity: boolean;

  weakerOffer: OfferWinner;

  strongerOffer: OfferWinner;

  horizonMonths: OfferComparisonHorizon;

  scenario: OfferScenarioKey;

  explanation: string;

  warnings: string[];

  assumptions: string[];
};

export type OfferNegotiationAlternative = {
  type:
    | "FIXED_SALARY"
    | "JOINING_BONUS"
    | "EQUITY";

  label: string;

  value: number;

  unit:
    | "CURRENCY"
    | "OPTIONS_OR_SHARES";

  available: boolean;

  explanation: string;
};

/* ============================================================
   CONSTANTS

   Target bands are intentionally transparent.

   MINIMUM:
   exactly close the modeled economic gap

   COMPETITIVE:
   close the gap + 10% buffer

   STRONG:
   close the gap + 25% buffer

   These are modeling bands — not claims about what HR will
   accept.
============================================================ */

const COMPETITIVE_BUFFER =
  1.1;

const STRONG_BUFFER =
  1.25;

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

function roundMoney(
  value: number
): number {
  return Math.max(
    Math.round(
      safePositive(value)
    ),
    0
  );
}

function roundQuantityUp(
  value: number
): number {
  return Math.max(
    Math.ceil(
      safePositive(value)
    ),
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

/* ============================================================
   WINNER HELPERS
============================================================ */

function oppositeWinner(
  winner: OfferWinner
): OfferWinner {
  if (
    winner === "A"
  ) {
    return "B";
  }

  if (
    winner === "B"
  ) {
    return "A";
  }

  return winner;
}

/* ============================================================
   GET OFFER BY SIDE
============================================================ */

function getOfferByWinner(
  offerA: OfferInput,
  offerB: OfferInput,
  winner: OfferWinner
): OfferInput | null {
  if (
    winner === "A"
  ) {
    return offerA;
  }

  if (
    winner === "B"
  ) {
    return offerB;
  }

  return null;
}

/* ============================================================
   SALARY GAP

   If the selected horizon is:

   12 months:
   ₹3L economic gap => ₹3L additional annual fixed

   24 months:
   ₹3L economic gap => ₹1.5L additional annual fixed

   36 months:
   ₹3L economic gap => ₹1L additional annual fixed

   etc.

   This assumes the negotiated fixed-salary increase applies
   throughout the modeled horizon.
============================================================ */

export function calculateAdditionalAnnualSalaryNeeded(
  economicGap: number,
  horizonMonths: OfferComparisonHorizon
): number {
  const gap =
    safePositive(
      economicGap
    );

  if (
    gap <= 0
  ) {
    return 0;
  }

  const years =
    horizonMonths / 12;

  if (
    years <= 0
  ) {
    return gap;
  }

  return gap / years;
}

/* ============================================================
   JOINING BONUS GAP

   A joining bonus is one-time compensation.

   Therefore the amount needed to economically close the selected
   modeled gap is simply the gap itself.

   IMPORTANT:
   tax / clawback / repayment conditions are not yet applied.
============================================================ */

export function calculateAdditionalJoiningBonusNeeded(
  economicGap: number
): number {
  return safePositive(
    economicGap
  );
}

/* ============================================================
   VESTED FRACTION AT HORIZON

   We need to know how much of ONE additional option/share would
   be vested by the selected horizon.

   This mirrors the Phase 4 standard vesting assumptions.

   Example:
   48m / 12m cliff

   Month 12 = 25%
   Month 24 = 50%
   Month 36 = 75%
   Month 48 = 100%
============================================================ */

export function calculateVestedFractionAtHorizon(
  offerInput: OfferInput,
  horizonMonths: OfferComparisonHorizon
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

  const duration =
    Math.max(
      equity.vestingDurationMonths,
      1
    );

  const cliff =
    Math.min(
      Math.max(
        equity.cliffMonths,
        0
      ),
      duration
    );

  const completed =
    Math.min(
      Math.max(
        horizonMonths,
        0
      ),
      duration
    );

  if (
    completed >= duration
  ) {
    return 1;
  }

  if (
    completed < cliff
  ) {
    return 0;
  }

  if (
    cliff === 0
  ) {
    return Math.min(
      completed / duration,
      1
    );
  }

  const cliffFraction =
    0.25;

  const remainingFraction =
    0.75;

  const remainingMonths =
    duration -
    cliff;

  const monthsAfterCliff =
    completed -
    cliff;

  if (
    remainingMonths <= 0
  ) {
    return 1;
  }

  return Math.min(
    Math.max(
      cliffFraction +
        remainingFraction *
          (
            monthsAfterCliff /
            remainingMonths
          ),
      0
    ),
    1
  );
}

/* ============================================================
   ECONOMIC VALUE OF ONE ADDITIONAL OPTION / SHARE

   This is intentionally conservative.

   We require:
   - an actual equity type
   - reliable value basis
   - positive unit value
   - some vesting by selected horizon

   For ESOP:
   scenario unit value - strike

   For RSU / STOCK:
   scenario unit value

   Then:
   × dilution multiplier
   × vested fraction

   Tax is intentionally excluded until the established PRO tax
   engine is connected.
============================================================ */

export function calculateIncrementalEquityUnitValue(
  offerInput: OfferInput,
  horizonMonths: OfferComparisonHorizon,
  scenario: OfferScenarioKey
): {
  available: boolean;

  valuePerAdditionalGrantUnit: number;

  vestedFraction: number;

  modeledUnitValue: number;

  netUnitValueBeforeVesting: number;

  explanation: string;
} {
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
    return {
      available:
        false,

      valuePerAdditionalGrantUnit:
        0,

      vestedFraction:
        0,

      modeledUnitValue:
        0,

      netUnitValueBeforeVesting:
        0,

      explanation:
        "This offer does not currently contain an equity grant to use as the basis for an additional-equity negotiation target.",
    };
  }

  const basis =
    determineEquityValueBasis(
      equity
    );

  if (
    !basis.reliableForModeling ||
    basis.unitValue <= 0
  ) {
    return {
      available:
        false,

      valuePerAdditionalGrantUnit:
        0,

      vestedFraction:
        0,

      modeledUnitValue:
        0,

      netUnitValueBeforeVesting:
        0,

      explanation:
        "Additional options/shares cannot be calculated reliably because the offer does not have a sufficiently reliable equity value basis.",
    };
  }

  const vestedFraction =
    calculateVestedFractionAtHorizon(
      offer,
      horizonMonths
    );

  if (
    vestedFraction <= 0
  ) {
    return {
      available:
        false,

      valuePerAdditionalGrantUnit:
        0,

      vestedFraction,

      modeledUnitValue:
        0,

      netUnitValueBeforeVesting:
        0,

      explanation:
        "No additional grant units would be vested by the selected comparison horizon under the modeled vesting schedule.",
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

  const strike =
    equity.type === "ESOP"
      ? safePositive(
          equity.exercisePrice
        )
      : 0;

  const netUnitValueBeforeVesting =
    Math.max(
      modeledUnitValue -
        strike,
      0
    );

  if (
    netUnitValueBeforeVesting <=
    0
  ) {
    return {
      available:
        false,

      valuePerAdditionalGrantUnit:
        0,

      vestedFraction,

      modeledUnitValue,

      netUnitValueBeforeVesting,

      explanation:
        "Under the selected scenario, the modeled unit value does not exceed the exercise price enough to support a positive additional-equity target.",
    };
  }

  const dilutionMultiplier =
    calculateOfferDilutionMultiplier(
      equity
    );

  const valuePerAdditionalGrantUnit =
    netUnitValueBeforeVesting *
    dilutionMultiplier *
    vestedFraction;

  if (
    valuePerAdditionalGrantUnit <=
    0
  ) {
    return {
      available:
        false,

      valuePerAdditionalGrantUnit:
        0,

      vestedFraction,

      modeledUnitValue,

      netUnitValueBeforeVesting,

      explanation:
        "The modeled post-dilution value of an additional grant unit is not positive.",
    };
  }

  return {
    available:
      true,

    valuePerAdditionalGrantUnit,

    vestedFraction,

    modeledUnitValue,

    netUnitValueBeforeVesting,

    explanation:
      "The additional-equity target uses the selected scenario unit value, exercise price where applicable, expected dilution and the portion expected to vest by the selected horizon.",
  };
}

/* ============================================================
   ADDITIONAL OPTIONS / SHARES NEEDED
============================================================ */

export function calculateAdditionalEquityNeeded(
  weakerOffer: OfferInput,
  economicGap: number,
  horizonMonths: OfferComparisonHorizon,
  scenario: OfferScenarioKey
): {
  available: boolean;

  additionalOptionsOrShares: number;

  valuePerAdditionalGrantUnit: number;

  explanation: string;
} {
  const gap =
    safePositive(
      economicGap
    );

  if (
    gap <= 0
  ) {
    return {
      available:
        true,

      additionalOptionsOrShares:
        0,

      valuePerAdditionalGrantUnit:
        0,

      explanation:
        "There is no modeled economic gap to close.",
    };
  }

  const unit =
    calculateIncrementalEquityUnitValue(
      weakerOffer,
      horizonMonths,
      scenario
    );

  if (
    !unit.available ||
    unit
      .valuePerAdditionalGrantUnit <=
      0
  ) {
    return {
      available:
        false,

      additionalOptionsOrShares:
        0,

      valuePerAdditionalGrantUnit:
        unit
          .valuePerAdditionalGrantUnit,

      explanation:
        unit.explanation,
    };
  }

  const additionalOptionsOrShares =
    gap /
    unit
      .valuePerAdditionalGrantUnit;

  return {
    available:
      true,

    additionalOptionsOrShares:
      roundQuantityUp(
        additionalOptionsOrShares
      ),

    valuePerAdditionalGrantUnit:
      unit
        .valuePerAdditionalGrantUnit,

    explanation:
      unit.explanation,
  };
}

/* ============================================================
   TARGET BANDS
============================================================ */

function buildSalaryTargets(
  currentAnnualFixedSalary: number,
  additionalAnnualSalary: number
): {
  minimum: number;

  competitive: number;

  strong: number;
} {
  const current =
    safePositive(
      currentAnnualFixedSalary
    );

  const additional =
    safePositive(
      additionalAnnualSalary
    );

  return {
    minimum:
      roundMoney(
        current +
          additional
      ),

    competitive:
      roundMoney(
        current +
          additional *
            COMPETITIVE_BUFFER
      ),

    strong:
      roundMoney(
        current +
          additional *
            STRONG_BUFFER
      ),
  };
}

function buildEquityTargets(
  additionalQuantity: number
): {
  minimum: number;

  competitive: number;

  strong: number;
} {
  const additional =
    safePositive(
      additionalQuantity
    );

  return {
    minimum:
      roundQuantityUp(
        additional
      ),

    competitive:
      roundQuantityUp(
        additional *
          COMPETITIVE_BUFFER
      ),

    strong:
      roundQuantityUp(
        additional *
          STRONG_BUFFER
      ),
  };
}

/* ============================================================
   COMPLETE NEGOTIATION TARGET
============================================================ */

export function calculateOfferNegotiationTarget(
  offerAInput: OfferInput,
  offerBInput: OfferInput,
  horizonMonths: OfferComparisonHorizon = 24,
  scenario: OfferScenarioKey = "BASE"
): OfferNegotiationTarget | null {
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

  const comparison =
    compareOffers(
      offerA,
      offerB
    );

  const horizonComparison =
    getOfferComparison(
      comparison,
      horizonMonths,
      scenario
    );

  const winner =
    horizonComparison.winner;

  if (
    winner === "TIE" ||
    winner ===
      "UNDETERMINED" ||
    horizonComparison.difference <=
      WINNER_TOLERANCE
  ) {
    return null;
  }

  const strongerOffer =
    winner;

  const weakerOffer =
    oppositeWinner(
      winner
    );

  const weakerOfferInput =
    getOfferByWinner(
      offerA,
      offerB,
      weakerOffer
    );

  if (
    !weakerOfferInput
  ) {
    return null;
  }

  const economicGap =
    safePositive(
      horizonComparison
        .difference
    );

  const additionalAnnualFixedSalary =
    calculateAdditionalAnnualSalaryNeeded(
      economicGap,
      horizonMonths
    );

  const additionalJoiningBonus =
    calculateAdditionalJoiningBonusNeeded(
      economicGap
    );

  const additionalEquity =
    calculateAdditionalEquityNeeded(
      weakerOfferInput,
      economicGap,
      horizonMonths,
      scenario
    );

  const salaryTargets =
    buildSalaryTargets(
      weakerOfferInput
        .cash
        .fixedSalary,
      additionalAnnualFixedSalary
    );

  const equityTargets =
    buildEquityTargets(
      additionalEquity.available
        ? additionalEquity
            .additionalOptionsOrShares
        : 0
    );

  const strongerLabel =
    getOfferLabel(
      getOfferByWinner(
        offerA,
        offerB,
        strongerOffer
      ) ?? offerA
    );

  const weakerLabel =
    getOfferLabel(
      weakerOfferInput
    );

  const warnings:
    string[] =
    [];

  warnings.push(
    "Negotiation targets are modeled economic equivalents, not predictions of what an employer will approve."
  );

  warnings.push(
    "Additional fixed salary is assumed to apply throughout the selected comparison horizon."
  );

  warnings.push(
    "Joining-bonus equivalence does not yet model tax, clawback or repayment conditions."
  );

  if (
    weakerOfferInput
      .equity
      .type !== "NONE"
  ) {
    warnings.push(
      "Additional-equity targets are currently pre-tax until Offer Intelligence connects to the established PRO tax engine."
    );
  }

  if (
    !additionalEquity.available
  ) {
    warnings.push(
      `An additional-options/share target is not shown because ${additionalEquity.explanation}`
    );
  }

  return {
    weakerOffer,

    strongerOffer,

    horizonMonths,

    scenario,

    economicGap:
      roundMoney(
        economicGap
      ),

    additionalAnnualFixedSalary:
      roundMoney(
        additionalAnnualFixedSalary
      ),

    additionalJoiningBonus:
      roundMoney(
        additionalJoiningBonus
      ),

    additionalOptionsOrShares:
      additionalEquity.available
        ? additionalEquity
            .additionalOptionsOrShares
        : 0,

    minimumAcceptableFixedSalary:
      salaryTargets.minimum,

    competitiveFixedSalary:
      salaryTargets.competitive,

    strongFixedSalary:
      salaryTargets.strong,

    minimumAdditionalOptionsOrShares:
      additionalEquity.available
        ? equityTargets.minimum
        : 0,

    competitiveAdditionalOptionsOrShares:
      additionalEquity.available
        ? equityTargets.competitive
        : 0,

    strongAdditionalOptionsOrShares:
      additionalEquity.available
        ? equityTargets.strong
        : 0,

    explanation:
      `${strongerLabel} is ahead of ${weakerLabel} by approximately the modeled economic gap at the selected ${horizonMonths / 12}-year ${scenario} horizon. The weaker offer can be tested against equivalent fixed-salary, joining-bonus or additional-equity adjustments.`,

    warnings:
      uniqueStrings(
        warnings
      ),
  };
}

/* ============================================================
   COMPLETE NEGOTIATION ANALYSIS
============================================================ */

export function analyzeOfferNegotiation(
  offerAInput: OfferInput,
  offerBInput: OfferInput,
  horizonMonths: OfferComparisonHorizon = 24,
  scenario: OfferScenarioKey = "BASE"
): OfferNegotiationAnalysis {
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

  const comparison =
    compareOffers(
      offerA,
      offerB
    );

  const selected =
    getOfferComparison(
      comparison,
      horizonMonths,
      scenario
    );

  const strongerOffer =
    selected.winner;

  const weakerOffer =
    oppositeWinner(
      strongerOffer
    );

  if (
    strongerOffer ===
      "TIE" ||
    strongerOffer ===
      "UNDETERMINED"
  ) {
    return {
      target:
        null,

      canNegotiateWithSalary:
        false,

      canNegotiateWithJoiningBonus:
        false,

      canNegotiateWithEquity:
        false,

      weakerOffer:
        strongerOffer,

      strongerOffer,

      horizonMonths,

      scenario,

      explanation:
        "The selected offers are approximately equal or cannot yet be reliably separated under this horizon and scenario.",

      warnings:
        uniqueStrings(
          comparison.warnings
        ),

      assumptions:
        getNegotiationAssumptions(),
    };
  }

  const weakerOfferInput =
    getOfferByWinner(
      offerA,
      offerB,
      weakerOffer
    );

  const target =
    calculateOfferNegotiationTarget(
      offerA,
      offerB,
      horizonMonths,
      scenario
    );

  const equityAlternative =
    weakerOfferInput
      ? calculateAdditionalEquityNeeded(
          weakerOfferInput,
          selected.difference,
          horizonMonths,
          scenario
        )
      : {
          available:
            false,

          additionalOptionsOrShares:
            0,

          valuePerAdditionalGrantUnit:
            0,

          explanation:
            "The weaker offer could not be identified.",
        };

  const warnings =
    uniqueStrings([
      ...comparison.warnings,

      ...(target
        ? target.warnings
        : []),
    ]);

  return {
    target,

    canNegotiateWithSalary:
      selected.difference >
      WINNER_TOLERANCE,

    canNegotiateWithJoiningBonus:
      selected.difference >
      WINNER_TOLERANCE,

    canNegotiateWithEquity:
      equityAlternative.available,

    weakerOffer,

    strongerOffer,

    horizonMonths,

    scenario,

    explanation:
      target
        ? target.explanation
        : "No negotiation target is required under the selected modeled comparison.",

    warnings,

    assumptions:
      getNegotiationAssumptions(),
  };
}

/* ============================================================
   NEGOTIATION ALTERNATIVES

   UI-ready alternatives such as:

   FIXED SALARY
   +₹2.4L / year

   JOINING BONUS
   +₹4.8L once

   EQUITY
   +2,800 options
============================================================ */

export function getNegotiationAlternatives(
  offerA: OfferInput,
  offerB: OfferInput,
  horizonMonths: OfferComparisonHorizon = 24,
  scenario: OfferScenarioKey = "BASE"
): OfferNegotiationAlternative[] {
  const analysis =
    analyzeOfferNegotiation(
      offerA,
      offerB,
      horizonMonths,
      scenario
    );

  const target =
    analysis.target;

  if (!target) {
    return [];
  }

  return [
    {
      type:
        "FIXED_SALARY",

      label:
        "Additional annual fixed salary",

      value:
        target
          .additionalAnnualFixedSalary,

      unit:
        "CURRENCY",

      available:
        analysis
          .canNegotiateWithSalary,

      explanation:
        "Modeled annual fixed-pay increase required to close the selected economic gap across the comparison horizon.",
    },

    {
      type:
        "JOINING_BONUS",

      label:
        "Additional joining bonus",

      value:
        target
          .additionalJoiningBonus,

      unit:
        "CURRENCY",

      available:
        analysis
          .canNegotiateWithJoiningBonus,

      explanation:
        "Modeled one-time payment required to close the selected economic gap before tax or clawback effects.",
    },

    {
      type:
        "EQUITY",

      label:
        "Additional options / shares",

      value:
        target
          .additionalOptionsOrShares,

      unit:
        "OPTIONS_OR_SHARES",

      available:
        analysis
          .canNegotiateWithEquity,

      explanation:
        analysis
          .canNegotiateWithEquity
          ? "Modeled additional grant quantity required to close the selected gap under the offer's vesting, scenario and dilution assumptions."
          : "A reliable additional-equity target cannot be calculated from the available equity terms.",
    },
  ];
}

/* ============================================================
   ASSUMPTIONS
============================================================ */

export function getNegotiationAssumptions():
  string[] {
  return [
    "Negotiation intelligence converts a modeled economic gap into equivalent compensation adjustments.",

    "The weaker offer is identified using the selected comparison horizon and Bear, Base or Bull scenario.",

    "Additional annual fixed salary is assumed to apply throughout the selected comparison horizon.",

    "Additional joining bonus is modeled as a one-time economic adjustment.",

    "Additional equity is calculated only when the weaker offer has a reliable equity value basis.",

    "Additional equity uses the weaker offer's existing vesting schedule, scenario multiplier, exercise price and expected dilution assumptions.",

    "Employer headline ESOP value is not used as a reliable basis for calculating additional options or shares.",

    "Minimum targets close the modeled gap; competitive targets add a 10% buffer; strong targets add a 25% buffer.",

    "Negotiation targets are analytical reference points and do not guarantee employer acceptance.",

    "Tax, joining-bonus clawbacks and repayment obligations are not yet incorporated into negotiation equivalence.",

    "Phase 4 equity negotiation values remain pre-tax until the established PRO tax engine is connected.",
  ];
}

/* ============================================================
   SIMPLE NEGOTIATION SNAPSHOT

   Useful later for cards / reports.
============================================================ */

export function getNegotiationSnapshot(
  offerA: OfferInput,
  offerB: OfferInput,
  horizonMonths: OfferComparisonHorizon = 24,
  scenario: OfferScenarioKey = "BASE"
): {
  available: boolean;

  weakerOffer: OfferWinner;

  strongerOffer: OfferWinner;

  economicGap: number;

  additionalAnnualFixedSalary: number;

  additionalJoiningBonus: number;

  additionalOptionsOrShares: number;

  equityAlternativeAvailable: boolean;
} {
  const analysis =
    analyzeOfferNegotiation(
      offerA,
      offerB,
      horizonMonths,
      scenario
    );

  if (
    !analysis.target
  ) {
    return {
      available:
        false,

      weakerOffer:
        analysis.weakerOffer,

      strongerOffer:
        analysis.strongerOffer,

      economicGap:
        0,

      additionalAnnualFixedSalary:
        0,

      additionalJoiningBonus:
        0,

      additionalOptionsOrShares:
        0,

      equityAlternativeAvailable:
        false,
    };
  }

  return {
    available:
      true,

    weakerOffer:
      analysis.target
        .weakerOffer,

    strongerOffer:
      analysis.target
        .strongerOffer,

    economicGap:
      analysis.target
        .economicGap,

    additionalAnnualFixedSalary:
      analysis.target
        .additionalAnnualFixedSalary,

    additionalJoiningBonus:
      analysis.target
        .additionalJoiningBonus,

    additionalOptionsOrShares:
      analysis.target
        .additionalOptionsOrShares,

    equityAlternativeAvailable:
      analysis
        .canNegotiateWithEquity,
  };
}
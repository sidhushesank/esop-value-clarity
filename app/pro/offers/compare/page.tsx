"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Coins,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Trophy,
  WalletCards,
} from "lucide-react";

/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   OFFER A vs OFFER B COMPARISON

   Route:
   /pro/offers/compare?offerA=<id>&offerB=<id>

   Responsibilities:
   - read Offer A + Offer B IDs from URL
   - retrieve both persisted offers
   - use persisted / normalized values only
   - compare cash compensation
   - compare equity economics
   - compare vesting / exercise risk
   - surface missing-information limitations
   - generate deterministic Offer Intelligence verdict
   - never treat speculative equity as guaranteed cash
============================================================ */

/* ============================================================
   TYPES
============================================================ */

type JsonRecord = Record<string, unknown>;

type SavedOffer = {
  id: string;

  status: string;

  source: string | null;

  companyName: string | null;

  roleTitle: string | null;

  location: string | null;

  employmentType: string | null;

  workMode: string | null;

  joiningDate: string | null;

  currency: string;

  headlineCTC: number | null;

  fixedSalary: number | null;

  basicSalary: number | null;

  hra: number | null;

  specialAllowance: number | null;

  otherFixedAllowance: number | null;

  targetVariablePay: number | null;

  maximumVariablePay: number | null;

  joiningBonus: number | null;

  retentionBonus: number | null;

  relocationBonus: number | null;

  performanceBonus: number | null;

  employerPF: number | null;

  gratuity: number | null;

  insuranceValue: number | null;

  otherEmployerBenefits: number | null;

  equityType: string | null;

  companyEquityStatus: string | null;

  employerHeadlineEquityValue: number | null;

  totalOptionsOrShares: number | null;

  exercisePrice: number | null;

  currentFMV: number | null;

  listedSharePrice: number | null;

  companyValuation: number | null;

  totalCompanyShares: number | null;

  ownershipPercentage: number | null;

  vestingDurationMonths: number | null;

  cliffMonths: number | null;

  vestingFrequency: string | null;

  vestingStartDate: string | null;

  grantDate: string | null;

  expiryDate: string | null;

  postTerminationExerciseDays: number | null;

  expectedDilutionPercentage: number | null;

  originalFileName: string | null;

  mimeType: string | null;

  fileSizeBytes: number | null;

  pageCount: number | null;

  normalizedSnapshot: unknown;

  validationSnapshot: unknown;

  confirmedAt: string | null;

  archivedAt: string | null;

  createdAt: string;

  updatedAt: string;
};

type OfferSummary = {
  companyName: string | null;

  roleTitle: string | null;

  headlineCTC: number | null;

  fixedSalary: number | null;

  targetVariablePay: number | null;

  joiningBonus: number | null;

  equityType: string | null;

  totalOptionsOrShares: number | null;

  hasEquity: boolean;

  equityModelReady: boolean;

  confirmed: boolean;

  readyForComparison: boolean;
};

type SavedOfferSuccessResponse = {
  success: true;

  offer: SavedOffer;

  summary: OfferSummary;

  actions?: {
    canCompare?: boolean;

    compareLabel?: string;

    compareHref?: string;
  };
};

type SavedOfferErrorResponse = {
  success: false;

  message: string;

  code?: string;
};

type SavedOfferApiResponse =
  | SavedOfferSuccessResponse
  | SavedOfferErrorResponse;

type ComparisonWinner =
  | "A"
  | "B"
  | "TIE"
  | "UNKNOWN";

type ComparisonMetric = {
  label: string;

  description?: string;

  valueA: string;

  valueB: string;

  rawA?: number | null;

  rawB?: number | null;

  winner: ComparisonWinner;

  difference?: string | null;

  higherIsBetter?: boolean;

  note?: string;
};

type EquityEconomics = {
  applicable: boolean;

  type: string;

  quantity: number | null;

  referenceShareValue: number | null;

  exercisePrice: number | null;

  grossReferenceValue: number | null;

  exerciseCost: number | null;

  intrinsicSpread: number | null;

  dilutedIntrinsicSpread: number | null;

  dilutionPercentage: number | null;

  modelReady: boolean;

  reason: string | null;
};

type ComparisonScores = {
  cashA: number;
  cashB: number;

  equityA: number;
  equityB: number;

  termsA: number;
  termsB: number;

  completenessA: number;
  completenessB: number;

  totalA: number;
  totalB: number;
};

type OfferDecisionAvailability = {
  cashReady: boolean;

  overallReady: boolean;

  reason: string | null;

  clarificationQuestions: string[];
};

/* ============================================================
   BASIC HELPERS
============================================================ */

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function money(
  value: unknown,
  currency = "INR"
): string {
  if (!isFiniteNumber(value)) {
    return "Not available";
  }

  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency:
          currency || "INR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  } catch {
    return new Intl.NumberFormat(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    ).format(value);
  }
}

function number(
  value: unknown
): string {
  if (!isFiniteNumber(value)) {
    return "Not available";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function percent(
  value: unknown
): string {
  if (!isFiniteNumber(value)) {
    return "Not available";
  }

  return `${new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  ).format(value)}%`;
}

function textValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not available";
  }

  return String(value)
    .replaceAll(
      "_",
      " "
    );
}

function months(
  value: unknown
): string {
  if (!isFiniteNumber(value)) {
    return "Not available";
  }

  if (
    value > 0 &&
    value % 12 === 0
  ) {
    const years =
      value / 12;

    return `${value} months (${years} ${
      years === 1
        ? "year"
        : "years"
    })`;
  }

  return `${value} months`;
}

function days(
  value: unknown
): string {
  if (!isFiniteNumber(value)) {
    return "Not available";
  }

  return `${number(
    value
  )} days`;
}

function displayDate(
  value: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function safeObject(
  value: unknown
): JsonRecord | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as JsonRecord;
}

function stringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      Boolean(item.trim())
  );
}

function getOfferDecisionAvailability(
  offer: SavedOffer
): OfferDecisionAvailability {
  const validation =
    safeObject(
      offer.validationSnapshot
    );

  const scannerReadiness =
    safeObject(
      validation?.readiness
    );

  const normalized =
    safeObject(
      offer.normalizedSnapshot
    );

  const decision =
    safeObject(
      normalized?.decisionReadiness
    );

  const cashReady =
    decision?.cashComparison === "READY" ||
    scannerReadiness?.canCompareGuaranteedCash === true ||
    (Boolean(offer.companyName?.trim()) &&
      Boolean(offer.roleTitle?.trim()) &&
      isFiniteNumber(offer.fixedSalary) &&
      offer.fixedSalary > 0);

  const decisionState =
    decision?.overallDecision ??
    scannerReadiness?.decisionState;

  const overallReady =
    decisionState === "READY" ||
    decisionState === "CASH_ONLY" ||
    decisionState === "FULL_DECISION_READY" ||
    decisionState === "CASH_ONLY_READY" ||
    (!decisionState &&
      offer.equityType === "NONE" &&
      cashReady);

  const missingEquity =
    stringArray(
      decision?.missingEquityFields ??
        scannerReadiness?.missingEquityFields
    );

  const clarificationQuestions =
    stringArray(
      decision?.clarificationQuestions ??
        scannerReadiness?.clarificationQuestions
    );

  if (overallReady) {
    return {
      cashReady,
      overallReady: true,
      reason: null,
      clarificationQuestions,
    };
  }

  if (!cashReady) {
    return {
      cashReady: false,
      overallReady: false,
      reason:
        "Required guaranteed-cash information is incomplete.",
      clarificationQuestions,
    };
  }

  if (offer.equityType === "UNKNOWN" || !offer.equityType) {
    return {
      cashReady: true,
      overallReady: false,
      reason:
        "The offer letter does not clearly establish whether equity is included.",
      clarificationQuestions,
    };
  }

  return {
    cashReady: true,
    overallReady: false,
    reason: missingEquity.length
      ? `Material equity terms are incomplete: ${missingEquity.join(", ")}.`
      : "Material equity terms still need clarification.",
    clarificationQuestions,
  };
}

function absoluteDifference(
  a: number | null,
  b: number | null
): number | null {
  if (
    !isFiniteNumber(a) ||
    !isFiniteNumber(b)
  ) {
    return null;
  }

  return b - a;
}

function numericWinner(
  a: number | null,
  b: number | null,
  higherIsBetter = true
): ComparisonWinner {
  if (
    !isFiniteNumber(a) ||
    !isFiniteNumber(b)
  ) {
    return "UNKNOWN";
  }

  if (a === b) {
    return "TIE";
  }

  if (higherIsBetter) {
    return a > b
      ? "A"
      : "B";
  }

  return a < b
    ? "A"
    : "B";
}

function differenceMoney(
  a: number | null,
  b: number | null,
  currency = "INR"
): string | null {
  const difference =
    absoluteDifference(
      a,
      b
    );

  if (
    difference === null
  ) {
    return null;
  }

  if (difference === 0) {
    return "Same";
  }

  return `${
    difference > 0
      ? "+"
      : "−"
  }${money(
    Math.abs(
      difference
    ),
    currency
  )} for Offer B`;
}

function differenceNumber(
  a: number | null,
  b: number | null,
  suffix = ""
): string | null {
  const difference =
    absoluteDifference(
      a,
      b
    );

  if (
    difference === null
  ) {
    return null;
  }

  if (difference === 0) {
    return "Same";
  }

  return `${
    difference > 0
      ? "+"
      : "−"
  }${number(
    Math.abs(
      difference
    )
  )}${suffix} for Offer B`;
}

/* ============================================================
   EQUITY ECONOMICS

   IMPORTANT:
   These are deterministic reference calculations.

   They are NOT a promise of realizable value.

   ESOP:
   intrinsic spread =
   max(reference share value - strike price, 0) × quantity

   RSU:
   reference gross value =
   reference share value × quantity

   Dilution adjustment is shown only when an expected dilution
   percentage is explicitly available.
============================================================ */

function calculateEquityEconomics(
  offer: SavedOffer
): EquityEconomics {
  const equityType =
    offer.equityType ??
    "UNKNOWN";

  if (
    equityType === "NONE"
  ) {
    return {
      applicable: false,
      type: "NONE",
      quantity: null,
      referenceShareValue:
        null,
      exercisePrice: null,
      grossReferenceValue:
        null,
      exerciseCost: null,
      intrinsicSpread: null,
      dilutedIntrinsicSpread:
        null,
      dilutionPercentage:
        offer.expectedDilutionPercentage,
      modelReady: true,
      reason:
        "This offer does not contain equity compensation.",
    };
  }

  if (
    equityType === "UNKNOWN"
  ) {
    return {
      applicable: true,
      type: "UNKNOWN",
      quantity: null,
      referenceShareValue: null,
      exercisePrice: null,
      grossReferenceValue: null,
      exerciseCost: null,
      intrinsicSpread: null,
      dilutedIntrinsicSpread: null,
      dilutionPercentage: null,
      modelReady: false,
      reason:
        "The offer letter does not clearly establish whether equity is included. Unknown equity is not treated as no equity or as ₹0.",
    };
  }

  const quantity =
    offer.totalOptionsOrShares;

  const referenceShareValue =
    offer.listedSharePrice ??
    offer.currentFMV;

  const exercisePrice =
    offer.exercisePrice;

  const dilution =
    offer.expectedDilutionPercentage;

  if (
    !isFiniteNumber(
      quantity
    ) ||
    !isFiniteNumber(
      referenceShareValue
    )
  ) {
    return {
      applicable: true,
      type: equityType,
      quantity,
      referenceShareValue,
      exercisePrice,
      grossReferenceValue:
        null,
      exerciseCost: null,
      intrinsicSpread: null,
      dilutedIntrinsicSpread:
        null,
      dilutionPercentage:
        dilution,
      modelReady: false,
      reason:
        "The saved offer does not contain enough confirmed valuation inputs to estimate reference equity economics.",
    };
  }

  const grossReferenceValue =
    quantity *
    referenceShareValue;

  if (
    equityType === "RSU"
  ) {
    const diluted =
      isFiniteNumber(
        dilution
      )
        ? grossReferenceValue *
          Math.max(
            0,
            1 -
              dilution /
                100
          )
        : null;

    return {
      applicable: true,
      type: equityType,
      quantity,
      referenceShareValue,
      exercisePrice: null,
      grossReferenceValue,
      exerciseCost: 0,
      intrinsicSpread:
        grossReferenceValue,
      dilutedIntrinsicSpread:
        diluted,
      dilutionPercentage:
        dilution,
      modelReady: true,
      reason: null,
    };
  }

  if (
    equityType === "ESOP"
  ) {
    if (
      !isFiniteNumber(
        exercisePrice
      )
    ) {
      return {
        applicable: true,
        type: equityType,
        quantity,
        referenceShareValue,
        exercisePrice,
        grossReferenceValue,
        exerciseCost: null,
        intrinsicSpread: null,
        dilutedIntrinsicSpread:
          null,
        dilutionPercentage:
          dilution,
        modelReady: false,
        reason:
          "The ESOP exercise price is unavailable, so intrinsic spread cannot be calculated reliably.",
      };
    }

    const exerciseCost =
      quantity *
      exercisePrice;

    const spreadPerShare =
      Math.max(
        referenceShareValue -
          exercisePrice,
        0
      );

    const intrinsicSpread =
      quantity *
      spreadPerShare;

    const diluted =
      isFiniteNumber(
        dilution
      )
        ? intrinsicSpread *
          Math.max(
            0,
            1 -
              dilution /
                100
          )
        : null;

    return {
      applicable: true,
      type: equityType,
      quantity,
      referenceShareValue,
      exercisePrice,
      grossReferenceValue,
      exerciseCost,
      intrinsicSpread,
      dilutedIntrinsicSpread:
        diluted,
      dilutionPercentage:
        dilution,
      modelReady: true,
      reason: null,
    };
  }

  return {
    applicable: true,
    type: equityType,
    quantity,
    referenceShareValue,
    exercisePrice,
    grossReferenceValue,
    exerciseCost: null,
    intrinsicSpread: null,
    dilutedIntrinsicSpread:
      null,
    dilutionPercentage:
      dilution,
    modelReady: false,
    reason:
      "This equity type is stored, but the comparison engine does not yet apply a valuation formula to it.",
  };
}

/* ============================================================
   CASH HELPERS
============================================================ */

function guaranteedEmployerValue(
  offer: SavedOffer
): number | null {
  if (
    !isFiniteNumber(
      offer.fixedSalary
    )
  ) {
    return null;
  }

  return (
    offer.fixedSalary +
    (offer.employerPF ??
      0) +
    (offer.gratuity ??
      0)
  );
}

function targetCashValue(
  offer: SavedOffer
): number | null {
  if (
    !isFiniteNumber(offer.fixedSalary) ||
    !isFiniteNumber(
      offer.targetVariablePay
    )
  ) {
    return null;
  }

  return (
    offer.fixedSalary +
    offer.targetVariablePay
  );
}

function firstYearCashValue(
  offer: SavedOffer
): number | null {
  const target =
    targetCashValue(
      offer
    );

  if (
    !isFiniteNumber(target) ||
    !isFiniteNumber(
      offer.joiningBonus
    ) ||
    !isFiniteNumber(
      offer.retentionBonus
    ) ||
    !isFiniteNumber(
      offer.relocationBonus
    )
  ) {
    return null;
  }

  return (
    target +
    offer.joiningBonus +
    offer.retentionBonus +
    offer.relocationBonus
  );
}

/* ============================================================
   DATA COMPLETENESS
============================================================ */

function comparisonCompleteness(
  offer: SavedOffer
): number {
  const cashValues = [
    offer.companyName,
    offer.roleTitle,
    offer.fixedSalary,
  ];

  const equityType =
    offer.equityType ??
    "UNKNOWN";

  if (equityType === "NONE") {
    return Math.round(
      (cashValues.filter(Boolean).length /
        cashValues.length) *
        100
    );
  }

  const values = [
    ...cashValues,
    equityType === "UNKNOWN" ? null : equityType,
    offer.totalOptionsOrShares,
    offer.exercisePrice,
    offer.currentFMV ??
      offer.listedSharePrice,
    offer.vestingDurationMonths,
    offer.cliffMonths,
    offer.postTerminationExerciseDays,
    offer.expectedDilutionPercentage,
  ];

  const available =
    values.filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== ""
    ).length;

  if (
    values.length === 0
  ) {
    return 0;
  }

  return Math.round(
    (available /
      values.length) *
      100
  );
}

/* ============================================================
   SCORING

   This score is deliberately transparent and lightweight.
   It does NOT convert equity into guaranteed compensation.

   Cash score:
   45 possible

   Equity score:
   35 possible

   Terms / risk score:
   15 possible

   Completeness:
   5 possible
============================================================ */

function buildScores(
  offerA: SavedOffer,
  offerB: SavedOffer,
  equityA: EquityEconomics,
  equityB: EquityEconomics
): ComparisonScores {
  let cashA = 0;
  let cashB = 0;

  let equityScoreA = 0;
  let equityScoreB = 0;

  let termsA = 0;
  let termsB = 0;

  const compareAndAward = (
    a: number | null,
    b: number | null,
    points: number,
    higherIsBetter = true,
    category:
      | "CASH"
      | "EQUITY"
      | "TERMS"
  ) => {
    const winner =
      numericWinner(
        a,
        b,
        higherIsBetter
      );

    const addA = () => {
      if (
        category === "CASH"
      ) {
        cashA += points;
      } else if (
        category ===
        "EQUITY"
      ) {
        equityScoreA +=
          points;
      } else {
        termsA += points;
      }
    };

    const addB = () => {
      if (
        category === "CASH"
      ) {
        cashB += points;
      } else if (
        category ===
        "EQUITY"
      ) {
        equityScoreB +=
          points;
      } else {
        termsB += points;
      }
    };

    if (winner === "A") {
      addA();
    }

    if (winner === "B") {
      addB();
    }

    if (
      winner === "TIE"
    ) {
      const half =
        points / 2;

      if (
        category === "CASH"
      ) {
        cashA += half;
        cashB += half;
      } else if (
        category ===
        "EQUITY"
      ) {
        equityScoreA +=
          half;

        equityScoreB +=
          half;
      } else {
        termsA += half;
        termsB += half;
      }
    }
  };

  compareAndAward(
    offerA.fixedSalary,
    offerB.fixedSalary,
    20,
    true,
    "CASH"
  );

  compareAndAward(
    targetCashValue(
      offerA
    ),
    targetCashValue(
      offerB
    ),
    10,
    true,
    "CASH"
  );

  compareAndAward(
    firstYearCashValue(
      offerA
    ),
    firstYearCashValue(
      offerB
    ),
    10,
    true,
    "CASH"
  );

  compareAndAward(
    guaranteedEmployerValue(
      offerA
    ),
    guaranteedEmployerValue(
      offerB
    ),
    5,
    true,
    "CASH"
  );

  compareAndAward(
    equityA.intrinsicSpread,
    equityB.intrinsicSpread,
    20,
    true,
    "EQUITY"
  );

  compareAndAward(
    equityA.dilutedIntrinsicSpread,
    equityB.dilutedIntrinsicSpread,
    5,
    true,
    "EQUITY"
  );

  compareAndAward(
    offerA.totalOptionsOrShares,
    offerB.totalOptionsOrShares,
    5,
    true,
    "EQUITY"
  );

  compareAndAward(
    offerA.exercisePrice,
    offerB.exercisePrice,
    5,
    false,
    "EQUITY"
  );

  compareAndAward(
    offerA.vestingDurationMonths,
    offerB.vestingDurationMonths,
    5,
    false,
    "TERMS"
  );

  compareAndAward(
    offerA.cliffMonths,
    offerB.cliffMonths,
    3,
    false,
    "TERMS"
  );

  compareAndAward(
    offerA.postTerminationExerciseDays,
    offerB.postTerminationExerciseDays,
    5,
    true,
    "TERMS"
  );

  compareAndAward(
    offerA.expectedDilutionPercentage,
    offerB.expectedDilutionPercentage,
    2,
    false,
    "TERMS"
  );

  const completenessA =
    comparisonCompleteness(
      offerA
    );

  const completenessB =
    comparisonCompleteness(
      offerB
    );

  let completenessScoreA =
    0;

  let completenessScoreB =
    0;

  if (
    completenessA >
    completenessB
  ) {
    completenessScoreA =
      5;
  } else if (
    completenessB >
    completenessA
  ) {
    completenessScoreB =
      5;
  } else {
    completenessScoreA =
      2.5;

    completenessScoreB =
      2.5;
  }

  return {
    cashA,
    cashB,

    equityA:
      equityScoreA,

    equityB:
      equityScoreB,

    termsA,
    termsB,

    completenessA:
      completenessScoreA,

    completenessB:
      completenessScoreB,

    totalA:
      cashA +
      equityScoreA +
      termsA +
      completenessScoreA,

    totalB:
      cashB +
      equityScoreB +
      termsB +
      completenessScoreB,
  };
}

/* ============================================================
   WINNER HELPERS
============================================================ */

function scoreWinner(
  a: number,
  b: number
): ComparisonWinner {
  if (a === b) {
    return "TIE";
  }

  return a > b
    ? "A"
    : "B";
}

function winnerLabel(
  winner: ComparisonWinner,
  offerA: SavedOffer,
  offerB: SavedOffer
): string {
  if (winner === "A") {
    return (
      offerA.companyName ??
      "Offer A"
    );
  }

  if (winner === "B") {
    return (
      offerB.companyName ??
      "Offer B"
    );
  }

  if (
    winner === "TIE"
  ) {
    return "Tie";
  }

  return "Insufficient data";
}

/* ============================================================
   WARNING EXTRACTION
============================================================ */

function validationWarnings(
  offer: SavedOffer
): string[] {
  const warnings:
    string[] = [];

  if (
    offer.status !==
    "CONFIRMED"
  ) {
    warnings.push(
      "This offer is not currently marked as confirmed."
    );
  }

  if (
    !isFiniteNumber(
      offer.fixedSalary
    )
  ) {
    warnings.push(
      "Annual fixed compensation is missing."
    );
  }

  if (
    !offer.equityType ||
    offer.equityType ===
      "UNKNOWN"
  ) {
    warnings.push(
      "The offer letter does not clearly establish whether equity is included. It is not treated as no equity or as ₹0."
    );
  } else if (
    offer.equityType !==
    "NONE"
  ) {
    if (
      !isFiniteNumber(
        offer.totalOptionsOrShares
      )
    ) {
      warnings.push(
        "Equity quantity is missing."
      );
    }

    if (
      offer.equityType ===
        "ESOP" &&
      !isFiniteNumber(
        offer.exercisePrice
      )
    ) {
      warnings.push(
        "ESOP exercise price is missing."
      );
    }

    if (
      !isFiniteNumber(
        offer.currentFMV
      ) &&
      !isFiniteNumber(
        offer.listedSharePrice
      )
    ) {
      warnings.push(
        "A current FMV or listed share price is missing."
      );
    }

    if (
      !isFiniteNumber(
        offer.vestingDurationMonths
      )
    ) {
      warnings.push(
        "Vesting duration is missing."
      );
    }

    if (
      !isFiniteNumber(
        offer.postTerminationExerciseDays
      ) &&
      offer.equityType ===
        "ESOP"
    ) {
      warnings.push(
        "Post-termination exercise window is unknown."
      );
    }

    if (
      !isFiniteNumber(
        offer.expectedDilutionPercentage
      ) &&
      offer.companyEquityStatus ===
        "UNLISTED"
    ) {
      warnings.push(
        "Expected dilution is unknown."
      );
    }
  }

  const validation =
    safeObject(
      offer.validationSnapshot
    );

  if (validation) {
    const issues =
      validation.issues;

    if (
      Array.isArray(
        issues
      )
    ) {
      for (
        const item of
        issues
      ) {
        const record =
          safeObject(item);

        const message =
          record?.message;

        if (
          typeof message ===
            "string" &&
          message.trim() &&
          !warnings.includes(
            message.trim()
          )
        ) {
          warnings.push(
            message.trim()
          );
        }
      }
    }
  }

  return warnings;
}

/* ============================================================
   UI HELPERS
============================================================ */

function WinnerBadge({
  winner,
  side,
}: {
  winner: ComparisonWinner;
  side: "A" | "B";
}) {
  if (
    winner === "UNKNOWN"
  ) {
    return null;
  }

  if (
    winner === "TIE"
  ) {
    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
        Tie
      </span>
    );
  }

  if (winner !== side) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
      <Trophy size={11} />
      Better
    </span>
  );
}

function DifferenceBadge({
  text,
  winner,
}: {
  text: string | null | undefined;
  winner: ComparisonWinner;
}) {
  if (!text) {
    return null;
  }

  const className =
    winner === "TIE"
      ? "border-slate-200 bg-slate-50 text-slate-600"
      : winner ===
          "UNKNOWN"
      ? "border-slate-200 bg-white text-slate-500"
      : "border-violet-200 bg-violet-50 text-violet-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}
    >
      {text}
    </span>
  );
}

function OfferIdentityCard({
  side,
  offer,
  highlighted = false,
}: {
  side: "A" | "B";
  offer: SavedOffer;
  highlighted?: boolean;
}) {
  return (
    <div
      className={[
        "oi-hover-lift oi-reveal rounded-[26px] border p-6",
        highlighted
          ? "border-violet-300 bg-violet-50/70"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.15em]",
            side === "A"
              ? "bg-slate-950 text-white"
              : "bg-violet-600 text-white",
          ].join(" ")}
        >
          Offer {side}
        </span>

        {offer.status ===
        "CONFIRMED" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
            <CheckCircle2
              size={12}
            />
            Confirmed
          </span>
        ) : (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
            {offer.status}
          </span>
        )}
      </div>

      <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
        {offer.companyName ??
          `Offer ${side}`}
      </h2>

      <p className="mt-1 text-sm font-bold text-slate-600">
        {offer.roleTitle ??
          "Role not available"}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {offer.location ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            <MapPin
              size={13}
            />
            {offer.location}
          </span>
        ) : null}

        {offer.workMode ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            <BriefcaseBusiness
              size={13}
            />
            {textValue(
              offer.workMode
            )}
          </span>
        ) : null}

        {offer.joiningDate ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            <Clock3
              size={13}
            />
            {displayDate(
              offer.joiningDate
            )}
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Fixed compensation
          </p>

          <p className="mt-2 text-xl font-black text-slate-950">
            {money(
              offer.fixedSalary,
              offer.currency
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Equity
          </p>

          <p className="mt-2 text-xl font-black text-slate-950">
            {textValue(
              offer.equityType
            )}
          </p>
        </div>
      </div>

      <Link
        href={`/pro/offers/${encodeURIComponent(
          offer.id
        )}`}
        className="group mt-5 inline-flex items-center gap-2 text-sm font-black text-violet-700 transition duration-300 hover:-translate-y-0.5 hover:text-violet-900"
      >
        View saved offer
        <ArrowRight
          className="transition-transform duration-300 group-hover:translate-x-1.5"
          size={15}
        />
      </Link>
    </div>
  );
}

/* ============================================================
   METRIC ROW
============================================================ */

function ComparisonRow({
  metric,
}: {
  metric: ComparisonMetric;
}) {
  return (
    <div className="oi-metric-row grid gap-3 border-t border-slate-100 py-5 first:border-t-0 md:grid-cols-[1.1fr_1fr_1fr] md:items-center">
      <div>
        <p className="font-black text-slate-950">
          {metric.label}
        </p>

        {metric.description ? (
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
            {metric.description}
          </p>
        ) : null}

        {metric.difference ? (
          <div className="mt-2">
            <DifferenceBadge
              text={
                metric.difference
              }
              winner={
                metric.winner
              }
            />
          </div>
        ) : null}
      </div>

      <div
        className={[
          "rounded-2xl border p-4",
          metric.winner ===
          "A"
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-slate-200 bg-slate-50",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Offer A
          </span>

          <WinnerBadge
            winner={
              metric.winner
            }
            side="A"
          />
        </div>

        <p className="mt-2 text-lg font-black text-slate-950">
          {metric.valueA}
        </p>
      </div>

      <div
        className={[
          "rounded-2xl border p-4",
          metric.winner ===
          "B"
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-slate-200 bg-slate-50",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Offer B
          </span>

          <WinnerBadge
            winner={
              metric.winner
            }
            side="B"
          />
        </div>

        <p className="mt-2 text-lg font-black text-slate-950">
          {metric.valueB}
        </p>
      </div>

      {metric.note ? (
        <p className="text-xs leading-5 text-slate-500 md:col-start-2 md:col-span-2">
          {metric.note}
        </p>
      ) : null}
    </div>
  );
}

/* ============================================================
   COMPARISON SECTION
============================================================ */

function ComparisonSection({
  eyebrow,
  title,
  description,
  icon,
  metrics,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  metrics: ComparisonMetric[];
}) {
  return (
    <section className="oi-reveal oi-section-lift rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {metrics.map(
          (metric) => (
            <ComparisonRow
              key={
                metric.label
              }
              metric={
                metric
              }
            />
          )
        )}
      </div>
    </section>
  );
}

/* ============================================================
   SCORE BAR
============================================================ */

function ScoreBar({
  label,
  scoreA,
  scoreB,
  max,
}: {
  label: string;
  scoreA: number;
  scoreB: number;
  max: number;
}) {
  const percentA =
    Math.min(
      100,
      Math.max(
        0,
        (scoreA /
          max) *
          100
      )
    );

  const percentB =
    Math.min(
      100,
      Math.max(
        0,
        (scoreB /
          max) *
          100
      )
    );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-black text-slate-700">
          {label}
        </p>

        <p className="text-xs font-bold text-slate-400">
          A {scoreA.toFixed(
            1
          )} / B{" "}
          {scoreB.toFixed(
            1
          )}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="oi-score-fill h-full rounded-full bg-slate-950"
              style={{
                width: `${percentA}%`,
              }}
            />
          </div>

          <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Offer A
          </p>
        </div>

        <div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="oi-score-fill h-full rounded-full bg-violet-600"
              style={{
                width: `${percentB}%`,
              }}
            />
          </div>

          <p className="mt-1 text-right text-[10px] font-black uppercase tracking-wider text-violet-500">
            Offer B
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Loader2
              className="animate-spin"
              size={30}
            />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Building your
            comparison
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Loading both saved
            offers and preparing
            Offer Intelligence.
          </p>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   ERROR
============================================================ */

function ErrorState({
  message,
  offerAId,
}: {
  message: string;
  offerAId: string | null;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-[30px] border border-red-200 bg-white p-8 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <CircleAlert
              size={26}
            />
          </div>

          <h1 className="mt-5 text-3xl font-black text-slate-950">
            We couldn&apos;t
            build this
            comparison.
          </h1>

          <p className="mt-3 leading-7 text-slate-600">
            {message}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {offerAId ? (
              <Link
                href={`/pro/offers/${encodeURIComponent(
                  offerAId
                )}`}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
              >
                <ArrowLeft
                  size={16}
                />
                Return to Offer A
              </Link>
            ) : null}

            <Link
              href="/pro/offers"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"
            >
              Offer Intelligence
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function OfferComparePage() {
  const searchParams =
    useSearchParams();

  const offerAId =
    searchParams
      .get("offerA")
      ?.trim() ||
    null;

  const offerBId =
    searchParams
      .get("offerB")
      ?.trim() ||
    null;

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    offerA,
    setOfferA,
  ] =
    useState<SavedOffer | null>(
      null
    );

  const [
    offerB,
    setOfferB,
  ] =
    useState<SavedOffer | null>(
      null
    );

  /* ==========================================================
     LOAD BOTH SAVED OFFERS
  ========================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      setLoading(true);
      setError(null);
      setOfferA(null);
      setOfferB(null);

      if (
        !offerAId ||
        !offerBId
      ) {
        setError(
          "Both Offer A and Offer B IDs are required. Start the comparison from a saved Offer A."
        );

        setLoading(false);

        return;
      }

      if (
        offerAId ===
        offerBId
      ) {
        setError(
          "Offer A and Offer B must be different saved offers."
        );

        setLoading(false);

        return;
      }

      try {
        const [
          requestA,
          requestB,
        ] =
          await Promise.all([
            fetch(
              `/api/pro/offers/${encodeURIComponent(
                offerAId
              )}`,
              {
                method:
                  "GET",
                cache:
                  "no-store",
              }
            ),

            fetch(
              `/api/pro/offers/${encodeURIComponent(
                offerBId
              )}`,
              {
                method:
                  "GET",
                cache:
                  "no-store",
              }
            ),
          ]);

        const [
          resultA,
          resultB,
        ] =
          (await Promise.all([
            requestA.json(),
            requestB.json(),
          ])) as [
            SavedOfferApiResponse,
            SavedOfferApiResponse,
          ];

        if (
          cancelled
        ) {
          return;
        }

        if (
          !requestA.ok ||
          !resultA.success
        ) {
          setError(
            resultA.success
              ? "Offer A could not be loaded."
              : `Offer A: ${resultA.message}`
          );

          return;
        }

        if (
          !requestB.ok ||
          !resultB.success
        ) {
          setError(
            resultB.success
              ? "Offer B could not be loaded."
              : `Offer B: ${resultB.message}`
          );

          return;
        }

        setOfferA(
          resultA.offer
        );

        setOfferB(
          resultB.offer
        );
      } catch (
        caught
      ) {
        console.error(
          "[OFFER_COMPARE_UI]",
          caught
        );

        if (
          !cancelled
        ) {
          setError(
            "Something went wrong while loading the two saved offers."
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    offerAId,
    offerBId,
  ]);

  /* ==========================================================
     EQUITY ECONOMICS
  ========================================================== */

  const equityA =
    useMemo(
      () =>
        offerA
          ? calculateEquityEconomics(
              offerA
            )
          : null,
      [offerA]
    );

  const equityB =
    useMemo(
      () =>
        offerB
          ? calculateEquityEconomics(
              offerB
            )
          : null,
      [offerB]
    );

  const availabilityA =
    useMemo(
      () =>
        offerA
          ? getOfferDecisionAvailability(
              offerA
            )
          : null,
      [offerA]
    );

  const availabilityB =
    useMemo(
      () =>
        offerB
          ? getOfferDecisionAvailability(
              offerB
            )
          : null,
      [offerB]
    );

  const canShowEquityRankings =
    Boolean(
      availabilityA?.overallReady &&
        availabilityB?.overallReady &&
        equityA?.modelReady &&
        equityB?.modelReady
    );

  /* ==========================================================
     SCORES
  ========================================================== */

  const scores =
    useMemo(() => {
      if (
        !offerA ||
        !offerB ||
        !equityA ||
        !equityB
      ) {
        return null;
      }

      return buildScores(
        offerA,
        offerB,
        equityA,
        equityB
      );
    }, [
      offerA,
      offerB,
      equityA,
      equityB,
    ]);

  /* ==========================================================
     METRICS
  ========================================================== */

  const cashMetrics =
    useMemo<
      ComparisonMetric[]
    >(() => {
      if (
        !offerA ||
        !offerB
      ) {
        return [];
      }

      const currency =
        offerA.currency ||
        offerB.currency ||
        "INR";

      const guaranteedA =
        guaranteedEmployerValue(
          offerA
        );

      const guaranteedB =
        guaranteedEmployerValue(
          offerB
        );

      const targetA =
        targetCashValue(
          offerA
        );

      const targetB =
        targetCashValue(
          offerB
        );

      const firstYearA =
        firstYearCashValue(
          offerA
        );

      const firstYearB =
        firstYearCashValue(
          offerB
        );

      return [
        {
          label:
            "Annual fixed compensation",

          description:
            "The recurring fixed compensation identified in the confirmed offer.",

          valueA: money(
            offerA.fixedSalary,
            currency
          ),

          valueB: money(
            offerB.fixedSalary,
            currency
          ),

          rawA:
            offerA.fixedSalary,

          rawB:
            offerB.fixedSalary,

          winner:
            numericWinner(
              offerA.fixedSalary,
              offerB.fixedSalary
            ),

          difference:
            differenceMoney(
              offerA.fixedSalary,
              offerB.fixedSalary,
              currency
            ),
        },

        {
          label:
            "Target variable pay",

          description:
            "Performance-linked target compensation. It is not treated as guaranteed cash.",

          valueA: money(
            offerA.targetVariablePay,
            currency
          ),

          valueB: money(
            offerB.targetVariablePay,
            currency
          ),

          rawA:
            offerA.targetVariablePay,

          rawB:
            offerB.targetVariablePay,

          winner:
            numericWinner(
              offerA.targetVariablePay,
              offerB.targetVariablePay
            ),

          difference:
            differenceMoney(
              offerA.targetVariablePay,
              offerB.targetVariablePay,
              currency
            ),
        },

        {
          label:
            "Joining bonus",

          description:
            "One-time joining compensation. Any clawback condition should be reviewed separately.",

          valueA: money(
            offerA.joiningBonus,
            currency
          ),

          valueB: money(
            offerB.joiningBonus,
            currency
          ),

          rawA:
            offerA.joiningBonus,

          rawB:
            offerB.joiningBonus,

          winner:
            numericWinner(
              offerA.joiningBonus,
              offerB.joiningBonus
            ),

          difference:
            differenceMoney(
              offerA.joiningBonus,
              offerB.joiningBonus,
              currency
            ),
        },

        {
          label:
            "Employer PF",

          valueA: money(
            offerA.employerPF,
            currency
          ),

          valueB: money(
            offerB.employerPF,
            currency
          ),

          rawA:
            offerA.employerPF,

          rawB:
            offerB.employerPF,

          winner:
            numericWinner(
              offerA.employerPF,
              offerB.employerPF
            ),

          difference:
            differenceMoney(
              offerA.employerPF,
              offerB.employerPF,
              currency
            ),
        },

        {
          label:
            "Gratuity",

          valueA: money(
            offerA.gratuity,
            currency
          ),

          valueB: money(
            offerB.gratuity,
            currency
          ),

          rawA:
            offerA.gratuity,

          rawB:
            offerB.gratuity,

          winner:
            numericWinner(
              offerA.gratuity,
              offerB.gratuity
            ),

          difference:
            differenceMoney(
              offerA.gratuity,
              offerB.gratuity,
              currency
            ),
        },

        {
          label:
            "Fixed + employer statutory value",

          description:
            "Fixed compensation plus identified employer PF and gratuity. This is a comparison aid, not take-home salary.",

          valueA: money(
            guaranteedA,
            currency
          ),

          valueB: money(
            guaranteedB,
            currency
          ),

          rawA:
            guaranteedA,

          rawB:
            guaranteedB,

          winner:
            numericWinner(
              guaranteedA,
              guaranteedB
            ),

          difference:
            differenceMoney(
              guaranteedA,
              guaranteedB,
              currency
            ),
        },

        {
          label:
            "Target recurring cash",

          description:
            "Fixed compensation plus target variable pay. Variable pay remains performance-dependent.",

          valueA: money(
            targetA,
            currency
          ),

          valueB: money(
            targetB,
            currency
          ),

          rawA:
            targetA,

          rawB:
            targetB,

          winner:
            numericWinner(
              targetA,
              targetB
            ),

          difference:
            differenceMoney(
              targetA,
              targetB,
              currency
            ),
        },

        {
          label:
            "First-year target cash",

          description:
            "Target recurring cash plus identified one-time joining, retention and relocation bonuses.",

          valueA: money(
            firstYearA,
            currency
          ),

          valueB: money(
            firstYearB,
            currency
          ),

          rawA:
            firstYearA,

          rawB:
            firstYearB,

          winner:
            numericWinner(
              firstYearA,
              firstYearB
            ),

          difference:
            differenceMoney(
              firstYearA,
              firstYearB,
              currency
            ),
        },
      ];
    }, [
      offerA,
      offerB,
    ]);

  const equityMetrics =
    useMemo<
      ComparisonMetric[]
    >(() => {
      if (
        !offerA ||
        !offerB ||
        !equityA ||
        !equityB
      ) {
        return [];
      }

      const currency =
        offerA.currency ||
        offerB.currency ||
        "INR";

      const metrics: ComparisonMetric[] = [
        {
          label:
            "Equity type",

          valueA:
            textValue(
              offerA.equityType
            ),

          valueB:
            textValue(
              offerB.equityType
            ),

          winner:
            "UNKNOWN",

          note:
            "Different equity instruments cannot be ranked purely by their label.",
        },

        {
          label:
            "Options / shares granted",

          description:
            "Grant quantity alone does not determine value. Strike price, share value, dilution and liquidity matter.",

          valueA: number(
            offerA.totalOptionsOrShares
          ),

          valueB: number(
            offerB.totalOptionsOrShares
          ),

          rawA:
            offerA.totalOptionsOrShares,

          rawB:
            offerB.totalOptionsOrShares,

          winner:
            numericWinner(
              offerA.totalOptionsOrShares,
              offerB.totalOptionsOrShares
            ),

          difference:
            differenceNumber(
              offerA.totalOptionsOrShares,
              offerB.totalOptionsOrShares,
              " shares/options"
            ),
        },

        {
          label:
            "Exercise / strike price",

          description:
            "For ESOPs, a lower exercise price is generally economically preferable when the underlying share value is otherwise comparable.",

          valueA: money(
            offerA.exercisePrice,
            currency
          ),

          valueB: money(
            offerB.exercisePrice,
            currency
          ),

          rawA:
            offerA.exercisePrice,

          rawB:
            offerB.exercisePrice,

          winner:
            numericWinner(
              offerA.exercisePrice,
              offerB.exercisePrice,
              false
            ),

          difference:
            differenceMoney(
              offerA.exercisePrice,
              offerB.exercisePrice,
              currency
            ),
        },

        {
          label:
            "Current reference share value",

          description:
            "Uses the confirmed listed share price when available; otherwise the confirmed current FMV.",

          valueA: money(
            equityA.referenceShareValue,
            currency
          ),

          valueB: money(
            equityB.referenceShareValue,
            currency
          ),

          rawA:
            equityA.referenceShareValue,

          rawB:
            equityB.referenceShareValue,

          winner:
            "UNKNOWN",

          note:
            "A higher share value is not automatically a better grant because grant quantity and exercise price differ.",
        },

        {
          label:
            "Reference gross equity value",

          description:
            "Grant quantity multiplied by the current confirmed reference share value. This is not realizable or guaranteed compensation.",

          valueA: money(
            equityA.grossReferenceValue,
            currency
          ),

          valueB: money(
            equityB.grossReferenceValue,
            currency
          ),

          rawA:
            equityA.grossReferenceValue,

          rawB:
            equityB.grossReferenceValue,

          winner:
            numericWinner(
              equityA.grossReferenceValue,
              equityB.grossReferenceValue
            ),

          difference:
            differenceMoney(
              equityA.grossReferenceValue,
              equityB.grossReferenceValue,
              currency
            ),
        },

        {
          label:
            "Exercise cost",

          description:
            "Approximate cash required to exercise the full ESOP grant at the confirmed strike price.",

          valueA: money(
            equityA.exerciseCost,
            currency
          ),

          valueB: money(
            equityB.exerciseCost,
            currency
          ),

          rawA:
            equityA.exerciseCost,

          rawB:
            equityB.exerciseCost,

          winner:
            numericWinner(
              equityA.exerciseCost,
              equityB.exerciseCost,
              false
            ),

          difference:
            differenceMoney(
              equityA.exerciseCost,
              equityB.exerciseCost,
              currency
            ),
        },

        {
          label:
            "Current intrinsic spread",

          description:
            "For ESOPs: max(reference share value − strike price, 0) × grant quantity. For RSUs, the reference grant value is used. This is a reference calculation, not guaranteed proceeds.",

          valueA: money(
            equityA.intrinsicSpread,
            currency
          ),

          valueB: money(
            equityB.intrinsicSpread,
            currency
          ),

          rawA:
            equityA.intrinsicSpread,

          rawB:
            equityB.intrinsicSpread,

          winner:
            numericWinner(
              equityA.intrinsicSpread,
              equityB.intrinsicSpread
            ),

          difference:
            differenceMoney(
              equityA.intrinsicSpread,
              equityB.intrinsicSpread,
              currency
            ),
        },

        {
          label:
            "Expected dilution",

          description:
            "Lower expected dilution is generally preferable, but dilution estimates may change with future financing.",

          valueA: percent(
            offerA.expectedDilutionPercentage
          ),

          valueB: percent(
            offerB.expectedDilutionPercentage
          ),

          rawA:
            offerA.expectedDilutionPercentage,

          rawB:
            offerB.expectedDilutionPercentage,

          winner:
            numericWinner(
              offerA.expectedDilutionPercentage,
              offerB.expectedDilutionPercentage,
              false
            ),

          difference:
            differenceNumber(
              offerA.expectedDilutionPercentage,
              offerB.expectedDilutionPercentage,
              " percentage points"
            ),
        },

        {
          label:
            "Dilution-adjusted reference spread",

          description:
            "Shown only when both the reference equity economics and an explicit expected dilution percentage are available.",

          valueA: money(
            equityA.dilutedIntrinsicSpread,
            currency
          ),

          valueB: money(
            equityB.dilutedIntrinsicSpread,
            currency
          ),

          rawA:
            equityA.dilutedIntrinsicSpread,

          rawB:
            equityB.dilutedIntrinsicSpread,

          winner:
            numericWinner(
              equityA.dilutedIntrinsicSpread,
              equityB.dilutedIntrinsicSpread
            ),

          difference:
            differenceMoney(
              equityA.dilutedIntrinsicSpread,
              equityB.dilutedIntrinsicSpread,
              currency
            ),
        },
      ];

      return metrics.map((metric) =>
        canShowEquityRankings
          ? metric
          : {
              ...metric,
              winner: "UNKNOWN" as const,
              difference: null,
              note:
                metric.note ??
                "Not ranked until both offers have the material terms required for an equity comparison.",
            }
      );
    }, [
      offerA,
      offerB,
      equityA,
      equityB,
      canShowEquityRankings,
    ]);

  const termsMetrics =
    useMemo<
      ComparisonMetric[]
    >(() => {
      if (
        !offerA ||
        !offerB
      ) {
        return [];
      }

      const metrics: ComparisonMetric[] = [
        {
          label:
            "Company equity status",

          description:
            "Unlisted equity generally carries more liquidity and valuation uncertainty than listed equity.",

          valueA:
            textValue(
              offerA.companyEquityStatus
            ),

          valueB:
            textValue(
              offerB.companyEquityStatus
            ),

          winner:
            "UNKNOWN",
        },

        {
          label:
            "Vesting duration",

          description:
            "A shorter vesting period generally gives the employee ownership sooner, all else equal.",

          valueA:
            months(
              offerA.vestingDurationMonths
            ),

          valueB:
            months(
              offerB.vestingDurationMonths
            ),

          rawA:
            offerA.vestingDurationMonths,

          rawB:
            offerB.vestingDurationMonths,

          winner:
            numericWinner(
              offerA.vestingDurationMonths,
              offerB.vestingDurationMonths,
              false
            ),

          difference:
            differenceNumber(
              offerA.vestingDurationMonths,
              offerB.vestingDurationMonths,
              " months"
            ),
        },

        {
          label:
            "Cliff",

          description:
            "A shorter cliff may reduce the time before the first portion of the grant becomes vested.",

          valueA:
            months(
              offerA.cliffMonths
            ),

          valueB:
            months(
              offerB.cliffMonths
            ),

          rawA:
            offerA.cliffMonths,

          rawB:
            offerB.cliffMonths,

          winner:
            numericWinner(
              offerA.cliffMonths,
              offerB.cliffMonths,
              false
            ),

          difference:
            differenceNumber(
              offerA.cliffMonths,
              offerB.cliffMonths,
              " months"
            ),
        },

        {
          label:
            "Vesting frequency",

          valueA:
            textValue(
              offerA.vestingFrequency
            ),

          valueB:
            textValue(
              offerB.vestingFrequency
            ),

          winner:
            "UNKNOWN",
        },

        {
          label:
            "Post-termination exercise window",

          description:
            "For ESOPs, a longer exercise window can reduce the pressure to fund an exercise immediately after leaving the company.",

          valueA:
            days(
              offerA.postTerminationExerciseDays
            ),

          valueB:
            days(
              offerB.postTerminationExerciseDays
            ),

          rawA:
            offerA.postTerminationExerciseDays,

          rawB:
            offerB.postTerminationExerciseDays,

          winner:
            numericWinner(
              offerA.postTerminationExerciseDays,
              offerB.postTerminationExerciseDays
            ),

          difference:
            differenceNumber(
              offerA.postTerminationExerciseDays,
              offerB.postTerminationExerciseDays,
              " days"
            ),
        },
      ];

      return metrics.map((metric) =>
        canShowEquityRankings
          ? metric
          : {
              ...metric,
              winner: "UNKNOWN" as const,
              difference: null,
              note:
                metric.note ??
                "Not ranked until both offers have the material terms required for an equity comparison.",
            }
      );
    }, [
      offerA,
      offerB,
      canShowEquityRankings,
    ]);

  /* ==========================================================
     WARNINGS
  ========================================================== */

  const warningsA =
    useMemo(
      () =>
        offerA
          ? validationWarnings(
              offerA
            )
          : [],
      [offerA]
    );

  const warningsB =
    useMemo(
      () =>
        offerB
          ? validationWarnings(
              offerB
            )
          : [],
      [offerB]
    );

  /* ==========================================================
     LOADING / ERROR
  ========================================================== */

  if (loading) {
    return <LoadingState />;
  }

  if (
    error ||
    !offerA ||
    !offerB ||
    !equityA ||
    !equityB ||
    !scores
  ) {
    return (
      <ErrorState
        message={
          error ??
          "The comparison data is incomplete."
        }
        offerAId={
          offerAId
        }
      />
    );
  }

  /* ==========================================================
     FINAL WINNERS
  ========================================================== */

  const canMakeOverallDecision =
    Boolean(
      availabilityA?.overallReady &&
        availabilityB?.overallReady
    );

  const canCompareEquity =
    canMakeOverallDecision &&
    equityA.modelReady &&
    equityB.modelReady;

  const cashWinner =
    numericWinner(
      offerA.fixedSalary,
      offerB.fixedSalary
    );

  const equityWinner =
    canCompareEquity
      ? scoreWinner(
          scores.equityA,
          scores.equityB
        )
      : "UNKNOWN";

  const termsWinner =
    canCompareEquity
      ? scoreWinner(
          scores.termsA,
          scores.termsB
        )
      : "UNKNOWN";

  const overallWinner =
    canMakeOverallDecision
      ? scoreWinner(
          scores.totalA,
          scores.totalB
        )
      : "UNKNOWN";

  const overallWinnerName =
    winnerLabel(
      overallWinner,
      offerA,
      offerB
    );

  const completenessA =
    comparisonCompleteness(
      offerA
    );

  const completenessB =
    comparisonCompleteness(
      offerB
    );

  const fixedDifference =
    absoluteDifference(
      offerA.fixedSalary,
      offerB.fixedSalary
    );

  const equityDifference =
    absoluteDifference(
      equityA.intrinsicSpread,
      equityB.intrinsicSpread
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <style>{`
        @keyframes oiReveal {
          from { opacity: 0; transform: translateY(22px) scale(.992); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes oiScoreGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @keyframes oiPulseRing {
          0%, 100% { transform: scale(1); opacity: .45; }
          50% { transform: scale(1.08); opacity: .8; }
        }

        @keyframes oiFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .oi-reveal {
          animation: oiReveal .65s cubic-bezier(.2,.8,.2,1) both;
        }

        .oi-hover-lift,
        .oi-section-lift,
        .oi-metric-row {
          transition:
            transform .32s cubic-bezier(.2,.8,.2,1),
            box-shadow .32s ease,
            border-color .32s ease;
          will-change: transform;
        }

        .oi-hover-lift:hover {
          transform: translateY(-7px) scale(1.008);
          box-shadow: 0 24px 55px -28px rgba(15, 23, 42, .38);
        }

        .oi-section-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 48px -32px rgba(15, 23, 42, .30);
        }

        .oi-metric-row:hover {
          transform: translateX(5px);
        }

        .oi-score-fill {
          transform-origin: left center;
          animation: oiScoreGrow 1s cubic-bezier(.2,.8,.2,1) .18s both;
        }

        .oi-float {
          animation: oiFloat 3s ease-in-out infinite;
        }

        .oi-pulse-ring {
          animation: oiPulseRing 2.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .oi-reveal,
          .oi-score-fill,
          .oi-float,
          .oi-pulse-ring {
            animation: none !important;
          }

          .oi-hover-lift,
          .oi-section-lift,
          .oi-metric-row {
            transition: none !important;
          }

          .oi-hover-lift:hover,
          .oi-section-lift:hover,
          .oi-metric-row:hover {
            transform: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">

        {/* =====================================================
            TOP
        ====================================================== */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/pro/offers/${encodeURIComponent(
              offerA.id
            )}`}
            className="group inline-flex items-center gap-2 text-sm font-black text-slate-500 transition duration-300 hover:-translate-x-1 hover:text-slate-950"
          >
            <ArrowLeft
              size={17}
            />
            Back to Offer A
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
            <Scale
              size={15}
            />
            Offer A vs Offer B
          </div>
        </div>

        {/* =====================================================
            HERO
        ====================================================== */}

        <section
          className="oi-reveal group overflow-hidden rounded-[34px] bg-slate-950 text-white shadow-xl shadow-slate-950/10"
          onPointerMove={(event) => {
            const rect =
              event.currentTarget.getBoundingClientRect();

            event.currentTarget.style.setProperty(
              "--oi-x",
              `${event.clientX - rect.left}px`
            );

            event.currentTarget.style.setProperty(
              "--oi-y",
              `${event.clientY - rect.top}px`
            );
          }}
        >
          <div className="relative p-7 md:p-10 lg:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(520px circle at var(--oi-x, 72%) var(--oi-y, 20%), rgba(139,92,246,.24), transparent 58%)",
              }}
            />

            <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="pointer-events-none absolute bottom-[-140px] left-[20%] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative">
              <div className="oi-float inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
                <Sparkles
                  size={14}
                />
                PRO • Offer Intelligence
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                Which offer is
                actually better?
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                Compare guaranteed
                compensation,
                performance-linked
                cash, equity
                economics, vesting
                and exercise risk
                without treating
                speculative equity as
                guaranteed salary.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="oi-hover-lift rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Cash leader
                  </p>

                  <p className="mt-2 text-lg font-black">
                    {winnerLabel(
                      cashWinner,
                      offerA,
                      offerB
                    )}
                  </p>
                </div>

                <div className="oi-hover-lift rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Equity opportunity
                  </p>

                  <p className="mt-2 text-lg font-black">
                    {winnerLabel(
                      equityWinner,
                      offerA,
                      offerB
                    )}
                  </p>
                </div>

                <div className="oi-hover-lift rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-300">
                    Overall signal
                  </p>

                  <p className="mt-2 text-lg font-black">
                    {canMakeOverallDecision
                      ? overallWinnerName
                      : "Clarification needed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            OFFER IDENTITIES
        ====================================================== */}

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <OfferIdentityCard
            side="A"
            offer={
              offerA
            }
            highlighted={
              overallWinner ===
              "A"
            }
          />

          <OfferIdentityCard
            side="B"
            offer={
              offerB
            }
            highlighted={
              overallWinner ===
              "B"
            }
          />
        </section>

        {/* =====================================================
            QUICK DECISION
        ====================================================== */}

        <section className="oi-reveal oi-section-lift mt-6 overflow-hidden rounded-[30px] border border-violet-200 bg-white shadow-sm">
          <div className="bg-violet-50 p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">
                  Offer Intelligence
                  verdict
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-violet-950">
                  {!canMakeOverallDecision
                    ? "A full offer verdict needs clarification."
                    : overallWinner ===
                  "TIE"
                    ? "These offers are closely matched."
                    : `${overallWinnerName} has the stronger current comparison signal.`}
                </h2>

                <p className="mt-3 text-sm leading-7 text-violet-950/75">
                  {canMakeOverallDecision
                    ? "This signal combines confirmed cash, current reference equity economics, vesting/exercise terms and documented data completeness. It deliberately does not add speculative equity value directly to guaranteed salary."
                    : `Guaranteed cash remains comparable, but we will not name an overall winner yet. ${availabilityA?.reason ?? "Offer A needs clarification."} ${availabilityB?.reason ?? "Offer B needs clarification."}`}
                </p>

                {!canMakeOverallDecision ? (
                  <ul className="mt-4 space-y-1 text-sm font-bold leading-6 text-violet-950/80">
                    {[
                      ...(availabilityA?.clarificationQuestions ?? []),
                      ...(availabilityB?.clarificationQuestions ?? []),
                    ]
                      .filter(
                        (question, index, questions) =>
                          questions.indexOf(question) === index
                      )
                      .slice(0, 4)
                      .map((question) => (
                        <li key={question}>• {question}</li>
                      ))}
                  </ul>
                ) : null}
              </div>

              <div className="oi-pulse-ring shrink-0 rounded-[24px] bg-slate-950 px-7 py-6 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {canMakeOverallDecision
                    ? "Comparison score"
                    : "Overall score withheld"}
                </p>

                <div className="mt-3 flex items-end gap-3">
                  <div>
                    <p className="text-xs font-black text-slate-400">
                      A
                    </p>

                    <p className="text-3xl font-black">
                      {canMakeOverallDecision
                        ? scores.totalA.toFixed(
                            1
                          )
                        : "—"}
                    </p>
                  </div>

                  <span className="pb-1 text-slate-500">
                    vs
                  </span>

                  <div>
                    <p className="text-xs font-black text-violet-300">
                      B
                    </p>

                    <p className="text-3xl font-black text-violet-300">
                      {canMakeOverallDecision
                        ? scores.totalB.toFixed(
                            1
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {canMakeOverallDecision ? (
            <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-2">
              <div className="space-y-6">
                <ScoreBar
                  label="Cash strength"
                  scoreA={scores.cashA}
                  scoreB={scores.cashB}
                  max={45}
                />

                <ScoreBar
                  label="Equity opportunity"
                  scoreA={scores.equityA}
                  scoreB={scores.equityB}
                  max={35}
                />
              </div>

              <div className="space-y-6">
                <ScoreBar
                  label="Terms & flexibility"
                  scoreA={scores.termsA}
                  scoreB={scores.termsB}
                  max={15}
                />

                <ScoreBar
                  label="Document completeness"
                  scoreA={scores.completenessA}
                  scoreB={scores.completenessB}
                  max={5}
                />
              </div>
            </div>
          ) : (
            <div className="border-t border-violet-100 bg-amber-50 px-6 py-5 text-sm leading-6 text-amber-950 md:px-8">
              The scorecard is intentionally hidden until the missing material terms are clarified. The compensation section below still shows the confirmed guaranteed-cash comparison.
            </div>
          )}
        </section>

        {/* =====================================================
            CASH
        ====================================================== */}

        <div className="mt-6">
          <ComparisonSection
            eyebrow="Cash reality"
            title="Compensation comparison"
            description="Compare recurring fixed compensation separately from performance-linked and one-time amounts."
            icon={
              <WalletCards
                size={23}
              />
            }
            metrics={
              cashMetrics
            }
          />
        </div>

        {/* =====================================================
            EQUITY SUMMARY
        ====================================================== */}

        <section className="oi-reveal oi-section-lift mt-6 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <TrendingUp
                size={23}
              />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                Equity reality
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Current reference
                economics
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                These calculations
                use only confirmed
                grant quantity,
                strike price and
                current FMV/listed
                price. They are not a
                forecast of an exit
                price or guaranteed
                proceeds.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {[
              {
                side: "A" as const,
                offer: offerA,
                equity:
                  equityA,
              },

              {
                side: "B" as const,
                offer: offerB,
                equity:
                  equityB,
              },
            ].map(
              ({
                side,
                offer,
                equity,
              }) => (
                <div
                  key={side}
                  className="oi-hover-lift rounded-[26px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-black",
                        side ===
                        "A"
                          ? "bg-slate-950 text-white"
                          : "bg-violet-600 text-white",
                      ].join(
                        " "
                      )}
                    >
                      Offer {side}
                    </span>

                    <span className="text-xs font-bold text-slate-500">
                      {textValue(
                        offer.equityType
                      )}
                    </span>
                  </div>

                  {equity.modelReady ? (
                    <>
                      <p className="mt-5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Current
                        intrinsic/reference
                        spread
                      </p>

                      <p className="mt-2 text-3xl font-black text-slate-950">
                        {money(
                          equity.intrinsicSpread,
                          offer.currency
                        )}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Grant
                          </p>

                          <p className="mt-2 font-black">
                            {number(
                              equity.quantity
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Reference
                            share value
                          </p>

                          <p className="mt-2 font-black">
                            {money(
                              equity.referenceShareValue,
                              offer.currency
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Exercise
                            cost
                          </p>

                          <p className="mt-2 font-black">
                            {money(
                              equity.exerciseCost,
                              offer.currency
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Dilution
                          </p>

                          <p className="mt-2 font-black">
                            {percent(
                              equity.dilutionPercentage
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex gap-3">
                        <AlertTriangle
                          className="mt-0.5 shrink-0 text-amber-700"
                          size={18}
                        />

                        <div>
                          <p className="font-black text-amber-950">
                            Equity value
                            cannot yet be
                            modeled
                          </p>

                          <p className="mt-1 text-sm leading-6 text-amber-900/80">
                            {equity.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </section>

        {/* =====================================================
            EQUITY METRICS
        ====================================================== */}

        <div className="mt-6">
          <ComparisonSection
            eyebrow="Equity detail"
            title="Grant economics"
            description="Compare the confirmed grant terms without assuming a future company valuation or exit price."
            icon={
              <Coins
                size={23}
              />
            }
            metrics={
              equityMetrics
            }
          />
        </div>

        {/* =====================================================
            TERMS
        ====================================================== */}

        <div className="mt-6">
          <ComparisonSection
            eyebrow="Risk & flexibility"
            title="Vesting and exercise terms"
            description="The value of equity depends not only on the grant size, but also on how quickly it vests and what happens when employment ends."
            icon={
              <ShieldAlert
                size={23}
              />
            }
            metrics={
              termsMetrics
            }
          />
        </div>

        {/* =====================================================
            KEY TAKEAWAYS
        ====================================================== */}

        <section className="oi-reveal oi-section-lift mt-6 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Sparkles
                size={23}
              />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Decision summary
              </p>

              <h2 className="mt-1 text-2xl font-black">
                What stands out
              </h2>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            <div className="oi-hover-lift rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <IndianRupee
                  className="text-slate-700"
                  size={20}
                />

                <p className="font-black">
                  Cash compensation
                </p>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {cashWinner ===
                "TIE"
                  ? "The confirmed cash terms are closely matched under the current scoring."
                  : `${winnerLabel(
                      cashWinner,
                      offerA,
                      offerB
                    )} currently leads on the confirmed cash-compensation comparison.`}

                {fixedDifference !==
                  null &&
                fixedDifference !==
                  0
                  ? ` The fixed-salary difference is ${money(
                      Math.abs(
                        fixedDifference
                      ),
                      offerA.currency
                    )} per year.`
                  : ""}
              </p>
            </div>

            <div className="oi-hover-lift rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <TrendingUp
                  className="text-violet-700"
                  size={20}
                />

                <p className="font-black">
                  Equity opportunity
                </p>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {equityWinner ===
                "UNKNOWN"
                  ? "Equity is not ranked yet because a material equity term is unknown or incomplete."
                  : equityWinner ===
                "TIE"
                  ? "The current equity comparison is closely matched."
                  : `${winnerLabel(
                      equityWinner,
                      offerA,
                      offerB
                    )} currently has the stronger reference equity signal.`}

                {equityDifference !==
                  null &&
                equityDifference !==
                  0
                  ? ` The difference in current reference intrinsic spread is ${money(
                      Math.abs(
                        equityDifference
                      ),
                      offerA.currency
                    )}.`
                  : ""}

                {" "}
                This amount should
                not be treated as
                guaranteed cash.
              </p>
            </div>

            <div className="oi-hover-lift rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <Clock3
                  className="text-slate-700"
                  size={20}
                />

                <p className="font-black">
                  Vesting &
                  flexibility
                </p>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {termsWinner ===
                "UNKNOWN"
                  ? "Vesting and exercise terms are not ranked until the material equity information is confirmed."
                  : termsWinner ===
                "TIE"
                  ? "The currently confirmed vesting and exercise terms are broadly similar."
                  : `${winnerLabel(
                      termsWinner,
                      offerA,
                      offerB
                    )} receives the stronger flexibility signal from the currently confirmed vesting, cliff, dilution and exercise-window terms.`}
              </p>
            </div>

            <div className="oi-hover-lift rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <FileText
                  className="text-slate-700"
                  size={20}
                />

                <p className="font-black">
                  Comparison
                  confidence
                </p>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Offer A has{" "}
                <strong>
                  {completenessA}%
                </strong>{" "}
                comparison-data
                completeness and
                Offer B has{" "}
                <strong>
                  {completenessB}%
                </strong>
                . Missing terms are
                left unknown rather
                than invented.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            WARNINGS
        ====================================================== */}

        {(warningsA.length >
          0 ||
          warningsB.length >
            0) ? (
          <section className="oi-reveal oi-section-lift mt-6 rounded-[30px] border border-amber-200 bg-amber-50 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle
                  size={23}
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Before deciding
                </p>

                <h2 className="mt-1 text-2xl font-black text-amber-950">
                  Information worth
                  confirming
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900/75">
                  These gaps do not
                  necessarily make an
                  offer bad. They
                  reduce how
                  confidently the
                  economics can be
                  compared.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[24px] bg-white/70 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Offer A •{" "}
                  {offerA.companyName ??
                    "Company"}
                </p>

                {warningsA.length >
                0 ? (
                  <div className="mt-4 space-y-3">
                    {warningsA.map(
                      (
                        warning,
                        index
                      ) => (
                        <div
                          key={`${warning}-${index}`}
                          className="flex gap-3"
                        >
                          <CircleAlert
                            className="mt-0.5 shrink-0 text-amber-600"
                            size={16}
                          />

                          <p className="text-sm leading-6 text-slate-600">
                            {warning}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-bold text-emerald-700">
                    No major
                    comparison gaps
                    detected.
                  </p>
                )}
              </div>

              <div className="rounded-[24px] bg-white/70 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Offer B •{" "}
                  {offerB.companyName ??
                    "Company"}
                </p>

                {warningsB.length >
                0 ? (
                  <div className="mt-4 space-y-3">
                    {warningsB.map(
                      (
                        warning,
                        index
                      ) => (
                        <div
                          key={`${warning}-${index}`}
                          className="flex gap-3"
                        >
                          <CircleAlert
                            className="mt-0.5 shrink-0 text-amber-600"
                            size={16}
                          />

                          <p className="text-sm leading-6 text-slate-600">
                            {warning}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-bold text-emerald-700">
                    No major
                    comparison gaps
                    detected.
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {/* =====================================================
            DISCLAIMER
        ====================================================== */}

        <section className="oi-reveal mt-6 rounded-[28px] bg-slate-950 p-6 text-white md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <Scale
                  className="text-violet-300"
                  size={21}
                />

                <h2 className="text-xl font-black">
                  Compare the
                  economics, then
                  consider the job.
                </h2>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Offer Intelligence
                compares the
                confirmed financial
                terms you reviewed.
                Equity values depend
                on future company
                performance,
                liquidity, taxes,
                vesting, dilution and
                exit conditions.
                This comparison is
                decision support, not
                a guarantee of future
                value or financial,
                tax or legal advice.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href={`/pro/offers/${encodeURIComponent(
                  offerA.id
                )}`}
                className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition duration-300 hover:-translate-x-1 hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
              >
                <ArrowLeft
                  className="transition-transform duration-300 group-hover:-translate-x-1.5"
                  size={16}
                />
                Offer A
              </Link>

              <Link
                href={`/pro/offers/${encodeURIComponent(
                  offerB.id
                )}`}
                className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white transition duration-300 hover:translate-x-1 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                Offer B
                <ArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                  size={16}
                />
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================
            DEVELOPMENT / DATA TRACE
        ====================================================== */}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] text-slate-400">
          <p>
            Offer A:{" "}
            {offerA.id}
          </p>

          <p>
            Offer B:{" "}
            {offerB.id}
          </p>
        </div>
      </div>
    </main>
  );
}

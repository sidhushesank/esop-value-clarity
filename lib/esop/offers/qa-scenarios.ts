/* ============================================================
   OFFER INTELLIGENCE — REAL-WORLD QA SCENARIOS

   These deterministic fixtures protect the safety promise of the
   comparison engine: unknown or incomplete equity never becomes ₹0,
   while confirmed cash can still be compared.
============================================================ */

import { compareOffers } from "./compare";
import type { CoreOfferComparisonResult } from "./compare";
import { createDefaultOffer, normalizeOfferInput } from "./normalize";
import type {
  OfferDecisionReadiness,
  OfferInput,
  OfferSide,
  OfferWinner,
} from "./types";

export type OfferQaScenario = {
  id: string;
  title: string;
  purpose: string;
  offerA: OfferInput;
  offerB: OfferInput;
  expected: {
    guaranteedCashWinner: OfferWinner;
    overallWinner?: OfferWinner;
    fullVerdictWithheld?: boolean;
    warningIncludes?: string;
  };
};

export type OfferQaScenarioResult = {
  scenario: OfferQaScenario;
  comparison: CoreOfferComparisonResult;
  passed: boolean;
  assertions: Array<{
    label: string;
    passed: boolean;
    actual: string;
    expected: string;
  }>;
};

const CASH_ONLY: OfferDecisionReadiness = {
  cashComparison: "READY",
  equityComparison: "NOT_APPLICABLE",
  overallDecision: "CASH_ONLY",
  missingCashFields: [],
  missingEquityFields: [],
  clarificationQuestions: [],
};

const EQUITY_READY: OfferDecisionReadiness = {
  cashComparison: "READY",
  equityComparison: "READY",
  overallDecision: "READY",
  missingCashFields: [],
  missingEquityFields: [],
  clarificationQuestions: [],
};

const EQUITY_UNKNOWN: OfferDecisionReadiness = {
  cashComparison: "READY",
  equityComparison: "UNKNOWN",
  overallDecision: "CASH_READY_EQUITY_INCOMPLETE",
  missingCashFields: [],
  missingEquityFields: ["Equity type"],
  clarificationQuestions: ["Does this offer include ESOPs, RSUs, stock, or no equity?"],
};

const EQUITY_INCOMPLETE: OfferDecisionReadiness = {
  cashComparison: "READY",
  equityComparison: "INCOMPLETE",
  overallDecision: "CASH_READY_EQUITY_INCOMPLETE",
  missingCashFields: [],
  missingEquityFields: ["Exercise price"],
  clarificationQuestions: ["What is the ESOP exercise/strike price per option?"],
};

function baseOffer(
  side: OfferSide,
  companyName: string,
  fixedSalary: number
): OfferInput {
  const offer = createDefaultOffer(side);

  return normalizeOfferInput({
    ...offer,
    id: `qa-${side}-${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    inputMode: "DOCUMENT",
    currency: "INR",
    employer: {
      ...offer.employer,
      companyName,
      roleTitle: "Software Engineer",
      location: "Bengaluru, India",
      employmentType: "FULL_TIME",
    },
    cash: { ...offer.cash, fixedSalary, headlineCTC: fixedSalary },
  }, side);
}

function cashOnlyOffer(side: OfferSide, company: string, salary: number): OfferInput {
  const offer = baseOffer(side, company, salary);
  return { ...offer, equity: { ...offer.equity, type: "NONE" }, decisionReadiness: CASH_ONLY };
}

function esopOffer(side: OfferSide, company: string, salary: number, ready = true): OfferInput {
  const offer = baseOffer(side, company, salary);
  return {
    ...offer,
    equity: {
      ...offer.equity,
      type: "ESOP",
      companyStatus: "UNLISTED",
      totalOptionsOrShares: 12000,
      exercisePrice: ready ? 20 : 0,
      currentFMV: 90,
      vestingDurationMonths: 48,
      cliffMonths: 12,
      vestingFrequency: "MONTHLY",
      expectedDilutionPercentage: 20,
    },
    decisionReadiness: ready ? EQUITY_READY : EQUITY_INCOMPLETE,
  };
}

function rsuOffer(side: OfferSide, company: string, salary: number): OfferInput {
  const offer = baseOffer(side, company, salary);
  return {
    ...offer,
    equity: {
      ...offer.equity,
      type: "RSU",
      companyStatus: "LISTED",
      totalOptionsOrShares: 1500,
      currentFMV: 500,
      vestingDurationMonths: 48,
      cliffMonths: 12,
      vestingFrequency: "MONTHLY",
    },
    decisionReadiness: EQUITY_READY,
  };
}

function unknownEquityOffer(side: OfferSide, company: string, salary: number): OfferInput {
  const offer = baseOffer(side, company, salary);
  return {
    ...offer,
    equity: { ...offer.equity, type: "UNKNOWN" },
    decisionReadiness: EQUITY_UNKNOWN,
  };
}

function withUnstatedVariableAndBonus(offer: OfferInput): OfferInput {
  return {
    ...offer,
    fields: [
      ...offer.fields,
      {
        key: "cash.targetVariablePay", label: "Target variable pay", extractedValue: null,
        confirmedValue: null, status: "NOT_FOUND", confidence: "UNKNOWN",
        sourceText: null, sourcePage: null, reviewedAt: null,
      },
      {
        key: "cash.joiningBonus", label: "Joining bonus", extractedValue: null,
        confirmedValue: null, status: "NOT_FOUND", confidence: "UNKNOWN",
        sourceText: null, sourcePage: null, reviewedAt: null,
      },
    ],
  };
}

export function getOfferQaScenarios(): OfferQaScenario[] {
  return [
    { id: "cash-only", title: "Cash-only versus cash-only", purpose: "A normal non-equity job must remain fully comparable.", offerA: cashOnlyOffer("A", "Cash A", 2400000), offerB: cashOnlyOffer("B", "Cash B", 2200000), expected: { guaranteedCashWinner: "A", overallWinner: "A" } },
    { id: "cash-v-esop", title: "Cash-only versus complete ESOP", purpose: "Cash and confirmed equity are compared without pretending they have the same certainty.", offerA: cashOnlyOffer("A", "Cash A", 2600000), offerB: esopOffer("B", "ESOP B", 2200000), expected: { guaranteedCashWinner: "A", fullVerdictWithheld: false } },
    { id: "unknown-equity", title: "Equity not stated", purpose: "An offer silent on equity must not be labelled as cash-only or ₹0 equity.", offerA: unknownEquityOffer("A", "Unknown A", 2500000), offerB: cashOnlyOffer("B", "Cash B", 2200000), expected: { guaranteedCashWinner: "A", overallWinner: "UNDETERMINED", fullVerdictWithheld: true } },
    { id: "missing-strike", title: "ESOP grant missing strike price", purpose: "Confirmed cash is useful, but a full recommendation is withheld until a material ESOP term is known.", offerA: esopOffer("A", "Incomplete A", 2300000, false), offerB: rsuOffer("B", "RSU B", 2200000), expected: { guaranteedCashWinner: "A", overallWinner: "UNDETERMINED", fullVerdictWithheld: true } },
    { id: "rsu-v-esop", title: "Complete RSU versus complete ESOP", purpose: "Two complete equity offers are eligible for a full, scenario-based comparison.", offerA: rsuOffer("A", "RSU A", 2400000), offerB: esopOffer("B", "ESOP B", 2300000), expected: { guaranteedCashWinner: "A", fullVerdictWithheld: false } },
    { id: "unstated-optional-cash", title: "Variable pay and joining bonus not stated", purpose: "Optional compensation is excluded and explained, never silently treated as guaranteed ₹0.", offerA: withUnstatedVariableAndBonus(cashOnlyOffer("A", "Cash A", 2450000)), offerB: cashOnlyOffer("B", "Cash B", 2300000), expected: { guaranteedCashWinner: "A", overallWinner: "A", warningIncludes: "Target variable pay is not stated" } },
  ];
}

export function runOfferQaScenarios(): OfferQaScenarioResult[] {
  return getOfferQaScenarios().map((scenario) => {
    const comparison = compareOffers(scenario.offerA, scenario.offerB);
    const cash = comparison.decisionMatrix.find((item) => item.category === "GUARANTEED_CASH");
    const assertions: OfferQaScenarioResult["assertions"] = [
      { label: "Guaranteed cash winner", passed: cash?.winner === scenario.expected.guaranteedCashWinner, actual: cash?.winner ?? "MISSING", expected: scenario.expected.guaranteedCashWinner },
    ];
    if (scenario.expected.overallWinner) assertions.push({ label: "Overall winner", passed: comparison.baseCaseWinner === scenario.expected.overallWinner, actual: comparison.baseCaseWinner, expected: scenario.expected.overallWinner });
    if (scenario.expected.fullVerdictWithheld !== undefined) assertions.push({ label: "Full verdict withheld", passed: (comparison.baseCaseWinner === "UNDETERMINED") === scenario.expected.fullVerdictWithheld, actual: String(comparison.baseCaseWinner === "UNDETERMINED"), expected: String(scenario.expected.fullVerdictWithheld) });
    if (scenario.expected.warningIncludes) assertions.push({ label: "Disclosure warning", passed: comparison.warnings.some((warning) => warning.includes(scenario.expected.warningIncludes as string)), actual: comparison.warnings.join(" | "), expected: scenario.expected.warningIncludes });
    return { scenario, comparison, assertions, passed: assertions.every((assertion) => assertion.passed) };
  });
}

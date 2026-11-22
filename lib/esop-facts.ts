/**
 * ONE source of truth for every ESOP tax/legal number EVC publishes.
 *
 * Why this file exists (AEO/GEO): AI engines and Google pull the same fact from
 * several of your pages. Today /blog/esop-exercise-cost and
 * /blog/esop-tax-deferral-startups say "48 months" while /blog/esop-taxation-india
 * says "60 months for allotments from 1 April 2026". Contradictions make an
 * engine pick someone else's page as the safer citation.
 *
 * Rule: no page hard-codes these numbers. Import from here.
 * When a CA confirms a line against the bare Act, flip status to "ca-verified"
 * and fill reviewedBy.
 */

export type FactStatus = "practitioner-consensus" | "ca-verified";

export interface EsopFact {
  id: string;
  /** Short, quotable sentence. Written to be lifted verbatim by an answer engine. */
  statement: string;
  status: FactStatus;
  reviewedBy?: string; // e.g. "CA Firstname Lastname, ICAI M.No. xxxxx"
  lastReviewed: string; // ISO date
  sources: { title: string; url: string }[];
}

export const FACTS_LAST_REVIEWED = "2026-11-22";

export const ESOP_FACTS = {
  twoStageTax: {
    id: "two-stage-tax",
    statement:
      "ESOPs in India are taxed twice: as a salary perquisite when you exercise (FMV on the exercise date minus exercise price, at your slab rate), and as capital gains when you sell (sale price minus that FMV).",
    status: "practitioner-consensus",
    lastReviewed: FACTS_LAST_REVIEWED,
    sources: [
      { title: "Income Tax Department: Taxation of ESOP", url: "https://www.incometaxindia.gov.in/w/taxation-of-employee-stock-option-plan-esop-" },
    ],
  },
  perquisiteSection: {
    id: "perquisite-section",
    statement:
      "Under the Income-tax Act, 2025 (in force from 1 April 2026) the ESOP perquisite sits in section 17(1)(d) read with section 17(5)(h), replacing section 17(2)(vi) of the 1961 Act. Salary TDS moved from section 192 to section 392.",
    status: "practitioner-consensus",
    lastReviewed: FACTS_LAST_REVIEWED,
    sources: [
      { title: "TaxSocial: ESOP taxation under the Income-tax Act, 2025", url: "https://taxsocial.pro/article/esop-taxation-two-stage-perquisite-capital-gains-income-tax-act-2025" },
      { title: "Treelife: ESOP scheme design and startup tax", url: "https://treelife.in/taxation/esop-scheme-design-in-indian-startup-tax/" },
    ],
  },
  startupDeferral: {
    id: "startup-deferral",
    statement:
      "Employees of eligible startups (DPIIT-recognised and holding the Inter-Ministerial Board certificate, section 140 of the 2025 Act, formerly 80-IAC) can defer perquisite tax. For shares allotted on or after 1 April 2026 the window is 60 months from the end of the tax year of allotment (section 392(3) read with 289(3)); for earlier allotments it is 48 months (section 192(1C) of the 1961 Act). Tax falls due earlier if you sell the shares or leave the company.",
    status: "practitioner-consensus",
    lastReviewed: FACTS_LAST_REVIEWED,
    sources: [
      { title: "Treelife: section 392(3) r/w 289(3), 60-month window", url: "https://treelife.in/taxation/esop-scheme-design-in-indian-startup-tax/" },
      { title: "TaxSocial: eligible-startup deferral under the 2025 Act", url: "https://taxsocial.pro/article/esop-taxation-two-stage-perquisite-capital-gains-income-tax-act-2025" },
      { title: "Income Tax Department ESOP page (still describes the 1961-Act 48-month rule)", url: "https://www.incometaxindia.gov.in/w/taxation-of-employee-stock-option-plan-esop-" },
    ],
  },
  deferralNarrow: {
    id: "deferral-narrow",
    statement:
      "DPIIT recognition alone is not enough for the deferral. Only about 4,000 of the more than two lakh DPIIT-registered startups hold the certificate that unlocks it.",
    status: "practitioner-consensus",
    lastReviewed: FACTS_LAST_REVIEWED,
    sources: [
      { title: "Analytics India Magazine: Govt mulls ESOP tax relief", url: "https://analyticsindiamag.com/ai-startups/govt-mulls-esop-tax-relief-but-liquidity-risks-still-haunt-startup-employees" },
    ],
  },
  capitalGainsUnlisted: {
    id: "cg-unlisted",
    statement:
      "For unlisted shares held more than 24 months after exercise, long-term capital gains are taxed at 12.5%. Held 24 months or less, the gain is short-term and taxed at your slab rate.",
    status: "practitioner-consensus",
    lastReviewed: FACTS_LAST_REVIEWED,
    sources: [
      { title: "Treelife: ESOP taxation in India", url: "https://treelife.in/taxation/esop-scheme-design-in-indian-startup-tax/" },
    ],
  },
  minimumVesting: {
    id: "min-vesting",
    statement:
      "Indian unlisted companies must keep at least one year between grant and vesting of ESOPs (Companies (Share Capital and Debentures) Rules, 2014, rule 12(6)(a)).",
    status: "practitioner-consensus",
    lastReviewed: FACTS_LAST_REVIEWED,
    sources: [],
  },
  cess: {
    id: "cess",
    statement: "A 4% health and education cess applies on top of tax plus surcharge.",
    status: "practitioner-consensus",
    lastReviewed: FACTS_LAST_REVIEWED,
    sources: [],
  },
} satisfies Record<string, EsopFact>;

/** Numbers for calculators, so tools and articles never disagree. */
export const ESOP_NUMBERS = {
  deferralMonthsNewAct: 60, // allotments on/after 2026-04-01
  deferralMonthsOldAct: 48, // allotments before 2026-04-01
  newActEffective: "2026-04-01",
  ltcgRateUnlisted: 0.125,
  ltcgHoldingMonthsUnlisted: 24,
  cessRate: 0.04,
  minVestingMonths: 12,
} as const;

export function deferralMonthsFor(allotmentDateISO: string): number {
  return allotmentDateISO >= ESOP_NUMBERS.newActEffective
    ? ESOP_NUMBERS.deferralMonthsNewAct
    : ESOP_NUMBERS.deferralMonthsOldAct;
}

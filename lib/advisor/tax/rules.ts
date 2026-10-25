/**
 * Rule library for the Tax-Event Ledger.
 *
 * Every figure the ledger produces cites the codes below, together with the
 * verification flag read from the database (the founder is the only person
 * who can mark a rule verified). Until a rule is verified, the figure that
 * rests on it is shown as an ESTIMATE to be confirmed.
 *
 * Sources checked on 25 Oct 2026: the Income Tax Department's ESOP page
 * (provisions of the Income-tax Act 1961 as amended by the Finance Act 2026)
 * and several secondary sources on the Income-tax Act 2025. The secondary
 * sources disagree in places; each disagreement is recorded in `note`.
 */

export const TAX_RULE_SET_VERSION = "2026-10-25.1";

export type TaxRuleSeed = {
  code: string;
  title: string;
  source: string;
  note: string;
  /** Who should act on a finding that rests on this rule. */
  owner: string;
};

export const TAX_RULE_SEEDS: TaxRuleSeed[] = [
  {
    code: "TAX_PERQ_VALUE",
    title: "Perquisite on exercise",
    source: "Income-tax Act 1961 s.17(2)(vi); carried forward in the Income-tax Act 2025",
    note:
      "Perquisite = (FMV on the exercise date - exercise price) x shares, taxed as salary in the year the shares are allotted. The CBDT page says the value on the allotment date is not relevant.",
    owner: "Advisory firm",
  },
  {
    code: "TAX_FMV_UNLISTED",
    title: "FMV of unlisted shares for the perquisite",
    source: "Income-tax Rules 1962 Rule 3 (Rule 15 of the Rules 2026 per one source)",
    note:
      "FMV is the value determined by a SEBI-registered Category I merchant banker as on the exercise date, or on an earlier date not more than 180 days before the exercise. The rule number under the 2026 Rules is not confirmed.",
    owner: "Merchant banker / Valuer",
  },
  {
    code: "TAX_SLABS",
    title: "Slab rates, rebate, surcharge and cess",
    source: "Income-tax Act 1961 First Schedule / Finance Acts; Income-tax Act 2025",
    note:
      "New-regime slabs of FY 2025-26 are unchanged for FY 2026-27 (secondary sources). One source lists a 5% surcharge for Rs.50 lakh to Rs.1 crore; the figure used here is 10%. Surcharge marginal relief and special-rate income are not modelled.",
    owner: "Advisory firm",
  },
  {
    code: "TAX_PAS3",
    title: "Return of allotment (PAS-3)",
    source: "Companies Act 2013 s.39(4) and Companies (Prospectus and Allotment of Securities) Rules 2014 Rule 12",
    note: "Form PAS-3 is filed with the Registrar within 30 days of each allotment of shares on exercise.",
    owner: "Company Secretary",
  },
  {
    code: "TAX_TDS_SALARY",
    title: "TDS on the perquisite",
    source: "Income-tax Act 1961 s.192; Income-tax Act 2025 s.392",
    note:
      "The employer deducts tax on the estimated annual income including the perquisite. The ledger estimates the extra tax caused by the perquisite and rounds it to the nearest Rs.10 (s.288B). Actual TDS depends on payroll, prior deductions and the employee's declarations.",
    owner: "Advisory firm",
  },
  {
    code: "TAX_TDS_DEPOSIT",
    title: "TDS deposit date",
    source: "Income-tax Rules (deposit of TDS by non-government deductors)",
    note: "7th of the month after the deduction; March deductions by 30 April.",
    owner: "Company Secretary",
  },
  {
    code: "TAX_RETURN_QUARTERLY",
    title: "Quarterly TDS return on salary",
    source: "Form 24Q; Form 138 under the Income-tax Act 2025 (one source lists Forms 140 / 143, so the number needs checking)",
    note:
      "Due 31 Jul (Q1), 31 Oct (Q2), 31 Jan (Q3) and 31 May (Q4). The Q4 return carries the salary breakup annexure.",
    owner: "Company Secretary",
  },
  {
    code: "TAX_FORM16",
    title: "Form 16 and the perquisite statement",
    source: "Form 16 / Form 12BA; Form 130 under the Income-tax Act 2025 (to be checked)",
    note: "Form 16 is due by 15 June after the financial year ends.",
    owner: "Company Secretary",
  },
  {
    code: "TAX_DEFERRAL",
    title: "Startup deferral of TDS on ESOP perquisite",
    source: "Income-tax Act 1961 s.80-IAC and s.192(1C); Income-tax Act 2025 s.140 and s.392(3)",
    note:
      "Eligible start-ups (DPIIT recognised and certified by the Inter-Ministerial Board) deduct tax within 14 days of the earliest of: the end of the window, the employee selling the shares, the employee ceasing to be an employee. Tax is computed at the rates in force for the year of allotment. Other eligibility conditions (incorporation date, turnover, no restructuring) are not computed.",
    owner: "Advisory firm",
  },
  {
    code: "TAX_DEFERRAL_WINDOW",
    title: "Deferral window length",
    source: "48 months from the end of the assessment year of allotment (1961 Act); 60 months from the end of the tax year (2025 Act, per project notes)",
    note:
      "The two descriptions give the same date, because the assessment year ends 12 months after the financial year: 31 March, five years after the financial year of allotment. Whether the 2025 Act kept this window is not confirmed.",
    owner: "Advisory firm",
  },
  {
    code: "TAX_CG_UNLISTED",
    title: "Capital gains on unlisted shares",
    source: "Income-tax Act 1961 s.112 and s.2(42A); Income-tax Act 2025",
    note:
      "Long term if held for more than 24 months from the allotment date: 12.5% with no indexation. Short term is taxed at slab rates. The cost of acquisition is the FMV on the exercise date. Surcharge on capital gains is not modelled; cess of 4% is added.",
    owner: "Advisory firm",
  },
  {
    code: "TAX_BUYBACK_2026",
    title: "Buyback of shares from 1 April 2026",
    source: "Income-tax Act 2025 (Finance Act 2026 amendments to s.69 and s.2(40)(f))",
    note:
      "From 1 April 2026 buyback proceeds are taxed as capital gains in the shareholder's hands. Promoters pay an additional tax; the secondary sources disagree on its rate, so it is not computed. Buybacks from 1 Oct 2024 to 31 Mar 2026 fall under the earlier deemed-dividend rules and are not modelled.",
    owner: "Advisory firm",
  },
];

export const TAX_RULE_CODES = TAX_RULE_SEEDS.map((r) => r.code);

export function taxRule(code: string): TaxRuleSeed | undefined {
  return TAX_RULE_SEEDS.find((r) => r.code === code);
}

/* ------------------------------------------------------------------ */
/* Numeric parameters (all part of the rule set above)                 */
/* ------------------------------------------------------------------ */

export const FMV_MAX_AGE_DAYS = 180;
export const PAS3_DAYS = 30;
export const DEFERRAL_TDS_DAYS = 14;
export const DEFERRAL_WINDOW_YEARS_AFTER_FY_END = 5;
export const LTCG_UNLISTED_MONTHS = 24;
export const LTCG_RATE = 0.125;
export const CESS_RATE = 0.04;
export const TDS_ROUND_TO = 10;

/** The date the Income-tax Act 2025 and the new buyback treatment start. */
export const NEW_ACT_START = new Date(Date.UTC(2026, 3, 1));

export const REMINDER_OFFSETS_DAYS = [30, 7, 1, 0] as const;
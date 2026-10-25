import type { FindingSeverity } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type RuleSeed = {
  code: string;
  title: string;
  source: string;
  taxYear: string | null;
  severityVerified: FindingSeverity;
  severityUnverified: FindingSeverity;
  notes: string;
};

export const RULE_SEEDS: RuleSeed[] = [
  {
    code: "APPROVAL_NO_SHAREHOLDER_RESOLUTION",
    title: "No shareholder resolution on record for the ESOP scheme",
    source: "Companies Act 2013 s.62(1)(b) read with Rule 12, Companies (Share Capital and Debentures) Rules 2014",
    taxYear: null,
    severityVerified: "RED",
    severityUnverified: "AMBER",
    notes: "Verify against the Act and Rules text.",
  },
  {
    code: "APPROVAL_GRANT_BEFORE_APPROVAL",
    title: "Options granted before the shareholder approval date",
    source: "Companies Act 2013 s.62(1)(b); Rule 12",
    taxYear: null,
    severityVerified: "RED",
    severityUnverified: "AMBER",
    notes: "Grants should follow shareholder approval of the scheme.",
  },
  {
    code: "APPROVAL_PRIVATE_VOTE_TYPE",
    title: "Private company approved the scheme by ordinary resolution",
    source: "MCA private-company exemption notification vs Rule 12(1) (special resolution)",
    taxYear: null,
    severityVerified: "AMBER",
    severityUnverified: "AMBER",
    notes: "UNRECONCILED: sources conflict on whether an ordinary resolution suffices for private companies. Never shown as RED until checked against the notification text.",
  },
  {
    code: "APPROVAL_MGT14",
    title: "MGT-14 not filed, or filed more than 30 days after the resolution",
    source: "Companies Act 2013 s.117",
    taxYear: null,
    severityVerified: "RED",
    severityUnverified: "AMBER",
    notes: "Verify the 30-day period and which resolutions need MGT-14.",
  },
  {
    code: "APPROVAL_EXPLANATORY_STATEMENT",
    title: "Rule 12 explanatory statement not confirmed on file",
    source: "Rule 12(3), Companies (Share Capital and Debentures) Rules 2014",
    taxYear: null,
    severityVerified: "AMBER",
    severityUnverified: "AMBER",
    notes: "Manual confirmation item.",
  },
  {
    code: "GRANT_INCOMPLETE",
    title: "Grant record is missing key terms",
    source: "Rule 12 scheme disclosures; good practice",
    taxYear: null,
    severityVerified: "AMBER",
    severityUnverified: "AMBER",
    notes: "Vesting, cliff, expiry and post-exit exercise window should be recorded.",
  },
  {
    code: "POOL_EXCEEDED",
    title: "Options granted exceed the approved pool",
    source: "Shareholder-approved scheme limits",
    taxYear: null,
    severityVerified: "RED",
    severityUnverified: "RED",
    notes: "Compares granted options (net of lapses) with the approved pool size entered for the client.",
  },
  {
    code: "FMV_MISSING",
    title: "No valuation report on or before the exercise date",
    source: "Income-tax Rules (Rule 3 of 1962 Rules; Rule 15 of Rules 2026)",
    taxYear: "FY 2026-27",
    severityVerified: "RED",
    severityUnverified: "AMBER",
    notes: "Verify rule numbering between the 1962 Rules and the 2026 Rules.",
  },
  {
    code: "FMV_STALE",
    title: "Valuation report older than 180 days at exercise",
    source: "Income-tax Rules (Rule 3 of 1962 Rules; Rule 15 of Rules 2026)",
    taxYear: "FY 2026-27",
    severityVerified: "RED",
    severityUnverified: "AMBER",
    notes: "Verify the 180-day limit and how it is counted.",
  },
  {
    code: "FMV_SIGNATORY",
    title: "Valuation not marked as signed by a SEBI-registered Category I merchant banker",
    source: "Income-tax Rules (valuation of unlisted shares for ESOP perquisite)",
    taxYear: "FY 2026-27",
    severityVerified: "RED",
    severityUnverified: "AMBER",
    notes: "A CA valuation is reported as not acceptable for this purpose. Verify.",
  },
  {
    code: "PAS3_MISSING",
    title: "Allotment recorded without a PAS-3 filing date",
    source: "Companies Act 2013 s.39 read with Rule 12, Companies (Prospectus and Allotment of Securities) Rules 2014",
    taxYear: null,
    severityVerified: "RED",
    severityUnverified: "AMBER",
    notes: "Verify the form, rule and filing period.",
  },
  {
    code: "PAS3_LATE",
    title: "PAS-3 filed more than 30 days after the allotment date",
    source: "Companies Act 2013 s.39; Rule 12 (Prospectus and Allotment Rules 2014)",
    taxYear: null,
    severityVerified: "RED",
    severityUnverified: "AMBER",
    notes: "One secondary source says 15 days; most say 30. Verify against the Rules text.",
  },
  {
    code: "PAS3_NO_ALLOTMENT_DATE",
    title: "Exercise recorded without a board allotment date",
    source: "PAS-3 clock runs from the board allotment date",
    taxYear: null,
    severityVerified: "AMBER",
    severityUnverified: "AMBER",
    notes: "Needed to measure the PAS-3 clock correctly.",
  },
  {
    code: "SH6_CONSISTENCY",
    title: "Register and cap table do not agree on ESOP shares",
    source: "Rule 12(9): Register of Employee Stock Options (Form SH-6)",
    taxYear: null,
    severityVerified: "AMBER",
    severityUnverified: "AMBER",
    notes: "Compares exercised options with the ESOP holder rows in the cap table.",
  },
  {
    code: "DEFERRAL_ELIGIBILITY",
    title: "Startup TDS deferral eligibility checklist",
    source: "Section 80-IAC and 192(1C) (1961 Act); sections 140 and 392(3) (2025 Act)",
    taxYear: "FY 2026-27",
    severityVerified: "AMBER",
    severityUnverified: "AMBER",
    notes: "Conditions, turnover limit and window (48 vs 60 months) all need verification.",
  },
  {
    code: "FEMA_OVERSEAS_PARENT",
    title: "Overseas parent: FEMA reporting to be confirmed",
    source: "FEMA overseas investment / ESOP rules",
    taxYear: null,
    severityVerified: "AMBER",
    severityUnverified: "AMBER",
    notes: "Manual attestation. Not computed.",
  },
  {
    code: "EXPIRY_RADAR",
    title: "Grant expiring within 12 months",
    source: "Grant terms (register)",
    taxYear: null,
    severityVerified: "AMBER",
    severityUnverified: "AMBER",
    notes: "Planning flag, not a legal rule.",
  },
  {
    code: "LEAVER_WINDOW",
    title: "Leaver still inside the post-exit exercise window",
    source: "Grant terms (register)",
    taxYear: null,
    severityVerified: "AMBER",
    severityUnverified: "AMBER",
    notes: "Planning flag, not a legal rule.",
  },
  {
    code: "CONTRADICTION",
    title: "Register and grant letter disagree",
    source: "Register vs grant letter",
    taxYear: null,
    severityVerified: "RED",
    severityUnverified: "RED",
    notes: "Only possible when grant-letter values have been entered.",
  },
    {
    code: "APPROVAL_PUBLIC_VOTE_TYPE",
    title: "Unlisted public company approved the scheme by ordinary resolution",
    source: "Companies Act 2013 s.62(1)(b); Rule 12(1) (special resolution)",
    taxYear: null,
    severityVerified: "RED",
    severityUnverified: "AMBER",
    notes: "Public companies have no private-company exemption. Verify against Rule 12.",
  },
];

/**
 * Insert any missing rules and refresh descriptive text.
 * NEVER touches `verified` or the severity columns of an existing row,
 * so a verification decision made in the database survives deploys.
 */
export async function syncRules() {
  for (const seed of RULE_SEEDS) {
    await prisma.ruleDefinition.upsert({
      where: { code: seed.code },
      create: {
        code: seed.code,
        title: seed.title,
        source: seed.source,
        taxYear: seed.taxYear,
        verified: false,
        severityVerified: seed.severityVerified,
        severityUnverified: seed.severityUnverified,
        notes: seed.notes,
      },
      update: {
        title: seed.title,
        source: seed.source,
        taxYear: seed.taxYear,
      },
    });
  }

  return prisma.ruleDefinition.findMany({ orderBy: { code: "asc" } });
}
/**
 * ============================================================================
 * INDIA TAX RESIDENCY FOR INDIVIDUALS (pure functions)
 * ============================================================================
 * Section 6 of the Income-tax Act 1961, carried into the Income-tax Act 2025
 * from tax year 2026-27 (verify section numbers):
 *
 * Resident if, in the financial (tax) year:
 *   (a) in India 182 days or more, or
 *   (b) in India 60 days or more AND 365 days or more in the 4 preceding years.
 *   For (b), 60 becomes 182 for an Indian citizen who leaves India that year
 *   for employment abroad, and for an Indian citizen / person of Indian origin
 *   visiting India; for the visitor it is 120 days if Indian income (excluding
 *   foreign sources) is above Rs 15 lakh.
 * Deemed resident: an Indian citizen with Indian income above Rs 15 lakh who
 *   is not liable to tax in any other country (always RNOR).
 * Not ordinarily resident (RNOR): a resident who was non-resident in 9 of the
 *   10 preceding years, or in India 729 days or less in the 7 preceding years,
 *   or a visitor who is resident only through the 120-day rule, or a deemed
 *   resident.
 * ============================================================================
 */

export type ResidencyStatus = "RESIDENT" | "RNOR" | "NON_RESIDENT";

export const RESIDENCY_LABEL: Record<ResidencyStatus, string> = {
  RESIDENT: "Resident (ROR)",
  RNOR: "Resident but not ordinarily resident (RNOR)",
  NON_RESIDENT: "Non-resident (NRI)",
};

export type Situation = "NORMAL" | "LEFT_FOR_EMPLOYMENT" | "VISITING";

export type ResidencyInput = {
  daysThisYear: number;
  /** Indian citizen, person of Indian origin (incl. OCI), or neither. */
  nationality: "CITIZEN" | "PIO" | "OTHER";
  situation: Situation;
  /** Indian income (excluding income from foreign sources) above Rs 15 lakh. */
  indianIncomeOver15L: boolean;
  /** Liable to tax in another country by domicile or residence. */
  taxedAbroad: boolean;
  daysPrev4Years: number;
  daysPrev7Years: number;
  nonResidentYearsOfLast10: number;
};

export type ResidencyResult = { status: ResidencyStatus; reasons: string[] };

const n = (v: number) => (Number.isFinite(v) ? Math.max(0, v) : 0);

export function determineResidency(input: ResidencyInput): ResidencyResult {
  const days = n(input.daysThisYear);
  const days4 = n(input.daysPrev4Years);
  const days7 = n(input.daysPrev7Years);
  const nr10 = n(input.nonResidentYearsOfLast10);
  const reasons: string[] = [];
  const citizen = input.nationality === "CITIZEN";
  const citizenOrPio = citizen || input.nationality === "PIO";

  let resident = false;
  let viaVisitor120 = false;

  if (days >= 182) {
    resident = true;
    reasons.push(`${days} days in India this year: 182 days or more makes you resident.`);
  } else {
    let threshold = 60;
    if (citizen && input.situation === "LEFT_FOR_EMPLOYMENT") {
      threshold = 182;
      reasons.push("You left India for a job abroad this year, so the 60-day test doesn't apply (only 182 days counts).");
    } else if (citizenOrPio && input.situation === "VISITING") {
      threshold = input.indianIncomeOver15L ? 120 : 182;
      reasons.push(
        input.indianIncomeOver15L
          ? "You live abroad and were visiting, with Indian income above Rs 15 lakh: the second test uses 120 days instead of 60."
          : "You live abroad and were visiting, with Indian income up to Rs 15 lakh: only 182 days counts."
      );
    }
    if (threshold < 182 && days >= threshold && days4 >= 365) {
      resident = true;
      viaVisitor120 = threshold === 120;
      reasons.push(`${days} days this year (${threshold}+) and ${days4} days in the 4 years before (365+) makes you resident.`);
    } else if (threshold < 182) {
      reasons.push(`${days} days this year and ${days4} days in the 4 years before don't meet the ${threshold}-day + 365-day test.`);
    }
  }

  if (!resident) {
    if (citizen && input.indianIncomeOver15L && !input.taxedAbroad) {
      reasons.push("As an Indian citizen with Indian income above Rs 15 lakh who isn't taxed in any other country, you are a deemed resident, treated as RNOR. (Applies to citizens only.)");
      return { status: "RNOR", reasons };
    }
    reasons.push("So you are a non-resident for this year.");
    return { status: "NON_RESIDENT", reasons };
  }

  if (viaVisitor120) {
    reasons.push("Resident only through the 120-day rule, so you are RNOR.");
    return { status: "RNOR", reasons };
  }
  if (nr10 >= 9) {
    reasons.push(`Non-resident in ${nr10} of the last 10 years (9 or more), so you are RNOR.`);
    return { status: "RNOR", reasons };
  }
  if (days7 <= 729) {
    reasons.push(`Only ${days7} days in India in the last 7 years (729 or fewer), so you are RNOR.`);
    return { status: "RNOR", reasons };
  }
  reasons.push("You don't meet any RNOR test, so you are an ordinary resident (ROR).");
  return { status: "RESIDENT", reasons };
}

/** Share of the vesting period (grant to vest / exercise) worked in India, 0-100. */
export function indiaWorkSharePercent(totalDays: number, daysWorkedOutsideIndia: number) {
  const total = n(totalDays);
  if (total <= 0) return 100;
  const outside = Math.min(n(daysWorkedOutsideIndia), total);
  return Math.round(((total - outside) / total) * 10000) / 100;
}

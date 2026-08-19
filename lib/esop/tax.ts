export type TaxRegime = "NEW" | "OLD";

export type EquityType = "UNLISTED" | "LISTED";

export type AdvancedTaxInput = {
  vestedShares: number;
  strikePrice: number;
  exerciseFMV: number;

  salePrice: number;

  otherAnnualIncome: number;

  holdingPeriodMonths: number;

  equityType: EquityType;

  taxRegime: TaxRegime;
};

export type AdvancedTaxResult = {
  vestedShares: number;

  exerciseCost: number;

  perquisitePerShare: number;
  taxablePerquisite: number;

  estimatedIncomeTax: number;
  incomeTaxRate: number;

  saleValue: number;

  capitalGain: number;
  capitalGainsTax: number;

  totalEstimatedTax: number;

  netTakeHome: number;

  effectiveTaxRate: number;

  isLongTerm: boolean;

  holdingPeriodThresholdMonths: number;

  status:
    | "high-value"
    | "positive"
    | "low-tax"
    | "underwater";

  assumptions: string[];
};

/* ============================================================
   SAFE HELPERS
============================================================ */

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function positiveNumber(value: number) {
  return Math.max(safeNumber(value), 0);
}

/* ============================================================
   NEW TAX REGIME
   AY 2026-27
============================================================ */

function calculateNewRegimeTax(income: number) {
  const taxableIncome = positiveNumber(income);

  let tax = 0;

  if (taxableIncome <= 400_000) {
    tax = 0;
  } else if (taxableIncome <= 800_000) {
    tax = (taxableIncome - 400_000) * 0.05;
  } else if (taxableIncome <= 1_200_000) {
    tax =
      20_000 +
      (taxableIncome - 800_000) * 0.10;
  } else if (taxableIncome <= 1_600_000) {
    tax =
      60_000 +
      (taxableIncome - 1_200_000) * 0.15;
  } else if (taxableIncome <= 2_000_000) {
    tax =
      120_000 +
      (taxableIncome - 1_600_000) * 0.20;
  } else if (taxableIncome <= 2_400_000) {
    tax =
      200_000 +
      (taxableIncome - 2_000_000) * 0.25;
  } else {
    tax =
      300_000 +
      (taxableIncome - 2_400_000) * 0.30;
  }

  /*
   * Section 87A rebate.
   *
   * This simplified estimator applies the rebate when
   * total normal income is <= ₹12 lakh.
   */

  if (taxableIncome <= 1_200_000) {
    tax = Math.max(tax - 60_000, 0);
  }

  /*
   * Health & Education Cess = 4%
   */

  return tax * 1.04;
}

/* ============================================================
   OLD TAX REGIME
============================================================ */

function calculateOldRegimeTax(income: number) {
  const taxableIncome = positiveNumber(income);

  let tax = 0;

  if (taxableIncome <= 250_000) {
    tax = 0;
  } else if (taxableIncome <= 500_000) {
    tax = (taxableIncome - 250_000) * 0.05;
  } else if (taxableIncome <= 1_000_000) {
    tax =
      12_500 +
      (taxableIncome - 500_000) * 0.20;
  } else {
    tax =
      112_500 +
      (taxableIncome - 1_000_000) * 0.30;
  }

  /*
   * Basic 87A rebate treatment for lower income.
   */

  if (taxableIncome <= 500_000) {
    tax = Math.max(tax - 12_500, 0);
  }

  return tax * 1.04;
}

/* ============================================================
   NORMAL INCOME TAX
============================================================ */

function calculateIncomeTax(
  income: number,
  regime: TaxRegime
) {
  if (regime === "OLD") {
    return calculateOldRegimeTax(income);
  }

  return calculateNewRegimeTax(income);
}

/* ============================================================
   CAPITAL GAINS
============================================================ */

function calculateCapitalGainsTax(
  capitalGain: number,
  equityType: EquityType,
  isLongTerm: boolean
) {
  const gain = positiveNumber(capitalGain);

  if (gain <= 0) {
    return 0;
  }

  /*
   * For this first version:
   *
   * Listed + long-term:
   * 12.5% LTCG rate.
   *
   * Unlisted + long-term:
   * 12.5% under section 112.
   *
   * Short-term gains that do not qualify for
   * section 111A are intentionally modeled using
   * the user's normal marginal tax rate in the
   * main calculation rather than pretending every
   * ESOP sale qualifies for the 20% STCG special rate.
   */

  if (isLongTerm) {
    return gain * 0.125 * 1.04;
  }

  /*
   * For short-term gains, caller supplies the
   * normal income-tax treatment.
   */

  return 0;
}

/* ============================================================
   MAIN CALCULATION
============================================================ */

export function calculateAdvancedTax(
  input: AdvancedTaxInput
): AdvancedTaxResult {
  const vestedShares =
    positiveNumber(input.vestedShares);

  const strikePrice =
    positiveNumber(input.strikePrice);

  const exerciseFMV =
    positiveNumber(input.exerciseFMV);

  const salePrice =
    positiveNumber(input.salePrice);

  const otherAnnualIncome =
    positiveNumber(input.otherAnnualIncome);

  const holdingPeriodMonths =
    positiveNumber(input.holdingPeriodMonths);

  const equityType =
    input.equityType;

  const taxRegime =
    input.taxRegime;

  /* ==========================================================
     EXERCISE
  ========================================================== */

  const exerciseCost =
    vestedShares * strikePrice;

  /*
   * Perquisite is generally based on FMV minus
   * amount paid by the employee at exercise.
   */

  const perquisitePerShare =
    Math.max(
      exerciseFMV - strikePrice,
      0
    );

  const taxablePerquisite =
    vestedShares *
    perquisitePerShare;

  /* ==========================================================
     INCOME TAX
  ========================================================== */

  const incomeBeforeESOP =
    otherAnnualIncome;

  const incomeAfterESOP =
    otherAnnualIncome +
    taxablePerquisite;

  const taxBeforeESOP =
    calculateIncomeTax(
      incomeBeforeESOP,
      taxRegime
    );

  const taxAfterESOP =
    calculateIncomeTax(
      incomeAfterESOP,
      taxRegime
    );

  /*
   * We attribute only the incremental tax
   * caused by the ESOP perquisite.
   */

  const estimatedIncomeTax =
    Math.max(
      taxAfterESOP - taxBeforeESOP,
      0
    );

  /*
   * Approximate marginal rate for display.
   */

  const incomeTaxRate =
    taxablePerquisite > 0
      ? Math.min(
          (estimatedIncomeTax /
            taxablePerquisite) *
            100,
          30
        )
      : 0;

  /* ==========================================================
     SALE
  ========================================================== */

  const saleValue =
    vestedShares * salePrice;

  /*
   * For capital gains, the exercise FMV is used
   * as the simplified cost basis.
   */

  const capitalGain =
    Math.max(
      saleValue -
        vestedShares * exerciseFMV,
      0
    );

  /*
   * Current Indian rules treat unlisted shares
   * as long-term after 24 months.
   *
   * Listed shares generally have a shorter
   * holding-period threshold.
   */

  const holdingPeriodThresholdMonths =
    equityType === "UNLISTED"
      ? 24
      : 12;

  const isLongTerm =
    holdingPeriodMonths >=
    holdingPeriodThresholdMonths;

  let capitalGainsTax = 0;

  if (isLongTerm) {
    capitalGainsTax =
      calculateCapitalGainsTax(
        capitalGain,
        equityType,
        true
      );
  } else {
    /*
     * Short-term gains outside the special
     * section 111A category are modeled using
     * the incremental normal-rate tax.
     */

    const incomeWithGain =
      otherAnnualIncome +
      taxablePerquisite +
      capitalGain;

    const taxWithGain =
      calculateIncomeTax(
        incomeWithGain,
        taxRegime
      );

    const taxWithoutGain =
      calculateIncomeTax(
        otherAnnualIncome +
          taxablePerquisite,
        taxRegime
      );

    capitalGainsTax =
      Math.max(
        taxWithGain - taxWithoutGain,
        0
      );
  }

  /* ==========================================================
     TOTAL TAX
  ========================================================== */

  const totalEstimatedTax =
    estimatedIncomeTax +
    capitalGainsTax;

  /*
   * Net take-home after:
   *
   * Sale proceeds
   * - exercise cost
   * - estimated taxes
   */

  const netTakeHome =
    Math.max(
      saleValue -
        exerciseCost -
        totalEstimatedTax,
      0
    );

  const effectiveTaxRate =
    saleValue > 0
      ? (totalEstimatedTax /
          saleValue) *
        100
      : 0;

  /* ==========================================================
     STATUS
  ========================================================== */

  let status:
    | "high-value"
    | "positive"
    | "low-tax"
    | "underwater";

  if (
    exerciseFMV <
    strikePrice
  ) {
    status = "underwater";
  } else if (
    netTakeHome >
    exerciseCost * 5
  ) {
    status = "high-value";
  } else if (
    netTakeHome >
    exerciseCost
  ) {
    status = "positive";
  } else {
    status = "low-tax";
  }

  /* ==========================================================
     ASSUMPTIONS
  ========================================================== */

  const assumptions = [
    "Perquisite value is estimated as FMV at exercise minus exercise price.",
    "Exercise taxation is modeled as incremental normal income tax.",
    "Capital gains use exercise FMV as the simplified cost basis.",
    "Unlisted shares use a 24-month long-term holding threshold.",
    "Long-term capital gains are modeled at 12.5% plus 4% cess.",
    "This estimator does not model surcharge, exemptions, losses, DTAA or special ESOP deferral rules.",
    "Actual tax liability depends on your personal circumstances and transaction documents.",
  ];

  return {
    vestedShares,

    exerciseCost,

    perquisitePerShare,
    taxablePerquisite,

    estimatedIncomeTax,
    incomeTaxRate,

    saleValue,

    capitalGain,
    capitalGainsTax,

    totalEstimatedTax,

    netTakeHome,

    effectiveTaxRate,

    isLongTerm,

    holdingPeriodThresholdMonths,

    status,

    assumptions,
  };
}
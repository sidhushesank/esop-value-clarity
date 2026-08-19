export type DilutionInput = {
  sharesOwned: number;
  fullyDilutedShares: number;

  preMoneyValuation: number;
  newInvestment: number;

  currentOptionPoolPercent: number;
  targetOptionPoolPercent: number;
};

export type DilutionResult = {
  sharesOwned: number;
  fullyDilutedShares: number;

  currentOwnershipPercent: number;
  newInvestorOwnershipPercent: number;

  newSharesIssued: number;
  newOptionPoolShares: number;

  postMoneyValuation: number;
  postMoneyShares: number;

  dilutedOwnershipPercent: number;
  ownershipReductionPercent: number;

  currentStakeValue: number;
  postRoundStakeValue: number;

  currentOptionPoolPercent: number;
  targetOptionPoolPercent: number;

  optionPoolIncreasePercent: number;

  status:
    | "minimal"
    | "moderate"
    | "significant"
    | "high";

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

function clampPercent(value: number) {
  return Math.min(
    Math.max(positiveNumber(value), 0),
    100
  );
}

/* ============================================================
   MAIN CALCULATION
============================================================ */

export function calculateDilution(
  input: DilutionInput
): DilutionResult {
  const sharesOwned =
    positiveNumber(input.sharesOwned);

  const fullyDilutedShares =
    Math.max(
      positiveNumber(input.fullyDilutedShares),
      sharesOwned
    );

  const preMoneyValuation =
    positiveNumber(input.preMoneyValuation);

  const newInvestment =
    positiveNumber(input.newInvestment);

  const currentOptionPoolPercent =
    clampPercent(
      input.currentOptionPoolPercent
    );

  const targetOptionPoolPercent =
    clampPercent(
      input.targetOptionPoolPercent
    );

  /* ==========================================================
     CURRENT OWNERSHIP
  ========================================================== */

  const currentOwnershipPercent =
    fullyDilutedShares > 0
      ? (sharesOwned /
          fullyDilutedShares) *
        100
      : 0;

  /*
   * Current stake value based on the
   * pre-money valuation.
   */

  const currentStakeValue =
    preMoneyValuation *
    (currentOwnershipPercent / 100);

  /* ==========================================================
     FUNDING ROUND
  ========================================================== */

  const postMoneyValuation =
    preMoneyValuation +
    newInvestment;

  /*
   * New investor receives shares based on
   * the pre-money share price.
   *
   * Example:
   *
   * Pre-money = ₹10 Cr
   * Existing shares = 1,000,000
   * Investment = ₹2 Cr
   *
   * New shares =
   * 2 / 10 × 1,000,000
   * = 200,000
   */

  const newSharesIssued =
    preMoneyValuation > 0
      ? (newInvestment /
          preMoneyValuation) *
        fullyDilutedShares
      : 0;

  const newInvestorOwnershipPercent =
    postMoneyValuation > 0
      ? (newInvestment /
          postMoneyValuation) *
        100
      : 0;

  /* ==========================================================
     OPTION POOL TOP-UP
  ========================================================== */

  /*
   * If the target pool is larger than the
   * existing pool, new option-pool shares
   * are created.
   *
   * These shares dilute existing holders.
   */

  let newOptionPoolShares = 0;

  if (
    targetOptionPoolPercent >
    currentOptionPoolPercent
  ) {
    const target =
      targetOptionPoolPercent / 100;

    const denominator =
      1 - target;

    if (denominator > 0) {
      newOptionPoolShares =
        (target *
          (fullyDilutedShares +
            newSharesIssued)) /
        denominator;
    }
  }

  /* ==========================================================
     POST-ROUND CAPITALIZATION
  ========================================================== */

  const postMoneyShares =
    fullyDilutedShares +
    newSharesIssued +
    newOptionPoolShares;

  const dilutedOwnershipPercent =
    postMoneyShares > 0
      ? (sharesOwned /
          postMoneyShares) *
        100
      : 0;

  const ownershipReductionPercent =
    Math.max(
      currentOwnershipPercent -
        dilutedOwnershipPercent,
      0
    );
    const relativeOwnershipReductionPercent =
  currentOwnershipPercent > 0
    ? (ownershipReductionPercent /
        currentOwnershipPercent) *
      100
    : 0;

  /* ==========================================================
     POST-ROUND STAKE VALUE
  ========================================================== */

  /*
   * Important:
   *
   * Dilution reduces ownership percentage,
   * but the company valuation also increases
   * because of the funding round.
   *
   * Therefore we show both ownership dilution
   * and modeled stake value.
   */

  const postRoundStakeValue =
    postMoneyValuation *
    (dilutedOwnershipPercent / 100);

  /* ==========================================================
     OPTION POOL
  ========================================================== */

  const actualTargetOptionPoolPercent =
    postMoneyShares > 0
      ? ((
          fullyDilutedShares *
            (currentOptionPoolPercent / 100) +
          newOptionPoolShares
        ) /
          postMoneyShares) *
        100
      : 0;

  const optionPoolIncreasePercent =
    Math.max(
      actualTargetOptionPoolPercent -
        currentOptionPoolPercent,
      0
    );

  /* ==========================================================
     STATUS
  ========================================================== */

  let status:
    | "minimal"
    | "moderate"
    | "significant"
    | "high";

  if (relativeOwnershipReductionPercent < 10) {
  status = "minimal";
} else if (relativeOwnershipReductionPercent < 25) {
  status = "moderate";
} else if (relativeOwnershipReductionPercent < 50) {
  status = "significant";
} else {
  status = "high";
}

  /* ==========================================================
     ASSUMPTIONS
  ========================================================== */

  const assumptions = [
    "The funding round is modeled using the supplied pre-money valuation and new investment.",
    "New investor shares are calculated using the implied pre-money share price.",
    "Your existing shares are assumed to remain unchanged.",
    "Option-pool top-up is modeled as new shares created for the employee option pool.",
    "Ownership dilution is calculated on a post-round fully diluted basis.",
    "Post-round stake value is an illustrative value based on the modeled post-money valuation.",
    "This estimator does not model liquidation preferences, multiple share classes, SAFEs, convertible notes, or secondary transactions.",
  ];

  return {
    sharesOwned,
    fullyDilutedShares,

    currentOwnershipPercent,
    newInvestorOwnershipPercent,

    newSharesIssued,
    newOptionPoolShares,

    postMoneyValuation,
    postMoneyShares,

    dilutedOwnershipPercent,
    ownershipReductionPercent,

    currentStakeValue,
    postRoundStakeValue,

    currentOptionPoolPercent,
    targetOptionPoolPercent,

    optionPoolIncreasePercent,

    status,

    assumptions,
  };
}
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

  /**
   * Absolute ownership percentage-point change.
   *
   * Example:
   * 1.25% -> 0.75%
   * ownershipReductionPercent = 0.50
   */
  ownershipReductionPercent: number;

  /**
   * Relative reduction in the holder's original ownership.
   *
   * Example:
   * 1.25% -> 0.75%
   * relativeOwnershipReductionPercent = 40%
   *
   * This is the value that downstream scenario tools should use
   * when they need a proportional dilution percentage.
   */
  relativeOwnershipReductionPercent: number;

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
  return Number.isFinite(value)
    ? value
    : 0;
}

function positiveNumber(value: number) {
  return Math.max(
    safeNumber(value),
    0
  );
}

function clampPercent(value: number) {
  return Math.min(
    Math.max(
      positiveNumber(value),
      0
    ),
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
    positiveNumber(
      input.sharesOwned
    );

  const fullyDilutedShares =
    Math.max(
      positiveNumber(
        input.fullyDilutedShares
      ),
      sharesOwned
    );

  const preMoneyValuation =
    positiveNumber(
      input.preMoneyValuation
    );

  const newInvestment =
    positiveNumber(
      input.newInvestment
    );

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

  const currentStakeValue =
    preMoneyValuation *
    (currentOwnershipPercent / 100);

  /* ==========================================================
     FUNDING ROUND
  ========================================================== */

  const postMoneyValuation =
    preMoneyValuation +
    newInvestment;

  /**
   * The new investor receives shares at the implied
   * pre-money price per fully diluted share.
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

  /**
   * fullyDilutedShares is assumed to ALREADY include the
   * existing option pool.
   *
   * Existing pool shares:
   *   E = fullyDilutedShares * currentPool%
   *
   * Let:
   *   B = fullyDilutedShares + newSharesIssued
   *   X = new option-pool shares to create
   *   T = target pool %
   *
   * We want:
   *   (E + X) / (B + X) = T
   *
   * Therefore:
   *   X = (T * B - E) / (1 - T)
   *
   * We create only the positive top-up required.
   */
  const existingOptionPoolShares =
    fullyDilutedShares *
    (currentOptionPoolPercent /
      100);

  let newOptionPoolShares = 0;

  if (
    targetOptionPoolPercent >
    currentOptionPoolPercent
  ) {
    const target =
      targetOptionPoolPercent /
      100;

    const baseSharesBeforeTopUp =
      fullyDilutedShares +
      newSharesIssued;

    const denominator =
      1 - target;

    if (denominator > 0) {
      const requiredTopUp =
        (target *
          baseSharesBeforeTopUp -
          existingOptionPoolShares) /
        denominator;

      newOptionPoolShares =
        Math.max(
          requiredTopUp,
          0
        );
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

  /**
   * Percentage-point ownership change.
   *
   * Example:
   * 1.25% -> 0.75%
   * point change = 0.50 percentage points
   */
  const ownershipReductionPercent =
    Math.max(
      currentOwnershipPercent -
        dilutedOwnershipPercent,
      0
    );

  /**
   * Relative reduction in the original stake.
   *
   * Example:
   * 1.25% -> 0.75%
   * relative dilution = 40%
   */
  const relativeOwnershipReductionPercent =
    currentOwnershipPercent > 0
      ? (ownershipReductionPercent /
          currentOwnershipPercent) *
        100
      : 0;

  /* ==========================================================
     POST-ROUND STAKE VALUE
  ========================================================== */

  const postRoundStakeValue =
    postMoneyValuation *
    (dilutedOwnershipPercent /
      100);

  /* ==========================================================
     OPTION POOL
  ========================================================== */

  const actualTargetOptionPoolPercent =
    postMoneyShares > 0
      ? ((existingOptionPoolShares +
            newOptionPoolShares) /
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

  if (
    relativeOwnershipReductionPercent <
    10
  ) {
    status = "minimal";
  } else if (
    relativeOwnershipReductionPercent <
    25
  ) {
    status = "moderate";
  } else if (
    relativeOwnershipReductionPercent <
    50
  ) {
    status = "significant";
  } else {
    status = "high";
  }

  /* ==========================================================
     ASSUMPTIONS
  ========================================================== */

  const assumptions = [
    "The funding round is modeled using the supplied pre-money valuation and new investment.",
    "New investor shares are calculated using the implied pre-money price per fully diluted share.",
    "Your existing shares are assumed to remain unchanged.",
    "The existing option pool is assumed to already be included in fully diluted shares.",
    "Option-pool top-up creates only the additional shares required to reach the target pool percentage after the modeled round.",
    "Ownership-point change and relative dilution are shown separately because they measure different things.",
    "Post-round stake value is illustrative and based on the modeled post-money valuation.",
    "This estimator does not model liquidation preferences, multiple share classes, SAFEs, convertible notes, secondary transactions, or transaction-specific rights.",
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
    relativeOwnershipReductionPercent,

    currentStakeValue,
    postRoundStakeValue,

    currentOptionPoolPercent,
    targetOptionPoolPercent,
    optionPoolIncreasePercent,

    status,
    assumptions,
  };
}
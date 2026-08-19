export type VestingInput = {
  totalOptions: number;
  exercisePrice: number;

  vestingPeriodMonths: number;
  cliffMonths: number;

  monthsCompleted: number;
};

export type VestingResult = {
  totalOptions: number;
  exercisePrice: number;

  vestingPeriodMonths: number;
  cliffMonths: number;
  monthsCompleted: number;

  vestedOptions: number;
  unvestedOptions: number;

  vestedPercent: number;

  exerciseCost: number;

  status:
    | "before-cliff"
    | "on-track"
    | "fully-vested";

  monthsUntilCliff: number;
  monthsUntilFullyVested: number;

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
   MAIN CALCULATION
============================================================ */

export function calculateVesting(
  input: VestingInput
): VestingResult {
  const totalOptions =
    positiveNumber(input.totalOptions);

  const exercisePrice =
    positiveNumber(input.exercisePrice);

  const vestingPeriodMonths =
    Math.max(
      Math.round(
        positiveNumber(input.vestingPeriodMonths)
      ),
      1
    );

  const cliffMonths =
    Math.min(
      Math.round(
        positiveNumber(input.cliffMonths)
      ),
      vestingPeriodMonths
    );

  const monthsCompleted =
    Math.min(
      Math.round(
        positiveNumber(input.monthsCompleted)
      ),
      vestingPeriodMonths
    );

  /* ==========================================================
     VESTING
  ========================================================== */

  let vestedOptions = 0;

  /*
   * Standard vesting model:
   *
   * 25% vests at the cliff.
   * Remaining 75% vests monthly until
   * the end of the vesting period.
   *
   * Example:
   *
   * 10,000 options
   * 48 month vesting
   * 12 month cliff
   *
   * Month 12 → 2,500 vested
   * Month 24 → 5,000 vested
   * Month 36 → 7,500 vested
   * Month 48 → 10,000 vested
   */

  if (
    monthsCompleted >= cliffMonths &&
    totalOptions > 0
  ) {
    if (
      monthsCompleted >=
      vestingPeriodMonths
    ) {
      vestedOptions = totalOptions;
    } else {
      const cliffVesting =
        totalOptions * 0.25;

      const remainingOptions =
        totalOptions - cliffVesting;

      const remainingMonths =
        vestingPeriodMonths - cliffMonths;

      const monthsAfterCliff =
        monthsCompleted - cliffMonths;

      const monthlyVesting =
        remainingMonths > 0
          ? remainingOptions /
            remainingMonths
          : 0;

      vestedOptions =
        cliffVesting +
        monthlyVesting *
          monthsAfterCliff;
    }
  }

  vestedOptions = Math.min(
    Math.max(vestedOptions, 0),
    totalOptions
  );

  /* ==========================================================
     UNVESTED
  ========================================================== */

  const unvestedOptions =
    Math.max(
      totalOptions - vestedOptions,
      0
    );

  /* ==========================================================
     VESTED PERCENT
  ========================================================== */

  const vestedPercent =
    totalOptions > 0
      ? (vestedOptions / totalOptions) *
        100
      : 0;

  /* ==========================================================
     EXERCISE COST
  ========================================================== */

  const exerciseCost =
    vestedOptions * exercisePrice;

  /* ==========================================================
     TIMELINE
  ========================================================== */

  const monthsUntilCliff =
    Math.max(
      cliffMonths - monthsCompleted,
      0
    );

  const monthsUntilFullyVested =
    Math.max(
      vestingPeriodMonths -
        monthsCompleted,
      0
    );

  /* ==========================================================
     STATUS
  ========================================================== */

  let status:
    | "before-cliff"
    | "on-track"
    | "fully-vested";

  if (monthsCompleted < cliffMonths) {
    status = "before-cliff";
  } else if (
    monthsCompleted >=
    vestingPeriodMonths
  ) {
    status = "fully-vested";
  } else {
    status = "on-track";
  }

  /* ==========================================================
     ASSUMPTIONS
  ========================================================== */

  const assumptions = [
    "This simulator models a standard vesting schedule.",
    "25% of the grant vests at the cliff.",
    "The remaining 75% vests monthly after the cliff.",
    "Vesting stops at the end of the modeled vesting period.",
    "Unvested options are assumed to be forfeited when employment ends.",
    "Exercise cost is calculated using the supplied exercise price.",
    "Actual vesting terms depend on the employee's ESOP grant agreement.",
  ];

  return {
    totalOptions,
    exercisePrice,

    vestingPeriodMonths,
    cliffMonths,
    monthsCompleted,

    vestedOptions,
    unvestedOptions,

    vestedPercent,

    exerciseCost,

    status,

    monthsUntilCliff,
    monthsUntilFullyVested,

    assumptions,
  };
}
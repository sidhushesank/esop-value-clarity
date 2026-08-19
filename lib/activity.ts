import {
  Prisma,
  UserActivityType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

/* ============================================================ */
/* TYPES                                                        */
/* ============================================================ */

interface RecordUserActivityOptions {
  userId: string;
  type: UserActivityType;
  metadata?: Prisma.InputJsonValue;
}

/* ============================================================ */
/* RECORD USER ACTIVITY                                         */
/* ============================================================ */

/**
 * Records a product activity event for a user.
 *
 * Activity tracking should never break the actual product action.
 * For example, if analytics logging fails, a simulator calculation
 * should still succeed.
 */
export async function recordUserActivity({
  userId,
  type,
  metadata,
}: RecordUserActivityOptions): Promise<void> {
  try {
    const now = new Date();

    await prisma.$transaction([
      prisma.userActivity.create({
        data: {
          userId,
          type,

          ...(metadata !== undefined
            ? {
                metadata,
              }
            : {}),
        },
      }),

      prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          lastActiveAt: now,
        },
      }),
    ]);
  } catch (error) {
    console.error(
      "========== USER ACTIVITY ERROR =========="
    );
    console.error({
      userId,
      type,
      error,
    });
    console.error(
      "========================================="
    );

    /*
     * IMPORTANT:
     *
     * Do not throw here.
     *
     * Activity tracking is secondary functionality.
     * A logging failure should not break login,
     * calculations, reports, payments, etc.
     */
  }
}

/* ============================================================ */
/* LOGIN                                                        */
/* ============================================================ */

export async function recordLoginActivity(
  userId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "LOGIN",
    metadata: {
      source: "authentication",
    },
  });
}

/* ============================================================ */
/* LOGOUT                                                       */
/* ============================================================ */

export async function recordLogoutActivity(
  userId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "LOGOUT",
    metadata: {
      source: "authentication",
    },
  });
}

/* ============================================================ */
/* SIGNUP                                                       */
/* ============================================================ */

export async function recordSignupActivity(
  userId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "SIGNUP",
    metadata: {
      source: "signup",
    },
  });
}

/* ============================================================ */
/* PROFILE                                                      */
/* ============================================================ */

export async function recordProfileUpdatedActivity(
  userId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "PROFILE_UPDATED",
    metadata: {
      source: "profile",
    },
  });
}

/* ============================================================ */
/* SIMULATOR                                                    */
/* ============================================================ */

export async function recordSimulatorActivity(
  userId: string,
  calculationId?: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "SIMULATOR_USED",

    metadata: calculationId
      ? {
          source: "pro-simulator",
          calculationId,
        }
      : {
          source: "pro-simulator",
        },
  });
}

/* ============================================================ */
/* TAX                                                          */
/* ============================================================ */

export async function recordTaxActivity(
  userId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "TAX_CALCULATED",
    metadata: {
      source: "pro-tax",
    },
  });
}

/* ============================================================ */
/* DILUTION                                                     */
/* ============================================================ */

export async function recordDilutionActivity(
  userId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "DILUTION_CALCULATED",
    metadata: {
      source: "pro-dilution",
    },
  });
}

/* ============================================================ */
/* VESTING                                                      */
/* ============================================================ */

export async function recordVestingActivity(
  userId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "VESTING_CALCULATED",
    metadata: {
      source: "pro-vesting",
    },
  });
}

/* ============================================================ */
/* EXIT                                                         */
/* ============================================================ */

export async function recordExitActivity(
  userId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "EXIT_CALCULATED",
    metadata: {
      source: "pro-exit",
    },
  });
}

/* ============================================================ */
/* COMPARE                                                      */
/* ============================================================ */

export async function recordCompareActivity(
  userId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "COMPARE_USED",
    metadata: {
      source: "pro-compare",
    },
  });
}

/* ============================================================ */
/* REPORT                                                       */
/* ============================================================ */

export async function recordReportActivity(
  userId: string,
  reportId?: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "REPORT_CREATED",

    metadata: reportId
      ? {
          source: "pro-reports",
          reportId,
        }
      : {
          source: "pro-reports",
        },
  });
}

/* ============================================================ */
/* CALCULATION CREATED                                          */
/* ============================================================ */

export async function recordCalculationCreatedActivity(
  userId: string,
  calculationId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "CALCULATION_CREATED",

    metadata: {
      calculationId,
    },
  });
}

/* ============================================================ */
/* CALCULATION UPDATED                                          */
/* ============================================================ */

export async function recordCalculationUpdatedActivity(
  userId: string,
  calculationId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "CALCULATION_UPDATED",

    metadata: {
      calculationId,
    },
  });
}

/* ============================================================ */
/* CALCULATION DELETED                                          */
/* ============================================================ */

export async function recordCalculationDeletedActivity(
  userId: string,
  calculationId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "CALCULATION_DELETED",

    metadata: {
      calculationId,
    },
  });
}

/* ============================================================ */
/* PRO UPGRADE                                                  */
/* ============================================================ */

export async function recordProUpgradeActivity(
  userId: string,
  metadata?: Prisma.InputJsonValue
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "PRO_UPGRADED",

    metadata:
      metadata ??
      {
        source: "subscription",
      },
  });
}

/* ============================================================ */
/* PRO CANCELLATION                                             */
/* ============================================================ */

export async function recordProCancelledActivity(
  userId: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "PRO_CANCELLED",

    metadata: {
      source: "subscription",
    },
  });
}

/* ============================================================ */
/* PAYMENT SUCCESS                                              */
/* ============================================================ */

export async function recordPaymentSuccessActivity(
  userId: string,
  paymentId?: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "PAYMENT_SUCCESS",

    metadata: paymentId
      ? {
          paymentId,
        }
      : {
          source: "payment",
        },
  });
}

/* ============================================================ */
/* PAYMENT FAILED                                               */
/* ============================================================ */

export async function recordPaymentFailedActivity(
  userId: string,
  paymentId?: string
): Promise<void> {
  await recordUserActivity({
    userId,
    type: "PAYMENT_FAILED",

    metadata: paymentId
      ? {
          paymentId,
        }
      : {
          source: "payment",
        },
  });
}
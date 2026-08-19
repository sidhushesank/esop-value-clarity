import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type GrantDuration =
  | "7_DAYS"
  | "30_DAYS"
  | "90_DAYS"
  | "1_YEAR"
  | "LIFETIME";

interface GrantProBody {
  duration?: GrantDuration;
  reason?: string;
}

/* ============================================================ */
/* CALCULATE EXPIRY DATE                                        */
/* ============================================================ */

function getExpiryDate(
  duration: GrantDuration,
  startedAt: Date
): Date | null {
  const expiresAt = new Date(startedAt);

  switch (duration) {
    case "7_DAYS":
      expiresAt.setDate(expiresAt.getDate() + 7);
      return expiresAt;

    case "30_DAYS":
      expiresAt.setDate(expiresAt.getDate() + 30);
      return expiresAt;

    case "90_DAYS":
      expiresAt.setDate(expiresAt.getDate() + 90);
      return expiresAt;

    case "1_YEAR":
      expiresAt.setFullYear(
        expiresAt.getFullYear() + 1
      );
      return expiresAt;

    case "LIFETIME":
      return null;

    default:
      return null;
  }
}

/* ============================================================ */
/* VALIDATE DURATION                                            */
/* ============================================================ */

function isValidDuration(
  value: unknown
): value is GrantDuration {
  return (
    value === "7_DAYS" ||
    value === "30_DAYS" ||
    value === "90_DAYS" ||
    value === "1_YEAR" ||
    value === "LIFETIME"
  );
}

/* ============================================================ */
/* POST                                                         */
/* ============================================================ */

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // ==========================================================
    // 1. REQUIRE ADMIN
    // ==========================================================

    const auth = await requireAdmin(request);

    if (!auth.success) {
      return auth.response;
    }

    const { id: targetUserId } =
      await context.params;

    // ==========================================================
    // 2. READ REQUEST BODY
    // ==========================================================

    let body: GrantProBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    const duration = body.duration;
    const reason = body.reason?.trim() || null;

    // ==========================================================
    // 3. VALIDATE DURATION
    // ==========================================================

    if (!isValidDuration(duration)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid PRO duration",
          allowedDurations: [
            "7_DAYS",
            "30_DAYS",
            "90_DAYS",
            "1_YEAR",
            "LIFETIME",
          ],
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================================
    // 4. FIND TARGET USER
    // ==========================================================

    const targetUser =
      await prisma.user.findUnique({
        where: {
          id: targetUserId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          accountStatus: true,

          subscription: {
            select: {
              id: true,
              plan: true,
              status: true,
              source: true,
              startedAt: true,
              expiresAt: true,
            },
          },
        },
      });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================================
    // 5. DON'T GRANT PRO TO SUSPENDED ACCOUNT
    // ==========================================================

    if (
      targetUser.accountStatus ===
      "SUSPENDED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot grant PRO access to a suspended account. Reactivate the account first.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // 6. PROTECT EXISTING PAID SUBSCRIPTION
    // ==========================================================

    const now = new Date();

    const hasActivePaidPro =
      targetUser.subscription?.plan === "PRO" &&
      targetUser.subscription.status ===
        "ACTIVE" &&
      targetUser.subscription.source ===
        "PAYMENT" &&
      (!targetUser.subscription.expiresAt ||
        targetUser.subscription.expiresAt >
          now);

    if (hasActivePaidPro) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This user already has an active paid PRO subscription. The paid subscription was not modified.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // 7. CALCULATE ADMIN GRANT
    // ==========================================================

    const startedAt = new Date();

    const expiresAt = getExpiryDate(
      duration,
      startedAt
    );

    const grantReason =
      reason ||
      `Complimentary PRO access granted by admin`;

    // ==========================================================
    // 8. UPDATE SUBSCRIPTION + AUDIT LOG ATOMICALLY
    // ==========================================================

    const result = await prisma.$transaction(
      async (tx) => {
        const subscription =
          await tx.subscription.upsert({
            where: {
              userId: targetUser.id,
            },

            create: {
              userId: targetUser.id,

              plan: "PRO",
              status: "ACTIVE",

              /*
               * Administrative grants are NOT
               * Razorpay billing subscriptions.
               */
              billingCycle: null,
              source: "ADMIN_GRANT",

              grantedById: auth.admin.id,
              grantReason,

              startedAt,
              expiresAt,
            },

            update: {
              plan: "PRO",
              status: "ACTIVE",

              billingCycle: null,
              source: "ADMIN_GRANT",

              grantedById: auth.admin.id,
              grantReason,

              startedAt,
              expiresAt,
            },
          });

        const auditLog =
          await tx.adminAuditLog.create({
            data: {
              adminId: auth.admin.id,
              targetUserId:
                targetUser.id,

              action: "PRO_GRANTED",

              metadata: {
                duration,
                reason: grantReason,

                startedAt:
                  startedAt.toISOString(),

                expiresAt:
                  expiresAt?.toISOString() ??
                  null,

                targetEmail:
                  targetUser.email,
              },
            },
          });

        return {
          subscription,
          auditLog,
        };
      }
    );

    // ==========================================================
    // 9. RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          duration === "LIFETIME"
            ? `Lifetime PRO access granted to ${targetUser.name}`
            : `PRO access granted to ${targetUser.name}`,

        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },

        subscription: {
          id: result.subscription.id,
          plan: result.subscription.plan,
          status:
            result.subscription.status,
          source:
            result.subscription.source,

          startedAt:
            result.subscription.startedAt,

          expiresAt:
            result.subscription.expiresAt,

          grantReason:
            result.subscription.grantReason,

          grantedById:
            result.subscription.grantedById,
        },

        grant: {
          duration,
          lifetime:
            duration === "LIFETIME",
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "========== ADMIN GRANT PRO ERROR =========="
    );
    console.error(error);
    console.error(
      "==========================================="
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
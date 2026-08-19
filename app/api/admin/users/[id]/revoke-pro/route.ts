import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

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

    const { id: targetUserId } = await context.params;

    // ==========================================================
    // 2. FIND TARGET USER
    // ==========================================================

    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,

        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
            source: true,
            billingCycle: true,
            startedAt: true,
            expiresAt: true,
            grantReason: true,
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
    // 3. CHECK SUBSCRIPTION EXISTS
    // ==========================================================

    if (!targetUser.subscription) {
      return NextResponse.json(
        {
          success: false,
          message: "This user does not have a subscription.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // 4. PROTECT PAID SUBSCRIPTIONS
    // ==========================================================

    if (
      targetUser.subscription.source === "PAYMENT" &&
      targetUser.subscription.plan === "PRO"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This user has a paid PRO subscription. Admin revoke cannot cancel paid subscriptions.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // 5. CHECK THIS IS ADMIN-GRANTED PRO
    // ==========================================================

    if (
      targetUser.subscription.source !== "ADMIN_GRANT" ||
      targetUser.subscription.plan !== "PRO"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This user does not currently have admin-granted PRO access.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // 6. REVOKE PRO + WRITE AUDIT LOG
    // ==========================================================

    const previousSubscription = {
      plan: targetUser.subscription.plan,
      status: targetUser.subscription.status,
      source: targetUser.subscription.source,
      startedAt: targetUser.subscription.startedAt,
      expiresAt: targetUser.subscription.expiresAt,
      grantReason: targetUser.subscription.grantReason,
    };

    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.update({
        where: {
          userId: targetUser.id,
        },
        data: {
          plan: "FREE",
          status: "ACTIVE",

          billingCycle: null,

          source: "ADMIN_GRANT",

          grantedById: null,
          grantReason: null,

          expiresAt: null,
        },
      });

      const auditLog = await tx.adminAuditLog.create({
        data: {
          adminId: auth.admin.id,
          targetUserId: targetUser.id,
          action: "PRO_REVOKED",

          metadata: {
            targetEmail: targetUser.email,
            previousSubscription: {
              plan: previousSubscription.plan,
              status: previousSubscription.status,
              source: previousSubscription.source,
              startedAt:
                previousSubscription.startedAt.toISOString(),

              expiresAt:
                previousSubscription.expiresAt?.toISOString() ??
                null,

              grantReason:
                previousSubscription.grantReason,
            },

            revokedAt: new Date().toISOString(),
          },
        },
      });

      return {
        subscription,
        auditLog,
      };
    });

    // ==========================================================
    // 7. RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,

        message: `PRO access revoked from ${targetUser.name}`,

        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },

        subscription: {
          id: result.subscription.id,
          plan: result.subscription.plan,
          status: result.subscription.status,
          source: result.subscription.source,
          billingCycle:
            result.subscription.billingCycle,
          expiresAt:
            result.subscription.expiresAt,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "========== ADMIN REVOKE PRO ERROR =========="
    );
    console.error(error);
    console.error(
      "============================================"
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
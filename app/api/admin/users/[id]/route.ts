import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // ============================================================
    // REQUIRE ADMIN
    // ============================================================

    const auth = await requireAdmin(request);

    if (!auth.success) {
      return auth.response;
    }

    const { id } = await context.params;

    // ============================================================
    // FIND USER
    // ============================================================

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,

        role: true,
        accountStatus: true,

        lastLoginAt: true,
        lastActiveAt: true,

        createdAt: true,
        updatedAt: true,

        subscription: {
          select: {
            id: true,
            plan: true,
            billingCycle: true,
            status: true,
            source: true,
            grantedById: true,
            grantReason: true,
            startedAt: true,
            expiresAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
          select: {
            id: true,
            plan: true,
            billingCycle: true,
            amount: true,
            currency: true,
            status: true,
            razorpayOrderId: true,
            razorpayPaymentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        activities: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
          select: {
            id: true,
            type: true,
            metadata: true,
            createdAt: true,
          },
        },

        adminTargetLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
          select: {
            id: true,
            action: true,
            metadata: true,
            createdAt: true,

            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },

        _count: {
          select: {
            calculations: true,
            payments: true,
            activities: true,
          },
        },
      },
    });

    // ============================================================
    // USER NOT FOUND
    // ============================================================

    if (!user) {
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

    // ============================================================
    // DETERMINE CURRENT PLAN
    // ============================================================

    const now = new Date();

    const subscriptionIsActive =
      user.subscription?.plan === "PRO" &&
      user.subscription.status === "ACTIVE" &&
      (!user.subscription.expiresAt ||
        user.subscription.expiresAt > now);

    const currentPlan = subscriptionIsActive
      ? "PRO"
      : "FREE";

    // ============================================================
    // PAYMENT SUMMARY
    // ============================================================

    const successfulPayments = user.payments.filter(
      (payment) => payment.status === "SUCCESS"
    );

    const totalPaid = successfulPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // ============================================================
    // AUDIT: ADMIN VIEWED USER
    // ============================================================

    await prisma.adminAuditLog.create({
      data: {
        adminId: auth.admin.id,
        targetUserId: user.id,
        action: "USER_VIEWED",
        metadata: {
          source: "admin_user_detail",
        },
      },
    });

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,

        role: user.role,
        accountStatus: user.accountStatus,

        plan: currentPlan,

        lastLoginAt: user.lastLoginAt,
        lastActiveAt: user.lastActiveAt,

        createdAt: user.createdAt,
        updatedAt: user.updatedAt,

        subscription: user.subscription,

        stats: {
          calculations: user._count.calculations,
          payments: user._count.payments,
          activities: user._count.activities,

          successfulPayments:
            successfulPayments.length,

          totalPaid,
        },

        payments: user.payments,

        activities: user.activities,

        adminHistory: user.adminTargetLogs,
      },
    });
  } catch (error) {
    console.error(
      "========== ADMIN USER DETAIL ERROR =========="
    );
    console.error(error);
    console.error(
      "============================================="
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
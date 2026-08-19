import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    // ============================================================
    // REQUIRE ADMIN
    // ============================================================

    const auth = await requireAdmin(request);

    if (!auth.success) {
      return auth.response;
    }

    // ============================================================
    // DATE RANGES
    // ============================================================

    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    // ============================================================
    // USER COUNTS
    // ============================================================

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: {
          accountStatus: "ACTIVE",
        },
      }),

      prisma.user.count({
        where: {
          accountStatus: "SUSPENDED",
        },
      }),

      prisma.user.count({
        where: {
          role: "ADMIN",
        },
      }),

      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),

      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfWeek,
          },
        },
      }),

      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
    ]);

    // ============================================================
    // SUBSCRIPTION COUNTS
    // ============================================================

    const [
      activeProSubscriptions,
      adminGrantedPro,
      paidPro,
      cancelledSubscriptions,
      expiredSubscriptions,
    ] = await Promise.all([
      prisma.subscription.count({
        where: {
          plan: "PRO",
          status: "ACTIVE",

          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: now,
              },
            },
          ],
        },
      }),

      prisma.subscription.count({
        where: {
          plan: "PRO",
          status: "ACTIVE",
          source: "ADMIN_GRANT",

          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: now,
              },
            },
          ],
        },
      }),

      prisma.subscription.count({
        where: {
          plan: "PRO",
          status: "ACTIVE",
          source: "PAYMENT",

          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: now,
              },
            },
          ],
        },
      }),

      prisma.subscription.count({
        where: {
          status: "CANCELLED",
        },
      }),

      prisma.subscription.count({
        where: {
          status: "EXPIRED",
        },
      }),
    ]);

    // ============================================================
    // FREE USERS
    // ============================================================

    const freeUsers = Math.max(
      totalUsers - activeProSubscriptions,
      0
    );

    // ============================================================
    // PAYMENT STATISTICS
    // ============================================================

    const [
      successfulPayments,
      failedPayments,
      pendingPayments,
      allSuccessfulPayments,
      monthSuccessfulPayments,
    ] = await Promise.all([
      prisma.payment.count({
        where: {
          status: "SUCCESS",
        },
      }),

      prisma.payment.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.payment.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.payment.findMany({
        where: {
          status: "SUCCESS",
        },

        select: {
          amount: true,
          currency: true,
        },
      }),

      prisma.payment.findMany({
        where: {
          status: "SUCCESS",

          createdAt: {
            gte: startOfMonth,
          },
        },

        select: {
          amount: true,
          currency: true,
        },
      }),
    ]);

    // ============================================================
    // REVENUE
    // ============================================================

    const totalRevenue = allSuccessfulPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const monthlyRevenue = monthSuccessfulPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // ============================================================
    // PRODUCT USAGE
    // ============================================================

    const [
      totalCalculations,
      calculationsToday,
      totalActivities,
    ] = await Promise.all([
      prisma.calculation.count(),

      prisma.calculation.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),

      prisma.userActivity.count(),
    ]);

    // ============================================================
    // RECENT USERS
    // ============================================================

    const recentUsers = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },

      take: 8,

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        lastLoginAt: true,

        subscription: {
          select: {
            plan: true,
            status: true,
            source: true,
            expiresAt: true,
          },
        },
      },
    });

    const formattedRecentUsers = recentUsers.map(
      (user) => {
        const isPro =
          user.subscription?.plan === "PRO" &&
          user.subscription.status === "ACTIVE" &&
          (!user.subscription.expiresAt ||
            user.subscription.expiresAt > now);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,

          plan: isPro ? "PRO" : "FREE",

          source:
            isPro && user.subscription
              ? user.subscription.source
              : null,

          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        };
      }
    );

    // ============================================================
    // RECENT ACTIVITY
    // ============================================================

    const recentActivity =
      await prisma.userActivity.findMany({
        orderBy: {
          createdAt: "desc",
        },

        take: 12,

        select: {
          id: true,
          type: true,
          metadata: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    // ============================================================
    // RECENT PAYMENTS
    // ============================================================

    const recentPayments =
      await prisma.payment.findMany({
        orderBy: {
          createdAt: "desc",
        },

        take: 8,

        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          plan: true,
          billingCycle: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      generatedAt: now,

      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          admins: adminUsers,

          free: freeUsers,
          pro: activeProSubscriptions,

          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth,
        },

        subscriptions: {
          activePro: activeProSubscriptions,
          paidPro,
          adminGrantedPro,
          cancelled: cancelledSubscriptions,
          expired: expiredSubscriptions,
        },

        payments: {
          successful: successfulPayments,
          failed: failedPayments,
          pending: pendingPayments,
        },

        revenue: {
          currency: "INR",

          /*
           * This assumes your Payment.amount field is already
           * stored in the display unit you want to show.
           *
           * If you store Razorpay paise instead, divide by 100
           * only in the frontend/display layer.
           */
          total: totalRevenue,
          thisMonth: monthlyRevenue,
        },

        product: {
          calculations: totalCalculations,
          calculationsToday,
          activities: totalActivities,
        },
      },

      recentUsers: formattedRecentUsers,

      recentActivity,

      recentPayments,
    });
  } catch (error) {
    console.error(
      "========== ADMIN STATS ERROR =========="
    );
    console.error(error);
    console.error(
      "======================================="
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
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const allowedStatuses = [
  "PENDING",
  "SUCCESS",
  "FAILED",
] as const;

const allowedBillingCycles = [
  "MONTHLY",
  "SIX_MONTHS",
  "YEARLY",
] as const;

type AllowedStatus =
  (typeof allowedStatuses)[number];

type AllowedBillingCycle =
  (typeof allowedBillingCycles)[number];

function isAllowedStatus(
  value: string | null
): value is AllowedStatus {
  return (
    value !== null &&
    allowedStatuses.includes(
      value as AllowedStatus
    )
  );
}

function isAllowedBillingCycle(
  value: string | null
): value is AllowedBillingCycle {
  return (
    value !== null &&
    allowedBillingCycles.includes(
      value as AllowedBillingCycle
    )
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    // ============================================================
    // REQUIRE ADMIN
    // ============================================================

    const auth = await requireAdmin(request);

    if (!auth.success) {
      return auth.response;
    }

    // ============================================================
    // QUERY PARAMETERS
    // ============================================================

    const { searchParams } = new URL(
      request.url
    );

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status");

    const billingCycle =
      searchParams.get("billingCycle");

    const page = Math.max(
      Number(
        searchParams.get("page") || "1"
      ),
      1
    );

    const limit = Math.min(
      Math.max(
        Number(
          searchParams.get("limit") || "25"
        ),
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    // ============================================================
    // BUILD FILTERS
    // ============================================================

    const where: any = {
      AND: [],
    };

    if (search) {
      where.AND.push({
        OR: [
          {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            razorpayPaymentId: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            razorpayOrderId: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      });
    }

    if (isAllowedStatus(status)) {
      where.AND.push({
        status,
      });
    }

    if (
      isAllowedBillingCycle(
        billingCycle
      )
    ) {
      where.AND.push({
        billingCycle,
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
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

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    // ============================================================
    // FETCH PAYMENTS
    // ============================================================

    const [
      payments,
      total,
      successfulCount,
      failedCount,
      pendingCount,
      successfulPayments,
      monthlySuccessfulPayments,
      todaySuccessfulPayments,
    ] = await Promise.all([
      prisma.payment.findMany({
        where,

        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,

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

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              accountStatus: true,

              subscription: {
                select: {
                  plan: true,
                  status: true,
                  source: true,
                  expiresAt: true,
                },
              },
            },
          },
        },
      }),

      prisma.payment.count({
        where,
      }),

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
        },
      }),

      prisma.payment.findMany({
        where: {
          status: "SUCCESS",

          createdAt: {
            gte: startOfToday,
          },
        },

        select: {
          amount: true,
        },
      }),
    ]);

    // ============================================================
    // REVENUE
    // ============================================================

    const totalRevenue =
      successfulPayments.reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

    const monthlyRevenue =
      monthlySuccessfulPayments.reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

    const todayRevenue =
      todaySuccessfulPayments.reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

    // ============================================================
    // FORMAT PAYMENTS
    // ============================================================

    const formattedPayments =
      payments.map((payment) => {
        const subscription =
          payment.user.subscription;

        const isPro =
          subscription?.plan === "PRO" &&
          subscription.status === "ACTIVE" &&
          (!subscription.expiresAt ||
            subscription.expiresAt >
              now);

        return {
          id: payment.id,

          plan: payment.plan,
          billingCycle:
            payment.billingCycle,

          amount: payment.amount,
          currency: payment.currency,

          status: payment.status,

          razorpayOrderId:
            payment.razorpayOrderId,

          razorpayPaymentId:
            payment.razorpayPaymentId,

          createdAt:
            payment.createdAt,

          updatedAt:
            payment.updatedAt,

          user: {
            id: payment.user.id,
            name: payment.user.name,
            email: payment.user.email,

            role: payment.user.role,

            accountStatus:
              payment.user.accountStatus,

            currentPlan: isPro
              ? "PRO"
              : "FREE",

            subscriptionSource:
              isPro && subscription
                ? subscription.source
                : null,
          },
        };
      });

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      payments:
        formattedPayments,

      summary: {
        successful:
          successfulCount,

        failed:
          failedCount,

        pending:
          pendingCount,

        revenue: {
          currency: "INR",
          total: totalRevenue,
          thisMonth:
            monthlyRevenue,
          today:
            todayRevenue,
        },
      },

      filters: {
        search:
          search || null,

        status:
          isAllowedStatus(status)
            ? status
            : null,

        billingCycle:
          isAllowedBillingCycle(
            billingCycle
          )
            ? billingCycle
            : null,
      },

      pagination: {
        page,
        limit,
        total,

        totalPages:
          Math.ceil(
            total / limit
          ),

        hasNextPage:
          page * limit <
          total,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "========== ADMIN PAYMENTS ERROR =========="
    );
    console.error(error);
    console.error(
      "=========================================="
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
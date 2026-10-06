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
   "TEAM_YEARLY",
] as const;

const allowedScopes = [
  "ALL",
  "PERSONAL",
  "TEAM",
] as const;

type AllowedStatus =
  (typeof allowedStatuses)[number];

type AllowedBillingCycle =
  (typeof allowedBillingCycles)[number];

type AllowedScope =
  (typeof allowedScopes)[number];

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

function isAllowedScope(
  value: string | null
): value is AllowedScope {
  return (
    value !== null &&
    allowedScopes.includes(
      value as AllowedScope
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

    const auth =
      await requireAdmin(request);

    if (!auth.success) {
      return auth.response;
    }

    // ============================================================
    // QUERY PARAMETERS
    // ============================================================

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const status =
      searchParams.get(
        "status"
      );

    const billingCycle =
      searchParams.get(
        "billingCycle"
      );

    const rawScope =
      searchParams.get(
        "scope"
      );

    const scope =
      isAllowedScope(rawScope)
        ? rawScope
        : "ALL";

    const page = Math.max(
      Number(
        searchParams.get(
          "page"
        ) || "1"
      ),
      1
    );

    const limit = Math.min(
      Math.max(
        Number(
          searchParams.get(
            "limit"
          ) || "25"
        ),
        1
      ),
      100
    );

    const skip =
      (page - 1) * limit;

    // ============================================================
    // DATE RANGES
    // ============================================================

    const now = new Date();

    const startOfToday =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const startOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    // ============================================================
    // PERSONAL PAYMENT FILTERS
    // ============================================================

    const personalWhere: any = {
      AND: [],
    };

    if (search) {
      personalWhere.AND.push({
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
      personalWhere.AND.push({
        status,
      });
    }

    if (
      isAllowedBillingCycle(
        billingCycle
      )
    ) {
      if (billingCycle === "TEAM_YEARLY") {
        // TEAM_YEARLY belongs to the B2B TeamPayment stream,
        // not the personal Payment model.
        personalWhere.AND.push({
          id: "__NO_PERSONAL_TEAM_PAYMENT__",
        });
      } else {
        personalWhere.AND.push({
          billingCycle,
        });
      }
    }

    if (
      personalWhere.AND.length === 0
    ) {
      delete personalWhere.AND;
    }

    // ============================================================
    // TEAM PAYMENT FILTERS
    // ============================================================
    //
    // TeamPayment does not have billingCycle.
    // Team entitlement duration lives on the workspace/payment
    // startedAt + expiresAt fields.
    //
    // ============================================================

    const teamWhere: any = {
      AND: [],
    };

    if (search) {
      teamWhere.AND.push({
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
            workspace: {
              name: {
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
      teamWhere.AND.push({
        status,
      });
    }

    if (
      isAllowedBillingCycle(
        billingCycle
      )
    ) {
      if (billingCycle !== "TEAM_YEARLY") {
        // MONTHLY / SIX_MONTHS / YEARLY belong to the personal
        // Payment stream. TeamPayment represents the annual Team
        // entitlement and is exposed as TEAM_YEARLY.
        teamWhere.AND.push({
          id: "__NO_TEAM_PAYMENT_FOR_PERSONAL_CYCLE__",
        });
      }
    }

    if (teamWhere.AND.length === 0) {
      delete teamWhere.AND;
    }

    // ============================================================
    // PERSONAL PAYMENT DATA
    // ============================================================

    const shouldFetchPersonal =
      scope !== "TEAM";

    const shouldFetchTeam =
      scope !== "PERSONAL";

    const [
      personalPayments,
      personalTotal,
      successfulCount,
      failedCount,
      pendingCount,
      successfulPayments,
      monthlySuccessfulPayments,
      todaySuccessfulPayments,

      teamPayments,
      teamTotal,

      successfulTeamCount,
      failedTeamCount,
      pendingTeamCount,

      successfulTeamPayments,
      monthlySuccessfulTeamPayments,
      todaySuccessfulTeamPayments,
    ] = await Promise.all([
      // ----------------------------------------------------------
      // Personal paginated payments
      // ----------------------------------------------------------

      shouldFetchPersonal
        ? prisma.payment.findMany({
            where: personalWhere,

            orderBy: {
              createdAt:
                "desc",
            },

            skip,
            take: limit,

            select: {
              id: true,

              plan: true,
              billingCycle:
                true,

              amount: true,
              currency: true,

              status: true,

              razorpayOrderId:
                true,

              razorpayPaymentId:
                true,

              createdAt: true,
              updatedAt: true,

              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,

                  role: true,
                  accountStatus:
                    true,

                  subscription: {
                    select: {
                      plan: true,
                      status:
                        true,
                      source:
                        true,
                      expiresAt:
                        true,
                    },
                  },
                },
              },
            },
          })
        : [],

      // ----------------------------------------------------------
      // Personal filtered total
      // ----------------------------------------------------------

      shouldFetchPersonal
        ? prisma.payment.count({
            where: personalWhere,
          })
        : 0,

      // ----------------------------------------------------------
      // Personal global status counts
      // ----------------------------------------------------------

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

      // ----------------------------------------------------------
      // Personal global revenue
      // ----------------------------------------------------------

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

      // ----------------------------------------------------------
      // Team paginated payments
      // ----------------------------------------------------------

      shouldFetchTeam
        ? prisma.teamPayment.findMany({
            where: teamWhere,

            orderBy: {
              createdAt:
                "desc",
            },

            /*
             * Team payments are returned separately from personal
             * payments. The Admin page can display them as their own
             * B2B section without disturbing the personal table.
             */
            skip,
            take: limit,

            select: {
              id: true,

              amount: true,
              currency: true,

              status: true,

              razorpayOrderId:
                true,

              razorpayPaymentId:
                true,

              startedAt: true,
              expiresAt: true,

              createdAt: true,
              updatedAt: true,

              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,

                  role: true,
                  accountStatus:
                    true,
                },
              },

              workspace: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  startedAt: true,
                  expiresAt: true,

                  owner: {
                    select: {
                      id: true,
                      name: true,
                      email:
                        true,
                    },
                  },

                  members: {
                    where: {
                      status:
                        "ACTIVE",
                    },

                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          })
        : [],

      // ----------------------------------------------------------
      // Team filtered total
      // ----------------------------------------------------------

      shouldFetchTeam
        ? prisma.teamPayment.count({
            where: teamWhere,
          })
        : 0,

      // ----------------------------------------------------------
      // Team global status counts
      // ----------------------------------------------------------

      prisma.teamPayment.count({
        where: {
          status: "SUCCESS",
        },
      }),

      prisma.teamPayment.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.teamPayment.count({
        where: {
          status: "PENDING",
        },
      }),

      // ----------------------------------------------------------
      // Team global revenue
      // ----------------------------------------------------------

      prisma.teamPayment.findMany({
        where: {
          status: "SUCCESS",
        },

        select: {
          amount: true,
        },
      }),

      prisma.teamPayment.findMany({
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

      prisma.teamPayment.findMany({
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
    // PERSONAL REVENUE
    // ============================================================

    const totalRevenue =
      successfulPayments.reduce(
        (
          sum,
          payment
        ) =>
          sum + payment.amount,
        0
      );

    const monthlyRevenue =
      monthlySuccessfulPayments.reduce(
        (
          sum,
          payment
        ) =>
          sum + payment.amount,
        0
      );

    const todayRevenue =
      todaySuccessfulPayments.reduce(
        (
          sum,
          payment
        ) =>
          sum + payment.amount,
        0
      );

    // ============================================================
    // TEAM REVENUE
    // ============================================================

    const totalTeamRevenuePaise =
      successfulTeamPayments.reduce(
        (
          sum,
          payment
        ) =>
          sum + payment.amount,
        0
      );

    const monthlyTeamRevenuePaise =
      monthlySuccessfulTeamPayments.reduce(
        (
          sum,
          payment
        ) =>
          sum + payment.amount,
        0
      );

    const todayTeamRevenuePaise =
      todaySuccessfulTeamPayments.reduce(
        (
          sum,
          payment
        ) =>
          sum + payment.amount,
        0
      );

    const totalTeamRevenue =
      totalTeamRevenuePaise /
      100;

    const monthlyTeamRevenue =
      monthlyTeamRevenuePaise /
      100;

    const todayTeamRevenue =
      todayTeamRevenuePaise /
      100;

    // ============================================================
    // FORMAT PERSONAL PAYMENTS
    // ============================================================

    const formattedPayments =
      personalPayments.map(
        (payment) => {
          const subscription =
            payment.user
              .subscription;

          const isPro =
            subscription?.plan ===
              "PRO" &&
            (
              subscription.status ===
                "ACTIVE" ||
              subscription.status ===
                "CANCELLED"
            ) &&
            (
              !subscription.expiresAt ||
              subscription.expiresAt >
                now
            );

          return {
            id:
              payment.id,

            paymentType:
              "PERSONAL" as const,

            plan:
              payment.plan,

            billingCycle:
              payment.billingCycle,

            amount:
              payment.amount,

            currency:
              payment.currency,

            status:
              payment.status,

            razorpayOrderId:
              payment
                .razorpayOrderId,

            razorpayPaymentId:
              payment
                .razorpayPaymentId,

            createdAt:
              payment.createdAt,

            updatedAt:
              payment.updatedAt,

            user: {
              id:
                payment.user.id,

              name:
                payment.user.name,

              email:
                payment.user.email,

              role:
                payment.user.role,

              accountStatus:
                payment.user
                  .accountStatus,

              currentPlan:
                isPro
                  ? "PRO"
                  : "FREE",

              subscriptionSource:
                isPro &&
                subscription
                  ? subscription.source
                  : null,
            },
          };
        }
      );

    // ============================================================
    // FORMAT TEAM PAYMENTS
    // ============================================================

    const formattedTeamPayments =
      teamPayments.map(
        (payment) => {
          const isFounder =
            payment.user.email ===
            process.env
              .FOUNDER_EMAIL;

          return {
            id:
              payment.id,

            paymentType:
              "TEAM" as const,

            plan:
              "TEAM" as const,

            /*
             * TeamPayment has no billingCycle column.
             */
            billingCycle:
              "TEAM_YEARLY" as const,

            amount:
              payment.amount /
              100,

            amountPaise:
              payment.amount,

            currency:
              payment.currency,

            status:
              payment.status,

            razorpayOrderId:
              payment
                .razorpayOrderId,

            razorpayPaymentId:
              payment
                .razorpayPaymentId,

            startedAt:
              payment.startedAt,

            expiresAt:
              payment.expiresAt,

            createdAt:
              payment.createdAt,

            updatedAt:
              payment.updatedAt,

            purchaser: {
              id:
                payment.user.id,

              name:
                payment.user.name,

              email:
                payment.user.email,

              role:
                payment.user.role,

              accountStatus:
                payment.user
                  .accountStatus,

              isFounder,
            },

            workspace: {
              id:
                payment.workspace.id,

              name:
                payment.workspace
                  .name,

              status:
                payment.workspace
                  .status,

              startedAt:
                payment.workspace
                  .startedAt,

              expiresAt:
                payment.workspace
                  .expiresAt,

              owner: {
                id:
                  payment.workspace
                    .owner.id,

                name:
                  payment.workspace
                    .owner.name,

                email:
                  payment.workspace
                    .owner.email,
              },

              activeMemberCount:
                payment.workspace
                  .members.length,

              maxMembers: 20,
            },
          };
        }
      );

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      // ==========================================================
      // EXISTING PERSONAL PAYMENT RESPONSE
      // ==========================================================

      payments:
        formattedPayments,

      // ==========================================================
      // NEW B2B TEAM PAYMENT RESPONSE
      // ==========================================================

      teamPayments:
        formattedTeamPayments,

      summary: {
        scope,

        personal: {
          successful:
            successfulCount,

          failed:
            failedCount,

          pending:
            pendingCount,

          revenue: {
            currency:
              "INR",

            total:
              totalRevenue,

            thisMonth:
              monthlyRevenue,

            today:
              todayRevenue,
          },
        },

        team: {
          successful:
            successfulTeamCount,

          failed:
            failedTeamCount,

          pending:
            pendingTeamCount,

          revenue: {
            currency:
              "INR",

            total:
              totalTeamRevenue,

            thisMonth:
              monthlyTeamRevenue,

            today:
              todayTeamRevenue,

            totalPaise:
              totalTeamRevenuePaise,

            thisMonthPaise:
              monthlyTeamRevenuePaise,

            todayPaise:
              todayTeamRevenuePaise,
          },
        },

        // Combined figures are useful for the Founder dashboard,
        // but the personal and Team figures remain separately visible.
        combined: {
          successful:
            successfulCount +
            successfulTeamCount,

          failed:
            failedCount +
            failedTeamCount,

          pending:
            pendingCount +
            pendingTeamCount,

          revenue: {
            currency:
              "INR",

            total:
              totalRevenue +
              totalTeamRevenue,

            thisMonth:
              monthlyRevenue +
              monthlyTeamRevenue,

            today:
              todayRevenue +
              todayTeamRevenue,
          },
        },
      },

      filters: {
        search:
          search || null,

        status:
          isAllowedStatus(
            status
          )
            ? status
            : null,

        billingCycle:
          isAllowedBillingCycle(
            billingCycle
          )
            ? billingCycle
            : null,

        scope,
      },

      pagination: {
        page,

        limit,

        total:
          personalTotal,

        totalPages:
          Math.ceil(
            personalTotal /
              limit
          ),

        hasNextPage:
          page * limit <
          personalTotal,

        hasPreviousPage:
          page > 1,
      },

      teamPagination: {
        page,

        limit,

        total:
          teamTotal,

        totalPages:
          Math.ceil(
            teamTotal /
              limit
          ),

        hasNextPage:
          page * limit <
          teamTotal,

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
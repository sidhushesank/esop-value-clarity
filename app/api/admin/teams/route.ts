import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const MAX_TEAM_MEMBERS = 20;

const allowedStatuses = [
  "ALL",
  "ACTIVE",
  "EXPIRED",
] as const;

type TeamStatus =
  (typeof allowedStatuses)[number];

function isAllowedStatus(
  value: string | null
): value is TeamStatus {
  return (
    value !== null &&
    allowedStatuses.includes(
      value as TeamStatus
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

    const rawStatus =
      searchParams.get("status");

    const status =
      isAllowedStatus(rawStatus)
        ? rawStatus
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
          ) || "20"
        ),
        1
      ),
      100
    );

    const skip =
      (page - 1) * limit;

    // ============================================================
    // BUILD FILTER
    // ============================================================

    const where: any = {
      AND: [],
    };

    if (search) {
      where.AND.push({
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            owner: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            owner: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      });
    }

    if (
      status === "ACTIVE" ||
      status === "EXPIRED"
    ) {
      where.AND.push({
        status,
      });
    }

    if (
      where.AND.length === 0
    ) {
      delete where.AND;
    }

    // ============================================================
    // DATE / ENTITLEMENT REFERENCE
    // ============================================================

    const now = new Date();

    // ============================================================
    // FETCH WORKSPACES + SUMMARY
    // ============================================================

    const [
      workspaces,
      total,
      totalWorkspaces,
      activeWorkspaces,
      expiredWorkspaces,
      activeMembers,
      successfulTeamPayments,
      pendingTeamPayments,
      failedTeamPayments,
    ] = await Promise.all([
      // ----------------------------------------------------------
      // PAGINATED WORKSPACES
      // ----------------------------------------------------------

      prisma.teamWorkspace.findMany({
        where,

        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,

        select: {
          id: true,

          name: true,

          status: true,

          startedAt: true,

          expiresAt: true,

          createdAt: true,

          updatedAt: true,

          owner: {
            select: {
              id: true,

              name: true,

              email: true,

              role: true,

              accountStatus: true,
            },
          },

          members: {
            where: {
              status: "ACTIVE",
            },

            select: {
              id: true,

              userId: true,

              status: true,

              addedAt: true,
            },
          },

          payments: {
            where: {
              status: "SUCCESS",
            },

            orderBy: {
              createdAt: "desc",
            },

            take: 5,

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
            },
          },
        },
      }),

      // ----------------------------------------------------------
      // FILTERED TOTAL
      // ----------------------------------------------------------

      prisma.teamWorkspace.count({
        where,
      }),

      // ----------------------------------------------------------
      // GLOBAL WORKSPACE COUNTS
      // ----------------------------------------------------------

      prisma.teamWorkspace.count(),

      prisma.teamWorkspace.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.teamWorkspace.count({
        where: {
          status: "EXPIRED",
        },
      }),

      // ----------------------------------------------------------
      // ACTIVE TEAM MEMBERS
      // ----------------------------------------------------------

      prisma.teamMembership.count({
        where: {
          status: "ACTIVE",

          workspace: {
            status: "ACTIVE",
          },
        },
      }),

      // ----------------------------------------------------------
      // TEAM PAYMENTS
      // ----------------------------------------------------------

      prisma.teamPayment.count({
        where: {
          status: "SUCCESS",
        },
      }),

      prisma.teamPayment.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.teamPayment.count({
        where: {
          status: "FAILED",
        },
      }),
    ]);

    // ============================================================
    // TEAM REVENUE
    // ============================================================

    const [
      successfulRevenueRows,
      monthlyRevenueRows,
    ] = await Promise.all([
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
            gte: new Date(
              now.getFullYear(),
              now.getMonth(),
              1
            ),
          },
        },

        select: {
          amount: true,
        },
      }),
    ]);

    const totalRevenuePaise =
      successfulRevenueRows.reduce(
        (
          sum,
          payment
        ) =>
          sum + payment.amount,
        0
      );

    const monthlyRevenuePaise =
      monthlyRevenueRows.reduce(
        (
          sum,
          payment
        ) =>
          sum + payment.amount,
        0
      );

    // TeamPayment stores Razorpay values in paise.
    const totalRevenue =
      totalRevenuePaise / 100;

    const monthlyRevenue =
      monthlyRevenuePaise / 100;

    // ============================================================
    // FORMAT WORKSPACES
    // ============================================================

    const formattedWorkspaces =
      workspaces.map(
        (workspace) => {
          const isFounder =
            workspace.owner.email ===
            process.env
              .FOUNDER_EMAIL;

          const memberCount =
            workspace.members.length;

          const remainingSlots =
            Math.max(
              MAX_TEAM_MEMBERS -
                memberCount,
              0
            );

          const isCurrentlyActive =
            workspace.status ===
              "ACTIVE" &&
            (
              isFounder ||
              workspace.expiresAt >
                now
            );

          const latestPayment =
            workspace.payments[0] ??
            null;

          return {
            id:
              workspace.id,

            name:
              workspace.name,

            status:
              workspace.status,

            isFounder,

            access:
              isFounder
                ? "UNLIMITED"
                : isCurrentlyActive
                  ? "ANNUAL"
                  : "EXPIRED",

            startedAt:
              workspace.startedAt,

            expiresAt:
              workspace.expiresAt,

            createdAt:
              workspace.createdAt,

            updatedAt:
              workspace.updatedAt,

            owner: {
              id:
                workspace.owner.id,

              name:
                workspace.owner.name,

              email:
                workspace.owner.email,

              role:
                workspace.owner.role,

              accountStatus:
                workspace.owner
                  .accountStatus,
            },

            members: {
              active:
                memberCount,

              max:
                MAX_TEAM_MEMBERS,

              remaining:
                remainingSlots,

              utilizationPercent:
                Number(
                  (
                    (memberCount /
                      MAX_TEAM_MEMBERS) *
                    100
                  ).toFixed(2)
                ),
            },

            latestPayment:
              latestPayment
                ? {
                    id:
                      latestPayment.id,

                    amountPaise:
                      latestPayment.amount,

                    amount:
                      latestPayment
                        .amount / 100,

                    currency:
                      latestPayment.currency,

                    status:
                      latestPayment.status,

                    razorpayOrderId:
                      latestPayment
                        .razorpayOrderId,

                    razorpayPaymentId:
                      latestPayment
                        .razorpayPaymentId,

                    startedAt:
                      latestPayment.startedAt,

                    expiresAt:
                      latestPayment.expiresAt,

                    createdAt:
                      latestPayment.createdAt,
                  }
                : null,

            successfulPaymentCount:
              workspace.payments.length,
          };
        }
      );

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      generatedAt:
        now,

      summary: {
        customers:
          totalWorkspaces,

        workspaces: {
          total:
            totalWorkspaces,

          active:
            activeWorkspaces,

          expired:
            expiredWorkspaces,
        },

        members: {
          active:
            activeMembers,

          capacityPerWorkspace:
            MAX_TEAM_MEMBERS,

          totalCapacity:
            totalWorkspaces *
            MAX_TEAM_MEMBERS,

          remainingCapacity:
            Math.max(
              totalWorkspaces *
                MAX_TEAM_MEMBERS -
                activeMembers,
              0
            ),

          utilizationPercent:
            totalWorkspaces > 0
              ? Number(
                  (
                    (activeMembers /
                      (totalWorkspaces *
                        MAX_TEAM_MEMBERS)) *
                    100
                  ).toFixed(2)
                )
              : 0,
        },

        payments: {
          successful:
            successfulTeamPayments,

          pending:
            pendingTeamPayments,

          failed:
            failedTeamPayments,

          total:
            successfulTeamPayments +
            pendingTeamPayments +
            failedTeamPayments,
        },

        revenue: {
          currency:
            "INR",

          total:
            totalRevenue,

          thisMonth:
            monthlyRevenue,

          totalPaise:
            totalRevenuePaise,

          thisMonthPaise:
            monthlyRevenuePaise,
        },
      },

      workspaces:
        formattedWorkspaces,

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

      filters: {
        search:
          search || null,

        status,
      },
    });
  } catch (error) {
    console.error(
      "========== ADMIN TEAM WORKSPACES ERROR =========="
    );

    console.error(error);

    console.error(
      "================================================"
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
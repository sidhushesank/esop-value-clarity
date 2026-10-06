import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const TEAM_MEMBER_LIMIT = 20;

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
    // DATE RANGES
    // ============================================================

    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const startOfWeek = new Date(startOfToday);

    startOfWeek.setDate(
      startOfWeek.getDate() - 7
    );

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
      totalUsers -
        activeProSubscriptions,
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
    // PERSONAL PRO REVENUE
    // ============================================================

    const totalRevenue =
      allSuccessfulPayments.reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

    const monthlyRevenue =
      monthSuccessfulPayments.reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

    // ============================================================
    // TEAM INTELLIGENCE
    // ============================================================
    //
    // Team billing is intentionally separate from normal Payment /
    // Subscription billing.
    //
    // TeamPayment.amount is stored in Razorpay paise.
    // Therefore:
    //   14500000 paise = ₹1,45,000
    //
    // Founder workspaces are included in workspace counts but their
    // access is represented separately through the workspace owner.
    //
    // ============================================================

    const [
      totalTeamWorkspaces,
      activeTeamWorkspaces,
      expiredTeamWorkspaces,
      activeTeamMembers,
      totalTeamMemberships,
      successfulTeamPaymentsCount,
      failedTeamPaymentsCount,
      pendingTeamPaymentsCount,
      successfulTeamPayments,
      monthSuccessfulTeamPayments,
    ] = await Promise.all([
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

      prisma.teamMembership.count({
        where: {
          status: "ACTIVE",
          workspace: {
            status: "ACTIVE",
          },
        },
      }),

      prisma.teamMembership.count(),

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

      prisma.teamPayment.findMany({
        where: {
          status: "SUCCESS",
        },

        select: {
          amount: true,
          currency: true,
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
          currency: true,
        },
      }),
    ]);

    const totalTeamRevenuePaise =
      successfulTeamPayments.reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

    const monthlyTeamRevenuePaise =
      monthSuccessfulTeamPayments.reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

    /*
     * TeamPayment stores the Razorpay amount in paise.
     *
     * Expose both values:
     * - raw paise for audit/financial accuracy
     * - display INR for the Admin dashboard
     */
    const totalTeamRevenue =
      totalTeamRevenuePaise / 100;

    const monthlyTeamRevenue =
      monthlyTeamRevenuePaise / 100;

    const teamCapacityTotal =
      totalTeamWorkspaces *
      TEAM_MEMBER_LIMIT;

    const teamCapacityUtilization =
      teamCapacityTotal > 0
        ? Number(
            (
              (activeTeamMembers /
                teamCapacityTotal) *
              100
            ).toFixed(2)
          )
        : 0;

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

    const recentUsers =
      await prisma.user.findMany({
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

          ownedTeamWorkspace: {
            select: {
              id: true,
              name: true,
              status: true,
              expiresAt: true,
            },
          },

          teamMemberships: {
            where: {
              status: "ACTIVE",
            },

            orderBy: {
              addedAt: "desc",
            },

            take: 1,

            select: {
              id: true,
              addedAt: true,

              workspace: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  expiresAt: true,
                  ownerId: true,
                },
              },
            },
          },
        },
      });

    const formattedRecentUsers =
      recentUsers.map((user) => {
        const isFounder =
          user.email ===
          process.env.FOUNDER_EMAIL;

        const isPersonalPro =
          user.subscription?.plan ===
            "PRO" &&
          user.subscription.status ===
            "ACTIVE" &&
          (!user.subscription
            .expiresAt ||
            user.subscription
              .expiresAt > now);

        const isTeamAdmin =
          Boolean(
            user.ownedTeamWorkspace
          );

        const activeMembership =
          user.teamMemberships[0] ??
          null;

        const isTeamMember =
          Boolean(
            activeMembership?.workspace &&
              activeMembership.workspace
                .status ===
                "ACTIVE" &&
              activeMembership.workspace
                .ownerId !== user.id
          );

        const effectivePro =
          isFounder ||
          isPersonalPro ||
          isTeamMember;

        let accessSource:
          | "FOUNDER"
          | "PAYMENT"
          | "ADMIN_GRANT"
          | "TEAM_SPONSORED"
          | null =
          null;

        if (isFounder) {
          accessSource = "FOUNDER";
        } else if (isTeamMember) {
          accessSource =
            "TEAM_SPONSORED";
        } else if (
          isPersonalPro &&
          user.subscription
        ) {
          accessSource =
            user.subscription.source ===
            "ADMIN_GRANT"
              ? "ADMIN_GRANT"
              : "PAYMENT";
        }

        const teamWorkspace =
          isTeamAdmin
            ? user.ownedTeamWorkspace
            : activeMembership?.workspace ??
              null;

        return {
          id: user.id,

          name: user.name,

          email: user.email,

          role: user.role,

          accountStatus:
            user.accountStatus,

          plan: effectivePro
            ? "PRO"
            : "FREE",

          accessSource,

          isFounder,

          isTeamAdmin,

          isTeamMember,

          teamRole: isTeamAdmin
            ? "TEAM_ADMIN"
            : isTeamMember
              ? "TEAM_MEMBER"
              : null,

          teamWorkspace:
            teamWorkspace
              ? {
                  id: teamWorkspace.id,
                  name: teamWorkspace.name,
                  status:
                    teamWorkspace.status,
                  expiresAt:
                    teamWorkspace.expiresAt,
                }
              : null,

          source:
            isPersonalPro &&
            user.subscription
              ? user.subscription
                  .source
              : null,

          createdAt:
            user.createdAt,

          lastLoginAt:
            user.lastLoginAt,
        };
      });

    // ============================================================
    // RECENT ACTIVITY
    // ============================================================

    const recentActivity =
      await prisma.userActivity.findMany(
        {
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
        }
      );

    // ============================================================
    // RECENT PERSONAL PAYMENTS
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
    // RECENT TEAM WORKSPACES
    // ============================================================

    const recentTeamWorkspaces =
      await prisma.teamWorkspace.findMany(
        {
          orderBy: {
            createdAt: "desc",
          },

          take: 8,

          select: {
            id: true,

            name: true,

            status: true,

            startedAt: true,

            expiresAt: true,

            createdAt: true,

            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            members: {
              where: {
                status: "ACTIVE",
              },

              select: {
                id: true,
                userId: true,
                addedAt: true,

                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },

            payments: {
              where: {
                status: "SUCCESS",
              },

              orderBy: {
                createdAt: "desc",
              },

              take: 1,

              select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                razorpayPaymentId: true,
                createdAt: true,
              },
            },
          },
        }
      );

    const formattedRecentTeamWorkspaces =
      recentTeamWorkspaces.map(
        (workspace) => {
          const isFounder =
            workspace.owner.email ===
            process.env.FOUNDER_EMAIL;

          const memberCount =
            workspace.members.length;

          const successfulTeamPayment =
            workspace.payments[0] ??
            null;

          const paymentAmountPaise =
            successfulTeamPayment
              ?.amount ?? 0;

          return {
            id: workspace.id,

            name: workspace.name,

            status:
              workspace.status,

            isFounder,

            access:
              isFounder
                ? "UNLIMITED"
                : "ANNUAL",

            startedAt:
              workspace.startedAt,

            expiresAt:
              workspace.expiresAt,

            createdAt:
              workspace.createdAt,

            owner: {
              id: workspace
                .owner.id,

              name: workspace
                .owner.name,

              email: workspace
                .owner.email,
            },

            members: {
              active:
                memberCount,

              max:
                TEAM_MEMBER_LIMIT,

              remaining:
                Math.max(
                  TEAM_MEMBER_LIMIT -
                    memberCount,
                  0
                ),
            },

            payment:
              successfulTeamPayment
                ? {
                    id:
                      successfulTeamPayment.id,

                    amountPaise:
                      paymentAmountPaise,

                    amount:
                      paymentAmountPaise /
                      100,

                    currency:
                      successfulTeamPayment.currency,

                    status:
                      successfulTeamPayment.status,

                    razorpayPaymentId:
                      successfulTeamPayment.razorpayPaymentId,

                    createdAt:
                      successfulTeamPayment.createdAt,
                  }
                : null,
          };
        }
      );

    // ============================================================
    // RECENT TEAM PAYMENTS
    // ============================================================

    const recentTeamPayments =
      await prisma.teamPayment.findMany(
        {
          orderBy: {
            createdAt: "desc",
          },

          take: 8,

          select: {
            id: true,

            amount: true,
            currency: true,

            status: true,

            razorpayOrderId: true,
            razorpayPaymentId: true,

            startedAt: true,
            expiresAt: true,

            createdAt: true,

            workspace: {
              select: {
                id: true,
                name: true,
                status: true,

                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },

            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }
      );

    const formattedRecentTeamPayments =
      recentTeamPayments.map(
        (payment) => ({
          id: payment.id,

          amountPaise:
            payment.amount,

          amount:
            payment.amount / 100,

          currency:
            payment.currency,

          status:
            payment.status,

          razorpayOrderId:
            payment.razorpayOrderId,

          razorpayPaymentId:
            payment.razorpayPaymentId,

          startedAt:
            payment.startedAt,

          expiresAt:
            payment.expiresAt,

          createdAt:
            payment.createdAt,

          workspace: {
            id:
              payment.workspace.id,

            name:
              payment.workspace.name,

            status:
              payment.workspace.status,

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
          },

          purchaser: {
            id:
              payment.user.id,

            name:
              payment.user.name,

            email:
              payment.user.email,
          },
        })
      );

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      generatedAt: now,

      stats: {
        // --------------------------------------------------------
        // USERS
        // --------------------------------------------------------

        users: {
          total: totalUsers,

          active:
            activeUsers,

          suspended:
            suspendedUsers,

          admins:
            adminUsers,

          free:
            freeUsers,

          pro:
            activeProSubscriptions,

          newToday:
            newUsersToday,

          newThisWeek:
            newUsersThisWeek,

          newThisMonth:
            newUsersThisMonth,
        },

        // --------------------------------------------------------
        // PERSONAL SUBSCRIPTIONS
        // --------------------------------------------------------

        subscriptions: {
          activePro:
            activeProSubscriptions,

          paidPro:
            paidPro,

          adminGrantedPro:
            adminGrantedPro,

          cancelled:
            cancelledSubscriptions,

          expired:
            expiredSubscriptions,
        },

        // --------------------------------------------------------
        // PERSONAL PAYMENTS
        // --------------------------------------------------------

        payments: {
          successful:
            successfulPayments,

          failed:
            failedPayments,

          pending:
            pendingPayments,
        },

        // --------------------------------------------------------
        // PERSONAL REVENUE
        // --------------------------------------------------------

        revenue: {
          currency: "INR",

          /*
           * Preserves your existing Payment revenue behavior.
           */
          total:
            totalRevenue,

          thisMonth:
            monthlyRevenue,
        },

        // --------------------------------------------------------
        // PRODUCT USAGE
        // --------------------------------------------------------

        product: {
          calculations:
            totalCalculations,

          calculationsToday:
            calculationsToday,

          activities:
            totalActivities,
        },

        // --------------------------------------------------------
        // TEAM INTELLIGENCE
        // --------------------------------------------------------

        team: {
          // One workspace per purchaser.
          customers:
            totalTeamWorkspaces,

          workspaces: {
            total:
              totalTeamWorkspaces,

            active:
              activeTeamWorkspaces,

            expired:
              expiredTeamWorkspaces,
          },

          sponsoredMembers:
            activeTeamMembers,

          totalMembershipRecords:
            totalTeamMemberships,

          capacity: {
            maxPerWorkspace:
              TEAM_MEMBER_LIMIT,

            used:
              activeTeamMembers,

            total:
              teamCapacityTotal,

            remaining:
              Math.max(
                teamCapacityTotal -
                  activeTeamMembers,
                0
              ),

            utilizationPercent:
              teamCapacityUtilization,
          },

          payments: {
            successful:
              successfulTeamPaymentsCount,

            failed:
              failedTeamPaymentsCount,

            pending:
              pendingTeamPaymentsCount,

            total:
              successfulTeamPaymentsCount +
              failedTeamPaymentsCount +
              pendingTeamPaymentsCount,
          },

          revenue: {
            currency: "INR",

            /*
             * Display-ready INR values.
             */
            total:
              totalTeamRevenue,

            thisMonth:
              monthlyTeamRevenue,

            /*
             * Exact stored Razorpay amounts.
             */
            totalPaise:
              totalTeamRevenuePaise,

            thisMonthPaise:
              monthlyTeamRevenuePaise,
          },
        },
      },

      // ==========================================================
      // RECENT DATA
      // ==========================================================

      recentUsers:
        formattedRecentUsers,

      recentActivity,

      recentPayments,

      recentTeamWorkspaces:
        formattedRecentTeamWorkspaces,

      recentTeamPayments:
        formattedRecentTeamPayments,
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
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
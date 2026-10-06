import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const MAX_TEAM_MEMBERS = 20;

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      workspaceId: string;
    }>;
  }
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

    const { workspaceId } =
      await context.params;

    // ============================================================
    // FIND WORKSPACE
    // ============================================================

    const workspace =
      await prisma.teamWorkspace.findUnique({
        where: {
          id: workspaceId,
        },

        select: {
          id: true,

          name: true,

          status: true,

          startedAt: true,

          expiresAt: true,

          createdAt: true,

          updatedAt: true,

          // ======================================================
          // OWNER
          // ======================================================

          owner: {
            select: {
              id: true,

              name: true,

              email: true,

              role: true,

              accountStatus: true,

              emailVerified: true,

              createdAt: true,

              lastLoginAt: true,

              lastActiveAt: true,

              subscription: {
                select: {
                  plan: true,

                  status: true,

                  source: true,

                  billingCycle: true,

                  expiresAt: true,
                },
              },
            },
          },

          // ======================================================
          // MEMBERS
          // ======================================================

          members: {
            orderBy: {
              addedAt: "asc",
            },

            select: {
              id: true,

              userId: true,

              status: true,

              addedAt: true,

              removedAt: true,

              createdAt: true,

              updatedAt: true,

              user: {
                select: {
                  id: true,

                  name: true,

                  email: true,

                  role: true,

                  accountStatus: true,

                  emailVerified: true,

                  createdAt: true,

                  lastLoginAt: true,

                  lastActiveAt: true,

                  subscription: {
                    select: {
                      plan: true,

                      status: true,

                      source: true,

                      billingCycle:
                        true,

                      expiresAt: true,
                    },
                  },
                },
              },
            },
          },

          // ======================================================
          // TEAM PAYMENTS
          // ======================================================

          payments: {
            orderBy: {
              createdAt: "desc",
            },

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
                },
              },
            },
          },
        },
      });

    // ============================================================
    // WORKSPACE NOT FOUND
    // ============================================================

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,

          code:
            "TEAM_WORKSPACE_NOT_FOUND",

          message:
            "The Team Workspace could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // CURRENT TIME
    // ============================================================

    const now = new Date();

    const isFounder =
      workspace.owner.email ===
      process.env.FOUNDER_EMAIL;

    // ============================================================
    // ACCESS
    // ============================================================

    const isCurrentlyActive =
      workspace.status ===
        "ACTIVE" &&
      (
        isFounder ||
        workspace.expiresAt >
          now
      );

    const access =
      isFounder
        ? "UNLIMITED"
        : isCurrentlyActive
          ? "ANNUAL"
          : "EXPIRED";

    // ============================================================
    // MEMBER COUNTS
    // ============================================================

    const activeMembers =
      workspace.members.filter(
        (member) =>
          member.status ===
          "ACTIVE"
      );

    const memberCount =
      activeMembers.length;

    const remainingSlots =
      Math.max(
        MAX_TEAM_MEMBERS -
          memberCount,
        0
      );

    const utilizationPercent =
      Number(
        (
          (memberCount /
            MAX_TEAM_MEMBERS) *
          100
        ).toFixed(2)
      );

    // ============================================================
    // PAYMENT SUMMARY
    // ============================================================

    const successfulPayments =
      workspace.payments.filter(
        (payment) =>
          payment.status ===
          "SUCCESS"
      );

    const pendingPayments =
      workspace.payments.filter(
        (payment) =>
          payment.status ===
          "PENDING"
      );

    const failedPayments =
      workspace.payments.filter(
        (payment) =>
          payment.status ===
          "FAILED"
      );

    const totalRevenuePaise =
      successfulPayments.reduce(
        (
          sum,
          payment
        ) =>
          sum + payment.amount,
        0
      );

    const latestSuccessfulPayment =
      successfulPayments[0] ??
      null;

    // ============================================================
    // MEMBER SERIALIZATION
    // ============================================================

    const formattedMembers =
      workspace.members.map(
        (membership) => {
          const member =
            membership.user;

          const memberIsFounder =
            member.email ===
            process.env.FOUNDER_EMAIL;

          const personalProActive =
            member.subscription
              ?.plan ===
              "PRO" &&
            (
              member.subscription
                .status ===
                "ACTIVE" ||
              member.subscription
                .status ===
                "CANCELLED"
            ) &&
            (
              !member.subscription
                .expiresAt ||
              member.subscription
                .expiresAt >
                now
            );

          const memberTeamSponsored =
            membership.status ===
              "ACTIVE" &&
            workspace.status ===
              "ACTIVE" &&
            (
              isFounder ||
              workspace.expiresAt >
                now
            );

          const effectivePro =
            memberIsFounder ||
            personalProActive ||
            memberTeamSponsored;

          let accessSource:
            | "FOUNDER"
            | "PERSONAL_PRO"
            | "TEAM_SPONSORED"
            | "NONE";

          if (memberIsFounder) {
            accessSource =
              "FOUNDER";
          } else if (
            personalProActive
          ) {
            accessSource =
              "PERSONAL_PRO";
          } else if (
            memberTeamSponsored
          ) {
            accessSource =
              "TEAM_SPONSORED";
          } else {
            accessSource =
              "NONE";
          }

          return {
            membershipId:
              membership.id,

            userId:
              member.id,

            name:
              member.name,

            email:
              member.email,

            role:
              member.role,

            accountStatus:
              member.accountStatus,

            emailVerified:
              member.emailVerified,

            membershipStatus:
              membership.status,

            addedAt:
              membership.addedAt,

            removedAt:
              membership.removedAt,

            createdAt:
              membership.createdAt,

            updatedAt:
              membership.updatedAt,

            lastLoginAt:
              member.lastLoginAt,

            lastActiveAt:
              member.lastActiveAt,

            joinedAsOwner:
              member.id ===
              workspace.owner.id,

            isFounder:
              memberIsFounder,

            isTeamSponsored:
              memberTeamSponsored,

            isPro:
              effectivePro,

            accessSource,

            subscription:
              member.subscription,
          };
        }
      );

    // ============================================================
    // PAYMENT SERIALIZATION
    // ============================================================

    const formattedPayments =
      workspace.payments.map(
        (payment) => ({
          id:
            payment.id,

          paymentType:
            "TEAM" as const,

          plan:
            "TEAM" as const,

          billingCycle:
            "TEAM_YEARLY" as const,

          amountPaise:
            payment.amount,

          amount:
            payment.amount /
            100,

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

          updatedAt:
            payment.updatedAt,

          purchaser: {
            id:
              payment.user.id,

            name:
              payment.user.name,

            email:
              payment.user.email,
          },

          isLatestSuccessfulPayment:
            latestSuccessfulPayment
              ? latestSuccessfulPayment.id ===
                payment.id
              : false,
        })
      );

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      workspace: {
        id:
          workspace.id,

        name:
          workspace.name,

        status:
          workspace.status,

        access,

        isFounder,

        isCurrentlyActive,

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

          emailVerified:
            workspace.owner
              .emailVerified,

          createdAt:
            workspace.owner
              .createdAt,

          lastLoginAt:
            workspace.owner
              .lastLoginAt,

          lastActiveAt:
            workspace.owner
              .lastActiveAt,

          personalSubscription:
            workspace.owner
              .subscription,
        },

        members: {
          active:
            memberCount,

          total:
            workspace.members
              .length,

          max:
            MAX_TEAM_MEMBERS,

          remaining:
            remainingSlots,

          utilizationPercent,

          records:
            formattedMembers,
        },

        payments: {
          totalRecords:
            workspace.payments
              .length,

          successful:
            successfulPayments
              .length,

          pending:
            pendingPayments
              .length,

          failed:
            failedPayments
              .length,

          totalRevenuePaise,

          totalRevenue:
            totalRevenuePaise /
            100,

          currency:
            workspace.payments[0]
              ?.currency ??
            "INR",

          latestSuccessfulPayment:
            latestSuccessfulPayment
              ? {
                  id:
                    latestSuccessfulPayment
                      .id,

                  amountPaise:
                    latestSuccessfulPayment
                      .amount,

                  amount:
                    latestSuccessfulPayment
                      .amount /
                    100,

                  currency:
                    latestSuccessfulPayment
                      .currency,

                  status:
                    latestSuccessfulPayment
                      .status,

                  razorpayOrderId:
                    latestSuccessfulPayment
                      .razorpayOrderId,

                  razorpayPaymentId:
                    latestSuccessfulPayment
                      .razorpayPaymentId,

                  startedAt:
                    latestSuccessfulPayment
                      .startedAt,

                  expiresAt:
                    latestSuccessfulPayment
                      .expiresAt,

                  createdAt:
                    latestSuccessfulPayment
                      .createdAt,
                }
              : null,

          records:
            formattedPayments,
        },

        entitlement: {
          type:
            isFounder
              ? "FOUNDER"
              : "TEAM_YEARLY",

          label:
            isFounder
              ? "Unlimited Founder Access"
              : "Annual Team Intelligence",

          maxMembers:
            MAX_TEAM_MEMBERS,

          startedAt:
            workspace.startedAt,

          expiresAt:
            isFounder
              ? null
              : workspace.expiresAt,

          renewalRequired:
            !isFounder &&
            workspace.status ===
              "EXPIRED",
        },
      },
    });
  } catch (error) {
    console.error(
      "========== ADMIN TEAM WORKSPACE DETAIL ERROR =========="
    );

    console.error(error);

    console.error(
      "======================================================"
    );

    return NextResponse.json(
      {
        success: false,

        code:
          "ADMIN_TEAM_WORKSPACE_LOAD_FAILED",

        message:
          "We could not load the Team Workspace.",
      },
      {
        status: 500,
      }
    );
  }
}
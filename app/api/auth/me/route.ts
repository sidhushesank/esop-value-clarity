import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { getUserSubscription } from "@/lib/subscription";

export async function GET(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. GET JWT
    |--------------------------------------------------------------------------
    */

    const token =
      request.cookies.get(
        "token"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Not authenticated",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 2. RESOLVE USER ID
    |--------------------------------------------------------------------------
    */

    const userId =
      await getSessionUserId(token);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 3. LOAD USER + EXISTING ACCOUNT DATA
    |--------------------------------------------------------------------------
    */

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        include: {
          calculations: true,
          subscription: true,

          /*
           * Owned Team Workspace.
           *
           * This is intentionally loaded separately from the effective
           * subscription resolver because founder access deliberately does
           * not mutate personal subscription state.
           */
          ownedTeamWorkspace: {
            select: {
              id: true,
              name: true,
              status: true,
              startedAt: true,
              expiresAt: true,
            },
          },

          /*
           * Team memberships are needed so a sponsored member can receive
           * the correct identity badge and workspace information.
           */
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
              status: true,
              addedAt: true,

              workspace: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  startedAt: true,
                  expiresAt: true,
                  ownerId: true,
                },
              },
            },
          },
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 4. ACCOUNT STATUS
    |--------------------------------------------------------------------------
    */

    if (
      user.accountStatus ===
      "SUSPENDED"
    ) {
      const response =
        NextResponse.json(
          {
            success: false,
            message:
              "This account has been suspended. Please contact support.",
          },
          {
            status: 403,
          }
        );

      response.cookies.set(
        "token",
        "",
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            "production",
          sameSite: "lax",
          expires: new Date(0),
          path: "/",
        }
      );

      return response;
    }

    /*
    |--------------------------------------------------------------------------
    | 5. EXISTING USER STATISTICS
    |--------------------------------------------------------------------------
    */

    const totalSimulations =
      user.calculations.length;

    const portfolioValue =
      user.calculations.reduce(
        (sum, calc) =>
          sum + calc.exitValue,
        0
      );

    const highestExit =
      user.calculations.length > 0
        ? Math.max(
            ...user.calculations.map(
              (calculation) =>
                calculation.exitValue
            )
          )
        : 0;

    /*
    |--------------------------------------------------------------------------
    | 6. RESOLVE EFFECTIVE SUBSCRIPTION
    |--------------------------------------------------------------------------
    */

    const subscription =
      await getUserSubscription(
        user.id
      );

    /*
    |--------------------------------------------------------------------------
    | 7. RESOLVE TEAM RELATIONSHIP
    |--------------------------------------------------------------------------
    |
    | Founder:
    |   ownedTeamWorkspace -> Team Admin
    |
    | Sponsored member:
    |   teamMemberships -> Team Member
    |
    | Normal PRO:
    |   neither
    |
    */

    const ownedTeamWorkspace =
      user.ownedTeamWorkspace;

    const activeMembership =
      user.teamMemberships[0] ??
      null;

    const isFounder =
      subscription.isFounder;

    const isTeamAdmin =
      Boolean(
        ownedTeamWorkspace &&
          ownedTeamWorkspace.status ===
            "ACTIVE"
      );

    const isTeamMember =
      Boolean(
        activeMembership?.workspace &&
          activeMembership.workspace
            .status === "ACTIVE" &&
          activeMembership.workspace
            .ownerId !== user.id
      );

    /*
     * Team sponsorship should identify a genuine sponsored member, not the
     * purchaser/admin. Founder access is its own identity state.
     */
    const isTeamSponsored =
      subscription.isTeamSponsored ||
      isTeamMember;

    /*
     * The workspace exposed to the client should be:
     *
     * 1. owned workspace for Team Admin
     * 2. active membership workspace for Team Member
     * 3. null otherwise
     */
    const resolvedTeamWorkspace =
      isTeamAdmin
        ? ownedTeamWorkspace
        : isTeamMember
          ? activeMembership?.workspace ??
            null
          : null;

    /*
     * Explicit relationship for UI badges.
     */
    const teamRole:
      | "TEAM_ADMIN"
      | "TEAM_MEMBER"
      | null =
      isTeamAdmin
        ? "TEAM_ADMIN"
        : isTeamMember
          ? "TEAM_MEMBER"
          : null;

    /*
    |--------------------------------------------------------------------------
    | 8. RETURN ACCOUNT INFORMATION
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success: true,

      user: {
        id: user.id,

        name: user.name,

        email: user.email,

        createdAt:
          user.createdAt,

        /*
        |--------------------------------------------------------------------------
        | ACCOUNT / ADMIN
        |--------------------------------------------------------------------------
        */

        role: user.role,

        accountStatus:
          user.accountStatus,

        lastLoginAt:
          user.lastLoginAt,

        lastActiveAt:
          user.lastActiveAt,

        /*
        |--------------------------------------------------------------------------
        | USER STATISTICS
        |--------------------------------------------------------------------------
        */

        stats: {
          totalSimulations,

          portfolioValue,

          highestExit,
        },

        /*
        |--------------------------------------------------------------------------
        | EFFECTIVE ACCOUNT ACCESS
        |--------------------------------------------------------------------------
        */

        account: {
          verified:
            user.emailVerified,

          plan:
            subscription.plan,

          status:
            subscription.status,

          isPro:
            subscription.isPro,

          isFounder,

          isTeamSponsored,

          isTeamAdmin,

          isTeamMember,

          teamRole,

          /*
           * Founder Team Admin should not be shown a customer-style annual
           * personal/team expiry in the UI.
           */
          expiresAt:
            isFounder
              ? null
              : subscription
                  .subscription
                  ?.expiresAt ??
                resolvedTeamWorkspace
                  ?.expiresAt ??
                null,

          billingCycle:
            subscription
              .subscription
              ?.billingCycle ??
            null,

          canCancel:
            subscription
              .subscription
              ?.status ===
              "ACTIVE" &&
            subscription.plan ===
              "PRO",

          isCancelled:
            subscription
              .subscription
              ?.status ===
            "CANCELLED",

          /*
          |--------------------------------------------------------------------------
          | TEAM ENTITLEMENT
          |--------------------------------------------------------------------------
          */

          teamWorkspace:
            resolvedTeamWorkspace
              ? {
                  id:
                    resolvedTeamWorkspace.id,

                  name:
                    resolvedTeamWorkspace.name,

                  startedAt:
                    resolvedTeamWorkspace.startedAt,

                  expiresAt:
                    resolvedTeamWorkspace.expiresAt,

                  status:
                    resolvedTeamWorkspace.status,
                }
              : null,
        },
      },
    });
  } catch (error) {
    console.error(
      "========== AUTH ME ERROR =========="
    );

    console.error(error);

    console.error(
      "==================================="
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
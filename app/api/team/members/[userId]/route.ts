import { NextResponse } from "next/server";

import {
  getProAccessErrorResponse,
  requireTeamAdmin,
} from "@/lib/pro-access";
import { prisma } from "@/lib/prisma";
import { buildTeamMemberIntelligence } from "@/lib/team/member-intelligence";

/**
 * GET /api/team/members/[userId]
 *
 * Returns the real persisted EVC intelligence for one member of the
 * authenticated Team Admin's workspace.
 *
 * IMPORTANT:
 * - Team Admin only.
 * - The requested user must belong to THIS workspace.
 * - No arbitrary user lookup is permitted.
 * - No browser localStorage from the member is accessed.
 * - No fake/demo metrics are generated.
 */
export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      userId: string;
    }>;
  }
) {
  try {
    const { workspace } = await requireTeamAdmin();

    const { userId } = await context.params;

    if (!userId?.trim()) {
      return NextResponse.json(
        {
          success: false,
          code: "TEAM_MEMBER_ID_REQUIRED",
          message: "A team member user ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * Verify that the requested user is an ACTIVE member of the
     * authenticated admin's workspace.
     */
    const membership =
      await prisma.teamMembership.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId,
          },
        },
        select: {
          id: true,
          status: true,
          addedAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          workspace: {
            select: {
              id: true,
              name: true,
              status: true,
              expiresAt: true,
            },
          },
        },
      });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          code: "TEAM_MEMBER_NOT_FOUND",
          message:
            "This user is not a member of your Team Workspace.",
        },
        {
          status: 404,
        }
      );
    }

    if (membership.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          code: "TEAM_MEMBER_INACTIVE",
          message:
            "This Team membership is no longer active.",
        },
        {
          status: 403,
        }
      );
    }

    const now = new Date();

    if (
      membership.workspace.status !== "ACTIVE" ||
      membership.workspace.expiresAt <= now
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "TEAM_WORKSPACE_EXPIRED",
          message:
            "Your Team Workspace has expired. Please renew the Team plan to continue.",
        },
        {
          status: 403,
        }
      );
    }

    /**
     * Build the member intelligence from persisted EVC records.
     */
    const intelligence =
      await buildTeamMemberIntelligence({
        workspaceId:
          membership.workspace.id,
        workspaceName:
          membership.workspace.name,
        workspaceExpiresAt:
          membership.workspace.expiresAt,
        membershipId: membership.id,
        memberUserId: membership.user.id,
      });

    if (!intelligence) {
      return NextResponse.json(
        {
          success: false,
          code: "TEAM_MEMBER_DATA_NOT_FOUND",
          message:
            "The selected member's EVC data could not be loaded.",
        },
        {
          status: 404,
        }
      );
    }

    /**
     * Keep the membership timestamp authoritative from the current
     * workspace relation rather than relying on a secondary lookup.
     *
     * This also means the API response remains fully consistent with
     * the membership that was authorized above.
     */
    intelligence.membership.addedAt =
      membership.addedAt.toISOString();

    return NextResponse.json({
      success: true,

      member: intelligence,

      meta: {
        source: "PERSISTED_EVC_DATA",
        workspaceId:
          membership.workspace.id,
        retrievedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const accessError =
      getProAccessErrorResponse(error);

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        {
          status: accessError.status,
        }
      );
    }

    console.error(
      "[TEAM_MEMBER_INTELLIGENCE_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "TEAM_MEMBER_INTELLIGENCE_LOAD_FAILED",
        message:
          "We could not load this member's EVC intelligence.",
      },
      {
        status: 500,
      }
    );
  }
}
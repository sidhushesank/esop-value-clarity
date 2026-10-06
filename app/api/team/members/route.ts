import { NextResponse } from "next/server";

import {
  getProAccessErrorResponse,
  requireTeamAdmin,
} from "@/lib/pro-access";
import { prisma } from "@/lib/prisma";

const MAX_TEAM_MEMBERS = 20;

function normalizeEmail(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

/**
 * POST /api/team/members
 *
 * Adds an already-registered EVC user to the Team Admin's workspace.
 *
 * The member's personal Subscription record is not changed.
 * Active membership itself is the Team-sponsored PRO entitlement.
 */
export async function POST(request: Request) {
  try {
    const { user: admin, workspace } =
      await requireTeamAdmin();

    const body = await request.json().catch(() => null);
    const email = normalizeEmail(body?.email);

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          code: "MEMBER_EMAIL_REQUIRED",
          message: "Please enter the registered member's EVC email address.",
        },
        { status: 400 }
      );
    }

    const memberUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
      },
    });

    // The Team Admin may add only users who already have EVC accounts.
    if (!memberUser) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_REGISTERED",
          message:
            "This email is not registered with EVC. The user must sign up first.",
        },
        { status: 404 }
      );
    }

    if (memberUser.accountStatus !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          code: "USER_ACCOUNT_INACTIVE",
          message:
            "This EVC account is not currently active and cannot be added to the workspace.",
        },
        { status: 403 }
      );
    }

    // Owner is the administrator, not a TeamMembership seat.
    if (memberUser.id === admin.id) {
      return NextResponse.json(
        {
          success: false,
          code: "OWNER_CANNOT_BE_MEMBER",
          message:
            "The Team Admin already owns this workspace and does not need to be added as a member.",
        },
        { status: 400 }
      );
    }

    const existingMembership =
      await prisma.teamMembership.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: memberUser.id,
          },
        },
        select: {
          id: true,
          status: true,
          addedAt: true,
        },
      });

    if (
      existingMembership?.status === "ACTIVE"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "MEMBER_ALREADY_ADDED",
          message:
            "This user is already an active member of your Team Workspace.",
        },
        { status: 409 }
      );
    }

    const membership =
      await prisma.$transaction(
        async (tx) => {
          const activeMemberCount =
            await tx.teamMembership.count({
              where: {
                workspaceId: workspace.id,
                status: "ACTIVE",
              },
            });

          if (
            activeMemberCount >=
            MAX_TEAM_MEMBERS
          ) {
            return null;
          }

          if (existingMembership) {
            return tx.teamMembership.update({
              where: {
                id: existingMembership.id,
              },
              data: {
                status: "ACTIVE",
                addedAt: new Date(),
                removedAt: null,
              },
              select: {
                id: true,
                status: true,
                addedAt: true,
                removedAt: true,
              },
            });
          }

          return tx.teamMembership.create({
            data: {
              workspaceId: workspace.id,
              userId: memberUser.id,
              status: "ACTIVE",
            },
            select: {
              id: true,
              status: true,
              addedAt: true,
              removedAt: true,
            },
          });
        }
      );

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          code: "TEAM_MEMBER_LIMIT_REACHED",
          message:
            `This Team Workspace already has the maximum of ${MAX_TEAM_MEMBERS} active members.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        member: {
          membershipId: membership.id,
          userId: memberUser.id,
          name: memberUser.name,
          email: memberUser.email,
          status: membership.status,
          addedAt: membership.addedAt,
          teamSponsoredPro: true,
          workspaceId: workspace.id,
        },
      },
      { status: existingMembership ? 200 : 201 }
    );
  } catch (error) {
    const accessError =
      getProAccessErrorResponse(error);

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        { status: accessError.status }
      );
    }

    console.error(
      "[TEAM_MEMBER_ADD_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "TEAM_MEMBER_ADD_FAILED",
        message:
          "We could not add this member to the Team Workspace.",
      },
      { status: 500 }
    );
  }
}

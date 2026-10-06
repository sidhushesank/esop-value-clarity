import { NextResponse } from "next/server";

import {
  getProAccessErrorResponse,
  requireAuthenticatedUser,
  requireTeamAdmin,
} from "@/lib/pro-access";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/subscription";

const MAX_TEAM_MEMBERS = 20;
const TEAM_PRICE_PAISE = 14500000;
const TEAM_TERM_MONTHS = 12;

const DEFAULT_WORKSPACE_NAME =
  "Team Intelligence Workspace";

function normalizeWorkspaceName(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ")
    : "";
}

function getAnnualExpiryDate(
  startedAt: Date
): Date {
  const expiresAt = new Date(
    startedAt
  );

  expiresAt.setFullYear(
    expiresAt.getFullYear() + 1
  );

  return expiresAt;
}

function serializeWorkspace(
  workspace: {
    id: string;
    name: string;
    status: string;
    startedAt: Date;
    expiresAt: Date;
    members: Array<{
      id: string;
      status: string;
      addedAt: Date;
      user: {
        id: string;
        name: string;
        email: string;
      };
    }>;
  }
) {
  const activeMembers =
    workspace.members.filter(
      (member) =>
        member.status === "ACTIVE"
    );

  return {
    id: workspace.id,
    name: workspace.name,
    status: workspace.status,
    startedAt: workspace.startedAt,
    expiresAt: workspace.expiresAt,

    limits: {
      maxMembers:
        MAX_TEAM_MEMBERS,

      memberCount:
        activeMembers.length,

      remainingSlots: Math.max(
        MAX_TEAM_MEMBERS -
          activeMembers.length,
        0
      ),
    },

    members:
      activeMembers.map(
        (member) => ({
          membershipId:
            member.id,

          userId:
            member.user.id,

          name:
            member.user.name,

          email:
            member.user.email,

          addedAt:
            member.addedAt,

          status:
            member.status,
        })
      ),
  };
}

/*
 * |--------------------------------------------------------------------------
 * | GET /api/team
 * |--------------------------------------------------------------------------
 *
 * Returns the authenticated Team Admin's single Team Workspace.
 *
 * Team members do not pass requireTeamAdmin() and therefore cannot use this
 * endpoint to inspect the Team Workspace.
 *
 */
export async function GET() {
  try {
    const {
      workspace,
      isFounder,
    } =
      await requireTeamAdmin();

    const currentWorkspace =
      await prisma.teamWorkspace.findUnique(
        {
          where: {
            id: workspace.id,
          },

          select: {
            id: true,
            name: true,
            status: true,
            startedAt: true,
            expiresAt: true,

            members: {
              where: {
                status: "ACTIVE",
              },

              orderBy: {
                addedAt: "asc",
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
              },
            },
          },
        }
      );

    if (!currentWorkspace) {
      return NextResponse.json(
        {
          success: false,
          code:
            "TEAM_WORKSPACE_NOT_FOUND",
          message:
            "Your Team Workspace could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      workspace:
        serializeWorkspace(
          currentWorkspace
        ),

      access: {
        isFounder,
        unlimited:
          isFounder,
      },

      pricing: {
        amountPaise:
          TEAM_PRICE_PAISE,

        displayAmount:
          145000,

        currency: "INR",

        termMonths:
          TEAM_TERM_MONTHS,
      },
    });
  } catch (error) {
    const accessError =
      getProAccessErrorResponse(
        error
      );

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        {
          status:
            accessError.status,
        }
      );
    }

    console.error(
      "[TEAM_WORKSPACE_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "TEAM_WORKSPACE_LOAD_FAILED",
        message:
          "We could not load your Team Workspace.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * |--------------------------------------------------------------------------
 * | POST /api/team
 * |--------------------------------------------------------------------------
 *
 * Creates the single Team Workspace for the authenticated purchaser.
 *
 * Production purchaser creation is payment-gated.
 *
 * Founder access remains available for testing.
 *
 * NOTE:
 * A verified Team purchase currently creates the workspace automatically
 * using the temporary default name. The PATCH endpoint below is then used
 * by the Team Admin to set the actual workspace name.
 *
 */
export async function POST(
  request: Request
) {
  try {
    const user =
      await requireAuthenticatedUser();

    const existingWorkspace =
      await prisma.teamWorkspace.findUnique(
        {
          where: {
            ownerId: user.id,
          },

          select: {
            id: true,
            name: true,
            status: true,
            startedAt: true,
            expiresAt: true,
          },
        }
      );

    if (existingWorkspace) {
      return NextResponse.json(
        {
          success: false,
          code:
            "TEAM_WORKSPACE_ALREADY_EXISTS",
          message:
            "Your account can have only one Team Workspace.",
          workspace:
            existingWorkspace,
        },
        {
          status: 409,
        }
      );
    }

    const subscription =
      await getUserSubscription(
        user.id
      );

    const isFounder =
      subscription.isFounder;

    if (!isFounder) {
      return NextResponse.json(
        {
          success: false,
          code:
            "TEAM_PURCHASE_REQUIRED",
          message:
            "A verified ₹1,45,000 Team plan purchase is required before creating a Team Workspace.",
        },
        {
          status: 402,
        }
      );
    }

    const body =
      await request
        .json()
        .catch(() => null);

    const name =
      normalizeWorkspaceName(
        body?.name
      );

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          code:
            "WORKSPACE_NAME_REQUIRED",
          message:
            "Please provide a workspace name.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      name.length < 2 ||
      name.length > 80
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_WORKSPACE_NAME",
          message:
            "Workspace name must be between 2 and 80 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const startedAt =
      new Date();

    const expiresAt =
      getAnnualExpiryDate(
        startedAt
      );

    const workspace =
      await prisma.teamWorkspace.create(
        {
          data: {
            name,
            ownerId: user.id,
            status: "ACTIVE",
            startedAt,
            expiresAt,
          },

          select: {
            id: true,
            name: true,
            status: true,
            startedAt: true,
            expiresAt: true,
          },
        }
      );

    return NextResponse.json(
      {
        success: true,

        workspace: {
          ...workspace,

          limits: {
            maxMembers:
              MAX_TEAM_MEMBERS,

            memberCount: 0,

            remainingSlots:
              MAX_TEAM_MEMBERS,
          },
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    const accessError =
      getProAccessErrorResponse(
        error
      );

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        {
          status:
            accessError.status,
        }
      );
    }

    const prismaCode =
      typeof error ===
        "object" &&
      error !== null &&
      "code" in error
        ? String(
            (
              error as {
                code?: unknown;
              }
            ).code ?? ""
          )
        : "";

    if (
      prismaCode === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "TEAM_WORKSPACE_ALREADY_EXISTS",
          message:
            "Your account can have only one Team Workspace.",
        },
        {
          status: 409,
        }
      );
    }

    console.error(
      "[TEAM_WORKSPACE_CREATE_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "TEAM_WORKSPACE_CREATE_FAILED",
        message:
          "We could not create your Team Workspace. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * |--------------------------------------------------------------------------
 * | PATCH /api/team
 * |--------------------------------------------------------------------------
 *
 * Renames the authenticated Team Admin's existing workspace.
 *
 * This is intentionally separated from POST because a successful Team
 * payment already creates the workspace. The buyer then chooses the
 * permanent workspace name.
 *
 */
export async function PATCH(
  request: Request
) {
  try {
    const { user, workspace } =
      await requireTeamAdmin();

    const body =
      await request
        .json()
        .catch(() => null);

    const name =
      normalizeWorkspaceName(
        body?.name
      );

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          code:
            "WORKSPACE_NAME_REQUIRED",
          message:
            "Please provide a workspace name.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      name.length < 2 ||
      name.length > 80
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_WORKSPACE_NAME",
          message:
            "Workspace name must be between 2 and 80 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      workspace.status !==
      "ACTIVE"
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "TEAM_WORKSPACE_NOT_ACTIVE",
          message:
            "Your Team Workspace is not active.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      workspace.expiresAt <=
      new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "TEAM_WORKSPACE_EXPIRED",
          message:
            "Your Team Workspace has expired. Please renew the Team plan.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ownerId comes from requireTeamAdmin(), not from the request body.
     *
     * This prevents a Team Admin from accidentally or deliberately renaming
     * another user's workspace.
     */
    const updatedWorkspace =
      await prisma.teamWorkspace.update({
        where: {
          id: workspace.id,
          ownerId: user.id,
        },

        data: {
          name,
        },

        select: {
          id: true,
          name: true,
          status: true,
          startedAt: true,
          expiresAt: true,

          members: {
            where: {
              status: "ACTIVE",
            },

            orderBy: {
              addedAt: "asc",
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
            },
          },
        },
      });

    return NextResponse.json({
      success: true,

      workspace:
        serializeWorkspace(
          updatedWorkspace
        ),
    });
  } catch (error) {
    const accessError =
      getProAccessErrorResponse(
        error
      );

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        {
          status:
            accessError.status,
        }
      );
    }

    console.error(
      "[TEAM_WORKSPACE_RENAME_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "TEAM_WORKSPACE_RENAME_FAILED",
        message:
          "We could not rename your Team Workspace. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
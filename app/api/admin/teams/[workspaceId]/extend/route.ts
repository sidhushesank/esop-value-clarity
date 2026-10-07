import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type ExtendMode =
  | "1_MONTH"
  | "3_MONTHS"
  | "6_MONTHS"
  | "12_MONTHS"
  | "CUSTOM";

interface ExtendTeamBody {
  mode?: ExtendMode;
  customExpiresAt?: string;
  reason?: string;
}

function isValidMode(
  value: unknown
): value is ExtendMode {
  return (
    value === "1_MONTH" ||
    value === "3_MONTHS" ||
    value === "6_MONTHS" ||
    value === "12_MONTHS" ||
    value === "CUSTOM"
  );
}

function addMonths(
  baseDate: Date,
  months: number
) {
  const result = new Date(baseDate);

  result.setMonth(
    result.getMonth() + months
  );

  return result;
}

function parseCustomExpiry(
  value: unknown
): Date | null {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const parsed = new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed;
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      workspaceId: string;
    }>;
  }
) {
  try {
    // ============================================================
    // 1. REQUIRE ADMIN
    // ============================================================

    const auth =
      await requireAdmin(request);

    if (!auth.success) {
      return auth.response;
    }

    const { workspaceId } =
      await context.params;

    // ============================================================
    // 2. READ REQUEST BODY
    // ============================================================

    let body: ExtendTeamBody;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const mode = body.mode;
    const reason =
      body.reason?.trim() ||
      null;

    // ============================================================
    // 3. VALIDATE MODE
    // ============================================================

    if (!isValidMode(mode)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Team extension option.",
          allowedModes: [
            "1_MONTH",
            "3_MONTHS",
            "6_MONTHS",
            "12_MONTHS",
            "CUSTOM",
          ],
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 4. FIND TEAM WORKSPACE
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

          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              accountStatus: true,
            },
          },
        },
      });

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Team Workspace not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // 5. CALCULATE CURRENT / BASE EXPIRY
    // ============================================================

    const now = new Date();

    /*
     * If an expired workspace is being extended, extend from NOW
     * rather than extending from an old expiry date.
     *
     * Example:
     *
     * Old expiry: 01 Jan 2026
     * Current date: 07 Oct 2026
     * +3 months
     *
     * New expiry:
     * 07 Jan 2027
     *
     * For an active workspace:
     *
     * Old expiry: 01 Jan 2027
     * +3 months
     *
     * New expiry:
     * 01 Apr 2027
     */
    const baseDate =
      workspace.expiresAt > now
        ? workspace.expiresAt
        : now;

    // ============================================================
    // 6. CALCULATE NEW EXPIRY
    // ============================================================

    let newExpiresAt: Date;

    switch (mode) {
      case "1_MONTH":
        newExpiresAt =
          addMonths(
            baseDate,
            1
          );
        break;

      case "3_MONTHS":
        newExpiresAt =
          addMonths(
            baseDate,
            3
          );
        break;

      case "6_MONTHS":
        newExpiresAt =
          addMonths(
            baseDate,
            6
          );
        break;

      case "12_MONTHS":
        newExpiresAt =
          addMonths(
            baseDate,
            12
          );
        break;

      case "CUSTOM": {
        const customDate =
          parseCustomExpiry(
            body.customExpiresAt
          );

        if (!customDate) {
          return NextResponse.json(
            {
              success: false,
              message:
                "A valid custom expiry date is required.",
            },
            {
              status: 400,
            }
          );
        }

        /*
         * A custom expiry must always be later than the
         * current entitlement expiry/base date.
         *
         * This prevents accidentally shortening a customer's
         * existing Team entitlement.
         */
        if (
          customDate.getTime() <=
          baseDate.getTime()
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "The new expiry date must be later than the current Team entitlement.",
            },
            {
              status: 409,
            }
          );
        }

        newExpiresAt =
          customDate;

        break;
      }

      default:
        return NextResponse.json(
          {
            success: false,
            message:
              "Unsupported extension mode.",
          },
          {
            status: 400,
          }
        );
    }

    // ============================================================
    // 7. SANITY CHECK
    // ============================================================

    if (
      newExpiresAt.getTime() <=
      baseDate.getTime()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The new Team expiry must be later than the current entitlement.",
        },
        {
          status: 409,
        }
      );
    }

    // ============================================================
    // 8. UPDATE WORKSPACE + AUDIT ATOMICALLY
    // ============================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          const updatedWorkspace =
            await tx.teamWorkspace.update({
              where: {
                id: workspace.id,
              },

              data: {
                status:
                  "ACTIVE",

                expiresAt:
                  newExpiresAt,
              },

              select: {
                id: true,
                name: true,
                status: true,
                startedAt: true,
                expiresAt: true,
                updatedAt: true,
              },
            });

          const auditLog =
            await tx.adminAuditLog.create({
              data: {
                adminId:
                  auth.admin.id,

                targetUserId:
                  workspace.owner.id,

                action:
                  "TEAM_TERM_EXTENDED",

                metadata: {
                  workspaceId:
                    workspace.id,

                  workspaceName:
                    workspace.name,

                  ownerId:
                    workspace.owner.id,

                  ownerEmail:
                    workspace.owner
                      .email,

                  extensionMode:
                    mode,

                  reason,

                  previousExpiry:
                    workspace.expiresAt.toISOString(),

                  baseDate:
                    baseDate.toISOString(),

                  newExpiry:
                    newExpiresAt.toISOString(),

                  extendedFromExpired:
                    workspace.expiresAt <=
                    now,

                  extendedAt:
                    now.toISOString(),
                },
              },
            });

          return {
            updatedWorkspace,
            auditLog,
          };
        }
      );

    // ============================================================
    // 9. RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          `Team Workspace "${workspace.name}" was extended successfully.`,

        workspace: {
          id:
            result.updatedWorkspace
              .id,

          name:
            result.updatedWorkspace
              .name,

          status:
            result.updatedWorkspace
              .status,

          startedAt:
            result.updatedWorkspace
              .startedAt,

          previousExpiresAt:
            workspace.expiresAt,

          expiresAt:
            result.updatedWorkspace
              .expiresAt,

          extensionMode:
            mode,

          reason,

          extendedFromExpired:
            workspace.expiresAt <=
            now,

          updatedAt:
            result.updatedWorkspace
              .updatedAt,
        },

        audit: {
          id:
            result.auditLog.id,

          action:
            result.auditLog.action,

          createdAt:
            result.auditLog.createdAt,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "========== ADMIN TEAM EXTEND ERROR =========="
    );

    console.error(error);

    console.error(
      "============================================="
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal Server Error.",
      },
      {
        status: 500,
      }
    );
  }
}
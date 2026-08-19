import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

interface AccountStatusBody {
  action?: "SUSPEND" | "REACTIVATE";
  reason?: string;
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // ==========================================================
    // 1. REQUIRE ADMIN
    // ==========================================================

    const auth = await requireAdmin(request);

    if (!auth.success) {
      return auth.response;
    }

    const { id: targetUserId } = await context.params;

    // ==========================================================
    // 2. PREVENT ADMIN FROM SUSPENDING OWN ACCOUNT
    // ==========================================================

    if (targetUserId === auth.admin.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot suspend your own admin account.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // 3. READ REQUEST BODY
    // ==========================================================

    let body: AccountStatusBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    const action = body.action;
    const reason = body.reason?.trim() || null;

    if (action !== "SUSPEND" && action !== "REACTIVATE") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action",
          allowedActions: ["SUSPEND", "REACTIVATE"],
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================================
    // 4. FIND TARGET USER
    // ==========================================================

    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================================
    // 5. OPTIONAL EXTRA PROTECTION FOR OTHER ADMINS
    // ==========================================================

    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This route does not allow suspending another admin account.",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================================
    // 6. DETERMINE NEW STATUS
    // ==========================================================

    const newStatus =
      action === "SUSPEND"
        ? "SUSPENDED"
        : "ACTIVE";

    if (targetUser.accountStatus === newStatus) {
      return NextResponse.json(
        {
          success: false,
          message:
            action === "SUSPEND"
              ? "This account is already suspended."
              : "This account is already active.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // 7. UPDATE USER + AUDIT LOG
    // ==========================================================

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: {
          id: targetUser.id,
        },
        data: {
          accountStatus: newStatus,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          accountStatus: true,
          updatedAt: true,
        },
      });

      const auditLog = await tx.adminAuditLog.create({
        data: {
          adminId: auth.admin.id,
          targetUserId: targetUser.id,

          action:
            action === "SUSPEND"
              ? "USER_SUSPENDED"
              : "USER_REACTIVATED",

          metadata: {
            reason:
              reason ||
              (action === "SUSPEND"
                ? "Account suspended by admin"
                : "Account reactivated by admin"),

            previousStatus:
              targetUser.accountStatus,

            newStatus,

            targetEmail: targetUser.email,

            changedAt: new Date().toISOString(),
          },
        },
      });

      return {
        user,
        auditLog,
      };
    });

    // ==========================================================
    // 8. RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          action === "SUSPEND"
            ? `${targetUser.name}'s account has been suspended`
            : `${targetUser.name}'s account has been reactivated`,

        user: result.user,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "========== ADMIN ACCOUNT STATUS ERROR =========="
    );
    console.error(error);
    console.error(
      "==============================================="
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
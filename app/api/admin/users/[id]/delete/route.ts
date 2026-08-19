import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

interface DeleteUserBody {
  confirmEmail?: string;
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
    // 2. PREVENT SELF-DELETION
    // ==========================================================

    if (targetUserId === auth.admin.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own admin account.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // 3. READ REQUEST BODY
    // ==========================================================

    let body: DeleteUserBody;

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

    const confirmEmail = body.confirmEmail?.trim();
    const reason = body.reason?.trim() || null;

    if (!confirmEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email confirmation is required before deleting an account.",
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
        createdAt: true,

        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
            source: true,
            billingCycle: true,
            startedAt: true,
            expiresAt: true,
          },
        },

        _count: {
          select: {
            calculations: true,
            payments: true,
            activities: true,
          },
        },
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
    // 5. PREVENT DELETING ANOTHER ADMIN
    // ==========================================================

    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin accounts cannot be deleted through this route.",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================================
    // 6. VERIFY EXACT EMAIL CONFIRMATION
    // ==========================================================

    if (
      confirmEmail.toLowerCase() !==
      targetUser.email.toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email confirmation does not match the user's email address.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================================
    // 7. SNAPSHOT USER BEFORE DELETION
    // ==========================================================

    const deletedUserSnapshot = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      accountStatus: targetUser.accountStatus,
      createdAt: targetUser.createdAt.toISOString(),

      subscription: targetUser.subscription
        ? {
            plan: targetUser.subscription.plan,
            status: targetUser.subscription.status,
            source: targetUser.subscription.source,
            billingCycle:
              targetUser.subscription.billingCycle,
            startedAt:
              targetUser.subscription.startedAt.toISOString(),
            expiresAt:
              targetUser.subscription.expiresAt?.toISOString() ??
              null,
          }
        : null,

      counts: {
        calculations: targetUser._count.calculations,
        payments: targetUser._count.payments,
        activities: targetUser._count.activities,
      },
    };

    // ==========================================================
    // 8. AUDIT LOG + DELETE USER
    // ==========================================================
    //
    // Important:
    // AdminAuditLog.targetUserId uses onDelete: SetNull.
    //
    // We create the audit record first, then delete the user.
    // Prisma/Postgres will keep the audit record while setting
    // targetUserId to null after deletion.
    //
    // The user's email/id snapshot remains inside metadata.
    // ==========================================================

    await prisma.$transaction(async (tx) => {
      await tx.adminAuditLog.create({
        data: {
          adminId: auth.admin.id,
          targetUserId: targetUser.id,
          action: "USER_DELETED",

          metadata: {
            reason:
              reason ||
              "Account permanently deleted by admin",

            deletedUser: deletedUserSnapshot,

            deletedAt: new Date().toISOString(),
          },
        },
      });

      await tx.user.delete({
        where: {
          id: targetUser.id,
        },
      });
    });

    // ==========================================================
    // 9. RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,

        message: `${targetUser.name}'s account has been permanently deleted.`,

        deletedUser: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "========== ADMIN DELETE USER ERROR =========="
    );
    console.error(error);
    console.error(
      "============================================"
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
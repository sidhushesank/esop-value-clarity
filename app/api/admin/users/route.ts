import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    // ============================================================
    // REQUIRE ADMIN
    // ============================================================

    const auth = await requireAdmin(request);

    if (!auth.success) {
      return auth.response;
    }

    // ============================================================
    // QUERY PARAMETERS
    // ============================================================

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const plan = searchParams.get("plan");
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    const page = Math.max(
      Number(searchParams.get("page") || "1"),
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit") || "20"),
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    // ============================================================
    // BUILD FILTERS
    // ============================================================

    const where: any = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (role === "USER" || role === "ADMIN") {
      where.role = role;
    }

    if (
      status === "ACTIVE" ||
      status === "SUSPENDED"
    ) {
      where.accountStatus = status;
    }

    if (plan === "FREE") {
      where.OR = [
        {
          subscription: null,
        },
        {
          subscription: {
            plan: "FREE",
          },
        },
      ];
    }

    if (plan === "PRO") {
      where.subscription = {
        plan: "PRO",
      };
    }

    // ============================================================
    // FETCH USERS + TOTAL COUNT
    // ============================================================

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,

          role: true,
          accountStatus: true,

          lastLoginAt: true,
          lastActiveAt: true,

          createdAt: true,
          updatedAt: true,

          subscription: {
            select: {
              id: true,
              plan: true,
              billingCycle: true,
              status: true,
              source: true,
              startedAt: true,
              expiresAt: true,
              grantReason: true,
            },
          },

          _count: {
            select: {
              calculations: true,
              payments: true,
            },
          },
        },
      }),

      prisma.user.count({
        where,
      }),
    ]);

    // ============================================================
    // FORMAT USERS
    // ============================================================

    const formattedUsers = users.map((user) => {
      const now = new Date();

      const subscriptionIsActive =
        user.subscription?.plan === "PRO" &&
        user.subscription.status === "ACTIVE" &&
        (!user.subscription.expiresAt ||
          user.subscription.expiresAt > now);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,

        role: user.role,
        accountStatus: user.accountStatus,

        plan: subscriptionIsActive
          ? "PRO"
          : "FREE",

        subscription: user.subscription
          ? {
              id: user.subscription.id,
              plan: user.subscription.plan,
              billingCycle:
                user.subscription.billingCycle,
              status: user.subscription.status,
              source: user.subscription.source,
              startedAt: user.subscription.startedAt,
              expiresAt: user.subscription.expiresAt,
              grantReason:
                user.subscription.grantReason,
            }
          : null,

        stats: {
          calculations: user._count.calculations,
          payments: user._count.payments,
        },

        lastLoginAt: user.lastLoginAt,
        lastActiveAt: user.lastActiveAt,

        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });

    // ============================================================
    // RETURN RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      users: formattedUsers,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(
      "========== ADMIN USERS ERROR =========="
    );
    console.error(error);
    console.error(
      "======================================="
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
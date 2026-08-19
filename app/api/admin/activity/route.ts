import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const allowedActivityTypes = [
  "LOGIN",
  "LOGOUT",
  "SIGNUP",
  "PROFILE_UPDATED",
  "SIMULATOR_USED",
  "TAX_CALCULATED",
  "DILUTION_CALCULATED",
  "VESTING_CALCULATED",
  "EXIT_CALCULATED",
  "COMPARE_USED",
  "REPORT_CREATED",
  "CALCULATION_CREATED",
  "CALCULATION_UPDATED",
  "CALCULATION_DELETED",
  "PRO_UPGRADED",
  "PRO_CANCELLED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
] as const;

type AllowedActivityType =
  (typeof allowedActivityTypes)[number];

function isAllowedActivityType(
  value: string | null
): value is AllowedActivityType {
  return (
    value !== null &&
    allowedActivityTypes.includes(
      value as AllowedActivityType
    )
  );
}

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
    // QUERY PARAMETERS
    // ============================================================

    const { searchParams } = new URL(
      request.url
    );

    const search =
      searchParams.get("search")?.trim() || "";

    const type =
      searchParams.get("type");

    const page = Math.max(
      Number(searchParams.get("page") || "1"),
      1
    );

    const limit = Math.min(
      Math.max(
        Number(
          searchParams.get("limit") || "25"
        ),
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    // ============================================================
    // BUILD FILTERS
    // ============================================================

    const where: any = {
      AND: [],
    };

    if (search) {
      where.AND.push({
        OR: [
          {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      });
    }

    if (isAllowedActivityType(type)) {
      where.AND.push({
        type,
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    // ============================================================
    // FETCH ACTIVITY + TOTAL COUNT
    // ============================================================

    const [activities, total] =
      await Promise.all([
        prisma.userActivity.findMany({
          where,

          orderBy: {
            createdAt: "desc",
          },

          skip,
          take: limit,

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
                role: true,
                accountStatus: true,

                subscription: {
                  select: {
                    plan: true,
                    status: true,
                    source: true,
                    expiresAt: true,
                  },
                },
              },
            },
          },
        }),

        prisma.userActivity.count({
          where,
        }),
      ]);

    // ============================================================
    // FORMAT ACTIVITY
    // ============================================================

    const now = new Date();

    const formattedActivities =
      activities.map((activity) => {
        const subscription =
          activity.user.subscription;

        const isPro =
          subscription?.plan === "PRO" &&
          subscription.status === "ACTIVE" &&
          (!subscription.expiresAt ||
            subscription.expiresAt > now);

        return {
          id: activity.id,
          type: activity.type,
          metadata: activity.metadata,
          createdAt: activity.createdAt,

          user: {
            id: activity.user.id,
            name: activity.user.name,
            email: activity.user.email,
            role: activity.user.role,
            accountStatus:
              activity.user.accountStatus,

            plan: isPro ? "PRO" : "FREE",

            subscriptionSource:
              isPro && subscription
                ? subscription.source
                : null,
          },
        };
      });

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      activities: formattedActivities,

      filters: {
        search: search || null,
        type:
          isAllowedActivityType(type)
            ? type
            : null,
      },

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit
        ),
        hasNextPage:
          page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(
      "========== ADMIN ACTIVITY ERROR =========="
    );
    console.error(error);
    console.error(
      "=========================================="
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
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. Get JWT from cookie
    // ---------------------------------------------------------

    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        {
          status: 401,
        }
      );
    }

    // ---------------------------------------------------------
    // 2. Get user ID from JWT
    // ---------------------------------------------------------

    const userId = getUserIdFromToken(token);

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

    // ---------------------------------------------------------
    // 3. Get user + subscription
    // ---------------------------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        calculations: true,
        subscription: true,
      },
    });

    if (!user) {
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

    // ---------------------------------------------------------
    // 4. Check account status
    // ---------------------------------------------------------

    if (user.accountStatus === "SUSPENDED") {
      const response = NextResponse.json(
        {
          success: false,
          message:
            "This account has been suspended. Please contact support.",
        },
        {
          status: 403,
        }
      );

      // Remove active login session for suspended user
      response.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(0),
        path: "/",
      });

      return response;
    }

    // ---------------------------------------------------------
    // 5. Calculate statistics
    // ---------------------------------------------------------

    const totalSimulations = user.calculations.length;

    const portfolioValue = user.calculations.reduce(
      (sum, calc) => sum + calc.exitValue,
      0
    );

    const highestExit =
      user.calculations.length > 0
        ? Math.max(
            ...user.calculations.map(
              (calculation) => calculation.exitValue
            )
          )
        : 0;

    // ---------------------------------------------------------
    // 6. Get subscription information
    // ---------------------------------------------------------

    const subscription = await getUserSubscription(user.id);

    // ---------------------------------------------------------
    // 7. Return account information
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,

        // -----------------------------------------------------
        // ADMIN / ACCOUNT INFORMATION
        // -----------------------------------------------------

        role: user.role,
        accountStatus: user.accountStatus,
        lastLoginAt: user.lastLoginAt,
        lastActiveAt: user.lastActiveAt,

        // -----------------------------------------------------
        // EXISTING USER STATISTICS
        // -----------------------------------------------------

        stats: {
          totalSimulations,
          portfolioValue,
          highestExit,
        },

        // -----------------------------------------------------
        // EXISTING SUBSCRIPTION / ACCOUNT INFORMATION
        // -----------------------------------------------------

        account: {
          verified: user.emailVerified,

          plan: subscription.plan,

          status: subscription.status,

          isPro: subscription.isPro,

          isFounder: subscription.isFounder,

          expiresAt:
            subscription.subscription?.expiresAt ?? null,

          billingCycle:
            subscription.subscription?.billingCycle ?? null,

          canCancel:
            subscription.subscription?.status === "ACTIVE" &&
            subscription.plan === "PRO",

          isCancelled:
            subscription.subscription?.status === "CANCELLED",
        },
      },
    });
  } catch (error) {
    console.error("========== AUTH ME ERROR ==========");
    console.error(error);
    console.error("===================================");

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
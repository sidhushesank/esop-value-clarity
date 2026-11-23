import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  RATE_LIMITS,
  checkRateLimit,
  tooManyRequests,
} from "@/lib/rate-limit";
import {
  verifyPassword,
  hashPassword,
  generateToken,
} from "@/lib/auth";
import { getSessionUserId } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
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

    const userId = await getSessionUserId(token);

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

    // Stops guessing the current password from a stolen session.
    const limit = await checkRateLimit(
      RATE_LIMITS.changePasswordUser,
      userId
    );

    if (!limit.allowed) {
      return tooManyRequests(limit.resetAt);
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    const isPasswordCorrect = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect.",
        },
        {
          status: 400,
        }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
      },
    });

    // Every other device is now logged out (their cookie's password
    // fingerprint no longer matches). Keep this device logged in.
    const response = NextResponse.json({
      success: true,
      message: "Password updated. You've been logged out on your other devices.",
    });

    response.cookies.set("token", generateToken(userId, passwordHash), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error(error);

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
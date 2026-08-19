import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { verifyPassword, generateToken } from "@/lib/auth";
import { recordLoginActivity } from "@/lib/activity";

export async function POST(request: Request) {
  try {
    // ============================================================
    // READ REQUEST BODY
    // ============================================================

    const body = await request.json();

    // ============================================================
    // VALIDATE REQUEST
    // ============================================================

    const data = loginSchema.parse(body);

    // ============================================================
    // FIND USER
    // ============================================================

    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    // ============================================================
    // COMPARE PASSWORD
    // ============================================================

    const isPasswordValid = await verifyPassword(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    // ============================================================
    // CHECK ACCOUNT STATUS
    // ============================================================

    if (user.accountStatus === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account has been suspended. Please contact support.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // UPDATE LOGIN TIMESTAMPS
    // ============================================================

    const now = new Date();

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: now,
        lastActiveAt: now,
      },
    });

    // ============================================================
    // RECORD LOGIN ACTIVITY
    // ============================================================

    await recordLoginActivity(updatedUser.id);

    // ============================================================
    // GENERATE JWT
    // ============================================================

    const token = generateToken(updatedUser.id);

    // ============================================================
    // CREATE RESPONSE
    // ============================================================

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,

          // Admin system
          role: updatedUser.role,
          accountStatus: updatedUser.accountStatus,
        },
      },
      {
        status: 200,
      }
    );

    // ============================================================
    // STORE JWT IN HTTPONLY COOKIE
    // ============================================================

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("========== LOGIN ERROR ==========");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unknown error occurred",
        stack:
          process.env.NODE_ENV === "development"
            ? error?.stack
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}
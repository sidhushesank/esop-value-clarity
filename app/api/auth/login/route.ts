import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";

import { loginSchema } from "@/lib/validators";

import { verifyPassword, generateToken } from "@/lib/auth";

import { recordLoginActivity } from "@/lib/activity";

import {
  RATE_LIMITS,
  firstBlocked,
  getClientIp,
  tooManyRequests,
} from "@/lib/rate-limit";

// One message for both wrong email and wrong password, so the login form
// can't be used to find out who has an EVC account.
const INVALID_LOGIN = "Invalid email or password.";

export async function POST(request: Request) {
  try {
    // ============================================================
    // READ + VALIDATE REQUEST
    // ============================================================

    const body = await request.json();

    const data = loginSchema.parse(body);

    // ============================================================
    // RATE LIMIT (per IP and per email)
    // ============================================================

    const blocked = await firstBlocked([
      [RATE_LIMITS.loginIp, getClientIp(request)],
      [RATE_LIMITS.loginEmail, data.email],
    ]);

    if (blocked) {
      return tooManyRequests(
        blocked.resetAt,
        "Too many login attempts. Please wait 15 minutes and try again, or reset your password."
      );
    }

    // ============================================================
    // FIND USER (case-insensitive, so "Name@x.com" == "name@x.com")
    // ============================================================

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: data.email,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: INVALID_LOGIN },
        { status: 401 }
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
        { success: false, message: INVALID_LOGIN },
        { status: 401 }
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
        { status: 403 }
      );
    }

    // ============================================================
    // UPDATE LOGIN TIMESTAMPS
    // ============================================================

    const now = new Date();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
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
    // GENERATE JWT + RESPONSE
    // ============================================================

    const token = generateToken(updatedUser.id);

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
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Please check your email and password.",
        },
        { status: 400 }
      );
    }

    console.error("========== LOGIN ERROR ==========");
    console.error(error);
    console.error("=================================");

    // Never send internal error text or stack traces to the browser.
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  passwordFingerprint,
  verifyPasswordResetToken,
} from "@/lib/auth";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  tooManyRequests,
} from "@/lib/rate-limit";

const INVALID_LINK = "Reset link expired or invalid. Please request a new one.";

export async function POST(req: Request) {
  try {
    const limit = await checkRateLimit(RATE_LIMITS.resetIp, getClientIp(req));
    if (!limit.allowed) {
      return tooManyRequests(limit.resetAt);
    }

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be between 8 and 128 characters.",
        },
        { status: 400 }
      );
    }

    // Only a genuine reset link passes here; a login cookie does not.
    const reset = verifyPasswordResetToken(token);
    if (!reset) {
      return NextResponse.json(
        { success: false, message: INVALID_LINK },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: reset.userId },
      select: { id: true, passwordHash: true },
    });

    // If the password already changed since the link was sent, the
    // fingerprint won't match: the link has been used (or is stale).
    if (!user || passwordFingerprint(user.passwordHash) !== reset.fingerprint) {
      return NextResponse.json(
        { success: false, message: INVALID_LINK },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("[RESET_PASSWORD] Unexpected error:", error);

    return NextResponse.json(
      { success: false, message: INVALID_LINK },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  LOCK_MINUTES,
  MAX_FAILED_ATTEMPTS,
  SHARE_COOKIE_MAX_AGE_SECONDS,
  checkPasscode,
  resolveShareLink,
  shareCookieName,
  signShareCookie,
} from "@/lib/advisor/share";

type RouteContext = {
  params: Promise<{ token: string }>;
};

const bodySchema = z.object({ passcode: z.string().min(1).max(100) });

const UNAVAILABLE = {
  success: false,
  code: "UNAVAILABLE",
  message: "This link is not available.",
};

export async function POST(request: Request, { params }: RouteContext) {
  const { token } = await params;
  const link = await resolveShareLink(token);

  if (!link) {
    return NextResponse.json(UNAVAILABLE, { status: 404 });
  }

  if (!link.passcodeHash) {
    return NextResponse.json({ success: true });
  }

  const now = new Date();

  if (link.lockedUntil && link.lockedUntil > now) {
    return NextResponse.json(
      {
        success: false,
        code: "LOCKED",
        message: "Too many incorrect attempts. Please try again later.",
      },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: "VALIDATION_ERROR", message: "Enter the passcode." },
      { status: 400 }
    );
  }

  const ok = await checkPasscode(parsed.data.passcode, link.passcodeHash);

  if (!ok) {
    const updated = await prisma.shareLink.update({
      where: { id: link.id },
      data: { failedAttempts: { increment: 1 } },
      select: { failedAttempts: true },
    });

    if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      await prisma.shareLink.update({
        where: { id: link.id },
        data: {
          failedAttempts: 0,
          lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000),
        },
      });

      return NextResponse.json(
        {
          success: false,
          code: "LOCKED",
          message: `Too many incorrect attempts. Try again in ${LOCK_MINUTES} minutes.`,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, code: "WRONG_PASSCODE", message: "Incorrect passcode." },
      { status: 401 }
    );
  }

  if (link.failedAttempts > 0 || link.lockedUntil) {
    await prisma.shareLink.update({
      where: { id: link.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(shareCookieName(link.id), signShareCookie(link.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SHARE_COOKIE_MAX_AGE_SECONDS,
  });

  return response;
}
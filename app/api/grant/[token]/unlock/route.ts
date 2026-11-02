import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  GRANT_COOKIE_MAX_AGE_SECONDS,
  GRANT_LOCK_MINUTES,
  GRANT_MAX_FAILED_ATTEMPTS,
  checkPasscode,
  grantCookieName,
  resolveGrantLink,
  signGrantCookie,
} from "@/lib/company/grant-links";

type Ctx = { params: Promise<{ token: string }> };

const bodySchema = z.object({ passcode: z.string().min(1).max(100) });

const UNAVAILABLE = { success: false, code: "UNAVAILABLE", message: "This link is not available." };

/** POST /api/grant/[token]/unlock { passcode }: public, no login. */
export async function POST(request: Request, { params }: Ctx) {
  const { token } = await params;
  const link = await resolveGrantLink(token);

  if (!link) return NextResponse.json(UNAVAILABLE, { status: 404 });
  if (!link.passcodeHash) return NextResponse.json({ success: true });

  const now = new Date();

  if (link.lockedUntil && link.lockedUntil > now) {
    return NextResponse.json(
      { success: false, code: "LOCKED", message: "Too many incorrect attempts. Please try again later." },
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
    const attempts = link.failedAttempts + 1;
    const lock = attempts >= GRANT_MAX_FAILED_ATTEMPTS;

    await prisma.grantLink.update({
      where: { id: link.id },
      data: {
        failedAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(now.getTime() + GRANT_LOCK_MINUTES * 60_000) : null,
      },
    });

    return NextResponse.json(
      {
        success: false,
        code: lock ? "LOCKED" : "WRONG_PASSCODE",
        message: lock
          ? "Too many incorrect attempts. Please try again later."
          : "That passcode is not correct.",
      },
      { status: lock ? 429 : 401 }
    );
  }

  await prisma.grantLink.update({
    where: { id: link.id },
    data: { failedAttempts: 0, lockedUntil: null },
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set(grantCookieName(link.id), signGrantCookie(link.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GRANT_COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}

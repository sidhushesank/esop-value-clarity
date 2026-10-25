import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

export const SHARE_COOKIE_MAX_AGE_SECONDS = 12 * 60 * 60;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
export const MAX_ACTIVE_LINKS_PER_CLIENT = 20;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function baseSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is not set.");
    }
    return "dev-only-secret-do-not-use-in-production";
  }

  return secret;
}

// Derived, so a share cookie can never be mistaken for a login token.
function derivedSecret(purpose: string): string {
  return crypto.createHmac("sha256", baseSecret()).update(purpose).digest("hex");
}

/* ------------------------------------------------------------------ */
/* Tokens and passcodes                                                */
/* ------------------------------------------------------------------ */

export function generateShareToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashShareToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hashPasscode(passcode: string): Promise<string> {
  return bcrypt.hash(passcode, 10);
}

export function checkPasscode(passcode: string, hash: string): Promise<boolean> {
  return bcrypt.compare(passcode, hash);
}

/* ------------------------------------------------------------------ */
/* Unlock cookie                                                       */
/* ------------------------------------------------------------------ */

export function shareCookieName(linkId: string): string {
  return `evc_share_${linkId.slice(-12)}`;
}

export function signShareCookie(linkId: string): string {
  return jwt.sign({ lid: linkId, k: "share" }, derivedSecret("share-cookie"), {
    algorithm: "HS256",
    expiresIn: SHARE_COOKIE_MAX_AGE_SECONDS,
  });
}

export function verifyShareCookie(
  value: string | undefined,
  linkId: string
): boolean {
  if (!value) return false;

  try {
    const payload = jwt.verify(value, derivedSecret("share-cookie"), {
      algorithms: ["HS256"],
    });

    return (
      typeof payload === "object" &&
      payload !== null &&
      payload.lid === linkId &&
      payload.k === "share"
    );
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Resolving a link                                                    */
/* ------------------------------------------------------------------ */

/**
 * Returns the link only if it is usable right now. Every failure mode
 * (unknown, revoked, expired, client archived, firm expired) returns null,
 * so callers cannot tell them apart and nothing leaks.
 */
export async function resolveShareLink(token: string) {
  if (!TOKEN_PATTERN.test(token)) return null;

  const link = await prisma.shareLink.findUnique({
    where: { tokenHash: hashShareToken(token) },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          archivedAt: true,
          firm: { select: { status: true, expiresAt: true } },
        },
      },
    },
  });

  if (!link) return null;

  const now = new Date();

  if (link.revokedAt) return null;
  if (link.expiresAt <= now) return null;
  if (link.client.archivedAt) return null;
  if (link.client.firm.status !== "ACTIVE") return null;
  if (link.client.firm.expiresAt <= now) return null;

  return link;
}

/* ------------------------------------------------------------------ */
/* View logging                                                        */
/* ------------------------------------------------------------------ */

type HeaderReader = { get(name: string): string | null };

export async function logShareView(linkId: string, headers: HeaderReader) {
  try {
    const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || headers.get("x-real-ip") || "unknown";

    const ipHash = crypto
      .createHmac("sha256", derivedSecret("share-ip"))
      .update(ip)
      .digest("hex")
      .slice(0, 32);

    const userAgent = (headers.get("user-agent") ?? "").slice(0, 200);

    await prisma.$transaction([
      prisma.shareLinkView.create({
        data: { linkId, ipHash, userAgent: userAgent || null },
      }),
      prisma.shareLink.update({
        where: { id: linkId },
        data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
      }),
    ]);
  } catch (error) {
    // Logging must never break the page.
    console.error("[share] failed to log view:", error);
  }
}
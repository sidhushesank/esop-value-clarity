import crypto from "node:crypto";

import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

export {
  generateShareToken as generateGrantToken,
  hashShareToken as hashGrantToken,
  hashPasscode,
  checkPasscode,
} from "@/lib/advisor/share";

import { hashShareToken } from "@/lib/advisor/share";

/**
 * ============================================================================
 * EMPLOYEE GRANT LINKS
 * ============================================================================
 * Same security model as Advisor share links: the raw token is shown to the
 * founder once and only its hash is stored; an optional passcode locks the
 * link for 15 minutes after 5 wrong attempts; links expire and can be revoked.
 * The unlock cookie is signed with a secret derived for this purpose only, so
 * it can never be confused with a login or an Advisor share cookie.
 * ============================================================================
 */

export const GRANT_COOKIE_MAX_AGE_SECONDS = 12 * 60 * 60;
export const GRANT_MAX_FAILED_ATTEMPTS = 5;
export const GRANT_LOCK_MINUTES = 15;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Statuses for which a link may be created and viewed. */
export const LINKABLE_STATUSES = ["ISSUED", "ACCEPTED", "LEFT", "EXERCISED"] as const;

function baseSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is not set.");
    return "dev-only-secret-do-not-use-in-production";
  }
  return secret;
}

function derivedSecret(purpose: string): string {
  return crypto.createHmac("sha256", baseSecret()).update(purpose).digest("hex");
}

export function grantCookieName(linkId: string): string {
  return `evc_grant_${linkId.slice(-12)}`;
}

export function signGrantCookie(linkId: string): string {
  return jwt.sign({ lid: linkId, k: "grant" }, derivedSecret("grant-cookie"), {
    algorithm: "HS256",
    expiresIn: GRANT_COOKIE_MAX_AGE_SECONDS,
  });
}

export function verifyGrantCookie(value: string | undefined, linkId: string): boolean {
  if (!value) return false;
  try {
    const payload = jwt.verify(value, derivedSecret("grant-cookie"), { algorithms: ["HS256"] });
    return (
      typeof payload === "object" &&
      payload !== null &&
      payload.lid === linkId &&
      payload.k === "grant"
    );
  } catch {
    return false;
  }
}

/**
 * Returns the link only if it is usable right now. Every failure mode
 * returns null so nothing about the grant leaks.
 */
export async function resolveGrantLink(token: string) {
  if (!TOKEN_PATTERN.test(token)) return null;

  const link = await prisma.grantLink.findUnique({
    where: { tokenHash: hashShareToken(token) },
    include: {
      grant: {
        include: {
          scheme: { select: { name: true } },
          workspace: {
            select: {
              id: true,
              name: true,
              cin: true,
              jurisdiction: true,
              status: true,
              expiresAt: true,
              currentFmvPerShare: true,
              fmvValuationDate: true,
              fmvValuerName: true,
            },
          },
        },
      },
    },
  });

  if (!link) return null;

  const now = new Date();
  if (link.revokedAt) return null;
  if (link.expiresAt <= now) return null;

  const ws = link.grant.workspace;
  if (ws.status !== "ACTIVE" || ws.expiresAt <= now) return null;
  if (!(LINKABLE_STATUSES as readonly string[]).includes(link.grant.status)) return null;

  return link;
}

export type ResolvedGrantLink = NonNullable<Awaited<ReturnType<typeof resolveGrantLink>>>;

export async function logGrantView(linkId: string) {
  try {
    await prisma.grantLink.update({
      where: { id: linkId },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    });
  } catch (error) {
    console.error("[grant-link] failed to log view:", error);
  }
}

export function appBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return configured || new URL(request.url).origin;
}

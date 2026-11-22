import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| Rate limiting (database-backed)
|--------------------------------------------------------------------------
| Vercel runs many short-lived server instances, so an in-memory counter
| would reset constantly. Counters live in the RateLimitBucket table instead.
|
| One atomic SQL statement per check: it creates the bucket, or bumps its
| count, or restarts the window if the old one has ended.
|
| If the database call itself fails, the request is allowed (fail open) and
| the error is logged, so a DB hiccup never locks real users out of login.
*/

export interface RateLimitRule {
  /** Short name, e.g. "login-ip". Becomes part of the bucket key. */
  name: string;
  /** Max requests allowed inside one window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export const RATE_LIMITS = {
  loginIp: { name: "login-ip", limit: 30, windowSeconds: 15 * 60 },
  loginEmail: { name: "login-email", limit: 8, windowSeconds: 15 * 60 },
  signupIp: { name: "signup-ip", limit: 10, windowSeconds: 60 * 60 },
  forgotIp: { name: "forgot-ip", limit: 10, windowSeconds: 60 * 60 },
  forgotEmail: { name: "forgot-email", limit: 3, windowSeconds: 60 * 60 },
  resetIp: { name: "reset-ip", limit: 10, windowSeconds: 15 * 60 },
  changePasswordUser: { name: "chpw-user", limit: 10, windowSeconds: 15 * 60 },
} satisfies Record<string, RateLimitRule>;

export async function checkRateLimit(
  rule: RateLimitRule,
  identifier: string
): Promise<RateLimitResult> {
  const key = `${rule.name}:${identifier.trim().toLowerCase()}`.slice(0, 255);
  const newResetAt = new Date(Date.now() + rule.windowSeconds * 1000);

  try {
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
      VALUES (${key}, 1, ${newResetAt}, NOW())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."resetAt" < NOW() THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimitBucket"."resetAt" < NOW() THEN EXCLUDED."resetAt"
          ELSE "RateLimitBucket"."resetAt"
        END,
        "updatedAt" = NOW()
      RETURNING "count", "resetAt"
    `;

    const row = rows[0];
    const count = Number(row?.count ?? 1);
    const resetAt = row?.resetAt ? new Date(row.resetAt) : newResetAt;

    // Roughly 1 in 200 checks also clears out old buckets.
    if (Math.random() < 0.005) {
      void prisma.rateLimitBucket
        .deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
        .catch(() => undefined);
    }

    return {
      allowed: count <= rule.limit,
      remaining: Math.max(0, rule.limit - count),
      resetAt,
    };
  } catch (error) {
    console.error("[rate-limit] check failed, allowing request:", error);
    return { allowed: true, remaining: rule.limit, resetAt: newResetAt };
  }
}

/** Best-effort client IP behind Vercel's proxy. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export function tooManyRequests(
  resetAt: Date,
  message = "Too many attempts. Please wait a few minutes and try again."
) {
  const retryAfter = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));

  return NextResponse.json(
    { success: false, code: "RATE_LIMITED", message },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/**
 * Runs several rules and returns the first one that blocks, or null if all
 * pass. Every rule is counted, even after one blocks.
 */
export async function firstBlocked(
  checks: Array<[RateLimitRule, string]>
): Promise<RateLimitResult | null> {
  const results = await Promise.all(
    checks.map(([rule, id]) => checkRateLimit(rule, id))
  );
  return results.find((r) => !r.allowed) ?? null;
}

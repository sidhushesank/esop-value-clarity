import { cookies } from "next/headers";
import {
  AccountStatus,
  PlanType,
  SubscriptionStatus,
  UserRole,
} from "@prisma/client";

import { getUserIdFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/subscription";

/**
 * ============================================================================
 * PRO ACCESS
 * ============================================================================
 *
 * Central server-side authorization layer for authenticated and PRO-only
 * product features.
 *
 * IMPORTANT:
 * Client-side guards are useful for navigation and UX, but they must never be
 * treated as the security boundary for protected API routes.
 *
 * Every sensitive PRO API should call requireProUser().
 * ============================================================================
 */

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: Date;
};

export type ProAccessContext = {
  user: AuthenticatedUser;

  account: {
    isPro: boolean;
    isFounder: boolean;
    plan: PlanType;
    status: SubscriptionStatus;
    expiresAt: Date | null;
  };
};

/**
 * Controlled access error.
 *
 * We intentionally distinguish authorization failures from unexpected
 * application errors so API routes can return the correct HTTP status without
 * exposing internal implementation details.
 */
export class ProAccessError extends Error {
  status: number;
  code: string;

  constructor(
    message: string,
    status: number,
    code: string
  ) {
    super(message);

    this.name = "ProAccessError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Read and validate the authenticated user from the secure JWT cookie.
 *
 * This performs SERVER-SIDE authentication.
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const cookieStore = await cookies();

  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new ProAccessError(
      "Authentication required.",
      401,
      "NOT_AUTHENTICATED"
    );
  }

  const userId = getUserIdFromToken(token);

  if (!userId) {
    throw new ProAccessError(
      "Your session is invalid or has expired.",
      401,
      "INVALID_SESSION"
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      accountStatus: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ProAccessError(
      "User account could not be found.",
      401,
      "USER_NOT_FOUND"
    );
  }

  if (user.accountStatus === AccountStatus.SUSPENDED) {
    throw new ProAccessError(
      "This account has been suspended. Please contact support.",
      403,
      "ACCOUNT_SUSPENDED"
    );
  }

  return user;
}

/**
 * Require an authenticated user with active PRO access.
 *
 * Founder access continues to work through the existing
 * getUserSubscription() implementation.
 */
export async function requireProUser(): Promise<ProAccessContext> {
  const user = await requireAuthenticatedUser();

  const subscription = await getUserSubscription(user.id);

  if (!subscription.exists) {
    throw new ProAccessError(
      "User account could not be found.",
      401,
      "USER_NOT_FOUND"
    );
  }

  if (!subscription.isPro && !subscription.isFounder) {
    throw new ProAccessError(
      "An active PRO subscription is required to use this feature.",
      403,
      "PRO_REQUIRED"
    );
  }

  return {
    user,

    account: {
      isPro: subscription.isPro,
      isFounder: subscription.isFounder,
      plan: subscription.plan,
      status: subscription.status,
      expiresAt:
        subscription.subscription?.expiresAt ?? null,
    },
  };
}

/**
 * Convert a known access error into a safe response payload.
 *
 * API routes can use this helper inside their catch block.
 */
export function getProAccessErrorResponse(error: unknown): {
  status: number;
  body: {
    success: false;
    code: string;
    message: string;
  };
} | null {
  if (!(error instanceof ProAccessError)) {
    return null;
  }

  return {
    status: error.status,

    body: {
      success: false,
      code: error.code,
      message: error.message,
    },
  };
}
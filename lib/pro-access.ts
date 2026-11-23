import { cookies } from "next/headers";
import {
  AccountStatus,
  PlanType,
  SubscriptionStatus,
  UserRole,
} from "@prisma/client";

import { getSessionUserId } from "@/lib/session";
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
 *
 * Team-sponsored PRO is intentionally resolved here through the same
 * requireProUser() boundary. Team members therefore receive the normal PRO
 * experience without automatically receiving Team Workspace administration
 * privileges.
 *
 * Founder access is unconditional and is explicitly allowed to bypass the
 * normal Team Workspace entitlement expiry checks.
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
    isTeamSponsored: boolean;
    plan: PlanType;
    status: SubscriptionStatus;
    expiresAt: Date | null;
  };

  team: {
    workspaceId: string;
    workspaceName: string;
    workspaceExpiresAt: Date;
  } | null;
};

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
 * ============================================================================
 * AUTHENTICATED USER
 * ============================================================================
 *
 * Read and validate the authenticated user from the secure JWT cookie.
 *
 * This performs SERVER-SIDE authentication.
 * ============================================================================
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("token")?.value;

  if (!token) {
    throw new ProAccessError(
      "Authentication required.",
      401,
      "NOT_AUTHENTICATED"
    );
  }

  const userId =
    await getSessionUserId(token);

  if (!userId) {
    throw new ProAccessError(
      "Your session is invalid or has expired.",
      401,
      "INVALID_SESSION"
    );
  }

  const user =
    await prisma.user.findUnique({
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

  if (
    user.accountStatus ===
    AccountStatus.SUSPENDED
  ) {
    throw new ProAccessError(
      "This account has been suspended. Please contact support.",
      403,
      "ACCOUNT_SUSPENDED"
    );
  }

  return user;
}

/**
 * ============================================================================
 * REQUIRE PRO USER
 * ============================================================================
 *
 * Require an authenticated user with active PRO access.
 *
 * PRO can come from:
 * - personal PRO subscription
 * - founder access
 * - active Team-sponsored PRO entitlement
 * ============================================================================
 */
export async function requireProUser(): Promise<ProAccessContext> {
  const user =
    await requireAuthenticatedUser();

  const subscription =
    await getUserSubscription(
      user.id
    );

  if (!subscription.exists) {
    throw new ProAccessError(
      "User account could not be found.",
      401,
      "USER_NOT_FOUND"
    );
  }

  if (
    !subscription.isPro &&
    !subscription.isFounder
  ) {
    throw new ProAccessError(
      "An active PRO subscription is required to use this feature.",
      403,
      "PRO_REQUIRED"
    );
  }

  /*
   * Founder access is unconditional.
   *
   * The Founder should never inherit an expiry date from a Team Workspace
   * or personal Subscription record.
   */
  const effectiveExpiresAt =
    subscription.isFounder
      ? null
      : subscription.subscription
          ?.expiresAt ??
        subscription.teamWorkspace
          ?.expiresAt ??
        null;

  return {
    user,

    account: {
      isPro:
        subscription.isPro,

      isFounder:
        subscription.isFounder,

      isTeamSponsored:
        subscription.isTeamSponsored,

      plan:
        subscription.plan,

      status:
        subscription.status,

      expiresAt:
        effectiveExpiresAt,
    },

    team:
      subscription.teamWorkspace
        ? {
            workspaceId:
              subscription
                .teamWorkspace
                .id,

            workspaceName:
              subscription
                .teamWorkspace
                .name,

            workspaceExpiresAt:
              subscription
                .teamWorkspace
                .expiresAt,
          }
        : null,
  };
}

/**
 * ============================================================================
 * REQUIRE TEAM ADMIN
 * ============================================================================
 *
 * Require the authenticated user to be the owner of a Team Workspace.
 *
 * This is deliberately separate from requireProUser().
 *
 * Team-sponsored PRO members must NOT pass this check merely because they
 * belong to a Team Workspace.
 *
 * FOUNDER RULE:
 * Founder access is unlimited. Therefore Founder accounts bypass the normal
 * Team Workspace expiry enforcement.
 * ============================================================================
 */
export async function requireTeamAdmin() {
  const user =
    await requireAuthenticatedUser();

  const isFounder =
    user.email ===
    process.env.FOUNDER_EMAIL;

  const workspace =
    await prisma.teamWorkspace.findUnique({
      where: {
        ownerId: user.id,
      },

      select: {
        id: true,
        name: true,
        status: true,
        startedAt: true,
        expiresAt: true,
      },
    });

  if (!workspace) {
    throw new ProAccessError(
      "An active Team Workspace could not be found for this account.",
      403,
      "TEAM_WORKSPACE_REQUIRED"
    );
  }

  const now =
    new Date();

  /*
   * --------------------------------------------------------------------------
   * FOUNDER
   * --------------------------------------------------------------------------
   *
   * Founder access is unlimited.
   *
   * We intentionally do NOT enforce:
   *
   *   workspace.expiresAt <= now
   *
   * for the Founder.
   *
   * The Founder can continue using the Team Workspace regardless of the
   * annual customer entitlement date stored on the workspace row.
   *
   * For regular Team customers, both workspace lifecycle status and expiry
   * remain enforced.
   * --------------------------------------------------------------------------
   */

  if (!isFounder) {
    if (
      workspace.status !==
      "ACTIVE"
    ) {
      throw new ProAccessError(
        "Your Team Workspace is not active.",
        403,
        "TEAM_WORKSPACE_EXPIRED"
      );
    }

    if (
      workspace.expiresAt <= now
    ) {
      throw new ProAccessError(
        "Your Team Workspace has expired. Please renew the Team plan to continue.",
        403,
        "TEAM_WORKSPACE_EXPIRED"
      );
    }
  }

  return {
    user,
    workspace,
    isFounder,
  };
}

/**
 * ============================================================================
 * ERROR RESPONSE
 * ============================================================================
 */
export function getProAccessErrorResponse(
  error: unknown
): {
  status: number;

  body: {
    success: false;
    code: string;
    message: string;
  };
} | null {
  if (
    !(error instanceof ProAccessError)
  ) {
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
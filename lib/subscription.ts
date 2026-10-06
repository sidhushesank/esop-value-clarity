import {
  PlanType,
  SubscriptionStatus,
} from "@prisma/client";

import { prisma } from "./prisma";

/**
 * Resolve the effective PRO access for an EVC user.
 *
 * Access sources:
 * 1. Founder access
 * 2. Personal PRO subscription
 * 3. Team-sponsored PRO access
 *
 * Team-sponsored PRO does not replace or mutate the user's personal
 * Subscription record. It is a separate entitlement owned by an active
 * Team Workspace.
 */
export async function getUserSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      subscription: true,
      ownedTeamWorkspace: {
        select: {
          id: true,
          name: true,
          status: true,
          startedAt: true,
          expiresAt: true,
        },
      },
      teamMemberships: {
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              name: true,
              status: true,
              startedAt: true,
              expiresAt: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return {
      exists: false,
      isFounder: false,
      isPro: false,
      isTeamSponsored: false,
      plan: PlanType.FREE,
      status: SubscriptionStatus.EXPIRED,
      subscription: null,
      teamWorkspace: null,
    };
  }

  // Founder access remains unconditional.
  if (user.email === process.env.FOUNDER_EMAIL) {
    return {
      exists: true,
      isFounder: true,
      isPro: true,
      isTeamSponsored: false,
      plan: PlanType.PRO,
      status: SubscriptionStatus.ACTIVE,
      subscription: null,
      teamWorkspace: null,
    };
  }

  const now = new Date();

  // A Team Workspace is active only while both its lifecycle status and
  // annual entitlement date remain valid.
  const activeTeamMembership = user.teamMemberships.find(
    (membership) =>
      membership.workspace.status === "ACTIVE" &&
      membership.workspace.expiresAt > now
  );

  const activeOwnedTeamWorkspace =
    user.ownedTeamWorkspace &&
    user.ownedTeamWorkspace.status === "ACTIVE" &&
    user.ownedTeamWorkspace.expiresAt > now
      ? user.ownedTeamWorkspace
      : null;

  const teamWorkspace =
    activeTeamMembership?.workspace ??
    activeOwnedTeamWorkspace ??
    null;

  const isTeamSponsored = Boolean(teamWorkspace);

  const subscription = user.subscription;

  // No personal subscription, but the user has active Team-sponsored PRO.
  if (!subscription) {
    return {
      exists: true,
      isFounder: false,
      isPro: isTeamSponsored,
      isTeamSponsored,
      plan: isTeamSponsored ? PlanType.PRO : PlanType.FREE,
      status: isTeamSponsored
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.EXPIRED,
      subscription: null,
      teamWorkspace,
    };
  }

  // Personal subscription expired.
  if (
    subscription.expiresAt !== null &&
    subscription.expiresAt < now &&
    (
      subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.CANCELLED
    )
  ) {
    const updatedSubscription =
      await prisma.subscription.update({
        where: {
          userId,
        },
        data: {
          plan: PlanType.FREE,
          status: SubscriptionStatus.EXPIRED,
        },
      });

    return {
      exists: true,
      isFounder: false,
      isPro: isTeamSponsored,
      isTeamSponsored,
      plan: isTeamSponsored ? PlanType.PRO : PlanType.FREE,
      status: isTeamSponsored
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.EXPIRED,
      subscription: updatedSubscription,
      teamWorkspace,
    };
  }

  /**
   * A cancelled personal subscription remains usable until expiresAt.
   */
  const hasPersonalProAccess: boolean =
    subscription.plan === PlanType.PRO &&
    subscription.expiresAt !== null &&
    subscription.expiresAt > now &&
    (
      subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.CANCELLED
    );

  const hasProAccess =
    hasPersonalProAccess || isTeamSponsored;

  return {
    exists: true,
    isFounder: false,
    isPro: hasProAccess,
    isTeamSponsored,
    plan: hasProAccess ? PlanType.PRO : PlanType.FREE,
    status: hasProAccess
      ? SubscriptionStatus.ACTIVE
      : subscription.status,
    subscription,
    teamWorkspace,
  };
}

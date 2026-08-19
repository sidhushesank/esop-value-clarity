import {
  PlanType,
  SubscriptionStatus,
} from "@prisma/client";

import { prisma } from "./prisma";

export async function getUserSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      subscription: true,
    },
  });

  if (!user) {
    return {
      exists: false,
      isFounder: false,
      isPro: false,
      plan: PlanType.FREE,
      status: SubscriptionStatus.EXPIRED,
      subscription: null,
    };
  }

  // Founder always has PRO
  if (user.email === process.env.FOUNDER_EMAIL) {
    return {
      exists: true,
      isFounder: true,
      isPro: true,
      plan: PlanType.PRO,
      status: SubscriptionStatus.ACTIVE,
      subscription: null,
    };
  }

  const subscription = user.subscription;

  if (!subscription) {
    return {
      exists: true,
      isFounder: false,
      isPro: false,
      plan: PlanType.FREE,
      status: SubscriptionStatus.EXPIRED,
      subscription: null,
    };
  }

  const now = new Date();

  // Subscription expired
 if (
  subscription.expiresAt &&
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
      isPro: false,
      plan: PlanType.FREE,
      status: SubscriptionStatus.EXPIRED,
      subscription: updatedSubscription,
    };
  }

  const hasProAccess =
  subscription.plan === PlanType.PRO &&
  subscription.expiresAt &&
  subscription.expiresAt > now &&
  (
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.CANCELLED
  );

return {
  exists: true,
  isFounder: false,
  isPro: hasProAccess,
  plan: subscription.plan,
  status: subscription.status,
  subscription,
};
}
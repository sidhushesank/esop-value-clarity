import { SubscriptionSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  ProAccessError,
  requireAuthenticatedUser,
} from "@/lib/pro-access";

/**
 * Founder gets an auto-provisioned, effectively unlimited firm.
 * Founder is identified exactly as everywhere else: FOUNDER_EMAIL.
 */
const FOUNDER_FIRM_EXPIRY = new Date("2099-12-31T00:00:00.000Z");
const FOUNDER_CLIENT_LIMIT = 1_000_000;

export async function requireAdvisorFirm() {
  const user = await requireAuthenticatedUser();

  const isFounder =
    Boolean(process.env.FOUNDER_EMAIL) &&
    user.email === process.env.FOUNDER_EMAIL;

  if (isFounder) {
    const firm = await prisma.advisorFirm.upsert({
      where: { ownerId: user.id },
      update: {},
      create: {
        name: `${user.name} (Founder)`,
        ownerId: user.id,
        clientLimit: FOUNDER_CLIENT_LIMIT,
        expiresAt: FOUNDER_FIRM_EXPIRY,
        source: SubscriptionSource.ADMIN_GRANT,
        grantReason: "Founder access",
      },
      select: {
        id: true,
        name: true,
        status: true,
        expiresAt: true,
        clientLimit: true,
        brandName: true,
        brandFooter: true,
      },
    });

    // Founder bypasses expiry, status and client limit.
    return {
      user,
      firm,
      isFounder: true,
      clientLimit: FOUNDER_CLIENT_LIMIT,
    };
  }

  const firm = await prisma.advisorFirm.findUnique({
    where: { ownerId: user.id },
    select: {
      id: true,
      name: true,
      status: true,
      expiresAt: true,
      clientLimit: true,
      brandName: true,
      brandFooter: true,
    },
  });

  if (!firm) {
    throw new ProAccessError(
      "An Advisor Console plan could not be found for this account.",
      403,
      "ADVISOR_FIRM_REQUIRED"
    );
  }

  if (firm.status !== "ACTIVE" || firm.expiresAt <= new Date()) {
    throw new ProAccessError(
      "Your Advisor Console plan has expired. Please renew to continue.",
      403,
      "ADVISOR_FIRM_EXPIRED"
    );
  }

  return {
    user,
    firm,
    isFounder: false,
    clientLimit: firm.clientLimit,
  };
}

/**
 * Security boundary: every client-specific query must pass through this.
 * A client is only reachable by the firm that owns it.
 */
export async function requireClientInFirm(
  firmId: string,
  clientId: string
) {
  const client = await prisma.clientCompany.findFirst({
    where: {
      id: clientId,
      firmId,
      archivedAt: null,
    },
  });

  if (!client) {
    throw new ProAccessError(
      "Client company not found.",
      404,
      "CLIENT_NOT_FOUND"
    );
  }

  return client;
}

/**
 * Enforce the plan's client-company cap. Founder is unlimited.
 */
export async function assertCanAddClient(
  firmId: string,
  clientLimit: number,
  isFounder: boolean
) {
  if (isFounder) return;

  const activeClients = await prisma.clientCompany.count({
    where: { firmId, archivedAt: null },
  });

  if (activeClients >= clientLimit) {
    throw new ProAccessError(
      `Your plan allows ${clientLimit} client companies. Archive one or upgrade to add more.`,
      403,
      "CLIENT_LIMIT_REACHED"
    );
  }
}
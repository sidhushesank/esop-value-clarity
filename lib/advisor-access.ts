import { SubscriptionSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  ProAccessError,
  requireAuthenticatedUser,
} from "@/lib/pro-access";
import {
  assertCanManageTeam,
  assertCanWrite,
  findMembership,
  type AccessRole,
} from "@/lib/seats";

/**
 * Founder gets an auto-provisioned, effectively unlimited firm.
 * Founder is identified exactly as everywhere else: FOUNDER_EMAIL.
 */
const FOUNDER_FIRM_EXPIRY = new Date("2099-12-31T00:00:00.000Z");
const FOUNDER_CLIENT_LIMIT = 1_000_000;

const FIRM_SELECT = {
  id: true,
  name: true,
  status: true,
  expiresAt: true,
  clientLimit: true,
  brandName: true,
  brandFooter: true,
  ownerId: true,
} as const;

export type AdvisorAccessOptions = {
  /** The request changes data: view-only members are refused. */
  write?: boolean;
  /** The request manages the team: only the owner or an admin. */
  manageTeam?: boolean;
};

/**
 * Resolves the advisor firm for the signed-in user: the EVC founder's own
 * firm, a firm this user owns, or a firm this user was invited to.
 * `role` is OWNER, ADMIN or VIEWER.
 */
export async function requireAdvisorFirm(opts: AdvisorAccessOptions = {}) {
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
      role: "OWNER" as AccessRole,
      ownerId: user.id,
    };
  }

  let role: AccessRole = "OWNER";
  let firm = await prisma.advisorFirm.findUnique({
    where: { ownerId: user.id },
    select: FIRM_SELECT,
  });

  // An own plan that has ended doesn't hide a firm this person was invited to.
  const ownIsLive = !!firm && firm.status === "ACTIVE" && firm.expiresAt > new Date();

  if (!ownIsLive) {
    const membership = await findMembership("ADVISOR", user);
    if (membership?.firmId) {
      const teamFirm = await prisma.advisorFirm.findUnique({
        where: { id: membership.firmId },
        select: FIRM_SELECT,
      });
      if (teamFirm) {
        firm = teamFirm;
        role = membership.role as AccessRole;
      }
    }
  }

  if (!firm) {
    throw new ProAccessError(
      "An Advisor Console plan could not be found for this account.",
      403,
      "ADVISOR_FIRM_REQUIRED"
    );
  }

  // Members of the EVC founder's own firm share its unlimited plan.
  const ownerIsEvc =
    role !== "OWNER" &&
    Boolean(process.env.FOUNDER_EMAIL) &&
    (await prisma.user.findUnique({ where: { id: firm.ownerId }, select: { email: true } }))?.email ===
      process.env.FOUNDER_EMAIL;

  if (!ownerIsEvc && (firm.status !== "ACTIVE" || firm.expiresAt <= new Date())) {
    throw new ProAccessError(
      role === "OWNER"
        ? "Your Advisor Console plan has expired. Please renew to continue."
        : "Your firm's Advisor Console plan has expired. Ask the owner to renew it.",
      403,
      "ADVISOR_FIRM_EXPIRED"
    );
  }

  if (opts.manageTeam) assertCanManageTeam(role);
  if (opts.write) assertCanWrite(role);

  const { ownerId, ...publicFirm } = firm;

  return {
    user,
    firm: publicFirm,
    isFounder: false,
    clientLimit: firm.clientLimit,
    role,
    ownerId,
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
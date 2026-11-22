import { OptionGrantStatus, SubscriptionSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  ProAccessError,
  requireAuthenticatedUser,
} from "@/lib/pro-access";
import { STARTUP_PLAN } from "@/lib/company-pricing";

/**
 * ============================================================================
 * STARTUP EQUITY DESK ACCESS
 * ============================================================================
 *
 * Server-side security boundary for every /api/company/* route.
 *
 * Naming note: "founder" in this codebase means the EVC owner
 * (FOUNDER_EMAIL). The paying startup is called a "company" here so the two
 * are never confused.
 *
 * The EVC owner gets an auto-provisioned, effectively unlimited workspace so
 * the product can be built and tested without buying a plan.
 * ============================================================================
 */

const OWNER_WORKSPACE_EXPIRY = new Date("2099-12-31T00:00:00.000Z");
const OWNER_HOLDER_LIMIT = 1_000_000;

const WORKSPACE_SELECT = {
  id: true,
  name: true,
  status: true,
  expiresAt: true,
  holderLimit: true,
  companyType: true,
  cin: true,
  incorporationDate: true,
  dpiitRecognised: true,
  jurisdiction: true,
  usStateOfIncorporation: true,
  currentFmvPerShare: true,
  fmvValuationDate: true,
  fmvValuerName: true,
} as const;

export async function requireCompanyWorkspace() {
  const user = await requireAuthenticatedUser();

  const isEvcOwner =
    Boolean(process.env.FOUNDER_EMAIL) &&
    user.email === process.env.FOUNDER_EMAIL;

  if (isEvcOwner) {
    const workspace = await prisma.companyWorkspace.upsert({
      where: { ownerId: user.id },
      update: {},
      create: {
        name: "EVC test company",
        ownerId: user.id,
        holderLimit: OWNER_HOLDER_LIMIT,
        expiresAt: OWNER_WORKSPACE_EXPIRY,
        source: SubscriptionSource.ADMIN_GRANT,
        grantReason: "EVC owner access",
      },
      select: WORKSPACE_SELECT,
    });

    // EVC owner bypasses expiry, status and holder limit.
    return {
      user,
      workspace,
      isEvcOwner: true,
      holderLimit: OWNER_HOLDER_LIMIT,
    };
  }

  const workspace = await prisma.companyWorkspace.findUnique({
    where: { ownerId: user.id },
    select: WORKSPACE_SELECT,
  });

  if (!workspace) {
    throw new ProAccessError(
      `A ${STARTUP_PLAN.name} could not be found for this account.`,
      403,
      "COMPANY_WORKSPACE_REQUIRED"
    );
  }

  if (workspace.status !== "ACTIVE" || workspace.expiresAt <= new Date()) {
    throw new ProAccessError(
      `Your ${STARTUP_PLAN.name} has expired. Please renew to continue.`,
      403,
      "COMPANY_WORKSPACE_EXPIRED"
    );
  }

  return {
    user,
    workspace,
    isEvcOwner: false,
    holderLimit: workspace.holderLimit,
  };
}

/**
 * Security boundary: a grant is only reachable by the workspace that owns it.
 * Never trust a grantId from the browser on its own.
 */
export async function requireGrantInWorkspace(
  workspaceId: string,
  grantId: string
) {
  const grant = await prisma.optionGrant.findFirst({
    where: { id: grantId, workspaceId },
  });

  if (!grant) {
    throw new ProAccessError("Grant not found.", 404, "GRANT_NOT_FOUND");
  }

  return grant;
}

/**
 * The option-holder limit counts people, not grants: two grants to the same
 * employee use one slot. People are matched by email when given, else name.
 */
export function holderKeyFor(input: {
  employeeEmail?: string | null;
  employeeName: string;
}): string {
  const email = input.employeeEmail?.trim().toLowerCase();
  if (email) return `email:${email}`;

  const name = input.employeeName.trim().toLowerCase().replace(/\s+/g, " ");
  return `name:${name}`;
}

const COUNTED_STATUSES: OptionGrantStatus[] = [
  OptionGrantStatus.DRAFT,
  OptionGrantStatus.ISSUED,
  OptionGrantStatus.ACCEPTED,
  OptionGrantStatus.LEFT,
  OptionGrantStatus.EXERCISED,
];

/**
 * Enforce the plan's option-holder cap before creating a grant.
 * A new grant to someone who already holds options never needs a new slot.
 */
export async function assertCanAddOptionHolder(
  workspaceId: string,
  holderKey: string,
  holderLimit: number,
  isEvcOwner: boolean
) {
  if (isEvcOwner) return;

  const existing = await prisma.optionGrant.findFirst({
    where: { workspaceId, holderKey, status: { in: COUNTED_STATUSES } },
    select: { id: true },
  });

  if (existing) return;

  const holders = await prisma.optionGrant.findMany({
    where: { workspaceId, status: { in: COUNTED_STATUSES } },
    distinct: ["holderKey"],
    select: { holderKey: true },
  });

  if (holders.length >= holderLimit) {
    throw new ProAccessError(
      `Your plan covers ${holderLimit} option holders. Contact us to add more.`,
      403,
      "HOLDER_LIMIT_REACHED"
    );
  }
}

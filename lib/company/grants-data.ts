import type { OptionGrant, EsopScheme } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  grantPosition,
  grantWarnings,
  vestingMilestones,
  type GrantTerms,
} from "@/lib/company/grants";

/** Grants that use up pool. Drafts do not until issued. */
export const POOL_STATUSES = ["ISSUED", "ACCEPTED", "LEFT", "EXERCISED"] as const;

export function termsOf(g: OptionGrant): GrantTerms {
  return {
    grantDate: g.grantDate,
    options: g.options,
    exercisePrice: g.exercisePrice,
    vestingStart: g.vestingStart,
    vestingMonths: g.vestingMonths,
    cliffMonths: g.cliffMonths,
    expiryDate: g.expiryDate,
    postExitDays: g.postExitDays,
    optionsLapsed: g.optionsLapsed,
    optionsExercised: g.optionsExercised,
    leftOn: g.leftOn,
  };
}

/** Options used from a scheme's pool by issued grants, net of lapsed, optionally excluding one grant. */
export async function poolUsed(schemeId: string, excludeGrantId?: string) {
  const rows = await prisma.optionGrant.findMany({
    where: {
      schemeId,
      status: { in: [...POOL_STATUSES] },
      ...(excludeGrantId ? { id: { not: excludeGrantId } } : {}),
    },
    select: { options: true, optionsLapsed: true },
  });
  return rows.reduce((s, r) => s + (r.options - r.optionsLapsed), 0);
}

type WorkspaceForWarnings = {
  dpiitRecognised: boolean | null;
  incorporationDate: Date | null;
};

export async function warningsFor(
  terms: GrantTerms,
  scheme: EsopScheme,
  workspace: WorkspaceForWarnings,
  isPromoterOver10Pct: boolean,
  excludeGrantId?: string
) {
  return grantWarnings(terms, {
    poolSize: scheme.poolSize,
    poolUsedByOthers: await poolUsed(scheme.id, excludeGrantId),
    shareholderApprovedOn: scheme.shareholderApprovedOn,
    boardApprovedOn: scheme.boardApprovedOn,
    dpiitRecognised: workspace.dpiitRecognised,
    incorporationDate: workspace.incorporationDate,
    isPromoterOver10Pct,
  });
}

/** One grant with its scheme, position today, milestones and warnings. */
export async function grantDetail(
  grant: OptionGrant & { scheme: EsopScheme },
  workspace: WorkspaceForWarnings
) {
  const terms = termsOf(grant);
  const today = new Date();

  return {
    grant,
    position: grantPosition(terms, today),
    milestones: vestingMilestones(terms),
    warnings: await warningsFor(
      terms,
      grant.scheme,
      workspace,
      grant.isPromoterOver10Pct,
      grant.id
    ),
  };
}

export async function listSchemes(workspaceId: string) {
  const schemes = await prisma.esopScheme.findMany({
    where: { workspaceId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      grants: {
        select: { status: true, options: true, optionsLapsed: true, optionsExercised: true },
      },
    },
  });

  return schemes.map(({ grants, ...s }) => {
    let issued = 0;
    let drafts = 0;
    for (const g of grants) {
      if ((POOL_STATUSES as readonly string[]).includes(g.status)) issued += g.options - g.optionsLapsed;
      if (g.status === "DRAFT") drafts += g.options;
    }
    return {
      ...s,
      grantCount: grants.length,
      optionsIssued: issued,
      optionsInDraft: drafts,
      optionsAvailable: Math.max(0, s.poolSize - issued),
    };
  });
}

export async function listGrants(workspaceId: string) {
  const grants = await prisma.optionGrant.findMany({
    where: { workspaceId },
    orderBy: [{ grantDate: "desc" }, { createdAt: "desc" }],
    include: { scheme: { select: { id: true, name: true } } },
  });

  const today = new Date();
  return grants.map((g) => ({
    ...g,
    position: grantPosition(termsOf(g), today),
  }));
}

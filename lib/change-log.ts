import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================================
 * CHANGE HISTORY (audit trail)
 * ============================================================================
 *
 * Every change on the Startup Equity Desk and in the Advisor Console writes
 * one row here: who did it, when, what, and the key numbers before / after.
 *
 * Rules:
 * - Logging never breaks the user's action. If the write fails it is logged
 *   to the server console and the request carries on.
 * - Rows are never edited or deleted by the app (no update/delete routes),
 *   and they have no foreign keys, so history survives even when the thing
 *   it describes (a grant, a client) is deleted.
 * - Only facts the user entered are stored. No passwords, passcodes, tokens
 *   or PAN numbers ever go into `details`.
 * ============================================================================
 */

export type ChangeEntry = {
  /** Machine code, e.g. "grant.issued". */
  action: string;
  /** What kind of thing changed, e.g. "grant", "class", "client". */
  entityType: string;
  entityId?: string | null;
  /** One plain sentence shown in the history list. */
  summary: string;
  /** Optional extra facts (numbers, dates, before/after). */
  details?: Record<string, unknown> | null;
};

type Actor = { id: string; name?: string | null; email?: string | null };

function actorLabel(user: Actor): string {
  const name = user.name?.trim();
  const email = user.email?.trim();
  if (name && email) return `${name} (${email})`;
  return name || email || "Unknown user";
}

/** Dates become "2026-11-22"; undefined is dropped; everything stays JSON-safe. */
function cleanDetails(details: ChangeEntry["details"]): Prisma.InputJsonValue | undefined {
  if (!details) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details)) {
    if (v === undefined) continue;
    out[k] = v instanceof Date ? v.toISOString().slice(0, 10) : v;
  }
  return out as Prisma.InputJsonValue;
}

async function write(data: Prisma.ChangeLogCreateInput) {
  try {
    await prisma.changeLog.create({ data });
  } catch (error) {
    console.error("[change-log] could not record change:", data.action, error);
  }
}

/** A change made by a signed-in user on the Startup Equity Desk. */
export function logCompanyChange(
  ctx: { user: Actor; workspace: { id: string } },
  entry: ChangeEntry
) {
  return write({
    scope: "COMPANY",
    workspaceId: ctx.workspace.id,
    actorUserId: ctx.user.id,
    actorLabel: actorLabel(ctx.user),
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    summary: entry.summary.slice(0, 500),
    details: cleanDetails(entry.details),
  });
}

/** Something an employee did on their own grant page (no login). */
export function logEmployeeAction(
  workspaceId: string,
  employeeName: string,
  entry: ChangeEntry
) {
  return write({
    scope: "COMPANY",
    workspaceId,
    actorUserId: null,
    actorLabel: `Employee: ${employeeName} (grant link)`,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    summary: entry.summary.slice(0, 500),
    details: cleanDetails(entry.details),
  });
}

/** A change made in the Advisor Console. clientId is null for firm-level changes. */
export function logAdvisorChange(
  ctx: { user: Actor; firm: { id: string } },
  clientId: string | null,
  entry: ChangeEntry
) {
  return write({
    scope: "ADVISOR",
    firmId: ctx.firm.id,
    clientId,
    actorUserId: ctx.user.id,
    actorLabel: actorLabel(ctx.user),
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    summary: entry.summary.slice(0, 500),
    details: cleanDetails(entry.details),
  });
}

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

export type ChangeRow = {
  id: string;
  createdAt: string;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  details: unknown;
};

const PAGE = 100;

function toRows(
  rows: {
    id: string;
    createdAt: Date;
    actorLabel: string;
    action: string;
    entityType: string;
    entityId: string | null;
    summary: string;
    details: unknown;
  }[]
): ChangeRow[] {
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/**
 * Newest first. `before` (an ISO date-time from the last row) loads the next
 * page. `all` is for exports (capped at 5,000 rows).
 */
export async function listChanges(
  where: Prisma.ChangeLogWhereInput,
  opts: { before?: string | null; entityType?: string | null; all?: boolean } = {}
): Promise<{ rows: ChangeRow[]; hasMore: boolean }> {
  const before = opts.before ? new Date(opts.before) : null;
  const take = opts.all ? 5000 : PAGE + 1;

  const rows = await prisma.changeLog.findMany({
    where: {
      ...where,
      ...(opts.entityType ? { entityType: opts.entityType } : {}),
      ...(before && !Number.isNaN(before.getTime()) ? { createdAt: { lt: before } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      createdAt: true,
      actorLabel: true,
      action: true,
      entityType: true,
      entityId: true,
      summary: true,
      details: true,
    },
  });

  if (opts.all) return { rows: toRows(rows), hasMore: false };
  return { rows: toRows(rows.slice(0, PAGE)), hasMore: rows.length > PAGE };
}

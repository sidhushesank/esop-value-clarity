import { prisma } from "@/lib/prisma";
import { ProAccessError } from "@/lib/pro-access";

/**
 * ============================================================================
 * TEAM LOGINS
 * ============================================================================
 *
 * A Startup Equity Desk workspace or an Advisor Console firm has one OWNER
 * (whoever bought the plan, stored as ownerId) plus invited members:
 *
 *   ADMIN   can do everything the owner can, including managing the team,
 *           except buying or renewing the plan.
 *   VIEWER  can open and download everything, but cannot change anything.
 *
 * A member is invited by email. They sign up / log in with that same email
 * and, once the email is verified, they land in the team's workspace.
 * There is no invite token to steal: access is tied to the verified email.
 * ============================================================================
 */

export type TeamKind = "COMPANY" | "ADVISOR";
export type MemberRole = "ADMIN" | "VIEWER";
export type AccessRole = "OWNER" | MemberRole;

/** Members allowed in addition to the owner. EVC's own accounts are unlimited. */
export const TEAM_LIMITS: Record<TeamKind, number> = {
  COMPANY: 5,
  ADVISOR: 10,
};

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Throws a friendly 403 when a view-only member tries to change something. */
export function assertCanWrite(role: AccessRole) {
  if (role === "VIEWER") {
    throw new ProAccessError(
      "You have view-only access. Ask the owner or an admin to make this change.",
      403,
      "VIEW_ONLY"
    );
  }
}

export function assertCanManageTeam(role: AccessRole) {
  if (role === "VIEWER") {
    throw new ProAccessError(
      "Only the owner or an admin can manage the team.",
      403,
      "TEAM_ADMIN_REQUIRED"
    );
  }
}

/**
 * Finds the active membership for this user (by verified email), and links
 * the user id on first use. Returns null when there is none.
 */
export async function findMembership(
  kind: TeamKind,
  user: { id: string; email: string; emailVerified: boolean }
) {
  const email = normaliseEmail(user.email);

  const member = await prisma.seatMember.findFirst({
    where: { kind, email, revokedAt: null },
    orderBy: { createdAt: "asc" },
  });

  if (!member) return null;

  if (!user.emailVerified) {
    throw new ProAccessError(
      "You've been invited to a team. Verify your email address first (check your inbox), then log in again.",
      403,
      "EMAIL_NOT_VERIFIED"
    );
  }

  if (!member.userId || !member.acceptedAt) {
    await prisma.seatMember.update({
      where: { id: member.id },
      data: { userId: user.id, acceptedAt: member.acceptedAt ?? new Date() },
    });
  }

  return member;
}

/* ------------------------------------------------------------------ */
/* Listing and changes (shared by the company and advisor team APIs)   */
/* ------------------------------------------------------------------ */

type Scope = { kind: TeamKind; ownerId: string; workspaceId?: string; firmId?: string };

function scopeWhere(s: Scope) {
  return s.kind === "COMPANY"
    ? { kind: "COMPANY" as const, workspaceId: s.workspaceId }
    : { kind: "ADVISOR" as const, firmId: s.firmId };
}

export async function listTeam(s: Scope) {
  const [owner, members] = await Promise.all([
    prisma.user.findUnique({
      where: { id: s.ownerId },
      select: { name: true, email: true },
    }),
    prisma.seatMember.findMany({
      where: { ...scopeWhere(s), revokedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        acceptedAt: true,
        userId: true,
      },
    }),
  ]);

  const userIds = members.map((m) => m.userId).filter((x): x is string => !!x);
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, lastActiveAt: true },
      })
    : [];
  const byId = new Map(users.map((u) => [u.id, u]));

  return {
    owner: { name: owner?.name ?? "", email: owner?.email ?? "" },
    members: members.map((m) => ({
      id: m.id,
      email: m.email,
      role: m.role as MemberRole,
      invitedAt: m.createdAt.toISOString(),
      joinedAt: m.acceptedAt ? m.acceptedAt.toISOString() : null,
      name: m.userId ? byId.get(m.userId)?.name ?? null : null,
      lastActiveAt: m.userId ? byId.get(m.userId)?.lastActiveAt?.toISOString() ?? null : null,
    })),
  };
}

export async function addMember(
  s: Scope & { unlimited: boolean },
  input: { email: string; role: MemberRole; invitedById: string }
) {
  const email = normaliseEmail(input.email);

  const owner = await prisma.user.findUnique({ where: { id: s.ownerId }, select: { email: true } });
  if (owner && normaliseEmail(owner.email) === email) {
    throw new ProAccessError("That's the owner's email; the owner already has full access.", 400, "ALREADY_OWNER");
  }

  // One team per email per product keeps "which workspace do I see?" unambiguous.
  const elsewhere = await prisma.seatMember.findFirst({
    where: { kind: s.kind, email, revokedAt: null },
  });
  if (elsewhere) {
    const same = s.kind === "COMPANY" ? elsewhere.workspaceId === s.workspaceId : elsewhere.firmId === s.firmId;
    throw new ProAccessError(
      same
        ? "This person is already on the team."
        : "This email is already a member of another team on EVC. Ask them to use a different email, or to be removed from the other team first.",
      409,
      same ? "ALREADY_MEMBER" : "MEMBER_OF_OTHER_TEAM"
    );
  }

  // Someone who already owns their own workspace/firm would never see this one.
  const invitee = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      id: true,
      ownedCompanyWorkspace: { select: { id: true } },
      ownedAdvisorFirm: { select: { id: true } },
    },
  });
  if (invitee && (s.kind === "COMPANY" ? invitee.ownedCompanyWorkspace : invitee.ownedAdvisorFirm)) {
    throw new ProAccessError(
      s.kind === "COMPANY"
        ? "This email already has its own Startup plan, so it can't join another company's team. Use a different email."
        : "This email already has its own Advisor plan, so it can't join another firm's team. Use a different email.",
      409,
      "INVITEE_OWNS_PLAN"
    );
  }

  if (!s.unlimited) {
    const count = await prisma.seatMember.count({ where: { ...scopeWhere(s), revokedAt: null } });
    if (count >= TEAM_LIMITS[s.kind]) {
      throw new ProAccessError(
        `Your plan includes ${TEAM_LIMITS[s.kind]} team members besides the owner. Remove someone, or contact us to add more.`,
        403,
        "TEAM_LIMIT_REACHED"
      );
    }
  }

  // Re-inviting someone who was removed earlier reuses their old row.
  const previous = await prisma.seatMember.findFirst({
    where: { ...scopeWhere(s), email },
  });

  if (previous) {
    return prisma.seatMember.update({
      where: { id: previous.id },
      data: {
        role: input.role,
        revokedAt: null,
        invitedById: input.invitedById,
        acceptedAt: null,
        userId: null,
        createdAt: new Date(),
      },
    });
  }

  return prisma.seatMember.create({
    data: {
      ...scopeWhere(s),
      email,
      role: input.role,
      invitedById: input.invitedById,
    },
  });
}

export async function findMemberInScope(s: Scope, memberId: string) {
  const member = await prisma.seatMember.findFirst({
    where: { id: memberId, ...scopeWhere(s), revokedAt: null },
  });
  if (!member) {
    throw new ProAccessError("Team member not found.", 404, "MEMBER_NOT_FOUND");
  }
  return member;
}

export function changeRole(memberId: string, role: MemberRole) {
  return prisma.seatMember.update({ where: { id: memberId }, data: { role } });
}

export function removeMember(memberId: string) {
  return prisma.seatMember.update({
    where: { id: memberId },
    data: { revokedAt: new Date() },
  });
}

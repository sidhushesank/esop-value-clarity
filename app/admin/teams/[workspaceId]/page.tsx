"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  Activity,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Crown,
  ExternalLink,
  IndianRupee,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

type TeamWorkspaceResponse = {
  success: boolean;

  message?: string;

  workspace: {
    id: string;

    name: string;

    status:
      | "ACTIVE"
      | "EXPIRED";

    access:
      | "UNLIMITED"
      | "ANNUAL"
      | "EXPIRED";

    isFounder: boolean;

    isCurrentlyActive: boolean;

    startedAt: string;

    expiresAt: string;

    createdAt: string;

    updatedAt: string;

    owner: {
      id: string;

      name: string;

      email: string;

      role: "USER" | "ADMIN";

      accountStatus:
        | "ACTIVE"
        | "SUSPENDED";

      emailVerified: boolean;

      createdAt: string;

      lastLoginAt: string | null;

      lastActiveAt: string | null;

      personalSubscription: {
        plan:
          | "FREE"
          | "PRO";

        status:
          | "ACTIVE"
          | "CANCELLED"
          | "EXPIRED";

        source:
          | "PAYMENT"
          | "ADMIN_GRANT";

        billingCycle:
          | "MONTHLY"
          | "SIX_MONTHS"
          | "YEARLY"
          | "TEAM_YEARLY"
          | null;

        expiresAt: string | null;
      } | null;
    };

    members: {
      active: number;

      total: number;

      max: number;

      remaining: number;

      utilizationPercent: number;

      records: Array<{
        membershipId: string;

        userId: string;

        name: string;

        email: string;

        role: "USER" | "ADMIN";

        accountStatus:
          | "ACTIVE"
          | "SUSPENDED";

        emailVerified: boolean;

        membershipStatus:
          | "ACTIVE"
          | "REMOVED";

        addedAt: string;

        removedAt: string | null;

        createdAt: string;

        updatedAt: string;

        lastLoginAt: string | null;

        lastActiveAt: string | null;

        joinedAsOwner: boolean;

        isFounder: boolean;

        isTeamSponsored: boolean;

        isPro: boolean;

        accessSource:
          | "FOUNDER"
          | "PERSONAL_PRO"
          | "TEAM_SPONSORED"
          | "NONE";

        subscription: {
          plan:
            | "FREE"
            | "PRO";

          status:
            | "ACTIVE"
            | "CANCELLED"
            | "EXPIRED";

          source:
            | "PAYMENT"
            | "ADMIN_GRANT";

          billingCycle:
            | "MONTHLY"
            | "SIX_MONTHS"
            | "YEARLY"
            | "TEAM_YEARLY"
            | null;

          expiresAt: string | null;
        } | null;
      }>;
    };

    payments: {
      totalRecords: number;

      successful: number;

      pending: number;

      failed: number;

      totalRevenuePaise: number;

      totalRevenue: number;

      currency: string;

      latestSuccessfulPayment: {
        id: string;

        amountPaise: number;

        amount: number;

        currency: string;

        status: "SUCCESS";

        razorpayOrderId:
          string | null;

        razorpayPaymentId:
          string | null;

        startedAt: string;

        expiresAt: string;

        createdAt: string;
      } | null;

      records: Array<{
        id: string;

        paymentType: "TEAM";

        plan: "TEAM";

        billingCycle: "TEAM_YEARLY";

        amountPaise: number;

        amount: number;

        currency: string;

        status: PaymentStatus;

        razorpayOrderId:
          string | null;

        razorpayPaymentId:
          string | null;

        startedAt: string;

        expiresAt: string;

        createdAt: string;

        updatedAt: string;

        purchaser: {
          id: string;

          name: string;

          email: string;
        };

        isLatestSuccessfulPayment: boolean;
      }>;
    };

    entitlement: {
      type:
        | "FOUNDER"
        | "TEAM_YEARLY";

      label: string;

      maxMembers: number;

      startedAt: string;

      expiresAt: string | null;

      renewalRequired: boolean;
    };
  };
};

function formatCurrency(
  amount: number,
  currency = "INR"
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function formatShortDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatLabel(
  value: string
) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

export default function AdminTeamWorkspacePage() {
  const params =
    useParams<{
      workspaceId: string;
    }>();

  const workspaceId =
    params.workspaceId;

  const [
    data,
    setData,
  ] =
    useState<TeamWorkspaceResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    expandedMembers,
    setExpandedMembers,
  ] =
    useState<
      Record<string, boolean>
    >({});

  const loadWorkspace =
    useCallback(
      async (
        showRefresh = false
      ) => {
        try {
          if (
            showRefresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(true);
          }

          setError("");

          const response =
            await fetch(
              `/api/admin/teams/${encodeURIComponent(
                workspaceId
              )}`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as TeamWorkspaceResponse;

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ??
                "Unable to load the Team Workspace."
            );
          }

          setData(result);
        } catch (
          error
        ) {
          console.error(
            "Failed to load Admin Team Workspace:",
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : "Unable to load the Team Workspace."
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      [workspaceId]
    );

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const workspace =
    data?.workspace ??
    null;

  const activeMembers =
    useMemo(() => {
      return (
        workspace?.members.records.filter(
          (member) =>
            member.membershipStatus ===
            "ACTIVE"
        ) ?? []
      );
    }, [workspace]);

  function toggleMember(
    memberId: string
  ) {
    setExpandedMembers(
      (current) => ({
        ...current,
        [memberId]:
          !current[memberId],
      })
    );
  }

  if (loading) {
    return (
      <WorkspaceLoading />
    );
  }

  if (
    error &&
    !workspace
  ) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <div className="rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <XCircle
            size={28}
            className="mx-auto text-red-600"
          />

          <h1 className="mt-4 text-lg font-black text-slate-950">
            Unable to load workspace
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadWorkspace()
            }
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white"
          >
            <RefreshCw
              size={15}
            />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ======================================================= */}
      {/* HEADER                                                  */}
      {/* ======================================================= */}

      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link
            href="/admin/teams"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft
              size={16}
            />
            Back to Team Control Room
          </Link>

          <div className="mt-4 flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg">
              <Building2
                size={25}
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {workspace.name}
                </h1>

                <WorkspaceStatusBadge
                  status={
                    workspace.status
                  }
                />

                <AccessBadge
                  access={
                    workspace.access
                  }
                />
              </div>

              <p className="mt-1 break-all text-xs text-slate-500">
                Workspace ID:{" "}
                {workspace.id}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Private Founder view of
                the Team entitlement,
                purchaser, members and
                payment history.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            loadWorkspace(
              true
            )
          }
          disabled={
            refreshing
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 xl:self-auto"
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing"
            : "Refresh"}
        </button>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================= */}
      {/* KPI ROW                                                 */}
      {/* ======================================================= */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={
            <Users
              size={19}
            />
          }
          label="Members"
          value={`${workspace.members.active}/${workspace.members.max}`}
          description={`${workspace.members.remaining} slots remaining`}
        />

        <MetricCard
          icon={
            <IndianRupee
              size={19}
            />
          }
          label="Team Revenue"
          value={formatCurrency(
            workspace.payments.totalRevenue,
            workspace.payments.currency
          )}
          description={`${workspace.payments.successful} successful payments`}
        />

        <MetricCard
          icon={
            <CreditCard
              size={19}
            />
          }
          label="Payments"
          value={String(
            workspace.payments.totalRecords
          )}
          description={`${workspace.payments.pending} pending`}
        />

        <MetricCard
          icon={
            <Activity
              size={19}
            />
          }
          label="Utilization"
          value={`${workspace.members.utilizationPercent}%`}
          description="Workspace capacity"
        />

        <MetricCard
          icon={
            <CalendarDays
              size={19}
            />
          }
          label={
            workspace.isFounder
              ? "Entitlement"
              : "Expires"
          }
          value={
            workspace.isFounder
              ? "Unlimited"
              : formatShortDate(
                  workspace.expiresAt
                )
          }
          description={
            workspace.isFounder
              ? "Founder access"
              : "Annual Team term"
          }
        />
      </section>

      {/* ======================================================= */}
      {/* WORKSPACE + OWNER                                       */}
      {/* ======================================================= */}

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Panel
          title="Workspace Intelligence"
          description="Commercial and operational state."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailTile
              icon={
                <Building2
                  size={16}
                />
              }
              label="Workspace"
              value={
                workspace.name
              }
            />

            <DetailTile
              icon={
                <ShieldCheck
                  size={16}
                />
              }
              label="Access"
              value={
                workspace.entitlement
                  .label
              }
            />

            <DetailTile
              icon={
                <CalendarDays
                  size={16}
                />
              }
              label="Started"
              value={formatDate(
                workspace.startedAt
              )}
            />

            <DetailTile
              icon={
                <CalendarDays
                  size={16}
                />
              }
              label="Expires"
              value={
                workspace.isFounder
                  ? "Unlimited"
                  : formatDate(
                      workspace.expiresAt
                    )
              }
            />

            <DetailTile
              icon={
                <Users
                  size={16}
                />
              }
              label="Capacity"
              value={`${workspace.members.active}/${workspace.members.max}`}
            />

            <DetailTile
              icon={
                <Activity
                  size={16}
                />
              }
              label="Utilization"
              value={`${workspace.members.utilizationPercent}%`}
            />

            <DetailTile
              icon={
                <CreditCard
                  size={16}
                />
              }
              label="Billing"
              value={
                workspace
                  .entitlement
                  .type ===
                "FOUNDER"
                  ? "Founder access"
                  : "TEAM_YEARLY"
              }
            />

            <DetailTile
              icon={
                <ShieldCheck
                  size={16}
                />
              }
              label="Renewal"
              value={
                workspace
                  .entitlement
                  .renewalRequired
                  ? "Required"
                  : "Not required"
              }
            />
          </div>
        </Panel>

        <Panel
          title="Workspace Owner"
          description="Purchaser and Team administrator."
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <UserRound
                size={24}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-black text-slate-950">
                  {
                    workspace.owner
                      .name
                  }
                </p>

                {workspace.isFounder && (
                  <TeamBadge
                    variant="founder"
                  >
                    FOUNDER
                  </TeamBadge>
                )}

                <AccountStatusBadge
                  status={
                    workspace.owner
                      .accountStatus
                  }
                />
              </div>

              <p className="mt-1 break-all text-sm text-slate-500">
                {
                  workspace.owner
                    .email
                }
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <SmallPill>
                  {workspace.owner
                    .emailVerified
                    ? "Email verified"
                    : "Email unverified"}
                </SmallPill>

                <SmallPill>
                  {workspace.owner
                    .role}
                </SmallPill>

                <SmallPill>
                  {workspace.owner
                    .personalSubscription
                    ?.plan ??
                    "FREE"}{" "}
                  personal plan
                </SmallPill>
              </div>
            </div>

            <Link
              href={`/admin/users/${workspace.owner.id}`}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Open user
              <ExternalLink
                size={13}
              />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <DetailTile
              icon={
                <CalendarDays
                  size={15}
                />
              }
              label="Joined"
              value={formatDate(
                workspace.owner
                  .createdAt
              )}
            />

            <DetailTile
              icon={
                <Activity
                  size={15}
                />
              }
              label="Last login"
              value={formatDate(
                workspace.owner
                  .lastLoginAt
              )}
            />

            <DetailTile
              icon={
                <Activity
                  size={15}
                />
              }
              label="Last active"
              value={formatDate(
                workspace.owner
                  .lastActiveAt
              )}
            />
          </div>
        </Panel>
      </section>

      {/* ======================================================= */}
      {/* MEMBERS                                                 */}
      {/* ======================================================= */}

      <Panel
        title="Team Members"
        description="Every account receiving access through this workspace."
        action={
          <span className="text-xs font-bold text-slate-400">
            {workspace.members.active}/
            {workspace.members.max} active
          </span>
        }
      >
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              Capacity utilization
            </span>

            <span>
              {
                workspace.members
                  .utilizationPercent
              }
              %
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${Math.min(
                  workspace
                    .members
                    .utilizationPercent,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {activeMembers.length ===
        0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
            No active members.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeMembers.map(
              (member) => {
                const expanded =
                  Boolean(
                    expandedMembers[
                      member.userId
                    ]
                  );

                return (
                  <div
                    key={
                      member.membershipId
                    }
                    className="py-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-xs font-black text-white">
                          {getInitials(
                            member.name
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-black text-slate-950">
                              {
                                member.name
                              }
                            </p>

                            {member.joinedAsOwner && (
                              <TeamBadge
                                variant="admin"
                              >
                                OWNER
                              </TeamBadge>
                            )}

                            {member.isFounder && (
                              <TeamBadge
                                variant="founder"
                              >
                                FOUNDER
                              </TeamBadge>
                            )}

                            {!member.joinedAsOwner &&
                              member.isTeamSponsored && (
                                <MemberBadge>
                                  TEAM-SPONSORED
                                </MemberBadge>
                              )}
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {
                              member.email
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <SmallPill>
                          {member.isPro
                            ? "PRO"
                            : "FREE"}
                        </SmallPill>

                        <SmallPill>
                          {formatLabel(
                            member.accessSource
                          )}
                        </SmallPill>

                        <SmallPill>
                          {member.accountStatus}
                        </SmallPill>

                        <Link
                          href={`/admin/users/${member.userId}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          User
                          <ExternalLink
                            size={12}
                          />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            toggleMember(
                              member.userId
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                        >
                          Details
                          {expanded ? (
                            <ChevronUp
                              size={13}
                            />
                          ) : (
                            <ChevronDown
                              size={13}
                            />
                          )}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        <DetailTile
                          icon={
                            <CalendarDays
                              size={15}
                            />
                          }
                          label="Added"
                          value={formatDate(
                            member.addedAt
                          )}
                        />

                        <DetailTile
                          icon={
                            <Activity
                              size={15}
                            />
                          }
                          label="Last login"
                          value={formatDate(
                            member.lastLoginAt
                          )}
                        />

                        <DetailTile
                          icon={
                            <Activity
                              size={15}
                            />
                          }
                          label="Last active"
                          value={formatDate(
                            member.lastActiveAt
                          )}
                        />

                        <DetailTile
                          icon={
                            <ShieldCheck
                              size={15}
                            />
                          }
                          label="Access source"
                          value={formatLabel(
                            member.accessSource
                          )}
                        />

                        <DetailTile
                          icon={
                            <ShieldCheck
                              size={15}
                            />
                          }
                          label="Membership"
                          value={formatLabel(
                            member.membershipStatus
                          )}
                        />

                        <DetailTile
                          icon={
                            <Mail
                              size={15}
                            />
                          }
                          label="Verification"
                          value={
                            member.emailVerified
                              ? "Verified"
                              : "Not verified"
                          }
                        />

                        <DetailTile
                          icon={
                            <Crown
                              size={15}
                            />
                          }
                          label="Plan"
                          value={
                            member
                              .subscription
                              ?.plan ??
                            "FREE"
                          }
                        />

                        <DetailTile
                          icon={
                            <CalendarDays
                              size={15}
                            />
                          }
                          label="Personal expiry"
                          value={
                            member
                              .subscription
                              ?.expiresAt
                              ? formatDate(
                                  member
                                    .subscription
                                    .expiresAt
                                )
                              : "—"
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </Panel>

      {/* ======================================================= */}
      {/* PAYMENT + ENTITLEMENT                                   */}
      {/* ======================================================= */}

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Panel
          title="Team Entitlement"
          description="Commercial entitlement attached to this workspace."
        >
          <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                  Entitlement
                </p>

                <p className="mt-2 text-xl font-black text-slate-950">
                  {
                    workspace
                      .entitlement
                      .label
                  }
                </p>
              </div>

              {workspace.isFounder ? (
                <Crown
                  size={24}
                  className="text-amber-500"
                />
              ) : (
                <ShieldCheck
                  size={24}
                  className="text-blue-600"
                />
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailTile
                icon={
                  <CalendarDays
                    size={15}
                  />
                }
                label="Started"
                value={formatDate(
                  workspace.entitlement
                    .startedAt
                )}
              />

              <DetailTile
                icon={
                  <CalendarDays
                    size={15}
                  />
                }
                label="Expires"
                value={
                  workspace
                    .entitlement
                    .expiresAt
                    ? formatDate(
                        workspace
                          .entitlement
                          .expiresAt
                      )
                    : "Unlimited"
                }
              />

              <DetailTile
                icon={
                  <Users
                    size={15}
                  />
                }
                label="Max members"
                value={String(
                  workspace
                    .entitlement
                    .maxMembers
                )}
              />

              <DetailTile
                icon={
                  <ShieldCheck
                    size={15}
                  />
                }
                label="Renewal"
                value={
                  workspace
                    .entitlement
                    .renewalRequired
                    ? "Required"
                    : "Not required"
                }
              />
            </div>
          </div>
        </Panel>

        <Panel
          title="Team Payment History"
          description="Payments associated with this Team Workspace."
          action={
            <span className="text-xs font-bold text-slate-400">
              {
                workspace.payments
                  .totalRecords
              }{" "}
              records
            </span>
          }
        >
          {workspace.payments
            .records.length ===
          0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
              No Team payment records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <TableHeading>
                      Date
                    </TableHeading>

                    <TableHeading>
                      Amount
                    </TableHeading>

                    <TableHeading>
                      Billing
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Payment ID
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {workspace.payments.records.map(
                    (payment) => (
                      <tr
                        key={
                          payment.id
                        }
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-3 py-3 text-xs text-slate-600">
                          {formatDate(
                            payment.createdAt
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <p className="text-sm font-black text-slate-950">
                            {formatCurrency(
                              payment.amount,
                              payment.currency
                            )}
                          </p>

                          {payment.isLatestSuccessfulPayment && (
                            <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-emerald-600">
                              Latest successful
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700">
                            TEAM_YEARLY
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <PaymentStatusBadge
                            status={
                              payment.status
                            }
                          />
                        </td>

                        <td className="px-3 py-3">
                          <code className="text-[10px] text-slate-500">
                            {
                              payment
                                .razorpayPaymentId ??
                              payment
                                .razorpayOrderId ??
                              "—"
                            }
                          </code>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>

      {/* ======================================================= */}
      {/* AUDIT / OPERATIONAL NOTE                                */}
      {/* ======================================================= */}

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-700 shadow-sm">
            <ShieldCheck
              size={19}
            />
          </div>

          <div>
            <p className="text-sm font-black text-slate-950">
              Founder inspection mode
            </p>

            <p className="mt-1 max-w-4xl text-xs leading-6 text-slate-500">
              This workspace view is currently
              read-only. It gives you visibility into
              the purchaser, sponsored members,
              entitlement, workspace capacity and
              Team payments without introducing
              destructive controls into the first
              monitoring layer.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================ */
/* METRIC CARD                                                  */
/* ============================================================ */

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;

  label: string;

  value: string;

  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* ============================================================ */
/* PANEL                                                        */
/* ============================================================ */

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;

  description: string;

  action?: React.ReactNode;

  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-950">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        {action}
      </div>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

/* ============================================================ */
/* DETAIL TILE                                                   */
/* ============================================================ */

function DetailTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;

  label: string;

  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}

        <p className="text-[9px] font-black uppercase tracking-[0.1em]">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* ============================================================ */
/* PILLS                                                        */
/* ============================================================ */

function SmallPill({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">
      {children}
    </span>
  );
}

function MemberBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-100">
      <Users
        size={9}
      />
      {children}
    </span>
  );
}

function TeamBadge({
  children,
  variant,
}: {
  children: React.ReactNode;

  variant:
    | "founder"
    | "admin";
}) {
  const styles = {
    founder:
      "bg-amber-50 text-amber-700 ring-amber-100",

    admin:
      "bg-blue-50 text-blue-700 ring-blue-100",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black ring-1 ring-inset ${styles[variant]}`}
    >
      <ShieldCheck
        size={9}
      />
      {children}
    </span>
  );
}

/* ============================================================ */
/* STATUS BADGES                                                */
/* ============================================================ */

function WorkspaceStatusBadge({
  status,
}: {
  status:
    | "ACTIVE"
    | "EXPIRED";
}) {
  if (
    status ===
    "ACTIVE"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-100">
        <CheckCircle2
          size={10}
        />
        ACTIVE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[9px] font-black text-red-600 ring-1 ring-inset ring-red-100">
      <XCircle
        size={10}
      />
      EXPIRED
    </span>
  );
}

function AccessBadge({
  access,
}: {
  access:
    | "UNLIMITED"
    | "ANNUAL"
    | "EXPIRED";
}) {
  if (
    access ===
    "UNLIMITED"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700 ring-1 ring-inset ring-amber-100">
        <Crown
          size={10}
        />
        UNLIMITED
      </span>
    );
  }

  if (
    access ===
    "EXPIRED"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[9px] font-black text-red-600 ring-1 ring-inset ring-red-100">
        EXPIRED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700 ring-1 ring-inset ring-blue-100">
      <CalendarDays
        size={10}
      />
      ANNUAL
    </span>
  );
}

function AccountStatusBadge({
  status,
}: {
  status:
    | "ACTIVE"
    | "SUSPENDED";
}) {
  if (
    status ===
    "ACTIVE"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-100">
        ACTIVE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[9px] font-black text-red-600 ring-1 ring-inset ring-red-100">
      SUSPENDED
    </span>
  );
}

function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  if (
    status ===
    "SUCCESS"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-100">
        <CheckCircle2
          size={10}
        />
        SUCCESS
      </span>
    );
  }

  if (
    status ===
    "FAILED"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[9px] font-black text-red-600 ring-1 ring-inset ring-red-100">
        <XCircle
          size={10}
        />
        FAILED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700 ring-1 ring-inset ring-amber-100">
      PENDING
    </span>
  );
}

/* ============================================================ */
/* TABLE HEADING                                                 */
/* ============================================================ */

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
      {children}
    </th>
  );
}

/* ============================================================ */
/* INITIALS                                                      */
/* ============================================================ */

function getInitials(
  name: string
) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0)
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    initials || "EV"
  );
}

/* ============================================================ */
/* LOADING                                                       */
/* ============================================================ */

function WorkspaceLoading() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({
          length: 5,
        }).map(
          (
            _,
            index
          ) => (
            <div
              key={
                index
              }
              className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white"
            />
          )
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />

        <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />
      </div>

      <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" />
    </div>
  );
}
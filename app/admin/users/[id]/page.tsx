"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Crown,
  Gift,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  WalletCards,
  Activity,
  Calculator,
  CreditCard,
  CalendarDays,
  Mail,
  Clock3,
  RotateCcw,
} from "lucide-react";

type UserRole = "USER" | "ADMIN";
type AccountStatus = "ACTIVE" | "SUSPENDED";
type PlanType = "FREE" | "PRO";
type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";
type SubscriptionSource = "PAYMENT" | "ADMIN_GRANT";

interface UserDetailResponse {
  success: boolean;
  message?: string;

  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;

    role: UserRole;
    accountStatus: AccountStatus;
    plan: PlanType;

    lastLoginAt: string | null;
    lastActiveAt: string | null;

    createdAt: string;
    updatedAt: string;

    subscription: {
      id: string;
      plan: PlanType;
      billingCycle:
        | "MONTHLY"
        | "SIX_MONTHS"
        | "YEARLY"
        | null;
      status: SubscriptionStatus;
      source: SubscriptionSource;
      grantedById: string | null;
      grantReason: string | null;
      startedAt: string;
      expiresAt: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;

    stats: {
      calculations: number;
      payments: number;
      activities: number;
      successfulPayments: number;
      totalPaid: number;
    };

    payments: Array<{
      id: string;
      plan: PlanType;
      billingCycle:
        | "MONTHLY"
        | "SIX_MONTHS"
        | "YEARLY";
      amount: number;
      currency: string;
      status: "PENDING" | "SUCCESS" | "FAILED";
      razorpayOrderId: string | null;
      razorpayPaymentId: string | null;
      createdAt: string;
      updatedAt: string;
    }>;

    activities: Array<{
      id: string;
      type: string;
      metadata: unknown;
      createdAt: string;
    }>;

    adminHistory: Array<{
      id: string;
      action: string;
      metadata: unknown;
      createdAt: string;
      admin: {
        id: string;
        name: string;
        email: string;
      };
    }>;
  };
}

type GrantDuration =
  | "7_DAYS"
  | "30_DAYS"
  | "90_DAYS"
  | "1_YEAR"
  | "LIFETIME";

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(
  amount: number,
  currency = "INR"
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const userId = params.id;

  const [data, setData] =
    useState<UserDetailResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [grantDuration, setGrantDuration] =
    useState<GrantDuration>("30_DAYS");

  const [grantReason, setGrantReason] =
    useState("");

  const [suspendReason, setSuspendReason] =
    useState("");

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [confirmEmail, setConfirmEmail] =
    useState("");

  const [deleteReason, setDeleteReason] =
    useState("");

  const loadUser = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          `/api/admin/users/${userId}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const result =
          (await response.json()) as UserDetailResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load user"
          );
        }

        setData(result);
      } catch (error) {
        console.error(
          "Failed to load admin user detail:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load user"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function runAction(
    key: string,
    url: string,
    body?: unknown
  ) {
    try {
      setActionLoading(key);
      setError("");

      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body:
          body === undefined
            ? undefined
            : JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Action failed"
        );
      }

      await loadUser(true);

      return result;
    } catch (error) {
      console.error(
        `Admin action failed: ${key}`,
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Action failed"
      );

      throw error;
    } finally {
      setActionLoading(null);
    }
  }

  async function handleGrantPro() {
    await runAction(
      "grant-pro",
      `/api/admin/users/${userId}/grant-pro`,
      {
        duration: grantDuration,
        reason:
          grantReason.trim() || undefined,
      }
    );

    setGrantReason("");
  }

  async function handleRevokePro() {
    await runAction(
      "revoke-pro",
      `/api/admin/users/${userId}/revoke-pro`
    );
  }

  async function handleSuspendToggle() {
    if (!data) {
      return;
    }

    const isSuspended =
      data.user.accountStatus === "SUSPENDED";

    await runAction(
      "status",
      `/api/admin/users/${userId}/suspend`,
      {
        action: isSuspended
          ? "REACTIVATE"
          : "SUSPEND",

        reason:
          suspendReason.trim() ||
          undefined,
      }
    );

    setSuspendReason("");
  }

  async function handleDelete() {
    if (!data) {
      return;
    }

    const result = await runAction(
      "delete",
      `/api/admin/users/${userId}/delete`,
      {
        confirmEmail:
          confirmEmail.trim(),
        reason:
          deleteReason.trim() ||
          undefined,
      }
    );

    if (result?.success) {
      router.push("/admin/users");
      router.refresh();
    }
  }

  const isAdminGrantedPro = useMemo(() => {
    return (
      data?.user.subscription?.plan === "PRO" &&
      data.user.subscription.source ===
        "ADMIN_GRANT"
    );
  }, [data]);

  const isPaidPro = useMemo(() => {
    return (
      data?.user.subscription?.plan === "PRO" &&
      data.user.subscription.source ===
        "PAYMENT"
    );
  }, [data]);

  if (loading) {
    return <UserDetailSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <div className="rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <Ban
            size={24}
            className="mx-auto text-red-600"
          />

          <h1 className="mt-4 text-lg font-black text-slate-950">
            Unable to load user
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadUser()}
            className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const user = data.user;

  return (
    <div className="space-y-6">
      {/* ======================================================= */}
      {/* HEADER                                                  */}
      {/* ======================================================= */}

      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to users
          </Link>

          <div className="mt-4 flex items-start gap-3">
            <UserAvatar name={user.name} />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {user.name}
                </h1>

                <RoleBadge role={user.role} />

                <PlanBadge
                  plan={user.plan}
                  source={
                    user.subscription
                      ?.source ?? null
                  }
                />

                <StatusBadge
                  status={user.accountStatus}
                />
              </div>

              <p className="mt-1 break-all text-sm text-slate-500">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadUser(true)}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 lg:self-auto"
        >
          <RefreshCw
            size={16}
            className={
              refreshing ? "animate-spin" : ""
            }
          />

          Refresh
        </button>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================= */}
      {/* OVERVIEW CARDS                                          */}
      {/* ======================================================= */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={<Calculator size={20} />}
          label="Calculations"
          value={String(
            user.stats.calculations
          )}
        />

        <InfoCard
          icon={<CreditCard size={20} />}
          label="Payments"
          value={String(user.stats.payments)}
        />

        <InfoCard
          icon={<WalletCards size={20} />}
          label="Total Paid"
          value={formatCurrency(
            user.stats.totalPaid
          )}
        />

        <InfoCard
          icon={<Activity size={20} />}
          label="Tracked Activity"
          value={String(
            user.stats.activities
          )}
        />
      </section>

      {/* ======================================================= */}
      {/* ACCOUNT + SUBSCRIPTION                                  */}
      {/* ======================================================= */}

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Account"
          description="Identity and access information."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow
              icon={<Mail size={16} />}
              label="Email"
              value={user.email}
            />

            <DetailRow
              icon={<CheckCircle2 size={16} />}
              label="Verified"
              value={
                user.emailVerified
                  ? "Yes"
                  : "No"
              }
            />

            <DetailRow
              icon={<ShieldCheck size={16} />}
              label="Role"
              value={user.role}
            />

            <DetailRow
              icon={<UserRound size={16} />}
              label="Status"
              value={user.accountStatus}
            />

            <DetailRow
              icon={<Clock3 size={16} />}
              label="Last login"
              value={formatDate(
                user.lastLoginAt
              )}
            />

            <DetailRow
              icon={<Clock3 size={16} />}
              label="Last active"
              value={formatDate(
                user.lastActiveAt
              )}
            />

            <DetailRow
              icon={<CalendarDays size={16} />}
              label="Joined"
              value={formatDate(
                user.createdAt
              )}
            />

            <DetailRow
              icon={<CalendarDays size={16} />}
              label="Updated"
              value={formatDate(
                user.updatedAt
              )}
            />
          </div>
        </Panel>

        <Panel
          title="Subscription"
          description="Current access and billing state."
        >
          {user.subscription ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow
                icon={<Crown size={16} />}
                label="Plan"
                value={user.subscription.plan}
              />

              <DetailRow
                icon={<ShieldCheck size={16} />}
                label="Status"
                value={
                  user.subscription.status
                }
              />

              <DetailRow
                icon={<Gift size={16} />}
                label="Source"
                value={
                  user.subscription.source
                }
              />

              <DetailRow
                icon={<CreditCard size={16} />}
                label="Billing cycle"
                value={
                  user.subscription
                    .billingCycle ?? "—"
                }
              />

              <DetailRow
                icon={<CalendarDays size={16} />}
                label="Started"
                value={formatDate(
                  user.subscription
                    .startedAt
                )}
              />

              <DetailRow
                icon={<CalendarDays size={16} />}
                label="Expires"
                value={
                  user.subscription
                    .expiresAt
                    ? formatDate(
                        user.subscription
                          .expiresAt
                      )
                    : "No expiry"
                }
              />

              {user.subscription
                .grantReason && (
                <div className="sm:col-span-2">
                  <DetailRow
                    icon={<Gift size={16} />}
                    label="Grant reason"
                    value={
                      user.subscription
                        .grantReason
                    }
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              No subscription record.
            </div>
          )}
        </Panel>
      </section>

      {/* ======================================================= */}
      {/* ADMIN ACTIONS                                           */}
      {/* ======================================================= */}

      {user.role !== "ADMIN" && (
        <section className="grid gap-6 xl:grid-cols-3">
          {/* =================================================== */}
          {/* PRO ACTIONS                                         */}
          {/* =================================================== */}

          <Panel
            title="PRO Access"
            description="Manage complimentary access."
          >
            {isPaidPro ? (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-800">
                  Paid PRO subscription
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  This account has paid PRO.
                  Admin revoke is intentionally
                  disabled.
                </p>
              </div>
            ) : isAdminGrantedPro ? (
              <button
                type="button"
                onClick={handleRevokePro}
                disabled={
                  actionLoading !== null
                }
                className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {actionLoading ===
                "revoke-pro" ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <RotateCcw size={16} />
                )}

                Revoke PRO
              </button>
            ) : (
              <div className="space-y-3">
                <select
                  value={grantDuration}
                  onChange={(event) =>
                    setGrantDuration(
                      event.target
                        .value as GrantDuration
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
                >
                  <option value="7_DAYS">
                    7 days
                  </option>

                  <option value="30_DAYS">
                    30 days
                  </option>

                  <option value="90_DAYS">
                    90 days
                  </option>

                  <option value="1_YEAR">
                    1 year
                  </option>

                  <option value="LIFETIME">
                    Lifetime
                  </option>
                </select>

                <input
                  value={grantReason}
                  onChange={(event) =>
                    setGrantReason(
                      event.target.value
                    )
                  }
                  placeholder="Reason (optional)"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={handleGrantPro}
                  disabled={
                    actionLoading !== null
                  }
                  className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {actionLoading ===
                  "grant-pro" ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Gift size={16} />
                  )}

                  Grant PRO
                </button>
              </div>
            )}
          </Panel>

          {/* =================================================== */}
          {/* ACCOUNT STATUS                                      */}
          {/* =================================================== */}

          <Panel
            title="Account Status"
            description="Suspend or reactivate this account."
          >
            <div className="space-y-3">
              <input
                value={suspendReason}
                onChange={(event) =>
                  setSuspendReason(
                    event.target.value
                  )
                }
                placeholder="Reason (optional)"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />

              <button
                type="button"
                onClick={
                  handleSuspendToggle
                }
                disabled={
                  actionLoading !== null
                }
                className={`inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:opacity-50 ${
                  user.accountStatus ===
                  "SUSPENDED"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {actionLoading ===
                "status" ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : user.accountStatus ===
                  "SUSPENDED" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Ban size={16} />
                )}

                {user.accountStatus ===
                "SUSPENDED"
                  ? "Reactivate account"
                  : "Suspend account"}
              </button>
            </div>
          </Panel>

          {/* =================================================== */}
          {/* DELETE                                              */}
          {/* =================================================== */}

          <Panel
            title="Danger Zone"
            description="Permanent account deletion."
          >
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-700">
                Permanent action
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                Deleting this account will
                remove related records through
                your database cascade rules.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setDeleteOpen(true)
              }
              className="mt-3 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete permanently
            </button>
          </Panel>
        </section>
      )}

      {/* ======================================================= */}
      {/* PAYMENTS                                                */}
      {/* ======================================================= */}

      <Panel
        title="Recent Payments"
        description="Latest payment records for this account."
      >
        {user.payments.length === 0 ? (
          <EmptyState text="No payments recorded." />
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
                    Plan
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
                {user.payments.map(
                  (payment) => (
                    <tr key={payment.id}>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {formatDate(
                          payment.createdAt
                        )}
                      </td>

                      <td className="px-3 py-3 text-sm font-bold text-slate-900">
                        {formatCurrency(
                          payment.amount,
                          payment.currency
                        )}
                      </td>

                      <td className="px-3 py-3 text-xs text-slate-600">
                        {payment.plan}
                      </td>

                      <td className="px-3 py-3 text-xs text-slate-600">
                        {payment.billingCycle}
                      </td>

                      <td className="px-3 py-3">
                        <PaymentStatusBadge
                          status={
                            payment.status
                          }
                        />
                      </td>

                      <td className="px-3 py-3 text-xs text-slate-500">
                        {payment.razorpayPaymentId ??
                          "—"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ======================================================= */}
      {/* ACTIVITY + AUDIT                                        */}
      {/* ======================================================= */}

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="User Activity"
          description="Tracked product events."
        >
          {user.activities.length === 0 ? (
            <EmptyState text="No user activity recorded yet." />
          ) : (
            <Timeline>
              {user.activities.map(
                (activity) => (
                  <TimelineItem
                    key={activity.id}
                    title={formatLabel(
                      activity.type
                    )}
                    subtitle={formatDate(
                      activity.createdAt
                    )}
                  />
                )
              )}
            </Timeline>
          )}
        </Panel>

        <Panel
          title="Admin History"
          description="Administrative actions recorded for this user."
        >
          {user.adminHistory.length === 0 ? (
            <EmptyState text="No admin history recorded." />
          ) : (
            <Timeline>
              {user.adminHistory.map(
                (entry) => (
                  <TimelineItem
                    key={entry.id}
                    title={formatLabel(
                      entry.action
                    )}
                    subtitle={`${entry.admin.name} · ${formatDate(
                      entry.createdAt
                    )}`}
                  />
                )
              )}
            </Timeline>
          )}
        </Panel>
      </section>

      {/* ======================================================= */}
      {/* DELETE MODAL                                            */}
      {/* ======================================================= */}

      {deleteOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-4 text-lg font-black text-slate-950">
              Delete account permanently?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              To confirm, type the exact email:
            </p>

            <p className="mt-2 break-all rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
              {user.email}
            </p>

            <input
              value={confirmEmail}
              onChange={(event) =>
                setConfirmEmail(
                  event.target.value
                )
              }
              placeholder="Type exact email"
              className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
            />

            <input
              value={deleteReason}
              onChange={(event) =>
                setDeleteReason(
                  event.target.value
                )
              }
              placeholder="Deletion reason (optional)"
              className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
            />

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={
                  actionLoading ===
                  "delete"
                }
                onClick={() =>
                  setDeleteOpen(false)
                }
                className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  confirmEmail
                    .trim()
                    .toLowerCase() !==
                    user.email.toLowerCase() ||
                  actionLoading !== null
                }
                onClick={handleDelete}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actionLoading ===
                "delete" ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={16} />
                )}

                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* PANEL                                                        */
/* ============================================================ */

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-black text-slate-950">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

      <div className="mt-5">
        {children}
      </div>
    </div>
  );
}

/* ============================================================ */
/* INFO CARD                                                    */
/* ============================================================ */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

/* ============================================================ */
/* DETAIL ROW                                                   */
/* ============================================================ */

function DetailRow({
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
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[10px] font-black uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* ============================================================ */
/* USER AVATAR                                                  */
/* ============================================================ */

function UserAvatar({
  name,
}: {
  name: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
      {initials || "U"}
    </div>
  );
}

/* ============================================================ */
/* BADGES                                                       */
/* ============================================================ */

function RoleBadge({
  role,
}: {
  role: UserRole;
}) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[9px] font-black ring-1 ring-inset ${
        role === "ADMIN"
          ? "bg-violet-50 text-violet-700 ring-violet-100"
          : "bg-blue-50 text-blue-700 ring-blue-100"
      }`}
    >
      {role}
    </span>
  );
}

function PlanBadge({
  plan,
  source,
}: {
  plan: PlanType;
  source: SubscriptionSource | null;
}) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[9px] font-black ring-1 ring-inset ${
        plan === "PRO"
          ? "bg-amber-50 text-amber-700 ring-amber-100"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {plan === "PRO" &&
      source === "ADMIN_GRANT"
        ? "PRO · GIFT"
        : plan}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: AccountStatus;
}) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[9px] font-black ring-1 ring-inset ${
        status === "ACTIVE"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-red-50 text-red-600 ring-red-100"
      }`}
    >
      {status}
    </span>
  );
}

function PaymentStatusBadge({
  status,
}: {
  status: "PENDING" | "SUCCESS" | "FAILED";
}) {
  const styles =
    status === "SUCCESS"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : status === "FAILED"
        ? "bg-red-50 text-red-600 ring-red-100"
        : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`rounded-full px-2 py-1 text-[9px] font-black ring-1 ring-inset ${styles}`}
    >
      {status}
    </span>
  );
}

/* ============================================================ */
/* TABLE HEADING                                                */
/* ============================================================ */

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
      {children}
    </th>
  );
}

/* ============================================================ */
/* TIMELINE                                                     */
/* ============================================================ */

function Timeline({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="divide-y divide-slate-100">
      {children}
    </div>
  );
}

function TimelineItem({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" />

      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ============================================================ */
/* EMPTY STATE                                                  */
/* ============================================================ */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

/* ============================================================ */
/* LOADING                                                      */
/* ============================================================ */

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white"
            />
          )
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />

        <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
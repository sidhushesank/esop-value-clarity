"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Crown,
  UserRound,
  UserPlus,
  IndianRupee,
  Calculator,
  Activity,
  CreditCard,
  ShieldCheck,
  Gift,
  Ban,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  accountStatus: "ACTIVE" | "SUSPENDED";
  plan: "FREE" | "PRO";
  source: "PAYMENT" | "ADMIN_GRANT" | null;
  createdAt: string;
  lastLoginAt: string | null;
}

interface RecentActivity {
  id: string;
  type: string;
  metadata: unknown;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RecentPayment {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  plan: "FREE" | "PRO";
  billingCycle:
    | "MONTHLY"
    | "SIX_MONTHS"
    | "YEARLY";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AdminStatsResponse {
  success: boolean;
  generatedAt: string;

  stats: {
    users: {
      total: number;
      active: number;
      suspended: number;
      admins: number;
      free: number;
      pro: number;
      newToday: number;
      newThisWeek: number;
      newThisMonth: number;
    };

    subscriptions: {
      activePro: number;
      paidPro: number;
      adminGrantedPro: number;
      cancelled: number;
      expired: number;
    };

    payments: {
      successful: number;
      failed: number;
      pending: number;
    };

    revenue: {
      currency: string;
      total: number;
      thisMonth: number;
    };

    product: {
      calculations: number;
      calculationsToday: number;
      activities: number;
    };
  };

  recentUsers: RecentUser[];
  recentActivity: RecentActivity[];
  recentPayments: RecentPayment[];
}

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
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

function formatActivityType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

export default function AdminDashboardPage() {
  const [data, setData] =
    useState<AdminStatsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  async function loadStats(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        "/api/admin/stats",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const result =
        (await response.json()) as AdminStatsResponse & {
          message?: string;
        };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load admin dashboard"
        );
      }

      setData(result);
    } catch (error) {
      console.error(
        "Failed to load admin stats:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load admin dashboard"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const totalRevenue = useMemo(() => {
    if (!data) {
      return "₹0";
    }

    return formatCurrency(
      data.stats.revenue.total,
      data.stats.revenue.currency
    );
  }, [data]);

  const monthlyRevenue = useMemo(() => {
    if (!data) {
      return "₹0";
    }

    return formatCurrency(
      data.stats.revenue.thisMonth,
      data.stats.revenue.currency
    );
  }, [data]);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div
        className="
          flex
          min-h-[60vh]
          items-center
          justify-center
        "
      >
        <div
          className="
            w-full
            max-w-md
            rounded-3xl
            border
            border-red-100
            bg-white
            p-6
            text-center
            shadow-sm
          "
        >
          <div
            className="
              mx-auto
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-red-50
              text-red-600
            "
          >
            <Ban size={22} />
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-950">
            Dashboard unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ||
              "Unable to load admin dashboard."}
          </p>

          <button
            type="button"
            onClick={() => loadStats()}
            className="
              mt-5
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-slate-950
              px-4
              py-2.5
              text-sm
              font-bold
              text-white
              transition
              hover:bg-slate-800
            "
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-6">
      {/* ======================================================= */}
      {/* PAGE HEADER                                             */}
      {/* ======================================================= */}

      <section
        className="
          flex
          flex-col
          gap-4

          lg:flex-row
          lg:items-end
          lg:justify-between
        "
      >
        <div>
          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-slate-200
              bg-white
              px-3
              py-1.5
              text-xs
              font-bold
              text-slate-600
              shadow-sm
            "
          >
            <ShieldCheck size={14} />
            Owner Console
          </div>

          <h1
            className="
              mt-3
              text-2xl
              font-black
              tracking-tight
              text-slate-950

              sm:text-3xl
            "
          >
            Admin Overview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor users, subscriptions, revenue,
            payments and product activity across
            ESOP Value Clarity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/users"
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              text-sm
              font-bold
              text-slate-700
              shadow-sm
              transition
              hover:bg-slate-50
            "
          >
            <Users size={16} />
            Manage users
          </Link>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => loadStats(true)}
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-slate-950
              px-4
              text-sm
              font-bold
              text-white
              shadow-sm
              transition

              hover:bg-slate-800

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            {refreshing
              ? "Refreshing"
              : "Refresh"}
          </button>
        </div>
      </section>

      {/* ======================================================= */}
      {/* PRIMARY STATS                                           */}
      {/* ======================================================= */}

      <section
        className="
          grid
          grid-cols-1
          gap-4

          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <StatCard
          icon={<Users size={21} />}
          label="Total Users"
          value={stats.users.total.toLocaleString(
            "en-IN"
          )}
          secondary={`${stats.users.newToday} joined today`}
        />

        <StatCard
          icon={<Crown size={21} />}
          label="PRO Users"
          value={stats.users.pro.toLocaleString(
            "en-IN"
          )}
          secondary={`${stats.subscriptions.paidPro} paid · ${stats.subscriptions.adminGrantedPro} complimentary`}
        />

        <StatCard
          icon={<IndianRupee size={21} />}
          label="Total Revenue"
          value={totalRevenue}
          secondary={`${monthlyRevenue} this month`}
        />

        <StatCard
          icon={<Calculator size={21} />}
          label="Calculations"
          value={stats.product.calculations.toLocaleString(
            "en-IN"
          )}
          secondary={`${stats.product.calculationsToday} today`}
        />
      </section>

      {/* ======================================================= */}
      {/* SECONDARY STATS                                         */}
      {/* ======================================================= */}

      <section
        className="
          grid
          grid-cols-2
          gap-3

          md:grid-cols-3
          xl:grid-cols-6
        "
      >
        <MiniStat
          icon={<UserRound size={17} />}
          label="Free"
          value={stats.users.free}
        />

        <MiniStat
          icon={<UserPlus size={17} />}
          label="New this week"
          value={stats.users.newThisWeek}
        />

        <MiniStat
          icon={<Gift size={17} />}
          label="Gifted PRO"
          value={
            stats.subscriptions.adminGrantedPro
          }
        />

        <MiniStat
          icon={<Ban size={17} />}
          label="Suspended"
          value={stats.users.suspended}
        />

        <MiniStat
          icon={<CreditCard size={17} />}
          label="Payments"
          value={stats.payments.successful}
        />

        <MiniStat
          icon={<Activity size={17} />}
          label="Activities"
          value={stats.product.activities}
        />
      </section>

      {/* ======================================================= */}
      {/* USERS + ACTIVITY                                        */}
      {/* ======================================================= */}

      <section
        className="
          grid
          gap-6
          xl:grid-cols-[1.35fr_0.65fr]
        "
      >
        {/* ===================================================== */}
        {/* RECENT USERS                                          */}
        {/* ===================================================== */}

        <div
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              border-b
              border-slate-200
              px-5
              py-4
            "
          >
            <div>
              <h2 className="text-base font-black text-slate-950">
                Recent Users
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest accounts created on the
                platform.
              </p>
            </div>

            <Link
              href="/admin/users"
              className="
                inline-flex
                items-center
                gap-1
                text-xs
                font-bold
                text-slate-600
                transition
                hover:text-slate-950
              "
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          {data.recentUsers.length === 0 ? (
            <EmptySection text="No users yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="
                    flex
                    items-center
                    gap-3
                    px-5
                    py-4
                    transition
                    hover:bg-slate-50
                  "
                >
                  <UserAvatar
                    name={user.name}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p
                        className="
                          truncate
                          text-sm
                          font-bold
                          text-slate-900
                        "
                      >
                        {user.name}
                      </p>

                      {user.role === "ADMIN" && (
                        <Badge variant="admin">
                          ADMIN
                        </Badge>
                      )}
                    </div>

                    <p
                      className="
                        mt-1
                        truncate
                        text-xs
                        text-slate-500
                      "
                    >
                      {user.email}
                    </p>
                  </div>

                  <div
                    className="
                      hidden
                      shrink-0
                      text-right

                      sm:block
                    "
                  >
                    <div className="flex justify-end gap-1.5">
                      <Badge
                        variant={
                          user.plan === "PRO"
                            ? "pro"
                            : "free"
                        }
                      >
                        {user.plan}
                      </Badge>

                      {user.accountStatus ===
                        "SUSPENDED" && (
                        <Badge variant="danger">
                          SUSPENDED
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {formatShortDate(
                        user.createdAt
                      )}
                    </p>
                  </div>

                  <ArrowRight
                    size={16}
                    className="shrink-0 text-slate-300"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ===================================================== */}
        {/* RECENT ACTIVITY                                       */}
        {/* ===================================================== */}

        <div
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >
          <div
            className="
              border-b
              border-slate-200
              px-5
              py-4
            "
          >
            <h2 className="text-base font-black text-slate-950">
              Recent Activity
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest tracked product events.
            </p>
          </div>

          {data.recentActivity.length === 0 ? (
            <EmptySection text="No activity recorded yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentActivity
                .slice(0, 8)
                .map((activity) => (
                  <div
                    key={activity.id}
                    className="
                      flex
                      gap-3
                      px-5
                      py-4
                    "
                  >
                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-slate-100
                        text-slate-600
                      "
                    >
                      <Activity size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {formatActivityType(
                          activity.type
                        )}
                      </p>

                      <p
                        className="
                          mt-1
                          truncate
                          text-xs
                          text-slate-500
                        "
                      >
                        {activity.user.name} ·{" "}
                        {activity.user.email}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDate(
                          activity.createdAt
                        )}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================= */}
      {/* PAYMENT SUMMARY + RECENT PAYMENTS                       */}
      {/* ======================================================= */}

      <section
        className="
          grid
          gap-6
          xl:grid-cols-[0.65fr_1.35fr]
        "
      >
        <div
          className="
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <h2 className="text-base font-black text-slate-950">
            Subscription Health
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Current subscription breakdown.
          </p>

          <div className="mt-5 grid gap-3">
            <BreakdownRow
              label="Active PRO"
              value={stats.subscriptions.activePro}
            />

            <BreakdownRow
              label="Paid PRO"
              value={stats.subscriptions.paidPro}
            />

            <BreakdownRow
              label="Admin granted"
              value={
                stats.subscriptions.adminGrantedPro
              }
            />

            <BreakdownRow
              label="Cancelled"
              value={
                stats.subscriptions.cancelled
              }
            />

            <BreakdownRow
              label="Expired"
              value={stats.subscriptions.expired}
            />
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="grid grid-cols-3 gap-2">
              <PaymentMiniStat
                label="Success"
                value={
                  stats.payments.successful
                }
              />

              <PaymentMiniStat
                label="Pending"
                value={stats.payments.pending}
              />

              <PaymentMiniStat
                label="Failed"
                value={stats.payments.failed}
              />
            </div>
          </div>
        </div>

        <div
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-200
              px-5
              py-4
            "
          >
            <div>
              <h2 className="text-base font-black text-slate-950">
                Recent Payments
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest billing transactions.
              </p>
            </div>

            <Link
              href="/admin/payments"
              className="
                inline-flex
                items-center
                gap-1
                text-xs
                font-bold
                text-slate-600
                transition
                hover:text-slate-950
              "
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          {data.recentPayments.length === 0 ? (
            <EmptySection text="No payments yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentPayments.map(
                (payment) => (
                  <div
                    key={payment.id}
                    className="
                      flex
                      items-center
                      gap-3
                      px-5
                      py-4
                    "
                  >
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-slate-100
                        text-slate-600
                      "
                    >
                      <CreditCard size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="
                          truncate
                          text-sm
                          font-bold
                          text-slate-900
                        "
                      >
                        {payment.user.name}
                      </p>

                      <p
                        className="
                          mt-1
                          truncate
                          text-xs
                          text-slate-500
                        "
                      >
                        {payment.user.email}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-slate-900">
                        {formatCurrency(
                          payment.amount,
                          payment.currency
                        )}
                      </p>

                      <div className="mt-1">
                        <Badge
                          variant={
                            payment.status ===
                            "SUCCESS"
                              ? "success"
                              : payment.status ===
                                  "FAILED"
                                ? "danger"
                                : "neutral"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================= */}
      {/* LAST UPDATED                                            */}
      {/* ======================================================= */}

      <div className="text-center text-xs text-slate-400">
        Dashboard generated{" "}
        {formatDate(data.generatedAt)}
      </div>
    </div>
  );
}

/* ============================================================ */
/* STAT CARD                                                    */
/* ============================================================ */

function StatCard({
  icon,
  label,
  value,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-2xl
          bg-slate-100
          text-slate-700
        "
      >
        {icon}
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1.5 text-xs text-slate-500">
        {secondary}
      </p>
    </div>
  );
}

/* ============================================================ */
/* MINI STAT                                                    */
/* ============================================================ */

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
        shadow-sm
      "
    >
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <p className="truncate text-[11px] font-bold uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="mt-3 text-xl font-black text-slate-950">
        {value.toLocaleString("en-IN")}
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
    <div
      className="
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-slate-950
        text-xs
        font-black
        text-white
      "
    >
      {initials || "U"}
    </div>
  );
}

/* ============================================================ */
/* BADGE                                                        */
/* ============================================================ */

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant:
    | "pro"
    | "free"
    | "admin"
    | "success"
    | "danger"
    | "neutral";
}) {
  const styles = {
    pro: "bg-amber-50 text-amber-700 ring-amber-100",
    free: "bg-slate-100 text-slate-600 ring-slate-200",
    admin:
      "bg-violet-50 text-violet-700 ring-violet-100",
    success:
      "bg-emerald-50 text-emerald-700 ring-emerald-100",
    danger: "bg-red-50 text-red-600 ring-red-100",
    neutral:
      "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-2
        py-1
        text-[9px]
        font-black
        tracking-wide
        ring-1
        ring-inset

        ${styles[variant]}
      `}
    >
      {children}
    </span>
  );
}

/* ============================================================ */
/* BREAKDOWN ROW                                                */
/* ============================================================ */

function BreakdownRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-xl
        bg-slate-50
        px-3
        py-3
      "
    >
      <span className="text-sm font-medium text-slate-600">
        {label}
      </span>

      <span className="text-sm font-black text-slate-950">
        {value.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

/* ============================================================ */
/* PAYMENT MINI STAT                                            */
/* ============================================================ */

function PaymentMiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="text-lg font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}

/* ============================================================ */
/* EMPTY SECTION                                                */
/* ============================================================ */

function EmptySection({
  text,
}: {
  text: string;
}) {
  return (
    <div className="px-5 py-10 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

/* ============================================================ */
/* LOADING SKELETON                                             */
/* ============================================================ */

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200" />

        <div className="mt-3 h-9 w-64 animate-pulse rounded-xl bg-slate-200" />

        <div className="mt-3 h-4 w-full max-w-lg animate-pulse rounded bg-slate-200" />
      </div>

      <div
        className="
          grid
          grid-cols-1
          gap-4

          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="
                h-44
                animate-pulse
                rounded-3xl
                border
                border-slate-200
                bg-white
              "
            />
          )
        )}
      </div>

      <div
        className="
          grid
          grid-cols-2
          gap-3

          md:grid-cols-3
          xl:grid-cols-6
        "
      >
        {Array.from({ length: 6 }).map(
          (_, index) => (
            <div
              key={index}
              className="
                h-24
                animate-pulse
                rounded-2xl
                border
                border-slate-200
                bg-white
              "
            />
          )
        )}
      </div>

      <div
        className="
          grid
          gap-6
          xl:grid-cols-2
        "
      >
        <div className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-white" />

        <div className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
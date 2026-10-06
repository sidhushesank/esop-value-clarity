"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Crown,
  Filter,
  IndianRupee,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

type TeamStatus =
  | "ALL"
  | "ACTIVE"
  | "EXPIRED";

interface TeamWorkspace {
  id: string;

  name: string;

  status: string;

  isFounder: boolean;

  access:
    | "UNLIMITED"
    | "ANNUAL"
    | "EXPIRED";

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
  };

  members: {
    active: number;

    max: number;

    remaining: number;

    utilizationPercent: number;
  };

  latestPayment: {
    id: string;

    amountPaise: number;

    amount: number;

    currency: string;

    status:
      | "PENDING"
      | "SUCCESS"
      | "FAILED";

    razorpayOrderId:
      string | null;

    razorpayPaymentId:
      string | null;

    startedAt: string;

    expiresAt: string;

    createdAt: string;
  } | null;

  successfulPaymentCount: number;
}

interface PaginationData {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

interface TeamSummary {
  customers: number;

  workspaces: {
    total: number;

    active: number;

    expired: number;
  };

  members: {
    active: number;

    capacityPerWorkspace: number;

    totalCapacity: number;

    remainingCapacity: number;

    utilizationPercent: number;
  };

  payments: {
    successful: number;

    pending: number;

    failed: number;

    total: number;
  };

  revenue: {
    currency: string;

    total: number;

    thisMonth: number;

    totalPaise: number;

    thisMonthPaise: number;
  };
}

interface TeamsResponse {
  success: boolean;

  generatedAt?: string;

  summary: TeamSummary;

  workspaces: TeamWorkspace[];

  pagination: PaginationData;

  filters: {
    search: string | null;

    status: TeamStatus;
  };

  message?: string;
}

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
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(value)
  );
}

function formatShortDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
}

export default function AdminTeamsPage() {
  const [
    workspaces,
    setWorkspaces,
  ] = useState<TeamWorkspace[]>(
    []
  );

  const [
    summary,
    setSummary,
  ] =
    useState<TeamSummary | null>(
      null
    );

  const [
    pagination,
    setPagination,
  ] =
    useState<PaginationData | null>(
      null
    );

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] =
    useState<TeamStatus>(
      "ALL"
    );

  const [
    page,
    setPage,
  ] = useState(1);

  const limit = 20;

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

  const loadTeams =
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

          const params =
            new URLSearchParams();

          if (search) {
            params.set(
              "search",
              search
            );
          }

          if (
            status !==
            "ALL"
          ) {
            params.set(
              "status",
              status
            );
          }

          params.set(
            "page",
            String(page)
          );

          params.set(
            "limit",
            String(limit)
          );

          const response =
            await fetch(
              `/api/admin/teams?${params.toString()}`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as TeamsResponse;

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                "Failed to load Team workspaces"
            );
          }

          setWorkspaces(
            result.workspaces
          );

          setSummary(
            result.summary
          );

          setPagination(
            result.pagination
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to load Admin Team workspaces:",
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : "Failed to load Team workspaces"
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      [
        page,
        search,
        status,
      ]
    );

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  function handleSearchSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);

    setSearch(
      searchInput.trim()
    );
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setPage(1);
  }

  const hasFilters =
    Boolean(
      search ||
        status !==
          "ALL"
    );

  return (
    <div className="space-y-6">
      {/* ======================================================= */}
      {/* HEADER                                                  */}
      {/* ======================================================= */}

      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            <Building2
              size={14}
            />
            Team Intelligence
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Team Control Room
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Monitor B2B Team workspaces,
            purchasers, sponsored members,
            workspace capacity and Team
            revenue from the Founder Admin
            Console.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadTeams(true)
          }
          disabled={
            refreshing
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 lg:self-auto"
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

      {/* ======================================================= */}
      {/* SUMMARY                                                 */}
      {/* ======================================================= */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={
            <Building2
              size={20}
            />
          }
          label="Team Customers"
          value={
            summary
              ? summary.customers.toLocaleString(
                  "en-IN"
                )
              : "0"
          }
          description={
            summary
              ? `${summary.workspaces.active} active workspaces`
              : "B2B workspaces"
          }
        />

        <SummaryCard
          icon={
            <Users
              size={20}
            />
          }
          label="Sponsored Members"
          value={
            summary
              ? summary.members.active.toLocaleString(
                  "en-IN"
                )
              : "0"
          }
          description={
            summary
              ? `${summary.members.remainingCapacity} slots remaining`
              : "Active Team members"
          }
        />

        <SummaryCard
          icon={
            <IndianRupee
              size={20}
            />
          }
          label="Team Revenue"
          value={
            summary
              ? formatCurrency(
                  summary.revenue
                    .total,
                  summary.revenue
                    .currency
                )
              : "₹0"
          }
          description={
            summary
              ? `${formatCurrency(
                  summary.revenue
                    .thisMonth,
                  summary.revenue
                    .currency
                )} this month`
              : "Successful Team payments"
          }
        />

        <SummaryCard
          icon={
            <Activity
              size={20}
            />
          }
          label="Capacity"
          value={
            summary
              ? `${summary.members.active}/${summary.members.totalCapacity}`
              : "0/0"
          }
          description={
            summary
              ? `${summary.members.utilizationPercent}% utilized`
              : "Team member capacity"
          }
        />
      </section>

      {/* ======================================================= */}
      {/* PAYMENT / STATUS STRIP                                  */}
      {/* ======================================================= */}

      {summary && (
        <section className="grid gap-3 md:grid-cols-3">
          <MetricStrip
            icon={
              <CheckCircle2
                size={17}
              />
            }
            label="Successful Team Payments"
            value={String(
              summary
                .payments
                .successful
            )}
            tone="success"
          />

          <MetricStrip
            icon={
              <CreditCard
                size={17}
              />
            }
            label="Pending Team Payments"
            value={String(
              summary
                .payments
                .pending
            )}
            tone="warning"
          />

          <MetricStrip
            icon={
              <XCircle
                size={17}
              />
            }
            label="Failed Team Payments"
            value={String(
              summary
                .payments
                .failed
            )}
            tone="danger"
          />
        </section>
      )}

      {/* ======================================================= */}
      {/* FILTERS                                                 */}
      {/* ======================================================= */}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Filter
            size={17}
          />
          Search & filters
        </div>

        <form
          onSubmit={
            handleSearchSubmit
          }
          className="mt-4 grid gap-3 lg:grid-cols-[1fr_190px_auto]"
        >
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={
                searchInput
              }
              onChange={(
                event
              ) =>
                setSearchInput(
                  event.target
                    .value
                )
              }
              placeholder="Search workspace, owner or email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(
              event
            ) => {
              setPage(1);

              setStatus(
                event.target
                  .value as TeamStatus
              );
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">
              All workspace statuses
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="EXPIRED">
              Expired
            </option>
          </select>

          <button
            type="submit"
            className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        {hasFilters && (
          <button
            type="button"
            onClick={
              clearFilters
            }
            className="mt-3 text-xs font-bold text-slate-500 transition hover:text-slate-950"
          >
            Clear all filters
          </button>
        )}
      </section>

      {/* ======================================================= */}
      {/* ERROR                                                   */}
      {/* ======================================================= */}

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================= */}
      {/* WORKSPACE TABLE                                         */}
      {/* ======================================================= */}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950">
              Team Workspaces
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Loading Team workspaces..."
                : pagination
                  ? `${pagination.total.toLocaleString(
                      "en-IN"
                    )} workspaces`
                  : `${workspaces.length} workspaces`}
            </p>
          </div>

          {pagination && (
            <p className="text-xs text-slate-400">
              Page{" "}
              <strong>
                {pagination.page}
              </strong>{" "}
              of{" "}
              <strong>
                {Math.max(
                  pagination.totalPages,
                  1
                )}
              </strong>
            </p>
          )}
        </div>

        {loading ? (
          <TeamsLoading />
        ) : workspaces.length ===
          0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ================================================= */}
            {/* DESKTOP                                            */}
            {/* ================================================= */}

            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1250px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <TableHeading>
                      Workspace
                    </TableHeading>

                    <TableHeading>
                      Owner
                    </TableHeading>

                    <TableHeading>
                      Members
                    </TableHeading>

                    <TableHeading>
                      Access
                    </TableHeading>

                    <TableHeading>
                      Revenue
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Started
                    </TableHeading>

                    <TableHeading>
                      Action
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {workspaces.map(
                    (
                      workspace
                    ) => (
                      <tr
                        key={
                          workspace.id
                        }
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="min-w-[190px]">
                            <p className="text-sm font-black text-slate-950">
                              {
                                workspace.name
                              }
                            </p>

                            <p className="mt-1 text-[10px] font-medium text-slate-400">
                              {workspace.id}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-900">
                            {
                              workspace.owner.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              workspace.owner.email
                            }
                          </p>

                          {workspace.isFounder && (
                            <TeamBadge variant="founder">
                              FOUNDER
                            </TeamBadge>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[130px]">
                            <p className="text-sm font-black text-slate-950">
                              {
                                workspace
                                  .members
                                  .active
                              }{" "}
                              /{" "}
                              {
                                workspace
                                  .members
                                  .max
                              }
                            </p>

                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-500"
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

                            <p className="mt-1 text-[10px] text-slate-400">
                              {
                                workspace
                                  .members
                                  .remaining
                              }{" "}
                              slots left
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <AccessBadge
                            access={
                              workspace.access
                            }
                          />

                          {!workspace.isFounder && (
                            <p className="mt-1 text-[10px] text-slate-400">
                              {formatShortDate(
                                workspace.expiresAt
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-950">
                            {workspace.latestPayment
                              ? formatCurrency(
                                  workspace
                                    .latestPayment
                                    .amount,
                                  workspace
                                    .latestPayment
                                    .currency
                                )
                              : "—"}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {workspace
                              .latestPayment
                              ? "Latest successful payment"
                              : "No successful payment"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <WorkspaceStatusBadge
                            status={
                              workspace.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">
                          {formatDate(
                            workspace.startedAt
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/teams/${workspace.id}`}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            Inspect
                            <ArrowRight
                              size={13}
                            />
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* ================================================= */}
            {/* MOBILE / TABLET                                    */}
            {/* ================================================= */}

            <div className="divide-y divide-slate-100 xl:hidden">
              {workspaces.map(
                (
                  workspace
                ) => (
                  <div
                    key={
                      workspace.id
                    }
                    className="p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-black text-slate-950">
                            {
                              workspace.name
                            }
                          </h3>

                          <WorkspaceStatusBadge
                            status={
                              workspace.status
                            }
                          />
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {
                            workspace.owner.name
                          }
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {
                            workspace.owner.email
                          }
                        </p>
                      </div>

                      <AccessBadge
                        access={
                          workspace.access
                        }
                      />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <MiniDetail
                        label="Members"
                        value={`${workspace.members.active}/${workspace.members.max}`}
                      />

                      <MiniDetail
                        label="Revenue"
                        value={
                          workspace.latestPayment
                            ? formatCurrency(
                                workspace
                                  .latestPayment
                                  .amount,
                                workspace
                                  .latestPayment
                                  .currency
                              )
                            : "—"
                        }
                      />

                      <MiniDetail
                        label="Started"
                        value={formatDate(
                          workspace.startedAt
                        )}
                      />

                      <MiniDetail
                        label={
                          workspace.isFounder
                            ? "Access"
                            : "Expires"
                        }
                        value={
                          workspace.isFounder
                            ? "Unlimited"
                            : formatDate(
                                workspace.expiresAt
                              )
                        }
                      />
                    </div>

                    <Link
                      href={`/admin/teams/${workspace.id}`}
                      className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Inspect workspace
                      <ArrowRight
                        size={15}
                      />
                    </Link>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {/* ===================================================== */}
        {/* PAGINATION                                             */}
        {/* ===================================================== */}

        {!loading &&
          pagination &&
          pagination.totalPages >
            0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4 sm:px-5">
              <p className="text-xs text-slate-500">
                Page{" "}
                <strong>
                  {
                    pagination.page
                  }
                </strong>{" "}
                of{" "}
                <strong>
                  {
                    pagination.totalPages
                  }
                </strong>
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        Math.max(
                          current -
                            1,
                          1
                        )
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        current +
                        1
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight
                    size={17}
                  />
                </button>
              </div>
            </div>
          )}
      </section>
    </div>
  );
}

/* ============================================================ */
/* SUMMARY CARD                                                 */
/* ============================================================ */

function SummaryCard({
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
/* METRIC STRIP                                                 */
/* ============================================================ */

function MetricStrip({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;

  label: string;

  value: string;

  tone:
    | "success"
    | "warning"
    | "danger";
}) {
  const styles = {
    success:
      "border-emerald-100 bg-emerald-50/60 text-emerald-700",

    warning:
      "border-amber-100 bg-amber-50/60 text-amber-700",

    danger:
      "border-red-100 bg-red-50/60 text-red-700",
  };

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${styles[tone]}`}
    >
      <div className="flex items-center gap-2">
        {icon}

        <span className="text-xs font-bold">
          {label}
        </span>
      </div>

      <span className="text-lg font-black">
        {value}
      </span>
    </div>
  );
}

/* ============================================================ */
/* ACCESS BADGE                                                 */
/* ============================================================ */

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

/* ============================================================ */
/* TEAM BADGE                                                   */
/* ============================================================ */

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
      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black ring-1 ring-inset ${styles[variant]}`}
    >
      <ShieldCheck
        size={9}
      />
      {children}
    </span>
  );
}

/* ============================================================ */
/* WORKSPACE STATUS                                             */
/* ============================================================ */

function WorkspaceStatusBadge({
  status,
}: {
  status: string;
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

/* ============================================================ */
/* MINI DETAIL                                                  */
/* ============================================================ */

function MiniDetail({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
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
    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
      {children}
    </th>
  );
}

/* ============================================================ */
/* EMPTY STATE                                                   */
/* ============================================================ */

function EmptyState() {
  return (
    <div className="px-5 py-16 text-center">
      <Building2
        size={30}
        className="mx-auto text-slate-300"
      />

      <h3 className="mt-4 text-sm font-black text-slate-900">
        No Team workspaces found
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Team workspaces will appear
        here after a Team purchase
        creates a workspace.
      </p>
    </div>
  );
}

/* ============================================================ */
/* LOADING                                                       */
/* ============================================================ */

function TeamsLoading() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({
        length: 6,
      }).map(
        (
          _,
          index
        ) => (
          <div
            key={index}
            className="flex gap-4 px-5 py-5"
          >
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200" />

            <div className="flex-1">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />

              <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-100" />

              <div className="mt-4 h-8 w-full max-w-[500px] animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        )
      )}
    </div>
  );
}
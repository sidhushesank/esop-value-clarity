"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  CreditCard,
  IndianRupee,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CircleCheck,
  CircleX,
  Clock3,
} from "lucide-react";

type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

type BillingCycle =
  | "MONTHLY"
  | "SIX_MONTHS"
  | "YEARLY"
  | "TEAM_YEARLY";

type PaymentScope =
  | "ALL"
  | "PERSONAL"
  | "TEAM";

type UserRole =
  | "USER"
  | "ADMIN";

type AccountStatus =
  | "ACTIVE"
  | "SUSPENDED";

interface AdminPayment {
  id: string;

  paymentType:
    | "PERSONAL"
    | "TEAM";

  plan:
    | "FREE"
    | "PRO"
    | "TEAM";

  billingCycle:
    BillingCycle;

  amount: number;
  currency: string;

  amountPaise?: number;

  status:
    PaymentStatus;

  razorpayOrderId:
    string | null;

  razorpayPaymentId:
    string | null;

  createdAt: string;
  updatedAt: string;

  startedAt?: string;
  expiresAt?: string;

  user?: {
    id: string;
    name: string;
    email: string;

    role:
      UserRole;

    accountStatus:
      AccountStatus;

    currentPlan:
      "FREE" | "PRO";

    subscriptionSource:
      | "PAYMENT"
      | "ADMIN_GRANT"
      | null;
  };

  purchaser?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    accountStatus: AccountStatus;
    isFounder: boolean;
  };

  workspace?: {
    id: string;
    name: string;
    status: string;
    startedAt: string;
    expiresAt: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
    activeMemberCount: number;
    maxMembers: number;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaymentsResponse {
  success: boolean;

  payments: AdminPayment[];

  teamPayments: AdminPayment[];

  summary: {
    scope: PaymentScope;

    personal: {
      successful: number;
      failed: number;
      pending: number;

      revenue: {
        currency: string;
        total: number;
        thisMonth: number;
        today: number;
      };
    };

    team: {
      successful: number;
      failed: number;
      pending: number;

      revenue: {
        currency: string;
        total: number;
        thisMonth: number;
        today: number;
        totalPaise: number;
        thisMonthPaise: number;
        todayPaise: number;
      };
    };

    combined: {
      successful: number;
      failed: number;
      pending: number;

      revenue: {
        currency: string;
        total: number;
        thisMonth: number;
        today: number;
      };
    };
  };

  pagination: PaginationData;
  teamPagination: PaginationData;

  filters: {
    search: string | null;
    status: PaymentStatus | null;
    billingCycle: BillingCycle | null;
    scope: PaymentScope;
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

function formatBillingCycle(
  value: BillingCycle
) {
  if (
    value ===
    "TEAM_YEARLY"
  ) {
    return "Team — ₹1,45,000 / year";
  }

  if (
    value ===
    "SIX_MONTHS"
  ) {
    return "6 Months";
  }

  if (
    value ===
    "YEARLY"
  ) {
    return "Yearly";
  }

  return "Monthly";
}

export default function AdminPaymentsPage() {
  const [
    payments,
    setPayments,
  ] =
    useState<
      AdminPayment[]
    >([]);

  const [
    teamPayments,
    setTeamPayments,
  ] =
    useState<AdminPayment[]>([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<
      PaginationData | null
    >(null);

  const [
    teamPagination,
    setTeamPagination,
  ] =
    useState<
      PaginationData | null
    >(null);

  const [
    summary,
    setSummary,
  ] =
    useState<
      PaymentsResponse["summary"] | null
    >(null);

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
    useState<
      "" | PaymentStatus
    >("");

  const [
    billingCycle,
    setBillingCycle,
  ] =
    useState<
      "" | BillingCycle
    >("");

  const [
    scope,
    setScope,
  ] =
    useState<PaymentScope>("ALL");

  const [
    page,
    setPage,
  ] =
    useState(1);

  const limit = 25;

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const loadPayments =
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
            setLoading(
              true
            );
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

          if (status) {
            params.set(
              "status",
              status
            );
          }

          if (
            billingCycle
          ) {
            params.set(
              "billingCycle",
              billingCycle
            );
          }

          params.set(
            "scope",
            scope
          );

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
              `/api/admin/payments?${params.toString()}`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as PaymentsResponse;

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                "Failed to load payments"
            );
          }

          setPayments(
            result.payments
          );

          setTeamPayments(
            result.teamPayments
          );

          setPagination(
            result.pagination
          );

          setTeamPagination(
            result.teamPagination
          );

          setSummary(
            result.summary
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to load admin payments:",
            error
          );

          setError(
            error instanceof
              Error
              ? error.message
              : "Failed to load payments"
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        search,
        status,
        billingCycle,
        scope,
        page,
      ]
    );

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

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
    setStatus("");
    setBillingCycle("");
    setScope("ALL");
    setPage(1);
  }

  const hasFilters =
    Boolean(
      search ||
        status ||
        billingCycle ||
        scope !== "ALL"
    );

  const displayPayments: AdminPayment[] =
    scope === "TEAM"
      ? teamPayments
      : scope === "PERSONAL"
        ? payments
        : [...payments, ...teamPayments].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );

  const displayPagination =
    scope === "TEAM"
      ? teamPagination
      : pagination;

  return (
    <div className="space-y-6">
      {/* ======================================================= */}
      {/* HEADER                                                  */}
      {/* ======================================================= */}

      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
            <CreditCard
              size={14}
            />
            Billing
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Payments
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review payment
            attempts,
            successful
            purchases and
            subscription
            billing across
            ESOP Value
            Clarity.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadPayments(
              true
            )
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
          icon={<IndianRupee size={20} />}
          label={
            scope === "TEAM"
              ? "Team Revenue"
              : scope === "PERSONAL"
                ? "Personal Revenue"
                : "Combined Revenue"
          }
          value={
            summary
              ? formatCurrency(
                  scope === "TEAM"
                    ? summary.team.revenue.total
                    : scope === "PERSONAL"
                      ? summary.personal.revenue.total
                      : summary.combined.revenue.total,
                  "INR"
                )
              : "₹0"
          }
          description="Successful payments"
        />

        <SummaryCard
          icon={<IndianRupee size={20} />}
          label="This Month"
          value={
            summary
              ? formatCurrency(
                  scope === "TEAM"
                    ? summary.team.revenue.thisMonth
                    : scope === "PERSONAL"
                      ? summary.personal.revenue.thisMonth
                      : summary.combined.revenue.thisMonth,
                  "INR"
                )
              : "₹0"
          }
          description="Current month revenue"
        />

        <SummaryCard
          icon={<CircleCheck size={20} />}
          label="Successful"
          value={String(
            scope === "TEAM"
              ? summary?.team.successful ?? 0
              : scope === "PERSONAL"
                ? summary?.personal.successful ?? 0
                : summary?.combined.successful ?? 0
          )}
          description="Completed payments"
        />

        <SummaryCard
          icon={<Clock3 size={20} />}
          label="Pending / Failed"
          value={`${
            scope === "TEAM"
              ? summary?.team.pending ?? 0
              : scope === "PERSONAL"
                ? summary?.personal.pending ?? 0
                : summary?.combined.pending ?? 0
          } / ${
            scope === "TEAM"
              ? summary?.team.failed ?? 0
              : scope === "PERSONAL"
                ? summary?.personal.failed ?? 0
                : summary?.combined.failed ?? 0
          }`}
          description="Payment attention"
        />
      </section>

      {summary && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            Revenue today:{" "}
            <span className="font-black text-slate-950">
              {formatCurrency(
                scope === "TEAM"
                  ? summary.team.revenue.today
                  : scope === "PERSONAL"
                    ? summary.personal.revenue.today
                    : summary.combined.revenue.today,
                "INR"
              )}
            </span>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-700 shadow-sm">
            Team revenue:{" "}
            <span className="font-black text-slate-950">
              {formatCurrency(
                summary.team.revenue.total,
                summary.team.revenue.currency
              )}
            </span>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* FILTERS                                                 */}
      {/* ======================================================= */}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Filter
            size={17}
          />
          Search &
          filters
        </div>

        <form
          onSubmit={
            handleSearchSubmit
          }
          className="mt-4 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_170px_210px_210px_auto]"
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
                  event
                    .target
                    .value
                )
              }
              placeholder="Search user, email, payment ID..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <select
            value={
              status
            }
            onChange={(
              event
            ) => {
              setPage(1);

              setStatus(
                event
                  .target
                  .value as
                  | ""
                  | PaymentStatus
              );
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">
              All statuses
            </option>

            <option value="SUCCESS">
              Success
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="FAILED">
              Failed
            </option>
          </select>

          <select
            value={
              billingCycle
            }
            onChange={(
              event
            ) => {
              setPage(1);

              setBillingCycle(
                event
                  .target
                  .value as
                  | ""
                  | BillingCycle
              );
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">
              All billing
            </option>

            <option value="MONTHLY">
              Monthly
            </option>

            <option value="SIX_MONTHS">
              6 Months
            </option>

            <option value="YEARLY">
              Yearly
            </option>

            <option value="TEAM_YEARLY">
              Team — ₹1,45,000 / year
            </option>
          </select>

          <select
            value={scope}
            onChange={(event) => {
              setPage(1);
              setScope(
                event.target.value as PaymentScope
              );
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All payments</option>
            <option value="PERSONAL">Personal PRO</option>
            <option value="TEAM">Team Intelligence</option>
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
            Clear all
            filters
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
      {/* PAYMENTS TABLE                                          */}
      {/* ======================================================= */}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950">
              Transactions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Loading payments..."
                : scope === "TEAM"
                  ? `${teamPagination?.total?.toLocaleString("en-IN") ?? teamPayments.length} Team payments`
                  : scope === "PERSONAL"
                    ? `${pagination?.total?.toLocaleString("en-IN") ?? payments.length} personal payments`
                    : `${((pagination?.total ?? payments.length) + (teamPagination?.total ?? teamPayments.length)).toLocaleString("en-IN")} transactions` }
            </p>
          </div>

          {pagination && (
            <p className="text-xs text-slate-400">
              Page{" "}
              {
                displayPagination?.page
              }{" "}
              of{" "}
              {Math.max(
                displayPagination?.totalPages ?? 1,
                1
              )}
            </p>
          )}
        </div>

        {loading ? (
          <PaymentsLoading />
        ) : payments.length ===
          0 ? (
          <div className="px-5 py-16 text-center">
            <CreditCard
              size={28}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-4 text-sm font-black text-slate-900">
              No payments
              found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Payment
              transactions will
              appear here.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <TableHeading>
                      User
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

                    <TableHeading>
                      Order ID
                    </TableHeading>

                    <TableHeading>
                      Date
                    </TableHeading>

                    <TableHeading>
                      Workspace
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {displayPayments.map(
                    (
                      payment
                    ) => (
                      <tr
                        key={
                          payment.id
                        }
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-900">
                            {payment.user?.name ?? payment.purchaser?.name ?? "Team purchaser"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {payment.user?.email ?? payment.purchaser?.email ?? "—"}
                          </p>

                          {payment.paymentType === "TEAM" && (
                            <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black tracking-wide text-blue-700 ring-1 ring-inset ring-blue-100">
                              TEAM INTELLIGENCE
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-950">
                            {formatCurrency(
                              payment.amount,
                              payment.currency
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                          {formatBillingCycle(
                            payment.billingCycle
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <PaymentStatusBadge
                            status={
                              payment.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <code className="text-xs text-slate-500">
                            {payment.razorpayPaymentId ??
                              "—"}
                          </code>
                        </td>

                        <td className="px-5 py-4">
                          <code className="text-xs text-slate-500">
                            {payment.razorpayOrderId ??
                              "—"}
                          </code>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">
                          {formatDate(
                            payment.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {payment.paymentType === "TEAM" && payment.workspace ? (
                            <div>
                              <p className="max-w-[180px] truncate text-xs font-bold text-slate-800">
                                {payment.workspace.name}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-400">
                                {payment.workspace.activeMemberCount}/{payment.workspace.maxMembers} members
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/users/${payment.user?.id ?? payment.purchaser?.id ?? ""}`}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            View

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

            {/* MOBILE */}

            <div className="divide-y divide-slate-100 lg:hidden">
              {displayPayments.map(
                (
                  payment
                ) => (
                  <Link
                    key={
                      payment.id
                    }
                    href={`/admin/users/${payment.user?.id ?? payment.purchaser?.id ?? ""}`}
                    className="block px-4 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {payment.user?.name ?? payment.purchaser?.name ?? "Team purchaser"}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {payment.user?.email ?? payment.purchaser?.email ?? "—"}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-black text-slate-950">
                        {formatCurrency(
                          payment.amount,
                          payment.currency
                        )}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <PaymentStatusBadge
                        status={
                          payment.status
                        }
                      />

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">
                        {formatBillingCycle(
                          payment.billingCycle
                        )}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">
                        {
                          payment.plan
                        }
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                      {formatDate(
                        payment.createdAt
                      )}
                    </p>

                    {payment.razorpayPaymentId && (
                      <p className="mt-2 break-all text-[10px] text-slate-400">
                        {
                          payment
                            .razorpayPaymentId
                        }
                      </p>
                    )}
                  </Link>
                )
              )}
            </div>
          </>
        )}

        {/* PAGINATION */}

        {!loading &&
          displayPagination &&
          displayPagination.totalPages >
            0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4 sm:px-5">
              <p className="text-xs text-slate-500">
                Page{" "}
                <strong>
                  {
                    displayPagination.page
                  }
                </strong>{" "}
                of{" "}
                <strong>
                  {
                    displayPagination.totalPages
                  }
                </strong>
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    !displayPagination.hasPreviousPage
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
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  disabled={
                    !displayPagination.hasNextPage
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
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-40"
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

function SummaryCard({
  icon,
  label,
  value,
  description,
}: {
  icon:
    React.ReactNode;
  label: string;
  value: string;
  description: string;
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

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function PaymentStatusBadge({
  status,
}: {
  status:
    PaymentStatus;
}) {
  if (
    status ===
    "SUCCESS"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-100">
        <CircleCheck
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
        <CircleX
          size={10}
        />
        FAILED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700 ring-1 ring-inset ring-amber-100">
      <Clock3
        size={10}
      />
      PENDING
    </span>
  );
}

function TableHeading({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
      {children}
    </th>
  );
}

function PaymentsLoading() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({
        length: 8,
      }).map(
        (
          _,
          index
        ) => (
          <div
            key={
              index
            }
            className="flex gap-4 px-5 py-4"
          >
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-200" />

            <div className="flex-1">
              <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />

              <div className="mt-2 h-3 w-52 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        )
      )}
    </div>
  );
}
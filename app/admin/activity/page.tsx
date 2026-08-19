"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  LogIn,
  LogOut,
  UserPlus,
  UserRoundCog,
  Crown,
  CreditCard,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ActivityType =
  | "LOGIN"
  | "LOGOUT"
  | "SIGNUP"
  | "PROFILE_UPDATED"
  | "SIMULATOR_USED"
  | "TAX_CALCULATED"
  | "DILUTION_CALCULATED"
  | "VESTING_CALCULATED"
  | "EXIT_CALCULATED"
  | "COMPARE_USED"
  | "REPORT_CREATED"
  | "CALCULATION_CREATED"
  | "CALCULATION_UPDATED"
  | "CALCULATION_DELETED"
  | "PRO_UPGRADED"
  | "PRO_CANCELLED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED";

type UserRole = "USER" | "ADMIN";
type AccountStatus = "ACTIVE" | "SUSPENDED";
type UserPlan = "FREE" | "PRO";

interface ActivityItem {
  id: string;
  type: ActivityType;
  metadata: unknown;
  createdAt: string;

  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    accountStatus: AccountStatus;
    plan: UserPlan;
    subscriptionSource:
      | "PAYMENT"
      | "ADMIN_GRANT"
      | null;
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

interface ActivityResponse {
  success: boolean;
  activities: ActivityItem[];

  filters?: {
    search: string | null;
    type: ActivityType | null;
  };

  pagination: PaginationData;

  message?: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(type: string) {
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

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "LOGIN":
      return <LogIn size={17} />;

    case "LOGOUT":
      return <LogOut size={17} />;

    case "SIGNUP":
      return <UserPlus size={17} />;

    case "PROFILE_UPDATED":
      return <UserRoundCog size={17} />;

    case "PRO_UPGRADED":
    case "PRO_CANCELLED":
      return <Crown size={17} />;

    case "PAYMENT_SUCCESS":
    case "PAYMENT_FAILED":
      return <CreditCard size={17} />;

    default:
      return <Activity size={17} />;
  }
}

export default function AdminActivityPage() {
  const [activities, setActivities] =
    useState<ActivityItem[]>([]);

  const [pagination, setPagination] =
    useState<PaginationData | null>(null);

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState<"" | ActivityType>("");

  const [page, setPage] =
    useState(1);

  const limit = 25;

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadActivities = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params =
          new URLSearchParams();

        if (search) {
          params.set("search", search);
        }

        if (typeFilter) {
          params.set("type", typeFilter);
        }

        params.set("page", String(page));
        params.set(
          "limit",
          String(limit)
        );

        const response = await fetch(
          `/api/admin/activity?${params.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const result =
          (await response.json()) as ActivityResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to load activity"
          );
        }

        setActivities(
          result.activities ?? []
        );

        setPagination(
          result.pagination
        );
      } catch (error) {
        console.error(
          "Failed to load activity:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load activity"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, typeFilter, page]
  );

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

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
    setTypeFilter("");
    setPage(1);
  }

  const hasFilters =
    Boolean(search || typeFilter);

  return (
    <div className="space-y-6">
      {/* ======================================================= */}
      {/* HEADER                                                  */}
      {/* ======================================================= */}

      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
            <Activity size={14} />
            Product Activity
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Activity
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review account events such
            as signups, logins, profile
            updates and subscription
            activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadActivities(true)
          }
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
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
      {/* FILTERS                                                 */}
      {/* ======================================================= */}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Filter size={17} />
          Filters
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]"
        >
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search user or email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) => {
              setPage(1);

              setTypeFilter(
                event.target.value as
                  | ""
                  | ActivityType
              );
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="">
              All activity
            </option>

            <option value="SIGNUP">
              Signup
            </option>

            <option value="LOGIN">
              Login
            </option>

            <option value="LOGOUT">
              Logout
            </option>

            <option value="PROFILE_UPDATED">
              Profile Updated
            </option>

            <option value="PRO_UPGRADED">
              PRO Upgraded
            </option>

            <option value="PRO_CANCELLED">
              PRO Cancelled
            </option>

            <option value="PAYMENT_SUCCESS">
              Payment Success
            </option>

            <option value="PAYMENT_FAILED">
              Payment Failed
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
          <div className="mt-3">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-slate-500 transition hover:text-slate-950"
            >
              Clear all filters
            </button>
          </div>
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
      {/* ACTIVITY FEED                                           */}
      {/* ======================================================= */}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950">
              Activity Events
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Loading activity..."
                : pagination
                  ? `${pagination.total.toLocaleString(
                      "en-IN"
                    )} total events`
                  : `${activities.length} events`}
            </p>
          </div>

          {pagination && (
            <p className="text-xs text-slate-400">
              Page {pagination.page} of{" "}
              {Math.max(
                pagination.totalPages,
                1
              )}
            </p>
          )}
        </div>

        {loading ? (
          <ActivityLoading />
        ) : activities.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Activity size={22} />
            </div>

            <h3 className="mt-4 text-sm font-black text-slate-900">
              No activity found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Activity will appear here
              as users interact with the
              app.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map(
              (activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 px-5 py-4 transition hover:bg-slate-50/70"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    {getActivityIcon(
                      activity.type
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {formatLabel(
                              activity.type
                            )}
                          </p>

                          <UserBadge
                            role={
                              activity.user
                                .role
                            }
                          />

                          <PlanBadge
                            plan={
                              activity.user
                                .plan
                            }
                            source={
                              activity.user
                                .subscriptionSource
                            }
                          />

                          {activity.user
                            .accountStatus ===
                            "SUSPENDED" && (
                            <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-black text-red-600 ring-1 ring-inset ring-red-100">
                              SUSPENDED
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {
                            activity.user
                              .name
                          }{" "}
                          ·{" "}
                          {
                            activity.user
                              .email
                          }
                        </p>
                      </div>

                      <p className="shrink-0 text-[11px] text-slate-400">
                        {formatDate(
                          activity.createdAt
                        )}
                      </p>
                    </div>

                    <ActivityDescription
                      type={activity.type}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ===================================================== */}
        {/* PAGINATION                                            */}
        {/* ===================================================== */}

        {!loading &&
          pagination &&
          pagination.totalPages >
            0 && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:px-5">
              <p className="text-xs text-slate-500">
                Page{" "}
                <span className="font-bold text-slate-800">
                  {
                    pagination.page
                  }
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-800">
                  {
                    pagination.totalPages
                  }
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          current - 1,
                          1
                        )
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
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
                      (current) =>
                        current + 1
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight
                    size={17}
                  />
                </button>
              </div>
            </div>
          )}
      </section>

      {/* ======================================================= */}
      {/* PRIVACY NOTE                                            */}
      {/* ======================================================= */}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <ShieldCheck size={18} />
          </div>

          <div>
            <h2 className="text-sm font-black text-slate-950">
              Product-level activity only
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              This feed records account
              and product events, not
              passwords, authentication
              tokens, private ESOP input
              values or other sensitive
              user-entered information.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================ */
/* ACTIVITY DESCRIPTION                                         */
/* ============================================================ */

function ActivityDescription({
  type,
}: {
  type: ActivityType;
}) {
  switch (type) {
    case "SIGNUP":
      return (
        <ActivityNote>
          New user account created.
        </ActivityNote>
      );

    case "LOGIN":
      return (
        <ActivityNote>
          User successfully authenticated.
        </ActivityNote>
      );

    case "LOGOUT":
      return (
        <ActivityNote>
          User ended their current session.
        </ActivityNote>
      );

    case "PROFILE_UPDATED":
      return (
        <ActivityNote>
          User updated their profile information.
        </ActivityNote>
      );

    case "PRO_UPGRADED":
      return (
        <ActivityNote>
          User received or purchased PRO access.
        </ActivityNote>
      );

    case "PRO_CANCELLED":
      return (
        <ActivityNote>
          PRO subscription was cancelled.
        </ActivityNote>
      );

    case "PAYMENT_SUCCESS":
      return (
        <ActivityNote>
          Payment completed successfully.
        </ActivityNote>
      );

    case "PAYMENT_FAILED":
      return (
        <ActivityNote>
          Payment attempt failed.
        </ActivityNote>
      );

    default:
      return (
        <ActivityNote>
          Product activity recorded.
        </ActivityNote>
      );
  }
}

/* ============================================================ */
/* USER BADGE                                                   */
/* ============================================================ */

function UserBadge({
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

/* ============================================================ */
/* PLAN BADGE                                                   */
/* ============================================================ */

function PlanBadge({
  plan,
  source,
}: {
  plan: UserPlan;
  source:
    | "PAYMENT"
    | "ADMIN_GRANT"
    | null;
}) {
  if (plan === "PRO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700 ring-1 ring-inset ring-amber-100">
        <Crown size={10} />

        {source ===
        "ADMIN_GRANT"
          ? "PRO · GIFT"
          : "PRO"}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600 ring-1 ring-inset ring-slate-200">
      FREE
    </span>
  );
}

/* ============================================================ */
/* ACTIVITY NOTE                                                */
/* ============================================================ */

function ActivityNote({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mt-2 text-xs leading-5 text-slate-400">
      {children}
    </p>
  );
}

/* ============================================================ */
/* LOADING                                                      */
/* ============================================================ */

function ActivityLoading() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({
        length: 8,
      }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 px-5 py-4"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-200" />

          <div className="min-w-0 flex-1">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />

            <div className="mt-2 h-3 w-60 max-w-full animate-pulse rounded bg-slate-100" />

            <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
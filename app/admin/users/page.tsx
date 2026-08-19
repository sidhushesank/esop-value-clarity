"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  Crown,
  ShieldCheck,
  Ban,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

type UserRole = "USER" | "ADMIN";
type AccountStatus = "ACTIVE" | "SUSPENDED";
type UserPlan = "FREE" | "PRO";
type SubscriptionSource = "PAYMENT" | "ADMIN_GRANT" | null;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  accountStatus: AccountStatus;
  plan: UserPlan;

  subscription: {
    id: string;
    plan: UserPlan;
    billingCycle:
      | "MONTHLY"
      | "SIX_MONTHS"
      | "YEARLY"
      | null;
    status: "ACTIVE" | "CANCELLED" | "EXPIRED";
    source: "PAYMENT" | "ADMIN_GRANT";
    startedAt: string;
    expiresAt: string | null;
    grantReason: string | null;
  } | null;

  stats: {
    calculations: number;
    payments: number;
  };

  lastLoginAt: string | null;
  lastActiveAt: string | null;

  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UsersResponse {
  success: boolean;
  users: AdminUser[];
  pagination: PaginationData;
  message?: string;
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] =
    useState<PaginationData | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [plan, setPlan] = useState<"" | UserPlan>("");
  const [status, setStatus] =
    useState<"" | AccountStatus>("");
  const [role, setRole] = useState<"" | UserRole>("");

  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const loadUsers = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();

        if (search) {
          params.set("search", search);
        }

        if (plan) {
          params.set("plan", plan);
        }

        if (status) {
          params.set("status", status);
        }

        if (role) {
          params.set("role", role);
        }

        params.set("page", String(page));
        params.set("limit", String(limit));

        const response = await fetch(
          `/api/admin/users?${params.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const result =
          (await response.json()) as UsersResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load users"
          );
        }

        setUsers(result.users);
        setPagination(result.pagination);
      } catch (error) {
        console.error(
          "Failed to load admin users:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load users"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, plan, status, role, page]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearchSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setPlan("");
    setStatus("");
    setRole("");
    setPage(1);
  }

  const hasFilters = useMemo(() => {
    return Boolean(
      search ||
        plan ||
        status ||
        role
    );
  }, [search, plan, status, role]);

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
            <Users size={14} />
            User Management
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
            Users
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Search accounts, review access, inspect
            subscription status and manage users.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadUsers(true)}
          disabled={refreshing}
          className="
            inline-flex
            min-h-11
            items-center
            justify-center
            gap-2
            self-start
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

            lg:self-auto
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
      </section>

      {/* ======================================================= */}
      {/* SEARCH + FILTERS                                        */}
      {/* ======================================================= */}

      <section
        className="
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-4
          shadow-sm

          sm:p-5
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
            text-sm
            font-black
            text-slate-900
          "
        >
          <SlidersHorizontal size={17} />
          Search & filters
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="
            mt-4
            grid
            gap-3

            lg:grid-cols-[minmax(260px,1fr)_160px_180px_150px_auto]
          "
        >
          <div className="relative">
            <Search
              size={17}
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search name or email..."
              className="
                h-11
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                pl-10
                pr-3
                text-sm
                text-slate-900
                outline-none
                transition

                placeholder:text-slate-400

                focus:border-slate-400
                focus:ring-4
                focus:ring-slate-100
              "
            />
          </div>

          <select
            value={plan}
            onChange={(event) => {
              setPage(1);

              setPlan(
                event.target
                  .value as "" | UserPlan
              );
            }}
            className="
              h-11
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3
              text-sm
              font-semibold
              text-slate-700
              outline-none
              transition

              focus:border-slate-400
              focus:ring-4
              focus:ring-slate-100
            "
          >
            <option value="">
              All plans
            </option>

            <option value="FREE">
              FREE
            </option>

            <option value="PRO">
              PRO
            </option>
          </select>

          <select
            value={status}
            onChange={(event) => {
              setPage(1);

              setStatus(
                event.target
                  .value as
                  | ""
                  | AccountStatus
              );
            }}
            className="
              h-11
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3
              text-sm
              font-semibold
              text-slate-700
              outline-none
              transition

              focus:border-slate-400
              focus:ring-4
              focus:ring-slate-100
            "
          >
            <option value="">
              All statuses
            </option>

            <option value="ACTIVE">
              ACTIVE
            </option>

            <option value="SUSPENDED">
              SUSPENDED
            </option>
          </select>

          <select
            value={role}
            onChange={(event) => {
              setPage(1);

              setRole(
                event.target
                  .value as "" | UserRole
              );
            }}
            className="
              h-11
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3
              text-sm
              font-semibold
              text-slate-700
              outline-none
              transition

              focus:border-slate-400
              focus:ring-4
              focus:ring-slate-100
            "
          >
            <option value="">
              All roles
            </option>

            <option value="USER">
              USER
            </option>

            <option value="ADMIN">
              ADMIN
            </option>
          </select>

          <button
            type="submit"
            className="
              h-11
              rounded-xl
              bg-slate-950
              px-5
              text-sm
              font-bold
              text-white
              transition
              hover:bg-slate-800
            "
          >
            Search
          </button>
        </form>

        {hasFilters && (
          <div className="mt-3">
            <button
              type="button"
              onClick={clearFilters}
              className="
                text-xs
                font-bold
                text-slate-500
                transition
                hover:text-slate-950
              "
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
        <div
          className="
            rounded-2xl
            border
            border-red-100
            bg-red-50
            px-4
            py-3
            text-sm
            font-semibold
            text-red-700
          "
        >
          {error}
        </div>
      )}

      {/* ======================================================= */}
      {/* USERS CARD                                              */}
      {/* ======================================================= */}

      <section
        className="
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >
        {/* ===================================================== */}
        {/* TABLE HEADER                                          */}
        {/* ===================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2
            border-b
            border-slate-200
            px-5
            py-4

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h2 className="text-base font-black text-slate-950">
              Accounts
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {pagination
                ? `${pagination.total.toLocaleString(
                    "en-IN"
                  )} total users`
                : "Loading users..."}
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

        {/* ===================================================== */}
        {/* LOADING                                               */}
        {/* ===================================================== */}

        {loading ? (
          <UsersLoading />
        ) : users.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                text-slate-500
              "
            >
              <Users size={21} />
            </div>

            <h3 className="mt-4 text-sm font-black text-slate-900">
              No users found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try adjusting your search or
              filters.
            </p>
          </div>
        ) : (
          <>
            {/* ================================================= */}
            {/* DESKTOP TABLE                                     */}
            {/* ================================================= */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr
                    className="
                      border-b
                      border-slate-200
                      bg-slate-50/70
                    "
                  >
                    <TableHeading>
                      User
                    </TableHeading>

                    <TableHeading>
                      Plan
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Role
                    </TableHeading>

                    <TableHeading>
                      Usage
                    </TableHeading>

                    <TableHeading>
                      Last login
                    </TableHeading>

                    <TableHeading>
                      Joined
                    </TableHeading>

                    <TableHeading>
                      Action
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="
                        transition
                        hover:bg-slate-50/70
                      "
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={user.name}
                          />

                          <div className="min-w-0">
                            <p
                              className="
                                max-w-[220px]
                                truncate
                                text-sm
                                font-bold
                                text-slate-900
                              "
                            >
                              {user.name}
                            </p>

                            <p
                              className="
                                mt-1
                                max-w-[240px]
                                truncate
                                text-xs
                                text-slate-500
                              "
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <PlanBadge
                          plan={user.plan}
                          source={
                            user.subscription
                              ?.source ?? null
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            user.accountStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <RoleBadge
                          role={user.role}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-600">
                          <p>
                            {
                              user.stats
                                .calculations
                            }{" "}
                            calculations
                          </p>

                          <p className="mt-1 text-slate-400">
                            {
                              user.stats
                                .payments
                            }{" "}
                            payments
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-600">
                          {formatDate(
                            user.lastLoginAt
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-600">
                          {formatShortDate(
                            user.createdAt
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="
                            inline-flex
                            items-center
                            gap-1
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-2
                            text-xs
                            font-bold
                            text-slate-700
                            shadow-sm
                            transition

                            hover:bg-slate-50
                            hover:text-slate-950
                          "
                        >
                          View
                          <ArrowRight
                            size={13}
                          />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================================================= */}
            {/* MOBILE CARDS                                      */}
            {/* ================================================= */}

            <div className="divide-y divide-slate-100 lg:hidden">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="
                    block
                    px-4
                    py-4
                    transition
                    hover:bg-slate-50

                    sm:px-5
                  "
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={user.name}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
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

                        <ArrowRight
                          size={16}
                          className="
                            mt-1
                            shrink-0
                            text-slate-300
                          "
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <PlanBadge
                          plan={user.plan}
                          source={
                            user.subscription
                              ?.source ?? null
                          }
                        />

                        <StatusBadge
                          status={
                            user.accountStatus
                          }
                        />

                        <RoleBadge
                          role={user.role}
                        />
                      </div>

                      <div
                        className="
                          mt-4
                          grid
                          grid-cols-2
                          gap-3
                          rounded-xl
                          bg-slate-50
                          p-3
                        "
                      >
                        <MobileDetail
                          label="Calculations"
                          value={String(
                            user.stats
                              .calculations
                          )}
                        />

                        <MobileDetail
                          label="Payments"
                          value={String(
                            user.stats
                              .payments
                          )}
                        />

                        <MobileDetail
                          label="Last login"
                          value={formatDate(
                            user.lastLoginAt
                          )}
                        />

                        <MobileDetail
                          label="Joined"
                          value={formatShortDate(
                            user.createdAt
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* ===================================================== */}
        {/* PAGINATION                                            */}
        {/* ===================================================== */}

        {!loading &&
          pagination &&
          pagination.totalPages > 0 && (
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                border-t
                border-slate-200
                px-4
                py-4

                sm:px-5
              "
            >
              <p className="text-xs text-slate-500">
                Showing page{" "}
                <span className="font-bold text-slate-800">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-800">
                  {pagination.totalPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        current - 1,
                        1
                      )
                    )
                  }
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-700
                    shadow-sm
                    transition

                    hover:bg-slate-50

                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                  aria-label="Previous page"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage((current) =>
                      current + 1
                    )
                  }
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-700
                    shadow-sm
                    transition

                    hover:bg-slate-50

                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                  aria-label="Next page"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
      </section>
    </div>
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
    <th
      className="
        px-5
        py-3
        text-left
        text-[10px]
        font-black
        uppercase
        tracking-[0.12em]
        text-slate-400
      "
    >
      {children}
    </th>
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
/* PLAN BADGE                                                   */
/* ============================================================ */

function PlanBadge({
  plan,
  source,
}: {
  plan: UserPlan;
  source: SubscriptionSource;
}) {
  if (plan === "PRO") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1
          rounded-full
          bg-amber-50
          px-2
          py-1
          text-[9px]
          font-black
          tracking-wide
          text-amber-700
          ring-1
          ring-inset
          ring-amber-100
        "
      >
        <Crown size={10} />

        {source === "ADMIN_GRANT"
          ? "PRO · GIFT"
          : "PRO"}
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        rounded-full
        bg-slate-100
        px-2
        py-1
        text-[9px]
        font-black
        tracking-wide
        text-slate-600
        ring-1
        ring-inset
        ring-slate-200
      "
    >
      FREE
    </span>
  );
}

/* ============================================================ */
/* STATUS BADGE                                                 */
/* ============================================================ */

function StatusBadge({
  status,
}: {
  status: AccountStatus;
}) {
  if (status === "SUSPENDED") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1
          rounded-full
          bg-red-50
          px-2
          py-1
          text-[9px]
          font-black
          tracking-wide
          text-red-600
          ring-1
          ring-inset
          ring-red-100
        "
      >
        <Ban size={10} />
        SUSPENDED
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        rounded-full
        bg-emerald-50
        px-2
        py-1
        text-[9px]
        font-black
        tracking-wide
        text-emerald-700
        ring-1
        ring-inset
        ring-emerald-100
      "
    >
      ACTIVE
    </span>
  );
}

/* ============================================================ */
/* ROLE BADGE                                                   */
/* ============================================================ */

function RoleBadge({
  role,
}: {
  role: UserRole;
}) {
  if (role === "ADMIN") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1
          rounded-full
          bg-violet-50
          px-2
          py-1
          text-[9px]
          font-black
          tracking-wide
          text-violet-700
          ring-1
          ring-inset
          ring-violet-100
        "
      >
        <ShieldCheck size={10} />
        ADMIN
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        rounded-full
        bg-blue-50
        px-2
        py-1
        text-[9px]
        font-black
        tracking-wide
        text-blue-700
        ring-1
        ring-inset
        ring-blue-100
      "
    >
      USER
    </span>
  );
}

/* ============================================================ */
/* MOBILE DETAIL                                                */
/* ============================================================ */

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p
        className="
          text-[9px]
          font-black
          uppercase
          tracking-wide
          text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-xs
          font-semibold
          text-slate-700
        "
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================ */
/* USERS LOADING                                                */
/* ============================================================ */

function UsersLoading() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 8 }).map(
        (_, index) => (
          <div
            key={index}
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
                h-10
                w-10
                shrink-0
                animate-pulse
                rounded-xl
                bg-slate-200
              "
            />

            <div className="min-w-0 flex-1">
              <div
                className="
                  h-4
                  w-36
                  animate-pulse
                  rounded
                  bg-slate-200
                "
              />

              <div
                className="
                  mt-2
                  h-3
                  w-52
                  max-w-full
                  animate-pulse
                  rounded
                  bg-slate-100
                "
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}
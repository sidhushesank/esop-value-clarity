"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Coins,
  FileCheck2,
  FileText,
  Layers3,
  Loader2,
  Plus,
  Archive,
  ArchiveRestore,
  Trash2,
  X,
  RefreshCcw,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";

/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   DASHBOARD / SAVED OFFERS

   Route:
   /pro/offers

   Responsibilities:
   - load the authenticated user's saved offers
   - show dashboard statistics
   - show confirmed / comparison-ready offers
   - provide View + Compare actions
   - provide empty / loading / error states
   - never expose raw scanner snapshots
============================================================ */

/* ============================================================
   TYPES
============================================================ */

type OfferCash = {
  headlineCTC: number | null;
  fixedSalary: number | null;

  basicSalary: number | null;
  hra: number | null;
  specialAllowance: number | null;
  otherFixedAllowance: number | null;

  targetVariablePay: number | null;
  maximumVariablePay: number | null;

  joiningBonus: number | null;
  retentionBonus: number | null;
  relocationBonus: number | null;
  performanceBonus: number | null;

  employerPF: number | null;
  gratuity: number | null;

  insuranceValue: number | null;
  otherEmployerBenefits: number | null;
};

type OfferEquity = {
  type: string | null;

  companyEquityStatus: string | null;

  employerHeadlineEquityValue:
    number | null;

  totalOptionsOrShares:
    number | null;

  exercisePrice: number | null;
  currentFMV: number | null;
  listedSharePrice: number | null;

  companyValuation: number | null;
  totalCompanyShares: number | null;
  ownershipPercentage: number | null;

  vestingDurationMonths:
    number | null;

  cliffMonths: number | null;
  vestingFrequency: string | null;

  vestingStartDate: string | null;
  grantDate: string | null;
  expiryDate: string | null;

  postTerminationExerciseDays:
    number | null;

  expectedDilutionPercentage:
    number | null;
};

type OfferDocument = {
  originalFileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  pageCount: number | null;
};

type OfferReadiness = {
  confirmed: boolean;
  archived: boolean;
  hasEquity: boolean;
  equityUnknown: boolean;
  equityModelReady: boolean;
  cashComparisonReady: boolean;
  overallDecisionReady: boolean;
  readyForComparison: boolean;
  dataCompletenessPercentage: number;
};

type OfferTimestamps = {
  confirmedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type OfferActions = {
  viewHref: string;
  compareHref: string | null;
};

type SavedOffer = {
  id: string;

  status: string;
  source: string;

  companyName: string | null;
  roleTitle: string | null;
  location: string | null;

  employmentType: string | null;
  workMode: string | null;

  joiningDate: string | null;
  currency: string;

  cash: OfferCash;
  equity: OfferEquity;

  document: OfferDocument;

  engine: {
    normalizedSnapshot: unknown;
    validationSnapshot: unknown;
  };

  readiness: OfferReadiness;

  timestamps: OfferTimestamps;

  actions: OfferActions;
};

type DashboardStats = {
  total: number;
  confirmed: number;
  readyForComparison: number;
  archived: number;
  withEquity: number;
  esopOffers: number;
  rsuOffers: number;
};

type ComparisonCandidate = {
  id: string;

  companyName: string | null;
  roleTitle: string | null;

  fixedSalary: number | null;
  headlineCTC: number | null;

  equityType: string | null;
  totalOptionsOrShares: number | null;

  createdAt: string;

  viewHref: string;
  compareHref: string | null;
};

type OffersSuccessResponse = {
  success: true;

  stats: DashboardStats;

  offers: SavedOffer[];

  comparisonCandidates:
    ComparisonCandidate[];

  actions: {
    createOfferHref: string;
    qaHref: string;
  };
};

type OffersErrorResponse = {
  success: false;

  message: string;

  code?: string;
};

type OffersApiResponse =
  | OffersSuccessResponse
  | OffersErrorResponse;

/* ============================================================
   FORMATTERS
============================================================ */

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function money(
  value: unknown,
  currency = "INR"
): string {
  if (!isFiniteNumber(value)) {
    return "Not available";
  }

  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency:
          currency || "INR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  } catch {
    return new Intl.NumberFormat(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    ).format(value);
  }
}

function compactMoney(
  value: unknown,
  currency = "INR"
): string {
  if (!isFiniteNumber(value)) {
    return "—";
  }

  if (currency !== "INR") {
    return money(
      value,
      currency
    );
  }

  const absolute =
    Math.abs(value);

  if (
    absolute >=
    10_000_000
  ) {
    return `₹${(
      value /
      10_000_000
    ).toFixed(2)} Cr`;
  }

  if (
    absolute >=
    100_000
  ) {
    return `₹${(
      value /
      100_000
    ).toFixed(2)} L`;
  }

  return money(
    value,
    currency
  );
}

function number(
  value: unknown
): string {
  if (!isFiniteNumber(value)) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function displayDate(
  value: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

function textValue(
  value: string | null
): string {
  if (!value) {
    return "Not available";
  }

  return value.replaceAll(
    "_",
    " "
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  helper,
  icon,
  delay = 0,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="oi-dashboard-reveal oi-dashboard-lift rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
      style={{
        animationDelay:
          `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {helper}
          </p>
        </div>

        <div className="oi-icon-float flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPLETENESS
============================================================ */

function CompletenessBar({
  value,
}: {
  value: number;
}) {
  const safeValue =
    Math.min(
      100,
      Math.max(
        0,
        value
      )
    );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Data completeness
        </p>

        <p className="text-xs font-black text-violet-700">
          {safeValue}%
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="oi-dashboard-progress h-full rounded-full bg-violet-600"
          style={{
            width:
              `${safeValue}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   SAVED OFFER CARD
============================================================ */

function SavedOfferCard({
  offer,
  index,
  busy,
  onArchive,
  onRestore,
  onDelete,
}: {
  offer: SavedOffer;
  index: number;
  busy: boolean;
  onArchive: (offer: SavedOffer) => void;
  onRestore: (offer: SavedOffer) => void;
  onDelete: (offer: SavedOffer) => void;
}) {
  const statusClass =
    offer.readiness.archived
      ? "border-slate-200 bg-slate-100 text-slate-600"
      : offer.readiness.confirmed
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <article
      className="oi-dashboard-reveal oi-offer-card group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
      style={{
        animationDelay:
          `${Math.min(
            120 +
              index * 70,
            500
          )}ms`,
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-violet-100/70 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusClass}`}
              >
                {offer.status.replaceAll(
                  "_",
                  " "
                )}
              </span>

              {offer.readiness
                .cashComparisonReady ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
                  <Scale size={11} />
                  Cash comparison ready
                </span>
              ) : null}

              {offer.readiness.cashComparisonReady &&
              !offer.readiness.overallDecisionReady ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                  <CircleAlert size={11} />
                  Equity clarification needed
                </span>
              ) : null}
            </div>

            <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
              {offer.companyName ??
                "Unnamed offer"}
            </h3>

            <p className="mt-1 text-sm font-bold text-slate-500">
              {offer.roleTitle ??
                "Role not available"}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3">
            <BriefcaseBusiness size={21} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {offer.location ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              {offer.location}
            </span>
          ) : null}

          {offer.workMode ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              {textValue(
                offer.workMode
              )}
            </span>
          ) : null}

          {offer.joiningDate ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              <Clock3 size={12} />
              {displayDate(
                offer.joiningDate
              )}
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Fixed
            </p>
            <p className="mt-2 text-lg font-black text-slate-950">
              {compactMoney(
                offer.cash.fixedSalary,
                offer.currency
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Headline CTC
            </p>
            <p className="mt-2 text-lg font-black text-slate-950">
              {compactMoney(
                offer.cash.headlineCTC,
                offer.currency
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Equity
            </p>
            <p className="mt-2 text-lg font-black text-slate-950">
              {offer.readiness.equityUnknown
                ? "Not stated"
                : offer.equity.type ?? "Not stated"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Grant
            </p>
            <p className="mt-2 text-lg font-black text-slate-950">
              {offer.readiness.hasEquity
                ? number(
                    offer.equity.totalOptionsOrShares
                  )
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <CompletenessBar
            value={
              offer.readiness
                .dataCompletenessPercentage
            }
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={offer.actions.viewHref}
            className="group/action inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
          >
            View offer
            <ArrowRight
              className="transition-transform duration-300 group-hover/action:translate-x-1.5"
              size={15}
            />
          </Link>

          {!offer.readiness.archived &&
          offer.actions.compareHref ? (
            <Link
              href={offer.actions.compareHref}
              className="group/action inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-black text-violet-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:translate-y-0"
            >
              <Scale
                className="transition-transform duration-300 group-hover/action:rotate-12"
                size={15}
              />
              Compare
            </Link>
          ) : null}

          {!offer.readiness.archived &&
          !offer.actions.compareHref ? (
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-400">
              <AlertTriangle size={14} />
              Cash details need review
            </span>
          ) : null}

          {!offer.readiness.archived ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onArchive(offer)
              }
              className="group/action inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <Loader2
                  className="animate-spin"
                  size={15}
                />
              ) : (
                <Archive
                  className="transition-transform duration-300 group-hover/action:-translate-y-1"
                  size={15}
                />
              )}
              Archive
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onRestore(offer)
                }
                className="group/action inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <Loader2
                    className="animate-spin"
                    size={15}
                  />
                ) : (
                  <ArchiveRestore
                    className="transition-transform duration-300 group-hover/action:-rotate-12"
                    size={15}
                  />
                )}
                Restore
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onDelete(offer)
                }
                className="group/action inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2
                  className="transition-transform duration-300 group-hover/action:rotate-6"
                  size={15}
                />
                Delete permanently
              </button>
            </>
          )}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              {offer.readiness.archived
                ? "Archived "
                : "Saved "}
              {displayDate(
                offer.readiness.archived
                  ? offer.timestamps.archivedAt
                  : offer.timestamps.createdAt
              )}
            </span>

            {offer.document.originalFileName ? (
              <span className="max-w-[220px] truncate">
                {offer.document.originalFileName}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState() {
  return (
    <section className="oi-dashboard-reveal mt-8 rounded-[30px] border border-dashed border-slate-300 bg-white p-8 text-center md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-violet-100 text-violet-700">
        <FileText
          size={28}
        />
      </div>

      <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
        Your first offer
        starts here.
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
        Upload an offer letter,
        review every extracted
        number and save the
        confirmed economics before
        comparing it with another
        opportunity.
      </p>

      <Link
        href="/pro/offers/new"
        className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
      >
        <Plus
          className="transition-transform duration-300 group-hover:rotate-90"
          size={17}
        />

        Add your first offer

        <ArrowRight
          className="transition-transform duration-300 group-hover:translate-x-1.5"
          size={16}
        />
      </Link>
    </section>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-[65vh] max-w-7xl items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Loader2
              className="animate-spin"
              size={29}
            />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Loading Offer
            Intelligence
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Retrieving your
            confirmed offers.
          </p>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function OffersPage() {
  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    data,
    setData,
  ] =
    useState<OffersSuccessResponse | null>(
      null
    );

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);

  const [
    actionOfferId,
    setActionOfferId,
  ] =
    useState<string | null>(
      null
    );

  const [
    actionError,
    setActionError,
  ] =
    useState<string | null>(
      null
    );

  const [
    showArchived,
    setShowArchived,
  ] =
    useState(false);

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<SavedOffer | null>(
      null
    );

  /* ==========================================================
     LOAD SAVED OFFERS
  ========================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function loadOffers() {
      setLoading(true);
      setError(null);

      try {
        const request =
          await fetch(
            "/api/pro/offers",
            {
              method: "GET",
              credentials:
                "include",
              cache:
                "no-store",
            }
          );

        const result =
          (await request.json()) as
            OffersApiResponse;

        if (cancelled) {
          return;
        }

        if (
          !request.ok ||
          !result.success
        ) {
          setData(null);

          setError(
            result.success
              ? "Unable to retrieve saved offers."
              : result.message
          );

          return;
        }

        setData(result);
      } catch (caught) {
        console.error(
          "[OFFERS_DASHBOARD]",
          caught
        );

        if (!cancelled) {
          setData(null);

          setError(
            "Something went wrong while loading Offer Intelligence."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOffers();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const offers = useMemo(
    () => data?.offers ?? [],
    [data]
  );

  const activeOffers =
    useMemo(
      () =>
        offers.filter(
          (offer) =>
            !offer.readiness
              .archived
        ),
      [offers]
    );

  const latestOffer =
    activeOffers[0] ??
    null;


  const archivedOffers =
    useMemo(
      () =>
        offers.filter(
          (offer) =>
            offer.readiness
              .archived
        ),
      [offers]
    );

  async function updateOfferLifecycle(
    offer: SavedOffer,
    action: "archive" | "restore"
  ) {
    if (actionOfferId) {
      return;
    }

    setActionError(null);
    setActionOfferId(offer.id);

    try {
      const request =
        await fetch(
          `/api/pro/offers/${encodeURIComponent(
            offer.id
          )}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action,
            }),
          }
        );

      const result =
        (await request.json()) as {
          success?: boolean;
          message?: string;
        };

      if (
        !request.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            `Unable to ${action} this offer.`
        );
      }

      setRefreshKey(
        (current) =>
          current + 1
      );
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : `Unable to ${action} this offer.`
      );
    } finally {
      setActionOfferId(null);
    }
  }

  async function deleteOfferPermanently(
    offer: SavedOffer
  ) {
    if (actionOfferId) {
      return;
    }

    setActionError(null);
    setActionOfferId(offer.id);

    try {
      const request =
        await fetch(
          `/api/pro/offers/${encodeURIComponent(
            offer.id
          )}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

      const result =
        (await request.json()) as {
          success?: boolean;
          message?: string;
        };

      if (
        !request.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to permanently delete this offer."
        );
      }

      setDeleteTarget(null);

      setRefreshKey(
        (current) =>
          current + 1
      );
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Unable to permanently delete this offer."
      );
    } finally {
      setActionOfferId(null);
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return <LoadingState />;
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <style>{`
        @keyframes oiDashboardReveal {
          from {
            opacity: 0;
            transform: translateY(22px) scale(.992);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes oiDashboardProgress {
          from {
            transform: scaleX(0);
          }

          to {
            transform: scaleX(1);
          }
        }

        @keyframes oiIconFloat {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes oiHeroOrb {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(-18px, 12px, 0) scale(1.08);
          }
        }

        .oi-dashboard-reveal {
          animation:
            oiDashboardReveal
            .65s
            cubic-bezier(.2,.8,.2,1)
            both;
        }

        .oi-dashboard-lift,
        .oi-offer-card {
          transition:
            transform .34s cubic-bezier(.2,.8,.2,1),
            box-shadow .34s ease,
            border-color .34s ease;

          will-change:
            transform;
        }

        .oi-dashboard-lift:hover {
          transform:
            translateY(-6px);

          box-shadow:
            0 24px 55px -32px
            rgba(15,23,42,.34);
        }

        .oi-offer-card:hover {
          transform:
            translateY(-8px)
            scale(1.006);

          box-shadow:
            0 28px 65px -34px
            rgba(15,23,42,.38);
        }

        .oi-dashboard-progress {
          transform-origin:
            left center;

          animation:
            oiDashboardProgress
            1s
            cubic-bezier(.2,.8,.2,1)
            .2s
            both;
        }

        .oi-icon-float {
          animation:
            oiIconFloat
            3s
            ease-in-out
            infinite;
        }

        .oi-hero-orb {
          animation:
            oiHeroOrb
            7s
            ease-in-out
            infinite;
        }

        @media
        (prefers-reduced-motion: reduce) {
          .oi-dashboard-reveal,
          .oi-dashboard-progress,
          .oi-icon-float,
          .oi-hero-orb {
            animation:
              none !important;
          }

          .oi-dashboard-lift,
          .oi-offer-card {
            transition:
              none !important;
          }

          .oi-dashboard-lift:hover,
          .oi-offer-card:hover {
            transform:
              none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">

        {/* =====================================================
            HERO
        ====================================================== */}

        <section
          className="oi-dashboard-reveal group overflow-hidden rounded-[34px] bg-slate-950 text-white shadow-xl shadow-slate-950/10"
          onPointerMove={(
            event
          ) => {
            const rect =
              event.currentTarget.getBoundingClientRect();

            event.currentTarget.style.setProperty(
              "--hero-x",
              `${
                event.clientX -
                rect.left
              }px`
            );

            event.currentTarget.style.setProperty(
              "--hero-y",
              `${
                event.clientY -
                rect.top
              }px`
            );
          }}
        >
          <div className="relative overflow-hidden p-7 md:p-10 lg:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(520px circle at var(--hero-x, 75%) var(--hero-y, 25%), rgba(139,92,246,.25), transparent 58%)",
              }}
            />

            <div className="oi-hero-orb pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-40 left-[18%] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
                <Sparkles
                  size={14}
                />

                PRO • Offer
                Intelligence
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                Compare the offers
                behind the CTC.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                Scan, review and
                compare compensation,
                equity, vesting,
                liquidity and
                long-term economic
                outcomes without
                treating speculative
                equity as guaranteed
                cash.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/pro/offers/new"
                  className="group/action inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-black text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
                >
                  <Plus
                    className="transition-transform duration-300 group-hover/action:rotate-90"
                    size={18}
                  />

                  Add an offer

                  <ArrowRight
                    className="transition-transform duration-300 group-hover/action:translate-x-1.5"
                    size={17}
                  />
                </Link>

                {latestOffer ? (
                  <Link
                    href={
                      latestOffer
                        .actions
                        .viewHref
                    }
                    className="group/action inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-black text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 active:translate-y-0"
                  >
                    <FileCheck2
                      size={18}
                    />

                    Latest offer

                    <ArrowRight
                      className="transition-transform duration-300 group-hover/action:translate-x-1.5"
                      size={16}
                    />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error ? (
          <section className="oi-dashboard-reveal mt-6 rounded-[26px] border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CircleAlert
                  className="mt-0.5 shrink-0 text-red-700"
                  size={19}
                />

                <div>
                  <p className="font-black text-red-950">
                    Saved offers
                    could not be
                    loaded
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-800">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRefreshKey(
                    (current) =>
                      current + 1
                  )
                }
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-black text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
              >
                <RefreshCcw
                  className="transition-transform duration-500 group-hover:rotate-180"
                  size={16}
                />

                Try again
              </button>
            </div>
          </section>
        ) : null}

        {actionError ? (
          <section className="oi-dashboard-reveal mt-4 rounded-[22px] border border-red-200 bg-red-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CircleAlert
                  className="mt-0.5 shrink-0 text-red-700"
                  size={18}
                />
                <div>
                  <p className="font-black text-red-950">
                    Offer action failed
                  </p>
                  <p className="mt-1 text-sm leading-6 text-red-800">
                    {actionError}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Dismiss error"
                onClick={() =>
                  setActionError(null)
                }
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100"
              >
                <X size={16} />
              </button>
            </div>
          </section>
        ) : null}

        {/* =====================================================
            STATS
        ====================================================== */}

        {data ? (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Saved offers"
              value={
                data.stats.total
              }
              helper="All Offer Intelligence records in your workspace."
              icon={
                <Layers3
                  size={21}
                />
              }
              delay={80}
            />

            <StatCard
              label="Confirmed"
              value={
                data.stats
                  .confirmed
              }
              helper="Offers reviewed and confirmed by you."
              icon={
                <CheckCircle2
                  size={21}
                />
              }
              delay={140}
            />

            <StatCard
              label="Cash comparison ready"
              value={
                data.stats
                  .readyForComparison
              }
              helper="Confirmed INR cash can be compared. Equity may still need clarification."
              icon={
                <Scale
                  size={21}
                />
              }
              delay={200}
            />

            <StatCard
              label="With equity"
              value={
                data.stats
                  .withEquity
              }
              helper={`${data.stats.esopOffers} ESOP • ${data.stats.rsuOffers} RSU`}
              icon={
                <Coins
                  size={21}
                />
              }
              delay={260}
            />
          </section>
        ) : null}

        {/* =====================================================
            SAVED OFFERS
        ====================================================== */}

        {data &&
        activeOffers.length >
          0 ? (
          <section className="mt-9">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                  Your workspace
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Saved offers
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Reopen a confirmed
                  offer or choose one
                  as Offer A to start
                  another comparison.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRefreshKey(
                    (current) =>
                      current + 1
                  )
                }
                className="group inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:translate-y-0 sm:self-auto"
              >
                <RefreshCcw
                  className="transition-transform duration-500 group-hover:rotate-180"
                  size={15}
                />

                Refresh
              </button>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {activeOffers.map(
                (
                  offer,
                  index
                ) => (
                  <SavedOfferCard
                    key={
                      offer.id
                    }
                    offer={
                      offer
                    }
                    index={
                      index
                    }
                    busy={
                      actionOfferId ===
                      offer.id
                    }
                    onArchive={(
                      selected
                    ) =>
                      void updateOfferLifecycle(
                        selected,
                        "archive"
                      )
                    }
                    onRestore={(
                      selected
                    ) =>
                      void updateOfferLifecycle(
                        selected,
                        "restore"
                      )
                    }
                    onDelete={(
                      selected
                    ) =>
                      setDeleteTarget(
                        selected
                      )
                    }
                  />
                )
              )}
            </div>
          </section>
        ) : null}

        {/* =====================================================
            ARCHIVED OFFERS
        ====================================================== */}

        {data &&
        archivedOffers.length >
          0 ? (
          <section className="mt-8">
            <button
              type="button"
              onClick={() =>
                setShowArchived(
                  (current) =>
                    !current
                )
              }
              className="group flex w-full items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Archive size={19} />
                </div>

                <div>
                  <p className="font-black text-slate-950">
                    Archived offers
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {archivedOffers.length} archived{" "}
                    {archivedOffers.length === 1
                      ? "offer"
                      : "offers"}
                  </p>
                </div>
              </div>

              <ArrowRight
                className={`text-slate-400 transition-transform duration-300 ${
                  showArchived
                    ? "rotate-90"
                    : ""
                }`}
                size={18}
              />
            </button>

            {showArchived ? (
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                {archivedOffers.map(
                  (
                    offer,
                    index
                  ) => (
                    <SavedOfferCard
                      key={
                        offer.id
                      }
                      offer={
                        offer
                      }
                      index={
                        index
                      }
                      busy={
                        actionOfferId ===
                        offer.id
                      }
                      onArchive={(
                        selected
                      ) =>
                        void updateOfferLifecycle(
                          selected,
                          "archive"
                        )
                      }
                      onRestore={(
                        selected
                      ) =>
                        void updateOfferLifecycle(
                          selected,
                          "restore"
                        )
                      }
                      onDelete={(
                        selected
                      ) =>
                        setDeleteTarget(
                          selected
                        )
                      }
                    />
                  )
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* =====================================================
            EMPTY
        ====================================================== */}

        {data &&
        activeOffers.length ===
          0 &&
        archivedOffers.length ===
          0 ? (
          <EmptyState />
        ) : null}

        {/* =====================================================
            HOW IT WORKS
        ====================================================== */}

        <section className="oi-dashboard-reveal mt-9 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
              Offer Intelligence
              workflow
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              From PDF to a
              decision you can
              explain.
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              The scanner assists
              extraction, but you
              remain in control of
              every important number
              before it reaches the
              comparison engine.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                title:
                  "Scan & review",
                description:
                  "Upload a text-based offer PDF and review every extracted compensation and equity term.",
                icon: (
                  <FileText
                    size={20}
                  />
                ),
              },

              {
                number: "02",
                title:
                  "Confirm the economics",
                description:
                  "Only confirmed or corrected values are persisted for Offer Intelligence.",
                icon: (
                  <CheckCircle2
                    size={20}
                  />
                ),
              },

              {
                number: "03",
                title:
                  "Compare the trade-off",
                description:
                  "Separate cash from equity opportunity, vesting constraints and exercise risk.",
                icon: (
                  <BarChart3
                    size={20}
                  />
                ),
              },
            ].map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    item.number
                  }
                  className="oi-dashboard-lift rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                  style={{
                    animationDelay:
                      `${
                        160 +
                        index *
                          80
                      }ms`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-violet-600">
                      {item.number}
                    </span>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                      {item.icon}
                    </div>
                  </div>

                  <h3 className="mt-5 text-lg font-black">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {
                      item.description
                    }
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* =====================================================
            PRODUCT PRINCIPLE
        ====================================================== */}

        <section className="oi-dashboard-reveal mt-6 overflow-hidden rounded-[30px] bg-slate-950 p-6 text-white md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <TrendingUp
                  className="text-violet-300"
                  size={21}
                />

                <h2 className="text-xl font-black">
                  More options do
                  not automatically
                  mean a better
                  offer.
                </h2>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Offer Intelligence
                keeps guaranteed
                compensation separate
                from equity reference
                value. Strike price,
                vesting, dilution,
                exercise windows,
                liquidity and missing
                information remain
                visible instead of
                being hidden behind a
                single CTC number.
              </p>
            </div>

            <Link
              href="/pro/offers/new"
              className="group shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
            >
              <Plus
                className="transition-transform duration-300 group-hover:rotate-90"
                size={17}
              />

              Add another offer

              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1.5"
                size={16}
              />
            </Link>
          </div>
        </section>
        {/* =====================================================
            PERMANENT DELETE CONFIRMATION
        ====================================================== */}

        {deleteTarget ? (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <button type="button" aria-label="Close delete confirmation" onClick={() => { if (!actionOfferId) setDeleteTarget(null); }} className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" />
            <div role="dialog" aria-modal="true" aria-labelledby="delete-offer-title" className="oi-dashboard-reveal relative z-10 w-full max-w-lg rounded-[30px] border border-red-100 bg-white p-6 shadow-2xl md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700"><Trash2 size={21} /></div>
                <button type="button" disabled={Boolean(actionOfferId)} onClick={() => setDeleteTarget(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"><X size={18} /></button>
              </div>
              <h2 id="delete-offer-title" className="mt-5 text-2xl font-black tracking-tight text-slate-950">Delete this offer permanently?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">You are about to permanently delete{" "}<strong>{deleteTarget.companyName ?? "this offer"}</strong>. This removes the saved Offer Intelligence record and cannot be undone.</p>
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-black text-red-900">This action cannot be reversed.</p>
                <p className="mt-1 text-xs leading-5 text-red-700">Restore the offer instead if you may need it for a future comparison.</p>
              </div>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" disabled={Boolean(actionOfferId)} onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40">Keep offer</button>
                <button type="button" disabled={Boolean(actionOfferId)} onClick={() => void deleteOfferPermanently(deleteTarget)} className="group inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
                  {actionOfferId === deleteTarget.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 className="transition-transform duration-300 group-hover:rotate-6" size={16} />}
                  Delete permanently
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

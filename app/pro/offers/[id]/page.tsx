"use client";

/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   SAVED OFFER DETAIL PAGE

   Route:
   /pro/offers/[id]

   Responsibilities:
   - load one saved Offer Intelligence record
   - show confirmed compensation
   - show confirmed equity terms
   - show modeling readiness
   - show genuine remaining limitations
   - show source-document metadata
   - start Offer B flow

   IMPORTANT:
   This page DOES NOT:
   - recalculate offer economics
   - access Prisma directly
   - expose raw scanner snapshots
   - duplicate the comparison engine

   FLOW:

   Saved Offer A
        ↓
   GET /api/pro/offers/:id
        ↓
   Confirmed offer summary
        ↓
   Compare with another offer
        ↓
   /pro/offers/new?side=B&compareWith=<Offer-A-ID>
============================================================ */

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type SavedOffer = {
  id: string;

  status:
    | "DRAFT"
    | "REVIEW_REQUIRED"
    | "CONFIRMED"
    | "ARCHIVED";

  source:
    | "PDF_UPLOAD"
    | "MANUAL";

  companyName:
    string | null;

  roleTitle:
    string | null;

  location:
    string | null;

  employmentType:
    string | null;

  workMode:
    string | null;

  joiningDate:
    string | null;

  currency:
    string;

  /* ----------------------------------------------------------
     CASH
  ---------------------------------------------------------- */

  headlineCTC:
    number | null;

  fixedSalary:
    number | null;

  basicSalary:
    number | null;

  hra:
    number | null;

  specialAllowance:
    number | null;

  otherFixedAllowance:
    number | null;

  targetVariablePay:
    number | null;

  maximumVariablePay:
    number | null;

  joiningBonus:
    number | null;

  retentionBonus:
    number | null;

  relocationBonus:
    number | null;

  performanceBonus:
    number | null;

  employerPF:
    number | null;

  gratuity:
    number | null;

  insuranceValue:
    number | null;

  otherEmployerBenefits:
    number | null;

  /* ----------------------------------------------------------
     EQUITY
  ---------------------------------------------------------- */

  equityType:
    string | null;

  companyEquityStatus:
    string | null;

  employerHeadlineEquityValue:
    number | null;

  totalOptionsOrShares:
    number | null;

  exercisePrice:
    number | null;

  currentFMV:
    number | null;

  listedSharePrice:
    number | null;

  companyValuation:
    number | null;

  totalCompanyShares:
    number | null;

  ownershipPercentage:
    number | null;

  vestingDurationMonths:
    number | null;

  cliffMonths:
    number | null;

  vestingFrequency:
    string | null;

  vestingStartDate:
    string | null;

  grantDate:
    string | null;

  expiryDate:
    string | null;

  postTerminationExerciseDays:
    number | null;

  expectedDilutionPercentage:
    number | null;

  /* ----------------------------------------------------------
     SOURCE
  ---------------------------------------------------------- */

  originalFileName:
    string | null;

  mimeType:
    string | null;

  fileSizeBytes:
    number | null;

  pageCount:
    number | null;

  /* ----------------------------------------------------------
     SNAPSHOTS
  ---------------------------------------------------------- */

  normalizedSnapshot:
    unknown;

  validationSnapshot:
    unknown;

  /* ----------------------------------------------------------
     TIMESTAMPS
  ---------------------------------------------------------- */

  confirmedAt:
    string | null;

  archivedAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
};

type OfferSummary = {
  companyName:
    string | null;

  roleTitle:
    string | null;

  headlineCTC:
    number | null;

  fixedSalary:
    number | null;

  targetVariablePay:
    number | null;

  joiningBonus:
    number | null;

  equityType:
    string | null;

  totalOptionsOrShares:
    number | null;

  hasEquity:
    boolean;

  equityUnknown:
    boolean;

  equityModelReady:
    boolean;

  cashComparisonReady:
    boolean;

  overallDecisionReady:
    boolean;

  confirmed:
    boolean;

  readyForComparison:
    boolean;
};

type OfferActions = {
  canCompare:
    boolean;

  compareLabel:
    string;

  compareHref:
    string;
};

type SavedOfferSuccessResponse = {
  success: true;

  offer:
    SavedOffer;

  summary:
    OfferSummary;

  actions:
    OfferActions;
};

type SavedOfferErrorResponse = {
  success: false;

  message:
    string;

  code?:
    string;
};

type SavedOfferApiResponse =
  | SavedOfferSuccessResponse
  | SavedOfferErrorResponse;

/* ============================================================
   VALIDATION SNAPSHOT TYPES

   validationSnapshot is stored as Prisma JSON, so we inspect it
   defensively rather than trusting a client-side cast.
============================================================ */

type ValidationIssue = {
  code?: string;

  severity?:
    | "BLOCKING"
    | "WARNING"
    | "INFO";

  field?:
    string;

  title?:
    string;

  message?:
    string;
};

type ValidationSnapshot = {
  blockingIssues:
    ValidationIssue[];

  warnings:
    ValidationIssue[];

  informationalIssues:
    ValidationIssue[];

  normalizationWarnings:
    string[];
};

/* ============================================================
   FORMATTERS
============================================================ */

function formatMoney(
  value:
    number | null,
  currency =
    "INR"
): string {
  if (
    value === null ||
    !Number.isFinite(
      value
    )
  ) {
    return "Not provided";
  }

  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style:
          "currency",

        currency:
          currency ||
          "INR",

        maximumFractionDigits:
          0,
      }
    ).format(
      value
    );
  } catch {
    return new Intl.NumberFormat(
      "en-IN",
      {
        maximumFractionDigits:
          0,
      }
    ).format(
      value
    );
  }
}

function formatCompactMoney(
  value:
    number | null,
  currency =
    "INR"
): string {
  if (
    value === null ||
    !Number.isFinite(
      value
    )
  ) {
    return "—";
  }

  if (
    currency ===
      "INR" &&
    Math.abs(
      value
    ) >=
      100_000
  ) {
    const lakhs =
      value /
      100_000;

    const formatted =
      lakhs >= 100
        ? `${(
            lakhs /
            100
          ).toFixed(
            lakhs %
                100 ===
              0
              ? 0
              : 1
          )} Cr`
        : `${lakhs.toFixed(
            Number.isInteger(
              lakhs
            )
              ? 0
              : 1
          )}L`;

    return `₹${formatted}`;
  }

  return formatMoney(
    value,
    currency
  );
}

function formatNumber(
  value:
    number | null
): string {
  if (
    value === null ||
    !Number.isFinite(
      value
    )
  ) {
    return "Not provided";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits:
        2,
    }
  ).format(
    value
  );
}

function humanize(
  value:
    string | null
): string {
  if (!value) {
    return "Not provided";
  }

  return value
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function formatDate(
  value:
    string | null
): string {
  if (!value) {
    return "Not provided";
  }

  const date =
    new Date(
      value
    );

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
      timeZone:
        "UTC",

      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(
    date
  );
}

function formatFileSize(
  bytes:
    number | null
): string {
  if (
    bytes === null ||
    bytes < 0
  ) {
    return "Not available";
  }

  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 *
      1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(
      1
    )} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(
    1
  )} MB`;
}

/* ============================================================
   VALIDATION SNAPSHOT PARSER
============================================================ */

function readIssueArray(
  value:
    unknown
): ValidationIssue[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value.filter(
    (
      item
    ): item is ValidationIssue =>
      Boolean(
        item &&
          typeof item ===
            "object"
      )
  );
}

function readStringArray(
  value:
    unknown
): string[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value.filter(
    (
      item
    ): item is string =>
      typeof item ===
      "string"
  );
}

function parseValidationSnapshot(
  value:
    unknown
): ValidationSnapshot {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return {
      blockingIssues:
        [],

      warnings:
        [],

      informationalIssues:
        [],

      normalizationWarnings:
        [],
    };
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return {
    blockingIssues:
      readIssueArray(
        record.blockingIssues
      ),

    warnings:
      readIssueArray(
        record.warnings
      ),

    informationalIssues:
      readIssueArray(
        record.informationalIssues
      ),

    normalizationWarnings:
      readStringArray(
        record.normalizationWarnings
      ),
  };
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  detail,
  icon,
  emphasized = false,
}: {
  label:
    string;

  value:
    string;

  detail?:
    string;

  icon:
    React.ReactNode;

  emphasized?:
    boolean;
}) {
  return (
    <div
      className={[
        "rounded-[24px] border p-5 shadow-sm",
        emphasized
          ? "border-violet-200 bg-violet-50"
          : "border-slate-200 bg-white",
      ].join(
        " "
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={[
              "text-[11px] font-black uppercase tracking-[0.14em]",
              emphasized
                ? "text-violet-600"
                : "text-slate-400",
            ].join(
              " "
            )}
          >
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          {detail ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {detail}
            </p>
          ) : null}
        </div>

        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            emphasized
              ? "bg-violet-100 text-violet-700"
              : "bg-slate-100 text-slate-600",
          ].join(
            " "
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({
  label,
  value,
  important = false,
}: {
  label:
    string;

  value:
    string;

  important?:
    boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <p className="text-sm font-bold text-slate-500">
        {label}
      </p>

      <p
        className={[
          "text-sm text-slate-950 sm:text-right",
          important
            ? "font-black"
            : "font-bold",
        ].join(
          " "
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   ISSUE CARD
============================================================ */

function IssueCard({
  issue,
}: {
  issue:
    ValidationIssue;
}) {
  const severity =
    issue.severity ??
    "INFO";

  const styles =
    severity ===
    "BLOCKING"
      ? {
          wrapper:
            "border-red-200 bg-red-50",

          badge:
            "bg-red-100 text-red-700",

          title:
            "text-red-950",

          body:
            "text-red-800",
        }
      : severity ===
        "WARNING"
      ? {
          wrapper:
            "border-amber-200 bg-amber-50",

          badge:
            "bg-amber-100 text-amber-700",

          title:
            "text-amber-950",

          body:
            "text-amber-800",
        }
      : {
          wrapper:
            "border-blue-200 bg-blue-50",

          badge:
            "bg-blue-100 text-blue-700",

          title:
            "text-blue-950",

          body:
            "text-blue-800",
        };

  return (
    <div
      className={`rounded-2xl border p-4 ${styles.wrapper}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${styles.badge}`}
        >
          {severity}
        </span>

        <p
          className={`text-sm font-black ${styles.title}`}
        >
          {issue.title ??
            "Offer note"}
        </p>
      </div>

      {issue.message ? (
        <p
          className={`mt-2 text-sm leading-6 ${styles.body}`}
        >
          {issue.message}
        </p>
      ) : null}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function SavedOfferPage({
  params,
}: {
  params:
    Promise<{
      id: string;
    }>;
}) {
  const [
    offerId,
    setOfferId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    data,
    setData,
  ] =
    useState<
      SavedOfferSuccessResponse | null
    >(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );

  /* ==========================================================
     RESOLVE ROUTE PARAM
  ========================================================== */

  useEffect(() => {
    let active =
      true;

    async function resolveParams() {
      try {
        const resolved =
          await params;

        if (
          active
        ) {
          setOfferId(
            resolved.id
          );
        }
      } catch {
        if (
          active
        ) {
          setError(
            "The offer ID could not be resolved."
          );

          setLoading(
            false
          );
        }
      }
    }

    resolveParams();

    return () => {
      active =
        false;
    };
  }, [params]);

  /* ==========================================================
     LOAD OFFER
  ========================================================== */

  useEffect(() => {
    if (
      !offerId
    ) {
      return;
    }

    // Capture the narrowed string before entering the nested async
    // function. This prevents TypeScript from treating offerId as
    // string | null inside loadOffer().
    const resolvedOfferId = offerId;

    let active =
      true;

    async function loadOffer() {
      setLoading(
        true
      );

      setError(
        null
      );

      try {
        const request =
          await fetch(
            `/api/pro/offers/${encodeURIComponent(
              resolvedOfferId
            )}`,
            {
              method:
                "GET",

              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const result =
          (await request.json()) as
            SavedOfferApiResponse;

        if (
          !request.ok ||
          !result.success
        ) {
          const message =
            result.success
              ? "Unable to load the saved offer."
              : result.message;

          if (
            active
          ) {
            setError(
              message
            );

            setData(
              null
            );
          }

          return;
        }

        if (
          active
        ) {
          setData(
            result
          );
        }
      } catch (
        caught
      ) {
        console.error(
          "[SAVED_OFFER_PAGE]",
          caught
        );

        if (
          active
        ) {
          setError(
            "Something went wrong while loading the saved offer."
          );
        }
      } finally {
        if (
          active
        ) {
          setLoading(
            false
          );
        }
      }
    }

    loadOffer();

    return () => {
      active =
        false;
    };
  }, [offerId]);

  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const validation =
    useMemo(
      () =>
        parseValidationSnapshot(
          data?.offer
            .validationSnapshot
        ),
      [
        data?.offer
          .validationSnapshot,
      ]
    );

  const genuineIssues =
    useMemo(
      () => [
        ...validation
          .blockingIssues,

        ...validation
          .warnings,

        ...validation
          .informationalIssues,
      ],
      [validation]
    );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    loading
  ) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Loader2
                className="animate-spin"
                size={27}
              />
            </div>

            <p className="mt-5 text-lg font-black text-slate-950">
              Loading your
              offer…
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Retrieving the
              confirmed Offer
              Intelligence record.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    error ||
    !data
  ) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <CircleAlert
                size={24}
              />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950">
              We couldn&apos;t
              load this offer.
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {error ??
                "The saved offer is unavailable."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white"
              >
                <RefreshCw
                  size={16}
                />

                Try again
              </button>

              <Link
                href="/pro/offers"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600"
              >
                <ArrowLeft
                  size={16}
                />

                Offer Intelligence
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const {
    offer,
    summary,
    actions,
  } =
    data;

  const hasEquity =
    summary.hasEquity;

  const equityUnknown =
    summary.equityUnknown;

  /* ==========================================================
     SUCCESS
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">

        {/* =====================================================
            TOP NAVIGATION
        ====================================================== */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/pro/offers"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft
              size={17}
            />

            Offer Intelligence
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
            <ShieldCheck
              size={15}
            />

            Confirmed offer
          </div>
        </div>

        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-xl shadow-slate-950/10">
          <div className="relative p-7 md:p-10 lg:p-12">
            <div className="pointer-events-none absolute right-[-70px] top-[-100px] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="pointer-events-none absolute bottom-[-120px] left-[20%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-4xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                    <CheckCircle2
                      size={14}
                    />

                    Confirmed Offer
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">
                    {offer.companyName ??
                      "Saved offer"}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-slate-300">
                    {offer.roleTitle ? (
                      <span className="inline-flex items-center gap-2">
                        <BriefcaseBusiness
                          size={16}
                        />

                        {
                          offer.roleTitle
                        }
                      </span>
                    ) : null}

                    {offer.location ? (
                      <span className="inline-flex items-center gap-2">
                        <MapPin
                          size={16}
                        />

                        {
                          offer.location
                        }
                      </span>
                    ) : null}

                    {offer.workMode ? (
                      <span className="inline-flex items-center gap-2">
                        <Building2
                          size={16}
                        />

                        {humanize(
                          offer.workMode
                        )}
                      </span>
                    ) : null}

                    {offer.joiningDate ? (
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays
                          size={16}
                        />

                        {formatDate(
                          offer.joiningDate
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Offer ID
                  </p>

                  <p className="mt-2 max-w-[230px] break-all font-mono text-xs font-bold text-slate-200">
                    {offer.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            TOP STATS
        ====================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Headline CTC"
            value={formatCompactMoney(
              offer.headlineCTC,
              offer.currency
            )}
            detail="Employer-stated annual package"
            icon={
              <WalletCards
                size={20}
              />
            }
          />

          <StatCard
            label="Guaranteed fixed"
            value={formatCompactMoney(
              offer.fixedSalary,
              offer.currency
            )}
            detail="Annual fixed compensation"
            icon={
              <IndianRupee
                size={20}
              />
            }
            emphasized
          />

          <StatCard
            label="Target variable"
            value={formatCompactMoney(
              offer.targetVariablePay,
              offer.currency
            )}
            detail="Performance-linked compensation"
            icon={
              <TrendingUp
                size={20}
              />
            }
          />

          <StatCard
            label="Joining bonus"
            value={formatCompactMoney(
              offer.joiningBonus,
              offer.currency
            )}
            detail="One-time joining compensation"
            icon={
              <Sparkles
                size={20}
              />
            }
          />
        </section>

        {/* =====================================================
            MAIN GRID
        ====================================================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">

          {/* ===================================================
              LEFT
          ==================================================== */}

          <div className="space-y-6">

            {/* -------------------------------------------------
                CASH
            -------------------------------------------------- */}

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                  Compensation
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Cash package
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Confirmed cash
                  components from
                  your reviewed
                  offer.
                </p>
              </div>

              <div className="mt-5">
                <DetailRow
                  label="Headline CTC"
                  value={formatMoney(
                    offer.headlineCTC,
                    offer.currency
                  )}
                  important
                />

                <DetailRow
                  label="Annual fixed compensation"
                  value={formatMoney(
                    offer.fixedSalary,
                    offer.currency
                  )}
                  important
                />

                <DetailRow
                  label="Basic salary"
                  value={formatMoney(
                    offer.basicSalary,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="HRA"
                  value={formatMoney(
                    offer.hra,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="Special allowance"
                  value={formatMoney(
                    offer.specialAllowance,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="Other fixed allowance"
                  value={formatMoney(
                    offer.otherFixedAllowance,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="Target variable pay"
                  value={formatMoney(
                    offer.targetVariablePay,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="Maximum variable pay"
                  value={formatMoney(
                    offer.maximumVariablePay,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="Joining bonus"
                  value={formatMoney(
                    offer.joiningBonus,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="Retention bonus"
                  value={formatMoney(
                    offer.retentionBonus,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="Relocation benefit"
                  value={formatMoney(
                    offer.relocationBonus,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="Performance bonus"
                  value={formatMoney(
                    offer.performanceBonus,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="Employer PF"
                  value={formatMoney(
                    offer.employerPF,
                    offer.currency
                  )}
                />

                <DetailRow
                  label="Gratuity"
                  value={formatMoney(
                    offer.gratuity,
                    offer.currency
                  )}
                />
              </div>
            </section>

            {/* -------------------------------------------------
                EQUITY
            -------------------------------------------------- */}

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                    Equity
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {equityUnknown
                      ? "Equity not established"
                      : hasEquity
                      ? `${humanize(
                          offer.equityType
                        )} grant`
                      : "No equity component"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Equity remains
                    separate from
                    guaranteed cash
                    compensation.
                  </p>
                </div>

                <div
                  className={[
                    "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black",
                    summary
                      .equityModelReady
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
                  ].join(
                    " "
                  )}
                >
                  {summary
                    .equityModelReady ? (
                    <CheckCircle2
                      size={14}
                    />
                  ) : (
                    <CircleAlert
                      size={14}
                    />
                  )}

                  {summary
                    .equityUnknown
                    ? "Equity unknown"
                    : summary
                    .equityModelReady
                    ? "Model ready"
                    : "Needs more information"}
                </div>
              </div>

              {equityUnknown ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex gap-3">
                    <CircleAlert
                      className="mt-0.5 shrink-0 text-amber-700"
                      size={18}
                    />

                    <div>
                      <p className="font-black text-amber-950">
                        Equity is not stated clearly
                      </p>

                      <p className="mt-1 text-sm leading-6 text-amber-900/80">
                        This offer can still be compared on confirmed cash. A full offer verdict remains withheld until you confirm whether equity is included and, if it is, the material grant terms.
                      </p>
                    </div>
                  </div>
                </div>
              ) : hasEquity ? (
                <div className="mt-5">
                  <DetailRow
                    label="Equity type"
                    value={humanize(
                      offer.equityType
                    )}
                    important
                  />

                  <DetailRow
                    label="Company status"
                    value={humanize(
                      offer.companyEquityStatus
                    )}
                  />

                  <DetailRow
                    label="Options / shares"
                    value={formatNumber(
                      offer.totalOptionsOrShares
                    )}
                    important
                  />

                  <DetailRow
                    label="Exercise / strike price"
                    value={formatMoney(
                      offer.exercisePrice,
                      offer.currency
                    )}
                  />

                  <DetailRow
                    label="Current FMV"
                    value={formatMoney(
                      offer.currentFMV,
                      offer.currency
                    )}
                  />

                  <DetailRow
                    label="Listed share price"
                    value={formatMoney(
                      offer.listedSharePrice,
                      offer.currency
                    )}
                  />

                  <DetailRow
                    label="Employer-stated equity value"
                    value={formatMoney(
                      offer.employerHeadlineEquityValue,
                      offer.currency
                    )}
                  />

                  <DetailRow
                    label="Vesting duration"
                    value={
                      offer.vestingDurationMonths !==
                      null
                        ? `${offer.vestingDurationMonths} months`
                        : "Not provided"
                    }
                  />

                  <DetailRow
                    label="Cliff"
                    value={
                      offer.cliffMonths !==
                      null
                        ? `${offer.cliffMonths} months`
                        : "Not provided"
                    }
                  />

                  <DetailRow
                    label="Vesting frequency"
                    value={humanize(
                      offer.vestingFrequency
                    )}
                  />

                  <DetailRow
                    label="Post-termination exercise window"
                    value={
                      offer.postTerminationExerciseDays !==
                      null
                        ? `${offer.postTerminationExerciseDays} days`
                        : "Not provided"
                    }
                  />

                  <DetailRow
                    label="Expected dilution"
                    value={
                      offer.expectedDilutionPercentage !==
                      null
                        ? `${offer.expectedDilutionPercentage}%`
                        : "Not provided"
                    }
                  />
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex gap-3">
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-emerald-600"
                      size={18}
                    />

                    <div>
                      <p className="font-black text-slate-950">
                        Cash-only
                        offer
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        This offer
                        was confirmed
                        without an
                        equity
                        component.
                        Missing ESOP
                        or RSU terms
                        therefore do
                        not block
                        comparison.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* -------------------------------------------------
                VALIDATION / LIMITATIONS
            -------------------------------------------------- */}

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                  Decision quality
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  What still needs
                  context?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Confirming an
                  offer does not
                  mean we pretend
                  every unknown is
                  known. Genuine
                  limitations remain
                  visible.
                </p>
              </div>

              {genuineIssues.length >
              0 ? (
                <div className="mt-6 space-y-3">
                  {genuineIssues.map(
                    (
                      issue,
                      index
                    ) => (
                      <IssueCard
                        key={`${issue.code ?? "issue"}-${index}`}
                        issue={
                          issue
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <CheckCircle2
                    className="mt-0.5 shrink-0 text-emerald-700"
                    size={19}
                  />

                  <div>
                    <p className="font-black text-emerald-950">
                      No unresolved
                      validation
                      issues
                    </p>

                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      The confirmed
                      information is
                      sufficient for
                      the current
                      comparison
                      model.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ===================================================
              RIGHT SIDEBAR
          ==================================================== */}

          <aside className="space-y-6">

            {/* -------------------------------------------------
                READINESS
            -------------------------------------------------- */}

            <section
              className={[
                "rounded-[28px] border p-6",
                summary
                  .readyForComparison
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50",
              ].join(
                " "
              )}
            >
              <div
                className={[
                  "flex h-12 w-12 items-center justify-center rounded-2xl",
                  summary
                    .readyForComparison
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700",
                ].join(
                  " "
                )}
              >
                {summary
                  .readyForComparison ? (
                  <Scale
                    size={23}
                  />
                ) : (
                  <CircleAlert
                    size={23}
                  />
                )}
              </div>

              <p
                className={[
                  "mt-5 text-xs font-black uppercase tracking-[0.16em]",
                  summary
                    .readyForComparison
                    ? "text-emerald-700"
                    : "text-amber-700",
                ].join(
                  " "
                )}
              >
                Comparison readiness
              </p>

              <h3
                className={[
                  "mt-2 text-xl font-black",
                  summary
                    .readyForComparison
                    ? "text-emerald-950"
                    : "text-amber-950",
                ].join(
                  " "
                )}
              >
                {summary
                  .cashComparisonReady
                  ? summary.overallDecisionReady
                    ? "Ready for full comparison"
                    : "Cash comparison ready"
                  : "Needs attention"}
              </h3>

              <p
                className={[
                  "mt-2 text-sm leading-6",
                  summary
                    .readyForComparison
                    ? "text-emerald-900/80"
                    : "text-amber-900/80",
                ].join(
                  " "
                )}
              >
                {summary
                  .cashComparisonReady
                  ? summary.overallDecisionReady
                    ? "This confirmed offer has the material terms needed for the full Offer Intelligence comparison."
                    : "Compare confirmed cash now. The comparison will clearly withhold an overall winner until the material equity terms are clarified."
                  : "Confirm the company, role and annual fixed compensation before comparing this offer."}
              </p>

              {actions.canCompare ? (
                <Link
                  href={
                    actions.compareHref
                  }
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Compare with
                  another offer

                  <ArrowRight
                    size={17}
                  />
                </Link>
              ) : null}
            </section>

            {/* -------------------------------------------------
                CONFIRMED CHECKLIST
            -------------------------------------------------- */}

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Confirmed
              </p>

              <div className="mt-5 space-y-4">
                {[
                  {
                    label:
                      "Offer identity",

                    pass:
                      Boolean(
                        offer.companyName &&
                          offer.roleTitle
                      ),
                  },

                  {
                    label:
                      "Fixed compensation",

                    pass:
                      offer.fixedSalary !==
                      null,
                  },

                  {
                    label:
                      "Equity classification",

                    pass:
                      !summary
                        .equityUnknown,
                  },

                  {
                    label:
                      "Full decision basis",

                    pass:
                      summary
                        .equityModelReady,
                  },

                  {
                    label:
                      "Database confirmation",

                    pass:
                      offer.status ===
                      "CONFIRMED",
                  },
                ].map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.label
                      }
                      className="flex items-center gap-3"
                    >
                      <div
                        className={[
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          item.pass
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-400",
                        ].join(
                          " "
                        )}
                      >
                        {item.pass ? (
                          <Check
                            size={14}
                          />
                        ) : (
                          <Clock3
                            size={14}
                          />
                        )}
                      </div>

                      <p className="text-sm font-bold text-slate-700">
                        {
                          item.label
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* -------------------------------------------------
                SOURCE DOCUMENT
            -------------------------------------------------- */}

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <FileCheck2
                  size={21}
                />
              </div>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Source
              </p>

              <h3 className="mt-2 break-all font-black text-slate-950">
                {offer.originalFileName ??
                  (offer.source ===
                  "MANUAL"
                    ? "Manual entry"
                    : "Offer document")}
              </h3>

              <div className="mt-4 space-y-2 text-xs text-slate-500">
                {offer.fileSizeBytes !==
                null ? (
                  <p>
                    File size:{" "}
                    <span className="font-bold text-slate-700">
                      {formatFileSize(
                        offer.fileSizeBytes
                      )}
                    </span>
                  </p>
                ) : null}

                {offer.pageCount !==
                null ? (
                  <p>
                    Pages:{" "}
                    <span className="font-bold text-slate-700">
                      {
                        offer.pageCount
                      }
                    </span>
                  </p>
                ) : null}

                <p>
                  Source:{" "}
                  <span className="font-bold text-slate-700">
                    {humanize(
                      offer.source
                    )}
                  </span>
                </p>

                <p>
                  Confirmed:{" "}
                  <span className="font-bold text-slate-700">
                    {formatDate(
                      offer.confirmedAt
                    )}
                  </span>
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex gap-2">
                  <ShieldCheck
                    className="mt-0.5 shrink-0 text-emerald-700"
                    size={15}
                  />

                  <p className="text-xs leading-5 text-emerald-800">
                    The original
                    PDF is not
                    stored in Offer
                    Intelligence V1.
                  </p>
                </div>
              </div>
            </section>

            {/* -------------------------------------------------
                OFFER METADATA
            -------------------------------------------------- */}

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Employment
              </p>

              <div className="mt-3">
                <DetailRow
                  label="Employment type"
                  value={humanize(
                    offer.employmentType
                  )}
                />

                <DetailRow
                  label="Work mode"
                  value={humanize(
                    offer.workMode
                  )}
                />

                <DetailRow
                  label="Joining date"
                  value={formatDate(
                    offer.joiningDate
                  )}
                />

                <DetailRow
                  label="Currency"
                  value={
                    offer.currency
                  }
                />
              </div>
            </section>
          </aside>
        </div>

        {/* =====================================================
            BOTTOM CTA
        ====================================================== */}

        <section className="mt-6 overflow-hidden rounded-[30px] bg-slate-950 text-white">
          <div className="relative p-7 md:p-9">
            <div className="pointer-events-none absolute right-[-50px] top-[-80px] h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  Phase 4 • Next
                </p>

                <h2 className="mt-2 text-2xl font-black md:text-3xl">
                  Is another offer
                  actually better?
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Add Offer B and
                  compare guaranteed
                  cash, equity
                  economics,
                  vesting, exercise
                  burden and
                  long-term value
                  side by side.
                </p>
              </div>

              {actions.canCompare ? (
                <Link
                  href={
                    actions.compareHref
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-black text-white transition hover:bg-violet-700"
                >
                  <Scale
                    size={18}
                  />

                  Compare with
                  another offer

                  <ArrowRight
                    size={17}
                  />
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-200">
                  <CircleAlert
                    size={17}
                  />

                  Comparison not
                  ready
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            FOOTNOTE
        ====================================================== */}

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <FileText
            className="mt-0.5 shrink-0 text-slate-400"
            size={17}
          />

          <p className="text-xs leading-5 text-slate-500">
            Offer Intelligence is
            a decision-support
            tool. Values shown here
            are based on the
            information you
            reviewed and confirmed.
            Equity outcomes can
            remain uncertain and
            should not be treated
            as guaranteed cash
            compensation.
          </p>
        </div>
      </div>
    </main>
  );
}

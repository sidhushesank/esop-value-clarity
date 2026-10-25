"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Layers3,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getActiveGrantId,
  switchActiveGrant,
} from "@/lib/esop/pro-state";

type FieldStatus =
  | "VERIFIED"
  | "REVIEW"
  | "NOT_FOUND"
  | "USER_CONFIRMED";

type Clause = {
  id: string;
  type: string;
  importance:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
  title: string;
  summary: string | null;
  extractedText: string | null;
  fieldStatus: FieldStatus;
  sourcePage: number | null;
};

type GrantField = {
  id: string;
  fieldKey: string;
  label: string;
  extractedValue: unknown;
  confirmedValue: unknown;
  status: FieldStatus;
  sourceText: string | null;
  sourcePage: number | null;
  reviewedAt: string | null;
};

type JourneySummary = {
  updatedAt: string;
  vestedOptions: number | null;
  vestedPercentage: number | null;
  exercisePlanOptions: number | null;
};

type Grant = {
  id: string;
  status:
    | "DRAFT"
    | "REVIEW_REQUIRED"
    | "CONFIRMED"
    | "ARCHIVED";

  companyName: string | null;
  grantName: string | null;
  grantDate: string | null;
  optionCount: number | null;

  strikePrice: number | null;
  currency: string | null;

  vestingStartDate: string | null;
  vestingDurationMonths: number | null;
  cliffMonths: number | null;
  vestingFrequency: string | null;

  expiryDate: string | null;
  postTerminationExerciseDays: number | null;

  notes: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;

  document: {
    id: string;
    originalFileName: string | null;
    status: string;
    confirmedAt: string | null;
    clauses: Clause[];
  } | null;

  fields: GrantField[];

  journey: JourneySummary | null;
};

type EquityResponse = {
  success: boolean;

  summary?: {
    confirmedGrantCount: number;
    totalOptions: number;
    totalExerciseCost: number;
    clauseCount: number;
    expiringWithin365Days: number;
  };

  grants?: Grant[];

  code?: string;
  message?: string;
};

export default function EquityProfilePage() {
  const router = useRouter();

  const [activeGrantId, setActiveGrantId] =
    useState<string | null>(null);

  const [openingGrantId, setOpeningGrantId] =
    useState<string | null>(null);

  const [grants, setGrants] =
    useState<Grant[]>([]);

  const [summary, setSummary] =
    useState<EquityResponse["summary"]>();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadProfile =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/pro/equity",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as EquityResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "We could not load your equity profile."
          );
        }

        setGrants(data.grants ?? []);
        setSummary(data.summary);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "We could not load your equity profile."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setActiveGrantId(getActiveGrantId());
  }, [grants]);

  const openJourney = useCallback(
    async (grantId: string) => {
      setOpeningGrantId(grantId);

      try {
        // Saves the grant being left, then loads this grant's own
        // saved journey before any analysis page opens.
        await switchActiveGrant(grantId);
        setActiveGrantId(grantId);
        router.push("/pro/vesting");
      } finally {
        setOpeningGrantId(null);
      }
    },
    [router]
  );

  const latestGrant =
    useMemo(
      () => grants[0] ?? null,
      [grants]
    );

  if (loading) {
    return <EquityLoadingState />;
  }

  if (error) {
    return (
      <EquityErrorState
        message={error}
        onRetry={loadProfile}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faff] text-slate-950">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <section className="relative overflow-hidden rounded-[36px] border border-blue-100 bg-white shadow-[0_28px_90px_rgba(37,99,235,0.10)]">
          <div className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-blue-100/80 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-48 left-[28%] h-[430px] w-[430px] rounded-full bg-cyan-100/70 blur-3xl" />

          <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-12 lg:p-8">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                  <WalletCards size={13} />
                  Equity profile
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 size={13} />
                  Confirmed source of truth
                </span>
              </div>

              <p className="mt-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Your confirmed equity
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[4rem] lg:leading-[0.98]">
                Your grants,
                <span className="mt-2 block bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                  in one trusted profile.
                </span>
              </h1>

              <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                Confirmed grant terms live here as the
                source of truth for future vesting,
                exercise, tax, dilution and exit analysis.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/pro/grants/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Add another grant
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/pro/simulator"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  Run scenario
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-[0_18px_50px_rgba(37,99,235,0.07)] backdrop-blur sm:p-6">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">
                  Portfolio snapshot
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Confirmed grants"
                    value={String(
                      summary?.confirmedGrantCount ?? 0
                    )}
                  />

                  <MetricCard
                    label="Total options"
                    value={formatNumber(
                      summary?.totalOptions ?? 0
                    )}
                  />

                  <MetricCard
                    label="Exercise capital"
                    value={formatCurrency(
                      summary?.totalExerciseCost ?? 0,
                      latestGrant?.currency || "INR"
                    )}
                  />

                  <MetricCard
                    label="Important clauses"
                    value={String(
                      summary?.clauseCount ?? 0
                    )}
                  />
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <ShieldCheck
                    size={17}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <div>
                    <p className="text-xs font-black text-emerald-900">
                      Trusted grant data
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-emerald-800">
                      Only grants you explicitly confirmed
                      appear in this profile.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {grants.length === 0 ? (
          <EmptyEquityState />
        ) : (
          <>
            <section className="mt-12">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Grant vault
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
                    Confirmed grants
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    Each card below comes from a reviewed
                    source document. The original PDF remains
                    separate from the values you confirmed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadProfile}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <RefreshCcw size={14} />
                  Refresh profile
                </button>
              </div>

              <div className="mt-7 space-y-5">
                {grants.map((grant) => (
                  <GrantVaultCard
                    key={grant.id}
                    grant={grant}
                    isActive={
                      grant.id ===
                      (activeGrantId ??
                        latestGrant?.id)
                    }
                    opening={
                      openingGrantId ===
                      grant.id
                    }
                    onOpenJourney={() =>
                      openJourney(grant.id)
                    }
                  />
                ))}
              </div>
            </section>

            <section className="mt-12 grid gap-4 md:grid-cols-3">
              <ActionCard
                icon={<Clock3 size={18} />}
                eyebrow="VESTING"
                title="See what is vested"
                text="Use the confirmed grant terms as the starting point for your vesting analysis."
                href="/pro/vesting"
                action="Open Vesting"
              />

              <ActionCard
                icon={<Sparkles size={18} />}
                eyebrow="SCENARIOS"
                title="Model future outcomes"
                text="Take the confirmed option count and exercise price into your ESOP scenario workflow."
                href="/pro/simulator"
                action="Open Simulator"
              />

              <ActionCard
                icon={<FileText size={18} />}
                eyebrow="DECISION"
                title="Build a report"
                text="Turn the same connected model into a decision-ready summary and export."
                href="/pro/reports"
                action="Open Reports"
              />
            </section>
          </>
        )}

        <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row">
          <span>
            ESOP Value Clarity · Equity profile
          </span>

          <span>
            Confirmed grant terms remain subject to the
            underlying source agreement.
          </span>
        </footer>
      </div>
    </main>
  );
}

function GrantVaultCard({
  grant,
  isActive,
  opening,
  onOpenJourney,
}: {
  grant: Grant;
  isActive: boolean;
  opening: boolean;
  onOpenJourney: () => void;
}) {
  const clauses =
    grant.document?.clauses ?? [];

  const highPriorityClauses =
    clauses.filter(
      (clause) =>
        clause.importance === "HIGH" ||
        clause.importance === "CRITICAL"
    );

  return (
    <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className="grid gap-0 lg:grid-cols-12">
        <div className="p-5 sm:p-7 lg:col-span-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-emerald-700">
                  <CheckCircle2 size={12} />
                  Confirmed
                </span>

                {grant.grantName && (
                  <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[9px] font-black text-blue-700">
                    {grant.grantName}
                  </span>
                )}
              </div>

              <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {grant.companyName ||
                  "Confirmed ESOP grant"}
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Confirmed{" "}
                {grant.confirmedAt
                  ? formatDateTime(
                      grant.confirmedAt
                    )
                  : "date unavailable"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {grant.document && (
                <Link
                  href={`/pro/grants/${grant.document.id}/review`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <FileCheck2 size={14} />
                  View source grant
                </Link>
              )}
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <GrantMetric
              label="Options granted"
              value={
                grant.optionCount !== null
                  ? formatNumber(
                      grant.optionCount
                    )
                  : "Not available"
              }
            />

            <GrantMetric
              label="Exercise price"
              value={
                grant.strikePrice !== null
                  ? formatCurrency(
                      grant.strikePrice,
                      grant.currency || "INR"
                    )
                  : "Not available"
              }
            />

            <GrantMetric
              label="Grant date"
              value={
                grant.grantDate
                  ? formatDate(
                      grant.grantDate
                    )
                  : "Not available"
              }
            />

            <GrantMetric
              label="Expiry"
              value={
                grant.expiryDate
                  ? formatDate(
                      grant.expiryDate
                    )
                  : "Not available"
              }
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <DetailPanel
              eyebrow="VESTING"
              icon={<CalendarDays size={16} />}
              rows={[
                [
                  "Start",
                  grant.vestingStartDate
                    ? formatDate(
                        grant.vestingStartDate
                      )
                    : "Not available",
                ],
                [
                  "Duration",
                  grant.vestingDurationMonths !== null
                    ? `${grant.vestingDurationMonths} months`
                    : "Not available",
                ],
                [
                  "Cliff",
                  grant.cliffMonths !== null
                    ? `${grant.cliffMonths} months`
                    : "Not available",
                ],
                [
                  "Frequency",
                  grant.vestingFrequency
                    ? humanizeEnum(
                        grant.vestingFrequency
                      )
                    : "Not available",
                ],
              ]}
            />

            <DetailPanel
              eyebrow="EXERCISE"
              icon={<Layers3 size={16} />}
              rows={[
                [
                  "Exercise price",
                  grant.strikePrice !== null
                    ? formatCurrency(
                        grant.strikePrice,
                        grant.currency || "INR"
                      )
                    : "Not available",
                ],
                [
                  "Expiry",
                  grant.expiryDate
                    ? formatDate(
                        grant.expiryDate
                      )
                    : "Not available",
                ],
                [
                  "After termination",
                  grant.postTerminationExerciseDays !== null
                    ? `${grant.postTerminationExerciseDays} days`
                    : "Not available",
                ],
                [
                  "Currency",
                  grant.currency || "Not available",
                ],
              ]}
            />
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
                  Analysis journey
                </p>

                {isActive && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-white">
                    Working on this
                  </span>
                )}
              </div>

              {grant.journey ? (
                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  Saved{" "}
                  {formatDateTime(
                    grant.journey.updatedAt
                  )}
                  {grant.journey
                    .vestedOptions !== null &&
                    ` · ${formatNumber(
                      grant.journey
                        .vestedOptions
                    )} vested`}
                  {grant.journey
                    .exercisePlanOptions
                    ? ` · exercise plan ${formatNumber(
                        grant.journey
                          .exercisePlanOptions
                      )} options`
                    : ""}
                </p>
              ) : (
                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  No analysis saved for this grant yet.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenJourney}
              disabled={opening}
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {opening ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <ArrowRight size={14} />
              )}
              {grant.journey
                ? "Open journey"
                : "Start journey"}
            </button>
          </div>
        </div>

        <aside className="border-t border-slate-200 bg-slate-50/80 p-5 sm:p-7 lg:col-span-4 lg:border-l lg:border-t-0">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
            Source intelligence
          </p>

          <h4 className="mt-2 text-xl font-black text-slate-950">
            Terms worth watching
          </h4>

          <p className="mt-2 text-xs leading-6 text-slate-500">
            Important clauses identified in the source
            document remain linked to this confirmed grant.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetricCard
              label="All clauses"
              value={String(
                clauses.length
              )}
            />

            <MetricCard
              label="High priority"
              value={String(
                highPriorityClauses.length
              )}
            />
          </div>

          <div className="mt-5 space-y-2">
            {highPriorityClauses
              .slice(0, 4)
              .map((clause) => (
                <div
                  key={clause.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-black text-slate-900">
                      {clause.title}
                    </p>

                    <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-amber-700">
                      {humanizeEnum(
                        clause.importance
                      )}
                    </span>
                  </div>

                  {clause.summary && (
                    <p className="mt-2 text-[10px] leading-5 text-slate-600">
                      {clause.summary}
                    </p>
                  )}
                </div>
              ))}

            {highPriorityClauses.length ===
              0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-slate-700">
                  No high-priority clauses
                  were identified.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function GrantMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-base font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function DetailPanel({
  eyebrow,
  icon,
  rows,
}: {
  eyebrow: string;
  icon: React.ReactNode;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-blue-600">
        {icon}

        <p className="text-[9px] font-black uppercase tracking-[0.14em]">
          {eyebrow}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
          >
            <span className="text-[10px] font-bold text-slate-400">
              {label}
            </span>

            <span className="max-w-[60%] text-right text-[10px] font-black text-slate-800">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  eyebrow,
  title,
  text,
  href,
  action,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(37,99,235,0.08)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        {icon}
      </div>

      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-lg font-black text-slate-950">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-6 text-slate-500">
        {text}
      </p>

      <div className="mt-5 flex items-center gap-2 text-xs font-black text-blue-600">
        {action}
        <ArrowRight
          size={14}
          className="transition group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}

function EmptyEquityState() {
  return (
    <section className="mt-10 rounded-[30px] border border-dashed border-blue-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <WalletCards size={24} />
      </div>

      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
        Your grant vault is empty
      </p>

      <h2 className="mt-2 text-2xl font-black text-slate-950">
        Add your first confirmed grant.
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
        Upload an ESOP grant document, review the
        extracted terms and confirm it. Your trusted grant
        will then appear here.
      </p>

      <Link
        href="/pro/grants/new"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.20)] transition hover:bg-blue-700"
      >
        Upload grant
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function EquityLoadingState() {
  return (
    <main className="min-h-screen bg-[#f7faff]">
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:px-8">
        <div className="rounded-[34px] border border-slate-200 bg-white p-8">
          <div className="flex items-center gap-3 text-blue-600">
            <Loader2
              size={20}
              className="animate-spin"
            />

            <p className="text-sm font-black">
              Loading your equity profile…
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function EquityErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faff] px-4">
      <div className="w-full max-w-xl rounded-[28px] border border-rose-200 bg-white p-7 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <TriangleAlert size={23} />
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-950">
          We couldn’t load your equity profile.
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
        >
          <RefreshCcw size={15} />
          Try again
        </button>
      </div>
    </main>
  );
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value);
}

function formatCurrency(
  value: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

function formatDate(
  value: string
): string {
  const date = new Date(value);

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
    }
  ).format(date);
}

function formatDateTime(
  value: string
): string {
  const date = new Date(value);

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
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function humanizeEnum(
  value: string
): string {
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

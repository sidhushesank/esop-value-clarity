"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  Clock3,
  FileText,
  GitCompareArrows,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import TeamAnalyticsCharts from "@/components/team/TeamAnalyticsCharts";

type TeamMemberIntelligence = {
  member: {
    id: string;
    name: string;
    email: string;
    accountStatus: string;
    emailVerified: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    lastActiveAt: string | null;
  };

  membership: {
    membershipId: string;
    status: string;
    addedAt: string;
    workspaceId: string;
    workspaceName: string;
    workspaceExpiresAt: string;
  };

  grantSummary: {
    grantCount: number;
    confirmedGrantCount: number;
    totalOptions: number;
    totalExerciseCost: number;
    companies: string[];
    earliestGrantDate: string | null;
    latestGrantDate: string | null;
    nextExpiryDate: string | null;
    expiringWithin365Days: number;
  };

  calculationSummary: {
    calculationCount: number;
    latestCalculationAt: string | null;
    totalModeledGrantUnits: number;
    totalExitValue: number;
    highestExitValue: number;
    averageExitValue: number;
    averageReturnMultiple: number;
    averageRoiPercentage: number;
  };

  activitySummary: {
    activityCount: number;
    lastActivityAt: string | null;
    byType: Array<{
      type: string;
      count: number;
      lastOccurredAt: string | null;
    }>;
    recent: Array<{
      id: string;
      type: string;
      createdAt: string;
      metadata: unknown;
    }>;
  };

  documentSummary: {
    documentCount: number;
    confirmedDocumentCount: number;
    clauseCount: number;
    reviewDocumentCount: number;
  };

  analytics: {
    grantCountsByCompany: Array<{
      company: string;
      grants: number;
      options: number;
    }>;

    calculationExitValues: Array<{
      id: string;
      name: string;
      exitValue: number;
      returnMultiple: number;
      roiPercentage: number;
      createdAt: string;
    }>;

    activityTimeline: Array<{
      date: string;
      count: number;
    }>;

    activityByType: Array<{
      type: string;
      count: number;
    }>;

    grantExpiryTimeline: Array<{
      grantId: string;
      grantName: string;
      companyName: string;
      expiryDate: string;
      optionCount: number;
      daysRemaining: number;
    }>;
  };
};

type ApiResponse = {
  success: boolean;
  member?: TeamMemberIntelligence;
  message?: string;
};

export default function TeamMemberAnalysisPage() {
  const router = useRouter();

  const params = useParams<{
    userId: string;
  }>();

  const userId = params?.userId;

  const [member, setMember] =
    useState<TeamMemberIntelligence | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMember() {
    if (!userId) {
      setError("A Team member could not be identified.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/team/members/${encodeURIComponent(userId)}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.member
      ) {
        setError(
          data.message ??
            "We could not load this member's analysis."
        );
        return;
      }

      setMember(data.member);
    } catch {
      setError(
        "We could not connect to the member intelligence service."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMember();
  }, [userId]);

  if (loading) {
    return <LoadingState />;
  }

  if (!member) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] px-5 py-8 md:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to Team Workspace
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-black text-slate-950">
              Analysis unavailable
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "The selected member could not be loaded."}
            </p>

            <button
              type="button"
              onClick={() => void loadMember()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8fc] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute right-[-100px] top-[16%] h-96 w-96 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-5 py-6 md:px-8 md:py-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/team")}
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Team Workspace
            </button>

            <span className="text-slate-300">
              /
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">
                Member Analysis
              </p>

              <p className="truncate text-xs font-semibold text-slate-400">
                {member.member.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadMember()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/team/members/${encodeURIComponent(
                    member.member.id
                  )}/preview`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
            >
              <FileText size={14} />
              Preview
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/team/members/${encodeURIComponent(
                    member.member.id
                  )}/compare`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
            >
              <GitCompareArrows size={14} />
              Compare
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="mt-7 overflow-hidden rounded-[34px] border border-slate-800 bg-[#050816] text-white shadow-[0_30px_110px_rgba(15,23,42,0.20)]"
        >
          <div className="relative overflow-hidden px-6 py-9 md:px-8 lg:px-10 lg:py-11">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />

            <div className="pointer-events-none absolute bottom-[-140px] left-[38%] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-200">
                    <Sparkles size={12} />
                    Equity Intelligence
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    <ShieldCheck size={12} />
                    Live persisted data
                  </span>
                </div>

                <h1 className="mt-6 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                  {member.member.name}
                </h1>

                <p className="mt-3 text-sm font-medium text-slate-400">
                  {member.member.email}
                </p>

                <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-300">
                  Professional analytics built from this member's
                  actual EVC records: grants, documents, saved
                  calculations and recorded product activity.
                </p>
              </div>

              <div className="min-w-[250px] rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Data coverage
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <DarkMetric
                    label="Grants"
                    value={String(
                      member.grantSummary.confirmedGrantCount
                    )}
                  />

                  <DarkMetric
                    label="Calculations"
                    value={String(
                      member.calculationSummary.calculationCount
                    )}
                  />

                  <DarkMetric
                    label="Activities"
                    value={String(
                      member.activitySummary.activityCount
                    )}
                  />

                  <DarkMetric
                    label="Documents"
                    value={String(
                      member.documentSummary.documentCount
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AnalysisKpi
            icon={<Layers3 size={17} />}
            label="Options"
            value={formatNumber(
              member.grantSummary.totalOptions
            )}
            caption="Confirmed grant quantity"
          />

          <AnalysisKpi
            icon={<Wallet size={17} />}
            label="Exercise exposure"
            value={formatCurrency(
              member.grantSummary.totalExerciseCost
            )}
            caption="Persisted grant economics"
          />

          <AnalysisKpi
            icon={<TrendingUp size={17} />}
            label="Highest saved exit"
            value={formatCurrency(
              member.calculationSummary.highestExitValue
            )}
            caption="Saved calculation result"
          />

          <AnalysisKpi
            icon={<BarChart3 size={17} />}
            label="Average ROI"
            value={formatPercentage(
              member.calculationSummary.averageRoiPercentage
            )}
            caption="Across saved calculations"
          />
        </section>

        <TeamAnalyticsCharts member={member} />

        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          <InsightCard
            icon={<CalendarClock size={18} />}
            label="Expiry attention"
            title={
              member.grantSummary.expiringWithin365Days > 0
                ? `${member.grantSummary.expiringWithin365Days} grant(s) within 365 days`
                : "No upcoming grant expiry"
            }
            text={
              member.grantSummary.nextExpiryDate
                ? `Next expiry: ${formatDate(
                    member.grantSummary.nextExpiryDate
                  )}.`
                : "No persisted upcoming expiry date is available."
            }
          />

          <InsightCard
            icon={<ShieldCheck size={18} />}
            label="Document coverage"
            title={`${member.documentSummary.confirmedDocumentCount} confirmed document(s)`}
            text={`${member.documentSummary.clauseCount} persisted clauses are currently available from the member's documents.`}
          />

          <InsightCard
            icon={<Clock3 size={18} />}
            label="Recent activity"
            title={
              member.activitySummary.lastActivityAt
                ? formatRelative(
                    member.activitySummary.lastActivityAt
                  )
                : "No recent activity"
            }
            text={`${member.activitySummary.activityCount} activity records are available to the Team Intelligence layer.`}
          />
        </section>

        <footer className="mt-5 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm md:px-7">
          <div className="flex flex-col gap-3 text-xs font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              EVC Team Intelligence · Member Analysis
            </span>

            <span>
              Workspace: {member.membership.workspaceName}
            </span>

            <span>
              Expires:{" "}
              {formatDate(
                member.membership.workspaceExpiresAt
              )}
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function DarkMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function AnalysisKpi({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 text-slate-500">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </span>

        <span className="text-[9px] font-black uppercase tracking-[0.13em]">
          {label}
        </span>
      </div>

      <p className="mt-3 truncate text-xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">
        {caption}
      </p>
    </motion.div>
  );
}

function InsightCard({
  icon,
  label,
  title,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-blue-600">
        {icon}

        <p className="text-[9px] font-black uppercase tracking-[0.15em]">
          {label}
        </p>
      </div>

      <h3 className="mt-4 text-lg font-black tracking-tight text-slate-950">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-[#f5f8fc] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-[1600px] animate-pulse">
        <div className="h-5 w-56 rounded bg-slate-200" />

        <div className="mt-7 h-64 rounded-[34px] bg-slate-200" />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-2xl bg-slate-200"
            />
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="h-96 rounded-3xl bg-slate-200" />
          <div className="h-96 rounded-3xl bg-slate-200" />
        </div>
      </div>
    </main>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No recent activity";
  }

  const difference =
    Date.now() - date.getTime();

  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24)
  );

  if (days <= 0) {
    return "Activity today";
  }

  if (days === 1) {
    return "Activity yesterday";
  }

  return `Activity ${days} days ago`;
}

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "EV";
}
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";

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
  code?: string;
  message?: string;
};

export default function TeamMemberPreviewPage() {
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
    if (!userId) return;

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
            "We could not load this member's EVC intelligence."
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

  const activityHeadline = useMemo(() => {
    if (!member) return "No activity data";

    if (
      member.activitySummary.lastActivityAt
    ) {
      return `Last activity ${formatRelativeDate(
        member.activitySummary.lastActivityAt
      )}`;
    }

    return "No activity recorded";
  }, [member]);

  if (loading) {
    return <PreviewLoading />;
  }

  if (!member) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] px-5 py-8 text-slate-950 md:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to Team Workspace
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 text-red-600" />

              <div>
                <h1 className="text-xl font-black text-slate-950">
                  Member intelligence unavailable
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {error ||
                    "The selected member could not be loaded."}
                </p>

                <button
                  type="button"
                  onClick={() => void loadMember()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
                >
                  <RefreshCw size={15} />
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8fc] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute right-[-120px] top-[18%] h-96 w-96 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1560px] px-5 py-6 md:px-8 md:py-8">
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
                Member Preview
              </p>

              <p className="truncate text-xs font-semibold text-slate-400">
                {member.member.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
                  )}/analysis`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <BarChart3 size={14} />
              Open Analysis
            </button>
          </div>
        </header>

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
          className="mt-7 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_28px_100px_rgba(15,23,42,0.09)]"
        >
          <div className="relative overflow-hidden bg-[#050816] px-6 py-9 text-white md:px-8 lg:px-10 lg:py-11">
            <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />

            <div className="pointer-events-none absolute bottom-[-130px] left-[35%] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-200">
                    <Sparkles size={12} />
                    Team Member Intelligence
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    <ShieldCheck size={12} />
                    Team-sponsored PRO
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white text-lg font-black text-slate-950 shadow-xl">
                    {getInitials(
                      member.member.name
                    )}
                  </div>

                  <div className="min-w-0">
                    <h1 className="truncate text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                      {member.member.name}
                    </h1>

                    <p className="mt-2 truncate text-sm font-medium text-slate-400">
                      {member.member.email}
                    </p>
                  </div>
                </div>

                <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300">
                  A server-backed view of this member's actual
                  EVC activity, grants, documents and saved
                  calculations. No browser-only values are
                  fabricated here.
                </p>
              </div>

              <div className="min-w-[250px] rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Workspace
                </p>

                <p className="mt-2 truncate text-base font-black text-white">
                  {member.membership.workspaceName}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <DarkMini
                    label="Status"
                    value={
                      member.member.accountStatus
                        .toLowerCase()
                        .replace(
                          /^./,
                          (character) =>
                            character.toUpperCase()
                        )
                    }
                  />

                  <DarkMini
                    label="Membership"
                    value="Active"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <PreviewKpi
              icon={<Layers3 size={17} />}
              label="Confirmed options"
              value={formatNumber(
                member.grantSummary.totalOptions
              )}
              caption={`${member.grantSummary.confirmedGrantCount} confirmed grants`}
            />

            <PreviewKpi
              icon={<Wallet size={17} />}
              label="Exercise exposure"
              value={formatCurrency(
                member.grantSummary.totalExerciseCost
              )}
              caption="Confirmed grant × strike price"
            />

            <PreviewKpi
              icon={<BarChart3 size={17} />}
              label="Saved calculations"
              value={formatNumber(
                member.calculationSummary.calculationCount
              )}
              caption={activityHeadline}
            />

            <PreviewKpi
              icon={<TrendingUp size={17} />}
              label="Highest saved exit"
              value={formatCurrency(
                member.calculationSummary.highestExitValue
              )}
              caption="Persisted calculation result"
            />
          </div>

          <div className="grid gap-5 p-5 md:p-7 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                    Grant intelligence
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    What exists in this member's EVC account.
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    These figures come from the member's persisted
                    confirmed grant records.
                  </p>
                </div>

                <div className="hidden rounded-2xl bg-slate-50 p-3 text-slate-700 sm:block">
                  <FileText size={18} />
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <DetailTile
                  label="Grant records"
                  value={formatNumber(
                    member.grantSummary.grantCount
                  )}
                />

                <DetailTile
                  label="Confirmed grants"
                  value={formatNumber(
                    member.grantSummary.confirmedGrantCount
                  )}
                />

                <DetailTile
                  label="Companies"
                  value={formatNumber(
                    member.grantSummary.companies.length
                  )}
                />

                <DetailTile
                  label="Documents"
                  value={formatNumber(
                    member.documentSummary.documentCount
                  )}
                />

                <DetailTile
                  label="Confirmed documents"
                  value={formatNumber(
                    member.documentSummary.confirmedDocumentCount
                  )}
                />

                <DetailTile
                  label="Extracted clauses"
                  value={formatNumber(
                    member.documentSummary.clauseCount
                  )}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <ShieldCheck size={16} />
                  </div>

                  <div>
                    <p className="text-xs font-black text-blue-950">
                      Source-connected data
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-900/70">
                      Confirmed grants, documents, clauses and
                      persisted calculation records are coming
                      directly from the selected member's EVC
                      account.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                Account timeline
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Member activity.
              </h2>

              <div className="mt-6 space-y-4">
                <TimelineItem
                  icon={<UserRound size={15} />}
                  label="Account created"
                  value={formatDate(
                    member.member.createdAt
                  )}
                />

                <TimelineItem
                  icon={<CalendarClock size={15} />}
                  label="Added to workspace"
                  value={formatDate(
                    member.membership.addedAt
                  )}
                />

                <TimelineItem
                  icon={<TrendingUp size={15} />}
                  label="Last activity"
                  value={
                    member.activitySummary
                      .lastActivityAt
                      ? formatDate(
                          member.activitySummary
                            .lastActivityAt
                        )
                      : "No activity"
                  }
                />

                <TimelineItem
                  icon={<BarChart3 size={15} />}
                  label="Latest calculation"
                  value={
                    member.calculationSummary
                      .latestCalculationAt
                      ? formatDate(
                          member.calculationSummary
                            .latestCalculationAt
                        )
                      : "No saved calculations"
                  }
                />

                <TimelineItem
                  icon={<ShieldCheck size={15} />}
                  label="Workspace entitlement"
                  value={formatDate(
                    member.membership.workspaceExpiresAt
                  )}
                  secondary="expires"
                />
              </div>
            </section>
          </div>

          <section className="border-t border-slate-200 bg-slate-50/60 p-5 md:p-7 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  Saved calculation intelligence
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Historical model activity.
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  These values are persisted calculations from the
                  member's EVC account. They are not reconstructed
                  from another user's browser state.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/team/members/${encodeURIComponent(
                      member.member.id
                    )}/analysis`
                  )
                }
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Explore analytics
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DarkDataCard
                label="Total exit value"
                value={formatCurrency(
                  member.calculationSummary.totalExitValue
                )}
              />

              <DarkDataCard
                label="Average exit value"
                value={formatCurrency(
                  member.calculationSummary.averageExitValue
                )}
              />

              <DarkDataCard
                label="Average return"
                value={formatMultiple(
                  member.calculationSummary.averageReturnMultiple
                )}
              />

              <DarkDataCard
                label="Average ROI"
                value={formatPercentage(
                  member.calculationSummary.averageRoiPercentage
                )}
              />
            </div>
          </section>

          <section className="border-t border-slate-200 bg-white p-5 md:p-7 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  Companies represented
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Grant footprint.
                </h2>
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                {member.grantSummary.companies.length} companies
              </div>
            </div>

            {member.grantSummary.companies.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                No confirmed companies are available yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {member.grantSummary.companies.map(
                  (company) => {
                    const companyData =
                      member.analytics.grantCountsByCompany.find(
                        (item) =>
                          item.company ===
                          company
                      );

                    return (
                      <div
                        key={company}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                      >
                        <p className="truncate text-sm font-black text-slate-950">
                          {company}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                          <span className="font-semibold text-slate-500">
                            {companyData?.grants ?? 0} grant
                            {companyData?.grants === 1
                              ? ""
                              : "s"}
                          </span>

                          <span className="font-black text-slate-800">
                            {formatNumber(
                              companyData?.options ??
                                0
                            )}{" "}
                            options
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          <section className="border-t border-slate-200 bg-slate-50/70 p-5 md:p-7 lg:p-8">
            <div className="grid gap-4 lg:grid-cols-3">
              <ActionPanel
                icon={<FileText size={18} />}
                title="Preview source work"
                text="Review the member's persisted grant, document and calculation context."
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  })
                }
              />

              <ActionPanel
                icon={<BarChart3 size={18} />}
                title="Open analysis"
                text="Move into the dedicated analytics view for this member."
                onClick={() =>
                  router.push(
                    `/team/members/${encodeURIComponent(
                      member.member.id
                    )}/analysis`
                  )
                }
              />

              <ActionPanel
                icon={<TrendingUp size={18} />}
                title="Compare member"
                text="Open the side-by-side team comparison workspace."
                onClick={() =>
                  router.push(
                    `/team/members/${encodeURIComponent(
                      member.member.id
                    )}/compare`
                  )
                }
              />
            </div>
          </section>

          <footer className="border-t border-slate-200 bg-white px-5 py-5 md:px-7">
            <div className="flex flex-col gap-3 text-xs font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                EVC Team Intelligence · Persisted member data
              </span>

              <span>
                Workspace expires{" "}
                {formatDate(
                  member.membership.workspaceExpiresAt
                )}
              </span>
            </div>
          </footer>
        </motion.section>
      </div>
    </main>
  );
}

function PreviewKpi({
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
      whileHover={{ y: -2 }}
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

function DetailTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function TimelineItem({
  icon,
  label,
  value,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-black text-slate-900">
          {value}
          {secondary && (
            <span className="ml-1 text-xs font-semibold text-slate-400">
              {secondary}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function DarkMini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-white">
        {value}
      </p>
    </div>
  );
}

function DarkDataCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#050816] p-5 text-white shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 truncate text-2xl font-black tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function ActionPanel({
  icon,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white">
          {icon}
        </span>

        <ChevronRight
          size={16}
          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
        />
      </div>

      <h3 className="mt-5 text-sm font-black text-slate-950">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {text}
      </p>
    </button>
  );
}

function PreviewLoading() {
  return (
    <main className="min-h-screen bg-[#f5f8fc] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-[1560px]">
        <div className="animate-pulse">
          <div className="h-5 w-48 rounded bg-slate-200" />

          <div className="mt-7 h-64 rounded-[34px] bg-slate-200" />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
      </div>
    </main>
  );
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

function formatMultiple(value: number) {
  return `${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value)}x`;
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

function formatRelativeDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  const diff =
    Date.now() - date.getTime();

  const days = Math.floor(
    diff / (1000 * 60 * 60 * 24)
  );

  if (days <= 0) return "today";
  if (days === 1) return "yesterday";

  return `${days} days ago`;
}
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  GitCompareArrows,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Layers3,
  Clock3,
} from "lucide-react";

type TeamMember = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  addedAt: string;
  status: string;
};

type Intelligence = {
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
  };

  documentSummary: {
    documentCount: number;
    confirmedDocumentCount: number;
    clauseCount: number;
    reviewDocumentCount: number;
  };
};

type MemberApiResponse = {
  success: boolean;
  member?: Intelligence;
  message?: string;
};

type WorkspaceApiResponse = {
  success: boolean;
  workspace?: {
    members: TeamMember[];
  };
  message?: string;
};

export default function TeamMemberComparePage() {
  const router = useRouter();
  const params = useParams<{
    userId: string;
  }>();

  const userId = params?.userId;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] =
    useState("");

  const [leftMember, setLeftMember] =
    useState<Intelligence | null>(null);

  const [rightMember, setRightMember] =
    useState<Intelligence | null>(null);

  const [loadingWorkspace, setLoadingWorkspace] =
    useState(true);

  const [loadingMembers, setLoadingMembers] =
    useState(false);

  const [error, setError] = useState("");

  async function loadWorkspaceMembers() {
    setLoadingWorkspace(true);
    setError("");

    try {
      const response = await fetch("/api/team", {
        credentials: "include",
        cache: "no-store",
      });

      const data =
        (await response.json()) as WorkspaceApiResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.workspace
      ) {
        setError(
          data.message ??
            "We could not load the Team Workspace."
        );
        return;
      }

      const availableMembers =
        data.workspace.members.filter(
          (member) =>
            member.status === "ACTIVE"
        );

      setMembers(availableMembers);

      const comparisonCandidate =
        availableMembers.find(
          (member) =>
            member.userId !== userId
        );

      if (comparisonCandidate) {
        setSelectedUserId(
          comparisonCandidate.userId
        );
      }
    } catch {
      setError(
        "We could not connect to the Team Workspace."
      );
    } finally {
      setLoadingWorkspace(false);
    }
  }

  async function loadMember(
    memberId: string
  ): Promise<Intelligence | null> {
    const response = await fetch(
      `/api/team/members/${encodeURIComponent(
        memberId
      )}`,
      {
        credentials: "include",
        cache: "no-store",
      }
    );

    const data =
      (await response.json()) as MemberApiResponse;

    if (
      !response.ok ||
      !data.success ||
      !data.member
    ) {
      throw new Error(
        data.message ??
          "Member intelligence could not be loaded."
      );
    }

    return data.member;
  }

  async function loadComparison() {
    if (!userId || !selectedUserId) {
      return;
    }

    if (userId === selectedUserId) {
      setError(
        "Choose a different team member to compare."
      );
      return;
    }

    setLoadingMembers(true);
    setError("");

    try {
      const [left, right] =
        await Promise.all([
          loadMember(userId),
          loadMember(selectedUserId),
        ]);

      setLeftMember(left);
      setRightMember(right);
    } catch (comparisonError) {
      setError(
        comparisonError instanceof Error
          ? comparisonError.message
          : "We could not load the comparison data."
      );
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    void loadWorkspaceMembers();
  }, [userId]);

  useEffect(() => {
    if (
      userId &&
      selectedUserId &&
      userId !== selectedUserId
    ) {
      void loadComparison();
    }
  }, [userId, selectedUserId]);

  const comparisonRows = useMemo(() => {
    if (!leftMember || !rightMember) {
      return [];
    }

    return [
      {
        category: "Grant",
        metric: "Confirmed grants",
        left: formatNumber(
          leftMember.grantSummary
            .confirmedGrantCount
        ),
        right: formatNumber(
          rightMember.grantSummary
            .confirmedGrantCount
        ),
        leftValue:
          leftMember.grantSummary
            .confirmedGrantCount,
        rightValue:
          rightMember.grantSummary
            .confirmedGrantCount,
      },
      {
        category: "Grant",
        metric: "Total options",
        left: formatNumber(
          leftMember.grantSummary.totalOptions
        ),
        right: formatNumber(
          rightMember.grantSummary.totalOptions
        ),
        leftValue:
          leftMember.grantSummary.totalOptions,
        rightValue:
          rightMember.grantSummary.totalOptions,
      },
      {
        category: "Exercise",
        metric: "Exercise exposure",
        left: formatCurrency(
          leftMember.grantSummary
            .totalExerciseCost
        ),
        right: formatCurrency(
          rightMember.grantSummary
            .totalExerciseCost
        ),
        leftValue:
          leftMember.grantSummary
            .totalExerciseCost,
        rightValue:
          rightMember.grantSummary
            .totalExerciseCost,
      },
      {
        category: "Documents",
        metric: "Confirmed documents",
        left: formatNumber(
          leftMember.documentSummary
            .confirmedDocumentCount
        ),
        right: formatNumber(
          rightMember.documentSummary
            .confirmedDocumentCount
        ),
        leftValue:
          leftMember.documentSummary
            .confirmedDocumentCount,
        rightValue:
          rightMember.documentSummary
            .confirmedDocumentCount,
      },
      {
        category: "Activity",
        metric: "Recorded activity",
        left: formatNumber(
          leftMember.activitySummary
            .activityCount
        ),
        right: formatNumber(
          rightMember.activitySummary
            .activityCount
        ),
        leftValue:
          leftMember.activitySummary
            .activityCount,
        rightValue:
          rightMember.activitySummary
            .activityCount,
      },
      {
        category: "Calculations",
        metric: "Saved calculations",
        left: formatNumber(
          leftMember.calculationSummary
            .calculationCount
        ),
        right: formatNumber(
          rightMember.calculationSummary
            .calculationCount
        ),
        leftValue:
          leftMember.calculationSummary
            .calculationCount,
        rightValue:
          rightMember.calculationSummary
            .calculationCount,
      },
      {
        category: "Calculations",
        metric: "Highest saved exit",
        left: formatCurrency(
          leftMember.calculationSummary
            .highestExitValue
        ),
        right: formatCurrency(
          rightMember.calculationSummary
            .highestExitValue
        ),
        leftValue:
          leftMember.calculationSummary
            .highestExitValue,
        rightValue:
          rightMember.calculationSummary
            .highestExitValue,
      },
      {
        category: "Calculations",
        metric: "Average return multiple",
        left: formatMultiple(
          leftMember.calculationSummary
            .averageReturnMultiple
        ),
        right: formatMultiple(
          rightMember.calculationSummary
            .averageReturnMultiple
        ),
        leftValue:
          leftMember.calculationSummary
            .averageReturnMultiple,
        rightValue:
          rightMember.calculationSummary
            .averageReturnMultiple,
      },
      {
        category: "Calculations",
        metric: "Average ROI",
        left: formatPercentage(
          leftMember.calculationSummary
            .averageRoiPercentage
        ),
        right: formatPercentage(
          rightMember.calculationSummary
            .averageRoiPercentage
        ),
        leftValue:
          leftMember.calculationSummary
            .averageRoiPercentage,
        rightValue:
          rightMember.calculationSummary
            .averageRoiPercentage,
      },
      {
        category: "Expiry",
        metric: "Grants expiring within 365 days",
        left: formatNumber(
          leftMember.grantSummary
            .expiringWithin365Days
        ),
        right: formatNumber(
          rightMember.grantSummary
            .expiringWithin365Days
        ),
        leftValue:
          leftMember.grantSummary
            .expiringWithin365Days,
        rightValue:
          rightMember.grantSummary
            .expiringWithin365Days,
      },
    ];
  }, [leftMember, rightMember]);

  if (loadingWorkspace) {
    return <LoadingState />;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8fc] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute right-[-100px] top-40 h-96 w-96 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1560px] px-5 py-6 md:px-8 md:py-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/team")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Team Workspace
            </button>

            <span className="text-slate-300">
              /
            </span>

            <div>
              <p className="text-sm font-black text-slate-950">
                Compare Members
              </p>
              <p className="text-xs font-semibold text-slate-400">
                Side-by-side persisted EVC intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadWorkspaceMembers()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300"
            >
              <RefreshCw size={14} />
              Refresh members
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/team/members/${encodeURIComponent(
                    userId
                  )}/preview`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              <ArrowLeft size={14} />
              Member Preview
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span>{error}</span>
          </div>
        )}

        <motion.section
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mt-7 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_28px_100px_rgba(15,23,42,0.09)]"
        >
          <div className="relative overflow-hidden bg-[#050816] px-6 py-9 text-white md:px-8 lg:px-10">
            <div className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-130px] left-[30%] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-200">
                <GitCompareArrows size={13} />
                Member Comparison
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                See the difference clearly.
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                Compare two existing Team members using only
                persisted EVC records. The comparison does not
                fabricate missing model values.
              </p>
            </div>
          </div>

          <section className="border-b border-slate-200 bg-slate-50/70 p-5 md:p-7">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
              <MemberSelector
                label="Member A"
                members={members}
                value={userId ?? ""}
                onChange={(nextUserId) => {
                  router.push(
                    `/team/members/${encodeURIComponent(
                      nextUserId
                    )}/compare`
                  );
                }}
                disabled={loadingMembers}
              />

              <div className="hidden place-items-center lg:grid">
                <div className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm">
                  <GitCompareArrows size={18} />
                </div>
              </div>

              <MemberSelector
                label="Member B"
                members={members.filter(
                  (member) =>
                    member.userId !== userId
                )}
                value={selectedUserId}
                onChange={setSelectedUserId}
                disabled={loadingMembers}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-500">
                Select any two active members in the workspace.
              </p>

              <button
                type="button"
                onClick={() => void loadComparison()}
                disabled={
                  loadingMembers ||
                  !selectedUserId ||
                  selectedUserId === userId
                }
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMembers ? (
                  <RefreshCw
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <GitCompareArrows size={14} />
                )}
                Compare now
              </button>
            </div>
          </section>

          {leftMember && rightMember ? (
            <>
              <section className="grid gap-5 p-5 md:p-7 lg:grid-cols-2">
                <ComparisonHero
                  member={leftMember}
                  position="A"
                  featured
                />

                <ComparisonHero
                  member={rightMember}
                  position="B"
                />
              </section>

              <section className="border-t border-slate-200 bg-white p-5 md:p-7 lg:p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                      Difference matrix
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      Side-by-side intelligence.
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Green highlights the larger persisted value
                      for that metric. A highlight is descriptive,
                      not a recommendation.
                    </p>
                  </div>

                  <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    {comparisonRows.length} metrics
                  </div>
                </div>

                <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200">
                  <div className="grid grid-cols-[1fr_0.8fr_0.8fr] border-b border-slate-200 bg-slate-50 px-4 py-4 md:px-6">
                    <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Metric
                    </div>

                    <div className="text-right text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                      {leftMember.member.name}
                    </div>

                    <div className="text-right text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                      {rightMember.member.name}
                    </div>
                  </div>

                  <div>
                    {comparisonRows.map(
                      (row, index) => {
                        const leftWins =
                          row.leftValue >
                          row.rightValue;

                        const rightWins =
                          row.rightValue >
                          row.leftValue;

                        return (
                          <div
                            key={`${row.category}-${row.metric}`}
                            className={`grid grid-cols-[1fr_0.8fr_0.8fr] px-4 py-4 md:px-6 ${
                              index <
                              comparisonRows.length - 1
                                ? "border-b border-slate-100"
                                : ""
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-400">
                                {row.category}
                              </p>

                              <p className="mt-1 truncate text-xs font-black text-slate-800 sm:text-sm">
                                {row.metric}
                              </p>
                            </div>

                            <div
                              className={`ml-2 rounded-xl px-3 py-2 text-right text-sm font-black ${
                                leftWins
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "text-slate-700"
                              }`}
                            >
                              {row.left}
                            </div>

                            <div
                              className={`ml-2 rounded-xl px-3 py-2 text-right text-sm font-black ${
                                rightWins
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "text-slate-700"
                              }`}
                            >
                              {row.right}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </section>

              <section className="grid gap-4 border-t border-slate-200 bg-slate-50/70 p-5 md:grid-cols-2 md:p-7 lg:grid-cols-4 lg:p-8">
                <SummaryCard
                  icon={<Layers3 size={18} />}
                  title="Options"
                  left={formatNumber(
                    leftMember.grantSummary
                      .totalOptions
                  )}
                  right={formatNumber(
                    rightMember.grantSummary
                      .totalOptions
                  )}
                  labels={[
                    leftMember.member.name,
                    rightMember.member.name,
                  ]}
                />

                <SummaryCard
                  icon={<Wallet size={18} />}
                  title="Exercise"
                  left={formatCurrency(
                    leftMember.grantSummary
                      .totalExerciseCost
                  )}
                  right={formatCurrency(
                    rightMember.grantSummary
                      .totalExerciseCost
                  )}
                  labels={[
                    leftMember.member.name,
                    rightMember.member.name,
                  ]}
                />

                <SummaryCard
                  icon={<BarChart3 size={18} />}
                  title="Calculations"
                  left={formatNumber(
                    leftMember
                      .calculationSummary
                      .calculationCount
                  )}
                  right={formatNumber(
                    rightMember
                      .calculationSummary
                      .calculationCount
                  )}
                  labels={[
                    leftMember.member.name,
                    rightMember.member.name,
                  ]}
                />

                <SummaryCard
                  icon={<TrendingUp size={18} />}
                  title="Highest exit"
                  left={formatCurrency(
                    leftMember
                      .calculationSummary
                      .highestExitValue
                  )}
                  right={formatCurrency(
                    rightMember
                      .calculationSummary
                      .highestExitValue
                  )}
                  labels={[
                    leftMember.member.name,
                    rightMember.member.name,
                  ]}
                />
              </section>

              <footer className="border-t border-slate-200 bg-white px-5 py-5 md:px-7">
                <div className="flex flex-col gap-3 text-xs font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    EVC Team Intelligence · Persisted member data
                  </span>

                  <Link
                    href={`/team/members/${encodeURIComponent(
                      leftMember.member.id
                    )}/analysis`}
                    className="inline-flex items-center gap-2 font-black text-blue-600 hover:text-blue-700"
                  >
                    Open Member A Analysis
                    <BarChart3 size={14} />
                  </Link>
                </div>
              </footer>
            </>
          ) : (
            <EmptyComparison
              loading={loadingMembers}
            />
          )}
        </motion.section>
      </div>
    </main>
  );
}

function MemberSelector({
  label,
  members,
  value,
  onChange,
  disabled,
}: {
  label: string;
  members: TeamMember[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        className="mt-3 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
      >
        <option value="">
          Select member
        </option>

        {members.map((member) => (
          <option
            key={member.userId}
            value={member.userId}
          >
            {member.name} — {member.email}
          </option>
        ))}
      </select>
    </div>
  );
}

function ComparisonHero({
  member,
  position,
  featured = false,
}: {
  member: Intelligence;
  position: "A" | "B";
  featured?: boolean;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className={`overflow-hidden rounded-[28px] border ${
        featured
          ? "border-blue-200"
          : "border-slate-200"
      } bg-white shadow-sm`}
    >
      <div
        className={`h-1 ${
          featured
            ? "bg-gradient-to-r from-blue-600 via-indigo-500 to-slate-950"
            : "bg-slate-300"
        }`}
      />

      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-base font-black text-white">
            {getInitials(
              member.member.name
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                Member {position}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700">
                <ShieldCheck size={10} />
                PRO
              </span>
            </div>

            <h2 className="mt-2 truncate text-xl font-black text-slate-950">
              {member.member.name}
            </h2>

            <p className="truncate text-xs font-medium text-slate-500">
              {member.member.email}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <HeroMetric
            icon={<Layers3 size={14} />}
            label="Options"
            value={formatNumber(
              member.grantSummary.totalOptions
            )}
          />

          <HeroMetric
            icon={<Wallet size={14} />}
            label="Exercise"
            value={formatCurrency(
              member.grantSummary
                .totalExerciseCost
            )}
          />

          <HeroMetric
            icon={<BarChart3 size={14} />}
            label="Calculations"
            value={formatNumber(
              member.calculationSummary
                .calculationCount
            )}
          />

          <HeroMetric
            icon={<TrendingUp size={14} />}
            label="ROI"
            value={formatPercentage(
              member.calculationSummary
                .averageRoiPercentage
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}

function HeroMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-lg font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  left,
  right,
  labels,
}: {
  icon: React.ReactNode;
  title: string;
  left: string;
  right: string;
  labels: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </span>

        <p className="text-[10px] font-black uppercase tracking-[0.13em]">
          {title}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div>
          <p className="truncate text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
            {labels[0]}
          </p>

          <p className="mt-1 truncate text-sm font-black text-slate-950">
            {left}
          </p>
        </div>

        <div>
          <p className="truncate text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
            {labels[1]}
          </p>

          <p className="mt-1 truncate text-sm font-black text-slate-950">
            {right}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyComparison({
  loading,
}: {
  loading: boolean;
}) {
  return (
    <section className="p-8 md:p-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
          {loading ? (
            <RefreshCw
              size={23}
              className="animate-spin"
            />
          ) : (
            <Users size={23} />
          )}
        </div>

        <h2 className="mt-5 text-xl font-black text-slate-950">
          {loading
            ? "Loading member intelligence..."
            : "Select two different team members"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {loading
            ? "Retrieving persisted EVC records."
            : "The comparison view needs two active Team members."}
        </p>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-[#f5f8fc] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-[1560px] animate-pulse">
        <div className="h-5 w-52 rounded bg-slate-200" />
        <div className="mt-7 h-56 rounded-[34px] bg-slate-200" />
        <div className="mt-5 h-28 rounded-3xl bg-slate-200" />
        <div className="mt-5 h-96 rounded-3xl bg-slate-200" />
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
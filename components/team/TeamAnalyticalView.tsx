"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  CalendarDays,
  Download,
  Filter,
  Gauge,
  Inbox,
  Layers3,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { EChartsOption } from "echarts";

/* -------------------------------------------------------------------------- */
/* LAZY ECHARTS                                                                */
/* -------------------------------------------------------------------------- */

const ReactECharts = dynamic(
  () => import("echarts-for-react"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-sky-400" />
      </div>
    ),
  }
);

/* -------------------------------------------------------------------------- */
/* TYPES                                                                       */
/* -------------------------------------------------------------------------- */

type TeamAnalyticsMember = {
  id: string;
  name: string;
  email: string;
  options: number;
  confirmedGrants: number;
  exerciseCost: number;
  calculations: number;
  totalExitValue: number;
  highestExitValue: number;
  averageReturnMultiple: number;
  averageRoiPercentage: number;
  activities: number;
  documents: number;
  expiringWithin365Days: number;
  addedAt: string;
};

type CompanyRow = {
  company: string;
  grants: number;
  options: number;
  members: number;
};

type ActivityRow = {
  type: string;
  count: number;
};

type ActivityTimelineRow = {
  date: string;
  count: number;
};

type CalculationRow = {
  memberId: string;
  memberName: string;
  id: string;
  name: string;
  exitValue: number;
  returnMultiple: number;
  roiPercentage: number;
  createdAt: string;
};

type ExpiryRow = {
  grantId: string;
  grantName: string;
  companyName: string;
  expiryDate: string;
  optionCount: number;
  daysRemaining: number;
  memberId: string;
  memberName: string;
};

type TeamAnalyticsResponse = {
  success: boolean;

  workspace?: {
    id: string;
    name: string;
    status: string;
    startedAt: string;
    expiresAt: string;
    maxMembers: number;
    activeMemberCount: number;
  };

  summary?: {
    memberCount: number;
    totalOptions: number;
    totalExerciseCost: number;
    totalConfirmedGrants: number;
    totalCalculations: number;
    totalActivity: number;
    totalDocuments: number;
    totalConfirmedDocuments: number;
    totalExitValue: number;
    highestExitValue: number;
    averageRoi: number;
    averageReturnMultiple: number;
    membersWithGrants: number;
    membersWithCalculations: number;
    membersWithRecentActivity: number;
  };

  analytics?: {
    companies: CompanyRow[];
    activityByType: ActivityRow[];
    activityTimeline: ActivityTimelineRow[];
    calculationSeries: CalculationRow[];
    expiryTimeline: ExpiryRow[];
  };

  members?: TeamAnalyticsMember[];

  message?: string;
};

type Summary = NonNullable<TeamAnalyticsResponse["summary"]>;
type Analytics = NonNullable<TeamAnalyticsResponse["analytics"]>;
type Workspace = NonNullable<TeamAnalyticsResponse["workspace"]>;

type ScoredMember = TeamAnalyticsMember & {
  /** 0-100. Mean share of the workspace peak across the dimensions that have data. */
  index: number;
};

type EvtParams = {
  name?: string;
  seriesName?: string;
  dataIndex?: number;
  data?: unknown;
  value?: unknown;
};

type ChartEvents = Record<string, (params: EvtParams) => void>;

type SortKey =
  | "index"
  | "name"
  | "options"
  | "confirmedGrants"
  | "exerciseCost"
  | "calculations"
  | "totalExitValue"
  | "highestExitValue"
  | "averageReturnMultiple"
  | "averageRoiPercentage"
  | "activities"
  | "documents"
  | "expiringWithin365Days"
  | "addedAt";

/* -------------------------------------------------------------------------- */
/* DESIGN TOKENS                                                               */
/* -------------------------------------------------------------------------- */

const T = {
  canvas: "#080d1b",
  text: "#e2e8f0",
  muted: "#94a3b8",
  faint: "#64748b",
  grid: "rgba(148,163,184,0.10)",
  amber: "#fbbf24",
  blue: "#3b82f6",
  sky: "#38bdf8",
  cyan: "#22d3ee",
  violet: "#a78bfa",
  emerald: "#34d399",
  rose: "#fb7185",
  slate: "#94a3b8",
};

const FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

const DONUT_PALETTE = [
  "#3b82f6",
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#fb923c",
  "#94a3b8",
];

const TOOLTIP_BASE = {
  backgroundColor: "rgba(8,13,28,0.97)",
  borderColor: "rgba(148,163,184,0.25)",
  borderWidth: 1,
  padding: [10, 12] as [number, number],
  textStyle: { color: "#e2e8f0", fontSize: 12 },
  confine: true,
  extraCssText:
    "border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.5);backdrop-filter:blur(8px);",
};

const BANDS = [
  { key: "expired", label: "Expired", color: "#e11d48" },
  { key: "critical", label: "0 to 90 days", color: "#f97316" },
  { key: "elevated", label: "91 to 180 days", color: "#fbbf24" },
  { key: "watch", label: "181 to 365 days", color: "#38bdf8" },
  { key: "stable", label: "Over 365 days", color: "#34d399" },
] as const;

type BandKey = (typeof BANDS)[number]["key"];

function bandOf(days: number) {
  if (days < 0) return BANDS[0];
  if (days <= 90) return BANDS[1];
  if (days <= 180) return BANDS[2];
  if (days <= 365) return BANDS[3];
  return BANDS[4];
}

type HeatKey =
  | "index"
  | "options"
  | "confirmedGrants"
  | "exerciseCost"
  | "calculations"
  | "totalExitValue"
  | "averageRoiPercentage"
  | "averageReturnMultiple"
  | "activities"
  | "documents"
  | "expiringWithin365Days";

type HeatKind = "volume" | "return" | "exposure" | "risk" | "index";

const HEAT_METRICS: {
  key: HeatKey;
  label: string;
  kind: HeatKind;
  format: (value: number) => string;
}[] = [
  { key: "index", label: "Index", kind: "index", format: (v) => v.toFixed(0) },
  { key: "options", label: "Options", kind: "volume", format: formatNumber },
  { key: "confirmedGrants", label: "Grants", kind: "volume", format: formatNumber },
  { key: "exerciseCost", label: "Exercise cost", kind: "exposure", format: formatCompactCurrency },
  { key: "calculations", label: "Calculations", kind: "volume", format: formatNumber },
  { key: "totalExitValue", label: "Exit value", kind: "return", format: formatCompactCurrency },
  { key: "averageRoiPercentage", label: "Avg ROI", kind: "return", format: formatPercentage },
  { key: "averageReturnMultiple", label: "Avg multiple", kind: "return", format: formatMultiple },
  { key: "activities", label: "Activity", kind: "volume", format: formatNumber },
  { key: "documents", label: "Documents", kind: "volume", format: formatNumber },
  { key: "expiringWithin365Days", label: "Expiring in 1 yr", kind: "risk", format: formatNumber },
];

/* -------------------------------------------------------------------------- */
/* ROOT: DATA LOADING                                                          */
/* -------------------------------------------------------------------------- */

export default function TeamAnalyticalView() {
  const [data, setData] = useState<TeamAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/team/analytics", {
        credentials: "include",
        cache: "no-store",
      });

      const result = (await response.json()) as TeamAnalyticsResponse;

      if (!response.ok || !result.success) {
        setError(
          result.message ?? "We could not load the Team analytical dataset."
        );
        return;
      }

      setData(result);
      setLastUpdated(new Date());
    } catch {
      setError("We could not connect to the Team analytical service.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return <AnalyticsLoading />;
  }

  if (!data?.summary || !data.analytics) {
    return (
      <section className="p-4 md:p-6 lg:p-7">
        <div className="rounded-3xl border border-rose-400/20 bg-[#0a1020] p-8 text-white">
          <div className="flex items-start gap-3">
            <Activity className="mt-0.5 text-rose-400" />
            <div>
              <h2 className="text-xl font-bold">Team Intelligence is unavailable</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                {error || "The Team analytical dataset could not be loaded."}{" "}
                Check your connection, then try again.
              </p>
              <button
                type="button"
                onClick={() => void loadAnalytics()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <Dashboard
      summary={data.summary}
      analytics={data.analytics}
      workspace={data.workspace}
      members={data.members ?? []}
      refreshing={refreshing}
      lastUpdated={lastUpdated}
      onRefresh={() => void loadAnalytics(true)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* DASHBOARD                                                                   */
/* -------------------------------------------------------------------------- */

function Dashboard({
  summary,
  analytics,
  workspace,
  members,
  refreshing,
  lastUpdated,
  onRefresh,
}: {
  summary: Summary;
  analytics: Analytics;
  workspace?: Workspace;
  members: TeamAnalyticsMember[];
  refreshing: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedBand, setSelectedBand] = useState<BandKey | null>(null);
  const [timeMode, setTimeMode] = useState<"daily" | "cumulative">("daily");
  const reducedMotion = usePrefersReducedMotion();

  /* ----- derived: members ------------------------------------------------ */

  const scored = useMemo(() => scoreMembers(members), [members]);

  const ranked = useMemo(
    () =>
      [...scored].sort(
        (a, b) =>
          b.index - a.index ||
          b.options - a.options ||
          a.name.localeCompare(b.name)
      ),
    [scored]
  );

  const memberIds = useMemo(
    () => new Set(members.map((member) => member.id)),
    [members]
  );

  const selected = useMemo(
    () => new Set(selectedMembers.filter((id) => memberIds.has(id))),
    [selectedMembers, memberIds]
  );

  const hasSelection = selected.size > 0;

  const toggleMember = useCallback((id: string) => {
    setSelectedMembers((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }, []);

  const toggleCompany = useCallback((company: string) => {
    setSelectedCompany((previous) => (previous === company ? null : company));
  }, []);

  const toggleBand = useCallback((band: BandKey) => {
    setSelectedBand((previous) => (previous === band ? null : band));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedMembers([]);
    setSelectedCompany(null);
    setSelectedBand(null);
  }, []);

  /* ----- derived: filtered datasets ------------------------------------- */

  const scopedCalcs = useMemo(
    () =>
      analytics.calculationSeries.filter(
        (row) => !hasSelection || selected.has(row.memberId)
      ),
    [analytics.calculationSeries, hasSelection, selected]
  );

  const memberScopedExpiry = useMemo(
    () =>
      analytics.expiryTimeline.filter(
        (row) => !hasSelection || selected.has(row.memberId)
      ),
    [analytics.expiryTimeline, hasSelection, selected]
  );

  const scopedExpiry = useMemo(
    () =>
      memberScopedExpiry.filter(
        (row) => !selectedCompany || row.companyName === selectedCompany
      ),
    [memberScopedExpiry, selectedCompany]
  );

  const riskExpiry = useMemo(
    () =>
      scopedExpiry.filter(
        (row) => !selectedBand || bandOf(row.daysRemaining).key === selectedBand
      ),
    [scopedExpiry, selectedBand]
  );

  /* ----- derived: KPIs --------------------------------------------------- */

  const kpi = useMemo(() => {
    const scope = hasSelection
      ? members.filter((member) => selected.has(member.id))
      : members;

    const sum = (pick: (m: TeamAnalyticsMember) => number) =>
      scope.reduce((total, member) => total + (pick(member) || 0), 0);

    const calcCount = sum((m) => m.calculations);

    const weightedRoi =
      calcCount > 0
        ? scope.reduce(
            (total, member) =>
              total + (member.averageRoiPercentage || 0) * member.calculations,
            0
          ) / calcCount
        : 0;

    return {
      members: hasSelection ? scope.length : summary.memberCount,
      options: hasSelection ? sum((m) => m.options) : summary.totalOptions,
      exercise: hasSelection
        ? sum((m) => m.exerciseCost)
        : summary.totalExerciseCost,
      calculations: hasSelection ? calcCount : summary.totalCalculations,
      exit: hasSelection ? sum((m) => m.totalExitValue) : summary.totalExitValue,
      best: hasSelection
        ? scope.reduce((max, m) => Math.max(max, m.highestExitValue || 0), 0)
        : summary.highestExitValue,
      roi: hasSelection ? weightedRoi : summary.averageRoi,
      hasRoi: hasSelection ? calcCount > 0 : summary.totalCalculations > 0,
      expiring: sum((m) => m.expiringWithin365Days),
    };
  }, [hasSelection, members, selected, summary]);

  const share = (value: number, total: number) =>
    hasSelection && total > 0
      ? `${formatPercentage((value / total) * 100)} of workspace`
      : null;

  const expiringTotal = useMemo(
    () => members.reduce((total, m) => total + (m.expiringWithin365Days || 0), 0),
    [members]
  );

  /* ----- derived: chart options ----------------------------------------- */

  const animate = !reducedMotion;

  const heatHeight = Math.max(320, Math.min(560, 170 + ranked.length * 42));

  const heatmapOption = useMemo(
    () => buildHeatmap(ranked, selected, animate),
    [ranked, selected, animate]
  );

  const treemapOption = useMemo(
    () => buildTreemap(analytics.companies, selectedCompany, animate),
    [analytics.companies, selectedCompany, animate]
  );

  const clusteredOption = useMemo(
    () => buildClustered(scored, selected, animate),
    [scored, selected, animate]
  );

  const timeSeriesOption = useMemo(
    () => buildTimeSeries(analytics.activityTimeline, timeMode, animate),
    [analytics.activityTimeline, timeMode, animate]
  );

  const donutOption = useMemo(
    () => buildDonut(analytics.activityByType, animate),
    [analytics.activityByType, animate]
  );

  const calendarOption = useMemo(
    () => buildCalendar(analytics.activityTimeline, animate),
    [analytics.activityTimeline, animate]
  );

  const funnelOption = useMemo(
    () => buildFunnel(summary, animate),
    [summary, animate]
  );

  const gaugeOption = useMemo(
    () => buildCapacityGauges(summary, workspace, animate),
    [summary, workspace, animate]
  );

  const radarOption = useMemo(
    () => buildRadar(ranked, selected, animate),
    [ranked, selected, animate]
  );

  const paretoOption = useMemo(
    () => buildPareto(scored, selected, animate),
    [scored, selected, animate]
  );

  const distribution = useMemo(
    () => buildDistribution(scopedCalcs, animate),
    [scopedCalcs, animate]
  );

  const scatterOption = useMemo(
    () => buildScatter(scopedCalcs, animate),
    [scopedCalcs, animate]
  );

  const riskOption = useMemo(
    () => buildRisk(riskExpiry, animate),
    [riskExpiry, animate]
  );

  const expiryDistOption = useMemo(
    () => buildExpiryDistribution(scopedExpiry, selectedBand, animate),
    [scopedExpiry, selectedBand, animate]
  );

  const sunburstOption = useMemo(
    () => buildSunburst(memberScopedExpiry, selected, selectedCompany, animate),
    [memberScopedExpiry, selected, selectedCompany, animate]
  );

  const runwayOption = useMemo(
    () => buildRunway(riskExpiry, animate),
    [riskExpiry, animate]
  );

  /* ----- derived: expiry bands ------------------------------------------ */

  const bandSummary = useMemo(
    () =>
      BANDS.map((band) => {
        const rows = scopedExpiry.filter(
          (row) => bandOf(row.daysRemaining).key === band.key
        );
        return {
          ...band,
          grants: rows.length,
          options: rows.reduce((total, row) => total + row.optionCount, 0),
        };
      }),
    [scopedExpiry]
  );

  const paretoHasData = members.some((m) => (m.totalExitValue || 0) > 0);
  const radarMembers = hasSelection ? selected.size : Math.min(5, ranked.length);

  /* ----- events ---------------------------------------------------------- */

  const heatmapEvents = useMemo<ChartEvents>(
    () => ({
      click: (params) => {
        const id = (params.data as { memberId?: string } | undefined)?.memberId;
        if (id) toggleMember(id);
      },
    }),
    [toggleMember]
  );

  const treemapEvents = useMemo<ChartEvents>(
    () => ({
      click: (params) => {
        if (params.name) toggleCompany(params.name);
      },
    }),
    [toggleCompany]
  );

  const sunburstEvents = useMemo<ChartEvents>(
    () => ({
      click: (params) => {
        const node = params.data as { kind?: string; id?: string } | undefined;
        if (node?.kind === "member" && node.id) toggleMember(node.id);
        else if (node?.kind === "company" && params.name) toggleCompany(params.name);
      },
    }),
    [toggleMember, toggleCompany]
  );

  const clusteredEvents = heatmapEvents;
  const scatterEvents = heatmapEvents;
  const riskEvents = heatmapEvents;
  const paretoEvents = heatmapEvents;
  const radarEvents = heatmapEvents;
  const runwayEvents = heatmapEvents;

  const expiryDistEvents = useMemo<ChartEvents>(
    () => ({
      click: (params) => {
        const key = (params.data as { band?: BandKey } | undefined)?.band;
        if (key) toggleBand(key);
      },
    }),
    [toggleBand]
  );

  /* ----- render ---------------------------------------------------------- */

  const maxMembers = workspace?.maxMembers ?? 20;
  const hasFilters = hasSelection || !!selectedCompany || !!selectedBand;

  return (
    <section className="p-4 md:p-6 lg:p-7">
      <div className="overflow-hidden rounded-[28px] border border-slate-800 bg-[#080d1b] text-slate-100 shadow-[0_35px_110px_rgba(8,13,27,0.35)]">
        {/* ---------------- header ---------------- */}
        <header className="relative border-b border-white/10 px-5 py-6 md:px-8 lg:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(900px 260px at 100% 0%, rgba(56,189,248,0.12), transparent 60%), radial-gradient(700px 240px at 0% 100%, rgba(99,102,241,0.10), transparent 60%)",
            }}
          />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                  <ShieldCheck size={12} />
                  Live persisted data
                </span>

                {workspace?.status && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-300">
                    {workspace.status.toLowerCase()}
                  </span>
                )}

                <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-[11px] font-semibold text-sky-200">
                  16 linked visuals
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                Team Intelligence
              </h2>

              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-400">
                {workspace?.name ? `${workspace.name}. ` : ""}
                {formatNumber(summary.memberCount)} of {maxMembers} seats in
                use
                {workspace?.expiresAt
                  ? `, workspace runs until ${formatDate(workspace.expiresAt)}`
                  : ""}
                . Click a member, company or expiry band in any visual to
                cross-filter the rest.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {lastUpdated && (
                <p className="text-xs text-slate-500">
                  Updated{" "}
                  {lastUpdated.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-white/[0.12] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Refreshing" : "Refresh data"}
              </button>
            </div>
          </div>
        </header>

        {/* ---------------- filter bar ---------------- */}
        <FilterBar
          members={ranked}
          selected={selected}
          company={selectedCompany}
          band={selectedBand}
          hasFilters={hasFilters}
          onAddMember={toggleMember}
          onClearCompany={() => setSelectedCompany(null)}
          onClearBand={() => setSelectedBand(null)}
          onClearAll={clearAll}
        />

        <div className="space-y-4 p-4 md:p-6 lg:p-7">
          {/* ---------------- KPI strip ---------------- */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            <Kpi
              icon={<Users size={14} />}
              label="Members"
              value={
                hasSelection
                  ? `${kpi.members}/${summary.memberCount}`
                  : `${kpi.members}/${maxMembers}`
              }
              caption={
                hasSelection ? "In selection" : `${summary.membersWithGrants} with grants`
              }
            />
            <Kpi
              icon={<Layers3 size={14} />}
              label="Options"
              value={formatNumber(kpi.options)}
              caption={share(kpi.options, summary.totalOptions) ?? "Confirmed grants"}
            />
            <Kpi
              icon={<Wallet size={14} />}
              label="Exercise exposure"
              value={formatCompactCurrency(kpi.exercise)}
              caption={
                share(kpi.exercise, summary.totalExerciseCost) ??
                formatCurrency(kpi.exercise)
              }
              tone="exposure"
            />
            <Kpi
              icon={<Target size={14} />}
              label="Calculations"
              value={formatNumber(kpi.calculations)}
              caption={
                share(kpi.calculations, summary.totalCalculations) ??
                `${summary.membersWithCalculations} members saving`
              }
            />
            <Kpi
              icon={<TrendingUp size={14} />}
              label="Total exit value"
              value={formatCompactCurrency(kpi.exit)}
              caption={share(kpi.exit, summary.totalExitValue) ?? formatCurrency(kpi.exit)}
              tone="positive"
            />
            <Kpi
              icon={<Gauge size={14} />}
              label="Best saved exit"
              value={formatCompactCurrency(kpi.best)}
              caption="Single calculation"
              tone="positive"
            />
            <Kpi
              icon={<Activity size={14} />}
              label="Average ROI"
              value={kpi.hasRoi ? formatPercentage(kpi.roi) : "No data"}
              caption={
                kpi.hasRoi
                  ? `${formatMultiple(summary.averageReturnMultiple)} avg multiple`
                  : "No saved calculations"
              }
              tone={!kpi.hasRoi ? "neutral" : kpi.roi >= 0 ? "positive" : "negative"}
            />
            <Kpi
              icon={<CalendarClock size={14} />}
              label="Expiring in 1 year"
              value={formatNumber(kpi.expiring)}
              caption={share(kpi.expiring, expiringTotal) ?? "Grants nearing expiry"}
              tone={kpi.expiring > 0 ? "warning" : "neutral"}
            />
          </div>

          {/* ================= 01 MEMBER & EQUITY LANDSCAPE ================= */}
          <SectionLabel
            step="01"
            title="Member and equity landscape"
            note="Who holds what, and how they compare"
          />

          <div className="grid gap-4 xl:grid-cols-12">
            <Panel
              className="xl:col-span-8"
              icon={<Users size={16} />}
              title="Member performance heatmap"
              subtitle="Each column is scaled to its own peak, so colour shows where a member sits against the team."
              scope={{ kind: "source", label: "Click a row to filter" }}
              empty={members.length === 0}
              emptyTitle="No members to compare yet"
              emptyHint="Active workspace members appear here as soon as they join."
              height={heatHeight}
              footer={<HeatLegend />}
            >
              <Chart
                option={heatmapOption}
                height={heatHeight}
                onEvents={heatmapEvents}
              />
            </Panel>

            <Panel
              className="xl:col-span-4"
              icon={<Layers3 size={16} />}
              title="Company equity treemap"
              subtitle="Area is confirmed options. Click a company to focus the expiry visuals."
              scope={{ kind: "source", label: "Filters expiry" }}
              empty={analytics.companies.length === 0}
              emptyTitle="No confirmed grants"
              emptyHint="Companies appear once a member confirms a grant."
              height={heatHeight}
            >
              <Chart
                option={treemapOption}
                height={heatHeight}
                onEvents={treemapEvents}
              />
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-12">
            <Panel
              className="xl:col-span-6"
              icon={<Users size={16} />}
              title="Member comparison"
              subtitle="Options on the left axis. Grants, calculations, activity and documents on the right."
              scope={{ kind: "source", label: "Click a bar to filter" }}
              empty={members.length === 0}
              emptyTitle="No members to compare"
              emptyHint="Member metrics appear once the workspace has active members."
              height={380}
            >
              <Chart
                option={clusteredOption}
                height={380}
                onEvents={clusteredEvents}
              />
            </Panel>

            <Panel
              className="xl:col-span-3"
              icon={<Target size={16} />}
              title="Member profile radar"
              subtitle={
                hasSelection
                  ? "Selected members as a share of the workspace peak."
                  : "Top five by engagement index, as a share of the workspace peak."
              }
              scope={{ kind: "filtered", label: hasSelection ? `${radarMembers} selected` : "Top 5" }}
              empty={members.length === 0}
              emptyTitle="No members to profile"
              emptyHint="Profiles appear once members are active."
              height={380}
            >
              <Chart option={radarOption} height={380} onEvents={radarEvents} />
            </Panel>

            <Panel
              className="xl:col-span-3"
              icon={<Gauge size={16} />}
              title="Workspace capacity"
              subtitle="Seat utilisation and how much of the workspace term has elapsed."
              scope={{ kind: "team", label: "Team level" }}
              empty={!workspace}
              emptyTitle="No workspace record"
              emptyHint="Capacity appears once the workspace record is loaded."
              height={380}
            >
              <Chart option={gaugeOption} height={380} />
            </Panel>
          </div>

          {/* ================= 02 ENGAGEMENT & ACTIVITY ================= */}
          <SectionLabel
            step="02"
            title="Engagement and activity"
            note="How the team is using the workspace over time"
          />

          <div className="grid gap-4 xl:grid-cols-12">
            <Panel
              className="xl:col-span-8"
              icon={<Activity size={16} />}
              title="Activity time series"
              subtitle="Persisted workspace events on a true time axis. Drag the slider or use the zoom tool to inspect a window."
              scope={{ kind: "team", label: "Team level" }}
              empty={analytics.activityTimeline.length === 0}
              emptyTitle="No activity recorded"
              emptyHint="Events appear here as members create grants, calculations and documents."
              height={380}
              actions={
                <Segmented
                  value={timeMode}
                  onChange={setTimeMode}
                  options={[
                    { value: "daily", label: "Per day" },
                    { value: "cumulative", label: "Cumulative" },
                  ]}
                />
              }
            >
              <Chart option={timeSeriesOption} height={380} />
            </Panel>

            <Panel
              className="xl:col-span-4"
              icon={<Gauge size={16} />}
              title="Activity mix"
              subtitle="Share of persisted events by type."
              scope={{ kind: "team", label: "Team level" }}
              empty={analytics.activityByType.length === 0}
              emptyTitle="No activity types yet"
              emptyHint="The mix is calculated from persisted activity records."
              height={DONUT_H}
            >
              <Chart option={donutOption} height={DONUT_H} />
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-12">
            <Panel
              className="xl:col-span-8"
              icon={<CalendarDays size={16} />}
              title="Activity calendar"
              subtitle="One cell per day. Brighter cells are busier days, and empty cells are days with no events."
              scope={{ kind: "team", label: "Team level" }}
              empty={analytics.activityTimeline.length === 0}
              emptyTitle="No activity to plot"
              emptyHint="The calendar fills in from persisted activity records."
              height={270}
            >
              <Chart option={calendarOption} height={270} />
            </Panel>

            <Panel
              className="xl:col-span-4"
              icon={<Filter size={16} />}
              title="Adoption funnel"
              subtitle="How many members reach each stage of using the product."
              scope={{ kind: "team", label: "Team level" }}
              empty={summary.memberCount === 0}
              emptyTitle="No members yet"
              emptyHint="The funnel appears once members join the workspace."
              height={270}
            >
              <Chart option={funnelOption} height={270} />
            </Panel>
          </div>

          {/* ================= 03 RETURNS ================= */}
          <SectionLabel
            step="03"
            title="Returns and exit outcomes"
            note="What saved calculations say about value"
          />

          <div className="grid gap-4 xl:grid-cols-12">
            <Panel
              className="xl:col-span-7"
              icon={<TrendingUp size={16} />}
              title="ROI against return multiple"
              subtitle="One bubble per saved calculation. Bubble size is exit value. Brush to isolate a region."
              scope={{ kind: "filtered", label: "Follows member filter" }}
              empty={scopedCalcs.length === 0}
              emptyTitle={
                hasSelection
                  ? "No saved calculations for this selection"
                  : "No saved calculations"
              }
              emptyHint="Save an exit calculation to see its ROI and multiple plotted here."
              height={380}
            >
              <Chart
                option={scatterOption}
                height={380}
                onEvents={scatterEvents}
              />
            </Panel>

            <Panel
              className="xl:col-span-5"
              icon={<Wallet size={16} />}
              title="Exit-value distribution"
              subtitle="How saved exit values spread across bands."
              scope={{ kind: "filtered", label: "Follows member filter" }}
              empty={scopedCalcs.length === 0}
              emptyTitle="No exit values to bin"
              emptyHint="The distribution is built from saved calculations only."
              height={380}
              footer={distribution.stats}
            >
              <Chart option={distribution.option} height={380} />
            </Panel>
          </div>

          <Panel
            icon={<TrendingUp size={16} />}
            title="Exit-value concentration (Pareto)"
            subtitle="Members ranked by total saved exit value, with the cumulative share of the workspace total on the right axis."
            scope={{ kind: "source", label: "Click a bar to filter" }}
            empty={!paretoHasData}
            emptyTitle="No exit value recorded"
            emptyHint="Concentration appears once members save calculations with an exit value."
            height={340}
          >
            <Chart option={paretoOption} height={340} onEvents={paretoEvents} />
          </Panel>

          {/* ================= 04 EXPIRY RISK ================= */}
          <SectionLabel
            step="04"
            title="Expiry risk"
            note="Which grants are running out of time"
          />

          <div className="grid gap-4 xl:grid-cols-12">
            <Panel
              className="xl:col-span-5"
              icon={<CalendarClock size={16} />}
              title="Expiry risk monitor"
              subtitle="Soonest grants first. Bars are days to expiry and colour is the risk band."
              scope={{ kind: "filtered", label: "Member, company, band" }}
              empty={riskExpiry.length === 0}
              emptyTitle={
                scopedExpiry.length > 0
                  ? "No grants in this band"
                  : "No upcoming grant expiries"
              }
              emptyHint={
                scopedExpiry.length > 0
                  ? "Clear the band filter to see every grant in scope."
                  : "Grants with persisted expiry dates appear here."
              }
              height={360}
              footer={
                <BandChips
                  bands={bandSummary}
                  active={selectedBand}
                  onToggle={toggleBand}
                />
              }
            >
              <Chart
                option={riskOption}
                height={360}
                onEvents={riskEvents}
              />
            </Panel>

            <Panel
              className="xl:col-span-3"
              icon={<CalendarClock size={16} />}
              title="Expiry distribution"
              subtitle="Options expiring in each band."
              scope={{ kind: "source", label: "Click a bar to filter" }}
              empty={scopedExpiry.length === 0}
              emptyTitle="No expiry data"
              emptyHint="Bands fill in as grants with expiry dates are confirmed."
              height={360}
            >
              <Chart
                option={expiryDistOption}
                height={360}
                onEvents={expiryDistEvents}
              />
            </Panel>

            <Panel
              className="xl:col-span-4"
              icon={<Layers3 size={16} />}
              title="Equity at risk"
              subtitle="Expiring options by company, then by member. Click a ring segment to filter."
              scope={{ kind: "source", label: "Company and member" }}
              empty={memberScopedExpiry.length === 0}
              emptyTitle="No expiring equity"
              emptyHint="Appears once grants with expiry dates are confirmed."
              height={360}
            >
              <Chart
                option={sunburstOption}
                height={360}
                onEvents={sunburstEvents}
              />
            </Panel>
          </div>

          <Panel
            icon={<CalendarClock size={16} />}
            title="Expiry runway"
            subtitle="Every grant placed on the calendar by expiry date. Height is option count and colour is the risk band."
            scope={{ kind: "filtered", label: "Member, company, band" }}
            empty={riskExpiry.length === 0}
            emptyTitle={
              scopedExpiry.length > 0
                ? "No grants in this band"
                : "No upcoming grant expiries"
            }
            emptyHint={
              scopedExpiry.length > 0
                ? "Clear the band filter to see every grant in scope."
                : "Grants with persisted expiry dates appear here."
            }
            height={320}
          >
            <Chart option={runwayOption} height={320} onEvents={runwayEvents} />
          </Panel>

          {/* ================= 05 DETAIL ================= */}
          <SectionLabel
            step="05"
            title="Detail"
            note="Sortable, searchable and exportable"
          />

          <RankedTable
            members={ranked}
            selected={selected}
            onToggle={toggleMember}
            summary={summary}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* PANELS & CHROME                                                             */
/* -------------------------------------------------------------------------- */

type ScopeKind = "source" | "filtered" | "team";

function SectionLabel({
  step,
  title,
  note,
}: {
  step: string;
  title: string;
  note: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-4">
      <span className="rounded-md border border-sky-300/20 bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.16em] text-sky-300">
        {step}
      </span>
      <h3 className="text-sm font-bold tracking-tight text-white">{title}</h3>
      <span className="hidden text-xs text-slate-500 md:inline">{note}</span>
      <span
        aria-hidden
        className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent"
      />
    </div>
  );
}

function ScopeTag({ kind, label }: { kind: ScopeKind; label: string }) {
  const style =
    kind === "source"
      ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
      : kind === "filtered"
        ? "border-sky-300/25 bg-sky-300/10 text-sky-200"
        : "border-white/10 bg-white/[0.04] text-slate-400";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style}`}
    >
      {label}
    </span>
  );
}

function Panel({
  icon,
  title,
  subtitle,
  scope,
  empty,
  emptyTitle,
  emptyHint,
  height,
  actions,
  footer,
  className = "",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  scope: { kind: ScopeKind; label: string };
  empty: boolean;
  emptyTitle: string;
  emptyHint: string;
  height: number;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1224] ${className}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-400/10 text-sky-300">
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="mt-0.5 text-xs leading-5 text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <ScopeTag kind={scope.kind} label={scope.label} />
          {actions}
        </div>
      </div>

      <div className="min-w-0 flex-1 px-3 py-3 sm:px-4">
        {empty ? (
          <EmptyState height={height} title={emptyTitle} hint={emptyHint} />
        ) : (
          children
        )}
      </div>

      {footer && (
        <div className="border-t border-white/[0.07] px-5 py-3">{footer}</div>
      )}
    </section>
  );
}

function EmptyState({
  height,
  title,
  hint,
}: {
  height: number;
  title: string;
  hint: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 text-center"
      style={{
        minHeight: height,
        backgroundImage:
          "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Inbox size={22} className="text-slate-500" />
      <p className="mt-3 text-sm font-semibold text-slate-200">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{hint}</p>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  caption,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
  tone?: "neutral" | "positive" | "negative" | "warning" | "exposure";
}) {
  const accent = {
    neutral: "#38bdf8",
    positive: "#34d399",
    negative: "#fb7185",
    warning: "#fbbf24",
    exposure: "#a78bfa",
  }[tone];

  return (
    <div className="relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#0b1224] px-3.5 py-3">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-1.5 text-slate-400">
        <span style={{ color: accent }}>{icon}</span>
        <p className="truncate text-[11px] font-semibold">{label}</p>
      </div>
      <p className="mt-2 truncate text-xl font-bold tabular-nums text-white">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500">{caption}</p>
    </div>
  );
}

function FilterBar({
  members,
  selected,
  company,
  band,
  hasFilters,
  onAddMember,
  onClearCompany,
  onClearBand,
  onClearAll,
}: {
  members: ScoredMember[];
  selected: Set<string>;
  company: string | null;
  band: BandKey | null;
  hasFilters: boolean;
  onAddMember: (id: string) => void;
  onClearCompany: () => void;
  onClearBand: () => void;
  onClearAll: () => void;
}) {
  const unselected = members.filter((member) => !selected.has(member.id));
  const bandMeta = BANDS.find((item) => item.key === band);

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#080d1b]/90 px-5 py-3 backdrop-blur md:px-8 lg:px-10">
      <span className="inline-flex items-center gap-1.5 pr-1 text-xs font-semibold text-slate-400">
        <Filter size={13} />
        Filters
      </span>

      {!hasFilters && (
        <span className="text-xs text-slate-500">
          None applied. Everything shows the full workspace.
        </span>
      )}

      {members
        .filter((member) => selected.has(member.id))
        .map((member) => (
          <FilterChip
            key={member.id}
            label={member.name}
            onClear={() => onAddMember(member.id)}
          />
        ))}

      {company && <FilterChip label={`Company: ${company}`} onClear={onClearCompany} />}

      {bandMeta && (
        <FilterChip
          label={`Expiry: ${bandMeta.label}`}
          color={bandMeta.color}
          onClear={onClearBand}
        />
      )}

      {unselected.length > 0 && (
        <select
          aria-label="Add a member filter"
          value=""
          onChange={(event) => {
            if (event.target.value) onAddMember(event.target.value);
          }}
          className="ml-auto h-8 max-w-[200px] rounded-lg border border-white/10 bg-white/[0.05] px-2 text-xs font-semibold text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <option value="">Add member</option>
          {unselected.map((member) => (
            <option key={member.id} value={member.id} className="text-slate-900">
              {member.name}
            </option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className={`${unselected.length > 0 ? "" : "ml-auto"} rounded-lg px-2.5 py-1.5 text-xs font-bold text-sky-300 transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400`}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

function FilterChip({
  label,
  color = T.amber,
  onClear,
}: {
  label: string;
  color?: string;
  onClear: () => void;
}) {
  return (
    <span
      className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border bg-white/[0.04] py-1 pl-2.5 pr-1.5 text-xs font-semibold text-slate-100"
      style={{ borderColor: `${color}66` }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: color }}
      />
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={`Remove filter ${label}`}
        onClick={onClear}
        className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
      >
        <X size={11} />
      </button>
    </span>
  );
}

function Segmented<V extends string>({
  value,
  onChange,
  options,
}: {
  value: V;
  onChange: (value: V) => void;
  options: { value: V; label: string }[];
}) {
  return (
    <div
      role="group"
      className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
            value === option.value
              ? "bg-white text-slate-950"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function HeatLegend() {
  const ramps: { label: string; from: string; to: string }[] = [
    { label: "Index", from: "#0f3a3f", to: "#2dd4bf" },
    { label: "Volume", from: "#15264d", to: "#3b82f6" },
    { label: "Returns (gain)", from: "#12392f", to: "#10b981" },
    { label: "Returns (loss)", from: "#4a1d26", to: "#f43f5e" },
    { label: "Exposure", from: "#2a1a4d", to: "#8b5cf6" },
    { label: "Expiry risk", from: "#4a2a0f", to: "#f97316" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {ramps.map((ramp) => (
        <div key={ramp.label} className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2 w-14 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${ramp.from}, ${ramp.to})`,
            }}
          />
          <span className="text-[11px] text-slate-400">{ramp.label}</span>
        </div>
      ))}
      <span className="text-[11px] text-slate-500">
        A dash means zero. Amber outline marks selected members.
      </span>
    </div>
  );
}

function BandChips({
  bands,
  active,
  onToggle,
}: {
  bands: ((typeof BANDS)[number] & { grants: number; options: number })[];
  active: BandKey | null;
  onToggle: (key: BandKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {bands.map((band) => {
        const isActive = active === band.key;
        return (
          <button
            key={band.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(band.key)}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
              isActive
                ? "bg-white/[0.10]"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
            } ${active && !isActive ? "opacity-50" : ""}`}
            style={isActive ? { borderColor: band.color } : undefined}
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: band.color }}
            />
            <span>
              <span className="block text-[11px] font-semibold text-slate-200">
                {band.label}
              </span>
              <span className="block text-[10px] tabular-nums text-slate-500">
                {formatNumber(band.grants)} grants, {formatNumber(band.options)}{" "}
                options
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Chart({
  option,
  height,
  onEvents,
}: {
  option: EChartsOption;
  height: number;
  onEvents?: ChartEvents;
}) {
  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      notMerge
      lazyUpdate
      onEvents={onEvents}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* RANKED TABLE                                                                */
/* -------------------------------------------------------------------------- */

function RankedTable({
  members,
  selected,
  onToggle,
  summary,
}: {
  members: ScoredMember[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  summary: Summary;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("index");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState("");

  const maxes = useMemo(() => {
    const max = (pick: (m: ScoredMember) => number) =>
      members.reduce((value, m) => Math.max(value, pick(m) || 0), 0);
    return {
      options: max((m) => m.options),
      exerciseCost: max((m) => m.exerciseCost),
      totalExitValue: max((m) => m.totalExitValue),
      highestExitValue: max((m) => m.highestExitValue),
      activities: max((m) => m.activities),
    };
  }, [members]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? members.filter(
          (m) =>
            m.name.toLowerCase().includes(needle) ||
            m.email.toLowerCase().includes(needle)
        )
      : members;

    const factor = dir === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (sortKey === "name") return factor * a.name.localeCompare(b.name);
      if (sortKey === "addedAt")
        return factor * (Date.parse(a.addedAt) - Date.parse(b.addedAt) || 0);
      return factor * ((a[sortKey] as number) - (b[sortKey] as number));
    });
  }, [members, query, sortKey, dir]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setDir((previous) => (previous === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir(key === "name" ? "asc" : "desc");
    }
  };

  const totals = (list: ScoredMember[]) => {
    const sum = (pick: (m: ScoredMember) => number) =>
      list.reduce((total, m) => total + (pick(m) || 0), 0);
    const calcs = sum((m) => m.calculations);
    const weighted = (pick: (m: ScoredMember) => number) =>
      calcs > 0
        ? list.reduce((total, m) => total + (pick(m) || 0) * m.calculations, 0) /
          calcs
        : 0;

    return {
      options: sum((m) => m.options),
      grants: sum((m) => m.confirmedGrants),
      exercise: sum((m) => m.exerciseCost),
      calcs,
      exit: sum((m) => m.totalExitValue),
      best: list.reduce((max, m) => Math.max(max, m.highestExitValue || 0), 0),
      multiple: weighted((m) => m.averageReturnMultiple),
      roi: weighted((m) => m.averageRoiPercentage),
      activity: sum((m) => m.activities),
      documents: sum((m) => m.documents),
      expiring: sum((m) => m.expiringWithin365Days),
    };
  };

  const selectedList = members.filter((m) => selected.has(m.id));
  const selectedTotals = selectedList.length > 0 ? totals(selectedList) : null;
  const workspaceTotals = totals(members);

  const columns: {
    key: SortKey;
    label: string;
    align: "left" | "right";
  }[] = [
    { key: "name", label: "Member", align: "left" },
    { key: "index", label: "Engagement index", align: "left" },
    { key: "options", label: "Options", align: "right" },
    { key: "confirmedGrants", label: "Grants", align: "right" },
    { key: "exerciseCost", label: "Exercise cost", align: "right" },
    { key: "calculations", label: "Calcs", align: "right" },
    { key: "totalExitValue", label: "Exit value", align: "right" },
    { key: "highestExitValue", label: "Best exit", align: "right" },
    { key: "averageReturnMultiple", label: "Avg multiple", align: "right" },
    { key: "averageRoiPercentage", label: "Avg ROI", align: "right" },
    { key: "activities", label: "Activity", align: "right" },
    { key: "documents", label: "Docs", align: "right" },
    { key: "expiringWithin365Days", label: "Expiring in 1 yr", align: "right" },
    { key: "addedAt", label: "Joined", align: "right" },
  ];

  function exportCsv() {
    const header = [
      "Rank",
      "Member",
      "Email",
      "Engagement index",
      "Options",
      "Grants",
      "Exercise cost",
      "Calculations",
      "Total exit value",
      "Best exit",
      "Avg return multiple",
      "Avg ROI %",
      "Activity",
      "Documents",
      "Expiring within 365 days",
      "Joined",
    ];

    const quote = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;

    const lines = rows.map((m, index) =>
      [
        index + 1,
        m.name,
        m.email,
        m.index.toFixed(1),
        m.options,
        m.confirmedGrants,
        m.exerciseCost,
        m.calculations,
        m.totalExitValue,
        m.highestExitValue,
        m.averageReturnMultiple,
        m.averageRoiPercentage,
        m.activities,
        m.documents,
        m.expiringWithin365Days,
        m.addedAt,
      ]
        .map(quote)
        .join(",")
    );

    const blob = new Blob([[header.map(quote).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "team-intelligence.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1224]">
      <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-400/10 text-sky-300">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Ranked team intelligence
            </h3>
            <p className="mt-0.5 text-xs leading-5 text-slate-400">
              The engagement index is each member&apos;s average share of the
              workspace peak across options, grants, calculations, exit value,
              activity and documents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScopeTag kind="source" label="Click a row to filter" />

          <label className="relative">
            <span className="sr-only">Search members</span>
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members"
              className="h-8 w-44 rounded-lg border border-white/10 bg-white/[0.05] pl-8 pr-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-sky-400"
            />
          </label>

          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.10] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="p-5">
          <EmptyState
            height={200}
            title="No members in this workspace"
            hint="The ranking appears once members are active."
          />
        </div>
      ) : (
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[1280px] border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-[#0d1530]">
              <tr className="border-b border-white/10">
                <th className="w-10 px-3 py-3 text-right font-semibold text-slate-500">
                  #
                </th>
                {columns.map((column) => {
                  const active = sortKey === column.key;
                  return (
                    <th
                      key={column.key}
                      aria-sort={
                        active ? (dir === "asc" ? "ascending" : "descending") : "none"
                      }
                      className={`px-3 py-3 font-semibold ${
                        column.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSort(column.key)}
                        className={`inline-flex items-center gap-1 whitespace-nowrap transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
                          active ? "text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {column.label}
                        {active ? (
                          dir === "asc" ? (
                            <ArrowUp size={11} />
                          ) : (
                            <ArrowDown size={11} />
                          )
                        ) : (
                          <ArrowUpDown size={11} className="opacity-40" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No members match &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              )}

              {rows.map((member, index) => {
                const isSelected = selected.has(member.id);
                const dim = selected.size > 0 && !isSelected;
                const roiTone =
                  member.calculations === 0
                    ? "text-slate-500"
                    : member.averageRoiPercentage > 0
                      ? "text-emerald-300"
                      : member.averageRoiPercentage < 0
                        ? "text-rose-300"
                        : "text-slate-300";

                return (
                  <tr
                    key={member.id}
                    onClick={() => onToggle(member.id)}
                    className={`cursor-pointer border-b border-white/[0.05] transition-colors hover:bg-white/[0.04] ${
                      isSelected ? "bg-amber-300/[0.07]" : ""
                    } ${dim ? "opacity-45" : ""}`}
                  >
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className="h-6 w-0.5 rounded-full"
                          style={{
                            background: isSelected ? T.amber : "transparent",
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-white">
                            {member.name}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <IndexCell value={member.index} />
                    </td>

                    <td className="px-3 py-2.5">
                      <BarCell
                        value={member.options}
                        max={maxes.options}
                        color="#3b82f6"
                        label={formatNumber(member.options)}
                      />
                    </td>

                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-200">
                      {formatNumber(member.confirmedGrants)}
                    </td>

                    <td className="px-3 py-2.5">
                      <BarCell
                        value={member.exerciseCost}
                        max={maxes.exerciseCost}
                        color="#8b5cf6"
                        label={formatCompactCurrency(member.exerciseCost)}
                      />
                    </td>

                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-200">
                      {formatNumber(member.calculations)}
                    </td>

                    <td className="px-3 py-2.5">
                      <BarCell
                        value={member.totalExitValue}
                        max={maxes.totalExitValue}
                        color="#10b981"
                        label={formatCompactCurrency(member.totalExitValue)}
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <BarCell
                        value={member.highestExitValue}
                        max={maxes.highestExitValue}
                        color="#10b981"
                        label={formatCompactCurrency(member.highestExitValue)}
                      />
                    </td>

                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-200">
                      {member.calculations > 0
                        ? formatMultiple(member.averageReturnMultiple)
                        : "-"}
                    </td>

                    <td
                      className={`px-3 py-2.5 text-right font-semibold tabular-nums ${roiTone}`}
                    >
                      {member.calculations > 0
                        ? formatPercentage(member.averageRoiPercentage)
                        : "-"}
                    </td>

                    <td className="px-3 py-2.5">
                      <BarCell
                        value={member.activities}
                        max={maxes.activities}
                        color="#22d3ee"
                        label={formatNumber(member.activities)}
                      />
                    </td>

                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-200">
                      {formatNumber(member.documents)}
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`inline-flex min-w-[28px] justify-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                          member.expiringWithin365Days === 0
                            ? "text-slate-500"
                            : member.expiringWithin365Days >= 3
                              ? "bg-orange-400/15 text-orange-300"
                              : "bg-amber-300/15 text-amber-200"
                        }`}
                      >
                        {formatNumber(member.expiringWithin365Days)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-400">
                      {formatDate(member.addedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="sticky bottom-0 bg-[#0d1530]">
              {selectedTotals && (
                <TotalsRow
                  label={`Selection (${selectedList.length})`}
                  totals={selectedTotals}
                  accent
                />
              )}
              <TotalsRow
                label={`Workspace (${members.length})`}
                totals={{
                  ...workspaceTotals,
                  multiple: summary.averageReturnMultiple,
                  roi: summary.averageRoi,
                }}
                hasCalcs={summary.totalCalculations > 0}
              />
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

function TotalsRow({
  label,
  totals,
  accent = false,
  hasCalcs,
}: {
  label: string;
  totals: {
    options: number;
    grants: number;
    exercise: number;
    calcs: number;
    exit: number;
    best: number;
    multiple: number;
    roi: number;
    activity: number;
    documents: number;
    expiring: number;
  };
  accent?: boolean;
  hasCalcs?: boolean;
}) {
  const showRatios = hasCalcs ?? totals.calcs > 0;

  return (
    <tr
      className={`border-t border-white/10 font-semibold tabular-nums ${
        accent ? "text-amber-100" : "text-slate-200"
      }`}
    >
      <td />
      <td className="px-3 py-2.5 text-left">{label}</td>
      <td />
      <td className="px-3 py-2.5 text-right">{formatNumber(totals.options)}</td>
      <td className="px-3 py-2.5 text-right">{formatNumber(totals.grants)}</td>
      <td className="px-3 py-2.5 text-right">
        {formatCompactCurrency(totals.exercise)}
      </td>
      <td className="px-3 py-2.5 text-right">{formatNumber(totals.calcs)}</td>
      <td className="px-3 py-2.5 text-right">
        {formatCompactCurrency(totals.exit)}
      </td>
      <td className="px-3 py-2.5 text-right">
        {formatCompactCurrency(totals.best)}
      </td>
      <td className="px-3 py-2.5 text-right">
        {showRatios ? formatMultiple(totals.multiple) : "-"}
      </td>
      <td className="px-3 py-2.5 text-right">
        {showRatios ? formatPercentage(totals.roi) : "-"}
      </td>
      <td className="px-3 py-2.5 text-right">{formatNumber(totals.activity)}</td>
      <td className="px-3 py-2.5 text-right">{formatNumber(totals.documents)}</td>
      <td className="px-3 py-2.5 text-right">{formatNumber(totals.expiring)}</td>
      <td />
    </tr>
  );
}

function BarCell({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const width = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="relative flex h-7 items-center justify-end overflow-hidden rounded-md px-2">
      <span
        aria-hidden
        className="absolute inset-y-1 left-0 rounded-sm"
        style={{ width: `${width}%`, background: color, opacity: 0.22 }}
      />
      <span
        className={`relative tabular-nums ${
          value > 0 ? "font-semibold text-slate-100" : "text-slate-500"
        }`}
      >
        {value > 0 ? label : "-"}
      </span>
    </div>
  );
}

function IndexCell({ value }: { value: number }) {
  const color = value >= 66 ? T.emerald : value >= 33 ? T.sky : T.slate;

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(2, value)}%`, background: color }}
        />
      </div>
      <span className="w-8 text-right font-bold tabular-nums text-slate-100">
        {value.toFixed(0)}
      </span>
    </div>
  );
}

function AnalyticsLoading() {
  return (
    <section className="p-4 md:p-6 lg:p-7">
      <div className="animate-pulse space-y-4 rounded-[28px] border border-slate-800 bg-[#080d1b] p-4 md:p-7">
        <div className="h-28 rounded-2xl bg-white/[0.04]" />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-20 rounded-xl bg-white/[0.04]" />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="h-[440px] rounded-2xl bg-white/[0.04] xl:col-span-8" />
          <div className="h-[440px] rounded-2xl bg-white/[0.04] xl:col-span-4" />
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="h-[360px] rounded-2xl bg-white/[0.04] xl:col-span-8" />
          <div className="h-[360px] rounded-2xl bg-white/[0.04] xl:col-span-4" />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* CHART BUILDERS                                                              */
/* -------------------------------------------------------------------------- */

const asOption = (option: unknown) => option as EChartsOption;

function baseOption(animate: boolean): EChartsOption {
  return {
    backgroundColor: "transparent",
    textStyle: { color: T.text, fontFamily: "inherit" },
    animation: animate,
    animationDuration: 900,
    animationEasing: "cubicOut",
    animationDurationUpdate: 450,
    animationEasingUpdate: "cubicInOut",
    aria: { enabled: true },
  };
}

const AXIS_LABEL = { color: T.muted, fontSize: 10 };
const SPLIT_LINE = { lineStyle: { color: T.grid } };

const TOOLBOX_STYLE = {
  iconStyle: { borderColor: T.muted },
  emphasis: { iconStyle: { borderColor: "#ffffff" } },
};

/* ----- 1. member performance heatmap -------------------------------------- */

function buildHeatmap(
  rows: ScoredMember[],
  selected: Set<string>,
  animate: boolean
): EChartsOption {
  const hasSelection = selected.size > 0;

  const maxes = HEAT_METRICS.map((metric) =>
    rows.reduce(
      (max, row) => Math.max(max, Math.abs(Number(row[metric.key]) || 0)),
      0
    )
  );

  const data = rows.flatMap((row, y) =>
    HEAT_METRICS.map((metric, x) => {
      const raw = Number(row[metric.key]) || 0;
      const signed = maxes[x] > 0 ? raw / maxes[x] : 0;
      const isSelected = selected.has(row.id);

      return {
        value: [x, y, raw, signed],
        memberId: row.id,
        label: { color: raw === 0 ? "#475569" : "#f8fafc" },
        itemStyle: {
          color: heatColor(metric.kind, signed),
          borderColor: isSelected ? T.amber : T.canvas,
          borderWidth: 2,
          borderRadius: 4,
          opacity: hasSelection && !isSelected ? 0.3 : 1,
        },
      };
    })
  );

  const nameById = new Map(rows.map((row) => [row.id, row.name]));
  const showLabels = rows.length <= 14;
  const windowRows = 12;
  const needsZoom = rows.length > windowRows;

  return {
    ...baseOption(animate),

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as { value: number[] };
        const [x, y, raw, signed] = item.value;
        const metric = HEAT_METRICS[x];
        const row = rows[y];
        if (!metric || !row) return "";

        return tipCard(
          row.name,
          [
            { label: metric.label, value: metric.format(raw) },
            {
              label: "Against column peak",
              value: `${Math.round(Math.abs(signed) * 100)}%`,
            },
            { label: "Engagement index", value: row.index.toFixed(0) },
          ],
          row.email
        );
      },
    },

    grid: {
      left: 8,
      right: needsZoom ? 34 : 12,
      top: 44,
      bottom: 8,
      containLabel: true,
    },

    xAxis: {
      type: "category",
      position: "top",
      data: HEAT_METRICS.map((metric) => metric.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { ...AXIS_LABEL, interval: 0, fontWeight: 600 },
      splitLine: { show: false },
    },

    yAxis: {
      type: "category",
      inverse: true,
      data: rows.map((row) => row.id),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 11,
        width: 120,
        overflow: "truncate",
        formatter: (id: string) => nameById.get(id) ?? id,
        color: (value?: string | number) =>
          typeof value === "string" && selected.has(value) ? T.amber : T.text,
      },
    },

    dataZoom: needsZoom
      ? [
          {
            type: "slider",
            yAxisIndex: 0,
            right: 4,
            width: 14,
            start: 0,
            end: (windowRows / rows.length) * 100,
            brushSelect: false,
            borderColor: "transparent",
            backgroundColor: "rgba(148,163,184,0.08)",
            fillerColor: "rgba(56,189,248,0.25)",
            handleSize: 14,
            showDetail: false,
          },
          { type: "inside", yAxisIndex: 0, zoomOnMouseWheel: false, moveOnMouseWheel: true },
        ]
      : undefined,

    series: [
      {
        type: "heatmap",
        data,
        label: {
          show: showLabels,
          color: "#f8fafc",
          fontSize: 9,
          fontWeight: 600,
          formatter: (params: unknown) => {
            const item = params as { value: number[] };
            const [x, , raw] = item.value;
            return raw === 0 ? "-" : HEAT_METRICS[x].format(raw);
          },
        },
        emphasis: {
          itemStyle: { borderColor: "#ffffff", borderWidth: 2 },
        },
      },
    ],
  };
}

function heatColor(kind: HeatKind, signed: number) {
  // Zero cells stay visibly part of the grid instead of vanishing into the canvas.
  if (signed === 0) return "#141d3b";

  const t = 0.15 + 0.85 * Math.min(1, Math.abs(signed));

  if (kind === "return") {
    return signed > 0 ? mix("#12392f", "#10b981", t) : mix("#4a1d26", "#f43f5e", t);
  }
  if (kind === "exposure") return mix("#2a1a4d", "#8b5cf6", t);
  if (kind === "risk") return mix("#4a2a0f", "#f97316", t);
  if (kind === "index") return mix("#0f3a3f", "#2dd4bf", t);
  return mix("#15264d", "#3b82f6", t);
}

/* ----- 2. company equity treemap ------------------------------------------ */

function buildTreemap(
  companies: CompanyRow[],
  selectedCompany: string | null,
  animate: boolean
): EChartsOption {
  const sorted = [...companies].sort((a, b) => b.options - a.options);
  const total = sorted.reduce((sum, item) => sum + item.options, 0);
  const peak = sorted[0]?.options ?? 0;

  return {
    ...baseOption(animate),

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as { name?: string; value?: number[] | number };
        const values = Array.isArray(item.value) ? item.value : [Number(item.value ?? 0)];
        const options = values[0] ?? 0;

        return tipCard(item.name ?? "Company", [
          { label: "Options", value: formatNumber(options) },
          {
            label: "Share of team options",
            value: total > 0 ? formatPercentage((options / total) * 100) : "0%",
          },
          { label: "Grants", value: formatNumber(values[1] ?? 0) },
          { label: "Members", value: formatNumber(values[2] ?? 0) },
        ]);
      },
    },

    series: [
      {
        type: "treemap",
        top: 8,
        bottom: 8,
        left: 8,
        right: 8,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        squareRatio: 0.9,
        label: {
          show: true,
          color: "#f8fafc",
          fontWeight: 700,
          fontSize: 12,
          overflow: "truncate",
          formatter: (params: unknown) => {
            const item = params as { name?: string; value?: number[] | number };
            const options = Array.isArray(item.value)
              ? item.value[0]
              : Number(item.value ?? 0);
            return `{name|${item.name ?? ""}}\n{val|${formatNumber(options ?? 0)} options}`;
          },
          rich: {
            name: { color: "#f8fafc", fontWeight: 700, fontSize: 12, lineHeight: 18 },
            val: { color: "rgba(226,232,240,0.75)", fontSize: 10, lineHeight: 14 },
          },
          position: "insideTopLeft",
          padding: [8, 10],
        },
        itemStyle: {
          borderColor: T.canvas,
          borderWidth: 3,
          gapWidth: 3,
          borderRadius: 8,
        },
        data: sorted.map((item) => {
          const intensity = peak > 0 ? item.options / peak : 0;
          const isSelected = selectedCompany === item.company;
          const dim = selectedCompany !== null && !isSelected;

          return {
            name: item.company,
            value: [item.options, item.grants, item.members],
            itemStyle: {
              color: mix("#17306b", "#2b8fd6", 0.2 + 0.8 * intensity),
              borderColor: isSelected ? T.amber : T.canvas,
              borderWidth: 3,
              opacity: dim ? 0.4 : 1,
            },
          };
        }),
      },
    ],
  };
}

/* ----- 3. clustered member comparison ------------------------------------- */

function buildClustered(
  members: ScoredMember[],
  selected: Set<string>,
  animate: boolean
): EChartsOption {
  const rows = [...members].sort(
    (a, b) => b.options - a.options || b.calculations - a.calculations
  );
  const nameById = new Map(rows.map((row) => [row.id, row.name]));
  const hasSelection = selected.size > 0;
  const windowSize = 8;
  const needsZoom = rows.length > windowSize;

  const defs: {
    name: string;
    pick: (m: ScoredMember) => number;
    color: string;
    axis: 0 | 1;
  }[] = [
    { name: "Options", pick: (m) => m.options, color: "#3b82f6", axis: 0 },
    { name: "Grants", pick: (m) => m.confirmedGrants, color: "#22d3ee", axis: 1 },
    { name: "Calculations", pick: (m) => m.calculations, color: "#a78bfa", axis: 1 },
    { name: "Activity", pick: (m) => m.activities, color: "#34d399", axis: 1 },
    { name: "Documents", pick: (m) => m.documents, color: "#94a3b8", axis: 1 },
  ];

  return {
    ...baseOption(animate),

    legend: {
      top: 0,
      itemWidth: 10,
      itemHeight: 10,
      icon: "roundRect",
      textStyle: { color: T.muted, fontSize: 11 },
      inactiveColor: "#334155",
    },

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(148,163,184,0.08)" } },
      formatter: (params: unknown) => {
        const list = params as { dataIndex: number; seriesName: string; value: number; color: string }[];
        if (!list.length) return "";
        const row = rows[list[0].dataIndex];
        if (!row) return "";

        return tipCard(
          row.name,
          list.map((item) => ({
            label: item.seriesName,
            value: formatNumber(Number(item.value)),
            color: item.color,
          })),
          row.email
        );
      },
    },

    grid: {
      left: 8,
      right: 8,
      top: 40,
      bottom: needsZoom ? 56 : 12,
      containLabel: true,
    },

    xAxis: {
      type: "category",
      data: rows.map((row) => row.id),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: T.grid } },
      axisLabel: {
        ...AXIS_LABEL,
        interval: 0,
        width: 74,
        overflow: "truncate",
        rotate: rows.length > 6 ? 24 : 0,
        formatter: (id: string) => nameById.get(id) ?? id,
        color: (value?: string | number) =>
          typeof value === "string" && selected.has(value) ? T.amber : T.muted,
      },
    },

    yAxis: [
      {
        type: "value",
        name: "Options",
        nameTextStyle: { color: T.faint, fontSize: 10, align: "left" },
        axisLabel: { ...AXIS_LABEL, formatter: (v: number) => formatCompactNumber(v) },
        splitLine: SPLIT_LINE,
      },
      {
        type: "value",
        name: "Count",
        nameTextStyle: { color: T.faint, fontSize: 10, align: "right" },
        minInterval: 1,
        axisLabel: AXIS_LABEL,
        splitLine: { show: false },
      },
    ],

    dataZoom: needsZoom
      ? [
          {
            type: "slider",
            xAxisIndex: 0,
            bottom: 6,
            height: 16,
            start: 0,
            end: (windowSize / rows.length) * 100,
            borderColor: "transparent",
            backgroundColor: "rgba(148,163,184,0.08)",
            fillerColor: "rgba(56,189,248,0.25)",
            showDetail: false,
          },
          { type: "inside", xAxisIndex: 0 },
        ]
      : undefined,

    series: defs.map((def) => ({
      name: def.name,
      type: "bar" as const,
      yAxisIndex: def.axis,
      barMaxWidth: 16,
      barGap: "10%",
      itemStyle: { color: def.color, borderRadius: [4, 4, 0, 0] },
      emphasis: { focus: "series" as const },
      data: rows.map((row) => {
        const isSelected = selected.has(row.id);
        return {
          value: def.pick(row),
          memberId: row.id,
          itemStyle: {
            opacity: hasSelection && !isSelected ? 0.3 : 1,
            borderColor: isSelected ? T.amber : "transparent",
            borderWidth: isSelected ? 1.5 : 0,
          },
        };
      }),
    })),
  };
}

/* ----- 4. activity time series (true time axis) --------------------------- */

function buildTimeSeries(
  rows: ActivityTimelineRow[],
  mode: "daily" | "cumulative",
  animate: boolean
): EChartsOption {
  const sorted = [...rows].sort((a, b) => {
    const ta = Date.parse(a.date);
    const tb = Date.parse(b.date);
    if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
    return ta - tb;
  });

  const counts = sorted.map((row) => row.count);
  let running = 0;
  const cumulative = counts.map((value) => (running += value));
  const total = counts.reduce((sum, value) => sum + value, 0);
  const average = counts.length > 0 ? total / counts.length : 0;
  const values = mode === "daily" ? counts : cumulative;
  const movingAverage: (number | null)[] = counts.map((_, index) => {
    if (index < 2) return null;
    return (counts[index] + counts[index - 1] + counts[index - 2]) / 3;
  });
  const showSlider = sorted.length > 10;

  const pair = (list: (number | null)[]) =>
    sorted.map((row, index) => [row.date, list[index]]);

  return asOption({
    ...baseOption(animate),

    legend: {
      top: 0,
      itemWidth: 14,
      itemHeight: 3,
      textStyle: { color: T.muted, fontSize: 11 },
    },

    toolbox: {
      ...TOOLBOX_STYLE,
      right: 4,
      top: -4,
      itemSize: 13,
      feature: {
        dataZoom: { yAxisIndex: "none", title: { zoom: "Zoom", back: "Undo zoom" } },
        restore: { title: "Reset" },
      },
    },

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: { backgroundColor: "#1e293b" },
        lineStyle: { color: "rgba(148,163,184,0.4)" },
      },
      formatter: (params: unknown) => {
        const list = params as {
          dataIndex: number;
          seriesName: string;
          value: [string, number | null];
          color: string;
        }[];
        if (!list.length) return "";
        const index = list[0].dataIndex;

        const rowsOut = list
          .filter((item) => item.value?.[1] !== null && item.value?.[1] !== undefined)
          .map((item) => ({
            label: item.seriesName,
            value:
              item.seriesName === "3-point average"
                ? Number(item.value[1]).toFixed(1)
                : formatNumber(Number(item.value[1])),
            color: item.color,
          }));

        if (total > 0) {
          rowsOut.push({
            label: "Share of all events",
            value: formatPercentage((counts[index] / total) * 100),
            color: "",
          });
        }

        return tipCard(formatDate(sorted[index]?.date ?? ""), rowsOut);
      },
    },

    grid: {
      left: 8,
      right: 24,
      top: 44,
      bottom: showSlider ? 62 : 28,
      containLabel: true,
    },

    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: T.grid } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        ...AXIS_LABEL,
        hideOverlap: true,
        formatter: (value: number | string) => shortDate(Number(value)),
      },
    },

    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: AXIS_LABEL,
      splitLine: SPLIT_LINE,
    },

    dataZoom: [
      { type: "inside", xAxisIndex: 0 },
      ...(showSlider
        ? [
            {
              type: "slider",
              xAxisIndex: 0,
              bottom: 8,
              height: 20,
              borderColor: "transparent",
              backgroundColor: "rgba(148,163,184,0.08)",
              fillerColor: "rgba(56,189,248,0.22)",
              dataBackground: {
                lineStyle: { color: "rgba(56,189,248,0.5)" },
                areaStyle: { color: "rgba(56,189,248,0.12)" },
              },
              textStyle: { color: T.muted, fontSize: 10 },
            },
          ]
        : []),
    ],

    series: [
      {
        name: mode === "daily" ? "Events" : "Cumulative events",
        type: "line",
        smooth: 0.25,
        data: pair(values),
        symbol: "circle",
        symbolSize: 7,
        showSymbol: sorted.length <= 60,
        lineStyle: { width: 2.5, color: T.sky },
        itemStyle: { color: T.sky, borderColor: T.canvas, borderWidth: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(56,189,248,0.32)" },
              { offset: 1, color: "rgba(56,189,248,0.01)" },
            ],
          },
        },
        markPoint:
          mode === "daily" && counts.length > 0
            ? {
                symbol: "pin",
                symbolSize: 40,
                itemStyle: { color: T.amber },
                label: { color: "#0f172a", fontSize: 10, fontWeight: 700 },
                data: [{ type: "max", name: "Peak" }],
              }
            : undefined,
        markLine:
          mode === "daily" && counts.length > 1
            ? {
                silent: true,
                symbol: "none",
                lineStyle: { color: "rgba(251,191,36,0.55)", type: "dashed" },
                label: {
                  color: T.amber,
                  fontSize: 10,
                  formatter: `Average ${average.toFixed(1)}`,
                  position: "insideEndTop",
                },
                data: [{ yAxis: average }],
              }
            : undefined,
      },
      ...(mode === "daily" && counts.length >= 3
        ? [
            {
              name: "3-point average",
              type: "line",
              smooth: 0.3,
              data: pair(movingAverage),
              showSymbol: false,
              lineStyle: { width: 2, color: T.violet, type: "solid" },
              itemStyle: { color: T.violet },
            },
          ]
        : []),
    ],
  });
}

/* ----- 5. activity mix donut ---------------------------------------------- */

const DONUT_H = 380;

function buildDonut(rows: ActivityRow[], animate: boolean): EChartsOption {
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((sum, row) => sum + row.count, 0);
  const lead = sorted[0];
  const leadShare = lead && total > 0 ? (lead.count / total) * 100 : 0;
  const countByName = new Map(sorted.map((row) => [row.type, row.count]));

  // Pie centre sits at 43% of the chart height; text is anchored around it.
  const cy = DONUT_H * 0.43;

  const gradientFor = (index: number) => {
    const base = DONUT_PALETTE[index % DONUT_PALETTE.length];
    return {
      type: "linear",
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: base },
        { offset: 1, color: mix(base, "#0b1224", 0.38) },
      ],
    };
  };

  return asOption({
    ...baseOption(animate),
    color: DONUT_PALETTE,

    graphic: {
      elements: [
        {
          type: "text",
          silent: true,
          left: "center",
          top: cy - 42,
          style: {
            text: formatNumber(total),
            fill: "#ffffff",
            font: `800 42px ${FONT}`,
          },
        },
        {
          type: "text",
          silent: true,
          left: "center",
          top: cy + 8,
          style: {
            text: "TOTAL EVENTS",
            fill: T.muted,
            font: `700 10px ${FONT}`,
          },
        },
        {
          type: "text",
          silent: true,
          left: "center",
          top: cy + 28,
          style: {
            text: lead ? `${lead.type} leads at ${leadShare.toFixed(0)}%` : "",
            fill: T.sky,
            font: `600 11px ${FONT}`,
          },
        },
      ],
    },

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as { name: string; value: number; color: string };
        return tipCard(item.name, [
          { label: "Events", value: formatNumber(item.value), color: "#38bdf8" },
          {
            label: "Share",
            value: total > 0 ? formatPercentage((item.value / total) * 100) : "0%",
          },
        ]);
      },
    },

    legend: {
      type: "scroll",
      bottom: 4,
      icon: "circle",
      itemWidth: 9,
      itemHeight: 9,
      itemGap: 18,
      textStyle: { color: T.muted, fontSize: 11 },
      pageIconColor: T.sky,
      pageTextStyle: { color: T.muted },
      formatter: (name: string) => `${name}  ${formatNumber(countByName.get(name) ?? 0)}`,
    },

    series: [
      {
        type: "pie",
        radius: ["56%", "76%"],
        center: ["50%", "43%"],
        startAngle: 90,
        padAngle: 3,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 12,
          borderColor: "#0b1224",
          borderWidth: 3,
          shadowBlur: 26,
          shadowColor: "rgba(56,189,248,0.20)",
        },
        label: {
          show: true,
          position: "outside",
          color: T.muted,
          fontSize: 11,
          fontWeight: 600,
          formatter: (p: { percent?: number }) =>
            (p.percent ?? 0) >= 4 ? `${Math.round(p.percent ?? 0)}%` : "",
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          lineStyle: { color: "rgba(148,163,184,0.35)" },
        },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: { shadowBlur: 34, shadowColor: "rgba(56,189,248,0.45)" },
        },
        data: sorted.map((row, index) => ({
          name: row.type,
          value: row.count,
          itemStyle: { color: gradientFor(index) },
        })),
      },
    ],
  });
}

/* ----- 6. activity calendar heatmap --------------------------------------- */

function toIsoDay(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const time = Date.parse(value);
  return Number.isNaN(time) ? "" : new Date(time).toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildCalendar(rows: ActivityTimelineRow[], animate: boolean): EChartsOption {
  const perDay = new Map<string, number>();
  rows.forEach((row) => {
    const day = toIsoDay(row.date);
    if (day) perDay.set(day, (perDay.get(day) ?? 0) + row.count);
  });

  const days = [...perDay.keys()].sort();
  if (days.length === 0) return asOption(baseOption(animate));

  let start = days[0];
  let end = days[days.length - 1];

  // Keep the grid readable: at least five weeks, at most about a year.
  if (Date.parse(end) - Date.parse(start) < 34 * 86400000) end = addDays(start, 34);
  if (Date.parse(end) - Date.parse(start) > 370 * 86400000) start = addDays(end, -370);

  const data = days
    .filter((day) => day >= start && day <= end)
    .map((day) => [day, perDay.get(day) ?? 0]);
  const peak = Math.max(1, ...data.map((item) => Number(item[1])));
  const total = data.reduce((sum, item) => sum + Number(item[1]), 0);

  return asOption({
    ...baseOption(animate),

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as { value: [string, number] };
        const [day, count] = item.value;
        return tipCard(formatDate(day), [
          { label: "Events", value: formatNumber(count), color: T.sky },
          {
            label: "Share of window",
            value: total > 0 ? formatPercentage((count / total) * 100) : "0%",
          },
        ]);
      },
    },

    visualMap: {
      min: 0,
      max: peak,
      calculable: false,
      orient: "horizontal",
      left: "center",
      bottom: 2,
      itemWidth: 10,
      itemHeight: 140,
      text: ["More", "Fewer"],
      textStyle: { color: T.muted, fontSize: 10 },
      inRange: { color: ["#17306b", "#38bdf8", "#fbbf24"] },
    },

    calendar: {
      top: 36,
      left: 44,
      right: 24,
      bottom: 46,
      cellSize: ["auto", 22],
      range: [start, end],
      itemStyle: { color: "#101a36", borderColor: T.canvas, borderWidth: 3 },
      splitLine: { show: false },
      yearLabel: { show: false },
      monthLabel: { color: T.muted, fontSize: 10, nameMap: "en" },
      dayLabel: { color: T.faint, fontSize: 10, firstDay: 1, nameMap: "en" },
    },

    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data,
        itemStyle: { borderRadius: 4 },
        emphasis: { itemStyle: { borderColor: "#ffffff", borderWidth: 2 } },
      },
    ],
  });
}

/* ----- 7. adoption funnel -------------------------------------------------- */

function buildFunnel(summary: Summary, animate: boolean): EChartsOption {
  const base = summary.memberCount;

  const stages = [
    { name: "Members", value: summary.memberCount, color: "#3b82f6" },
    { name: "With confirmed grants", value: summary.membersWithGrants, color: "#38bdf8" },
    { name: "With saved calculations", value: summary.membersWithCalculations, color: "#22d3ee" },
    { name: "Recently active", value: summary.membersWithRecentActivity, color: "#34d399" },
  ];

  return asOption({
    ...baseOption(animate),

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as { name: string; value: number; color: string };
        return tipCard(item.name, [
          { label: "Members", value: formatNumber(item.value), color: item.color },
          {
            label: "Share of workspace",
            value: base > 0 ? formatPercentage((item.value / base) * 100) : "0%",
          },
        ]);
      },
    },

    series: [
      {
        type: "funnel",
        left: "6%",
        right: "6%",
        top: 10,
        bottom: 10,
        minSize: "18%",
        maxSize: "100%",
        sort: "descending",
        gap: 4,
        label: {
          show: true,
          position: "inside",
          color: "#f8fafc",
          fontSize: 11,
          fontWeight: 700,
          formatter: (params: unknown) => {
            const item = params as { name: string; value: number };
            const pct = base > 0 ? Math.round((item.value / base) * 100) : 0;
            return `${item.name}\n${formatNumber(item.value)} (${pct}%)`;
          },
        },
        itemStyle: { borderColor: "#0b1224", borderWidth: 2, borderRadius: 4 },
        emphasis: { label: { fontSize: 12 } },
        data: stages.map((stage) => ({
          name: stage.name,
          value: stage.value,
          itemStyle: { color: stage.color },
        })),
      },
    ],
  });
}

/* ----- 8. workspace capacity gauges --------------------------------------- */

function buildCapacityGauges(
  summary: Summary,
  workspace: Workspace | undefined,
  animate: boolean
): EChartsOption {
  const maxSeats = workspace?.maxMembers ?? 0;
  const used = workspace?.activeMemberCount ?? summary.memberCount;
  const seatPct = maxSeats > 0 ? Math.min(100, (used / maxSeats) * 100) : 0;

  const start = workspace ? Date.parse(workspace.startedAt) : NaN;
  const end = workspace ? Date.parse(workspace.expiresAt) : NaN;
  const hasTerm = Number.isFinite(start) && Number.isFinite(end) && end > start;
  const now = Date.now();
  const termPct = hasTerm
    ? Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100))
    : 0;
  const daysLeft = hasTerm ? Math.max(0, Math.ceil((end - now) / 86400000)) : 0;

  const gauge = (
    centerX: string,
    name: string,
    value: number,
    detail: string,
    from: string,
    to: string
  ) => ({
    type: "gauge",
    center: [centerX, "52%"],
    radius: hasTerm ? "70%" : "92%",
    startAngle: 220,
    endAngle: -40,
    min: 0,
    max: 100,
    progress: {
      show: true,
      width: 18,
      roundCap: true,
      itemStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 1,
          colorStops: [
            { offset: 0, color: from },
            { offset: 1, color: to },
          ],
        },
        shadowBlur: 14,
        shadowColor: `${to}66`,
      },
    },
    axisLine: {
      roundCap: true,
      lineStyle: { width: 18, color: [[1, "rgba(148,163,184,0.12)"]] },
    },
    pointer: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    anchor: { show: false },
    title: {
      show: true,
      offsetCenter: [0, "62%"],
      color: T.muted,
      fontSize: 11,
      fontWeight: 600,
    },
    detail: {
      valueAnimation: true,
      offsetCenter: [0, "-6%"],
      color: "#ffffff",
      fontSize: 24,
      fontWeight: 800,
      formatter: () => detail,
    },
    data: [{ value, name }],
  });

  const series = [
    gauge(
      hasTerm ? "27%" : "50%",
      `Seats in use (${seatPct.toFixed(0)}%)`,
      seatPct,
      `${formatNumber(used)}/${formatNumber(maxSeats)}`,
      "#3b82f6",
      "#22d3ee"
    ),
    ...(hasTerm
      ? [
          gauge(
            "73%",
            `Term elapsed (${termPct.toFixed(0)}%)`,
            termPct,
            `${formatNumber(daysLeft)}d left`,
            "#a78bfa",
            "#fbbf24"
          ),
        ]
      : []),
  ];

  return asOption({
    ...baseOption(animate),
    tooltip: { show: false },
    series,
  });
}

/* ----- 9. member profile radar -------------------------------------------- */

function buildRadar(
  ranked: ScoredMember[],
  selected: Set<string>,
  animate: boolean
): EChartsOption {
  const chosen =
    selected.size > 0 ? ranked.filter((m) => selected.has(m.id)) : ranked.slice(0, 5);

  const dims: { name: string; pick: (m: ScoredMember) => number; format: (v: number) => string }[] = [
    { name: "Options", pick: (m) => m.options, format: formatNumber },
    { name: "Grants", pick: (m) => m.confirmedGrants, format: formatNumber },
    { name: "Calcs", pick: (m) => m.calculations, format: formatNumber },
    { name: "Exit value", pick: (m) => m.totalExitValue, format: formatCompactCurrency },
    { name: "Activity", pick: (m) => m.activities, format: formatNumber },
    { name: "Docs", pick: (m) => m.documents, format: formatNumber },
  ];

  const peaks = dims.map((dim) =>
    ranked.reduce((max, member) => Math.max(max, dim.pick(member) || 0), 0)
  );

  const byId = new Map(ranked.map((member) => [member.id, member]));

  return asOption({
    ...baseOption(animate),

    legend: {
      type: "scroll",
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: T.muted, fontSize: 10 },
      pageIconColor: T.sky,
      pageTextStyle: { color: T.muted },
    },

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as { data?: { memberId?: string; value: number[] } };
        const member = item.data?.memberId ? byId.get(item.data.memberId) : undefined;
        if (!member || !item.data) return "";

        return tipCard(
          member.name,
          dims.map((dim, index) => ({
            label: dim.name,
            value: `${dim.format(dim.pick(member) || 0)} (${Math.round(item.data!.value[index])}%)`,
          })),
          member.email
        );
      },
    },

    radar: {
      center: ["50%", "46%"],
      radius: "62%",
      splitNumber: 4,
      indicator: dims.map((dim) => ({ name: dim.name, max: 100 })),
      axisName: { color: T.muted, fontSize: 10, fontWeight: 600 },
      axisLine: { lineStyle: { color: T.grid } },
      splitLine: { lineStyle: { color: T.grid } },
      splitArea: { show: false },
    },

    series: [
      {
        type: "radar",
        symbolSize: 5,
        emphasis: { lineStyle: { width: 3 } },
        data: chosen.map((member, index) => {
          const color = DONUT_PALETTE[index % DONUT_PALETTE.length];
          return {
            name: member.name,
            memberId: member.id,
            value: dims.map((dim, i) =>
              peaks[i] > 0 ? ((dim.pick(member) || 0) / peaks[i]) * 100 : 0
            ),
            lineStyle: { color, width: 2 },
            itemStyle: { color },
            areaStyle: { color: alpha(color, 0.16) },
          };
        }),
      },
    ],
  });
}

/* ----- 10. exit-value Pareto ---------------------------------------------- */

function buildPareto(
  members: ScoredMember[],
  selected: Set<string>,
  animate: boolean
): EChartsOption {
  const rows = members
    .filter((member) => (member.totalExitValue || 0) > 0)
    .sort((a, b) => b.totalExitValue - a.totalExitValue);

  const total = rows.reduce((sum, member) => sum + member.totalExitValue, 0);
  let running = 0;
  const cumulative = rows.map((member) => {
    running += member.totalExitValue;
    return total > 0 ? (running / total) * 100 : 0;
  });

  const hasSelection = selected.size > 0;
  const nameById = new Map(rows.map((row) => [row.id, row.name]));

  return asOption({
    ...baseOption(animate),

    legend: {
      top: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: T.muted, fontSize: 11 },
    },

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(148,163,184,0.08)" } },
      formatter: (params: unknown) => {
        const list = params as { dataIndex: number }[];
        const index = list[0]?.dataIndex ?? 0;
        const row = rows[index];
        if (!row) return "";

        return tipCard(
          row.name,
          [
            { label: "Exit value", value: formatCurrency(row.totalExitValue), color: T.emerald },
            {
              label: "Share of workspace",
              value: formatPercentage((row.totalExitValue / total) * 100),
            },
            { label: "Cumulative share", value: formatPercentage(cumulative[index]), color: T.amber },
            { label: "Calculations", value: formatNumber(row.calculations) },
          ],
          row.email
        );
      },
    },

    grid: { left: 8, right: 8, top: 44, bottom: 12, containLabel: true },

    xAxis: {
      type: "category",
      data: rows.map((row) => row.id),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: T.grid } },
      axisLabel: {
        ...AXIS_LABEL,
        interval: 0,
        width: 90,
        overflow: "truncate",
        formatter: (id: string) => nameById.get(id) ?? id,
        color: (value?: string | number) =>
          typeof value === "string" && selected.has(value) ? T.amber : T.muted,
      },
    },

    yAxis: [
      {
        type: "value",
        axisLabel: { ...AXIS_LABEL, formatter: (v: number) => formatCompactCurrency(v) },
        splitLine: SPLIT_LINE,
      },
      {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: { ...AXIS_LABEL, formatter: (v: number) => `${v}%` },
        splitLine: { show: false },
      },
    ],

    series: [
      {
        name: "Exit value",
        type: "bar",
        barMaxWidth: 46,
        data: rows.map((row) => {
          const isSelected = selected.has(row.id);
          return {
            value: row.totalExitValue,
            memberId: row.id,
            itemStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#34d399" },
                  { offset: 1, color: "#0f766e" },
                ],
              },
              borderRadius: [6, 6, 0, 0],
              opacity: hasSelection && !isSelected ? 0.3 : 1,
              borderColor: isSelected ? T.amber : "transparent",
              borderWidth: isSelected ? 1.5 : 0,
            },
          };
        }),
      },
      {
        name: "Cumulative share",
        type: "line",
        yAxisIndex: 1,
        data: cumulative,
        smooth: 0.2,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 2.5, color: T.amber },
        itemStyle: { color: T.amber, borderColor: T.canvas, borderWidth: 2 },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "rgba(251,191,36,0.5)", type: "dashed" },
          label: { color: T.amber, fontSize: 10, formatter: "80%", position: "insideEndTop" },
          data: [{ yAxis: 80 }],
        },
      },
    ],
  });
}

/* ----- 11. exit-value distribution ---------------------------------------- */

function buildDistribution(rows: CalculationRow[], animate: boolean) {
  const values = rows
    .map((row) => row.exitValue)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (values.length === 0) {
    return { option: baseOption(animate), stats: null as React.ReactNode };
  }

  const min = values[0];
  const max = values[values.length - 1];
  const median =
    values.length % 2 === 1
      ? values[(values.length - 1) / 2]
      : (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

  const binCount =
    min === max ? 1 : Math.min(8, Math.max(3, Math.ceil(Math.sqrt(values.length))));
  const width = binCount === 1 ? 0 : (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, index) => ({
    lo: min + width * index,
    hi: min + width * (index + 1),
    count: 0,
  }));

  const binOf = (value: number) =>
    binCount === 1 ? 0 : Math.min(binCount - 1, Math.floor((value - min) / width));

  values.forEach((value) => {
    bins[binOf(value)].count += 1;
  });

  const medianBin = binOf(median);

  const option = asOption({
    ...baseOption(animate),

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(148,163,184,0.08)" } },
      formatter: (params: unknown) => {
        const list = params as { dataIndex: number }[];
        const bin = bins[list[0]?.dataIndex ?? 0];
        if (!bin) return "";

        return tipCard(
          binCount === 1
            ? formatCurrency(bin.lo)
            : `${formatCompactCurrency(bin.lo)} to ${formatCompactCurrency(bin.hi)}`,
          [
            { label: "Calculations", value: formatNumber(bin.count) },
            {
              label: "Share",
              value: formatPercentage((bin.count / values.length) * 100),
            },
          ]
        );
      },
    },

    grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },

    xAxis: {
      type: "category",
      data: bins.map((bin) =>
        binCount === 1
          ? formatCompactCurrency(bin.lo)
          : `${formatCompactCurrency(bin.lo)} to ${formatCompactCurrency(bin.hi)}`
      ),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: T.grid } },
      axisLabel: {
        ...AXIS_LABEL,
        fontSize: 9,
        interval: 0,
        width: 70,
        overflow: "break",
        rotate: bins.length > 4 ? 35 : 0,
      },
    },

    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: AXIS_LABEL,
      splitLine: SPLIT_LINE,
    },

    series: [
      {
        type: "bar",
        barCategoryGap: "12%",
        data: bins.map((bin, index) => ({
          value: bin.count,
          itemStyle: {
            color: mix("#1d4ed8", "#38bdf8", bins.length === 1 ? 0.6 : index / (bins.length - 1)),
            borderRadius: [5, 5, 0, 0],
          },
        })),
        label: {
          show: true,
          position: "top",
          color: T.muted,
          fontSize: 10,
          formatter: (params: unknown) => {
            const item = params as { value: number };
            return item.value > 0 ? String(item.value) : "";
          },
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: T.amber, type: "dashed", width: 1.5 },
          label: {
            color: T.amber,
            fontSize: 10,
            formatter: `Median ${formatCompactCurrency(median)}`,
            position: "end",
            distance: 6,
          },
          data: [{ xAxis: medianBin }],
        },
      },
    ],
  });

  const stats = (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "Lowest", value: formatCompactCurrency(min) },
        { label: "Median", value: formatCompactCurrency(median) },
        { label: "Mean", value: formatCompactCurrency(mean) },
        { label: "Highest", value: formatCompactCurrency(max) },
      ].map((item) => (
        <div key={item.label}>
          <p className="text-[10px] text-slate-500">{item.label}</p>
          <p className="text-xs font-bold tabular-nums text-slate-100">{item.value}</p>
        </div>
      ))}
    </div>
  );

  return { option, stats };
}

/* ----- 12. ROI vs return multiple ----------------------------------------- */

function buildScatter(rows: CalculationRow[], animate: boolean): EChartsOption {
  const peak = rows.reduce((max, row) => Math.max(max, Math.abs(row.exitValue) || 0), 0);

  const size = (exit: number) =>
    peak > 0 ? 10 + Math.sqrt(Math.abs(exit) / peak) * 34 : 14;

  const point = (row: CalculationRow) => ({
    value: [row.returnMultiple, row.roiPercentage, row.exitValue],
    name: row.name,
    memberId: row.memberId,
    memberName: row.memberName,
    createdAt: row.createdAt,
  });

  const groups = [
    { name: "Gain", color: "#34d399", rows: rows.filter((r) => r.roiPercentage > 0) },
    { name: "Break-even", color: "#94a3b8", rows: rows.filter((r) => r.roiPercentage === 0) },
    { name: "Loss", color: "#fb7185", rows: rows.filter((r) => r.roiPercentage < 0) },
  ].filter((group) => group.rows.length > 0);

  return {
    ...baseOption(animate),

    legend: {
      top: 0,
      icon: "circle",
      itemWidth: 9,
      itemHeight: 9,
      textStyle: { color: T.muted, fontSize: 11 },
    },

    toolbox: {
      ...TOOLBOX_STYLE,
      right: 4,
      top: -4,
      itemSize: 13,
      feature: {
        dataZoom: { title: { zoom: "Zoom", back: "Undo zoom" } },
        brush: { type: ["rect", "clear"], title: { rect: "Brush", clear: "Clear brush" } },
        restore: { title: "Reset" },
      },
    },

    brush: {
      xAxisIndex: 0,
      brushLink: "all",
      outOfBrush: { colorAlpha: 0.15 },
      brushStyle: {
        borderColor: "rgba(56,189,248,0.8)",
        color: "rgba(56,189,248,0.10)",
      },
    },

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as {
          color: string;
          data: {
            value: number[];
            name: string;
            memberName: string;
            createdAt: string;
          };
        };
        const [multiple, roi, exit] = item.data.value;

        return tipCard(
          item.data.name,
          [
            { label: "Exit value", value: formatCurrency(exit), color: item.color },
            { label: "ROI", value: formatPercentage(roi) },
            { label: "Return multiple", value: formatMultiple(multiple) },
            { label: "Saved", value: formatDate(item.data.createdAt) },
          ],
          item.data.memberName
        );
      },
    },

    grid: { left: 8, right: 24, top: 44, bottom: 52, containLabel: true },

    xAxis: {
      type: "value",
      scale: true,
      name: "Return multiple",
      nameLocation: "middle",
      nameGap: 28,
      nameTextStyle: { color: T.faint, fontSize: 10 },
      axisLabel: { ...AXIS_LABEL, formatter: (v: number) => `${v}x` },
      splitLine: SPLIT_LINE,
    },

    yAxis: {
      type: "value",
      scale: true,
      name: "ROI %",
      nameTextStyle: { color: T.faint, fontSize: 10, align: "left" },
      axisLabel: { ...AXIS_LABEL, formatter: (v: number) => `${v}%` },
      splitLine: SPLIT_LINE,
    },

    dataZoom: [
      { type: "inside", xAxisIndex: 0, filterMode: "none" },
      { type: "inside", yAxisIndex: 0, filterMode: "none" },
    ],

    series: groups.map((group, index) => ({
      name: group.name,
      type: "scatter" as const,
      data: group.rows.map(point),
      symbolSize: (value: number[]) => size(value[2]),
      itemStyle: {
        color: group.color,
        opacity: 0.78,
        borderColor: "rgba(255,255,255,0.55)",
        borderWidth: 1,
      },
      emphasis: {
        focus: "series" as const,
        itemStyle: { opacity: 1, borderColor: "#ffffff", borderWidth: 2 },
      },
      markLine:
        index === 0
          ? {
              silent: true,
              symbol: "none",
              lineStyle: { color: "rgba(148,163,184,0.5)", type: "dashed" as const },
              label: { color: T.muted, fontSize: 10, formatter: "ROI 0%", position: "insideEndTop" as const },
              data: [{ yAxis: 0 }],
            }
          : undefined,
    })),
  };
}

/* ----- 13. expiry risk monitor -------------------------------------------- */

function buildRisk(rows: ExpiryRow[], animate: boolean): EChartsOption {
  const top = [...rows]
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 14);

  const keyOf = (row: ExpiryRow) => `${row.grantId}::${row.memberId}`;
  const labelByKey = new Map(
    top.map((row) => [keyOf(row), `${row.memberName} (${row.grantName})`])
  );

  return {
    ...baseOption(animate),

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(148,163,184,0.08)" } },
      formatter: (params: unknown) => {
        const list = params as { dataIndex: number }[];
        const row = top[list[0]?.dataIndex ?? 0];
        if (!row) return "";
        const band = bandOf(row.daysRemaining);

        return tipCard(
          row.grantName,
          [
            { label: "Member", value: row.memberName },
            { label: "Company", value: row.companyName },
            { label: "Expiry date", value: formatDate(row.expiryDate) },
            {
              label: "Days remaining",
              value:
                row.daysRemaining < 0
                  ? `${formatNumber(Math.abs(row.daysRemaining))} overdue`
                  : formatNumber(row.daysRemaining),
              color: band.color,
            },
            { label: "Options", value: formatNumber(row.optionCount) },
            { label: "Risk band", value: band.label },
          ]
        );
      },
    },

    grid: { left: 8, right: 76, top: 20, bottom: 28, containLabel: true },

    xAxis: {
      type: "value",
      name: "Days to expiry",
      nameLocation: "middle",
      nameGap: 26,
      nameTextStyle: { color: T.faint, fontSize: 10 },
      min: (value: { min: number }) => Math.min(value.min, 0),
      max: (value: { max: number }) => Math.max(value.max, 380),
      axisLabel: AXIS_LABEL,
      splitLine: SPLIT_LINE,
    },

    yAxis: {
      type: "category",
      inverse: true,
      data: top.map(keyOf),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: T.grid } },
      axisLabel: {
        color: T.text,
        fontSize: 10,
        width: 150,
        overflow: "truncate",
        formatter: (key: string) => labelByKey.get(key) ?? key,
      },
    },

    series: [
      {
        type: "bar",
        barMaxWidth: 20,
        data: top.map((row) => ({
          value: row.daysRemaining,
          memberId: row.memberId,
          itemStyle: {
            color: bandOf(row.daysRemaining).color,
            borderRadius: [0, 6, 6, 0],
          },
        })),
        label: {
          show: true,
          position: "right",
          color: T.muted,
          fontSize: 10,
          formatter: (params: unknown) => {
            const item = params as { dataIndex: number };
            const row = top[item.dataIndex];
            return row ? `${formatNumber(row.optionCount)} options` : "";
          },
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: { fontSize: 10, color: T.muted, position: "insideEndTop" },
          data: [
            { xAxis: 90, lineStyle: { color: "#f97316", type: "dashed" }, label: { formatter: "90d" } },
            { xAxis: 180, lineStyle: { color: "#fbbf24", type: "dashed" }, label: { formatter: "180d" } },
            { xAxis: 365, lineStyle: { color: "#38bdf8", type: "dashed" }, label: { formatter: "365d" } },
          ],
        },
      },
    ],
  };
}

/* ----- 14. expiry distribution -------------------------------------------- */

function buildExpiryDistribution(
  rows: ExpiryRow[],
  selectedBand: BandKey | null,
  animate: boolean
): EChartsOption {
  const stats = BANDS.map((band) => {
    const inBand = rows.filter((row) => bandOf(row.daysRemaining).key === band.key);
    return {
      ...band,
      grants: inBand.length,
      options: inBand.reduce((sum, row) => sum + row.optionCount, 0),
      members: new Set(inBand.map((row) => row.memberId)).size,
    };
  });

  return {
    ...baseOption(animate),

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(148,163,184,0.08)" } },
      formatter: (params: unknown) => {
        const list = params as { dataIndex: number }[];
        const item = stats[list[0]?.dataIndex ?? 0];
        if (!item) return "";

        return tipCard(item.label, [
          { label: "Options", value: formatNumber(item.options), color: item.color },
          { label: "Grants", value: formatNumber(item.grants) },
          { label: "Members affected", value: formatNumber(item.members) },
        ]);
      },
    },

    grid: { left: 8, right: 8, top: 36, bottom: 8, containLabel: true },

    legend: {
      top: 0,
      itemWidth: 12,
      itemHeight: 3,
      textStyle: { color: T.muted, fontSize: 10 },
    },

    xAxis: {
      type: "category",
      data: stats.map((item) => item.label.replace(" days", "d")),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: T.grid } },
      axisLabel: { ...AXIS_LABEL, fontSize: 9, interval: 0, width: 56, overflow: "break" },
    },

    yAxis: [
      {
        type: "value",
        axisLabel: { ...AXIS_LABEL, formatter: (v: number) => formatCompactNumber(v) },
        splitLine: SPLIT_LINE,
      },
      {
        type: "value",
        minInterval: 1,
        axisLabel: AXIS_LABEL,
        splitLine: { show: false },
      },
    ],

    series: [
      {
        name: "Options",
        type: "bar",
        barMaxWidth: 34,
        data: stats.map((item) => ({
          value: item.options,
          band: item.key,
          itemStyle: {
            color: item.color,
            borderRadius: [6, 6, 0, 0],
            opacity: selectedBand && selectedBand !== item.key ? 0.3 : 1,
            borderColor: selectedBand === item.key ? "#ffffff" : "transparent",
            borderWidth: selectedBand === item.key ? 1.5 : 0,
          },
        })),
        label: {
          show: true,
          position: "top",
          color: T.muted,
          fontSize: 10,
          formatter: (params: unknown) => {
            const item = params as { value: number };
            return item.value > 0 ? formatCompactNumber(item.value) : "";
          },
        },
      },
      {
        name: "Grants",
        type: "line",
        yAxisIndex: 1,
        data: stats.map((item) => item.grants),
        symbol: "diamond",
        symbolSize: 8,
        lineStyle: { width: 1.5, color: "#cbd5e1", type: "dashed" },
        itemStyle: { color: "#e2e8f0" },
      },
    ],
  };
}

/* ----- 15. equity at risk sunburst ---------------------------------------- */

function buildSunburst(
  rows: ExpiryRow[],
  selected: Set<string>,
  selectedCompany: string | null,
  animate: boolean
): EChartsOption {
  const byCompany = new Map<string, Map<string, { name: string; options: number }>>();

  rows.forEach((row) => {
    const company = byCompany.get(row.companyName) ?? new Map();
    const entry = company.get(row.memberId) ?? { name: row.memberName, options: 0 };
    entry.options += row.optionCount;
    company.set(row.memberId, entry);
    byCompany.set(row.companyName, company);
  });

  const total = rows.reduce((sum, row) => sum + row.optionCount, 0);
  const hasMemberSelection = selected.size > 0;

  const data = [...byCompany.entries()]
    .map(([company, memberMap]) => ({
      company,
      memberMap,
      options: [...memberMap.values()].reduce((sum, item) => sum + item.options, 0),
    }))
    .sort((a, b) => b.options - a.options)
    .map((entry, index) => {
      const base = DONUT_PALETTE[index % DONUT_PALETTE.length];
      const companyDim = selectedCompany !== null && selectedCompany !== entry.company;

      return {
        name: entry.company,
        kind: "company",
        itemStyle: {
          color: base,
          opacity: companyDim ? 0.35 : 1,
          borderColor: selectedCompany === entry.company ? T.amber : "#0b1224",
          borderWidth: 2,
        },
        children: [...entry.memberMap.entries()].map(([id, item]) => ({
          name: item.name,
          kind: "member",
          id,
          value: item.options,
          itemStyle: {
            color: mix(base, "#ffffff", 0.3),
            opacity: (hasMemberSelection && !selected.has(id)) || companyDim ? 0.35 : 1,
            borderColor: selected.has(id) ? T.amber : "#0b1224",
            borderWidth: 2,
          },
        })),
      };
    });

  return asOption({
    ...baseOption(animate),

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as {
          name: string;
          value: number;
          data?: { kind?: string };
          treePathInfo?: { name: string }[];
        };
        const isMember = item.data?.kind === "member";
        const company = item.treePathInfo?.[1]?.name;

        return tipCard(
          item.name,
          [
            { label: "Expiring options", value: formatNumber(item.value) },
            {
              label: "Share of scope",
              value: total > 0 ? formatPercentage((item.value / total) * 100) : "0%",
            },
            ...(isMember && company ? [{ label: "Company", value: company }] : []),
          ],
          isMember ? "Member" : "Company"
        );
      },
    },

    series: [
      {
        type: "sunburst",
        center: ["50%", "50%"],
        radius: ["14%", "92%"],
        sort: "desc",
        nodeClick: false,
        data,
        label: { color: "#f8fafc", fontSize: 10, fontWeight: 600, minAngle: 10 },
        levels: [
          {},
          { r0: "14%", r: "52%", label: { rotate: "tangential" } },
          { r0: "54%", r: "92%", label: { rotate: "radial" } },
        ],
        emphasis: { focus: "ancestor" },
      },
    ],
  });
}

/* ----- 16. expiry runway -------------------------------------------------- */

function buildRunway(rows: ExpiryRow[], animate: boolean): EChartsOption {
  const usable = rows
    .map((row) => ({ row, time: Date.parse(row.expiryDate) }))
    .filter((item) => Number.isFinite(item.time));

  const peak = usable.reduce((max, item) => Math.max(max, item.row.optionCount), 0);
  const size = (options: number) => 12 + (peak > 0 ? Math.sqrt(options / peak) * 22 : 0);

  const series = BANDS.map((band) => ({
    name: band.label,
    type: "scatter",
    symbolSize: (value: number[]) => size(value[1]),
    itemStyle: {
      color: band.color,
      opacity: 0.85,
      borderColor: "rgba(255,255,255,0.5)",
      borderWidth: 1,
    },
    emphasis: {
      focus: "series",
      itemStyle: { opacity: 1, borderColor: "#ffffff", borderWidth: 2 },
    },
    data: usable
      .filter((item) => bandOf(item.row.daysRemaining).key === band.key)
      .map((item) => ({
        value: [item.time, item.row.optionCount],
        memberId: item.row.memberId,
        row: item.row,
      })),
  })).filter((item) => item.data.length > 0);

  return asOption({
    ...baseOption(animate),

    legend: {
      top: 0,
      icon: "circle",
      itemWidth: 9,
      itemHeight: 9,
      textStyle: { color: T.muted, fontSize: 11 },
    },

    toolbox: {
      ...TOOLBOX_STYLE,
      right: 4,
      top: -4,
      itemSize: 13,
      feature: {
        dataZoom: { yAxisIndex: "none", title: { zoom: "Zoom", back: "Undo zoom" } },
        restore: { title: "Reset" },
      },
    },

    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as { data?: { row?: ExpiryRow } };
        const row = item.data?.row;
        if (!row) return "";
        const band = bandOf(row.daysRemaining);

        return tipCard(row.grantName, [
          { label: "Member", value: row.memberName },
          { label: "Company", value: row.companyName },
          { label: "Expiry date", value: formatDate(row.expiryDate) },
          {
            label: "Days remaining",
            value:
              row.daysRemaining < 0
                ? `${formatNumber(Math.abs(row.daysRemaining))} overdue`
                : formatNumber(row.daysRemaining),
            color: band.color,
          },
          { label: "Options", value: formatNumber(row.optionCount) },
        ]);
      },
    },

    grid: { left: 8, right: 28, top: 44, bottom: 58, containLabel: true },

    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: T.grid } },
      axisTick: { show: false },
      splitLine: SPLIT_LINE,
      axisLabel: {
        ...AXIS_LABEL,
        hideOverlap: true,
        formatter: (value: number | string) =>
          new Date(Number(value)).toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
          }),
      },
    },

    yAxis: {
      type: "value",
      min: 0,
      minInterval: 1,
      axisLabel: { ...AXIS_LABEL, formatter: (v: number) => formatCompactNumber(v) },
      splitLine: SPLIT_LINE,
    },

    dataZoom: [
      { type: "inside", xAxisIndex: 0, filterMode: "none" },
      {
        type: "slider",
        xAxisIndex: 0,
        bottom: 8,
        height: 18,
        filterMode: "none",
        borderColor: "transparent",
        backgroundColor: "rgba(148,163,184,0.08)",
        fillerColor: "rgba(56,189,248,0.22)",
        textStyle: { color: T.muted, fontSize: 10 },
      },
    ],

    series: series.map((item, index) => ({
      ...item,
      markLine:
        index === 0
          ? {
              silent: true,
              symbol: "none",
              lineStyle: { color: "rgba(226,232,240,0.55)", type: "dashed" },
              label: { color: T.text, fontSize: 10, formatter: "Today", position: "insideEndTop" },
              data: [{ xAxis: Date.now() }],
            }
          : undefined,
    })),
  });
}

/* -------------------------------------------------------------------------- */
/* SCORING & HELPERS                                                           */
/* -------------------------------------------------------------------------- */

function scoreMembers(members: TeamAnalyticsMember[]): ScoredMember[] {
  const picks: ((m: TeamAnalyticsMember) => number)[] = [
    (m) => m.options,
    (m) => m.confirmedGrants,
    (m) => m.calculations,
    (m) => m.totalExitValue,
    (m) => m.activities,
    (m) => m.documents,
  ];

  const peaks = picks.map((pick) =>
    members.reduce((max, member) => Math.max(max, pick(member) || 0), 0)
  );

  return members.map((member) => {
    const shares = picks
      .map((pick, index) => (peaks[index] > 0 ? (pick(member) || 0) / peaks[index] : null))
      .filter((value): value is number => value !== null);

    const index =
      shares.length > 0
        ? (shares.reduce((sum, value) => sum + value, 0) / shares.length) * 100
        : 0;

    return { ...member, index };
  });
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function parseHex(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mix(from: string, to: string, t: number) {
  const k = Math.max(0, Math.min(1, t));
  const a = parseHex(from);
  const b = parseHex(to);
  const channel = (index: number) => Math.round(a[index] + (b[index] - a[index]) * k);
  return `rgb(${channel(0)},${channel(1)},${channel(2)})`;
}

function alpha(hex: string, opacity: number) {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${opacity})`;
}

function safeColor(color?: string) {
  return color && /^[#a-zA-Z0-9(),.%\s]+$/.test(color) ? color : "";
}

function tipCard(
  title: string,
  rows: { label: string; value: string; color?: string }[],
  sub?: string
) {
  const body = rows
    .map((row) => {
      const color = safeColor(row.color);
      const dot = color
        ? `<span style="width:8px;height:8px;border-radius:99px;background:${color};display:inline-block"></span>`
        : "";

      return `<div style="display:flex;justify-content:space-between;align-items:center;gap:22px;margin-top:6px"><span style="color:#94a3b8;display:flex;align-items:center;gap:6px">${dot}${escapeHtml(
        row.label
      )}</span><strong style="color:#f8fafc;font-variant-numeric:tabular-nums">${escapeHtml(
        row.value
      )}</strong></div>`;
    })
    .join("");

  return `<div style="min-width:200px"><div style="font-weight:700;font-size:12px;color:#fff">${escapeHtml(
    title
  )}</div>${
    sub
      ? `<div style="color:#64748b;font-size:10px;margin-top:2px">${escapeHtml(sub)}</div>`
      : ""
  }<div style="margin-top:6px;border-top:1px solid rgba(148,163,184,.16);padding-top:1px">${body}</div></div>`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  );
}

function formatCompactNumber(value: number) {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(Math.round(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatCompactCurrency(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? "-" : "";

  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(
    Number.isFinite(value) ? value : 0
  )}%`;
}

function formatMultiple(value: number) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(2)}x`;
}

function formatDate(value: string) {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value || "-";

  return new Date(time).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortDate(time: number) {
  if (!Number.isFinite(time)) return "";
  return new Date(time).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

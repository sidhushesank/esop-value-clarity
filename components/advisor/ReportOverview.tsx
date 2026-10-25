"use client";

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type OverviewSeverity = "RED" | "AMBER" | "INFO" | "GREEN";

export type OverviewFinding = {
  severity: OverviewSeverity;
  title: string;
  owner: string | null;
  /** ISO date string, or null when the finding is not time-bound. */
  dueDate: string | null;
};

export type ReportOverviewProps = {
  score: number;
  findings: OverviewFinding[];
  /** Position date as YYYY-MM-DD. Deadlines are measured against this date. */
  asOf: string;
  /** Flagged (action + review) findings resting on unverified rules. */
  unverified: number;
  /** Number of flagged (action + review) findings. */
  flagged: number;
  /** Number of checks that could not run. */
  notRun: number;
};

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const SEV: Record<OverviewSeverity, { label: string; colour: string }> = {
  RED: { label: "Action needed", colour: "#b42318" },
  AMBER: { label: "Review", colour: "#d97706" },
  INFO: { label: "Notes", colour: "#2563a8" },
  GREEN: { label: "Passed", colour: "#2f855a" },
};

const SEV_ORDER: OverviewSeverity[] = ["RED", "AMBER", "INFO", "GREEN"];

const BANDS = [
  { from: 0, to: 50, label: "Needs work", colour: "#b42318" },
  { from: 50, to: 80, label: "Fair", colour: "#d97706" },
  { from: 80, to: 100, label: "Strong", colour: "#2f855a" },
] as const;

const HORIZON_COLOURS = {
  overdue: "#b42318",
  month: "#d97706",
  quarter: "#2563a8",
  year: "#64748b",
  later: "#94a3b8",
} as const;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_MS = 86_400_000;

const AXIS_TICK = { fontSize: 11, fill: "#64748b" } as const;
const GRID = "#eef2f6";
const AXIS_LINE = { stroke: "#e2e8f0" } as const;

const TOOLTIP_STYLE = {
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  fontSize: 12,
  padding: "6px 10px",
} as const;

const SURFACE =
  "rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const subscribe = () => () => {};

/** False on the server and during hydration, true afterwards. */
function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

function fmtDay(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "-";
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function grouped(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function band(score: number) {
  return BANDS.find((b) => score < b.to) ?? BANDS[BANDS.length - 1];
}

/** Fades and lifts its children into view once, unless motion is reduced. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** A number that counts up from zero when it appears. */
export function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(reduce ? value : 0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    if (reduce) {
      motionValue.set(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [motionValue, value, reduce]);

  return <motion.span className={className}>{rounded}</motion.span>;
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  caption,
  children,
  className = "",
}: {
  title: string;
  caption?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex h-full flex-col ${SURFACE} ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          {title}
        </h3>
        {caption ? (
          <span className="text-[10px] font-medium text-slate-400">
            {caption}
          </span>
        ) : null}
      </header>

      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-xs font-medium text-slate-500">
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  suffix,
  sub,
  accent,
  children,
}: {
  label: string;
  value: number;
  suffix?: string;
  sub: ReactNode;
  accent: string;
  children?: ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden px-4 pb-4 pt-3.5 ${SURFACE}`}>
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: accent }}
      />

      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      <p className="mt-2.5 flex items-baseline gap-1.5 tabular-nums">
        <span className="text-[32px] font-semibold leading-none tracking-tight text-slate-900">
          <CountUp value={value} />
        </span>
        {suffix ? (
          <span className="text-sm font-medium text-slate-400">{suffix}</span>
        ) : null}
      </p>

      <p className="mt-2 text-xs font-medium text-slate-500">{sub}</p>

      {children}
    </div>
  );
}

/** Thin banded scale with a marker, used under the readiness score. */
function BandScale({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));

  return (
    <div className="mt-3">
      <div className="relative h-1.5 w-full overflow-visible">
        <div className="flex h-full w-full gap-[2px] overflow-hidden rounded-[2px]">
          {BANDS.map((b) => (
            <span
              key={b.label}
              className="h-full"
              style={{
                width: `${b.to - b.from}%`,
                backgroundColor: b.colour,
                opacity: score >= b.from && score < (b.to === 100 ? 101 : b.to) ? 1 : 0.28,
              }}
            />
          ))}
        </div>

        <span
          className="absolute -top-[3px] h-3 w-[2px] bg-slate-900"
          style={{ left: `calc(${clamped}% - 1px)` }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] font-medium tabular-nums text-slate-400">
        <span>0</span>
        <span>50</span>
        <span>80</span>
        <span>100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

export default function ReportOverview({
  score,
  findings,
  asOf,
  unverified,
  flagged,
  notRun,
}: ReportOverviewProps) {
  const mounted = useMounted();
  const reduce = useReducedMotion();

  const current = band(score);

  const counts = useMemo(() => {
    const c: Record<OverviewSeverity, number> = {
      RED: 0,
      AMBER: 0,
      INFO: 0,
      GREEN: 0,
    };
    for (const f of findings) c[f.severity]++;
    return c;
  }, [findings]);

  const totalFindings = findings.length;
  const openItems = counts.RED + counts.AMBER;

  const ownerData = useMemo(() => {
    const map = new Map<
      string,
      { owner: string; action: number; review: number; total: number }
    >();

    for (const f of findings) {
      if (f.severity !== "RED" && f.severity !== "AMBER") continue;

      const owner = f.owner?.trim() || "Unassigned";
      const row = map.get(owner) ?? { owner, action: 0, review: 0, total: 0 };

      if (f.severity === "RED") row.action++;
      else row.review++;
      row.total++;

      map.set(owner, row);
    }

    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [findings]);

  const deadlines = useMemo(() => {
    const base = Date.parse(`${asOf}T00:00:00.000Z`);

    return findings
      .filter((f) => f.dueDate && f.severity !== "GREEN")
      .map((f) => {
        const due = Date.parse(f.dueDate as string);
        const days =
          Number.isNaN(base) || Number.isNaN(due)
            ? 0
            : Math.round((due - base) / DAY_MS);

        return { ...f, due, days };
      })
      .filter((f) => !Number.isNaN(f.due))
      .sort((a, b) => a.due - b.due);
  }, [findings, asOf]);

  const overdue = deadlines.filter((d) => d.days < 0).length;

  const horizon = useMemo(() => {
    const rows = [
      { label: "Past due", count: 0, colour: HORIZON_COLOURS.overdue },
      { label: "0-30 days", count: 0, colour: HORIZON_COLOURS.month },
      { label: "31-90 days", count: 0, colour: HORIZON_COLOURS.quarter },
      { label: "91-365 days", count: 0, colour: HORIZON_COLOURS.year },
      { label: "Over 1 year", count: 0, colour: HORIZON_COLOURS.later },
    ];

    for (const d of deadlines) {
      if (d.days < 0) rows[0].count++;
      else if (d.days <= 30) rows[1].count++;
      else if (d.days <= 90) rows[2].count++;
      else if (d.days <= 365) rows[3].count++;
      else rows[4].count++;
    }

    return rows;
  }, [deadlines]);

  const severityRow = {
    name: "Findings",
    RED: counts.RED,
    AMBER: counts.AMBER,
    INFO: counts.INFO,
    GREEN: counts.GREEN,
  };

  const ownerHeight = Math.max(190, ownerData.length * 44 + 56);

  return (
    <div className="space-y-4">
      {/* ----------------------------- KPIs -------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal>
          <Kpi
            label="Readiness score"
            value={score}
            suffix="/ 100"
            accent={current.colour}
            sub={
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: current.colour }}
                />
                {current.label}
              </span>
            }
          >
            <BandScale score={score} />
          </Kpi>
        </Reveal>

        <Reveal delay={0.05}>
          <Kpi
            label="Open items"
            value={openItems}
            accent={SEV.AMBER.colour}
            sub={`${counts.RED} action needed, ${counts.AMBER} review`}
          />
        </Reveal>

        <Reveal delay={0.1}>
          <Kpi
            label="Past due"
            value={overdue}
            accent={overdue > 0 ? SEV.RED.colour : "#94a3b8"}
            sub={
              deadlines.length > 0
                ? `of ${deadlines.length} dated item${deadlines.length === 1 ? "" : "s"}`
                : "No dated items"
            }
          />
        </Reveal>

        <Reveal delay={0.15}>
          <Kpi
            label="Rules to verify"
            value={unverified}
            accent={unverified > 0 ? SEV.INFO.colour : "#94a3b8"}
            sub={
              flagged > 0
                ? `of ${flagged} flagged finding${flagged === 1 ? "" : "s"}${notRun > 0 ? `, ${notRun} check${notRun === 1 ? "" : "s"} not run` : ""}`
                : notRun > 0
                  ? `${notRun} check${notRun === 1 ? "" : "s"} not run`
                  : "Nothing flagged"
            }
          />
        </Reveal>
      </div>

      {/* ----------------------------- Row 2 ------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Severity distribution */}
        <Reveal className="h-full">
          <Panel
            title="Findings by severity"
            caption={`${totalFindings} finding${totalFindings === 1 ? "" : "s"}`}
          >
            {totalFindings === 0 ? (
              <EmptyNote>No findings were recorded for this run.</EmptyNote>
            ) : (
              <>
                <div className="h-9 w-full">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[severityRow]}
                        layout="vertical"
                        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                      >
                        <XAxis
                          type="number"
                          hide
                          domain={[0, totalFindings]}
                        />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip cursor={false} contentStyle={TOOLTIP_STYLE} />
                        {SEV_ORDER.map((s) => (
                          <Bar
                            key={s}
                            dataKey={s}
                            name={SEV[s].label}
                            stackId="severity"
                            fill={SEV[s].colour}
                            barSize={26}
                            isAnimationActive={!reduce}
                            animationDuration={800}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>

                <table className="mt-4 w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.08em] text-slate-400">
                      <th className="pb-2 text-left font-semibold">Severity</th>
                      <th className="pb-2 text-right font-semibold">Count</th>
                      <th className="pb-2 text-right font-semibold">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {SEV_ORDER.map((s) => (
                      <tr key={s}>
                        <td className="py-2">
                          <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                            <span
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{ backgroundColor: SEV[s].colour }}
                            />
                            {SEV[s].label}
                          </span>
                        </td>
                        <td className="py-2 text-right font-semibold text-slate-900">
                          {counts[s]}
                        </td>
                        <td className="py-2 text-right text-slate-500">
                          {Math.round((counts[s] / totalFindings) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </Panel>
        </Reveal>

        {/* Deadline horizon */}
        <Reveal delay={0.06} className="h-full">
          <Panel
            title="Deadline horizon"
            caption="Dated items by time to deadline"
          >
            {deadlines.length === 0 ? (
              <EmptyNote>No dated deadlines were found.</EmptyNote>
            ) : (
              <div className="h-[230px] w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={horizon}
                      margin={{ top: 20, right: 8, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis
                        dataKey="label"
                        interval={0}
                        tickLine={false}
                        axisLine={AXIS_LINE}
                        tick={AXIS_TICK}
                      />
                      <YAxis
                        allowDecimals={false}
                        width={28}
                        tickLine={false}
                        axisLine={false}
                        tick={AXIS_TICK}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(148, 163, 184, 0.10)" }}
                        contentStyle={TOOLTIP_STYLE}
                      />
                      <Bar
                        dataKey="count"
                        name="Items"
                        maxBarSize={36}
                        isAnimationActive={!reduce}
                        animationDuration={800}
                      >
                        {horizon.map((h) => (
                          <Cell key={h.label} fill={h.colour} />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="top"
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            fill: "#0f172a",
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            )}
          </Panel>
        </Reveal>
      </div>

      {/* ----------------------------- Row 3 ------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Open items by owner */}
        <Reveal className="h-full">
          <Panel
            title="Open items by owner"
            caption={`${openItems} open item${openItems === 1 ? "" : "s"}`}
          >
            {ownerData.length === 0 ? (
              <EmptyNote>Nothing is waiting on anyone.</EmptyNote>
            ) : (
              <>
                <div className="w-full" style={{ height: ownerHeight }}>
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ownerData}
                        layout="vertical"
                        margin={{ top: 4, right: 28, bottom: 0, left: 0 }}
                        barCategoryGap="32%"
                      >
                        <CartesianGrid horizontal={false} stroke={GRID} />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          domain={[0, "dataMax + 1"]}
                          tickLine={false}
                          axisLine={AXIS_LINE}
                          tick={AXIS_TICK}
                        />
                        <YAxis
                          type="category"
                          dataKey="owner"
                          width={150}
                          interval={0}
                          tickLine={false}
                          axisLine={AXIS_LINE}
                          tick={{ ...AXIS_TICK, fill: "#334155" }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(148, 163, 184, 0.10)" }}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <Bar
                          dataKey="action"
                          name="Action needed"
                          stackId="owner"
                          fill={SEV.RED.colour}
                          isAnimationActive={!reduce}
                          animationDuration={800}
                        />
                        <Bar
                          dataKey="review"
                          name="Review"
                          stackId="owner"
                          fill={SEV.AMBER.colour}
                          isAnimationActive={!reduce}
                          animationDuration={800}
                        >
                          <LabelList
                            dataKey="total"
                            position="right"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              fill: "#0f172a",
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: SEV.RED.colour }}
                    />
                    Action needed
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: SEV.AMBER.colour }}
                    />
                    Review
                  </span>
                </div>
              </>
            )}
          </Panel>
        </Reveal>

        {/* Upcoming deadlines table */}
        <Reveal delay={0.06} className="h-full">
          <Panel
            title="Deadlines"
            caption={
              deadlines.length > 0
                ? `Measured from ${fmtDay(Date.parse(`${asOf}T00:00:00.000Z`))}`
                : undefined
            }
          >
            {deadlines.length === 0 ? (
              <EmptyNote>No dated deadlines were found.</EmptyNote>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.08em] text-slate-400">
                      <th className="pb-2 text-left font-semibold">Due</th>
                      <th className="pb-2 text-left font-semibold">Item</th>
                      <th className="pb-2 text-right font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {deadlines.slice(0, 7).map((d, i) => {
                      const colour =
                        d.days < 0
                          ? HORIZON_COLOURS.overdue
                          : d.days <= 30
                            ? HORIZON_COLOURS.month
                            : HORIZON_COLOURS.quarter;

                      const status =
                        d.days < 0
                          ? `${grouped(Math.abs(d.days))} day${Math.abs(d.days) === 1 ? "" : "s"} past due`
                          : d.days === 0
                            ? "Due today"
                            : `In ${grouped(d.days)} day${d.days === 1 ? "" : "s"}`;

                      return (
                        <tr key={`${d.title}-${i}`} className="align-top">
                          <td className="whitespace-nowrap py-2.5 pr-3 font-semibold tabular-nums text-slate-900">
                            {fmtDay(d.due)}
                          </td>

                          <td className="py-2.5 pr-3">
                            <p className="font-medium leading-5 text-slate-700">
                              {d.title}
                            </p>
                            {d.owner ? (
                              <p className="text-[11px] text-slate-400">
                                {d.owner}
                              </p>
                            ) : null}
                          </td>

                          <td className="whitespace-nowrap py-2.5 text-right tabular-nums">
                            <span
                              className="inline-flex items-center gap-1.5 font-semibold"
                              style={{ color: colour }}
                            >
                              <span
                                className="h-2 w-2 rounded-sm"
                                style={{ backgroundColor: colour }}
                              />
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {deadlines.length > 7 ? (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-400">
                    + {deadlines.length - 7} more dated item
                    {deadlines.length - 7 === 1 ? "" : "s"} in the findings
                    below
                  </p>
                ) : null}
              </div>
            )}
          </Panel>
        </Reveal>
      </div>
    </div>
  );
}
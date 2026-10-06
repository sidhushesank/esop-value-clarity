"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { animate, motion } from "framer-motion";
import { X } from "lucide-react";
import type { EChartsOption } from "echarts";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
    </div>
  ),
});

/* ------------------------------------------------------------------ */
/* Data contract (unchanged)                                           */
/* ------------------------------------------------------------------ */

type MemberIntelligence = {
  member: { name: string };
  grantSummary: {
    grantCount: number;
    confirmedGrantCount: number;
    totalOptions: number;
    totalExerciseCost: number;
    companies: string[];
    expiringWithin365Days: number;
  };
  calculationSummary: {
    calculationCount: number;
    totalExitValue: number;
    highestExitValue: number;
    averageExitValue: number;
    averageReturnMultiple: number;
    averageRoiPercentage: number;
  };
  activitySummary: {
    activityCount: number;
    lastActivityAt: string | null;
    byType: Array<{ type: string; count: number; lastOccurredAt: string | null }>;
    recent: Array<{ id: string; type: string; createdAt: string; metadata: unknown }>;
  };
  documentSummary: {
    documentCount: number;
    confirmedDocumentCount: number;
    clauseCount: number;
    reviewDocumentCount: number;
  };
  analytics: {
    grantCountsByCompany: Array<{ company: string; grants: number; options: number }>;
    calculationExitValues: Array<{
      id: string;
      name: string;
      exitValue: number;
      returnMultiple: number;
      roiPercentage: number;
      createdAt: string;
    }>;
    activityTimeline: Array<{ date: string; count: number }>;
    activityByType: Array<{ type: string; count: number }>;
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

type Props = { member: MemberIntelligence };

/* ------------------------------------------------------------------ */
/* Tokens, formatters, tooltip helpers                                 */
/* ------------------------------------------------------------------ */

const C = {
  blue: "#2563eb",
  cyan: "#0891b2",
  indigo: "#4f46e5",
  emerald: "#059669",
  amber: "#d97706",
  red: "#dc2626",
  slate: "#334155",
};

type Tone = { text: string; muted: string; grid: string; axis: string };
const LIGHT: Tone = { text: "#0f172a", muted: "#64748b", grid: "#eef2f7", axis: "#cbd5e1" };
const DARK: Tone = {
  text: "#e2e8f0",
  muted: "#94a3b8",
  grid: "rgba(148,163,184,0.12)",
  axis: "rgba(148,163,184,0.35)",
};

const BANDS = ["Expired", "0–90 days", "91–180 days", "181–365 days", ">365 days"] as const;
type Band = (typeof BANDS)[number];
const BAND_COLOR: Record<Band, string> = {
  Expired: "#dc2626",
  "0–90 days": "#ea580c",
  "91–180 days": "#d97706",
  "181–365 days": "#2563eb",
  ">365 days": "#059669",
};

const TYPE_PALETTE = ["#3b82f6", "#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#94a3b8", "#fb923c"];

function bandOf(days: number): Band {
  if (days < 0) return BANDS[0];
  if (days <= 90) return BANDS[1];
  if (days <= 180) return BANDS[2];
  if (days <= 365) return BANDS[3];
  return BANDS[4];
}

const fmtNum = (v: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);
const fmtINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const fmtX = (v: number) => `${v.toFixed(2)}x`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function fmtCompact(value: number): string {
  const a = Math.abs(value);
  if (a >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function tip(title: string, rows: Array<[string, string]>, note?: string): string {
  const body = rows
    .map(
      ([k, v]) =>
        `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#94a3b8">${esc(k)}</span><span style="font-variant-numeric:tabular-nums">${esc(v)}</span></div>`
    )
    .join("");
  const foot = note ? `<div style="margin-top:4px;color:#94a3b8;font-size:10px">${esc(note)}</div>` : "";
  return `<div style="min-width:190px"><div style="font-weight:600;margin-bottom:4px">${esc(title)}</div>${body}${foot}</div>`;
}

const tipBase = () => ({
  backgroundColor: "#0b1220",
  borderColor: "#334155",
  borderWidth: 1,
  padding: [8, 10],
  textStyle: { color: "#e2e8f0", fontSize: 11 },
  extraCssText: "border-radius:4px;box-shadow:0 8px 24px rgba(2,6,23,.35);",
});

type TipParam = { dataIndex?: number; seriesName?: string; value?: unknown; name?: string; marker?: string };
type ValueParam = { value?: unknown };
type PickParam = { dataIndex?: number; name?: string };

function allParams(raw: unknown): TipParam[] {
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter((p): p is TipParam => typeof p === "object" && p !== null);
}

function toggle<T>(current: T | null, next: T): T | null {
  return current === next ? null : next;
}

/* ------------------------------------------------------------------ */
/* Derived data                                                        */
/* ------------------------------------------------------------------ */

function derive(member: MemberIntelligence) {
  const a = member.analytics;
  const gs = member.grantSummary;

  const calcsAsc = [...a.calculationExitValues].sort(
    (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
  );
  const calcsRank = [...a.calculationExitValues].sort((x, y) => y.exitValue - x.exitValue);
  const timeline = [...a.activityTimeline].sort((x, y) => x.date.localeCompare(y.date));
  const types = [...a.activityByType].sort((x, y) => y.count - x.count);
  const eventTotal = types.reduce((s, t) => s + t.count, 0);
  const companies = [...a.grantCountsByCompany].sort((x, y) => y.options - x.options);

  const expiry = [...a.grantExpiryTimeline]
    .sort((x, y) => x.daysRemaining - y.daysRemaining)
    .map((r) => ({ ...r, band: bandOf(r.daysRemaining) }));

  const buckets = BANDS.map((band) => {
    const rows = expiry.filter((r) => r.band === band);
    return { band, grants: rows.length, options: rows.reduce((s, r) => s + r.optionCount, 0) };
  });

  const within365 = buckets.slice(1, 4);
  const expiringOptions = within365.reduce((s, b) => s + b.options, 0);
  const expiringGrants = within365.reduce((s, b) => s + b.grants, 0);
  const expiredOptions = buckets[0].options;
  const avgStrike = gs.totalOptions > 0 ? gs.totalExerciseCost / gs.totalOptions : null;

  return {
    calcsAsc,
    calcsRank,
    timeline,
    types,
    eventTotal,
    companies,
    expiry,
    buckets,
    expiringOptions,
    expiringGrants,
    expiredOptions,
    avgStrike,
  };
}
type Derived = ReturnType<typeof derive>;

/* ------------------------------------------------------------------ */
/* Option builders (pure)                                              */
/* ------------------------------------------------------------------ */

function buildEquity(d: Derived): EChartsOption {
  const rows = d.companies;
  return {
    animationDuration: 600,
    legend: { top: 0, right: 4, itemWidth: 10, itemHeight: 8, textStyle: { color: LIGHT.muted, fontSize: 10 } },
    tooltip: {
      ...tipBase(),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (raw: unknown) => {
        const ps = allParams(raw);
        const row = rows[ps[0]?.dataIndex ?? -1];
        if (!row) return "";
        return tip(
          row.company,
          [
            ["Options", fmtNum(row.options)],
            ["Grants", fmtNum(row.grants)],
            ["Options per grant", row.grants > 0 ? fmtNum(row.options / row.grants) : "—"],
          ],
          "Options = total options on confirmed grants at this company."
        );
      },
    },
    grid: { left: 4, right: 12, top: 26, bottom: 4, containLabel: true },
    xAxis: [
      {
        type: "value",
        axisLabel: { color: LIGHT.muted, fontSize: 10 },
        splitLine: { lineStyle: { color: LIGHT.grid } },
      },
      {
        type: "value",
        position: "top",
        minInterval: 1,
        axisLabel: { color: C.cyan, fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    yAxis: {
      type: "category",
      inverse: true,
      data: rows.map((r) => r.company),
      axisLabel: { color: LIGHT.text, fontSize: 10 },
      axisLine: { lineStyle: { color: LIGHT.axis } },
    },
    series: [
      {
        name: "Options",
        type: "bar",
        xAxisIndex: 0,
        data: rows.map((r) => r.options),
        barMaxWidth: 14,
        itemStyle: { color: C.blue },
        label: { show: true, position: "right", fontSize: 9, color: LIGHT.muted, formatter: (p: ValueParam) => fmtNum(Number(p.value)) },
      },
      {
        name: "Grants",
        type: "bar",
        xAxisIndex: 1,
        data: rows.map((r) => r.grants),
        barMaxWidth: 14,
        itemStyle: { color: C.cyan },
      },
    ],
  };
}

function buildEconomics(member: MemberIntelligence, d: Derived): EChartsOption {
  const cs = member.calculationSummary;
  const items: Array<{ name: string; value: number; color: string; note: string }> = [];
  if (member.grantSummary.totalExerciseCost > 0)
    items.push({
      name: "Exercise cost",
      value: member.grantSummary.totalExerciseCost,
      color: C.amber,
      note: "Cash required to exercise all confirmed options.",
    });
  if (cs.calculationCount > 0) {
    items.push({ name: "Average modeled exit", value: cs.averageExitValue, color: C.indigo, note: "Mean exit value across saved calculations." });
    items.push({ name: "Highest modeled exit", value: cs.highestExitValue, color: C.emerald, note: "Best saved scenario." });
    items.push({ name: "Total modeled exit", value: cs.totalExitValue, color: C.blue, note: "Sum of all saved scenario exit values." });
  }
  return {
    animationDuration: 600,
    tooltip: {
      ...tipBase(),
      trigger: "item",
      formatter: (raw: unknown) => {
        const p = allParams(raw)[0];
        const it = items[p?.dataIndex ?? -1];
        if (!it) return "";
        const rows: Array<[string, string]> = [["Value", fmtINR(it.value)]];
        if (it.name === "Exercise cost" && d.avgStrike !== null) {
          rows.push(["Options", fmtNum(member.grantSummary.totalOptions)]);
          rows.push(["Avg exercise price", fmtINR(d.avgStrike)]);
        }
        if (it.name !== "Exercise cost" && member.grantSummary.totalExerciseCost > 0 && it.value > 0)
          rows.push(["Cost as % of this", fmtPct((member.grantSummary.totalExerciseCost / it.value) * 100)]);
        return tip(it.name, rows, it.note);
      },
    },
    grid: { left: 4, right: 56, top: 8, bottom: 4, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: { color: LIGHT.muted, fontSize: 10, formatter: (v: string | number) => fmtCompact(Number(v)) },
      splitLine: { lineStyle: { color: LIGHT.grid } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: items.map((i) => i.name),
      axisLabel: { color: LIGHT.text, fontSize: 10 },
      axisLine: { lineStyle: { color: LIGHT.axis } },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 20,
        data: items.map((i) => ({ value: i.value, itemStyle: { color: i.color } })),
        label: { show: true, position: "right", fontSize: 10, color: LIGHT.text, formatter: (p: ValueParam) => fmtCompact(Number(p.value)) },
      },
    ],
  };
}

function buildRanking(d: Derived, sel: string | null): EChartsOption {
  const rows = d.calcsRank;
  return {
    animationDuration: 600,
    tooltip: {
      ...tipBase(),
      trigger: "item",
      formatter: (raw: unknown) => {
        const c = rows[allParams(raw)[0]?.dataIndex ?? -1];
        if (!c) return "";
        return tip(c.name, [
          ["Exit value", fmtINR(c.exitValue)],
          ["ROI", fmtPct(c.roiPercentage)],
          ["Return multiple", fmtX(c.returnMultiple)],
          ["Saved", fmtDate(c.createdAt)],
        ]);
      },
    },
    grid: { left: 4, right: 58, top: 6, bottom: 4, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: { color: LIGHT.muted, fontSize: 10, formatter: (v: string | number) => fmtCompact(Number(v)) },
      splitLine: { lineStyle: { color: LIGHT.grid } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: rows.map((r) => r.name),
      axisLabel: { color: LIGHT.text, fontSize: 10, width: 120, overflow: "truncate" },
      axisLine: { lineStyle: { color: LIGHT.axis } },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 18,
        data: rows.map((r, i) => ({
          value: r.exitValue,
          itemStyle: {
            color: r.id === sel ? C.amber : i === 0 ? C.emerald : C.blue,
            opacity: sel && r.id !== sel ? 0.3 : 1,
          },
        })),
        label: { show: true, position: "right", fontSize: 10, color: LIGHT.text, formatter: (p: ValueParam) => fmtCompact(Number(p.value)) },
        emphasis: { itemStyle: { opacity: 1 } },
      },
    ],
  };
}

function buildTrend(d: Derived, sel: string | null): EChartsOption {
  const rows = d.calcsAsc;
  const zoom = rows.length >= 8;
  return {
    animationDuration: 600,
    tooltip: {
      ...tipBase(),
      trigger: "axis",
      axisPointer: { type: "cross", label: { backgroundColor: "#1e293b" } },
      formatter: (raw: unknown) => {
        const c = rows[allParams(raw)[0]?.dataIndex ?? -1];
        if (!c) return "";
        return tip(c.name, [
          ["Exit value", fmtINR(c.exitValue)],
          ["ROI", fmtPct(c.roiPercentage)],
          ["Return multiple", fmtX(c.returnMultiple)],
          ["Saved", fmtDate(c.createdAt)],
        ]);
      },
    },
    grid: { left: 4, right: 20, top: 24, bottom: zoom ? 44 : 6, containLabel: true },
    xAxis: {
      type: "time",
      axisLabel: { color: DARK.muted, fontSize: 10 },
      axisLine: { lineStyle: { color: DARK.axis } },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: DARK.muted, fontSize: 10, formatter: (v: string | number) => fmtCompact(Number(v)) },
      splitLine: { lineStyle: { color: DARK.grid } },
    },
    dataZoom: zoom
      ? [{ type: "inside" }, { type: "slider", height: 14, bottom: 4, borderColor: "transparent", textStyle: { color: DARK.muted, fontSize: 9 } }]
      : [],
    series: [
      {
        type: "line",
        smooth: false,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 2, color: "#38bdf8" },
        itemStyle: { color: "#38bdf8" },
        areaStyle: { color: "rgba(56,189,248,0.08)" },
        data: rows.map((r) => ({
          value: [new Date(r.createdAt).getTime(), r.exitValue],
          symbolSize: r.id === sel ? 15 : 8,
          itemStyle:
            r.id === sel
              ? { color: "#fbbf24", borderColor: "#ffffff", borderWidth: 2 }
              : { color: "#38bdf8", opacity: sel ? 0.45 : 1 },
        })),
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { type: "dashed", color: "rgba(148,163,184,0.6)" },
          label: { color: DARK.muted, fontSize: 9, formatter: (p: ValueParam) => `Avg ${fmtCompact(Number(p.value))}` },
          data: rows.length > 1 ? [{ type: "average" }] : [],
        },
        markPoint: {
          symbol: "pin",
          symbolSize: 36,
          itemStyle: { color: C.emerald },
          label: { fontSize: 9, color: "#ffffff", formatter: (p: ValueParam) => fmtCompact(Number(p.value)) },
          data: [{ type: "max", name: "Highest" }],
        },
      },
    ],
  };
}

function buildScatter(d: Derived, sel: string | null): EChartsOption {
  const rows = d.calcsAsc;
  const maxExit = Math.max(1, ...rows.map((r) => r.exitValue));
  return {
    animationDuration: 600,
    tooltip: {
      ...tipBase(),
      trigger: "item",
      formatter: (raw: unknown) => {
        const c = rows[allParams(raw)[0]?.dataIndex ?? -1];
        if (!c) return "";
        return tip(c.name, [
          ["Exit value", fmtINR(c.exitValue)],
          ["ROI", fmtPct(c.roiPercentage)],
          ["Return multiple", fmtX(c.returnMultiple)],
          ["Saved", fmtDate(c.createdAt)],
        ]);
      },
    },
    grid: { left: 4, right: 20, top: 16, bottom: 28, containLabel: true },
    xAxis: {
      type: "value",
      name: "Return multiple",
      nameLocation: "middle",
      nameGap: 24,
      scale: true,
      nameTextStyle: { color: DARK.muted, fontSize: 10 },
      axisLabel: { color: DARK.muted, fontSize: 10, formatter: (v: string | number) => `${v}x` },
      axisLine: { lineStyle: { color: DARK.axis } },
      splitLine: { lineStyle: { color: DARK.grid } },
    },
    yAxis: {
      type: "value",
      name: "ROI %",
      scale: true,
      nameTextStyle: { color: DARK.muted, fontSize: 10 },
      axisLabel: { color: DARK.muted, fontSize: 10, formatter: (v: string | number) => `${v}%` },
      axisLine: { lineStyle: { color: DARK.axis } },
      splitLine: { lineStyle: { color: DARK.grid } },
    },
    dataZoom:
      rows.length >= 3
        ? [
            { type: "inside", xAxisIndex: 0, filterMode: "none" },
            { type: "inside", yAxisIndex: 0, filterMode: "none" },
          ]
        : [],
    series: [
      {
        type: "scatter",
        symbolSize: (v: number[]) => 10 + 34 * Math.sqrt(v[2] / maxExit),
        data: rows.map((r) => ({
          value: [r.returnMultiple, r.roiPercentage, r.exitValue],
          itemStyle: {
            color: r.id === sel ? "#fbbf24" : "#22d3ee",
            opacity: sel && r.id !== sel ? 0.25 : 0.8,
            borderColor: r.id === sel ? "#ffffff" : "transparent",
            borderWidth: 2,
          },
        })),
        emphasis: { scale: 1.15 },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { type: "dashed", color: "rgba(148,163,184,0.5)" },
          label: { show: false },
          data: [{ yAxis: 0 }, { xAxis: 1 }],
        },
      },
    ],
  };
}

function buildActivity(d: Derived, mode: "daily" | "cumulative"): EChartsOption {
  const dates = d.timeline.map((r) => r.date);
  const counts = d.timeline.map((r) => r.count);
  let running = 0;
  const cumulative = counts.map((c) => (running += c));
  const ma = counts.map((_, i) => {
    const s = counts.slice(Math.max(0, i - 2), i + 1);
    return Number((s.reduce((a, b) => a + b, 0) / s.length).toFixed(2));
  });
  const zoom = dates.length >= 14;

  return {
    animationDuration: 600,
    legend: { top: 0, right: 4, itemWidth: 10, itemHeight: 8, textStyle: { color: DARK.muted, fontSize: 10 } },
    tooltip: {
      ...tipBase(),
      trigger: "axis",
      axisPointer: { type: "cross", label: { backgroundColor: "#1e293b" } },
      formatter: (raw: unknown) => {
        const ps = allParams(raw);
        const head = ps[0]?.name ?? "";
        const lines = ps
          .map((p) => `<div>${p.marker ?? ""}${esc(p.seriesName ?? "")}: <b>${esc(String(p.value))}</b></div>`)
          .join("");
        return `<div style="font-weight:600;margin-bottom:4px">${esc(head)}</div>${lines}`;
      },
    },
    grid: { left: 4, right: 16, top: 26, bottom: zoom ? 44 : 6, containLabel: true },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { color: DARK.muted, fontSize: 9 },
      axisLine: { lineStyle: { color: DARK.axis } },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: DARK.muted, fontSize: 10 },
      splitLine: { lineStyle: { color: DARK.grid } },
    },
    dataZoom: zoom
      ? [{ type: "inside" }, { type: "slider", height: 14, bottom: 4, borderColor: "transparent", textStyle: { color: DARK.muted, fontSize: 9 } }]
      : [],
    series:
      mode === "daily"
        ? [
            {
              name: "Events",
              type: "bar",
              data: counts,
              barMaxWidth: 18,
              itemStyle: { color: "#3b82f6" },
              markLine: {
                silent: true,
                symbol: "none",
                lineStyle: { type: "dashed", color: "rgba(148,163,184,0.6)" },
                label: { color: DARK.muted, fontSize: 9, formatter: (p: ValueParam) => `Avg ${Number(p.value).toFixed(1)}` },
                data: counts.length > 1 ? [{ type: "average" }] : [],
              },
              markPoint: {
                symbolSize: 34,
                itemStyle: { color: "#fbbf24" },
                label: { color: "#0f172a", fontSize: 9, fontWeight: 600 },
                data: [{ type: "max", name: "Peak" }],
              },
            },
            {
              name: "3-pt moving avg",
              type: "line",
              data: ma,
              smooth: true,
              symbol: "none",
              lineStyle: { width: 2, color: "#22d3ee" },
              itemStyle: { color: "#22d3ee" },
            },
          ]
        : [
            {
              name: "Cumulative events",
              type: "line",
              data: cumulative,
              symbol: "circle",
              symbolSize: 5,
              lineStyle: { width: 2, color: "#3b82f6" },
              itemStyle: { color: "#3b82f6" },
              areaStyle: { color: "rgba(59,130,246,0.15)" },
            },
          ],
  };
}

function buildMix(d: Derived, selType: string | null, hoverType: string | null, display: number): EChartsOption {
  const focus = hoverType ?? selType;
  const label = focus ? (focus.length > 14 ? `${focus.slice(0, 13)}…` : focus).toUpperCase() : "EVENTS";
  return {
    animationDuration: 600,
    animationDurationUpdate: 300,
    tooltip: {
      ...tipBase(),
      trigger: "item",
      formatter: (raw: unknown) => {
        const p = allParams(raw)[0] as (TipParam & { percent?: number }) | undefined;
        if (!p) return "";
        return tip(p.name ?? "", [
          ["Events", fmtNum(Number(p.value))],
          ["Share", fmtPct(p.percent ?? 0)],
        ]);
      },
    },
    legend: { type: "scroll", bottom: 0, itemWidth: 10, itemHeight: 8, textStyle: { color: LIGHT.muted, fontSize: 10 } },
    graphic: [
      {
        type: "group",
        left: "center",
        top: "middle",
        children: [
          {
            type: "text",
            x: 0,
            y: -10,
            style: { text: fmtNum(display), fill: LIGHT.text, font: "700 30px ui-sans-serif, system-ui", align: "center", verticalAlign: "middle" },
          },
          {
            type: "text",
            x: 0,
            y: 16,
            style: { text: label, fill: LIGHT.muted, font: "600 10px ui-sans-serif, system-ui", align: "center", verticalAlign: "middle" },
          },
        ],
      },
    ],
    series: [
      {
        type: "pie",
        radius: ["46%", "68%"],
        center: ["50%", "50%"],
        selectedMode: "single",
        selectedOffset: 6,
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderColor: "#ffffff", borderWidth: 2 },
        emphasis: { scale: true, scaleSize: 7 },
        select: { itemStyle: { borderColor: "#0f172a", borderWidth: 2 } },
        data: d.types.map((t, i) => ({
          name: t.type,
          value: t.count,
          selected: t.type === selType,
          itemStyle: { color: TYPE_PALETTE[i % TYPE_PALETTE.length] },
        })),
      },
    ],
  };
}

function buildExpiryRisk(d: Derived, bucket: Band | null): EChartsOption {
  const rows = d.expiry;
  const many = rows.length > 12;
  return {
    animationDuration: 600,
    tooltip: {
      ...tipBase(),
      trigger: "item",
      formatter: (raw: unknown) => {
        const r = rows[allParams(raw)[0]?.dataIndex ?? -1];
        if (!r) return "";
        return tip(r.grantName, [
          ["Company", r.companyName],
          ["Expiry date", fmtDate(r.expiryDate)],
          ["Days remaining", String(r.daysRemaining)],
          ["Options", fmtNum(r.optionCount)],
          ["Risk band", r.band],
        ]);
      },
    },
    grid: { left: 4, right: 96, top: 8, bottom: 6, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: { color: LIGHT.muted, fontSize: 10, formatter: (v: string | number) => `${v}d` },
      splitLine: { lineStyle: { color: LIGHT.grid } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: rows.map((r) => `${r.grantName} · ${r.companyName}`),
      axisLabel: { color: LIGHT.text, fontSize: 10, width: 150, overflow: "truncate" },
      axisLine: { show: false },
    },
    dataZoom: many ? [{ type: "slider", yAxisIndex: 0, right: 0, width: 12, start: 0, end: (12 / rows.length) * 100 }, { type: "inside", yAxisIndex: 0 }] : [],
    series: [
      {
        type: "bar",
        barMaxWidth: 16,
        data: rows.map((r) => ({
          value: r.daysRemaining,
          itemStyle: { color: BAND_COLOR[r.band], opacity: bucket && r.band !== bucket ? 0.15 : 1 },
          label: {
            color: r.band === "Expired" || r.band === "0–90 days" ? C.red : LIGHT.text,
            fontWeight: r.band === "Expired" || r.band === "0–90 days" ? 700 : 400,
          },
        })),
        label: {
          show: true,
          position: "right",
          fontSize: 10,
          formatter: (p: { dataIndex?: number }) => {
            const r = rows[p.dataIndex ?? -1];
            return r ? `${r.daysRemaining}d · ${fmtNum(r.optionCount)} opt` : "";
          },
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: C.slate, type: "solid" },
          label: { formatter: "Today", fontSize: 9, color: LIGHT.muted },
          data: [{ xAxis: 0 }],
        },
      },
    ],
  };
}

function buildBuckets(d: Derived, bucket: Band | null): EChartsOption {
  return {
    animationDuration: 600,
    legend: { top: 0, right: 4, itemWidth: 10, itemHeight: 8, textStyle: { color: LIGHT.muted, fontSize: 10 } },
    tooltip: {
      ...tipBase(),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (raw: unknown) => {
        const b = d.buckets[allParams(raw)[0]?.dataIndex ?? -1];
        if (!b) return "";
        return tip(b.band, [
          ["Options", fmtNum(b.options)],
          ["Grants", fmtNum(b.grants)],
        ], "Click to focus the expiry risk monitor.");
      },
    },
    grid: { left: 4, right: 8, top: 26, bottom: 4, containLabel: true },
    xAxis: {
      type: "category",
      data: d.buckets.map((b) => b.band),
      axisLabel: { color: LIGHT.text, fontSize: 10 },
      axisLine: { lineStyle: { color: LIGHT.axis } },
    },
    yAxis: [
      { type: "value", name: "Options", nameTextStyle: { color: LIGHT.muted, fontSize: 10 }, axisLabel: { color: LIGHT.muted, fontSize: 10 }, splitLine: { lineStyle: { color: LIGHT.grid } } },
      { type: "value", name: "Grants", minInterval: 1, nameTextStyle: { color: LIGHT.muted, fontSize: 10 }, axisLabel: { color: LIGHT.muted, fontSize: 10 }, splitLine: { show: false } },
    ],
    series: [
      {
        name: "Options",
        type: "bar",
        yAxisIndex: 0,
        barMaxWidth: 34,
        data: d.buckets.map((b) => ({
          value: b.options,
          itemStyle: {
            color: BAND_COLOR[b.band],
            opacity: bucket && b.band !== bucket ? 0.25 : 1,
            borderColor: b.band === bucket ? "#0f172a" : "transparent",
            borderWidth: 2,
          },
        })),
        label: { show: true, position: "top", fontSize: 9, color: LIGHT.muted, formatter: (p: ValueParam) => (Number(p.value) > 0 ? fmtNum(Number(p.value)) : "") },
      },
      {
        name: "Grants",
        type: "bar",
        yAxisIndex: 1,
        barMaxWidth: 14,
        data: d.buckets.map((b) => ({ value: b.grants, itemStyle: { color: C.slate, opacity: bucket && b.band !== bucket ? 0.25 : 1 } })),
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Matrix rows                                                         */
/* ------------------------------------------------------------------ */

type RowTone = "good" | "warn" | "risk" | "info" | "neutral";
type MRow = {
  domain: string;
  metric: string;
  value: string;
  ratio: number | null;
  basis: string;
  tone: RowTone;
  activityType?: string;
};

const pctOf = (n: number, total: number): number | null =>
  total > 0 ? Math.max(0, Math.min(100, (n / total) * 100)) : null;

function buildMatrix(member: MemberIntelligence, d: Derived): MRow[] {
  const gs = member.grantSummary;
  const cs = member.calculationSummary;
  const ds = member.documentSummary;
  const maxRoi = Math.max(0, ...d.calcsAsc.map((c) => c.roiPercentage));
  const maxMult = Math.max(0, ...d.calcsAsc.map((c) => c.returnMultiple));
  const top = d.companies[0];
  const hasCalc = cs.calculationCount > 0;

  const rows: MRow[] = [
    { domain: "Equity", metric: "Confirmed options", value: fmtNum(gs.totalOptions), ratio: null, basis: "Options on confirmed grants", tone: "info" },
    { domain: "Equity", metric: "Grant confirmation rate", value: `${gs.confirmedGrantCount} / ${gs.grantCount}`, ratio: pctOf(gs.confirmedGrantCount, gs.grantCount), basis: "Confirmed ÷ persisted grants", tone: "good" },
    { domain: "Equity", metric: "Largest company exposure", value: top ? `${top.company} (${fmtNum(top.options)})` : "—", ratio: top ? pctOf(top.options, gs.totalOptions) : null, basis: "Top company ÷ total options", tone: "info" },
    { domain: "Equity", metric: "Exercise cost", value: gs.totalExerciseCost > 0 ? fmtINR(gs.totalExerciseCost) : "—", ratio: null, basis: "Cost to exercise all confirmed options", tone: "warn" },
    { domain: "Equity", metric: "Average exercise price", value: d.avgStrike !== null && gs.totalExerciseCost > 0 ? fmtINR(d.avgStrike) : "—", ratio: null, basis: "Exercise cost ÷ options", tone: "neutral" },
    { domain: "Outcomes", metric: "Saved calculations", value: fmtNum(cs.calculationCount), ratio: null, basis: "Persisted scenarios", tone: "info" },
    { domain: "Outcomes", metric: "Highest exit", value: hasCalc ? fmtINR(cs.highestExitValue) : "—", ratio: hasCalc ? pctOf(cs.highestExitValue, cs.totalExitValue) : null, basis: "Share of total modeled exit", tone: "good" },
    { domain: "Outcomes", metric: "Total modeled exit", value: hasCalc ? fmtINR(cs.totalExitValue) : "—", ratio: null, basis: "Sum of saved exit values", tone: "info" },
    { domain: "Outcomes", metric: "Average ROI", value: hasCalc ? fmtPct(cs.averageRoiPercentage) : "—", ratio: hasCalc && maxRoi > 0 ? pctOf(cs.averageRoiPercentage, maxRoi) : null, basis: "Average ÷ best saved ROI", tone: cs.averageRoiPercentage < 0 ? "risk" : "good" },
    { domain: "Outcomes", metric: "Average return multiple", value: hasCalc ? fmtX(cs.averageReturnMultiple) : "—", ratio: hasCalc && maxMult > 0 ? pctOf(cs.averageReturnMultiple, maxMult) : null, basis: "Average ÷ best saved multiple", tone: "good" },
    { domain: "Outcomes", metric: "Exercise cost vs highest exit", value: hasCalc && gs.totalExerciseCost > 0 && cs.highestExitValue > 0 ? fmtPct((gs.totalExerciseCost / cs.highestExitValue) * 100) : "—", ratio: hasCalc ? pctOf(gs.totalExerciseCost, cs.highestExitValue) : null, basis: "Exercise cost ÷ highest exit", tone: "neutral" },
    { domain: "Activity", metric: "Activity events", value: fmtNum(member.activitySummary.activityCount), ratio: null, basis: member.activitySummary.lastActivityAt ? `Last ${fmtDate(member.activitySummary.lastActivityAt)}` : "No activity recorded", tone: "info" },
    ...d.types.map<MRow>((t) => ({ domain: "Activity", metric: t.type, value: fmtNum(t.count), ratio: pctOf(t.count, d.eventTotal), basis: "Share of events", tone: "info", activityType: t.type })),
    { domain: "Documents", metric: "Documents", value: fmtNum(ds.documentCount), ratio: pctOf(ds.confirmedDocumentCount, ds.documentCount), basis: `${ds.confirmedDocumentCount} confirmed`, tone: "good" },
    { domain: "Documents", metric: "Clauses", value: fmtNum(ds.clauseCount), ratio: null, basis: "Extracted clauses", tone: "neutral" },
    { domain: "Documents", metric: "In review", value: fmtNum(ds.reviewDocumentCount), ratio: pctOf(ds.reviewDocumentCount, ds.documentCount), basis: "Review ÷ documents", tone: ds.reviewDocumentCount > 0 ? "warn" : "neutral" },
    { domain: "Expiry", metric: "Expiring options (≤365d)", value: fmtNum(d.expiringOptions), ratio: pctOf(d.expiringOptions, gs.totalOptions), basis: "Share of confirmed options", tone: d.expiringOptions > 0 ? "risk" : "good" },
    { domain: "Expiry", metric: "Expiring grants (≤365d)", value: fmtNum(d.expiringGrants), ratio: pctOf(d.expiringGrants, gs.grantCount), basis: "Share of persisted grants", tone: d.expiringGrants > 0 ? "warn" : "good" },
    { domain: "Expiry", metric: "Already expired options", value: fmtNum(d.expiredOptions), ratio: pctOf(d.expiredOptions, gs.totalOptions), basis: "Share of confirmed options", tone: d.expiredOptions > 0 ? "risk" : "good" },
  ];
  return rows;
}

const TONE_BAR: Record<RowTone, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  risk: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-slate-400",
};

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

function useCountUp(target: number): number {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const controls = animate(current.current, target, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (x) => {
        current.current = x;
        setValue(Math.round(x));
      },
    });
    return () => controls.stop();
  }, [target]);
  return value;
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

type SortKey = "default" | "metric" | "ratio";

export default function TeamAnalyticsCharts({ member }: Props) {
  const d = useMemo(() => derive(member), [member]);

  const [selCalc, setSelCalc] = useState<string | null>(null);
  const [selBucket, setSelBucket] = useState<Band | null>(null);
  const [selType, setSelType] = useState<string | null>(null);
  const [hoverType, setHoverType] = useState<string | null>(null);
  const [mode, setMode] = useState<"daily" | "cumulative">("daily");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "default", dir: 1 });

  useEffect(() => {
    setSelCalc(null);
    setSelBucket(null);
    setSelType(null);
    setHoverType(null);
  }, [member]);

  const focusType = hoverType ?? selType;
  const focusCount = focusType ? d.types.find((t) => t.type === focusType)?.count ?? d.eventTotal : d.eventTotal;
  const display = useCountUp(focusCount);

  const equityOpt = useMemo(() => buildEquity(d), [d]);
  const econOpt = useMemo(() => buildEconomics(member, d), [member, d]);
  const rankOpt = useMemo(() => buildRanking(d, selCalc), [d, selCalc]);
  const trendOpt = useMemo(() => buildTrend(d, selCalc), [d, selCalc]);
  const scatterOpt = useMemo(() => buildScatter(d, selCalc), [d, selCalc]);
  const activityOpt = useMemo(() => buildActivity(d, mode), [d, mode]);
  const mixOpt = useMemo(() => buildMix(d, selType, hoverType, display), [d, selType, hoverType, display]);
  const riskOpt = useMemo(() => buildExpiryRisk(d, selBucket), [d, selBucket]);
  const bucketOpt = useMemo(() => buildBuckets(d, selBucket), [d, selBucket]);

  const rankEvents = useMemo(
    () => ({
      click: (p: PickParam) => {
        const c = d.calcsRank[p.dataIndex ?? -1];
        if (c) setSelCalc((cur) => toggle(cur, c.id));
      },
    }),
    [d]
  );
  const asc = useMemo(
    () => ({
      click: (p: PickParam) => {
        const c = d.calcsAsc[p.dataIndex ?? -1];
        if (c) setSelCalc((cur) => toggle(cur, c.id));
      },
    }),
    [d]
  );
  const mixEvents = useMemo(
    () => ({
      click: (p: PickParam) => {
        if (p.name) setSelType((cur) => toggle(cur, p.name as string));
      },
      mouseover: (p: PickParam) => setHoverType(p.name ?? null),
      mouseout: () => setHoverType(null),
    }),
    []
  );
  const riskEvents = useMemo(
    () => ({
      click: (p: PickParam) => {
        const r = d.expiry[p.dataIndex ?? -1];
        if (r) setSelBucket((cur) => toggle<Band>(cur, r.band));
      },
    }),
    [d]
  );
  const bucketEvents = useMemo(
    () => ({
      click: (p: PickParam) => {
        const b = d.buckets[p.dataIndex ?? -1];
        if (b) setSelBucket((cur) => toggle<Band>(cur, b.band));
      },
    }),
    [d]
  );

  const cs = member.calculationSummary;
  const gs = member.grantSummary;
  const ds = member.documentSummary;
  const hasCalc = cs.calculationCount > 0;
  const hasGrants = d.companies.length > 0 || gs.totalOptions > 0;
  const topCalc = d.calcsRank[0];
  const latestCalc = d.calcsAsc[d.calcsAsc.length - 1];
  const minMult = hasCalc ? Math.min(...d.calcsAsc.map((c) => c.returnMultiple)) : 0;
  const maxMult = hasCalc ? Math.max(...d.calcsAsc.map((c) => c.returnMultiple)) : 0;
  const urgent = d.buckets[0].options + d.buckets[1].options;

  const selected = selCalc ? d.calcsRank.find((c) => c.id === selCalc) ?? null : null;
  const selectedRank = selected ? d.calcsRank.findIndex((c) => c.id === selected.id) + 1 : 0;

  const matrix = useMemo(() => {
    const rows = buildMatrix(member, d).map((r, i) => ({ r, i }));
    if (sort.key === "default") return rows.map((x) => x.r);
    rows.sort((a, b) => {
      if (sort.key === "metric") return a.r.metric.localeCompare(b.r.metric) * sort.dir;
      return ((a.r.ratio ?? -1) - (b.r.ratio ?? -1)) * sort.dir;
    });
    return rows.map((x) => x.r);
  }, [member, d, sort]);

  const setSortKey = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "ratio" ? -1 : 1 }));

  const clearAll = () => {
    setSelCalc(null);
    setSelBucket(null);
    setSelType(null);
  };
  const anySel = Boolean(selCalc || selBucket || selType);

  const noGrants = <Empty title="No persisted grant data" body="Confirmed grants will appear here." />;
  const noCalcs = <Empty title="No saved calculations" body="Saved EVC outcomes will appear here." />;
  const noExpiry = <Empty title="No expiry records" body="Persisted expiry dates will populate this analysis." />;

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="mt-3 space-y-2">
      {/* KPI command strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Confirmed options" value={fmtNum(gs.totalOptions)} caption={`${gs.companies.length} ${gs.companies.length === 1 ? "company" : "companies"}`} tone="info" />
        <Kpi label="Confirmed grants" value={fmtNum(gs.confirmedGrantCount)} caption={`${gs.grantCount} persisted in total`} tone="info" />
        <Kpi label="Exercise exposure" value={gs.totalExerciseCost > 0 ? fmtCompact(gs.totalExerciseCost) : "—"} caption={d.avgStrike !== null && gs.totalExerciseCost > 0 ? `Avg ${fmtINR(d.avgStrike)} per option` : "No exercise cost persisted"} tone="warn" />
        <Kpi label="Saved calculations" value={fmtNum(cs.calculationCount)} caption={latestCalc ? `Latest ${fmtDate(latestCalc.createdAt)}` : "None saved yet"} tone="info" />
        <Kpi label="Highest saved exit" value={hasCalc ? fmtCompact(cs.highestExitValue) : "—"} caption={topCalc ? topCalc.name : "No saved outcome"} tone="good" />
        <Kpi label="Total modeled exit" value={hasCalc ? fmtCompact(cs.totalExitValue) : "—"} caption={hasCalc ? `Across ${cs.calculationCount} scenarios` : "No saved outcome"} tone="info" />
        <Kpi label="Average ROI" value={hasCalc ? fmtPct(cs.averageRoiPercentage) : "—"} caption={hasCalc ? "Mean of saved scenarios" : "No saved outcome"} tone={hasCalc ? (cs.averageRoiPercentage < 0 ? "risk" : "good") : "neutral"} />
        <Kpi label="Avg return multiple" value={hasCalc ? fmtX(cs.averageReturnMultiple) : "—"} caption={hasCalc ? `Range ${fmtX(minMult)} to ${fmtX(maxMult)}` : "No saved outcome"} tone="good" />
        <Kpi label="Average exit value" value={hasCalc ? fmtCompact(cs.averageExitValue) : "—"} caption={hasCalc && cs.averageExitValue > 0 ? `Peak is ${(cs.highestExitValue / cs.averageExitValue).toFixed(1)}x the average` : "No saved outcome"} tone="info" />
        <Kpi label="Activity events" value={fmtNum(member.activitySummary.activityCount)} caption={member.activitySummary.lastActivityAt ? `Last ${fmtDate(member.activitySummary.lastActivityAt)}` : "No activity yet"} tone="info" />
        <Kpi label="Documents" value={fmtNum(ds.documentCount)} caption={`${ds.confirmedDocumentCount} confirmed, ${ds.clauseCount} clauses`} tone={ds.reviewDocumentCount > 0 ? "warn" : "info"} />
        <Kpi label="Expiring options (≤365d)" value={fmtNum(d.expiringOptions)} caption={`${d.expiringGrants} grants, ${fmtNum(d.expiredOptions)} options already expired`} tone={urgent > 0 ? "risk" : d.expiringOptions > 0 ? "warn" : "good"} />
      </div>

      {/* Selection bar */}
      <div className="flex min-h-[34px] flex-wrap items-center gap-2 border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600">
        <span className="font-semibold text-slate-900">Selection</span>
        {!anySel && <span className="text-slate-400">Click a calculation, expiry band or activity type to cross-filter every dependent visual.</span>}
        {selected && (
          <motion.span key={selected.id} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-900">
            <b>{selected.name}</b>
            <span>Exit {fmtINR(selected.exitValue)}</span>
            <span>ROI {fmtPct(selected.roiPercentage)}</span>
            <span>{fmtX(selected.returnMultiple)}</span>
            <span>Rank {selectedRank} of {d.calcsRank.length}</span>
            {cs.totalExitValue > 0 && <span>{fmtPct((selected.exitValue / cs.totalExitValue) * 100)} of total</span>}
            <span>Saved {fmtDate(selected.createdAt)}</span>
            <Chip onClear={() => setSelCalc(null)} />
          </motion.span>
        )}
        {selBucket && (
          <span className="inline-flex items-center gap-2 border border-slate-300 bg-slate-50 px-2 py-0.5">
            <i className="inline-block h-2 w-2" style={{ background: BAND_COLOR[selBucket] }} />
            Expiry: {selBucket}
            <Chip onClear={() => setSelBucket(null)} />
          </span>
        )}
        {selType && (
          <span className="inline-flex items-center gap-2 border border-slate-300 bg-slate-50 px-2 py-0.5">
            Activity: {selType}
            <Chip onClear={() => setSelType(null)} />
          </span>
        )}
        {anySel && (
          <button type="button" onClick={clearAll} className="ml-auto text-[11px] font-medium text-blue-600 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* 12-column analytical grid */}
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
        <Panel n={1} title="Equity position" question="How much equity exposure does this member have?" span="xl:col-span-7"
          note="Vested/unvested split is not part of the persisted member data, so it is not shown.">
          {hasGrants && d.companies.length > 0 ? <Chart option={equityOpt} height={Math.max(220, d.companies.length * 40 + 50)} /> : noGrants}
        </Panel>

        <Panel n={2} title="Exercise economics" question="What would exercising cost against modeled exits?" span="xl:col-span-5">
          {gs.totalExerciseCost > 0 || hasCalc ? <Chart option={econOpt} height={Math.max(220, 40 * (hasCalc ? 4 : 1) + 50)} /> : noGrants}
        </Panel>

        <Panel n={3} title="Saved outcome ranking" question="Which saved scenario drives the most modeled value?" span="xl:col-span-5">
          {hasCalc ? <Chart option={rankOpt} height={Math.min(460, Math.max(240, d.calcsRank.length * 30 + 40))} onEvents={rankEvents} /> : noCalcs}
        </Panel>

        <Panel n={4} dark title="Exit value over time" question="How have modeled exits changed as scenarios were saved?" span="xl:col-span-7">
          {hasCalc ? <Chart option={trendOpt} height={Math.min(460, Math.max(240, d.calcsRank.length * 30 + 40))} onEvents={asc} /> : <Empty dark title="No saved calculations" body="Saved EVC outcomes will appear here." />}
        </Panel>

        <Panel n={5} dark title="ROI vs return multiple" question="Which modeled outcomes have the strongest risk/reward profile?" span="xl:col-span-6" note="Bubble size is exit value. Dashed lines mark 0% ROI and 1x.">
          {hasCalc ? <Chart option={scatterOpt} height={340} onEvents={asc} /> : <Empty dark title="No saved calculations" body="Saved EVC outcomes will appear here." />}
        </Panel>

        <Panel n={6} dark title="Activity intelligence" question="How active is this member over time?" span="xl:col-span-6"
          aside={
            d.timeline.length > 0 ? (
              <div className="flex border border-slate-600 text-[10px]">
                {(["daily", "cumulative"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={`px-2 py-0.5 capitalize transition ${mode === m ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
                    {m}
                  </button>
                ))}
              </div>
            ) : null
          }>
          {d.timeline.length > 0 ? <Chart option={activityOpt} height={340} notMerge /> : <Empty dark title="No activity recorded" body="Persisted member activity will appear here." />}
        </Panel>

        <Panel n={7} title="Activity mix" question="What type of EVC activity is this member performing?" span="xl:col-span-4">
          {d.eventTotal > 0 ? <Chart option={mixOpt} height={300} onEvents={mixEvents} /> : <Empty title="No activity recorded" body="Persisted member activity will appear here." />}
        </Panel>

        <Panel n={8} title="Expiry risk monitor" question="Which grants are closest to expiring?" span="xl:col-span-8"
          note={selBucket ? `Focused on ${selBucket}. Click the same band again to clear.` : "Rows are ordered nearest expiry first."}>
          {d.expiry.length > 0 ? <Chart option={riskOpt} height={Math.min(440, Math.max(240, d.expiry.length * 30 + 40))} onEvents={riskEvents} /> : noExpiry}
        </Panel>

        <Panel n={9} title="Expiry exposure distribution" question="Where is the expiry exposure concentrated?" span="xl:col-span-12">
          {d.expiry.length > 0 ? <Chart option={bucketOpt} height={240} onEvents={bucketEvents} /> : noExpiry}
        </Panel>

        <Panel n={10} title="Member intelligence matrix" question="The full member position in one scan." span="xl:col-span-12">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-3 py-1.5 font-medium">
                    <button type="button" onClick={() => setSortKey("default")} className={sort.key === "default" ? "text-slate-900" : ""}>Domain</button>
                  </th>
                  <th className="px-3 py-1.5 font-medium">
                    <button type="button" onClick={() => setSortKey("metric")} className={sort.key === "metric" ? "text-slate-900" : ""}>
                      Metric{sort.key === "metric" ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                  <th className="px-3 py-1.5 text-right font-medium">Value</th>
                  <th className="w-[220px] px-3 py-1.5 font-medium">
                    <button type="button" onClick={() => setSortKey("ratio")} className={sort.key === "ratio" ? "text-slate-900" : ""}>
                      Ratio{sort.key === "ratio" ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                  <th className="px-3 py-1.5 font-medium">Basis</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((r, i) => {
                  const active = r.activityType !== undefined && r.activityType === focusType;
                  return (
                    <tr
                      key={`${r.domain}-${r.metric}-${i}`}
                      title={`${r.metric}: ${r.value} (${r.basis})`}
                      onMouseEnter={() => r.activityType && setHoverType(r.activityType)}
                      onMouseLeave={() => r.activityType && setHoverType(null)}
                      onClick={() => {
                        const t = r.activityType;
                        if (t) setSelType((cur) => toggle(cur, t));
                      }}
                      className={`border-b border-slate-100 transition-colors hover:bg-blue-50/60 ${r.activityType ? "cursor-pointer" : ""} ${active ? "bg-blue-50" : ""}`}
                    >
                      <td className="px-3 py-1.5 text-slate-500">{r.domain}</td>
                      <td className="px-3 py-1.5 font-medium text-slate-900">{r.metric}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-900">{r.value}</td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-slate-100">
                            {r.ratio !== null && <div className={`h-2 ${TONE_BAR[r.tone]} transition-all`} style={{ width: `${r.ratio}%` }} />}
                          </div>
                          <span className="w-12 text-right tabular-nums text-slate-500">{r.ratio !== null ? fmtPct(r.ratio) : "—"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-slate-500">{r.basis}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* Presentational helpers                                              */
/* ------------------------------------------------------------------ */

function Chart({
  option,
  height,
  onEvents,
  notMerge = false,
}: {
  option: EChartsOption;
  height: number;
  onEvents?: Record<string, (params: PickParam) => void>;
  notMerge?: boolean;
}) {
  return <ReactECharts option={option} style={{ height, width: "100%" }} onEvents={onEvents} notMerge={notMerge} lazyUpdate />;
}

function Panel({
  n,
  title,
  question,
  span,
  dark = false,
  note,
  aside,
  children,
}: {
  n: number;
  title: string;
  question: string;
  span: string;
  dark?: boolean;
  note?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${span} min-w-0 border ${dark ? "border-slate-700 bg-[#0a1020] text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}>
      <header className={`flex items-center justify-between gap-3 border-b px-3 py-1.5 ${dark ? "border-slate-700" : "border-slate-200"}`}>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-semibold tabular-nums text-blue-500">V{n}</span>
            <h3 className="truncate text-[12px] font-semibold">{title}</h3>
          </div>
          <p className={`truncate text-[10px] ${dark ? "text-slate-400" : "text-slate-500"}`}>{question}</p>
        </div>
        {aside}
      </header>
      <div className="p-2">{children}</div>
      {note && <p className={`border-t px-3 py-1 text-[10px] ${dark ? "border-slate-700 text-slate-400" : "border-slate-100 text-slate-500"}`}>{note}</p>}
    </section>
  );
}

function Empty({ title, body, dark = false }: { title: string; body: string; dark?: boolean }) {
  const line = dark ? "rgba(148,163,184,0.12)" : "#eef2f7";
  return (
    <div
      className="flex h-[220px] flex-col items-center justify-center border border-dashed text-center"
      style={{
        borderColor: dark ? "rgba(148,163,184,0.3)" : "#cbd5e1",
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px)`,
        backgroundSize: "100% 32px",
      }}
    >
      <p className={`text-[12px] font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>{title}</p>
      <p className={`mt-1 text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>{body}</p>
    </div>
  );
}

const KPI_STRIP: Record<RowTone, string> = {
  good: "border-l-emerald-500",
  warn: "border-l-amber-500",
  risk: "border-l-red-500",
  info: "border-l-blue-500",
  neutral: "border-l-slate-300",
};
const KPI_VALUE: Record<RowTone, string> = {
  good: "text-emerald-700",
  warn: "text-amber-700",
  risk: "text-red-600",
  info: "text-slate-900",
  neutral: "text-slate-400",
};

function Kpi({ label, value, caption, tone }: { label: string; value: string; caption: string; tone: RowTone }) {
  return (
    <div className={`border-l-2 bg-white px-3 py-2 ${KPI_STRIP[tone]}`}>
      <p className="truncate text-[10px] font-medium text-slate-500">{label}</p>
      <p className={`mt-0.5 text-[20px] font-semibold leading-tight tabular-nums ${KPI_VALUE[tone]}`}>{value}</p>
      <p className="mt-0.5 truncate text-[10px] text-slate-500" title={caption}>
        {caption}
      </p>
    </div>
  );
}

function Chip({ onClear }: { onClear: () => void }) {
  return (
    <button type="button" aria-label="Clear selection" onClick={onClear} className="text-slate-500 hover:text-slate-900">
      <X size={12} />
    </button>
  );
}

"use client";

import { useMemo, useState } from "react";
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

import type { TaxDeadline } from "@/components/advisor/tax-types";
import { COLOUR, Chip, Panel, daysFrom, day } from "@/components/advisor/tax-ui";

const AXIS_TICK = { fontSize: 11, fill: "#64748b" } as const;

const TOOLTIP_STYLE = {
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  fontSize: 12,
  padding: "6px 10px",
} as const;

type Filter = "ALL" | "OVERDUE" | "30" | "LATER";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function TaxDeadlinesCard({
  deadlines,
  asOf,
}: {
  deadlines: TaxDeadline[];
  asOf: string;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");

  const rows = useMemo(
    () => deadlines.map((d) => ({ ...d, left: daysFrom(asOf, d.dueDate) })),
    [deadlines, asOf]
  );

  const counts = useMemo(
    () => ({
      overdue: rows.filter((r) => r.left < 0).length,
      soon: rows.filter((r) => r.left >= 0 && r.left <= 30).length,
      later: rows.filter((r) => r.left > 30).length,
    }),
    [rows]
  );

  const chart = useMemo(() => {
    const buckets = new Map<string, { label: string; value: number; overdue: boolean; order: number }>();

    for (const r of rows) {
      if (r.left < 0) {
        const b = buckets.get("overdue") ?? { label: "Overdue", value: 0, overdue: true, order: -1 };
        b.value += 1;
        buckets.set("overdue", b);
        continue;
      }

      const d = new Date(r.dueDate);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      const b = buckets.get(key) ?? {
        label: `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`,
        value: 0,
        overdue: false,
        order: d.getUTCFullYear() * 12 + d.getUTCMonth(),
      };
      b.value += 1;
      buckets.set(key, b);
    }

    return Array.from(buckets.values()).sort((a, b) => a.order - b.order).slice(0, 12);
  }, [rows]);

  const shown = rows.filter((r) =>
    filter === "ALL" ? true : filter === "OVERDUE" ? r.left < 0 : filter === "30" ? r.left >= 0 && r.left <= 30 : r.left > 30
  );

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "ALL", label: `All (${rows.length})` },
    { key: "OVERDUE", label: `Overdue (${counts.overdue})` },
    { key: "30", label: `Next 30 days (${counts.soon})` },
    { key: "LATER", label: `Later (${counts.later})` },
  ];

  return (
    <div className="space-y-4">
      <Panel title="Deadlines by month" caption="Number of items due">
        {chart.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
            Deadlines appear once an exercise is recorded.
          </div>
        ) : (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef2f6" />
                <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={TOOLTIP_STYLE} formatter={(v) => [String(v), "Due"]} />
                <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={36}>
                  {chart.map((c) => (
                    <Cell key={c.label} fill={c.overdue ? COLOUR.red : COLOUR.blue} />
                  ))}
                  <LabelList dataKey="value" position="top" style={{ fontSize: 11, fill: "#334155", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel
        title="Deadline calendar"
        caption="Email reminders go out 30, 7 and 1 day before, and on the day"
        action={
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  filter === f.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        {shown.length === 0 ? (
          <p className="py-6 text-center text-xs font-medium text-slate-500">Nothing in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-[0.08em] text-slate-400">
                  <th className="py-2 pr-3 font-semibold">Due</th>
                  <th className="py-2 pr-3 font-semibold">When</th>
                  <th className="py-2 pr-3 font-semibold">What</th>
                  <th className="py-2 pr-3 font-semibold">Employee</th>
                  <th className="py-2 font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={`${r.eventId}-${r.code}-${r.dueDate}`} className="border-b border-slate-50 align-top">
                    <td className="py-2.5 pr-3 tabular-nums text-slate-800">{day(r.dueDate)}</td>
                    <td className="py-2.5 pr-3">
                      {r.left < 0 ? (
                        <Chip colour="red">{-r.left}d overdue</Chip>
                      ) : r.left === 0 ? (
                        <Chip colour="red">Today</Chip>
                      ) : r.left <= 7 ? (
                        <Chip colour="amber">In {r.left}d</Chip>
                      ) : (
                        <Chip colour="slate">In {r.left}d</Chip>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-900">
                      {r.label}
                      {r.note && <span className="mt-0.5 block text-[11px] text-slate-400">{r.note}</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">{r.employeeName}</td>
                    <td className="py-2.5 text-slate-600">{r.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
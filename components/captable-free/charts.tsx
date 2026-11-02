"use client";

/**
 * Thin, interactive charts for the free cap table builder.
 * Plain SVG / HTML (no chart library) so lines stay crisp and every
 * chart shares one "focus" for dashboard-style cross-highlighting.
 */

import { useRef, useState, type ReactNode } from "react";

export type Datum = { key: string; label: string; value: number; color: string; sub?: string };

/* ============================================================
   PANEL (card chrome shared by every visual)
============================================================ */

export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`ct-panel relative min-w-0 rounded-2xl border border-slate-200/80 bg-white ${className}`}>
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-[#0b1220]">{title}</h3>
          {subtitle ? <p className="mt-0.5 truncate text-[11px] text-slate-500">{subtitle}</p> : null}
        </div>
        {right}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ============================================================
   KPI TILE
============================================================ */

export function KpiTile({
  label,
  value,
  sub,
  delta,
  accent = "#042653",
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: { text: string; tone: "up" | "down" | "flat" } | null;
  accent?: string;
}) {
  return (
    <div className="ct-kpi group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(4,38,83,0.45)]">
      <span className="absolute inset-y-0 left-0 w-[3px] transition-all duration-300 group-hover:w-[5px]" style={{ background: accent }} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p key={value} className="ct-pop mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.03em] text-[#0b1220]">
        {value}
      </p>
      <div className="mt-0.5 flex min-h-[18px] items-center gap-2 text-[11px]">
        {delta ? (
          <span
            className={`rounded px-1.5 py-0.5 font-semibold tabular-nums ${
              delta.tone === "down" ? "bg-rose-50 text-rose-600" : delta.tone === "up" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {delta.text}
          </span>
        ) : null}
        {sub ? <span className="truncate text-slate-500">{sub}</span> : null}
      </div>
    </div>
  );
}

/* ============================================================
   DONUT
============================================================ */

export function Donut({
  data,
  focus,
  onFocus,
  size = 220,
  thickness = 22,
  centerTitle,
  centerValue,
}: {
  data: Datum[];
  focus: string | null;
  onFocus: (key: string | null) => void;
  size?: number;
  thickness?: number;
  centerTitle: string;
  centerValue: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2 - 4;
  const C = 2 * Math.PI * r;
  const gap = data.length > 1 ? 2.5 : 0;

  let acc = 0;
  const arcs = data.map((d) => {
    const frac = total > 0 ? d.value / total : 0;
    const len = Math.max(0, frac * C - gap);
    const offset = -acc * C;
    acc += frac;
    return { ...d, len, offset, frac };
  });

  const focused = arcs.find((a) => a.key === focus);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" onMouseLeave={() => onFocus(null)}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F7" strokeWidth={thickness} />
        {arcs.map((a) => {
          const dim = focus !== null && focus !== a.key;
          const active = focus === a.key;
          return (
            <circle
              key={a.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={active ? thickness + 6 : thickness}
              strokeDasharray={`${a.len} ${C}`}
              strokeDashoffset={a.offset}
              className="ct-arc cursor-pointer"
              style={{ opacity: dim ? 0.22 : 1 }}
              onMouseEnter={() => onFocus(a.key)}
              onClick={() => onFocus(a.key)}
            />
          );
        })}
        {/* thin inner guide ring */}
        <circle cx={size / 2} cy={size / 2} r={r - thickness / 2 - 8} fill="none" stroke="#E2E8F0" strokeWidth={1} strokeDasharray="2 4" />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{focused ? focused.label : centerTitle}</p>
        <p key={focused?.key ?? "total"} className="ct-pop mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-[#0b1220]">
          {focused ? `${(focused.frac * 100).toFixed(1)}%` : centerValue}
        </p>
        {focused?.sub ? <p className="mt-0.5 text-[11px] text-slate-500">{focused.sub}</p> : null}
      </div>
    </div>
  );
}

export function Legend({
  data,
  focus,
  onFocus,
}: {
  data: Datum[];
  focus: string | null;
  onFocus: (key: string | null) => void;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className="space-y-1" onMouseLeave={() => onFocus(null)}>
      {data.map((d) => {
        const dim = focus !== null && focus !== d.key;
        return (
          <li
            key={d.key}
            onMouseEnter={() => onFocus(d.key)}
            className={`flex cursor-default items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[12px] transition ${
              focus === d.key ? "bg-slate-50" : ""
            } ${dim ? "opacity-40" : ""}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="truncate text-slate-700">{d.label}</span>
            </span>
            <span className="font-semibold tabular-nums text-[#0b1220]">{total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0"}%</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ============================================================
   HORIZONTAL BARS (thin, with grid)
============================================================ */

export function HBars({
  data,
  focus,
  onFocus,
  max,
  format,
}: {
  data: Datum[];
  focus: string | null;
  onFocus: (key: string | null) => void;
  max?: number;
  format: (v: number) => string;
}) {
  const top = max ?? Math.max(20, Math.ceil(Math.max(0, ...data.map((d) => d.value)) / 20) * 20);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="relative" onMouseLeave={() => onFocus(null)}>
      {/* grid */}
      <div className="pointer-events-none absolute inset-y-0 left-[38%] right-[56px]">
        {ticks.map((t) => (
          <span key={t} className="absolute inset-y-0 w-px bg-slate-100" style={{ left: `${t * 100}%` }} />
        ))}
      </div>
      <ul className="relative space-y-2">
        {data.map((d, i) => {
          const dim = focus !== null && focus !== d.key && focus !== d.sub;
          const w = Math.max(0.5, (d.value / top) * 100);
          return (
            <li
              key={d.key}
              onMouseEnter={() => onFocus(d.key)}
              className={`grid cursor-default grid-cols-[38%_1fr_56px] items-center gap-0 transition-opacity duration-300 ${dim ? "opacity-30" : ""}`}
            >
              <span className="truncate pr-3 text-[12px] text-slate-700">{d.label}</span>
              <span className="relative h-[9px] rounded-full bg-slate-50">
                <span
                  className="ct-bar absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${w}%`, background: d.color, transitionDelay: `${i * 25}ms` }}
                />
              </span>
              <span className="text-right text-[12px] font-semibold tabular-nums text-[#0b1220]">{format(d.value)}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 grid grid-cols-[38%_1fr_56px] text-[10px] text-slate-400">
        <span />
        <span className="relative h-3">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${t * 100}%` }}>
              {format(top * t)}
            </span>
          ))}
        </span>
        <span />
      </div>
    </div>
  );
}

/* ============================================================
   100% STACKED: BEFORE vs AFTER
============================================================ */

export function StackedCompare({
  rows,
  focus,
  onFocus,
}: {
  rows: { label: string; segments: Datum[] }[];
  focus: string | null;
  onFocus: (key: string | null) => void;
}) {
  const [tip, setTip] = useState<{ x: number; y: number; d: Datum; label: string } | null>(null);
  const box = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={box} className="relative" onMouseLeave={() => { onFocus(null); setTip(null); }}>
      <div className="space-y-5">
        {rows.map((row) => {
          const total = row.segments.reduce((s, d) => s + d.value, 0);
          return (
            <div key={row.label}>
              <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
                <span className="font-semibold uppercase tracking-[0.12em]">{row.label}</span>
                <span className="tabular-nums">100%</span>
              </div>
              <div className="flex h-8 w-full overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100">
                {row.segments.map((d) => {
                  const w = total > 0 ? (d.value / total) * 100 : 0;
                  const dim = focus !== null && focus !== d.key;
                  return (
                    <span
                      key={d.key}
                      className="ct-seg relative h-full cursor-pointer border-r border-white/70 last:border-0"
                      style={{ width: `${w}%`, background: d.color, opacity: dim ? 0.25 : 1 }}
                      onMouseEnter={() => onFocus(d.key)}
                      onMouseMove={(e) => {
                        const rect = box.current?.getBoundingClientRect();
                        if (rect) setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, d: { ...d, value: w }, label: row.label });
                      }}
                    >
                      {w > 9 ? (
                        <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold tabular-nums text-white/95 mix-blend-normal">
                          {w.toFixed(0)}%
                        </span>
                      ) : null}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {tip ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[120%] whitespace-nowrap rounded-lg bg-[#0b1220] px-2.5 py-1.5 text-[11px] text-white shadow-lg"
          style={{ left: tip.x, top: tip.y }}
        >
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: tip.d.color }} />
          {tip.d.label} · <span className="font-semibold tabular-nums">{tip.d.value.toFixed(1)}%</span>
          <span className="text-slate-400"> {tip.label.toLowerCase()}</span>
        </div>
      ) : null}
    </div>
  );
}

/* ============================================================
   DUMBBELL: % before → % after per holder
============================================================ */

export function Dumbbell({
  rows,
  focus,
  onFocus,
}: {
  rows: { key: string; label: string; before: number; after: number; color: string; group: string; isNew?: boolean }[];
  focus: string | null;
  onFocus: (key: string | null) => void;
}) {
  const top = Math.max(20, Math.ceil(Math.max(...rows.map((r) => Math.max(r.before, r.after)), 0) / 20) * 20);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top);

  return (
    <div onMouseLeave={() => onFocus(null)}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-[34%] right-[64px]">
          {ticks.map((t) => (
            <span key={t} className="absolute inset-y-0 w-px bg-slate-100" style={{ left: `${(t / top) * 100}%` }} />
          ))}
        </div>
        <ul className="relative space-y-1">
          {rows.map((r) => {
            const a = (Math.min(r.before, r.after) / top) * 100;
            const b = (Math.max(r.before, r.after) / top) * 100;
            const delta = r.after - r.before;
            const dim = focus !== null && focus !== r.key && focus !== r.group;
            return (
              <li
                key={r.key}
                onMouseEnter={() => onFocus(r.key)}
                className={`grid h-8 cursor-default grid-cols-[34%_1fr_64px] items-center transition-opacity duration-300 ${dim ? "opacity-25" : ""}`}
              >
                <span className="truncate pr-3 text-[12px] text-slate-700">
                  {r.label}
                  {r.isNew ? <span className="ml-1.5 rounded bg-violet-50 px-1 py-px text-[9px] font-semibold text-violet-600">NEW</span> : null}
                </span>
                <span className="relative h-full">
                  <span className="ct-line absolute top-1/2 h-px -translate-y-1/2 bg-slate-300" style={{ left: `${a}%`, width: `${Math.max(0, b - a)}%` }} />
                  {!r.isNew ? (
                    <span
                      className="ct-dot absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white"
                      style={{ left: `${(r.before / top) * 100}%`, borderColor: r.color }}
                      title={`Today ${r.before.toFixed(2)}%`}
                    />
                  ) : null}
                  <span
                    className="ct-dot absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: `${(r.after / top) * 100}%`, background: r.color }}
                    title={`After ${r.after.toFixed(2)}%`}
                  />
                </span>
                <span className={`text-right text-[11px] font-semibold tabular-nums ${delta < -0.005 ? "text-rose-600" : delta > 0.005 ? "text-emerald-600" : "text-slate-400"}`}>
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)} pts
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-2 grid grid-cols-[34%_1fr_64px] text-[10px] text-slate-400">
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full border-2 border-slate-400 bg-white" /> Today</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-500" /> After</span>
        </span>
        <span className="relative h-3">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${(t / top) * 100}%` }}>
              {t.toFixed(0)}%
            </span>
          ))}
        </span>
        <span />
      </div>
    </div>
  );
}

/* ============================================================
   SHARED STYLES (import once per page)
============================================================ */

export function ChartStyles() {
  return (
    <style>{`
      .ct-arc { transition: stroke-dasharray .8s cubic-bezier(.16,1,.3,1), stroke-dashoffset .8s cubic-bezier(.16,1,.3,1), stroke-width .25s ease, opacity .3s ease; }
      .ct-bar { transition: width .8s cubic-bezier(.16,1,.3,1); }
      .ct-seg { transition: width .8s cubic-bezier(.16,1,.3,1), opacity .3s ease; }
      .ct-line { transition: left .8s cubic-bezier(.16,1,.3,1), width .8s cubic-bezier(.16,1,.3,1); }
      .ct-dot { transition: left .8s cubic-bezier(.16,1,.3,1), transform .2s ease; }
      li:hover > span > .ct-dot { transform: translate(-50%, -50%) scale(1.35); }
      .ct-pop { animation: ct-pop .45s cubic-bezier(.34,1.56,.64,1) both; }
      @keyframes ct-pop { from { opacity: 0; transform: translateY(4px) scale(.97); } to { opacity: 1; transform: none; } }
      .ct-rise { animation: ct-rise .7s cubic-bezier(.16,1,.3,1) both; }
      @keyframes ct-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
      @media (prefers-reduced-motion: reduce) {
        .ct-arc, .ct-bar, .ct-seg, .ct-line, .ct-dot { transition: none !important; }
        .ct-pop, .ct-rise { animation: none !important; }
      }
    `}</style>
  );
}

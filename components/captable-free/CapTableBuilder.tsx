"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  LockKeyhole,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

import {
  BLANK_HOLDERS,
  EXAMPLE_HOLDERS,
  EXAMPLE_ROUND,
  GROUPS,
  NEW_INVESTOR_COLOR,
  computeCapTable,
  fmtInr,
  fmtPct,
  fmtShares,
  groupMeta,
  newId,
  parseNumber,
  toCsv,
  type Holder,
  type HolderGroup,
  type RoundInput,
} from "@/lib/captable-free/math";
import { ChartStyles, Donut, Dumbbell, HBars, KpiTile, Legend, Panel, StackedCompare, type Datum } from "./charts";

/* ============================================================
   STORAGE (this browser only, for convenience)
============================================================ */

const STORE_KEY = "evc:free-captable:v1";
const PENDING_EXPORT_KEY = "evc:free-captable:export-pending";

type Saved = { company: string; holders: Holder[]; round: RoundInput };

function readSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Saved;
    if (!Array.isArray(data.holders)) return null;
    return data;
  } catch {
    return null;
  }
}

function writeSaved(data: Saved) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable: the builder still works for this visit */
  }
}

function getFlag(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setFlag(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

const PRESETS: { label: string; round: Omit<RoundInput, "enabled"> }[] = [
  { label: "Pre-seed", round: { name: "Pre-seed", preMoney: 6e7, investment: 1e7, poolTargetPct: 10 } },
  { label: "Seed", round: { name: "Seed", preMoney: 20e7, investment: 5e7, poolTargetPct: 12 } },
  { label: "Series A", round: { name: "Series A", preMoney: 160e7, investment: 40e7, poolTargetPct: 15 } },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function CapTableBuilder() {
  const [company, setCompany] = useState("My Startup Pvt Ltd");
  const [holders, setHolders] = useState<Holder[]>(EXAMPLE_HOLDERS);
  const [round, setRound] = useState<RoundInput>(EXAMPLE_ROUND);
  const [focus, setFocus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [auth, setAuth] = useState<"unknown" | "in" | "out">("unknown");
  const [gateOpen, setGateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const result = useMemo(() => computeCapTable(holders, round), [holders, round]);
  const roundOk = Boolean(result.round && !result.round.problem);

  /* ---------- load + save draft ---------- */
  useEffect(() => {
    const saved = readSaved();
    if (saved) {
      setCompany(saved.company ?? "");
      setHolders(saved.holders);
      setRound({ ...EXAMPLE_ROUND, ...saved.round });
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = window.setTimeout(() => writeSaved({ company, holders, round }), 250);
    return () => window.clearTimeout(id);
  }, [company, holders, round, loaded]);

  /* ---------- auth (only needed for export) ---------- */
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        const data = res.ok ? await res.json() : null;
        setAuth(data?.success ? "in" : "out");
      })
      .catch(() => setAuth("out"));
  }, []);

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const download = useCallback(() => {
    const csv = toCsv(company, result, round);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (company || "cap-table").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    a.href = url;
    a.download = `${safe || "cap-table"}-cap-table.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("CSV downloaded");
  }, [company, result, round, showToast]);

  // Came back after signing up? Finish the export they asked for.
  useEffect(() => {
    if (!loaded || auth !== "in") return;
    if (getFlag(PENDING_EXPORT_KEY) === "1") {
      setFlag(PENDING_EXPORT_KEY, null);
      download();
    }
  }, [loaded, auth, download]);

  function onExport() {
    if (auth === "in") return download();
    setGateOpen(true);
  }

  /* ---------- editing ---------- */
  function updateHolder(id: string, patch: Partial<Holder>) {
    setHolders((list) => list.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }
  function removeHolder(id: string) {
    setHolders((list) => list.filter((h) => h.id !== id));
    setFocus(null);
  }
  function addHolder(group: HolderGroup) {
    const count = holders.filter((h) => h.group === group).length + 1;
    const base = group === "POOL" ? "ESOP pool" : `${groupMeta(group).label.replace(/s$/, "")} ${count}`;
    setHolders((list) => [...list, { id: newId(), name: base, group, shares: group === "POOL" ? 500_000 : 100_000 }]);
  }

  /* ---------- chart data ---------- */
  const groupData: Datum[] = result.byGroupBefore.map((g) => ({
    key: g.group,
    label: groupMeta(g.group).label,
    value: g.shares,
    color: groupMeta(g.group).color,
    sub: `${fmtShares(g.shares)} shares`,
  }));

  const holderData: Datum[] = result.rows
    .filter((r) => !r.isNew)
    .sort((a, b) => b.before - a.before)
    .map((r) => ({ key: r.id, label: r.name, value: r.beforePct, color: r.color, sub: r.group }));

  const focusGroup = focus && GROUPS.some((g) => g.key === focus) ? focus : result.rows.find((r) => r.id === focus)?.group ?? null;

  const segBefore: Datum[] = result.byGroupBefore.map((g) => ({ key: g.group, label: groupMeta(g.group).label, value: g.shares, color: groupMeta(g.group).color }));
  const segAfter: Datum[] = result.byGroupAfter.map((g) =>
    g.group === "NEW"
      ? { key: "NEW", label: round.name || "New investor", value: g.shares, color: NEW_INVESTOR_COLOR }
      : { key: g.group, label: groupMeta(g.group).label, value: g.shares, color: groupMeta(g.group).color }
  );

  const dumbbellRows = result.rows
    .slice()
    .sort((a, b) => b.afterPct - a.afterPct)
    .map((r) => ({ key: r.id, label: r.name, before: r.beforePct, after: r.afterPct, color: r.color, group: r.id === "__new_investor" ? "NEW" : r.group, isNew: r.isNew }));

  /* ---------- KPIs ---------- */
  const groupPct = (group: HolderGroup, when: "before" | "after") =>
    result.rows
      .filter((r) => r.group === group && (when === "after" || !r.isNew))
      .reduce((s, r) => s + (when === "before" ? r.beforePct : r.afterPct), 0);

  const delta = (group: HolderGroup) => {
    if (!roundOk) return null;
    const d = groupPct(group, "after") - groupPct(group, "before");
    return { text: `${d > 0 ? "+" : ""}${d.toFixed(1)} pts after round`, tone: d < -0.05 ? ("down" as const) : d > 0.05 ? ("up" as const) : ("flat" as const) };
  };

  const ready = loaded;

  return (
    <div className="ct-root min-h-screen bg-[#F4F6FA] text-[#0b1220]">
      <ChartStyles />

      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(4,38,83,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(4,38,83,0.045)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F2B421]/15 blur-[90px]" />

        <div className="relative mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#042653] px-2.5 py-1 text-white">
                <Sparkles className="h-3 w-3 text-[#F2B421]" /> Free tool
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">No sign-up needed</span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-500">Saved in this browser</span>
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Company name</span>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
                maxLength={80}
                className="w-full max-w-[640px] rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-2xl font-semibold tracking-[-0.03em] text-[#042653] outline-none transition hover:border-slate-200 focus:border-[#F2B421] focus:bg-white sm:text-3xl"
              />
            </label>
            <p className="mt-1 px-1 text-sm text-slate-500">Cap table builder · fully diluted · model your next round</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setHolders(EXAMPLE_HOLDERS); setRound(EXAMPLE_ROUND); setCompany("Example Startup Pvt Ltd"); showToast("Example loaded"); }}
              className="ct-btn inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:border-slate-300"
            >
              <Wand2 className="h-4 w-4" /> Example
            </button>
            <button
              type="button"
              onClick={() => { setHolders(BLANK_HOLDERS.map((h) => ({ ...h, id: newId() }))); setRound({ ...EXAMPLE_ROUND, enabled: false }); setCompany(""); showToast("Started fresh"); }}
              className="ct-btn inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:border-slate-300"
            >
              <RotateCcw className="h-4 w-4" /> Start fresh
            </button>
            <button
              type="button"
              onClick={onExport}
              className="ct-btn ct-shine group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-[#042653] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(4,38,83,0.8)] hover:bg-[#06306a]"
            >
              <Download className="relative h-4 w-4 transition group-hover:translate-y-0.5" />
              <span className="relative">Export CSV</span>
              {auth !== "in" ? (
                <span className="relative inline-flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold">
                  <LockKeyhole className="h-3 w-3" /> Free account
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      <div className={`mx-auto max-w-[1400px] px-4 py-6 transition-opacity duration-300 sm:px-6 ${ready ? "" : "opacity-0"}`}>
        {/* =====================================================
            KPI ROW
        ====================================================== */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <KpiTile label="Fully diluted shares" value={fmtShares(roundOk ? result.totalAfter : result.totalBefore)} sub={roundOk ? `from ${fmtShares(result.totalBefore)} today` : `${result.rows.filter((r) => !r.isNew).length} holders`} />
          <KpiTile label="Founders" value={fmtPct(roundOk ? groupPct("FOUNDER", "after") : groupPct("FOUNDER", "before"))} delta={delta("FOUNDER")} accent={groupMeta("FOUNDER").color} />
          <KpiTile
            label="Investors"
            value={fmtPct(roundOk ? groupPct("INVESTOR", "after") : groupPct("INVESTOR", "before"))}
            delta={delta("INVESTOR")}
            accent={groupMeta("INVESTOR").color}
          />
          <KpiTile label="ESOP pool" value={fmtPct(roundOk ? groupPct("POOL", "after") : groupPct("POOL", "before"))} delta={delta("POOL")} accent={groupMeta("POOL").color} />
          <KpiTile
            label={roundOk ? "Post-money" : "Price per share"}
            value={roundOk && result.round ? fmtInr(result.round.postMoney) : "—"}
            sub={roundOk && result.round ? `₹${result.round.pricePerShare.toFixed(2)} a share` : "Turn on a round to see it"}
            accent={NEW_INVESTOR_COLOR}
          />
        </div>

        {/* =====================================================
            ROW 1: EDITOR · DONUT · BARS
        ====================================================== */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Panel
            title="Shareholders"
            subtitle="Edit names and shares. Everything updates live."
            className="ct-rise lg:col-span-5"
            right={<span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold tabular-nums text-slate-600">{fmtShares(result.totalBefore)}</span>}
          >
            <div className="-mx-5 -mt-5">
              <div className="grid grid-cols-[minmax(0,1fr)_96px_52px_24px] sm:grid-cols-[minmax(0,1fr)_120px_64px_28px] gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <span>Name · group</span>
                <span className="text-right">Shares</span>
                <span className="text-right">%</span>
                <span />
              </div>
              <ul className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto" onMouseLeave={() => setFocus(null)}>
                {holders.map((h) => {
                  const row = result.rows.find((r) => r.id === h.id);
                  const lit = focus === h.id || focusGroup === h.group;
                  const dim = focus !== null && !lit;
                  return (
                    <li
                      key={h.id}
                      onMouseEnter={() => setFocus(h.id)}
                      className={`group grid grid-cols-[minmax(0,1fr)_96px_52px_24px] sm:grid-cols-[minmax(0,1fr)_120px_64px_28px] items-center gap-2 px-5 py-2 transition ${lit ? "bg-[#F7F9FC]" : ""} ${dim ? "opacity-50" : ""}`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="relative h-7 w-1 shrink-0 rounded-full" style={{ background: groupMeta(h.group).color }} />
                        <div className="min-w-0 flex-1">
                          <input
                            value={h.name}
                            onChange={(e) => updateHolder(h.id, { name: e.target.value })}
                            maxLength={60}
                            aria-label="Shareholder name"
                            className="w-full truncate rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[13px] font-medium text-[#0b1220] outline-none transition hover:border-slate-200 focus:border-[#F2B421] focus:bg-white"
                          />
                          <select
                            value={h.group}
                            onChange={(e) => updateHolder(h.id, { group: e.target.value as HolderGroup })}
                            aria-label="Group"
                            className="ml-0.5 cursor-pointer rounded bg-transparent px-1 text-[11px] text-slate-500 outline-none hover:text-[#042653]"
                          >
                            {GROUPS.map((g) => (
                              <option key={g.key} value={g.key}>
                                {g.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <input
                        inputMode="numeric"
                        value={fmtShares(h.shares)}
                        onChange={(e) => updateHolder(h.id, { shares: Math.min(1e12, parseNumber(e.target.value)) })}
                        aria-label="Shares"
                        className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-right text-[13px] tabular-nums outline-none transition focus:border-[#F2B421] focus:ring-4 focus:ring-[#F2B421]/15"
                      />
                      <span className="text-right text-[12px] font-semibold tabular-nums text-[#0b1220]">{fmtPct(row?.beforePct ?? 0)}</span>
                      <button
                        type="button"
                        onClick={() => removeHolder(h.id)}
                        aria-label={`Remove ${h.name}`}
                        className="grid h-7 w-7 place-items-center rounded-md text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
                {holders.length === 0 ? <li className="px-5 py-8 text-center text-sm text-slate-500">Add your first shareholder below.</li> : null}
              </ul>
              <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-5 pt-3">
                {GROUPS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => addHolder(g.key)}
                    className="ct-btn inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:border-solid hover:text-[#042653]"
                    style={{ ["--c" as string]: g.color }}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: g.color }} />
                    {g.key === "POOL" ? "ESOP pool" : g.label.replace(/s$/, "")}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Ownership by group" subtitle="Today · fully diluted" className="ct-rise lg:col-span-3" >
            <Donut
              data={groupData}
              focus={focusGroup}
              onFocus={setFocus}
              size={200}
              thickness={20}
              centerTitle="Total shares"
              centerValue={result.totalBefore >= 1e7 ? `${(result.totalBefore / 1e7).toFixed(2)} Cr` : `${(result.totalBefore / 1e5).toFixed(1)} L`}
            />
            <div className="mt-4">
              <Legend data={groupData} focus={focusGroup} onFocus={setFocus} />
            </div>
          </Panel>

          <Panel title="Ownership by shareholder" subtitle="Hover any bar to trace it across the page" className="ct-rise lg:col-span-4">
            <HBars data={holderData} focus={focus && !GROUPS.some((g) => g.key === focus) ? focus : focusGroup} onFocus={setFocus} format={(v) => `${Number.isInteger(v) ? v : v.toFixed(1)}%`} />
          </Panel>
        </div>

        {/* =====================================================
            ROW 2: ROUND MODEL · BEFORE / AFTER
        ====================================================== */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Panel
            title="Model a funding round"
            subtitle="Priced round with an ESOP top-up before the money"
            className="ct-rise lg:col-span-4"
            right={
              <button
                type="button"
                role="switch"
                aria-checked={round.enabled}
                onClick={() => setRound((r) => ({ ...r, enabled: !r.enabled }))}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${round.enabled ? "bg-[#042653]" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${round.enabled ? "left-[22px]" : "left-0.5"}`} />
                <span className="sr-only">Turn round on or off</span>
              </button>
            }
          >
            <div className={`space-y-4 transition-opacity duration-300 ${round.enabled ? "" : "pointer-events-none opacity-40"}`}>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => {
                  const active = round.name === p.round.name && round.preMoney === p.round.preMoney && round.investment === p.round.investment;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setRound({ enabled: true, ...p.round })}
                      className={`ct-btn rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition ${
                        active ? "border-[#042653] bg-[#042653] text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Round name</span>
                <input
                  value={round.name}
                  onChange={(e) => setRound((r) => ({ ...r, name: e.target.value }))}
                  maxLength={40}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-[#F2B421] focus:ring-4 focus:ring-[#F2B421]/15"
                />
              </label>

              <SliderField
                label="Pre-money valuation"
                value={round.preMoney / 1e7}
                min={1}
                max={500}
                step={1}
                unit="Cr"
                onChange={(v) => setRound((r) => ({ ...r, preMoney: v * 1e7 }))}
              />
              <SliderField
                label="Amount raised"
                value={round.investment / 1e7}
                min={0.25}
                max={200}
                step={0.25}
                unit="Cr"
                onChange={(v) => setRound((r) => ({ ...r, investment: v * 1e7 }))}
              />
              <SliderField
                label="ESOP pool after round"
                value={round.poolTargetPct}
                min={0}
                max={25}
                step={0.5}
                unit="%"
                hint="0 = no top-up"
                onChange={(v) => setRound((r) => ({ ...r, poolTargetPct: v }))}
              />

              {round.enabled && result.round?.problem ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">{result.round.problem}</p>
              ) : null}

              {roundOk && result.round ? (
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 text-[12px]">
                  {[
                    ["Price per share", `₹${result.round.pricePerShare.toFixed(2)}`],
                    ["Post-money", fmtInr(result.round.postMoney)],
                    ["New investor shares", fmtShares(result.round.newInvestorShares)],
                    ["Pool top-up", fmtShares(result.round.poolTopUpShares)],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-white px-3 py-2.5">
                      <dt className="text-slate-500">{k}</dt>
                      <dd key={v} className="ct-pop mt-0.5 font-semibold tabular-nums text-[#0b1220]">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </Panel>

          <div className="grid gap-4 lg:col-span-8">
            <Panel
              title="Before and after the round"
              subtitle={roundOk ? `${round.name || "Round"} · ${fmtInr(round.investment)} on ${fmtInr(round.preMoney)} pre-money` : "Turn on a round to compare"}
              className="ct-rise"
            >
              <StackedCompare
                rows={[
                  { label: "Today", segments: segBefore },
                  { label: roundOk ? `After ${round.name || "round"}` : "After round", segments: roundOk ? segAfter : segBefore },
                ]}
                focus={focusGroup === null && focus === "NEW" ? "NEW" : focusGroup}
                onFocus={setFocus}
              />
            </Panel>

            <Panel title="Dilution by shareholder" subtitle="Ownership today → after the round, in percentage points" className="ct-rise">
              <Dumbbell rows={dumbbellRows} focus={focus} onFocus={setFocus} />
            </Panel>
          </div>
        </div>

        {/* =====================================================
            UPSELL + NOTE
        ====================================================== */}
        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <div className="ct-rise relative overflow-hidden rounded-2xl bg-[#020d1f] p-6 text-white lg:col-span-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[#F2B421]/20 blur-[80px]" />
            <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F2B421]">Startup plan</p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em]">Ready to run it for real?</h3>
                <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-slate-300 sm:grid-cols-2">
                  {["Dated record of every allotment and transfer", "ESOP pool, grants and options register", "A private grant page for every employee", "Import this cap table from Excel"].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B421]" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/pricing#startup"
                className="ct-btn ct-shine group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl bg-[#F2B421] px-5 text-sm font-semibold text-[#020d1f] hover:bg-[#ffc43d]"
              >
                <span className="relative">See the Startup plan</span>
                <ArrowRight className="relative h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="ct-rise rounded-2xl border border-slate-200/80 bg-white p-6 text-[12px] leading-6 text-slate-500 lg:col-span-4">
            <p className="font-semibold text-[#0b1220]">About this model</p>
            <p className="mt-2">
              A planning tool, not a statutory register. It treats every line as fully diluted shares and adds any pool
              top-up before the new money. Notes, SAFEs and liquidation preferences are not modelled. Your data stays in
              this browser until you export it.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          SIGN-UP GATE FOR EXPORT
      ====================================================== */}
      {gateOpen ? (
        <div className="fixed inset-0 z-[300] grid place-items-center bg-[#020d1f]/50 p-4 backdrop-blur-sm" onClick={() => setGateOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ct-gate-title"
            onClick={(e) => e.stopPropagation()}
            className="ct-pop relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-[0_40px_100px_-30px_rgba(2,13,31,0.6)]"
          >
            <button type="button" onClick={() => setGateOpen(false)} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#042653] text-[#F2B421]">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <h2 id="ct-gate-title" className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[#042653]">
              Create a free account to export
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The builder is free without an account. Downloading the CSV needs a free EVC account. Your cap table is
              saved in this browser: after you sign in, open <span className="font-semibold">Cap Table</span> again and
              the CSV downloads automatically.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Link
                href="/signup"
                onClick={() => setFlag(PENDING_EXPORT_KEY, "1")}
                className="ct-btn inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#042653] text-sm font-semibold text-white hover:bg-[#06306a]"
              >
                Sign up free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                onClick={() => setFlag(PENDING_EXPORT_KEY, "1")}
                className="ct-btn inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-[#042653] hover:border-slate-300"
              >
                I have an account
              </Link>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-400">No card needed. Free forever.</p>
          </div>
        </div>
      ) : null}

      {/* Toast */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[310] -translate-x-1/2 transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-[#0b1220] px-4 py-2 text-sm font-medium text-white shadow-lg">
          <Check className="h-4 w-4 text-emerald-400" /> {toast}
        </span>
      </div>

      <style>{`
        .ct-btn { transition: transform .2s ease, background-color .2s ease, border-color .2s ease, box-shadow .2s ease, color .2s ease; }
        .ct-btn:hover { transform: translateY(-1px); }
        .ct-btn:active { transform: translateY(0) scale(.98); }
        .ct-shine::before { content: ""; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.45) 50%, transparent 70%); transform: translateX(-120%); transition: transform .7s ease; }
        .ct-shine:hover::before { transform: translateX(120%); }
        .ct-root .ct-rise:nth-child(2) { animation-delay: 60ms; }
        .ct-root .ct-rise:nth-child(3) { animation-delay: 120ms; }
        .ct-range { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 9999px; background: linear-gradient(to right, #042653 var(--p), #E2E8F0 var(--p)); outline: none; }
        .ct-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 9999px; background: #fff; border: 2px solid #042653; box-shadow: 0 2px 6px rgba(4,38,83,.25); cursor: pointer; transition: transform .15s ease; }
        .ct-range::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .ct-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 9999px; background: #fff; border: 2px solid #042653; cursor: pointer; }
        @media (prefers-reduced-motion: reduce) { .ct-btn, .ct-btn:hover { transition: none; transform: none; } }
      `}</style>
    </div>
  );
}

/* ============================================================
   SLIDER + NUMBER FIELD
============================================================ */

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const editing = useRef(false);
  useEffect(() => {
    if (!editing.current) setText(String(Number(value.toFixed(2))));
  }, [value]);
  const p = `${((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100}%`;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium text-slate-500">
          {label}
          {hint ? <span className="text-slate-400"> · {hint}</span> : null}
        </span>
        <span className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white pl-2 pr-1.5 focus-within:border-[#F2B421] focus-within:ring-4 focus-within:ring-[#F2B421]/15">
          {unit === "Cr" ? <span className="text-[12px] text-slate-400">₹</span> : null}
          <input
            inputMode="decimal"
            value={text}
            onFocus={() => (editing.current = true)}
            onBlur={() => {
              editing.current = false;
              setText(String(Number(value.toFixed(2))));
            }}
            onChange={(e) => {
              setText(e.target.value);
              const n = parseNumber(e.target.value);
              if (n >= 0) onChange(Math.min(unit === "%" ? 60 : 100000, n));
            }}
            className="h-7 w-16 bg-transparent text-right text-[13px] font-semibold tabular-nums outline-none"
          />
          <span className="text-[11px] text-slate-400">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ct-range w-full cursor-pointer"
        style={{ ["--p" as string]: p }}
        aria-label={label}
      />
    </div>
  );
}

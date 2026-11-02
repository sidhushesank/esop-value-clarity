"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Download, Sparkles } from "lucide-react";

import {
  EXAMPLE_HOLDERS,
  NEW_INVESTOR_COLOR,
  computeCapTable,
  fmtInr,
  fmtPct,
  groupMeta,
} from "@/lib/captable-free/math";
import { ChartStyles, Donut, Legend, type Datum } from "@/components/captable-free/charts";

/**
 * Home page section for the free cap table builder (/cap-table).
 * The preview on the right is live: drag the sliders and the round is
 * recalculated with the same maths as the full tool. Sample data, labelled.
 */
export default function CapTableToolSection() {
  const [raiseCr, setRaiseCr] = useState(5);
  const [preCr, setPreCr] = useState(20);
  const [focus, setFocus] = useState<string | null>(null);

  const result = useMemo(
    () =>
      computeCapTable(EXAMPLE_HOLDERS, {
        enabled: true,
        name: "Seed",
        preMoney: preCr * 1e7,
        investment: raiseCr * 1e7,
        poolTargetPct: 12,
      }),
    [raiseCr, preCr]
  );

  const data: Datum[] = result.byGroupAfter.map((g) =>
    g.group === "NEW"
      ? { key: "NEW", label: "Seed investor", value: g.shares, color: NEW_INVESTOR_COLOR }
      : { key: g.group, label: groupMeta(g.group).label, value: g.shares, color: groupMeta(g.group).color }
  );

  const foundersBefore = result.rows.filter((r) => r.group === "FOUNDER").reduce((s, r) => s + r.beforePct, 0);
  const foundersAfter = result.rows.filter((r) => r.group === "FOUNDER").reduce((s, r) => s + r.afterPct, 0);
  const price = result.round && !result.round.problem ? result.round.pricePerShare : 0;

  return (
    <section id="cap-table" className="relative scroll-mt-20 overflow-hidden bg-white">
      <ChartStyles />
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(4,38,83,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(4,38,83,0.04)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-14 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center">
        {/* Live preview */}
        <div className="order-2 lg:order-1">
          <div className="rounded-3xl border border-slate-200 bg-[#F7F9FC] p-2 shadow-[0_40px_90px_-50px_rgba(4,38,83,0.55)]">
            <div className="rounded-[20px] border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                </div>
                <span className="text-[11px] text-slate-400">esopvalueclarity.com/cap-table</span>
                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Sample</span>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-[200px_minmax(0,1fr)]">
                <Donut data={data} focus={focus} onFocus={setFocus} size={190} thickness={18} centerTitle="After seed" centerValue={fmtInr(preCr * 1e7 + raiseCr * 1e7)} />
                <div className="min-w-0">
                  <Legend data={data} focus={focus} onFocus={setFocus} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-px border-y border-slate-100 bg-slate-100 text-center">
                {[
                  ["Founders today", fmtPct(foundersBefore)],
                  ["Founders after", fmtPct(foundersAfter)],
                  ["Price / share", price ? `₹${price.toFixed(2)}` : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{k}</p>
                    <p key={v} className="ct-pop mt-1 text-lg font-semibold tabular-nums text-[#0b1220]">{v}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <MiniSlider label="Raise" value={raiseCr} min={0.5} max={25} step={0.5} onChange={setRaiseCr} />
                <MiniSlider label="Pre-money" value={preCr} min={4} max={100} step={1} onChange={setPreCr} />
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-400">Live sample · drag the sliders · 12% ESOP pool after the round</p>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Free tool · no sign-up
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#042653] sm:text-5xl">
            Build your cap table in minutes.{" "}
            <span className="text-slate-400">Free.</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Add founders, investors, employees and your ESOP pool, then model your next round. See who owns what, the
            price per share, and exactly how much each person is diluted.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "No account needed to build and model",
              "Model a priced round with an ESOP top-up",
              "Dilution chart for every shareholder",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-slate-700">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#B7800E]" /> {t}
              </li>
            ))}
            <li className="flex items-start gap-3 text-sm text-slate-700">
              <Download className="mt-0.5 h-4 w-4 shrink-0 text-[#B7800E]" /> Export to CSV with a free account
            </li>
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cap-table"
              className="evc-btn-gold group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F2B421] px-6 text-sm font-semibold text-[#020d1f] transition hover:-translate-y-0.5"
            >
              Build your cap table free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#startups"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-[#042653] transition hover:border-[#042653]"
            >
              Need the full ESOP system?
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const p = `${((value - min) / (max - min)) * 100}%`;
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
        {label}
        <span className="rounded-md bg-[#042653] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">₹{value} Cr</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ct-mini-range w-full cursor-pointer"
        style={{ ["--p" as string]: p }}
      />
      <style>{`
        .ct-mini-range { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 9999px; background: linear-gradient(to right, #042653 var(--p), #E2E8F0 var(--p)); outline: none; }
        .ct-mini-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 9999px; background: #F2B421; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(4,38,83,.35); cursor: pointer; transition: transform .15s ease; }
        .ct-mini-range::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .ct-mini-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 9999px; background: #F2B421; border: 2px solid #fff; cursor: pointer; }
      `}</style>
    </label>
  );
}

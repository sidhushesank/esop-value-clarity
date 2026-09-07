"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  History,
  ShieldCheck,
} from "lucide-react";

export default function HistoryHeader() {
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[#0b1024] px-6 py-8 text-white shadow-[0_20px_60px_rgba(11,16,36,0.16)] md:px-9 md:py-10">
      <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-2">
              <History className="h-3.5 w-3.5" />
              ESOP Value Clarity · Scenario ledger
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
            Review the scenarios behind your equity decisions.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            Keep every saved ESOP calculation in one place, compare the assumptions that shaped it, and return to the numbers when your situation changes.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-200">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Private workspace
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-violet-300" />
              Evidence-based inputs
            </span>
          </div>
        </div>

        <div className="hidden min-w-[220px] rounded-2xl border border-white/10 bg-white/[0.06] p-5 lg:block">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Your decision record
          </p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-black">Saved</p>
              <p className="mt-1 text-xs text-slate-400">Scenarios stay reviewable</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-violet-300" />
          </div>
        </div>
      </div>
    </section>
  );
}
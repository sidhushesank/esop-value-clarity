"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  FileCheck2,
  Layers3,
  LockKeyhole,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";

/**
 * Home page section for the Startup plan (Startup Equity Desk).
 * Same brand as the rest of the home page (navy #042653, gold #F2B421).
 * The preview uses the page's SAMPLE company; figures are labelled as a
 * sample. The take-home figure is passed in from the page, where it is run
 * through EVC's real tax engine (page honesty rule 3).
 */

type CapRow = { label: string; sub: string; pct: number; color: string };

const CAP_SAMPLE: CapRow[] = [
  { label: "Founders", sub: "Equity shares", pct: 61.0, color: "#042653" },
  { label: "Angel & seed", sub: "Equity · Seed CCPS", pct: 16.5, color: "#5B9BFF" },
  { label: "Series A", sub: "Series A CCPS", pct: 11.0, color: "#94A3B8" },
  { label: "ESOP pool", sub: "Granted + unallocated", pct: 11.5, color: "#F2B421" },
];

const FEATURES = [
  {
    icon: Layers3,
    title: "Cap table, as of any date",
    text: "Every allotment, transfer, conversion and buyback in one log. Fully diluted, ESOP pool included.",
  },
  {
    icon: FileCheck2,
    title: "ESOP pool and grants",
    text: "Grant from your approved pool, with checks flagged before you issue. Options register in Excel.",
  },
  {
    icon: UserRound,
    title: "A page for every employee",
    text: "Vesting, cost to exercise, tax and take-home after tax, with an Accept button. No login needed.",
  },
  {
    icon: Upload,
    title: "Bring what you already have",
    text: "Import your cap table and existing grants from Excel. Every row checked before anything is saved.",
  },
];

function inrShort(value: number) {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)} L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export default function StartupDeskSection({
  companyName,
  employeeOptions,
  vestedOptions,
  strike,
  baseTakeHome,
}: {
  companyName: string;
  employeeOptions: number;
  vestedOptions: number;
  strike: number;
  baseTakeHome: number;
}) {
  const vestedPct = employeeOptions > 0 ? (vestedOptions / employeeOptions) * 100 : 0;

  return (
    <section id="startups" className="relative scroll-mt-20 overflow-hidden border-y border-slate-200 bg-[#F7F9FC]">
      <div className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-[#F2B421]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[380px] w-[380px] rounded-full bg-[#5B9BFF]/10 blur-[120px]" />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-14 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
        {/* Copy */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[#FFF4D6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">
            <Sparkles className="h-3.5 w-3.5" />
            New · For startups
          </p>

          <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#042653] sm:text-5xl">
            Run your cap table and ESOPs.{" "}
            <span className="text-slate-400">Show every employee what theirs is worth.</span>
          </h2>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            The Startup Equity Desk keeps your cap table, ESOP pool and every grant in one place, and gives
            each employee a private page that explains their grant in rupees, after tax. Equity only
            motivates people who understand it.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#F2B421]/50 hover:shadow-[0_30px_60px_-35px_rgba(4,38,83,0.45)]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#042653] text-[#F2B421]">
                  <f.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-4 font-semibold text-[#042653]">{f.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pricing#startup"
              className="evc-btn-gold group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F2B421] px-6 text-sm font-semibold text-[#020d1f] transition hover:-translate-y-0.5"
            >
              See the Startup plan
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/meeting"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-[#042653] transition hover:border-[#042653]"
            >
              <CalendarDays className="h-4 w-4" />
              Book a founder walkthrough
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
            {["₹14,999 a year", "Up to 25 employees with options", "Free trial on request"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5 text-[#B7800E]" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Product preview */}
        <div className="relative">
          {/* Cap table card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_40px_90px_-50px_rgba(4,38,83,0.55)] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Cap table · fully diluted</p>
                <p className="mt-1 font-semibold text-[#042653]">{companyName}</p>
              </div>
              <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                Sample
              </span>
            </div>

            <div className="mt-5 flex h-3 overflow-hidden rounded-full">
              {CAP_SAMPLE.map((r) => (
                <span key={r.label} style={{ width: `${r.pct}%`, background: r.color }} />
              ))}
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {CAP_SAMPLE.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#042653]">{r.label}</p>
                      <p className="truncate text-xs text-slate-400">{r.sub}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-[#042653]">{r.pct.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Employee grant card */}
          <div className="relative z-10 mx-auto -mt-6 w-[92%] rounded-3xl bg-[#020d1f] p-6 text-white shadow-[0_40px_90px_-40px_rgba(2,13,31,0.9)] ring-1 ring-white/10 sm:-mt-4 sm:ml-auto sm:mr-[-6%] sm:w-[78%]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F2B421]">Employee grant page</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                <LockKeyhole className="h-3 w-3" /> Private link
              </span>
            </div>

            <p className="mt-3 text-lg font-semibold">Ravi, here is your ESOP grant</p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Granted", employeeOptions.toLocaleString("en-IN")],
                ["Vested", vestedOptions.toLocaleString("en-IN")],
                ["Strike", `₹${strike}`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/[0.06] px-2 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{k}</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Vested today</span>
                <span>{vestedPct.toFixed(0)}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#5B9BFF] to-[#F2B421]" style={{ width: `${vestedPct}%` }} />
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-[11px] text-slate-400">Take-home after tax · base case</p>
                <p className="mt-0.5 text-2xl font-semibold tracking-tight text-[#F2B421]">{inrShort(baseTakeHome)}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#F2B421] px-3 py-2 text-xs font-semibold text-[#020d1f]">
                <BadgeCheck className="h-3.5 w-3.5" /> Accept grant
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            Sample company and grant, illustrative. Take-home from EVC&apos;s tax engine, not a promise.
          </p>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import {
  ArrowUpRight,
  Calculator,
  History,
  Sparkles,
} from "lucide-react";

interface DashboardHeroProps {
  name: string;
}

export default function DashboardHero({
  name,
}: DashboardHeroProps) {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-xl shadow-slate-950/10">
      <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative grid gap-10 p-7 md:p-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:p-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
            <Sparkles size={13} />
            Personal ESOP workspace
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight md:text-5xl lg:text-6xl">
            Welcome back, {name}.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            See your ESOP calculations in one place, understand the value
            behind the numbers and explore what different outcomes could mean.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => router.push("/simulator")}
              className="gap-2 rounded-xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-200"
            >
              <Calculator className="h-4 w-4" />
              Start a simulation
            </Button>

            <Button
              variant="secondary"
              onClick={() => router.push("/history")}
              className="gap-2 rounded-xl px-5 py-3 font-black"
            >
              <History className="h-4 w-4" />
              Open history
            </Button>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Your workspace
              </p>
              <p className="mt-2 text-lg font-black text-white">
                A clearer way to read equity
              </p>
            </div>

            <div className="rounded-2xl bg-violet-400/15 p-3 text-violet-200">
              <ArrowUpRight size={20} />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {[
              ["01", "Run a scenario", "Model the terms you know"],
              ["02", "Save the result", "Keep your assumptions visible"],
              ["03", "Make a decision", "Compare value with context"],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[10px] font-black text-violet-200">
                  {number}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Built for clearer equity decisions
          </div>
        </div>
      </div>
    </section>
  );
}

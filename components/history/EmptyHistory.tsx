"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  ArrowUpRight,
  Calculator,
  FileSearch,
  ArrowRight,
  History,
} from "lucide-react";

export default function EmptyHistory() {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm md:px-10 md:py-20">
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-100/70 blur-3xl" />

      <div className="relative mx-auto flex max-w-xl flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
          <FileSearch className="h-8 w-8" />
        </div>

        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">
          Scenario ledger
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
          No calculations match this view
        </h2>

        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
          Adjust your search or date filter, or start a new simulation to build a clear record of your ESOP scenarios.
        </p>

        <Button
          className="mt-7 gap-2 rounded-xl bg-violet-600 px-5 font-black text-white hover:bg-violet-700"
          onClick={() => router.push("/simulator")}
        >
          <Calculator className="h-4 w-4" />
          Start a simulation
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-slate-400">
          <History className="h-4 w-4" />
          Saved scenarios stay linked to their detail view
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}
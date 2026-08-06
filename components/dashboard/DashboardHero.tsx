"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import {
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
    <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white p-10 shadow-2xl">

      <p className="uppercase tracking-[0.35em] text-slate-400 text-sm">
        Dashboard
      </p>

      <div className="flex items-center gap-3 mt-3">

        <h1 className="text-5xl font-bold tracking-tight">
          Welcome back, {name}
        </h1>

        <Sparkles className="h-8 w-8 text-amber-400" />

      </div>

      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
        Manage your ESOP portfolio, estimate future equity value,
        compare scenarios and keep every calculation in one place.
      </p>

      <div className="flex flex-wrap gap-4 mt-10">

        <Button
          onClick={() => router.push("/simulator")}
          className="gap-2 bg-white text-slate-900 hover:bg-slate-200"
        >
          <Calculator className="h-4 w-4" />
          Start Simulation
        </Button>

        <Button
          variant="secondary"
          onClick={() => router.push("/history")}
          className="gap-2"
        >
          <History className="h-4 w-4" />
          View History
        </Button>

      </div>

    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  Calculator,
  ArrowRight,
  History,
} from "lucide-react";

export default function EmptyHistory() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-24">

      {/* Icon */}

      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">

        <History className="h-12 w-12 text-slate-600" />

      </div>

      {/* Heading */}

      <h2 className="mt-8 text-3xl font-bold text-slate-900">
        No calculations found
      </h2>

      {/* Description */}

      <p className="mt-4 max-w-lg text-center text-slate-500 leading-7">
        You haven't saved any ESOP calculations yet.
        Start your first simulation to build your ESOP
        portfolio and keep track of every scenario.
      </p>

      {/* CTA */}

      <Button
        className="mt-10 gap-2 rounded-xl px-6 py-6"
        onClick={() => router.push("/simulator")}
      >
        <Calculator className="h-4 w-4" />
        Start First Simulation
        <ArrowRight className="h-4 w-4" />
      </Button>

    </div>
  );
}
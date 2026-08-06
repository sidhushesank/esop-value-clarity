"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  FileText,
  ArrowRight,
} from "lucide-react";

export default function EmptyState() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20">

      {/* Icon */}

      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">

        <FileText className="h-10 w-10 text-slate-600" />

      </div>

      {/* Heading */}

      <h2 className="mt-8 text-3xl font-bold text-slate-900">
        No calculations yet
      </h2>

      {/* Description */}

      <p className="mt-4 max-w-md text-center text-slate-500 leading-7">
        Your saved ESOP calculations will appear here.
        Start your first simulation to estimate the value
        of your equity and build your portfolio.
      </p>

      {/* CTA */}

      <Button
        className="mt-10 gap-2 rounded-xl px-6 py-6"
        onClick={() => router.push("/simulator")}
      >
        Start First Simulation
        <ArrowRight className="h-4 w-4" />
      </Button>

    </div>
  );
}
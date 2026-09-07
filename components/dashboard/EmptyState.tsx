"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  FileText,
  ArrowRight,
} from "lucide-react";

// The empty state is used only when the real history response is empty.
// It is intentionally concise so the dashboard still feels like a working
// financial workspace before the user has saved a first scenario.

export default function EmptyState() {
  const router = useRouter();

  // This is a compact first-run state rather than a separate page. The user
  // can understand what belongs in the activity area and start immediately.
  // It intentionally does not display a fabricated zero-rupee value.
  // Missing history is a real product state, not a calculation result.
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm ring-1 ring-slate-200">
        <FileText className="h-7 w-7" />
      </div>

      {/* Keep the copy specific to the product's saved calculation workflow. */}
      <h2 className="mt-5 text-xl font-black text-slate-950">
        Your first calculation starts here
      </h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        Run a simulation and your saved ESOP scenarios will appear in this
        workspace.
      </p>

      {/* The CTA preserves the existing simulator route. */}
      <Button
        className="mt-6 gap-2 rounded-xl px-5 py-3 font-black"
        onClick={() => router.push("/simulator")}
      >
        Start a simulation
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
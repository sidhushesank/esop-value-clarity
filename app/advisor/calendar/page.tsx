"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import CalendarPanel from "@/components/compliance/CalendarPanel";

export default function AdvisorCalendarPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
      <div className="mx-auto max-w-[1100px] px-5 py-6 md:px-8 md:py-8">
        <button
          type="button"
          onClick={() => router.push("/advisor")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          Advisor Console
        </button>
        <CalendarPanel
          apiBase="/api/advisor/calendar"
          intro="Every dated to-do across your client companies and individuals: TDS on ESOP perquisites, PAS-3 after allotments, MGT-14 for scheme resolutions, leavers' exercise windows, option expiries, valuation age, and for individuals with foreign shares: advance tax, ITR with Schedule FA and Form 67."
        />
      </div>
    </main>
  );
}

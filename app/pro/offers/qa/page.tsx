"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert, FlaskConical, ShieldCheck, XCircle } from "lucide-react";
import { runOfferQaScenarios } from "@/lib/esop/offers/qa-scenarios";

function winnerLabel(value: string): string {
  if (value === "A") return "Offer A";
  if (value === "B") return "Offer B";
  if (value === "TIE") return "Tie";
  return "Clarification needed";
}

export default function OfferQaPage() {
  const results = useMemo(() => runOfferQaScenarios(), []);
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/pro/offers" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-violet-700">
          <ArrowLeft className="h-4 w-4" /> Back to Offer Intelligence
        </Link>

        <section className="mt-6 overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-xl sm:p-9">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-violet-200">
                <FlaskConical className="h-3.5 w-3.5" /> Product safety checks
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Offer Intelligence QA</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Deterministic checks for Indian employee offers. The engine must compare confirmed INR cash, preserve unknown terms, and never create a false recommendation.
              </p>
            </div>
            <div className={`rounded-2xl border px-5 py-4 ${failed === 0 ? "border-emerald-400/30 bg-emerald-400/10" : "border-rose-400/30 bg-rose-400/10"}`}>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">Scenario results</p>
              <p className="mt-1 text-3xl font-black">{passed}/{results.length}</p>
              <p className={`mt-1 text-sm font-bold ${failed === 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {failed === 0 ? "All safety checks passed" : `${failed} check${failed === 1 ? "" : "s"} failed`}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <h2 className="mt-3 font-black text-emerald-950">Cash is comparable</h2>
            <p className="mt-1 text-sm leading-5 text-emerald-800">Confirmed fixed salary remains useful even if equity terms are unresolved.</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <CircleAlert className="h-5 w-5 text-amber-700" />
            <h2 className="mt-3 font-black text-amber-950">Unknown is not zero</h2>
            <p className="mt-1 text-sm leading-5 text-amber-800">Silent or incomplete equity blocks a full verdict rather than being silently valued at ₹0.</p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
            <FlaskConical className="h-5 w-5 text-violet-700" />
            <h2 className="mt-3 font-black text-violet-950">INR-first product</h2>
            <p className="mt-1 text-sm leading-5 text-violet-800">The live scanner and comparison API reject non-INR offers until values have a confirmed basis.</p>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {results.map((result) => (
            <article key={result.scenario.id} className={`rounded-[24px] border bg-white p-5 shadow-sm sm:p-6 ${result.passed ? "border-slate-200" : "border-rose-300"}`}>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div className="flex gap-3">
                  {result.passed ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />}
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">{result.passed ? "Passed" : "Failed"}</p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">{result.scenario.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{result.scenario.purpose}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Base-case result</p>
                  <p className="mt-1 font-black text-slate-950">{winnerLabel(result.comparison.baseCaseWinner)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {result.assertions.map((assertion) => (
                  <div key={assertion.label} className={`rounded-xl border p-4 ${assertion.passed ? "border-emerald-100 bg-emerald-50" : "border-rose-100 bg-rose-50"}`}>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-600">{assertion.label}</p>
                    <p className={`mt-2 text-sm font-black ${assertion.passed ? "text-emerald-800" : "text-rose-800"}`}>{assertion.passed ? "Pass" : "Fail"}</p>
                    <p className="mt-2 text-xs text-slate-600">Expected: <span className="font-bold">{assertion.expected}</span></p>
                    <p className="mt-1 break-words text-xs text-slate-600">Actual: <span className="font-bold">{assertion.actual}</span></p>
                  </div>
                ))}
              </div>

              {result.comparison.warnings.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-900">Engine disclosures</p>
                  <ul className="mt-2 space-y-1 text-sm leading-5 text-amber-900">
                    {result.comparison.warnings.slice(0, 3).map((warning) => <li key={warning}>• {warning}</li>)}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

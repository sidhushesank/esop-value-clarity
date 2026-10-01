"use client";

import type { ReactNode } from "react";
import type {
  PresentationAnalysisBasis,
  PresentationData,
  PresentationScenarioKey,
} from "@/lib/esop/presentation";

import {
  ArrowLeft,
  ChevronDown,
  FileBarChart2,
  Maximize2,
  Presentation,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type PresentationShellProps = {
  data: PresentationData;
  selectedScenario: PresentationScenarioKey;
  analysisBasis: PresentationAnalysisBasis;
  onScenarioChange: (scenario: PresentationScenarioKey) => void;
  onAnalysisBasisChange: (basis: PresentationAnalysisBasis) => void;
  onBack?: () => void;
  onResetView?: () => void;
  onFullscreen?: () => void;
  children: ReactNode;
};

function analysisBasisLabel(value: PresentationAnalysisBasis) {
  return value === "FULL_GRANT" ? "Full grant" : "Currently vested";
}

function scenarioLabel(value: PresentationScenarioKey) {
  if (value === "bear") return "Bear";
  if (value === "bull") return "Bull";
  return "Base";
}

function scenarioColor(value: PresentationScenarioKey) {
  if (value === "bear") return "#d97706";
  if (value === "bull") return "#059669";
  return "#2563eb";
}

export default function PresentationShell({
  data,
  selectedScenario,
  analysisBasis,
  onScenarioChange,
  onAnalysisBasisChange,
  onBack,
  onResetView,
  onFullscreen,
  children,
}: PresentationShellProps) {
  const selectedScenarioData =
    data.scenarios.find((scenario) => scenario.key === selectedScenario) ??
    data.scenarios.find((scenario) => scenario.key === "base") ??
    data.scenarios[0];

  const companyName = data.metadata.companyName || "Company";
  const grantName = data.metadata.grantName || "Employee Stock Option Grant";
  const currency = data.metadata.currency || "INR";
  const scenarioName = selectedScenarioData?.label ?? scenarioLabel(selectedScenario);
  const scenarioAccent = scenarioColor(selectedScenario);

  return (
    <main className="min-h-screen bg-[#edf2f8] text-slate-950">
      <style>{`
        @keyframes evcShellEnter {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes evcShellGlow {
          0%, 100% { opacity: .32; transform: translateX(-18%); }
          50% { opacity: .72; transform: translateX(18%); }
        }
        .evc-shell-enter { animation: evcShellEnter 560ms cubic-bezier(.16,1,.3,1) both; }
        .evc-shell-glow { animation: evcShellGlow 7s ease-in-out infinite; }
      `}</style>

      <div className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/92 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[76px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                  aria-label="Back to reports"
                >
                  <ArrowLeft size={17} />
                </button>
              ) : null}

              <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#07111f] text-blue-200 shadow-[0_18px_42px_rgba(15,23,42,0.22)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.42),transparent_44%)]" />
                <Presentation className="relative" size={18} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-black tracking-tight text-slate-950 sm:text-base">
                    Equity Intelligence Control Room
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] text-blue-700">
                    <Sparkles size={10} />
                    Presentation mode
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                  {companyName} · {grantName}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {onResetView ? (
                <button
                  type="button"
                  onClick={onResetView}
                  className="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 text-xs font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 sm:inline-flex"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              ) : null}

              {onFullscreen ? (
                <button
                  type="button"
                  onClick={onFullscreen}
                  className="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-[#07111f] px-3.5 text-xs font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-800 md:inline-flex"
                >
                  <Maximize2 size={14} />
                  Present
                </button>
              ) : null}

              <div className="hidden h-11 items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3.5 lg:flex">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                  Model synced
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-14%] top-[-12%] h-[520px] w-[520px] rounded-full bg-blue-200/45 blur-3xl" />
          <div className="absolute right-[-12%] top-[18%] h-[500px] w-[500px] rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[24%] h-[560px] w-[560px] rounded-full bg-slate-300/35 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="relative mx-auto max-w-[1760px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <section className="evc-shell-enter mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="grid gap-0 xl:grid-cols-[1fr_auto]">
              <div className="relative overflow-hidden bg-[#07111f] px-5 py-5 text-white sm:px-6">
                <div className="evc-shell-glow pointer-events-none absolute inset-y-0 left-0 w-[70%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.24),transparent_60%)]" />
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border border-blue-300/25 bg-blue-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-blue-200">
                        Live equity model
                      </span>
                      <span className="border border-white/10 bg-white/[0.055] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-300">
                        {analysisBasisLabel(analysisBasis)}
                      </span>
                    </div>

                    <h1 className="mt-3 max-w-4xl truncate text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
                      {companyName}
                    </h1>
                    <p className="mt-1 max-w-4xl truncate text-sm font-semibold text-slate-300">
                      {grantName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    <StatusMetric label="Scenario" value={scenarioName} color={scenarioAccent} />
                    <StatusMetric label="Currency" value={currency} />
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 gap-0 border-l border-slate-200 bg-white sm:grid-cols-2 xl:min-w-[560px]">
                <MiniSelect
                  label="Scenario"
                  value={selectedScenario}
                  displayValue={scenarioName}
                  color={scenarioAccent}
                  options={[
                    { value: "bear", label: "Bear" },
                    { value: "base", label: "Base" },
                    { value: "bull", label: "Bull" },
                  ]}
                  onChange={(value) => onScenarioChange(value as PresentationScenarioKey)}
                />
                <MiniSelect
                  label="Analysis basis"
                  value={analysisBasis}
                  displayValue={analysisBasisLabel(analysisBasis)}
                  color="#2563eb"
                  options={[
                    { value: "FULL_GRANT", label: "Full grant" },
                    { value: "CURRENTLY_VESTED", label: "Currently vested" },
                  ]}
                  onChange={(value) => onAnalysisBasisChange(value as PresentationAnalysisBasis)}
                />
                <ContextCell label="Report status" value="Boardroom view" />
                <ContextCell label="Model source" value={data.metadata.confirmedGrant ? "Confirmed grant" : "Preview model"} />
              </div>
            </div>
          </section>

          <div className="evc-shell-enter space-y-5" style={{ animationDelay: "90ms" }}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatusMetric({
  label,
  value,
  color = "#2563eb",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="min-w-[118px] border border-white/10 bg-white/[0.055] px-4 py-3">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function MiniSelect({
  label,
  value,
  displayValue,
  color,
  options,
  onChange,
}: {
  label: string;
  value: string;
  displayValue: string;
  color: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative min-h-[94px] border-b border-r border-slate-200 bg-white px-5 py-4 transition hover:bg-slate-50">
      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-9 w-full appearance-none bg-transparent pr-8 text-sm font-black outline-none"
        style={{ color }}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute bottom-6 right-5 text-slate-400"
      />
      <span className="pointer-events-none absolute bottom-0 left-5 h-[3px] w-10 rounded-r-full" style={{ backgroundColor: color }} />
      <span className="sr-only">Current selection: {displayValue}</span>
    </label>
  );
}

function ContextCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[94px] border-b border-r border-slate-200 bg-slate-50/70 px-5 py-4">
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

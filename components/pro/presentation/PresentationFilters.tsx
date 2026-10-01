"use client";

import type { ReactNode } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Eye,
  Layers3,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import type {
  PresentationAnalysisBasis,
  PresentationScenarioKey,
} from "@/lib/esop/presentation";

export type PresentationViewKey =
  | "overview"
  | "ownership"
  | "value"
  | "scenarios"
  | "drivers";

type PresentationFiltersProps = {
  scenario: PresentationScenarioKey;
  analysisBasis: PresentationAnalysisBasis;
  view: PresentationViewKey;
  onScenarioChange: (value: PresentationScenarioKey) => void;
  onAnalysisBasisChange: (value: PresentationAnalysisBasis) => void;
  onViewChange: (value: PresentationViewKey) => void;
};

type SelectOption = {
  value: string;
  label: string;
  shortLabel?: string;
  description?: string;
  color?: string;
};

const scenarioOptions: Array<SelectOption & { value: PresentationScenarioKey }> = [
  {
    value: "bear",
    label: "Bear scenario",
    shortLabel: "Bear",
    description: "Downside case",
    color: "#d97706",
  },
  {
    value: "base",
    label: "Base scenario",
    shortLabel: "Base",
    description: "Expected case",
    color: "#2563eb",
  },
  {
    value: "bull",
    label: "Bull scenario",
    shortLabel: "Bull",
    description: "Upside case",
    color: "#059669",
  },
];

const analysisOptions: Array<SelectOption & { value: PresentationAnalysisBasis }> = [
  {
    value: "FULL_GRANT",
    label: "Full grant",
    shortLabel: "Full grant",
    description: "Complete confirmed grant",
    color: "#2563eb",
  },
  {
    value: "CURRENTLY_VESTED",
    label: "Currently vested",
    shortLabel: "Vested only",
    description: "Only vested equity today",
    color: "#0f766e",
  },
];

const viewOptions: Array<SelectOption & { value: PresentationViewKey }> = [
  {
    value: "overview",
    label: "Executive overview",
    shortLabel: "Overview",
    description: "Boardroom summary",
    color: "#2563eb",
  },
  {
    value: "ownership",
    label: "Ownership journey",
    shortLabel: "Ownership",
    description: "Stake and dilution",
    color: "#7c3aed",
  },
  {
    value: "value",
    label: "Value journey",
    shortLabel: "Value",
    description: "Gross to take-home",
    color: "#059669",
  },
  {
    value: "scenarios",
    label: "Scenario analysis",
    shortLabel: "Scenarios",
    description: "Bear/Base/Bull",
    color: "#0ea5e9",
  },
  {
    value: "drivers",
    label: "Model drivers",
    shortLabel: "Drivers",
    description: "Sensitivity view",
    color: "#d97706",
  },
];

function findOption<T extends SelectOption>(options: T[], value: string) {
  return options.find((option) => option.value === value) ?? options[0];
}

export default function PresentationFilters({
  scenario,
  analysisBasis,
  view,
  onScenarioChange,
  onAnalysisBasisChange,
  onViewChange,
}: PresentationFiltersProps) {
  const activeScenario = findOption(scenarioOptions, scenario);
  const activeAnalysis = findOption(analysisOptions, analysisBasis);
  const activeView = findOption(viewOptions, view);

  return (
    <>
      <style>{`
        @keyframes evcFilterEnter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes evcFilterSweep {
          0% { transform: translateX(-110%); opacity: 0; }
          25% { opacity: .75; }
          55% { opacity: .2; }
          100% { transform: translateX(115%); opacity: 0; }
        }
        .evc-filter-enter { animation: evcFilterEnter 520ms cubic-bezier(.16,1,.3,1) both; }
        .evc-filter-sweep { animation: evcFilterSweep 5.8s ease-in-out infinite; }
      `}</style>

      <section className="evc-filter-enter group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
          <div className="evc-filter-sweep absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        </div>

        <div className="relative grid gap-0 xl:grid-cols-[1fr_auto]">
          <div className="border-b border-slate-100 p-4 md:p-5 xl:border-b-0 xl:border-r">
            <div className="flex min-w-0 items-start gap-3">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#07111f] text-blue-200 shadow-[0_16px_38px_rgba(15,23,42,0.22)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.42),transparent_42%)]" />
                <SlidersHorizontal className="relative" size={17} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Presentation command layer
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-blue-700">
                    <Sparkles size={10} />
                    Live slicers
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700">
                    <ShieldCheck size={10} />
                    Model safe
                  </span>
                </div>

                <p className="mt-1.5 text-sm font-black text-slate-950 sm:text-base">
                  Change the boardroom view without changing the underlying EVC model.
                </p>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                  Scenario, basis and view act as presentation context only. The confirmed grant facts and model assumptions remain controlled in the core workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 md:p-5 sm:grid-cols-3 xl:min-w-[690px]">
            <FilterSelect
              icon={<BarChart3 size={14} />}
              label="Scenario"
              active={activeScenario}
              options={scenarioOptions}
              selectedValue={scenario}
              onChange={(value) => onScenarioChange(value as PresentationScenarioKey)}
            />

            <FilterSelect
              icon={<Layers3 size={14} />}
              label="Analysis basis"
              active={activeAnalysis}
              options={analysisOptions}
              selectedValue={analysisBasis}
              onChange={(value) => onAnalysisBasisChange(value as PresentationAnalysisBasis)}
            />

            <FilterSelect
              icon={<Eye size={14} />}
              label="View"
              active={activeView}
              options={viewOptions}
              selectedValue={view}
              onChange={(value) => onViewChange(value as PresentationViewKey)}
            />
          </div>
        </div>

        <div className="relative border-t border-slate-100 bg-slate-50/80 px-4 py-3 md:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                Active context
              </span>

              <ActivePill label={activeScenario.label} color={activeScenario.color ?? "#2563eb"} />
              <ActivePill label={activeAnalysis.label} color={activeAnalysis.color ?? "#475569"} />
              <ActivePill label={activeView.label} color={activeView.color ?? "#2563eb"} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5">
                Source facts protected
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5">
                Assumptions visible
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5">
                Output recalculated live
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FilterSelect({
  icon,
  label,
  active,
  options,
  selectedValue,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  active: SelectOption;
  options: SelectOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}) {
  const color = active.color ?? "#2563eb";

  return (
    <label className="group/select relative block min-w-0">
      <span className="mb-1.5 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
        <span style={{ color }}>{icon}</span>
        {label}
      </span>

      <span className="relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 group-hover/select:border-slate-300 group-hover/select:shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
        <select
          value={selectedValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-[52px] w-full appearance-none bg-transparent pl-4 pr-11 text-sm font-black text-slate-950 outline-none transition focus:ring-0"
          style={{ color }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-slate-100">
          <span
            className="block h-full w-12 rounded-r-full transition-all duration-300 group-hover/select:w-20"
            style={{ backgroundColor: color }}
          />
        </span>
      </span>

      <span className="mt-1.5 block truncate text-[10px] font-semibold text-slate-400">
        {active.description ?? active.shortLabel ?? active.label}
      </span>
    </label>
  );
}

function ActivePill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-black shadow-sm"
      style={{
        borderColor: `${color}2e`,
        backgroundColor: `${color}0d`,
        color,
      }}
    >
      <Check size={10} />
      {label}
    </span>
  );
}

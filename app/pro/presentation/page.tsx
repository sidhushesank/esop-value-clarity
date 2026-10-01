"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  buildPresentationModel,
  type PresentationAnalysisBasis,
  type PresentationScenarioKey,
} from "@/lib/esop/presentation";
import { useProEquityState } from "@/lib/esop/pro-state";

import PresentationShell from "@/components/pro/presentation/PresentationShell";
import PresentationFilters, {
  type PresentationViewKey,
} from "@/components/pro/presentation/PresentationFilters";
import PresentationAnalyticsCanvas from "@/components/pro/presentation/PresentationAnalyticsCanvas";
import PresentationFooter from "@/components/pro/presentation/PresentationFooter";

function analysisBasisLabel(value: PresentationAnalysisBasis) {
  return value === "FULL_GRANT" ? "Full grant" : "Currently vested";
}

function scenarioLabel(key: PresentationScenarioKey) {
  if (key === "bear") return "Bear";
  if (key === "bull") return "Bull";
  return "Base";
}

function viewLabel(value: PresentationViewKey) {
  const labels: Record<string, string> = {
    overview: "Executive overview",
    scenario: "Scenario analysis",
    scenarios: "Scenario analysis",
    ownership: "Ownership view",
    tax: "Tax and take-home",
    valuation: "Valuation view",
    waterfall: "Waterfall view",
    drivers: "Model drivers",
    modelDrivers: "Model drivers",
    sensitivity: "Model drivers",
    cashflow: "Cash-flow view",
    report: "Report view",
  };

  return labels[String(value)] ?? "Executive overview";
}

function safeDate(value?: string | Date) {
  if (!value) return "Live";

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Live";

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PresentationPage() {
  const router = useRouter();

  const { proState, hydrated } = useProEquityState();

  const [selectedScenario, setSelectedScenario] =
    useState<PresentationScenarioKey>("base");

  const [analysisBasis, setAnalysisBasis] =
    useState<PresentationAnalysisBasis>("FULL_GRANT");

  const [view, setView] = useState<PresentationViewKey>("overview");

  const presentation = useMemo(
    () =>
      buildPresentationModel(proState, {
        analysisBasis,
        selectedScenario,
      }),
    [proState, analysisBasis, selectedScenario],
  );

  const selectedScenarioData =
    presentation.scenarios.find(
      (scenario) => scenario.key === selectedScenario,
    ) ??
    presentation.scenarios.find((scenario) => scenario.key === "base") ??
    presentation.scenarios[0];

  const selectedScenarioName =
    selectedScenarioData?.label ?? scenarioLabel(selectedScenario);

  function resetView() {
    setSelectedScenario("base");
    setAnalysisBasis("FULL_GRANT");
    setView("overview");
  }

  async function enterFullscreen() {
    try {
      if (typeof document === "undefined") return;

      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Fullscreen is optional. Ignore browser-level failures.
    }
  }

  if (!hydrated) {
    return <PresentationRouteLoader />;
  }

  return (
    <PresentationRouteBackdrop>
      <PresentationShell
        data={presentation}
        selectedScenario={selectedScenario}
        analysisBasis={analysisBasis}
        onScenarioChange={setSelectedScenario}
        onAnalysisBasisChange={setAnalysisBasis}
        onBack={() => router.push("/pro/reports")}
        onResetView={resetView}
        onFullscreen={enterFullscreen}
      >
        <ControlRoomBriefing
          companyName={presentation.metadata.companyName || "Company"}
          grantName={presentation.metadata.grantName || "Employee Stock Option Grant"}
          scenario={selectedScenarioName}
          analysisBasis={analysisBasisLabel(analysisBasis)}
          view={viewLabel(view)}
          currency={presentation.metadata.currency || "INR"}
          generatedAt={safeDate(presentation.metadata.generatedAt)}
        />

        <PresentationFilters
          scenario={selectedScenario}
          analysisBasis={analysisBasis}
          view={view}
          onScenarioChange={setSelectedScenario}
          onAnalysisBasisChange={setAnalysisBasis}
          onViewChange={setView}
        />

        <PresentationAnalyticsCanvas
          data={presentation}
          selectedScenario={selectedScenario}
          onScenarioChange={setSelectedScenario}
        />

        <PresentationFooter
          companyName={presentation.metadata.companyName || "Company"}
          grantName={presentation.metadata.grantName || "Employee Stock Option Grant"}
          analysisBasis={analysisBasisLabel(analysisBasis)}
          scenario={selectedScenarioName}
          currency={presentation.metadata.currency}
          generatedAt={presentation.metadata.generatedAt}
          onClose={() => router.push("/pro/reports")}
        />
      </PresentationShell>
    </PresentationRouteBackdrop>
  );
}

function PresentationRouteBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef3f9]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="evc-aurora absolute left-[-12%] top-[-18%] h-[560px] w-[560px] rounded-full bg-blue-200/55 blur-3xl" />
        <div className="evc-aurora-delay absolute right-[-10%] top-[10%] h-[520px] w-[520px] rounded-full bg-emerald-100/75 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[18%] h-[560px] w-[560px] rounded-full bg-slate-300/40 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.042)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.042)_1px,transparent_1px)] bg-[size:38px_38px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(238,243,249,0.35)_42%,rgba(238,243,249,0.96)_100%)]" />
      </div>

      <div className="relative">{children}</div>
      <PresentationMotionStyles />
    </div>
  );
}

function ControlRoomBriefing({
  companyName,
  grantName,
  scenario,
  analysisBasis,
  view,
  currency,
  generatedAt,
}: {
  companyName: string;
  grantName: string;
  scenario: string;
  analysisBasis: string;
  view: string;
  currency: string;
  generatedAt: string;
}) {
  return (
    <section className="evc-slide-up overflow-hidden border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="grid gap-0 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="relative overflow-hidden bg-[#07111f] px-6 py-5 text-white sm:px-7">
          <div className="absolute right-[-90px] top-[-130px] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[38%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="evc-scanline absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-blue-300/25 bg-blue-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
                Equity Intelligence Control Room
              </span>
              <span className="border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                Live model
              </span>
            </div>

            <h2 className="mt-4 max-w-4xl text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
              Boardroom-grade ESOP analytics for one connected decision model.
            </h2>

            <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-300">
              Source grant, assumptions, vesting, dilution, exercise cost, tax and exit scenarios are shown as one professional fintech report for advisor, CA, founder, finance and employee explanation workflows.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <BriefingPillar
                label="01 Source"
                title="Confirmed grant"
                text="Grant facts remain separate from modelling assumptions."
              />
              <BriefingPillar
                label="02 Assumptions"
                title="Scenario controls"
                text="Bear, Base and Bull keep uncertainty visible."
              />
              <BriefingPillar
                label="03 Output"
                title="Decision report"
                text="Charts explain cost, tax, dilution and take-home."
              />
            </div>
          </div>
        </div>

        <div className="grid gap-0 border-l border-slate-200 bg-slate-50/70 sm:grid-cols-3 xl:grid-cols-2">
          <BriefingMetric label="Company" value={companyName || "Company"} />
          <BriefingMetric label="Grant" value={grantName || "Employee Stock Option Grant"} />
          <BriefingMetric label="Scenario" value={scenario} accent="emerald" />
          <BriefingMetric label="Analysis" value={analysisBasis} />
          <BriefingMetric label="View" value={view} />
          <BriefingMetric label="Currency" value={currency || "INR"} />
          <BriefingMetric label="Status" value="Model synced" accent="emerald" />
          <BriefingMetric label="Updated" value={generatedAt} />
        </div>
      </div>
    </section>
  );
}

function BriefingPillar({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="group border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-300/30 hover:bg-white/[0.075]">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-200">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
    </div>
  );
}

function BriefingMetric({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: string;
  accent?: "blue" | "emerald";
}) {
  return (
    <div className="group min-h-[104px] border-b border-r border-slate-200 bg-white px-5 py-4 transition duration-300 hover:bg-slate-50">
      <p
        className={`text-[9px] font-black uppercase tracking-[0.16em] ${
          accent === "emerald" ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-sm font-black leading-5 text-slate-950">
        {value}
      </p>
    </div>
  );
}

function PresentationRouteLoader() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef3f9]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12%] top-[-18%] h-[520px] w-[520px] rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute right-[-10%] top-[12%] h-[520px] w-[520px] rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:36px_36px]" />
      </div>

      <div className="relative mx-auto max-w-[1760px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-56 border border-slate-200 bg-slate-950" />
            <div className="grid grid-cols-2 gap-0 border border-slate-200 bg-white">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="border-b border-r border-slate-200 p-5"
                >
                  <div className="h-3 w-20 bg-slate-200" />
                  <div className="mt-4 h-5 w-32 bg-slate-300" />
                </div>
              ))}
            </div>
          </div>

          <div className="h-36 border border-slate-200 bg-white" />

          <div className="grid gap-3 xl:grid-cols-12">
            <SkeletonTile className="xl:col-span-3" />
            <SkeletonTile className="xl:col-span-6" />
            <SkeletonTile className="xl:col-span-3" />
            <SkeletonTile className="xl:col-span-4" />
            <SkeletonTile className="xl:col-span-5" />
            <SkeletonTile className="xl:col-span-3" />
            <SkeletonTile className="xl:col-span-4" />
            <SkeletonTile className="xl:col-span-4" />
            <SkeletonTile className="xl:col-span-4" />
            <SkeletonTile className="xl:col-span-12" tall />
          </div>
        </div>
      </div>
      <PresentationMotionStyles />
    </main>
  );
}

function SkeletonTile({
  className = "",
  tall = false,
}: {
  className?: string;
  tall?: boolean;
}) {
  return (
    <div
      className={`border border-slate-200 bg-white p-4 shadow-sm ${className} ${
        tall ? "h-[340px]" : "h-[280px]"
      }`}
    >
      <div className="h-3 w-28 bg-slate-200" />
      <div className="mt-3 h-5 w-44 bg-slate-300" />
      <div className="mt-8 h-[1px] w-full bg-slate-200" />
      <div className="mt-8 grid grid-cols-4 items-end gap-3">
        <div className="h-24 bg-slate-200" />
        <div className="h-36 bg-slate-300" />
        <div className="h-20 bg-slate-200" />
        <div className="h-44 bg-slate-300" />
      </div>
    </div>
  );
}

function PresentationMotionStyles() {
  return (
    <style jsx global>{`
      @keyframes evcSlideUp {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes evcAurora {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(28px, -18px, 0) scale(1.05);
        }
      }

      @keyframes evcScanline {
        0% {
          transform: translateX(-70%);
          opacity: 0;
        }
        18% {
          opacity: 1;
        }
        100% {
          transform: translateX(70%);
          opacity: 0;
        }
      }

      .evc-slide-up {
        animation: evcSlideUp 560ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }

      .evc-aurora {
        animation: evcAurora 12s ease-in-out infinite;
      }

      .evc-aurora-delay {
        animation: evcAurora 14s ease-in-out infinite reverse;
      }

      .evc-scanline {
        animation: evcScanline 6s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .evc-slide-up,
        .evc-aurora,
        .evc-aurora-delay,
        .evc-scanline {
          animation: none !important;
        }
      }
    `}</style>
  );
}

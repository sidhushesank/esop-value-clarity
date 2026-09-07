"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  Database,
  FileChartColumn,
  Info,
  Layers3,
  Percent,
  ShieldCheck,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import Footer from "@/components/sections/Footer";
import EquityGrowthChart from "@/components/history/EquityGrowthChart";

interface Calculation {
  id: string;
  esopsGranted: number;
  vestedPercentage: number;
  vestedShares: number;
  currentValuation: number;
  dilutionPercentage: number;
  exitValuation: number;
  valueToday: number;
  afterDilution: number;
  exitValue: number;
  createdAt: string;
}

function numericValue(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function formatNumber(value: number) {
  return numericValue(value).toLocaleString("en-IN");
}

function formatFullINR(value: number) {
  return `₹${formatNumber(value)}`;
}

function formatCompactINR(value: number) {
  const amount = numericValue(value);

  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })} Cr`;
  }

  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })} L`;
  }

  return formatFullINR(amount);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CalculationDetailsPage() {
  const params = useParams();
  const calculationId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [calculation, setCalculation] = useState<Calculation | null>(null);

  useEffect(() => {
    async function fetchCalculation() {
      if (!calculationId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/calculator/${calculationId}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(data.message);
          return;
        }

        setCalculation(data.calculation);
      } catch (error) {
        console.error("[HISTORY_PREVIEW]", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchCalculation();
  }, [calculationId]);

  if (loading) {
    return <PreviewLoading />;
  }

  if (!calculation) {
    return <PreviewNotFound />;
  }

  return <CalculationPreview calculation={calculation} />;
}

function CalculationPreview({ calculation }: { calculation: Calculation }) {
  const [showMethodology, setShowMethodology] = useState(false);

  const metrics = useMemo(() => {
    const currentValue = numericValue(calculation.valueToday);
    const afterDilution = numericValue(calculation.afterDilution);
    const exitValue = numericValue(calculation.exitValue);
    const dilutionImpact = Math.max(currentValue - afterDilution, 0);
    const growthPercent = currentValue > 0
      ? ((exitValue - currentValue) / currentValue) * 100
      : 0;
    const exitMultiple = currentValue > 0 ? exitValue / currentValue : 0;

    return {
      currentValue,
      afterDilution,
      exitValue,
      dilutionImpact,
      growthPercent,
      exitMultiple,
    };
  }, [calculation]);

  const positiveGrowth = metrics.growthPercent >= 0;

  return (
    <>
      <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
        <div className="mx-auto max-w-[1460px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to history
            </Link>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Database className="h-4 w-4" />
              Private scenario ledger
              <span className="mx-1 h-1 w-1 rounded-full bg-slate-300" />
              <span className="font-mono text-[11px]">{calculation.id.slice(0, 12)}…</span>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-[28px] bg-[#07111f] px-6 py-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.17)] sm:px-10 lg:px-12 lg:py-10">
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:44px_44px]" />
            <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative grid gap-9 lg:grid-cols-[1fr_0.78fr] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
                    <FileChartColumn className="h-3.5 w-3.5" />
                    Scenario preview
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Saved
                  </span>
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.065em] sm:text-5xl lg:text-6xl">
                  Equity scenario
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-violet-300" />
                    {formatDate(calculation.createdAt)}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    Assumptions preserved
                  </span>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Modeled exit value
                    </p>
                    <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">
                      {formatCompactINR(metrics.exitValue)}
                    </p>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <Target className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-400">Scenario outcome</span>
                  <span className={`inline-flex items-center gap-1.5 font-bold ${positiveGrowth ? "text-emerald-300" : "text-rose-300"}`}>
                    {positiveGrowth ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {positiveGrowth ? "+" : ""}{metrics.growthPercent.toFixed(1)}% vs today
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Value today"
              value={formatCompactINR(metrics.currentValue)}
              helper="Current modeled value"
              icon={CircleDollarSign}
              tone="blue"
            />
            <MetricCard
              label="After dilution"
              value={formatCompactINR(metrics.afterDilution)}
              helper={`${formatNumber(calculation.dilutionPercentage)}% dilution applied`}
              icon={Layers3}
              tone="violet"
            />
            <MetricCard
              label="Modeled exit"
              value={formatCompactINR(metrics.exitValue)}
              helper={`${metrics.exitMultiple.toFixed(2)}× current value`}
              icon={TrendingUp}
              tone="emerald"
              emphasized
            />
          </section>

          <EquityGrowthChart
            currentValue={metrics.currentValue}
            afterDilution={metrics.afterDilution}
            exitValue={metrics.exitValue}
          />

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)] sm:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                    Scenario inputs
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">
                    Assumptions captured
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    The inputs that shaped this saved calculation.
                  </p>
                </div>
                <span className="hidden h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-500 sm:grid">
                  <BarChart3 className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InputMetric label="ESOPs granted" value={formatNumber(calculation.esopsGranted)} icon={WalletCards} />
                <InputMetric label="Vested percentage" value={`${formatNumber(calculation.vestedPercentage)}%`} icon={Percent} />
                <InputMetric label="Vested shares" value={formatNumber(calculation.vestedShares)} icon={Check} />
                <InputMetric label="Dilution percentage" value={`${formatNumber(calculation.dilutionPercentage)}%`} icon={Layers3} />
                <InputMetric label="Current valuation" value={formatFullINR(calculation.currentValuation)} icon={CircleDollarSign} />
                <InputMetric label="Exit valuation" value={formatFullINR(calculation.exitValuation)} icon={Target} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)] sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                    <Target className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Decision snapshot</p>
                    <h2 className="mt-1 text-xl font-black tracking-[-0.035em]">What stands out</h2>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <DecisionRow
                    label="Value created in scenario"
                    value={formatCompactINR(Math.max(metrics.exitValue - metrics.currentValue, 0))}
                    helper="Modeled exit less current value"
                    icon={TrendingUp}
                    positive
                  />
                  <DecisionRow
                    label="Dilution impact"
                    value={formatCompactINR(metrics.dilutionImpact)}
                    helper="Current value reduced by dilution"
                    icon={Layers3}
                  />
                  <DecisionRow
                    label="Vested ownership basis"
                    value={`${formatNumber(calculation.vestedPercentage)}%`}
                    helper={`${formatNumber(calculation.vestedShares)} vested shares modeled`}
                    icon={ShieldCheck}
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 sm:p-7">
                <button
                  type="button"
                  onClick={() => setShowMethodology((current) => !current)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={showMethodology}
                >
                  <span className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-violet-600" />
                    <span>
                      <span className="block text-sm font-black text-slate-900">How this scenario is read</span>
                      <span className="mt-1 block text-xs text-slate-500">Methodology and limitations</span>
                    </span>
                  </span>
                  <ArrowRight className={`h-4 w-4 text-slate-400 transition-transform ${showMethodology ? "rotate-90" : ""}`} />
                </button>

                {showMethodology && (
                  <div className="mt-5 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-600">
                    <p>
                      Value today is based on vested shares and current valuation. After dilution applies the saved dilution assumption. Modeled exit applies the exit valuation and the same vested-share basis.
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      This is decision support, not a guarantee of proceeds. Taxes, exercise cost, liquidity and future financing terms are not included in this FREE calculation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p>
                This scenario is saved privately to your ESOP Value Clarity workspace.
              </p>
            </div>
            <Link href="/history" className="inline-flex items-center gap-2 font-black text-emerald-700 hover:text-emerald-900">
              View all scenarios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
  emphasized = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "violet" | "emerald";
  emphasized?: boolean;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className={`rounded-[22px] border p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(15,23,42,0.08)] ${emphasized ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${emphasized ? "text-slate-400" : "text-slate-400"}`}>{label}</p>
          <p className="mt-3 text-3xl font-black tracking-[-0.06em]">{value}</p>
          <p className={`mt-3 text-xs ${emphasized ? "text-slate-400" : "text-slate-500"}`}>{helper}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${emphasized ? "bg-emerald-400/10 text-emerald-300" : tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function InputMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-500 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate text-sm font-bold text-slate-600">{label}</span>
      </span>
      <span className="shrink-0 text-right text-sm font-black text-slate-950">{value}</span>
    </div>
  );
}

function DecisionRow({
  label,
  value,
  helper,
  icon: Icon,
  positive = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  positive?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${positive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold text-slate-700">{label}</p>
          <p className={`shrink-0 text-sm font-black ${positive ? "text-emerald-700" : "text-slate-950"}`}>{value}</p>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
      </div>
    </div>
  );
}

function PreviewLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm">
        <Clock3 className="h-5 w-5 animate-pulse text-violet-600" />
        Loading saved scenario…
      </div>
    </main>
  );
}

function PreviewNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f6f8fb] px-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
        <CircleAlert className="h-6 w-6" />
      </span>
      <div>
        <h2 className="text-2xl font-black tracking-[-0.04em]">Scenario not found</h2>
        <p className="mt-2 text-sm text-slate-500">This saved calculation may have been removed.</p>
      </div>
      <Link href="/history" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800">
        <ArrowLeft className="h-4 w-4" />
        Back to history
      </Link>
    </main>
  );
}

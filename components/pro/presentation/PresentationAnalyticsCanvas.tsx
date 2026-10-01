"use client";

import type { ReactNode } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  GitBranch,
  Layers3,
  LineChart,
  Percent,
  PieChart,
  ReceiptIndianRupee,
  Split,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import type {
  PresentationData,
  PresentationScenario,
  PresentationScenarioKey,
  PresentationSensitivityItem,
} from "@/lib/esop/presentation";

type PresentationAnalyticsCanvasProps = {
  data: PresentationData;
  selectedScenario: PresentationScenarioKey;
  onScenarioChange: (scenario: PresentationScenarioKey) => void;
};

type ChartDatum = {
  name: string;
  value: number;
  itemStyle?: Record<string, unknown>;
  label?: Record<string, unknown>;
};

const BI = {
  ink: "#111827",
  muted: "#6b7280",
  softMuted: "#9ca3af",
  grid: "#e5e7eb",
  panel: "#ffffff",
  canvas: "#f3f4f6",
  blue: "#2563eb",
  blueDark: "#1d4ed8",
  green: "#059669",
  amber: "#d97706",
  red: "#dc2626",
  violet: "#7c3aed",
  slate: "#475569",
  dark: "#0f172a",
};

function safeNumber(value: number | null | undefined, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function formatCurrency(value: number, currency = "INR") {
  const clean = safeNumber(value);

  if (currency === "INR") {
    return `₹${Math.round(clean).toLocaleString("en-IN")}`;
  }

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(clean);
  } catch {
    return Math.round(clean).toLocaleString("en-IN");
  }
}

function compactCurrency(value: number, currency = "INR") {
  const clean = safeNumber(value);
  const abs = Math.abs(clean);

  if (currency === "INR") {
    if (abs >= 10_000_000) {
      return `₹${(clean / 10_000_000).toFixed(abs >= 100_000_000 ? 0 : 1)}Cr`;
    }

    if (abs >= 100_000) {
      return `₹${(clean / 100_000).toFixed(abs >= 1_000_000 ? 0 : 1)}L`;
    }

    if (abs >= 1_000) {
      return `₹${(clean / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
    }
  }

  return formatCurrency(clean, currency);
}

function formatNumber(value: number) {
  return Math.round(safeNumber(value)).toLocaleString("en-IN");
}

function formatPercentage(value: number) {
  return `${safeNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}%`;
}

function formatMultiple(value: number) {
  return `${safeNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}×`;
}

function clamp(value: number, min = 0, max = 100) {
  const clean = safeNumber(value, min);
  return Math.min(max, Math.max(min, clean));
}

function ratio(part: number, total: number) {
  const denominator = Math.abs(safeNumber(total));
  if (denominator <= 0) return 0;
  return clamp((safeNumber(part) / denominator) * 100);
}

function scenarioColor(key: PresentationScenarioKey) {
  if (key === "bear") {
    return {
      main: BI.amber,
      dark: "#92400e",
      soft: "#fff7ed",
      border: "#fed7aa",
      text: "#92400e",
    };
  }

  if (key === "bull") {
    return {
      main: BI.green,
      dark: "#065f46",
      soft: "#ecfdf5",
      border: "#a7f3d0",
      text: "#047857",
    };
  }

  return {
    main: BI.blue,
    dark: BI.blueDark,
    soft: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
  };
}

function sensitivityColor(key: string) {
  if (key === "valuation") return BI.blue;
  if (key === "dilution") return BI.violet;
  if (key === "exercise") return BI.amber;
  if (key === "tax") return BI.red;
  if (key === "vesting") return BI.green;
  return BI.slate;
}

function sensitivityDirection(key: string) {
  if (key === "exercise" || key === "tax" || key === "dilution") return "negative";
  return "positive";
}

function axisCurrency(currency: string) {
  return (value: number) => compactCurrency(value, currency);
}

function baseTooltip() {
  return {
    backgroundColor: BI.dark,
    borderColor: "#1f2937",
    borderWidth: 1,
    padding: [10, 12],
    textStyle: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: 500,
    },
  };
}

function baseGrid(extra?: Record<string, unknown>) {
  return {
    top: 48,
    left: 72,
    right: 28,
    bottom: 48,
    containLabel: true,
    ...extra,
  };
}

function baseAxisLabel() {
  return {
    color: BI.muted,
    fontSize: 11,
    fontWeight: 600,
  };
}

export default function PresentationAnalyticsCanvas({
  data,
  selectedScenario,
  onScenarioChange,
}: PresentationAnalyticsCanvasProps) {
  const currency = data.metadata.currency || "INR";
  const scenarios = data.scenarios;

  const selected =
    scenarios.find((scenario) => scenario.key === selectedScenario) ??
    scenarios.find((scenario) => scenario.key === "base") ??
    scenarios[0];

  if (!selected) {
    return (
      <section className="border border-slate-300 bg-[#f3f4f6] p-4 shadow-sm">
        <div className="border border-slate-300 bg-white p-6">
          <p className="text-sm font-semibold text-slate-950">No scenario data available.</p>
          <p className="mt-1 text-xs text-slate-500">Complete the Equity Intelligence model first, then reopen the presentation canvas.</p>
        </div>
      </section>
    );
  }

  const bear = scenarios.find((scenario) => scenario.key === "bear") ?? selected;
  const base = scenarios.find((scenario) => scenario.key === "base") ?? selected;
  const bull = scenarios.find((scenario) => scenario.key === "bull") ?? selected;

  const totalOptions = Math.max(0, safeNumber(data.grant.totalOptions));
  const gross = Math.max(0, safeNumber(selected.grossEquityValue));
  const exercise = Math.max(0, safeNumber(selected.exerciseCost));
  const tax = Math.max(0, safeNumber(selected.estimatedTax));
  const takeHome = Math.max(0, safeNumber(selected.estimatedTakeHome));
  const deductions = exercise + tax;
  const retainedPercentage = gross > 0 ? clamp((takeHome / gross) * 100) : 0;
  const deductionPercentage = gross > 0 ? clamp((deductions / gross) * 100) : 0;

  return (
    <section className="border border-slate-300 bg-[#f3f4f6] p-3 shadow-sm sm:p-4">
      <div className="border border-slate-300 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-300 bg-[#111827] px-4 py-4 text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center border border-white/20 bg-white/10 text-blue-200">
              <BarChart3 size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">
                EVC | Equity Intelligence
              </p>
              <h2 className="mt-1 truncate text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">
                Equity Intelligence Control Room
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                Confirmed grant facts, scenario assumptions, model outputs, sensitivity and cash-flow explanation in one BI-grade view.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DarkMetric label="Scenario" value={selected.label} />
            <DarkMetric label="Take-home" value={compactCurrency(takeHome, currency)} />
            <DarkMetric label="Retained" value={formatPercentage(retainedPercentage)} />
            <DarkMetric label="Deductions" value={formatPercentage(deductionPercentage)} />
          </div>
        </div>

        <div className="grid gap-3 bg-[#f3f4f6] p-3 xl:grid-cols-12">
          <BiTile className="xl:col-span-3" title="Executive KPIs" eyebrow="Model summary" icon={<Target size={14} />}>
            <ExecutiveKpiGrid
              totalOptions={data.grant.totalOptions}
              vestedPercentage={data.grant.vestedPercentage}
              dilutedOwnership={data.ownership.dilutedOwnership}
              exerciseCost={data.grant.exerciseCost}
              takeHome={takeHome}
              returnMultiple={selected.returnMultiple}
              currency={currency}
            />
          </BiTile>

          <BiTile className="xl:col-span-6" title="Scenario outcome model" eyebrow="Columns + return line" icon={<LineChart size={14} />}>
            <ExitTakeHomeLineChart
              scenarios={scenarios}
              selectedScenario={selectedScenario}
              onScenarioChange={onScenarioChange}
              currency={currency}
            />
          </BiTile>

          <BiTile className="xl:col-span-3" title="Value retention" eyebrow="Nested donut" icon={<PieChart size={14} />}>
            <ValueDonut gross={gross} exercise={exercise} tax={tax} takeHome={takeHome} currency={currency} />
          </BiTile>

          <BiTile className="xl:col-span-4" title="Gross to take-home" eyebrow="True waterfall" icon={<Wallet size={14} />}>
            <WaterfallMini gross={gross} exercise={exercise} tax={tax} takeHome={takeHome} currency={currency} />
          </BiTile>

          <BiTile className="xl:col-span-5" title="Bear / Base / Bull analytics" eyebrow="Grouped columns + line" icon={<BarChart3 size={14} />}>
            <ScenarioColumnChart
              scenarios={scenarios}
              selectedScenario={selectedScenario}
              onScenarioChange={onScenarioChange}
              currency={currency}
            />
          </BiTile>

          <BiTile className="xl:col-span-3" title="Scenario matrix" eyebrow="Exact values" icon={<Activity size={14} />}>
            <ScenarioMatrix
              bear={bear}
              base={base}
              bull={bull}
              selectedScenario={selectedScenario}
              onScenarioChange={onScenarioChange}
              currency={currency}
            />
          </BiTile>

          <BiTile className="xl:col-span-4" title="Scenario retention profile" eyebrow="100% value mix" icon={<Percent size={14} />}>
            <ScenarioRetentionChart
              scenarios={scenarios}
              selectedScenario={selectedScenario}
              onScenarioChange={onScenarioChange}
            />
          </BiTile>

          <BiTile className="xl:col-span-4" title="Take-home variance bridge" eyebrow="Scenario delta" icon={<TrendingUp size={14} />}>
            <ScenarioVarianceBridge
              bear={bear}
              base={base}
              bull={bull}
              selectedScenario={selectedScenario}
              onScenarioChange={onScenarioChange}
              currency={currency}
            />
          </BiTile>

          <BiTile className="xl:col-span-4" title="Decision profile" eyebrow="Radar scorecard" icon={<Activity size={14} />}>
            <DecisionRadar data={data} selected={selected} scenarios={scenarios} />
          </BiTile>

          <BiTile className="xl:col-span-4" title="Grant allocation" eyebrow="100% stacked bar" icon={<Layers3 size={14} />}>
            <VestingCurve
              vestedPercentage={data.grant.vestedPercentage}
              vestedOptions={data.grant.vestedOptions}
              totalOptions={data.grant.totalOptions}
            />
          </BiTile>

          <BiTile className="xl:col-span-4" title="Ownership / dilution" eyebrow="Bullet comparison" icon={<TrendingUp size={14} />}>
            <OwnershipStack
              totalOptions={data.grant.totalOptions}
              vestedOptions={data.grant.vestedOptions}
              unvestedOptions={data.vesting.unvestedOptions}
              vestedPercentage={data.grant.vestedPercentage}
              currentOwnership={data.ownership.currentOwnership}
              dilutedOwnership={data.ownership.dilutedOwnership}
            />
          </BiTile>

          <BiTile className="xl:col-span-4" title="Sensitivity tornado" eyebrow="Driver impact" icon={<Split size={14} />}>
            <TornadoChart items={data.sensitivity} currency={currency} />
          </BiTile>

          <BiTile className="xl:col-span-6" title="Financial flow" eyebrow="Money-only Sankey" icon={<GitBranch size={14} />}>
            <DecompositionTree data={data} selected={selected} currency={currency} />
          </BiTile>

          <BiTile className="xl:col-span-6" title="Scenario return map" eyebrow="Scatter / bubble" icon={<CircleDollarSign size={14} />}>
            <ScenarioBubbleChart scenarios={scenarios} selectedScenario={selectedScenario} onScenarioChange={onScenarioChange} currency={currency} />
          </BiTile>

          <BiTile className="xl:col-span-4" title="Capital burden gauge" eyebrow="Exercise + tax load" icon={<ReceiptIndianRupee size={14} />}>
            <CapitalBurdenGauge gross={gross} exercise={exercise} tax={tax} currency={currency} />
          </BiTile>

          <BiTile className="xl:col-span-4" title="Outcome component map" eyebrow="Treemap" icon={<PieChart size={14} />}>
            <OutcomeTreemap gross={gross} exercise={exercise} tax={tax} takeHome={takeHome} currency={currency} />
          </BiTile>

          <BiTile className="xl:col-span-4" title="Source / assumption / output" eyebrow="Trust layer" icon={<CheckCircle2 size={14} />}>
            <ModelTrustMatrix data={data} selected={selected} currency={currency} />
          </BiTile>

          <BiTile className="xl:col-span-12" title="Analytical readout" eyebrow="Model explanation" icon={<CheckCircle2 size={14} />}>
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <p className="text-sm leading-6 text-slate-700">
                Under the <span className="font-semibold text-slate-950">{selected.label}</span> scenario, the model moves from{" "}
                <span className="font-semibold text-blue-700">{formatCurrency(gross, currency)}</span> gross equity value to{" "}
                <span className="font-semibold text-emerald-700">{formatCurrency(takeHome, currency)}</span> estimated take-home after{" "}
                <span className="font-semibold text-amber-700">{formatCurrency(exercise, currency)}</span> exercise cost and{" "}
                <span className="font-semibold text-red-700">{formatCurrency(tax, currency)}</span> estimated tax.
              </p>

              <div className="border border-slate-300 bg-white px-4 py-3 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Final modeled output</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{compactCurrency(takeHome, currency)}</p>
              </div>
            </div>
          </BiTile>
        </div>
      </div>
    </section>
  );
}

function BiTile({
  eyebrow,
  title,
  icon,
  className = "",
  children,
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`overflow-hidden border border-slate-300 bg-white ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{eyebrow}</p>
          <h3 className="mt-0.5 truncate text-sm font-semibold tracking-tight text-slate-950">{title}</h3>
        </div>

        <div className="grid h-7 w-7 shrink-0 place-items-center border border-slate-300 bg-slate-50 text-slate-700">{icon}</div>
      </div>

      <div className="p-3">{children}</div>
    </div>
  );
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/15 bg-white/[0.06] px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ExecutiveKpiGrid({
  totalOptions,
  vestedPercentage,
  dilutedOwnership,
  exerciseCost,
  takeHome,
  returnMultiple,
  currency,
}: {
  totalOptions: number;
  vestedPercentage: number;
  dilutedOwnership: number;
  exerciseCost: number;
  takeHome: number;
  returnMultiple: number;
  currency: string;
}) {
  return (
    <div className="grid gap-2">
      <KpiLine icon={<Layers3 size={13} />} label="Granted" value={formatNumber(totalOptions)} />
      <KpiLine icon={<Percent size={13} />} label="Vested" value={formatPercentage(vestedPercentage)} />
      <KpiLine icon={<TrendingUp size={13} />} label="Diluted stake" value={formatPercentage(dilutedOwnership)} emphasis="dark" />
      <KpiLine icon={<ReceiptIndianRupee size={13} />} label="Exercise" value={compactCurrency(exerciseCost, currency)} />
      <KpiLine icon={<Wallet size={13} />} label="Take-home" value={compactCurrency(takeHome, currency)} emphasis="green" />
      <KpiLine icon={<Activity size={13} />} label="Return" value={formatMultiple(returnMultiple)} />
    </div>
  );
}

function KpiLine({
  icon,
  label,
  value,
  emphasis = "normal",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  emphasis?: "normal" | "dark" | "green";
}) {
  const classes =
    emphasis === "dark"
      ? "border-slate-900 bg-slate-950 text-white"
      : emphasis === "green"
        ? "border-emerald-300 bg-emerald-50 text-emerald-950"
        : "border-slate-300 bg-white text-slate-950";

  const labelClasses = emphasis === "dark" ? "text-slate-400" : emphasis === "green" ? "text-emerald-700" : "text-slate-500";

  return (
    <div className={`flex items-center justify-between gap-3 border px-2.5 py-2 ${classes}`}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center border border-current/15 bg-white/40">{icon}</span>
        <span className={`truncate text-[10px] font-bold uppercase tracking-[0.1em] ${labelClasses}`}>{label}</span>
      </div>
      <span className="shrink-0 text-sm font-semibold">{value}</span>
    </div>
  );
}

function ExitTakeHomeLineChart({
  scenarios,
  selectedScenario,
  onScenarioChange,
  currency,
}: {
  scenarios: PresentationScenario[];
  selectedScenario: PresentationScenarioKey;
  onScenarioChange: (scenario: PresentationScenarioKey) => void;
  currency: string;
}) {
  const option = {
    animation: true,
    animationDuration: 450,
    color: [BI.blue, BI.green, BI.dark],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      ...baseTooltip(),
      formatter: (params: any) => {
        const index = Number(params?.[0]?.dataIndex ?? 0);
        const scenario = scenarios[index];
        if (!scenario) return "";
        return [
          `<b>${scenario.label}</b>`,
          `Exit valuation: <b>${formatCurrency(scenario.exitValuation, currency)}</b>`,
          `Gross equity: <b>${formatCurrency(scenario.grossEquityValue, currency)}</b>`,
          `Take-home: <b>${formatCurrency(scenario.estimatedTakeHome, currency)}</b>`,
          `Return multiple: <b>${formatMultiple(scenario.returnMultiple)}</b>`,
        ].join("<br/>");
      },
    },
    legend: {
      top: 6,
      right: 8,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: BI.muted, fontSize: 11, fontWeight: 600 },
      data: ["Exit valuation", "Take-home", "Return multiple"],
    },
    grid: baseGrid({ top: 44, left: 70, right: 58, bottom: 42 }),
    xAxis: {
      type: "category",
      data: scenarios.map((scenario) => scenario.label),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#d1d5db" } },
      axisLabel: baseAxisLabel(),
    },
    yAxis: [
      {
        type: "value",
        name: "Value",
        nameTextStyle: { color: BI.muted, fontSize: 10, fontWeight: 700 },
        axisLabel: { ...baseAxisLabel(), formatter: axisCurrency(currency) },
        splitLine: { lineStyle: { color: BI.grid } },
      },
      {
        type: "value",
        name: "Return",
        nameTextStyle: { color: BI.muted, fontSize: 10, fontWeight: 700 },
        axisLabel: { ...baseAxisLabel(), formatter: (value: number) => `${value}×` },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Exit valuation",
        type: "bar",
        barWidth: 22,
        data: scenarios.map((scenario) => ({
          value: scenario.exitValuation,
          itemStyle: { color: "#93c5fd" },
        })),
      },
      {
        name: "Take-home",
        type: "bar",
        barWidth: 22,
        data: scenarios.map((scenario) => ({
          value: scenario.estimatedTakeHome,
          itemStyle: {
            color: scenarioColor(scenario.key).main,
            opacity: scenario.key === selectedScenario ? 1 : 0.75,
          },
        })),
      },
      {
        name: "Return multiple",
        type: "line",
        yAxisIndex: 1,
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2, color: BI.dark },
        itemStyle: { color: BI.dark },
        data: scenarios.map((scenario) => scenario.returnMultiple),
      },
    ],
  } as EChartsOption;

  return (
    <div>
      <ReactECharts
        option={option}
        style={{ width: "100%", height: 280 }}
        notMerge
        lazyUpdate
        onEvents={{
          click: (params: any) => {
            const scenario = scenarios[Number(params?.dataIndex ?? -1)];
            if (scenario) onScenarioChange(scenario.key);
          },
        }}
      />
      <div className="grid grid-cols-3 gap-2">
        {scenarios.map((scenario) => {
          const active = scenario.key === selectedScenario;
          const color = scenarioColor(scenario.key);
          return (
            <button
              key={scenario.key}
              type="button"
              onClick={() => onScenarioChange(scenario.key)}
              className="border px-2.5 py-2 text-left transition hover:border-slate-500"
              style={{ borderColor: active ? color.main : "#d1d5db", backgroundColor: active ? color.soft : "#ffffff" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: color.text }}>
                {scenario.label}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-950">{compactCurrency(scenario.estimatedTakeHome, currency)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ValueDonut({
  gross,
  exercise,
  tax,
  takeHome,
  currency,
}: {
  gross: number;
  exercise: number;
  tax: number;
  takeHome: number;
  currency: string;
}) {
  const deductions = exercise + tax;
  const retained = Math.max(0, takeHome);
  const totalForShare = Math.max(1, retained + deductions, gross);
  const retainedShare = ratio(retained, totalForShare);

  const option = {
    animation: true,
    tooltip: {
      trigger: "item",
      ...baseTooltip(),
      formatter: (params: any) => `${params.seriesName}<br/>${params.name}: <b>${formatCurrency(Number(params.value), currency)}</b> (${params.percent}%)`,
    },
    title: {
      text: `${retainedShare.toFixed(1)}%`,
      subtext: "retained",
      left: "center",
      top: "37%",
      textStyle: { color: BI.ink, fontSize: 22, fontWeight: 700 },
      subtextStyle: { color: BI.muted, fontSize: 10, fontWeight: 700 },
    },
    legend: {
      bottom: 0,
      left: "center",
      itemWidth: 9,
      itemHeight: 9,
      textStyle: { color: BI.muted, fontSize: 10, fontWeight: 600 },
    },
    series: [
      {
        name: "Retention split",
        type: "pie",
        radius: ["34%", "49%"],
        center: ["50%", "43%"],
        selectedMode: false,
        label: { show: false },
        labelLine: { show: false },
        data: [
          { name: "Retained", value: retained, itemStyle: { color: BI.green } },
          { name: "Deductions", value: deductions, itemStyle: { color: "#cbd5e1" } },
        ],
      },
      {
        name: "Value components",
        type: "pie",
        radius: ["57%", "74%"],
        center: ["50%", "43%"],
        label: { show: false },
        labelLine: { show: false },
        data: [
          { name: "Take-home", value: retained, itemStyle: { color: BI.green } },
          { name: "Exercise", value: exercise, itemStyle: { color: BI.amber } },
          { name: "Tax", value: tax, itemStyle: { color: BI.red } },
        ],
      },
    ],
  } as EChartsOption;

  return (
    <div className="grid gap-3">
      <ReactECharts option={option} style={{ width: "100%", height: 235 }} notMerge lazyUpdate />
      <div className="grid gap-1.5">
        <DonutLegend label="Gross reference" value={gross} color={BI.blue} currency={currency} />
        <DonutLegend label="Take-home" value={takeHome} color={BI.green} currency={currency} />
        <DonutLegend label="Exercise + tax" value={deductions} color={BI.red} currency={currency} />
      </div>
    </div>
  );
}

function DonutLegend({ label, value, color, currency }: { label: string; value: number; color: string; currency: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-slate-200 bg-white px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      </div>
      <span className="text-xs font-semibold text-slate-950">{compactCurrency(value, currency)}</span>
    </div>
  );
}

function WaterfallMini({
  gross,
  exercise,
  tax,
  takeHome,
  currency,
}: {
  gross: number;
  exercise: number;
  tax: number;
  takeHome: number;
  currency: string;
}) {
  const afterExercise = Math.max(0, gross - exercise);
  const afterTax = Math.max(0, gross - exercise - tax);
  const max = Math.max(1, gross, afterExercise, afterTax, takeHome);

  const offsets = [0, afterExercise, afterTax, 0];
  const bars: ChartDatum[] = [
    { name: "Gross", value: gross, itemStyle: { color: BI.blue } },
    { name: "Exercise", value: exercise, itemStyle: { color: BI.amber } },
    { name: "Tax", value: tax, itemStyle: { color: BI.red } },
    { name: "Take-home", value: takeHome, itemStyle: { color: BI.green } },
  ];

  const option = {
    animation: true,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...baseTooltip(),
      formatter: (params: any) => {
        const visible = params?.find((item: any) => item.seriesName === "Amount");
        const index = Number(visible?.dataIndex ?? 0);
        const label = ["Gross equity value", "Exercise cost", "Estimated tax", "Estimated take-home"][index];
        const prefix = index === 1 || index === 2 ? "-" : "";
        return `${label}<br/><b>${prefix}${formatCurrency(Number(visible?.value ?? 0), currency)}</b>`;
      },
    },
    grid: baseGrid({ top: 22, left: 70, right: 22, bottom: 42 }),
    xAxis: {
      type: "category",
      data: bars.map((bar) => bar.name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#d1d5db" } },
      axisLabel: baseAxisLabel(),
    },
    yAxis: {
      type: "value",
      max: max * 1.2,
      axisLabel: { ...baseAxisLabel(), formatter: axisCurrency(currency) },
      splitLine: { lineStyle: { color: BI.grid } },
    },
    series: [
      {
        name: "Offset",
        type: "bar",
        stack: "waterfall",
        itemStyle: { color: "transparent", borderColor: "transparent" },
        emphasis: { itemStyle: { color: "transparent", borderColor: "transparent" } },
        data: offsets,
      },
      {
        name: "Amount",
        type: "bar",
        stack: "waterfall",
        barWidth: 34,
        data: bars.map((bar, index) => ({
          ...bar,
          label: {
            show: true,
            position: index === 1 || index === 2 ? "insideTop" : "top",
            color: index === 1 || index === 2 ? "#ffffff" : BI.ink,
            fontSize: 10,
            fontWeight: 700,
            formatter: () => `${index === 1 || index === 2 ? "-" : ""}${compactCurrency(bar.value, currency)}`,
          },
        })),
      },
    ],
  } as EChartsOption;

  return <ReactECharts option={option} style={{ width: "100%", height: 300 }} notMerge lazyUpdate />;
}

function ScenarioColumnChart({
  scenarios,
  selectedScenario,
  onScenarioChange,
  currency,
}: {
  scenarios: PresentationScenario[];
  selectedScenario: PresentationScenarioKey;
  onScenarioChange: (scenario: PresentationScenarioKey) => void;
  currency: string;
}) {
  const option = {
    animation: true,
    color: [BI.blue, "#94a3b8", BI.green, BI.dark],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...baseTooltip(),
      formatter: (params: any) => {
        const scenario = scenarios[Number(params?.[0]?.dataIndex ?? 0)];
        if (!scenario) return "";
        return [
          `<b>${scenario.label}</b>`,
          `Gross: <b>${formatCurrency(scenario.grossEquityValue, currency)}</b>`,
          `Deductions: <b>${formatCurrency(scenario.exerciseCost + scenario.estimatedTax, currency)}</b>`,
          `Take-home: <b>${formatCurrency(scenario.estimatedTakeHome, currency)}</b>`,
          `Return: <b>${formatMultiple(scenario.returnMultiple)}</b>`,
        ].join("<br/>");
      },
    },
    legend: {
      top: 6,
      right: 8,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: BI.muted, fontSize: 11, fontWeight: 600 },
    },
    grid: baseGrid({ top: 44, left: 70, right: 58, bottom: 42 }),
    xAxis: {
      type: "category",
      data: scenarios.map((scenario) => scenario.label),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#d1d5db" } },
      axisLabel: baseAxisLabel(),
    },
    yAxis: [
      {
        type: "value",
        axisLabel: { ...baseAxisLabel(), formatter: axisCurrency(currency) },
        splitLine: { lineStyle: { color: BI.grid } },
      },
      {
        type: "value",
        axisLabel: { ...baseAxisLabel(), formatter: (value: number) => `${value}×` },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Gross",
        type: "bar",
        barWidth: 18,
        data: scenarios.map((scenario) => scenario.grossEquityValue),
      },
      {
        name: "Deductions",
        type: "bar",
        barWidth: 18,
        data: scenarios.map((scenario) => scenario.exerciseCost + scenario.estimatedTax),
      },
      {
        name: "Take-home",
        type: "bar",
        barWidth: 18,
        data: scenarios.map((scenario) => ({
          value: scenario.estimatedTakeHome,
          itemStyle: { opacity: scenario.key === selectedScenario ? 1 : 0.7 },
        })),
      },
      {
        name: "Return",
        type: "line",
        yAxisIndex: 1,
        symbolSize: 6,
        lineStyle: { width: 2 },
        data: scenarios.map((scenario) => scenario.returnMultiple),
      },
    ],
  } as EChartsOption;

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: 300 }}
      notMerge
      lazyUpdate
      onEvents={{
        click: (params: any) => {
          const scenario = scenarios[Number(params?.dataIndex ?? -1)];
          if (scenario) onScenarioChange(scenario.key);
        },
      }}
    />
  );
}

function ScenarioMatrix({
  bear,
  base,
  bull,
  selectedScenario,
  onScenarioChange,
  currency,
}: {
  bear: PresentationScenario;
  base: PresentationScenario;
  bull: PresentationScenario;
  selectedScenario: PresentationScenarioKey;
  onScenarioChange: (scenario: PresentationScenarioKey) => void;
  currency: string;
}) {
  const rows = [bear, base, bull];

  return (
    <div className="overflow-hidden border border-slate-300">
      <div className="grid grid-cols-[0.8fr_1fr_1fr_0.8fr] border-b border-slate-300 bg-slate-100">
        <MatrixHead label="Scenario" />
        <MatrixHead label="Gross" />
        <MatrixHead label="Take-home" />
        <MatrixHead label="Return" />
      </div>

      {rows.map((scenario) => {
        const active = scenario.key === selectedScenario;
        const color = scenarioColor(scenario.key);

        return (
          <button
            key={scenario.key}
            type="button"
            onClick={() => onScenarioChange(scenario.key)}
            className="grid w-full grid-cols-[0.8fr_1fr_1fr_0.8fr] border-b border-slate-200 text-left last:border-b-0"
            style={{ backgroundColor: active ? color.soft : "#ffffff" }}
          >
            <MatrixCell strong color={color.text}>{scenario.label}</MatrixCell>
            <MatrixCell>{compactCurrency(scenario.grossEquityValue, currency)}</MatrixCell>
            <MatrixCell strong>{compactCurrency(scenario.estimatedTakeHome, currency)}</MatrixCell>
            <MatrixCell>{formatMultiple(scenario.returnMultiple)}</MatrixCell>
          </button>
        );
      })}
    </div>
  );
}

function MatrixHead({ label }: { label: string }) {
  return <div className="px-2.5 py-2 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</div>;
}

function MatrixCell({ children, strong = false, color }: { children: ReactNode; strong?: boolean; color?: string }) {
  return (
    <div className={`px-2.5 py-2.5 text-[11px] ${strong ? "font-semibold" : "font-medium"} text-slate-700`} style={{ color }}>
      {children}
    </div>
  );
}

function OwnershipStack({
  totalOptions,
  vestedOptions,
  unvestedOptions,
  vestedPercentage,
  currentOwnership,
  dilutedOwnership,
}: {
  totalOptions: number;
  vestedOptions: number;
  unvestedOptions: number;
  vestedPercentage: number;
  currentOwnership: number;
  dilutedOwnership: number;
}) {
  const maxOwnership = Math.max(0.01, currentOwnership, dilutedOwnership) * 1.25;

  const option = {
    animation: true,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...baseTooltip(),
      formatter: (params: any) => {
        const item = params?.[0];
        return `${item?.name ?? "Ownership"}<br/><b>${formatPercentage(Number(item?.value ?? 0))}</b>`;
      },
    },
    grid: baseGrid({ top: 18, left: 86, right: 30, bottom: 32 }),
    xAxis: {
      type: "value",
      max: maxOwnership,
      axisLabel: { ...baseAxisLabel(), formatter: (value: number) => formatPercentage(value) },
      splitLine: { lineStyle: { color: BI.grid } },
    },
    yAxis: {
      type: "category",
      data: ["Current", "Diluted"],
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: baseAxisLabel(),
    },
    series: [
      {
        name: "Ownership",
        type: "bar",
        barWidth: 20,
        data: [
          { value: currentOwnership, itemStyle: { color: BI.violet } },
          { value: dilutedOwnership, itemStyle: { color: BI.dark } },
        ],
        label: {
          show: true,
          position: "right",
          color: BI.ink,
          fontSize: 10,
          fontWeight: 700,
          formatter: (params: any) => formatPercentage(Number(params.value)),
        },
      },
    ],
  } as EChartsOption;

  return (
    <div className="grid gap-2">
      <ReactECharts option={option} style={{ width: "100%", height: 205 }} notMerge lazyUpdate />
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Vested" value={`${formatNumber(vestedOptions)} · ${formatPercentage(vestedPercentage)}`} />
        <MiniStat label="Unvested" value={formatNumber(unvestedOptions)} />
        <MiniStat label="Total grant" value={formatNumber(totalOptions)} />
        <MiniStat label="Dilution loss" value={formatPercentage(Math.max(0, currentOwnership - dilutedOwnership))} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 bg-slate-50 px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function VestingCurve({
  vestedPercentage,
  vestedOptions,
  totalOptions,
}: {
  vestedPercentage: number;
  vestedOptions: number;
  totalOptions: number;
}) {
  const vestedShare = clamp(vestedPercentage);
  const unvestedShare = clamp(100 - vestedShare);
  const unvestedOptions = Math.max(0, totalOptions - vestedOptions);

  const option = {
    animation: true,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...baseTooltip(),
      formatter: (params: any) => {
        return params
          .map((item: any) => `${item.seriesName}: <b>${Number(item.value).toFixed(1)}%</b>`)
          .join("<br/>");
      },
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: BI.muted, fontSize: 11, fontWeight: 600 },
    },
    grid: baseGrid({ top: 40, left: 80, right: 24, bottom: 38 }),
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { ...baseAxisLabel(), formatter: "{value}%" },
      splitLine: { lineStyle: { color: BI.grid } },
    },
    yAxis: {
      type: "category",
      data: ["Grant"],
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: baseAxisLabel(),
    },
    series: [
      {
        name: "Vested",
        type: "bar",
        stack: "allocation",
        barWidth: 28,
        data: [vestedShare],
        itemStyle: { color: BI.blue },
        label: { show: true, position: "inside", color: "#ffffff", fontWeight: 700, formatter: `${vestedShare.toFixed(1)}%` },
      },
      {
        name: "Unvested",
        type: "bar",
        stack: "allocation",
        barWidth: 28,
        data: [unvestedShare],
        itemStyle: { color: "#cbd5e1" },
        label: { show: unvestedShare > 8, position: "inside", color: BI.ink, fontWeight: 700, formatter: `${unvestedShare.toFixed(1)}%` },
      },
    ],
  } as EChartsOption;

  return (
    <div className="grid gap-2">
      <ReactECharts option={option} style={{ width: "100%", height: 205 }} notMerge lazyUpdate />
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Vested options" value={formatNumber(vestedOptions)} />
        <MiniStat label="Unvested options" value={formatNumber(unvestedOptions)} />
        <MiniStat label="Total options" value={formatNumber(totalOptions)} />
        <MiniStat label="Vested share" value={formatPercentage(vestedShare)} />
      </div>
    </div>
  );
}

function TornadoChart({ items, currency }: { items: PresentationSensitivityItem[]; currency: string }) {
  const sorted = [...(items ?? [])]
    .sort((a, b) => Math.abs(safeNumber(b.value)) - Math.abs(safeNumber(a.value)))
    .slice(0, 6)
    .reverse();

  const maxImpact = Math.max(1, ...sorted.map((item) => Math.abs(safeNumber(item.value))));

  const option = {
    animation: true,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...baseTooltip(),
      formatter: (params: any) => {
        const first = params?.find((item: any) => Math.abs(Number(item.value)) > 0) ?? params?.[0];
        const item = sorted[Number(first?.dataIndex ?? 0)];
        if (!item) return "";
        const display =
          item.unit === "INR"
            ? compactCurrency(item.displayValue, currency)
            : item.unit === "%"
              ? formatPercentage(item.displayValue)
              : formatNumber(item.displayValue);
        return `${item.label}<br/>Impact: <b>${display}</b>`;
      },
    },
    grid: baseGrid({ top: 14, left: 122, right: 42, bottom: 36 }),
    xAxis: {
      type: "value",
      min: -maxImpact * 1.25,
      max: maxImpact * 1.25,
      axisLabel: { ...baseAxisLabel(), formatter: (value: number) => compactCurrency(Math.abs(value), currency) },
      splitLine: { lineStyle: { color: BI.grid } },
      axisLine: { show: true, lineStyle: { color: "#9ca3af" } },
    },
    yAxis: {
      type: "category",
      data: sorted.map((item) => item.label),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: BI.muted, fontSize: 10, fontWeight: 600 },
    },
    series: [
      {
        name: "Negative impact",
        type: "bar",
        stack: "impact",
        barWidth: 18,
        data: sorted.map((item) => {
          const numeric = Math.abs(safeNumber(item.value));
          return sensitivityDirection(item.key) === "negative" ? -numeric : 0;
        }),
        itemStyle: {
          color: (params: any) => sensitivityColor(sorted[Number(params.dataIndex)]?.key ?? ""),
        },
      },
      {
        name: "Positive impact",
        type: "bar",
        stack: "impact",
        barWidth: 18,
        data: sorted.map((item) => {
          const numeric = Math.abs(safeNumber(item.value));
          return sensitivityDirection(item.key) === "positive" ? numeric : 0;
        }),
        itemStyle: {
          color: (params: any) => sensitivityColor(sorted[Number(params.dataIndex)]?.key ?? ""),
        },
        label: {
          show: true,
          position: "right",
          color: BI.ink,
          fontSize: 10,
          fontWeight: 700,
          formatter: (params: any) => {
            const item = sorted[Number(params.dataIndex)];
            if (!item) return "";
            if (item.unit === "INR") return compactCurrency(item.displayValue, currency);
            if (item.unit === "%") return formatPercentage(item.displayValue);
            return formatNumber(item.displayValue);
          },
        },
      },
    ],
  } as EChartsOption;

  return <ReactECharts option={option} style={{ width: "100%", height: 300 }} notMerge lazyUpdate />;
}

function DecompositionTree({ data, selected, currency }: { data: PresentationData; selected: PresentationScenario; currency: string }) {
  const totalOptions = Math.max(0, safeNumber(data.grant.totalOptions));
  const gross = Math.max(0, safeNumber(selected.grossEquityValue));
  const exercise = Math.max(0, safeNumber(selected.exerciseCost));
  const tax = Math.max(0, safeNumber(selected.estimatedTax));
  const takeHome = Math.max(0, safeNumber(selected.estimatedTakeHome));
  const unmodeled = Math.max(0, gross - exercise - tax - takeHome);

  const nodes = [
    { name: "Gross equity value", itemStyle: { color: BI.blue } },
    { name: "Exercise cost", itemStyle: { color: BI.amber } },
    { name: "Estimated tax", itemStyle: { color: BI.red } },
    { name: "Estimated take-home", itemStyle: { color: BI.green } },
    ...(unmodeled > 0 ? [{ name: "Other difference", itemStyle: { color: "#94a3b8" } }] : []),
  ];

  const links = [
    { source: "Gross equity value", target: "Exercise cost", value: exercise, lineStyle: { color: "rgba(217,119,6,0.28)" } },
    { source: "Gross equity value", target: "Estimated tax", value: tax, lineStyle: { color: "rgba(220,38,38,0.28)" } },
    { source: "Gross equity value", target: "Estimated take-home", value: takeHome, lineStyle: { color: "rgba(5,150,105,0.32)" } },
    ...(unmodeled > 0 ? [{ source: "Gross equity value", target: "Other difference", value: unmodeled, lineStyle: { color: "rgba(148,163,184,0.26)" } }] : []),
  ].filter((link) => link.value > 0);

  const option = {
    animation: true,
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
      ...baseTooltip(),
      formatter: (params: any) => {
        if (params.dataType === "edge") {
          return `${params.data.source} → ${params.data.target}<br/><b>${formatCurrency(Number(params.data.value), currency)}</b>`;
        }
        return `${params.name}`;
      },
    },
    series: [
      {
        type: "sankey",
        left: 10,
        right: 10,
        top: 12,
        bottom: 18,
        nodeWidth: 16,
        nodeGap: 14,
        draggable: false,
        emphasis: { focus: "adjacency" },
        data: nodes,
        links,
        label: { color: BI.ink, fontSize: 11, fontWeight: 700 },
        lineStyle: { opacity: 0.28, curveness: 0.42 },
        itemStyle: {
          borderWidth: 0,
          color: (params: any) => {
            const name = params?.name;
            if (name === "Estimated take-home") return BI.green;
            if (name === "Exercise cost") return BI.amber;
            if (name === "Estimated tax") return BI.red;
            if (name === "Other difference") return "#94a3b8";
            return BI.blue;
          },
        },
      },
    ],
  } as EChartsOption;

  return (
    <div className="grid gap-2">
      <ReactECharts option={option} style={{ width: "100%", height: 305 }} notMerge lazyUpdate />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <MiniStat label="Options" value={formatNumber(totalOptions)} />
        <MiniStat label="Gross" value={compactCurrency(gross, currency)} />
        <MiniStat label="Exercise" value={compactCurrency(exercise, currency)} />
        <MiniStat label="Tax" value={compactCurrency(tax, currency)} />
        <MiniStat label="Take-home" value={compactCurrency(takeHome, currency)} />
      </div>
    </div>
  );
}


function ScenarioRetentionChart({
  scenarios,
  selectedScenario,
  onScenarioChange,
}: {
  scenarios: PresentationScenario[];
  selectedScenario: PresentationScenarioKey;
  onScenarioChange: (scenario: PresentationScenarioKey) => void;
}) {
  const rows = scenarios.map((scenario) => {
    const gross = Math.max(0, safeNumber(scenario.grossEquityValue));
    const takeHome = Math.max(0, safeNumber(scenario.estimatedTakeHome));
    const exercise = Math.max(0, safeNumber(scenario.exerciseCost));
    const tax = Math.max(0, safeNumber(scenario.estimatedTax));
    const takeHomePct = gross > 0 ? clamp((takeHome / gross) * 100) : 0;
    const exercisePct = gross > 0 ? clamp((exercise / gross) * 100) : 0;
    const taxPct = gross > 0 ? clamp((tax / gross) * 100) : 0;
    const otherPct = Math.max(0, 100 - takeHomePct - exercisePct - taxPct);
    return { scenario, takeHomePct, exercisePct, taxPct, otherPct };
  });

  const option = {
    animation: true,
    color: [BI.green, BI.amber, BI.red, "#cbd5e1"],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...baseTooltip(),
      formatter: (params: any) => {
        const row = rows[Number(params?.[0]?.dataIndex ?? 0)];
        if (!row) return "";
        return [
          `<b>${row.scenario.label}</b>`,
          `Take-home: <b>${row.takeHomePct.toFixed(1)}%</b>`,
          `Exercise: <b>${row.exercisePct.toFixed(1)}%</b>`,
          `Tax: <b>${row.taxPct.toFixed(1)}%</b>`,
          row.otherPct > 0 ? `Other difference: <b>${row.otherPct.toFixed(1)}%</b>` : "",
        ]
          .filter(Boolean)
          .join("<br/>");
      },
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: BI.muted, fontSize: 11, fontWeight: 600 },
    },
    grid: baseGrid({ top: 42, left: 74, right: 22, bottom: 42 }),
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { ...baseAxisLabel(), formatter: "{value}%" },
      splitLine: { lineStyle: { color: BI.grid } },
    },
    yAxis: {
      type: "category",
      data: rows.map((row) => row.scenario.label),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: baseAxisLabel(),
    },
    series: [
      {
        name: "Take-home",
        type: "bar",
        stack: "mix",
        barWidth: 24,
        data: rows.map((row) => ({
          value: row.takeHomePct,
          itemStyle: { opacity: row.scenario.key === selectedScenario ? 1 : 0.74 },
        })),
        label: {
          show: true,
          position: "inside",
          color: "#ffffff",
          fontSize: 10,
          fontWeight: 700,
          formatter: (params: any) => (Number(params.value) >= 10 ? `${Number(params.value).toFixed(0)}%` : ""),
        },
      },
      {
        name: "Exercise",
        type: "bar",
        stack: "mix",
        barWidth: 24,
        data: rows.map((row) => row.exercisePct),
      },
      {
        name: "Tax",
        type: "bar",
        stack: "mix",
        barWidth: 24,
        data: rows.map((row) => row.taxPct),
      },
      {
        name: "Other",
        type: "bar",
        stack: "mix",
        barWidth: 24,
        data: rows.map((row) => row.otherPct),
      },
    ],
  } as EChartsOption;

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: 250 }}
      notMerge
      lazyUpdate
      onEvents={{
        click: (params: any) => {
          const row = rows[Number(params?.dataIndex ?? -1)];
          if (row) onScenarioChange(row.scenario.key);
        },
      }}
    />
  );
}

function ScenarioVarianceBridge({
  bear,
  base,
  bull,
  selectedScenario,
  onScenarioChange,
  currency,
}: {
  bear: PresentationScenario;
  base: PresentationScenario;
  bull: PresentationScenario;
  selectedScenario: PresentationScenarioKey;
  onScenarioChange: (scenario: PresentationScenarioKey) => void;
  currency: string;
}) {
  const bearValue = Math.max(0, safeNumber(bear.estimatedTakeHome));
  const baseValue = Math.max(0, safeNumber(base.estimatedTakeHome));
  const bullValue = Math.max(0, safeNumber(bull.estimatedTakeHome));
  const baseDelta = baseValue - bearValue;
  const bullDelta = bullValue - baseValue;
  const maxValue = Math.max(1, bearValue, baseValue, bullValue);
  const categories = ["Bear", "Base delta", "Bull delta", "Bull"];
  const offsets = [0, Math.min(bearValue, baseValue), Math.min(baseValue, bullValue), 0];
  const values = [bearValue, Math.abs(baseDelta), Math.abs(bullDelta), bullValue];

  const option = {
    animation: true,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      ...baseTooltip(),
      formatter: (params: any) => {
        const amount = params?.find((item: any) => item.seriesName === "Amount");
        const index = Number(amount?.dataIndex ?? 0);
        const labels = [
          `Bear take-home: <b>${formatCurrency(bearValue, currency)}</b>`,
          `Base improvement: <b>${baseDelta >= 0 ? "+" : "-"}${formatCurrency(Math.abs(baseDelta), currency)}</b>`,
          `Bull improvement: <b>${bullDelta >= 0 ? "+" : "-"}${formatCurrency(Math.abs(bullDelta), currency)}</b>`,
          `Bull take-home: <b>${formatCurrency(bullValue, currency)}</b>`,
        ];
        return labels[index] ?? "";
      },
    },
    grid: baseGrid({ top: 22, left: 72, right: 22, bottom: 42 }),
    xAxis: {
      type: "category",
      data: categories,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#d1d5db" } },
      axisLabel: baseAxisLabel(),
    },
    yAxis: {
      type: "value",
      max: maxValue * 1.22,
      axisLabel: { ...baseAxisLabel(), formatter: axisCurrency(currency) },
      splitLine: { lineStyle: { color: BI.grid } },
    },
    series: [
      {
        name: "Offset",
        type: "bar",
        stack: "bridge",
        itemStyle: { color: "transparent", borderColor: "transparent" },
        emphasis: { itemStyle: { color: "transparent", borderColor: "transparent" } },
        data: offsets,
      },
      {
        name: "Amount",
        type: "bar",
        stack: "bridge",
        barWidth: 28,
        data: values.map((value, index) => {
          const color = index === 0 ? scenarioColor(bear.key).main : index === 3 ? scenarioColor(bull.key).main : index === 1 ? (baseDelta >= 0 ? BI.green : BI.red) : bullDelta >= 0 ? BI.green : BI.red;
          const scenarioKey = index === 0 ? bear.key : index === 3 ? bull.key : index === 1 ? base.key : bull.key;
          return {
            value,
            itemStyle: { color, opacity: scenarioKey === selectedScenario ? 1 : 0.82 },
            label: {
              show: true,
              position: index === 1 || index === 2 ? "insideTop" : "top",
              color: index === 1 || index === 2 ? "#ffffff" : BI.ink,
              fontSize: 10,
              fontWeight: 700,
              formatter: () => `${index === 1 ? (baseDelta >= 0 ? "+" : "-") : index === 2 ? (bullDelta >= 0 ? "+" : "-") : ""}${compactCurrency(value, currency)}`,
            },
          };
        }),
      },
    ],
  } as EChartsOption;

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: 250 }}
      notMerge
      lazyUpdate
      onEvents={{
        click: (params: any) => {
          if (params?.dataIndex === 0) onScenarioChange(bear.key);
          if (params?.dataIndex === 1) onScenarioChange(base.key);
          if (params?.dataIndex === 2 || params?.dataIndex === 3) onScenarioChange(bull.key);
        },
      }}
    />
  );
}

function DecisionRadar({
  data,
  selected,
  scenarios,
}: {
  data: PresentationData;
  selected: PresentationScenario;
  scenarios: PresentationScenario[];
}) {
  const gross = Math.max(0, safeNumber(selected.grossEquityValue));
  const takeHome = Math.max(0, safeNumber(selected.estimatedTakeHome));
  const exercise = Math.max(0, safeNumber(selected.exerciseCost));
  const tax = Math.max(0, safeNumber(selected.estimatedTax));
  const currentOwnership = Math.max(0, safeNumber(data.ownership.currentOwnership));
  const dilutedOwnership = Math.max(0, safeNumber(data.ownership.dilutedOwnership));
  const maxReturn = Math.max(1, ...scenarios.map((scenario) => safeNumber(scenario.returnMultiple)));

  const retentionScore = gross > 0 ? clamp((takeHome / gross) * 100) : 0;
  const exerciseEfficiency = gross > 0 ? clamp(100 - (exercise / gross) * 100) : 100;
  const taxEfficiency = gross > 0 ? clamp(100 - (tax / gross) * 100) : 100;
  const vestingScore = clamp(data.grant.vestedPercentage);
  const dilutionProtection = currentOwnership > 0 ? clamp((dilutedOwnership / currentOwnership) * 100) : 100;
  const returnStrength = clamp((safeNumber(selected.returnMultiple) / maxReturn) * 100);

  const option = {
    animation: true,
    tooltip: {
      trigger: "item",
      ...baseTooltip(),
      formatter: () => [
        `<b>${selected.label} decision profile</b>`,
        `Retention: <b>${retentionScore.toFixed(1)}</b>`,
        `Exercise efficiency: <b>${exerciseEfficiency.toFixed(1)}</b>`,
        `Tax efficiency: <b>${taxEfficiency.toFixed(1)}</b>`,
        `Vesting: <b>${vestingScore.toFixed(1)}</b>`,
        `Dilution protection: <b>${dilutionProtection.toFixed(1)}</b>`,
        `Return strength: <b>${returnStrength.toFixed(1)}</b>`,
      ].join("<br/>"),
    },
    radar: {
      radius: "64%",
      center: ["50%", "52%"],
      splitNumber: 4,
      axisName: { color: BI.muted, fontSize: 10, fontWeight: 700 },
      axisLine: { lineStyle: { color: "#d1d5db" } },
      splitLine: { lineStyle: { color: BI.grid } },
      splitArea: { areaStyle: { color: ["#ffffff", "#f8fafc"] } },
      indicator: [
        { name: "Retention", max: 100 },
        { name: "Exercise", max: 100 },
        { name: "Tax", max: 100 },
        { name: "Vesting", max: 100 },
        { name: "Dilution", max: 100 },
        { name: "Return", max: 100 },
      ],
    },
    series: [
      {
        name: "Decision profile",
        type: "radar",
        symbolSize: 4,
        lineStyle: { width: 2, color: BI.blue },
        areaStyle: { color: "rgba(37,99,235,0.16)" },
        itemStyle: { color: BI.blue },
        data: [
          {
            value: [retentionScore, exerciseEfficiency, taxEfficiency, vestingScore, dilutionProtection, returnStrength],
            name: selected.label,
          },
        ],
      },
    ],
  } as EChartsOption;

  return <ReactECharts option={option} style={{ width: "100%", height: 250 }} notMerge lazyUpdate />;
}

function CapitalBurdenGauge({ gross, exercise, tax, currency }: { gross: number; exercise: number; tax: number; currency: string }) {
  const burden = Math.max(0, exercise + tax);
  const burdenPct = gross > 0 ? clamp((burden / gross) * 100) : 0;

  const option = {
    animation: true,
    tooltip: {
      ...baseTooltip(),
      formatter: () => `Exercise + tax burden<br/><b>${formatCurrency(burden, currency)}</b><br/>${burdenPct.toFixed(1)}% of gross value`,
    },
    series: [
      {
        type: "gauge",
        radius: "82%",
        center: ["50%", "58%"],
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 13,
            color: [
              [0.35, BI.green],
              [0.65, BI.amber],
              [1, BI.red],
            ],
          },
        },
        pointer: { width: 4, length: "58%", itemStyle: { color: BI.dark } },
        axisTick: { distance: -18, length: 5, lineStyle: { color: "#ffffff", width: 1 } },
        splitLine: { distance: -20, length: 10, lineStyle: { color: "#ffffff", width: 2 } },
        axisLabel: { color: BI.muted, fontSize: 10, distance: 12, formatter: "{value}%" },
        detail: {
          valueAnimation: true,
          formatter: `${burdenPct.toFixed(1)}%`,
          color: BI.ink,
          fontSize: 24,
          fontWeight: 700,
          offsetCenter: [0, "34%"],
        },
        title: {
          offsetCenter: [0, "60%"],
          color: BI.muted,
          fontSize: 10,
          fontWeight: 700,
        },
        data: [{ value: burdenPct, name: "burden" }],
      },
    ],
  } as EChartsOption;

  return (
    <div className="grid gap-2">
      <ReactECharts option={option} style={{ width: "100%", height: 240 }} notMerge lazyUpdate />
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Exercise" value={compactCurrency(exercise, currency)} />
        <MiniStat label="Tax" value={compactCurrency(tax, currency)} />
      </div>
    </div>
  );
}

function OutcomeTreemap({
  gross,
  exercise,
  tax,
  takeHome,
  currency,
}: {
  gross: number;
  exercise: number;
  tax: number;
  takeHome: number;
  currency: string;
}) {
  const other = Math.max(0, gross - exercise - tax - takeHome);
  const data = [
    { name: "Take-home", value: Math.max(0, takeHome), itemStyle: { color: BI.green } },
    { name: "Exercise", value: Math.max(0, exercise), itemStyle: { color: BI.amber } },
    { name: "Tax", value: Math.max(0, tax), itemStyle: { color: BI.red } },
    ...(other > 0 ? [{ name: "Other difference", value: other, itemStyle: { color: "#94a3b8" } }] : []),
  ].filter((item) => item.value > 0);

  const option = {
    animation: true,
    tooltip: {
      ...baseTooltip(),
      formatter: (params: any) => `${params.name}<br/><b>${formatCurrency(Number(params.value), currency)}</b>`,
    },
    series: [
      {
        type: "treemap",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        label: {
          show: true,
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 700,
          formatter: (params: any) => `${params.name}\n${compactCurrency(Number(params.value), currency)}`,
        },
        upperLabel: { show: false },
        itemStyle: { borderColor: "#ffffff", borderWidth: 2, gapWidth: 2 },
        data,
      },
    ],
  } as EChartsOption;

  return (
    <div className="grid gap-2">
      <ReactECharts option={option} style={{ width: "100%", height: 240 }} notMerge lazyUpdate />
      <MiniStat label="Gross reference" value={compactCurrency(gross, currency)} />
    </div>
  );
}

function ModelTrustMatrix({ data, selected, currency }: { data: PresentationData; selected: PresentationScenario; currency: string }) {
  const sourceRows = [
    { label: "Company", value: data.metadata.companyName || "Not set" },
    { label: "Grant", value: data.metadata.grantName || "Confirmed grant" },
    { label: "Options", value: formatNumber(data.grant.totalOptions) },
  ];

  const assumptionRows = [
    { label: "Scenario", value: selected.label },
    { label: "Exit valuation", value: compactCurrency(selected.exitValuation, currency) },
    { label: "Analysis basis", value: "Current presentation context" },
  ];

  const outputRows = [
    { label: "Gross value", value: compactCurrency(selected.grossEquityValue, currency) },
    { label: "Exercise + tax", value: compactCurrency(selected.exerciseCost + selected.estimatedTax, currency) },
    { label: "Take-home", value: compactCurrency(selected.estimatedTakeHome, currency) },
  ];

  return (
    <div className="grid gap-2">
      <TrustColumn title="Source facts" rows={sourceRows} tone="blue" />
      <TrustColumn title="Scenario assumptions" rows={assumptionRows} tone="amber" />
      <TrustColumn title="Model outputs" rows={outputRows} tone="green" />
    </div>
  );
}

function TrustColumn({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: { label: string; value: string }[];
  tone: "blue" | "amber" | "green";
}) {
  const toneClasses =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div className="border border-slate-200 bg-white">
      <div className={`border-b px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] ${toneClasses}`}>{title}</div>
      {rows.map((row) => (
        <div key={`${title}-${row.label}`} className="grid grid-cols-[0.9fr_1fr] border-b border-slate-100 px-2.5 py-1.5 last:border-b-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{row.label}</span>
          <span className="truncate text-right text-xs font-semibold text-slate-950">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function ScenarioBubbleChart({
  scenarios,
  selectedScenario,
  onScenarioChange,
  currency,
}: {
  scenarios: PresentationScenario[];
  selectedScenario: PresentationScenarioKey;
  onScenarioChange: (scenario: PresentationScenarioKey) => void;
  currency: string;
}) {
  const maxTakeHome = Math.max(1, ...scenarios.map((scenario) => safeNumber(scenario.estimatedTakeHome)));

  const option = {
    animation: true,
    tooltip: {
      trigger: "item",
      ...baseTooltip(),
      formatter: (params: any) => {
        const scenario = scenarios[Number(params.dataIndex)];
        if (!scenario) return "";
        return [
          `<b>${scenario.label}</b>`,
          `Exit valuation: <b>${formatCurrency(scenario.exitValuation, currency)}</b>`,
          `Return: <b>${formatMultiple(scenario.returnMultiple)}</b>`,
          `Take-home: <b>${formatCurrency(scenario.estimatedTakeHome, currency)}</b>`,
        ].join("<br/>");
      },
    },
    grid: baseGrid({ top: 22, left: 72, right: 28, bottom: 46 }),
    xAxis: {
      type: "value",
      name: "Exit valuation",
      nameLocation: "middle",
      nameGap: 32,
      nameTextStyle: { color: BI.muted, fontSize: 10, fontWeight: 700 },
      axisLabel: { ...baseAxisLabel(), formatter: axisCurrency(currency) },
      splitLine: { lineStyle: { color: BI.grid } },
    },
    yAxis: {
      type: "value",
      name: "Return multiple",
      nameTextStyle: { color: BI.muted, fontSize: 10, fontWeight: 700 },
      axisLabel: { ...baseAxisLabel(), formatter: (value: number) => `${value}×` },
      splitLine: { lineStyle: { color: BI.grid } },
    },
    series: [
      {
        name: "Scenario",
        type: "scatter",
        data: scenarios.map((scenario) => [scenario.exitValuation, scenario.returnMultiple, scenario.estimatedTakeHome]),
        symbolSize: (value: number[]) => 18 + (safeNumber(value?.[2]) / maxTakeHome) * 34,
        itemStyle: {
          color: (params: any) => scenarioColor(scenarios[Number(params.dataIndex)]?.key ?? "base").main,
          opacity: 0.86,
        },
        label: {
          show: true,
          position: "top",
          color: BI.ink,
          fontSize: 10,
          fontWeight: 700,
          formatter: (params: any) => scenarios[Number(params.dataIndex)]?.label ?? "",
        },
      },
    ],
  } as EChartsOption;

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: 305 }}
      notMerge
      lazyUpdate
      onEvents={{
        click: (params: any) => {
          const scenario = scenarios[Number(params?.dataIndex ?? -1)];
          if (scenario) onScenarioChange(scenario.key);
        },
      }}
    />
  );
}

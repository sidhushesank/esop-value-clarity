"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  Layers3,
  LockKeyhole,
  PieChart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  WandSparkles,
  Zap,
} from "lucide-react";

import { useProEquityState } from "@/lib/esop/pro-state";

type ScenarioKey = "bear" | "base" | "bull";
type OwnershipStage = "vested" | "current" | "diluted";
type HeroMetricKey = "stake" | "exercise" | "currentValue" | "range";
type KpiKey = "vested" | "ownership" | "cost" | "proceeds";
type PortfolioFocusKey = "granted" | "vested" | "ownership" | "companyValue";
type HeroInsightKey = "ownership" | "sensitivity" | "upside";
type AssumptionKey =
  | "totalOptions"
  | "vestedOptions"
  | "exercisePrice"
  | "companyShares"
  | "currentValuation"
  | "exitValuation"
  | "dilution"
  | "equityType";

export default function ProReportsPage() {
  const { proState, hydrated } = useProEquityState();
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedScenarioKey, setSelectedScenarioKey] =
    useState<ScenarioKey>("base");
  const [ownershipStage, setOwnershipStage] =
    useState<OwnershipStage>("diluted");
  const [heroMetricFocus, setHeroMetricFocus] =
    useState<HeroMetricKey>("range");
  const [kpiFocus, setKpiFocus] = useState<KpiKey>("proceeds");
  const [portfolioFocus, setPortfolioFocus] =
    useState<PortfolioFocusKey>("ownership");
  const [heroInsightFocus, setHeroInsightFocus] =
    useState<HeroInsightKey>("sensitivity");
  const [activeAssumption, setActiveAssumption] =
    useState<AssumptionKey>("exitValuation");
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const report = useMemo(() => {
    const vestedOptions = Math.max(0, proState.vestedOptions);
    const companyShares = Math.max(0, proState.totalCompanyShares);
    const exercisePrice = Math.max(0, proState.exercisePrice);
    const dilution = Math.min(
      100,
      Math.max(0, proState.futureDilutionPercentage)
    );
    const exitValuation = Math.max(0, proState.exitValuation);
    const currentCompanyValuation = Math.max(
      0,
      proState.currentCompanyValuation
    );

    const currentOwnership =
      companyShares > 0 ? (vestedOptions / companyShares) * 100 : 0;
    const dilutedOwnership = currentOwnership * (1 - dilution / 100);
    const exerciseCost = vestedOptions * exercisePrice;
    const currentEquityValue =
      (currentOwnership / 100) * currentCompanyValuation;
    const grossExitValue = (dilutedOwnership / 100) * exitValuation;
    const projectedProceeds = Math.max(0, grossExitValue - exerciseCost);

    const scenarios = [
      {
        key: "bear" as const,
        label: "BEAR",
        title: "Lower-growth outcome",
        factor: 0.5,
      },
      {
        key: "base" as const,
        label: "BASE",
        title: "Current assumption",
        factor: 1,
      },
      {
        key: "bull" as const,
        label: "BULL",
        title: "Strong-growth outcome",
        factor: 2,
      },
    ].map(({ key, label, title, factor }) => {
      const valuation = exitValuation * factor;
      const gross = (dilutedOwnership / 100) * valuation;
      const proceeds = Math.max(0, gross - exerciseCost);
      const multiple = exerciseCost > 0 ? proceeds / exerciseCost : 0;
      const retained = gross > 0 ? (proceeds / gross) * 100 : 0;

      return {
        key,
        label,
        title,
        factor,
        valuation,
        gross,
        proceeds,
        multiple,
        retained,
      };
    });

    const bear = scenarios[0];
    const base = scenarios[1];
    const bull = scenarios[2];
    const outcomeRange = Math.max(0, bull.proceeds - bear.proceeds);
    const baseVsBear = Math.max(0, base.proceeds - bear.proceeds);
    const bullVsBase = Math.max(0, bull.proceeds - base.proceeds);
    const bullUpsidePercentage =
      base.proceeds > 0
        ? ((bull.proceeds - base.proceeds) / base.proceeds) * 100
        : 0;
    const bearDownsidePercentage =
      base.proceeds > 0
        ? ((base.proceeds - bear.proceeds) / base.proceeds) * 100
        : 0;

    return {
      vestedOptions,
      companyShares,
      exercisePrice,
      dilution,
      exitValuation,
      currentCompanyValuation,
      currentOwnership,
      dilutedOwnership,
      exerciseCost,
      currentEquityValue,
      grossExitValue,
      projectedProceeds,
      scenarios,
      bear,
      base,
      bull,
      outcomeRange,
      baseVsBear,
      bullVsBase,
      bullUpsidePercentage,
      bearDownsidePercentage,
    };
  }, [proState]);

  const selectedScenario =
    report.scenarios.find((scenario) => scenario.key === selectedScenarioKey) ??
    report.base;

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#f4f7fb]">
        <div className="mx-auto max-w-[1560px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-44 rounded bg-slate-200" />
            <div className="h-[640px] rounded-[34px] bg-slate-200" />
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-32 rounded-3xl bg-slate-200" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const exportRows: Array<[string, string | number]> = [
    ["ESOP VALUE CLARITY - PRO EQUITY REPORT", ""],
    ["Report generated", new Date().toLocaleString("en-IN")],
    ["Equity type", proState.equityType === "UNLISTED" ? "Unlisted" : "Listed"],
    ["", ""],

    ["EXECUTIVE SUMMARY", ""],
    ["Current equity value", formatCurrency(report.currentEquityValue)],
    ["Base modeled proceeds", formatCurrency(report.base.proceeds)],
    ["Selected scenario", selectedScenario.label],
    ["Selected scenario proceeds", formatCurrency(selectedScenario.proceeds)],
    ["Outcome range (Bear to Bull)", formatCurrency(report.outcomeRange)],
    ["Base return multiple", formatMultiple(report.base.multiple)],
    ["Bull upside vs Base", formatPercentage(report.bullUpsidePercentage)],
    ["Bear downside vs Base", formatPercentage(report.bearDownsidePercentage)],
    ["", ""],

    ["EQUITY POSITION", ""],
    ["Total options granted", proState.totalOptions],
    ["Vested options", report.vestedOptions],
    ["Unvested options", Math.max(0, proState.totalOptions - report.vestedOptions)],
    ["Vesting percentage", formatPercentage(proState.vestedPercentage)],
    ["Total company shares used", report.companyShares],
    ["Current ownership before dilution", formatPercentage(report.currentOwnership)],
    ["Post-dilution ownership", formatPercentage(report.dilutedOwnership)],
    ["Modeled future dilution", formatPercentage(report.dilution)],
    ["", ""],

    ["EXERCISE & VALUE", ""],
    ["Exercise price per option", formatCurrency(report.exercisePrice)],
    ["Total exercise cost", formatCurrency(report.exerciseCost)],
    ["Current company valuation", formatCurrency(report.currentCompanyValuation)],
    ["Current equity value before exit", formatCurrency(report.currentEquityValue)],
    ["Base exit valuation assumption", formatCurrency(report.exitValuation)],
    ["Base gross equity value at exit", formatCurrency(report.base.gross)],
    ["Base net modeled proceeds", formatCurrency(report.base.proceeds)],
    ["Base proceeds / exercise cost", formatMultiple(report.base.multiple)],
    ["", ""],

    ["BEAR / BASE / BULL SCENARIOS", ""],
    ["Bear scenario", ""],
    ["Bear valuation factor", "0.50x"],
    ["Bear exit valuation", formatCurrency(report.bear.valuation)],
    ["Bear gross equity value", formatCurrency(report.bear.gross)],
    ["Bear exercise cost", formatCurrency(report.exerciseCost)],
    ["Bear net modeled proceeds", formatCurrency(report.bear.proceeds)],
    ["Bear return multiple", formatMultiple(report.bear.multiple)],
    ["Bear proceeds retained after exercise", formatPercentage(report.bear.retained)],
    ["", ""],
    ["Base scenario", ""],
    ["Base valuation factor", "1.00x"],
    ["Base exit valuation", formatCurrency(report.base.valuation)],
    ["Base gross equity value", formatCurrency(report.base.gross)],
    ["Base exercise cost", formatCurrency(report.exerciseCost)],
    ["Base net modeled proceeds", formatCurrency(report.base.proceeds)],
    ["Base return multiple", formatMultiple(report.base.multiple)],
    ["Base proceeds retained after exercise", formatPercentage(report.base.retained)],
    ["", ""],
    ["Bull scenario", ""],
    ["Bull valuation factor", "2.00x"],
    ["Bull exit valuation", formatCurrency(report.bull.valuation)],
    ["Bull gross equity value", formatCurrency(report.bull.gross)],
    ["Bull exercise cost", formatCurrency(report.exerciseCost)],
    ["Bull net modeled proceeds", formatCurrency(report.bull.proceeds)],
    ["Bull return multiple", formatMultiple(report.bull.multiple)],
    ["Bull proceeds retained after exercise", formatPercentage(report.bull.retained)],
    ["", ""],

    ["DECISION ANALYSIS", ""],
    ["Bear to Base additional proceeds", formatCurrency(report.baseVsBear)],
    ["Base to Bull additional proceeds", formatCurrency(report.bullVsBase)],
    ["Total Bear to Bull outcome spread", formatCurrency(report.outcomeRange)],
    ["Bull upside vs Base", formatPercentage(report.bullUpsidePercentage)],
    ["Bear downside vs Base", formatPercentage(report.bearDownsidePercentage)],
    ["Selected scenario gross equity value", formatCurrency(selectedScenario.gross)],
    ["Selected scenario exercise cost", formatCurrency(report.exerciseCost)],
    ["Selected scenario net proceeds", formatCurrency(selectedScenario.proceeds)],
    ["Selected scenario return multiple", formatMultiple(selectedScenario.multiple)],
    ["Selected scenario proceeds retained", formatPercentage(selectedScenario.retained)],
    ["", ""],

    ["MODEL ASSUMPTIONS", ""],
    ["Options granted", proState.totalOptions],
    ["Vested options used in model", report.vestedOptions],
    ["Vesting percentage", formatPercentage(proState.vestedPercentage)],
    ["Exercise price", formatCurrency(report.exercisePrice)],
    ["Company shares", report.companyShares],
    ["Current company valuation", formatCurrency(report.currentCompanyValuation)],
    ["Base exit valuation", formatCurrency(report.exitValuation)],
    ["Future dilution", formatPercentage(report.dilution)],
    ["Equity type", proState.equityType === "UNLISTED" ? "Unlisted" : "Listed"],
    ["Scenario model", "Bear = 0.50x Base exit valuation; Base = 1.00x; Bull = 2.00x"],
    ["Calculation basis", "Net modeled proceeds = diluted equity value at exit - exercise cost"],
    ["Ownership basis", "Vested options divided by total company shares, then reduced by modeled dilution"],
    ["", ""],

    ["IMPORTANT CONTEXT", ""],
    ["Model purpose", "Scenario analysis for understanding potential ESOP value, exercise cost and dilution impact."],
    ["Interpretation", "Modeled proceeds are scenario estimates, not guaranteed cash proceeds or investment returns."],
    ["Dilution treatment", "Future dilution is applied to current modeled ownership before exit proceeds are calculated."],
    ["Exercise treatment", "Exercise cost is deducted from gross equity value to produce modeled net proceeds."],
  ];

  const handleCSVExport = () => {
    const csv = exportRows
      .map((row) => row.map((value) => csvEscape(String(value))).join(","))
      .join("\r\n");

    downloadFile(
      "\uFEFF" + csv,
      "esop-value-clarity-report.csv",
      "text/csv;charset=utf-8;"
    );

    setExportOpen(false);
  };

  const handleExcelExport = () => {
    const html = createExcelHtml(exportRows);
    downloadFile(
      html,
      "esop-value-clarity-report.xls",
      "application/vnd.ms-excel"
    );
    setExportOpen(false);
  };

  const theme = getScenarioTheme(selectedScenarioKey);

  const heroMetricDetail = {
    stake: {
      title: "Post-dilution ownership",
      text: `${formatPercentage(report.currentOwnership)} before dilution becomes ${formatPercentage(report.dilutedOwnership)} after the modeled ${formatPercentage(report.dilution)} dilution.`,
    },
    exercise: {
      title: "Exercise capital",
      text: `${formatNumber(report.vestedOptions)} vested options at ${formatCurrency(report.exercisePrice)} each require ${formatCurrency(report.exerciseCost)} to exercise.`,
    },
    currentValue: {
      title: "Current equity value",
      text: `At the current company valuation, your modeled ownership represents ${formatCurrency(report.currentEquityValue)} before any future exit scenario.`,
    },
    range: {
      title: "Outcome sensitivity",
      text: `The modeled spread from Bear to Bull is ${formatCurrency(report.outcomeRange)}, showing how strongly company outcome changes your ESOP economics.`,
    },
  }[heroMetricFocus];

  const kpiDetail = {
    vested: {
      eyebrow: "GRANT EXPOSURE",
      title: `${formatNumber(report.vestedOptions)} vested options are active in the model.`,
      text: `${formatPercentage(proState.vestedPercentage)} of your grant is currently vested and included in ownership calculations.`,
      leftLabel: "Total grant",
      leftValue: formatNumber(proState.totalOptions),
      rightLabel: "Vested",
      rightValue: formatNumber(report.vestedOptions),
    },
    ownership: {
      eyebrow: "OWNERSHIP STACK",
      title: `${formatPercentage(report.dilutedOwnership)} remains after modeled dilution.`,
      text: `Your pre-dilution stake is ${formatPercentage(report.currentOwnership)} and the model applies ${formatPercentage(report.dilution)} future dilution.`,
      leftLabel: "Before dilution",
      leftValue: formatPercentage(report.currentOwnership),
      rightLabel: "After dilution",
      rightValue: formatPercentage(report.dilutedOwnership),
    },
    cost: {
      eyebrow: "CAPITAL REQUIRED",
      title: `${formatCurrency(report.exerciseCost)} is the modeled exercise outlay.`,
      text: `This cost is deducted from gross equity value in every Bear, Base and Bull scenario.`,
      leftLabel: "Strike price",
      leftValue: formatCurrency(report.exercisePrice),
      rightLabel: "Vested options",
      rightValue: formatNumber(report.vestedOptions),
    },
    proceeds: {
      eyebrow: `${selectedScenario.label} OUTCOME`,
      title: `${formatCurrency(selectedScenario.proceeds)} of modeled net proceeds.`,
      text: `At a ${formatCurrency(selectedScenario.valuation)} exit valuation, the model produces ${formatMultiple(selectedScenario.multiple)} return after exercise cost.`,
      leftLabel: "Gross equity",
      leftValue: formatCurrency(selectedScenario.gross),
      rightLabel: "Net proceeds",
      rightValue: formatCurrency(selectedScenario.proceeds),
    },
  }[kpiFocus];

  const portfolioDetail = {
    granted: {
      label: "Total grant",
      value: formatNumber(proState.totalOptions),
      text: "The full number of options in your current PRO grant model.",
    },
    vested: {
      label: "Vesting progress",
      value: formatPercentage(proState.vestedPercentage),
      text: `${formatNumber(report.vestedOptions)} options are vested and currently participate in the ownership model.`,
    },
    ownership: {
      label: "Ownership conversion",
      value: formatPercentage(report.dilutedOwnership),
      text: `${formatPercentage(report.currentOwnership)} current ownership becomes ${formatPercentage(report.dilutedOwnership)} after modeled dilution.`,
    },
    companyValue: {
      label: "Company value context",
      value: formatCurrency(report.currentCompanyValuation),
      text: `Your selected ${selectedScenario.label} scenario models an exit valuation of ${formatCurrency(selectedScenario.valuation)}.`,
    },
  }[portfolioFocus];

  const assumptionDetail = {
    totalOptions: "The total options in the grant. This is read from the shared PRO model.",
    vestedOptions: "Only vested options are used in the current ownership and exercise calculations on this report.",
    exercisePrice: "The strike price multiplied by vested options determines the modeled exercise capital required.",
    companyShares: "Total company shares are used to translate vested options into modeled ownership percentage.",
    currentValuation: "The current company valuation is used for the current equity value snapshot.",
    exitValuation: "This is the Base exit valuation. Bear uses 0.5x and Bull uses 2x without changing backend inputs.",
    dilution: "Future dilution reduces the modeled ownership stake before scenario proceeds are calculated.",
    equityType: "The report preserves the equity type already stored in your PRO model.",
  }[activeAssumption];

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <div className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pro"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              PRO Workspace
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-black text-slate-950">Reports</span>
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 sm:inline-flex">
              Live model
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[0.98]"
            >
              <Download size={16} />
              Export report
              <ChevronDown
                size={15}
                className={`transition ${exportOpen ? "rotate-180" : ""}`}
              />
            </button>

            {exportOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close export menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Download current model
                  </p>
                  <ExportMenuButton
                    icon={<FileText size={17} />}
                    title="CSV"
                    description="Portable spreadsheet data"
                    onClick={handleCSVExport}
                  />
                  <ExportMenuButton
                    icon={<FileSpreadsheet size={17} />}
                    title="Excel (.xls)"
                    description="Open directly in Excel"
                    onClick={handleExcelExport}
                  />
                </div>
              </>
            )}
          </div>
        </header>

        <section className="evc-saas-reports-hero relative mt-6 overflow-hidden rounded-[36px] border border-slate-800 bg-[#050816] text-white shadow-[0_30px_100px_rgba(15,23,42,0.24)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-80 transition-all duration-700"
            style={{
              background: `radial-gradient(circle at 82% 14%, ${theme.glow} 0%, transparent 34%), radial-gradient(circle at 36% 100%, rgba(59,130,246,0.11) 0%, transparent 38%)`,
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="grid min-w-0 gap-5 lg:grid-cols-2 lg:items-stretch">
              <div className="evc-saas-reports-copy flex min-w-0 min-h-[610px] flex-col justify-between overflow-hidden rounded-[30px] border border-white/10 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.25)] sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge icon={<Sparkles size={13} />}>PRO EQUITY REPORT</Badge>
                    <Badge success icon={<ShieldCheck size={13} />}>
                      Model synced
                    </Badge>
                  </div>

                  <div className="mt-8 max-w-xl">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Your equity command center
                    </p>
                    <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl lg:text-[4rem] lg:leading-[0.98]">
                      Understand your ESOPs
                      <span
                        className="mt-2 block bg-clip-text text-transparent transition-all duration-500"
                        style={{
                          backgroundImage: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary}, #ffffff)`,
                        }}
                      >
                        like a fintech portfolio.
                      </span>
                    </h1>
                    <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300 sm:text-[15px]">
                      See how ownership, dilution, exercise cost and company outcomes
                      combine into the value that could actually reach you.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <DarkMetric
                      label="Post-dilution stake"
                      value={formatPercentage(report.dilutedOwnership)}
                      caption="Modeled ownership"
                      active={heroMetricFocus === "stake"}
                      onClick={() => setHeroMetricFocus("stake")}
                    />
                    <DarkMetric
                      label="Exercise capital"
                      value={formatCurrency(report.exerciseCost)}
                      caption="Upfront cost"
                      active={heroMetricFocus === "exercise"}
                      onClick={() => setHeroMetricFocus("exercise")}
                    />
                    <DarkMetric
                      label="Current equity value"
                      value={formatCurrency(report.currentEquityValue)}
                      caption="Before modeled exit"
                      active={heroMetricFocus === "currentValue"}
                      onClick={() => setHeroMetricFocus("currentValue")}
                    />
                    <DarkMetric
                      label="Outcome range"
                      value={formatCurrency(report.outcomeRange)}
                      caption="Bear to Bull spread"
                      active={heroMetricFocus === "range"}
                      onClick={() => setHeroMetricFocus("range")}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full shadow-[0_0_14px_currentColor]"
                        style={{ color: theme.primary, backgroundColor: theme.primary }}
                      />
                      <div key={heroMetricFocus} className="evc-value-swap">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                          {heroMetricDetail.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {heroMetricDetail.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 border-t border-white/10 pt-6">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/pro/compare"
                      className="group inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-blue-50 active:scale-[0.98]"
                    >
                      Compare scenarios
                      <ArrowUpRight size={16} />
                    </Link>
                    <Link
                      href="/pro/simulator"
                      className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 active:scale-[0.98]"
                    >
                      Edit assumptions
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <LockKeyhole size={13} className="text-blue-300" />
                      Decision model
                    </span>
                    <span>Bear / Base / Bull</span>
                    <span>Live recalculation</span>
                  </div>
                </div>
              </div>

              <div className="evc-saas-reports-engine min-w-0 overflow-hidden rounded-[30px] border border-white/10 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.25)] sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shadow-[0_0_14px_currentColor]"
                        style={{ color: theme.primary, backgroundColor: theme.primary }}
                      />
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">
                        Equity intelligence
                      </p>
                    </div>
                    <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                      Scenario payoff engine
                    </h2>
                    <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm">
                      Switch scenarios to see how company value flows through dilution,
                      ownership and exercise cost into your modeled proceeds.
                    </p>
                  </div>
                  <div key={selectedScenarioKey} className="evc-value-swap sm:text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      {selectedScenario.label} outcome
                    </p>
                    <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                      {formatCurrency(selectedScenario.proceeds)}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs sm:justify-end">
                      <span style={{ color: theme.secondary }} className="font-black">
                        {formatMultiple(selectedScenario.multiple)} return
                      </span>
                      <span className="text-slate-700">•</span>
                      <span className="text-slate-500">
                        {formatCurrency(selectedScenario.valuation)} exit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/10 p-1.5">
                  {report.scenarios.map((scenario) => {
                    const active = scenario.key === selectedScenarioKey;
                    const optionTheme = getScenarioTheme(scenario.key);
                    return (
                      <button
                        key={scenario.key}
                        type="button"
                        onClick={() => setSelectedScenarioKey(scenario.key)}
                        className={`relative overflow-hidden rounded-xl border px-3 py-3 text-left transition-all duration-300 active:scale-[0.98] sm:px-4 ${
                          active
                            ? "border-white/20 bg-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                            : "border-transparent hover:bg-white/[0.04]"
                        }`}
                      >
                        {active && (
                          <span
                            className="absolute inset-x-3 bottom-0 h-0.5 rounded-full"
                            style={{ backgroundColor: optionTheme.primary }}
                          />
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[10px] font-black tracking-[0.13em]"
                            style={{ color: active ? optionTheme.secondary : "#64748b" }}
                          >
                            {scenario.label}
                          </span>
                          {active && <Check size={13} style={{ color: optionTheme.secondary }} />}
                        </div>
                        <p className="mt-1 truncate text-sm font-black text-white sm:text-base">
                          {formatCurrency(scenario.proceeds)}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-500">
                          {formatMultiple(scenario.multiple)} return
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="evc-saas-reports-graph relative mt-5 overflow-hidden rounded-[26px] border border-white/10 p-4 sm:p-5">
                  <div className="pointer-events-none absolute inset-0 opacity-60 [background-size:28px_28px] [background-image:linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)]" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black text-slate-200">
                        Equity value flow
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Live model path · {selectedScenario.title}
                      </p>
                    </div>
                    <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 sm:block">
                      Interactive scenario
                    </div>
                  </div>

                  <FintechFlowGraph
                    scenarioKey={selectedScenarioKey}
                    valuation={selectedScenario.valuation}
                    ownership={report.dilutedOwnership}
                    gross={selectedScenario.gross}
                    cost={report.exerciseCost}
                    proceeds={selectedScenario.proceeds}
                    multiple={selectedScenario.multiple}
                  />

                  <div className="relative mt-3 grid gap-3 sm:grid-cols-3">
                    <MiniDarkStat
                      label="Gross equity"
                      value={formatCurrency(selectedScenario.gross)}
                    />
                    <MiniDarkStat
                      label="Exercise drag"
                      value={formatCurrency(report.exerciseCost)}
                    />
                    <MiniDarkStat
                      label="Value retained"
                      value={formatPercentage(selectedScenario.retained)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <HeroInsight
                icon={<Target size={16} />}
                label="Ownership intelligence"
                value={formatPercentage(report.dilutedOwnership)}
                text="Stake after modeled dilution"
                active={heroInsightFocus === "ownership"}
                onClick={() => {
                  setHeroInsightFocus("ownership");
                  setOwnershipStage("diluted");
                }}
              />
              <HeroInsight
                icon={<Gauge size={16} />}
                label="Scenario sensitivity"
                value={formatCurrency(report.outcomeRange)}
                text="Difference between Bear and Bull"
                active={heroInsightFocus === "sensitivity"}
                onClick={() => {
                  setHeroInsightFocus("sensitivity");
                  setSelectedScenarioKey("base");
                }}
              />
              <HeroInsight
                icon={<Rocket size={16} />}
                label="Bull upside"
                value={`+${formatPercentage(report.bullUpsidePercentage)}`}
                text="Compared with your Base outcome"
                active={heroInsightFocus === "upside"}
                onClick={() => {
                  setHeroInsightFocus("upside");
                  setSelectedScenarioKey("bull");
                }}
              />
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SaasMetric
              icon={<Layers3 size={18} />}
              label="Vested options"
              value={formatNumber(report.vestedOptions)}
              change="Active grant"
              active={kpiFocus === "vested"}
              onClick={() => setKpiFocus("vested")}
            />
            <SaasMetric
              icon={<PieChart size={18} />}
              label="Post-dilution ownership"
              value={formatPercentage(report.dilutedOwnership)}
              change={`${formatPercentage(report.dilution)} dilution modeled`}
              featured
              active={kpiFocus === "ownership"}
              onClick={() => {
                setKpiFocus("ownership");
                setOwnershipStage("diluted");
              }}
            />
            <SaasMetric
              icon={<CircleDollarSign size={18} />}
              label="Exercise cost"
              value={formatCurrency(report.exerciseCost)}
              change="Capital required"
              active={kpiFocus === "cost"}
              onClick={() => setKpiFocus("cost")}
            />
            <SaasMetric
              icon={<Wallet size={18} />}
              label="Selected proceeds"
              value={formatCurrency(selectedScenario.proceeds)}
              change={`${selectedScenario.label} scenario`}
              accent={theme.primary}
              active={kpiFocus === "proceeds"}
              onClick={() => setKpiFocus("proceeds")}
            />
          </div>

          <div className="mt-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div key={`${kpiFocus}-${selectedScenarioKey}`} className="evc-value-swap flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">
                  {kpiDetail.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                  {kpiDetail.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  {kpiDetail.text}
                </p>
              </div>
              <div className="grid min-w-[260px] grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-400">
                    {kpiDetail.leftLabel}
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-950">{kpiDetail.leftValue}</p>
                </div>
                <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
                  <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
                    {kpiDetail.rightLabel}
                  </p>
                  <p className="mt-1 text-sm font-black">{kpiDetail.rightValue}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <SectionHeader
              eyebrow="PORTFOLIO VIEW"
              title="Your equity position at a glance"
              description="A fintech-style summary of how your grant translates into ownership and value."
            />

            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <LightStat
                label="Granted"
                value={formatNumber(proState.totalOptions)}
                active={portfolioFocus === "granted"}
                onClick={() => setPortfolioFocus("granted")}
              />
              <LightStat
                label="Vested"
                value={formatPercentage(proState.vestedPercentage)}
                active={portfolioFocus === "vested"}
                onClick={() => setPortfolioFocus("vested")}
              />
              <LightStat
                label="Current ownership"
                value={formatPercentage(report.currentOwnership)}
                active={portfolioFocus === "ownership"}
                onClick={() => setPortfolioFocus("ownership")}
              />
              <LightStat
                label="Current company value"
                value={formatCurrency(report.currentCompanyValuation)}
                active={portfolioFocus === "companyValue"}
                onClick={() => setPortfolioFocus("companyValue")}
              />
            </div>

            <div key={`${portfolioFocus}-${selectedScenarioKey}`} className="evc-value-swap mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-blue-600">
                  {portfolioDetail.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{portfolioDetail.text}</p>
              </div>
              <div className="shrink-0 rounded-xl border border-white bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Focused value</p>
                <p className="mt-1 text-lg font-black text-slate-950">{portfolioDetail.value}</p>
              </div>
            </div>

            <div className="mt-7 rounded-[26px] border border-slate-200 bg-slate-50 p-5 md:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-slate-400">
                    Ownership efficiency
                  </p>
                  <h3 className="mt-2 text-xl font-black text-slate-950">
                    How dilution changes your stake
                  </h3>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600">
                  {formatPercentage(report.dilution)} modeled dilution
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <OwnershipSwitch
                  label="Vested"
                  value={formatNumber(report.vestedOptions)}
                  active={ownershipStage === "vested"}
                  onClick={() => setOwnershipStage("vested")}
                />
                <OwnershipSwitch
                  label="Current stake"
                  value={formatPercentage(report.currentOwnership)}
                  active={ownershipStage === "current"}
                  onClick={() => setOwnershipStage("current")}
                />
                <OwnershipSwitch
                  label="After dilution"
                  value={formatPercentage(report.dilutedOwnership)}
                  active={ownershipStage === "diluted"}
                  onClick={() => setOwnershipStage("diluted")}
                />
              </div>

              <OwnershipDetail
                stage={ownershipStage}
                vestedOptions={report.vestedOptions}
                companyShares={report.companyShares}
                currentOwnership={report.currentOwnership}
                dilutedOwnership={report.dilutedOwnership}
                dilution={report.dilution}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] bg-[#07111f] p-6 text-white shadow-xl md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-300">
                <WandSparkles size={20} />
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
                Smart takeaway
              </span>
            </div>

            <p className="mt-7 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Selected scenario
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight">
              {selectedScenario.label} case modeled proceeds
            </h3>
            <p className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              {formatCurrency(selectedScenario.proceeds)}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              After modeled exercise cost and dilution, based on your current PRO assumptions.
            </p>

            <div className="mt-7 space-y-3 border-t border-white/10 pt-6">
              <DarkDecisionRow
                label="Exit valuation"
                value={formatCurrency(selectedScenario.valuation)}
              />
              <DarkDecisionRow
                label="Gross ESOP value"
                value={formatCurrency(selectedScenario.gross)}
              />
              <DarkDecisionRow
                label="Return multiple"
                value={formatMultiple(selectedScenario.multiple)}
                accent={theme.secondary}
              />
              <DarkDecisionRow
                label="Value retained"
                value={formatPercentage(selectedScenario.retained)}
              />
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">Bear</span>
                <span className="font-semibold text-slate-400">Bull</span>
              </div>
              <div className="relative mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="absolute left-0 top-0 h-2 rounded-full transition-all duration-700"
                  style={{
                    width:
                      selectedScenarioKey === "bear"
                        ? "18%"
                        : selectedScenarioKey === "base"
                        ? "54%"
                        : "100%",
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                  }}
                />
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-4 border-[#07111f] shadow-lg transition-all duration-700"
                  style={{
                    left:
                      selectedScenarioKey === "bear"
                        ? "18%"
                        : selectedScenarioKey === "base"
                        ? "54%"
                        : "calc(100% - 16px)",
                    backgroundColor: theme.secondary,
                  }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {report.scenarios.map((scenario) => (
                  <button
                    key={`takeaway-${scenario.key}`}
                    type="button"
                    onClick={() => setSelectedScenarioKey(scenario.key)}
                    aria-pressed={selectedScenarioKey === scenario.key}
                    className={`rounded-xl border px-2 py-2 text-[10px] font-black transition-all active:scale-[0.97] ${
                      selectedScenarioKey === scenario.key
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/5 bg-black/10 text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
                    }`}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <SectionHeader
            eyebrow="SCENARIO LAB"
            title="Switch the outcome. Watch the economics change."
            description="Bear, Base and Bull use the same ownership model with different company exit valuations."
          />

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {report.scenarios.map((scenario) => (
              <ScenarioPanel
                key={scenario.key}
                scenario={scenario}
                selected={scenario.key === selectedScenarioKey}
                onSelect={() => setSelectedScenarioKey(scenario.key)}
              />
            ))}
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-b border-slate-100 p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              eyebrow="SCENARIO MATRIX"
              title="Compare every moving part"
              description="A side-by-side view of the model that powers your selected outcome."
            />
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5">
              {report.scenarios.map((scenario) => (
                <button
                  key={scenario.key}
                  type="button"
                  onClick={() => setSelectedScenarioKey(scenario.key)}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition-all active:scale-[0.97] ${
                    selectedScenarioKey === scenario.key
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {scenario.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:px-8">
                    Metric
                  </th>
                  {report.scenarios.map((scenario) => (
                    <th
                      key={scenario.key}
                      className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.12em] ${
                        selectedScenarioKey === scenario.key
                          ? "bg-slate-950 text-blue-300"
                          : "text-slate-400"
                      }`}
                    >
                      {scenario.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <MatrixRow
                  label="Exit valuation"
                  values={report.scenarios.map((s) => formatCurrency(s.valuation))}
                  selectedIndex={scenarioIndex(selectedScenarioKey)}
                />
                <MatrixRow
                  label="Gross equity"
                  values={report.scenarios.map((s) => formatCurrency(s.gross))}
                  selectedIndex={scenarioIndex(selectedScenarioKey)}
                />
                <MatrixRow
                  label="Exercise cost"
                  values={report.scenarios.map(() => formatCurrency(report.exerciseCost))}
                  selectedIndex={scenarioIndex(selectedScenarioKey)}
                />
                <MatrixRow
                  label="Net proceeds"
                  values={report.scenarios.map((s) => formatCurrency(s.proceeds))}
                  selectedIndex={scenarioIndex(selectedScenarioKey)}
                  emphasized
                />
                <MatrixRow
                  label="Return multiple"
                  values={report.scenarios.map((s) => formatMultiple(s.multiple))}
                  selectedIndex={scenarioIndex(selectedScenarioKey)}
                />
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <SectionHeader
              eyebrow="MODEL ASSUMPTIONS"
              title="What is powering the report"
              description="These inputs are read directly from your existing PRO equity model."
            />

            <div className="mt-7 divide-y divide-slate-100">
              <AssumptionRow
                label="Total options"
                value={formatNumber(proState.totalOptions)}
                active={activeAssumption === "totalOptions"}
                onClick={() => setActiveAssumption("totalOptions")}
              />
              <AssumptionRow
                label="Vested options"
                value={formatNumber(report.vestedOptions)}
                active={activeAssumption === "vestedOptions"}
                onClick={() => setActiveAssumption("vestedOptions")}
              />
              <AssumptionRow
                label="Exercise price"
                value={formatCurrency(report.exercisePrice)}
                active={activeAssumption === "exercisePrice"}
                onClick={() => setActiveAssumption("exercisePrice")}
              />
              <AssumptionRow
                label="Company shares"
                value={formatNumber(report.companyShares)}
                active={activeAssumption === "companyShares"}
                onClick={() => setActiveAssumption("companyShares")}
              />
              <AssumptionRow
                label="Current company valuation"
                value={formatCurrency(report.currentCompanyValuation)}
                active={activeAssumption === "currentValuation"}
                onClick={() => setActiveAssumption("currentValuation")}
              />
              <AssumptionRow
                label="Exit valuation"
                value={formatCurrency(report.exitValuation)}
                active={activeAssumption === "exitValuation"}
                onClick={() => setActiveAssumption("exitValuation")}
              />
              <AssumptionRow
                label="Future dilution"
                value={formatPercentage(report.dilution)}
                active={activeAssumption === "dilution"}
                onClick={() => setActiveAssumption("dilution")}
              />
              <AssumptionRow
                label="Equity type"
                value={proState.equityType === "UNLISTED" ? "Unlisted" : "Listed"}
                active={activeAssumption === "equityType"}
                onClick={() => setActiveAssumption("equityType")}
              />
            </div>

            <div key={activeAssumption} className="evc-value-swap mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Sparkles size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.13em] text-blue-600">Selected assumption</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{assumptionDetail}</p>
                </div>
              </div>
            </div>

            <Link
              href="/pro/simulator"
              className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-600 transition hover:text-blue-700"
            >
              Edit assumptions
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl md:p-8">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Zap size={21} />
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-100">
                  Decision snapshot
                </span>
              </div>

              <p className="mt-8 text-[11px] font-black uppercase tracking-[0.16em] text-blue-100/80">
                Base to Bull opportunity
              </p>
              <h3 className="mt-2 max-w-xl text-3xl font-black tracking-tight md:text-4xl">
                An extra {formatCurrency(report.bullVsBase)} of modeled proceeds.
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100">
                Your ownership is fixed in this model. The biggest swing comes from the company outcome itself.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <GlassStat
                  label="Bear"
                  value={formatCurrency(report.bear.proceeds)}
                  selected={selectedScenarioKey === "bear"}
                  onClick={() => setSelectedScenarioKey("bear")}
                />
                <GlassStat
                  label="Base"
                  value={formatCurrency(report.base.proceeds)}
                  selected={selectedScenarioKey === "base"}
                  onClick={() => setSelectedScenarioKey("base")}
                />
                <GlassStat
                  label="Bull"
                  value={formatCurrency(report.bull.proceeds)}
                  selected={selectedScenarioKey === "bull"}
                  onClick={() => setSelectedScenarioKey("bull")}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-amber-200 bg-amber-50/70 p-6 md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                <ShieldCheck size={19} />
              </div>
              <div>
                <p className="text-sm font-black text-amber-950">
                  Modeled outcomes are not guaranteed payouts.
                </p>
                <p className="mt-1 max-w-4xl text-xs leading-6 text-amber-900/75">
                  The report is a decision model, not a promise of liquidity or payout.
                </p>
                {disclaimerOpen && (
                  <div className="evc-value-swap mt-3 max-w-5xl rounded-2xl border border-amber-200/80 bg-white/60 p-4 text-xs leading-6 text-amber-900/80">
                    Actual proceeds can differ because of taxes, liquidity events, company terms,
                    preference structures, additional dilution, transaction costs and other
                    factors that may not be represented in this report.
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDisclaimerOpen((value) => !value)}
              aria-expanded={disclaimerOpen}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-3.5 py-2 text-xs font-black text-amber-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              {disclaimerOpen ? "Hide details" : "What can change?"}
              <ChevronDown size={14} className={`transition-transform ${disclaimerOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[32px] bg-[#050816] p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-300">
                Keep modeling
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                Change one assumption. See the whole report react.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Reports stays connected to the same PRO model used across Simulator, Dilution and Compare.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pro/dilution"
                className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 active:scale-[0.98]"
              >
                Review dilution
                <ChevronRight size={16} />
              </Link>
              <Link
                href="/pro/simulator"
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Open simulator
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 md:flex-row">
          <span>ESOP Value Clarity · PRO Equity Report</span>
          <span>Interactive decision-ready equity modeling</span>
        </footer>
      </div>

      <style jsx global>{`
        /* Reports hero hardening: protects this page from broad/global background rules. */
        section.evc-saas-reports-hero {
          background: #050816 !important;
          color: #ffffff !important;
          isolation: isolate;
        }
        section.evc-saas-reports-hero .evc-saas-reports-copy {
          background: linear-gradient(
            145deg,
            rgba(15, 23, 42, 0.98) 0%,
            rgba(8, 13, 30, 0.99) 58%,
            rgba(9, 20, 46, 0.99) 100%
          ) !important;
        }
        section.evc-saas-reports-hero .evc-saas-reports-engine {
          background: #080d20 !important;
        }
        section.evc-saas-reports-hero .evc-saas-reports-graph {
          background: #050916 !important;
        }

        @keyframes evc-flow {
          0% { stroke-dashoffset: 34; opacity: 0.35; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.35; }
        }
        @keyframes evc-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes evc-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes evc-value-swap {
          0% { opacity: 0; transform: translateY(8px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .evc-flow-path {
          stroke-dasharray: 11 11;
          animation: evc-flow 2.3s linear infinite;
        }
        .evc-pulse-dot {
          transform-origin: center;
          animation: evc-pulse 2.1s ease-in-out infinite;
        }
        .evc-float-card {
          animation: evc-float 4s ease-in-out infinite;
        }
        .evc-value-swap {
          animation: evc-value-swap 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .evc-flow-path, .evc-pulse-dot, .evc-float-card, .evc-value-swap {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function FintechFlowGraph({
  scenarioKey,
  valuation,
  ownership,
  gross,
  cost,
  proceeds,
  multiple,
}: {
  scenarioKey: ScenarioKey;
  valuation: number;
  ownership: number;
  gross: number;
  cost: number;
  proceeds: number;
  multiple: number;
}) {
  const theme = getScenarioTheme(scenarioKey);
  const width = scenarioKey === "bear" ? 10 : scenarioKey === "base" ? 16 : 22;

  return (
    <div className="relative mt-5 h-[340px] min-h-[340px] w-full overflow-hidden rounded-[22px] border border-white/5 bg-black/10 sm:h-[370px] sm:min-h-[370px]">
      <div
        className="pointer-events-none absolute inset-0 opacity-50 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 72% 48%, ${theme.glow}, transparent 28%)`,
        }}
      />

      <svg
        viewBox="0 0 900 380"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`${scenarioKey} scenario ESOP equity value flow`}
      >
        <defs>
          <linearGradient id={`flow-${scenarioKey}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.28" />
            <stop offset="55%" stopColor={theme.primary} stopOpacity="0.92" />
            <stop offset="100%" stopColor={theme.secondary} stopOpacity="1" />
          </linearGradient>
          <filter id={`glow-${scenarioKey}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[84, 148, 212, 276].map((y) => (
          <line
            key={y}
            x1="42"
            y1={y}
            x2="858"
            y2={y}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
        ))}

        <path
          d="M126 190 C218 190 224 125 320 125 C410 125 430 190 506 190 C596 190 618 120 716 120"
          fill="none"
          stroke={`url(#flow-${scenarioKey})`}
          strokeWidth={width}
          strokeLinecap="round"
          className="evc-flow-path transition-all duration-700"
          filter={`url(#glow-${scenarioKey})`}
        />

        <path
          d="M506 190 C590 190 610 267 706 267"
          fill="none"
          stroke="#f59e0b"
          strokeOpacity="0.62"
          strokeWidth={Math.max(6, width * 0.42)}
          strokeLinecap="round"
          className="evc-flow-path"
        />

        <circle cx="126" cy="190" r="47" fill="#08111f" stroke={theme.primary} strokeWidth="2" />
        <circle cx="126" cy="190" r="55" fill="none" stroke={theme.primary} strokeOpacity="0.2" className="evc-pulse-dot" />

        <circle cx="320" cy="125" r="45" fill="#08111f" stroke={theme.primary} strokeWidth="2" />
        <circle cx="506" cy="190" r="45" fill="#08111f" stroke={theme.primary} strokeWidth="2" />
        <circle cx="716" cy="120" r="58" fill="#08111f" stroke={theme.secondary} strokeWidth="2.5" filter={`url(#glow-${scenarioKey})`} />
        <circle cx="706" cy="267" r="38" fill="#08111f" stroke="#f59e0b" strokeWidth="2" />

        <text x="126" y="177" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800" letterSpacing="1.2">
          EXIT VALUE
        </text>
        <text x="126" y="198" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">
          {compactCurrency(valuation)}
        </text>

        <text x="320" y="112" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800" letterSpacing="1.2">
          OWNERSHIP
        </text>
        <text x="320" y="133" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">
          {formatPercentage(ownership)}
        </text>

        <text x="506" y="177" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800" letterSpacing="1.2">
          GROSS EQUITY
        </text>
        <text x="506" y="198" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">
          {compactCurrency(gross)}
        </text>

        <text x="716" y="104" textAnchor="middle" fill={theme.secondary} fontSize="10" fontWeight="900" letterSpacing="1.2">
          NET PROCEEDS
        </text>
        <text x="716" y="128" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900">
          {compactCurrency(proceeds)}
        </text>
        <text x="716" y="146" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700">
          {formatMultiple(multiple)} return
        </text>

        <text x="706" y="259" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="900" letterSpacing="1">
          COST
        </text>
        <text x="706" y="277" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
          {compactCurrency(cost)}
        </text>

        <text x="205" y="160" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="800">
          valuation signal
        </text>
        <text x="414" y="156" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="800">
          stake capture
        </text>
        <text x="614" y="156" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="800">
          value realization
        </text>
        <text x="610" y="242" textAnchor="middle" fill="#92400e" fontSize="9" fontWeight="800">
          exercise drag
        </text>
      </svg>

      <div className="absolute bottom-3 left-3 rounded-xl border border-white/10 bg-[#07111f]/85 px-3 py-2 backdrop-blur">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
          Flow intensity
        </p>
        <p className="mt-1 text-xs font-black text-white">
          {scenarioKey === "bear" ? "Conservative" : scenarioKey === "base" ? "Balanced" : "High upside"}
        </p>
      </div>
    </div>
  );
}

function ScenarioPanel({
  scenario,
  selected,
  onSelect,
}: {
  scenario: {
    key: ScenarioKey;
    label: string;
    title: string;
    valuation: number;
    gross: number;
    proceeds: number;
    multiple: number;
    retained: number;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = getScenarioTheme(scenario.key);
  const Icon =
    scenario.key === "bear"
      ? TrendingDown
      : scenario.key === "bull"
      ? TrendingUp
      : BarChart3;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-[28px] border p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.985] ${
        selected
          ? "border-slate-950 bg-slate-950 text-white shadow-xl"
          : "border-slate-200 bg-white text-slate-950 shadow-sm"
      }`}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl transition-opacity duration-300"
        style={{ backgroundColor: theme.glow, opacity: selected ? 0.85 : 0.32 }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-black tracking-[0.14em]"
                style={{ color: selected ? theme.secondary : theme.primary }}
              >
                {scenario.label}
              </span>
              {selected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                  <Check size={10} /> active
                </span>
              )}
            </div>
            <p className={`mt-2 text-sm ${selected ? "text-slate-400" : "text-slate-500"}`}>
              {scenario.title}
            </p>
          </div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              selected ? "bg-white/10" : "bg-slate-100"
            }`}
            style={{ color: theme.primary }}
          >
            <Icon size={19} />
          </div>
        </div>

        <p className={`mt-7 text-xs ${selected ? "text-slate-500" : "text-slate-400"}`}>
          Modeled proceeds
        </p>
        <p className="mt-1 text-3xl font-black tracking-tight">
          {formatCurrency(scenario.proceeds)}
        </p>

        <div className={`mt-6 grid grid-cols-2 gap-3 border-t pt-5 ${selected ? "border-white/10" : "border-slate-100"}`}>
          <ScenarioDetail label="Exit valuation" value={formatCurrency(scenario.valuation)} dark={selected} />
          <ScenarioDetail label="Return" value={formatMultiple(scenario.multiple)} dark={selected} accent={theme.secondary} />
          <ScenarioDetail label="Gross equity" value={formatCurrency(scenario.gross)} dark={selected} />
          <ScenarioDetail label="Value retained" value={formatPercentage(scenario.retained)} dark={selected} />
        </div>

        <div className={`mt-6 h-1.5 overflow-hidden rounded-full ${selected ? "bg-white/10" : "bg-slate-100"}`}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: scenario.key === "bear" ? "35%" : scenario.key === "base" ? "67%" : "100%",
              background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
            }}
          />
        </div>
      </div>
    </button>
  );
}

function MatrixRow({
  label,
  values,
  selectedIndex,
  emphasized = false,
}: {
  label: string;
  values: string[];
  selectedIndex: number;
  emphasized?: boolean;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-6 py-5 text-sm font-semibold text-slate-600 md:px-8">
        {label}
      </td>
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className={`px-6 py-5 text-sm transition-colors ${
            index === selectedIndex
              ? `bg-slate-950 ${emphasized ? "font-black text-white" : "font-bold text-slate-200"}`
              : emphasized
              ? "font-black text-slate-950"
              : "font-bold text-slate-700"
          }`}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}

function OwnershipDetail({
  stage,
  vestedOptions,
  companyShares,
  currentOwnership,
  dilutedOwnership,
  dilution,
}: {
  stage: OwnershipStage;
  vestedOptions: number;
  companyShares: number;
  currentOwnership: number;
  dilutedOwnership: number;
  dilution: number;
}) {
  const content = {
    vested: {
      title: "Your vested grant is the starting asset.",
      text: `${formatNumber(vestedOptions)} vested options are currently included in the ownership model.`,
      value: formatNumber(vestedOptions),
      label: "Vested options",
    },
    current: {
      title: "Your grant translated into company ownership.",
      text: `Against ${formatNumber(companyShares)} total shares, your vested options represent ${formatPercentage(currentOwnership)} before future dilution.`,
      value: formatPercentage(currentOwnership),
      label: "Current stake",
    },
    diluted: {
      title: "Future dilution compresses your modeled stake.",
      text: `${formatPercentage(dilution)} future dilution changes modeled ownership from ${formatPercentage(currentOwnership)} to ${formatPercentage(dilutedOwnership)}.`,
      value: formatPercentage(dilutedOwnership),
      label: "After dilution",
    },
  }[stage];

  return (
    <div className="mt-4 flex flex-col justify-between gap-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 md:flex-row md:items-center">
      <div className="max-w-2xl">
        <h4 className="text-base font-black text-slate-950">{content.title}</h4>
        <p className="mt-2 text-sm leading-6 text-slate-600">{content.text}</p>
      </div>
      <div className="shrink-0 rounded-2xl border border-white bg-white px-5 py-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
          {content.label}
        </p>
        <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          {content.value}
        </p>
      </div>
    </div>
  );
}

function Badge({
  children,
  icon,
  success = false,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  success?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-black tracking-[0.12em] ${
        success
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : "border-blue-400/25 bg-blue-400/10 text-blue-200"
      }`}
    >
      {icon}
      {children}
    </div>
  );
}

function DarkMetric({
  label,
  value,
  caption,
  active,
  onClick,
}: {
  label: string;
  value: string;
  caption: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-left backdrop-blur transition-all duration-300 active:scale-[0.98] ${
        active
          ? "border-blue-300/35 bg-blue-400/[0.10] shadow-[0_12px_34px_rgba(15,23,42,0.28)]"
          : "border-white/10 bg-white/[0.045] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      {active && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-blue-300" />}
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <ChevronRight size={13} className={`text-slate-600 transition-transform ${active ? "translate-x-0.5 text-blue-300" : "group-hover:translate-x-0.5"}`} />
        </div>
        <p className="mt-2 text-lg font-black text-white">{value}</p>
        <p className="mt-1 text-[10px] text-slate-500">{caption}</p>
      </div>
    </button>
  );
}

function MiniDarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function HeroInsight({
  icon,
  label,
  value,
  text,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  text: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group rounded-2xl border p-4 text-left backdrop-blur-sm transition-all duration-300 active:scale-[0.98] ${
        active
          ? "border-blue-300/30 bg-blue-400/[0.09] shadow-[0_12px_30px_rgba(0,0,0,0.16)]"
          : "border-white/10 bg-white/[0.035] hover:-translate-y-0.5 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-300">
          {icon}
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>
        </div>
        <ChevronRight size={13} className={`text-slate-600 transition-transform ${active ? "translate-x-0.5 text-blue-300" : "group-hover:translate-x-0.5"}`} />
      </div>
      <p className="mt-3 text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{text}</p>
    </button>
  );
}

function SaasMetric({
  icon,
  label,
  value,
  change,
  featured = false,
  accent,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  featured?: boolean;
  accent?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-[24px] border p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.985] ${
        featured
          ? "border-slate-950 bg-slate-950 text-white"
          : active
          ? "border-blue-300 bg-white text-slate-950 ring-4 ring-blue-50"
          : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      {active && (
        <span
          className="absolute inset-x-5 bottom-0 h-0.5 rounded-full"
          style={{ backgroundColor: accent ?? (featured ? "#93c5fd" : "#3b82f6") }}
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
            featured ? "bg-white/10" : "bg-slate-100"
          }`}
          style={{ color: accent ?? (featured ? "#93c5fd" : "#475569") }}
        >
          {icon}
        </div>
        <ChevronRight size={15} className={`mt-1 transition-transform ${featured ? "text-slate-600" : "text-slate-300"} ${active ? "translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
      </div>
      <p className={`relative mt-4 text-[10px] font-black uppercase tracking-[0.13em] ${featured ? "text-slate-500" : "text-slate-400"}`}>
        {label}
      </p>
      <p className="relative mt-2 text-2xl font-black tracking-tight">{value}</p>
      <p className="relative mt-1 text-xs text-slate-500">{change}</p>
    </button>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function LightStat({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.98] ${
        active
          ? "border-blue-300 bg-white shadow-md ring-4 ring-blue-50"
          : "border-slate-200 bg-slate-50 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.11em] text-slate-400">
          {label}
        </p>
        <ChevronRight size={13} className={`text-slate-300 transition-transform ${active ? "translate-x-0.5 text-blue-500" : "group-hover:translate-x-0.5"}`} />
      </div>
      <p className="mt-2 text-xl font-black tracking-tight text-slate-950">{value}</p>
    </button>
  );
}

function OwnershipSwitch({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.98] ${
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-lg"
          : "border-slate-200 bg-white text-slate-950 hover:border-blue-200"
      }`}
    >
      <p className={`text-[10px] font-black uppercase tracking-[0.11em] ${active ? "text-slate-400" : "text-slate-400"}`}>
        {label}
      </p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </button>
  );
}

function DarkDecisionRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-black" style={{ color: accent ?? "#ffffff" }}>
        {value}
      </span>
    </div>
  );
}

function ScenarioDetail({
  label,
  value,
  dark,
  accent,
}: {
  label: string;
  value: string;
  dark: boolean;
  accent?: string;
}) {
  return (
    <div>
      <p className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
        {label}
      </p>
      <p className="mt-1 text-sm font-black" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function AssumptionRow({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex w-full items-center justify-between gap-6 px-2 py-3.5 text-left transition-all duration-200 ${
        active ? "bg-blue-50/80" : "hover:bg-slate-50"
      }`}
    >
      <span className={`text-sm ${active ? "font-bold text-blue-700" : "text-slate-500"}`}>{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-right text-sm font-black text-slate-950">{value}</span>
        <ChevronRight size={14} className={`transition-transform ${active ? "translate-x-0.5 text-blue-600" : "text-slate-300 group-hover:translate-x-0.5"}`} />
      </span>
    </button>
  );
}

function GlassStat({
  label,
  value,
  selected,
  onClick,
}: {
  label: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group rounded-2xl border p-4 text-left backdrop-blur-sm transition-all duration-300 active:scale-[0.98] ${
        selected
          ? "border-white/40 bg-white/20 shadow-lg"
          : "border-white/15 bg-white/10 hover:-translate-y-0.5 hover:bg-white/15"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.11em] text-blue-100/70">
          {label}
        </p>
        {selected ? <Check size={13} /> : <ChevronRight size={13} className="text-white/40 transition-transform group-hover:translate-x-0.5" />}
      </div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </button>
  );
}

function ExportMenuButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all hover:bg-slate-50 active:scale-[0.985]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </button>
  );
}

function getScenarioTheme(key: ScenarioKey) {
  if (key === "bear") {
    return {
      primary: "#f59e0b",
      secondary: "#fde68a",
      glow: "rgba(245,158,11,0.18)",
    };
  }
  if (key === "bull") {
    return {
      primary: "#10b981",
      secondary: "#6ee7b7",
      glow: "rgba(16,185,129,0.20)",
    };
  }
  return {
    primary: "#3b82f6",
    secondary: "#93c5fd",
    glow: "rgba(59,130,246,0.22)",
  };
}

function scenarioIndex(key: ScenarioKey) {
  return key === "bear" ? 0 : key === "base" ? 1 : 2;
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function compactCurrency(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "₹0";
  const crore = value / 10_000_000;
  if (crore >= 1) return `₹${crore.toFixed(crore >= 10 ? 0 : 1)}Cr`;
  const lakh = value / 100_000;
  if (lakh >= 1) return `₹${lakh.toFixed(lakh >= 10 ? 0 : 1)}L`;
  return formatCurrency(value);
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("en-IN");
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
}

function formatMultiple(value: number) {
  if (!Number.isFinite(value)) return "0×";
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}×`;
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function createExcelHtml(rows: Array<[string, string | number]>) {
  const tableRows = rows
    .map(([label, value]) => {
      const isSection = value === "" && label !== "";
      return `
        <tr>
          <td style="padding:10px;border:1px solid #e2e8f0;font-weight:${
            isSection ? "700" : "500"
          };background:${isSection ? "#eff6ff" : "#ffffff"};color:${
        isSection ? "#1d4ed8" : "#0f172a"
      };">${escapeHtml(String(label))}</td>
          <td style="padding:10px;border:1px solid #e2e8f0;font-weight:${
            isSection ? "700" : "600"
          };background:${isSection ? "#eff6ff" : "#ffffff"};color:#0f172a;">${escapeHtml(
        String(value)
      )}</td>
        </tr>`;
    })
    .join("");

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <th colspan="2" style="padding:16px;background:#020617;color:white;text-align:left;font-size:18px;">
              ESOP Value Clarity — PRO Equity Report
            </th>
          </tr>
          ${tableRows}
        </table>
      </body>
    </html>`;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Give the browser time to complete the download
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

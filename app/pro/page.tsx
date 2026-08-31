"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calculator,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileSearch,
  FileText,
  GitBranch,
  Layers3,
  PieChart,
  ReceiptIndianRupee,
  Scale,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  WalletCards,
  X,
} from "lucide-react";

import { useProEquityState } from "@/lib/esop/pro-state";

/* ============================================================
   TYPES
============================================================ */

type ScenarioKey = "bear" | "base" | "bull";

type FlowKey =
  | "grant"
  | "vesting"
  | "ownership"
  | "dilution"
  | "exercise"
  | "exit"
  | "proceeds";

type PhaseKey = "phase1" | "phase2" | "phase3" | "phase4";

type ScenarioResult = {
  key: ScenarioKey;
  label: string;
  eyebrow: string;
  exitValuation: number;
  grossValue: number;
  exerciseCost: number;
  proceeds: number;
  multiple: number;
  color: string;
  soft: string;
  border: string;
  text: string;
};

type ModuleCard = {
  number: string;
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  badge: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
};

/* ============================================================
   FORMATTERS
============================================================ */

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.max(safeNumber(value), 0));
}

function formatCurrency(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(safeNumber(value));
}

function formatPercentage(value: number, digits = 2) {
  return `${safeNumber(value).toFixed(digits)}%`;
}

function formatMultiple(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0×";
  }

  return `${value.toFixed(2)}×`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* ============================================================
   MODULES
============================================================ */

const modules: ModuleCard[] = [
  {
    number: "01",
    title: "Equity",
    eyebrow: "SOURCE OF TRUTH",
    description:
      "Review the confirmed grant and the source terms that power your connected ESOP model.",
    href: "/pro/equity",
    badge: "Grant",
    icon: WalletCards,
  },
  {
    number: "02",
    title: "Vesting",
    eyebrow: "EARNED POSITION",
    description:
      "See what is vested today, what remains at risk and how the schedule develops over time.",
    href: "/pro/vesting",
    badge: "Ownership",
    icon: Clock3,
  },
  {
    number: "03",
    title: "Dilution",
    eyebrow: "OWNERSHIP IMPACT",
    description:
      "Understand how future funding could reduce effective ownership without removing your options.",
    href: "/pro/dilution",
    badge: "Ownership",
    icon: GitBranch,
  },
  {
    number: "04",
    title: "Exercise",
    eyebrow: "CAPITAL DECISION",
    description:
      "Model when and how much to exercise, including future vesting, FMV and required cash.",
    href: "/pro/exercise",
    badge: "Decision",
    icon: CircleDollarSign,
  },
  {
    number: "05",
    title: "Exit",
    eyebrow: "FUTURE OUTCOME",
    description:
      "Connect ownership, dilution and exit valuation to potential financial outcomes.",
    href: "/pro/exit",
    badge: "Outcome",
    icon: Trophy,
  },
  {
    number: "06",
    title: "Tax",
    eyebrow: "INDIA TAX LAYER",
    description:
      "Estimate the potential tax impact of exercise and sale using your shared assumptions.",
    href: "/pro/tax",
    badge: "India",
    icon: ReceiptIndianRupee,
  },
  {
    number: "07",
    title: "Compare",
    eyebrow: "SCENARIO RANGE",
    description:
      "Compare Bear, Base and Bull outcomes using the same connected equity model.",
    href: "/pro/compare",
    badge: "Decision",
    icon: Scale,
  },
  {
    number: "08",
    title: "Reports",
    eyebrow: "DECISION OUTPUT",
    description:
      "Bring the connected model together into a decision-ready report and export.",
    href: "/pro/reports",
    badge: "Report",
    icon: FileText,
  },
  {
    number: "09",
    title: "Offer Intelligence",
    eyebrow: "OFFER DECISION",
    description:
      "Scan, confirm and compare complete employment offers across cash, equity, vesting, dilution and exercise risk.",
    href: "/pro/offers",
    badge: "Phase 4",
    icon: FileSearch,
  },
];

/* ============================================================
   PAGE
============================================================ */

export default function ProDashboardPage() {
  const { proState, hydrated } = useProEquityState();

  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioKey>("base");

  const [selectedFlow, setSelectedFlow] =
    useState<FlowKey>("proceeds");

  const [selectedPhase, setSelectedPhase] =
    useState<PhaseKey>("phase1");

  /* ==========================================================
     LIVE STATE
  ========================================================== */

  const totalOptions = Math.max(safeNumber(proState.totalOptions), 0);

  const vestedOptions = Math.max(safeNumber(proState.vestedOptions), 0);

  const vestedPercentage = Math.max(
    safeNumber(proState.vestedPercentage),
    0
  );

  const exercisePrice = Math.max(safeNumber(proState.exercisePrice), 0);

  const totalCompanyShares = Math.max(
    safeNumber(proState.totalCompanyShares),
    1
  );

  const currentValuation = Math.max(
    safeNumber(proState.currentCompanyValuation),
    0
  );

  const dilution = Math.min(
    Math.max(safeNumber(proState.futureDilutionPercentage), 0),
    100
  );

  const baseExitValuation = Math.max(
    safeNumber(proState.exitValuation),
    0
  );

  /* ==========================================================
     PHASE 1
  ========================================================== */

  const hasConfirmedGrant = Boolean(proState.sourceGrantId);

  const companyName =
    proState.sourceCompanyName || "Your confirmed ESOP grant";

  const grantName =
    proState.sourceGrantName || "Employee Stock Option Grant";

  const vestingDuration = proState.sourceVestingDurationMonths;
  const cliffMonths = proState.sourceCliffMonths;
  const expiryDate = proState.sourceExpiryDate;
  const postTerminationDays =
    proState.sourcePostTerminationExerciseDays;

  /* ==========================================================
     PHASE 2 - EXERCISE INTELLIGENCE
  ========================================================== */

  const exercisePlanOptions = Math.max(
    safeNumber(proState.exercisePlanOptions),
    0
  );

  const exercisePlanWaitMonths = Math.max(
    safeNumber(proState.exercisePlanWaitMonths),
    0
  );

  const exercisePlanFMV = Math.max(
    safeNumber(proState.exercisePlanFMV),
    0
  );

  const hasExercisePlan =
    exercisePlanOptions > 0 && Boolean(proState.exercisePlanUpdatedAt);

  /* ==========================================================
     OWNERSHIP
  ========================================================== */

  const potentialOwnership =
    totalCompanyShares > 0
      ? (totalOptions / totalCompanyShares) * 100
      : 0;

  const currentOwnership =
    totalCompanyShares > 0
      ? (vestedOptions / totalCompanyShares) * 100
      : 0;

  const dilutionMultiplier = Math.max(1 - dilution / 100, 0);

  const postDilutionOwnership =
    potentialOwnership * dilutionMultiplier;

  const overviewOptions = totalOptions;

  const overviewExerciseCost =
    overviewOptions * exercisePrice;

  /* ==========================================================
     SCENARIOS
  ========================================================== */

  const scenarios = useMemo<
    Record<ScenarioKey, ScenarioResult>
  >(() => {
    const createScenario = (
      key: ScenarioKey,
      label: string,
      eyebrow: string,
      multiplier: number,
      color: string,
      soft: string,
      border: string,
      text: string
    ): ScenarioResult => {
      const exitValuation =
        baseExitValuation * multiplier;

      const sharePriceBeforeDilution =
        totalCompanyShares > 0
          ? exitValuation / totalCompanyShares
          : 0;

      const sharePriceAfterDilution =
        sharePriceBeforeDilution * dilutionMultiplier;

      const grossValue =
        overviewOptions * sharePriceAfterDilution;

      const proceeds = Math.max(
        grossValue - overviewExerciseCost,
        0
      );

      const multiple =
        overviewExerciseCost > 0
          ? proceeds / overviewExerciseCost
          : 0;

      return {
        key,
        label,
        eyebrow,
        exitValuation,
        grossValue,
        exerciseCost: overviewExerciseCost,
        proceeds,
        multiple,
        color,
        soft,
        border,
        text,
      };
    };

    return {
      bear: createScenario(
        "bear",
        "BEAR",
        "Lower-growth outcome",
        0.5,
        "#f59e0b",
        "#fffbeb",
        "#fde68a",
        "#b45309"
      ),

      base: createScenario(
        "base",
        "BASE",
        "Current assumption",
        1,
        "#2563eb",
        "#eff6ff",
        "#bfdbfe",
        "#1d4ed8"
      ),

      bull: createScenario(
        "bull",
        "BULL",
        "Strong-growth outcome",
        2,
        "#10b981",
        "#ecfdf5",
        "#a7f3d0",
        "#047857"
      ),
    };
  }, [
    baseExitValuation,
    dilutionMultiplier,
    overviewExerciseCost,
    overviewOptions,
    totalCompanyShares,
  ]);

  const scenario = scenarios[selectedScenario];

  const bullBearRange = Math.max(
    scenarios.bull.proceeds - scenarios.bear.proceeds,
    0
  );

  /* ==========================================================
     EXERCISE PLAN
  ========================================================== */

  const exercisePlanStrikeCost =
    exercisePlanOptions * exercisePrice;

  const exercisePlanSpread = Math.max(
    exercisePlanFMV - exercisePrice,
    0
  );

  const exercisePlanPerquisite =
    exercisePlanSpread * exercisePlanOptions;

  /* ==========================================================
     FLOW INSPECTOR
  ========================================================== */

  const flowInspector = useMemo(() => {
    const data: Record<
      FlowKey,
      {
        eyebrow: string;
        title: string;
        value: string;
        explanation: string;
        href: string;
        action: string;
      }
    > = {
      grant: {
        eyebrow: "CONFIRMED GRANT",
        title: "Your starting equity position",
        value: `${formatNumber(totalOptions)} options`,
        explanation:
          "This comes from the confirmed Equity Profile and is the source position used by the Overview.",
        href: "/pro/equity",
        action: "Open Equity",
      },

      vesting: {
        eyebrow: "VESTING POSITION",
        title: "What is earned today",
        value: `${formatNumber(vestedOptions)} options`,
        explanation: `${formatPercentage(
          vestedPercentage
        )} of the confirmed grant is currently vested. Vesting determines the currently earned position.`,
        href: "/pro/vesting",
        action: "Open Vesting",
      },

      ownership: {
        eyebrow: "OWNERSHIP",
        title: "What the grant could represent",
        value: formatPercentage(potentialOwnership),
        explanation:
          "Potential ownership is the full confirmed option count divided by the modeled fully diluted company share count.",
        href: "/pro/simulator",
        action: "Open Simulator",
      },

      dilution: {
        eyebrow: "DILUTION",
        title: "How ownership changes after funding",
        value: formatPercentage(postDilutionOwnership),
        explanation: `${formatPercentage(
          dilution
        )} relative dilution reduces the modeled potential ownership from ${formatPercentage(
          potentialOwnership
        )} to ${formatPercentage(postDilutionOwnership)}.`,
        href: "/pro/dilution",
        action: "Open Dilution",
      },

      exercise: {
        eyebrow: "EXERCISE CAPITAL",
        title: "What exercising could require",
        value: formatCurrency(overviewExerciseCost),
        explanation:
          "The Overview multiplies the selected option position by the confirmed exercise price. Exercise Intelligence can separately model a future exercise plan.",
        href: "/pro/exercise",
        action: "Open Exercise",
      },

      exit: {
        eyebrow: `${scenario.label} EXIT`,
        title: "The company outcome assumption",
        value: formatCurrency(scenario.exitValuation),
        explanation:
          "Exit valuation changes when you switch Bear, Base or Bull. The ownership and exercise-cost basis remain synchronized.",
        href: "/pro/exit",
        action: "Open Exit",
      },

      proceeds: {
        eyebrow: "MODELED PROCEEDS",
        title: `${scenario.label} modeled outcome`,
        value: formatCurrency(scenario.proceeds),
        explanation: `Under the selected ${scenario.label} scenario, the model produces ${formatCurrency(
          scenario.grossValue
        )} of gross equity before subtracting ${formatCurrency(
          overviewExerciseCost
        )} of exercise capital.`,
        href: "/pro/compare",
        action: "Compare scenarios",
      },
    };

    return data[selectedFlow];
  }, [
    selectedFlow,
    scenario,
    totalOptions,
    vestedOptions,
    vestedPercentage,
    potentialOwnership,
    postDilutionOwnership,
    dilution,
    overviewExerciseCost,
  ]);

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#f7faff]">
        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:px-8">
          <div className="flex min-h-[520px] items-center justify-center rounded-[36px] border border-blue-100 bg-white">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Sparkles size={20} />
              </div>

              <p className="mt-5 text-sm font-black text-slate-950">
                Loading your connected ESOP model
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Bringing your grant and decision layers together.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faff] text-slate-950">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 md:px-8 md:py-8">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="evc-overview-hero relative overflow-hidden rounded-[36px] border border-blue-100 bg-white shadow-[0_28px_90px_rgba(37,99,235,0.10)]">
          <div className="pointer-events-none absolute -right-40 -top-44 h-[560px] w-[560px] rounded-full bg-blue-100/80 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-52 left-[28%] h-[460px] w-[460px] rounded-full bg-cyan-100/70 blur-3xl" />

          <div className="relative grid gap-5 p-4 sm:p-6 lg:grid-cols-12 lg:p-8">

            {/* LEFT */}

            <div className="flex min-h-[620px] flex-col justify-between rounded-[30px] border border-blue-100 bg-white/95 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.06)] sm:p-8 lg:col-span-5">

              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge icon={<Sparkles size={13} />}>
                    ESOP VALUE CLARITY
                  </Badge>

                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[10px] font-black text-emerald-700">
                    <span className="evc-live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    LIVE CONNECTED MODEL
                  </span>
                </div>

                <p className="mt-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  YOUR EQUITY COMMAND CENTER
                </p>

                <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[4rem] lg:leading-[0.98]">
                  Your equity,
                  <span className="mt-2 block bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                    from grant to offer decision.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                  Follow the same confirmed grant through vesting,
                  ownership, dilution, exercise, company outcomes and tax —
                  then use Offer Intelligence to compare the complete employment
                  offer around that equity.
                </p>

                <button
                  type="button"
                  onClick={() => setSelectedFlow("grant")}
                  className="group mt-8 w-full rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <ShieldCheck size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                        CONFIRMED SOURCE OF TRUTH
                      </p>

                      <p className="mt-1 truncate text-base font-black text-slate-950">
                        {companyName}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {formatNumber(totalOptions)} options ·{" "}
                        {formatCurrency(exercisePrice, 2)} exercise price ·{" "}
                        {formatNumber(vestedOptions)} vested today
                      </p>
                    </div>

                    <ChevronRight
                      size={17}
                      className="mt-2 text-emerald-600 transition group-hover:translate-x-1"
                    />
                  </div>
                </button>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/pro/equity"
                    className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700"
                  >
                    Open Equity Profile
                    <ArrowUpRight size={16} />
                  </Link>

                  <a
                    href="#journey"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Explore the journey
                    <ChevronRight size={16} />
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT - LIVE FLOW */}

            <div className="min-w-0 rounded-[30px] border border-blue-100 bg-white/95 p-5 shadow-[0_20px_60px_rgba(37,99,235,0.07)] sm:p-6 lg:col-span-7 lg:p-7">

              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="evc-live-dot h-2 w-2 rounded-full"
                      style={{ backgroundColor: scenario.color }}
                    />

                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-blue-600">
                      LIVE EQUITY FLOW
                    </p>
                  </div>

                  <h2 className="mt-3 max-w-xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    Watch value move through your equity model.
                  </h2>

                  <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
                    Click a stage to inspect it. Switch Bear, Base and Bull
                    to see the downstream outcome recalculate instantly.
                  </p>
                </div>

                <div
                  key={`${selectedScenario}-hero`}
                  className="evc-value-enter shrink-0 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:text-right"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                    {scenario.label} OUTCOME
                  </p>

                  <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {formatCurrency(scenario.proceeds)}
                  </p>

                  <p
                    className="mt-1 text-xs font-black"
                    style={{ color: scenario.text }}
                  >
                    {formatMultiple(scenario.multiple)} modeled return
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-amber-700">OVERVIEW ANALYSIS BASIS · FULL GRANT</p>
                <p className="mt-1 text-[11px] leading-5 text-amber-900">Bear, Base and Bull model all {formatNumber(totalOptions)} confirmed options as a potential future outcome. Only {formatNumber(vestedOptions)} options ({formatPercentage(vestedPercentage)}) are vested today.</p>
              </div>

              {/* SCENARIO SWITCH */}

              <div className="mt-4 grid grid-cols-3 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                {(["bear", "base", "bull"] as ScenarioKey[]).map((key) => {
                  const item = scenarios[key];
                  const active = selectedScenario === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedScenario(key);
                        setSelectedFlow("proceeds");
                      }}
                      className={`relative rounded-xl px-3 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
                        active
                          ? "bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200"
                          : "hover:bg-white/80"
                      }`}
                    >
                      <span
                        className="text-[10px] font-black tracking-[0.13em]"
                        style={{
                          color: active ? item.text : "#94a3b8",
                        }}
                      >
                        {item.label}
                      </span>

                      <p className="mt-1 truncate text-xs font-black text-slate-800 sm:text-sm">
                        {formatCurrency(item.proceeds)}
                      </p>

                      {active && (
                        <span
                          className="absolute inset-x-3 bottom-0 h-0.5 rounded-full"
                          style={{
                            backgroundColor: item.color,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* REAL FLOW CHART */}

              <div className="relative mt-6 overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-4 sm:p-5">

                <div className="pointer-events-none absolute inset-0 opacity-70 [background-size:28px_28px] [background-image:linear-gradient(rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.04)_1px,transparent_1px)]" />

                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-blue-600">
                      GRANT → OWNERSHIP → VALUE
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Click any node to inspect what drives it.
                    </p>
                  </div>

                  <span
                    className="rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em]"
                    style={{
                      color: scenario.text,
                      borderColor: scenario.border,
                      backgroundColor: scenario.soft,
                    }}
                  >
                    {scenario.eyebrow}
                  </span>
                </div>

                <div className="relative mt-6 grid gap-3 md:grid-cols-[1fr_46px_1fr_46px_1fr_46px_1.12fr] md:items-center">

                  <InteractiveFlowNode
                    label="CONFIRMED GRANT"
                    value={formatNumber(totalOptions)}
                    caption="Options"
                    active={selectedFlow === "grant"}
                    color={scenario.color}
                    onClick={() => setSelectedFlow("grant")}
                  />

                  <AnimatedFlowConnector
                    color={scenario.color}
                    delay="0s"
                  />

                  <InteractiveFlowNode
                    label="POST-DILUTION STAKE"
                    value={formatPercentage(postDilutionOwnership)}
                    caption={`${formatPercentage(dilution)} dilution`}
                    active={selectedFlow === "dilution"}
                    color={scenario.color}
                    onClick={() => setSelectedFlow("dilution")}
                  />

                  <AnimatedFlowConnector
                    color={scenario.color}
                    delay="0.35s"
                  />

                  <InteractiveFlowNode
                    label="EXIT VALUATION"
                    value={formatCurrency(scenario.exitValuation)}
                    caption={`${scenario.label} scenario`}
                    active={selectedFlow === "exit"}
                    color={scenario.color}
                    onClick={() => setSelectedFlow("exit")}
                  />

                  <AnimatedFlowConnector
                    color={scenario.color}
                    delay="0.7s"
                  />

                  <InteractiveFlowNode
                    label="MODELED PROCEEDS"
                    value={formatCurrency(scenario.proceeds)}
                    caption="After exercise capital"
                    active={selectedFlow === "proceeds"}
                    color={scenario.color}
                    emphasized
                    onClick={() => setSelectedFlow("proceeds")}
                  />
                </div>

                {/* SECONDARY FLOW */}

                <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                  <ClickableMetric
                    label="Gross equity"
                    value={formatCurrency(scenario.grossValue)}
                    active={selectedFlow === "ownership"}
                    onClick={() => setSelectedFlow("ownership")}
                  />

                  <ClickableMetric
                    label="Exercise capital"
                    value={formatCurrency(overviewExerciseCost)}
                    active={selectedFlow === "exercise"}
                    negative
                    onClick={() => setSelectedFlow("exercise")}
                  />

                  <ClickableMetric
                    label="Modeled return"
                    value={formatMultiple(scenario.multiple)}
                    active={selectedFlow === "proceeds"}
                    accent={scenario.text}
                    onClick={() => setSelectedFlow("proceeds")}
                  />
                </div>

                {/* INSPECTOR */}

                <div
                  key={`${selectedFlow}-${selectedScenario}`}
                  className="evc-value-enter relative mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: scenario.color }}
                  />

                  <div className="flex flex-col justify-between gap-4 pl-2 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p
                        className="text-[9px] font-black uppercase tracking-[0.13em]"
                        style={{ color: scenario.text }}
                      >
                        {flowInspector.eyebrow}
                      </p>

                      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-sm font-black text-slate-950">
                          {flowInspector.title}
                        </h3>

                        <span className="text-lg font-black text-slate-950">
                          {flowInspector.value}
                        </span>
                      </div>

                      <p className="mt-2 max-w-3xl text-[11px] leading-5 text-slate-500">
                        {flowInspector.explanation}
                      </p>
                    </div>

                    <Link
                      href={flowInspector.href}
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
                    >
                      {flowInspector.action}
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>

                {/* INTENSITY */}

                <div className="relative mt-4">
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
                    <span>Bear</span>
                    <span>Outcome intensity</span>
                    <span>Bull</span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width:
                          selectedScenario === "bear"
                            ? "28%"
                            : selectedScenario === "base"
                              ? "58%"
                              : "100%",
                        background: `linear-gradient(90deg, ${scenario.color}, #38bdf8)`,
                        boxShadow: `0 0 18px ${scenario.color}35`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <HeroProof
                  value={formatPercentage(potentialOwnership)}
                  label="Potential ownership"
                />

                <HeroProof
                  value={formatPercentage(dilution)}
                  label="Relative dilution"
                />

                <HeroProof
                  value={formatCurrency(bullBearRange)}
                  label="Bear → Bull range"
                />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            PHASE 1 + PHASE 2 + PHASE 3 + PHASE 4 JOURNEY
        ===================================================== */}

        <section id="journey" className="mt-16 scroll-mt-24">
          <SectionIntro
            eyebrow="THE PRODUCT JOURNEY"
            title="Four phases. One connected financial decision journey."
            description="Phase 1 establishes trusted grant facts. Phase 2 builds the connected equity model. Phase 3 turns that model into exercise, tax, exit and reporting decisions. Phase 4 compares the complete employment offer across cash, equity and risk."
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-12">

            {/* PHASE SELECTOR */}

            <div className="space-y-3 lg:col-span-4">
              <PhaseSelector
                number="01"
                title="Understand the grant"
                subtitle="Document → confirmed Equity Profile"
                active={selectedPhase === "phase1"}
                complete={hasConfirmedGrant}
                onClick={() => setSelectedPhase("phase1")}
              />

              <PhaseSelector
                number="02"
                title="Build the equity model"
                subtitle="Vesting → ownership → dilution → simulator"
                active={selectedPhase === "phase2"}
                complete={hasConfirmedGrant && totalOptions > 0}
                onClick={() => setSelectedPhase("phase2")}
              />

              <PhaseSelector
                number="03"
                title="Make the decision"
                subtitle="Exercise → tax → exit → compare → reports"
                active={selectedPhase === "phase3"}
                complete={hasConfirmedGrant && baseExitValuation > 0}
                onClick={() => setSelectedPhase("phase3")}
              />

              <PhaseSelector
                number="04"
                title="Compare the complete offer"
                subtitle="Offer PDF → confirm → Offer A vs Offer B"
                active={selectedPhase === "phase4"}
                complete={false}
                onClick={() => setSelectedPhase("phase4")}
              />

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                  CURRENT MODEL
                </p>

                <div className="mt-4 space-y-3">
                  <CompactRow
                    label="Options"
                    value={formatNumber(totalOptions)}
                  />

                  <CompactRow
                    label="Vested"
                    value={formatNumber(vestedOptions)}
                  />

                  <CompactRow
                    label="Dilution"
                    value={formatPercentage(dilution)}
                  />

                  <CompactRow
                    label="Base exit"
                    value={formatCurrency(baseExitValuation)}
                  />
                </div>
              </div>
            </div>

            {/* PHASE CONTENT */}

            <div className="relative overflow-hidden rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_22px_65px_rgba(37,99,235,0.07)] sm:p-8 lg:col-span-8">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />

              {selectedPhase === "phase1" ? (
                <div key="phase1" className="evc-value-enter relative">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                        PHASE 1 · GRANT INTELLIGENCE
                      </p>

                      <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                        Turn the grant document into a trusted equity profile.
                      </h3>

                      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                        The source document is extracted, reviewed and explicitly
                        confirmed before those terms are allowed to power the
                        rest of the product.
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <FileCheck2 size={21} />
                    </div>
                  </div>

                  <div className="mt-8">
                    <HorizontalJourney>
                      <JourneyStep
                        number="01"
                        label="SOURCE PDF"
                        caption="Grant document"
                        complete={hasConfirmedGrant}
                      />

                      <JourneyConnector complete={hasConfirmedGrant} />

                      <JourneyStep
                        number="02"
                        label="EXTRACT"
                        caption="Terms identified"
                        complete={hasConfirmedGrant}
                      />

                      <JourneyConnector complete={hasConfirmedGrant} />

                      <JourneyStep
                        number="03"
                        label="CONFIRM"
                        caption="Human reviewed"
                        complete={hasConfirmedGrant}
                      />

                      <JourneyConnector complete={hasConfirmedGrant} />

                      <JourneyStep
                        number="04"
                        label="EQUITY PROFILE"
                        caption="Source of truth"
                        complete={hasConfirmedGrant}
                        strong
                      />
                    </HorizontalJourney>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <DataPoint label="Company" value={companyName} />
                    <DataPoint label="Grant" value={grantName} />
                    <DataPoint
                      label="Options"
                      value={formatNumber(totalOptions)}
                    />
                    <DataPoint
                      label="Exercise price"
                      value={formatCurrency(exercisePrice, 2)}
                    />
                    <DataPoint
                      label="Vesting"
                      value={
                        vestingDuration
                          ? `${vestingDuration} months`
                          : "Not available"
                      }
                    />
                    <DataPoint
                      label="Cliff"
                      value={
                        cliffMonths
                          ? `${cliffMonths} months`
                          : "Not available"
                      }
                    />
                    <DataPoint
                      label="Expiry"
                      value={formatDate(expiryDate)}
                    />
                    <DataPoint
                      label="After termination"
                      value={
                        postTerminationDays
                          ? `${postTerminationDays} days`
                          : "Not available"
                      }
                    />
                  </div>

                  <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-emerald-700">
                        PHASE STATUS
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-950">
                        {hasConfirmedGrant
                          ? "Confirmed source of truth established."
                          : "Grant confirmation is still required."}
                      </p>
                    </div>

                    <Link
                      href="/pro/equity"
                      className="inline-flex items-center gap-2 text-xs font-black text-emerald-700"
                    >
                      Inspect Equity Profile
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              ) : selectedPhase === "phase2" ? (
                <div key="phase2" className="evc-value-enter relative">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                        PHASE 2 · CONNECTED EQUITY MODEL
                      </p>

                      <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                        Build the connected model that explains what you own and how it changes.
                      </h3>

                      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                        Vesting changes what is earned. Dilution changes the stake.
                        Exercise changes the capital commitment. Exit and tax determine
                        what may ultimately remain.
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Target size={21} />
                    </div>
                  </div>

                  <div className="mt-8">
                    <HorizontalJourney>
                      <JourneyLink
                        href="/pro/vesting"
                        label="VESTING"
                        value={`${formatNumber(vestedOptions)} vested`}
                        icon={<Clock3 size={16} />}
                      />

                      <JourneyConnector complete />

                      <JourneyLink
                        href="/pro/dilution"
                        label="DILUTION"
                        value={formatPercentage(dilution)}
                        icon={<GitBranch size={16} />}
                      />

                      <JourneyConnector complete />

                      <JourneyLink
                        href="/pro/exercise"
                        label="EXERCISE"
                        value={
                          hasExercisePlan
                            ? `${formatNumber(exercisePlanOptions)} planned`
                            : "Model plan"
                        }
                        icon={<CircleDollarSign size={16} />}
                        strong
                      />

                      <JourneyConnector complete />

                      <JourneyLink
                        href="/pro/exit"
                        label="EXIT"
                        value={formatCurrency(baseExitValuation)}
                        icon={<Trophy size={16} />}
                      />
                    </HorizontalJourney>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <DecisionMiniCard
                      href="/pro/tax"
                      icon={<ReceiptIndianRupee size={17} />}
                      label="TAX"
                      text="Estimate potential tax impact"
                    />

                    <DecisionMiniCard
                      href="/pro/compare"
                      icon={<Scale size={17} />}
                      label="COMPARE"
                      text="Inspect Bear / Base / Bull"
                    />

                    <DecisionMiniCard
                      href="/pro/reports"
                      icon={<FileText size={17} />}
                      label="REPORTS"
                      text="Create the decision summary"
                    />
                  </div>
                </div>
              ) : selectedPhase === "phase3" ? (
                <div key="phase3" className="evc-value-enter relative">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">PHASE 3 · DECISION INTELLIGENCE</p>
                      <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Turn the connected equity model into an actual decision framework.</h3>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Exercise separates what is exercisable today from future planning. Tax and Exit preserve the Full Grant, Currently Vested and Exercise Plan analysis bases. Compare and Reports bring the modeled trade-offs together.</p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Sparkles size={21} /></div>
                  </div>
                  <div className="mt-8"><HorizontalJourney>
                    <JourneyLink href="/pro/exercise" label="EXERCISE" value={hasExercisePlan ? `${formatNumber(exercisePlanOptions)} planned` : `${formatNumber(vestedOptions)} vested today`} icon={<CircleDollarSign size={16} />} strong />
                    <JourneyConnector complete />
                    <JourneyLink href="/pro/tax" label="TAX" value="Full grant / vested" icon={<ReceiptIndianRupee size={16} />} />
                    <JourneyConnector complete />
                    <JourneyLink href="/pro/exit" label="EXIT" value={formatCurrency(baseExitValuation)} icon={<Trophy size={16} />} />
                    <JourneyConnector complete />
                    <JourneyLink href="/pro/compare" label="COMPARE" value="Bear / Base / Bull" icon={<Scale size={16} />} />
                  </HorizontalJourney></div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <DecisionMiniCard href="/pro/exercise" icon={<CircleDollarSign size={17} />} label="TODAY VS FUTURE" text={hasExercisePlan ? `Plan ${formatNumber(exercisePlanOptions)} · +${exercisePlanWaitMonths}m` : "Build exercise plan"} />
                    <DecisionMiniCard href="/pro/exit" icon={<Target size={17} />} label="ANALYSIS BASES" text="Full Grant · Vested · Exercise Plan" />
                    <DecisionMiniCard href="/pro/reports" icon={<FileText size={17} />} label="DECISION OUTPUT" text="Compare, summarize and export" />
                  </div>
                  <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-violet-700">ANALYSIS BASIS DISCIPLINE</p>
                    <p className="mt-1 text-sm font-black text-slate-950">Full Grant is a future scenario; currently vested remains anchored to {formatNumber(vestedOptions)} options today.</p>
                  </div>
                </div>
              ) : (
                <div key="phase4" className="evc-value-enter relative">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-600">
                        PHASE 4 · OFFER INTELLIGENCE
                      </p>

                      <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                        Compare the offer around the equity — not just the headline CTC.
                      </h3>

                      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                        Upload an employment offer, review evidence-backed extraction,
                        confirm every important term and compare Offer A with Offer B
                        across guaranteed cash, equity economics, vesting, dilution
                        and exercise risk.
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-50 text-fuchsia-600">
                      <ScanSearch size={21} />
                    </div>
                  </div>

                  <div className="mt-8">
                    <HorizontalJourney>
                      <JourneyLink
                        href="/pro/offers/new"
                        label="SCAN OFFER"
                        value="PDF → extracted terms"
                        icon={<ScanSearch size={16} />}
                      />

                      <JourneyConnector complete />

                      <JourneyLink
                        href="/pro/offers/new"
                        label="CONFIRM"
                        value="Human-reviewed facts"
                        icon={<FileCheck2 size={16} />}
                      />

                      <JourneyConnector complete />

                      <JourneyLink
                        href="/pro/offers"
                        label="SAVED OFFERS"
                        value="Comparison-ready"
                        icon={<WalletCards size={16} />}
                      />

                      <JourneyConnector complete />

                      <JourneyLink
                        href="/pro/offers"
                        label="COMPARE"
                        value="Offer A vs Offer B"
                        icon={<Scale size={16} />}
                        strong
                      />
                    </HorizontalJourney>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <DecisionMiniCard
                      href="/pro/offers"
                      icon={<CircleDollarSign size={17} />}
                      label="CASH REALITY"
                      text="Separate guaranteed, variable and one-time cash"
                    />

                    <DecisionMiniCard
                      href="/pro/offers"
                      icon={<TrendingUp size={17} />}
                      label="EQUITY REALITY"
                      text="Compare grant economics without treating equity as salary"
                    />

                    <DecisionMiniCard
                      href="/pro/offers"
                      icon={<ShieldCheck size={17} />}
                      label="TERMS & RISK"
                      text="Surface vesting, dilution, exercise windows and gaps"
                    />
                  </div>

                  <div className="mt-6 overflow-hidden rounded-[24px] border border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 via-white to-blue-50 p-5">
                    <div className="grid gap-3 md:grid-cols-[1fr_46px_1fr_46px_1fr] md:items-center">
                      <OfferFlowNode
                        label="OFFER A"
                        value="Confirmed offer"
                        caption="Cash + equity + terms"
                      />

                      <AnimatedFlowConnector color="#c026d3" delay="0s" />

                      <OfferFlowNode
                        label="COMPARISON ENGINE"
                        value="A vs B"
                        caption="Explainable trade-offs"
                        strong
                      />

                      <AnimatedFlowConnector color="#2563eb" delay="0.45s" />

                      <OfferFlowNode
                        label="OFFER B"
                        value="Confirmed offer"
                        caption="Cash + equity + terms"
                      />
                    </div>

                    <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-white bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-fuchsia-700">
                          DECISION SIGNAL
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          Compare economics first, then consider the job.
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          Missing information stays visible instead of being invented,
                          and speculative equity is kept separate from guaranteed cash.
                        </p>
                      </div>

                      <Link
                        href="/pro/offers"
                        className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5"
                      >
                        Open Offer Intelligence
                        <ArrowUpRight size={14} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            PHASE 4 — OFFER INTELLIGENCE
        ===================================================== */}

        <section className="mt-16">
          <div className="evc-offer-grid relative overflow-hidden rounded-[34px] border border-fuchsia-200 bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(88,28,135,0.16)] sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="evc-live-dot h-2 w-2 rounded-full bg-fuchsia-400" />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-300">
                      PHASE 4 · OFFER INTELLIGENCE
                    </p>
                  </div>

                  <h2 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                    Your equity model now meets the employment offer around it.
                  </h2>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
                    Offer Intelligence turns reviewed offer letters into an explainable
                    side-by-side decision workspace. Cash stays cash. Equity stays
                    conditional. Missing terms remain visible.
                  </p>
                </div>

                <Link
                  href="/pro/offers"
                  className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-1"
                >
                  Open Offer Intelligence
                  <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              <div className="mt-9 grid gap-4 lg:grid-cols-[1fr_72px_1.15fr_72px_1fr] lg:items-center">
                <OfferPipelineCard
                  eyebrow="OFFER A"
                  title="Scan & confirm"
                  caption="PDF → evidence → reviewed terms"
                  icon={<FileSearch size={19} />}
                />

                <OfferEnergyConnector delay="0s" />

                <div className="relative overflow-hidden rounded-[28px] border border-fuchsia-400/30 bg-white/[0.07] p-6 text-center shadow-[0_18px_60px_rgba(192,38,211,0.12)]">
                  <span className="evc-orbit-ring pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-400/20" />
                  <span className="evc-orbit-ring evc-orbit-delay pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/20" />

                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-blue-600 text-white shadow-[0_0_38px_rgba(192,38,211,0.32)]">
                    <Scale size={23} />
                  </div>

                  <p className="relative mt-5 text-[9px] font-black uppercase tracking-[0.15em] text-fuchsia-300">
                    COMPARISON ENGINE
                  </p>
                  <p className="relative mt-2 text-xl font-black">
                    Offer A vs Offer B
                  </p>
                  <p className="relative mt-2 text-[11px] leading-5 text-slate-400">
                    Cash · Equity · Vesting · Dilution · Exercise risk
                  </p>
                </div>

                <OfferEnergyConnector delay="0.65s" />

                <OfferPipelineCard
                  eyebrow="OFFER B"
                  title="Scan & confirm"
                  caption="PDF → evidence → reviewed terms"
                  icon={<FileCheck2 size={19} />}
                />
              </div>

              <div className="mt-7 grid gap-3 md:grid-cols-4">
                <OfferSignalCard
                  label="CASH REALITY"
                  text="Guaranteed cash is kept separate from variable and one-time compensation."
                  icon={<CircleDollarSign size={17} />}
                />
                <OfferSignalCard
                  label="EQUITY REALITY"
                  text="Grant quantity, strike, FMV and dilution are compared as equity economics."
                  icon={<TrendingUp size={17} />}
                />
                <OfferSignalCard
                  label="RISK & FLEXIBILITY"
                  text="Vesting and post-termination exercise terms stay visible in the trade-off."
                  icon={<ShieldCheck size={17} />}
                />
                <OfferSignalCard
                  label="DECISION SIGNAL"
                  text="A transparent signal explains what currently stands out and why."
                  icon={<Sparkles size={17} />}
                  strong
                />
              </div>

              <div className="mt-6 flex flex-col justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-300">
                    NEW DECISION LAYER
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    Grant intelligence explains your equity. Offer Intelligence helps
                    explain which complete offer is stronger.
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href="/pro/offers/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-fuchsia-500"
                  >
                    Scan an offer <ArrowRight size={14} />
                  </Link>
                  <Link
                    href="/pro/offers"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.09]"
                  >
                    Saved offers <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            EXERCISE INTELLIGENCE
        ===================================================== */}

        <section className="mt-16">
          <div className="relative overflow-hidden rounded-[32px] border border-violet-200 bg-gradient-to-br from-white via-violet-50/60 to-blue-50 p-6 shadow-[0_24px_70px_rgba(124,58,237,0.07)] sm:p-8">
            <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-100/80 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-violet-700">
                    <Sparkles size={12} />
                    EXERCISE INTELLIGENCE
                  </span>

                  <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Model the exercise decision before committing capital.
                  </h2>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                    Your Exercise Intelligence plan stays a modeled planning layer,
                    visibly separate from confirmed grant facts.
                  </p>
                </div>

                <Link
                  href="/pro/exercise"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-600/15 transition hover:-translate-y-0.5 hover:bg-violet-700"
                >
                  Open Exercise
                  <ArrowUpRight size={16} />
                </Link>
              </div>

              {hasExercisePlan ? (
                <>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DecisionMetric
                      eyebrow="PLAN QUANTITY"
                      value={formatNumber(exercisePlanOptions)}
                      caption="Options selected"
                    />

                    <DecisionMetric
                      eyebrow="WAIT PERIOD"
                      value={`+${formatNumber(exercisePlanWaitMonths)}m`}
                      caption="Future planning horizon"
                    />

                    <DecisionMetric
                      eyebrow="FUTURE FMV"
                      value={formatCurrency(exercisePlanFMV, 2)}
                      caption="Planning assumption"
                    />

                    <DecisionMetric
                      eyebrow="STRIKE CAPITAL"
                      value={formatCurrency(exercisePlanStrikeCost)}
                      caption="Before modeled tax"
                      dark
                    />
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[26px] border border-violet-200 bg-white p-5">
                    <div className="grid gap-3 md:grid-cols-[1fr_46px_1fr_46px_1fr_46px_1fr] md:items-center">
                      <ExerciseFlowNode
                        label="TODAY"
                        value={formatNumber(vestedOptions)}
                        caption="Currently vested"
                      />

                      <AnimatedFlowConnector
                        color="#7c3aed"
                        delay="0s"
                      />

                      <ExerciseFlowNode
                        label={`WAIT +${exercisePlanWaitMonths}M`}
                        value={formatNumber(exercisePlanOptions)}
                        caption="Planned options"
                      />

                      <AnimatedFlowConnector
                        color="#7c3aed"
                        delay="0.35s"
                      />

                      <ExerciseFlowNode
                        label="FUTURE FMV"
                        value={formatCurrency(exercisePlanFMV)}
                        caption="Planning assumption"
                      />

                      <AnimatedFlowConnector
                        color="#7c3aed"
                        delay="0.7s"
                      />

                      <ExerciseFlowNode
                        label="STRIKE CAPITAL"
                        value={formatCurrency(exercisePlanStrikeCost)}
                        caption="Cash requirement"
                        strong
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] bg-slate-950 p-5 text-white">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-300">
                          MODELED EXERCISE SPREAD
                        </p>

                        <p className="mt-2 text-3xl font-black">
                          {formatCurrency(exercisePlanPerquisite)}
                        </p>

                        <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
                          Future FMV minus exercise price multiplied by the
                          planned option quantity. This remains a planning
                          indicator rather than a guaranteed tax amount.
                        </p>
                      </div>

                      <Link
                        href="/pro/exercise"
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black text-white transition hover:bg-white/10"
                      >
                        Adjust plan
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-8 rounded-[26px] border border-violet-200 bg-white p-6">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600">
                        NO ACTIVE EXERCISE PLAN
                      </p>

                      <p className="mt-2 text-xl font-black text-slate-950">
                        Create your first future exercise scenario.
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        Choose a future vesting horizon, option quantity and FMV.
                      </p>
                    </div>

                    <Link
                      href="/pro/exercise"
                      className="inline-flex items-center gap-2 text-sm font-black text-violet-700"
                    >
                      Build plan
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            CONNECTED SYSTEM
        ===================================================== */}

        <section className="mt-16">
          <SectionIntro
            eyebrow="ONE CONNECTED SYSTEM"
            title="See the dependency chain, not isolated calculators."
            description="Hover, click and move through the same model that powers the rest of your PRO workspace."
          />

          <div className="relative mt-7 overflow-hidden rounded-[32px] border border-blue-100 bg-white p-5 shadow-[0_24px_70px_rgba(37,99,235,0.07)] sm:p-7 md:p-9">
            <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[680px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(219,234,254,0.75),transparent_62%)]" />

            <div className="relative mx-auto max-w-6xl">
              <LinkedModelNode
                href="/pro/equity"
                icon={<FileCheck2 size={17} />}
                label="CONFIRMED EQUITY PROFILE"
                caption={`${formatNumber(totalOptions)} options · ${formatCurrency(
                  exercisePrice,
                  2
                )} strike`}
                strong
                green
              />

              <VerticalConnector />

              <LinkedModelNode
                href="/pro/vesting"
                icon={<Clock3 size={17} />}
                label="VESTING POSITION"
                caption={`${formatNumber(vestedOptions)} vested · ${formatPercentage(
                  vestedPercentage
                )}`}
                strong
              />

              <VerticalConnector />

              <div className="grid gap-3 sm:grid-cols-2">
                <LinkedModelNode
                  href="/pro/simulator"
                  icon={<PieChart size={17} />}
                  label="OWNERSHIP MODEL"
                  caption={`${formatPercentage(potentialOwnership)} potential stake`}
                />

                <LinkedModelNode
                  href="/pro/dilution"
                  icon={<GitBranch size={17} />}
                  label="DILUTION"
                  caption={`${formatPercentage(dilution)} relative dilution`}
                />
              </div>

              <VerticalConnector />

              <div className="grid gap-3 sm:grid-cols-2">
                <LinkedModelNode
                  href="/pro/exercise"
                  icon={<CircleDollarSign size={17} />}
                  label="EXERCISE INTELLIGENCE"
                  caption={
                    hasExercisePlan
                      ? `${formatNumber(
                          exercisePlanOptions
                        )} planned · +${exercisePlanWaitMonths}m`
                      : "Model future exercise"
                  }
                />

                <LinkedModelNode
                  href="/pro/exit"
                  icon={<Trophy size={17} />}
                  label="EXIT MODEL"
                  caption={`${formatCurrency(baseExitValuation)} Base outcome`}
                />
              </div>

              <VerticalConnector />

              <div className="rounded-[24px] border border-blue-200 bg-blue-50/80 p-5 text-center shadow-[0_12px_28px_rgba(37,99,235,0.05)]">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <BarChart3 size={18} />
                </div>

                <p className="mt-3 text-[10px] font-black tracking-[0.13em] text-blue-700">
                  SCENARIO ENGINE
                </p>

                <p className="mt-1 text-[10px] text-slate-500">
                  One model branches into synchronized Bear, Base and Bull outcomes
                </p>
              </div>

              <VerticalConnector />

              <div className="grid gap-3 sm:grid-cols-3">
                <ScenarioMapNode
                  label="BEAR"
                  value={formatCurrency(scenarios.bear.proceeds)}
                  icon={<TrendingDown size={17} />}
                  tone="amber"
                  active={selectedScenario === "bear"}
                  onClick={() => setSelectedScenario("bear")}
                />

                <ScenarioMapNode
                  label="BASE"
                  value={formatCurrency(scenarios.base.proceeds)}
                  icon={<BarChart3 size={17} />}
                  tone="blue"
                  active={selectedScenario === "base"}
                  onClick={() => setSelectedScenario("base")}
                />

                <ScenarioMapNode
                  label="BULL"
                  value={formatCurrency(scenarios.bull.proceeds)}
                  icon={<TrendingUp size={17} />}
                  tone="emerald"
                  active={selectedScenario === "bull"}
                  onClick={() => setSelectedScenario("bull")}
                />
              </div>

              <div
                key={`map-${selectedScenario}`}
                className="evc-value-enter mx-auto mt-4 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                      SELECTED SCENARIO FLOWING DOWNSTREAM
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-900">
                      {scenario.label} · {formatCurrency(scenario.proceeds)} ·{" "}
                      {formatMultiple(scenario.multiple)} return
                    </p>
                  </div>

                  <span
                    className="inline-flex w-fit rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em]"
                    style={{
                      color: scenario.text,
                      borderColor: scenario.border,
                      backgroundColor: scenario.soft,
                    }}
                  >
                    LIVE SELECTION
                  </span>
                </div>
              </div>

              <VerticalConnector />

              <div className="grid gap-3 sm:grid-cols-3">
                <LinkedModelNode
                  href="/pro/compare"
                  icon={<Scale size={17} />}
                  label="COMPARE"
                  caption="Inspect the range"
                />

                <LinkedModelNode
                  href="/pro/tax"
                  icon={<ReceiptIndianRupee size={17} />}
                  label="TAX"
                  caption="Apply tax assumptions"
                />

                <LinkedModelNode
                  href="/pro/reports"
                  icon={<FileText size={17} />}
                  label="REPORTS"
                  caption="Decision + export"
                />
              </div>

              <VerticalConnector />

              <LinkedModelNode
                href="/pro/offers"
                icon={<ScanSearch size={17} />}
                label="PHASE 4 · OFFER INTELLIGENCE"
                caption="Compare complete employment offers across cash, equity and risk"
                strong
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            SCENARIOS
        ===================================================== */}

        <section className="mt-16">
          <SectionIntro
            eyebrow="SCENARIO INTELLIGENCE"
            title="Stress-test the same equity position."
            description="Switch scenarios and see how company outcome changes the economics without changing the underlying grant."
          />

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            <ScenarioCard
              title="BEAR"
              eyebrow="Lower-growth outcome"
              result={scenarios.bear}
              active={selectedScenario === "bear"}
              tone="amber"
              onClick={() => setSelectedScenario("bear")}
            />

            <ScenarioCard
              title="BASE"
              eyebrow="Current assumption"
              result={scenarios.base}
              active={selectedScenario === "base"}
              tone="blue"
              onClick={() => setSelectedScenario("base")}
            />

            <ScenarioCard
              title="BULL"
              eyebrow="Strong-growth outcome"
              result={scenarios.bull}
              active={selectedScenario === "bull"}
              tone="emerald"
              onClick={() => setSelectedScenario("bull")}
            />
          </div>

          <OutcomeSensitivity
            scenarios={scenarios}
            selectedScenario={selectedScenario}
            bullBearRange={bullBearRange}
            overviewOptions={overviewOptions}
            dilution={dilution}
            overviewExerciseCost={overviewExerciseCost}
            onSelect={(key) => {
              setSelectedScenario(key);
              setSelectedFlow("proceeds");
            }}
          />
        </section>

        {/* =====================================================
            WORKSPACE
        ===================================================== */}

        <section className="mt-16">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionIntro
              eyebrow="YOUR PRO WORKSPACE"
              title="Every layer of your equity decision."
              description="Open any module without losing the context created elsewhere in the connected model."
            />

            <div className="shrink-0 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.13em] text-blue-600 shadow-sm">
              9 CONNECTED MODULES
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(37,99,235,0.10)]"
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-100/70 opacity-0 blur-3xl transition group-hover:opacity-100" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                        <Icon size={19} />
                      </div>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                        {module.badge}
                      </span>
                    </div>

                    <p className="mt-5 text-[9px] font-black tracking-[0.12em] text-blue-600">
                      {module.number} · {module.eyebrow}
                    </p>

                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                      {module.title}
                    </h3>

                    <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-600">
                      {module.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs font-black text-blue-600">
                        Open module
                      </span>

                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:translate-x-1 group-hover:bg-blue-600 group-hover:text-white">
                        <ChevronRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section className="relative mt-16 overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-7 shadow-[0_24px_70px_rgba(37,99,235,0.08)] sm:p-9 lg:p-11">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-100/80 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                FROM SOURCE OF TRUTH TO COMPLETE OFFER INTELLIGENCE
              </p>

              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Confirm the grant. Build the model. Compare the offer. Then make the decision.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Your confirmed equity profile now flows through vesting,
                dilution, Exercise Intelligence, future outcomes, tax,
                comparison and reporting — while Offer Intelligence adds the
                surrounding cash, employment terms and competing offer trade-offs.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/pro/exercise"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.20)] transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Open Exercise
                <ArrowUpRight size={16} />
              </Link>

              <Link
                href="/pro/offers"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-900"
              >
                Offer Intelligence
                <Scale size={16} />
              </Link>

              <Link
                href="/pro/reports"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                View Reports
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-7 flex flex-col justify-between gap-2 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row">
          <span>
            ESOP Value Clarity · Connected equity decision workspace
          </span>

          <span>
            Estimates and modeled scenarios are educational and are not
            financial, tax or investment advice.
          </span>
        </footer>
      </div>

      {/* =====================================================
          MOTION
      ===================================================== */}

      <style jsx global>{`
        @keyframes evc-value-enter {
          from {
            opacity: 0;
            transform: translateY(7px) scale(0.992);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes evc-live-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.22);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
          }
        }

        @keyframes evc-flow-line {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        @keyframes evc-flow-dot {
          0% {
            left: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: calc(100% - 8px);
            opacity: 0;
          }
        }

        @keyframes evc-node-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.65;
          }
          50% {
            transform: scale(1.45);
            opacity: 1;
          }
        }

        @keyframes evc-offer-energy {
          0% {
            transform: translateX(-18px);
            opacity: 0;
          }
          18% {
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          100% {
            transform: translateX(54px);
            opacity: 0;
          }
        }

        @keyframes evc-orbit {
          0% {
            transform: translate(-50%, -50%) scale(0.82) rotate(0deg);
            opacity: 0.35;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.18) rotate(180deg);
            opacity: 0.12;
          }
        }

        .evc-value-enter {
          animation: evc-value-enter 280ms ease-out both;
        }

        .evc-live-dot {
          animation: evc-live-pulse 1.9s ease-in-out infinite;
        }

        .evc-flow-animated {
          background-size: 200% 100%;
          animation: evc-flow-line 1.8s linear infinite;
        }

        .evc-flow-moving-dot {
          animation: evc-flow-dot 2.15s linear infinite;
        }

        .evc-node-pulse {
          animation: evc-node-pulse 2s ease-in-out infinite;
        }

        .evc-offer-energy {
          animation: evc-offer-energy 2.2s linear infinite;
        }

        .evc-orbit-ring {
          animation: evc-orbit 3.2s ease-in-out infinite alternate;
        }

        .evc-orbit-delay {
          animation-delay: -1.4s;
        }

        .evc-offer-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        html {
          scroll-behavior: smooth;
        }

        @media (prefers-reduced-motion: reduce) {
          .evc-value-enter,
          .evc-live-dot,
          .evc-flow-animated,
          .evc-flow-moving-dot,
          .evc-node-pulse,
          .evc-offer-energy,
          .evc-orbit-ring {
            animation: none !important;
          }

          html {
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function Badge({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
      {icon}
      {children}
    </span>
  );
}

function SectionIntro({
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
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 max-w-4xl text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
        {title}
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function HeroProof({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <p className="text-xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold text-slate-500">
        {label}
      </p>
    </div>
  );
}

function InteractiveFlowNode({
  label,
  value,
  caption,
  active,
  color,
  emphasized = false,
  onClick,
}: {
  label: string;
  value: string;
  caption: string;
  active: boolean;
  color: string;
  emphasized?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
        active
          ? "border-blue-300 ring-2 ring-blue-100"
          : emphasized
            ? "border-blue-200"
            : "border-slate-200"
      }`}
      style={
        active || emphasized
          ? {
              boxShadow: `0 16px 34px ${color}18`,
            }
          : undefined
      }
    >
      <span
        className="evc-node-pulse absolute right-3 top-3 h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />

      <p className="pr-5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-base font-black text-slate-950">
        {value}
      </p>

      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-[9px] text-slate-500">
          {caption}
        </p>

        <ChevronRight
          size={12}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
        />
      </div>
    </button>
  );
}

function AnimatedFlowConnector({
  color,
  delay,
}: {
  color: string;
  delay: string;
}) {
  return (
    <div className="hidden md:block md:w-[46px] md:shrink-0">
      <div className="relative h-2 overflow-hidden rounded-full bg-blue-50">
        <div
          className="evc-flow-animated absolute inset-0 rounded-full"
          style={{
            backgroundImage: `linear-gradient(90deg, transparent, ${color}, #38bdf8, ${color}, transparent)`,
          }}
        />

        <span
          className="evc-flow-moving-dot absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(37,99,235,0.5)] ring-2 ring-blue-500"
          style={{
            animationDelay: delay,
          }}
        />
      </div>
    </div>
  );
}

function ClickableMetric({
  label,
  value,
  active,
  onClick,
  negative = false,
  accent,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
  negative?: boolean;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-slate-200"
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-base font-black ${
          negative ? "text-rose-600" : "text-slate-950"
        }`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </button>
  );
}

function PhaseSelector({
  number,
  title,
  subtitle,
  active,
  complete,
  onClick,
}: {
  number: string;
  title: string;
  subtitle: string;
  active: boolean;
  complete: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-[22px] border p-4 text-left transition-all ${
        active
          ? "border-blue-200 bg-blue-50 shadow-[0_16px_36px_rgba(37,99,235,0.08)]"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
          active
            ? "bg-blue-600 text-white"
            : "bg-blue-50 text-blue-600"
        }`}
      >
        {number}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-slate-950">
            {title}
          </p>

          {complete && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check size={11} />
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      <ChevronRight
        size={16}
        className={`transition ${
          active
            ? "translate-x-0.5 text-blue-600"
            : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-blue-600"
        }`}
      />
    </button>
  );
}

function CompactRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-xs font-black text-slate-950">
        {value}
      </span>
    </div>
  );
}

function HorizontalJourney({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_34px_1fr_34px_1fr_34px_1fr] md:items-center">
      {children}
    </div>
  );
}

function JourneyStep({
  number,
  label,
  caption,
  complete,
  strong = false,
}: {
  number: string;
  label: string;
  caption: string;
  complete: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        strong
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-400">
          {number}
        </span>

        {complete && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check size={11} />
          </span>
        )}
      </div>

      <p className="mt-3 text-[9px] font-black tracking-[0.1em] text-slate-900">
        {label}
      </p>

      <p className="mt-1 text-[9px] text-slate-500">
        {caption}
      </p>
    </div>
  );
}

function JourneyConnector({
  complete,
}: {
  complete: boolean;
}) {
  return (
    <div className="hidden md:block">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
        {complete && (
          <>
            <div className="evc-flow-animated absolute inset-0 bg-gradient-to-r from-emerald-300 via-blue-500 to-emerald-300" />
            <span className="evc-flow-moving-dot absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white ring-2 ring-blue-500" />
          </>
        )}
      </div>
    </div>
  );
}

function JourneyLink({
  href,
  label,
  value,
  icon,
  strong = false,
}: {
  href: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-4 transition hover:-translate-y-1 hover:shadow-md ${
        strong
          ? "border-violet-200 bg-violet-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          strong
            ? "bg-violet-600 text-white"
            : "bg-white text-blue-600"
        }`}
      >
        {icon}
      </div>

      <p className="mt-3 text-[9px] font-black tracking-[0.1em] text-slate-900">
        {label}
      </p>

      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="truncate text-[9px] text-slate-500">
          {value}
        </p>

        <ChevronRight
          size={11}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
        />
      </div>
    </Link>
  );
}

function DecisionMiniCard({
  href,
  icon,
  label,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600">
        {icon}
      </div>

      <p className="mt-3 text-[9px] font-black tracking-[0.1em] text-blue-600">
        {label}
      </p>

      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-[10px] text-slate-500">
          {text}
        </p>

        <ChevronRight
          size={12}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
        />
      </div>
    </Link>
  );
}

function DataPoint({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/50">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function DecisionMetric({
  eyebrow,
  value,
  caption,
  dark = false,
}: {
  eyebrow: string;
  value: string;
  caption: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
        dark
          ? "border-slate-900 bg-slate-950 text-white"
          : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      <p
        className={`text-[9px] font-black uppercase tracking-[0.13em] ${
          dark ? "text-violet-300" : "text-slate-400"
        }`}
      >
        {eyebrow}
      </p>

      <p className="mt-3 text-2xl font-black">
        {value}
      </p>

      <p
        className={`mt-2 text-xs ${
          dark ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {caption}
      </p>
    </div>
  );
}

function ExerciseFlowNode({
  label,
  value,
  caption,
  strong = false,
}: {
  label: string;
  value: string;
  caption: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
        strong
          ? "border-violet-300 bg-violet-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <span className="evc-node-pulse absolute right-3 top-3 h-2 w-2 rounded-full bg-violet-500" />

      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-base font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-[9px] text-slate-500">
        {caption}
      </p>
    </div>
  );
}

function LinkedModelNode({
  href,
  icon,
  label,
  caption,
  strong = false,
  green = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  caption: string;
  strong?: boolean;
  green?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-2xl border p-4 text-center transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
        green
          ? "border-emerald-200 bg-emerald-50"
          : strong
            ? "border-blue-200 bg-blue-50/80"
            : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl transition group-hover:scale-105 ${
          green
            ? "bg-emerald-600 text-white"
            : strong
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-3 text-[10px] font-black tracking-[0.13em] ${
          green
            ? "text-emerald-700"
            : strong
              ? "text-blue-700"
              : "text-slate-700"
        }`}
      >
        {label}
      </p>

      <p className="mt-1 text-[9px] text-slate-400">
        {caption}
      </p>

      <p className="mt-2 text-[8px] font-black text-blue-600 opacity-0 transition group-hover:opacity-100">
        OPEN MODULE →
      </p>
    </Link>
  );
}

function VerticalConnector() {
  return (
    <div className="relative mx-auto my-3 h-10 w-px bg-gradient-to-b from-blue-100 via-blue-400 to-blue-100">
      <span className="evc-node-pulse absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.35)]" />
    </div>
  );
}

function ScenarioMapNode({
  label,
  value,
  icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "amber" | "blue" | "emerald";
  active: boolean;
  onClick: () => void;
}) {
  const toneClasses =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:translate-y-0 ${toneClasses} ${
        active
          ? "ring-2 ring-blue-200 ring-offset-2 shadow-[0_12px_28px_rgba(37,99,235,0.08)]"
          : ""
      }`}
    >
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
        {icon}
      </div>

      <p className="mt-3 text-[10px] font-black tracking-[0.13em]">
        {label}
      </p>

      <p className="mt-1 text-xs font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-[9px] opacity-70">
        {active ? "Active scenario" : "Click to switch"}
      </p>
    </button>
  );
}

function OutcomeSensitivity({
  scenarios,
  selectedScenario,
  bullBearRange,
  overviewOptions,
  dilution,
  overviewExerciseCost,
  onSelect,
}: {
  scenarios: Record<ScenarioKey, ScenarioResult>;
  selectedScenario: ScenarioKey;
  bullBearRange: number;
  overviewOptions: number;
  dilution: number;
  overviewExerciseCost: number;
  onSelect: (key: ScenarioKey) => void;
}) {
  const active = scenarios[selectedScenario];
  const bullVsBear =
    scenarios.bear.proceeds > 0
      ? scenarios.bull.proceeds / scenarios.bear.proceeds
      : 0;

  return (
    <div className="mt-5 overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950 p-5 text-white shadow-[0_26px_70px_rgba(15,23,42,0.18)] sm:p-7 lg:p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="evc-live-dot h-2 w-2 rounded-full bg-blue-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">
              OUTCOME SENSITIVITY
            </p>
          </div>
          <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            See exactly what changes from Bear to Bull.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            The grant, dilution and exercise-capital basis stay fixed here.
            Click an outcome to see how a different company exit valuation changes
            your modeled proceeds and return.
          </p>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-[330px]">
          <SensitivityMetric label="BEAR → BULL SWING" value={formatCurrency(bullBearRange)} />
          <SensitivityMetric
            label="BULL VS BEAR"
            value={bullVsBear > 0 ? `${bullVsBear.toFixed(2)}×` : "—"}
            accent="#6ee7b7"
          />
        </div>
      </div>

      <div className="relative mt-8">
  <div className="relative grid gap-3 md:grid-cols-3">
          {(["bear", "base", "bull"] as ScenarioKey[]).map((key) => {
            const item = scenarios[key];
            const isActive = selectedScenario === key;
            const Icon =
              key === "bear" ? TrendingDown : key === "bull" ? TrendingUp : BarChart3;

            return (
              <button
                key={`sensitivity-${key}`}
                type="button"
                onClick={() => onSelect(key)}
                className={`group relative rounded-[22px] border p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
                  isActive
                    ? "border-blue-400/70 bg-white/[0.09] shadow-[0_18px_45px_rgba(37,99,235,0.16)] ring-1 ring-blue-400/30"
                    : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-[9px] font-black uppercase tracking-[0.14em]"
                      style={{ color: item.color }}
                    >
                      {item.label}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">{item.eyebrow}</p>
                  </div>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"
                    style={{ color: item.color }}
                  >
                    <Icon size={16} />
                  </span>
                </div>

                <p className="mt-5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Modeled proceeds
                </p>
                <p className="mt-1 text-2xl font-black tracking-tight">
                  {formatCurrency(item.proceeds)}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-[8px] font-bold text-slate-500">Exit valuation</p>
                    <p className="mt-1 text-xs font-black text-slate-200">
                      {formatCurrency(item.exitValuation)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-slate-500">Modeled return</p>
                    <p className="mt-1 text-xs font-black" style={{ color: item.color }}>
                      {formatMultiple(item.multiple)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${
                      isActive ? "bg-blue-500/15 text-blue-300" : "bg-white/[0.04] text-slate-500"
                    }`}
                  >
                    {isActive ? "LIVE OUTCOME" : "CLICK TO MODEL"}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`transition ${
                      isActive
                        ? "translate-x-0.5 text-blue-300"
                        : "text-slate-600 group-hover:translate-x-0.5 group-hover:text-white"
                    }`}
                  />
                </div>

                {isActive && (
                  <span
                    className="absolute inset-x-5 bottom-0 h-0.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={`sensitivity-summary-${selectedScenario}`}
        className="evc-value-enter mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 sm:p-5"
      >
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p
              className="text-[9px] font-black uppercase tracking-[0.13em]"
              style={{ color: active.color }}
            >
              {active.label} IS FLOWING THROUGH THE MODEL
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-2xl font-black">{formatCurrency(active.proceeds)}</span>
              <span className="text-xs font-black text-slate-400">potential proceeds</span>
            </div>
            <p className="mt-2 max-w-xl text-[11px] leading-5 text-slate-500">
              This outcome uses the same {formatNumber(overviewOptions)} options,{" "}
              {formatPercentage(dilution)} relative dilution and{" "}
              {formatCurrency(overviewExerciseCost)} exercise capital. Only the
              modeled exit valuation changes across these three scenarios.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <SensitivityMetric label="EXIT" value={formatCurrency(active.exitValuation)} />
            <SensitivityMetric label="GROSS" value={formatCurrency(active.grossValue)} />
            <SensitivityMetric
              label="RETURN"
              value={formatMultiple(active.multiple)}
              accent={active.color}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
        <p className="text-[10px] leading-5 text-slate-500">
          Need the full side-by-side economics? Compare keeps Bear, Base and Bull
          aligned to this same connected model.
        </p>
        <Link
          href="/pro/compare"
          className="inline-flex shrink-0 items-center gap-2 text-[10px] font-black text-blue-300 transition hover:text-white"
        >
          Open Compare <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}

function OfferFlowNode({
  label,
  value,
  caption,
  strong = false,
}: {
  label: string;
  value: string;
  caption: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-4 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
        strong
          ? "border-fuchsia-300 bg-fuchsia-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <span className="evc-node-pulse absolute right-3 top-3 h-2 w-2 rounded-full bg-fuchsia-500" />
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[9px] text-slate-500">{caption}</p>
    </div>
  );
}

function OfferPipelineCard({
  eyebrow,
  title,
  caption,
  icon,
}: {
  eyebrow: string;
  title: string;
  caption: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href="/pro/offers"
      className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.045] p-5 transition duration-300 hover:-translate-y-1 hover:border-fuchsia-400/30 hover:bg-white/[0.07]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-fuchsia-300 transition group-hover:scale-105">
        {icon}
      </div>
      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.14em] text-fuchsia-300">
        {eyebrow}
      </p>
      <p className="mt-2 text-xl font-black text-white">{title}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-400">{caption}</p>
      <p className="mt-4 flex items-center gap-1 text-[9px] font-black text-blue-300">
        OPEN WORKSPACE
        <ChevronRight size={12} className="transition group-hover:translate-x-1" />
      </p>
    </Link>
  );
}

function OfferEnergyConnector({ delay }: { delay: string }) {
  return (
    <div className="relative hidden h-12 overflow-hidden lg:block">
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent" />
      <span
        className="evc-offer-energy absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(217,70,239,0.95)] ring-2 ring-fuchsia-400"
        style={{ animationDelay: delay }}
      />
    </div>
  );
}

function OfferSignalCard({
  label,
  text,
  icon,
  strong = false,
}: {
  label: string;
  text: string;
  icon: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={`group rounded-[22px] border p-4 transition duration-300 hover:-translate-y-1 ${
        strong
          ? "border-fuchsia-400/30 bg-fuchsia-500/10"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          strong
            ? "bg-fuchsia-500 text-white"
            : "bg-white/[0.06] text-blue-300"
        }`}
      >
        {icon}
      </div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.13em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-[10px] leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function SensitivityMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-3">
      <p className="text-[7px] font-black uppercase tracking-[0.11em] text-slate-600">
        {label}
      </p>
      <p
        className="mt-1 truncate text-[10px] font-black text-slate-200 sm:text-xs"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function ScenarioCard({
  title,
  eyebrow,
  result,
  active,
  tone,
  onClick,
}: {
  title: string;
  eyebrow: string;
  result: ScenarioResult;
  active: boolean;
  tone: "amber" | "blue" | "emerald";
  onClick: () => void;
}) {
  const dark = active && tone === "blue";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[28px] border p-6 text-left transition hover:-translate-y-1 hover:shadow-xl ${
        dark
          ? "border-slate-950 bg-slate-950 text-white"
          : active
            ? "border-blue-300 bg-blue-50"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[10px] font-black tracking-[0.14em] ${
              tone === "amber"
                ? "text-amber-600"
                : tone === "emerald"
                  ? "text-emerald-600"
                  : "text-blue-500"
            }`}
          >
            {title}
          </p>

          <p
            className={`mt-1 text-sm ${
              dark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {eyebrow}
          </p>
        </div>

        {active && (
          <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[8px] font-black text-white">
            ACTIVE
          </span>
        )}
      </div>

      <p
        className={`mt-7 text-[9px] font-black uppercase tracking-[0.12em] ${
          dark ? "text-slate-500" : "text-slate-400"
        }`}
      >
        Modeled proceeds
      </p>

      <p className="mt-2 text-3xl font-black">
        {formatCurrency(result.proceeds)}
      </p>

      <div
        className={`mt-6 border-t pt-5 ${
          dark ? "border-white/10" : "border-slate-100"
        }`}
      >
        <div className="flex justify-between gap-4">
          <div>
            <p
              className={`text-[9px] font-bold ${
                dark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Exit valuation
            </p>

            <p className="mt-1 text-sm font-black">
              {formatCurrency(result.exitValuation)}
            </p>
          </div>

          <div className="text-right">
            <p
              className={`text-[9px] font-bold ${
                dark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Return
            </p>

            <p className="mt-1 text-sm font-black">
              {formatMultiple(result.multiple)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100/20">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width:
              tone === "amber"
                ? "30%"
                : tone === "blue"
                  ? "58%"
                  : "100%",
            backgroundColor: result.color,
          }}
        />
      </div>
    </button>
  );
}
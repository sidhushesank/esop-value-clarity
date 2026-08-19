"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Calculator,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  GitBranch,
  Layers3,
  PieChart,
  ReceiptIndianRupee,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

type ScenarioKey = "bear" | "base" | "bull";
type JourneyKey = "model" | "vesting" | "ownership" | "scenario" | "decision";
type TermKey =
  | "options"
  | "vested"
  | "exercisePrice"
  | "exerciseCost"
  | "ownership"
  | "dilution"
  | "postDilution"
  | "exitValuation"
  | "grossEquity"
  | "proceeds"
  | "multiple"
  | "scenarios";

type ScenarioTheme = {
  label: string;
  eyebrow: string;
  companyExit: string;
  proceeds: string;
  multiple: string;
  ownership: string;
  vested: string;
  exercise: string;
  grossEquity: string;
  color: string;
  soft: string;
  border: string;
  text: string;
  width: string;
  description: string;
};

const scenarioDemo: Record<ScenarioKey, ScenarioTheme> = {
  bear: {
    label: "BEAR",
    eyebrow: "Lower-growth outcome",
    companyExit: "₹390 Cr",
    proceeds: "₹15,81,250",
    multiple: "12.65×",
    ownership: "0.44%",
    vested: "6,250",
    exercise: "₹1,25,000",
    grossEquity: "₹17,06,250",
    color: "#f59e0b",
    soft: "#fffbeb",
    border: "#fde68a",
    text: "#b45309",
    width: "34%",
    description: "A conservative case that helps you see the downside range before making an equity decision.",
  },
  base: {
    label: "BASE",
    eyebrow: "Current assumption",
    companyExit: "₹780 Cr",
    proceeds: "₹32,87,500",
    multiple: "26.3×",
    ownership: "0.44%",
    vested: "6,250",
    exercise: "₹1,25,000",
    grossEquity: "₹34,12,500",
    color: "#2563eb",
    soft: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    width: "64%",
    description: "The current modeled case using the assumptions already shared across the ESOP workspace.",
  },
  bull: {
    label: "BULL",
    eyebrow: "Strong-growth outcome",
    companyExit: "₹1,560 Cr",
    proceeds: "₹67,00,000",
    multiple: "53.6×",
    ownership: "0.44%",
    vested: "6,250",
    exercise: "₹1,25,000",
    grossEquity: "₹68,25,000",
    color: "#059669",
    soft: "#ecfdf5",
    border: "#a7f3d0",
    text: "#047857",
    width: "94%",
    description: "A higher-upside case showing how stronger company growth can expand the value of the same ownership stake.",
  },
};

const journeySteps: Array<{
  key: JourneyKey;
  number: string;
  title: string;
  short: string;
  eyebrow: string;
  description: string;
  inputs: string[];
  outputs: string[];
  next: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  {
    key: "model",
    number: "01",
    title: "Build the model",
    short: "Start with the Simulator",
    eyebrow: "CORE MODEL SOURCE",
    description:
      "Enter the grant and company assumptions once. ESOP Value Clarity treats those values as the starting point for the rest of the workspace instead of recreating them page by page.",
    inputs: ["Total options", "Exercise price", "Company shares", "Current valuation"],
    outputs: ["Shared equity position", "Common assumptions", "Scenario-ready model"],
    next: "Vesting, Dilution and Exit can now use the same underlying model.",
    href: "/pro/simulator",
    icon: Calculator,
  },
  {
    key: "vesting",
    number: "02",
    title: "Know what is actually vested",
    short: "Vesting changes the relevant option position",
    eyebrow: "VESTING LAYER",
    description:
      "Vesting determines how much of the grant is relevant today. When vested options change, the exercise cost, ownership calculations and scenario outcomes that depend on them should move with it.",
    inputs: ["Total options", "Vesting schedule", "Vested options"],
    outputs: ["Vesting %", "Relevant options", "Exercise-cost basis"],
    next: "Vested options flow into ownership and exercise-cost calculations.",
    href: "/pro/vesting",
    icon: Clock3,
  },
  {
    key: "ownership",
    number: "03",
    title: "Translate options into ownership",
    short: "See dilution before the exit",
    eyebrow: "OWNERSHIP LAYER",
    description:
      "Option count alone does not tell you what the grant may be worth. The model turns vested options into ownership, then applies future dilution to show the effective post-dilution stake.",
    inputs: ["Vested options", "Company shares", "Future dilution"],
    outputs: ["Current ownership", "Post-dilution stake", "Future value basis"],
    next: "The dilution-adjusted stake becomes the ownership basis for future scenarios.",
    href: "/pro/dilution",
    icon: PieChart,
  },
  {
    key: "scenario",
    number: "04",
    title: "Stress-test the outcome",
    short: "Bear, Base and Bull stay synchronized",
    eyebrow: "SCENARIO ENGINE",
    description:
      "Exit valuation drives the future company outcome. The same Bear, Base and Bull results should power the scenario view, Compare and Reports so the product behaves like one connected decision system.",
    inputs: ["Post-dilution ownership", "Exit valuation", "Exercise cost"],
    outputs: ["Gross equity", "Modeled proceeds", "Return multiple"],
    next: "Compare the range instead of relying on one single future value.",
    href: "/pro/exit",
    icon: BarChart3,
  },
  {
    key: "decision",
    number: "05",
    title: "Turn the model into a decision",
    short: "Compare, Tax and Reports",
    eyebrow: "DECISION LAYER",
    description:
      "The final workspace modules consume the same underlying model. Compare shows scenario differences, Tax applies the relevant tax layer, and Reports turns the connected results into a decision-ready summary and export.",
    inputs: ["Scenario outputs", "Tax assumptions", "Shared model"],
    outputs: ["Scenario comparison", "Tax/value implications", "Decision report"],
    next: "Export the same connected model results you see inside the product.",
    href: "/pro/reports",
    icon: Target,
  },
];

const tools = [
  {
    href: "/pro/simulator",
    icon: Calculator,
    number: "01",
    title: "Simulator",
    badge: "Start here",
    description:
      "Create the shared ESOP model with grant, exercise, ownership, dilution and valuation assumptions.",
    micro: "Core input layer",
  },
  {
    href: "/pro/vesting",
    icon: Clock3,
    number: "02",
    title: "Vesting",
    badge: "Ownership",
    description:
      "See how many options are vested and how that changes the exercisable position feeding the model.",
    micro: "Vested-option layer",
  },
  {
    href: "/pro/dilution",
    icon: GitBranch,
    number: "03",
    title: "Dilution",
    badge: "Ownership",
    description:
      "Understand how future fundraising can reduce effective ownership without changing the option count itself.",
    micro: "Post-dilution stake",
  },
  {
    href: "/pro/exit",
    icon: Trophy,
    number: "04",
    title: "Exit",
    badge: "Outcome",
    description:
      "Model future company outcomes and see how exit valuation changes gross equity and potential proceeds.",
    micro: "Future-value layer",
  },
  {
    href: "/pro/tax",
    icon: ReceiptIndianRupee,
    number: "05",
    title: "Tax",
    badge: "India",
    description:
      "Apply the relevant tax layer to exercise and exit values without recreating the core ESOP assumptions.",
    micro: "Tax calculation layer",
  },
  {
    href: "/pro/compare",
    icon: Scale,
    number: "06",
    title: "Compare",
    badge: "Decision",
    description:
      "Compare Bear, Base and Bull outcomes using the same ownership, cost and scenario model used elsewhere.",
    micro: "Scenario comparison",
  },
  {
    href: "/pro/reports",
    icon: FileText,
    number: "07",
    title: "Reports",
    badge: "Decision",
    description:
      "Turn the connected model into an equity snapshot, outcome range, decision summary and CSV/XLS export.",
    micro: "Final presentation layer",
  },
];

const terms: Record<
  TermKey,
  {
    label: string;
    category: string;
    definition: string;
    why: string;
    formula?: string;
  }
> = {
  options: {
    label: "Total options",
    category: "Grant",
    definition: "The total number of ESOPs/options included in the grant before considering vesting.",
    why: "It is the headline grant size, but it is not the same as the amount currently vested or exercisable.",
  },
  vested: {
    label: "Vested options",
    category: "Vesting",
    definition: "The portion of the grant that has vested under the vesting schedule.",
    why: "These options feed the relevant ownership and exercise-cost calculations in the connected model.",
  },
  exercisePrice: {
    label: "Exercise price",
    category: "Cost",
    definition: "The strike price you generally pay per option when exercising vested options.",
    why: "A lower or higher exercise price changes the capital required to exercise the same vested grant.",
  },
  exerciseCost: {
    label: "Exercise cost",
    category: "Cost",
    definition: "The modeled capital required to exercise the vested/relevant options.",
    why: "This cost is deducted when the product models potential net proceeds.",
    formula: "Vested options × Exercise price",
  },
  ownership: {
    label: "Current ownership",
    category: "Ownership",
    definition:
      "The modeled percentage of the company represented by the vested/relevant option position before future dilution.",
    why: "Ownership percentage, not only option count, is what connects the grant to company valuation.",
  },
  dilution: {
    label: "Future dilution",
    category: "Ownership",
    definition: "A modeled reduction in effective ownership caused by future fundraising or share creation.",
    why: "Dilution does not simply remove options. It reduces the percentage of the company those options represent.",
  },
  postDilution: {
    label: "Post-dilution ownership",
    category: "Ownership",
    definition: "The effective modeled ownership after applying the future dilution assumption.",
    why: "This is the ownership basis used for future equity value and scenario proceeds in the model.",
  },
  exitValuation: {
    label: "Exit valuation",
    category: "Outcome",
    definition: "The future company valuation used to model a potential liquidity or exit outcome.",
    why: "Changing the exit valuation changes gross equity value, modeled proceeds and the return multiple.",
  },
  grossEquity: {
    label: "Gross equity value",
    category: "Outcome",
    definition:
      "The modeled value of the dilution-adjusted ownership at a selected company exit valuation before relevant costs.",
    why: "It connects the ownership percentage to the future company value before exercise-cost impact.",
  },
  proceeds: {
    label: "Modeled proceeds",
    category: "Outcome",
    definition:
      "The modeled amount remaining after the product applies the relevant cost assumptions to gross equity value.",
    why: "It is the value the Reports and Compare layers use when presenting Bear, Base and Bull outcomes.",
  },
  multiple: {
    label: "Return multiple",
    category: "Decision",
    definition:
      "A simple model ratio comparing potential proceeds with the exercise capital in the current analysis.",
    why: "It helps communicate the scale of a modeled outcome relative to the capital required to exercise.",
    formula: "Modeled proceeds ÷ Exercise cost",
  },
  scenarios: {
    label: "Bear / Base / Bull",
    category: "Decision",
    definition:
      "Three synchronized outcome scenarios that stress-test the same underlying ESOP model at different exit assumptions.",
    why: "They provide a range rather than presenting a single future value as if it were certain.",
  },
};

const termOrder = Object.keys(terms) as TermKey[];

export default function ProDashboardPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>("base");
  const [selectedJourney, setSelectedJourney] = useState<JourneyKey>("model");
  const [selectedTerm, setSelectedTerm] = useState<TermKey>("exerciseCost");
  const [mobileTermsOpen, setMobileTermsOpen] = useState(false);

  const scenario = scenarioDemo[selectedScenario];
  const journey = useMemo(
    () => journeySteps.find((item) => item.key === selectedJourney) ?? journeySteps[0],
    [selectedJourney]
  );
  const term = terms[selectedTerm];

  return (
    <main className="min-h-screen bg-[#f7faff] text-slate-950">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 md:px-8 md:py-8">
        {/* =========================================================
            BRIGHT FINTECH HERO
        ========================================================= */}
        <section className="evc-home-hero-light relative overflow-hidden rounded-[36px] border border-blue-100 bg-white shadow-[0_28px_90px_rgba(37,99,235,0.10)]">
          <div className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-blue-100/80 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-48 left-[28%] h-[430px] w-[430px] rounded-full bg-cyan-100/70 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />

          <div className="relative grid gap-5 p-4 sm:p-6 lg:grid-cols-12 lg:p-8">
            <div className="evc-home-hero-copy-light flex min-h-[610px] flex-col justify-between rounded-[30px] border border-blue-100 bg-white/90 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.06)] backdrop-blur sm:p-8 lg:col-span-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                    <Sparkles size={13} />
                    ESOP VALUE CLARITY
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[10px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]" />
                    Connected model
                  </span>
                </div>

                <p className="mt-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Equity decision infrastructure
                </p>

                <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[4rem] lg:leading-[0.98]">
                  Understand your ESOPs
                  <span className="mt-2 block bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                    like a fintech portfolio.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                  Start with one ESOP model, then follow the same numbers through vesting,
                  dilution, exit scenarios, tax, comparison and a decision-ready report.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <HeroProof value="1" label="Shared model" />
                  <HeroProof value="3" label="Outcome scenarios" />
                  <HeroProof value="7" label="Connected modules" />
                </div>
              </div>

              <div className="mt-10 border-t border-slate-100 pt-6">
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/pro/simulator"
                    className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
                  >
                    Start with Simulator
                    <ArrowUpRight
                      size={16}
                      className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>

                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:translate-y-0"
                  >
                    See how it works
                    <ChevronRight size={16} />
                  </a>
                </div>

                <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  One source of truth for the assumptions used across your ESOP workspace.
                </div>
              </div>
            </div>

            {/* LIVE BRIGHT FLOW */}
            <div className="evc-home-terminal-light min-w-0 rounded-[30px] border border-blue-100 bg-white/95 p-5 shadow-[0_20px_60px_rgba(37,99,235,0.07)] backdrop-blur sm:p-6 lg:col-span-7 lg:p-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="evc-live-dot h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-blue-600">
                      Live product walkthrough
                    </p>
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    Watch one model flow into three outcomes.
                  </h2>
                  <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
                    Switch the example scenario. The flow, exit value, proceeds and return change together.
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                    {scenario.label} OUTCOME
                  </p>
                  <p
                    key={`${selectedScenario}-hero-value`}
                    className="evc-value-enter mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
                  >
                    {scenario.proceeds}
                  </p>
                  <p className="mt-1 text-xs font-black" style={{ color: scenario.text }}>
                    {scenario.multiple} modeled return
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                {(Object.keys(scenarioDemo) as ScenarioKey[]).map((key) => {
                  const option = scenarioDemo[key];
                  const active = selectedScenario === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedScenario(key)}
                      className={`relative rounded-xl px-3 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
                        active
                          ? "bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200"
                          : "hover:bg-white/80"
                      }`}
                    >
                      <span
                        className="text-[10px] font-black tracking-[0.13em]"
                        style={{ color: active ? option.text : "#94a3b8" }}
                      >
                        {option.label}
                      </span>
                      <p className="mt-1 truncate text-xs font-black text-slate-800 sm:text-sm">
                        {option.proceeds}
                      </p>
                      {active && (
                        <span
                          className="absolute inset-x-3 bottom-0 h-0.5 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <LiveEquityFlow scenarioKey={selectedScenario} scenario={scenario} />
            </div>
          </div>
        </section>

        {/* =========================================================
            BRIGHT PRINCIPLES
        ========================================================= */}
        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <PrincipleCard
            icon={<Layers3 size={18} />}
            eyebrow="ONE MODEL"
            title="Enter assumptions once"
            text="Simulator values become the shared starting point instead of duplicated inputs across every module."
          />
          <PrincipleCard
            icon={<GitBranch size={18} />}
            eyebrow="CONNECTED LOGIC"
            title="Changes flow downstream"
            text="Vesting, dilution and exit assumptions feed the ownership and scenario layers that depend on them."
          />
          <PrincipleCard
            icon={<Target size={18} />}
            eyebrow="DECISION LAYER"
            title="Compare before you decide"
            text="Bear, Base and Bull outcomes stay aligned across Compare and Reports so the range is easier to understand."
          />
        </section>

        {/* =========================================================
            HOW IT WORKS
        ========================================================= */}
        <section id="how-it-works" className="mt-16 scroll-mt-24">
          <SectionIntro
            eyebrow="HOW ESOP VALUE CLARITY WORKS"
            title="From grant letter to decision-ready model."
            description="The product is designed as one connected ESOP workflow. Start at the model, follow the dependencies, then inspect the range before making a decision."
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-12">
            <div className="space-y-2 lg:col-span-5">
              {journeySteps.map((step) => {
                const Icon = step.icon;
                const active = selectedJourney === step.key;

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setSelectedJourney(step.key)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.995] ${
                      active
                        ? "border-blue-200 bg-blue-50 text-slate-950 shadow-[0_16px_36px_rgba(37,99,235,0.08)]"
                        : "border-slate-200 bg-white text-slate-950 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                        active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black tracking-[0.13em] ${active ? "text-blue-600" : "text-slate-400"}`}>
                          {step.number}
                        </span>
                        <p className="truncate text-sm font-black">{step.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{step.short}</p>
                    </div>

                    <ChevronRight
                      size={16}
                      className={`shrink-0 transition ${
                        active
                          ? "translate-x-0.5 text-blue-600"
                          : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-blue-600"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="evc-how-panel-light relative overflow-hidden rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_22px_65px_rgba(37,99,235,0.07)] sm:p-8 lg:col-span-7">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
              <div className="relative">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                      {journey.eyebrow}
                    </p>
                    <h3
                      key={`${selectedJourney}-title`}
                      className="evc-value-enter mt-3 max-w-xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
                    >
                      {journey.title}
                    </h3>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-sm font-black text-blue-700">
                    {journey.number}
                  </span>
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{journey.description}</p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <InfoBucket title="Inputs / dependencies" items={journey.inputs} />
                  <InfoBucket title="What this produces" items={journey.outputs} />
                </div>

                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                      <ArrowUpRight size={15} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                        What happens next
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{journey.next}</p>
                    </div>
                    <Link
                      href={journey.href}
                      className="hidden shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-50 sm:inline-flex"
                    >
                      Open
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            LIVE CONNECTED MODEL MAP
        ========================================================= */}
        <section className="mt-16">
          <SectionIntro
            eyebrow="ONE CONNECTED SYSTEM"
            title="See the dependency chain, not seven isolated calculators."
            description="The same assumptions continue through the modules that depend on them. The animated connectors below make that flow visible."
          />

          <div className="evc-model-map-light relative mt-7 overflow-hidden rounded-[32px] border border-blue-100 bg-white p-5 shadow-[0_24px_70px_rgba(37,99,235,0.07)] sm:p-7 md:p-9">
            <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[680px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(219,234,254,0.75),transparent_62%)]" />

            <div className="relative mx-auto max-w-6xl">
              <ModelNode
                icon={<Calculator size={17} />}
                label="SIMULATOR MODEL"
                caption="Grant + company assumptions"
                strong
              />

              <VerticalConnector />

              <div className="grid gap-3 sm:grid-cols-3">
                <ModelNode icon={<Clock3 size={17} />} label="VESTING" caption="What is vested" />
                <ModelNode icon={<GitBranch size={17} />} label="DILUTION" caption="Effective ownership" />
                <ModelNode icon={<Trophy size={17} />} label="EXIT" caption="Future company outcome" />
              </div>

              <VerticalConnector />

              <div className="grid gap-3 sm:grid-cols-2">
                <ModelNode
                  icon={<PieChart size={17} />}
                  label="OWNERSHIP MODEL"
                  caption="Current → post-dilution stake"
                  strong
                />
                <ModelNode
                  icon={<CircleDollarSign size={17} />}
                  label="EXERCISE COST"
                  caption="Vested options × exercise price"
                  strong
                />
              </div>

              <VerticalConnector />

              <ModelNode
                icon={<BarChart3 size={17} />}
                label="SCENARIO ENGINE"
                caption="The same model branches into three synchronized outcomes"
                strong
              />

              <VerticalConnector />

              <div className="grid gap-3 sm:grid-cols-3">
                <ScenarioMapNode
                  label="BEAR"
                  icon={<TrendingDown size={17} />}
                  tone="amber"
                  active={selectedScenario === "bear"}
                  onClick={() => setSelectedScenario("bear")}
                />
                <ScenarioMapNode
                  label="BASE"
                  icon={<BarChart3 size={17} />}
                  tone="blue"
                  active={selectedScenario === "base"}
                  onClick={() => setSelectedScenario("base")}
                />
                <ScenarioMapNode
                  label="BULL"
                  icon={<TrendingUp size={17} />}
                  tone="emerald"
                  active={selectedScenario === "bull"}
                  onClick={() => setSelectedScenario("bull")}
                />
              </div>

              <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                      Selected scenario flowing downstream
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {scenario.label} · {scenario.proceeds} · {scenario.multiple} return
                    </p>
                  </div>
                  <span
                    className="inline-flex w-fit rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em]"
                    style={{ color: scenario.text, borderColor: scenario.border, backgroundColor: scenario.soft }}
                  >
                    Live selection
                  </span>
                </div>
              </div>

              <VerticalConnector />

              <div className="grid gap-3 sm:grid-cols-3">
                <ModelNode icon={<Scale size={17} />} label="COMPARE" caption="Inspect the range" />
                <ModelNode icon={<ReceiptIndianRupee size={17} />} label="TAX" caption="Apply tax assumptions" />
                <ModelNode icon={<FileText size={17} />} label="REPORTS" caption="Decision + export layer" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            TOOLKIT
        ========================================================= */}
        <section className="mt-16">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionIntro
              eyebrow="YOUR PRO WORKSPACE"
              title="Seven modules. One equity model."
              description="Open the module you need without losing the context created elsewhere in the workflow."
            />
            <div className="shrink-0 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.13em] text-blue-600 shadow-sm">
              7 connected modules
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool, index) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(37,99,235,0.10)] active:translate-y-0 ${
                    index === 0 ? "xl:col-span-2" : ""
                  }`}
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-100/70 opacity-0 blur-3xl transition group-hover:opacity-100" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                          <Icon size={19} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black tracking-[0.12em] text-slate-400">{tool.number}</p>
                          <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-600">
                            {tool.micro}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                        {tool.badge}
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">{tool.title}</h3>
                    <p className="mt-2 min-h-[48px] max-w-xl text-sm leading-6 text-slate-600">{tool.description}</p>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs font-black text-blue-600">Open module</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:translate-x-0.5 group-hover:bg-blue-600 group-hover:text-white">
                        <ChevronRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            TERMS / GLOSSARY
        ========================================================= */}
        <section className="mt-16">
          <SectionIntro
            eyebrow="ESOP TERMS, IN CONTEXT"
            title="Know what the numbers actually mean."
            description="Use the glossary as a product guide. The definitions below explain how these terms connect inside the current ESOP Value Clarity model."
          />

          <div className="mt-7 grid gap-5 lg:grid-cols-12">
            <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm lg:col-span-5">
              <button
                type="button"
                onClick={() => setMobileTermsOpen((value) => !value)}
                className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left lg:hidden"
              >
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-600">Selected term</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{term.label}</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition ${mobileTermsOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div className={`${mobileTermsOpen ? "mt-2 block" : "hidden"} space-y-1 lg:block`}>
                {termOrder.map((key) => {
                  const item = terms[key];
                  const active = selectedTerm === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedTerm(key);
                        setMobileTermsOpen(false);
                      }}
                      className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition duration-150 ${
                        active ? "bg-blue-50 text-slate-950 ring-1 ring-blue-100" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-[9px] font-black uppercase tracking-[0.12em] ${active ? "text-blue-600" : "text-slate-400"}`}>
                          {item.category}
                        </p>
                        <p className="mt-1 truncate text-sm font-bold">{item.label}</p>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`shrink-0 transition ${
                          active
                            ? "translate-x-0.5 text-blue-600"
                            : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-blue-600"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="evc-term-panel-light relative overflow-hidden rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_22px_65px_rgba(37,99,235,0.07)] sm:p-8 lg:col-span-7">
              <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-100/80 blur-3xl" />
              <div key={selectedTerm} className="evc-value-enter relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] text-blue-700">
                      {term.category}
                    </span>
                    <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{term.label}</h3>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                    <Sparkles size={18} />
                  </div>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <TermBlock label="What it means" text={term.definition} />
                  <TermBlock label="Why it matters" text={term.why} />
                </div>

                {term.formula && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-emerald-700">
                      Simple model relationship
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">{term.formula}</p>
                  </div>
                )}

                <p className="mt-6 text-[10px] leading-5 text-slate-400">
                  These descriptions explain how the term is used inside the current ESOP Value Clarity product model. A modeled result is not a guaranteed payout or individualized financial advice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            FINAL CTA
        ========================================================= */}
        <section className="evc-final-cta-light relative mt-16 overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-7 shadow-[0_24px_70px_rgba(37,99,235,0.08)] sm:p-9 lg:p-11">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-100/80 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-[35%] h-72 w-72 rounded-full bg-cyan-100/80 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                START WITH THE SOURCE OF TRUTH
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Build the model once. Then see what every assumption changes.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Start in Simulator, then move through vesting, dilution, exit scenarios, tax, comparison and Reports without treating each module as a separate calculator.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/pro/simulator"
                className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.20)] transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
              >
                Open Simulator
                <ArrowUpRight
                  size={16}
                  className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
              <Link
                href="/pro/reports"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:translate-y-0"
              >
                View Reports
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-7 flex flex-col justify-between gap-2 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row">
          <span>ESOP Value Clarity · Connected equity decision workspace</span>
          <span>Estimates and AI insights may be inaccurate. ESOP Value Clarity is
    for educational purposes, not financial, tax or investment advice.</span>
        </footer>
      </div>

      {/* =========================================================
          PAGE-SCOPED BRIGHT THEME + MOTION
      ========================================================= */}
      <style jsx global>{`
        section.evc-home-hero-light,
        .evc-home-hero-copy-light,
        .evc-home-terminal-light,
        .evc-how-panel-light,
        .evc-model-map-light,
        .evc-term-panel-light {
          color: #0f172a !important;
        }

        section.evc-home-hero-light {
          background: linear-gradient(135deg, #ffffff 0%, #f8fbff 48%, #eef6ff 100%) !important;
        }

        section.evc-home-hero-light .evc-home-hero-copy-light,
        section.evc-home-hero-light .evc-home-terminal-light,
        .evc-how-panel-light,
        .evc-model-map-light,
        .evc-term-panel-light {
          background-color: rgba(255, 255, 255, 0.96) !important;
        }

        @keyframes evc-home-value {
          from { opacity: 0; transform: translateY(6px) scale(0.992); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes evc-live-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.22); }
          50% { box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
        }

        @keyframes evc-flow-line {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        @keyframes evc-flow-dot {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: calc(100% - 8px); opacity: 0; }
        }

        @keyframes evc-model-pulse-light {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.35); opacity: 1; }
        }

        .evc-value-enter {
          animation: evc-home-value 260ms ease-out both;
        }

        .evc-live-dot {
          animation: evc-live-pulse 1.9s ease-in-out infinite;
        }

        .evc-flow-animated-light {
          background-size: 200% 100%;
          animation: evc-flow-line 1.8s linear infinite;
        }

        .evc-flow-moving-dot {
          animation: evc-flow-dot 2.15s linear infinite;
        }

        .evc-model-pulse-light {
          animation: evc-model-pulse-light 2s ease-in-out infinite;
        }

        html {
          scroll-behavior: smooth;
        }

        @media (prefers-reduced-motion: reduce) {
          .evc-value-enter,
          .evc-live-dot,
          .evc-flow-animated-light,
          .evc-flow-moving-dot,
          .evc-model-pulse-light {
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

function LiveEquityFlow({
  scenarioKey,
  scenario,
}: {
  scenarioKey: ScenarioKey;
  scenario: ScenarioTheme;
}) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-[26px] border border-blue-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-4 sm:p-5">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-size:28px_28px] [background-image:linear-gradient(rgba(37,99,235,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.035)_1px,transparent_1px)]" />

      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="evc-live-dot h-2 w-2 rounded-full" style={{ backgroundColor: scenario.color }} />
            <p className="text-xs font-black text-slate-900">Live equity flow</p>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">
            Illustrative demo values only. Your workspace continues to use its own shared model values.
          </p>
        </div>
        <span
          className="inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em]"
          style={{ color: scenario.text, borderColor: scenario.border, backgroundColor: scenario.soft }}
        >
          {scenario.eyebrow}
        </span>
      </div>

      <div className="relative mt-6 grid gap-3 md:grid-cols-[1fr_42px_1fr_42px_1fr_42px_1.18fr] md:items-center">
        <FlowNodeLight
          label="VESTED OPTIONS"
          value={scenario.vested}
          caption="Grant becomes relevant"
          color={scenario.color}
        />
        <FlowConnectorLight color={scenario.color} delay="0s" />
        <FlowNodeLight
          label="POST-DILUTION STAKE"
          value={scenario.ownership}
          caption="Ownership basis"
          color={scenario.color}
        />
        <FlowConnectorLight color={scenario.color} delay="0.35s" />
        <FlowNodeLight
          label="EXIT VALUATION"
          value={scenario.companyExit}
          caption={`${scenario.label} scenario input`}
          color={scenario.color}
        />
        <FlowConnectorLight color={scenario.color} delay="0.7s" />
        <FlowNodeLight
          label="MODELED PROCEEDS"
          value={scenario.proceeds}
          caption="After exercise capital"
          color={scenario.color}
          emphasized
        />
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
        <MiniFlowMetric label="Gross equity" value={scenario.grossEquity} />
        <MiniFlowMetric label="Exercise capital" value={scenario.exercise} negative />
        <MiniFlowMetric label="Modeled return" value={scenario.multiple} accent={scenario.text} />
      </div>

      <div className="relative mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Outcome intensity</p>
            <p key={`${scenarioKey}-desc`} className="evc-value-enter mt-1 text-sm font-black text-slate-900">
              {scenario.description}
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Scenario</p>
            <p className="mt-1 text-sm font-black" style={{ color: scenario.text }}>
              {scenario.label}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: scenario.width,
              background: `linear-gradient(90deg, ${scenario.color}, #38bdf8)`,
              boxShadow: `0 0 18px ${scenario.color}28`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function HeroProof({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <p className="text-xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[10px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function FlowNodeLight({
  label,
  value,
  caption,
  color,
  emphasized = false,
}: {
  label: string;
  value: string;
  caption: string;
  color: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        emphasized ? "border-blue-200 ring-1 ring-blue-100" : "border-slate-200"
      }`}
      style={emphasized ? { boxShadow: `0 16px 34px ${color}16` } : undefined}
    >
      <span
        className="evc-model-pulse-light absolute right-3 top-3 h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <p className="pr-5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 truncate text-base font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[9px] text-slate-500">{caption}</p>
    </div>
  );
}

function FlowConnectorLight({ color, delay }: { color: string; delay: string }) {
  return (
    <div className="hidden md:block md:w-[42px] md:shrink-0">
      <div className="relative h-2 overflow-hidden rounded-full bg-blue-50">
        <div
          className="evc-flow-animated-light absolute inset-0 rounded-full"
          style={{
            backgroundImage: `linear-gradient(90deg, transparent, ${color}, #38bdf8, ${color}, transparent)`,
          }}
        />
        <span
          className="evc-flow-moving-dot absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(37,99,235,0.5)] ring-2 ring-blue-500"
          style={{ animationDelay: delay }}
        />
      </div>
    </div>
  );
}

function MiniFlowMetric({
  label,
  value,
  negative = false,
  accent,
}: {
  label: string;
  value: string;
  negative?: boolean;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p
        className={`mt-2 text-base font-black ${negative ? "text-rose-600" : "text-slate-950"}`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function PrincipleCard({
  icon,
  eyebrow,
  title,
  text,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(37,99,235,0.08)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        {icon}
      </div>
      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">{eyebrow}</p>
      <h3 className="mt-2 text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
    </div>
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
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
      <h2 className="mt-2 max-w-4xl text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function InfoBucket({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={11} />
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelNode({
  icon,
  label,
  caption,
  strong = false,
}: {
  icon: React.ReactNode;
  label: string;
  caption: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        strong
          ? "border-blue-200 bg-blue-50/80 shadow-[0_12px_28px_rgba(37,99,235,0.05)]"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ${strong ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"}`}>
        {icon}
      </div>
      <p className={`mt-3 text-[10px] font-black tracking-[0.13em] ${strong ? "text-blue-700" : "text-slate-700"}`}>
        {label}
      </p>
      <p className="mt-1 text-[9px] text-slate-400">{caption}</p>
    </div>
  );
}

function VerticalConnector() {
  return (
    <div className="relative mx-auto my-3 h-9 w-px bg-gradient-to-b from-blue-100 via-blue-400 to-blue-100">
      <span className="evc-model-pulse-light absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.35)]" />
    </div>
  );
}

function ScenarioMapNode({
  label,
  icon,
  tone,
  active,
  onClick,
}: {
  label: string;
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
      className={`rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${toneClasses} ${
        active ? "ring-2 ring-offset-2 ring-blue-200 shadow-[0_12px_28px_rgba(37,99,235,0.08)]" : ""
      }`}
    >
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">{icon}</div>
      <p className="mt-3 text-[10px] font-black tracking-[0.13em]">{label}</p>
      <p className="mt-1 text-[9px] opacity-70">Click to switch scenario</p>
    </button>
  );
}

function TermBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/sections/Footer";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileSearch2,
  FileText,
  Fingerprint,
  GitCompareArrows,
  Landmark,
  Layers3,
  LineChart,
  LockKeyhole,
  PieChart,
  Radar,
  ReceiptIndianRupee,
  ScanLine,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";

const INITIAL_CHART = [28, 31, 35, 33, 40, 44, 42, 49, 53, 51, 58, 66];

const productRail = [
  {
    number: "01",
    icon: Calculator,
    title: "Model",
    detail: "Grant → ownership → value",
  },
  {
    number: "02",
    icon: Clock3,
    title: "Vest",
    detail: "Time → vested position",
  },
  {
    number: "03",
    icon: Layers3,
    title: "Dilution",
    detail: "Funding → ownership impact",
  },
  {
    number: "04",
    icon: LineChart,
    title: "Exit",
    detail: "Valuation → scenarios",
  },
  {
    number: "05",
    icon: ReceiptIndianRupee,
    title: "Tax",
    detail: "Estimate → take-home",
  },
  {
    number: "06",
    icon: GitCompareArrows,
    title: "Compare",
    detail: "Scenario → trade-off",
  },
  {
    number: "07",
    icon: FileText,
    title: "Report",
    detail: "Analysis → decision output",
  },
];

const trustCards = [
  {
    icon: Radar,
    eyebrow: "SCENARIO-FIRST",
    title: "Possibilities, not predictions.",
    description: "Explore a range instead of one shiny number.",
    detail:
      "Startup equity changes with valuation, dilution, vesting, exercise cost, tax and liquidity. ESOP Value Clarity keeps those assumptions visible instead of pretending there is one guaranteed future.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "EXPLAINABLE",
    title: "Assumptions stay visible.",
    description: "Know what moved the result and why.",
    detail:
      "The product is designed around connected inputs and transparent outputs, so you can trace the financial story from grant terms through ownership, scenarios and decision outputs.",
  },
  {
    icon: GitCompareArrows,
    eyebrow: "DECISION SUPPORT",
    title: "Compare the trade-offs.",
    description: "Cash reality stays separate from equity opportunity.",
    detail:
      "PRO analysis and Offer Intelligence help compare scenarios and employment offers without treating speculative equity economics as guaranteed salary.",
  },
];

const intelligenceLayers = [
  {
    number: "01",
    icon: Calculator,
    label: "GRANT",
    title: "Start with what you actually received",
    description:
      "Model option count, strike price, valuation and the core terms that define your starting equity position.",
  },
  {
    number: "02",
    icon: Clock3,
    label: "VESTING",
    title: "Know what is actually yours",
    description:
      "See vested and unvested equity and understand how time changes the position that matters today.",
  },
  {
    number: "03",
    icon: PieChart,
    label: "OWNERSHIP",
    title: "Translate options into ownership",
    description:
      "Move beyond option count and understand the ownership percentage behind the grant.",
  },
  {
    number: "04",
    icon: Layers3,
    label: "DILUTION",
    title: "Stress-test future ownership",
    description:
      "Explore how future funding and changing share counts can affect your effective stake.",
  },
  {
    number: "05",
    icon: BarChart3,
    label: "SCENARIOS",
    title: "Explore different futures",
    description:
      "Compare Bear, Base and Bull outcomes instead of treating one exit valuation as the answer.",
  },
  {
    number: "06",
    icon: Target,
    label: "DECISION",
    title: "Turn the model into a decision",
    description:
      "Bring exercise cost, tax, comparison, reports and saved analyses into one connected workflow.",
  },
];

const faqs = [
  {
    question: "Is ESOP Value Clarity an ESOP valuation service?",
    answer:
      "No. ESOP Value Clarity is an employee-focused decision-support product. It helps you model scenarios and understand how assumptions can affect potential outcomes; it does not provide an official company valuation.",
  },
  {
    question: "Does the product predict what my startup will become?",
    answer:
      "No. The product is built around scenarios over false certainty. You choose or review assumptions and explore what the equity could look like if the future resembles those assumptions.",
  },
  {
    question: "What can I model?",
    answer:
      "The product connects grant size, vesting, ownership, dilution, exercise cost, exit scenarios, estimated tax, comparisons, reports and saved history. PRO adds deeper connected analysis and Offer Intelligence.",
  },
  {
    question: "What is Offer Intelligence?",
    answer:
      "Offer Intelligence is a PRO workflow for reviewing an employment offer and comparing confirmed cash and equity terms side by side. It is designed to keep guaranteed compensation separate from equity opportunity and surface vesting, dilution and exercise-risk differences.",
  },
  {
    question: "Are the results guaranteed?",
    answer:
      "No. Results are educational estimates and decision-support outputs, not financial, tax or legal advice. Actual outcomes depend on future company performance, financing, liquidity, taxes and the terms that ultimately apply.",
  },
  {
    question: "What is the difference between Free and Pro?",
    answer:
      "Free gives employees a useful starting point for understanding equity. PRO provides deeper connected modeling, decision intelligence, saved workspaces and advanced capabilities such as Offer Intelligence.",
  },
];

function createChartData(values: number[]) {
  const width = 600;
  const height = 260;
  const padding = 18;
  const min = Math.min(...values) - 6;
  const max = Math.max(...values) + 8;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y =
      height -
      padding -
      ((value - min) / (max - min)) * (height - padding * 2);

    return { x, y, value };
  });

  const linePath = points
    .map((point, index) =>
      index === 0
        ? `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
        : `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");

  return {
    points,
    linePath,
    areaPath: `${linePath} L ${width} ${height} L 0 ${height} Z`,
  };
}

function formatIndianCompact(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export default function HomePage() {
  const [chartValues, setChartValues] = useState(INITIAL_CHART);
  const [seconds, setSeconds] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeTrustCard, setActiveTrustCard] = useState(0);
  const [activeLayer, setActiveLayer] = useState(0);
  const [offerPulse, setOfferPulse] = useState(0);
  const [cursor, setCursor] = useState({ x: 50, y: 42 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      setSeconds((value) => value + 1);

      setChartValues((current) => {
        const previousValue = current[current.length - 1];
        const movement = Math.floor(Math.random() * 5) - 1;
        const nextValue = Math.max(previousValue + movement, previousValue - 1);
        return [...current.slice(1), nextValue];
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setActiveLayer((value) => (value + 1) % intelligenceLayers.length);
    }, 2600);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setOfferPulse((value) => (value + 1) % 4);
    }, 1900);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  const chart = useMemo(() => createChartData(chartValues), [chartValues]);
  const selectedIndex = hoveredIndex ?? chart.points.length - 1;
  const selectedPoint = chart.points[selectedIndex];
  const selectedValue = (8.75 + selectedPoint.value * 0.07).toFixed(2);
  const selectedGrowth = (
    ((selectedPoint.value / chart.points[0].value - 1) * 100) /
    10
  ).toFixed(2);

  const liveValue = (12.8 + seconds * 0.03).toFixed(2);
  const liveGrowth = (4 + seconds * 0.01).toFixed(2);

  const scenarioValues = useMemo(() => {
    const base = 1877000 + seconds * 1800;
    return {
      bear: base * 0.58,
      base,
      bull: base * 1.72,
    };
  }, [seconds]);

  function handleChartMove(event: MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const percentage = Math.min(Math.max(pointerX / bounds.width, 0), 1);
    const index = Math.round(percentage * (chart.points.length - 1));
    setHoveredIndex(index);
  }

  function handleHeroMove(event: MouseEvent<HTMLElement>) {
    if (reducedMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setCursor({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  }

  return (
    <main className="overflow-hidden bg-[#f7f9fc] text-slate-950">
      {/* =========================================================
          HERO — FINTECH DECISION TERMINAL
      ========================================================= */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMove}
        className="relative overflow-hidden border-b border-slate-200/70 bg-[#f7f9fc]"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80 transition-[background] duration-300"
          style={{
            background: `radial-gradient(720px circle at ${cursor.x}% ${cursor.y}%, rgba(37,99,235,0.13), transparent 58%)`,
          }}
        />
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.36]" />
        <div className="pointer-events-none absolute -left-40 top-10 h-[32rem] w-[32rem] rounded-full bg-cyan-200/30 blur-[130px]" />
        <div className="pointer-events-none absolute right-[-12rem] top-[-8rem] h-[40rem] w-[40rem] rounded-full bg-blue-300/25 blur-[150px]" />

        <div className="relative mx-auto grid max-w-[1480px] gap-14 px-6 pb-20 pt-20 md:pb-28 md:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-sm backdrop-blur-xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Employee-first equity decision intelligence
            </div>

            <h1 className="mt-8 max-w-3xl text-[3.45rem] font-black leading-[0.96] tracking-[-0.065em] text-[#07111f] sm:text-6xl md:text-7xl lg:text-[5.3rem]">
              Your equity is
              <span className="relative mt-2 block text-blue-600">
                not one number.
                <span className="absolute -bottom-2 left-0 h-[3px] w-32 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
              </span>
            </h1>

            <p className="mt-9 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              Model what you received, understand what you own, stress-test
              dilution and exit scenarios, estimate the decision economics and
              compare complete offers without hiding uncertainty behind a
              headline value.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/simulator">
                <Button
                  size="lg"
                  className="group h-13 rounded-xl bg-[#07111f] px-6 text-base font-black text-white shadow-[0_16px_38px_rgba(7,17,31,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Explore your equity
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <a
                href="#intelligence-system"
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-6 text-base font-bold text-slate-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
              >
                See the decision system
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              <HeroProof
                icon={<Radar className="h-4 w-4" />}
                label="Scenario-first"
                value="No false certainty"
              />
              <HeroProof
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Explainable"
                value="Assumptions visible"
              />
              <HeroProof
                icon={<GitCompareArrows className="h-4 w-4" />}
                label="Offer Intelligence"
                value="Cash ≠ equity"
              />
            </div>
          </div>

          {/* Preserve the graph visualisation, upgrade only the surrounding terminal */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-blue-300/30 via-cyan-200/20 to-violet-300/20 blur-3xl" />

            <div className="evc-terminal-float relative rounded-[30px] border border-slate-200/90 bg-white/90 p-3 shadow-[0_38px_100px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-4 px-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                  <Fingerprint className="h-3.5 w-3.5 text-blue-500" />
                  Scenario terminal
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[22px] bg-[#07111f] p-5 text-white md:p-7">
                <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-40" />
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px]" />

                <div className="relative flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-400">Scenario value at exit</p>
                      <span className="flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                        Live model
                      </span>
                    </div>

                    <p className="mt-2 text-4xl font-black tracking-[-0.04em] md:text-5xl">
                      ₹{liveValue}L
                    </p>

                    <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                      <TrendingUp className="h-4 w-4" />
                      {liveGrowth}× modeled multiple
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      Active scenario
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">Expected case</p>
                  </div>
                </div>

                <div className="relative mt-9 h-52 border-b border-l border-white/10 md:h-60">
                  <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-white/10" />
                  <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-white/10" />
                  <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-white/10" />

                  {hoveredIndex !== null && (
                    <div
                      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-2xl backdrop-blur"
                      style={{
                        left: `${(selectedPoint.x / 600) * 100}%`,
                        top: `${(selectedPoint.y / 260) * 100}%`,
                      }}
                    >
                      <p className="text-slate-400">Projected value</p>
                      <p className="mt-1 font-bold text-white">₹{selectedValue}L</p>
                      <p className="mt-1 text-emerald-300">+{selectedGrowth}% growth</p>
                    </div>
                  )}

                  <svg
                    viewBox="0 0 600 260"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full cursor-crosshair overflow-visible"
                    aria-label="Interactive live projected ESOP value chart"
                    onMouseMove={handleChartMove}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <defs>
                      <linearGradient id="liveChartFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.42" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>

                      <linearGradient id="liveChartLine" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#93c5fd" />
                      </linearGradient>
                    </defs>

                    <path d={chart.areaPath} fill="url(#liveChartFill)" />

                    <path
                      d={chart.linePath}
                      fill="none"
                      stroke="url(#liveChartLine)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="5"
                      style={{ transition: "d 700ms ease-in-out" }}
                    />

                    {hoveredIndex !== null && (
                      <>
                        <line
                          x1={selectedPoint.x}
                          x2={selectedPoint.x}
                          y1="0"
                          y2="260"
                          stroke="#93c5fd"
                          strokeDasharray="5 7"
                          strokeOpacity="0.55"
                        />
                        <circle
                          cx={selectedPoint.x}
                          cy={selectedPoint.y}
                          r="9"
                          fill="#dbeafe"
                          stroke="#2563eb"
                          strokeWidth="5"
                        />
                      </>
                    )}

                    {hoveredIndex === null && (
                      <circle
                        cx={chart.points[chart.points.length - 1].x}
                        cy={chart.points[chart.points.length - 1].y}
                        r="8"
                        fill="#dbeafe"
                        stroke="#2563eb"
                        strokeWidth="5"
                      />
                    )}
                  </svg>

                  <div className="absolute bottom-[-28px] left-0 flex w-full justify-between text-[11px] font-semibold text-slate-500">
                    <span>Grant</span>
                    <span>Today</span>
                    <span>Series A</span>
                    <span>Series B</span>
                    <span>Exit</span>
                  </div>
                </div>

                <div className="relative mt-12 grid grid-cols-3 gap-3">
                  {[
                    ["Vested", "72%", Clock3],
                    ["Dilution", "18.6%", Layers3],
                    ["Ownership", "0.08%", PieChart],
                  ].map(([label, value, Icon]) => {
                    const IconComponent = Icon as typeof Clock3;
                    return (
                      <div
                        key={String(label)}
                        className="group rounded-xl border border-white/10 bg-white/[0.05] p-3 transition hover:bg-white/[0.08]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                            {String(label)}
                          </p>
                          <IconComponent className="h-3.5 w-3.5 text-blue-300" />
                        </div>
                        <p className="mt-1 text-sm font-bold text-white">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="relative mt-3 flex items-center justify-between rounded-xl border border-blue-400/15 bg-blue-400/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-300" />
                    <span className="text-[11px] font-semibold text-slate-300">
                      Assumptions synchronized across the scenario
                    </span>
                  </div>
                  <span className="hidden text-[10px] font-black uppercase tracking-[0.12em] text-blue-300 sm:block">
                    Decision layer ready
                  </span>
                </div>
              </div>
            </div>

            <div className="evc-float-card absolute -left-6 top-24 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur xl:block">
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                Model state
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-black text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </p>
            </div>

            <div className="evc-float-card evc-float-delay absolute -right-7 bottom-28 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur xl:block">
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                Scenario range
              </p>
              <p className="mt-1 text-xs font-black text-slate-950">Bear → Bull</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRODUCT RAIL
      ========================================================= */}
      <section className="relative z-20 -mt-6">
        <div className="mx-auto max-w-[1480px] px-6">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#07111f] p-2 shadow-[0_24px_70px_rgba(7,17,31,0.18)]">
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-7">
              {productRail.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.number}
                    className="group relative rounded-[18px] border border-transparent p-4 transition duration-300 hover:border-white/10 hover:bg-white/[0.06]"
                  >
                    {index < productRail.length - 1 && (
                      <span className="pointer-events-none absolute -right-1 top-1/2 hidden h-px w-2 bg-blue-400/50 lg:block" />
                    )}
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg border border-blue-400/15 bg-blue-400/10 text-blue-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-300">
                        {item.number}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-black text-white">{item.title}</p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PHILOSOPHY / TRUST
      ========================================================= */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 md:py-28">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
              THE PRODUCT PHILOSOPHY
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-[-0.045em] text-[#07111f] md:text-5xl">
              Clarity before certainty.
            </h2>
          </div>
          <p className="max-w-3xl text-lg leading-8 text-slate-600">
            Startup equity is inherently uncertain. The useful question is not
            only “what is it worth?” but “what could it mean under different
            futures — and what changes that outcome?”
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {trustCards.map((card, index) => {
            const Icon = card.icon;
            const isActive = activeTrustCard === index;

            return (
              <button
                key={card.title}
                type="button"
                onMouseEnter={() => setActiveTrustCard(index)}
                onFocus={() => setActiveTrustCard(index)}
                onClick={() => setActiveTrustCard(index)}
                className={`group relative min-h-[270px] overflow-hidden rounded-[26px] border p-6 text-left transition duration-500 ${
                  isActive
                    ? "border-blue-500 bg-[#07111f] text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
                    : "border-slate-200 bg-white text-slate-950 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                }`}
              >
                <div
                  className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl transition ${
                    isActive ? "bg-blue-500/20" : "bg-blue-100/0"
                  }`}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl border ${
                      isActive
                        ? "border-blue-400/20 bg-blue-400/10 text-blue-300"
                        : "border-blue-100 bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <span
                    className={`text-[9px] font-black uppercase tracking-[0.15em] ${
                      isActive ? "text-blue-300" : "text-slate-400"
                    }`}
                  >
                    {card.eyebrow}
                  </span>
                </div>

                <h3 className="relative mt-8 text-2xl font-black tracking-tight">
                  {card.title}
                </h3>

                <p
                  className={`relative mt-4 text-sm leading-7 ${
                    isActive ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {isActive ? card.detail : card.description}
                </p>

                <div
                  className={`relative mt-7 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] ${
                    isActive ? "text-blue-300" : "text-blue-600"
                  }`}
                >
                  {isActive ? "Current principle" : "Inspect principle"}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          CONNECTED INTELLIGENCE SYSTEM
      ========================================================= */}
      <section
        id="intelligence-system"
        className="relative overflow-hidden border-y border-slate-200 bg-white py-24 md:py-32"
      >
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.28]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/50 blur-[130px]" />

        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
              CONNECTED EQUITY INTELLIGENCE
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#07111f] md:text-6xl">
              One financial story.
              <span className="block text-slate-400">Not disconnected calculators.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              The product follows the same equity position from grant terms to
              vesting, ownership, dilution, future scenarios and decision outputs.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="space-y-3">
              {intelligenceLayers.map((layer, index) => {
                const Icon = layer.icon;
                const active = activeLayer === index;

                return (
                  <button
                    key={layer.number}
                    type="button"
                    onMouseEnter={() => setActiveLayer(index)}
                    onFocus={() => setActiveLayer(index)}
                    onClick={() => setActiveLayer(index)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition duration-500 ${
                      active
                        ? "translate-x-2 border-blue-200 bg-blue-50 shadow-lg shadow-blue-100/60"
                        : "border-slate-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
                        active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
                          {layer.number} · {layer.label}
                        </span>
                        {active && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm font-black text-slate-950">
                        {layer.title}
                      </p>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 transition ${
                        active ? "translate-x-1 text-blue-600" : "text-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="relative min-h-[520px] overflow-hidden rounded-[30px] border border-slate-200 bg-[#07111f] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] sm:p-8">
              <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-50" />
              <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-blue-500/15 blur-[90px]" />

              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                      LIVE MODEL ROUTING
                    </p>
                    <p className="mt-2 text-xl font-black">
                      Grant → decision intelligence
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Layer {intelligenceLayers[activeLayer].number}/06
                  </span>
                </div>

                <div className="mt-8 rounded-[24px] border border-blue-400/20 bg-blue-400/[0.07] p-6">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_0_34px_rgba(37,99,235,0.35)]">
                      {(() => {
                        const ActiveIcon = intelligenceLayers[activeLayer].icon;
                        return <ActiveIcon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-300">
                        {intelligenceLayers[activeLayer].label} LAYER
                      </p>
                      <h3 className="mt-2 text-2xl font-black">
                        {intelligenceLayers[activeLayer].title}
                      </h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                        {intelligenceLayers[activeLayer].description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mt-7">
                  <div className="absolute left-[21px] top-4 h-[calc(100%-32px)] w-px bg-gradient-to-b from-blue-400/60 via-cyan-400/30 to-transparent" />
                  {[
                    ["Known terms", "Confirmed inputs and current assumptions"],
                    ["Connected model", "Ownership, dilution and economics stay synchronized"],
                    ["Decision output", "Scenario, comparison and report-ready result"],
                  ].map(([title, detail], index) => (
                    <div key={title} className="relative flex gap-4 pb-6 last:pb-0">
                      <div
                        className={`relative z-10 mt-1 h-11 w-11 shrink-0 rounded-full border p-[5px] ${
                          index <= Math.min(activeLayer, 2)
                            ? "border-blue-400/40 bg-blue-400/10"
                            : "border-white/10 bg-white/[0.04]"
                        }`}
                      >
                        <div
                          className={`grid h-full w-full place-items-center rounded-full ${
                            index <= Math.min(activeLayer, 2)
                              ? "bg-blue-500 text-white"
                              : "bg-white/[0.05] text-slate-500"
                          }`}
                        >
                          {index <= Math.min(activeLayer, 2) ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                        <p className="text-sm font-black text-white">{title}</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <MiniTerminalMetric label="OWNERSHIP" value="0.08%" />
                  <MiniTerminalMetric label="EXERCISE COST" value="₹2.50L" />
                  <MiniTerminalMetric label="MODEL STATE" value="SYNCED" accent />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SCENARIO RANGE
      ========================================================= */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
              SCENARIOS OVER FALSE CERTAINTY
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#07111f] md:text-5xl">
              Don&apos;t ask for one future.
              <span className="block text-slate-400">Explore the range.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Valuation can move. Dilution can happen. Vesting takes time.
              Exercise cost and taxes matter. Scenario analysis helps you see
              how those moving parts can change the financial picture.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Vesting",
                "Ownership",
                "Dilution",
                "Exercise cost",
                "Exit valuation",
                "Estimated tax",
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                  MODELED OUTCOME RANGE
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  Bear · Base · Bull
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Scenario engine live
              </div>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              <ScenarioCard
                icon={<TrendingDown className="h-4 w-4" />}
                label="BEAR"
                value={formatIndianCompact(scenarioValues.bear)}
                progress={38}
                caption="Downside case"
              />
              <ScenarioCard
                icon={<LineChart className="h-4 w-4" />}
                label="BASE"
                value={formatIndianCompact(scenarioValues.base)}
                progress={65}
                caption="Expected case"
                active
              />
              <ScenarioCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="BULL"
                value={formatIndianCompact(scenarioValues.bull)}
                progress={91}
                caption="Upside case"
              />
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-slate-950">Why the range moves</p>
                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-600">
                  assumptions visible
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <RangeDriver label="Exit valuation" value="Primary driver" />
                <RangeDriver label="Future dilution" value="Ownership impact" />
                <RangeDriver label="Exercise + tax" value="Cash impact" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          OFFER INTELLIGENCE
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#07111f] py-24 text-white md:py-32">
        <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">
                <FileSearch2 className="h-3.5 w-3.5" />
                PRO · OFFER INTELLIGENCE
              </div>
              <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] md:text-6xl">
                Compare the offer behind the CTC.
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Review employment terms, confirm what was actually offered and
                compare guaranteed cash, equity economics, vesting, dilution
                and exercise risk without pretending they are the same thing.
              </p>
            </div>

            <Link
              href="/pro/offers"
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#07111f] transition duration-300 hover:-translate-y-1"
            >
              Explore Offer Intelligence
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_76px_1.12fr_76px_1fr] lg:items-center">
            <OfferCard
              label="OFFER A"
              company="Northstar Technologies"
              fixed="₹24.0L"
              equity="30,000 ESOPs"
              active={offerPulse === 0}
            />

            <EnergyConnector active={offerPulse === 1} />

            <div
              className={`relative overflow-hidden rounded-[28px] border p-6 text-center transition duration-700 ${
                offerPulse === 2
                  ? "border-violet-400/50 bg-violet-500/10 shadow-[0_0_60px_rgba(139,92,246,0.15)]"
                  : "border-white/10 bg-white/[0.05]"
              }`}
            >
              <span className="evc-orbit pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/15" />
              <span className="evc-orbit evc-orbit-delay pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/15" />

              <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-[0_0_38px_rgba(139,92,246,0.28)]">
                <Scale className="h-6 w-6" />
              </div>
              <p className="relative mt-5 text-[9px] font-black uppercase tracking-[0.15em] text-violet-300">
                COMPARISON ENGINE
              </p>
              <p className="relative mt-2 text-xl font-black">Offer A vs Offer B</p>
              <p className="relative mt-2 text-[11px] leading-5 text-slate-400">
                Cash · Equity · Vesting · Dilution · Exercise risk
              </p>

              <div className="relative mt-5 grid grid-cols-3 gap-2">
                <OfferMetric label="CASH" value="Tie" />
                <OfferMetric label="EQUITY" value="B ↑" accent />
                <OfferMetric label="SIGNAL" value="B" accent />
              </div>
            </div>

            <EnergyConnector active={offerPulse === 3} />

            <OfferCard
              label="OFFER B"
              company="RocketAI"
              fixed="₹24.0L"
              equity="60,000 ESOPs"
              active={offerPulse === 3}
              accent
            />
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <DarkCapability
              icon={<CircleDollarSign className="h-4 w-4" />}
              title="Cash reality"
              text="Guaranteed, variable and one-time cash remain separate."
            />
            <DarkCapability
              icon={<TrendingUp className="h-4 w-4" />}
              title="Equity reality"
              text="Grant economics are compared without calling them salary."
            />
            <DarkCapability
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Terms & flexibility"
              text="Vesting and exercise windows stay visible in the decision."
            />
            <DarkCapability
              icon={<FileCheck2 className="h-4 w-4" />}
              title="Confirmed inputs"
              text="Important extracted terms are reviewed before comparison."
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          FREE → PRO
      ========================================================= */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 md:py-32">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-slate-100 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                  FREE
                </span>
                <WalletCards className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="mt-7 text-3xl font-black tracking-tight text-slate-950">
                Understand the problem first.
              </h3>
              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                A useful starting point for exploring your equity and seeing how
                assumptions can change the potential outcome.
              </p>
              <div className="mt-7 space-y-3">
                <PlanRow text="Core equity simulation" />
                <PlanRow text="Scenario exploration" />
                <PlanRow text="A clearer starting point than spreadsheets" />
              </div>
              <Link
                href="/simulator"
                className="group mt-8 inline-flex items-center gap-2 text-sm font-black text-slate-950"
              >
                Explore Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-blue-500/20 bg-gradient-to-br from-blue-600 via-blue-700 to-[#07111f] p-7 text-white shadow-[0_28px_80px_rgba(37,99,235,0.2)] sm:p-8">
            <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-35" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-[80px]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-blue-100">
                  PRO
                </span>
                <Sparkles className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="mt-7 text-3xl font-black tracking-tight">
                More power when the decision gets serious.
              </h3>
              <p className="mt-4 max-w-xl leading-7 text-blue-100/80">
                Deeper connected analysis for vesting, dilution, exercise,
                exit, tax, comparison, reporting and complete-offer decisions.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <PlanRow text="Connected PRO equity workspace" dark />
                <PlanRow text="Exercise Decision Intelligence" dark />
                <PlanRow text="Tax, comparison & reports" dark />
                <PlanRow text="Offer Intelligence" dark />
              </div>
              <Link
                href="/pricing"
                className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:-translate-y-0.5"
              >
                See PRO
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ
      ========================================================= */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1480px] gap-12 px-6 py-24 md:py-28 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
              PRODUCT CLARITY
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#07111f]">
              Equity is complicated.
              <span className="block text-slate-400">The product shouldn&apos;t be.</span>
            </h2>
            <p className="mt-5 max-w-md leading-7 text-slate-600">
              Straight answers about what ESOP Value Clarity does, what it does
              not do and how to interpret the scenarios.
            </p>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-[#f8fafc] px-6">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-b border-slate-200 py-5 last:border-none"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-black text-slate-950">
                  {faq.question}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-blue-600 transition duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-3xl pt-4 leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="mx-auto max-w-[1480px] px-6 py-24">
        <div className="relative overflow-hidden rounded-[34px] bg-[#07111f] px-6 py-16 text-white shadow-[0_30px_90px_rgba(7,17,31,0.2)] md:px-12 md:py-20">
          <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-45" />
          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-[110px]" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
                EQUITY DECISION SUPPORT FOR EMPLOYEES
              </p>
              <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.05em] md:text-6xl">
                Don&apos;t just know how many ESOPs you have.
                <span className="block text-blue-300">
                  Understand what they could actually mean.
                </span>
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
                Start with the equity model. Explore the possibilities. Upgrade
                when you need deeper decision intelligence.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/simulator">
                <Button
                  size="lg"
                  className="group h-12 w-full rounded-xl bg-white px-6 font-black text-[#07111f] hover:bg-blue-50"
                >
                  Explore the simulator
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-black text-white transition hover:bg-white/[0.09]"
              >
                Compare Free & PRO
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        @keyframes evcFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes evcFloatCard {
          0%,
          100% {
            transform: translateY(0px) rotate(-1deg);
          }
          50% {
            transform: translateY(-10px) rotate(1deg);
          }
        }

        @keyframes evcEnergy {
          0% {
            transform: translateX(-24px);
            opacity: 0;
          }
          18% {
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          100% {
            transform: translateX(68px);
            opacity: 0;
          }
        }

        @keyframes evcOrbit {
          0% {
            transform: translate(-50%, -50%) scale(0.82) rotate(0deg);
            opacity: 0.25;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
            opacity: 0.08;
          }
        }

        @keyframes evcScan {
          0% {
            transform: translateY(-16px);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(110px);
            opacity: 0;
          }
        }

        .evc-grid {
          background-image:
            linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: linear-gradient(to bottom, black, transparent 92%);
        }

        .evc-dark-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.028) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        .evc-terminal-float {
          animation: evcFloat 7s ease-in-out infinite;
        }

        .evc-float-card {
          animation: evcFloatCard 5.5s ease-in-out infinite;
        }

        .evc-float-delay {
          animation-delay: -2.3s;
        }

        .evc-energy {
          animation: evcEnergy 1.8s linear infinite;
        }

        .evc-orbit {
          animation: evcOrbit 3.2s ease-in-out infinite alternate;
        }

        .evc-orbit-delay {
          animation-delay: -1.4s;
        }

        .evc-scan-line {
          animation: evcScan 2.4s ease-in-out infinite;
        }

        html {
          scroll-behavior: smooth;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .evc-terminal-float,
          .evc-float-card,
          .evc-energy,
          .evc-orbit,
          .evc-scan-line {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function HeroProof({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-2 text-blue-600">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.13em]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-xs font-black text-slate-950">{value}</p>
    </div>
  );
}

function MiniTerminalMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent
          ? "border-emerald-400/15 bg-emerald-400/[0.07]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-xs font-black ${accent ? "text-emerald-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function ScenarioCard({
  icon,
  label,
  value,
  progress,
  caption,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  progress: number;
  caption: string;
  active?: boolean;
}) {
  return (
    <div
      className={`group rounded-[22px] border p-5 transition duration-500 hover:-translate-y-1 ${
        active
          ? "border-blue-200 bg-blue-50 shadow-lg shadow-blue-100/60"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            active ? "bg-blue-600 text-white" : "bg-white text-slate-500 shadow-sm"
          }`}
        >
          {icon}
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
          {label}
        </span>
      </div>

      <p className="mt-6 text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{caption}</p>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            active ? "bg-blue-600" : "bg-slate-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function RangeDriver({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-slate-950">{value}</p>
    </div>
  );
}

function OfferCard({
  label,
  company,
  fixed,
  equity,
  active,
  accent = false,
}: {
  label: string;
  company: string;
  fixed: string;
  equity: string;
  active: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[26px] border p-5 transition duration-700 ${
        active
          ? accent
            ? "border-violet-400/50 bg-violet-500/10 shadow-[0_0_55px_rgba(139,92,246,0.13)]"
            : "border-blue-400/40 bg-blue-500/[0.08] shadow-[0_0_55px_rgba(59,130,246,0.12)]"
          : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <div className="evc-scan-line pointer-events-none absolute left-4 right-4 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
            accent ? "bg-violet-500 text-white" : "bg-white text-[#07111f]"
          }`}
        >
          {label}
        </span>
        <FileCheck2 className={`h-4 w-4 ${active ? "text-emerald-300" : "text-slate-600"}`} />
      </div>
      <h3 className="mt-6 text-xl font-black">{company}</h3>
      <p className="mt-1 text-[11px] text-slate-500">Senior Software Engineer</p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <OfferMetric label="FIXED" value={fixed} />
        <OfferMetric label="EQUITY" value={equity} accent={accent} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.11em] text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Confirmed terms
      </div>
    </div>
  );
}

function OfferMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-xs font-black ${accent ? "text-violet-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function EnergyConnector({ active }: { active: boolean }) {
  return (
    <div className="relative hidden h-14 overflow-hidden lg:block">
      <div
        className={`absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent transition ${
          active ? "opacity-100" : "opacity-50"
        }`}
      />
      <span
        className={`evc-energy absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(96,165,250,0.95)] ring-2 ring-blue-400 ${
          active ? "opacity-100" : "opacity-30"
        }`}
      />
    </div>
  );
}

function DarkCapability({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-[22px] border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07]">
      <div className="grid h-9 w-9 place-items-center rounded-xl border border-blue-400/15 bg-blue-400/10 text-blue-300">
        {icon}
      </div>
      <p className="mt-4 text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function PlanRow({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
          dark ? "bg-white/10 text-cyan-200" : "bg-emerald-50 text-emerald-600"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className={`text-sm font-semibold ${dark ? "text-blue-50" : "text-slate-700"}`}>
        {text}
      </span>
    </div>
  );
}

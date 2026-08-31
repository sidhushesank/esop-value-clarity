"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/sections/Footer";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileSearch2,
  Fingerprint,
  GitCompareArrows,
  Layers3,
  LineChart,
  LockKeyhole,
  PieChart,
  Radar,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";

const journey = [
  {
    number: "01",
    label: "GRANT",
    title: "Start with the terms",
    description: "Options, strike price and the information you actually know.",
    icon: WalletCards,
  },
  {
    number: "02",
    label: "VESTING",
    title: "Understand what is earned",
    description: "Separate granted equity from the portion that is actually vested.",
    icon: Clock3,
  },
  {
    number: "03",
    label: "OWNERSHIP",
    title: "Translate options into a stake",
    description: "Move beyond option count and understand the ownership behind it.",
    icon: PieChart,
  },
  {
    number: "04",
    label: "DILUTION",
    title: "Stress-test the future",
    description: "See how funding and changing share counts can affect ownership.",
    icon: Layers3,
  },
  {
    number: "05",
    label: "EXERCISE",
    title: "Understand the cash decision",
    description: "Bring strike price and exercise cost into the financial picture.",
    icon: Calculator,
  },
  {
    number: "06",
    label: "OUTCOMES",
    title: "Explore scenarios",
    description: "Compare possible company outcomes instead of claiming one future.",
    icon: LineChart,
  },
  {
    number: "07",
    label: "DECISION",
    title: "Compare the trade-offs",
    description: "Turn the model into a clearer employee decision.",
    icon: Scale,
  },
];

const principles = [
  {
    icon: Radar,
    title: "Scenarios over predictions",
    description:
      "Private-company equity is uncertain. The product is designed to explore possibilities rather than manufacture certainty.",
  },
  {
    icon: ShieldCheck,
    title: "Assumptions stay visible",
    description:
      "Valuation, dilution, vesting, exercise and other assumptions should remain understandable instead of disappearing behind a black box.",
  },
  {
    icon: Fingerprint,
    title: "Employee-first context",
    description:
      "The question is not only what a company may be worth, but what the equity could actually mean for the employee holding it.",
  },
  {
    icon: GitCompareArrows,
    title: "Decisions over dashboards",
    description:
      "The model should eventually help answer a decision—not merely produce another collection of financial charts.",
  },
];

export default function AboutPage() {
  const [activeJourney, setActiveJourney] = useState(0);
  const [offerPulse, setOfferPulse] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

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
      setActiveJourney((value) => (value + 1) % journey.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setOfferPulse((value) => (value + 1) % 3);
    }, 1900);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  const ActiveJourneyIcon = journey[activeJourney].icon;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-950">
      {/* =====================================================
          HERO — THE HEART OF THE PRODUCT
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#030817] text-white">
        <div className="about-dark-grid pointer-events-none absolute inset-0 opacity-45" />
        <div className="about-orb about-orb-one pointer-events-none absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="about-orb about-orb-two pointer-events-none absolute -right-40 top-[-180px] h-[620px] w-[620px] rounded-full bg-violet-600/10 blur-[160px]" />
        <div className="pointer-events-none absolute bottom-[-280px] left-[35%] h-[520px] w-[520px] rounded-full bg-cyan-500/[0.07] blur-[150px]" />

        <div className="relative mx-auto max-w-[1480px] px-6 py-20 md:py-28 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/[0.07] px-4 py-2 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
                  ABOUT ESOP VALUE CLARITY
                </span>
              </div>

              <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.97] tracking-[-0.065em] sm:text-6xl lg:text-[76px]">
                Equity should create
                <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                  opportunity, not confusion.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                ESOP Value Clarity is an employee-focused equity decision
                platform built to connect grant terms, vesting, ownership,
                dilution, exercise economics, future scenarios and complete
                employment offers into one understandable financial story.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/simulator">
                  <Button
                    size="lg"
                    className="group h-12 rounded-xl bg-blue-600 px-6 font-black text-white shadow-[0_15px_40px_-15px_rgba(37,99,235,.8)] transition hover:-translate-y-1 hover:bg-blue-500"
                  >
                    Explore your equity
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                  </Button>
                </Link>

                <Link
                  href="/blog"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/[0.09]"
                >
                  <BookOpen className="h-4 w-4 text-blue-300" />
                  Equity Intelligence Journal
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-slate-400">
                {[
                  "Employee-first",
                  "Assumption-led",
                  "Scenario-based",
                  "Decision-focused",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* FINTECH PRODUCT MAP */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-10 rounded-full bg-blue-500/[0.05] blur-3xl" />

              <div className="about-terminal relative overflow-hidden rounded-[30px] border border-white/10 bg-[#081120]/90 shadow-[0_45px_120px_-35px_rgba(0,0,0,.9)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  </div>

                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                    <Radar className="h-3.5 w-3.5 text-blue-300" />
                    Connected equity model
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                        ONE GRANT · MULTIPLE VARIABLES
                      </p>
                      <p className="mt-2 text-xl font-black">
                        What actually changes the outcome?
                      </p>
                    </div>

                    <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-300">
                      <LineChart className="h-5 w-5" />
                      <span className="about-pulse absolute inset-0 rounded-xl border border-blue-300/25" />
                    </div>
                  </div>

                  <div className="relative mt-7">
                    <div className="absolute bottom-5 left-[19px] top-5 w-px bg-gradient-to-b from-blue-400/70 via-cyan-400/30 to-transparent" />

                    {journey.slice(0, 6).map((item, index) => {
                      const Icon = item.icon;
                      const active = activeJourney === index;

                      return (
                        <button
                          key={item.number}
                          type="button"
                          onMouseEnter={() => setActiveJourney(index)}
                          onFocus={() => setActiveJourney(index)}
                          onClick={() => setActiveJourney(index)}
                          className={`group relative mb-2 flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition duration-500 last:mb-0 ${
                            active
                              ? "translate-x-2 border-blue-400/30 bg-blue-400/[0.09]"
                              : "border-white/[0.07] bg-white/[0.035] hover:translate-x-1 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div
                            className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                              active
                                ? "bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,.35)]"
                                : "bg-[#0b1526] text-blue-300"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-300">
                              {item.label}
                            </p>
                            <p className="mt-0.5 truncate text-xs font-bold text-slate-300">
                              {item.title}
                            </p>
                          </div>

                          <span className="font-mono text-[9px] font-black text-slate-600">
                            {item.number}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-300" />
                      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-emerald-300">
                        MODEL PRINCIPLE
                      </p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Known terms stay separate from assumptions. Scenarios stay
                      separate from guarantees.
                    </p>
                  </div>
                </div>
              </div>

              <div className="about-float-card absolute -left-7 top-24 hidden rounded-2xl border border-white/10 bg-[#0a1424]/95 p-3 shadow-2xl backdrop-blur xl:block">
                <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-500">
                  Model state
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-black text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Explainable
                </p>
              </div>

              <div className="about-float-card about-float-delay absolute -right-8 bottom-24 hidden rounded-2xl border border-white/10 bg-[#0a1424]/95 p-3 shadow-2xl backdrop-blur xl:block">
                <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-500">
                  Output
                </p>
                <p className="mt-1 text-xs font-black text-blue-300">
                  Decision context
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          THE PROBLEM
      ====================================================== */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              WHY THIS PRODUCT EXISTS
            </p>

            <h2 className="mt-4 max-w-xl text-4xl font-black tracking-[-0.05em] text-[#07111f] md:text-5xl">
              Employees are often given a grant.
              <span className="block text-slate-400">
                Not the financial context around it.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              A headline option count can look impressive while leaving the
              important questions unanswered: What is vested? What does exercise
              cost? What ownership does the grant represent? How could dilution
              change it? What happens if the company grows—or does not?
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,.28)] sm:p-8">
            <div className="about-light-grid pointer-events-none absolute inset-0 opacity-50" />

            <div className="relative grid gap-3 sm:grid-cols-2">
              <ProblemCard
                icon={<WalletCards className="h-5 w-5" />}
                label="HEADLINE"
                title="“You have 30,000 ESOPs.”"
                text="A quantity without ownership, strike price or vesting context."
              />
              <ProblemCard
                icon={<CircleDollarSign className="h-5 w-5" />}
                label="VALUATION"
                title="“They are worth ₹X today.”"
                text="A reference value is not the same thing as employee liquidity."
              />
              <ProblemCard
                icon={<Layers3 className="h-5 w-5" />}
                label="FUNDING"
                title="“The company raised again.”"
                text="Growth and dilution can happen at the same time."
              />
              <ProblemCard
                icon={<Target className="h-5 w-5" />}
                label="DECISION"
                title="“Is this a good offer?”"
                text="Cash, equity, vesting and risk should not be collapsed into one number."
              />
            </div>

            <div className="relative mt-4 flex items-start gap-3 rounded-2xl bg-[#07111f] p-5 text-white">
              <Radar className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-300">
                  THE GAP
                </p>
                <p className="mt-2 text-sm font-black">
                  The employee needs a connected financial story, not another
                  isolated calculator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCT PHILOSOPHY
      ====================================================== */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-[1480px] px-6 py-24 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              PRODUCT PHILOSOPHY
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#07111f] md:text-6xl">
              Clarity is not a prettier number.
              <span className="block text-slate-400">
                It is understanding what created it.
              </span>
            </h2>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {principles.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="group relative min-h-[280px] overflow-hidden rounded-[26px] border border-slate-200 bg-[#f8fafc] p-6 transition duration-500 hover:-translate-y-2 hover:border-blue-200 hover:bg-white hover:shadow-[0_28px_80px_-45px_rgba(37,99,235,.35)]"
                >
                  <span className="absolute right-5 top-5 font-mono text-[9px] font-black text-slate-300">
                    0{index + 1}
                  </span>

                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-8 text-xl font-black tracking-tight text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          CONNECTED JOURNEY
      ====================================================== */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="about-light-grid pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                CONNECTED EQUITY JOURNEY
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#07111f] md:text-5xl">
                Follow the same grant
                <span className="block text-slate-400">
                  all the way to the decision.
                </span>
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                ESOP Value Clarity is being built as a connected system. The
                same equity position should flow through vesting, ownership,
                dilution, exercise, outcomes and comparison rather than forcing
                the employee to rebuild the story in disconnected tools.
              </p>

              <div className="mt-8 rounded-[24px] border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex items-start gap-3">
                  <ActiveJourneyIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                      ACTIVE LAYER · {journey[activeJourney].label}
                    </p>
                    <p className="mt-2 font-black text-slate-950">
                      {journey[activeJourney].title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {journey[activeJourney].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-[#07111f] p-5 text-white shadow-[0_35px_100px_-50px_rgba(15,23,42,.5)] sm:p-7">
              <div className="about-dark-grid pointer-events-none absolute inset-0 opacity-45" />

              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                    MODEL ROUTING
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                    07 connected layers
                  </span>
                </div>

                <div className="mt-7 space-y-2">
                  {journey.map((item, index) => {
                    const Icon = item.icon;
                    const active = activeJourney === index;
                    const complete = index < activeJourney;

                    return (
                      <button
                        key={item.number}
                        type="button"
                        onMouseEnter={() => setActiveJourney(index)}
                        onFocus={() => setActiveJourney(index)}
                        onClick={() => setActiveJourney(index)}
                        className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition duration-500 ${
                          active
                            ? "translate-x-2 border-blue-400/30 bg-blue-400/[0.09]"
                            : "border-white/[0.07] bg-white/[0.035] hover:translate-x-1 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                            active
                              ? "bg-blue-600 text-white shadow-[0_0_28px_rgba(37,99,235,.35)]"
                              : complete
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-white/[0.05] text-slate-500"
                          }`}
                        >
                          {complete ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-300">
                            {item.number} · {item.label}
                          </p>
                          <p className="mt-1 truncate text-xs font-black text-slate-200">
                            {item.title}
                          </p>
                        </div>

                        <ChevronRight
                          className={`h-4 w-4 transition ${
                            active
                              ? "translate-x-1 text-blue-300"
                              : "text-slate-700"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FREE + PRO PRODUCT
      ====================================================== */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-[1480px] px-6 py-24 md:py-32">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                ONE PRODUCT · DIFFERENT DEPTH
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#07111f] md:text-5xl">
                Start with understanding.
                <span className="block text-slate-400">
                  Go deeper when the decision matters.
                </span>
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                The public experience provides a useful starting point for
                learning and modelling. PRO extends that foundation into a
                connected decision workspace for more serious equity and
                compensation analysis.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DepthCard
                label="FREE"
                icon={<Calculator className="h-5 w-5" />}
                title="Understand the model"
                text="Explore core equity concepts and see how assumptions can change a potential outcome."
                items={[
                  "Core equity simulation",
                  "Scenario exploration",
                  "Learning resources",
                ]}
                href="/simulator"
                cta="Explore simulator"
              />

              <DepthCard
                label="PRO"
                icon={<Sparkles className="h-5 w-5" />}
                title="Build the decision"
                text="Connect vesting, dilution, exercise, tax, comparison, reporting and complete-offer intelligence."
                items={[
                  "Connected equity workspace",
                  "Exercise Decision Intelligence",
                  "Offer Intelligence",
                ]}
                href="/pricing"
                cta="Explore PRO"
                dark
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          OFFER INTELLIGENCE — PHASE 4
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#030817] py-24 text-white md:py-32">
        <div className="about-dark-grid pointer-events-none absolute inset-0 opacity-45" />
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-violet-300">
                <FileSearch2 className="h-3.5 w-3.5" />
                OFFER INTELLIGENCE
              </div>

              <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] md:text-6xl">
                Equity does not exist in isolation from the job offer.
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Offer Intelligence extends the same philosophy to complete
                compensation: review the terms, separate guaranteed cash from
                equity opportunity, keep missing information visible and compare
                the trade-offs instead of trusting headline CTC.
              </p>
            </div>

            <Link
              href="/pro/offers"
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#07111f] transition hover:-translate-y-1"
            >
              Explore Offer Intelligence
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_80px_1.15fr_80px_1fr] lg:items-center">
            <OfferNode
              label="OFFER A"
              title="Confirmed terms"
              detail="Cash + equity + vesting"
              icon={<FileCheck2 className="h-5 w-5" />}
              active={offerPulse === 0}
            />

            <EnergyLine active={offerPulse === 1} />

            <div
              className={`relative overflow-hidden rounded-[28px] border p-6 text-center transition duration-700 ${
                offerPulse === 1
                  ? "border-violet-400/45 bg-violet-500/10 shadow-[0_0_60px_rgba(139,92,246,.14)]"
                  : "border-white/10 bg-white/[0.05]"
              }`}
            >
              <span className="about-orbit absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/15" />
              <span className="about-orbit about-orbit-delay absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/15" />

              <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-[0_0_38px_rgba(139,92,246,.28)]">
                <Scale className="h-6 w-6" />
              </div>

              <p className="relative mt-5 text-[9px] font-black uppercase tracking-[0.15em] text-violet-300">
                COMPARISON ENGINE
              </p>
              <p className="relative mt-2 text-xl font-black">
                Economics first
              </p>
              <p className="relative mt-2 text-[11px] leading-5 text-slate-400">
                Cash · Equity · Vesting · Dilution · Exercise risk
              </p>
            </div>

            <EnergyLine active={offerPulse === 2} />

            <OfferNode
              label="OFFER B"
              title="Confirmed terms"
              detail="Cash + equity + vesting"
              icon={<BriefcaseBusiness className="h-5 w-5" />}
              active={offerPulse === 2}
              accent
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          BUILT BY A FOUNDER
      ====================================================== */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 md:py-32">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_30px_90px_-55px_rgba(15,23,42,.28)] md:p-10 lg:p-12">
          <div className="about-light-grid pointer-events-none absolute inset-0 opacity-45" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/70 blur-[90px]" />

          <div className="relative grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
            <div>
              <div className="relative grid h-20 w-20 place-items-center rounded-[24px] bg-[#07111f] text-xl font-black text-white shadow-[0_20px_50px_-20px_rgba(15,23,42,.5)]">
                SS
                <span className="about-pulse absolute inset-0 rounded-[24px] border border-blue-400/30" />
              </div>

              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                FOUNDER-BUILT PRODUCT
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#07111f]">
                Sheshank Sidheshwar
              </h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Founder · ESOP Value Clarity
              </p>
            </div>

            <div>
              <p className="text-2xl font-black leading-9 tracking-[-0.035em] text-slate-950 md:text-3xl md:leading-10">
                “The goal is not to tell an employee what their equity will be
                worth. The goal is to give them enough clarity to understand
                what could change the outcome.”
              </p>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                ESOP Value Clarity is an independently built product focused on
                making employee equity easier to reason about. The product is
                intentionally evolving from education and simulation toward a
                deeper decision-support system while keeping transparency,
                uncertainty and user control at the center.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Independent",
                  "Employee-first",
                  "Explainable",
                  "Privacy-conscious",
                ].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MISSION
      ====================================================== */}
      <section className="mx-auto max-w-[1480px] px-6 pb-24">
        <div className="relative overflow-hidden rounded-[34px] bg-[#07111f] p-8 text-white shadow-[0_35px_100px_-50px_rgba(7,17,31,.55)] md:p-12">
          <div className="about-dark-grid pointer-events-none absolute inset-0 opacity-45" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-600/15 blur-[90px]" />

          <div className="relative grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                THE MISSION
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
                Make employee equity understandable enough to act on.
              </h2>
            </div>

            <div className="space-y-5 text-base leading-8 text-slate-300">
              <p>
                Equity can create meaningful financial opportunity, but only if
                employees can understand the conditions between a grant letter
                and a real economic outcome.
              </p>
              <p>
                The mission is to replace vague headline values with connected,
                explainable analysis—so employees can ask better questions,
                explore different futures and make their own decisions with more
                context.
              </p>

              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                <MissionMetric label="CLARITY" value="Explain" />
                <MissionMetric label="UNCERTAINTY" value="Expose" />
                <MissionMetric label="DECISION" value="Support" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section className="mx-auto max-w-[1480px] px-6 pb-24">
        <div className="relative overflow-hidden rounded-[34px] border border-blue-200 bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 p-8 text-white shadow-[0_35px_100px_-50px_rgba(37,99,235,.65)] md:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                LEARN → MODEL → UNDERSTAND → DECIDE
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] md:text-5xl">
                Your grant is the starting point.
                <span className="block">
                  Understanding the economics is the next step.
                </span>
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50">
                Explore the core simulator or continue learning through the
                Equity Intelligence Journal.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/simulator"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-1"
              >
                Open simulator
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
              </Link>

              <Link
                href="/blog"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-6 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/[0.12]"
              >
                Read the journal
                <BookOpen className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCT NOTICE
      ====================================================== */}
      <section className="mx-auto max-w-[1480px] px-6 pb-16">
        <div className="flex items-start gap-4 rounded-[22px] border border-amber-200 bg-amber-50 p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-xs leading-6 text-amber-950/75">
            <strong className="text-amber-950">Important:</strong> ESOP Value
            Clarity provides educational calculations, scenario modelling and
            decision-support tools. Equity values, tax estimates, dilution
            assumptions and future outcomes are not guarantees and should not be
            treated as financial, investment, legal, employment or tax advice.
            Official company documents and appropriate professional advice
            should be used for material decisions.
          </p>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        @keyframes aboutFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-9px);
          }
        }

        @keyframes aboutFloatCard {
          0%,
          100% {
            transform: translateY(0px) rotate(-1deg);
          }
          50% {
            transform: translateY(-9px) rotate(1deg);
          }
        }

        @keyframes aboutPulse {
          0% {
            transform: scale(1);
            opacity: 0.55;
          }
          100% {
            transform: scale(1.55);
            opacity: 0;
          }
        }

        @keyframes aboutOrbit {
          0% {
            transform: translate(-50%, -50%) scale(0.82) rotate(0deg);
            opacity: 0.28;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
            opacity: 0.07;
          }
        }

        @keyframes aboutEnergy {
          0% {
            transform: translateX(-26px);
            opacity: 0;
          }
          18% {
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          100% {
            transform: translateX(72px);
            opacity: 0;
          }
        }

        @keyframes aboutOrbOne {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(90px, 45px) scale(1.12);
          }
        }

        @keyframes aboutOrbTwo {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-70px, 70px) scale(0.94);
          }
        }

        .about-dark-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.027) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.027) 1px,
              transparent 1px
            );
          background-size: 34px 34px;
        }

        .about-light-grid {
          background-image:
            linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(15, 23, 42, 0.035) 1px,
              transparent 1px
            );
          background-size: 34px 34px;
        }

        .about-terminal {
          animation: aboutFloat 7s ease-in-out infinite;
        }

        .about-float-card {
          animation: aboutFloatCard 5.5s ease-in-out infinite;
        }

        .about-float-delay {
          animation-delay: -2.2s;
        }

        .about-pulse {
          animation: aboutPulse 2.2s ease-out infinite;
        }

        .about-orbit {
          animation: aboutOrbit 3.2s ease-in-out infinite alternate;
        }

        .about-orbit-delay {
          animation-delay: -1.4s;
        }

        .about-energy {
          animation: aboutEnergy 1.8s linear infinite;
        }

        .about-orb-one {
          animation: aboutOrbOne 15s ease-in-out infinite;
        }

        .about-orb-two {
          animation: aboutOrbTwo 17s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .about-terminal,
          .about-float-card,
          .about-pulse,
          .about-orbit,
          .about-energy,
          .about-orb-one,
          .about-orb-two {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function ProblemCard({
  icon,
  label,
  title,
  text,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="group relative rounded-[22px] border border-slate-200 bg-slate-50 p-5 transition duration-400 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg">
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
        {icon}
      </div>
      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-slate-950">{title}</p>
      <p className="mt-2 text-xs leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function DepthCard({
  label,
  icon,
  title,
  text,
  items,
  href,
  cta,
  dark = false,
}: {
  label: string;
  icon: ReactNode;
  title: string;
  text: string;
  items: string[];
  href: string;
  cta: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[28px] border p-7 transition duration-500 hover:-translate-y-2 ${
        dark
          ? "border-blue-500/20 bg-[#07111f] text-white shadow-[0_28px_80px_-45px_rgba(37,99,235,.55)]"
          : "border-slate-200 bg-[#f8fafc] text-slate-950"
      }`}
    >
      <div
        className={`grid h-11 w-11 place-items-center rounded-xl ${
          dark
            ? "border border-blue-400/20 bg-blue-400/10 text-blue-300"
            : "border border-slate-200 bg-white text-blue-600"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-6 text-[9px] font-black uppercase tracking-[0.16em] ${
          dark ? "text-blue-300" : "text-blue-600"
        }`}
      >
        {label}
      </p>

      <h3 className="mt-2 text-2xl font-black tracking-tight">{title}</h3>
      <p
        className={`mt-4 text-sm leading-7 ${
          dark ? "text-slate-400" : "text-slate-600"
        }`}
      >
        {text}
      </p>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm font-semibold">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full ${
                dark
                  ? "bg-white/[0.07] text-blue-300"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
            {item}
          </div>
        ))}
      </div>

      <Link
        href={href}
        className={`mt-7 inline-flex items-center gap-2 text-sm font-black ${
          dark ? "text-blue-300" : "text-blue-600"
        }`}
      >
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function OfferNode({
  label,
  title,
  detail,
  icon,
  active,
  accent = false,
}: {
  label: string;
  title: string;
  detail: string;
  icon: ReactNode;
  active: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[26px] border p-5 transition duration-700 ${
        active
          ? accent
            ? "border-violet-400/45 bg-violet-500/10 shadow-[0_0_55px_rgba(139,92,246,.13)]"
            : "border-blue-400/40 bg-blue-500/[0.08] shadow-[0_0_55px_rgba(59,130,246,.12)]"
          : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
            accent ? "bg-violet-500 text-white" : "bg-white text-[#07111f]"
          }`}
        >
          {label}
        </span>
        <span className={active ? "text-emerald-300" : "text-slate-600"}>
          {icon}
        </span>
      </div>

      <p className="mt-6 text-lg font-black">{title}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">{detail}</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-600">
            CASH
          </p>
          <p className="mt-1 text-xs font-black text-white">Confirmed</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-600">
            EQUITY
          </p>
          <p className={`mt-1 text-xs font-black ${accent ? "text-violet-300" : "text-blue-300"}`}>
            Modelled
          </p>
        </div>
      </div>
    </div>
  );
}

function EnergyLine({ active }: { active: boolean }) {
  return (
    <div className="relative hidden h-14 overflow-hidden lg:block">
      <div
        className={`absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-blue-400/55 to-transparent transition ${
          active ? "opacity-100" : "opacity-45"
        }`}
      />
      <span
        className={`about-energy absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(96,165,250,.95)] ring-2 ring-blue-400 ${
          active ? "opacity-100" : "opacity-35"
        }`}
      />
    </div>
  );
}

function MissionMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

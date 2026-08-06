import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Brain,
  Building2,
  Calculator,
  Coins,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden border-b bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-5 md:px-6 py-16 md:py-28 text-center">

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 backdrop-blur">
            Equity Intelligence Platform
          </div>

          <h1 className="mt-6 max-w-5xl text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight text-white">
            Helping Employees
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              {" "}Understand Their ESOPs
            </span>
            {" "}With Confidence
          </h1>

          <p className="mt-6 max-w-3xl text-base sm:text-lg md:text-xl leading-7 md:leading-9 text-slate-300">
            ESOP Value Clarity transforms complicated equity calculations into
            simple, transparent insights—helping employees visualize ownership,
            vesting, dilution, and potential wealth creation in minutes.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">

            <Link href="/simulator" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-xl bg-white px-8 text-slate-900 hover:bg-slate-200"
              >
                Launch Simulator
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href="/" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-xl border-white/20 bg-transparent px-8 text-white hover:bg-white/10"
              >
                Back Home
              </Button>
            </Link>

          </div>

        </div>

      </section>

      {/* ================= STATS ================= */}

      <section className="mx-auto mt-12 md:mt-16 max-w-7xl px-5 md:px-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

          <StatCard
            number="100%"
            title="Transparent Calculations"
            icon={<Calculator className="h-7 w-7" />}
          />

          <StatCard
            number="0"
            title="Hidden Assumptions"
            icon={<ShieldCheck className="h-7 w-7" />}
          />

          <StatCard
            number="3"
            title="Core Financial Metrics"
            icon={<TrendingUp className="h-7 w-7" />}
          />

          <StatCard
            number="2026"
            title="Modern SaaS Experience"
            icon={<Sparkles className="h-7 w-7" />}
          />

        </div>

      </section>

      {/* ================= WHY ================= */}

      <section className="mx-auto mt-20 md:mt-28 max-w-7xl px-5 md:px-6">

        <div className="grid gap-12 md:gap-16 lg:grid-cols-2 lg:items-center">

          <div>

            <div className="mb-5 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              Why ESOP Value Clarity?
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Equity shouldn't feel confusing.
            </h2>

            <p className="mt-6 text-base md:text-lg leading-7 md:leading-8 text-slate-600">
              Employees often receive ESOP grants without understanding what
              those numbers actually represent. Terms like dilution,
              vesting schedules, ownership percentages, and exit valuation
              make equity seem far more complicated than it really is.
            </p>

            <p className="mt-6 text-base md:text-lg leading-7 md:leading-8 text-slate-600">
              ESOP Value Clarity was built to simplify those concepts into
              intuitive visual insights that anyone can understand,
              regardless of their finance background.
            </p>

          </div>

          <div className="grid gap-5">

            <FeatureHighlight
              icon={<Coins className="h-6 w-6" />}
              title="Understand Ownership"
              description="Know what your ESOP grant actually represents inside the company."
            />

            <FeatureHighlight
              icon={<BarChart3 className="h-6 w-6" />}
              title="Visualize Growth"
              description="See how company valuation impacts your potential equity value."
            />

            <FeatureHighlight
              icon={<Brain className="h-6 w-6" />}
              title="Learn Financial Concepts"
              description="Understand vesting, dilution and exit scenarios through simple explanations."
            />

            <FeatureHighlight
              icon={<Building2 className="h-6 w-6" />}
              title="Built for Employees"
              description="Designed specifically for startup employees, HR teams and founders."
            />

          </div>

        </div>

      </section>
	  
	        {/* ================= HOW IT WORKS ================= */}

      <section className="mx-auto mt-20 md:mt-32 max-w-7xl px-5 md:px-6">

        <div className="text-center">

          <div className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            How It Works
          </div>

          <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Three Simple Steps
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base sm:text-lg leading-7 md:leading-8 text-slate-600">
            We focus on clarity, not complexity.
            Every calculation is fully transparent and based on visible assumptions.
          </p>

        </div>

        <div className="mt-14 md:mt-20 grid gap-6 md:gap-8 lg:grid-cols-3">

          <StepCard
            step="01"
            title="Enter ESOP Details"
            description="Input your granted shares, vesting percentage and valuation."
          />

          <StepCard
            step="02"
            title="Adjust Assumptions"
            description="Model dilution and future company valuation scenarios."
          />

          <StepCard
            step="03"
            title="Visualize Outcomes"
            description="Instantly understand your current value and potential exit wealth."
          />

        </div>

      </section>

      {/* ================= FEATURES ================= */}

      <section className="mx-auto mt-20 md:mt-32 max-w-7xl px-5 md:px-6">

        <div className="text-center">

          <div className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            Platform Features
          </div>

          <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Built for Clarity
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base sm:text-lg leading-7 md:leading-8 text-slate-600">
            Every feature has been designed to simplify ESOP education while
            maintaining transparency and trust.
          </p>

        </div>

        <div className="mt-14 md:mt-16 grid gap-6 md:gap-8 sm:grid-cols-2 xl:grid-cols-3">

          <FeatureCard
            title="Transparent Calculations"
            description="Every value is derived from visible assumptions. Nothing is hidden."
            icon={<Calculator className="h-7 w-7" />}
          />

          <FeatureCard
            title="Real-Time Simulation"
            description="Instantly visualize how changes in valuation affect equity."
            icon={<TrendingUp className="h-7 w-7" />}
          />

          <FeatureCard
            title="Employee Focused"
            description="Designed specifically for startup employees and HR teams."
            icon={<Building2 className="h-7 w-7" />}
          />

          <FeatureCard
            title="Educational"
            description="Learn dilution, vesting and exits without financial jargon."
            icon={<Brain className="h-7 w-7" />}
          />

          <FeatureCard
            title="Modern Interface"
            description="Built using modern UI principles for a clean user experience."
            icon={<Sparkles className="h-7 w-7" />}
          />

          <FeatureCard
            title="Fast & Lightweight"
            description="No spreadsheets. No setup. Get answers in seconds."
            icon={<BadgeCheck className="h-7 w-7" />}
          />

        </div>

      </section>
	        {/* ================= MISSION ================= */}

      <section className="mx-auto mt-20 md:mt-32 max-w-7xl px-5 md:px-6">

        <div className="rounded-[24px] md:rounded-[32px] bg-slate-900 px-6 py-10 md:px-10 md:py-16 text-white">

          <div className="grid gap-10 md:gap-14 lg:grid-cols-2">

            <div>

              <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-blue-300">
                Our Mission
              </p>

              <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
                Making equity understandable for everyone.
              </h2>

            </div>

            <div className="space-y-5 md:space-y-6 text-base md:text-lg leading-7 md:leading-8 text-slate-300">

              <p>
                Equity has the potential to create life-changing wealth, but only
                if employees understand what they own.
              </p>

              <p>
                Our mission is to replace confusion with clarity through
                transparent simulations and intuitive financial education.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ================= CTA ================= */}

      <section className="mx-auto mt-20 md:mt-32 max-w-7xl px-5 md:px-6">

        <div className="overflow-hidden rounded-[24px] md:rounded-[36px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-12 md:px-10 md:py-20 text-center text-white">

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
            Ready to Explore Your ESOP Value?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-7 md:leading-8 text-slate-300">
            Understand your equity, visualize future outcomes, and make informed
            decisions with confidence.
          </p>

          <div className="mt-10">

            <Link
              href="/simulator"
              className="inline-block w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-xl bg-white px-8 text-slate-900 hover:bg-slate-200"
              >
                Launch Simulator
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

          </div>

        </div>

      </section>

      {/* ================= DISCLAIMER ================= */}

      <section className="mx-auto mt-16 md:mt-24 max-w-7xl border-t px-5 md:px-6 py-8 md:py-10">

        <p className="max-w-4xl text-xs sm:text-sm leading-6 md:leading-7 text-slate-500">
          <strong>Disclaimer:</strong> ESOP Value Clarity is an educational
          simulation platform. The calculations presented are based on simplified
          assumptions and should not be interpreted as financial, investment,
          tax, or legal advice. Actual ESOP outcomes depend on company-specific
          agreements, valuation methodologies, taxation rules, liquidity events,
          and future funding rounds.
        </p>

      </section>

    </main>
  );
}
/* ===========================================================
   COMPONENTS
=========================================================== */

function StatCard({
  number,
  title,
  icon,
}: {
  number: string;
  title: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl md:rounded-3xl border bg-white p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="mb-5 md:mb-6 inline-flex rounded-xl md:rounded-2xl bg-slate-100 p-3 md:p-4">
        {icon}
      </div>

      <h3 className="text-3xl md:text-4xl font-black text-slate-900">
        {number}
      </h3>

      <p className="mt-2 text-sm md:text-base text-slate-600">
        {title}
      </p>

    </div>
  );
}

function FeatureHighlight({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl md:rounded-3xl border bg-white p-6 md:p-7 shadow-sm transition-all duration-300 hover:shadow-lg">

      <div className="mb-5 inline-flex rounded-xl bg-slate-900 p-3 text-white">
        {icon}
      </div>

      <h3 className="text-lg md:text-xl font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm md:text-base leading-6 md:leading-7 text-slate-600">
        {description}
      </p>

    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl md:rounded-3xl border bg-white p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      <span className="text-xs md:text-sm font-bold tracking-[0.3em] text-blue-600">
        {step}
      </span>

      <h3 className="mt-4 md:mt-5 text-xl md:text-2xl font-bold">
        {title}
      </h3>

      <p className="mt-3 md:mt-4 text-sm md:text-base leading-6 md:leading-7 text-slate-600">
        {description}
      </p>

    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl md:rounded-3xl border bg-white p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">

      <div className="mb-5 md:mb-6 inline-flex rounded-xl md:rounded-2xl bg-slate-900 p-3 md:p-4 text-white">
        {icon}
      </div>

      <h3 className="text-xl md:text-2xl font-bold">
        {title}
      </h3>

      <p className="mt-3 md:mt-4 text-sm md:text-base leading-6 md:leading-7 text-slate-600">
        {description}
      </p>

    </div>
  );
}
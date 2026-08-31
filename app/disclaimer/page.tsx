"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileSearch,
  Gauge,
  Landmark,
  LineChart,
  LockKeyhole,
  Mail,
  Percent,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

const LAST_UPDATED = "31 August 2026";

const sections = [
  { id: "purpose", number: "01", title: "Purpose of the platform" },
  { id: "not-advice", number: "02", title: "Not professional advice" },
  { id: "equity", number: "03", title: "Equity value & uncertainty" },
  { id: "fmv", number: "04", title: "FMV & reference values" },
  { id: "dilution", number: "05", title: "Dilution modelling" },
  { id: "vesting", number: "06", title: "Vesting & exercise" },
  { id: "tax", number: "07", title: "Tax estimates" },
  { id: "exit", number: "08", title: "Exit scenarios" },
  { id: "offers", number: "09", title: "Offer Intelligence" },
  { id: "scores", number: "10", title: "Comparison signals" },
  { id: "documents", number: "11", title: "Source documents" },
  { id: "decisions", number: "12", title: "Your decisions" },
  { id: "accuracy", number: "13", title: "Accuracy & availability" },
  { id: "contact", number: "14", title: "Contact" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: "easeOut" as const,
    },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-4">
      <span className="mt-1 font-mono text-xs font-black tracking-[0.16em] text-blue-600">
        {number}
      </span>

      <h2 className="text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-[28px]">
        {title}
      </h2>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
      <span>{children}</span>
    </li>
  );
}

function AnimatedSection({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={fadeUp}
      className={`scroll-mt-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      {/* =====================================================
          TRUST CENTER NAV
      ====================================================== */}

      <div className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1.5" />
            ESOP Value Clarity
          </Link>

          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/90 p-1 shadow-sm">
            <Link
              href="/privacy"
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-slate-950"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-slate-950"
            >
              Terms
            </Link>

            <Link
              href="/disclaimer"
              className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#020713]">
        {/* animated ambient light */}

        <motion.div
          className="pointer-events-none absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-blue-600/10 blur-[140px]"
          animate={{
            x: [0, 100, 30, 0],
            y: [0, 40, 100, 0],
            scale: [1, 1.12, 0.96, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="pointer-events-none absolute -right-40 top-0 h-[620px] w-[620px] rounded-full bg-violet-600/10 blur-[150px]"
          animate={{
            x: [0, -80, -20, 0],
            y: [0, 90, 30, 0],
            scale: [1, 0.94, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="pointer-events-none absolute bottom-[-280px] left-[35%] h-[560px] w-[560px] rounded-full bg-cyan-500/[0.07] blur-[150px]"
          animate={{
            x: [-50, 80, -50],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* moving fintech grid */}

        <motion.div
          className="pointer-events-none absolute inset-0 opacity-[0.11]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.16) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "64px 64px"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
            {/* HERO COPY */}

            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-4 py-2"
              >
                <ShieldAlert className="h-4 w-4 text-amber-300" />

                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
                  Trust Center · Product Disclaimer
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mt-8 max-w-4xl text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl lg:text-[72px] lg:leading-[0.98]"
              >
                Model the upside.
                <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                  Keep the uncertainty visible.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-8 max-w-3xl text-lg leading-8 text-slate-300"
              >
                ESOP Value Clarity helps you reason about equity,
                compensation and employment offers. It does not turn
                uncertain future outcomes into guaranteed wealth.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-9 flex flex-wrap gap-3"
              >
                <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-slate-300">
                  Effective: {LAST_UPDATED}
                </div>

                <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-slate-300">
                  Decision support
                </div>

                <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-slate-300">
                  Not financial advice
                </div>
              </motion.div>
            </motion.div>

            {/* HERO VISUAL */}

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="relative"
            >
              <motion.div
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.055] p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,.8)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Scenario intelligence
                    </p>

                    <p className="mt-2 text-xl font-black text-white">
                      Value ≠ certainty
                    </p>
                  </div>

                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-300">
                    <motion.div
                      className="absolute inset-0 rounded-2xl border border-blue-300/30"
                      animate={{
                        scale: [1, 1.45],
                        opacity: [0.7, 0],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                      }}
                    />

                    <Activity className="relative h-5 w-5" />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  {[
                    {
                      icon: WalletCards,
                      label: "Guaranteed cash",
                      value: "Known terms",
                    },
                    {
                      icon: TrendingUp,
                      label: "Equity upside",
                      value: "Uncertain",
                    },
                    {
                      icon: Percent,
                      label: "Dilution",
                      value: "Can change",
                    },
                    {
                      icon: Target,
                      label: "Exit value",
                      value: "Scenario",
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.label}
                        whileHover={{
                          y: -6,
                          rotateX: 3,
                          rotateY: index % 2 === 0 ? -3 : 3,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 18,
                        }}
                        className="rounded-[20px] border border-white/10 bg-[#081120]/90 p-4"
                      >
                        <Icon className="h-4 w-4 text-blue-300" />

                        <p className="mt-4 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                          {item.label}
                        </p>

                        <p className="mt-1 font-black text-white">
                          {item.value}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* visual signal line */}

                <div className="relative mt-7 h-[110px] overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#050c18]">
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/10" />

                  <svg
                    viewBox="0 0 500 110"
                    className="absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                  >
                    <motion.path
                      d="M0 82 C60 75, 85 45, 140 60 S230 85, 285 47 S390 22, 500 36"
                      fill="none"
                      stroke="rgba(96,165,250,.9)"
                      strokeWidth="3"
                      initial={{
                        pathLength: 0,
                      }}
                      animate={{
                        pathLength: 1,
                      }}
                      transition={{
                        duration: 2.2,
                        delay: 0.8,
                        ease: "easeInOut",
                      }}
                    />
                  </svg>

                  <motion.div
                    className="absolute bottom-4 right-5 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-violet-200"
                    animate={{
                      y: [0, -3, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                    }}
                  >
                    Scenario ≠ forecast
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRINCIPLES
      ====================================================== */}

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="mx-auto max-w-7xl px-6 py-10"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: BadgeIndianRupee,
              label: "Cash",
              title: "Cash is not equity",
              text: "Guaranteed compensation and uncertain equity opportunity should not be treated as equivalent.",
            },
            {
              icon: LineChart,
              label: "Valuation",
              title: "Reference is not realization",
              text: "FMV and modelled equity values do not guarantee the price at which your equity can ultimately be sold.",
            },
            {
              icon: BarChart3,
              label: "Scenarios",
              title: "Outputs follow inputs",
              text: "Changing valuation, dilution, vesting or exit assumptions can materially change a modelled result.",
            },
            {
              icon: Scale,
              label: "Decisions",
              title: "You remain the decision-maker",
              text: "The platform supports comparison. It does not choose an employer, investment or financial action for you.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.title}
                variants={fadeUp}
                whileHover={{
                  y: -8,
                  scale: 1.015,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 20,
                }}
                className="group rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-45px_rgba(15,23,42,.4)]"
              >
                <motion.div
                  whileHover={{
                    rotate: [0, -6, 6, 0],
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                >
                  <Icon className="h-5 w-5" />
                </motion.div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  {item.label}
                </p>

                <h2 className="mt-2 text-lg font-black tracking-tight">
                  {item.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      {/* =====================================================
          MAIN DISCLAIMER
      ====================================================== */}

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* SIDEBAR */}

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Product disclaimer
            </p>

            <nav className="mt-4 space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-semibold text-slate-500 transition duration-300 hover:translate-x-1 hover:bg-slate-50 hover:text-slate-950"
                >
                  <span className="font-mono text-[10px] font-black text-slate-300 transition group-hover:text-blue-600">
                    {section.number}
                  </span>

                  {section.title}
                </a>
              ))}
            </nav>
          </motion.div>
        </aside>

        {/* DOCUMENT */}

        <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_-65px_rgba(15,23,42,.45)]">
          {/* INTRO */}

          <AnimatedSection className="border-b border-slate-200 p-7 sm:p-10">
            <div className="flex items-start gap-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <ShieldAlert className="h-5 w-5" />

                <motion.div
                  className="absolute inset-0 rounded-2xl border border-slate-400/30"
                  animate={{
                    scale: [1, 1.35],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                  }}
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Read before relying on a model
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  ESOP Value Clarity is decision support.
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  The product is designed to make equity economics easier
                  to understand. It cannot remove the uncertainty that
                  exists in private-company equity, employment outcomes,
                  taxation, liquidity or future company performance.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* 01 */}

          <AnimatedSection
            id="purpose"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="01"
              title="Purpose of the platform"
            />

            <p className="leading-7 text-slate-600">
              ESOP Value Clarity provides educational calculations,
              scenario modelling, visualisations and decision-support
              tools relating to employee equity, compensation and
              employment offers.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              The platform helps users examine how different assumptions
              may affect potential outcomes. It does not establish the
              actual future value of a company, security, option, RSU,
              ESOP grant or employment offer.
            </p>
          </AnimatedSection>

          {/* 02 */}

          <AnimatedSection
            id="not-advice"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="02"
              title="Not professional advice"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Financial advice",
                "Investment advice",
                "Legal advice",
                "Tax advice",
                "Employment advice",
                "Securities recommendation",
              ].map((item, index) => (
                <motion.div
                  key={item}
                  whileHover={{
                    x: 5,
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                    <span className="font-mono text-[10px] font-black text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <span className="text-sm font-bold text-slate-700">
                    Not {item.toLowerCase()}
                  </span>
                </motion.div>
              ))}
            </div>

            <p className="mt-6 leading-7 text-slate-600">
              You should obtain appropriate professional advice where
              your decision depends on your personal financial, legal,
              tax, investment or employment circumstances.
            </p>
          </AnimatedSection>

          {/* 03 */}

          <AnimatedSection
            id="equity"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="03"
              title="Equity value & uncertainty"
            />

            <div className="relative overflow-hidden rounded-[26px] bg-[#06101f] p-7 text-white">
              <motion.div
                className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-500/10 blur-[70px]"
                animate={{
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                }}
              />

              <div className="relative">
                <TrendingUp className="h-6 w-6 text-violet-300" />

                <h3 className="mt-5 text-2xl font-black">
                  A large modelled value is not money in your bank account.
                </h3>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                  Employee equity may be illiquid, unvested, subject to
                  exercise costs, forfeiture, dilution, taxation,
                  transfer restrictions, company performance and
                  uncertain exit opportunities.
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <Bullet>
                Equity may ultimately be worth more or less than a
                modelled reference value.
              </Bullet>

              <Bullet>
                Equity may ultimately have no realizable economic value.
              </Bullet>

              <Bullet>
                A private-company valuation does not guarantee employee
                liquidity.
              </Bullet>

              <Bullet>
                The economic value available to an employee can differ
                materially from headline company valuation.
              </Bullet>
            </ul>
          </AnimatedSection>

          {/* 04 */}

          <AnimatedSection
            id="fmv"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="04"
              title="FMV & reference values"
            />

            <p className="leading-7 text-slate-600">
              Where ESOP Value Clarity uses a current FMV, listed share
              price, employer-provided value or another reference share
              value, that figure is used as an analytical input.
            </p>

            <motion.div
              whileHover={{ scale: 1.01 }}
              className="mt-6 rounded-[22px] border border-blue-100 bg-blue-50/60 p-6"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Reference value
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                A reference share value is not necessarily the amount at
                which you can currently sell your equity, nor does it
                guarantee the price available at a future liquidity
                event.
              </p>
            </motion.div>
          </AnimatedSection>

          {/* 05 */}

          <AnimatedSection
            id="dilution"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="05"
              title="Dilution modelling"
            />

            <p className="leading-7 text-slate-600">
              Dilution calculations illustrate the potential effect of
              changes in company ownership or share count based on the
              assumptions entered into the model.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              Future financing rounds, option pools, conversions,
              restructurings, acquisitions or other corporate events may
              produce dilution that differs materially from a modelled
              percentage.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["10%", "Example assumption"],
                ["25%", "Different scenario"],
                ["?", "Actual future dilution"],
              ].map(([value, label]) => (
                <motion.div
                  key={label}
                  whileHover={{ y: -5 }}
                  className="rounded-[20px] border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-2xl font-black text-slate-950">
                    {value}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {label}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>

          {/* 06 */}

          <AnimatedSection
            id="vesting"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="06"
              title="Vesting & exercise"
            />

            <p className="leading-7 text-slate-600">
              Vesting calculations are based on the vesting terms
              supplied to the product. Actual vesting rights are governed
              by the relevant grant agreement, ESOP plan, employment
              terms and applicable company documentation.
            </p>

            <div className="mt-6 flex items-start gap-4 rounded-[22px] border border-amber-200 bg-amber-50 p-6">
              <Clock3 className="mt-1 h-5 w-5 shrink-0 text-amber-700" />

              <div>
                <h3 className="font-black text-amber-950">
                  Exercise windows matter.
                </h3>

                <p className="mt-2 text-sm leading-7 text-amber-950/75">
                  Post-termination exercise periods and expiry conditions
                  can materially affect whether vested options can
                  actually be exercised. Missing exercise-window
                  information should therefore not be ignored.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* 07 */}

          <AnimatedSection
            id="tax"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="07"
              title="Tax estimates"
            />

            <p className="leading-7 text-slate-600">
              Tax-related functionality in ESOP Value Clarity is
              educational and illustrative. Tax treatment depends on
              applicable law, jurisdiction, taxpayer circumstances,
              transaction timing, security type and other facts.
            </p>

            <div className="mt-6 rounded-[22px] border border-red-200 bg-red-50/60 p-6">
              <div className="flex gap-4">
                <TriangleAlert className="mt-1 h-5 w-5 shrink-0 text-red-600" />

                <p className="text-sm leading-7 text-slate-600">
                  Do not use a tax estimate from the platform as a
                  substitute for professional tax advice or an official
                  tax calculation.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* 08 */}

          <AnimatedSection
            id="exit"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="08"
              title="Exit scenarios"
            />

            <p className="leading-7 text-slate-600">
              Exit modelling illustrates possible outcomes under
              hypothetical company valuations and other assumptions.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Conservative",
                  icon: Gauge,
                },
                {
                  label: "Expected",
                  icon: LineChart,
                },
                {
                  label: "Optimistic",
                  icon: TrendingUp,
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.label}
                    animate={{
                      y: [0, index === 1 ? -4 : -2, 0],
                    }}
                    transition={{
                      duration: 3.5 + index,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="rounded-[22px] border border-slate-200 bg-slate-50 p-5"
                  >
                    <Icon className="h-5 w-5 text-blue-600" />

                    <p className="mt-4 font-black">
                      {item.label}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Scenario, not prediction.
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <p className="mt-6 text-sm leading-7 text-slate-600">
              No scenario implies that an IPO, acquisition, secondary
              sale or other liquidity event will occur.
            </p>
          </AnimatedSection>

          {/* 09 */}

          <AnimatedSection
            id="offers"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="09"
              title="Offer Intelligence"
            />

            <p className="leading-7 text-slate-600">
              Offer Intelligence helps structure and compare confirmed
              employment-offer information across cash compensation,
              equity economics, vesting and exercise considerations.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <motion.div
                whileHover={{ y: -5 }}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-6"
              >
                <FileSearch className="h-6 w-6 text-blue-600" />

                <h3 className="mt-4 font-black">
                  Extraction can be imperfect
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Document extraction may miss, misread or
                  misclassify information. Important fields should be
                  reviewed against the original document.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-6"
              >
                <BriefcaseBusiness className="h-6 w-6 text-violet-600" />

                <h3 className="mt-4 font-black">
                  Economics are not the whole job
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Culture, role quality, manager, career progression,
                  stability, location, working conditions and personal
                  priorities may matter as much as financial terms.
                </p>
              </motion.div>
            </div>
          </AnimatedSection>

          {/* 10 */}

          <AnimatedSection
            id="scores"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="10"
              title="Comparison signals"
            />

            <div className="relative overflow-hidden rounded-[26px] bg-[#050b18] p-7 text-white">
              <motion.div
                className="absolute right-[-80px] top-[-80px] h-64 w-64 rounded-full bg-violet-500/10 blur-[80px]"
                animate={{
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                }}
              />

              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                  Offer Intelligence signal
                </p>

                <div className="mt-5 flex items-end gap-5">
                  <div>
                    <p className="text-xs font-bold text-slate-500">
                      OFFER A
                    </p>

                    <p className="mt-1 text-4xl font-black">
                      42
                    </p>
                  </div>

                  <div className="pb-2 text-sm text-slate-500">
                    vs
                  </div>

                  <div>
                    <p className="text-xs font-bold text-violet-300">
                      OFFER B
                    </p>

                    <p className="mt-1 text-4xl font-black text-violet-300">
                      58
                    </p>
                  </div>
                </div>

                <motion.div
                  className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"
                >
                  <motion.div
                    className="h-full rounded-full bg-violet-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: "58%" }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 1.2,
                      ease: "easeOut",
                    }}
                  />
                </motion.div>

                <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300">
                  A comparison score or stronger signal is an analytical
                  summary of the confirmed data and current methodology.
                  It is not a probability of success and does not mean
                  that one employer or job is objectively better for you.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* 11 */}

          <AnimatedSection
            id="documents"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="11"
              title="Source documents"
            />

            <p className="leading-7 text-slate-600">
              Offer letters, ESOP plans, grant agreements, cap-table
              information, company communications and other official
              documents may contain terms that materially affect your
              rights.
            </p>

            <p className="mt-4 font-bold leading-7 text-slate-900">
              Your official documents prevail over an extracted,
              summarized or modelled representation inside ESOP Value
              Clarity.
            </p>
          </AnimatedSection>

          {/* 12 */}

          <AnimatedSection
            id="decisions"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="12"
              title="Your decisions"
            />

            <p className="leading-7 text-slate-600">
              You remain responsible for evaluating your own
              circumstances and making decisions concerning employment,
              equity exercise, investment, taxation and financial
              planning.
            </p>

            <div className="mt-6 flex items-start gap-4 rounded-[22px] border border-emerald-200 bg-emerald-50/60 p-6">
              <Scale className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />

              <p className="text-sm leading-7 text-slate-600">
                Use ESOP Value Clarity to ask better questions and
                understand trade-offs—not to outsource the final
                decision.
              </p>
            </div>
          </AnimatedSection>

          {/* 13 */}

          <AnimatedSection
            id="accuracy"
            className="border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="13"
              title="Accuracy & availability"
            />

            <p className="leading-7 text-slate-600">
              We aim to make ESOP Value Clarity useful, transparent and
              reliable, but we do not guarantee that every calculation,
              extraction, estimate, data point or product feature will
              always be complete, accurate, current or available.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              Product functionality and modelling methodologies may be
              corrected, refined or changed as the platform develops.
            </p>
          </AnimatedSection>

          {/* 14 */}

          <AnimatedSection
            id="contact"
            className="p-7 sm:p-10"
          >
            <SectionHeading
              number="14"
              title="Contact"
            />

            <p className="leading-7 text-slate-600">
              Questions about this Disclaimer or ESOP Value Clarity can
              be sent to:
            </p>

            <motion.a
              href="mailto:esopvalueclarity@gmail.com"
              whileHover={{
                x: 5,
                scale: 1.01,
              }}
              whileTap={{
                scale: 0.99,
              }}
              className="group mt-6 flex max-w-xl items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Mail className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Product enquiries
                  </p>

                  <p className="mt-1 font-black text-slate-950">
                    esopvalueclarity@gmail.com
                  </p>
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-slate-400 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.a>
          </AnimatedSection>
        </article>
      </section>

      {/* =====================================================
          FINAL WARNING / TRUST STRIP
      ====================================================== */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[30px] bg-[#020713] p-8 text-white"
          >
            <motion.div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-[90px]"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
              }}
            />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex max-w-3xl items-start gap-5">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
                  <TriangleAlert className="h-5 w-5" />

                  <motion.div
                    className="absolute inset-0 rounded-2xl border border-amber-300/20"
                    animate={{
                      scale: [1, 1.45],
                      opacity: [0.6, 0],
                    }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                    }}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                    Before making a material decision
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    Verify the inputs. Read the documents. Understand the uncertainty.
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    ESOP Value Clarity can make complex equity economics
                    easier to reason about. It cannot guarantee what your
                    equity, company or career will become.
                  </p>
                </div>
              </div>

              <Link
                href="/"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black transition hover:bg-blue-500"
              >
                Return to product
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </div>
          </motion.div>

          {/* FOOTER */}

          <div className="mt-8 flex flex-col gap-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-700">
                © {new Date().getFullYear()} ESOP Value Clarity
              </p>

              <p className="mt-1">
                Equity intelligence for clearer employee decisions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <Link
                href="/privacy"
                className="transition hover:text-slate-950"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="transition hover:text-slate-950"
              >
                Terms
              </Link>

              <Link
                href="/disclaimer"
                className="font-black text-slate-950"
              >
                Disclaimer
              </Link>

              <span className="hidden h-4 w-px bg-slate-200 sm:block" />

              <span className="inline-flex items-center gap-2">
                <LockKeyhole className="h-3.5 w-3.5" />
                Decision support, not financial advice
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
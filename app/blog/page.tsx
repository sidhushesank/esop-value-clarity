import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import LiveEquityPreview from "@/app/blog/LiveEquityPreview";
import Footer from "@/components/sections/Footer";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  Clock3,
  FileSearch,
  Gauge,
  GraduationCap,
  Landmark,
  Layers3,
  LineChart,
  Percent,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";

/* ============================================================
   SEO METADATA
============================================================ */

export const metadata: Metadata = {
  title:
    "ESOP Guides, Startup Equity & Stock Options | ESOP Value Clarity",

  description:
    "Learn how ESOPs, stock options, vesting, dilution, exercise price, startup valuation, tax and exit scenarios affect employee equity. Practical guides from ESOP Value Clarity.",

  keywords: [
    "ESOP",
    "ESOP India",
    "ESOP calculator",
    "employee stock options",
    "startup ESOP",
    "startup equity",
    "employee equity",
    "stock options",
    "ESOP vesting",
    "ESOP dilution",
    "ESOP exercise price",
    "ESOP tax India",
    "ESOP valuation",
    "ESOP exit value",
    "RSU vs ESOP",
    "startup compensation",
    "equity compensation",
    "offer comparison",
    "startup offer comparison",
  ],

  alternates: {
    canonical: "/blog",
  },

  openGraph: {
    title:
      "ESOP Guides & Startup Equity Learning | ESOP Value Clarity",
    description:
      "Understand ESOPs, vesting, dilution, exercise costs, taxation and startup equity through practical employee-first guides.",
    type: "website",
    url: "/blog",
    siteName: "ESOP Value Clarity",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "ESOP Guides & Startup Equity Learning | ESOP Value Clarity",
    description:
      "Practical guides for understanding ESOPs, employee equity, vesting, dilution, exercise costs and startup outcomes.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

/* ============================================================
   ARTICLES

   IMPORTANT:
   Keep article metadata centralized here.

   When we add future SEO articles, they can first be added here
   and later moved into a shared content/data layer.
============================================================ */

const articles = [
  {
    title: "What is an ESOP? Complete Beginner's Guide",
    description:
      "Understand employee stock options, how startup ESOPs work, what an option grant actually gives you and which numbers matter before estimating value.",
    slug: "what-is-an-esop",
    readTime: "10 min read",
    category: "ESOP Basics",
    number: "01",
    icon: GraduationCap,
    featured: true,
  },
  {
    title: "ESOP vs RSU: What's the Difference?",
    description:
      "Compare ESOPs and RSUs across ownership, exercise requirements, value, liquidity and the way employees participate in company equity.",
    slug: "esop-vs-rsu",
    readTime: "8 min read",
    category: "Equity",
    number: "02",
    icon: Scale,
    featured: false,
  },
  {
    title: "How Dilution Affects Your ESOP Value",
    description:
      "Understand why your ownership percentage can change after funding rounds and how dilution can affect potential employee equity outcomes.",
    slug: "dilution-explained",
    readTime: "7 min read",
    category: "Dilution",
    number: "03",
    icon: Percent,
    featured: false,
  },
  {
    title: "Understanding ESOP Vesting Schedules",
    description:
      "Learn how vesting periods, cliffs and vesting frequency determine when employee stock options are actually earned.",
    slug: "vesting-schedule",
    readTime: "9 min read",
    category: "Vesting",
    number: "04",
    icon: Clock3,
    featured: false,
  },
];

/* ============================================================
   TOPIC CLUSTERS

   These are intentionally aligned with the real product.

   Later each cluster can become its own SEO landing page.
============================================================ */

const topicClusters = [
  {
    title: "ESOP fundamentals",
    description:
      "Understand grants, strike price, FMV, ownership and the language behind employee stock options.",
    icon: BookOpen,
    label: "START HERE",
  },
  {
    title: "Vesting & ownership",
    description:
      "Understand what has vested, what remains unvested and how time changes your equity position.",
    icon: Layers3,
    label: "OWNERSHIP",
  },
  {
    title: "Dilution & funding",
    description:
      "Learn what happens to employee ownership when companies raise capital or expand their share base.",
    icon: Percent,
    label: "CAP TABLE",
  },
  {
    title: "Exercise economics",
    description:
      "Understand strike price, exercise cost and why receiving options is different from owning shares.",
    icon: WalletCards,
    label: "EXERCISE",
  },
  {
    title: "Exit scenarios",
    description:
      "Explore how different company outcomes can change the potential economic value of employee equity.",
    icon: TrendingUp,
    label: "SCENARIOS",
  },
  {
    title: "Tax & take-home",
    description:
      "Understand why headline equity value and the amount eventually retained by an employee can differ.",
    icon: Landmark,
    label: "TAX",
  },
  {
    title: "Offer Intelligence",
    description:
      "Learn how to compare salary, variable compensation and equity without treating speculative value as guaranteed cash.",
    icon: BriefcaseBusiness,
    label: "PRO",
  },
  {
    title: "Equity decisions",
    description:
      "Bring vesting, dilution, exercise cost, valuation and uncertainty together before making a decision.",
    icon: Scale,
    label: "DECISIONS",
  },
];

/* ============================================================
   FUTURE SEO ROADMAP PREVIEW

   These are NOT linked because pages do not exist yet.
============================================================ */

const upcomingTopics = [
  "How to calculate ESOP value",
  "What is ESOP exercise price?",
  "What is FMV in ESOPs?",
  "ESOP tax in India",
  "What happens to ESOPs when you leave a company?",
  "How startup funding affects employee ESOPs",
];

/* ============================================================
   BLOG PAGE
============================================================ */

export default function BlogPage() {
  const featuredArticle = articles.find(
    (article) => article.featured
  );

  const remainingArticles = articles.filter(
    (article) => !article.featured
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-950">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden border-b border-slate-200 bg-[#030817] text-white">
        {/* GRID */}

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.14) 1px, transparent 1px)",
            backgroundSize: "68px 68px",
          }}
        />

        {/* AMBIENT LIGHT */}

        <div className="pointer-events-none absolute -left-40 -top-40 h-[620px] w-[620px] animate-pulse rounded-full bg-blue-600/10 blur-[150px]" />

        <div className="pointer-events-none absolute -right-32 top-[-180px] h-[620px] w-[620px] rounded-full bg-violet-600/10 blur-[160px]" />

        <div className="pointer-events-none absolute bottom-[-250px] left-[35%] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.07] blur-[140px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            {/* LEFT */}

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/[0.07] px-4 py-2 backdrop-blur">
                <BookOpen className="h-4 w-4 text-blue-300" />

                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">
                  Equity Intelligence Journal
                </span>
              </div>

              <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.06em] md:text-7xl">
                Understand the
                <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                  economics behind equity.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                Practical, employee-first guides to ESOPs,
                vesting, ownership, dilution, exercise cost,
                taxation and startup outcomes — built around
                the questions that matter before making an
                equity decision.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#guides"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-[0_15px_40px_-15px_rgba(37,99,235,.8)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-12px_rgba(37,99,235,.9)]"
                >
                  Explore equity guides

                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </a>

                <Link
                  href="/simulator"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-6 text-sm font-black text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09]"
                >
                  <Calculator className="h-4 w-4 text-blue-300" />
                  Model your ESOP
                </Link>
              </div>

              {/* PRODUCT CONNECTION */}

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-slate-400">
                {[
                  "Learn the concept",
                  "Model the assumptions",
                  "Understand the trade-off",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — EQUITY INTELLIGENCE TERMINAL */}

            <div className="relative">
              <div className="absolute -inset-10 rounded-full bg-blue-500/[0.05] blur-3xl" />

              <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#081120]/90 shadow-[0_45px_120px_-35px_rgba(0,0,0,.85)] backdrop-blur-xl">
                {/* WINDOW HEADER */}

                <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    <ActivityIndicator />
                    Equity intelligence
                  </div>
                </div>

                <div className="p-6 md:p-7">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">
                        One grant. Multiple variables.
                      </p>

                      <h2 className="mt-2 text-2xl font-black tracking-tight">
                        What changes the outcome?
                      </h2>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-300">
                      <LineChart className="h-5 w-5" />
                    </div>
                  </div>

                  {/* FLOW */}

                  <div className="mt-7 space-y-2">
                    {[
                      {
                        label: "Grant",
                        value: "10,000 options",
                        icon: Layers3,
                      },
                      {
                        label: "Vesting",
                        value: "Time changes ownership",
                        icon: Clock3,
                      },
                      {
                        label: "Dilution",
                        value: "Funding can change %",
                        icon: Percent,
                      },
                      {
                        label: "Exercise",
                        value: "Cash may be required",
                        icon: WalletCards,
                      },
                      {
                        label: "Exit",
                        value: "Future value is uncertain",
                        icon: TrendingUp,
                      },
                    ].map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="group relative flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3.5 transition duration-300 hover:translate-x-2 hover:bg-white/[0.06]"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0b1526] text-blue-300 transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                              {item.label}
                            </p>

                            <p className="mt-0.5 truncate text-sm font-bold text-slate-200">
                              {item.value}
                            </p>
                          </div>

                          <span className="font-mono text-[10px] font-black text-slate-600">
                            0{index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-300/10 bg-amber-300/[0.05] px-4 py-3">
                    <Gauge className="h-4 w-4 shrink-0 text-amber-300" />

                    <p className="text-xs leading-5 text-slate-400">
                      The goal is not to predict the startup.
                      It is to understand how assumptions change
                      your equity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HERO METRICS */}

          <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["04", "Published guides"],
              ["08", "Equity topic areas"],
              ["Employee-first", "Learning perspective"],
              ["Scenario-based", "Product philosophy"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07]"
              >
                <p className="text-xl font-black tracking-tight text-white">
                  {value}
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          TOPIC MAP
      ====================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
                Equity knowledge map
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-slate-950 md:text-5xl">
                Equity is a system,
                <span className="block text-slate-400">
                  not one number.
                </span>
              </h2>
            </div>

            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              A grant only makes sense when you understand the
              variables around it. These are the same connected
              concepts ESOP Value Clarity helps employees model.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topicClusters.map((topic, index) => {
              const Icon = topic.icon;

              return (
                <div
                  key={topic.title}
                  className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-[#f8fafc] p-6 transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:bg-white hover:shadow-[0_25px_70px_-35px_rgba(37,99,235,.35)]"
                >
                  <div className="absolute right-4 top-4 font-mono text-[10px] font-black text-slate-300">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="mt-6 text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                    {topic.label}
                  </p>

                  <h3 className="mt-2 text-lg font-black tracking-tight">
                    {topic.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {topic.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          GUIDES
      ====================================================== */}

      <section
        id="guides"
        className="mx-auto max-w-7xl px-6 py-24 md:py-28"
      >
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
              <Search className="h-4 w-4" />
              ESOP & startup equity guides
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">
              Start with the fundamentals.
            </h2>
          </div>

          <p className="max-w-lg text-base leading-7 text-slate-600">
            Every guide should answer a real employee question,
            explain the economics clearly and connect the concept
            back to an actual equity decision.
          </p>
        </div>

        {/* FEATURED */}

        {featuredArticle && (
          <div className="mt-14">
            <Link
              href={`/blog/${featuredArticle.slug}`}
              className="group grid overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_70px_-50px_rgba(15,23,42,.45)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_35px_90px_-45px_rgba(37,99,235,.35)] lg:grid-cols-[1.05fr_.95fr]"
            >
              <div className="p-8 md:p-10 lg:p-12">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-blue-700">
                    Featured guide
                  </span>

                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    {featuredArticle.readTime}
                  </span>
                </div>

                <p className="mt-9 font-mono text-xs font-black text-slate-300">
                  {featuredArticle.number}
                </p>

                <h3 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
                  {featuredArticle.title}
                </h3>

                <p className="mt-5 max-w-xl leading-7 text-slate-600">
                  {featuredArticle.description}
                </p>

                <div className="mt-8 inline-flex items-center gap-2 text-sm font-black text-blue-600">
                  Read the complete guide

                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-2" />
                </div>
              </div>

              {/* FEATURE VISUAL */}

              <div className="relative min-h-[340px] overflow-hidden bg-[#06101f] p-8 text-white">
                <div
                  className="absolute inset-0 opacity-[0.12]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(148,163,184,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.14) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                  }}
                />

                <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-500/10 blur-[80px]" />

                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-300">
                      <featuredArticle.icon className="h-5 w-5" />
                    </div>

                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Equity fundamentals
                    </span>
                  </div>

                  <div className="mt-14 space-y-3">
                    {[
                      ["Grant", "What did I receive?"],
                      ["Strike price", "What does exercise cost?"],
                      ["Vesting", "When do I earn it?"],
                      ["Value", "What could change it?"],
                    ].map(([label, value], index) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 transition duration-300 group-hover:translate-x-1"
                        style={{
                          transitionDelay: `${index * 40}ms`,
                        }}
                      >
                        <span className="text-xs font-semibold text-slate-500">
                          {label}
                        </span>

                        <span className="text-xs font-black text-slate-200">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* REMAINING ARTICLES */}

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {remainingArticles.map((article) => {
            const Icon = article.icon;

            return (
              <article
                key={article.slug}
                className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white p-7 transition duration-500 hover:-translate-y-2 hover:border-blue-200 hover:shadow-[0_30px_80px_-45px_rgba(37,99,235,.4)]"
              >
                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-100/0 blur-3xl transition duration-500 group-hover:bg-blue-100/70" />

                <div className="relative flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="font-mono text-xs font-black text-slate-300">
                    {article.number}
                  </span>
                </div>

                <div className="relative mt-8 flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-blue-700">
                    {article.category}
                  </span>

                  <span className="text-xs font-medium text-slate-400">
                    {article.readTime}
                  </span>
                </div>

                <h3 className="relative mt-6 text-2xl font-black tracking-[-0.035em] text-slate-950">
                  {article.title}
                </h3>

                <p className="relative mt-4 flex-1 text-sm leading-7 text-slate-600">
                  {article.description}
                </p>

                <Link
                  href={`/blog/${article.slug}`}
                  className="relative mt-8 flex items-center justify-between border-t border-slate-100 pt-5 text-sm font-black text-slate-950"
                >
                  Read guide

                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 transition duration-300 group-hover:translate-x-1 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          KNOWLEDGE → PRODUCT
      ====================================================== */}

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:py-28 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
              Knowledge → modelling
            </p>

            <h2 className="mt-4 max-w-xl text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">
              Don't stop at understanding the definition.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Learn what vesting, dilution and exercise price
              mean — then put your own assumptions into the
              simulator and see how those concepts interact.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Start with the equity you actually received",
                "Change the assumptions that affect potential value",
                "See scenarios instead of relying on one headline number",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-sm font-semibold text-slate-700"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>

                  {item}
                </div>
              ))}
            </div>

            <Link
              href="/simulator"
              className="group mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-black text-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              Open ESOP Simulator
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>

          {/* KEEP YOUR EXISTING GRAPH */}

          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-blue-100/50 blur-3xl" />

            <div className="relative transition duration-500 hover:-translate-y-1">
              <LiveEquityPreview />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FUTURE SEO CONTENT MAP
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white">
          <div className="grid lg:grid-cols-[.85fr_1.15fr]">
            <div className="border-b border-slate-200 p-8 md:p-10 lg:border-b-0 lg:border-r">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <Sparkles className="h-5 w-5" />
              </div>

              <p className="mt-7 text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                Growing knowledge base
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-950">
                More employee equity questions are coming.
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                The journal will expand around the questions
                employees actually search for when evaluating,
                exercising and understanding startup equity.
              </p>
            </div>

            <div className="p-8 md:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Planned learning tracks
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {upcomingTopics.map((topic, index) => (
                  <div
                    key={topic}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition duration-300 hover:translate-x-1 hover:bg-white hover:shadow-md"
                  >
                    <span className="font-mono text-[9px] font-black text-slate-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="text-sm font-bold text-slate-700">
                      {topic}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          OFFER INTELLIGENCE EDUCATION
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[32px] bg-[#030817] p-8 text-white md:p-12">
          <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.14) 1px, transparent 1px)",
              backgroundSize: "58px 58px",
            }}
          />

          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/10 blur-[90px]" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_.8fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                <FileSearch className="h-4 w-4" />
                Offer Intelligence
              </div>

              <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-[-0.05em] md:text-5xl">
                A bigger CTC does not automatically mean a better offer.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
                Salary, variable pay, ESOP quantity, strike
                price, FMV, vesting, dilution and exercise
                conditions tell different parts of the story.
                Our learning content will increasingly explain
                how to evaluate those trade-offs separately.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: "Guaranteed compensation",
                  icon: WalletCards,
                },
                {
                  label: "Performance-linked cash",
                  icon: Gauge,
                },
                {
                  label: "Equity opportunity",
                  icon: TrendingUp,
                },
                {
                  label: "Vesting & exercise risk",
                  icon: Clock3,
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur transition duration-300 hover:translate-x-2 hover:bg-white/[0.07]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-violet-300">
                      <Icon className="h-4 w-4" />
                    </div>

                    <span className="flex-1 text-sm font-bold text-slate-200">
                      {item.label}
                    </span>

                    <span className="font-mono text-[9px] font-black text-slate-600">
                      0{index + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[32px] border border-blue-200 bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 px-7 py-16 text-white shadow-[0_35px_100px_-50px_rgba(37,99,235,.65)] md:px-12 md:py-20">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />

          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-200/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                Learn → Model → Understand
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] md:text-5xl">
                Your equity has a number.
                <span className="block">
                  Understand what could change it.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50">
                Read the fundamentals, explore the assumptions
                and use ESOP Value Clarity to see how different
                futures could affect your equity.
              </p>
            </div>

            <Link
              href="/simulator"
              className="group inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              Start modelling
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ============================================================
   SMALL SERVER-SAFE VISUAL COMPONENT
============================================================ */

function ActivityIndicator() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}
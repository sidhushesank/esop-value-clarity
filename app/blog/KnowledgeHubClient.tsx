"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileSearch,
  Gauge,
  HandCoins,
  Landmark,
  Layers3,
  LineChart,
  Percent,
  PlayCircle,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
  UsersRound,
  WalletCards,
  Youtube,
} from "lucide-react";

type Audience =
  | "All"
  | "Employee"
  | "Founder"
  | "HR"
  | "CA"
  | "Tax";

type Guide = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  stage: string;
  audience: Exclude<Audience, "All">[];
  tags: string[];
  readTime: string;
  video: string;
  tools: string;
  icon: LucideIcon;
  featured?: boolean;
};

const YOUTUBE_ID = "k2LzKS1WkzA";

const LINKEDIN_URL =
  "https://www.linkedin.com/in/sheshank-sidheshwar-b84166252/";

const guides: Guide[] = [
  {
    slug: "startup-offered-25000-esops",
    title: "I received 25,000 ESOPs. Is that actually good?",
    summary:
      "A decision-first guide for employees who received a large option count but do not know the ownership percentage, exercise cost, dilution risk or realistic outcome range.",
    category: "Offer decision",
    stage: "I have an offer",
    audience: ["Employee", "Founder", "HR"],
    tags: ["offer", "grant", "ownership", "negotiation"],
    readTime: "4 min",
    video: "3 min video",
    tools: "2 mini tools",
    icon: Target,
    featured: true,
  },

  {
    slug: "should-i-negotiate-esops",
    title: "Should I negotiate ESOPs or salary in my startup offer?",
    summary:
      "Compare guaranteed cash with uncertain equity without pretending that a future exit value is the same as salary today.",
    category: "Negotiation",
    stage: "I am negotiating",
    audience: ["Employee", "Founder", "HR"],
    tags: ["negotiation", "salary", "offer", "tradeoff"],
    readTime: "2 min",
    video: "3 min video",
    tools: "1 framework",
    icon: Scale,
  },

  {
    slug: "esop-exercise-cost",
    title: "ESOP Exercise Price (Strike Price): Meaning, Cost and Tax in India",
    summary:
      "What the exercise (strike) price is, how Indian companies set it, and how to work out the full cash needed, including the tax at exercise.",
    category: "Exercise",
    stage: "I may exercise",
    audience: ["Employee", "CA", "Tax"],
    tags: ["exercise", "strike price", "cash", "tax"],
    readTime: "5 min",
    video: "3 min video",
    tools: "Calculator",
    icon: WalletCards,
  },

  {
    slug: "leaving-startup-esop-options",
    title: "I am leaving my startup. What happens to my vested options?",
    summary:
      "The leaving-company decision: vested vs unvested options, post-termination exercise windows, cash requirement and documents to check before your last day.",
    category: "Exit from company",
    stage: "I am leaving",
    audience: ["Employee", "HR", "CA"],
    tags: ["leaving", "exercise window", "vested", "unvested"],
    readTime: "2 min",
    video: "3 min video",
    tools: "Checklist",
    icon: Clock3,
  },

  {
    slug: "startup-raised-funding-dilution",
    title: "My startup raised funding. Did my ESOP become worthless?",
    summary:
      "A practical dilution guide that separates ownership percentage, company value, option pool expansion and future upside.",
    category: "Dilution",
    stage: "Funding happened",
    audience: ["Employee", "Founder", "HR"],
    tags: ["dilution", "funding", "ownership", "valuation"],
    readTime: "2 min",
    video: "3 min video",
    tools: "Scenario model",
    icon: Percent,
  },

  {
    slug: "compare-startup-offers-equity",
    title: "Two startup offers. Which equity package is stronger?",
    summary:
      "Compare salary, variable pay, ESOP quantity, strike price, vesting, exercise cost and risk without collapsing everything into one fake number.",
    category: "Offer comparison",
    stage: "I have two offers",
    audience: ["Employee", "HR"],
    tags: ["offer comparison", "salary", "ESOP", "risk"],
    readTime: "2 min",
    video: "3 min video",
    tools: "Comparison grid",
    icon: BriefcaseBusiness,
  },

  {
    slug: "what-is-an-esop",
    title: "What Is an ESOP? Meaning, Full Form and How It Works in India",
    summary:
      "ESOP meaning in plain language: grant, vesting, exercise and sale, the key terms, how ESOPs are taxed twice in India, and what to ask before you accept.",
    category: "Foundation",
    stage: "Start here",
    audience: ["Employee", "Founder", "HR", "CA"],
    tags: ["basics", "ESOP", "startup equity", "grant"],
    readTime: "6 min",
    video: "3 min video",
    tools: "Concept map",
    icon: Layers3,
  },

  {
    slug: "esop-vs-rsu",
    title: "ESOP vs RSU: do not compare unit counts blindly",
    summary:
      "Options and RSUs create different economics. This guide compares exercise price, settlement, tax, liquidity and offer value.",
    category: "Equity types",
    stage: "Compare equity",
    audience: ["Employee", "HR", "CA"],
    tags: ["RSU", "ESOP", "stock options", "offer"],
    readTime: "2 min",
    video: "3 min video",
    tools: "Comparison table",
    icon: Layers3,
  },

  {
    slug: "dilution-explained",
    title: "ESOP dilution explained without the panic",
    summary:
      "Your percentage can shrink while your potential value may still improve. The useful question is how dilution and valuation interact.",
    category: "Dilution",
    stage: "Understand ownership",
    audience: ["Employee", "Founder", "HR"],
    tags: ["dilution", "ownership", "funding", "option pool"],
    readTime: "2 min",
    video: "3 min video",
    tools: "Dilution model",
    icon: TrendingDown,
  },

  {
    slug: "vesting-schedule",
    title: "ESOP Vesting Schedule in India: 1-Year Cliff, 4-Year Vesting and Examples",
    summary:
      "The one-year cliff, monthly and yearly vesting, India's one-year minimum before vesting, a worked example, and what happens when you leave.",
    category: "Vesting",
    stage: "Understand timing",
    audience: ["Employee", "HR", "Founder"],
    tags: ["vesting", "cliff", "leaving", "earned equity"],
    readTime: "6 min",
    video: "3 min video",
    tools: "Timeline",
    icon: Clock3,
  },
  {
    slug: "esop-valuation-india",
    title: "ESOP valuation in India: FMV, merchant banker reports and fair value explained",
    summary:
      "The three meanings of ESOP valuation: the merchant banker FMV for tax, the exercise price, and the fair value in the company's accounts.",
    category: "Valuation",
    stage: "Understand value",
    audience: ["Founder", "CA", "Tax", "Employee"],
    tags: ["valuation", "FMV", "merchant banker", "Black-Scholes"],
    readTime: "5 min",
    video: "3 min video",
    tools: "Valuation map",
    icon: Landmark,
  },

  {
    slug: "cap-table-india",
    title: "How to make a cap table for an Indian startup (with a free builder)",
    summary:
      "Equity, CCPS, the ESOP pool and fully diluted ownership, modelling a round with the pool top-up, and the registers your cap table must match.",
    category: "Cap table",
    stage: "Founder basics",
    audience: ["Founder", "CA", "HR"],
    tags: ["cap table", "fully diluted", "ESOP pool", "funding round"],
    readTime: "5 min",
    video: "3 min video",
    tools: "Free cap table builder",
    icon: Layers3,
  }
];

const audienceFilters: Audience[] = [
  "All",
  "Employee",
  "Founder",
  "HR",
  "CA",
  "Tax",
];

const decisionFilters = [
  "All decisions",
  "I have an offer",
  "I am negotiating",
  "I may exercise",
  "I am leaving",
  "Funding happened",
  "I have two offers",
];

const personaCards = [
  {
    title: "Employees",
    subtitle:
      "Decode your offer before accepting, negotiating, exercising or leaving.",
    icon: UserRound,
    bullets: [
      "What does the grant represent?",
      "How much cash may I need?",
      "What could dilution change?",
    ],
  },

  {
    title: "Founders",
    subtitle:
      "Explain equity without overselling future outcomes or hiding uncertainty.",
    icon: Building2,
    bullets: [
      "Make offers easier to understand",
      "Reduce option-count confusion",
      "Communicate scenarios responsibly",
    ],
  },

  {
    title: "HR and Rewards",
    subtitle:
      "Turn equity communication into a repeatable employee education system.",
    icon: UsersRound,
    bullets: [
      "Offer explainers",
      "Vesting conversations",
      "Leaving-company checklists",
    ],
  },

  {
    title: "CAs and advisors",
    subtitle:
      "Model cash, tax, timing and scenario sensitivity before major decisions.",
    icon: Landmark,
    bullets: [
      "Exercise-cost planning",
      "Tax-sensitive events",
      "Client-ready explanation paths",
    ],
  },
];

const toolCards = [
  {
    title: "Grant reality check",
    detail: "Move from option count to ownership questions.",
    icon: Target,
  },
  {
    title: "Exercise cost lens",
    detail: "See why vested options can still require cash.",
    icon: WalletCards,
  },
  {
    title: "Dilution scenario lens",
    detail:
      "Understand how future funding can change percentage ownership.",
    icon: Percent,
  },
  {
    title: "Offer comparison lens",
    detail:
      "Separate guaranteed salary from uncertain equity opportunity.",
    icon: Scale,
  },
];

function formatINR(value: number) {
  if (!Number.isFinite(value)) return "-";

  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }

  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function KnowledgeHubClient() {
  const [activeAudience, setActiveAudience] =
    useState<Audience>("All");

  const [activeDecision, setActiveDecision] =
    useState("All decisions");

  const [query, setQuery] = useState("");

  const [optionCount, setOptionCount] = useState(25000);
  const [strikePrice, setStrikePrice] = useState(10);
  const [exitPrice, setExitPrice] = useState(120);
  const [dilution, setDilution] = useState(20);

  const filteredGuides = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return guides.filter((guide) => {
      const matchesAudience =
        activeAudience === "All" ||
        guide.audience.includes(
          activeAudience as Exclude<Audience, "All">,
        );

      const matchesDecision =
        activeDecision === "All decisions" ||
        guide.stage === activeDecision;

      const searchable =
        `${guide.title} ${guide.summary} ${guide.category} ${guide.stage} ${guide.tags.join(
          " ",
        )}`.toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        searchable.includes(normalizedQuery);

      return (
        matchesAudience &&
        matchesDecision &&
        matchesQuery
      );
    });
  }, [activeAudience, activeDecision, query]);

  const featuredGuide =
    guides.find((guide) => guide.featured) ?? guides[0];

  const exerciseCost =
    optionCount * strikePrice;

  const preDilutionSpread =
    optionCount *
    Math.max(exitPrice - strikePrice, 0);

  const postDilutionSpread =
    preDilutionSpread *
    (1 - dilution / 100);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-[#0f172a]">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#dbe5f0] bg-[#030817] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
            backgroundSize: "68px 68px",
          }}
        />

        <div className="pointer-events-none absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-[#2563eb]/20 blur-[150px]" />
        <div className="pointer-events-none absolute -right-40 top-[-180px] h-[620px] w-[620px] rounded-full bg-[#94a3b8]/15 blur-[160px]" />
        <div className="pointer-events-none absolute bottom-[-260px] left-[38%] h-[540px] w-[540px] rounded-full bg-[#3b82f6]/10 blur-[150px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 backdrop-blur">
                <Sparkles className="h-4 w-4 text-[#3b82f6]" />

                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#bfdbfe]">
                  Equity Intelligence Hub
                </span>
              </div>

              <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.06em] md:text-7xl">
                Startup equity is not one number.
                <span className="block text-[#60a5fa]">
                  It is a decision system.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-[#dbeafe] md:text-xl">
                Decision-first guides, mini tools and scenario
                frameworks for employees, founders, HR teams and
                advisors who need to understand ESOPs before
                accepting, negotiating, exercising or explaining
                equity.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#decision-center"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 text-sm font-black text-white shadow-[0_18px_50px_-20px_rgba(37,99,235,.75)] transition duration-300 hover:-translate-y-1 hover:bg-[#3b82f6]"
                >
                  Find my equity decision

                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </a>

                <Link
                  href="/simulator"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-6 text-sm font-black text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12]"
                >
                  <Calculator className="h-4 w-4 text-[#60a5fa]" />
                  Open ESOP simulator
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
                {[
                  ["Decision-first", "not dictionary-first"],
                  ["Scenario-based", "not predictions"],
                  ["Product-linked", "learn, model, compare"],
                ].map(([value, label]) => (
                  <div
                    key={value}
                    className="rounded-2xl border border-white/[0.1] bg-white/[0.06] p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09]"
                  >
                    <p className="text-sm font-black text-white">
                      {value}
                    </p>

                    <p className="mt-1 text-xs text-[#94a3b8]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision map */}
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-[#2563eb]/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[#06101f]/85 shadow-[0_45px_130px_-45px_rgba(0,0,0,.9)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#60a5fa]" />
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#60a5fa] opacity-50" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#60a5fa]" />
                    </span>

                    Decision map
                  </div>
                </div>

                <div className="p-6 md:p-7">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#60a5fa]">
                        One grant. Many questions.
                      </p>

                      <h2 className="mt-2 text-2xl font-black tracking-tight">
                        What should I check before I believe the number?
                      </h2>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#3b82f6]/25 bg-[#3b82f6]/10 text-[#60a5fa]">
                      <LineChart className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-7 space-y-2">
                    {[
                      [Layers3, "Grant", "How many options and what type?"],
                      [Percent, "Ownership", "What percentage do they represent?"],
                      [WalletCards, "Exercise", "How much cash is required?"],
                      [Gauge, "Dilution", "What can future funding change?"],
                      [TrendingUp, "Outcome", "What scenarios are realistic?"],
                    ].map(([IconValue, label, detail], index) => {
                      const Icon = IconValue as LucideIcon;

                      return (
                        <div
                          key={String(label)}
                          className="group relative flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3.5 transition duration-300 hover:translate-x-2 hover:bg-white/[0.075]"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#030817] text-[#60a5fa] transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#94a3b8]">
                              {String(label)}
                            </p>

                            <p className="mt-0.5 truncate text-sm font-bold text-white">
                              {String(detail)}
                            </p>
                          </div>

                          <span className="font-mono text-[10px] font-black text-[#64748b]">
                            0{index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#3b82f6]/15 bg-[#3b82f6]/10 px-4 py-3">
                    <p className="text-xs leading-5 text-[#dbeafe]">
                      Move from confusion to a model — not from one
                      definition to another definition.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER VIDEO */}
      <section className="border-b border-[#dbe5f0] bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:py-20 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#93c5fd] bg-[#eff6ff] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d4ed8]">
              <PlayCircle className="h-4 w-4" />
              Founder video included
            </div>

            <h2 className="mt-6 max-w-xl text-4xl font-black tracking-[-0.045em] text-[#0f172a] md:text-5xl">
              Put Sheshank's explanation inside the learning flow.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-[#475569]">
              The video is not a random embed. It becomes a trust
              layer: watch the founder explain the problem, then
              move into the decision framework and the product.
            </p>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[#2563eb] hover:text-[#1d4ed8]"
            >
              Follow Sheshank on LinkedIn
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-[#dbe5f0] bg-white shadow-[0_35px_100px_-55px_rgba(15,23,42,.35)]">
            <div className="aspect-video bg-[#030817]">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1`}
                title="ESOP Value Clarity video by Sheshank"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-3">
              {[
                ["Watch", "Founder context"],
                ["Read", "Decision framework"],
                ["Model", "Simulator path"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#dbe5f0] bg-[#f7f9fc] p-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2563eb]">
                    {label}
                  </p>

                  <p className="mt-1 text-sm font-black text-[#0f172a]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DECISION CENTER */}
      <section
        id="decision-center"
        className="mx-auto max-w-7xl px-6 py-20 md:py-24"
      >
        <div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#2563eb]">
              <Search className="h-4 w-4" />
              Decision center
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#0f172a] md:text-5xl">
              Start with the situation, not the textbook topic.
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-8 text-[#475569]">
            People rarely search for equity because they want
            definitions. They search because something happened:
            an offer, a funding round, an exit, a tax question or a
            negotiation moment.
          </p>
        </div>

        <div className="mt-10 rounded-[32px] border border-[#dbe5f0] bg-white p-5 shadow-[0_30px_100px_-65px_rgba(15,23,42,.35)] md:p-7">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94a3b8]" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search exercise, dilution, leaving, offer, RSU, tax..."
                className="h-14 w-full rounded-2xl border border-[#dbe5f0] bg-white pl-12 pr-4 text-sm font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/15"
              />
            </div>

            <Link
              href="/simulator"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#030817] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#06101f]"
            >
              <Calculator className="h-4 w-4 text-[#60a5fa]" />
              Model in simulator
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-5 rounded-[24px] border border-[#dbe5f0] bg-[#f7f9fc] p-5">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#1d4ed8]">
                  <SlidersHorizontal className="h-4 w-4" />
                  Reader
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {audienceFilters.map((audience) => (
                    <button
                      key={audience}
                      type="button"
                      onClick={() => setActiveAudience(audience)}
                      className={`rounded-full px-3 py-2 text-xs font-black transition ${
                        activeAudience === audience
                          ? "bg-[#030817] text-white shadow-md"
                          : "border border-[#dbe5f0] bg-white text-[#475569] hover:border-[#2563eb] hover:text-[#0f172a]"
                      }`}
                    >
                      {audience}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d4ed8]">
                  Situation
                </p>

                <div className="mt-3 space-y-2">
                  {decisionFilters.map((decision) => (
                    <button
                      key={decision}
                      type="button"
                      onClick={() => setActiveDecision(decision)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-xs font-black transition ${
                        activeDecision === decision
                          ? "bg-[#dbeafe] text-[#0f172a] ring-1 ring-[#2563eb]/35"
                          : "bg-white text-[#475569] hover:bg-[#eff6ff] hover:text-[#0f172a]"
                      }`}
                    >
                      {decision}

                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-black text-[#0f172a]">
                  {filteredGuides.length} decision guide
                  {filteredGuides.length === 1 ? "" : "s"} found
                </p>

                <p className="text-xs font-semibold text-[#64748b]">
                  Search intent → useful explanation → product action
                </p>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {filteredGuides.map((guide) => {
                  const Icon = guide.icon;

                  return (
                    <Link
                      key={guide.slug}
                      href={`/blog/${guide.slug}`}
                      className="group relative overflow-hidden rounded-[26px] border border-[#dbe5f0] bg-white p-6 transition duration-500 hover:-translate-y-2 hover:border-[#2563eb] hover:shadow-[0_35px_90px_-55px_rgba(37,99,235,.35)]"
                    >
                      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#3b82f6]/0 blur-3xl transition duration-500 group-hover:bg-[#3b82f6]/20" />

                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dbe5f0] bg-white text-[#2563eb] shadow-sm transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
                          <Icon className="h-5 w-5" />
                        </div>

                        <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#1d4ed8]">
                          {guide.category}
                        </span>
                      </div>

                      <h3 className="relative mt-6 text-2xl font-black leading-[1.05] tracking-[-0.04em] text-[#0f172a]">
                        {guide.title}
                      </h3>

                      <p className="relative mt-4 text-sm leading-7 text-[#475569]">
                        {guide.summary}
                      </p>

                      <div className="relative mt-6 flex flex-wrap gap-2">
                        {[
                          guide.stage,
                          guide.readTime,
                          guide.video,
                          guide.tools,
                        ].map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-[#dbe5f0] bg-white px-3 py-1.5 text-[10px] font-black text-[#475569]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="relative mt-6 flex items-center justify-between border-t border-[#dbe5f0] pt-5 text-sm font-black text-[#2563eb]">
                        Open guide

                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe5f0] bg-white transition duration-300 group-hover:translate-x-1 group-hover:border-[#2563eb] group-hover:bg-[#2563eb] group-hover:text-white">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {filteredGuides.length === 0 && (
                <div className="mt-5 rounded-[26px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center">
                  <Search className="mx-auto h-6 w-6 text-[#94a3b8]" />

                  <p className="mt-4 text-sm font-black text-[#0f172a]">
                    No decision guides match those filters.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setActiveAudience("All");
                      setActiveDecision("All decisions");
                    }}
                    className="mt-5 rounded-xl bg-[#030817] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#2563eb]"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MINI SCENARIO */}
      <section className="border-y border-[#dbe5f0] bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:py-24 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2563eb]">
              Mini scenario lab
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#0f172a] md:text-5xl">
              Make the page feel like a product, not a post.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#475569]">
              Readers should be able to touch the assumptions. This
              small interactive preview gives them a feel for the
              model, then routes serious analysis into EVC.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {toolCards.map((tool) => {
                const Icon = tool.icon;

                return (
                  <div
                    key={tool.title}
                    className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-sm"
                  >
                    <Icon className="h-5 w-5 text-[#2563eb]" />

                    <p className="mt-4 font-black text-[#0f172a]">
                      {tool.title}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#475569]">
                      {tool.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[32px] border border-[#dbe5f0] bg-white p-6 shadow-[0_35px_100px_-60px_rgba(15,23,42,.35)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2563eb]">
                  Quick model
                </p>

                <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#0f172a]">
                  Option spread after dilution
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                <Calculator className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <RangeInput
                label="Options"
                value={optionCount}
                min={1000}
                max={100000}
                step={1000}
                onChange={setOptionCount}
                display={optionCount.toLocaleString("en-IN")}
              />

              <RangeInput
                label="Strike price"
                value={strikePrice}
                min={1}
                max={100}
                step={1}
                onChange={setStrikePrice}
                display={`₹${strikePrice}`}
              />

              <RangeInput
                label="Exit share value assumption"
                value={exitPrice}
                min={10}
                max={500}
                step={5}
                onChange={setExitPrice}
                display={`₹${exitPrice}`}
              />

              <RangeInput
                label="Future dilution assumption"
                value={dilution}
                min={0}
                max={60}
                step={5}
                onChange={setDilution}
                display={`${dilution}%`}
              />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Exercise cost"
                value={formatINR(exerciseCost)}
              />

              <MetricCard
                label="Pre-dilution spread"
                value={formatINR(preDilutionSpread)}
              />

              <MetricCard
                label="After dilution"
                value={formatINR(postDilutionSpread)}
                highlight
              />
            </div>

            <p className="mt-5 rounded-2xl border border-[#93c5fd] bg-[#f7f9fc] p-4 text-xs leading-6 text-[#64748b]">
              Simplified educational preview. It does not include
              taxes, liquidation preferences, plan-specific rules,
              transaction costs or liquidity restrictions.
            </p>

            <Link
              href="/simulator"
              className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#2563eb]"
            >
              Continue in the full simulator
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[.76fr_1.24fr] lg:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2563eb]">
              Audience lanes
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#0f172a] md:text-5xl">
              Same equity problem.
              <span className="block text-[#94a3b8]">
                Different questions.
              </span>
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-8 text-[#475569]">
            The hub is deliberately useful to the people who have
            shown the strongest reason to understand this product:
            employees making real decisions, founders, HR and
            compensation teams, and CAs/advisors.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {personaCards.map((persona, index) => {
            const Icon = persona.icon;

            return (
              <div
                key={persona.title}
                className="group relative overflow-hidden rounded-[28px] border border-[#dbe5f0] bg-white p-6 transition duration-500 hover:-translate-y-2 hover:border-[#2563eb] hover:shadow-[0_30px_90px_-55px_rgba(37,99,235,.4)]"
              >
                <span className="absolute right-5 top-5 font-mono text-xs font-black text-[#cbd5e1]">
                  0{index + 1}
                </span>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dbe5f0] bg-[#f7f9fc] text-[#2563eb] transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-7 text-xl font-black tracking-[-0.03em] text-[#0f172a]">
                  {persona.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#475569]">
                  {persona.subtitle}
                </p>

                <div className="mt-6 space-y-3 border-t border-[#dbe5f0] pt-5">
                  {persona.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="flex gap-2 text-xs font-semibold leading-5 text-[#475569]"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" />
                      {bullet}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURED CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[36px] bg-[#030817] p-8 text-white md:p-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)",
              backgroundSize: "58px 58px",
            }}
          />

          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2563eb]/20 blur-[90px]" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_.82fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#60a5fa]">
                <FileSearch className="h-4 w-4" />
                Featured decision
              </p>

              <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-[-0.05em] md:text-5xl">
                {featuredGuide.title}
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-[#dbeafe]">
                {featuredGuide.summary}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/blog/${featuredGuide.slug}`}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 text-sm font-black text-white transition duration-300 hover:-translate-y-1 hover:bg-[#3b82f6]"
                >
                  Open the guide

                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </Link>

                <Link
                  href="/pro/offers/new"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-6 text-sm font-black text-white transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12]"
                >
                  Try Offer Intelligence
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {[
                [
                  HandCoins,
                  "Option count",
                  "The number that looks impressive",
                ],
                [
                  Percent,
                  "Ownership %",
                  "The missing context",
                ],
                [
                  WalletCards,
                  "Exercise cost",
                  "The cash decision",
                ],
                [
                  TrendingUp,
                  "Scenarios",
                  "The range of possible outcomes",
                ],
              ].map(
                ([IconValue, label, detail], index) => {
                  const Icon = IconValue as LucideIcon;

                  return (
                    <div
                      key={String(label)}
                      className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 transition duration-300 hover:translate-x-2 hover:bg-white/[0.075]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-[#60a5fa]">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-black text-white">
                          {String(label)}
                        </p>

                        <p className="mt-1 text-xs text-[#94a3b8]">
                          {String(detail)}
                        </p>
                      </div>

                      <span className="font-mono text-[9px] font-black text-[#64748b]">
                        0{index + 1}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function RangeInput({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-black text-[#0f172a]">
          {label}
        </span>

        <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-black text-[#1d4ed8]">
          {display}
        </span>
      </div>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="mt-3 h-2 w-full cursor-pointer accent-[#2563eb]"
      />
    </label>
  );
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-[#2563eb] bg-[#eff6ff]"
          : "border-[#dbe5f0] bg-[#f7f9fc]"
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#64748b]">
        {label}
      </p>

      <p className="mt-2 text-xl font-black tracking-[-0.03em] text-[#0f172a]">
        {value}
      </p>
    </div>
  );
}
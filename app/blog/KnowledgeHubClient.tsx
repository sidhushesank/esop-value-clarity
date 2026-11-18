"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import BlogInsights from "@/app/blog/BlogInsights";
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
  X,
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

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "All", label: "Everyone" },
  { value: "Employee", label: "Employees" },
  { value: "Founder", label: "Founders" },
  { value: "HR", label: "HR" },
  { value: "CA", label: "CAs" },
  { value: "Tax", label: "Tax" },
];

const POPULAR_SEARCHES = ["Exercise price", "Vesting", "Buyback", "Dilution", "Tax"];

function formatINR(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** A guide from content/articles/*.json, passed in by app/blog/page.tsx. */
export type ExtraGuide = Omit<Guide, "icon" | "featured"> & {
  icon: string;
  publishedAt?: string;
};

const EXTRA_GUIDE_ICONS: Record<string, LucideIcon> = {
  BriefcaseBusiness,
  Calculator,
  FileSearch,
  Gauge,
  Landmark,
  Layers3,
  LineChart,
  Percent,
  Scale,
  ShieldCheck,
  Target,
  TrendingUp,
  UsersRound,
  WalletCards,
};

type HubGuide = Guide & { publishedAt?: string };

/** Moves a soft gold spotlight with the cursor (see .evc-spot). */
function trackSpotlight(event: ReactMouseEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--x", `${event.clientX - rect.left}px`);
  el.style.setProperty("--y", `${event.clientY - rect.top}px`);
}

/** Adds .is-in to [data-reveal] elements as they scroll into view. */
function useReveal(rescanKey: unknown) {
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const items = Array.from(node.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((item) => item.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [rescanKey]);

  return root;
}

export default function KnowledgeHubClient({
  extraGuides = [],
}: {
  extraGuides?: ExtraGuide[];
}) {
  const allGuides = useMemo<HubGuide[]>(
    () => [
      ...extraGuides.map((guide) => ({
        ...guide,
        icon: EXTRA_GUIDE_ICONS[guide.icon] ?? FileSearch,
      })),
      ...guides,
    ],
    [extraGuides],
  );

  const categories = useMemo(() => {
    const seen = new Set<string>();
    allGuides.forEach((guide) => seen.add(guide.category));
    return ["All topics", ...Array.from(seen)];
  }, [allGuides]);

  const [topic, setTopic] = useState("All topics");
  const [audience, setAudience] = useState<Audience>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allGuides.filter((guide) => {
      if (topic !== "All topics" && guide.category !== topic) return false;
      if (audience !== "All" && !guide.audience.includes(audience as Exclude<Audience, "All">)) return false;
      if (!q) return true;
      return `${guide.title} ${guide.summary} ${guide.category} ${guide.tags.join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [allGuides, topic, audience, query]);

  const latest = allGuides[0];
  const filterKey = `${topic}|${audience}|${query}`;
  const pageRef = useReveal(filterKey);

  function resetFilters() {
    setTopic("All topics");
    setAudience("All");
    setQuery("");
  }

  function jumpToGuides() {
    document.getElementById("guides")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={pageRef} className="evc-blog overflow-x-clip bg-white text-[#042653] antialiased">
      <style dangerouslySetInnerHTML={{ __html: BLOG_CSS }} />
      <ScrollProgress />

      {/* ===================== HERO ===================== */}
      <section className="relative isolate overflow-hidden bg-[#020d1f] text-white">
        <div className="evc-aurora pointer-events-none absolute inset-0 -z-10" />
        <div className="evc-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="evc-beam pointer-events-none absolute -top-40 left-1/2 -z-10 h-[480px] w-[860px] -translate-x-1/2" />

        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div>
            <p
              className="evc-rise inline-flex items-center gap-2 rounded-full border border-[#F2B421]/30 bg-[#F2B421]/[0.08] px-3 py-1 text-xs text-[#FCE3A3]"
              style={{ animationDelay: "0ms" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#F2B421]" />
              {allGuides.length} free guides · new posts every week
            </p>

            <h1
              className="evc-rise mt-6 text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-[3.6rem]"
              style={{ animationDelay: "80ms" }}
            >
              ESOP guides for India, in{" "}
              <span className="evc-gold-text whitespace-nowrap">plain English.</span>
            </h1>

            <p
              className="evc-rise mt-5 max-w-xl text-lg leading-8 text-slate-300"
              style={{ animationDelay: "160ms" }}
            >
              Tax, vesting, buybacks, dilution and what Indian companies are doing with ESOPs,
              each worked through with real rupee numbers.
            </p>

            <div className="evc-rise mt-8 max-w-xl" style={{ animationDelay: "240ms" }}>
              <label htmlFor="guide-search" className="sr-only">
                Search the guides
              </label>
              <div className="group flex h-14 items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 backdrop-blur transition focus-within:border-[#F2B421]/60 focus-within:bg-white/[0.09]">
                <Search className="h-5 w-5 text-slate-400 transition group-focus-within:text-[#F2B421]" />
                <input
                  id="guide-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") jumpToGuides();
                  }}
                  placeholder="Search: exercise price, buyback tax, vesting…"
                  className="h-full w-full bg-transparent text-[15px] text-white placeholder:text-slate-500 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>Popular:</span>
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQuery(term);
                      jumpToGuides();
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300 transition hover:border-[#F2B421]/50 hover:text-white"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {latest && (
            <Link
              href={`/blog/${latest.slug}`}
              onMouseMove={trackSpotlight}
              className="evc-rise evc-spot group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#F2B421]/40"
              style={{ animationDelay: "320ms" }}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#F2B421]">
                  <span className="relative flex h-2 w-2">
                    <span className="evc-ring absolute inline-flex h-full w-full rounded-full bg-[#F2B421]" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F2B421]" />
                  </span>
                  Latest
                </span>
                <span className="text-xs text-slate-400">{latest.category}</span>
              </div>

              <h2 className="mt-5 text-2xl font-semibold leading-snug tracking-tight text-white">
                {latest.title}
              </h2>

              <p className="mt-3 line-clamp-3 text-[15px] leading-7 text-slate-300">
                {latest.summary}
              </p>

              <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-sm">
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <Clock3 className="h-4 w-4" />
                  {latest.readTime}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#F2B421]">
                  Read it
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ===================== GUIDES ===================== */}
      <section id="guides" className="scroll-mt-20 bg-[#F7F9FC]">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-[#F7F9FC]/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="evc-scrollx -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0">
              {categories.map((item) => {
                const active = item === topic;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTopic(item)}
                    aria-pressed={active}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-[#042653] text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-[#F2B421]/60 hover:text-[#042653]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="guide-audience" className="text-sm text-slate-500">
                For
              </label>
              <select
                id="guide-audience"
                value={audience}
                onChange={(event) => setAudience(event.target.value as Audience)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-[#042653] transition hover:border-[#F2B421]/60 focus:border-[#F2B421] focus:outline-none"
              >
                {AUDIENCES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                {topic === "All topics" ? "All guides" : topic}
              </h2>
              <p className="mt-2 text-slate-500" aria-live="polite">
                {filtered.length} {filtered.length === 1 ? "guide" : "guides"}
                {query ? ` matching “${query}”` : ""}
              </p>
            </div>

            {(topic !== "All topics" || audience !== "All" || query) && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B7800E] transition hover:text-[#8A5A00]"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-lg font-semibold">Nothing matches that yet.</p>
              <p className="mt-2 text-slate-500">
                Try a different word, or tell us what to write about next.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-[#F2B421]"
                >
                  Show all guides
                </button>
                <a
                  href="mailto:sheshank@esopvalueclarity.com?subject=Guide%20request"
                  className="rounded-xl bg-[#042653] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#020d1f]"
                >
                  Request a guide
                </a>
              </div>
            </div>
          ) : (
            <div key={filterKey} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((guide, index) => {
                const GuideIcon = guide.icon;
                const isNews = guide.category === "Company news";
                return (
                  <Link
                    key={guide.slug}
                    href={`/blog/${guide.slug}`}
                    onMouseMove={trackSpotlight}
                    data-reveal
                    style={{ transitionDelay: `${Math.min(index, 8) * 50}ms` }}
                    className="evc-card evc-spot-light group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(4,38,83,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#F2B421]/60 hover:shadow-[0_24px_50px_-28px_rgba(4,38,83,0.35)]"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${
                          isNews ? "text-[#042653]" : "text-[#B7800E]"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                            isNews
                              ? "bg-[#042653] text-[#F2B421]"
                              : "bg-[#FFF4D6] text-[#B7800E] group-hover:bg-[#F2B421] group-hover:text-[#020d1f]"
                          }`}
                        >
                          <GuideIcon className="h-4 w-4" />
                        </span>
                        {guide.category}
                      </span>
                      {guide.publishedAt && (
                        <span className="text-xs text-slate-400">
                          {new Date(`${guide.publishedAt}T00:00:00`).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-[#042653]">
                      {guide.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 flex-1 text-[15px] leading-7 text-slate-600">
                      {guide.summary}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        {guide.readTime}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#042653] opacity-70 transition group-hover:opacity-100">
                        Read
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===================== DATA, TAX, VESTING, PATHS ===================== */}
      <BlogInsights />

      {/* ===================== QUICK ESTIMATE ===================== */}
      <QuickEstimate />

      {/* ===================== ASK ===================== */}
      <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-24">
        <div
          data-reveal
          className="evc-card grid gap-8 rounded-3xl border border-slate-200 bg-white p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
              Have an ESOP question we haven&apos;t covered?
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Every guide is written and checked by{" "}
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#042653] underline decoration-[#F2B421] decoration-2 underline-offset-4 hover:text-[#B7800E]"
              >
                Sheshank Sidheshwar
              </a>
              , founder of ESOP Value Clarity. Send your question and it may become the next guide.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
            <a
              href="mailto:sheshank@esopvalueclarity.com?subject=ESOP%20question"
              className="evc-btn-gold inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F2B421] px-6 text-sm font-semibold text-[#020d1f] transition hover:-translate-y-0.5"
            >
              Ask a question
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/meeting"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-semibold text-[#042653] transition hover:border-[#042653]"
            >
              Book a walkthrough
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Thin gold bar at the top of the window showing how far down the page you are. */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent" aria-hidden="true">
      <div
        className="h-full origin-left bg-gradient-to-r from-[#F2B421] to-[#FCE3A3]"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

function QuickEstimate() {
  const [options, setOptions] = useState(25000);
  const [strike, setStrike] = useState(10);
  const [exitPrice, setExitPrice] = useState(120);
  const [dilution, setDilution] = useState(20);

  const exerciseCost = options * strike;
  const grossValue = options * Math.max(exitPrice - strike, 0);
  const afterDilution = grossValue * (1 - dilution / 100);

  return (
    <section className="relative isolate overflow-hidden bg-[#020d1f] py-20 text-white md:py-28">
      <div className="evc-grid pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <div className="evc-aurora pointer-events-none absolute inset-0 -z-10 opacity-50" />

      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
        <div data-reveal className="evc-card">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F2B421]">
            Quick estimate
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            Move the sliders. See what your grant could be worth.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            A rough first look before tax. The full calculator adds vesting, perquisite tax,
            capital gains and exit scenarios.
          </p>
          <Link
            href="/simulator"
            className="evc-btn-gold mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[#F2B421] px-6 text-sm font-semibold text-[#020d1f] transition hover:-translate-y-0.5"
          >
            Open the full ESOP calculator
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div
          data-reveal
          className="evc-card rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur md:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Slider label="Options" value={options} min={1000} max={200000} step={1000} onChange={setOptions} format={(v) => v.toLocaleString("en-IN")} />
            <Slider label="Exercise price" value={strike} min={1} max={500} step={1} onChange={setStrike} format={(v) => `₹${v}`} />
            <Slider label="Price per share at exit" value={exitPrice} min={1} max={5000} step={5} onChange={setExitPrice} format={(v) => `₹${v.toLocaleString("en-IN")}`} />
            <Slider label="Dilution before exit" value={dilution} min={0} max={70} step={1} onChange={setDilution} format={(v) => `${v}%`} />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Result label="Cash to exercise" value={formatINR(exerciseCost)} />
            <Result label="Gain before dilution" value={formatINR(grossValue)} />
            <Result label="Gain after dilution" value={formatINR(afterDilution)} highlight />
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            Illustration only, before tax. Dilution is applied to the gain as a simple percentage cut.
          </p>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold tabular-nums text-white">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="evc-range mt-3 w-full"
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
    </label>
  );
}

function Result({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        highlight ? "border-[#F2B421]/40 bg-[#F2B421]/[0.08]" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-xs text-slate-400">{label}</p>
      <p
        key={value}
        className={`evc-swap mt-1 text-xl font-semibold tabular-nums ${highlight ? "text-[#F2B421]" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

const BLOG_CSS = `
.evc-blog .evc-aurora {
  background:
    radial-gradient(40% 50% at 12% 8%, rgba(4,38,83,0.95), transparent 70%),
    radial-gradient(35% 45% at 88% 18%, rgba(242,180,33,0.18), transparent 70%),
    radial-gradient(45% 45% at 55% 100%, rgba(91,155,255,0.22), transparent 70%);
  animation: evcAurora 18s ease-in-out infinite alternate;
}
@keyframes evcAurora {
  0% { transform: translate3d(0,0,0) scale(1); }
  50% { transform: translate3d(-3%,2%,0) scale(1.06); }
  100% { transform: translate3d(3%,-2%,0) scale(1.02); }
}
.evc-blog .evc-beam {
  background: conic-gradient(from 180deg at 50% 0%, transparent 40%, rgba(242,180,33,0.16) 50%, transparent 60%);
  filter: blur(30px);
  animation: evcBeam 9s ease-in-out infinite alternate;
}
@keyframes evcBeam { from { opacity: .55; transform: translateX(-52%) rotate(-4deg); } to { opacity: 1; transform: translateX(-48%) rotate(4deg); } }
.evc-blog .evc-grid {
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 40%, transparent 100%);
}
.evc-blog .evc-gold-text {
  background: linear-gradient(90deg, #F2B421, #FCE3A3, #F2B421, #D9950C, #F2B421);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: evcShimmer 7s linear infinite;
}
@keyframes evcShimmer { to { background-position: 300% 0; } }

.evc-blog .evc-rise { opacity: 0; animation: evcRise 0.9s cubic-bezier(.2,.7,.2,1) forwards; }
@keyframes evcRise { from { opacity: 0; transform: translateY(18px); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }

.evc-blog .evc-btn-gold { box-shadow: 0 10px 30px -10px rgba(242,180,33,0.65); }
.evc-blog .evc-btn-gold:hover { box-shadow: 0 0 0 4px rgba(242,180,33,0.2), 0 16px 40px -12px rgba(242,180,33,0.85); }

.evc-blog .evc-spot::before, .evc-blog .evc-spot-light::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .4s;
  background: radial-gradient(360px circle at var(--x, 50%) var(--y, 50%), rgba(242,180,33,0.14), transparent 45%);
}
.evc-blog .evc-spot-light::before {
  background: radial-gradient(320px circle at var(--x, 50%) var(--y, 50%), rgba(242,180,33,0.10), transparent 50%);
}
.evc-blog .evc-spot:hover::before, .evc-blog .evc-spot-light:hover::before { opacity: 1; }

.evc-blog [data-reveal].evc-card { opacity: 0; transform: translateY(16px); transition-property: opacity, transform, translate, border-color, box-shadow; transition-duration: .6s, .6s, .3s, .3s, .3s; transition-timing-function: cubic-bezier(.2,.7,.2,1); }
.evc-blog [data-reveal].evc-card.is-in { opacity: 1; transform: none; }
.evc-blog [data-reveal].evc-card.is-in:hover { transition-delay: 0ms !important; }

.evc-blog .evc-ring { animation: evcRing 1.8s ease-out infinite; }
@keyframes evcRing { from { transform: scale(1); opacity: .9; } to { transform: scale(2.2); opacity: 0; } }

.evc-blog .evc-swap { animation: evcSwap .45s cubic-bezier(.2,.7,.2,1); }
@keyframes evcSwap { from { opacity: .3; transform: translateY(4px); } to { opacity: 1; transform: none; } }

.evc-blog .evc-range { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 999px; background: linear-gradient(90deg, #F2B421 var(--fill), rgba(255,255,255,0.15) var(--fill)); cursor: pointer; }
.evc-blog .evc-range::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 999px; background: #fff; box-shadow: 0 0 0 5px rgba(242,180,33,0.35), 0 4px 12px rgba(0,0,0,0.4); transition: transform .15s; }
.evc-blog .evc-range::-webkit-slider-thumb:hover { transform: scale(1.12); }
.evc-blog .evc-range::-moz-range-thumb { width: 20px; height: 20px; border: 0; border-radius: 999px; background: #fff; box-shadow: 0 0 0 5px rgba(242,180,33,0.35); }

.evc-blog .evc-range-light { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 999px; background: linear-gradient(90deg, #F2B421 var(--fill), #E2E8F0 var(--fill)); cursor: pointer; }
.evc-blog .evc-range-light::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 999px; background: #fff; border: 2px solid #B7800E; box-shadow: 0 2px 8px rgba(4,38,83,0.25); transition: transform .15s; }
.evc-blog .evc-range-light::-webkit-slider-thumb:hover { transform: scale(1.12); }
.evc-blog .evc-range-light::-moz-range-thumb { width: 18px; height: 18px; border-radius: 999px; background: #fff; border: 2px solid #B7800E; }

.evc-blog .evc-panel { animation: evcPanel .5s cubic-bezier(.2,.7,.2,1); }
@keyframes evcPanel { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

.evc-blog .recharts-wrapper, .evc-blog .recharts-surface { outline: none; }

.evc-blog .evc-scrollx { scrollbar-width: none; }
.evc-blog .evc-scrollx::-webkit-scrollbar { display: none; }

@media (prefers-reduced-motion: reduce) {
  .evc-blog *, .evc-blog *::before, .evc-blog *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  .evc-blog .evc-rise, .evc-blog [data-reveal].evc-card { opacity: 1; transform: none; }
}
`;

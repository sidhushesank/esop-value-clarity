import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LiveEquityPreview from "@/app/blog/LiveEquityPreview";
import Footer from "@/components/sections/Footer";
export const metadata: Metadata = {
  title: "ESOP Learning Center | ESOP Value Clarity",
  description:
    "Clear guides to ESOPs, startup equity, vesting, dilution, and company ownership.",
};

const articles = [
  {
    title: "What is an ESOP? Complete Beginner's Guide",
    description:
      "Understand how Employee Stock Ownership Plans work, why startups offer them, and how employees benefit from equity.",
    slug: "what-is-an-esop",
    readTime: "10 min read",
    category: "Beginner",
    number: "01",
    accent: "from-blue-600 to-cyan-500",
  },
  {
    title: "ESOP vs RSU: What's the Difference?",
    description:
      "Compare ESOPs and RSUs to understand ownership, taxation, and long-term value.",
    slug: "esop-vs-rsu",
    readTime: "8 min read",
    category: "Equity",
    number: "02",
    accent: "from-violet-600 to-blue-500",
  },
  {
    title: "How Dilution Affects Your ESOP Value",
    description:
      "Learn why ownership percentage changes after funding rounds and what dilution really means.",
    slug: "dilution-explained",
    readTime: "7 min read",
    category: "Dilution",
    number: "03",
    accent: "from-cyan-600 to-emerald-500",
  },
  {
    title: "Understanding Vesting Schedules",
    description:
      "A simple explanation of cliffs, vesting periods, and how employees earn ownership over time.",
    slug: "vesting-schedule",
    readTime: "9 min read",
    category: "Vesting",
    number: "04",
    accent: "from-indigo-600 to-blue-500",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/70">
        <div className="pointer-events-none absolute left-1/2 top-[-20rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-blue-200/45 blur-[140px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-100/70 blur-[110px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              ESOP Value Clarity Learning Center
            </div>

            <h1 className="mt-7 text-5xl font-bold leading-[1.04] tracking-[-0.055em] text-slate-900 md:text-7xl">
              Learn startup equity
              <span className="block text-blue-600">with confidence.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              Practical guides for employees, founders, and startup operators
              who want to understand ESOPs, dilution, vesting, and ownership
              without financial jargon.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/simulator">
                <Button className="h-12 rounded-xl bg-slate-900 px-6 text-base transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg">
                  Try the Simulator →
                </Button>
              </Link>

              <a
                href="#guides"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-base font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md"
              >
                Explore guides
              </a>
            </div>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              ["4", "Practical guides"],
              ["Simple", "Plain-English explanations"],
              ["Free", "Learning resources"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="group cursor-default rounded-2xl border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-100/60"
              >
                <p className="text-2xl font-bold tracking-tight text-slate-900 transition group-hover:text-blue-600">
                  {value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="guides" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Latest guides
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-slate-900 md:text-5xl">
              Start with what matters.
            </h2>
          </div>

          <p className="max-w-md leading-7 text-slate-600">
            Clear concepts, useful examples, and practical context for every
            important equity decision.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/60 md:p-8"
            >
              <div
                className={`absolute right-0 top-0 h-32 w-32 rounded-bl-[5rem] bg-gradient-to-br ${article.accent} opacity-10 transition duration-500 group-hover:scale-125 group-hover:opacity-20`}
              />

              <div className="relative flex items-center justify-between">
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition group-hover:bg-blue-100">
                  {article.category}
                </span>
                <span className="text-sm text-slate-400">{article.readTime}</span>
              </div>

              <div className="relative mt-10 flex items-start justify-between gap-4">
                <span className="text-5xl font-bold tracking-[-0.06em] text-slate-100 transition group-hover:text-blue-100">
                  {article.number}
                </span>

                <span className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-blue-600 transition duration-300 group-hover:rotate-[-45deg] group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                  →
                </span>
              </div>

              <h2 className="relative mt-8 text-2xl font-semibold tracking-tight text-slate-900">
                {article.title}
              </h2>

              <p className="relative mt-4 leading-7 text-slate-600">
                {article.description}
              </p>

              <Link
                href={`/blog/${article.slug}`}
                className="relative mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
              >
                Read article
                <span className="transition duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 md:py-28 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Put knowledge into action
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-slate-900 md:text-5xl">
              Ready to understand your own equity?
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Use the ESOP simulator to estimate ownership, model dilution, and
              explore potential exit outcomes in minutes.
            </p>

            <Link href="/simulator" className="mt-8 inline-block">
              <Button className="h-12 rounded-xl bg-slate-900 px-6 text-base transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg">
                Try the Simulator →
              </Button>
            </Link>
          </div>

          <LiveEquityPreview />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-6 py-16 text-center text-white md:px-12 md:py-20">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
              Learn. Model. Decide.
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-[-0.045em] md:text-5xl">
              Your equity deserves a clearer explanation.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50">
              Read the fundamentals, then see how they apply to your own ESOP
              with the free simulator.
            </p>

            <Link href="/simulator" className="mt-8 inline-block">
              <Button
                size="lg"
                className="rounded-xl bg-white px-7 text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl"
              >
                Try the Simulator — it&apos;s free
              </Button>
            </Link>
          </div>
        </div>
      </section>

        <Footer />
    </main>
  );
}
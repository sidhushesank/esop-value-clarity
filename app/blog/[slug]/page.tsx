import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Footer from "@/components/sections/Footer";
const articles = {
  "what-is-an-esop": {
    category: "Beginner guide",
    readTime: "10 min read",
    title: "What is an ESOP? Complete Beginner's Guide",
    description:
      "Understand how Employee Stock Ownership Plans work, why startups offer them, and how employees benefit from equity.",
    content: (
      <>
        <p>
          ESOP stands for Employee Stock Ownership Plan. Instead of offering
          only salary, startups often reward employees with the opportunity to
          own a part of the company through stock options.
        </p>

        <h2>What is an ESOP?</h2>

        <p>
          An ESOP gives you the right to buy company shares at a fixed price,
          known as the exercise price or strike price. If the company becomes
          more valuable over time, those options may become valuable too.
        </p>

        <p>
          Options do not always become yours immediately. They usually vest over
          time, meaning you earn the right to exercise them as you continue
          working at the company.
        </p>

        <h2>Why do startups offer ESOPs?</h2>

        <ul>
          <li>To attract talented people when cash budgets are limited.</li>
          <li>To reward employees for helping build long-term value.</li>
          <li>To encourage retention through vesting schedules.</li>
          <li>To align employee incentives with company growth.</li>
        </ul>

        <div className="my-10 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <p className="mt-0 font-semibold text-blue-950">Key takeaway</p>
          <p className="mt-2 text-blue-900">
            ESOPs are not guaranteed cash. They are a potential ownership
            opportunity whose value depends on the company&apos;s future.
          </p>
        </div>
      </>
    ),
  },

  "dilution-explained": {
    category: "Dilution",
    readTime: "7 min read",
    title: "How Dilution Affects Your ESOP Value",
    description:
      "Learn why ownership percentage changes after funding rounds and what dilution really means.",
    content: (
      <>
        <p>
          Dilution happens when a company creates and issues new shares. This
          often occurs when a startup raises capital, grants new ESOPs, or
          expands its option pool.
        </p>

        <h2>What is dilution?</h2>

        <p>
          You can still own the same number of options after dilution, but those
          options represent a smaller percentage of the total company. For
          example, owning 1,000 shares out of 100,000 is different from owning
          1,000 shares out of 200,000.
        </p>

        <h2>Does dilution always reduce value?</h2>

        <p>
          Not necessarily. A smaller percentage of a much more valuable company
          can be worth more than a larger percentage of a smaller company.
          Funding can help a company hire, build products, expand, and grow.
        </p>

        <div className="my-10 rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <p className="mt-0 font-semibold text-emerald-950">Simple example</p>
          <p className="mt-2 text-emerald-900">
            Owning 1% of a ₹10 crore company is worth ₹10 lakh. Owning 0.5% of
            a ₹100 crore company is worth ₹50 lakh.
          </p>
        </div>
      </>
    ),
  },

  "vesting-schedule": {
    category: "Vesting",
    readTime: "9 min read",
    title: "Understanding Vesting Schedules",
    description:
      "A simple explanation of cliffs, vesting periods, and how employees earn ownership over time.",
    content: (
      <>
        <p>
          Vesting determines when your stock options officially become yours.
          Startups use vesting to reward long-term contribution and align
          employee ownership with company growth.
        </p>

        <h2>What is a vesting schedule?</h2>

        <p>
          A typical startup schedule is four years with a one-year cliff. You
          may receive your first portion of options after completing one year,
          then earn the rest monthly or quarterly over the remaining three
          years.
        </p>

        <h2>What is a one-year cliff?</h2>

        <p>
          A cliff means no options vest before a certain date. Under a one-year
          cliff, you generally receive no vested options if you leave before the
          first anniversary of your start date.
        </p>

        <div className="my-10 rounded-2xl border border-violet-100 bg-violet-50 p-6">
          <p className="mt-0 font-semibold text-violet-950">Example</p>
          <p className="mt-2 text-violet-900">
            With 1,000 options on a four-year vesting schedule, around 250 may
            vest after year one. The remaining 750 then vest gradually.
          </p>
        </div>
      </>
    ),
  },

  "esop-vs-rsu": {
    category: "Equity",
    readTime: "8 min read",
    title: "ESOP vs RSU: What's the Difference?",
    description:
      "Compare ESOPs and RSUs to understand ownership, taxation, and long-term value.",
    content: (
      <>
        <p>
          ESOPs and RSUs are both forms of employee equity, but they work
          differently. Understanding the distinction helps you compare
          compensation offers more clearly.
        </p>

        <h2>ESOPs versus RSUs</h2>

        <p>
          ESOPs usually give you the option to purchase shares at a fixed price.
          RSUs are shares that are granted directly after their vesting
          requirements are met.
        </p>

        <div className="my-10 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="p-4 font-semibold">Feature</th>
                <th className="p-4 font-semibold">ESOP</th>
                <th className="p-4 font-semibold">RSU</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="p-4 font-medium">Ownership</td>
                <td className="p-4">Option to buy shares</td>
                <td className="p-4">Shares granted directly</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Exercise price</td>
                <td className="p-4">Usually yes</td>
                <td className="p-4">Usually no</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Common in</td>
                <td className="p-4">Startups</td>
                <td className="p-4">Large public companies</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
};

type Slug = keyof typeof articles;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug as Slug];

  if (!article) {
    return {
      title: "Article Not Found | ESOP Value Clarity",
    };
  }

  return {
    title: `${article.title} | ESOP Value Clarity`,
    description: article.description,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles[slug as Slug];

  if (!article) {
    notFound();
  }

  const relatedArticles = Object.entries(articles)
    .filter(([articleSlug]) => articleSlug !== slug)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/70">
        <div className="mx-auto max-w-4xl px-6 py-14 md:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
          >
            ← Back to Learning Center
          </Link>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {article.category}
            </span>
            <span className="text-sm text-slate-500">{article.readTime}</span>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.045em] text-slate-900 md:text-6xl">
            {article.title}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
            {article.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <article className="text-lg leading-8 text-slate-700 [&_p]:mt-6 [&_h2]:mt-14 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h2]:text-slate-900 [&_ul]:mt-6 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-6">
          {article.content}
        </article>

        <section className="mt-20 overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-7 py-14 text-center text-white md:px-12 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
            Put this into practice
          </p>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-[-0.04em] md:text-4xl">
            Curious what your ESOP is actually worth?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-blue-50">
            Use the free simulator to estimate ownership, dilution, and
            potential exit value in minutes.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/simulator">
              <Button
                size="lg"
                className="rounded-xl bg-white text-slate-950 hover:bg-slate-100"
              >
                Try ESOP Simulator
              </Button>
            </Link>

            <Link href="/signup">
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-20">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Continue learning
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-900">
                More equity guides
              </h2>
            </div>

            <Link
              href="/blog"
              className="hidden text-sm font-semibold text-blue-600 md:inline"
            >
              View all articles →
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {relatedArticles.map(([relatedSlug, relatedArticle]) => (
              <Link
                key={relatedSlug}
                href={`/blog/${relatedSlug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  {relatedArticle.category}
                </p>

                <h3 className="mt-4 text-lg font-semibold leading-6 text-slate-900">
                  {relatedArticle.title}
                </h3>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {relatedArticle.description}
                </p>

                <p className="mt-6 text-sm font-semibold text-blue-600">
                  Read guide{" "}
                  <span className="inline-block transition group-hover:translate-x-1">
                    →
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      </section>

        <Footer />
    </main>
  );
}
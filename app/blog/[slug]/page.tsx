import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";

const articles = {
  "what-is-an-esop": {
    title: "What is an ESOP? Complete Beginner's Guide",
    description:
      "Understand how Employee Stock Ownership Plans work, why startups offer them, and how employees benefit from equity.",

    content: (
      <>
        <h2 className="text-3xl font-bold mt-12 mb-6">
          What is an ESOP?
        </h2>

        <p className="text-lg leading-9 text-slate-700">
          ESOP stands for Employee Stock Ownership Plan. Instead of only
          paying salary, startups often reward employees with company
          ownership through stock options.
        </p>

        <p className="text-lg leading-9 text-slate-700 mt-6">
          These options usually vest over time, meaning employees earn the
          right to purchase or receive shares after completing certain
          employment milestones.
        </p>

        <h2 className="text-3xl font-bold mt-12 mb-6">
          Why do startups offer ESOPs?
        </h2>

        <ul className="list-disc pl-8 space-y-3 text-lg text-slate-700">
          <li>Attract talented employees.</li>
          <li>Retain employees for the long term.</li>
          <li>Align employee incentives with company growth.</li>
          <li>Offer ownership when cash salaries are limited.</li>
        </ul>
      </>
    ),
  },
  "dilution-explained": {
  title: "How Dilution Affects Your ESOP Value",
  description:
    "Learn why ownership percentage changes after funding rounds and what dilution really means.",

  content: (
    <>
      <h2 className="text-3xl font-bold mt-12 mb-6">
        What is Dilution?
      </h2>

      <p className="text-lg leading-9 text-slate-700">
        Dilution happens when a company issues new shares to raise funding.
        Existing shareholders continue to own the same number of shares, but
        their ownership percentage decreases.
      </p>

      <h2 className="text-3xl font-bold mt-12 mb-6">
        Does dilution always reduce value?
      </h2>

      <p className="text-lg leading-9 text-slate-700">
        Not necessarily. If the funding helps the company grow faster, the
        overall company value may increase enough that your ESOP becomes more
        valuable despite owning a smaller percentage.
      </p>
    </>
  ),
},
"vesting-schedule": {
  title: "Understanding Vesting Schedules",
  description:
    "A simple explanation of cliffs, vesting periods and how employees earn ownership over time.",

  content: (
    <>
      <h2 className="text-3xl font-bold mt-12 mb-6">
        What is Vesting?
      </h2>

      <p className="text-lg leading-9 text-slate-700">
        Vesting determines when employees officially earn their stock options.
        Most startups use a four-year vesting schedule with a one-year cliff.
      </p>

      <h2 className="text-3xl font-bold mt-12 mb-6">
        Example
      </h2>

      <p className="text-lg leading-9 text-slate-700">
        If you receive 1,000 ESOPs with a four-year vesting schedule, you may
        earn 250 options after the first year and the remaining options
        gradually each month until fully vested.
      </p>
    </>
  ),
},

  "esop-vs-rsu": {
    title: "ESOP vs RSU: What's the Difference?",
    description:
      "Compare ESOPs and RSUs to understand ownership, taxation and long-term value.",

    content: (
      <>
        <h2 className="text-3xl font-bold mt-12 mb-6">
          ESOP vs RSU
        </h2>

        <p className="text-lg leading-9 text-slate-700">
          ESOPs give employees the option to purchase shares, while RSUs
          (Restricted Stock Units) are company shares granted directly after
          vesting conditions are met.
        </p>

        <div className="overflow-x-auto mt-8">
          <table className="w-full border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-4 border">Feature</th>
                <th className="p-4 border">ESOP</th>
                <th className="p-4 border">RSU</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="p-4 border">Ownership</td>
                <td className="p-4 border">Option to buy shares</td>
                <td className="p-4 border">Shares granted directly</td>
              </tr>

              <tr>
                <td className="p-4 border">Exercise Price</td>
                <td className="p-4 border">Usually Yes</td>
                <td className="p-4 border">No</td>
              </tr>

              <tr>
                <td className="p-4 border">Common In</td>
                <td className="p-4 border">Startups</td>
                <td className="p-4 border">Large Companies</td>
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
      title: "Article Not Found",
    };
  }

  return {
    title: article.title,
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

  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-6 py-20">

        <Link href="/blog">
          <Button variant="outline">
            ← Back to Articles
          </Button>
        </Link>

        <h1 className="text-5xl font-bold mt-10">
          {article.title}
        </h1>

        <p className="text-slate-600 text-xl mt-6 leading-9">
          {article.description}
        </p>

        <article className="prose prose-slate max-w-none mt-12">
          {article.content}
        </article>
{/* CTA */}

<section className="mt-24 rounded-3xl bg-slate-900 px-10 py-16 text-center">

  <h2 className="text-4xl font-bold text-white">
    Curious what your ESOP is actually worth?
  </h2>

  <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-300 leading-8">
    Stop guessing your startup equity value. Use our free ESOP
    simulator to estimate ownership, dilution and exit value in
    minutes.
  </p>

  <div className="mt-10 flex flex-wrap justify-center gap-4">

    <Link href="/calculator">
      <Button size="lg">
        Try ESOP Calculator
      </Button>
    </Link>

    <Link href="/signup">
      <Button
        size="lg"
        variant="secondary"
      >
        Create Free Account
      </Button>
    </Link>

  </div>

</section>

{/* More Articles */}

<section className="mt-24">

  <h2 className="text-3xl font-bold">
    Continue Learning
  </h2>

  <div className="grid md:grid-cols-3 gap-6 mt-10">

    <Link
      href="/blog/dilution-explained"
      className="rounded-2xl border p-6 hover:shadow-lg transition"
    >
      <h3 className="font-semibold text-xl">
        Understanding Dilution
      </h3>

      <p className="mt-3 text-slate-600">
        Learn how funding rounds affect your ownership.
      </p>
    </Link>

    <Link
      href="/blog/vesting-schedule"
      className="rounded-2xl border p-6 hover:shadow-lg transition"
    >
      <h3 className="font-semibold text-xl">
        Vesting Explained
      </h3>

      <p className="mt-3 text-slate-600">
        Understand cliffs, vesting periods and ownership.
      </p>
    </Link>

    <Link
      href="/blog/esop-vs-rsu"
      className="rounded-2xl border p-6 hover:shadow-lg transition"
    >
      <h3 className="font-semibold text-xl">
        ESOP vs RSU
      </h3>

      <p className="mt-3 text-slate-600">
        Compare startup stock options with RSUs.
      </p>
    </Link>

  </div>

</section>
      </section>
    </main>
  );
}

import Link from "next/link";
import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "ESOP Learning Center",
  description:
    "Learn everything about Employee Stock Ownership Plans (ESOPs), startup equity, vesting, dilution and company ownership through beginner-friendly guides.",
};

const articles = [
  {
    title: "What is an ESOP? Complete Beginner's Guide",
    description:
      "Understand how Employee Stock Ownership Plans work, why startups offer them, and how employees benefit from equity.",
    slug: "what-is-an-esop",
    readTime: "10 min read",
    category: "Beginner",
  },
  {
    title: "ESOP vs RSU: What's the Difference?",
    description:
      "Compare ESOPs and RSUs to understand ownership, taxation and long-term value.",
    slug: "esop-vs-rsu",
    readTime: "8 min read",
    category: "Equity",
  },
  {
    title: "How Dilution Affects Your ESOP Value",
    description:
      "Learn why ownership percentage changes after funding rounds and what dilution really means.",
    slug: "dilution-explained",
    readTime: "7 min read",
    category: "Dilution",
  },
  {
    title: "Understanding Vesting Schedules",
    description:
      "A simple explanation of cliffs, vesting periods and how employees earn ownership over time.",
    slug: "vesting-schedule",
    readTime: "9 min read",
    category: "Vesting",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-slate-50">

      <section className="bg-gradient-to-b from-white to-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-24">

          <span className="inline-block px-4 py-2 rounded-full bg-slate-900 text-white text-sm">
            Learning Center
          </span>

          <h1 className="text-5xl font-bold mt-8">
            Learn Startup Equity
          </h1>

          <p className="text-slate-600 text-xl mt-6 max-w-3xl leading-9">
            Practical guides that help employees, founders and startup
            professionals understand ESOPs, dilution, vesting and startup
            equity without financial jargon.
          </p>

        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">

        <div className="grid md:grid-cols-2 gap-8">

          {articles.map((article) => (
            <Card
              key={article.slug}
              className="rounded-3xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-8">

                <div className="flex justify-between items-center">

                  <span className="text-sm text-slate-500">
                    {article.category}
                  </span>

                  <span className="text-sm text-slate-400">
                    {article.readTime}
                  </span>

                </div>

                <h2 className="text-2xl font-semibold mt-6">
                  {article.title}
                </h2>

                <p className="text-slate-600 mt-4 leading-8">
                  {article.description}
                </p>

                <Link href={`/blog/${article.slug}`}>
                  <Button className="mt-8">
                    Read Article
                  </Button>
                </Link>

              </CardContent>
            </Card>
          ))}

        </div>

      </section>
    </main>
  );
}
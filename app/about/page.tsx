import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-20 space-y-24">

        {/* Hero / Product Intro */}
        <section className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Built to bring clarity to ESOPs
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl">
            ESOP Value Clarity is a lightweight, educational SaaS tool that helps
            employees and teams understand the real-world value of equity —
            without spreadsheets, jargon, or hidden assumptions.
          </p>
          <div className="flex gap-4 pt-4">
            <Link href="/simulator">
              <Button size="lg">Try the Simulator</Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </section>

        {/* Why / What */}
        <section className="grid md:grid-cols-2 gap-14">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Why this product exists
            </h2>
            <p className="text-slate-600">
              ESOPs are often explained poorly. Employees receive numbers without
              context, making it hard to understand ownership, dilution, or
              what those numbers actually mean at exit.
            </p>
            <p className="text-slate-600">
              ESOP Value Clarity exists to bridge that gap — visually,
              transparently, and honestly.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              What this tool does
            </h2>
            <p className="text-slate-600">
              The simulator models ESOP outcomes using simple, explainable
              assumptions — showing how vesting, dilution, and exit valuation
              affect real value.
            </p>
            <p className="text-slate-600">
              Every number you see is derived from visible inputs.
            </p>
          </div>
        </section>

        {/* Feature Grid (SaaS Feel) */}
        <section className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Simple inputs",
              desc: "Only the fields that matter. No clutter, no finance jargon.",
            },
            {
              title: "Transparent math",
              desc: "All calculations are linear and explainable — no black boxes.",
            },
            {
              title: "Realistic outcomes",
              desc: "See how dilution and exits change ESOP value over time.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="
                bg-white border rounded-2xl p-6 shadow-sm
                transition-all duration-300 ease-out
                hover:-translate-y-1 hover:shadow-lg
                hover:border-slate-300
              "
            >
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-slate-600 mt-2">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Assumptions */}
        <section
          className="
            bg-white border rounded-2xl p-10 shadow-sm space-y-6
            transition-all duration-300 ease-out
            hover:shadow-md hover:border-slate-300
          "
        >
          <h2 className="text-2xl font-semibold">
            Important assumptions
          </h2>
          <ul className="list-disc ml-5 text-slate-600 space-y-2 max-w-3xl">
            <li>Total company shares are assumed for illustration</li>
            <li>Dilution is applied linearly</li>
            <li>No tax or strike price considerations are included</li>
            <li>Figures are estimates, not guarantees</li>
          </ul>
        </section>

        {/* Trust / Positioning */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-lg text-slate-700">
            Built for education, not selling.
          </p>
          <p className="text-slate-600">
            ESOP Value Clarity is designed to help employees, founders, and HR
            teams have clearer conversations around equity.
          </p>
        </section>

        {/* CTA */}
        <section
          className="
            bg-slate-900 rounded-3xl p-12 text-center text-white space-y-6
            transition-transform duration-300 ease-out
            hover:scale-[1.01]
          "
        >
          <h2 className="text-3xl font-semibold">
            Ready to understand your ESOP value?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Explore realistic outcomes across vesting, dilution, and exit
            scenarios — in minutes.
          </p>
          <Link href="/simulator">
            <Button size="lg" variant="secondary">
              Launch Simulator
            </Button>
          </Link>
        </section>

        {/* Disclaimer */}
        <section className="border-t pt-10">
          <p className="text-sm text-slate-500 max-w-3xl">
            <strong>Disclaimer:</strong> ESOP Value Clarity is for educational
            purposes only. It does not provide financial, legal, or tax advice.
            Always consult qualified professionals before making decisions
            related to equity compensation.
          </p>
        </section>

      </div>
    </div>
  );
}

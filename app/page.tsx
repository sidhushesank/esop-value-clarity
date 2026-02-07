import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProductPreview from "@/components/ProductPreview";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="font-semibold text-lg">ESOP Value Clarity</h1>
          <nav className="space-x-4">
            <Link
              href="/about"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              About
            </Link>
            <Link href="/login">
              <Button size="sm">Try Simulator</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-b from-white to-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-32 grid md:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Understand your ESOP value
              <span className="block text-slate-500">
                without confusion.
              </span>
            </h2>

            <p className="text-lg text-slate-600 max-w-md">
              A clear, transparent ESOP simulator that explains equity,
              dilution, and exit value — without spreadsheets or jargon.
            </p>

            <div className="flex gap-4">
              <Link href="/login">
                <Button size="lg">Try the Simulator</Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Right – Preview Card */}
          <Card className="relative shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-8 space-y-6">

              {/* Header */}
              <div className="space-y-1">
                <h4 className="font-semibold text-base">
                  Sample ESOP Outcome
                </h4>
                <p className="text-sm text-slate-500">
                  Illustrative preview
                </p>
              </div>

              {/* Values */}
              <div className="space-y-3 text-sm">
                {[
                  ["Value Today", "₹3,20,000"],
                  ["After Dilution", "₹2,56,000"],
                  ["At Exit", "₹12,80,000"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold blur-[2px] select-none">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-slate-400 pt-2">
                Preview only. Actual values depend on your inputs.
              </p>
            </CardContent>
          </Card>

        </div>
      </section>

      <ProductPreview />

      {/* WHY */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <h3 className="text-2xl font-semibold mb-12">
            Why teams use ESOP Value Clarity
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              ["Simple Inputs", "Only the fields that matter. No clutter."],
              ["Transparent Math", "Every number is explainable and visible."],
              ["Exit Clarity", "See realistic outcomes at different exits."],
            ].map(([title, desc], i) => (
              <Card
                key={i}
                className="hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <CardContent className="p-6 space-y-3">
                  <h4 className="font-medium">{title}</h4>
                  <p className="text-sm text-slate-600">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <h3 className="text-2xl font-semibold mb-12">How it works</h3>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              ["01", "Enter ESOP details", "Add granted ESOPs, vesting, and valuation."],
              ["02", "Understand dilution", "See how dilution affects ownership."],
              ["03", "Estimate exit value", "Get a clear exit-based estimate."],
            ].map(([num, title, desc]) => (
              <Card
                key={num}
                className="group transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <CardContent className="p-6 space-y-4">
                  <span className="text-3xl font-bold text-slate-300 group-hover:text-slate-900 transition">
                    {num}
                  </span>
                  <h4 className="font-medium">{title}</h4>
                  <p className="text-sm text-slate-600">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-6 py-28 text-center space-y-6">
          <h3 className="text-3xl font-semibold text-white">
            Ready to understand your ESOP value?
          </h3>
          <p className="text-slate-400 max-w-xl mx-auto">
            Built to educate, not sell. Transparent assumptions. No hidden logic.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Try the Simulator
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-8 text-sm text-slate-400">

            {/* Left */}
            <div className="space-y-2">
              <p className="font-medium text-slate-300">
                ESOP Value Clarity
              </p>
              <p>Built by Sheshank</p>
              <Link
                href="https://sheshank-portfolio.netlify.app/"
                target="_blank"
                className="underline hover:text-slate-200"
              >
                View portfolio
              </Link>
              <p className="text-xs pt-2">
                Educational purpose only · Not financial advice
              </p>
            </div>

            {/* Right */}
            <div className="space-y-2 md:text-right">
              <p className="font-medium text-slate-300">
                Questions or feedback?
              </p>
              <p>
                Email:{" "}
                <a
                  href="mailto:sidhusheshank@gmail.com"
                  className="underline hover:text-slate-200"
                >
                  sidhusheshank@gmail.com
                </a>
              </p>
              <p className="text-xs">
                Phone: +91 7842638157
              </p>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}

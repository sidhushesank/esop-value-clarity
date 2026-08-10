import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProductPreview from "@/components/ProductPreview";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">

      {/* HERO */}
      <section className="bg-gradient-to-b from-white to-slate-100 pt-12">
        <div className="max-w-6xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div className="space-y-6">

            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              Understand your ESOP value
              <span className="block text-slate-500">
                without confusion.
              </span>
            </h2>

            <p className="text-xl text-slate-600 max-w-xl leading-9">
              A clear, transparent ESOP simulator that explains
              equity, dilution and exit value without spreadsheets,
              financial jargon or hidden assumptions.
            </p>

            <div className="flex gap-4">

              <Link href="/login">
                <Button size="lg">
                  Try the Simulator
                </Button>
              </Link>

              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                >
                  Learn More
                </Button>
              </Link>

            </div>

          </div>

          {/* Right */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-3xl">

            <CardContent className="p-8 space-y-8">

              <div>

                <h4 className="font-semibold text-2xl">
                  Sample ESOP Outcome
                </h4>

                <p className="text-slate-500 mt-2">
                  Illustrative preview
                </p>

              </div>

              <div className="space-y-5">

                {[
                  ["Value Today", "₹3,20,000"],
                  ["After Dilution", "₹2,56,000"],
                  ["At Exit", "₹12,80,000"],
                ].map(([label, value]) => (

                  <div
                    key={label}
                    className="flex justify-between items-center text-lg"
                  >
                    <span className="text-slate-600">
                      {label}
                    </span>

                    <span className="font-bold blur-[2px] select-none">
                      {value}
                    </span>

                  </div>

                ))}

              </div>

              <p className="text-sm text-slate-400">
                Preview only. Actual values depend on your
                inputs.
              </p>

            </CardContent>

          </Card>

        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <ProductPreview />

      {/* WHY */}
      <section className="bg-white">

        <div className="max-w-6xl mx-auto px-6 py-28">

          <h3 className="text-3xl font-semibold mb-14">
            Why teams use ESOP Value Clarity
          </h3>

          <div className="grid md:grid-cols-3 gap-8">

            {[
              [
                "Simple Inputs",
                "Only the fields that matter. No unnecessary complexity.",
              ],
              [
                "Transparent Calculations",
                "Every number is explainable with complete visibility.",
              ],
              [
                "Exit Clarity",
                "Understand realistic outcomes across funding and exit scenarios.",
              ],
            ].map(([title, desc]) => (

              <Card
                key={title}
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl"
              >

                <CardContent className="p-8">

                  <h4 className="text-xl font-semibold">
                    {title}
                  </h4>

                  <p className="text-slate-600 mt-4 leading-7">
                    {desc}
                  </p>

                </CardContent>

              </Card>

            ))}

          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-50">

        <div className="max-w-6xl mx-auto px-6 py-28">

          <h3 className="text-3xl font-semibold mb-14">
            How it works
          </h3>

          <div className="grid md:grid-cols-3 gap-8">

            {[
              [
                "01",
                "Enter ESOP Details",
                "Provide granted ESOPs, vesting percentage and valuation.",
              ],
              [
                "02",
                "Understand Dilution",
                "See how future funding rounds impact ownership.",
              ],
              [
                "03",
                "Estimate Exit Value",
                "Project your potential payout across exit scenarios.",
              ],
            ].map(([step, title, desc]) => (

              <Card
                key={step}
                className="group rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >

                <CardContent className="p-8 space-y-5">

                  <span className="text-5xl font-bold text-slate-300 group-hover:text-slate-900 transition">
                    {step}
                  </span>

                  <h4 className="text-xl font-semibold">
                    {title}
                  </h4>

                  <p className="text-slate-600 leading-7">
                    {desc}
                  </p>

                </CardContent>

              </Card>

            ))}

          </div>

        </div>

      </section>
      {/* FAQ */}
<section className="bg-white">

  <div className="max-w-6xl mx-auto px-6 py-28">

    <div className="max-w-3xl">

      <h3 className="text-4xl font-bold">
        Frequently Asked Questions
      </h3>

      <p className="text-slate-600 mt-5 text-lg leading-8">
        Everything you need to know about Employee Stock Ownership Plans (ESOPs),
        startup equity, dilution and how ESOP Value Clarity helps estimate the
        potential value of your stock options.
      </p>

    </div>

    <div className="grid md:grid-cols-2 gap-6 mt-16">

      {[
        {
          question: "What is an ESOP?",
          answer:
            "An Employee Stock Ownership Plan (ESOP) gives employees the opportunity to own shares in the company. Instead of only receiving salary, employees can benefit if the company's value grows over time."
        },
        {
          question: "How does the ESOP calculator work?",
          answer:
            "The calculator estimates your potential ESOP value using inputs like granted options, strike price, company valuation, ownership percentage, dilution and projected exit valuation."
        },
        {
          question: "What is dilution?",
          answer:
            "Dilution occurs when a company issues additional shares during future funding rounds. Existing shareholders own a smaller percentage of the company unless they receive additional shares."
        },
        {
          question: "What is a vesting schedule?",
          answer:
            "A vesting schedule determines when you officially earn ownership of your ESOPs. Many startups use four-year vesting with a one-year cliff before options begin vesting."
        },
        {
          question: "Is ESOP Value Clarity free?",
          answer:
            "Yes. ESOP Value Clarity is completely free to use and helps employees, founders and startup professionals better understand startup equity without complicated spreadsheets."
        },
        {
          question: "Can founders use this calculator?",
          answer:
            "Absolutely. Founders can use the simulator to understand ownership dilution, funding scenarios and potential exit outcomes while planning future equity allocation."
        },
        {
          question: "Does the calculator store my data?",
          answer:
            "No. Your calculations remain private unless you choose to save them. The simulator is designed to help you understand equity while respecting your privacy."
        },
        {
          question: "Are these calculations guaranteed?",
          answer:
            "No. The calculator provides educational estimates based on the information you enter. Actual ESOP value depends on future company performance, funding rounds and exit events."
        }
      ].map((faq) => (

        <Card
          key={faq.question}
          className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
        >
          <CardContent className="p-8">

            <h4 className="text-xl font-semibold">
              {faq.question}
            </h4>

            <p className="mt-4 text-slate-600 leading-7">
              {faq.answer}
            </p>

          </CardContent>
        </Card>

      ))}

    </div>

  </div>

</section>

      {/* CTA */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950">

        <div className="max-w-6xl mx-auto px-6 py-28 text-center">

          <h3 className="text-4xl font-bold text-white">
            Ready to understand your ESOP value?
          </h3>

          <p className="text-slate-400 max-w-2xl mx-auto mt-6 text-lg">
            Built to educate, not sell. Transparent assumptions.
            Professional insights. No hidden logic.
          </p>

          <Link href="/login">

            <Button
              size="lg"
              variant="secondary"
              className="mt-10"
            >
              Try the Simulator
            </Button>

          </Link>

        </div>

        {/* FOOTER */}

        <div className="border-t border-slate-800">

          <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-10 text-sm text-slate-400">

            <div>

              <p className="font-semibold text-slate-300">
                ESOP Value Clarity
              </p>

              <p className="mt-2">
                Built by Sheshank
              </p>

              <Link
                href="https://sheshank-portfolio.netlify.app/"
                target="_blank"
                className="underline hover:text-white"
              >
                View Portfolio
              </Link>

              <p className="mt-4 text-xs">
                Educational purpose only • Not financial advice
              </p>

            </div>

            <div className="md:text-right">

              <p className="font-semibold text-slate-300">
                Contact
              </p>

              <p className="mt-2">
                <a
                  href="mailto:sidhusheshank@gmail.com"
                  className="underline hover:text-white"
                >
                  sidhusheshank@gmail.com
                </a>
              </p>

              <p className="mt-2">
                +91 7842638157
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}
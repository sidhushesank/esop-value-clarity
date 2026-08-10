
"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/sections/Footer";
const INITIAL_CHART = [28, 31, 35, 33, 40, 44, 42, 49, 53, 51, 58, 66];

const trustCards = [
  {
    icon: "◈",
    title: "Clear assumptions",
    description: "See every input behind your estimate.",
    detail:
      "Each projection is based on transparent assumptions around valuation, vesting, dilution, and exit outcomes.",
  },
  {
    icon: "↗",
    title: "Scenario planning",
    description: "Compare outcomes before making decisions.",
    detail:
      "Explore conservative, expected, and high-growth scenarios without rebuilding a complex spreadsheet.",
  },
  {
    icon: "◎",
    title: "Built for privacy",
    description: "Your equity information stays yours.",
    detail:
      "Use the simulator with confidence. Your calculations are designed to remain private and easy to control.",
  },
];

const features = [
  {
    number: "01",
    title: "Model your ownership",
    description:
      "Translate granted options into a practical view of ownership, vesting, and potential value.",
  },
  {
    number: "02",
    title: "Understand dilution",
    description:
      "See how future funding rounds and option pools can change your equity percentage over time.",
  },
  {
    number: "03",
    title: "Plan for the future",
    description:
      "Compare exit scenarios and make better decisions about offers, compensation, and your next move.",
  },
];

const faqs = [
  {
    question: "What is an ESOP?",
    answer:
      "An Employee Stock Ownership Plan gives employees the opportunity to own a part of their company. Its value can change as the company grows, raises funding, or reaches an exit.",
  },
  {
    question: "How does the ESOP simulator work?",
    answer:
      "The simulator uses your option grant, strike price, vesting percentage, company valuation, dilution assumptions, and estimated exit value to create an educational projection.",
  },
  {
    question: "What is dilution?",
    answer:
      "Dilution happens when a company issues additional shares, commonly in funding rounds. Your ownership percentage may reduce, even if the total value of the company grows.",
  },
  {
    question: "What is a vesting schedule?",
    answer:
      "A vesting schedule determines when your options become yours. A common startup schedule is four years of vesting with a one-year cliff.",
  },
  {
    question: "Does ESOP Value Clarity store my data?",
    answer:
      "Your calculations remain private unless you choose to save them. The product is designed to help you understand equity while respecting your privacy.",
  },
  {
    question: "Are these calculations guaranteed?",
    answer:
      "No. Results are educational estimates and not financial advice. Actual value depends on future company performance, funding terms, taxes, and exit conditions.",
  },
];

function createChartData(values: number[]) {
  const width = 600;
  const height = 260;
  const padding = 18;
  const min = Math.min(...values) - 6;
  const max = Math.max(...values) + 8;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y =
      height -
      padding -
      ((value - min) / (max - min)) * (height - padding * 2);

    return { x, y, value };
  });

  const linePath = points
    .map((point, index) =>
      index === 0
        ? `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
        : `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");

  return {
    points,
    linePath,
    areaPath: `${linePath} L ${width} ${height} L 0 ${height} Z`,
  };
}

export default function HomePage() {
  const [chartValues, setChartValues] = useState(INITIAL_CHART);
  const [seconds, setSeconds] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeTrustCard, setActiveTrustCard] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds((value) => value + 1);

      setChartValues((current) => {
        const previousValue = current[current.length - 1];
        const movement = Math.floor(Math.random() * 5) - 1;
        const nextValue = Math.max(previousValue + movement, previousValue - 1);

        return [...current.slice(1), nextValue];
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const chart = useMemo(() => createChartData(chartValues), [chartValues]);

  const selectedIndex = hoveredIndex ?? chart.points.length - 1;
  const selectedPoint = chart.points[selectedIndex];
  const selectedValue = (8.75 + selectedPoint.value * 0.07).toFixed(2);
  const selectedGrowth = (
    ((selectedPoint.value / chart.points[0].value - 1) * 100) /
    10
  ).toFixed(2);

  const liveValue = (12.8 + seconds * 0.03).toFixed(2);
  const liveGrowth = (4 + seconds * 0.01).toFixed(2);

  function handleChartMove(event: MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const percentage = Math.min(Math.max(pointerX / bounds.width, 0), 1);
    const index = Math.round(percentage * (chart.points.length - 1));

    setHoveredIndex(index);
  }

  return (
    <main className="overflow-hidden bg-white text-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/60">
        <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-blue-200/40 blur-[140px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-cyan-100/60 blur-[110px]" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 md:py-28 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              Equity intelligence for modern professionals
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-bold leading-[1.04] tracking-[-0.055em] text-slate-900 md:text-7xl">
              Understand the real
              <span className="block text-blue-600">value of your ESOP.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 md:text-xl">
              A modern equity simulator that helps you understand options,
              vesting, dilution, and potential exit value—without confusing
              spreadsheets or financial jargon.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/simulator">
                <Button
                  size="lg"
                  className="h-12 rounded-xl bg-slate-900 px-6 text-base shadow-lg shadow-slate-900/15 hover:bg-slate-800"
                >
                  Try the Simulator →
                </Button>
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-base font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-emerald-600">✓</span>
                Free to use
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-emerald-600">✓</span>
                Private by design
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-emerald-600">✓</span>
                No spreadsheets
              </span>
            </div>
          </div>

          {/* Live interactive graph */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-blue-200/40 blur-3xl" />

            <div className="relative rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
              <div className="mb-4 flex items-center justify-between px-2 pt-1">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                </div>
                <p className="text-xs font-medium text-slate-400">
                  ESOP Value Clarity / Live Preview
                </p>
              </div>

              <div className="rounded-2xl bg-[#07111f] p-5 text-white md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-400">
                        Estimated value at exit
                      </p>
                      <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                        LIVE
                      </span>
                    </div>

                    <p className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
                      ₹{liveValue}L
                    </p>

                    <p className="mt-2 text-sm font-medium text-emerald-300">
                      ↑ {liveGrowth}× from today&apos;s value
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
                    <p className="text-xs text-slate-400">Exit scenario</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Expected growth
                    </p>
                  </div>
                </div>

                <div className="relative mt-9 h-52 border-b border-l border-white/10 md:h-60">
                  <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-white/10" />
                  <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-white/10" />
                  <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-white/10" />

                  {hoveredIndex !== null && (
                    <div
                      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs shadow-xl"
                      style={{
                        left: `${(selectedPoint.x / 600) * 100}%`,
                        top: `${(selectedPoint.y / 260) * 100}%`,
                      }}
                    >
                      <p className="text-slate-400">Projected value</p>
                      <p className="mt-1 font-semibold text-white">
                        ₹{selectedValue}L
                      </p>
                      <p className="mt-1 text-emerald-300">
                        +{selectedGrowth}% growth
                      </p>
                    </div>
                  )}

                  <svg
                    viewBox="0 0 600 260"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full cursor-crosshair overflow-visible"
                    aria-label="Interactive live projected ESOP value chart"
                    onMouseMove={handleChartMove}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <defs>
                      <linearGradient
                        id="liveChartFill"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity="0.42"
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity="0"
                        />
                      </linearGradient>

                      <linearGradient
                        id="liveChartLine"
                        x1="0"
                        x2="1"
                        y1="0"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#93c5fd" />
                      </linearGradient>
                    </defs>

                    <path d={chart.areaPath} fill="url(#liveChartFill)" />

                    <path
                      d={chart.linePath}
                      fill="none"
                      stroke="url(#liveChartLine)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="5"
                      style={{ transition: "d 700ms ease-in-out" }}
                    />

                    {hoveredIndex !== null && (
                      <>
                        <line
                          x1={selectedPoint.x}
                          x2={selectedPoint.x}
                          y1="0"
                          y2="260"
                          stroke="#93c5fd"
                          strokeDasharray="5 7"
                          strokeOpacity="0.55"
                        />
                        <circle
                          cx={selectedPoint.x}
                          cy={selectedPoint.y}
                          r="9"
                          fill="#dbeafe"
                          stroke="#2563eb"
                          strokeWidth="5"
                        />
                      </>
                    )}

                    {hoveredIndex === null && (
                      <circle
                        cx={chart.points[chart.points.length - 1].x}
                        cy={chart.points[chart.points.length - 1].y}
                        r="8"
                        fill="#dbeafe"
                        stroke="#2563eb"
                        strokeWidth="5"
                      />
                    )}
                  </svg>

                  <div className="absolute bottom-[-28px] left-0 flex w-full justify-between text-xs text-slate-500">
                    <span>Grant</span>
                    <span>Today</span>
                    <span>Series A</span>
                    <span>Series B</span>
                    <span>Exit</span>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-3 gap-3">
                  {[
                    ["Vested", "72%"],
                    ["Dilution", "18.6%"],
                    ["Ownership", "0.08%"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/10 bg-white/[0.05] p-3"
                    >
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive trust cards */}
      <section className="border-b border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-4 md:grid-cols-3">
            {trustCards.map((card, index) => {
              const isActive = activeTrustCard === index;

              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => setActiveTrustCard(index)}
                  className={`group rounded-2xl border p-6 text-left transition duration-300 ${
                    isActive
                      ? "border-blue-200 bg-blue-600 text-white shadow-xl shadow-blue-200/60"
                      : "border-slate-200 bg-white hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl text-lg font-semibold ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {card.icon}
                    </span>

                    <span
                      className={`text-sm transition group-hover:translate-x-1 ${
                        isActive ? "text-blue-100" : "text-blue-600"
                      }`}
                    >
                      Explore →
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-semibold">{card.title}</h3>

                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isActive ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {isActive ? card.detail : card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Built for clarity
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-slate-900 md:text-5xl">
            The financial picture behind your options.
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            ESOP Value Clarity turns complex startup equity into useful,
            understandable information for your next big decision.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="group rounded-3xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/60"
            >
              <p className="text-sm font-bold text-blue-600">{feature.number}</p>

              <div className="mt-10 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-600">
                ↗
              </div>

              <h3 className="mt-7 text-2xl font-semibold tracking-tight text-slate-900">
                {feature.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {feature.description}
              </p>

              <p className="mt-8 text-sm font-semibold text-blue-600 transition group-hover:translate-x-1">
                Learn more →
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-950 py-24 text-white md:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
              How it works
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] md:text-5xl">
              From grant letter to clear answers.
            </h2>

            <p className="mt-5 max-w-md text-lg leading-8 text-slate-400">
              Get a meaningful view of your ESOP value in minutes—not hours of
              spreadsheet work.
            </p>

            <Link href="/simulator" className="mt-8 inline-block">
              <Button
                size="lg"
                className="rounded-xl bg-white px-6 text-slate-950 hover:bg-blue-50"
              >
                Start calculating →
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {[
              [
                "01",
                "Add your ESOP details",
                "Enter your option count, strike price, vesting percentage, and company valuation.",
              ],
              [
                "02",
                "Model your assumptions",
                "Choose projected growth, future funding rounds, and possible dilution.",
              ],
              [
                "03",
                "Explore your potential value",
                "Compare outcomes and understand the assumptions behind every number.",
              ],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="flex gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-400/15 text-sm font-bold text-blue-200">
                  {number}
                </span>

                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 leading-7 text-slate-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Frequently asked questions
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-slate-900">
              Equity should not feel confusing.
            </h2>

            <p className="mt-5 max-w-md leading-7 text-slate-600">
              Straight answers to the important questions around ESOPs,
              vesting, dilution, and startup equity.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-6">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-b border-slate-200 py-5 last:border-none"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold text-slate-900">
                  {faq.question}
                  <span className="text-xl font-normal text-blue-600 transition duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="max-w-2xl pt-4 leading-7 text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-6 py-20 text-center text-white md:px-12 md:py-24">
          <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-slate-950/20 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
              Start with confidence
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-[-0.045em] md:text-5xl">
              Make your equity make sense.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50">
              See the assumptions, understand the trade-offs, and get a clearer
              picture of what your ESOP could mean.
            </p>

            <Link href="/simulator" className="mt-8 inline-block">
              <Button
                size="lg"
                className="rounded-xl bg-white px-7 text-base text-slate-950 hover:bg-slate-100"
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

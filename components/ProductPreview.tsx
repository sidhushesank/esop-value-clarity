"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  SCENARIOS — structured like a real SaaS data model                 */
/* ------------------------------------------------------------------ */

const slides = [
  // VESTING
  {
    group: "Vesting",
    title: "Standard 4-Year Vesting",
    description: "Vested value increasing year over year.",
    kpi: "₹7,00,000",
    delta: "+₹5,00,000 over 4 years",
    data: [
      { label: "Year 1", vested: 200000, projected: 220000 },
      { label: "Year 2", vested: 350000, projected: 380000 },
      { label: "Year 3", vested: 500000, projected: 540000 },
      { label: "Year 4", vested: 650000, projected: 700000 },
    ],
  },
  {
    group: "Vesting",
    title: "Accelerated Vesting",
    description: "Faster vesting with higher early value.",
    kpi: "₹9,50,000",
    delta: "+₹7,50,000 over 3 years",
    data: [
      { label: "Year 1", vested: 300000, projected: 320000 },
      { label: "Year 2", vested: 650000, projected: 700000 },
      { label: "Year 3", vested: 950000, projected: 1000000 },
    ],
  },

  // DILUTION
  {
    group: "Dilution",
    title: "Post-Funding Dilution",
    description: "Ownership value across funding rounds.",
    kpi: "₹4,20,000",
    delta: "−₹2,80,000 after dilution",
    data: [
      { label: "Seed", vested: 700000, projected: 720000 },
      { label: "Series A", vested: 550000, projected: 570000 },
      { label: "Series B", vested: 400000, projected: 420000 },
      { label: "Series C", vested: 280000, projected: 300000 },
    ],
  },

  // EXIT
  {
    group: "Exit",
    title: "Moderate Exit",
    description: "Mid-range acquisition outcome.",
    kpi: "₹8,00,000",
    delta: "₹300 Cr company exit",
    data: [
      { label: "Low", vested: 350000, projected: 380000 },
      { label: "Mid", vested: 550000, projected: 600000 },
      { label: "High", vested: 800000, projected: 850000 },
    ],
  },
  {
    group: "Exit",
    title: "Best-Case Exit",
    description: "High-growth, strong liquidity event.",
    kpi: "₹13,00,000",
    delta: "₹1,000 Cr company exit",
    data: [
      { label: "Low", vested: 400000, projected: 450000 },
      { label: "Mid", vested: 650000, projected: 700000 },
      { label: "High", vested: 900000, projected: 950000 },
      { label: "Best", vested: 1200000, projected: 1300000 },
    ],
  },
];

export default function ProductPreview() {
  const [active, setActive] = useState(0);

  // Auto-rotate scenarios (feels alive, not gimmicky)
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((p) => (p + 1) % slides.length);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const slide = slides[active];

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-6 py-24 space-y-14">

        {/* HEADER */}
        <div className="text-center space-y-3">
          <h3 className="text-3xl font-semibold text-slate-900">
            Visualize your ESOP journey
          </h3>
          <p className="text-slate-600">
            Financially grounded visuals that explain equity outcomes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">

          {/* LEFT — ANALYTICS */}
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-6">

              {/* KPI */}
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Estimated ESOP value
                </p>
                <p className="text-4xl font-semibold text-slate-900">
                  {slide.kpi}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {slide.delta}
                </p>
              </div>

              {/* Legend */}
              <div className="flex gap-4 text-xs text-slate-500">
                <span>■ Vested value</span>
                <span>— Projected value</span>
              </div>

              {/* Chart */}
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={slide.data}>
                    <CartesianGrid stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${v / 1000}k`}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number"
                          ? `₹${value.toLocaleString()}`
                          : value
                      }
                      contentStyle={{
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="vested" fill="#cbd5e1" />
                    <Line
                      type="monotone"
                      dataKey="projected"
                      stroke="#0f172a"
                      strokeWidth={2}
                      dot={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT — SCENARIO CONTROL (REAL SAAS FEEL) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">

            <p className="text-xs uppercase tracking-wide text-slate-500 px-1">
              Scenarios
            </p>

            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-full text-left px-4 py-3 rounded-lg transition flex gap-3 items-start
                ${
                  active === i
                    ? "bg-white border border-slate-900 shadow-sm"
                    : "hover:bg-white"
                }`}
              >
                <div
                  className={`w-1 rounded-full mt-1 ${
                    active === i ? "bg-slate-900" : "bg-transparent"
                  }`}
                />
                <div>
                  <p className="text-xs uppercase text-slate-400">
                    {s.group}
                  </p>
                  <h4 className="font-medium text-slate-900 leading-tight">
                    {s.title}
                  </h4>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {s.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

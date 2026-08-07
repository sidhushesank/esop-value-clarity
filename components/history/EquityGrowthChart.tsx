"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  currentValue: number;
  afterDilution: number;
  exitValue: number;
}

export default function EquityGrowthChart({
  currentValue,
  afterDilution,
  exitValue,
}: Props) {
  const data = [
    {
      stage: "Current",
      value: currentValue,
    },
    {
      stage: "After Dilution",
      value: afterDilution,
    },
    {
      stage: "Exit",
      value: exitValue,
    },
  ];

  const growth =
    currentValue > 0
      ? (((exitValue - currentValue) / currentValue) * 100).toFixed(1)
      : "0";

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Equity Growth Projection
          </h2>

          <p className="mt-1 text-slate-500">
            Estimated value across your ESOP journey
          </p>
        </div>

        <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
          {growth}% Growth
        </div>
      </div>

      {/* Chart */}

      <div className="h-[420px] p-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 20,
              right: 20,
              left: 20,
              bottom: 10,
            }}
          >
            <defs>
              <linearGradient
                id="growthGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#2563eb"
                  stopOpacity={0.45}
                />

                <stop
                  offset="100%"
                  stopColor="#2563eb"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E5E7EB"
            />

            <XAxis
              dataKey="stage"
              tick={{
                fill: "#64748B",
                fontSize: 13,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tickFormatter={(value) =>
                "₹" + Number(value).toLocaleString("en-IN")
              }
              tick={{
                fill: "#64748B",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
              width={90}
            />

            <Tooltip
              formatter={(value) => [
                `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
                "Value",
              ]}
              contentStyle={{
                borderRadius: 16,
                border: "none",
                background: "#ffffff",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={4}
              fill="url(#growthGradient)"
              animationDuration={1800}
              activeDot={{
                r: 8,
              }}
              dot={{
                r: 6,
                strokeWidth: 3,
                fill: "#fff",
                stroke: "#2563eb",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}

      <div className="grid border-t border-slate-100 md:grid-cols-3">
        <Stat
          title="Current Value"
          value={currentValue}
        />

        <Stat
          title="After Dilution"
          value={afterDilution}
        />

        <Stat
          title="Estimated Exit"
          value={exitValue}
        />
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="border-r border-slate-100 p-6 last:border-r-0">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h3 className="mt-2 text-2xl font-bold text-slate-900">
        ₹{value.toLocaleString("en-IN")}
      </h3>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const INITIAL_VALUES = [26, 30, 34, 32, 39, 45, 43, 50, 56, 53, 62, 70];

function createChartData(values: number[]) {
  const width = 620;
  const height = 250;
  const padding = 18;
  const minimum = Math.min(...values) - 7;
  const maximum = Math.max(...values) + 9;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y =
      height -
      padding -
      ((value - minimum) / (maximum - minimum)) * (height - padding * 2);

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

export default function LiveEquityPreview() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [seconds, setSeconds] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds((current) => current + 1);

      setValues((current) => {
        const lastValue = current[current.length - 1];
        const movement = Math.floor(Math.random() * 5) - 1;
        const nextValue = Math.max(lastValue + movement, lastValue - 1);

        return [...current.slice(1), nextValue];
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const chart = useMemo(() => createChartData(values), [values]);

  const selectedIndex = hoveredIndex ?? chart.points.length - 1;
  const selectedPoint = chart.points[selectedIndex];
  const hoveredValue = (8.55 + selectedPoint.value * 0.065).toFixed(2);
  const liveValue = (12.8 + seconds * 0.03).toFixed(2);

  function handleMouseMove(event: MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - bounds.left;
    const percentage = Math.min(Math.max(mouseX / bounds.width, 0), 1);
    const index = Math.round(percentage * (chart.points.length - 1));

    setHoveredIndex(index);
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#07111f] p-7 text-white shadow-2xl shadow-slate-300/70 transition duration-300 hover:-translate-y-1 hover:shadow-blue-200/70 md:p-8">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-400">Projected exit value</p>
            <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              LIVE
            </span>
          </div>

          <p className="mt-3 text-5xl font-semibold tracking-tight">
            ₹{liveValue}L
          </p>

          <p className="mt-3 text-sm font-medium text-emerald-300">
            ↑ 4.0× from today&apos;s value
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
          <p className="text-xs text-slate-400">Scenario</p>
          <p className="mt-1 text-sm font-semibold">Expected growth</p>
        </div>
      </div>

      <div className="relative mt-10 h-52 border-b border-l border-white/10 md:h-60">
        <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-white/10" />
        <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-white/10" />
        <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-white/10" />

        {hoveredIndex !== null && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs shadow-2xl"
            style={{
              left: `${(selectedPoint.x / 620) * 100}%`,
              top: `${(selectedPoint.y / 250) * 100}%`,
            }}
          >
            <p className="text-slate-400">Projected value</p>
            <p className="mt-1 font-semibold text-white">₹{hoveredValue}L</p>
            <p className="mt-1 text-emerald-300">Live estimate</p>
          </div>
        )}

        <svg
          viewBox="0 0 620 250"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full cursor-crosshair overflow-visible"
          aria-label="Interactive projected exit value chart"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="blogChartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="blogChartLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
          </defs>

          <path d={chart.areaPath} fill="url(#blogChartFill)" />

          <path
            d={chart.linePath}
            fill="none"
            stroke="url(#blogChartLine)"
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
                y2="250"
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

      <div className="relative mt-12 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-slate-400">
          Hover across the chart to inspect each projected value.
        </p>

        <Link href="/simulator">
          <Button className="rounded-xl bg-white text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-lg">
            Open simulator →
          </Button>
        </Link>
      </div>
    </div>
  );
}
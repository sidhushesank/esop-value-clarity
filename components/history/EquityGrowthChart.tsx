"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import type { ECElementEvent, ECharts } from "echarts/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Info,
  MousePointer2,
  Percent,
  Target,
} from "lucide-react";

echarts.use([
  LineChart,
  GridComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
  CanvasRenderer,
]);

interface Props {
  currentValue: number;
  afterDilution: number;
  exitValue: number;
}

type ChartMode = "path" | "change";

interface Checkpoint {
  stage: string;
  label: string;
  value: number;
  description: string;
}

function safeNumber(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function formatNumber(value: number) {
  return safeNumber(value).toLocaleString("en-IN");
}

function formatCompactINR(value: number) {
  const amount = safeNumber(value);

  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })} Cr`;
  }

  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })} L`;
  }

  return `₹${formatNumber(amount)}`;
}

function formatSignedINR(value: number) {
  const amount = Number.isFinite(value) ? value : 0;
  if (amount === 0) return "₹0";
  return `${amount > 0 ? "+" : "−"}${formatCompactINR(Math.abs(amount))}`;
}

function formatAxisINR(value: number, mode: ChartMode) {
  if (mode === "change") return formatSignedINR(value);
  return formatCompactINR(value);
}

function getCheckpointIcon(stage: string) {
  if (stage === "Today") return CircleDollarSign;
  if (stage === "After dilution") return Percent;
  return Target;
}

function buildChartOption(
  checkpoints: Checkpoint[],
  mode: ChartMode,
): EChartsOption {
  const currentValue = checkpoints[0]?.value ?? 0;
  const values =
    mode === "path"
      ? checkpoints.map((checkpoint) => checkpoint.value)
      : checkpoints.map((checkpoint) => checkpoint.value - currentValue);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const valueRange = Math.max(maxValue - minValue, 1);
  const chartMax = mode === "path" ? Math.max(maxValue * 1.18, 1) : maxValue + valueRange * 0.18;
  const chartMin = mode === "path" ? 0 : minValue - valueRange * 0.18;

  return {
    animation: true,
    animationDuration: 900,
    animationEasing: "cubicOut",
    grid: {
      top: 30,
      right: 24,
      bottom: 52,
      left: 76,
      containLabel: false,
    },
    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: {
        type: "line",
        lineStyle: {
          color: "#a78bfa",
          width: 1,
          type: "dashed",
        },
      },
      backgroundColor: "#0d1a2b",
      borderColor: "rgba(196,181,253,0.32)",
      borderWidth: 1,
      padding: [12, 14],
      textStyle: {
        color: "#ffffff",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: 12,
      },
      valueFormatter: (value) => {
        const numericValue = Array.isArray(value)
          ? Number(value[0] ?? 0)
          : Number(value ?? 0);
        return mode === "change"
          ? formatSignedINR(numericValue)
          : formatCompactINR(numericValue);
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: checkpoints.map((checkpoint) => checkpoint.stage),
      axisLine: {
        lineStyle: {
          color: "#334155",
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: 700,
        margin: 16,
      },
    },
    yAxis: {
      type: "value",
      min: chartMin,
      max: chartMax,
      splitNumber: 4,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: "#94a3b8",
        fontSize: 11,
        fontWeight: 600,
        margin: 12,
        formatter: (value: number) => formatAxisINR(value, mode),
      },
      splitLine: {
        lineStyle: {
          color: "#26364b",
          type: "dashed",
        },
      },
    },
    series: [
      {
        name: mode === "path" ? "Modeled value" : "Change vs today",
        type: "line",
        data: values.map((value, index) => ({
          value,
          name: checkpoints[index]?.label,
          label: {
            show: true,
            position: index === 0 ? "top" : "top",
            distance: 13,
            color: "#e2e8f0",
            fontSize: 12,
            fontWeight: 800,
            formatter: mode === "change" ? formatSignedINR(value) : formatCompactINR(value),
          },
        })),
        smooth: 0.2,
        symbol: "circle",
        symbolSize: 13,
        showSymbol: true,
        lineStyle: {
          color: "#a78bfa",
          width: 3,
          shadowColor: "rgba(139,92,246,0.55)",
          shadowBlur: 16,
        },
        itemStyle: {
          color: "#07111f",
          borderColor: "#c4b5fd",
          borderWidth: 3,
          shadowColor: "rgba(167,139,250,0.45)",
          shadowBlur: 10,
        },
        areaStyle:
          mode === "path"
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "rgba(139,92,246,0.38)" },
                  { offset: 0.7, color: "rgba(59,130,246,0.12)" },
                  { offset: 1, color: "rgba(59,130,246,0)" },
                ]),
              }
            : undefined,
        emphasis: {
          focus: "series",
          scale: true,
          itemStyle: {
            color: "#ffffff",
            borderColor: "#8b5cf6",
            borderWidth: 4,
            shadowColor: "rgba(139,92,246,0.8)",
            shadowBlur: 18,
          },
        },
        markLine:
          mode === "path"
            ? {
                symbol: ["none", "none"],
                silent: true,
                label: {
                  show: true,
                  position: "insideEndTop",
                  color: "#c4b5fd",
                  fontSize: 11,
                  fontWeight: 800,
                  formatter: "Dilution checkpoint",
                },
                lineStyle: {
                  color: "#7c6bb1",
                  type: "dashed",
                  width: 1,
                },
                data: [{ xAxis: "After dilution" }],
              }
            : undefined,
        markPoint:
          mode === "path"
            ? {
                symbol: "circle",
                symbolSize: 19,
                silent: true,
                data: [
                  {
                    name: "Modeled exit",
                    coord: ["Exit", values[2]],
                    itemStyle: {
                      color: "#a7f3d0",
                      borderColor: "#07111f",
                      borderWidth: 4,
                      shadowColor: "rgba(52,211,153,0.65)",
                      shadowBlur: 18,
                    },
                  },
                ],
              }
            : undefined,
        cursor: "pointer",
      },
    ],
    silent: false,
    aria: {
      enabled: true,
      decal: {
        show: false,
      },
    },
    media: [
      {
        query: { maxWidth: 640 },
        option: {
          grid: {
            left: 66,
            right: 12,
            bottom: 50,
          },
          xAxis: {
            axisLabel: {
              fontSize: 10,
            },
          },
          yAxis: {
            axisLabel: {
              fontSize: 10,
            },
          },
          series: [
            {
              label: {
                fontSize: 10,
              },
            },
          ],
        },
      },
    ],
  };
}

export default function EquityGrowthChart({
  currentValue,
  afterDilution,
  exitValue,
}: Props) {
  const chartElementRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ECharts | null>(null);
  const [mode, setMode] = useState<ChartMode>("path");
  const [activeIndex, setActiveIndex] = useState(2);
  const [guideVisible, setGuideVisible] = useState(true);

  const checkpoints = useMemo<Checkpoint[]>(
    () => [
      {
        stage: "Today",
        label: "Value today",
        value: safeNumber(currentValue),
        description: "Current modeled value",
      },
      {
        stage: "After dilution",
        label: "After dilution",
        value: safeNumber(afterDilution),
        description: "Ownership after the saved assumption",
      },
      {
        stage: "Exit",
        label: "Modeled exit",
        value: safeNumber(exitValue),
        description: "Scenario outcome at exit valuation",
      },
    ],
    [currentValue, afterDilution, exitValue],
  );

  const growthPercent =
    checkpoints[0].value > 0
      ? ((checkpoints[2].value - checkpoints[0].value) /
          checkpoints[0].value) *
        100
      : 0;
  const positiveGrowth = growthPercent >= 0;
  const activeCheckpoint = checkpoints[activeIndex] ?? checkpoints[2];
  const activeChange = activeCheckpoint.value - checkpoints[0].value;
  const exitValueForScale = Math.max(checkpoints[2].value, checkpoints[0].value, 1);
  const telemetryProgress = Math.max(
    8,
    Math.min(100, (activeCheckpoint.value / exitValueForScale) * 100),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setGuideVisible(false), 7200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!chartElementRef.current) return;

    const chart = echarts.init(chartElementRef.current, undefined, {
      renderer: "canvas",
      useDirtyRect: true,
    });
    chartInstanceRef.current = chart;

    const focusPoint = (index: number) => {
      setActiveIndex(index);
      setGuideVisible(false);
      chart.dispatchAction({
        type: "showTip",
        seriesIndex: 0,
        dataIndex: index,
      });
    };

    const handleClick = (params: ECElementEvent) => {
      if (typeof params.dataIndex === "number") {
        focusPoint(params.dataIndex);
      }
    };

    chart.setOption(buildChartOption(checkpoints, mode), true);
    chart.on("click", handleClick);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(chartElementRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.off("click", handleClick);
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, [checkpoints, mode]);

  function selectCheckpoint(index: number) {
    setActiveIndex(index);
    setGuideVisible(false);
    chartInstanceRef.current?.dispatchAction({
      type: "showTip",
      seriesIndex: 0,
      dataIndex: index,
    });
  }

  return (
    <section
      aria-labelledby="scenario-value-path"
      className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-[#07111f] shadow-[0_22px_60px_rgba(15,23,42,0.16)]"
    >
      <div className="relative overflow-hidden px-5 py-6 text-white sm:px-8 sm:py-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.42)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.42)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="pointer-events-none absolute -right-40 -top-44 h-[34rem] w-[34rem] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-52 left-1/3 h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
                <CircleDollarSign className="h-3.5 w-3.5" />
                ESOP VALUE CLARITY · SCENARIO INTELLIGENCE
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live readout
              </span>
            </div>
            <h2
              id="scenario-value-path"
              className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.065em] sm:text-4xl lg:text-5xl"
            >
              Equity value, <span className="text-violet-300">made legible.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Trace the saved assumptions from today through dilution to the
              modeled exit outcome — with every checkpoint kept visible.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Scenario movement
            </p>
            <p className={`mt-1 flex items-center gap-2 text-2xl font-black tracking-[-0.05em] ${positiveGrowth ? "text-emerald-300" : "text-rose-300"}`}>
              {positiveGrowth ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              {positiveGrowth ? "+" : ""}{growthPercent.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-slate-400">Modeled exit vs value today</p>
          </div>
        </div>

        <div className="relative mt-7 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-[22px] border border-white/10 bg-[#0b1728]/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
            <div className="flex flex-col gap-4 border-b border-white/10 px-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  <Target className="h-4 w-4 text-violet-300" />
                  Scenario path · INR
                </p>
                <p className="mt-2 text-sm font-bold text-white">
                  {activeCheckpoint.label}
                  <span className="ml-2 text-violet-300">
                    {mode === "path" ? formatCompactINR(activeCheckpoint.value) : formatSignedINR(activeChange)}
                  </span>
                </p>
              </div>

              <div className="inline-flex w-fit rounded-xl border border-white/10 bg-white/[0.04] p-1">
                <button
                  type="button"
                  aria-pressed={mode === "path"}
                  onClick={() => {
                    setMode("path");
                    setGuideVisible(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-black transition ${mode === "path" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}
                >
                  Value path
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "change"}
                  onClick={() => {
                    setMode("change");
                    setGuideVisible(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-black transition ${mode === "change" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}
                >
                  Change vs today
                </button>
              </div>
            </div>

            <div className="relative mt-4">
              <div
                ref={chartElementRef}
                role="img"
                aria-label="Interactive chart showing current value, after dilution value, and modeled exit value"
                className="h-[320px] w-full sm:h-[390px]"
              />

              {guideVisible && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                  <div className="history-cursor-guide absolute left-[8%] top-[58%] flex items-center gap-2 rounded-full border border-violet-300/30 bg-[#101d31]/90 px-3 py-2 text-[10px] font-black text-violet-100 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                    <MousePointer2 className="h-3.5 w-3.5 text-violet-300" />
                    Explore the checkpoints
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-1 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <span>Saved inputs only</span>
              <span>Hover · click · compare</span>
            </div>
          </div>

          <aside className="rounded-[22px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Checkpoint telemetry
              </p>
              <span className="font-mono text-[10px] text-violet-300">
                0{activeIndex + 1} / 03
              </span>
            </div>
            <div className="mt-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-300">{activeCheckpoint.label}</p>
                <p className="mt-2 text-3xl font-black tracking-[-0.06em] text-white">
                  {formatCompactINR(activeCheckpoint.value)}
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-200">
                <CircleDollarSign className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Path position</span>
                <span>{Math.round(telemetryProgress)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-300 transition-[width] duration-700"
                  style={{ width: `${telemetryProgress}%` }}
                />
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Delta vs today</span>
                <span className={`font-black ${activeChange >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {formatSignedINR(activeChange)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">View mode</span>
                <span className="font-black text-slate-200">{mode === "path" ? "Absolute value" : "Relative change"}</span>
              </div>
            </div>
            <p className="mt-6 text-xs leading-5 text-slate-500">
              A transparent readout of the assumptions stored in this saved scenario.
            </p>
          </aside>
        </div>

        <div className="relative mt-4 grid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] md:grid-cols-3">
          {checkpoints.map((checkpoint, index) => {
            const Icon = getCheckpointIcon(checkpoint.stage);
            const isActive = index === activeIndex;
            const change = checkpoint.value - checkpoints[0].value;

            return (
              <button
                key={checkpoint.stage}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectCheckpoint(index)}
                className={`group border-b border-white/10 p-4 text-left transition last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 ${isActive ? "bg-violet-400/10" : "hover:bg-white/[0.04]"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    <Icon className={`h-4 w-4 ${checkpoint.stage === "Today" ? "text-blue-300" : checkpoint.stage === "After dilution" ? "text-violet-300" : "text-emerald-300"}`} />
                    Checkpoint {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={`h-2 w-2 rounded-full transition ${isActive ? "bg-violet-300 shadow-[0_0_12px_rgba(196,181,253,0.9)]" : "bg-slate-700 group-hover:bg-violet-300"}`} />
                </div>
                <p className="mt-3 text-sm font-bold text-slate-300">{checkpoint.label}</p>
                <p className="mt-1 text-xl font-black tracking-[-0.045em] text-white">{formatCompactINR(checkpoint.value)}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {mode === "change" && index > 0 ? `${formatSignedINR(change)} vs today` : checkpoint.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="relative mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-xs leading-5 text-slate-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
          <p>
            The path connects three saved modeled checkpoints. It does not
            imply monthly price movement, a guaranteed return, or guaranteed cash proceeds.
          </p>
        </div>
      </div>

      <style jsx>{`
        .history-cursor-guide {
          animation: historyCursorTrace 5.8s cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        @keyframes historyCursorTrace {
          0% {
            opacity: 0;
            transform: translate3d(0, 22px, 0) scale(0.94);
          }
          12% {
            opacity: 1;
          }
          34% {
            transform: translate3d(22%, -28px, 0) scale(1);
          }
          62% {
            transform: translate3d(54%, 18px, 0) scale(1);
          }
          84% {
            opacity: 1;
            transform: translate3d(116%, -44px, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(142%, -44px, 0) scale(0.96);
          }
        }
      `}</style>
    </section>
  );
}

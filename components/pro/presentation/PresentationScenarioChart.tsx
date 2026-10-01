"use client";

import type { EChartsOption } from "echarts";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
} from "lucide-react";

import type {
  PresentationScenario,
  PresentationScenarioKey,
} from "@/lib/esop/presentation";

import PresentationEChart from "@/components/pro/presentation/PresentationEChart";

type PresentationScenarioChartProps = {
  scenarios: PresentationScenario[];
  selectedScenario: PresentationScenarioKey;
  onScenarioChange: (
    scenario: PresentationScenarioKey,
  ) => void;
  currency?: string;
};

function formatCurrency(
  value: number,
  currency = "INR",
) {
  if (!Number.isFinite(value)) {
    return "₹0";
  }

  if (currency === "INR") {
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  }

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toLocaleString();
  }
}

function compactCurrency(
  value: number,
  currency = "INR",
) {
  if (!Number.isFinite(value)) {
    return "₹0";
  }

  const abs = Math.abs(value);

  if (currency === "INR") {
    if (abs >= 10_000_000) {
      return `₹${(
        value / 10_000_000
      ).toFixed(
        abs >= 100_000_000 ? 0 : 1,
      )}Cr`;
    }

    if (abs >= 100_000) {
      return `₹${(
        value / 100_000
      ).toFixed(
        abs >= 1_000_000 ? 0 : 1,
      )}L`;
    }

    if (abs >= 1_000) {
      return `₹${(
        value / 1_000
      ).toFixed(
        abs >= 10_000 ? 0 : 1,
      )}K`;
    }
  }

  return formatCurrency(value, currency);
}

function formatMultiple(value: number) {
  if (!Number.isFinite(value)) {
    return "0×";
  }

  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}×`;
}

function scenarioTheme(
  key: PresentationScenarioKey,
) {
  if (key === "bear") {
    return {
      main: "#d97706",
      soft: "#fff7ed",
      border: "#fed7aa",
      text: "#92400e",
      dark: "#7c2d12",
    };
  }

  if (key === "bull") {
    return {
      main: "#059669",
      soft: "#ecfdf5",
      border: "#a7f3d0",
      text: "#047857",
      dark: "#065f46",
    };
  }

  return {
    main: "#2563eb",
    soft: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    dark: "#1e3a8a",
  };
}

function scenarioIndex(
  key: PresentationScenarioKey,
) {
  if (key === "bear") return 0;
  if (key === "bull") return 2;
  return 1;
}

function scenarioColor(
  key: PresentationScenarioKey,
) {
  return scenarioTheme(key).main;
}

export default function PresentationScenarioChart({
  scenarios,
  selectedScenario,
  onScenarioChange,
  currency = "INR",
}: PresentationScenarioChartProps) {
  const orderedScenarios = [
    scenarios.find(
      (scenario) => scenario.key === "bear",
    ),
    scenarios.find(
      (scenario) => scenario.key === "base",
    ),
    scenarios.find(
      (scenario) => scenario.key === "bull",
    ),
  ].filter(
    (scenario): scenario is PresentationScenario =>
      Boolean(scenario),
  );

  if (orderedScenarios.length === 0) {
    return (
      <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <BarChart3
            size={18}
            className="text-blue-600"
          />

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
              Scenario intelligence
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              No scenario data available
            </h2>
          </div>
        </div>
      </section>
    );
  }

  const bear =
    orderedScenarios.find(
      (scenario) => scenario.key === "bear",
    ) ??
    orderedScenarios[0];

  const base =
    orderedScenarios.find(
      (scenario) => scenario.key === "base",
    ) ??
    orderedScenarios[1] ??
    orderedScenarios[0];

  const bull =
    orderedScenarios.find(
      (scenario) => scenario.key === "bull",
    ) ??
    orderedScenarios[2] ??
    orderedScenarios[orderedScenarios.length - 1];

  const selected =
    orderedScenarios.find(
      (scenario) =>
        scenario.key === selectedScenario,
    ) ?? base;

  const minTakeHome = Math.min(
    bear.estimatedTakeHome,
    base.estimatedTakeHome,
    bull.estimatedTakeHome,
  );

  const maxTakeHome = Math.max(
    bear.estimatedTakeHome,
    base.estimatedTakeHome,
    bull.estimatedTakeHome,
  );

  const spread = Math.max(
    0,
    bull.estimatedTakeHome -
      bear.estimatedTakeHome,
  );

  const bearToBase = Math.max(
    0,
    base.estimatedTakeHome -
      bear.estimatedTakeHome,
  );

  const baseToBull = Math.max(
    0,
    bull.estimatedTakeHome -
      base.estimatedTakeHome,
  );

  const selectedTheme = scenarioTheme(
    selected.key,
  );

  const chartOption: EChartsOption = {
    animation: true,
    animationDuration: 700,
    animationEasing: "cubicOut",

    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: "#07111f",
      borderColor: "#1e293b",
      borderWidth: 1,
      textStyle: {
        color: "#ffffff",
        fontSize: 12,
      },
      formatter: (
        params: unknown,
      ) => {
        if (!Array.isArray(params)) {
          return "";
        }

        const first = params[0] as
          | {
              dataIndex?: number;
            }
          | undefined;

        const index =
          typeof first?.dataIndex === "number"
            ? first.dataIndex
            : 0;

        const scenario =
          orderedScenarios[index];

        if (!scenario) {
          return "";
        }

        return `
          <div style="min-width:190px">
            <div style="font-weight:900;font-size:13px;margin-bottom:8px">
              ${scenario.label} scenario
            </div>
            <div style="margin-bottom:4px">
              Exit valuation:
              <b>${formatCurrency(
                scenario.exitValuation,
                currency,
              )}</b>
            </div>
            <div style="margin-bottom:4px">
              Estimated take-home:
              <b>${formatCurrency(
                scenario.estimatedTakeHome,
                currency,
              )}</b>
            </div>
            <div>
              Return:
              <b>${formatMultiple(
                scenario.returnMultiple,
              )}</b>
            </div>
          </div>
        `;
      },
    },

    grid: {
      top: 46,
      right: 22,
      bottom: 58,
      left: 68,
    },

    xAxis: {
      type: "category",
      data: orderedScenarios.map(
        (scenario) => scenario.label,
      ),
      axisTick: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: "#cbd5e1",
        },
      },
      axisLabel: {
        color: "#64748b",
        fontSize: 10,
        fontWeight: 800,
      },
    },

    yAxis: {
      type: "value",
      min:
        minTakeHome > 0
          ? 0
          : undefined,
      max:
        maxTakeHome > 0
          ? maxTakeHome * 1.18
          : undefined,
      axisLabel: {
        color: "#64748b",
        fontSize: 10,
        fontWeight: 700,
        formatter: (
          value: number,
        ) =>
          compactCurrency(
            value,
            currency,
          ),
      },
      axisLine: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: "#e2e8f0",
          type: "dashed",
        },
      },
    },

    series: [
      {
        name: "Estimated take-home",
        type: "bar",
        barWidth: 54,
        data: orderedScenarios.map(
          (scenario) => ({
            value:
              scenario.estimatedTakeHome,

            itemStyle: {
              color: scenarioColor(
                scenario.key,
              ),
              opacity:
                scenario.key === selectedScenario
                  ? 1
                  : 0.72,
              borderRadius: [
                12,
                12,
                0,
                0,
              ],
            },
          }),
        ),
      },
      {
        name: "Selected scenario",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 12,

        lineStyle: {
          width: 3,
          color: "#0f172a",
          opacity: 0.9,
        },

        itemStyle: {
          color:
            selectedTheme.main,
          borderColor: "#ffffff",
          borderWidth: 3,
        },

        data: orderedScenarios.map(
          (scenario) =>
            scenario.key ===
            selectedScenario
              ? scenario.estimatedTakeHome
              : null,
        ),
      },
    ],
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
              Scenario intelligence
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 md:text-3xl">
              Three possible outcomes. One connected model.
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Compare modeled company outcomes while keeping the same
              grant, ownership, dilution, exercise and tax framework.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2">
            <BarChart3
              size={14}
              className="text-blue-600"
            />

            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
              Interactive model
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8">
        {/* Scenario selector */}
        <div className="grid gap-3 md:grid-cols-3">
          {orderedScenarios.map(
            (scenario) => {
              const theme =
                scenarioTheme(
                  scenario.key,
                );

              const active =
                scenario.key ===
                selectedScenario;

              return (
                <button
                  key={scenario.key}
                  type="button"
                  onClick={() =>
                    onScenarioChange(
                      scenario.key,
                    )
                  }
                  aria-pressed={active}
                  className="relative overflow-hidden rounded-[24px] border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.985]"
                  style={{
                    borderColor: active
                      ? theme.main
                      : "#e2e8f0",
                    backgroundColor:
                      active
                        ? theme.soft
                        : "#ffffff",
                    boxShadow: active
                      ? `0 12px 30px ${theme.main}18`
                      : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className="text-[10px] font-black tracking-[0.16em]"
                        style={{
                          color: theme.text,
                        }}
                      >
                        {scenario.label}
                      </span>

                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {scenario.title}
                      </p>
                    </div>

                    <span
                      className="grid h-9 w-9 place-items-center rounded-xl"
                      style={{
                        backgroundColor: active
                          ? `${theme.main}16`
                          : "#f8fafc",
                        color:
                          theme.main,
                      }}
                    >
                      {active ? (
                        <Check size={15} />
                      ) : (
                        <span className="text-xs font-black">
                          —
                        </span>
                      )}
                    </span>
                  </div>

                  <p className="mt-7 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Estimated take-home
                  </p>

                  <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    {compactCurrency(
                      scenario.estimatedTakeHome,
                      currency,
                    )}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-black">
                    <span className="text-slate-400">
                      Exit
                    </span>

                    <span className="text-slate-700">
                      {compactCurrency(
                        scenario.exitValuation,
                        currency,
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-black">
                    <span className="text-slate-400">
                      Return
                    </span>

                    <span
                      style={{
                        color: theme.text,
                      }}
                    >
                      {formatMultiple(
                        scenario.returnMultiple,
                      )}
                    </span>
                  </div>

                  {active ? (
                    <span
                      className="absolute inset-x-5 bottom-0 h-1 rounded-full"
                      style={{
                        backgroundColor:
                          theme.main,
                      }}
                    />
                  ) : null}
                </button>
              );
            },
          )}
        </div>

        {/* Real chart */}
        <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                Outcome range
              </p>

              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                {compactCurrency(
                  bear.estimatedTakeHome,
                  currency,
                )}{" "}
                →{" "}
                {compactCurrency(
                  bull.estimatedTakeHome,
                  currency,
                )}
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                The modeled difference between the Bear and Bull outcomes
                is{" "}
                <span className="font-black text-slate-950">
                  {formatCurrency(
                    spread,
                    currency,
                  )}
                </span>
                .
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor:
                  selectedTheme.border,
                backgroundColor:
                  selectedTheme.soft,
              }}
            >
              <p
                className="text-[9px] font-black uppercase tracking-[0.12em]"
                style={{
                  color:
                    selectedTheme.text,
                }}
              >
                Viewing
              </p>

              <p className="mt-1 text-sm font-black text-slate-950">
                {selected.label} ·{" "}
                {compactCurrency(
                  selected.estimatedTakeHome,
                  currency,
                )}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <PresentationEChart
              option={chartOption}
              height={380}
            />
          </div>
        </div>

        {/* Comparison + deltas */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                  Take-home comparison
                </p>

                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                  Same grant. Different company outcomes.
                </h3>
              </div>

              <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 sm:inline-flex">
                Estimated values
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr] border-b border-slate-200 bg-slate-50 px-4 py-3 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                <span>Scenario</span>
                <span>Exit</span>
                <span>Take-home</span>
                <span>Return</span>
              </div>

              {orderedScenarios.map(
                (scenario) => {
                  const theme =
                    scenarioTheme(
                      scenario.key,
                    );

                  const active =
                    scenario.key ===
                    selectedScenario;

                  return (
                    <button
                      key={scenario.key}
                      type="button"
                      onClick={() =>
                        onScenarioChange(
                          scenario.key,
                        )
                      }
                      className="grid w-full grid-cols-[1fr_1fr_1fr_1fr] border-b border-slate-100 px-4 py-4 text-left last:border-b-0"
                      style={{
                        backgroundColor:
                          active
                            ? theme.soft
                            : "#ffffff",
                      }}
                    >
                      <span
                        className="text-xs font-black"
                        style={{
                          color:
                            theme.text,
                        }}
                      >
                        {scenario.label}
                      </span>

                      <span className="text-xs font-semibold text-slate-600">
                        {compactCurrency(
                          scenario.exitValuation,
                          currency,
                        )}
                      </span>

                      <span className="text-xs font-black text-slate-950">
                        {compactCurrency(
                          scenario.estimatedTakeHome,
                          currency,
                        )}
                      </span>

                      <span className="text-xs font-black text-slate-600">
                        {formatMultiple(
                          scenario.returnMultiple,
                        )}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="rounded-[28px] bg-[#07111f] p-6 text-white md:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-300">
              Scenario deltas
            </p>

            <h3 className="mt-2 text-2xl font-black tracking-tight">
              Where the outcome moves
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              The selected model keeps the grant, ownership, dilution,
              exercise and tax framework connected while the company
              outcome changes.
            </p>

            <div className="mt-7 space-y-5">
              <DeltaRow
                label="Bear → Base"
                value={formatCurrency(
                  bearToBase,
                  currency,
                )}
                direction="up"
                color="#93c5fd"
              />

              <DeltaRow
                label="Base → Bull"
                value={formatCurrency(
                  baseToBull,
                  currency,
                )}
                direction="up"
                color="#6ee7b7"
              />

              <DeltaRow
                label="Bear → Bull"
                value={formatCurrency(
                  spread,
                  currency,
                )}
                direction="up"
                color="#fbbf24"
              />
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                Selected outcome
              </p>

              <p className="mt-1.5 text-3xl font-black tracking-tight">
                {formatCurrency(
                  selected.estimatedTakeHome,
                  currency,
                )}
              </p>

              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>{selected.label}</span>
                <span>•</span>
                <span>
                  {formatMultiple(
                    selected.returnMultiple,
                  )}{" "}
                  return
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insight strip */}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <InsightStrip
            label="Bear"
            value={compactCurrency(
              bear.estimatedTakeHome,
              currency,
            )}
            text="Lower-growth modeled outcome."
            tone="amber"
            active={
              selectedScenario ===
              "bear"
            }
            onClick={() =>
              onScenarioChange("bear")
            }
          />

          <InsightStrip
            label="Base"
            value={compactCurrency(
              base.estimatedTakeHome,
              currency,
            )}
            text="Current modeled assumption."
            tone="blue"
            active={
              selectedScenario ===
              "base"
            }
            onClick={() =>
              onScenarioChange("base")
            }
          />

          <InsightStrip
            label="Bull"
            value={compactCurrency(
              bull.estimatedTakeHome,
              currency,
            )}
            text="Strong-growth modeled outcome."
            tone="emerald"
            active={
              selectedScenario ===
              "bull"
            }
            onClick={() =>
              onScenarioChange("bull")
            }
          />
        </div>
      </div>
    </section>
  );
}

function DeltaRow({
  label,
  value,
  direction,
  color,
}: {
  label: string;
  value: string;
  direction: "up" | "down";
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {direction === "up" ? (
          <ArrowUpRight
            size={15}
            style={{ color }}
          />
        ) : (
          <ArrowDownRight
            size={15}
            style={{ color }}
          />
        )}

        <span className="text-xs font-semibold text-slate-400">
          {label}
        </span>
      </div>

      <span
        className="text-sm font-black"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function InsightStrip({
  label,
  value,
  text,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: string;
  text: string;
  tone: "amber" | "blue" | "emerald";
  active: boolean;
  onClick: () => void;
}) {
  const color =
    tone === "amber"
      ? "#d97706"
      : tone === "emerald"
        ? "#059669"
        : "#2563eb";

  const background =
    tone === "amber"
      ? "#fff7ed"
      : tone === "emerald"
        ? "#ecfdf5"
        : "#eff6ff";

  const border =
    tone === "amber"
      ? "#fed7aa"
      : tone === "emerald"
        ? "#a7f3d0"
        : "#bfdbfe";

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[22px] border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: active
          ? color
          : "#e2e8f0",
        backgroundColor: active
          ? background
          : "#ffffff",
        boxShadow: active
          ? `0 8px 24px ${color}12`
          : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="text-[9px] font-black uppercase tracking-[0.12em]"
          style={{ color }}
        >
          {label}
        </span>

        {active ? (
          <Check
            size={13}
            style={{ color }}
          />
        ) : null}
      </div>

      <p className="mt-2 text-lg font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-[10px] leading-5 text-slate-500">
        {text}
      </p>

      <span
        className="mt-3 block h-1 rounded-full"
        style={{
          backgroundColor:
            active
              ? color
              : border,
        }}
      />
    </button>
  );
}
"use client";

import {
  ArrowDown,
  ArrowUpRight,
  CircleDollarSign,
  ReceiptIndianRupee,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import type {
  PresentationScenario,
} from "@/lib/esop/presentation";

type PresentationTakeHomePanelProps = {
  scenario: PresentationScenario;
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

  if (currency === "INR") {
    const abs = Math.abs(value);

    if (abs >= 10_000_000) {
      return `₹${(value / 10_000_000).toFixed(
        abs >= 100_000_000 ? 0 : 1,
      )}Cr`;
    }

    if (abs >= 100_000) {
      return `₹${(value / 100_000).toFixed(
        abs >= 1_000_000 ? 0 : 1,
      )}L`;
    }

    if (abs >= 1_000) {
      return `₹${(value / 1_000).toFixed(
        abs >= 10_000 ? 0 : 1,
      )}K`;
    }
  }

  return formatCurrency(value, currency);
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}%`;
}

function formatMultiple(value: number) {
  if (!Number.isFinite(value)) {
    return "0×";
  }

  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}×`;
}

function scenarioColors(
  key: PresentationScenario["key"],
) {
  if (key === "bear") {
    return {
      primary: "#d97706",
      soft: "#fff7ed",
      border: "#fed7aa",
      text: "#92400e",
      glow: "rgba(217,119,6,0.14)",
    };
  }

  if (key === "bull") {
    return {
      primary: "#059669",
      soft: "#ecfdf5",
      border: "#a7f3d0",
      text: "#047857",
      glow: "rgba(5,150,105,0.14)",
    };
  }

  return {
    primary: "#2563eb",
    soft: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    glow: "rgba(37,99,235,0.14)",
  };
}

export default function PresentationTakeHomePanel({
  scenario,
  currency = "INR",
}: PresentationTakeHomePanelProps) {
  const theme = scenarioColors(
    scenario.key,
  );

  const gross = Math.max(
    0,
    scenario.grossEquityValue,
  );

  const exerciseCost = Math.max(
    0,
    scenario.exerciseCost,
  );

  const estimatedTax = Math.max(
    0,
    scenario.estimatedTax,
  );

  const takeHome = Math.max(
    0,
    scenario.estimatedTakeHome,
  );

  const retainedPercentage =
    gross > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (takeHome / gross) * 100,
          ),
        )
      : 0;

  const exercisePercentage =
    gross > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (exerciseCost / gross) * 100,
          ),
        )
      : 0;

  const taxPercentage =
    gross > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (estimatedTax / gross) * 100,
          ),
        )
      : 0;

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-[#050816] text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
      {/* Top heading */}
      <div className="border-b border-white/10 px-6 py-6 md:px-8 md:py-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                <Wallet size={12} />
                Outcome dashboard
              </span>

              <span
                className="rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em]"
                style={{
                  borderColor: `${theme.primary}44`,
                  backgroundColor: `${theme.primary}12`,
                  color: "#93c5fd",
                }}
              >
                {scenario.label}
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] sm:text-3xl md:text-4xl">
              What the modeled equity could leave behind
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              The selected scenario moves from gross equity value
              through exercise cost and estimated tax to the modeled
              take-home amount.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
              Exit valuation
            </p>

            <p className="mt-1 text-lg font-black text-white">
              {compactCurrency(
                scenario.exitValuation,
                currency,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main analytical area */}
      <div className="p-5 md:p-8">
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Main outcome */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
              style={{
                backgroundColor:
                  theme.primary,
                opacity: 0.14,
              }}
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                    Estimated take-home
                  </p>

                  <p className="mt-3 text-5xl font-black tracking-[-0.055em] text-white sm:text-6xl">
                    {compactCurrency(
                      takeHome,
                      currency,
                    )}
                  </p>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                    Modeled amount remaining after the exercise
                    requirement and estimated tax for the selected
                    {` `}
                    {scenario.label.toLowerCase()} scenario.
                  </p>
                </div>

                <div
                  className="hidden h-14 w-14 place-items-center rounded-2xl sm:grid"
                  style={{
                    backgroundColor:
                      `${theme.primary}16`,
                    color:
                      theme.primary,
                  }}
                >
                  <Wallet size={23} />
                </div>
              </div>

              {/* Large proportion bar */}
              <div className="mt-9">
                <div className="flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[0.12em]">
                  <span className="text-slate-500">
                    Gross equity
                  </span>

                  <span className="text-slate-400">
                    {formatCurrency(
                      gross,
                      currency,
                    )}
                  </span>
                </div>

                <div className="mt-3 h-8 overflow-hidden rounded-full bg-white/[0.055]">
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-white/80 transition-all duration-700"
                    style={{
                      width: `${retainedPercentage}%`,
                    }}
                  >
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-950">
                      {retainedPercentage.toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits: 1,
                        },
                      )}
                      %
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-500">
                    Estimated value retained
                  </span>

                  <span className="text-[10px] font-black text-blue-300">
                    {formatPercentage(
                      retainedPercentage,
                    )}
                  </span>
                </div>
              </div>

              {/* Primary outcome stats */}
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <DarkOutcomeStat
                  icon={
                    <CircleDollarSign
                      size={16}
                    />
                  }
                  label="Gross equity"
                  value={formatCurrency(
                    gross,
                    currency,
                  )}
                  accent="#93c5fd"
                />

                <DarkOutcomeStat
                  icon={
                    <ArrowDown size={16} />
                  }
                  label="Exercise cost"
                  value={`−${formatCurrency(
                    exerciseCost,
                    currency,
                  )}`}
                  accent="#fbbf24"
                />

                <DarkOutcomeStat
                  icon={
                    <ReceiptIndianRupee
                      size={16}
                    />
                  }
                  label="Estimated tax"
                  value={`−${formatCurrency(
                    estimatedTax,
                    currency,
                  )}`}
                  accent="#fca5a5"
                />
              </div>
            </div>
          </div>

          {/* Outcome bridge */}
          <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Value bridge
                </p>

                <h3 className="mt-2 text-xl font-black tracking-tight text-white">
                  Where the money moves
                </h3>
              </div>

              <ShieldCheck
                size={18}
                className="text-blue-300"
              />
            </div>

            <div className="mt-8 space-y-6">
              <BridgeRow
                step="01"
                label="Gross equity value"
                value={formatCurrency(
                  gross,
                  currency,
                )}
                width={100}
                color="#60a5fa"
              />

              <BridgeRow
                step="02"
                label="Exercise requirement"
                value={`−${formatCurrency(
                  exerciseCost,
                  currency,
                )}`}
                width={exercisePercentage}
                color="#f59e0b"
                negative
              />

              <BridgeRow
                step="03"
                label="Estimated tax"
                value={`−${formatCurrency(
                  estimatedTax,
                  currency,
                )}`}
                width={taxPercentage}
                color="#ef4444"
                negative
              />

              <BridgeRow
                step="04"
                label="Estimated take-home"
                value={formatCurrency(
                  takeHome,
                  currency,
                )}
                width={retainedPercentage}
                color="#34d399"
                result
              />
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                  style={{
                    backgroundColor:
                      `${theme.primary}18`,
                    color:
                      theme.primary,
                  }}
                >
                  <CircleDollarSign
                    size={14}
                  />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Scenario outcome
                  </p>

                  <p className="mt-1 text-sm font-black text-white">
                    {formatMultiple(
                      scenario.returnMultiple,
                    )}{" "}
                    modeled return
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-500">
                    Based on the exercise capital used in the
                    existing EVC model.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive summary band */}
        <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                Executive readout
              </p>

              <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-300">
                At a{" "}
                <span className="font-black text-white">
                  {formatCurrency(
                    scenario.exitValuation,
                    currency,
                  )}
                </span>{" "}
                exit valuation, the modeled grant produces{" "}
                <span
                  className="font-black"
                  style={{
                    color: "#93c5fd",
                  }}
                >
                  {formatCurrency(
                    scenario.grossEquityValue,
                    currency,
                  )}
                </span>{" "}
                of gross equity value before{" "}
                <span className="font-black text-amber-300">
                  {formatCurrency(
                    exerciseCost,
                    currency,
                  )}
                </span>{" "}
                of exercise cost and{" "}
                <span className="font-black text-red-300">
                  {formatCurrency(
                    estimatedTax,
                    currency,
                  )}
                </span>{" "}
                of estimated tax.
              </p>
            </div>

            <div
              className="rounded-2xl border px-5 py-4 lg:min-w-[250px]"
              style={{
                borderColor:
                  theme.border,
                backgroundColor:
                  theme.soft,
              }}
            >
              <p
                className="text-[9px] font-black uppercase tracking-[0.12em]"
                style={{
                  color:
                    theme.text,
                }}
              >
                Modeled result
              </p>

              <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {compactCurrency(
                  takeHome,
                  currency,
                )}
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                {formatMultiple(
                  scenario.returnMultiple,
                )}{" "}
                estimated return
              </p>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ExecutiveMetric
            label="Exit valuation"
            value={formatCurrency(
              scenario.exitValuation,
              currency,
            )}
            caption="Selected company outcome"
          />

          <ExecutiveMetric
            label="Gross equity"
            value={formatCurrency(
              gross,
              currency,
            )}
            caption="Before exercise and tax"
          />

          <ExecutiveMetric
            label="Estimated take-home"
            value={formatCurrency(
              takeHome,
              currency,
            )}
            caption="After modeled deductions"
            featured
          />

          <ExecutiveMetric
            label="Value retained"
            value={formatPercentage(
              retainedPercentage,
            )}
            caption="Take-home / gross equity"
          />
        </div>
      </div>
    </section>
  );
}

function DarkOutcomeStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `${accent}14`,
          color: accent,
        }}
      >
        {icon}
      </div>

      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

function BridgeRow({
  step,
  label,
  value,
  width,
  color,
  negative = false,
  result = false,
}: {
  step: string;
  label: string;
  value: string;
  width: number;
  color: string;
  negative?: boolean;
  result?: boolean;
}) {
  const safeWidth = Math.min(
    100,
    Math.max(
      result ? 18 : 6,
      Number.isFinite(width)
        ? width
        : 0,
    ),
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-[8px] font-black"
            style={{
              borderColor: `${color}44`,
              backgroundColor: `${color}0d`,
              color,
            }}
          >
            {step}
          </span>

          <span
            className={`truncate text-xs ${
              result
                ? "font-black text-white"
                : "font-semibold text-slate-400"
            }`}
          >
            {label}
          </span>
        </div>

        <span
          className={`shrink-0 text-xs font-black ${
            negative
              ? "text-amber-300"
              : result
                ? "text-white"
                : "text-slate-300"
          }`}
        >
          {value}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${safeWidth}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function ExecutiveMetric({
  label,
  value,
  caption,
  featured = false,
}: {
  label: string;
  value: string;
  caption: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border p-4 ${
        featured
          ? "border-blue-300/20 bg-blue-500/[0.08]"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-black tracking-tight ${
          featured
            ? "text-blue-200"
            : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] leading-5 text-slate-500">
        {caption}
      </p>
    </div>
  );
}
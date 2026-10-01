"use client";

import {
  ArrowDown,
  ArrowRight,
  CircleDollarSign,
  ReceiptIndianRupee,
  Wallet,
} from "lucide-react";

import type {
  PresentationScenario,
  PresentationWaterfallStep,
} from "@/lib/esop/presentation";

type PresentationWaterfallProps = {
  scenario: PresentationScenario;
  steps: PresentationWaterfallStep[];
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

function formatCompactCurrency(
  value: number,
  currency = "INR",
) {
  if (!Number.isFinite(value)) {
    return "₹0";
  }

  const abs = Math.abs(value);

  if (currency === "INR") {
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

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function maxBarValue(steps: PresentationWaterfallStep[]) {
  return Math.max(
    1,
    ...steps.map((step) => Math.abs(step.value)),
  );
}

function stepIcon(key: PresentationWaterfallStep["key"]) {
  switch (key) {
    case "gross":
      return CircleDollarSign;

    case "exercise":
      return CircleDollarSign;

    case "tax":
      return ReceiptIndianRupee;

    case "takeHome":
      return Wallet;

    default:
      return CircleDollarSign;
  }
}

export default function PresentationWaterfall({
  scenario,
  steps,
  currency = "INR",
}: PresentationWaterfallProps) {
  const gross =
    steps.find((step) => step.key === "gross")
      ?.value ?? scenario.grossEquityValue;

  const exercise =
    steps.find((step) => step.key === "exercise")
      ?.value ?? scenario.exerciseCost;

  const tax =
    steps.find((step) => step.key === "tax")
      ?.value ?? scenario.estimatedTax;

  const takeHome =
    steps.find((step) => step.key === "takeHome")
      ?.value ?? scenario.estimatedTakeHome;

  const deductionTotal =
    Math.max(0, exercise) +
    Math.max(0, tax);

  const retainedPercentage =
    gross > 0
      ? clampPercentage(
          (takeHome / gross) * 100,
        )
      : 0;

  const maxValue = maxBarValue(steps);

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
              Value journey
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 md:text-3xl">
              What could actually reach you?
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              The selected {scenario.label.toLowerCase()} scenario
              shows how modeled equity value is reduced by the cost
              of exercising and estimated tax before arriving at
              modeled take-home.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" />

            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
              {scenario.label} scenario
            </span>
          </div>
        </div>
      </div>

      {/* Main waterfall */}
      <div className="p-5 md:p-8">
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
          {/* Visual flow */}
          <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                  Money flow
                </p>

                <p className="mt-1 text-sm font-black text-slate-950">
                  From gross equity to estimated take-home
                </p>
              </div>

              <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-slate-400 sm:inline-flex">
                Connected calculation
              </span>
            </div>

            <div className="mt-8 space-y-5">
              {steps.map((step, index) => {
                const Icon = stepIcon(step.key);
                const isLast =
                  index === steps.length - 1;

                const isNegative =
                  step.direction === "negative";

                const isResult =
                  step.direction === "result";

                const width =
                  isResult
                    ? Math.max(
                        24,
                        clampPercentage(
                          (Math.max(
                            0,
                            step.value,
                          ) /
                            Math.max(
                              1,
                              gross,
                            )) *
                            100,
                        ),
                      )
                    : Math.max(
                        9,
                        clampPercentage(
                          (Math.abs(
                            step.value,
                          ) /
                            maxValue) *
                            100,
                        ),
                      );

                return (
                  <div key={step.key}>
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          isResult
                            ? "bg-slate-950 text-blue-300"
                            : isNegative
                              ? "bg-amber-50 text-amber-600"
                              : "bg-white text-blue-600"
                        }`}
                      >
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p
                              className={`text-[10px] font-black uppercase tracking-[0.12em] ${
                                isNegative
                                  ? "text-amber-600"
                                  : isResult
                                    ? "text-slate-500"
                                    : "text-slate-400"
                              }`}
                            >
                              {step.direction ===
                              "negative"
                                ? "Deduction"
                                : step.direction ===
                                    "result"
                                  ? "Result"
                                  : "Value"}
                            </p>

                            <p
                              className={`mt-1 ${
                                isResult
                                  ? "text-base font-black text-slate-950"
                                  : "text-sm font-black text-slate-950"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>

                          <p
                            className={`shrink-0 text-lg font-black tracking-tight ${
                              isNegative
                                ? "text-amber-700"
                                : isResult
                                  ? "text-slate-950"
                                  : "text-blue-700"
                            }`}
                          >
                            {isNegative
                              ? "−"
                              : ""}
                            {formatCurrency(
                              Math.abs(
                                step.value,
                              ),
                              currency,
                            )}
                          </p>
                        </div>

                        <div className="mt-3 h-4 overflow-hidden rounded-full bg-white">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isResult
                                ? "bg-gradient-to-r from-blue-600 via-indigo-500 to-slate-950"
                                : isNegative
                                  ? "bg-gradient-to-r from-amber-300 to-amber-500"
                                  : "bg-gradient-to-r from-blue-400 to-blue-700"
                            }`}
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {!isLast ? (
                      <div className="ml-5 flex h-7 items-center">
                        <div className="h-full border-l border-dashed border-slate-300" />
                        <ArrowDown
                          size={13}
                          className="-ml-[6px] text-slate-300"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outcome panel */}
          <div className="rounded-[26px] bg-[#07111f] p-6 text-white md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/15 text-blue-300">
                <Wallet size={19} />
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                Estimated outcome
              </span>
            </div>

            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              {scenario.label} take-home
            </p>

            <p className="mt-2 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
              {formatCompactCurrency(
                takeHome,
                currency,
              )}
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Approximate modeled amount after exercise
              cost and estimated tax under the current
              assumptions.
            </p>

            <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
              <OutcomeRow
                label="Gross equity value"
                value={formatCurrency(
                  gross,
                  currency,
                )}
              />

              <OutcomeRow
                label="Exercise cost"
                value={`−${formatCurrency(
                  exercise,
                  currency,
                )}`}
                negative
              />

              <OutcomeRow
                label="Estimated tax"
                value={`−${formatCurrency(
                  tax,
                  currency,
                )}`}
                negative
              />

              <OutcomeRow
                label="Estimated take-home"
                value={formatCurrency(
                  takeHome,
                  currency,
                )}
                strong
              />
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">
                  Value retained
                </span>

                <span className="font-black text-blue-300">
                  {retainedPercentage.toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 1,
                    },
                  )}
                  %
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-200 transition-all duration-700"
                  style={{
                    width: `${retainedPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-[10px] leading-5 text-slate-500">
                Percentage of gross modeled equity value
                remaining after the current exercise and tax
                assumptions.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom interpretation rail */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InterpretationItem
            label="Gross"
            value={formatCurrency(
              gross,
              currency,
            )}
            text="What the modeled stake is worth at the selected exit."
          />

          <InterpretationItem
            label="Cost + tax"
            value={formatCurrency(
              deductionTotal,
              currency,
            )}
            text="The two major modeled deductions before take-home."
          />

          <InterpretationItem
            label="Take-home"
            value={formatCurrency(
              takeHome,
              currency,
            )}
            text="What the current scenario leaves after modeled deductions."
            featured
          />
        </div>
      </div>
    </section>
  );
}

function OutcomeRow({
  label,
  value,
  negative = false,
  strong = false,
}: {
  label: string;
  value: string;
  negative?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        strong
          ? "border-t border-white/10 pt-4"
          : ""
      }`}
    >
      <span
        className={`text-xs ${
          strong
            ? "font-black text-slate-200"
            : "text-slate-500"
        }`}
      >
        {label}
      </span>

      <span
        className={`text-sm font-black ${
          negative
            ? "text-amber-300"
            : strong
              ? "text-white"
              : "text-slate-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function InterpretationItem({
  label,
  value,
  text,
  featured = false,
}: {
  label: string;
  value: string;
  text: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border p-4 transition ${
        featured
          ? "border-slate-900 bg-slate-950 text-white shadow-lg"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p
        className={`text-[9px] font-black uppercase tracking-[0.12em] ${
          featured
            ? "text-slate-500"
            : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1.5 text-lg font-black tracking-tight ${
          featured
            ? "text-white"
            : "text-slate-950"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-1.5 text-[11px] leading-5 ${
          featured
            ? "text-slate-500"
            : "text-slate-500"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
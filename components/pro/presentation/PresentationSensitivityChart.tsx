"use client";

import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  Percent,
  ReceiptIndianRupee,
  Sparkles,
} from "lucide-react";

import type {
  PresentationSensitivityItem,
} from "@/lib/esop/presentation";

type PresentationSensitivityChartProps = {
  items: PresentationSensitivityItem[];
  currency?: string;
};

type SensitivityKey =
  | "valuation"
  | "dilution"
  | "exercise"
  | "tax"
  | "vesting";

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

function sensitivityTitle(
  key: SensitivityKey,
) {
  switch (key) {
    case "valuation":
      return "Company outcome";

    case "dilution":
      return "Future ownership";

    case "exercise":
      return "Cash required";

    case "tax":
      return "Tax impact";

    case "vesting":
      return "Equity active today";

    default:
      return "Model driver";
  }
}

function sensitivityShort(
  item: PresentationSensitivityItem,
) {
  switch (item.key) {
    case "valuation":
      return "Exit value";

    case "dilution":
      return "Dilution";

    case "exercise":
      return "Exercise";

    case "tax":
      return "Estimated tax";

    case "vesting":
      return "Vesting";

    default:
      return item.label;
  }
}

function iconFor(
  key: SensitivityKey,
) {
  switch (key) {
    case "valuation":
      return CircleDollarSign;

    case "dilution":
      return Percent;

    case "exercise":
      return BarChart3;

    case "tax":
      return ReceiptIndianRupee;

    case "vesting":
      return Sparkles;

    default:
      return BarChart3;
  }
}

function colorFor(
  key: SensitivityKey,
) {
  switch (key) {
    case "valuation":
      return {
        main: "#2563eb",
        soft: "#eff6ff",
        border: "#bfdbfe",
        text: "#1d4ed8",
      };

    case "dilution":
      return {
        main: "#7c3aed",
        soft: "#f5f3ff",
        border: "#ddd6fe",
        text: "#6d28d9",
      };

    case "exercise":
      return {
        main: "#d97706",
        soft: "#fff7ed",
        border: "#fed7aa",
        text: "#b45309",
      };

    case "tax":
      return {
        main: "#dc2626",
        soft: "#fef2f2",
        border: "#fecaca",
        text: "#b91c1c",
      };

    case "vesting":
      return {
        main: "#059669",
        soft: "#ecfdf5",
        border: "#a7f3d0",
        text: "#047857",
      };

    default:
      return {
        main: "#2563eb",
        soft: "#eff6ff",
        border: "#bfdbfe",
        text: "#1d4ed8",
      };
  }
}

function normalizedMagnitude(
  item: PresentationSensitivityItem,
  items: PresentationSensitivityItem[],
) {
  const values = items.map((entry) =>
    Math.abs(entry.value),
  );

  const max = Math.max(1, ...values);

  return Math.min(
    100,
    Math.max(
      8,
      (Math.abs(item.value) / max) * 100,
    ),
  );
}

function formatItemValue(
  item: PresentationSensitivityItem,
  currency: string,
) {
  if (item.unit === "INR") {
    return formatCompactCurrency(
      item.displayValue,
      currency,
    );
  }

  if (item.unit === "%") {
    return formatPercentage(
      item.displayValue,
    );
  }

  return Math.round(
    item.displayValue,
  ).toLocaleString("en-IN");
}

export default function PresentationSensitivityChart({
  items,
  currency = "INR",
}: PresentationSensitivityChartProps) {
  const ordered = [
    "valuation",
    "dilution",
    "exercise",
    "tax",
    "vesting",
  ] as SensitivityKey[];

  const availableItems = ordered
    .map((key) =>
      items.find(
        (item) => item.key === key,
      ),
    )
    .filter(
      (
        item,
      ): item is PresentationSensitivityItem =>
        Boolean(item),
    );

  const topDriver =
    availableItems[0] ?? null;

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
              Sensitivity intelligence
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 md:text-3xl">
              What actually moves the outcome?
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
              The same connected EVC model brings the major
              assumptions into one view so the presenter can see
              what sits behind the final number.
            </p>
          </div>

          {topDriver ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 xl:min-w-[250px]">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-600">
                Primary model input
              </p>

              <p className="mt-1 text-sm font-black text-slate-950">
                {sensitivityTitle(
                  topDriver.key,
                )}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                {topDriver.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-5 md:p-8">
        {/* Main sensitivity visual */}
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          {/* Driver bars */}
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                  Model drivers
                </p>

                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                  Inputs behind the equity story
                </h3>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 sm:flex">
                <BarChart3 size={12} />
                Relative view
              </div>
            </div>

            <div className="mt-8 space-y-7">
              {availableItems.map(
                (item, index) => {
                  const theme = colorFor(
                    item.key,
                  );

                  const Icon = iconFor(
                    item.key,
                  );

                  const magnitude =
                    normalizedMagnitude(
                      item,
                      availableItems,
                    );

                  const isFirst = index === 0;

                  return (
                    <div
                      key={item.key}
                      className="group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                            style={{
                              backgroundColor:
                                theme.soft,
                              color: theme.main,
                              border: `1px solid ${theme.border}`,
                            }}
                          >
                            <Icon size={17} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-black text-slate-950">
                                {item.label}
                              </p>

                              {isFirst ? (
                                <span
                                  className="rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.09em]"
                                  style={{
                                    backgroundColor:
                                      theme.soft,
                                    color:
                                      theme.text,
                                  }}
                                >
                                  Key input
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-slate-400">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className="text-sm font-black"
                            style={{
                              color:
                                theme.text,
                            }}
                          >
                            {formatItemValue(
                              item,
                              currency,
                            )}
                          </p>

                          <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                            {item.unit}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${magnitude}%`,
                              background: `linear-gradient(90deg, ${theme.main}, ${theme.main}88)`,
                            }}
                          />
                        </div>

                        <span className="w-10 text-right text-[9px] font-black tabular-nums text-slate-400">
                          {Math.round(
                            magnitude,
                          )}
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>

            {/* Scale */}
            <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-4 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
              <span>Relative contribution view</span>

              <span>Higher magnitude</span>
            </div>
          </div>

          {/* Focus panel */}
          <div className="rounded-[28px] bg-[#07111f] p-6 text-white md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/15 text-blue-300">
                <Sparkles size={19} />
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                Presentation view
              </span>
            </div>

            {topDriver ? (
              <>
                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Current focus
                </p>

                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                  {sensitivityTitle(
                    topDriver.key,
                  )}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {topDriver.description}
                </p>

                <div className="mt-7 rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Current value
                  </p>

                  <p className="mt-2 text-3xl font-black tracking-tight text-white">
                    {formatItemValue(
                      topDriver,
                      currency,
                    )}
                  </p>

                  <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    {topDriver.unit}
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  {availableItems
                    .slice(0, 4)
                    .map((item) => {
                      const theme =
                        colorFor(
                          item.key,
                        );

                      return (
                        <div
                          key={`focus-${item.key}`}
                          className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-black/10 px-3 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  theme.main,
                              }}
                            />

                            <span className="truncate text-[10px] font-semibold text-slate-400">
                              {sensitivityShort(
                                item,
                              )}
                            </span>
                          </div>

                          <span
                            className="shrink-0 text-xs font-black"
                            style={{
                              color:
                                theme.main ===
                                "#059669"
                                  ? "#6ee7b7"
                                  : theme.main ===
                                      "#d97706"
                                    ? "#fbbf24"
                                    : theme.main ===
                                        "#dc2626"
                                      ? "#fca5a5"
                                      : "#93c5fd",
                            }}
                          >
                            {formatItemValue(
                              item,
                              currency,
                            )}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </>
            ) : (
              <div className="mt-8">
                <p className="text-sm text-slate-500">
                  No sensitivity data is available yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Driver map */}
        <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                Driver map
              </p>

              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                How the model moves
              </h3>
            </div>

            <p className="max-w-xl text-left text-xs leading-5 text-slate-500 sm:text-right">
              This is a presentation aid built from the existing
              EVC assumptions. It is not a new valuation or risk
              calculation.
            </p>
          </div>

          <div className="mt-7 overflow-x-auto pb-2">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1fr_70px_1fr_70px_1fr] items-center gap-3">
                <DriverNode
                  eyebrow="START"
                  title="Equity grant"
                  text="What was granted and what is vested."
                  color="#059669"
                />

                <DriverConnector />

                <DriverNode
                  eyebrow="OWNERSHIP"
                  title="Dilution + ownership"
                  text="How the stake changes before an exit."
                  color="#7c3aed"
                />

                <DriverConnector />

                <DriverNode
                  eyebrow="OUTCOME"
                  title="Exit + tax + take-home"
                  text="How company outcome flows through the model."
                  color="#2563eb"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {availableItems.map(
              (item) => {
                const theme = colorFor(
                  item.key,
                );

                const Icon = iconFor(
                  item.key,
                );

                return (
                  <div
                    key={`tile-${item.key}`}
                    className="rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      borderColor:
                        theme.border,
                      backgroundColor:
                        theme.soft,
                    }}
                  >
                    <div
                      className="grid h-8 w-8 place-items-center rounded-lg bg-white"
                      style={{
                        color: theme.main,
                      }}
                    >
                      <Icon size={14} />
                    </div>

                    <p
                      className="mt-4 text-[9px] font-black uppercase tracking-[0.11em]"
                      style={{
                        color: theme.text,
                      }}
                    >
                      {sensitivityShort(
                        item,
                      )}
                    </p>

                    <p className="mt-1 text-xs font-black text-slate-950">
                      {formatItemValue(
                        item,
                        currency,
                      )}
                    </p>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DriverNode({
  eyebrow,
  title,
  text,
  color,
}: {
  eyebrow: string;
  title: string;
  text: string;
  color: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: color,
          }}
        />

        <p
          className="text-[9px] font-black uppercase tracking-[0.12em]"
          style={{
            color,
          }}
        >
          {eyebrow}
        </p>
      </div>

      <h4 className="mt-3 text-sm font-black text-slate-950">
        {title}
      </h4>

      <p className="mt-2 text-[10px] leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function DriverConnector() {
  return (
    <div className="flex items-center justify-center text-slate-300">
      <div className="flex items-center">
        <span className="hidden h-px w-8 bg-slate-200 sm:block" />
        <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white shadow-sm">
          <ArrowRight
            size={13}
            className="text-slate-400"
          />
        </span>
        <span className="hidden h-px w-8 bg-slate-200 sm:block" />
      </div>
    </div>
  );
}
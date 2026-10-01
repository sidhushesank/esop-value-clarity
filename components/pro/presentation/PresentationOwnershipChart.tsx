"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import type {
  PresentationOwnershipPoint,
} from "@/lib/esop/presentation";

type PresentationOwnershipChartProps = {
  points: PresentationOwnershipPoint[];
  totalOptions: number;
  vestedPercentage: number;
  currentOwnership: number;
  dilutedOwnership: number;
};

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("en-IN");
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) return "0%";

  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}%`;
}

function formatCompactOptions(value: number) {
  if (!Number.isFinite(value)) return "0";

  if (value >= 10_000_000) {
    return `${(value / 10_000_000).toFixed(
      value >= 100_000_000 ? 0 : 1,
    )}Cr`;
  }

  if (value >= 100_000) {
    return `${(value / 100_000).toFixed(
      value >= 1_000_000 ? 0 : 1,
    )}L`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(
      value >= 10_000 ? 0 : 1,
    )}K`;
  }

  return formatNumber(value);
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.min(100, Math.max(0, value));
}

function getStageWidth(
  point: PresentationOwnershipPoint,
  totalOptions: number,
  vestedPercentage: number,
  currentOwnership: number,
  dilutedOwnership: number,
) {
  switch (point.key) {
    case "granted":
      return 100;

    case "vested":
      return clampPercentage(
        vestedPercentage,
      );

    case "currentOwnership":
      return clampPercentage(
        currentOwnership > 0
          ? 72
          : 0,
      );

    case "dilutedOwnership":
      if (currentOwnership <= 0) return 0;

      return clampPercentage(
        (dilutedOwnership /
          currentOwnership) *
          72,
      );

    default:
      return 0;
  }
}

export default function PresentationOwnershipChart({
  points,
  totalOptions,
  vestedPercentage,
  currentOwnership,
  dilutedOwnership,
}: PresentationOwnershipChartProps) {
  const granted =
    points.find(
      (point) => point.key === "granted",
    ) ?? null;

  const vested =
    points.find(
      (point) => point.key === "vested",
    ) ?? null;

  const current =
    points.find(
      (point) =>
        point.key === "currentOwnership",
    ) ?? null;

  const diluted =
    points.find(
      (point) =>
        point.key === "dilutedOwnership",
    ) ?? null;

  const dilutedLoss =
    Math.max(
      0,
      currentOwnership -
        dilutedOwnership,
    );

  const dilutionRatio =
    currentOwnership > 0
      ? (dilutedOwnership /
          currentOwnership) *
        100
      : 0;

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 md:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
            Ownership journey
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 md:text-3xl">
            From grant to effective ownership
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            See how the original grant moves through vesting and
            future dilution before becoming the ownership position
            used in the outcome model.
          </p>
        </div>

        <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
          <ShieldCheck size={13} />
          Connected to PRO model
        </div>
      </div>

      {/* Main visual */}
      <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="relative">
          {/* Desktop flow line */}
          <div className="pointer-events-none absolute left-[7%] right-[7%] top-[86px] hidden h-px bg-slate-200 lg:block" />

          <div className="grid gap-8 lg:grid-cols-4 lg:gap-5">
            <OwnershipStage
              index="01"
              title="Granted"
              subtitle="Original grant"
              primaryValue={
                granted?.value ??
                totalOptions
              }
              primaryLabel="options"
              secondaryValue={
                `${formatCompactOptions(
                  granted?.value ??
                    totalOptions,
                )}`
              }
              progress={getStageWidth(
                granted ??
                  {
                    key: "granted",
                    label: "Granted",
                    value:
                      totalOptions,
                    displayValue:
                      totalOptions,
                  },
                totalOptions,
                vestedPercentage,
                currentOwnership,
                dilutedOwnership,
              )}
              tone="slate"
            />

            <OwnershipStage
              index="02"
              title="Vested"
              subtitle="Active today"
              primaryValue={
                vested?.value ??
                0
              }
              primaryLabel="options"
              secondaryValue={formatPercentage(
                vestedPercentage,
              )}
              progress={getStageWidth(
                vested ??
                  {
                    key: "vested",
                    label: "Vested",
                    value: 0,
                    displayValue: 0,
                  },
                totalOptions,
                vestedPercentage,
                currentOwnership,
                dilutedOwnership,
              )}
              tone="blue"
            />

            <OwnershipStage
              index="03"
              title="Current stake"
              subtitle="Before future dilution"
              primaryValue={
                current?.value ??
                currentOwnership
              }
              primaryLabel="ownership"
              secondaryValue={formatPercentage(
                currentOwnership,
              )}
              progress={getStageWidth(
                current ??
                  {
                    key: "currentOwnership",
                    label: "Current ownership",
                    value: 0,
                    displayValue: 0,
                  },
                totalOptions,
                vestedPercentage,
                currentOwnership,
                dilutedOwnership,
              )}
              tone="indigo"
              percentage
            />

            <OwnershipStage
              index="04"
              title="After dilution"
              subtitle="Effective modeled stake"
              primaryValue={
                diluted?.value ??
                dilutedOwnership
              }
              primaryLabel="ownership"
              secondaryValue={formatPercentage(
                dilutedOwnership,
              )}
              progress={getStageWidth(
                diluted ??
                  {
                    key: "dilutedOwnership",
                    label: "After dilution",
                    value: 0,
                    displayValue: 0,
                  },
                totalOptions,
                vestedPercentage,
                currentOwnership,
                dilutedOwnership,
              )}
              tone="dark"
              percentage
            />
          </div>
        </div>

        {/* Ownership bridge */}
        <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                What changed
              </p>

              <h3 className="mt-2 text-lg font-black tracking-tight text-slate-950">
                The grant is not the same thing as the final ownership
                position.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Vesting determines what is active today. Future dilution
                then reduces the modeled stake carried into the scenario
                outcomes.
              </p>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3">
              <BridgeStat
                label="Vested"
                value={formatPercentage(
                  vestedPercentage,
                )}
              />

              <BridgeStat
                label="Before dilution"
                value={formatPercentage(
                  currentOwnership,
                )}
              />

              <BridgeStat
                label="After dilution"
                value={formatPercentage(
                  dilutedOwnership,
                )}
              />
            </div>
          </div>
        </div>

        {/* Dilution visual */}
        <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                Dilution impact
              </p>

              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                {formatPercentage(
                  dilutedOwnership,
                )}{" "}
                remains after the modeled dilution
              </h3>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.11em] text-slate-400">
                Ownership reduction
              </p>

              <p className="mt-1 text-lg font-black text-slate-950">
                {formatPercentage(
                  dilutedLoss,
                )}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-slate-950 transition-all duration-700"
                style={{
                  width: `${clampPercentage(
                    dilutionRatio,
                  )}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.1em]">
              <span className="text-blue-600">
                Current stake{" "}
                {formatPercentage(
                  currentOwnership,
                )}
              </span>

              <span className="flex items-center gap-1.5 text-slate-400">
                <ArrowRight size={12} />
                After dilution{" "}
                {formatPercentage(
                  dilutedOwnership,
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OwnershipStage({
  index,
  title,
  subtitle,
  primaryValue,
  primaryLabel,
  secondaryValue,
  progress,
  tone,
  percentage = false,
}: {
  index: string;
  title: string;
  subtitle: string;
  primaryValue: number;
  primaryLabel: string;
  secondaryValue: string;
  progress: number;
  tone:
    | "slate"
    | "blue"
    | "indigo"
    | "dark";
  percentage?: boolean;
}) {
  const toneStyles = {
    slate: {
      ring: "border-slate-200",
      icon: "bg-slate-100 text-slate-600",
      bar: "bg-slate-700",
      value: "text-slate-950",
    },
    blue: {
      ring: "border-blue-100",
      icon: "bg-blue-50 text-blue-600",
      bar: "bg-blue-600",
      value: "text-blue-950",
    },
    indigo: {
      ring: "border-indigo-100",
      icon: "bg-indigo-50 text-indigo-600",
      bar: "bg-indigo-600",
      value: "text-indigo-950",
    },
    dark: {
      ring: "border-slate-800",
      icon: "bg-slate-950 text-blue-300",
      bar: "bg-slate-950",
      value: "text-slate-950",
    },
  }[tone];

  const displayValue =
    percentage
      ? formatPercentage(
          primaryValue,
        )
      : formatCompactOptions(
          primaryValue,
        );

  return (
    <div className="relative">
      <div
        className={`relative rounded-[24px] border ${toneStyles.ring} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`grid h-9 w-9 place-items-center rounded-xl text-[10px] font-black ${toneStyles.icon}`}
          >
            {index}
          </span>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
            {secondaryValue}
          </span>
        </div>

        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
          {subtitle}
        </p>

        <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">
          {title}
        </h3>

        <div className="mt-5">
          <p
            className={`text-3xl font-black tracking-[-0.04em] ${toneStyles.value}`}
          >
            {displayValue}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {primaryLabel}
          </p>
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${toneStyles.bar}`}
            style={{
              width: `${clampPercentage(
                progress,
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Connector */}
      {index !== "04" ? (
        <div className="pointer-events-none absolute right-[-13px] top-[84px] z-10 hidden lg:block">
          <div className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-300 shadow-sm">
            <ArrowRight size={12} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BridgeStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 text-base font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}
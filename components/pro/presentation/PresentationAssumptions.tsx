"use client";

import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  Info,
  Layers3,
  Percent,
  ReceiptIndianRupee,
  ShieldCheck,
} from "lucide-react";

import type { PresentationData } from "@/lib/esop/presentation";

type PresentationAssumptionsProps = {
  data: PresentationData;
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

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Math.round(value).toLocaleString(
    "en-IN",
  );
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}%`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export default function PresentationAssumptions({
  data,
  currency = "INR",
}: PresentationAssumptionsProps) {
  const grant = data.grant;
  const vesting = data.vesting;
  const ownership = data.ownership;
  const valuation = data.valuation;
  const tax = data.tax;
  const context = data.modelContext;

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
              Model context
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 md:text-3xl">
              What is powering this presentation?
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
              The presentation is a visual layer over the confirmed
              PRO model. These are the underlying facts and
              assumptions behind the displayed results.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
            <ShieldCheck size={13} />
            Model context visible
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8">
        {/* Grant / position */}
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                  Grant position
                </p>

                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                  The starting point of the model
                </h3>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <Layers3 size={19} />
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <ContextValue
                icon={
                  <FileCheck2 size={15} />
                }
                label="Total granted"
                value={`${formatNumber(
                  grant.totalOptions,
                )} options`}
              />

              <ContextValue
                icon={
                  <Layers3 size={15} />
                }
                label="Modeled options"
                value={`${formatNumber(
                  grant.modeledOptions,
                )} options`}
              />

              <ContextValue
                icon={
                  <CircleDollarSign size={15} />
                }
                label="Exercise price"
                value={formatCurrency(
                  grant.exercisePrice,
                  currency,
                )}
              />

              <ContextValue
                icon={
                  <CircleDollarSign size={15} />
                }
                label="Exercise capital"
                value={formatCurrency(
                  grant.exerciseCost,
                  currency,
                )}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Info size={14} />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-600">
                    Analysis basis
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-950">
                    {data.metadata.analysisBasis ===
                    "FULL_GRANT"
                      ? "Full grant"
                      : "Currently vested"}
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    {data.metadata.analysisBasis ===
                    "FULL_GRANT"
                      ? "The presentation models the complete confirmed grant."
                      : "The presentation models only the options vested today."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vesting / ownership */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                  Ownership context
                </p>

                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                  What the grant represents
                </h3>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Percent size={18} />
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <ContextProgress
                label="Vested today"
                value={vesting.vestedPercentage}
                displayValue={formatPercentage(
                  vesting.vestedPercentage,
                )}
                color="#2563eb"
              />

              <ContextProgress
                label="Current ownership"
                value={ownership.currentOwnership}
                displayValue={formatPercentage(
                  ownership.currentOwnership,
                )}
                color="#7c3aed"
                ownership
              />

              <ContextProgress
                label="After modeled dilution"
                value={ownership.dilutedOwnership}
                displayValue={formatPercentage(
                  ownership.dilutedOwnership,
                )}
                color="#0f172a"
                ownership
              />
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <SmallContextValue
                label="Vested"
                value={`${formatNumber(
                  vesting.vestedOptions,
                )}`}
              />

              <SmallContextValue
                label="Unvested"
                value={`${formatNumber(
                  vesting.unvestedOptions,
                )}`}
              />

              <SmallContextValue
                label="Company shares"
                value={formatNumber(
                  ownership.totalCompanyShares,
                )}
              />

              <SmallContextValue
                label="Future dilution"
                value={formatPercentage(
                  ownership.futureDilution,
                )}
              />
            </div>
          </div>
        </div>

        {/* Valuation / tax */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ContextPanel
            eyebrow="VALUATION"
            title="Company value assumptions"
            icon={
              <CircleDollarSign size={17} />
            }
            iconClass="bg-blue-50 text-blue-600"
          >
            <ContextRow
              label="Current company valuation"
              value={formatCurrency(
                valuation.currentCompanyValuation,
                currency,
              )}
            />

            <ContextRow
              label="Current modeled equity value"
              value={formatCurrency(
                valuation.currentModeledEquityValue,
                currency,
              )}
            />

            <ContextRow
              label="Base exit valuation"
              value={formatCurrency(
                valuation.baseExitValuation,
                currency,
              )}
            />

            <ContextRow
              label="Base scenario"
              value="1.0×"
              helper="Bear = 0.5× · Bull = 2.0×"
            />
          </ContextPanel>

          <ContextPanel
            eyebrow="TAX"
            title="Tax model context"
            icon={
              <ReceiptIndianRupee size={17} />
            }
            iconClass="bg-amber-50 text-amber-600"
          >
            <ContextRow
              label="Exercise FMV"
              value={formatCurrency(
                tax.exerciseFMV,
                currency,
              )}
            />

            <ContextRow
              label="Other annual income"
              value={formatCurrency(
                tax.otherAnnualIncome,
                currency,
              )}
            />

            <ContextRow
              label="Holding period"
              value={`${formatNumber(
                tax.holdingPeriodMonths,
              )} months`}
            />

            <ContextRow
              label="Tax regime"
              value={
                tax.taxRegime ===
                "NEW"
                  ? "New"
                  : "Old"
              }
            />

            <ContextRow
              label="Equity type"
              value={
                tax.equityType ===
                "UNLISTED"
                  ? "Unlisted"
                  : "Listed"
              }
            />
          </ContextPanel>
        </div>

        {/* Vesting / grant dates */}
        <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                Grant timeline
              </p>

              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                Important source dates
              </h3>
            </div>

            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-600">
              <CalendarDays size={18} />
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TimelineValue
              label="Vesting start"
              value={formatDate(
                context.vestingStartDate,
              )}
            />

            <TimelineValue
              label="Expiry"
              value={formatDate(
                context.expiryDate,
              )}
            />

            <TimelineValue
              label="Post-termination exercise"
              value={
                context.postTerminationExerciseDays !=
                null
                  ? `${formatNumber(
                      context.postTerminationExerciseDays,
                    )} days`
                  : "Not available"
              }
            />

            <TimelineValue
              label="Grant source"
              value={
                context.sourceGrantId
                  ? "Confirmed"
                  : "Not connected"
              }
            />
          </div>
        </div>

        {/* Methodology note */}
        <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white md:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-blue-300">
                <ShieldCheck size={18} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                  Presentation methodology
                </p>

                <h3 className="mt-2 text-xl font-black tracking-tight">
                  Same model. Different view.
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Presentation Mode does not create a separate equity
                  calculation. It visualizes the connected PRO model
                  so the underlying assumptions and their consequences
                  can be discussed clearly.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                Source-connected
              </span>
            </div>
          </div>
        </div>

        {/* Compact disclosure */}
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-amber-600">
            <Info size={14} />
          </div>

          <div>
            <p className="text-xs font-black text-amber-950">
              Modeled outcomes are not guaranteed payouts.
            </p>

            <p className="mt-1 text-[11px] leading-5 text-amber-900/75">
              Actual results can differ because of company terms,
              liquidity, taxes, financing, additional dilution,
              transaction structure and other factors outside the
              current model.
            </p>
          </div>

          <button
            type="button"
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-black text-amber-800 transition hover:bg-white"
          >
            Model context
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}

function ContextValue({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </span>

        <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-3 text-base font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ContextProgress({
  label,
  value,
  displayValue,
  color,
  ownership = false,
}: {
  label: string;
  value: number;
  displayValue: string;
  color: string;
  ownership?: boolean;
}) {
  const normalized = Math.min(
    100,
    Math.max(
      0,
      ownership
        ? Math.min(
            100,
            value * 100,
          )
        : value,
    ),
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-slate-700">
          {label}
        </p>

        <p
          className="text-sm font-black"
          style={{
            color,
          }}
        >
          {displayValue}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${normalized}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function SmallContextValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ContextPanel({
  eyebrow,
  title,
  icon,
  iconClass,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
            {eyebrow}
          </p>

          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
            {title}
          </h3>
        </div>

        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-7 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

function ContextRow({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        {helper ? (
          <p className="mt-1 text-[9px] text-slate-400">
            {helper}
          </p>
        ) : null}
      </div>

      <p className="text-sm font-black text-slate-950 sm:text-right">
        {value}
      </p>
    </div>
  );
}

function TimelineValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}
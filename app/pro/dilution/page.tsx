"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowUpRight,
  CircleHelp,
  Percent,
  PieChart,
  Sparkles,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  calculateDilution,
  type DilutionInput,
} from "@/lib/esop/dilution";

import {
  useProEquityState,
} from "@/lib/esop/pro-state";

/* ============================================================
   DILUTION-SPECIFIC DEFAULTS

   These assumptions belong specifically to the funding round.
   Core equity values come from shared PRO state.
============================================================ */

const DEFAULT_DILUTION_ASSUMPTIONS = {
  preMoneyValuation: 100_000_000,
  newInvestment: 25_000_000,
  currentOptionPoolPercent: 10,
  targetOptionPoolPercent: 15,
};

/* ============================================================
   PAGE
============================================================ */

export default function ProDilutionPage() {
  const {
    proState,
    updateProState,
    resetProState,
    hydrated,
  } = useProEquityState();

  /*
   * Funding-round assumptions remain local to this page.
   *
   * Core equity assumptions are shared through proState.
   */

  const [
    fundingAssumptions,
    setFundingAssumptions,
  ] = useState(
    DEFAULT_DILUTION_ASSUMPTIONS
  );

  /* ==========================================================
     CONNECTED DILUTION INPUTS
  ========================================================== */

  const inputs: DilutionInput = useMemo(
    () => ({
      /*
       * Shared from Vesting / PRO state
       */
      sharesOwned:
        proState.vestedOptions,

      fullyDilutedShares:
        proState.totalCompanyShares,

      /*
       * Funding-round-specific
       */
      preMoneyValuation:
        fundingAssumptions.preMoneyValuation,

      newInvestment:
        fundingAssumptions.newInvestment,

      currentOptionPoolPercent:
        fundingAssumptions.currentOptionPoolPercent,

      targetOptionPoolPercent:
        fundingAssumptions.targetOptionPoolPercent,
    }),
    [
      proState.vestedOptions,
      proState.totalCompanyShares,
      fundingAssumptions,
    ]
  );

  /* ==========================================================
     CALCULATION
  ========================================================== */

  const result = useMemo(
    () => calculateDilution(inputs),
    [inputs]
  );

  /* ==========================================================
     SYNC RESULT BACK TO SHARED PRO STATE
  ========================================================== */

  /*
   * We intentionally only write the calculated ownership result
   * when the page is hydrated.
   *
   * This keeps the shared state aligned with the current model.
   */

  useMemo(() => {
    if (!hydrated) {
      return;
    }

    /*
     * Avoid unnecessary writes if the value is already identical.
     */
    if (
      proState.dilutedOwnershipPercentage !==
      result.dilutedOwnershipPercent
    ) {
      updateProState({
        dilutedOwnershipPercentage:
          result.dilutedOwnershipPercent,
      });
    }
  }, [
    hydrated,
    result.dilutedOwnershipPercent,
    proState.dilutedOwnershipPercentage,
    updateProState,
  ]);

  /* ==========================================================
     INPUT UPDATE
  ========================================================== */

  function updateInput(
    field: keyof DilutionInput,
    value: string | number
  ) {
    const numericValue =
      typeof value === "number"
        ? value
        : Number(value) || 0;

    /*
     * Core equity fields belong to shared PRO state.
     */
    if (
      field === "sharesOwned"
    ) {
      updateProState({
        vestedOptions: numericValue,
      });

      return;
    }

    if (
      field === "fullyDilutedShares"
    ) {
      updateProState({
        totalCompanyShares:
          numericValue,
      });

      return;
    }

    /*
     * Funding assumptions stay local to Dilution.
     */
    setFundingAssumptions(
      (previous) => ({
        ...previous,
        [field]: numericValue,
      })
    );
  }

  /* ==========================================================
     RESET
  ========================================================== */

  function reset() {
    /*
     * Reset the shared PRO equity state.
     */
    resetProState();

    /*
     * Reset dilution-specific assumptions.
     */
    setFundingAssumptions(
      DEFAULT_DILUTION_ASSUMPTIONS
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 md:py-10">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/pro"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to PRO Workspace
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
            <Sparkles size={13} />
            PRO Dilution Simulator
          </div>
        </div>

        {/* ======================================================
            TITLE
        ====================================================== */}

        <section className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
              <PieChart size={22} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Funding rounds & ownership
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 md:text-4xl lg:text-5xl">
                How much could future funding dilute you?
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Model a future funding round, investor ownership and
                option-pool expansion to understand how your ESOP
                ownership could change before an exit.
              </p>
            </div>
          </div>
        </section>

        {/* ======================================================
            CONNECTED STATE INDICATOR
        ====================================================== */}

        {hydrated && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connected to your PRO equity model
          </div>
        )}

        {/* ======================================================
            SNAPSHOT
        ====================================================== */}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <Snapshot
            label="Current ownership"
            value={formatPercentage(
              result.currentOwnershipPercent
            )}
            description="Your ownership before the round"
            icon={<Percent size={18} />}
          />

          <Snapshot
            label="Diluted ownership"
            value={formatPercentage(
              result.dilutedOwnershipPercent
            )}
            description="Your modeled post-round ownership"
            icon={<TrendingDown size={18} />}
            highlight
          />

          <Snapshot
            label="Ownership reduction"
            value={formatPercentage(
              result.ownershipReductionPercent
            )}
            description="Modeled dilution impact"
            icon={<TrendingDown size={18} />}
          />

          <Snapshot
            label="Post-round stake"
            value={formatCurrency(
              result.postRoundStakeValue
            )}
            description="Modeled value after funding"
            icon={<Wallet size={18} />}
          />

        </section>

        {/* ======================================================
            WORKSPACE
        ====================================================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-[410px_minmax(0,1fr)]">

          {/* ====================================================
              INPUTS
          ==================================================== */}

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-950">
                    Dilution assumptions
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    Model the next funding round using your current
                    cap-table assumptions.
                  </p>
                </div>

                <CircleHelp
                  size={18}
                  className="text-slate-400"
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-5">

              {/* ==================================================
                  SHARED — VESTED OPTIONS
              ================================================== */}

              <div>
                <Label className="text-sm font-semibold text-slate-900">
                  Your shares
                </Label>

                <p className="mt-1 text-xs text-slate-500">
                  Currently vested options from your PRO equity model
                </p>

                <div className="relative mt-2">
                  <Input
                    type="number"
                    min={0}
                    value={inputs.sharesOwned}
                    onChange={(event) =>
                      updateInput(
                        "sharesOwned",
                        event.target.value
                      )
                    }
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium"
                  />
                </div>

                <p className="mt-1.5 text-[10px] font-medium text-blue-600">
                  Connected to Vesting
                </p>
              </div>

              {/* ==================================================
                  SHARED — COMPANY SHARES
              ================================================== */}

              <div>
                <Label className="text-sm font-semibold text-slate-900">
                  Fully diluted shares
                </Label>

                <p className="mt-1 text-xs text-slate-500">
                  Total company shares including the existing option pool
                </p>

                <div className="relative mt-2">
                  <Input
                    type="number"
                    min={0}
                    value={inputs.fullyDilutedShares}
                    onChange={(event) =>
                      updateInput(
                        "fullyDilutedShares",
                        event.target.value
                      )
                    }
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium"
                  />
                </div>

                <p className="mt-1.5 text-[10px] font-medium text-blue-600">
                  Connected to company assumptions
                </p>
              </div>

              {/* ==================================================
                  FUNDING-SPECIFIC
              ================================================== */}

              <Field
                label="Pre-money valuation"
                description="Company valuation immediately before the round"
                value={inputs.preMoneyValuation}
                prefix="₹"
                onChange={(value) =>
                  updateInput(
                    "preMoneyValuation",
                    value
                  )
                }
              />

              <Field
                label="New investment"
                description="Capital being raised in the funding round"
                value={inputs.newInvestment}
                prefix="₹"
                onChange={(value) =>
                  updateInput(
                    "newInvestment",
                    value
                  )
                }
              />

              <Field
                label="Current option pool"
                description="Existing employee option pool"
                value={inputs.currentOptionPoolPercent}
                suffix="%"
                onChange={(value) =>
                  updateInput(
                    "currentOptionPoolPercent",
                    value
                  )
                }
              />

              <Field
                label="Target option pool"
                description="Option pool after the funding round"
                value={inputs.targetOptionPoolPercent}
                suffix="%"
                onChange={(value) =>
                  updateInput(
                    "targetOptionPoolPercent",
                    value
                  )
                }
              />

              {/* ==================================================
                  FUTURE DILUTION — SHARED
              ================================================== */}

              <div>
                <Label className="text-sm font-semibold text-slate-900">
                  Expected future dilution
                </Label>

                <p className="mt-1 text-xs text-slate-500">
                  Dilution assumption carried across your PRO equity model
                </p>

                <div className="relative mt-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={
                      proState.futureDilutionPercentage
                    }
                    onChange={(event) =>
                      updateProState({
                        futureDilutionPercentage:
                          Number(
                            event.target.value
                          ) || 0,
                      })
                    }
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 pr-10 text-sm font-medium"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    %
                  </span>
                </div>

                <p className="mt-1.5 text-[10px] font-medium text-blue-600">
                  Connected to Simulator
                </p>
              </div>

              {/* RESET */}

              <button
                type="button"
                onClick={reset}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Reset PRO equity assumptions
              </button>

              {/* NOTICE */}

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                  Connected model
                </p>

                <p className="mt-1.5 text-xs leading-5 text-blue-900/80">
                  Your vested options, company share count and future
                  dilution assumption are shared across the PRO equity
                  tools. Funding-round assumptions remain specific to
                  this dilution model.
                </p>
              </div>

            </CardContent>
          </Card>

          {/* ====================================================
              ANALYSIS
          ==================================================== */}

          <div className="space-y-6">

            {/* ==================================================
                OWNERSHIP CARD
            ================================================== */}

            <Card className="overflow-hidden border-slate-950 bg-slate-950 text-white shadow-sm">
              <CardContent className="p-7 md:p-9">

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Ownership after funding
                </p>

                <h2 className="mt-3 break-words text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                  {formatPercentage(
                    result.dilutedOwnershipPercent
                  )}
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                  Your modeled ownership after the new investment and
                  option-pool adjustment.
                </p>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="grid gap-5 sm:grid-cols-3">

                    <DarkMetric
                      label="Before"
                      value={formatPercentage(
                        result.currentOwnershipPercent
                      )}
                    />

                    <DarkMetric
                      label="After"
                      value={formatPercentage(
                        result.dilutedOwnershipPercent
                      )}
                    />

                    <DarkMetric
                      label="Reduction"
                      value={`-${formatPercentage(
                        result.ownershipReductionPercent
                      )}`}
                    />

                  </div>
                </div>

              </CardContent>
            </Card>

            {/* ==================================================
                INSIGHT
            ================================================== */}

            <DilutionInsight result={result} />

            {/* ==================================================
                FUNDING ROUND
            ================================================== */}

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Funding round
                </p>

                <CardTitle className="mt-1 text-xl font-bold text-slate-950">
                  Where the dilution comes from
                </CardTitle>

                <p className="mt-1 text-sm text-slate-500">
                  Separate the effect of the new investor from the
                  effect of expanding the employee option pool.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">

                  <Breakdown
                    title="Funding"
                    items={[
                      [
                        "Pre-money valuation",
                        formatCurrency(
                          inputs.preMoneyValuation
                        ),
                      ],
                      [
                        "New investment",
                        formatCurrency(
                          inputs.newInvestment
                        ),
                      ],
                      [
                        "Post-money valuation",
                        formatCurrency(
                          result.postMoneyValuation
                        ),
                      ],
                      [
                        "New investor ownership",
                        formatPercentage(
                          result.newInvestorOwnershipPercent
                        ),
                      ],
                    ]}
                  />

                  <Breakdown
                    title="Option pool"
                    items={[
                      [
                        "Current pool",
                        formatPercentage(
                          result.currentOptionPoolPercent
                        ),
                      ],
                      [
                        "Target pool",
                        formatPercentage(
                          result.targetOptionPoolPercent
                        ),
                      ],
                      [
                        "New pool shares",
                        formatNumber(
                          result.newOptionPoolShares
                        ),
                      ],
                      [
                        "Pool increase",
                        formatPercentage(
                          result.optionPoolIncreasePercent
                        ),
                      ],
                    ]}
                  />

                </div>
              </CardContent>
            </Card>

            {/* ==================================================
                VALUE JOURNEY
            ================================================== */}

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Ownership journey
                </p>

                <CardTitle className="mt-1 text-xl font-bold text-slate-950">
                  From current stake to post-round stake
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid gap-3 md:grid-cols-4">

                  <Journey
                    number="01"
                    title="Current stake"
                    value={formatCurrency(
                      result.currentStakeValue
                    )}
                    description="Pre-money modeled value"
                  />

                  <Journey
                    number="02"
                    title="Investor"
                    value={formatPercentage(
                      result.newInvestorOwnershipPercent
                    )}
                    description="New ownership"
                  />

                  <Journey
                    number="03"
                    title="Dilution"
                    value={`-${formatPercentage(
                      result.ownershipReductionPercent
                    )}`}
                    description="Ownership reduction"
                  />

                  <Journey
                    number="04"
                    title="Post-round"
                    value={formatCurrency(
                      result.postRoundStakeValue
                    )}
                    description="Modeled stake value"
                    highlight
                  />

                </div>
              </CardContent>
            </Card>

            {/* ==================================================
                SHARE COUNT
            ================================================== */}

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-950">
                  Cap-table impact
                </CardTitle>

                <p className="mt-1 text-sm text-slate-500">
                  See how the modeled share count changes through the
                  funding round.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">

                  <MetricCard
                    label="Existing shares"
                    value={formatNumber(
                      result.fullyDilutedShares
                    )}
                  />

                  <MetricCard
                    label="New investor shares"
                    value={formatNumber(
                      result.newSharesIssued
                    )}
                  />

                  <MetricCard
                    label="Post-round shares"
                    value={formatNumber(
                      result.postMoneyShares
                    )}
                  />

                </div>
              </CardContent>
            </Card>

            {/* ==================================================
                SHARED MODEL STATUS
            ================================================== */}

            <Card className="border-blue-100 bg-blue-50/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                    <PieChart size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      Your connected equity picture
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {formatNumber(
                        proState.vestedOptions
                      )}{" "}
                      vested options currently represent{" "}
                      {formatPercentage(
                        result.currentOwnershipPercent
                      )}{" "}
                      ownership before this modeled funding round.
                      After the round, that becomes{" "}
                      {formatPercentage(
                        result.dilutedOwnershipPercent
                      )}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ==================================================
                ASSUMPTIONS
            ================================================== */}

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-950">
                  What this simulator assumes
                </CardTitle>
              </CardHeader>

              <CardContent>
                <ul className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
                  {result.assumptions.map(
                    (assumption) => (
                      <li
                        key={assumption}
                        className="flex gap-3"
                      >
                        <span className="mt-1 text-blue-600">
                          •
                        </span>

                        <span>
                          {assumption}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* ======================================================
            NEXT STEP
        ====================================================== */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="flex flex-col justify-between gap-6 p-7 md:p-9 lg:flex-row lg:items-center">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Next layer
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Dilution is only part of your equity outcome.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Combine ownership changes with your modeled exit
                valuation to understand what your ESOP could ultimately
                be worth.
              </p>
            </div>

            <Link
              href="/pro/simulator"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Open Advanced Simulator
              <ArrowUpRight size={16} />
            </Link>

          </div>
        </section>

      </div>
    </main>
  );
}

/* ============================================================
   SNAPSHOT
============================================================ */

function Snapshot({
  label,
  value,
  description,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          highlight
            ? "bg-white/10 text-blue-300"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-4 text-xs font-bold uppercase tracking-[0.12em] ${
          highlight
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 break-words text-2xl font-black tracking-tight ${
          highlight
            ? "text-white"
            : "text-slate-950"
        }`}
      >
        {value}
      </p>

      <p
        className="mt-1 text-xs"
        style={{
          color: highlight
            ? "#94A3B8"
            : "#64748B",
        }}
      >
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   FIELD
============================================================ */

function Field({
  label,
  description,
  value,
  prefix,
  suffix,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-semibold text-slate-900">
        {label}
      </Label>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

      <div className="relative mt-2">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm font-semibold text-slate-400">
            {prefix}
          </span>
        )}

        <Input
          type="number"
          min={0}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium ${
            prefix ? "pl-8" : ""
          } ${suffix ? "pr-16" : ""}`}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-xs font-semibold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DARK METRIC
============================================================ */

function DarkMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-bold text-slate-200">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   BREAKDOWN
============================================================ */

function Breakdown({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-950">
        {title}
      </p>

      <div className="mt-4 space-y-3">
        {items.map(
          ([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 last:border-0 last:pb-0"
            >
              <span className="text-xs text-slate-500">
                {label}
              </span>

              <span className="text-sm font-bold text-slate-900">
                {value}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   JOURNEY
============================================================ */

function Journey({
  number,
  title,
  value,
  description,
  highlight = false,
}: {
  number: string;
  title: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <span
        className={`text-[10px] font-black ${
          highlight
            ? "text-blue-300"
            : "text-blue-600"
        }`}
      >
        {number}
      </span>

      <p
        className={`mt-3 text-xs font-bold uppercase tracking-[0.1em] ${
          highlight
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        {title}
      </p>

      <p
        className={`mt-2 break-words text-xl font-black ${
          highlight
            ? "text-white"
            : "text-slate-950"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   INSIGHT
============================================================ */

function DilutionInsight({
  result,
}: {
  result: ReturnType<
    typeof calculateDilution
  >;
}) {
  if (result.status === "minimal") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <p className="font-bold text-emerald-900">
              Limited modeled dilution
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color: "#166534",
              }}
            >
              Your modeled ownership reduction is relatively small
              under the assumptions entered.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === "moderate") {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <TrendingDown
            size={20}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <p className="font-bold text-blue-900">
              Moderate modeled dilution
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-900">
              The funding round reduces your ownership, but the
              post-money valuation may still increase the modeled value
              of your stake.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === "significant") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-amber-700"
          />

          <div>
            <p
              className="font-bold"
              style={{
                color: "#451a03",
              }}
            >
              Significant modeled dilution
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color: "#451a03",
              }}
            >
              A meaningful portion of your ownership could be diluted
              under these assumptions. Review the funding and option-pool
              inputs carefully.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={20}
          className="mt-0.5 shrink-0 text-red-600"
        />

        <div>
          <p className="font-bold text-red-900">
            High modeled dilution
          </p>

          <p className="mt-1 text-sm leading-6 text-red-900/80">
            Your modeled ownership reduction is substantial. This does
            not automatically mean your equity becomes less valuable,
            because the company's valuation also changes.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FORMATTERS
============================================================ */

function formatCurrency(
  value: number
) {
  if (!Number.isFinite(value)) {
    return "₹0";
  }

  return `₹${Math.round(
    value
  ).toLocaleString("en-IN")}`;
}

function formatPercentage(
  value: number
) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}%`;
}

function formatNumber(
  value: number
) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Math.round(
    value
  ).toLocaleString("en-IN");
}
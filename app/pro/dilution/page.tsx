"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  CheckCircle2,
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
  normalizeProNumber,
  useProEquityState,
} from "@/lib/esop/pro-state";

/* ============================================================
   DILUTION-SPECIFIC DEFAULTS

   These assumptions belong specifically to the funding round.
   Confirmed grant facts come from the Equity Profile.
============================================================ */

const DEFAULT_DILUTION_ASSUMPTIONS = {
  preMoneyValuation: 100_000_000,
  newInvestment: 25_000_000,
  currentOptionPoolPercent: 10,
  targetOptionPoolPercent: 15,
};

type AnalysisBasis =
  | "FULL_GRANT"
  | "CURRENTLY_VESTED";

/* ============================================================
   PAGE
============================================================ */

export default function ProDilutionPage() {
  const {
    proState,
    updateProState,
    hydrated,
  } = useProEquityState();

  const [
    analysisBasis,
    setAnalysisBasis,
  ] = useState<AnalysisBasis>(
    "FULL_GRANT"
  );

  const [
    fundingAssumptions,
    setFundingAssumptions,
  ] = useState(
    DEFAULT_DILUTION_ASSUMPTIONS
  );

  /* ==========================================================
     CONFIRMED GRANT / SOURCE-OF-TRUTH BASIS
  ========================================================== */

  const confirmedGrantConnected =
    Boolean(
      proState.sourceGrantId
    );

  const fullGrantOptions =
    Math.max(
      0,
      normalizeProNumber(
        proState.totalOptions
      )
    );

  const currentlyVestedOptions =
    Math.max(
      0,
      normalizeProNumber(
        proState.vestedOptions
      )
    );

  const modeledSharesOwned =
    analysisBasis ===
    "FULL_GRANT"
      ? fullGrantOptions
      : currentlyVestedOptions;

  /* ==========================================================
     CONNECTED DILUTION INPUTS
  ========================================================== */

  const inputs: DilutionInput =
    useMemo(
      () => ({
        /*
         * Source grant position.
         */
        sharesOwned:
          modeledSharesOwned,

        /*
         * Analysis assumption shared across PRO.
         */
        fullyDilutedShares:
          Math.max(
            0,
            normalizeProNumber(
              proState.totalCompanyShares
            )
          ),

        /*
         * Funding-round assumptions.
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
        modeledSharesOwned,
        proState.totalCompanyShares,
        fundingAssumptions,
      ]
    );

  /* ==========================================================
     CALCULATION
  ========================================================== */

  const result = useMemo(
    () =>
      calculateDilution(
        inputs
      ),
    [inputs]
  );

  /* ==========================================================
     SYNC RESULT BACK TO SHARED PRO STATE

     Dilution owns the calculated future-dilution output.
     Simulator / Exit / Reports can consume this percentage.
  ========================================================== */

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const nextDilutedOwnership =
      Number.isFinite(
        result.dilutedOwnershipPercent
      )
        ? result.dilutedOwnershipPercent
        : 0;

    const nextFutureDilution =
      clamp(
        result.relativeOwnershipReductionPercent,
        0,
        100
      );

    const dilutedChanged =
      Math.abs(
        normalizeProNumber(
          proState.dilutedOwnershipPercentage
        ) -
          nextDilutedOwnership
      ) > 0.000001;

    const futureDilutionChanged =
      Math.abs(
        normalizeProNumber(
          proState.futureDilutionPercentage
        ) -
          nextFutureDilution
      ) > 0.000001;

    if (
      !dilutedChanged &&
      !futureDilutionChanged
    ) {
      return;
    }

    updateProState({
      dilutedOwnershipPercentage:
        nextDilutedOwnership,

      futureDilutionPercentage:
        nextFutureDilution,
    });
  }, [
    hydrated,
    result.dilutedOwnershipPercent,
    result.ownershipReductionPercent,
    result.relativeOwnershipReductionPercent,
    proState.dilutedOwnershipPercentage,
    proState.futureDilutionPercentage,
    updateProState,
  ]);

  /* ==========================================================
     INPUT UPDATE
  ========================================================== */

  function updateInput(
    field:
      keyof DilutionInput,
    value:
      string | number
  ) {
    const numericValue =
      typeof value === "number"
        ? value
        : Number(value) || 0;

    /*
     * Fully diluted shares are a shared analysis assumption.
     */
    if (
      field ===
      "fullyDilutedShares"
    ) {
      updateProState({
        totalCompanyShares:
          numericValue,
      });

      return;
    }

    /*
     * Grant-owned shares are controlled by the analysis-basis
     * selector and are never written back to the confirmed grant.
     */
    if (
      field ===
      "sharesOwned"
    ) {
      return;
    }

    setFundingAssumptions(
      (previous) => ({
        ...previous,
        [field]:
          numericValue,
      })
    );
  }

  /* ==========================================================
     RESET

     Reset funding / analysis assumptions only.
     Never reset the confirmed grant or its source metadata.
  ========================================================== */

  function reset() {
    setFundingAssumptions(
      DEFAULT_DILUTION_ASSUMPTIONS
    );

    setAnalysisBasis(
      "FULL_GRANT"
    );

    updateProState({
      totalCompanyShares:
        1_000_000,

      dilutedOwnershipPercentage:
        0,

      futureDilutionPercentage:
        0,
    });
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
            Loading your PRO equity model...
          </div>
        </div>
      </main>
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
            CONFIRMED GRANT CONNECTION
        ====================================================== */}

        {confirmedGrantConnected ? (
          <section className="mt-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-600 shadow-sm">
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                    Using confirmed grant
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-950">
                    {proState.sourceCompanyName ||
                      "Confirmed ESOP grant"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {formatNumber(
                      fullGrantOptions
                    )}{" "}
                    confirmed options ·{" "}
                    {formatNumber(
                      currentlyVestedOptions
                    )}{" "}
                    vested today
                  </p>
                </div>
              </div>

              {proState.sourceDocumentId && (
                <Link
                  href={`/pro/grants/${proState.sourceDocumentId}/review`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100"
                >
                  View source grant
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-900">
                Manual analysis mode
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-900/80">
                No confirmed grant is currently connected. You can still use
                the dilution model with the shared PRO assumptions.
              </p>
            </div>
          </section>
        )}

        {/* ======================================================
            ANALYSIS BASIS
        ====================================================== */}

        <section className="mt-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                  Analysis basis
                </p>

                <h2 className="mt-1 text-sm font-black text-slate-950">
                  Choose which option position should be diluted.
                </h2>

                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                  Full Grant models the potential ownership impact if all
                  confirmed options eventually vest. Currently Vested models
                  only what you have earned today.
                </p>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:min-w-[430px]">
                <button
                  type="button"
                  onClick={() =>
                    setAnalysisBasis(
                      "FULL_GRANT"
                    )
                  }
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    analysisBasis ===
                    "FULL_GRANT"
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-950">
                      Full grant
                    </span>

                    {analysisBasis ===
                      "FULL_GRANT" && (
                      <span className="rounded-full bg-blue-600 px-2 py-1 text-[9px] font-black text-white">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Model all{" "}
                    {formatNumber(
                      fullGrantOptions
                    )}{" "}
                    options.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAnalysisBasis(
                      "CURRENTLY_VESTED"
                    )
                  }
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    analysisBasis ===
                    "CURRENTLY_VESTED"
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-950">
                      Currently vested
                    </span>

                    {analysisBasis ===
                      "CURRENTLY_VESTED" && (
                      <span className="rounded-full bg-blue-600 px-2 py-1 text-[9px] font-black text-white">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Model only{" "}
                    {formatNumber(
                      currentlyVestedOptions
                    )}{" "}
                    options earned today.
                  </p>
                </button>
              </div>
            </div>

            {analysisBasis ===
              "FULL_GRANT" &&
              currentlyVestedOptions <
                fullGrantOptions && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[10px] font-bold leading-5 text-amber-900">
                    This is a potential future-ownership scenario. Only{" "}
                    {formatNumber(
                      currentlyVestedOptions
                    )}{" "}
                    options are vested today; the model uses the full{" "}
                    {formatNumber(
                      fullGrantOptions
                    )}{" "}
                    confirmed options to show how a future round could affect
                    your eventual stake.
                  </p>
                </div>
              )}
          </div>
        </section>

        {/* ======================================================
            SHARED DILUTION OUTPUT
        ====================================================== */}

        <section className="mt-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
                Connected dilution output
              </p>

              <p className="mt-1 text-sm font-black text-blue-950">
                {formatPercentage(
                  result.relativeOwnershipReductionPercent
                )}{" "}
                relative dilution
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-900/80">
                This proportional dilution is shared with Simulator,
                Exit and other connected PRO analysis. Ownership-point change
                is shown separately below.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                Shared PRO dilution
              </p>

              <p className="mt-1 text-2xl font-black text-slate-950">
                {formatPercentage(
                  proState.futureDilutionPercentage
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ======================================================
            SNAPSHOT
        ====================================================== */}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <Snapshot
            label={
              analysisBasis ===
              "FULL_GRANT"
                ? "Potential ownership"
                : "Current ownership"
            }
            value={formatPercentage(
              result.currentOwnershipPercent
            )}
            description={
              analysisBasis ===
              "FULL_GRANT"
                ? "Ownership if the modeled grant fully vests"
                : "Your ownership before the round"
            }
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
            label="Relative dilution"
            value={formatPercentage(
              result.relativeOwnershipReductionPercent
            )}
            description="Proportional reduction in your original ownership"
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
                  SOURCE POSITION
              ================================================== */}

              <div>
                <Label className="text-sm font-semibold text-slate-900">
                  Options modeled
                </Label>

                <p className="mt-1 text-xs text-slate-500">
                  Controlled by the Full Grant / Currently Vested selector
                </p>

                <div className="relative mt-2">
                  <Input
                    type="number"
                    min={0}
                    value={
                      inputs.sharesOwned
                    }
                    readOnly
                    className="h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100 text-sm font-medium text-slate-700"
                  />
                </div>

                <p className="mt-1.5 text-[10px] font-medium text-emerald-700">
                  {confirmedGrantConnected
                    ? "Connected to confirmed Equity Profile"
                    : "Connected to shared PRO state"}
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
                    value={
                      inputs.fullyDilutedShares
                    }
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
                  Shared company assumption
                </p>
              </div>

              {/* ==================================================
                  FUNDING-SPECIFIC
              ================================================== */}

              <Field
                label="Pre-money valuation"
                description="Company valuation immediately before the round"
                value={
                  inputs.preMoneyValuation
                }
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
                value={
                  inputs.newInvestment
                }
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
                value={
                  inputs.currentOptionPoolPercent
                }
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
                value={
                  inputs.targetOptionPoolPercent
                }
                suffix="%"
                onChange={(value) =>
                  updateInput(
                    "targetOptionPoolPercent",
                    value
                  )
                }
              />

              {/* RESET */}

              <button
                type="button"
                onClick={
                  reset
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Reset analysis assumptions
              </button>

              {/* NOTICE */}

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                  Connected model
                </p>

                <p className="mt-1.5 text-xs leading-5 text-blue-900/80">
                  Confirmed grant facts stay protected in your Equity Profile.
                  Company share count and funding-round assumptions are analysis
                  inputs. The calculated ownership reduction is shared with the
                  rest of your PRO model.
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
                  {analysisBasis ===
                  "FULL_GRANT"
                    ? "Potential ownership after the modeled funding round if the full confirmed grant eventually vests."
                    : "Your modeled ownership after the new investment and option-pool adjustment using only options vested today."}
                </p>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

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
                      label="Ownership-point change"
                      value={`-${formatPercentage(
                        result.ownershipReductionPercent
                      )} pts`}
                    />

                    <DarkMetric
                      label="Relative dilution"
                      value={formatPercentage(
                        result.relativeOwnershipReductionPercent
                      )}
                    />

                  </div>
                </div>

              </CardContent>
            </Card>

            {/* ==================================================
                INSIGHT
            ================================================== */}

            <DilutionInsight
              result={
                result
              }
            />

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
                        "Pool % increase",
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
                    title={
                      analysisBasis ===
                      "FULL_GRANT"
                        ? "Potential stake"
                        : "Current stake"
                    }
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
                    title="Relative dilution"
                    value={`-${formatPercentage(
                      result.relativeOwnershipReductionPercent
                    )}`}
                    description={`${formatPercentage(
                      result.ownershipReductionPercent
                    )} percentage-point ownership change`}
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
                        inputs.sharesOwned
                      )}{" "}
                      modeled options represent{" "}
                      {formatPercentage(
                        result.currentOwnershipPercent
                      )}{" "}
                      ownership before this funding round. After the round,
                      that becomes{" "}
                      {formatPercentage(
                        result.dilutedOwnershipPercent
                      )}. That is a{" "}
                      {formatPercentage(
                        result.ownershipReductionPercent
                      )}{" "}
                      percentage-point change, equal to{" "}
                      {formatPercentage(
                        result.relativeOwnershipReductionPercent
                      )}{" "}
                      relative dilution. The relative dilution is shared with
                      your connected PRO analysis.
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
                        key={
                          assumption
                        }
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

                  <li className="flex gap-3">
                    <span className="mt-1 text-blue-600">
                      •
                    </span>

                    <span>
                      Full-grant mode is a potential future-ownership scenario.
                      It does not mean unvested options are currently owned,
                      exercisable or guaranteed to vest.
                    </span>
                  </li>
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
  onChange: (
    value: string
  ) => void;
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
          value={
            value
          }
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className={`h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium ${
            prefix
              ? "pl-8"
              : ""
          } ${
            suffix
              ? "pr-16"
              : ""
          }`}
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
  items:
    [string, string][];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-950">
        {title}
      </p>

      <div className="mt-4 space-y-3">
        {items.map(
          ([
            label,
            value,
          ]) => (
            <div
              key={
                label
              }
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
  if (
    result.status ===
    "minimal"
  ) {
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
                color:
                  "#166534",
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

  if (
    result.status ===
    "moderate"
  ) {
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

  if (
    result.status ===
    "significant"
  ) {
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
                color:
                  "#451a03",
              }}
            >
              Significant modeled dilution
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color:
                  "#451a03",
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
            because the company&apos;s valuation also changes.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(
      Number.isFinite(
        value
      )
        ? value
        : min,
      min
    ),
    max
  );
}

/* ============================================================
   FORMATTERS
============================================================ */

function formatCurrency(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "₹0";
  }

  return `₹${Math.round(
    value
  ).toLocaleString(
    "en-IN"
  )}`;
}

function formatPercentage(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "0%";
  }

  return `${value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits:
        2,
    }
  )}%`;
}

function formatNumber(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "0";
  }

  return Math.round(
    value
  ).toLocaleString(
    "en-IN"
  );
}

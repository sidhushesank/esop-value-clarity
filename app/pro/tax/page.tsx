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
  ReceiptIndianRupee,
  Wallet,
  TrendingUp,
  Percent,
  CircleHelp,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Link2,
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
  calculateAdvancedTax,
  type AdvancedTaxInput,
} from "@/lib/esop/tax";

import {
  useProEquityState,
  DEFAULT_PRO_STATE,
  normalizeProNumber,
} from "@/lib/esop/pro-state";

type ActiveConfirmedGrant = {
  id: string;
  companyName: string | null;
  grantName: string | null;
  optionCount: number | null;
  strikePrice: number | null;
  currency: string | null;
  vestingStartDate: string | null;
  vestingDurationMonths: number | null;
  cliffMonths: number | null;
  vestingFrequency: string | null;
  expiryDate: string | null;
  postTerminationExerciseDays: number | null;
  confirmedAt: string | null;
  document: {
    id: string;
  } | null;
};

type ActiveGrantResponse = {
  success: boolean;
  grant?: ActiveConfirmedGrant | null;
  message?: string;
};

type AnalysisBasis =
  | "FULL_GRANT"
  | "CURRENTLY_VESTED";

type SalePriceMode =
  | "CONNECTED_EXIT"
  | "MANUAL";

/* ============================================================
   PRO TAX PAGE
============================================================ */

export default function ProTaxPage() {
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
    salePriceMode,
    setSalePriceMode,
  ] = useState<SalePriceMode>(
    "CONNECTED_EXIT"
  );

  const [
    connectedGrant,
    setConnectedGrant,
  ] = useState<ActiveConfirmedGrant | null>(
    null
  );

  /* ==========================================================
     CONFIRMED GRANT -> SHARED PRO MODEL
  ========================================================== */

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;

    async function connectConfirmedGrant() {
      try {
        const response = await fetch(
          "/api/pro/equity/active",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as ActiveGrantResponse;

        if (
          cancelled ||
          !response.ok ||
          !data.success ||
          !data.grant
        ) {
          return;
        }

        const grant = data.grant;
        setConnectedGrant(grant);

        const totalOptions =
          grant.optionCount ??
          normalizeProNumber(
            proState.totalOptions
          );

        const exercisePrice =
          grant.strikePrice ??
          normalizeProNumber(
            proState.exercisePrice
          );

        /*
         * IMPORTANT SOURCE-OF-TRUTH RULE
         *
         * The confirmed grant owns grant facts such as option count,
         * exercise price and source vesting terms.
         *
         * Phase 2 Vesting owns the active/current vesting position:
         * - vestedOptions
         * - vestedPercentage
         * - vestingPeriodMonths
         * - cliffMonths
         * - monthsCompleted
         *
         * Tax consumes that connected Vesting state below. It must
         * never recalculate today's vesting from the source start date
         * and overwrite the user's active vesting model.
         */
        updateProState({
          totalOptions,
          exercisePrice,

          sourceGrantId:
            grant.id,

          sourceDocumentId:
            grant.document?.id ?? null,

          sourceCompanyName:
            grant.companyName,

          sourceGrantName:
            grant.grantName,

          sourceCurrency:
            grant.currency ?? "INR",

          sourceConfirmedAt:
            grant.confirmedAt,

          sourceVestingStartDate:
            grant.vestingStartDate,

          sourceVestingDurationMonths:
            grant.vestingDurationMonths,

          sourceCliffMonths:
            grant.cliffMonths,

          sourceVestingFrequency:
            grant.vestingFrequency,

          sourceExpiryDate:
            grant.expiryDate,

          sourcePostTerminationExerciseDays:
            grant.postTerminationExerciseDays,
        });
      } catch {
        /* Tax remains usable in shared/manual mode. */
      }
    }

    void connectConfirmedGrant();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    updateProState,
  ]);

  const confirmedGrantConnected =
    Boolean(
      connectedGrant ||
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

  const modeledShares =
    analysisBasis === "FULL_GRANT"
      ? fullGrantOptions
      : currentlyVestedOptions;

  const connectedDilutionPercentage =
    Math.min(
      Math.max(
        normalizeProNumber(
          proState.futureDilutionPercentage
        ),
        0
      ),
      100
    );

  const connectedBaseSalePrice =
    normalizeProNumber(
      proState.totalCompanyShares
    ) > 0
      ? (normalizeProNumber(
          proState.exitValuation
        ) /
          normalizeProNumber(
            proState.totalCompanyShares
          )) *
        (1 -
          connectedDilutionPercentage /
            100)
      : 0;

  const effectiveSalePrice =
    salePriceMode === "CONNECTED_EXIT"
      ? connectedBaseSalePrice
      : normalizeProNumber(
          proState.salePrice
        );

  /* ==========================================================
     TAX INPUTS
     
     VESTING-SOURCED VALUES:
       vestedShares <- vestedOptions
       strikePrice  <- exercisePrice
     
     TAX-SPECIFIC VALUES:
       exerciseFMV
       salePrice
       otherAnnualIncome
       holdingPeriodMonths
       equityType
       taxRegime
  ========================================================== */

  const taxInputs: AdvancedTaxInput = useMemo(
    () => ({
      vestedShares: modeledShares,

      strikePrice: proState.exercisePrice,

      exerciseFMV: proState.exerciseFMV,

      salePrice: effectiveSalePrice,

      otherAnnualIncome:
        proState.otherAnnualIncome,

      holdingPeriodMonths:
        proState.holdingPeriodMonths,

      equityType:
        proState.equityType,

      taxRegime:
        proState.taxRegime,
    }),
    [
      proState,
      modeledShares,
      effectiveSalePrice,
    ]
  );

  /* ==========================================================
     TAX CALCULATION
  ========================================================== */

  const result = useMemo(
    () => calculateAdvancedTax(taxInputs),
    [taxInputs]
  );

  /* ==========================================================
     UPDATE TAX ASSUMPTION
     
     IMPORTANT:
     We do NOT update vestedShares or strikePrice here.
     Those are controlled by Vesting.
  ========================================================== */

  function updateTaxInput(
    field:
      | "exerciseFMV"
      | "salePrice"
      | "otherAnnualIncome"
      | "holdingPeriodMonths",
    value: string
  ) {
    updateProState({
      [field]: normalizeProNumber(value),
    });
  }

  /* ==========================================================
     RESET TAX ASSUMPTIONS
     
     Do not reset Vesting or Dilution.
  ========================================================== */

  function resetTaxAssumptions() {
    setSalePriceMode(
      "CONNECTED_EXIT"
    );

    updateProState({
      exerciseFMV:
        DEFAULT_PRO_STATE.exerciseFMV,

      salePrice:
        DEFAULT_PRO_STATE.salePrice,

      otherAnnualIncome:
        DEFAULT_PRO_STATE.otherAnnualIncome,

      holdingPeriodMonths:
        DEFAULT_PRO_STATE.holdingPeriodMonths,

      equityType:
        DEFAULT_PRO_STATE.equityType,

      taxRegime:
        DEFAULT_PRO_STATE.taxRegime,
    });
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
            Loading your PRO tax model...
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
            PRO India Tax Estimator
          </div>
        </div>

        {/* ======================================================
            TITLE
        ====================================================== */}

        <section className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
              <ReceiptIndianRupee size={22} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                India equity taxation
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 md:text-4xl lg:text-5xl">
                What might you actually keep after tax?
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Move beyond headline ESOP value. Estimate the potential
                tax impact of exercising and eventually selling your
                equity under your selected assumptions.
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
                      connectedGrant?.companyName ||
                      "Confirmed ESOP grant"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {formatNumber(
                      fullGrantOptions
                    )}{" "}
                    options ·{" "}
                    {formatUnitCurrency(
                      normalizeProNumber(
                        proState.exercisePrice
                      )
                    )}{" "}
                    exercise price ·{" "}
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
                Manual tax analysis mode
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-900/80">
                No confirmed grant is currently connected. Tax remains
                available using your shared PRO assumptions.
              </p>
            </div>
          </section>
        )}

        {/* ======================================================
            CONNECTED EXIT / DILUTION
        ====================================================== */}

        <section className="mt-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm">
                <Link2 size={16} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
                  Exit & dilution connected
                </p>

                <p className="mt-1 text-sm font-black text-blue-950">
                  Base sale price {formatUnitCurrency(
                    connectedBaseSalePrice
                  )}
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-900/80">
                  Built from your shared exit valuation and{" "}
                  {formatPercentage(
                    connectedDilutionPercentage
                  )}{" "}
                  relative dilution.
                </p>
              </div>
            </div>

            <Link
              href="/pro/exit"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-black text-blue-700 shadow-sm transition hover:bg-blue-100"
            >
              Open Exit
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>

        {/* ======================================================
            ANALYSIS BASIS
        ====================================================== */}

        <section className="mt-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                  Analysis basis
                </p>

                <h2 className="mt-1 text-sm font-black text-slate-950">
                  Choose which option position Tax should model.
                </h2>

                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                  Full Grant estimates a future tax scenario for all confirmed
                  options. Currently Vested models only options earned today.
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
                    analysisBasis === "FULL_GRANT"
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-950">
                      Full grant
                    </span>

                    {analysisBasis === "FULL_GRANT" && (
                      <span className="rounded-full bg-blue-600 px-2 py-1 text-[9px] font-black text-white">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Model all {formatNumber(
                      fullGrantOptions
                    )} options.
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
                    analysisBasis === "CURRENTLY_VESTED"
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-950">
                      Currently vested
                    </span>

                    {analysisBasis === "CURRENTLY_VESTED" && (
                      <span className="rounded-full bg-blue-600 px-2 py-1 text-[9px] font-black text-white">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Model only {formatNumber(
                      currentlyVestedOptions
                    )} options earned today.
                  </p>
                </button>
              </div>
            </div>

            {analysisBasis === "FULL_GRANT" &&
              currentlyVestedOptions < fullGrantOptions && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[10px] font-bold leading-5 text-amber-900">
                    This is a potential future-tax scenario. Only{" "}
                    {formatNumber(
                      currentlyVestedOptions
                    )}{" "}
                    options are vested today; the estimator models all{" "}
                    {formatNumber(
                      fullGrantOptions
                    )}{" "}
                    confirmed options as though they eventually vest and are
                    exercised/sold under the assumptions below.
                  </p>
                </div>
              )}
          </div>
        </section>

        {/* ======================================================
            SNAPSHOT
        ====================================================== */}

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <Snapshot
            label="Estimated take-home"
            value={formatCurrency(
              result.netTakeHome
            )}
            description="After exercise + estimated taxes"
            icon={<Wallet size={18} />}
            highlight
          />

          <Snapshot
            label="Estimated tax"
            value={formatCurrency(
              result.totalEstimatedTax
            )}
            description="Exercise + capital gains"
            icon={<ReceiptIndianRupee size={18} />}
          />

          <Snapshot
            label="Capital gain"
            value={formatCurrency(
              result.capitalGain
            )}
            description={
              result.isLongTerm
                ? "Modeled as long-term"
                : "Modeled as short-term"
            }
            icon={<TrendingUp size={18} />}
          />

          <Snapshot
            label="Effective tax"
            value={formatPercentage(
              result.effectiveTaxRate
            )}
            description="Tax as % of sale value"
            icon={<Percent size={18} />}
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
                    Tax assumptions
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    Your grant position is connected to the PRO
                    vesting model.
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
                  VESTED SHARES — CONNECTED
              ================================================== */}

              <ConnectedField
                label="Options modeled"
                description={
                  analysisBasis === "FULL_GRANT"
                    ? "Full confirmed grant used for this future tax scenario"
                    : "Currently vested options from your PRO vesting model"
                }
                value={modeledShares}
                onNavigate="/pro/vesting"
              />

              {/* ==================================================
                  STRIKE PRICE — CONNECTED
              ================================================== */}

              <ConnectedField
                label="Strike / exercise price"
                description="Exercise price from your PRO vesting model"
                value={proState.exercisePrice}
                prefix="₹"
                onNavigate="/pro/vesting"
              />

              {/* ==================================================
                  FMV AT EXERCISE
              ================================================== */}

              <Field
                label="FMV at exercise"
                description="Estimated fair market value per share at exercise"
                value={proState.exerciseFMV}
                prefix="₹"
                onChange={(value) =>
                  updateTaxInput(
                    "exerciseFMV",
                    value
                  )
                }
              />

              {/* ==================================================
                  SALE PRICE
              ================================================== */}

              <div>
                <Label className="text-sm font-semibold text-slate-900">
                  Sale price basis
                </Label>

                <p className="mt-1 text-xs text-slate-500">
                  Use the connected base Exit price or enter a manual tax scenario.
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Toggle
                    active={
                      salePriceMode ===
                      "CONNECTED_EXIT"
                    }
                    onClick={() =>
                      setSalePriceMode(
                        "CONNECTED_EXIT"
                      )
                    }
                  >
                    Connected Exit
                  </Toggle>

                  <Toggle
                    active={
                      salePriceMode ===
                      "MANUAL"
                    }
                    onClick={() =>
                      setSalePriceMode(
                        "MANUAL"
                      )
                    }
                  >
                    Manual
                  </Toggle>
                </div>
              </div>

              {salePriceMode === "CONNECTED_EXIT" ? (
                <ConnectedField
                  label="Expected sale price"
                  description={`Base Exit price after ${formatPercentage(
                    connectedDilutionPercentage
                  )} relative dilution`}
                  value={connectedBaseSalePrice}
                  prefix="₹"
                  onNavigate="/pro/exit"
                />
              ) : (
                <Field
                  label="Expected sale price"
                  description="Manual estimated price per share at sale"
                  value={proState.salePrice}
                  prefix="₹"
                  onChange={(value) =>
                    updateTaxInput(
                      "salePrice",
                      value
                    )
                  }
                />
              )}

              {/* ==================================================
                  OTHER INCOME
              ================================================== */}

              <Field
                label="Other annual income"
                description="Approximate taxable income before this ESOP perquisite"
                value={proState.otherAnnualIncome}
                prefix="₹"
                onChange={(value) =>
                  updateTaxInput(
                    "otherAnnualIncome",
                    value
                  )
                }
              />

              {/* ==================================================
                  HOLDING PERIOD
              ================================================== */}

              <Field
                label="Holding period"
                description="Months between exercise and sale"
                value={proState.holdingPeriodMonths}
                suffix="months"
                onChange={(value) =>
                  updateTaxInput(
                    "holdingPeriodMonths",
                    value
                  )
                }
              />

              {/* ==================================================
                  EQUITY TYPE
              ================================================== */}

              <div>
                <Label className="text-sm font-semibold text-slate-900">
                  Equity type
                </Label>

                <div className="mt-2 grid grid-cols-2 gap-2">

                  <Toggle
                    active={
                      proState.equityType ===
                      "UNLISTED"
                    }
                    onClick={() =>
                      updateProState({
                        equityType:
                          "UNLISTED",
                      })
                    }
                  >
                    Unlisted
                  </Toggle>

                  <Toggle
                    active={
                      proState.equityType ===
                      "LISTED"
                    }
                    onClick={() =>
                      updateProState({
                        equityType:
                          "LISTED",
                      })
                    }
                  >
                    Listed
                  </Toggle>

                </div>
              </div>

              {/* ==================================================
                  TAX REGIME
              ================================================== */}

              <div>
                <Label className="text-sm font-semibold text-slate-900">
                  Income tax regime
                </Label>

                <div className="mt-2 grid grid-cols-2 gap-2">

                  <Toggle
                    active={
                      proState.taxRegime ===
                      "NEW"
                    }
                    onClick={() =>
                      updateProState({
                        taxRegime: "NEW",
                      })
                    }
                  >
                    New regime
                  </Toggle>

                  <Toggle
                    active={
                      proState.taxRegime ===
                      "OLD"
                    }
                    onClick={() =>
                      updateProState({
                        taxRegime: "OLD",
                      })
                    }
                  >
                    Old regime
                  </Toggle>

                </div>
              </div>

              {/* ==================================================
                  RESET
              ================================================== */}

              <button
                type="button"
                onClick={
                  resetTaxAssumptions
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Reset tax assumptions
              </button>

              {/* ==================================================
                  NOTICE
              ================================================== */}

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                  Estimated, not tax advice
                </p>

                <p className="mt-1.5 text-xs leading-5 text-blue-900/80">
                  This tool provides an illustrative estimate based on
                  the assumptions you enter. Actual tax treatment can
                  vary based on your ESOP agreement, FMV methodology,
                  tax status and transaction details.
                </p>
              </div>

            </CardContent>
          </Card>

          {/* ====================================================
              ANALYSIS
          ==================================================== */}

          <div className="space-y-6">

            {/* ==================================================
                TAKE HOME
            ================================================== */}

            <Card className="overflow-hidden border-slate-950 bg-slate-950 text-white shadow-sm">
              <CardContent className="p-7 md:p-9">

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Estimated take-home
                </p>

                <h2 className="mt-3 break-words text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                  {formatCurrency(
                    result.netTakeHome
                  )}
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                  Estimated sale proceeds after the modeled exercise
                  cost and tax impact. This is an illustrative scenario,
                  not a guaranteed amount you will receive.
                </p>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="grid gap-5 sm:grid-cols-3">

                    <DarkMetric
                      label="Sale value"
                      value={formatCurrency(
                        result.saleValue
                      )}
                    />

                    <DarkMetric
                      label="Exercise cost"
                      value={`-${formatCurrency(
                        result.exerciseCost
                      )}`}
                    />

                    <DarkMetric
                      label="Estimated tax"
                      value={`-${formatCurrency(
                        result.totalEstimatedTax
                      )}`}
                    />

                  </div>
                </div>

              </CardContent>
            </Card>

            {/* ==================================================
                INSIGHT
            ================================================== */}

            <TaxInsight result={result} />

            {/* ==================================================
                TAX BREAKDOWN
            ================================================== */}

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Tax breakdown
                </p>

                <CardTitle className="mt-1 text-xl font-bold text-slate-950">
                  Where the tax impact comes from
                </CardTitle>

                <p className="mt-1 text-sm text-slate-500">
                  Separate the tax created at exercise from the tax
                  created when the shares are sold.
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">

                  <Breakdown
                    title="At exercise"
                    items={[
                      [
                        "Exercise cost",
                        formatCurrency(
                          result.exerciseCost
                        ),
                      ],
                      [
                        "Perquisite / share",
                        formatCurrency(
                          result.perquisitePerShare
                        ),
                      ],
                      [
                        "Taxable perquisite",
                        formatCurrency(
                          result.taxablePerquisite
                        ),
                      ],
                      [
                        "Estimated income tax",
                        formatCurrency(
                          result.estimatedIncomeTax
                        ),
                      ],
                    ]}
                  />

                  <Breakdown
                    title="At sale"
                    items={[
                      [
                        "Sale value",
                        formatCurrency(
                          result.saleValue
                        ),
                      ],
                      [
                        "Capital gain",
                        formatCurrency(
                          result.capitalGain
                        ),
                      ],
                      [
                        "Holding classification",
                        result.isLongTerm
                          ? "Long-term"
                          : "Short-term",
                      ],
                      [
                        "Estimated capital-gains tax",
                        formatCurrency(
                          result.capitalGainsTax
                        ),
                      ],
                    ]}
                  />

                </div>
              </CardContent>
            </Card>

            {/* ==================================================
                JOURNEY
            ================================================== */}

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Tax journey
                </p>

                <CardTitle className="mt-1 text-xl font-bold text-slate-950">
                  From option to take-home
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid gap-3 md:grid-cols-4">

                  <Journey
                    number="01"
                    title="Exercise"
                    value={formatCurrency(
                      result.exerciseCost
                    )}
                    description="Cash required"
                  />

                  <Journey
                    number="02"
                    title="Perquisite"
                    value={formatCurrency(
                      result.taxablePerquisite
                    )}
                    description="Potentially taxable"
                  />

                  <Journey
                    number="03"
                    title="Capital gain"
                    value={formatCurrency(
                      result.capitalGain
                    )}
                    description={
                      result.isLongTerm
                        ? "Long-term"
                        : "Short-term"
                    }
                  />

                  <Journey
                    number="04"
                    title="Take-home"
                    value={formatCurrency(
                      result.netTakeHome
                    )}
                    description="Estimated net proceeds"
                    highlight
                  />

                </div>
              </CardContent>
            </Card>

            {/* ==================================================
                TAX INFO
            ================================================== */}

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-950">
                  What this estimator assumes
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
                Bring your tax estimate into the final Exit outcome.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Combine the confirmed grant, vesting, dilution, exit valuation
                and tax assumptions to see an estimated take-home amount.
              </p>
            </div>

            <Link
              href="/pro/exit"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Explore Exit
              <ArrowUpRight size={16} />
            </Link>

          </div>
        </section>

      </div>
    </main>
  );
}

/* ============================================================
   CONNECTED FIELD
============================================================ */

function ConnectedField({
  label,
  description,
  value,
  prefix,
  onNavigate,
}: {
  label: string;
  description: string;
  value: number;
  prefix?: string;
  onNavigate: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold text-slate-900">
          {label}
        </Label>

        <Link
          href={onNavigate}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-blue-600 transition hover:text-blue-800"
        >
          <Link2 size={11} />
          Connected
        </Link>
      </div>

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
          value={value}
          readOnly
          className={`h-11 rounded-xl border-blue-100 bg-blue-50/50 text-sm font-semibold text-slate-900 ${
            prefix ? "pl-8" : ""
          }`}
        />
      </div>

      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-blue-600">
        <Link2 size={11} />
        Connected source
      </p>
    </div>
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
          } ${suffix ? "pr-20" : ""}`}
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
   TOGGLE
============================================================ */

function Toggle({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
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
        {items.map(([label, value]) => (
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
        ))}
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
   INSIGHT
============================================================ */

function TaxInsight({
  result,
}: {
  result: ReturnType<
    typeof calculateAdvancedTax
  >;
}) {
  if (result.status === "underwater") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="font-bold text-red-900">
              Your exercise assumptions need attention
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color: "#991B1B",
              }}
            >
              The FMV entered is below the strike price. Review the
              exercise assumptions before relying on this estimate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === "high-value") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <p className="font-bold text-emerald-900">
              Strong modeled take-home
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color: "#166534",
              }}
            >
              Under the assumptions entered, your estimated take-home
              remains substantially above the exercise capital required.
              This is a scenario, not a guaranteed return.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === "positive") {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <TrendingUp
            size={20}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <p className="font-bold text-blue-900">
              Positive modeled outcome
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color: "#1E3A8A",
              }}
            >
              Your estimated sale proceeds exceed the modeled exercise
              cost after accounting for the estimated tax impact.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck
          size={20}
          className="mt-0.5 shrink-0 text-amber-600"
        />

        <div>
          <p className="font-bold text-amber-900">
            Review the tax impact carefully
          </p>

          <p
            className="mt-1 text-sm leading-6"
            style={{
              color: "#92400E",
            }}
          >
            Your modeled take-home is relatively close to the capital
            required to exercise. Small changes in FMV, sale price or
            tax assumptions can materially change the outcome.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FORMATTERS
============================================================ */

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "₹0";
  }

  return `₹${Math.round(value).toLocaleString(
    "en-IN"
  )}`;
}

function formatNumber(
  value: number
) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Math.round(
    value
  ).toLocaleString(
    "en-IN"
  );
}

function formatUnitCurrency(
  value: number
) {
  if (!Number.isFinite(value)) {
    return "₹0.00";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 1,
    }
  )}%`;
}
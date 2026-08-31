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
  Calculator,
  CircleHelp,
  TrendingUp,
  Wallet,
  Percent,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Target,
  GitBranch,
  RotateCcw,
  Link2,
  ChevronRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
  calculateAdvancedESOP,
  type AdvancedSimulatorInput,
} from "@/lib/esop/simulator";

import {
  useProEquityState,
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

/* =============================================================
   DEFAULT INPUTS
============================================================= */

const DEFAULT_INPUTS: AdvancedSimulatorInput = {
  totalShares: 10_000_000,
  esopsGranted: 10_000,
  vestedPercentage: 100,
  strikePrice: 10,
  currentValuation: 100_000_000,
  futureDilutionPercentage: 20,
  exitValuation: 500_000_000,
};

/* =============================================================
   HELPERS
============================================================= */

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(value, min),
    max
  );
}

/* =============================================================
   PAGE
============================================================= */

export default function ProSimulatorPage() {
  const [
    selectedScenario,
    setSelectedScenario,
  ] = useState<
    "Bear" | "Base" | "Bull"
  >("Base");

  const [
    analysisBasis,
    setAnalysisBasis,
  ] = useState<AnalysisBasis>(
    "FULL_GRANT"
  );

  const {
    proState,
    updateProState,
    hydrated,
  } = useProEquityState();

  const [
    connectedGrant,
    setConnectedGrant,
  ] = useState<ActiveConfirmedGrant | null>(null);

  const [
    grantConnectionLoading,
    setGrantConnectionLoading,
  ] = useState(false);

  /*
   * CONFIRMED GRANT -> SHARED PRO MODEL
   *
   * Confirmed grant facts are seeded into the shared analysis model.
   * Analysis assumptions remain editable and NEVER write back to the
   * confirmed grant stored in the Grant Vault.
   */
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;

    async function connectConfirmedGrant() {
      setGrantConnectionLoading(true);

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
         * Simulator consumes that connected Vesting state later in
         * this page. It must never recalculate today's vesting from
         * the source start date and overwrite the user's active model.
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
        /*
         * The simulator continues in manual mode if the
         * confirmed-grant connection cannot be loaded.
         */
      } finally {
        if (!cancelled) {
          setGrantConnectionLoading(false);
        }
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

  /* ===========================================================
     SHARED PRO STATE → SIMULATOR INPUTS

     The Simulator reads the shared PRO model.

     Shared fields:
       - total company shares
       - total options
       - vested percentage
       - exercise price
       - current valuation
       - future dilution
       - exit valuation

     This keeps:
       Vesting → Dilution → Simulator → Exit
       connected through the same state.
  =========================================================== */

  const inputs: AdvancedSimulatorInput =
    useMemo(
      () => ({
        totalShares:
          normalizeProNumber(
            proState.totalCompanyShares
          ) ||
          DEFAULT_INPUTS.totalShares,

        esopsGranted:
          normalizeProNumber(
            proState.totalOptions
          ) ||
          DEFAULT_INPUTS.esopsGranted,

        vestedPercentage:
          normalizeProNumber(
            proState.vestedPercentage
          ),

        strikePrice:
          normalizeProNumber(
            proState.exercisePrice
          ),

        currentValuation:
          normalizeProNumber(
            proState.currentCompanyValuation
          ),

        futureDilutionPercentage:
          normalizeProNumber(
            proState.futureDilutionPercentage
          ),

        exitValuation:
          normalizeProNumber(
            proState.exitValuation
          ) ||
          DEFAULT_INPUTS.exitValuation,
      }),
      [proState]
    );

  /* ===========================================================
     DILUTION CONNECTION

     IMPORTANT FIX
     -----------------------------------------------------------

     OLD LOGIC:

       current ownership
            ↓
       diluted ownership
            ↓
       reverse calculation
            ↓
       32%

     That caused the Simulator to show a calculated 32%
     even though the shared PRO dilution assumption was 40%.

     NEW LOGIC:

       proState.futureDilutionPercentage
                    ↓
                  40%
                    ↓
               Simulator
                    ↓
                  Exit

     We intentionally use the shared assumption directly.
  =========================================================== */

  const connectedDilutionPercentage =
    clamp(
      normalizeProNumber(
        proState.futureDilutionPercentage
      ),
      0,
      100
    );

  const hasDilutionResult =
    connectedDilutionPercentage > 0;

  /* ===========================================================
     CONFIRMED VESTING JOURNEY
  =========================================================== */

  const confirmedVestingDurationMonths =
    Math.max(
      1,
      proState.sourceVestingDurationMonths ??
        connectedGrant?.vestingDurationMonths ??
        48
    );

  const confirmedCliffMonths =
    Math.max(
      0,
      proState.sourceCliffMonths ??
        connectedGrant?.cliffMonths ??
        0
    );

  /*
   * Phase 2 Vesting owns the active schedule position.
   * Simulator displays that connected position and never derives
   * a competing "today" value from the confirmed grant start date.
   */
  const confirmedMonthsCompleted =
    Math.min(
      confirmedVestingDurationMonths,
      Math.max(
        0,
        Math.round(
          normalizeProNumber(
            proState.monthsCompleted
          )
        )
      )
    );

  const scheduleProgressPercentage =
    clamp(
      (confirmedMonthsCompleted /
        confirmedVestingDurationMonths) *
        100,
      0,
      100
    );

  const vestedTodayPercentage =
    clamp(
      normalizeProNumber(
        proState.vestedPercentage
      ),
      0,
      100
    );

  const journeySegments = 24;

  const completedJourneySegments =
    Math.round(
      (scheduleProgressPercentage / 100) *
        journeySegments
    );

  /* ===========================================================
     CALCULATION INPUTS
  =========================================================== */

  const calculationInputs:
    AdvancedSimulatorInput =
    useMemo(
      () => ({
        ...inputs,

        /*
         * Analysis basis:
         *
         * FULL_GRANT models the potential outcome if the
         * confirmed grant eventually vests.
         *
         * CURRENTLY_VESTED models only the portion earned today.
         */
        vestedPercentage:
          analysisBasis ===
          "FULL_GRANT"
            ? 100
            : inputs.vestedPercentage,

        /*
         * IMPORTANT:
         * The calculation receives the shared dilution
         * assumption directly.
         */
        futureDilutionPercentage:
          connectedDilutionPercentage,
      }),
      [
        inputs,
        connectedDilutionPercentage,
        analysisBasis,
      ]
    );

  /* ===========================================================
     RESULT
  =========================================================== */

  const result = useMemo(
    () =>
      calculateAdvancedESOP(
        calculationInputs
      ),
    [calculationInputs]
  );

  /* ===========================================================
     UPDATE INPUT
  =========================================================== */

  function updateInput(
    field: keyof AdvancedSimulatorInput,
    value: string
  ) {
    const numericValue =
      value === ""
        ? 0
        : Number(value);

    const safeValue =
      Number.isFinite(
        numericValue
      )
        ? numericValue
        : 0;

    switch (field) {
      case "totalShares":
        updateProState({
          totalCompanyShares:
            safeValue,
        });
        break;

      case "esopsGranted":
        updateProState({
          totalOptions:
            safeValue,
        });
        break;

      case "strikePrice":
        updateProState({
          exercisePrice:
            safeValue,
        });
        break;

      case "currentValuation":
        updateProState({
          currentCompanyValuation:
            safeValue,
        });
        break;

      case "futureDilutionPercentage":
        updateProState({
          futureDilutionPercentage:
            clamp(
              safeValue,
              0,
              100
            ),
        });
        break;

      case "exitValuation":
        updateProState({
          exitValuation:
            safeValue,
        });
        break;
    }
  }

  /* ===========================================================
     RESET
  =========================================================== */

  function resetSimulator() {
    updateProState({
      totalCompanyShares:
        DEFAULT_INPUTS.totalShares,

      currentCompanyValuation:
        DEFAULT_INPUTS.currentValuation,

      futureDilutionPercentage:
        DEFAULT_INPUTS.futureDilutionPercentage,

      exitValuation:
        DEFAULT_INPUTS.exitValuation,

      projectedExitValue: 0,
    });

    setSelectedScenario(
      "Base"
    );

    setAnalysisBasis(
      "FULL_GRANT"
    );
  }

  /* ===========================================================
     HYDRATION
  =========================================================== */

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

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-4">

          <Link
            href="/pro"
            className="
              inline-flex items-center gap-2
              text-sm font-semibold text-slate-500
              transition-all duration-200
              hover:text-slate-950
              hover:-translate-x-0.5
            "
          >
            <ArrowLeft size={16} />
            Back to PRO Workspace
          </Link>

          <div
            className="
              inline-flex items-center gap-2
              rounded-full
              border border-blue-100
              bg-blue-50
              px-3.5 py-2
              text-xs font-bold uppercase
              tracking-[0.14em]
              text-blue-700
              transition-all duration-300
              hover:border-blue-200
              hover:bg-blue-100
              hover:shadow-sm
            "
          >
            <Sparkles size={13} />
            PRO Advanced Simulator
          </div>

        </div>

        {/* =====================================================
            TITLE
        ===================================================== */}

        <section className="mt-8">

          <div className="flex items-start gap-4">

            <div
              className="
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-xl
                bg-slate-950
                text-white
                shadow-sm
                transition-all duration-300
                hover:scale-105
                hover:shadow-lg
              "
            >
              <Calculator size={22} />
            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Advanced equity modeling
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 md:text-4xl lg:text-5xl">
                What could your ESOPs actually be worth?
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Go beyond paper value. Model vesting, exercise cost,
                dilution and exit scenarios to understand the potential
                financial outcome of your equity.
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            CONFIRMED GRANT CONNECTION
        ===================================================== */}

        {(connectedGrant ||
          proState.sourceGrantId ||
          grantConnectionLoading) && (
          <section className="mt-6">
            <div
              className="
                flex flex-col gap-4
                rounded-2xl
                border border-emerald-200
                bg-emerald-50
                p-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    mt-0.5
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-xl
                    border border-emerald-200
                    bg-white
                    text-emerald-600
                    shadow-sm
                  "
                >
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                    {grantConnectionLoading
                      ? "Connecting confirmed grant"
                      : "Using confirmed grant"}
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-950">
                    {connectedGrant?.companyName ||
                      proState.sourceCompanyName ||
                      "Confirmed ESOP grant"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {formatNumber(
                      inputs.esopsGranted
                    )}{" "}
                    options ·{" "}
                    {formatCurrency(
                      inputs.strikePrice
                    )}{" "}
                    exercise price ·{" "}
                    {formatPercentage(
                      inputs.vestedPercentage
                    )}{" "}
                    currently vested
                  </p>
                </div>
              </div>

              {(connectedGrant?.document?.id ||
                proState.sourceDocumentId) && (
                <Link
                  href={`/pro/grants/${
                    connectedGrant?.document?.id ||
                    proState.sourceDocumentId
                  }/review`}
                  className="
                    inline-flex shrink-0
                    items-center justify-center
                    gap-2
                    rounded-xl
                    border border-emerald-200
                    bg-white
                    px-4 py-2.5
                    text-xs font-black
                    text-emerald-800
                    shadow-sm
                    transition
                    hover:-translate-y-0.5
                    hover:bg-emerald-100
                  "
                >
                  View source grant
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          </section>
        )}

        {/* =====================================================
            CONNECTION STATUS
        ===================================================== */}

        <section className="mt-4">

          <div
            className="
              group flex items-start gap-3
              rounded-2xl
              border border-blue-100
              bg-blue-50
              p-4
              transition-all duration-300
              hover:border-blue-200
              hover:bg-blue-100/60
              hover:shadow-sm
            "
          >

            <div
              className="
                mt-0.5 flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-lg
                bg-white
                text-blue-600
                shadow-sm
                transition-transform duration-300
                group-hover:scale-105
              "
            >
              <Link2 size={17} />
            </div>

            <div>

              <p className="text-sm font-bold text-blue-900">
                {hasDilutionResult
                  ? "Dilution connected"
                  : "Using your current dilution assumption"}
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-900/80">
                {hasDilutionResult
                  ? `The Simulator is using the shared PRO dilution assumption directly: ${formatPercentage(
                      connectedDilutionPercentage
                    )}.`
                  : "The Simulator will use the shared PRO dilution assumption when available."}
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            ANALYSIS BASIS
        ===================================================== */}

        <section className="mt-5">
          <div
            className="
              rounded-2xl
              border border-slate-200
              bg-white
              p-4
              shadow-sm
            "
          >
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                  Analysis basis
                </p>

                <h2 className="mt-1 text-sm font-black text-slate-950">
                  Choose what this scenario should model.
                </h2>

                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                  Your current vesting position remains unchanged. This setting
                  only controls whether scenario values use the full confirmed
                  grant or only the options vested today.
                </p>
              </div>

              <div
                className="
                  grid min-w-0
                  grid-cols-1
                  gap-2
                  sm:grid-cols-2
                  lg:min-w-[430px]
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    setAnalysisBasis(
                      "FULL_GRANT"
                    )
                  }
                  className={`
                    rounded-xl
                    border
                    px-4
                    py-3
                    text-left
                    transition
                    ${
                      analysisBasis ===
                      "FULL_GRANT"
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20"
                        : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
                    }
                  `}
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
                      inputs.esopsGranted
                    )}{" "}
                    confirmed options assuming they eventually vest.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAnalysisBasis(
                      "CURRENTLY_VESTED"
                    )
                  }
                  className={`
                    rounded-xl
                    border
                    px-4
                    py-3
                    text-left
                    transition
                    ${
                      analysisBasis ===
                      "CURRENTLY_VESTED"
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20"
                        : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
                    }
                  `}
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
                      proState.vestedOptions
                    )}{" "}
                    options earned today.
                  </p>
                </button>
              </div>
            </div>

            {analysisBasis ===
              "FULL_GRANT" &&
              inputs.vestedPercentage <
                100 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[10px] font-bold leading-5 text-amber-900">
                    You currently have{" "}
                    {formatNumber(
                      proState.vestedOptions
                    )}{" "}
                    vested options (
                    {formatPercentage(
                      inputs.vestedPercentage
                    )}
                    ). This scenario models the potential value of the full grant
                    if the remaining options eventually vest.
                  </p>
                </div>
              )}
          </div>
        </section>

        {/* =====================================================
            VESTING JOURNEY PROGRESS
        ===================================================== */}

        {(connectedGrant ||
          proState.sourceGrantId) && (
          <section className="mt-5">
            <div
              className="
                overflow-hidden
                rounded-2xl
                border border-slate-200
                bg-white
                p-4
                shadow-sm
                sm:p-5
              "
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                    Vesting journey
                  </p>

                  <h2 className="mt-1 text-sm font-black text-slate-950">
                    {confirmedMonthsCompleted} of{" "}
                    {confirmedVestingDurationMonths} months completed
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Schedule progress and vested percentage are shown separately
                    so the cliff does not make your timeline look inactive.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700">
                    {formatPercentage(
                      scheduleProgressPercentage,
                      1
                    )}{" "}
                    through schedule
                  </span>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                    {formatPercentage(
                      vestedTodayPercentage,
                      1
                    )}{" "}
                    vested today
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <div
                  className="
                    grid
                    grid-cols-[repeat(24,minmax(0,1fr))]
                    gap-1
                  "
                  aria-label={`${formatPercentage(
                    scheduleProgressPercentage,
                    1
                  )} of the vesting schedule completed`}
                >
                  {Array.from({
                    length:
                      journeySegments,
                  }).map((_, index) => {
                    const completed =
                      index <
                      completedJourneySegments;

                    return (
                      <div
                        key={index}
                        className={`
                          h-4
                          rounded-[4px]
                          border
                          transition-all
                          duration-300
                          ${
                            completed
                              ? "border-blue-500 bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.20)]"
                              : "border-slate-200 bg-slate-100"
                          }
                        `}
                      />
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-col justify-between gap-2 text-[10px] font-bold text-slate-400 sm:flex-row">
                  <span>
                    Grant start
                  </span>

                  <span className="text-blue-600">
                    Today · month{" "}
                    {confirmedMonthsCompleted}
                  </span>

                  <span>
                    Fully vested · month{" "}
                    {confirmedVestingDurationMonths}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Schedule progress
                  </p>

                  <p className="mt-1 text-lg font-black text-slate-950">
                    {formatPercentage(
                      scheduleProgressPercentage,
                      1
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Vested today
                  </p>

                  <p className="mt-1 text-lg font-black text-slate-950">
                    {formatPercentage(
                      vestedTodayPercentage,
                      1
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Cliff milestone
                  </p>

                  <p className="mt-1 text-lg font-black text-slate-950">
                    {confirmedCliffMonths > 0
                      ? `Month ${confirmedCliffMonths}`
                      : "No cliff"}
                  </p>
                </div>
              </div>

              {confirmedCliffMonths > 0 &&
                confirmedMonthsCompleted <
                  confirmedCliffMonths && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[10px] font-bold leading-5 text-amber-900">
                      You are{" "}
                      {Math.max(
                        confirmedCliffMonths -
                          confirmedMonthsCompleted,
                        0
                      )}{" "}
                      months away from the modeled cliff. Time is progressing,
                      but this standard cliff model shows no vested options until
                      that milestone is reached.
                    </p>
                  </div>
                )}
            </div>
          </section>
        )}

        {/* =====================================================
            SNAPSHOT
        ===================================================== */}

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <SnapshotCard
            label={analysisBasis === "FULL_GRANT" ? "Potential ownership" : "Ownership"}
            value={formatPercentage(
              result.ownershipPercentage,
              3
            )}
            description={analysisBasis === "FULL_GRANT" ? "If the modeled grant fully vests" : "Current vested ownership"}
            icon={<Percent size={18} />}
          />

          <SnapshotCard
            label={analysisBasis === "FULL_GRANT" ? "Potential base-case value" : "Base-case value"}
            value={formatCurrency(
              result.netExitProceeds
            )}
            description="After exercise + dilution"
            icon={<TrendingUp size={18} />}
            highlight
          />

          <SnapshotCard
            label="Return multiple"
            value={formatMultiple(
              result.returnMultiple
            )}
            description="Against exercise cost"
            icon={<Target size={18} />}
          />

          <SnapshotCard
            label="Exercise required"
            value={formatCurrency(
              result.exerciseCost
            )}
            description="Cash required to exercise"
            icon={<Wallet size={18} />}
          />

        </section>

        {/* =====================================================
            MAIN WORKSPACE
        ===================================================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-[410px_minmax(0,1fr)]">

          {/* ===================================================
              INPUTS
          =================================================== */}

          <Card
            className="
              border-slate-200
              bg-white
              shadow-sm
              transition-all duration-300
              hover:shadow-md
            "
          >

            <CardHeader>

              <div className="flex items-start justify-between gap-4">

                <div>

                  <CardTitle className="text-xl font-bold text-slate-950">
                    Your equity assumptions
                  </CardTitle>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Adjust the assumptions to model your situation.
                  </p>

                </div>

                <div
                  className="
                    flex h-9 w-9
                    items-center justify-center
                    rounded-lg
                    bg-slate-100
                    text-slate-600
                    transition-all duration-300
                    hover:bg-blue-50
                    hover:text-blue-600
                    hover:scale-105
                  "
                >
                  <CircleHelp size={17} />
                </div>

              </div>

            </CardHeader>

            <CardContent className="space-y-5">

              {/* TOTAL COMPANY SHARES */}

              <InputField
                label="Total company shares"
                description="Fully diluted share count"
                value={
                  inputs.totalShares
                }
                onChange={(value) =>
                  updateInput(
                    "totalShares",
                    value
                  )
                }
              />

              {/* ESOPS GRANTED */}

              <InputField
                label="ESOPs granted"
                description="Total options in your grant"
                value={
                  inputs.esopsGranted
                }
                onChange={(value) =>
                  updateInput(
                    "esopsGranted",
                    value
                  )
                }
              />

              {/* VESTED PERCENTAGE — CONNECTED FROM PHASE 2 */}

              <ConnectedVestingField
                label="Vested percentage"
                description="Connected from your Phase 2 Vesting model"
                value={
                  inputs.vestedPercentage
                }
                suffix="%"
                href="/pro/vesting"
              />

              {/* STRIKE */}

              <InputField
                label="Strike / exercise price"
                description="Price paid per option when exercised"
                value={
                  inputs.strikePrice
                }
                prefix="₹"
                onChange={(value) =>
                  updateInput(
                    "strikePrice",
                    value
                  )
                }
              />

              {/* CURRENT VALUATION */}

              <InputField
                label="Current company valuation"
                description="Current estimated company equity value"
                value={
                  inputs.currentValuation
                }
                prefix="₹"
                onChange={(value) =>
                  updateInput(
                    "currentValuation",
                    value
                  )
                }
              />

              {/* =================================================
                  FUTURE DILUTION
              ================================================= */}

              <div>

                <Label className="text-sm font-semibold text-slate-900">
                  Expected future dilution
                </Label>

                <p className="mt-1 text-xs text-slate-500">
                  Shared dilution assumption carried across your PRO
                  equity model
                </p>

                <div className="relative mt-2">

                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={
                      connectedDilutionPercentage
                    }
                    onChange={(event) =>
                      updateInput(
                        "futureDilutionPercentage",
                        event.target.value
                      )
                    }
                    className="
                      h-11
                      rounded-xl
                      border-slate-200
                      bg-slate-50
                      pr-10
                      text-sm
                      font-medium
                      transition-all duration-200
                      focus:border-blue-400
                      focus:bg-white
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />

                  <span
                    className="
                      pointer-events-none
                      absolute right-3 top-1/2
                      z-10
                      -translate-y-1/2
                      text-xs font-semibold
                      text-slate-400
                    "
                  >
                    %
                  </span>

                </div>

                <div className="mt-2 flex items-center gap-2">

                  <span
                    className="
                      h-1.5 w-1.5
                      rounded-full
                      bg-emerald-500
                      animate-pulse
                    "
                  />

                  <p className="text-[10px] font-medium text-blue-600">
                    Connected to shared PRO dilution model
                  </p>

                </div>

              </div>

              {/* =================================================
                  EXIT VALUATION
              ================================================= */}

              <div>

                <Label className="text-sm font-semibold text-slate-900">
                  Exit valuation
                </Label>

                <p className="mt-1 text-xs text-slate-500">
                  Estimated company valuation at exit
                </p>

                <div
                  className="
                    mt-3
                    rounded-2xl
                    border border-slate-200
                    bg-slate-50
                    p-4
                    transition-all duration-300
                    hover:border-blue-200
                    hover:bg-white
                    hover:shadow-sm
                  "
                >

                  <p className="text-2xl font-black tracking-tight text-slate-950">
                    {formatCurrency(
                      inputs.exitValuation
                    )}
                  </p>

                  <input
                    type="range"
                    min={10_000_000}
                    max={5_000_000_000}
                    step={5_000_000}
                    value={
                      clamp(
                        inputs.exitValuation,
                        10_000_000,
                        5_000_000_000
                      )
                    }
                    onChange={(event) =>
                      updateInput(
                        "exitValuation",
                        event.target.value
                      )
                    }
                    className="
                      mt-4
                      h-2
                      w-full
                      cursor-pointer
                      appearance-none
                      rounded-full
                      bg-slate-200
                      accent-blue-600
                    "
                  />

                  <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>₹1 Cr</span>
                    <span>₹500 Cr</span>
                  </div>

                  <Input
                    type="number"
                    min={0}
                    value={
                      inputs.exitValuation
                    }
                    onChange={(event) =>
                      updateInput(
                        "exitValuation",
                        event.target.value
                      )
                    }
                    className="
                      mt-3
                      h-11
                      rounded-xl
                      border-slate-200
                      bg-white
                      text-sm
                      font-medium
                      transition-all duration-200
                      focus:border-blue-400
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />

                </div>

              </div>

              {/* =================================================
                  RESET
              ================================================= */}

              <Button
                type="button"
                variant="outline"
                onClick={
                  resetSimulator
                }
                className="
                  h-10
                  w-full
                  rounded-xl
                  border-slate-300
                  bg-white
                  px-4
                  text-sm
                  font-semibold
                  text-slate-900
                  transition-all duration-200
                  hover:bg-slate-100
                  hover:border-slate-400
                  active:scale-[0.98]
                "
              >
                <RotateCcw
                  size={15}
                  className="mr-2"
                />
                Reset analysis assumptions
              </Button>

              {/* =================================================
                  CONNECTED MODEL NOTICE
              ================================================= */}

              <div
                className="
                  rounded-2xl
                  border border-blue-100
                  bg-blue-50
                  p-4
                  transition-all duration-300
                  hover:border-blue-200
                  hover:bg-blue-100/70
                "
              >

                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                  Connected model
                </p>

                <p className="mt-1.5 text-xs leading-5 text-blue-900/80">
                  Confirmed grant facts are connected from your Equity
                  Profile. Company valuation, dilution and exit valuation remain
                  editable analysis assumptions shared across the PRO tools.
                </p>

              </div>

            </CardContent>

          </Card>

          {/* ===================================================
              ANALYSIS
          =================================================== */}

          <div className="space-y-6">

            {/* =================================================
                OWNERSHIP HERO
            ================================================= */}

            <Card
              className="
                overflow-hidden
                border-slate-950
                bg-slate-950
                text-white
                shadow-sm
                transition-all duration-500
                hover:shadow-[0_20px_60px_rgba(15,23,42,0.22)]
              "
            >

              <CardContent className="p-7 md:p-9">

                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">

                  <div>

                    <div className="flex items-center gap-2">

                      <span
                        className="
                          h-2
                          w-2
                          rounded-full
                          bg-blue-400
                          animate-pulse
                        "
                      />

                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                        Modeled outcome
                      </p>

                    </div>

                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      {analysisBasis === "FULL_GRANT"
                        ? "Potential ownership"
                        : "Current vested ownership"}
                    </p>

                    <p className="mt-1 text-5xl font-black tracking-tight md:text-6xl">
                      {formatPercentage(
                        result.ownershipPercentage,
                        3
                      )}
                    </p>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                      {analysisBasis === "FULL_GRANT"
                        ? "This shows the modeled ownership if the full confirmed grant eventually vests."
                        : "Your current vested position represents this percentage of the modeled fully diluted company."}
                    </p>

                  </div>

                  <div
                    className="
                      rounded-2xl
                      border border-white/10
                      bg-white/[0.04]
                      p-5
                      transition-all duration-300
                      hover:-translate-y-1
                      hover:border-blue-400/30
                      hover:bg-white/[0.07]
                    "
                  >

                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Future dilution
                    </p>

                    <p className="mt-2 text-3xl font-black text-white">
                      {formatPercentage(
                        connectedDilutionPercentage
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Shared PRO assumption
                    </p>

                  </div>

                </div>

                <div className="mt-8 border-t border-white/10 pt-6">

                  <div className="grid gap-5 sm:grid-cols-3">

                    <DarkMetric
                      label="Vested shares"
                      value={formatNumber(
                        result.vestedShares
                      )}
                    />

                    <DarkMetric
                      label="Exercise cost"
                      value={formatCurrency(
                        result.exerciseCost
                      )}
                    />

                    <DarkMetric
                      label="Base exit value"
                      value={formatCurrency(
                        result.netExitProceeds
                      )}
                    />

                  </div>

                </div>

              </CardContent>

            </Card>

            {/* =================================================
                INSIGHT
            ================================================= */}

            <InsightCard
              result={result}
            />

            {/* =================================================
                SCENARIO ANALYSIS
            ================================================= */}

            <Card
              className="
                border-slate-200
                bg-white
                shadow-sm
                transition-all duration-300
                hover:shadow-md
              "
            >

              <CardHeader>

                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                      Scenario analysis
                    </p>

                    <CardTitle className="mt-1 text-xl font-bold text-slate-950">
                      What happens if the outcome changes?
                    </CardTitle>

                    <p className="mt-1 text-sm text-slate-500">
                      Select a scenario to instantly model that exit outcome.
                    </p>

                  </div>

                  <span className="text-xs font-semibold text-slate-400">
                    Click a scenario
                  </span>

                </div>

              </CardHeader>

              <CardContent>

                <div className="grid gap-4 md:grid-cols-3">

                  {result.scenarios.map(
                    (scenario) => (
                      <ScenarioCard
                        key={
                          scenario.name
                        }
                        scenario={
                          scenario
                        }
                        maxValue={Math.max(
                          ...result.scenarios.map(
                            (item) =>
                              item.netExitProceeds
                          ),
                          1
                        )}
                        selected={
                          selectedScenario ===
                          scenario.name
                        }
                        onSelect={() => {

                          setSelectedScenario(
                            scenario.name
                          );

                          updateInput(
                            "exitValuation",
                            String(
                              scenario.exitValuation
                            )
                          );

                        }}
                      />
                    )
                  )}

                </div>

              </CardContent>

            </Card>

            {/* =================================================
                EQUITY JOURNEY
            ================================================= */}

            <Card
              className="
                border-slate-200
                bg-white
                shadow-sm
                transition-all duration-300
                hover:shadow-md
              "
            >

              <CardHeader>

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Equity journey
                </p>

                <CardTitle className="mt-1 text-xl font-bold text-slate-950">
                  Follow your equity from grant to exit
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="grid gap-3 md:grid-cols-5">

                  <JourneyStep
                    number="01"
                    title="Granted"
                    value={formatNumber(
                      inputs.esopsGranted
                    )}
                    description="Options"
                  />

                  <JourneyStep
                    number="02"
                    title={analysisBasis === "FULL_GRANT" ? "Modeled grant" : "Vested"}
                    value={formatNumber(
                      result.vestedShares
                    )}
                    description="Options"
                  />

                  <JourneyStep
                    number="03"
                    title="Exercise"
                    value={formatCurrency(
                      result.exerciseCost
                    )}
                    description="Cash required"
                  />

                  <JourneyStep
                    number="04"
                    title="Dilution"
                    value={formatPercentage(
                      connectedDilutionPercentage
                    )}
                    description="Shared PRO assumption"
                  />

                  <JourneyStep
                    number="05"
                    title="Exit"
                    value={formatCurrency(
                      result.netExitProceeds
                    )}
                    description="Estimated proceeds"
                    highlight
                  />

                </div>

              </CardContent>

            </Card>

            {/* =================================================
                FINANCIAL INSIGHTS
            ================================================= */}

            <div className="grid gap-6 lg:grid-cols-2">

              {/* BREAK EVEN */}

              <Card
                className="
                  border-slate-200
                  bg-white
                  shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-md
                "
              >

                <CardHeader>

                  <CardTitle className="text-lg font-bold">
                    Your break-even point
                  </CardTitle>

                  <p className="text-sm text-slate-500">
                    Estimated exit valuation needed to recover your
                    exercise cost after modeled dilution.
                  </p>

                </CardHeader>

                <CardContent>

                  <div
                    className="
                      rounded-2xl
                      bg-slate-950
                      p-6
                      text-white
                      transition-all duration-300
                      hover:bg-slate-900
                      hover:shadow-lg
                    "
                  >

                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Break-even exit valuation
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {formatCurrency(
                        result.breakEvenExitValuation
                      )}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Below this valuation, your modeled exit proceeds
                      would not fully cover the exercise cost.
                    </p>

                  </div>

                </CardContent>

              </Card>

              {/* DILUTION IMPACT */}

              <Card
                className="
                  border-slate-200
                  bg-white
                  shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-md
                "
              >

                <CardHeader>

                  <CardTitle className="text-lg font-bold">
                    Dilution impact
                  </CardTitle>

                  <p className="text-sm text-slate-500">
                    See how future dilution changes your modeled exit value.
                  </p>

                </CardHeader>

                <CardContent>

                  <div className="space-y-4">

                    <ComparisonRow
                      label="Without dilution"
                      value={formatCurrency(
                        result.grossExitValue +
                          result.dilutionImpact
                      )}
                    />

                    <ComparisonRow
                      label={`With ${formatPercentage(
                        connectedDilutionPercentage
                      )} dilution`}
                      value={formatCurrency(
                        result.grossExitValue
                      )}
                      strong
                    />

                    <div
                      className="
                        rounded-xl
                        border border-amber-100
                        bg-amber-50
                        p-4
                        transition-all duration-300
                        hover:border-amber-200
                        hover:shadow-sm
                      "
                    >

                      <div className="flex items-start gap-3">

                        <GitBranch
                          size={17}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />

                        <p className="text-xs leading-5 text-amber-900/80">
                          Modeled dilution reduces your gross exit value
                          by approximately{" "}
                          <strong>
                            {formatCurrency(
                              result.dilutionImpact
                            )}
                          </strong>.
                        </p>

                      </div>

                    </div>

                  </div>

                </CardContent>

              </Card>

            </div>

            {/* =================================================
                DETAILED BREAKDOWN
            ================================================= */}

            <Card
              className="
                border-slate-200
                bg-white
                shadow-sm
                transition-all duration-300
                hover:shadow-md
              "
            >

              <CardHeader>

                <CardTitle className="text-xl font-bold">
                  Detailed equity breakdown
                </CardTitle>

                <p className="text-sm text-slate-500">
                  The numbers behind your scenario.
                </p>

              </CardHeader>

              <CardContent>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                  <Breakdown
                    label="Vested shares"
                    value={formatNumber(
                      result.vestedShares
                    )}
                    helper={
                      analysisBasis ===
                      "FULL_GRANT"
                        ? "Full confirmed grant used for this scenario"
                        : `${formatPercentage(
                            inputs.vestedPercentage
                          )} of your grant currently vested`
                    }
                  />

                  <Breakdown
                    label="Unvested shares"
                    value={formatNumber(
                      result.unvestedShares
                    )}
                    helper="Not included in current value"
                  />

                  <Breakdown
                    label="Ownership"
                    value={formatPercentage(
                      result.ownershipPercentage,
                      3
                    )}
                    helper="Based on fully diluted shares"
                  />

                  <Breakdown
                    label="Current share price"
                    value={formatCurrency(
                      result.currentSharePrice
                    )}
                    helper="Implied from valuation"
                  />

                  <Breakdown
                    label="Gross value today"
                    value={formatCurrency(
                      result.grossValueToday
                    )}
                    helper="Before exercise cost"
                  />

                  <Breakdown
                    label="Net value today"
                    value={formatCurrency(
                      result.netValueToday
                    )}
                    helper="After exercise cost"
                  />

                </div>

              </CardContent>

            </Card>

            {/* =================================================
                ASSUMPTIONS
            ================================================= */}

            <div
              className="
                rounded-2xl
                border border-slate-200
                bg-white
                p-5
                shadow-sm
                transition-all duration-300
                hover:border-blue-200
                hover:shadow-md
              "
            >

              <div className="flex items-center gap-2">

                <CircleHelp
                  size={16}
                  className="text-slate-500"
                />

                <p className="text-sm font-bold text-slate-900">
                  Calculation assumptions
                </p>

              </div>

              <ul className="mt-4 grid gap-2 text-xs leading-5 text-slate-500 md:grid-cols-2">

                <li>
                  • Ownership uses vested shares divided by total company
                  shares.
                </li>

                <li>
                  • Exercise cost equals vested shares multiplied by strike
                  price.
                </li>

                <li>
                  • Dilution is modeled as a reduction in exit share value.
                </li>

                <li>
                  • Bear, Base and Bull scenarios are illustrative rather
                  than predictions.
                </li>

                <li>
                  • Taxes are not included in this simulator.
                </li>

                <li>
                  • Full-grant mode assumes the selected options eventually vest;
                  it does not mean they are vested or exercisable today.
                </li>

                <li>
                  • Actual outcomes depend on your ESOP agreement,
                  capitalization table and transaction terms.
                </li>

              </ul>

            </div>

          </div>

        </div>

        {/* =====================================================
            NEXT STEP
        ===================================================== */}

        <section
          className="
            mt-8
            overflow-hidden
            rounded-3xl
            border border-blue-100
            bg-gradient-to-br
            from-blue-50
            via-white
            to-indigo-50
            transition-all duration-300
            hover:border-blue-200
            hover:shadow-md
          "
        >

          <div className="flex flex-col justify-between gap-6 p-7 md:p-9 lg:flex-row lg:items-center">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Next layer
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                From equity value to actual take-home.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                The India Tax Estimator will build on this scenario and
                estimate the potential tax impact of exercising and selling
                your ESOPs.
              </p>

            </div>

            <Link
              href="/pro/tax"
              className="
                inline-flex shrink-0
                items-center justify-center gap-2
                rounded-xl
                bg-slate-950
                px-5 py-3
                text-sm font-bold
                text-white
                transition-all duration-300
                hover:-translate-y-0.5
                hover:bg-slate-800
                hover:shadow-lg
                active:translate-y-0
              "
            >
              Explore Tax Estimator
              <ArrowUpRight size={16} />
            </Link>

          </div>

        </section>

      </div>

    </main>
  );
}

/* =============================================================
   SNAPSHOT CARD
============================================================= */

function SnapshotCard({
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
      className={`
        rounded-2xl
        border
        p-5
        shadow-sm
        transition-all duration-300 ease-out
        hover:-translate-y-1
        hover:shadow-md
        ${
          highlight
            ? "border-slate-950 bg-slate-950 text-white hover:shadow-lg"
            : "border-slate-200 bg-white hover:border-blue-200"
        }
      `}
    >

      <div
        className={`
          flex h-9 w-9
          items-center justify-center
          rounded-lg
          transition-all duration-300
          hover:scale-105
          ${
            highlight
              ? "bg-white/10 text-blue-300"
              : "bg-slate-100 text-slate-600"
          }
        `}
      >
        {icon}
      </div>

      <p
        className={`
          mt-4
          text-xs
          font-bold
          uppercase
          tracking-[0.12em]
          ${
            highlight
              ? "text-slate-400"
              : "text-slate-500"
          }
        `}
      >
        {label}
      </p>

      <p
        className={`
          mt-2
          break-words
          text-2xl
          font-black
          tracking-tight
          ${
            highlight
              ? "text-white"
              : "text-slate-950"
          }
        `}
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-xs
          text-slate-500
        "
      >
        {description}
      </p>

    </div>
  );
}

/* =============================================================
   CONNECTED VESTING FIELD

   Read-only by design. Phase 2 Vesting is the source of truth for
   the employee's active/current vesting position.
============================================================= */

function ConnectedVestingField({
  label,
  description,
  value,
  suffix,
  href,
}: {
  label: string;
  description: string;
  value: number;
  suffix?: string;
  href: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold text-slate-900">
          {label}
        </Label>

        <Link
          href={href}
          className="
            inline-flex items-center gap-1
            text-[10px] font-bold uppercase
            tracking-[0.08em] text-blue-600
            transition hover:text-blue-800
          "
        >
          <Link2 size={11} />
          Connected
        </Link>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

      <div className="relative mt-2">
        <Input
          type="number"
          value={value}
          readOnly
          className={`
            h-11
            rounded-xl
            border-blue-100
            bg-blue-50/50
            text-sm
            font-semibold
            text-slate-900
            ${suffix ? "pr-10" : ""}
          `}
        />

        {suffix && (
          <span
            className="
              pointer-events-none
              absolute right-3 top-1/2
              z-10 -translate-y-1/2
              text-sm font-semibold
              text-slate-400
            "
          >
            {suffix}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <p className="text-[10px] font-medium text-blue-600">
          Controlled by Vesting · edit it in Phase 2
        </p>
      </div>
    </div>
  );
}


/* =============================================================
   INPUT FIELD
============================================================= */

function InputField({
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
          <span
            className="
              pointer-events-none
              absolute left-3 top-1/2
              z-10
              -translate-y-1/2
              text-sm
              font-semibold
              text-slate-400
            "
          >
            {prefix}
          </span>
        )}

        <Input
          type="number"
          min={0}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className={`
            h-11
            rounded-xl
            border-slate-200
            bg-slate-50
            text-sm
            font-medium
            transition-all duration-200
            focus:border-blue-400
            focus:bg-white
            focus:ring-2
            focus:ring-blue-100
            ${
              prefix
                ? "pl-8"
                : ""
            }
            ${
              suffix
                ? "pr-10"
                : ""
            }
          `}
        />

        {suffix && (
          <span
            className="
              pointer-events-none
              absolute right-3 top-1/2
              z-10
              -translate-y-1/2
              text-sm
              font-semibold
              text-slate-400
            "
          >
            {suffix}
          </span>
        )}

      </div>

    </div>
  );
}

/* =============================================================
   INSIGHT
============================================================= */

function InsightCard({
  result,
}: {
  result: ReturnType<
    typeof calculateAdvancedESOP
  >;
}) {

  if (
    result.status ===
    "underwater"
  ) {
    return (
      <div
        className="
          rounded-2xl
          border border-red-200
          bg-red-50
          p-5
          transition-all duration-300
          hover:border-red-300
          hover:shadow-sm
        "
      >

        <div className="flex items-start gap-3">

          <ShieldAlert
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>

            <p className="font-bold text-red-900">
              Your options are currently underwater
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color: "#991B1B",
              }}
            >
              The current implied share value is below your strike price.
              Exercising today may not make economic sense based on these
              assumptions. The situation can change if the company valuation
              increases.
            </p>

          </div>

        </div>

      </div>
    );
  }

  if (
    result.status ===
    "strong"
  ) {
    return (
      <div
        className="
          rounded-2xl
          border border-emerald-200
          bg-emerald-50
          p-5
          transition-all duration-300
          hover:border-emerald-300
          hover:shadow-sm
        "
      >

        <div className="flex items-start gap-3">

          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>

            <p className="font-bold text-emerald-900">
              Strong modeled upside
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color: "#166534",
              }}
            >
              Under your current assumptions, the modeled exit proceeds are
              significantly higher than the capital required to exercise.
              Treat this as a scenario, not a guaranteed outcome.
            </p>

          </div>

        </div>

      </div>
    );
  }

  if (
    result.status ===
    "positive"
  ) {
    return (
      <div
        className="
          rounded-2xl
          border border-blue-200
          bg-blue-50
          p-5
          transition-all duration-300
          hover:border-blue-300
          hover:shadow-sm
        "
      >

        <div className="flex items-start gap-3">

          <TrendingUp
            size={20}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>

            <p className="font-bold text-blue-900">
              Positive modeled upside
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color: "#1E3A8A",
              }}
            >
              Your base scenario currently produces more value than the
              exercise capital required. Future dilution and actual exit
              conditions can materially change the result.
            </p>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div
      className="
        rounded-2xl
        border border-amber-200
        bg-amber-50
        p-5
        transition-all duration-300
        hover:border-amber-300
        hover:shadow-sm
      "
    >

      <div className="flex items-start gap-3">

        <AlertTriangle
          size={20}
          className="mt-0.5 shrink-0 text-amber-600"
        />

        <div>

          <p className="font-bold text-amber-900">
            Model carefully before making a decision
          </p>

          <p
            className="mt-1 text-sm leading-6"
            style={{
              color: "#92400E",
            }}
          >
            Your current assumptions show limited modeled upside. Review the
            exercise cost, dilution and exit valuation carefully before
            making decisions about your equity.
          </p>

        </div>

      </div>

    </div>
  );
}

/* =============================================================
   SCENARIO CARD
============================================================= */

function ScenarioCard({
  scenario,
  maxValue,
  selected,
  onSelect,
}: {
  scenario: {
    name:
      | "Bear"
      | "Base"
      | "Bull";
    description: string;
    exitValuation: number;
    dilutionPercentage: number;
    grossExitValue: number;
    netExitProceeds: number;
    returnMultiple: number;
  };
  maxValue: number;
  selected: boolean;
  onSelect: () => void;
}) {

  const width =
    maxValue > 0
      ? Math.max(
          (scenario.netExitProceeds /
            maxValue) *
            100,
          4
        )
      : 4;

  const isBase =
    scenario.name ===
    "Base";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`
        group
        w-full
        rounded-2xl
        border
        p-5
        text-left
        outline-none
        transition-all
        duration-300
        ease-out
        focus-visible:ring-2
        focus-visible:ring-blue-500
        ${
          selected
            ? `
              border-blue-500
              bg-blue-50
              shadow-md
              ring-1
              ring-blue-500/20
              scale-[1.01]
            `
            : isBase
            ? `
              border-slate-950
              bg-slate-950
              text-white
              hover:-translate-y-1
              hover:shadow-lg
            `
            : `
              border-slate-200
              bg-slate-50
              hover:-translate-y-1
              hover:border-blue-300
              hover:bg-white
              hover:shadow-md
            `
        }
      `}
    >

      <div className="flex items-center justify-between">

        <span
          className={`
            text-xs
            font-black
            uppercase
            tracking-[0.14em]
            ${
              selected
                ? "text-blue-700"
                : isBase
                ? "text-blue-300"
                : "text-slate-500"
            }
          `}
        >
          {scenario.name}
        </span>

        {selected ? (
          <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white">
            SELECTED
          </span>
        ) : (
          isBase && (
            <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white">
              YOUR MODEL
            </span>
          )
        )}

      </div>

      <p
        className={`
          mt-1 text-xs
          ${
            selected
              ? "text-slate-600"
              : isBase
              ? "text-slate-400"
              : "text-slate-500"
          }
        `}
      >
        {scenario.description}
      </p>

      <div className="mt-5">

        <p
          className={`
            text-xs font-semibold
            ${
              selected
                ? "text-slate-500"
                : isBase
                ? "text-slate-500"
                : "text-slate-500"
            }
          `}
        >
          Estimated proceeds
        </p>

        <p
          className={`
            mt-1
            break-words
            text-2xl
            font-black
            ${
              selected
                ? "text-slate-950"
                : isBase
                ? "text-white"
                : "text-slate-950"
            }
          `}
        >
          {formatCurrency(
            scenario.netExitProceeds
          )}
        </p>

      </div>

      {/* ANIMATED VALUE BAR */}

      <div
        className={`
          mt-5
          h-2
          overflow-hidden
          rounded-full
          ${
            selected
              ? "bg-blue-100"
              : isBase
              ? "bg-white/10"
              : "bg-slate-200"
          }
        `}
      >

        <div
          className={`
            h-full
            rounded-full
            transition-all
            duration-700
            ease-out
            ${
              selected
                ? "bg-blue-600"
                : isBase
                ? "bg-blue-400"
                : "bg-blue-500"
            }
          `}
          style={{
            width: `${width}%`,
          }}
        />

      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div>

          <p
            className={`
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.1em]
              ${
                selected
                  ? "text-slate-400"
                  : isBase
                  ? "text-slate-500"
                  : "text-slate-400"
              }
            `}
          >
            Exit valuation
          </p>

          <p
            className={`
              mt-1
              text-sm
              font-bold
              ${
                selected
                  ? "text-slate-900"
                  : isBase
                  ? "text-slate-200"
                  : "text-slate-700"
              }
            `}
          >
            {formatCurrency(
              scenario.exitValuation
            )}
          </p>

        </div>

        <div>

          <p
            className={`
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.1em]
              ${
                selected
                  ? "text-slate-400"
                  : isBase
                  ? "text-slate-500"
                  : "text-slate-400"
              }
            `}
          >
            Return
          </p>

          <p
            className={`
              mt-1
              text-sm
              font-bold
              ${
                selected
                  ? "text-slate-900"
                  : isBase
                  ? "text-white"
                  : "text-slate-700"
              }
            `}
          >
            {formatMultiple(
              scenario.returnMultiple
            )}
          </p>

        </div>

      </div>

      <div
        className={`
          mt-4
          flex
          items-center
          gap-1
          text-[10px]
          font-bold
          ${
            selected
              ? "text-blue-700"
              : isBase
              ? "text-slate-400"
              : "text-slate-400"
          }
        `}
      >
        {selected
          ? "This scenario is active"
          : "Click to model this scenario →"}
      </div>

    </button>
  );
}

/* =============================================================
   JOURNEY STEP
============================================================= */

function JourneyStep({
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
      className={`
        relative
        rounded-2xl
        border
        p-5
        transition-all
        duration-300
        ease-out
        hover:-translate-y-1
        hover:shadow-md
        ${
          highlight
            ? `
              border-slate-950
              bg-slate-950
              text-white
              hover:shadow-lg
            `
            : `
              border-slate-200
              bg-slate-50
              hover:border-blue-200
              hover:bg-white
            `
        }
      `}
    >

      <span
        className={`
          text-[10px]
          font-black
          ${
            highlight
              ? "text-blue-300"
              : "text-blue-600"
          }
        `}
      >
        {number}
      </span>

      <p
        className={`
          mt-3
          text-xs
          font-bold
          uppercase
          tracking-[0.1em]
          ${
            highlight
              ? "text-slate-400"
              : "text-slate-500"
          }
        `}
      >
        {title}
      </p>

      <p
        className={`
          mt-2
          break-words
          text-xl
          font-black
          ${
            highlight
              ? "text-white"
              : "text-slate-950"
          }
        `}
      >
        {value}
      </p>

      <p
        className={`
          mt-1
          text-[11px]
          ${
            highlight
              ? "text-slate-500"
              : "text-slate-500"
          }
        `}
      >
        {description}
      </p>

    </div>
  );
}

/* =============================================================
   BREAKDOWN
============================================================= */

function Breakdown({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      className="
        group
        rounded-2xl
        border border-slate-200
        bg-slate-50
        p-5
        transition-all
        duration-300
        ease-out
        hover:-translate-y-1
        hover:border-blue-200
        hover:bg-white
        hover:shadow-md
      "
    >

      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {helper}
      </p>

    </div>
  );
}

/* =============================================================
   DARK METRIC
============================================================= */

function DarkMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        transition-all
        duration-300
        hover:-translate-y-0.5
      "
    >

      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-bold text-slate-200">
        {value}
      </p>

    </div>
  );
}

/* =============================================================
   COMPARISON ROW
============================================================= */

function ComparisonRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        border-b
        border-slate-100
        pb-3
        transition-all
        duration-200
        hover:border-blue-100
      "
    >

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`
          text-sm
          ${
            strong
              ? "font-black text-slate-950"
              : "font-bold text-slate-600"
          }
        `}
      >
        {value}
      </span>

    </div>
  );
}


/* =============================================================
   FORMATTERS
============================================================= */

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

function formatPercentage(
  value: number,
  maximumFractionDigits = 1
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
      maximumFractionDigits,
    }
  )}%`;
}

function formatMultiple(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "0.0×";
  }

  return `${value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }
  )}×`;
}
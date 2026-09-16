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
  BadgeIndianRupee,
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
  Link2,
  Calculator,
  ReceiptIndianRupee,
  ChevronRight,
  Building2,
  Coins,
  Scale,
  RotateCcw,
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
  calculateAdvancedExit,
  type AdvancedExitInput,
  type ExitScenario,
} from "@/lib/esop/exit";

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
  | "CURRENTLY_VESTED"
  | "EXERCISE_PLAN";

type ExitEditableDraftKey =
  | "exitValuation"
  | "exerciseFMV"
  | "holdingPeriodMonths";

const LOG = "[EVC:EXIT:UI]";
function devLog(event: string, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") console.info(LOG, event, payload ?? {});
}

/* ============================================================
   EXIT PAGE
============================================================ */

export default function ProExitPage() {
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
    connectedGrant,
    setConnectedGrant,
  ] = useState<ActiveConfirmedGrant | null>(
    null
  );

  const [
    grantConnectionLoading,
    setGrantConnectionLoading,
  ] = useState(false);

  const [inputDrafts, setInputDrafts] =
    useState<
      Partial<Record<ExitEditableDraftKey, string>>
    >({});

  /* ==========================================================
     CONFIRMED GRANT -> SHARED PRO MODEL

     Grant facts are source-of-truth facts. Exit assumptions are
     analysis inputs only and never write back to the Grant Vault.
  ========================================================== */

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
         * Exit consumes that connected Vesting state below. It must
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
        /* Exit remains usable in manual/shared-state mode. */
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

  /* ==========================================================
     SCENARIO
  ========================================================== */

  const [
    selectedScenario,
    setSelectedScenario,
  ] = useState<ExitScenario>(
    "Base"
  );

  /* ==========================================================
     CONNECTED DILUTION

     IMPORTANT:
     Exit uses the shared future dilution assumption directly
     from the PRO equity state.

     This keeps the flow consistent:

     Simulator / shared state
          ↓
     futureDilutionPercentage
          ↓
     Dilution
          ↓
     Exit
  ========================================================== */

  const connectedDilutionPercentage =
    normalizeProNumber(
      proState.futureDilutionPercentage
    );

  const hasExercisePlan =
    normalizeProNumber(proState.exercisePlanOptions) > 0;

  const modeledVestedPercentage =
    analysisBasis === "FULL_GRANT"
      ? 100
      : analysisBasis === "CURRENTLY_VESTED"
        ? normalizeProNumber(proState.vestedPercentage)
        : 0;

  const modeledOptions =
    analysisBasis === "EXERCISE_PLAN" && hasExercisePlan
      ? normalizeProNumber(proState.exercisePlanOptions)
      : undefined;

  const modeledExerciseFMV =
    analysisBasis === "EXERCISE_PLAN" && hasExercisePlan
      ? normalizeProNumber(proState.exercisePlanFMV)
      : normalizeProNumber(proState.exerciseFMV);


  /* ==========================================================
     EXIT INPUT
  ========================================================== */

  const exitInputs: AdvancedExitInput =
    useMemo(
      () => ({
        totalShares:
          normalizeProNumber(
            proState.totalCompanyShares
          ),

        esopsGranted:
          normalizeProNumber(
            proState.totalOptions
          ),

        vestedPercentage:
          modeledVestedPercentage,

        modeledOptions,

        strikePrice:
          normalizeProNumber(
            proState.exercisePrice
          ),

        currentValuation:
          normalizeProNumber(
            proState.currentCompanyValuation
          ),

        futureDilutionPercentage:
          connectedDilutionPercentage,

        exitValuation:
          normalizeProNumber(
            proState.exitValuation
          ),

        selectedScenario,

        exerciseFMV:
          modeledExerciseFMV,

        otherAnnualIncome:
          normalizeProNumber(
            proState.otherAnnualIncome
          ),

        holdingPeriodMonths:
          normalizeProNumber(
            proState.holdingPeriodMonths
          ),

        equityType:
          proState.equityType,

        taxRegime:
          proState.taxRegime,
      }),
      [
        proState,
        connectedDilutionPercentage,
        modeledVestedPercentage,
        modeledOptions,
        modeledExerciseFMV,
        selectedScenario,
      ]
    );

  /* ==========================================================
     RESULT
  ========================================================== */

  const result = useMemo(
    () =>
      calculateAdvancedExit(
        exitInputs
      ),
    [exitInputs]
  );

  /* ==========================================================
     EDITABLE INPUT DRAFTS

     These keep fields blank while the user is typing,
     while calculations still receive safe numeric values.
  ========================================================== */

  function toEditableNumber(value: string | number) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (value.trim() === "") {
      return 0;
    }

    const numericValue = Number(value);

    return Number.isFinite(numericValue)
      ? numericValue
      : 0;
  }

  function inputValue(
    field: ExitEditableDraftKey,
    value: number
  ) {
    return inputDrafts[field] ?? String(value);
  }

  function setInputDraft(
    field: ExitEditableDraftKey,
    value: string
  ) {
    setInputDrafts((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function commitInput(
    field: ExitEditableDraftKey
  ) {
    setInputDrafts((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  /* ==========================================================
     RESET EXIT

     Only reset exit-specific assumption.
     Vesting / dilution / tax remain untouched.
  ========================================================== */

  function resetExitAssumption() {
    setInputDrafts({});

    updateProState({
      exitValuation: 500_000_000,
    });

    setSelectedScenario(
      "Base"
    );
  }

  /* ==========================================================
     EXIT VALUATION
  ========================================================== */

  function updateExitValuation(
    value: string
  ) {
    setInputDraft(
      "exitValuation",
      value
    );

    updateProState({
      exitValuation:
        toEditableNumber(
          value
        ),
    });

    setSelectedScenario(
      "Base"
    );
  }

  /* ==========================================================
     HYDRATION
  ========================================================== */

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
            Loading your PRO exit model...
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
            PRO Exit Outcome
          </div>

        </div>

        {/* ======================================================
            TITLE
        ====================================================== */}

        <section className="mt-8">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
              <BadgeIndianRupee size={22} />
            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Final equity outcome
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 md:text-4xl lg:text-5xl">
                What could you actually take home?
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Bring your vesting, dilution, exit and tax assumptions
                together to see how your ESOP position could translate
                into a potential financial outcome.
              </p>

            </div>

          </div>

        </section>

        {/* ======================================================
            CONFIRMED GRANT CONNECTION
        ====================================================== */}

        {(connectedGrant || proState.sourceGrantId) ? (
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
                    {connectedGrant?.companyName ||
                      proState.sourceCompanyName ||
                      "Confirmed ESOP grant"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {formatNumber(
                      normalizeProNumber(
                        proState.totalOptions
                      )
                    )}{" "}
                    options · {formatUnitCurrency(
                      normalizeProNumber(
                        proState.exercisePrice
                      )
                    )}{" "}
                    exercise price · {formatPercentage(
                      normalizeProNumber(
                        proState.vestedPercentage
                      ),
                      1
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
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100"
                >
                  View source grant
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          </section>
        ) : grantConnectionLoading ? (
          <section className="mt-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500 shadow-sm">
              Connecting your confirmed grant...
            </div>
          </section>
        ) : null}

        {/* ======================================================
            DILUTION CONNECTION
        ====================================================== */}

        <section className="mt-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm">
                <Link2 size={16} />
              </div>

              <div>
                <p className="text-sm font-black text-blue-950">
                  Dilution connected
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-900/75">
                  Exit is using the shared relative dilution directly: {formatPercentage(
                    connectedDilutionPercentage,
                    2
                  )}.
                </p>
              </div>
            </div>

            <Link
              href="/pro/dilution"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-black text-blue-700 hover:text-blue-900"
            >
              Open Dilution
              <ArrowUpRight size={13} />
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
                  Choose which option position Exit should model.
                </h2>

                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                  Full Grant models all confirmed options. Currently Vested models only what you have earned today. Exercise Plan models the exact option quantity selected in Exercise Intelligence.
                </p>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[650px]">
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
                    Model all {formatNumber(
                      normalizeProNumber(
                        proState.totalOptions
                      )
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
                    Model only {formatNumber(
                      normalizeProNumber(
                        proState.vestedOptions
                      )
                    )} options earned today.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={!hasExercisePlan}
                  onClick={() => {
                    if (!hasExercisePlan) return;
                    setAnalysisBasis("EXERCISE_PLAN");
                    setSelectedScenario("Base");
                    devLog("exercise_plan_basis_selected", {
                      options: proState.exercisePlanOptions,
                      waitMonths: proState.exercisePlanWaitMonths,
                      fmv: proState.exercisePlanFMV,
                      updatedAt: proState.exercisePlanUpdatedAt,
                    });
                  }}
                  className={`rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    analysisBasis === "EXERCISE_PLAN"
                      ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500/20"
                      : "border-slate-200 bg-slate-50 hover:border-violet-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-950">Exercise plan</span>
                    {analysisBasis === "EXERCISE_PLAN" && (
                      <span className="rounded-full bg-violet-600 px-2 py-1 text-[9px] font-black text-white">ACTIVE</span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    {hasExercisePlan
                      ? `${formatNumber(normalizeProNumber(proState.exercisePlanOptions))} options · Future +${formatNumber(normalizeProNumber(proState.exercisePlanWaitMonths))}m · FMV ${formatUnitCurrency(normalizeProNumber(proState.exercisePlanFMV))}`
                      : "Create an Exercise Intelligence plan first."}
                  </p>
                </button>
              </div>
            </div>

            {analysisBasis ===
              "FULL_GRANT" &&
              normalizeProNumber(
                proState.vestedOptions
              ) <
                normalizeProNumber(
                  proState.totalOptions
                ) && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[10px] font-bold leading-5 text-amber-900">
                    This is a potential future-exit scenario. Only {formatNumber(
                      normalizeProNumber(
                        proState.vestedOptions
                      )
                    )} options are vested today; this model uses the full confirmed grant to show a possible future outcome if the remaining options eventually vest.
                  </p>
                </div>
              )}

            {analysisBasis === "EXERCISE_PLAN" && hasExercisePlan && (
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">Exercise Intelligence plan connected</p>
                    <p className="mt-1 text-xs leading-5 text-violet-950/80">
                      Exit is modeling exactly <strong>{formatNumber(normalizeProNumber(proState.exercisePlanOptions))} options</strong> from your Future +{formatNumber(normalizeProNumber(proState.exercisePlanWaitMonths))}m exercise plan using an exercise FMV of <strong>{formatUnitCurrency(normalizeProNumber(proState.exercisePlanFMV))}</strong>.
                    </p>
                  </div>
                  <Link href="/pro/exercise" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-black text-violet-700 hover:text-violet-900">
                    Open Exercise <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================
            CONNECTIONS
        ====================================================== */}

        <div className="mt-6 flex flex-wrap gap-3">

          <ConnectionBadge
            label="Vesting connected"
            href="/pro/vesting"
          />

          <ConnectionBadge
            label="Dilution connected"
            href="/pro/dilution"
          />

          <ConnectionBadge
            label="Simulator connected"
            href="/pro/simulator"
          />

          <ConnectionBadge
            label="Tax connected"
            href="/pro/tax"
          />

        </div>

        {/* ======================================================
            TOP SNAPSHOT
        ====================================================== */}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <Snapshot
            label="Estimated take-home"
            value={formatCurrency(
              result.estimatedTakeHome
            )}
            description="After exercise + estimated tax"
            icon={<Wallet size={18} />}
            highlight
            onClick={() =>
              scrollToSection(
                "money-journey"
              )
            }
          />

          <Snapshot
            label="Gross exit value"
            value={formatCurrency(
              result.grossExitValue
            )}
            description="Before exercise + tax"
            icon={<TrendingUp size={18} />}
            onClick={() =>
              scrollToSection(
                "money-journey"
              )
            }
          />

          <Snapshot
            label="Estimated tax"
            value={formatCurrency(
              result.estimatedTax
            )}
            description="Exercise + capital gains"
            icon={
              <ReceiptIndianRupee
                size={18}
              />
            }
            onClick={() =>
              scrollToSection(
                "tax-impact"
              )
            }
          />

          <Snapshot
            label="Return multiple"
            value={formatMultiple(
              result.returnMultiple
            )}
            description="Against exercise cost"
            icon={<Target size={18} />}
            onClick={() =>
              scrollToSection(
                "outcome"
              )
            }
          />

        </section>

        {/* ======================================================
            SCENARIO COMPARISON
        ====================================================== */}

        <section className="mt-6">

          <div className="mb-4">

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Scenario engine
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              What happens under different exit outcomes?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a scenario to recalculate the entire Exit model.
            </p>

          </div>

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
                  active={
                    selectedScenario ===
                    scenario.name
                  }
                  onClick={() =>
                    setSelectedScenario(
                      scenario.name
                    )
                  }
                />
              )
            )}

          </div>

        </section>

        {/* ======================================================
            WORKSPACE
        ====================================================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-[410px_minmax(0,1fr)]">

          {/* ====================================================
              LEFT COLUMN
          ==================================================== */}

          <div className="space-y-6">

            {/* ==================================================
                EXIT ASSUMPTIONS
            ================================================== */}

            <Card className="border-slate-200 bg-white shadow-sm">

              <CardHeader>

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <CardTitle className="text-xl font-bold text-slate-950">
                      Exit assumptions
                    </CardTitle>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Your exit valuation is the main variable driving
                      the modeled outcome.
                    </p>

                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <CircleHelp size={17} />
                  </div>

                </div>

              </CardHeader>

              <CardContent className="space-y-6">

                {/* ==================================================
                    EXIT VALUATION
                ================================================== */}

                <div>

                  <div className="flex items-center justify-between gap-3">

                    <Label className="text-sm font-semibold text-slate-900">
                      Exit valuation
                    </Label>

                    <span className="text-xs font-bold text-blue-600">
                      {selectedScenario}
                    </span>

                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Estimated company valuation at the liquidity event.
                  </p>

                  <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">

                    <div className="flex items-center justify-between">

                      <p className="text-xl font-black text-slate-950">
                        {formatCurrency(
                          result.exitValuation
                        )}
                      </p>

                      <p className="text-xs font-semibold text-slate-500">
                        Base:{" "}
                        {formatCurrency(
                          proState.exitValuation
                        )}
                      </p>

                    </div>

                    <input
                      type="range"
                      min="10000000"
                      max="5000000000"
                      step="10000000"
                      value={Math.min(
                        Math.max(
                          proState.exitValuation,
                          10000000
                        ),
                        5000000000
                      )}
                      onChange={(
                        event
                      ) =>
                        updateExitValuation(
                          event.target.value
                        )
                      }
                      className="mt-5 w-full cursor-pointer accent-blue-600"
                    />

                    <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>
                        ₹1 Cr
                      </span>

                      <span>
                        ₹500 Cr
                      </span>
                    </div>

                    <div className="relative mt-4">

                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        ₹
                      </span>

                      <Input
                        type="number"
                        min={0}
                        value={inputValue(
                          "exitValuation",
                          proState.exitValuation
                        )}
                        onChange={(
                          event
                        ) =>
                          updateExitValuation(
                            event.target.value
                          )
                        }
                        onBlur={() =>
                          commitInput("exitValuation")
                        }
                        className="h-11 rounded-xl bg-white pl-8 text-sm font-semibold"
                      />

                    </div>

                  </div>

                </div>

                {/* ==================================================
                    RESET
                ================================================== */}

                <button
                  type="button"
                  onClick={
                    resetExitAssumption
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <RotateCcw
                    size={15}
                  />
                  Reset exit assumption
                </button>

                {/* ==================================================
                    CONNECTED EQUITY
                ================================================== */}

                <div className="space-y-5 border-t border-slate-100 pt-6">

                  <ConnectedField
                    label="Options modeled"
                    value={
                      result.vestedShares
                    }
                    description={
                      analysisBasis === "FULL_GRANT"
                        ? "Full confirmed grant used for this exit scenario"
                        : analysisBasis === "CURRENTLY_VESTED"
                          ? "Currently vested options from your PRO vesting model"
                          : `Exact Exercise Intelligence selection · Future +${formatNumber(normalizeProNumber(proState.exercisePlanWaitMonths))}m`
                    }
                    href={analysisBasis === "EXERCISE_PLAN" ? "/pro/exercise" : "/pro/vesting"}
                  />

                  <ConnectedField
                    label="Exercise price"
                    value={
                      proState.exercisePrice
                    }
                    prefix="₹"
                    description="From your PRO vesting model"
                    href="/pro/vesting"
                  />

                  <ConnectedField
                    label="Modeled dilution"
                    value={
                      connectedDilutionPercentage
                    }
                    suffix="%"
                    description="From your PRO dilution model"
                    href="/pro/dilution"
                  />

                </div>

                {/* ==================================================
                    TAX CONTROLS
                ================================================== */}

                <div
                  id="tax-controls"
                  className="border-t border-slate-100 pt-6"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm font-bold text-slate-950">
                        Tax assumptions
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        These remain shared with the Tax page.
                      </p>

                    </div>

                    <Link
                      href="/pro/tax"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      Open Tax
                    </Link>

                  </div>

                  <div className="mt-4 space-y-4">

                    {/* FMV */}

                    {analysisBasis === "EXERCISE_PLAN" ? (
                      <ConnectedField
                        label="FMV at exercise"
                        description={`From Exercise Intelligence · Future +${formatNumber(normalizeProNumber(proState.exercisePlanWaitMonths))}m`}
                        value={modeledExerciseFMV}
                        prefix="₹"
                        href="/pro/exercise"
                      />
                    ) : (
                      <EditableField
                        label="FMV at exercise"
                        description="Fair market value per share"
                        value={inputValue(
                          "exerciseFMV",
                          proState.exerciseFMV
                        )}
                        prefix="₹"
                        onChange={(value) => {
                          setInputDraft(
                            "exerciseFMV",
                            value
                          );

                          updateProState({
                            exerciseFMV:
                              toEditableNumber(
                                value
                              ),
                          });
                        }}
                        onBlur={() =>
                          commitInput("exerciseFMV")
                        }
                      />
                    )}

                    {/* HOLDING */}

                    <EditableField
                      label="Holding period"
                      description="Months between exercise and sale"
                      value={inputValue(
                        "holdingPeriodMonths",
                        proState.holdingPeriodMonths
                      )}
                      suffix="months"
                      onChange={(value) => {
                        setInputDraft(
                          "holdingPeriodMonths",
                          value
                        );

                        updateProState({
                          holdingPeriodMonths:
                            toEditableNumber(
                              value
                            ),
                        });
                      }}
                      onBlur={() =>
                        commitInput("holdingPeriodMonths")
                      }
                    />

                    {/* EQUITY TYPE */}

                    <div>

                      <Label className="text-xs font-semibold text-slate-700">
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

                    {/* TAX REGIME */}

                    <div>

                      <Label className="text-xs font-semibold text-slate-700">
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
                              taxRegime:
                                "NEW",
                            })
                          }
                        >
                          New
                        </Toggle>

                        <Toggle
                          active={
                            proState.taxRegime ===
                            "OLD"
                          }
                          onClick={() =>
                            updateProState({
                              taxRegime:
                                "OLD",
                            })
                          }
                        >
                          Old
                        </Toggle>

                      </div>

                    </div>

                  </div>

                </div>

                {/* ==================================================
                    TAX CONNECTION
                ================================================== */}

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

                  <div className="flex items-start gap-3">

                    <Link2
                      size={17}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>

                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                        Tax connected
                      </p>

                      <p className="mt-1.5 text-xs leading-5 text-emerald-900/70">
                        Exit uses the same tax assumptions as your
                        PRO Tax model.
                      </p>

                    </div>

                  </div>

                </div>

              </CardContent>

            </Card>

          </div>

          {/* ====================================================
              RIGHT COLUMN
          ==================================================== */}

          <div className="space-y-6">

            {/* ==================================================
                HERO OUTCOME
            ================================================== */}

            <Card
              id="outcome"
              className="overflow-hidden border-slate-950 bg-slate-950 text-white shadow-sm"
            >

              <CardContent className="p-7 md:p-9">

                <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                        {selectedScenario} exit outcome
                      </p>

                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-300">
                        Modeled
                      </span>

                    </div>

                    <h2 className="mt-3 break-words text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                      {formatCurrency(
                        result.estimatedTakeHome
                      )}
                    </h2>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                      Estimated amount you could retain after exercise
                      cost and modeled tax impact.
                    </p>

                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">

                    <DarkMetric
                      label="Gross exit value"
                      value={formatCurrency(
                        result.grossExitValue
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
                        result.estimatedTax
                      )}`}
                    />

                  </div>

                </div>

                <div className="mt-8 border-t border-white/10 pt-6">

                  <div className="grid gap-5 sm:grid-cols-3">

                    <DarkMetric
                      label="Return multiple"
                      value={formatMultiple(
                        result.returnMultiple
                      )}
                    />

                    <DarkMetric
                      label="ROI"
                      value={formatPercentage(
                        result.roiPercentage
                      )}
                    />

                    <DarkMetric
                      label="Exit share price"
                      value={formatCurrency(
                        result.exitSharePriceAfterDilution
                      )}
                    />

                  </div>

                </div>

              </CardContent>

            </Card>

            {/* ==================================================
                INSIGHT
            ================================================== */}

            <ExitInsight
              result={result}
            />

            {/* ==================================================
                MONEY JOURNEY
            ================================================== */}

            <Card
              id="money-journey"
              className="border-slate-200 bg-white shadow-sm"
            >

              <CardHeader>

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Money journey
                </p>

                <CardTitle className="mt-1 text-xl font-bold text-slate-950">
                  Follow the money from exit to take-home
                </CardTitle>

                <p className="mt-1 text-sm text-slate-500">
                  See how the modeled equity value turns into estimated
                  cash you retain.
                </p>

              </CardHeader>

              <CardContent>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

                  <Journey
                    number="01"
                    title="Gross exit"
                    value={formatCurrency(
                      result.grossExitValue
                    )}
                    description="Equity value"
                  />

                  <Journey
                    number="02"
                    title="Exercise"
                    value={`-${formatCurrency(
                      result.exerciseCost
                    )}`}
                    description="Cash required"
                  />

                  <Journey
                    number="03"
                    title="Tax"
                    value={`-${formatCurrency(
                      result.estimatedTax
                    )}`}
                    description="Estimated tax"
                  />

                  <Journey
                    number="04"
                    title="Take-home"
                    value={formatCurrency(
                      result.estimatedTakeHome
                    )}
                    description="Estimated net proceeds"
                    highlight
                  />

                </div>

              </CardContent>

            </Card>

            {/* ==================================================
                BEFORE / AFTER TAX
            ================================================== */}

            <div
              id="tax-impact"
              className="grid gap-6 lg:grid-cols-2"
            >

              <Card className="border-slate-200 bg-white shadow-sm">

                <CardHeader>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Coins size={17} />
                  </div>

                  <CardTitle className="mt-3 text-lg font-bold text-slate-950">
                    Before tax
                  </CardTitle>

                  <p className="text-sm text-slate-500">
                    Your modeled equity economics before taxes.
                  </p>

                </CardHeader>

                <CardContent className="space-y-4">

                  <ComparisonRow
                    label="Gross exit value"
                    value={formatCurrency(
                      result.grossExitValue
                    )}
                  />

                  <ComparisonRow
                    label="Exercise cost"
                    value={`-${formatCurrency(
                      result.exerciseCost
                    )}`}
                  />

                  <ComparisonRow
                    label="Pre-tax proceeds"
                    value={formatCurrency(
                      result.preTaxProceeds
                    )}
                    strong
                  />

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                    <div className="flex items-start gap-3">

                      <Calculator
                        size={17}
                        className="mt-0.5 shrink-0 text-blue-600"
                      />

                      <p className="text-xs leading-5 text-blue-900/80">
                        The Simulator layer produces{" "}
                        <strong>
                          {formatCurrency(
                            result.preTaxProceeds
                          )}
                        </strong>{" "}
                        before the tax layer.
                      </p>

                    </div>

                  </div>

                </CardContent>

              </Card>

              <Card className="border-slate-200 bg-white shadow-sm">

                <CardHeader>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ReceiptIndianRupee size={17} />
                  </div>

                  <CardTitle className="mt-3 text-lg font-bold text-slate-950">
                    After tax
                  </CardTitle>

                  <p className="text-sm text-slate-500">
                    What remains after modeled tax.
                  </p>

                </CardHeader>

                <CardContent className="space-y-4">

                  <ComparisonRow
                    label="Sale value"
                    value={formatCurrency(
                      result.tax.saleValue
                    )}
                  />

                  <ComparisonRow
                    label="Estimated tax"
                    value={`-${formatCurrency(
                      result.estimatedTax
                    )}`}
                  />

                  <ComparisonRow
                    label="Estimated take-home"
                    value={formatCurrency(
                      result.estimatedTakeHome
                    )}
                    strong
                  />

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">

                    <p className="text-xs leading-5 text-emerald-900/80">
                      Effective modeled tax rate:{" "}
                      <strong>
                        {formatPercentage(
                          result.effectiveTaxRate
                        )}
                      </strong>
                    </p>

                  </div>

                </CardContent>

              </Card>

            </div>

            {/* ==================================================
                EXIT ECONOMICS
            ================================================== */}

            <Card className="border-slate-200 bg-white shadow-sm">

              <CardHeader>

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Exit economics
                </p>

                <CardTitle className="mt-1 text-xl font-bold text-slate-950">
                  The numbers behind your outcome
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                  <Breakdown
                    label="Exit valuation"
                    value={formatCurrency(
                      result.exitValuation
                    )}
                    helper={`${selectedScenario} scenario`}
                    icon={
                      <Building2
                        size={16}
                      />
                    }
                  />

                  <Breakdown
                    label={
                      analysisBasis === "FULL_GRANT"
                        ? "Modeled options"
                        : analysisBasis === "CURRENTLY_VESTED"
                          ? "Vested options"
                          : "Exercise-plan options"
                    }
                    value={formatNumber(
                      result.vestedShares
                    )}
                    helper={
                      analysisBasis === "FULL_GRANT"
                        ? "Potential full-grant scenario"
                        : analysisBasis === "CURRENTLY_VESTED"
                          ? "Currently included in exit"
                          : `Exact selection from Future +${formatNumber(normalizeProNumber(proState.exercisePlanWaitMonths))}m plan`
                    }
                    icon={
                      <Target size={16} />
                    }
                  />

                  <Breakdown
                    label="Ownership"
                    value={formatPercentage(
                      result.ownershipPercentage,
                      3
                    )}
                    helper={
                      analysisBasis === "FULL_GRANT"
                        ? "Potential modeled ownership"
                        : analysisBasis === "CURRENTLY_VESTED"
                          ? "Current vested ownership"
                          : "Ownership represented by the selected exercise plan"
                    }
                    icon={
                      <Percent size={16} />
                    }
                  />

                  <Breakdown
                    label="Exit share price"
                    value={formatCurrency(
                      result.exitSharePriceAfterDilution
                    )}
                    helper="After modeled dilution"
                    icon={
                      <Coins size={16} />
                    }
                  />

                  <Breakdown
                    label="Income tax"
                    value={formatCurrency(
                      result.estimatedIncomeTax
                    )}
                    helper="Estimated exercise tax"
                    icon={
                      <ReceiptIndianRupee
                        size={16}
                      />
                    }
                  />

                  <Breakdown
                    label="Capital gains tax"
                    value={formatCurrency(
                      result.estimatedCapitalGainsTax
                    )}
                    helper={
                      result.tax.isLongTerm
                        ? "Modeled long-term"
                        : "Modeled short-term"
                    }
                    icon={
                      <TrendingUp
                        size={16}
                      />
                    }
                  />

                </div>

              </CardContent>

            </Card>

            {/* ==================================================
                DILUTION
            ================================================== */}

            <Card className="border-slate-200 bg-white shadow-sm">

              <CardHeader>

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                      Dilution impact
                    </p>

                    <CardTitle className="mt-1 text-xl font-bold text-slate-950">
                      How future funding changes your exit
                    </CardTitle>

                    <p className="mt-1 text-sm text-slate-500">
                      The same dilution assumption from your PRO
                      Dilution model is applied here.
                    </p>

                  </div>

                  <Link
                    href="/pro/dilution"
                    className="hidden items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 sm:inline-flex"
                  >
                    Open Dilution
                    <ArrowUpRight
                      size={13}
                    />
                  </Link>

                </div>

              </CardHeader>

              <CardContent>

                <div className="grid gap-4 md:grid-cols-3">

                  <Breakdown
                    label="Before dilution"
                    value={formatCurrency(
                      result.exitSharePriceBeforeDilution
                    )}
                    helper="Implied exit share price"
                    icon={
                      <Scale size={16} />
                    }
                  />

                  <Breakdown
                    label="After dilution"
                    value={formatCurrency(
                      result.exitSharePriceAfterDilution
                    )}
                    helper={`${formatPercentage(
                      connectedDilutionPercentage
                    )} modeled dilution`}
                    icon={
                      <GitBranch
                        size={16}
                      />
                    }
                  />

                  <Breakdown
                    label="Value impact"
                    value={formatCurrency(
                      result.dilutionImpact
                    )}
                    helper="Modeled value reduced"
                    icon={
                      <TrendingUp
                        size={16}
                      />
                    }
                  />

                </div>

                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">

                  <div className="flex items-start gap-3">

                    <GitBranch
                      size={17}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-xs leading-5 text-amber-900/80">
                      Dilution does not remove your modeled options.
                      It reduces the modeled ownership value available to
                      those options at exit.
                    </p>

                  </div>

                </div>

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
                Turn your equity model into a complete report.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review vesting, dilution, simulator assumptions,
                exit outcomes and tax estimates together.
              </p>

            </div>

            <Link
              href="/pro/reports"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Explore Reports
              <ArrowUpRight size={16} />
            </Link>

          </div>

        </section>

      </div>

    </main>
  );
}

/* ============================================================
   SCENARIO CARD
============================================================ */

function ScenarioCard({
  scenario,
  active,
  onClick,
}: {
  scenario: {
    name: ExitScenario;
    description: string;
    exitValuation: number;
    dilutionPercentage: number;
    grossExitValue: number;
    estimatedTax: number;
    estimatedTakeHome: number;
    returnMultiple: number;
  };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border p-5 text-left transition duration-200 ${
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-lg"
          : "border-slate-200 bg-white text-slate-950 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      }`}
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <p
            className={`text-xs font-black uppercase tracking-[0.14em] ${
              active
                ? "text-blue-300"
                : "text-blue-600"
            }`}
          >
            {scenario.name}
          </p>

          <p
            className={`mt-1 text-xs ${
              active
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            {scenario.description}
          </p>

        </div>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            active
              ? "bg-white/10 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <ChevronRight
            size={16}
            className="transition group-hover:translate-x-0.5"
          />
        </div>

      </div>

      <p
        className={`mt-5 text-xs font-semibold ${
          active
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        Estimated take-home
      </p>

      <p
        className={`mt-1 text-2xl font-black ${
          active
            ? "text-white"
            : "text-slate-950"
        }`}
      >
        {formatCurrency(
          scenario.estimatedTakeHome
        )}
      </p>

      <div
        className={`mt-4 grid grid-cols-2 gap-3 border-t pt-4 ${
          active
            ? "border-white/10"
            : "border-slate-100"
        }`}
      >

        <div>

          <p
            className={`text-[10px] font-semibold ${
              active
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Exit valuation
          </p>

          <p
            className={`mt-1 text-sm font-bold ${
              active
                ? "text-slate-200"
                : "text-slate-700"
            }`}
          >
            {formatCurrency(
              scenario.exitValuation
            )}
          </p>

        </div>

        <div>

          <p
            className={`text-[10px] font-semibold ${
              active
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Return
          </p>

          <p
            className={`mt-1 text-sm font-bold ${
              active
                ? "text-slate-200"
                : "text-slate-700"
            }`}
          >
            {formatMultiple(
              scenario.returnMultiple
            )}
          </p>

        </div>

      </div>

    </button>
  );
}

/* ============================================================
   CONNECTION BADGE
============================================================ */

function ConnectionBadge({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
    >
      <Link2 size={13} />
      {label}
    </Link>
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
  onClick,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-2xl border p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
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

      <div className="mt-2 flex items-center justify-between gap-2">

        <p
          className={`text-xs ${
            highlight
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          {description}
        </p>

        <ChevronRight
          size={14}
          className={`shrink-0 transition group-hover:translate-x-0.5 ${
            highlight
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        />

      </div>

    </button>
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
  suffix,
  href,
}: {
  label: string;
  description: string;
  value: number;
  prefix?: string;
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
            prefix
              ? "pl-8"
              : ""
          } ${
            suffix
              ? "pr-14"
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
   EDITABLE FIELD
============================================================ */

function EditableField({
  label,
  description,
  value,
  prefix,
  suffix,
  onChange,
  onBlur,
}: {
  label: string;
  description: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  onChange: (
    value: string
  ) => void;
  onBlur?: () => void;
}) {
  return (
    <div>

      <Label className="text-xs font-semibold text-slate-700">
        {label}
      </Label>

      <p className="mt-1 text-[11px] text-slate-500">
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
            onChange(
              event.target.value
            )
          }
          onBlur={onBlur}
          className={`h-10 rounded-xl bg-slate-50 text-sm font-semibold ${
            prefix
              ? "pl-8"
              : ""
          } ${
            suffix
              ? "pr-20"
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
      className={`rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
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

      <p
        className={`mt-1 text-[11px] ${
          highlight
            ? "text-slate-500"
            : "text-slate-500"
        }`}
      >
        {description}
      </p>

    </div>
  );
}

/* ============================================================
   BREAKDOWN
============================================================ */

function Breakdown({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-white hover:shadow-sm">

      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
        {icon}
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
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
   COMPARISON ROW
============================================================ */

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
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm ${
          strong
            ? "font-black text-slate-950"
            : "font-bold text-slate-600"
        }`}
      >
        {value}
      </span>

    </div>
  );
}

/* ============================================================
   EXIT INSIGHT
============================================================ */

function ExitInsight({
  result,
}: {
  result: ReturnType<
    typeof calculateAdvancedExit
  >;
}) {
  if (
    result.status ===
    "underwater"
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

        <div className="flex items-start gap-3">

          <ShieldAlert
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>

            <p className="font-bold text-red-900">
              Your equity assumptions need attention
            </p>

            <p className="mt-1 text-sm leading-6 text-red-800">
              The current implied share value is below the exercise
              price. Review your assumptions before relying on this
              exit scenario.
            </p>

          </div>

        </div>

      </div>
    );
  }

  if (
    result.returnMultiple >=
    5
  ) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

        <div className="flex items-start gap-3">

          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>

            <p className="font-bold text-emerald-900">
              Strong modeled outcome
            </p>

            <p className="mt-1 text-sm leading-6 text-emerald-800">
              Under the selected exit and tax assumptions, your
              estimated take-home is substantially above the capital
              required to exercise.
            </p>

          </div>

        </div>

      </div>
    );
  }

  if (
    result.returnMultiple >=
    2
  ) {
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

            <p className="mt-1 text-sm leading-6 text-blue-900/80">
              Your selected exit scenario produces a positive
              modeled outcome after exercise cost and estimated tax.
            </p>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

      <div className="flex items-start gap-3">

        <AlertTriangle
          size={20}
          className="mt-0.5 shrink-0 text-amber-600"
        />

        <div>

          <p className="font-bold text-amber-900">
            Review this exit scenario carefully
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-900/80">
            Your modeled take-home is relatively close to the capital
            required to exercise. Changes in valuation, dilution or
            tax assumptions could materially change the result.
          </p>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   SCROLL HELPER
============================================================ */

function scrollToSection(
  id: string
) {
  document
    .getElementById(id)
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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

function formatUnitCurrency(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
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
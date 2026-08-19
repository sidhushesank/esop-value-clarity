"use client";

import Link from "next/link";
import {
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

  const {
    proState,
    updateProState,
    resetProState,
    hydrated,
  } = useProEquityState();

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
     CALCULATION INPUTS
  =========================================================== */

  const calculationInputs:
    AdvancedSimulatorInput =
    useMemo(
      () => ({
        ...inputs,

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

      case "vestedPercentage":
        updateProState({
          vestedPercentage:
            clamp(
              safeValue,
              0,
              100
            ),
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
    resetProState();

    setSelectedScenario(
      "Base"
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
            CONNECTION STATUS
        ===================================================== */}

        <section className="mt-6">

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
            SNAPSHOT
        ===================================================== */}

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <SnapshotCard
            label="Ownership"
            value={formatPercentage(
              result.ownershipPercentage,
              3
            )}
            description="Current vested ownership"
            icon={<Percent size={18} />}
          />

          <SnapshotCard
            label="Base-case value"
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

              {/* VESTED PERCENTAGE */}

              <InputField
                label="Vested percentage"
                description="Percentage of your grant currently vested"
                value={
                  inputs.vestedPercentage
                }
                suffix="%"
                onChange={(value) =>
                  updateInput(
                    "vestedPercentage",
                    value
                  )
                }
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
                Reset assumptions
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
                  Your grant, vested position, exercise price, company
                  valuation, future dilution and exit valuation are
                  shared across the PRO equity tools.
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
                      Current vested ownership
                    </p>

                    <p className="mt-1 text-5xl font-black tracking-tight md:text-6xl">
                      {formatPercentage(
                        result.ownershipPercentage,
                        3
                      )}
                    </p>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                      Your current vested position represents this
                      percentage of the modeled fully diluted company.
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
                    title="Vested"
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
                    helper={`${formatPercentage(
                      inputs.vestedPercentage
                    )} of your grant`}
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
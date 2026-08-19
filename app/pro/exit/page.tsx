"use client";

import Link from "next/link";
import {
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

/* ============================================================
   EXIT PAGE
============================================================ */

export default function ProExitPage() {
  const {
    proState,
    updateProState,
    hydrated,
  } = useProEquityState();

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
          connectedDilutionPercentage,

        exitValuation:
          normalizeProNumber(
            proState.exitValuation
          ),

        selectedScenario,

        exerciseFMV:
          normalizeProNumber(
            proState.exerciseFMV
          ),

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
     RESET EXIT

     Only reset exit-specific assumption.
     Vesting / dilution / tax remain untouched.
  ========================================================== */

  function resetExitAssumption() {
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
    updateProState({
      exitValuation:
        normalizeProNumber(
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
                        value={
                          proState.exitValuation
                        }
                        onChange={(
                          event
                        ) =>
                          updateExitValuation(
                            event.target.value
                          )
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
                    label="Vested options"
                    value={
                      result.vestedShares
                    }
                    description="From your PRO vesting model"
                    href="/pro/vesting"
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

                    <EditableField
                      label="FMV at exercise"
                      description="Fair market value per share"
                      value={
                        proState.exerciseFMV
                      }
                      prefix="₹"
                      onChange={(value) =>
                        updateProState({
                          exerciseFMV:
                            normalizeProNumber(
                              value
                            ),
                        })
                      }
                    />

                    {/* HOLDING */}

                    <EditableField
                      label="Holding period"
                      description="Months between exercise and sale"
                      value={
                        proState.holdingPeriodMonths
                      }
                      suffix="months"
                      onChange={(value) =>
                        updateProState({
                          holdingPeriodMonths:
                            normalizeProNumber(
                              value
                            ),
                        })
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
                    label="Vested shares"
                    value={formatNumber(
                      result.vestedShares
                    )}
                    helper="Included in exit"
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
                    helper="Current vested ownership"
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
                      Dilution does not remove your vested options.
                      It changes the modeled share value available to
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
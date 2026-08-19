"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  Coins,
  SlidersHorizontal,
  LineChart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

import {
  useProEquityState,
  normalizeProNumber,
} from "@/lib/esop/pro-state";

/* ============================================================
   TYPES
============================================================ */

type ScenarioKey = "bear" | "base" | "bull";

type Scenario = {
  key: ScenarioKey;
  label: string;
  subtitle: string;
  valuation: number;
  ownership: number;
  grossEquity: number;
  exerciseCost: number;
  proceeds: number;
  returnMultiple: number;
  color: "neutral" | "dark" | "blue";
};

/* ============================================================
   SCENARIO MULTIPLIERS

   Base comes directly from the shared Exit model.

   Bear = 50% of Base
   Base = 100%
   Bull = 200%
============================================================ */

const SCENARIO_MULTIPLIERS = {
  bear: 0.5,
  base: 1,
  bull: 2,
};

/* ============================================================
   PAGE
============================================================ */

export default function ProComparePage() {
  const {
    proState,
    hydrated,
  } = useProEquityState();

  /* ==========================================================
     INTERACTIVE OUTCOME RANGE

     0   = Bear
     50  = Base
     100 = Bull

     IMPORTANT:
     This is LOCAL UI state only.

     It does NOT change:
     - Exit valuation
     - Dilution
     - Vesting
     - Shared PRO state
     - Backend data

     It simply lets the user explore the modeled range.
  ========================================================== */

  const [
    outcomePosition,
    setOutcomePosition,
  ] = useState(50);

  /* ==========================================================
     SHARED MODEL VALUES

     These values are READ from the shared PRO state.

     Compare does NOT write anything back to the shared state.

     This is intentional:

     Vesting
        ↓
     Shared PRO State
        ↓
     Dilution
        ↓
     Shared diluted ownership
        ↓
     Simulator / Exit
        ↓
     Shared exit valuation
        ↓
     Compare
  ========================================================== */

  const baseExitValuation =
    normalizeProNumber(
      proState.exitValuation
    ) > 0
      ? normalizeProNumber(
          proState.exitValuation
        )
      : 0;

  const vestedOptions =
    Math.max(
      0,
      normalizeProNumber(
        proState.vestedOptions
      )
    );

  const totalCompanyShares =
    Math.max(
      0,
      normalizeProNumber(
        proState.totalCompanyShares
      )
    );

  const exercisePrice =
    Math.max(
      0,
      normalizeProNumber(
        proState.exercisePrice
      )
    );

  const futureDilutionPercentage =
    Math.min(
      100,
      Math.max(
        0,
        normalizeProNumber(
          proState.futureDilutionPercentage
        )
      )
    );

  /* ==========================================================
     CURRENT OWNERSHIP
  ========================================================== */

  const currentOwnership =
    useMemo(() => {
      if (
        totalCompanyShares <= 0 ||
        vestedOptions <= 0
      ) {
        return 0;
      }

      return (
        (vestedOptions /
          totalCompanyShares) *
        100
      );
    }, [
      vestedOptions,
      totalCompanyShares,
    ]);

  /* ==========================================================
     DILUTED OWNERSHIP
  ========================================================== */

  const dilutedOwnership =
    useMemo(() => {
      const sharedDilutedOwnership =
        normalizeProNumber(
          proState.dilutedOwnershipPercentage
        );

      if (
        sharedDilutedOwnership > 0
      ) {
        return Math.max(
          0,
          Math.min(
            100,
            sharedDilutedOwnership
          )
        );
      }

      if (
        currentOwnership > 0
      ) {
        return (
          currentOwnership *
          (
            1 -
            futureDilutionPercentage /
              100
          )
        );
      }

      return 0;
    }, [
      proState.dilutedOwnershipPercentage,
      currentOwnership,
      futureDilutionPercentage,
    ]);

  /* ==========================================================
     SCENARIOS
  ========================================================== */

  const scenarios =
    useMemo<Scenario[]>(() => {
      return (
        [
          {
            key: "bear" as const,
            label: "BEAR",
            subtitle:
              "Lower-growth outcome",
            multiplier:
              SCENARIO_MULTIPLIERS.bear,
            color:
              "neutral" as const,
          },

          {
            key: "base" as const,
            label: "BASE",
            subtitle:
              "Your current assumption",
            multiplier:
              SCENARIO_MULTIPLIERS.base,
            color:
              "dark" as const,
          },

          {
            key: "bull" as const,
            label: "BULL",
            subtitle:
              "Strong-growth outcome",
            multiplier:
              SCENARIO_MULTIPLIERS.bull,
            color:
              "blue" as const,
          },
        ].map(
          (scenario) => {
            const valuation =
              baseExitValuation *
              scenario.multiplier;

            const ownership =
              dilutedOwnership;

            const grossEquity =
              valuation *
              (ownership / 100);

            const exerciseCost =
              vestedOptions *
              exercisePrice;

            const proceeds =
              Math.max(
                0,
                grossEquity -
                  exerciseCost
              );

            const returnMultiple =
              exerciseCost > 0
                ? proceeds /
                  exerciseCost
                : 0;

            return {
              key: scenario.key,

              label:
                scenario.label,

              subtitle:
                scenario.subtitle,

              valuation,

              ownership,

              grossEquity,

              exerciseCost,

              proceeds,

              returnMultiple,

              color:
                scenario.color,
            };
          }
        )
      );
    }, [
      baseExitValuation,
      dilutedOwnership,
      vestedOptions,
      exercisePrice,
    ]);

  /* ==========================================================
     SCENARIO REFERENCES
  ========================================================== */

  const bear =
    scenarios[0];

  const base =
    scenarios[1];

  const bull =
    scenarios[2];

  /* ==========================================================
     RANGE
  ========================================================== */

  /*
   * This remains the REAL Bear → Bull spread.
   *
   * Example:
   *
   * Bull ₹65,05,000
   * - Bear ₹15,32,500
   * = ₹49,72,500
   *
   * The slider below does NOT replace this number.
   */

  const outcomeRange =
    Math.max(
      0,
      bull.proceeds -
        bear.proceeds
    );

  const baseToBullIncrease =
    Math.max(
      0,
      bull.proceeds -
        base.proceeds
    );

  const bearToBaseIncrease =
    Math.max(
      0,
      base.proceeds -
        bear.proceeds
    );

  /* ==========================================================
     SELECTED OUTCOME

     The slider is piecewise:

     Bear → Base
     Base → Bull

     This guarantees that:

     0%   = exact Bear
     50%  = exact Base
     100% = exact Bull
  ========================================================== */

  const selectedOutcome =
    useMemo(() => {
      const position =
        Math.max(
          0,
          Math.min(
            100,
            outcomePosition
          )
        );

      if (position <= 50) {
        const progress =
          position / 50;

        const valuation =
          bear.valuation +
          (
            base.valuation -
            bear.valuation
          ) *
            progress;

        const proceeds =
          bear.proceeds +
          (
            base.proceeds -
            bear.proceeds
          ) *
            progress;

        const grossEquity =
          bear.grossEquity +
          (
            base.grossEquity -
            bear.grossEquity
          ) *
            progress;

        return {
          label:
            position === 0
              ? "BEAR"
              : position === 50
                ? "BASE"
                : "CUSTOM",

          valuation,
          grossEquity,
          proceeds,
        };
      }

      const progress =
        (position - 50) / 50;

      const valuation =
        base.valuation +
        (
          bull.valuation -
          base.valuation
        ) *
          progress;

      const proceeds =
        base.proceeds +
        (
          bull.proceeds -
          base.proceeds
        ) *
          progress;

      const grossEquity =
        base.grossEquity +
        (
          bull.grossEquity -
          base.grossEquity
        ) *
          progress;

      return {
        label:
          position === 100
            ? "BULL"
            : "CUSTOM",

        valuation,
        grossEquity,
        proceeds,
      };
    }, [
      outcomePosition,

      bear.valuation,
      bear.grossEquity,
      bear.proceeds,

      base.valuation,
      base.grossEquity,
      base.proceeds,

      bull.valuation,
      bull.grossEquity,
      bull.proceeds,
    ]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-50">

        <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-8">

          <div className="animate-pulse space-y-6">

            <div className="h-10 w-64 rounded-xl bg-slate-200" />

            <div className="h-64 rounded-3xl bg-white" />

            <div className="grid gap-5 md:grid-cols-3">

              <div className="h-72 rounded-3xl bg-white" />

              <div className="h-72 rounded-3xl bg-white" />

              <div className="h-72 rounded-3xl bg-white" />

            </div>

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

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 shadow-sm">

            <Sparkles size={14} />

            PRO Compare

          </div>

        </div>

        {/* ======================================================
            HERO
        ====================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
          }}
          className="relative mt-7 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
        >

          <div className="pointer-events-none absolute inset-0 overflow-hidden">

            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />

            <div className="absolute bottom-[-120px] left-[40%] h-72 w-72 rounded-full bg-indigo-100/40 blur-3xl" />

          </div>

          <div className="relative grid gap-10 p-7 md:p-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:p-12">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">

                <BarChart3 size={14} />

                Equity outcome comparison

              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-slate-950 md:text-6xl lg:text-7xl">

                See the range.

                <br />

                <span className="text-blue-600">
                  Understand the trade-off.
                </span>

              </h1>

              <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600 md:text-lg">

                Compare how different company exit outcomes
                could change the modeled value of your ESOP.
                Your shared PRO equity assumptions flow through
                the entire analysis.

              </p>

              <div className="mt-7 flex flex-wrap gap-3">

                <HeroStat
                  label="Current ownership"
                  value={formatPercentage(
                    currentOwnership
                  )}
                />

                <HeroStat
                  label="After dilution"
                  value={formatPercentage(
                    dilutedOwnership
                  )}
                  active
                />

                <HeroStat
                  label="Exercise cost"
                  value={formatCurrency(
                    bear.exerciseCost
                  )}
                />

              </div>

            </div>

            <div className="relative hidden min-h-[300px] lg:block">

              <div className="absolute inset-0 flex items-center justify-center">

                <div className="relative h-[250px] w-[360px]">

                  <motion.div
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute left-0 top-8 w-44 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
                  >

                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Bear
                    </p>

                    <p className="mt-2 text-xl font-black text-slate-950">
                      {formatCurrency(
                        bear.proceeds
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Pre-tax proceeds
                    </p>

                  </motion.div>

                  <motion.div
                    animate={{
                      y: [0, -14, 0],
                    }}
                    transition={{
                      duration: 4,
                      delay: 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute left-[105px] top-[78px] z-10 w-52 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl"
                  >

                    <div className="flex items-center justify-between">

                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-300">
                        Base
                      </p>

                      <Check
                        size={15}
                        className="text-blue-300"
                      />

                    </div>

                    <p className="mt-2 text-2xl font-black">
                      {formatCurrency(
                        base.proceeds
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Current assumption
                    </p>

                  </motion.div>

                  <motion.div
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 4,
                      delay: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute right-0 top-8 w-44 rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-xl"
                  >

                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                      Bull
                    </p>

                    <p className="mt-2 text-xl font-black text-slate-950">
                      {formatCurrency(
                        bull.proceeds
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Pre-tax proceeds
                    </p>

                  </motion.div>

                  <div className="absolute bottom-0 left-[90px] right-[70px] h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />

                </div>

              </div>

            </div>

          </div>

          <div className="relative border-t border-slate-100 bg-slate-50/70 px-7 py-5 md:px-10">

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-3">

                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.08)]" />

                <div>

                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                    Connected model
                  </p>

                  <p className="mt-1 text-xs text-slate-500">

                    Vesting, ownership, dilution and exit
                    assumptions are being read from your
                    shared PRO equity state.

                  </p>

                </div>

              </div>

              <div className="text-xs font-semibold text-slate-400">

                Base exit valuation:{" "}

                <span className="font-black text-slate-700">

                  {formatCurrency(
                    baseExitValuation
                  )}

                </span>

              </div>

            </div>

          </div>

        </motion.section>

        {/* ======================================================
            SNAPSHOT
        ====================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.15,
            duration: 0.5,
          }}
          className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >

          <Snapshot
            label="Vested options"
            value={formatNumber(
              vestedOptions
            )}
            description="Currently vested in your grant"
            icon={<Coins size={18} />}
          />

          <Snapshot
            label="Current ownership"
            value={formatPercentage(
              currentOwnership
            )}
            description="Before modeled dilution"
            icon={
              <SlidersHorizontal
                size={18}
              />
            }
          />

          <Snapshot
            label="After dilution"
            value={formatPercentage(
              dilutedOwnership
            )}
            description="Modeled post-dilution ownership"
            icon={
              <TrendingDown
                size={18}
              />
            }
            highlight
          />

          <Snapshot
            label="Exercise cost"
            value={formatCurrency(
              bear.exerciseCost
            )}
            description="Cash required to exercise"
            icon={
              <CircleDollarSign
                size={18}
              />
            }
          />

        </motion.section>

        {/* ======================================================
            SCENARIOS
        ====================================================== */}

        <section className="mt-12">

          <SectionHeading
            eyebrow="Three possible outcomes"
            title="What could your equity look like?"
            description="Same equity model. Different exit outcomes."
          />

          <div className="mt-6 grid gap-5 lg:grid-cols-3">

            {scenarios.map(
              (scenario, index) => (
                <ScenarioCard
                  key={scenario.key}
                  scenario={scenario}
                  index={index}
                />
              )
            )}

          </div>

        </section>

        {/* ======================================================
            INTERACTIVE OUTCOME RANGE
        ====================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.5,
          }}
          className="mt-8 rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm md:p-9"
        >

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                Outcome range
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Your modeled equity range
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Explore the modeled value between the
                lower-growth and strong-growth scenarios.
              </p>

            </div>

            <div className="text-right">

              <p className="text-xs font-semibold text-slate-400">
                Bear → Bull range
              </p>

              <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                {formatCurrency(
                  outcomeRange
                )}
              </p>

            </div>

          </div>

          {/* ==================================================
              SELECTED OUTCOME
          ================================================== */}

          <motion.div
            layout
            className="mt-7 rounded-2xl border border-blue-100 bg-blue-50/60 p-5"
          >

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_5px_rgba(37,99,235,0.08)]" />

                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
                    Selected outcome
                  </p>

                  <span className="rounded-full border border-blue-100 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-blue-700">
                    {selectedOutcome.label}
                  </span>

                </div>

                <motion.p
                  key={Math.round(
                    selectedOutcome.proceeds
                  )}
                  initial={{
                    opacity: 0.5,
                    y: 3,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-2 text-2xl font-black tracking-tight text-slate-950"
                >
                  {formatCurrency(
                    selectedOutcome.proceeds
                  )}
                </motion.p>

                <p className="mt-1 text-xs text-slate-500">
                  Estimated pre-tax proceeds
                </p>

              </div>

              <div className="sm:text-right">

                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Modeled exit valuation
                </p>

                <motion.p
                  key={Math.round(
                    selectedOutcome.valuation
                  )}
                  initial={{
                    opacity: 0.5,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  className="mt-1 text-lg font-black text-slate-950"
                >
                  {formatCurrency(
                    selectedOutcome.valuation
                  )}
                </motion.p>

                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  Drag the marker below to explore
                </p>

              </div>

            </div>

          </motion.div>

          {/* ==================================================
              INTERACTIVE RANGE
          ================================================== */}

          <div className="mt-10">

            <div className="relative px-2">

              {/* Track */}

              <div className="relative h-3 rounded-full bg-slate-100">

                {/* Full modeled range */}

                <div className="absolute left-0 top-0 h-3 w-full rounded-full bg-gradient-to-r from-slate-300 via-blue-400 to-blue-600" />

                {/* Selected progress */}

                <motion.div
                  className="absolute left-0 top-0 h-3 rounded-full bg-blue-600/80"
                  animate={{
                    width: `${outcomePosition}%`,
                  }}
                  transition={{
                    duration: 0.12,
                    ease: "easeOut",
                  }}
                />

              </div>

              {/* ==================================================
                  BEAR MARKER
              ================================================== */}

              <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2">

                <div className="h-5 w-5 rounded-full border-4 border-slate-200 bg-white" />

                <div className="absolute left-0 top-8">

                  <p className="text-[10px] font-black text-slate-400">
                    BEAR
                  </p>

                  <p className="mt-1 whitespace-nowrap text-sm font-black text-slate-950">
                    {formatCurrency(
                      bear.proceeds
                    )}
                  </p>

                </div>

              </div>

              {/* ==================================================
                  BASE MARKER
              ================================================== */}

              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

                <div className="h-5 w-5 rounded-full border-4 border-blue-500 bg-white shadow-[0_0_0_5px_rgba(37,99,235,0.10)]" />

                <div className="absolute left-1/2 top-8 -translate-x-1/2 text-center">

                  <p className="text-[10px] font-black text-blue-600">
                    BASE
                  </p>

                  <p className="mt-1 whitespace-nowrap text-sm font-black text-slate-950">
                    {formatCurrency(
                      base.proceeds
                    )}
                  </p>

                </div>

              </div>

              {/* ==================================================
                  BULL MARKER
              ================================================== */}

              <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">

                <div className="h-5 w-5 rounded-full border-4 border-slate-200 bg-white" />

                <div className="absolute right-0 top-8 text-right">

                  <p className="text-[10px] font-black text-slate-400">
                    BULL
                  </p>

                  <p className="mt-1 whitespace-nowrap text-sm font-black text-slate-950">
                    {formatCurrency(
                      bull.proceeds
                    )}
                  </p>

                </div>

              </div>

              {/* ==================================================
                  REAL RANGE INPUT

                  Native HTML range input.
                  No package required.
              ================================================== */}

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={outcomePosition}
                onChange={(event) =>
                  setOutcomePosition(
                    Number(
                      event.target.value
                    )
                  )
                }
                aria-label="Explore modeled equity outcome"
                className="absolute left-0 top-1/2 z-30 h-10 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent opacity-0"
              />

              {/* ==================================================
                  CUSTOM DRAG HANDLE
              ================================================== */}

              <motion.div
                className="pointer-events-none absolute top-1/2 z-20 -translate-y-1/2"
                animate={{
                  left: `${outcomePosition}%`,
                }}
                transition={{
                  duration: 0.12,
                  ease: "easeOut",
                }}
                style={{
                  marginLeft:
                    outcomePosition === 0
                      ? "0px"
                      : outcomePosition === 100
                        ? "-20px"
                        : "-10px",
                }}
              >

                <motion.div
                  animate={{
                    scale:
                      outcomePosition ===
                      50
                        ? [1, 1.08, 1]
                        : 1,
                  }}
                  transition={{
                    duration: 1.8,
                    repeat:
                      outcomePosition ===
                      50
                        ? Infinity
                        : 0,
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded-full border-4 border-slate-950 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.18),0_0_0_5px_rgba(37,99,235,0.10)]"
                >

                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                </motion.div>

              </motion.div>

            </div>

            {/* ==================================================
                HELPER
            ================================================== */}

            <div className="mt-16 flex items-center justify-between gap-4">

              <p className="text-xs font-semibold text-slate-400">
                Lower-growth
              </p>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">

                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Drag to explore
                </span>

              </div>

              <p className="text-xs font-semibold text-slate-400">
                Strong-growth
              </p>

            </div>

          </div>

        </motion.section>

        {/* ======================================================
            VALUE COMPARISON
        ====================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.15,
          }}
          transition={{
            duration: 0.5,
          }}
          className="mt-8 rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm md:p-9"
        >

          <SectionHeading
            eyebrow="Value comparison"
            title="How the outcomes move"
            description="The same ownership stake behaves very differently as the exit valuation changes."
          />

          <div className="mt-8 space-y-6">

            <ComparisonBar
              label="BEAR"
              value={bear.proceeds}
              max={bull.proceeds}
              tone="light"
            />

            <ComparisonBar
              label="BASE"
              value={base.proceeds}
              max={bull.proceeds}
              tone="dark"
              delta={
                bearToBaseIncrease
              }
            />

            <ComparisonBar
              label="BULL"
              value={bull.proceeds}
              max={bull.proceeds}
              tone="blue"
              delta={
                baseToBullIncrease
              }
            />

          </div>

        </motion.section>

        {/* ======================================================
            MONEY STORY
        ====================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 24,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.12,
          }}
          transition={{
            duration: 0.55,
          }}
          className="mt-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"
        >

          <div className="border-b border-slate-100 px-7 py-8 md:px-9">

            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              The money story
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Follow the value through each scenario.
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">

              See exactly how the exit valuation flows through
              your ownership, exercise cost and estimated
              pre-tax proceeds.

            </p>

          </div>

          <div className="grid border-b border-slate-100 lg:grid-cols-3">

            <MoneyStoryHeader
              scenario={bear}
            />

            <MoneyStoryHeader
              scenario={base}
              active
            />

            <MoneyStoryHeader
              scenario={bull}
            />

          </div>

          <div className="grid lg:grid-cols-3">

            <MoneyStoryColumn
              scenario={bear}
            />

            <MoneyStoryColumn
              scenario={base}
              active
            />

            <MoneyStoryColumn
              scenario={bull}
            />

          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 px-7 py-6 md:px-9">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">

                  <Wallet size={18} />

                </div>

                <div>

                  <p className="text-sm font-bold text-slate-950">
                    Your exercise cost stays the same.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">

                    What changes dramatically is the value
                    of the ownership you exercise against
                    each exit outcome.

                  </p>

                </div>

              </div>

              <div className="rounded-2xl border border-blue-100 bg-white px-5 py-3 shadow-sm">

                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Bull vs Bear
                </p>

                <p className="mt-1 text-xl font-black text-slate-950">

                  +{formatCurrency(
                    outcomeRange
                  )}

                </p>

              </div>

            </div>

          </div>

        </motion.section>

        {/* ======================================================
            WHAT MATTERS MOST
        ====================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.15,
          }}
          transition={{
            duration: 0.5,
          }}
          className="mt-8 overflow-hidden rounded-[30px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50"
        >

          <div className="grid gap-8 p-7 md:p-9 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                What matters most
              </p>

              <h2 className="mt-2 max-w-4xl text-3xl font-black tracking-tight text-slate-950 md:text-4xl">

                Exit valuation is the biggest driver in this comparison.

              </h2>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">

                Your modeled ownership remains the same across
                these scenarios. What changes is the value of
                that ownership as the company exit valuation
                changes. That's why a diluted percentage does
                not tell the whole ESOP story.

              </p>

            </div>

            <div className="min-w-[220px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <p className="text-xs font-bold text-slate-400">
                Base → Bull
              </p>

              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">

                +{formatCurrency(
                  baseToBullIncrease
                )}

              </p>

              <p className="mt-1 text-xs text-slate-500">
                modeled additional proceeds
              </p>

            </div>

          </div>

        </motion.section>

        {/* ======================================================
            DECISION SNAPSHOT
        ====================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            scale: 0.98,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
          }}
          viewport={{
            once: true,
            amount: 0.15,
          }}
          transition={{
            duration: 0.55,
          }}
          className="mt-8 overflow-hidden rounded-[30px] bg-slate-950 text-white shadow-xl"
        >

          <div className="p-7 md:p-9 lg:p-10">

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                  Decision snapshot
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                  Your modeled outcome range
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">

                  This is the range produced by the three
                  exit scenarios using your current PRO equity
                  assumptions.

                </p>

              </div>

              <div className="lg:text-right">

                <p className="text-xs font-semibold text-slate-500">
                  Bear → Bull
                </p>

                <div className="mt-1 flex items-center gap-3 lg:justify-end">

                  <span className="text-3xl font-black md:text-4xl">

                    {formatCurrency(
                      bear.proceeds
                    )}

                  </span>

                  <ArrowRight
                    size={24}
                    className="text-slate-600"
                  />

                  <span className="text-3xl font-black text-blue-300 md:text-4xl">

                    {formatCurrency(
                      bull.proceeds
                    )}

                  </span>

                </div>

              </div>

            </div>

            <div className="mt-9 grid gap-4 md:grid-cols-3">

              <DecisionCard
                label="Lower outcome"
                value={bear.proceeds}
              />

              <DecisionCard
                label="Current base"
                value={base.proceeds}
                active
              />

              <DecisionCard
                label="Strong outcome"
                value={bull.proceeds}
              />

            </div>

          </div>

        </motion.section>

        {/* ======================================================
            NEXT STEP
        ====================================================== */}

        <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-6 p-7 md:p-9 lg:flex-row lg:items-center">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                Next layer
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Turn this comparison into a complete report.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Review your modeled equity journey in one place.
              </p>

            </div>

            <Link
              href="/pro/reports"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >

              Open Reports

              <ArrowRight size={16} />

            </Link>

          </div>

        </section>

      </div>

    </main>
  );
}

/* ============================================================
   HERO STAT
============================================================ */

function HeroStat({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        active
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-white"
      }`}
    >

      <p
        className={`text-[10px] font-black uppercase tracking-[0.12em] ${
          active
            ? "text-slate-400"
            : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-black ${
          active
            ? "text-white"
            : "text-slate-950"
        }`}
      >
        {value}
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
    <motion.div
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.2,
      }}
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-white"
      }`}
    >

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          highlight
            ? "bg-white/10 text-blue-300"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-4 text-[10px] font-black uppercase tracking-[0.12em] ${
          highlight
            ? "text-slate-400"
            : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black tracking-tight ${
          highlight
            ? "text-white"
            : "text-slate-950"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-1 text-xs ${
          highlight
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        {description}
      </p>

    </motion.div>
  );
}

/* ============================================================
   SECTION HEADING
============================================================ */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>

      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}

/* ============================================================
   SCENARIO CARD
============================================================ */

function ScenarioCard({
  scenario,
  index,
}: {
  scenario: Scenario;
  index: number;
}) {
  const isBase =
    scenario.key === "base";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 24,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        delay: index * 0.08,
        duration: 0.45,
      }}
      whileHover={{
        y: -5,
      }}
      className={`overflow-hidden rounded-[24px] border shadow-sm ${
        isBase
          ? "border-slate-950 bg-slate-950 text-white shadow-lg"
          : scenario.key === "bull"
            ? "border-blue-100 bg-white"
            : "border-slate-200 bg-white"
      }`}
    >

      <div className="p-6 md:p-7">

        <div className="flex items-start justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">

              <p
                className={`text-xs font-black uppercase tracking-[0.16em] ${
                  isBase
                    ? "text-blue-300"
                    : "text-blue-600"
                }`}
              >
                {scenario.label}
              </p>

              {isBase && (
                <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-blue-300">
                  Current
                </span>
              )}

            </div>

            <p
              className={`mt-2 text-sm ${
                isBase
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              {scenario.subtitle}
            </p>

          </div>

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              isBase
                ? "bg-white/10 text-blue-300"
                : scenario.key === "bull"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-slate-100 text-slate-500"
            }`}
          >

            {scenario.key === "bear" ? (
              <TrendingDown size={18} />
            ) : scenario.key === "bull" ? (
              <TrendingUp size={18} />
            ) : (
              <LineChart size={18} />
            )}

          </div>

        </div>

        <div className="mt-9">

          <p
            className={`text-xs font-semibold ${
              isBase
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Exit valuation
          </p>

          <p
            className={`mt-2 text-3xl font-black tracking-tight ${
              isBase
                ? "text-white"
                : "text-slate-950"
            }`}
          >
            {formatCurrency(
              scenario.valuation
            )}
          </p>

        </div>

        <div className="mt-6 border-t pt-5">

          <p
            className={`text-xs font-semibold ${
              isBase
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Pre-tax modeled proceeds
          </p>

          <p
            className={`mt-1 text-3xl font-black tracking-tight ${
              isBase
                ? "text-white"
                : "text-slate-950"
            }`}
          >
            {formatCurrency(
              scenario.proceeds
            )}
          </p>

        </div>

        <div className="mt-7 space-y-4">

          <MiniMetric
            label="Gross equity"
            value={formatCurrency(
              scenario.grossEquity
            )}
            dark={isBase}
          />

          <MiniMetric
            label="Exercise cost"
            value={`-${formatCurrency(
              scenario.exerciseCost
            )}`}
            dark={isBase}
          />

          <MiniMetric
            label="Return multiple"
            value={formatMultiple(
              scenario.returnMultiple
            )}
            dark={isBase}
            strong
          />

        </div>

        <div
          className={`mt-6 h-1 rounded-full ${
            isBase
              ? "bg-white/10"
              : "bg-slate-100"
          }`}
        >

          <motion.div
            initial={{
              width: 0,
            }}
            whileInView={{
              width: "100%",
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.8,
              delay:
                indexDelay(
                  scenario.key
                ),
            }}
            className={`h-full rounded-full ${
              isBase
                ? "bg-blue-400"
                : scenario.key === "bull"
                  ? "bg-blue-600"
                  : "bg-slate-300"
            }`}
          />

        </div>

      </div>

    </motion.div>
  );
}

/* ============================================================
   MINI METRIC
============================================================ */

function MiniMetric({
  label,
  value,
  dark = false,
  strong = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span
        className={`text-xs ${
          dark
            ? "text-slate-500"
            : "text-slate-500"
        }`}
      >
        {label}
      </span>

      <span
        className={`text-sm ${
          strong
            ? "font-black"
            : "font-bold"
        } ${
          dark
            ? "text-slate-200"
            : "text-slate-900"
        }`}
      >
        {value}
      </span>

    </div>
  );
}

/* ============================================================
   COMPARISON BAR
============================================================ */

function ComparisonBar({
  label,
  value,
  max,
  tone,
  delta,
}: {
  label: string;
  value: number;
  max: number;
  tone: "light" | "dark" | "blue";
  delta?: number;
}) {
  const width =
    max > 0
      ? Math.max(
          4,
          (value / max) *
            100
        )
      : 0;

  return (
    <div>

      <div className="mb-2 flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <span className="text-xs font-black text-slate-400">
            {label}
          </span>

          {delta !== undefined &&
            delta > 0 && (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">

                +{formatCurrency(
                  delta
                )}

              </span>
            )}

        </div>

        <span className="text-sm font-black text-slate-950">

          {formatCurrency(
            value
          )}

        </span>

      </div>

      <div className="h-4 overflow-hidden rounded-full bg-slate-100">

        <motion.div
          initial={{
            width: 0,
          }}
          whileInView={{
            width: `${width}%`,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          className={`h-full rounded-full ${
            tone === "dark"
              ? "bg-slate-950"
              : tone === "blue"
                ? "bg-blue-600"
                : "bg-slate-300"
          }`}
        />

      </div>

    </div>
  );
}

/* ============================================================
   MONEY STORY HEADER
============================================================ */

function MoneyStoryHeader({
  scenario,
  active = false,
}: {
  scenario: Scenario;
  active?: boolean;
}) {
  return (
    <div
      className={`border-b p-6 md:p-7 ${
        active
          ? "bg-slate-950 text-white"
          : "bg-white"
      }`}
    >

      <div className="flex items-center justify-between gap-4">

        <div>

          <div className="flex items-center gap-2">

            <p
              className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                active
                  ? "text-blue-300"
                  : "text-blue-600"
              }`}
            >
              {scenario.label}
            </p>

            {active && (
              <span className="rounded-full bg-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-blue-300">
                Current
              </span>
            )}

          </div>

          <p
            className={`mt-1 text-xs ${
              active
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            {scenario.subtitle}
          </p>

        </div>

        {active ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-blue-300">

            <Check size={16} />

          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">

            <LineChart size={16} />

          </div>
        )}

      </div>

    </div>
  );
}

/* ============================================================
   MONEY STORY COLUMN
============================================================ */

function MoneyStoryColumn({
  scenario,
  active = false,
}: {
  scenario: Scenario;
  active?: boolean;
}) {
  return (
    <div
      className={`relative p-6 md:p-7 ${
        active
          ? "bg-slate-950"
          : "bg-white"
      }`}
    >

      <MoneyFlowItem
        step="01"
        label="Exit valuation"
        value={formatCurrency(
          scenario.valuation
        )}
        icon={
          <TrendingUp size={15} />
        }
        active={active}
      />

      <MoneyFlowConnector
        active={active}
      />

      <MoneyFlowItem
        step="02"
        label="Gross equity"
        value={formatCurrency(
          scenario.grossEquity
        )}
        icon={
          <Wallet size={15} />
        }
        active={active}
      />

      <MoneyFlowConnector
        active={active}
      />

      <MoneyFlowItem
        step="03"
        label="Exercise cost"
        value={`-${formatCurrency(
          scenario.exerciseCost
        )}`}
        icon={
          <CircleDollarSign
            size={15}
          />
        }
        active={active}
        negative
      />

      <MoneyFlowConnector
        active={active}
      />

      <div
        className={`rounded-2xl border p-5 ${
          active
            ? "border-blue-400/30 bg-white/5"
            : "border-blue-100 bg-blue-50/50"
        }`}
      >

        <p
          className={`text-[10px] font-black uppercase tracking-[0.12em] ${
            active
              ? "text-blue-300"
              : "text-blue-600"
          }`}
        >
          04 · Pre-tax proceeds
        </p>

        <p
          className={`mt-2 text-2xl font-black tracking-tight md:text-3xl ${
            active
              ? "text-white"
              : "text-slate-950"
          }`}
        >
          {formatCurrency(
            scenario.proceeds
          )}
        </p>

        <p
          className={`mt-1 text-xs ${
            active
              ? "text-slate-500"
              : "text-slate-500"
          }`}
        >
          Estimated amount remaining after exercise cost
        </p>

        <div className="mt-4 flex items-center gap-2">

          <Zap
            size={13}
            className={
              active
                ? "text-blue-300"
                : "text-blue-600"
            }
          />

          <span
            className={`text-xs font-bold ${
              active
                ? "text-slate-300"
                : "text-slate-600"
            }`}
          >
            {formatMultiple(
              scenario.returnMultiple
            )}{" "}
            return multiple
          </span>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   MONEY FLOW ITEM
============================================================ */

function MoneyFlowItem({
  step,
  label,
  value,
  icon,
  active = false,
  negative = false,
}: {
  step: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  active?: boolean;
  negative?: boolean;
}) {
  return (
    <motion.div
      whileHover={{
        x: 3,
      }}
      className="flex items-center justify-between gap-4"
    >

      <div className="flex min-w-0 items-center gap-3">

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            active
              ? "bg-white/10 text-blue-300"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">

          <p
            className={`text-[9px] font-black uppercase tracking-[0.12em] ${
              active
                ? "text-slate-600"
                : "text-slate-400"
            }`}
          >
            {step}
          </p>

          <p
            className={`mt-0.5 text-xs font-semibold ${
              active
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            {label}
          </p>

        </div>

      </div>

      <p
        className={`shrink-0 text-sm font-black ${
          negative
            ? active
              ? "text-red-300"
              : "text-red-600"
            : active
              ? "text-white"
              : "text-slate-950"
        }`}
      >
        {value}
      </p>

    </motion.div>
  );
}

/* ============================================================
   MONEY FLOW CONNECTOR
============================================================ */

function MoneyFlowConnector({
  active = false,
}: {
  active?: boolean;
}) {
  return (
    <div className="my-3 ml-[18px] h-5 border-l border-dashed border-slate-200/80">

      <div
        className={`ml-[-2px] h-1 w-1 rounded-full ${
          active
            ? "bg-blue-400"
            : "bg-slate-300"
        }`}
      />

    </div>
  );
}

/* ============================================================
   DECISION CARD
============================================================ */

function DecisionCard({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className={`rounded-2xl border p-5 ${
        active
          ? "border-slate-600 bg-white/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >

      <div className="flex items-center justify-between">

        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        {active && (
          <Check
            size={15}
            className="text-blue-300"
          />
        )}

      </div>

      <p className="mt-2 text-2xl font-black text-white">

        {formatCurrency(
          value
        )}

      </p>

    </motion.div>
  );
}

/* ============================================================
   FORMATTERS
============================================================ */

function formatCurrency(
  value: number
) {
  if (
    !Number.isFinite(value)
  ) {
    return "₹0";
  }

  return `₹${Math.round(
    value
  ).toLocaleString("en-IN")}`;
}

function formatPercentage(
  value: number
) {
  if (
    !Number.isFinite(value)
  ) {
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
  if (
    !Number.isFinite(value)
  ) {
    return "0";
  }

  return Math.round(
    value
  ).toLocaleString("en-IN");
}

function formatMultiple(
  value: number
) {
  if (
    !Number.isFinite(value)
  ) {
    return "0×";
  }

  return `${value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}×`;
}

function indexDelay(
  key: ScenarioKey
) {
  if (key === "bear") {
    return 0;
  }

  if (key === "base") {
    return 0.12;
  }

  return 0.24;
}
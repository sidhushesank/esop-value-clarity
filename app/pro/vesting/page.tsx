"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,

} from "react";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  AlertTriangle,
   RotateCcw,
   MousePointer2,
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
  calculateVesting,
  type VestingInput,
} from "@/lib/esop/vesting";

import {
  useProEquityState,
  normalizeProNumber,
} from "@/lib/esop/pro-state";

/* ============================================================
   DEFAULT INPUTS
============================================================ */

const DEFAULT_INPUTS: VestingInput = {
  totalOptions: 10_000,
  exercisePrice: 20,
  vestingPeriodMonths: 48,
  cliffMonths: 12,
  monthsCompleted: 24,
};

/* ============================================================
   PERSISTED VESTING SCHEDULE KEY

   Only schedule-specific values are persisted here.

   Shared PRO values remain controlled by pro-state:
   - totalOptions
   - exercisePrice

   Persisted locally:
   - vestingPeriodMonths
   - cliffMonths
   - monthsCompleted
============================================================ */

const VESTING_SCHEDULE_STORAGE_KEY =
  "esop-value-clarity-pro-vesting-schedule";

/* ============================================================
   PAGE
============================================================ */

export default function ProVestingPage() {
  /* ==========================================================
     SHARED PRO STATE
  ========================================================== */

  const {
    proState,
    updateProState,
    hydrated,
  } = useProEquityState();

  /* ==========================================================
     LOCAL VESTING SCHEDULE

     Shared:
     - totalOptions
     - exercisePrice

     Persisted locally:
     - vestingPeriodMonths
     - cliffMonths
     - monthsCompleted
  ========================================================== */

  const [inputs, setInputs] =
    useState<VestingInput>(
      DEFAULT_INPUTS
    );

  /* ==========================================================
     PERSISTENCE HYDRATION FLAG

     Prevents the default values from being written
     to localStorage before the saved schedule has
     been restored.
  ========================================================== */

  const [scheduleHydrated, setScheduleHydrated] =
    useState(false);

  /* ==========================================================
     RESTORE SAVED VESTING SCHEDULE

     This only restores schedule-specific values.

     It intentionally does NOT restore:
     - totalOptions
     - exercisePrice

     Those remain connected to shared PRO state.
  ========================================================== */

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      const stored =
        window.localStorage.getItem(
          VESTING_SCHEDULE_STORAGE_KEY
        );

      if (stored) {
        const parsed =
          JSON.parse(stored) as Partial<
            Pick<
              VestingInput,
              | "vestingPeriodMonths"
              | "cliffMonths"
              | "monthsCompleted"
            >
          >;

        setInputs((previous) => ({
          ...previous,

          vestingPeriodMonths:
            Number.isFinite(
              Number(
                parsed.vestingPeriodMonths
              )
            )
              ? Number(
                  parsed.vestingPeriodMonths
                )
              : previous.vestingPeriodMonths,

          cliffMonths:
            Number.isFinite(
              Number(
                parsed.cliffMonths
              )
            )
              ? Number(
                  parsed.cliffMonths
                )
              : previous.cliffMonths,

          monthsCompleted:
            Number.isFinite(
              Number(
                parsed.monthsCompleted
              )
            )
              ? Number(
                  parsed.monthsCompleted
                )
              : previous.monthsCompleted,
        }));
      }
    } catch {
      /*
       * If localStorage contains invalid data,
       * safely fall back to the current defaults.
       */
    } finally {
      setScheduleHydrated(true);
    }
  }, [hydrated]);

  /* ==========================================================
     SAVE VESTING SCHEDULE

     Runs only after the saved schedule has been
     restored.

     This means navigation between:
     - Vesting
     - Tax
     - Dilution

     will preserve the user's schedule.
  ========================================================== */

  useEffect(() => {
    if (!scheduleHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        VESTING_SCHEDULE_STORAGE_KEY,
        JSON.stringify({
          vestingPeriodMonths:
            inputs.vestingPeriodMonths,

          cliffMonths:
            inputs.cliffMonths,

          monthsCompleted:
            inputs.monthsCompleted,
        })
      );
    } catch {
      /*
       * Ignore storage errors so the vesting
       * calculator itself continues working.
       */
    }
  }, [
    scheduleHydrated,
    inputs.vestingPeriodMonths,
    inputs.cliffMonths,
    inputs.monthsCompleted,
  ]);

  /* ==========================================================
     VESTING RESULT
  ========================================================== */

  const result = useMemo(
    () => calculateVesting(inputs),
    [inputs]
  );

  /* ==========================================================
     SYNC SHARED GRANT VALUES INTO LOCAL VESTING INPUTS

     Shared PRO state can be changed from:
     - Overview
     - Dilution
     - Simulator
     - Tax
     - other PRO tools

     Only the shared grant fields are synchronized here.

     IMPORTANT:
     This effect NEVER writes back to shared state.
     It only reads shared state and updates local inputs
     when the values are genuinely different.
  ========================================================== */

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const sharedTotalOptions =
      normalizeProNumber(
        proState.totalOptions
      );

    const sharedExercisePrice =
      normalizeProNumber(
        proState.exercisePrice
      );

    setInputs((previous) => {
      const totalOptionsChanged =
        previous.totalOptions !==
        sharedTotalOptions;

      const exercisePriceChanged =
        previous.exercisePrice !==
        sharedExercisePrice;

      if (
        !totalOptionsChanged &&
        !exercisePriceChanged
      ) {
        return previous;
      }

      return {
        ...previous,

        totalOptions:
          sharedTotalOptions,

        exercisePrice:
          sharedExercisePrice,
      };
    });
  }, [
    hydrated,
    proState.totalOptions,
    proState.exercisePrice,
  ]);

  /* ==========================================================
     LIVE SCROLL JOURNEY

     This is purely visual.

     It does NOT modify:
     - totalOptions
     - vestedOptions
     - vestedPercentage
     - exercisePrice
     - shared PRO state

     Therefore scrolling cannot change the actual
     vesting calculation.
  ========================================================== */

  const [scrollProgress, setScrollProgress] =
    useState(50);

  useEffect(() => {
    let lastScrollY =
      window.scrollY;

    let animationFrame = 0;

    const handleScroll = () => {
      cancelAnimationFrame(
        animationFrame
      );

      animationFrame =
        requestAnimationFrame(() => {
          const currentScrollY =
            window.scrollY;

          /*
           * The actual vesting position remains
           * whatever calculateVesting() says it is.
           */

          const baseProgress =
            result.vestedPercent;

          if (
            currentScrollY <= 20
          ) {
            setScrollProgress(
              baseProgress
            );

            lastScrollY =
              currentScrollY;

            return;
          }

          const scrollingDown =
            currentScrollY >
            lastScrollY;

          const scrollDistance =
            Math.max(
              currentScrollY,
              0
            );

          /*
           * Every ~24px of page movement advances
           * the visual journey by roughly one month.
           */

          const scrollMonths =
            Math.floor(
              scrollDistance / 24
            );

          const baseMonths =
            Math.round(
              (baseProgress / 100) *
                result.vestingPeriodMonths
            );

          let visualMonths =
            baseMonths;

          if (scrollingDown) {
            visualMonths =
              baseMonths +
              Math.floor(
                scrollMonths / 4
              );
          } else {
            /*
             * On upward movement, gradually return
             * toward the real vested position.
             */

            const retreat =
              Math.floor(
                scrollDistance / 18
              );

            visualMonths =
              baseMonths +
              Math.max(
                0,
                Math.floor(
                  scrollMonths / 4
                ) - retreat
              );
          }

          visualMonths = Math.min(
            Math.max(
              visualMonths,
              baseMonths
            ),
            result.vestingPeriodMonths
          );

          const visualPercentage =
            result.vestingPeriodMonths >
            0
              ? (visualMonths /
                  result.vestingPeriodMonths) *
                100
              : baseProgress;

          setScrollProgress(
            Math.max(
              baseProgress,
              Math.min(
                visualPercentage,
                100
              )
            )
          );

          lastScrollY =
            currentScrollY;
        });
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      cancelAnimationFrame(
        animationFrame
      );
    };
  }, [
    result.vestedPercent,
    result.vestingPeriodMonths,
  ]);

  /* ==========================================================
     NEXT MILESTONE
  ========================================================== */

  const nextMilestone =
    getNextMilestone(
      result.vestingPeriodMonths,
      result.cliffMonths,
      result.monthsCompleted
    );

  const nextMilestoneResult =
    useMemo(() => {
      if (!nextMilestone) {
        return null;
      }

      return calculateVesting({
        ...inputs,
        monthsCompleted:
          nextMilestone.month,
      });
    }, [
      inputs,
      nextMilestone,
    ]);

  /* ==========================================================
     ADDITIONAL FINANCIAL VALUES
  ========================================================== */

  const additionalOptionsIfStay =
    Math.max(
      result.totalOptions -
        result.vestedOptions,
      0
    );

  const fullExerciseCost =
    result.totalOptions *
    result.exercisePrice;

  const currentVestedValue =
    result.vestedOptions *
    result.exercisePrice;

  const additionalExerciseCost =
    Math.max(
      fullExerciseCost -
        currentVestedValue,
      0
    );

  /* ==========================================================
     INPUT UPDATE

     IMPORTANT:

     User input updates local state first.

     Then we calculate the NEW result immediately.

     Then we write that calculated result to shared
     PRO state exactly once.

     There is NO effect watching result and writing
     back to shared state.

     This prevents the maximum update depth loop.
  ========================================================== */

  function updateInput(
    field: keyof VestingInput,
    value: string | number
  ) {
    const numericValue =
      normalizeProNumber(value);

    const nextInputs: VestingInput = {
      ...inputs,
      [field]: numericValue,
    };

    /* Update local vesting state */

    setInputs(nextInputs);

    /*
     * Calculate the result from the exact next
     * input values rather than waiting for React
     * to update `inputs`.
     */

    const nextResult =
      calculateVesting(nextInputs);

    /*
     * Sync the calculated vesting position
     * to the shared PRO state once.
     */

    updateProState({
      totalOptions:
        nextResult.totalOptions,

      vestedOptions:
        nextResult.vestedOptions,

      vestedPercentage:
        nextResult.vestedPercent,

      exercisePrice:
        nextResult.exercisePrice,
    });

    /*
     * Keep the visual journey anchored to
     * the newly calculated real position.
     */

    setScrollProgress(
      nextResult.vestedPercent
    );
  }

  /* ==========================================================
     RESET
  ========================================================== */

  function reset() {
    const resetResult =
      calculateVesting(
        DEFAULT_INPUTS
      );

    /*
     * Reset local state.
     */

    setInputs({
      ...DEFAULT_INPUTS,
    });

    /*
     * Explicitly reset the persisted schedule.

     * This is the ONLY action that intentionally
     * clears the user's saved vesting assumptions.
     */

    try {
      window.localStorage.setItem(
        VESTING_SCHEDULE_STORAGE_KEY,
        JSON.stringify({
          vestingPeriodMonths:
            DEFAULT_INPUTS.vestingPeriodMonths,

          cliffMonths:
            DEFAULT_INPUTS.cliffMonths,

          monthsCompleted:
            DEFAULT_INPUTS.monthsCompleted,
        })
      );
    } catch {
      /*
       * Ignore storage errors.
       */
    }

    /*
     * Reset shared PRO state once.
     */

    updateProState({
      totalOptions:
        resetResult.totalOptions,

      vestedOptions:
        resetResult.vestedOptions,

      vestedPercentage:
        resetResult.vestedPercent,

      exercisePrice:
        resetResult.exercisePrice,
    });

    /*
     * Reset visual position.
     */

    setScrollProgress(
      resetResult.vestedPercent
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1480px] px-5 py-7 md:px-8 md:py-10">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/pro"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to PRO Workspace
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
            <Sparkles size={13} />
            PRO Equity Analysis
          </div>
        </div>

        {/* ======================================================
            HERO
        ====================================================== */}

        <section className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <Clock3 size={22} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                ESOP vesting timeline
              </p>

              <h1 className="mt-1 max-w-5xl text-3xl font-black tracking-tight text-slate-950 md:text-4xl lg:text-5xl">
                Understand what you&apos;ve earned,
                what&apos;s still at risk, and what
                happens next.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Model your ESOP vesting position
                and see how much of your grant is
                earned today, what remains unvested,
                what exercising could require, and
                how your position changes as you
                continue through the schedule.
              </p>
            </div>
          </div>
        </section>

        {/* ======================================================
            EQUITY POSITION HERO
        ====================================================== */}

        <section className="mt-8">
          <div
            className="
              overflow-hidden rounded-[28px]
              border border-slate-950
              bg-slate-950 text-white
              shadow-xl
              transition-shadow duration-500
              hover:shadow-[0_24px_70px_rgba(15,23,42,0.25)]
            "
          >
            <div className="p-7 md:p-9">

              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">

                <div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                      <ShieldCheck size={15} />
                      Your equity position
                    </div>

                    <span className="text-xs font-semibold text-slate-500">
                      {result.monthsCompleted} of{" "}
                      {result.vestingPeriodMonths} months
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-baseline gap-3">
                    <span className="text-5xl font-black tracking-tight md:text-6xl">
                      {formatPercentage(
                        result.vestedPercent
                      )}
                    </span>

                    <span className="text-base font-semibold text-blue-200">
                      of your grant is currently vested
                    </span>
                  </div>

                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                    You have{" "}
                    <strong className="text-white">
                      {formatNumber(
                        result.vestedOptions
                      )}
                    </strong>{" "}
                    of your{" "}
                    <strong className="text-white">
                      {formatNumber(
                        result.totalOptions
                      )}
                    </strong>{" "}
                    options under this modeled
                    schedule.
                  </p>

                </div>

                {/* EXERCISE COST */}

                <div
                  className="
                    group relative overflow-hidden
                    rounded-2xl
                    border border-white/10
                    bg-white/[0.035]
                    p-5
                    transition-all duration-300 ease-out
                    hover:-translate-y-1
                    hover:border-blue-400/40
                    hover:bg-white/[0.07]
                    hover:shadow-[0_18px_45px_rgba(37,99,235,0.16)]
                    lg:min-w-[270px]
                  "
                >
                  <div
                    className="
                      pointer-events-none absolute
                      -right-12 -top-12
                      h-28 w-28
                      rounded-full
                      bg-blue-400/0
                      blur-3xl
                      transition-all duration-500
                      group-hover:bg-blue-400/10
                    "
                  />

                  <div className="relative z-10">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 transition-colors duration-300 group-hover:text-blue-300">
                      Exercise cost today
                    </p>

                    <p className="mt-2 text-3xl font-black text-white transition-colors duration-300 group-hover:text-blue-100">
                      {formatCurrency(
                        result.exerciseCost
                      )}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Cash required to exercise
                      your currently vested
                      options at the supplied
                      exercise price.
                    </p>
                  </div>
                </div>

              </div>

              {/* ==================================================
                  PROGRESS
              ================================================== */}

              <div className="mt-9">

                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">
                    Vesting progress
                  </span>

                  <span className="text-blue-300">
                    {formatPercentage(
                      result.vestedPercent
                    )}
                  </span>
                </div>

                {/* ==================================================
                    LIVE STACKED VESTING JOURNEY
                ================================================== */}

                <div className="mt-5">

                  <div className="relative">

                    {/* Background track */}

                    <div
                      className="
                        absolute inset-x-0 top-1/2
                        h-[18px]
                        -translate-y-1/2
                        rounded-full
                        border border-white/5
                        bg-slate-800/80
                      "
                    />

                    {/* Stacked month segments */}

                    <div
                      className="relative grid gap-[3px]"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(
                          result.vestingPeriodMonths,
                          1
                        )}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({
                        length: Math.max(
                          result.vestingPeriodMonths,
                          1
                        ),
                      }).map(
                        (_, index) => {
                          const monthNumber =
                            index + 1;

                          const segmentPercentage =
                            result.vestingPeriodMonths >
                            0
                              ? (monthNumber /
                                  result.vestingPeriodMonths) *
                                100
                              : 100;

                          const isActive =
                            segmentPercentage <=
                            scrollProgress;

                          const isActual =
                            segmentPercentage <=
                            result.vestedPercent;

                          return (
                            <div
                              key={monthNumber}
                              className={`
                                relative h-[18px]
                                overflow-hidden
                                rounded-[4px]
                                border
                                transition-all
                                duration-300
                                ease-out
                                ${
                                  isActive
                                    ? isActual
                                      ? `
                                        border-blue-300/40
                                        bg-blue-400
                                        shadow-[0_0_10px_rgba(96,165,250,0.35)]
                                      `
                                      : `
                                        border-blue-400/20
                                        bg-blue-500/70
                                        shadow-[0_0_8px_rgba(59,130,246,0.25)]
                                      `
                                    : `
                                      border-white/5
                                      bg-slate-800/80
                                    `
                                }
                              `}
                            >
                              {isActual && (
                                <div className="absolute inset-0 bg-white/5" />
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* LIVE POSITION MARKER */}

                    <div
                      className="
                        pointer-events-none
                        absolute
                        top-1/2
                        -translate-y-1/2
                        transition-all
                        duration-500
                        ease-out
                      "
                      style={{
                        left: `${Math.min(
                          Math.max(
                            scrollProgress,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    >
                      <div
                        className="
                          relative
                          -ml-[7px]
                          h-[28px]
                          w-[28px]
                          rounded-full
                          border-[3px]
                          border-slate-950
                          bg-white
                          shadow-[0_0_0_3px_rgba(96,165,250,0.45),0_0_20px_rgba(96,165,250,0.7)]
                        "
                      >
                        <div
                          className="
                            absolute
                            left-1/2
                            top-1/2
                            h-2
                            w-2
                            -translate-x-1/2
                            -translate-y-1/2
                            rounded-full
                            bg-blue-500
                          "
                        />
                      </div>
                    </div>

                  </div>

                  {/* LIVE PERCENTAGE */}

                  <div className="mt-4 flex items-center justify-between">

                    <div className="flex items-center gap-2">
                      <span
                        className="
                          h-2
                          w-2
                          animate-pulse
                          rounded-full
                          bg-blue-400
                          shadow-[0_0_8px_rgba(96,165,250,0.8)]
                        "
                      />

                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        Live journey
                      </span>
                    </div>

                    <span className="text-sm font-black text-blue-300">
                      {formatPercentage(
                        scrollProgress
                      )}
                    </span>

                  </div>

                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Grant
                  </span>

                  <span>
                    {result.monthsCompleted} months
                    completed
                  </span>

                  <span>
                    Fully vested
                  </span>
                </div>

              </div>

              {/* ==================================================
                  KEY POSITION
              ================================================== */}

              <div className="mt-8 grid gap-4 md:grid-cols-3">

                <PositionMetric
                  label="Earned"
                  value={formatNumber(
                    result.vestedOptions
                  )}
                  description="Options currently vested"
                  icon={
                    <CheckCircle2 size={16} />
                  }
                  accent="emerald"
                />

                <PositionMetric
                  label="Still unvested"
                  value={formatNumber(
                    result.unvestedOptions
                  )}
                  description="Options still dependent on continued vesting"
                  icon={
                    <Clock3 size={16} />
                  }
                  accent="blue"
                />

                <PositionMetric
                  label="Time remaining"
                  value={`${result.monthsUntilFullyVested} mo`}
                  description="Until the modeled grant is fully vested"
                  icon={
                    <TrendingUp size={16} />
                  }
                  accent="violet"
                />

              </div>

            </div>
          </div>
        </section>

        {/* ======================================================
            INSIGHT
        ====================================================== */}

        <section className="mt-6">
          <VestingInsight
            result={result}
          />
        </section>

        {/* ======================================================
            VESTING JOURNEY
        ====================================================== */}

        <section className="mt-6">

          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">

            <CardHeader className="p-7 md:p-8">

              <div className="flex items-start justify-between gap-6">

                <div>

                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    Your vesting journey
                  </p>

                  <CardTitle className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    See exactly where you are in the grant.
                  </CardTitle>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Track the milestones that shape
                    your ownership — from the original
                    grant through today and eventual full
                    vesting.
                  </p>

                </div>

                <div className="hidden shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right md:block">

                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Current position
                  </p>

                  <p className="mt-1 text-lg font-black text-slate-950">
                    {formatPercentage(
                      result.vestedPercent
                    )}
                  </p>

                </div>

              </div>

            </CardHeader>

            <CardContent className="px-7 pb-8 md:px-8">

              <div className="relative">

                <div className="absolute left-[13px] top-4 hidden h-[calc(100%-32px)] w-px bg-slate-200 md:block" />

                <div className="space-y-7">

                  <TimelineStep
                    number="01"
                    title="Grant begins"
                    value={`${formatNumber(
                      result.totalOptions
                    )} options`}
                    description="Your original ESOP grant."
                    complete
                  />

                  <TimelineStep
                    number="02"
                    title="Cliff"
                    value={`${result.cliffMonths} months`}
                    description={
                      result.monthsCompleted >=
                      result.cliffMonths
                        ? "Cliff completed and initial vesting has occurred."
                        : `${result.monthsUntilCliff} months until your first modeled vesting event.`
                    }
                    complete={
                      result.monthsCompleted >=
                      result.cliffMonths
                    }
                  />

                  <TimelineStep
                    number="03"
                    title="Today"
                    value={`${formatPercentage(
                      result.vestedPercent
                    )} vested`}
                    description={`${formatNumber(
                      result.vestedOptions
                    )} options have been earned so far.`}
                    current
                  />

                  <TimelineStep
                    number="04"
                    title="Fully vested"
                    value={`${result.vestingPeriodMonths} months`}
                    description={
                      result.monthsUntilFullyVested ===
                      0
                        ? "Your full grant is modeled as vested."
                        : `${result.monthsUntilFullyVested} months remain until the entire grant is vested.`
                    }
                    complete={
                      result.monthsUntilFullyVested ===
                      0
                    }
                  />

                </div>

              </div>

            </CardContent>

          </Card>

        </section>

        {/* ======================================================
            LEAVE TODAY / STAY
        ====================================================== */}

        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          <DecisionCard
            icon={
              <LockKeyhole size={20} />
            }
            eyebrow="If you left today"
            title="What is already earned?"
            tone="slate"
          >

            <div className="space-y-4">

              <DecisionRow
                label="Vested options"
                value={formatNumber(
                  result.vestedOptions
                )}
              />

              <DecisionRow
                label="Unvested options"
                value={formatNumber(
                  result.unvestedOptions
                )}
                warning
              />

              <DecisionRow
                label="Modeled exercise cost"
                value={formatCurrency(
                  result.exerciseCost
                )}
              />

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                <div className="flex gap-3">

                  <AlertTriangle
                    size={17}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <p className="text-xs leading-5 text-amber-900">
                    Unvested options are assumed
                    to be forfeited when
                    employment ends in this
                    model. Your actual treatment
                    depends on your grant
                    agreement and applicable
                    terms.
                  </p>

                </div>

              </div>

            </div>

          </DecisionCard>

          <DecisionCard
            icon={
              <TrendingUp size={20} />
            }
            eyebrow="If you stay"
            title="What remains to be earned?"
            tone="blue"
          >

            <div className="space-y-4">

              <DecisionRow
                label="Additional options to vest"
                value={formatNumber(
                  additionalOptionsIfStay
                )}
              />

              <DecisionRow
                label="Time remaining"
                value={`${result.monthsUntilFullyVested} months`}
              />

              <DecisionRow
                label="Additional exercise cost"
                value={formatCurrency(
                  additionalExerciseCost
                )}
              />

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                <p className="text-xs font-semibold leading-5 text-blue-900">
                  Completing the modeled
                  schedule would take your
                  vested position from{" "}
                  <strong>
                    {formatNumber(
                      result.vestedOptions
                    )}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {formatNumber(
                      result.totalOptions
                    )}
                  </strong>{" "}
                  options.
                </p>

              </div>

            </div>

          </DecisionCard>

        </section>

        {/* ======================================================
            NEXT MILESTONE
        ====================================================== */}

        {nextMilestone &&
          nextMilestoneResult && (
            <section className="mt-6">

              <div className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50">

                <div className="grid gap-8 p-7 md:p-9 lg:grid-cols-[1fr_auto] lg:items-center">

                  <div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
                      <Clock3 size={12} />
                      Next milestone
                    </div>

                    <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                      Your next modeled milestone is
                      month{" "}
                      {nextMilestone.month}.
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Reaching this point would
                      move your modeled vested
                      position to approximately{" "}
                      <strong className="text-slate-950">
                        {formatNumber(
                          nextMilestoneResult.vestedOptions
                        )}{" "}
                        options
                      </strong>{" "}
                      or{" "}
                      <strong className="text-slate-950">
                        {formatPercentage(
                          nextMilestoneResult.vestedPercent
                        )}
                      </strong>{" "}
                      of the grant.
                    </p>

                  </div>

                  <div className="rounded-2xl border border-white bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md lg:min-w-[250px]">

                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Vested at milestone
                    </p>

                    <p className="mt-2 text-3xl font-black text-slate-950">
                      {formatNumber(
                        nextMilestoneResult.vestedOptions
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatPercentage(
                        nextMilestoneResult.vestedPercent
                      )}{" "}
                      of grant
                    </p>

                  </div>

                </div>

              </div>

            </section>
          )}

        {/* ======================================================
            FINANCIAL SUMMARY
        ====================================================== */}

        <section className="mt-6">

          <Card className="border-slate-200 bg-white shadow-sm">

            <CardHeader className="p-7 md:p-8">

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                Exercise position
              </p>

              <CardTitle className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                What does your vested position mean financially?
              </CardTitle>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Your vesting position determines how
                many options you can potentially
                exercise today and how much capital
                would be required at the supplied
                exercise price.
              </p>

            </CardHeader>

            <CardContent className="px-7 pb-8 md:px-8">

              <div className="grid gap-4 md:grid-cols-3">

                <FinanceMetric
                  label="Vested position"
                  value={formatNumber(
                    result.vestedOptions
                  )}
                  description="Options currently vested"
                />

                <FinanceMetric
                  label="Exercise cost today"
                  value={formatCurrency(
                    result.exerciseCost
                  )}
                  description="Cash required to exercise vested options"
                  highlight
                />

                <FinanceMetric
                  label="Full grant exercise cost"
                  value={formatCurrency(
                    fullExerciseCost
                  )}
                  description="Cash required if the full grant eventually vests"
                />

              </div>

            </CardContent>

          </Card>

        </section>

        {/* ======================================================
            DETAIL PANELS
        ====================================================== */}

        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          <DetailPanel
            title="Current vesting position"
            items={[
              [
                "Total options",
                formatNumber(
                  result.totalOptions
                ),
              ],
              [
                "Vested options",
                formatNumber(
                  result.vestedOptions
                ),
              ],
              [
                "Unvested options",
                formatNumber(
                  result.unvestedOptions
                ),
              ],
              [
                "Vested percentage",
                formatPercentage(
                  result.vestedPercent
                ),
              ],
            ]}
          />

          <DetailPanel
            title="Schedule"
            items={[
              [
                "Vesting period",
                `${result.vestingPeriodMonths} months`,
              ],
              [
                "Cliff",
                `${result.cliffMonths} months`,
              ],
              [
                "Months completed",
                `${result.monthsCompleted} months`,
              ],
              [
                "Months remaining",
                `${result.monthsUntilFullyVested} months`,
              ],
            ]}
          />

        </section>

        {/* ======================================================
            INSIGHT
        ====================================================== */}

        <section className="mt-6">

          <VestingInsight
            result={result}
          />

        </section>

        {/* ======================================================
            ASSUMPTIONS
        ====================================================== */}

        <section className="mt-6">

          <Card className="border-slate-200 bg-white shadow-sm">

            <CardHeader className="p-7 md:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <CircleHelp size={18} />
                </div>

                <div>

                  <CardTitle className="text-xl font-black text-slate-950">
                    Adjust your model
                  </CardTitle>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Change the assumptions to match
                    your grant and see the entire
                    equity journey update.
                  </p>

                </div>

              </div>

            </CardHeader>

            <CardContent className="px-7 pb-8 md:px-8">

              <div className="grid gap-5 md:grid-cols-2">

                <Field
                  label="Total options"
                  description="Total number of options in your grant."
                  value={
                    inputs.totalOptions
                  }
                  onChange={(value) =>
                    updateInput(
                      "totalOptions",
                      value
                    )
                  }
                />

                <Field
                  label="Exercise price"
                  description="Price paid per option when exercising."
                  value={
                    inputs.exercisePrice
                  }
                  prefix="₹"
                  onChange={(value) =>
                    updateInput(
                      "exercisePrice",
                      value
                    )
                  }
                />

                <Field
                  label="Vesting period"
                  description="Total time until the grant fully vests."
                  value={
                    inputs.vestingPeriodMonths
                  }
                  suffix="months"
                  onChange={(value) =>
                    updateInput(
                      "vestingPeriodMonths",
                      value
                    )
                  }
                />

                <Field
                  label="Cliff"
                  description="Initial period before the first vesting event."
                  value={
                    inputs.cliffMonths
                  }
                  suffix="months"
                  onChange={(value) =>
                    updateInput(
                      "cliffMonths",
                      value
                    )
                  }
                />

                <Field
                  label="Months completed"
                  description="Time already completed in the schedule."
                  value={
                    inputs.monthsCompleted
                  }
                  suffix="months"
                  onChange={(value) =>
                    updateInput(
                      "monthsCompleted",
                      value
                    )
                  }
                />

              </div>

              <div className="mt-7 flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 md:flex-row md:items-center">

                <div>

                  <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">
                    Illustrative model
                  </p>

                  <p className="mt-1 max-w-3xl text-xs leading-5 text-blue-900/80">
                    This analysis models a standard
                    vesting structure. Your actual
                    vesting, exercise window and
                    forfeiture terms depend on your
                    grant agreement and applicable
                    company policies.
                  </p>

                </div>

                <button
  type="button"
  onClick={reset}
  className="
    group relative inline-flex items-center justify-center
    gap-2 overflow-hidden rounded-full
    border border-blue-200
    bg-white
    px-4 py-2
    text-xs font-bold text-blue-600
    shadow-sm
    transition-all duration-200
    hover:-translate-y-0.5
    hover:border-blue-300
    hover:bg-blue-50
    hover:shadow-md
    active:translate-y-0
    active:scale-[0.98]
  "
>
  {/* Subtle cursor animation */}
  <MousePointer2
    size={13}
    className="
      transition-transform duration-300
      group-hover:-translate-x-0.5
      group-hover:-translate-y-0.5
    "
  />

  <span>
    Reset assumptions
  </span>

  <RotateCcw
    size={13}
    className="
      transition-transform duration-500
      group-hover:rotate-[-45deg]
    "
  />
</button>

              </div>

            </CardContent>

          </Card>

        </section>

        {/* ======================================================
            CONNECTED PRO TOOLS
        ====================================================== */}

        <section className="mt-8">

          <div className="mb-5">

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Continue your equity analysis
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
              Vesting is only one part of your
              equity outcome.
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Once you know what you have earned,
              the next questions are what dilution,
              tax and future company value could do
              to that position.
            </p>

          </div>

          <div className="grid gap-4 md:grid-cols-3">

            <ToolLink
              href="/pro/dilution"
              eyebrow="Dilution"
              title="See how future funding could change your ownership."
            />

            <ToolLink
              href="/pro/tax"
              eyebrow="Tax"
              title="Understand the potential tax impact of exercising your options."
            />

            <ToolLink
              href="/pro/simulator"
              eyebrow="Advanced simulator"
              title="Combine your equity assumptions into a broader outcome model."
              dark
            />

          </div>

        </section>

        {/* ======================================================
            FINAL CTA
        ====================================================== */}

        <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 text-white shadow-xl">

          <div className="grid gap-8 p-7 md:p-9 lg:grid-cols-[1fr_auto] lg:items-center">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                Your equity is a journey
              </p>

              <h2 className="mt-3 max-w-3xl text-2xl font-black tracking-tight md:text-3xl">
                Knowing what has vested is only
                the beginning.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Connect your vested position with
                dilution, tax and potential exit
                outcomes to understand the bigger
                picture of your ESOP.
              </p>

            </div>

            <Link
              href="/pro/simulator"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg active:translate-y-0"
            >
              Continue equity analysis
              <ArrowUpRight size={16} />
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}

/* ============================================================
   POSITION METRIC
============================================================ */

function PositionMetric({
  label,
  value,
  description,
  icon,
  accent,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  accent:
    | "emerald"
    | "blue"
    | "violet";
}) {
  const accentClasses = {
    emerald: {
      icon: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      glow:
        "group-hover:bg-emerald-400/10",
      label:
        "group-hover:text-emerald-300",
    },

    blue: {
      icon: "border-blue-400/20 bg-blue-400/10 text-blue-300",
      glow:
        "group-hover:bg-blue-400/10",
      label:
        "group-hover:text-blue-300",
    },

    violet: {
      icon: "border-violet-400/20 bg-violet-400/10 text-violet-300",
      glow:
        "group-hover:bg-violet-400/10",
      label:
        "group-hover:text-violet-300",
    },
  };

  const colors =
    accentClasses[accent];

  return (
    <div
      className="
        group relative overflow-hidden
        rounded-2xl
        border border-white/10
        bg-white/[0.035]
        p-5
        transition-all duration-300 ease-out
        hover:-translate-y-1
        hover:border-white/20
        hover:bg-white/[0.06]
        hover:shadow-[0_16px_40px_rgba(0,0,0,0.22)]
      "
    >

      <div
        className={`
          pointer-events-none absolute
          -right-10 -top-10
          h-28 w-28
          rounded-full
          blur-3xl
          opacity-0
          transition-all duration-500
          group-hover:opacity-100
          ${colors.glow}
        `}
      />

      <div className="relative z-10">

        <div
          className={`
            flex h-8 w-8 items-center justify-center
            rounded-lg border
            transition-all duration-300
            group-hover:scale-105
            ${colors.icon}
          `}
        >
          {icon}
        </div>

        <p
          className={`
            mt-4
            text-xs font-semibold uppercase tracking-[0.1em]
            text-slate-500
            transition-colors duration-300
            ${colors.label}
          `}
        >
          {label}
        </p>

        <p className="mt-2 text-2xl font-black text-white">
          {value}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500 transition-colors duration-300 group-hover:text-slate-400">
          {description}
        </p>

      </div>
    </div>
  );
}

/* ============================================================
   TIMELINE STEP
============================================================ */

function TimelineStep({
  number,
  title,
  value,
  description,
  complete = false,
  current = false,
}: {
  number: string;
  title: string;
  value: string;
  description: string;
  complete?: boolean;
  current?: boolean;
}) {
  const [expanded, setExpanded] =
    useState(false);

  const detail = getTimelineDetail({
    title,
    value,
    description,
    complete,
    current,
  });

  return (
    <div className="relative flex gap-5">
      {/* Timeline node — unchanged */}
      <div
        className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[9px] font-black ${
          current
            ? "border-blue-600 bg-blue-600 text-white"
            : complete
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-200 bg-white text-slate-400"
        }`}
      >
        {complete &&
        !current ? (
          <CheckCircle2 size={14} />
        ) : (
          number
        )}
      </div>

      {/* Interactive card — layout preserved */}
      <button
        type="button"
        onClick={() =>
          setExpanded((previous) => !previous)
        }
        aria-expanded={expanded}
        className="
          flex-1
          rounded-2xl
          border border-slate-200
          bg-slate-50
          p-5
          text-left
          outline-none
          transition-all duration-300
          hover:-translate-y-0.5
          hover:border-blue-200
          hover:bg-white
          hover:shadow-md
          focus-visible:border-blue-400
          focus-visible:ring-2
          focus-visible:ring-blue-100
        "
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-[0.12em] ${
                current
                  ? "text-blue-600"
                  : "text-slate-500"
              }`}
            >
              {title}
            </p>

            <p className="mt-1 text-lg font-black text-slate-950">
              {value}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {current && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                <TrendingUp size={12} />
                You are here
              </span>
            )}

            <span
              className={`
                flex h-7 w-7 items-center justify-center
                rounded-full
                border
                text-xs font-black
                transition-all duration-300
                ${
                  expanded
                    ? "rotate-90 border-blue-200 bg-blue-50 text-blue-600"
                    : "border-slate-200 bg-white text-slate-400"
                }
              `}
              aria-hidden="true"
            >
              <ArrowRight size={13} />
            </span>
          </div>
        </div>

        {/* Expandable milestone detail */}
        <div
          className={`
            grid transition-all duration-300 ease-out
            ${
              expanded
                ? "mt-5 grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }
          `}
        >
          <div className="overflow-hidden">
            <div className="border-t border-slate-200 pt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                {detail.label}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {detail.text}
              </p>

              {detail.metrics.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {detail.metrics.map(
                    ([metricLabel, metricValue]) => (
                      <div
                        key={metricLabel}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          {metricLabel}
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-950">
                          {metricValue}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ============================================================
   TIMELINE DETAIL
============================================================ */

function getTimelineDetail({
  title,
  value,
  description,
  complete,
  current,
}: {
  title: string;
  value: string;
  description: string;
  complete: boolean;
  current: boolean;
}) {
  if (title === "Grant begins") {
    return {
      label: "Your original grant",
      text: "This is the starting point of the modeled ESOP journey. The grant contains the full number of options before any vesting has occurred.",
      metrics: [
        ["Grant size", value],
        ["Starting status", "0% vested"],
      ],
    };
  }

  if (title === "Cliff") {
    return {
      label: complete
        ? "Cliff milestone completed"
        : "Cliff milestone",
      text: complete
        ? "Your modeled cliff has been completed, so the grant has moved beyond the initial waiting period and is progressing through the remaining vesting schedule."
        : description,
      metrics: [
        ["Milestone", value],
        [
          "Status",
          complete
            ? "Completed"
            : "Not reached yet",
        ],
      ],
    };
  }

  if (title === "Today") {
    return {
      label: "Your current position",
      text: "This card shows your modeled position today. The vested percentage and earned options are calculated directly from the current vesting assumptions above.",
      metrics: [
        ["Current position", value],
        [
          "Status",
          current
            ? "Active today"
            : "Current milestone",
        ],
      ],
    };
  }

  return {
    label: complete
      ? "Grant fully vested"
      : "Remaining vesting",
    text: complete
      ? "The modeled schedule is complete and the entire grant has vested."
      : description,
    metrics: [
      ["Milestone", value],
      [
        "Status",
        complete
          ? "Completed"
          : "Still in progress",
      ],
    ],
  };
}

/* ============================================================
   DECISION CARD
============================================================ */

function DecisionCard({
  icon,
  eyebrow,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  tone: "slate" | "blue";
  children: React.ReactNode;
}) {
  return (
    <Card
      className={`
        group overflow-hidden
        shadow-sm
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]
        ${
          tone === "blue"
            ? "border-blue-100 bg-white hover:border-blue-200"
            : "border-slate-200 bg-white hover:border-slate-300"
        }
      `}
    >

      <CardHeader className="p-7 md:p-8">

        <div
          className={`
            flex h-11 w-11
            items-center justify-center
            rounded-xl
            transition-all duration-300
            group-hover:scale-105
            ${
              tone === "blue"
                ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
            }
          `}
        >
          {icon}
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
          {eyebrow}
        </p>

        <CardTitle className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          {title}
        </CardTitle>

      </CardHeader>

      <CardContent className="px-7 pb-7 md:px-8">
        {children}
      </CardContent>

    </Card>
  );
}

/* ============================================================
   DECISION ROW
============================================================ */

function DecisionRow({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm font-black ${
          warning
            ? "text-amber-700"
            : "text-slate-950"
        }`}
      >
        {value}
      </span>

    </div>
  );
}

/* ============================================================
   FINANCE METRIC
============================================================ */

function FinanceMetric({
  label,
  value,
  description,
  highlight = false,
}: {
  label: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        group rounded-2xl border p-5
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-md
        ${
          highlight
            ? `
              border-slate-950
              bg-slate-950
              text-white
              hover:border-blue-900
              hover:shadow-[0_15px_35px_rgba(15,23,42,0.18)]
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

      <p
        className={`
          text-xs font-bold uppercase tracking-[0.1em]
          ${
            highlight
              ? "text-slate-400 group-hover:text-blue-300"
              : "text-slate-500 group-hover:text-blue-600"
          }
        `}
      >
        {label}
      </p>

      <p
        className={`
          mt-2 break-words text-2xl font-black
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
          mt-1 text-xs leading-5
          ${
            highlight
              ? "text-slate-400"
              : "text-slate-500"
          }
        `}
      >
        {description}
      </p>

    </div>
  );
}

/* ============================================================
   DETAIL PANEL
============================================================ */

function DetailPanel({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div
      className="
        group rounded-2xl
        border border-slate-200
        bg-slate-50
        p-5
        transition-all duration-300
        hover:-translate-y-1
        hover:border-blue-200
        hover:bg-white
        hover:shadow-md
      "
    >

      <p className="text-sm font-black text-slate-950">
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

              <span className="text-sm font-black text-slate-900">
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

      <Label className="text-sm font-bold text-slate-900">
        {label}
      </Label>

      <p className="mt-1 text-xs leading-5 text-slate-500">
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
          className={`
            h-11 rounded-xl
            border-slate-200
            bg-slate-50
            text-sm font-medium
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
                ? "pr-20"
                : ""
            }
          `}
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
   VESTING INSIGHT
============================================================ */

function VestingInsight({
  result,
}: {
  result: ReturnType<
    typeof calculateVesting
  >;
}) {
  /* ==========================================================
     BEFORE CLIFF
  ========================================================== */

  if (
    result.status ===
    "before-cliff"
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-6">
        <div className="flex items-start gap-3">

          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-amber-600"
          />

          <div>
            <p
              className="font-black"
              style={{
                color: "#451a03",
              }}
            >
              Your first vesting milestone has not happened yet.
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color: "#78350f",
              }}
            >
              You have{" "}
              <strong
                style={{
                  color: "#451a03",
                }}
              >
                {result.monthsUntilCliff} months
              </strong>{" "}
              remaining until the modeled cliff.
              Until that point, this model shows
              no vested options.
            </p>

          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     FULLY VESTED
  ========================================================== */

  if (
    result.status ===
    "fully-vested"
  ) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 md:p-6">
        <div className="flex items-start gap-3">

          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <p
              className="font-black"
              style={{
                color: "#064e3b",
              }}
            >
              Your full modeled grant is vested.
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{
                color: "#065f46",
              }}
            >
              All{" "}
              <strong
                style={{
                  color: "#064e3b",
                }}
              >
                {formatNumber(
                  result.totalOptions
                )}
              </strong>{" "}
              options have vested under this
              schedule. Your key considerations
              now shift toward exercise cost,
              tax, liquidity and eventual equity
              value.
            </p>

          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ACTIVELY VESTING
  ========================================================== */

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
      <div className="flex items-start gap-3">

        <TrendingUp
          size={20}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <div>
          <p
            className="font-black"
            style={{
              color: "#172554",
            }}
          >
            Your grant is actively vesting.
          </p>

          <p
            className="mt-1 text-sm leading-6"
            style={{
              color: "#1e3a8a",
            }}
          >
            You have earned{" "}
            <strong
              style={{
                color: "#172554",
              }}
            >
              {formatPercentage(
                result.vestedPercent
              )}
            </strong>{" "}
            of your grant so far.{" "}
            <strong
              style={{
                color: "#172554",
              }}
            >
              {result.monthsUntilFullyVested} months
            </strong>{" "}
            remain in the modeled schedule.
          </p>

          <div
            className="
              mt-4
              inline-flex
              items-center
              rounded-full
              border
              border-blue-200
              bg-white
              px-3
              py-1.5
              text-[10px]
              font-black
              uppercase
              tracking-[0.12em]
              text-blue-700
              shadow-sm
            "
          >
            {formatPercentage(
              result.vestedPercent
            )}{" "}
            vested
          </div>

        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TOOL LINK
============================================================ */

function ToolLink({
  href,
  eyebrow,
  title,
  dark = false,
}: {
  href: string;
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        group rounded-2xl
        border p-5
        transition-all duration-300
        hover:-translate-y-1
        ${
          dark
            ? `
              border-slate-950
              bg-slate-950
              text-white
              hover:bg-slate-900
              hover:shadow-[0_16px_35px_rgba(15,23,42,0.18)]
            `
            : `
              border-slate-200
              bg-white
              hover:border-blue-200
              hover:shadow-[0_16px_35px_rgba(15,23,42,0.07)]
            `
        }
      `}
    >

      <div className="flex items-center justify-between gap-4">

        <p
          className={`
            text-xs font-black uppercase tracking-[0.12em]
            ${
              dark
                ? "text-blue-300"
                : "text-blue-600"
            }
          `}
        >
          {eyebrow}
        </p>

        <ArrowRight
          size={16}
          className="
            text-slate-400
            transition-transform duration-300
            group-hover:translate-x-1
            group-hover:text-blue-500
          "
        />

      </div>

      <p
        className={`
          mt-4 text-base font-bold leading-6
          ${
            dark
              ? "text-white"
              : "text-slate-950"
          }
        `}
      >
        {title}
      </p>

    </Link>
  );
}

/* ============================================================
   NEXT MILESTONE
============================================================ */

function getNextMilestone(
  vestingPeriodMonths: number,
  cliffMonths: number,
  monthsCompleted: number
) {
  const candidates = [
    cliffMonths,
    Math.ceil(
      vestingPeriodMonths / 2
    ),
    vestingPeriodMonths,
  ]
    .filter(
      (month) =>
        month > monthsCompleted &&
        month > 0
    )
    .sort(
      (a, b) => a - b
    );

  if (
    candidates.length === 0
  ) {
    return null;
  }

  return {
    month: candidates[0],
  };
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
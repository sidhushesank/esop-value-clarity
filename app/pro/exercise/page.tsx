"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  Gauge,
  GitBranch,
  Landmark,
  Link2,
  LockKeyhole,
  PiggyBank,
  ReceiptIndianRupee,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundX,
  Wallet,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  calculateExerciseDecision,
  type ExerciseDecisionFactor,
  type ExerciseRiskLevel,
  type ExerciseScenarioResult,
  type ExerciseStrategyPercent,
} from "@/lib/esop/exercise";

import {
  normalizeProNumber,
  useProEquityState,
} from "@/lib/esop/pro-state";

import { calculateVesting } from "@/lib/esop/vesting";

/* ============================================================
   TYPES
============================================================ */

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

/* ============================================================
   LOCAL PLANNER STORAGE

   These are planning assumptions, NOT confirmed grant facts.
============================================================ */

type ExercisePlannerState = {
  exercisePercentage: number;
  customMode: boolean;
  customOptions: number;
  opportunityCostRate: number;
  yearsToLiquidity: number;
  waitMonths: number;
  futureExerciseFMV: number;
  exerciseBudget: number;
  selectedScenario: "Bear" | "Base" | "Bull";
};

const PLANNER_STORAGE_KEY =
  "esop-value-clarity-exercise-planner-v2";

const DEFAULT_PLANNER_STATE: ExercisePlannerState = {
  exercisePercentage: 50,
  customMode: false,
  customOptions: 0,
  opportunityCostRate: 8,
  yearsToLiquidity: 3,
  waitMonths: 12,
  futureExerciseFMV: 200,
  exerciseBudget: 200000,
  selectedScenario: "Base",
};

/* ============================================================
   LOGGING
============================================================ */

const LOG = "[EVC:EXERCISE:UI]";

function devLog(
  event: string,
  payload?: Record<string, unknown>
) {
  if (process.env.NODE_ENV !== "production") {
    console.info(LOG, event, payload ?? {});
  }
}

function devError(
  event: string,
  error: unknown
) {
  console.error(LOG, event, error);
}

/* ============================================================
   PAGE
============================================================ */

export default function ProExercisePage() {
  const {
    proState,
    updateProState,
    hydrated,
  } = useProEquityState();

  const [grant, setGrant] =
    useState<ActiveConfirmedGrant | null>(
      null
    );

  const [
    grantLoading,
    setGrantLoading,
  ] = useState(false);

  const [
    plannerHydrated,
    setPlannerHydrated,
  ] = useState(false);

  const [
    planner,
    setPlanner,
  ] = useState<ExercisePlannerState>(
    DEFAULT_PLANNER_STATE
  );

  /* ==========================================================
     LOAD LOCAL PLANNER ASSUMPTIONS
  ========================================================== */

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          PLANNER_STORAGE_KEY
        );

      if (stored) {
        const parsed =
          JSON.parse(
            stored
          ) as Partial<ExercisePlannerState>;

        setPlanner({
          ...DEFAULT_PLANNER_STATE,
          ...parsed,
        });
      }
    } catch (error) {
      devError(
        "planner_state_load_failed",
        error
      );
    } finally {
      setPlannerHydrated(true);
    }
  }, []);

  /* ==========================================================
     SAVE LOCAL PLANNER ASSUMPTIONS
  ========================================================== */

  useEffect(() => {
    if (!plannerHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        PLANNER_STORAGE_KEY,
        JSON.stringify(planner)
      );
    } catch (error) {
      devError(
        "planner_state_save_failed",
        error
      );
    }
  }, [
    planner,
    plannerHydrated,
  ]);

  /* ==========================================================
     CONNECT CONFIRMED GRANT
  ========================================================== */

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;

    async function loadGrant() {
      setGrantLoading(true);

      devLog(
        "grant_connection_started"
      );

      try {
        const response =
          await fetch(
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
          devLog(
            "grant_connection_unavailable",
            {
              status:
                response.status,
            }
          );

          return;
        }

        const currentGrant =
          data.grant;

        setGrant(
          currentGrant
        );

        const totalOptions =
          currentGrant.optionCount ??
          normalizeProNumber(
            proState.totalOptions
          );

        const exercisePrice =
          currentGrant.strikePrice ??
          normalizeProNumber(
            proState.exercisePrice
          );

        /*
         * SOURCE-OF-TRUTH RULE
         *
         * Phase 2 Vesting owns the active current vesting model:
         * - vestingPeriodMonths
         * - cliffMonths
         * - monthsCompleted
         * - vestedOptions
         * - vestedPercentage
         *
         * Exercise may refresh confirmed grant/source metadata, but it
         * must never recalculate or overwrite today's modeled Vesting
         * position. Future vesting remains a Phase 3 planning scenario.
         */
        updateProState({
          totalOptions,
          exercisePrice,

          sourceGrantId:
            currentGrant.id,

          sourceDocumentId:
            currentGrant
              .document?.id ??
            null,

          sourceCompanyName:
            currentGrant
              .companyName,

          sourceGrantName:
            currentGrant
              .grantName,

          sourceCurrency:
            currentGrant
              .currency ??
            "INR",

          sourceConfirmedAt:
            currentGrant
              .confirmedAt,

          sourceVestingStartDate:
            currentGrant
              .vestingStartDate,

          sourceVestingDurationMonths:
            currentGrant
              .vestingDurationMonths,

          sourceCliffMonths:
            currentGrant
              .cliffMonths,

          sourceVestingFrequency:
            currentGrant
              .vestingFrequency,

          sourceExpiryDate:
            currentGrant
              .expiryDate,

          sourcePostTerminationExerciseDays:
            currentGrant
              .postTerminationExerciseDays,
        });

        /*
         * If the planner has never been customized,
         * seed Future FMV from current exercise FMV.
         */
        setPlanner(
          (previous) => {
            if (
              previous.futureExerciseFMV !==
              DEFAULT_PLANNER_STATE
                .futureExerciseFMV
            ) {
              return previous;
            }

            const currentFMV =
              normalizeProNumber(
                proState.exerciseFMV
              );

            return {
              ...previous,
              futureExerciseFMV:
                currentFMV > 0
                  ? currentFMV
                  : previous
                      .futureExerciseFMV,
            };
          }
        );

        devLog(
          "grant_connection_completed",
          {
            grantId:
              currentGrant.id,

            totalOptions,

            vestedOptions:
              normalizeProNumber(
                proState.vestedOptions
              ),

            monthsCompleted:
              normalizeProNumber(
                proState.monthsCompleted
              ),
          }
        );
      } catch (error) {
        devError(
          "grant_connection_failed",
          error
        );
      } finally {
        if (!cancelled) {
          setGrantLoading(false);
        }
      }
    }

    void loadGrant();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    updateProState,
  ]);

  /* ==========================================================
     CONNECTED VESTING INPUTS
  ========================================================== */

  /*
   * Phase 2 Vesting is authoritative for the active current model.
   * Confirmed source fields remain metadata/fallback context only.
   */
  const vestingPeriodMonths =
    Math.max(
      Math.round(
        normalizeProNumber(
          proState.vestingPeriodMonths
        )
      ),
      1
    );

  const cliffMonths =
    Math.min(
      Math.max(
        Math.round(
          normalizeProNumber(
            proState.cliffMonths
          )
        ),
        0
      ),
      vestingPeriodMonths
    );

  const currentMonthsCompleted =
    Math.min(
      Math.max(
        Math.round(
          normalizeProNumber(
            proState.monthsCompleted
          )
        ),
        0
      ),
      vestingPeriodMonths
    );

  /* ==========================================================
     EXERCISE ENGINE
  ========================================================== */

  const result:
    ReturnType<
      typeof calculateExerciseDecision
    > = useMemo(
    () =>
      calculateExerciseDecision({
        totalOptions:
          normalizeProNumber(
            proState.totalOptions
          ),

        vestedOptions:
          normalizeProNumber(
            proState.vestedOptions
          ),

        strikePrice:
          normalizeProNumber(
            proState.exercisePrice
          ),

        currency:
          proState.sourceCurrency ||
          "INR",

        totalCompanyShares:
          normalizeProNumber(
            proState.totalCompanyShares
          ),

        currentCompanyValuation:
          normalizeProNumber(
            proState
              .currentCompanyValuation
          ),

        vestingPeriodMonths,

        cliffMonths,

        monthsCompleted:
          currentMonthsCompleted,

        exerciseFMV:
          normalizeProNumber(
            proState.exerciseFMV
          ),

        exercisePercentage:
          planner
            .exercisePercentage,

        customExerciseOptions:
          planner.customMode
            ? planner.customOptions
            : undefined,

        exitValuation:
          normalizeProNumber(
            proState.exitValuation
          ),

        futureDilutionPercentage:
          normalizeProNumber(
            proState
              .futureDilutionPercentage
          ),

        otherAnnualIncome:
          normalizeProNumber(
            proState
              .otherAnnualIncome
          ),

        holdingPeriodMonths:
          normalizeProNumber(
            proState
              .holdingPeriodMonths
          ),

        equityType:
          proState.equityType,

        taxRegime:
          proState.taxRegime,

        opportunityCostRate:
          planner
            .opportunityCostRate,

        expectedYearsToLiquidity:
          planner
            .yearsToLiquidity,

        waitMonths:
          planner.waitMonths,

        futureExerciseFMV:
          planner
            .futureExerciseFMV,

        exerciseBudget:
          planner.exerciseBudget,

        expiryDate:
          proState
            .sourceExpiryDate,

        postTerminationExerciseDays:
          proState
            .sourcePostTerminationExerciseDays,
      }),
    [
      proState,
      vestingPeriodMonths,
      cliffMonths,
      currentMonthsCompleted,
      planner,
    ]
  );

  const selectedScenario =
    result.scenarios.find(
      (scenario) =>
        scenario.name ===
        planner.selectedScenario
    ) ??
    result.scenarios[1];

  const connected =
    Boolean(
      grant ||
      proState.sourceGrantId
    );

  useEffect(() => {
    if (!result.isFuturePlanningMode) {
      return;
    }

    devLog("leave_company_context_separated", {
      activeAnalysisContext: result.analysisContextLabel,
      vestedToday: result.leaveCompany.vestedOptionsIfLeavingToday,
      futureModeledVested: result.future.futureVestedOptions,
      futureSelected: result.future.selectedFutureOptions,
      futureCashRequired: result.future.futureTotalCashRequired,
    });
  }, [
    result.isFuturePlanningMode,
    result.analysisContextLabel,
    result.leaveCompany.vestedOptionsIfLeavingToday,
    result.future.futureVestedOptions,
    result.future.selectedFutureOptions,
    result.future.futureTotalCashRequired,
  ]);
  /* ==========================================================
     PUBLISH ACTIVE EXERCISE PLAN TO SHARED PRO STATE

     This makes the active Exercise decision available to
     downstream workspaces such as Exit.

     IMPORTANT:
     - Only writes when the actual plan values change.
     - Avoids a render/update loop caused by updatedAt.
     - Future Planner publishes future modeled values.
     - Exercise Today publishes today's selected position.
  ========================================================== */

  useEffect(() => {
    if (!hydrated || !plannerHydrated) {
      return;
    }

    const nextOptions =
      result.isFuturePlanningMode
        ? result.future.selectedFutureOptions
        : result.selectedOptions;

    const nextWaitMonths =
      result.isFuturePlanningMode
        ? result.future.waitMonths
        : 0;

    const nextFMV =
      result.isFuturePlanningMode
        ? result.future.futureExerciseFMV
        : normalizeProNumber(
            proState.exerciseFMV
          );

    const optionsChanged =
      proState.exercisePlanOptions !==
      nextOptions;

    const waitMonthsChanged =
      proState.exercisePlanWaitMonths !==
      nextWaitMonths;

    const fmvChanged =
      proState.exercisePlanFMV !==
      nextFMV;

    /*
     * Do not update shared state unless the actual
     * Exercise plan changed.
     *
     * This is especially important because
     * exercisePlanUpdatedAt changes on every write.
     * Without this guard, the timestamp itself could
     * cause repeated shared-state updates.
     */
    if (
      !optionsChanged &&
      !waitMonthsChanged &&
      !fmvChanged
    ) {
      return;
    }

    const updatedAt =
      new Date().toISOString();

    updateProState({
      exercisePlanOptions:
        nextOptions,

      exercisePlanWaitMonths:
        nextWaitMonths,

      exercisePlanFMV:
        nextFMV,

      exercisePlanUpdatedAt:
        updatedAt,
    });

    devLog(
      "exercise_plan_published",
      {
        mode:
          result.isFuturePlanningMode
            ? "FUTURE_PLANNER"
            : "TODAY",

        options:
          nextOptions,

        waitMonths:
          nextWaitMonths,

        fmv:
          nextFMV,

        updatedAt,
      }
    );
  }, [
    hydrated,
    plannerHydrated,

    result.isFuturePlanningMode,
    result.selectedOptions,

    result.future
      .selectedFutureOptions,

    result.future
      .waitMonths,

    result.future
      .futureExerciseFMV,

    proState.exerciseFMV,

    proState.exercisePlanOptions,
    proState.exercisePlanWaitMonths,
    proState.exercisePlanFMV,

    updateProState,
  ]);

  /* ==========================================================
     PLANNER ACTIONS
  ========================================================== */
  /* ==========================================================
     PLANNER ACTIONS
  ========================================================== */

  function selectPercent(
    value: ExerciseStrategyPercent
  ) {
    setPlanner(
      (previous) => ({
        ...previous,
        customMode: false,
        exercisePercentage:
          value,
        selectedScenario:
          "Base",
      })
    );

    devLog(
      "strategy_selected",
      {
        percentage:
          value,
      }
    );
  }

  function setCustom(
    value: string
  ) {
    const amount =
      Math.max(
        0,
        Math.floor(
          Number(value) || 0
        )
      );

    const maximum =
      result
        .isFuturePlanningMode
        ? result.future
            .futureVestedOptions
        : result
            .availableOptions;

    setPlanner(
      (previous) => ({
        ...previous,
        customMode: true,
        customOptions:
          Math.min(
            amount,
            maximum
          ),
        selectedScenario:
          "Base",
      })
    );

    devLog(
      "custom_quantity_changed",
      {
        quantity:
          Math.min(
            amount,
            maximum
          ),
      }
    );
  }

  function selectWaitMonths(
    months: number
  ) {
    setPlanner(
      (previous) => ({
        ...previous,
        waitMonths:
          months,
      })
    );

    devLog(
      "wait_period_selected",
      {
        months,
      }
    );
  }

  function updateFutureFMV(
    value: string
  ) {
    const numeric =
      Math.max(
        Number(value) || 0,
        0
      );

    setPlanner(
      (previous) => ({
        ...previous,
        futureExerciseFMV:
          numeric,
      })
    );

    devLog(
      "future_fmv_changed",
      {
        futureFMV:
          numeric,
      }
    );
  }

  function updateExerciseBudget(
    value: string
  ) {
    const numeric =
      Math.max(
        Number(value) || 0,
        0
      );

    setPlanner(
      (previous) => ({
        ...previous,
        exerciseBudget:
          numeric,
      })
    );

    devLog(
      "exercise_budget_changed",
      {
        budget:
          numeric,
      }
    );
  }

  function resetPlanner() {
    const currentFMV =
      normalizeProNumber(
        proState.exerciseFMV
      );

    const next = {
      ...DEFAULT_PLANNER_STATE,
      futureExerciseFMV:
        currentFMV > 0
          ? currentFMV
          : DEFAULT_PLANNER_STATE
              .futureExerciseFMV,
    };

    setPlanner(next);

    devLog(
      "planner_reset"
    );
  }

  /* ==========================================================
     CSV EXPORT
  ========================================================== */

  function exportPlan() {
    const company =
      proState
        .sourceCompanyName ||
      grant?.companyName ||
      "Confirmed ESOP grant";

    const rows:
      (string | number)[][] = [
      [
        "Section",
        "Metric",
        "Raw Value",
        "Display Value",
        "Notes",
      ],

      [
        "Report",
        "Company",
        company,
        company,
        "Confirmed grant source",
      ],

      [
        "Report",
        "Generated at",
        new Date().toISOString(),
        new Date().toLocaleString("en-IN"),
        "Exercise Intelligence export timestamp",
      ],

      [
        "Report",
        "Analysis context",
        result.analysisContext,
        result.analysisContextLabel,
        result.analysisContext === "FUTURE_PLANNER"
          ? `Future-planner analytics ${result.analysisWaitMonths} months ahead`
          : "Current vested/exercisable position",
      ],

      [
        "Report",
        "Mode",
        result
          .isFuturePlanningMode
          ? "FUTURE_PLANNER"
          : "TODAY",
        result
          .isFuturePlanningMode
          ? "Future Exercise Planner"
          : "Exercise Today",
        "Determined by current vesting",
      ],

      [
        "Grant",
        "Total options",
        proState.totalOptions,
        num(
          proState.totalOptions
        ),
        "Confirmed/shared grant",
      ],

      [
        "Grant",
        "Exercisable today",
        result.availableOptions,
        num(
          result.availableOptions
        ),
        "Currently vested",
      ],

      [
        "Today",
        "Selected options",
        result.selectedOptions,
        num(
          result.selectedOptions
        ),
        planner.customMode
          ? "Custom quantity"
          : `${planner.exercisePercentage}% strategy`,
      ],

      [
        "Today",
        "Exercise cost",
        result.exerciseCost,
        money(
          result.exerciseCost
        ),
        "Strike cash",
      ],

      [
        "Today",
        "Exercise-stage tax",
        result.exerciseStageTax,
        money(
          result.exerciseStageTax
        ),
        "Illustrative shared India Tax model",
      ],

      [
        "Today",
        "Total cash required",
        result.totalCashRequired,
        money(
          result.totalCashRequired
        ),
        "Exercise + exercise-stage tax",
      ],

      [
        "Future Planner",
        "Wait months",
        result.future.waitMonths,
        `${result.future.waitMonths} months`,
        "User planning assumption",
      ],

      [
        "Future Planner",
        "Future vested options",
        result.future
          .futureVestedOptions,
        num(
          result.future
            .futureVestedOptions
        ),
        "Calculated by shared Vesting engine",
      ],

      [
        "Future Planner",
        "Future exercise FMV",
        result.future
          .futureExerciseFMV,
        unitMoney(
          result.future
            .futureExerciseFMV
        ),
        "User planning assumption",
      ],

      [
        "Future Planner",
        "Future selected options",
        result.future
          .selectedFutureOptions,
        num(
          result.future
            .selectedFutureOptions
        ),
        "Same selected percentage/custom plan",
      ],

      [
        "Future Planner",
        "Future exercise tax",
        result.future
          .futureExerciseStageTax,
        money(
          result.future
            .futureExerciseStageTax
        ),
        "Illustrative",
      ],

      [
        "Future Planner",
        "Future total cash required",
        result.future
          .futureTotalCashRequired,
        money(
          result.future
            .futureTotalCashRequired
        ),
        "Exercise + exercise-stage tax",
      ],

      [
        "Active Analysis",
        "Available options",
        result.analysisAvailableOptions,
        num(result.analysisAvailableOptions),
        result.analysisContextLabel,
      ],

      [
        "Active Analysis",
        "Selected options",
        result.analysisSelectedOptions,
        num(result.analysisSelectedOptions),
        planner.customMode
          ? "Custom quantity"
          : `${planner.exercisePercentage}% strategy`,
      ],

      [
        "Active Analysis",
        "Exercise FMV",
        result.analysisExerciseFMV,
        unitMoney(result.analysisExerciseFMV),
        result.analysisContextLabel,
      ],

      [
        "Active Analysis",
        "Exercise cost",
        result.analysisExerciseCost,
        money(result.analysisExerciseCost),
        result.analysisContextLabel,
      ],

      [
        "Active Analysis",
        "Exercise-stage tax",
        result.analysisExerciseStageTax,
        money(result.analysisExerciseStageTax),
        result.analysisContextLabel,
      ],

      [
        "Active Analysis",
        "Total cash required",
        result.analysisTotalCashRequired,
        money(result.analysisTotalCashRequired),
        result.analysisContextLabel,
      ],

      [
        "Break-even",
        "Cash recovery share price",
        result.breakEven
          .cashRecoverySharePrice,
        unitMoney(
          result.breakEven
            .cashRecoverySharePrice
        ),
        "Approximate",
      ],

      [
        "Break-even",
        "Cash recovery company valuation",
        result.breakEven
          .cashRecoveryCompanyValuation,
        money(
          result.breakEven
            .cashRecoveryCompanyValuation
        ),
        "After shared dilution",
      ],

      ...result.scenarios.flatMap(
        (scenario) => [
          [
            scenario.name,
            "Exit valuation",
            scenario.exitValuation,
            money(
              scenario.exitValuation
            ),
            scenario.description,
          ],

          [
            scenario.name,
            "Post-dilution share price",
            scenario
              .postDilutionSharePrice,
            unitMoney(
              scenario
                .postDilutionSharePrice
            ),
            "Shared relative dilution held constant",
          ],

          [
            scenario.name,
            "Estimated tax",
            scenario.estimatedTax,
            money(
              scenario.estimatedTax
            ),
            "Illustrative",
          ],

          [
            scenario.name,
            "Estimated take-home",
            scenario
              .estimatedTakeHome,
            money(
              scenario
                .estimatedTakeHome
            ),
            "Illustrative",
          ],
        ]
      ),

      [
        "Phase 3",
        "Cash budget",
        result.budget.budget,
        money(result.budget.budget),
        "User planning budget",
      ],

      [
        "Phase 3",
        "Affordable options",
        result.budget.affordableOptions,
        num(result.budget.affordableOptions),
        "Maximum whole-option quantity within modeled budget",
      ],

      [
        "Phase 3",
        "Budget cash used",
        result.budget.totalCashRequired,
        money(result.budget.totalCashRequired),
        "Strike + modeled exercise-stage tax",
      ],

      [
        "Phase 3",
        "Budget unused",
        result.budget.unusedBudget,
        money(result.budget.unusedBudget),
        "Modeled budget headroom",
      ],

      [
        "Phase 3",
        "Decision scorecard",
        result.scorecard.headline,
        result.scorecard.headline,
        result.scorecard.summary,
      ],

      [
        "Leaving Company",
        "Post-termination window",
        result.leaveCompany
          .postTerminationExerciseDays ??
          "",
        result.leaveCompany
          .postTerminationExerciseDays ===
        null
          ? "Not confirmed"
          : `${result.leaveCompany.postTerminationExerciseDays} days`,
        "Confirmed grant when available",
      ],

      [
        "Leaving Company",
        "Modeled exercise deadline",
        result.leaveCompany
          .modeledExerciseDeadline ??
          "",
        result.leaveCompany
          .modeledExerciseDeadline
          ? formatDate(
              result.leaveCompany
                .modeledExerciseDeadline
            )
          : "Not available",
        "If employment ended today",
      ],

      [
        "Leaving Company",
        "Unvested options potentially at risk",
        result.leaveCompany
          .unvestedOptionsAtRisk,
        num(
          result.leaveCompany
            .unvestedOptionsAtRisk
        ),
        "Based on current vesting assumptions",
      ],

      ...result.decisionFactors.flatMap(
        (factor) => [
          [
            "Decision Factor",
            factor.label,
            factor.risk,
            factor.headline,
            `${factor.contextLabel}: ${factor.explanation}`,
          ],
        ]
      ),

      [
        "Decision",
        "Overall signal",
        result.overallSignal,
        result.overallSignal,
        "Transparent factor summary, not financial advice",
      ],
    ];

    const csvContent =
      rows
        .map(
          (row) =>
            row
              .map(
                (value) =>
                  csv(
                    String(value)
                  )
              )
              .join(",")
        )
        .join("\r\n");

    const blob =
      new Blob(
        [
          "\uFEFF" +
            csvContent,
        ],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href = url;

    anchor.download =
      `esop-exercise-plan-${slug(
        company
      )}-${new Date()
        .toISOString()
        .slice(
          0,
          10
        )}.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      url
    );

    devLog(
      "exercise_plan_exported",
      {
        mode:
          result
            .isFuturePlanningMode
            ? "FUTURE_PLANNER"
            : "TODAY",

        selectedOptions:
          result.selectedOptions,

        futureSelectedOptions:
          result.future
            .selectedFutureOptions,

        scenario:
          planner
            .selectedScenario,

        analysisContext:
          result.analysisContext,

        analysisContextLabel:
          result.analysisContextLabel,

        analysisSelectedOptions:
          result.analysisSelectedOptions,

        analysisTotalCashRequired:
          result.analysisTotalCashRequired,
      }
    );
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    !hydrated ||
    !plannerHydrated
  ) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
            Preparing Exercise
            Decision Intelligence...
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     DERIVED DISPLAY VALUES
  ========================================================== */

  const planningAvailableOptions =
    result.isFuturePlanningMode
      ? result.future
          .futureVestedOptions
      : result.availableOptions;

  const planningSelectedOptions =
    result.isFuturePlanningMode
      ? result.future
          .selectedFutureOptions
      : result.selectedOptions;

  const planningCash =
    result.isFuturePlanningMode
      ? result.future
          .futureTotalCashRequired
      : result.totalCashRequired;

  const planningTax =
    result.isFuturePlanningMode
      ? result.future
          .futureExerciseStageTax
      : result.exerciseStageTax;

  const planningExerciseCost =
    result.isFuturePlanningMode
      ? result.future
          .futureExerciseCost
      : result.exerciseCost;

  const planningBaseTakeHome =
    result.isFuturePlanningMode
      ? result.future
          .futureBaseEstimatedTakeHome
      : result.scenarios[1]
          ?.estimatedTakeHome ??
        0;

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 md:py-10">

        {/* HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/pro"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to PRO Workspace
          </Link>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                exportPlan
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <Download
                size={14}
              />
              Export premium exercise plan
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
              <Sparkles
                size={13}
              />
              Exercise Intelligence
            </div>
          </div>
        </div>

        {/* HERO */}

        <section className="mt-8 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
            <Landmark
              size={22}
            />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">
              Capital decision workspace
            </p>

            <h1 className="mt-1 max-w-5xl text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
              Exercise is where your
              ESOP becomes a real cash
              decision.
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              Compare exercise strategies,
              fit the decision to your cash
              budget, model Now vs Wait,
              understand leaving-company
              pressure, and see the cash,
              tax, liquidity and timing
              trade-offs together.
            </p>
          </div>
        </section>

        {/* CONFIRMED GRANT */}

        {connected ? (
          <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <CheckCircle2
                  size={17}
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  Confirmed grant
                  connected
                </p>

                <p className="mt-1 text-sm font-black">
                  {proState
                    .sourceCompanyName ||
                    grant
                      ?.companyName ||
                    "Confirmed ESOP grant"}
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  {num(
                    proState
                      .totalOptions
                  )}{" "}
                  total ·{" "}
                  {unitMoney(
                    proState
                      .exercisePrice
                  )}{" "}
                  strike ·{" "}
                  {num(
                    result
                      .availableOptions
                  )}{" "}
                  exercisable today
                </p>
              </div>
            </div>

            {proState
              .sourceDocumentId && (
              <Link
                href={`/pro/grants/${proState.sourceDocumentId}/review`}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100/50"
              >
                View source grant
                <ArrowUpRight
                  size={14}
                />
              </Link>
            )}
          </section>
        ) : grantLoading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500">
            Connecting confirmed
            grant...
          </div>
        ) : null}

        {/* CONNECTIONS */}

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <Connection
            icon={
              <Clock3
                size={16}
              />
            }
            title="Vesting connected"
            value={`${num(
              result
                .availableOptions
            )} exercisable today`}
            href="/pro/vesting"
          />

          <Connection
            icon={
              <GitBranch
                size={16}
              />
            }
            title="Dilution connected"
            value={`${pct(
              proState
                .futureDilutionPercentage
            )} relative`}
            href="/pro/dilution"
          />

          <Connection
            icon={
              <ReceiptIndianRupee
                size={16}
              />
            }
            title="Tax connected"
            value={`${unitMoney(
              proState
                .exerciseFMV
            )} current FMV`}
            href="/pro/tax"
          />
        </section>

        {/* MODE BANNER */}

        {result
          .isFuturePlanningMode ? (
          <section className="mt-5 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-blue-50">
            <div className="grid gap-5 p-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                <LockKeyhole
                  size={21}
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">
                  Future Exercise
                  Planner active
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Nothing is exercisable
                  today — so prepare for
                  the next vesting
                  milestone instead.
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  The confirmed grant
                  remains locked to
                  actual vesting. The
                  planner below uses
                  future months and a
                  user-entered FMV only
                  as a scenario.
                </p>
              </div>

              <Link
                href="/pro/vesting"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white"
              >
                View vesting timeline
                <ArrowUpRight
                  size={14}
                />
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2
                size={18}
                className="text-blue-600"
              />

              <div>
                <p className="text-xs font-black text-blue-950">
                  Exercise Today mode
                </p>

                <p className="mt-1 text-[11px] text-blue-900/70">
                  Only currently vested
                  options can be selected.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TOP METRICS */}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric
            label={
              result
                .isFuturePlanningMode
                ? `Vested after ${result.future.waitMonths} months`
                : "Available to exercise"
            }
            value={num(
              planningAvailableOptions
            )}
            helper={
              result
                .isFuturePlanningMode
                ? `${num(
                    result.future
                      .newlyVestedOptions
                  )} newly vested`
                : "Currently vested options"
            }
            icon={
              <Target
                size={18}
              />
            }
          />

          <Metric
            label="Selected exercise"
            value={num(
              planningSelectedOptions
            )}
            helper={
              planner.customMode
                ? "Custom quantity"
                : `${planner.exercisePercentage}% of available`
            }
            icon={
              <Gauge
                size={18}
              />
            }
          />

          <Metric
            label={
              result
                .isFuturePlanningMode
                ? "Future cash required"
                : "Cash required now"
            }
            value={money(
              planningCash
            )}
            helper="Exercise + exercise-stage tax"
            icon={
              <Wallet
                size={18}
              />
            }
            highlight
          />

          <Metric
            label="Base take-home"
            value={money(
              planningBaseTakeHome
            )}
            helper={
              result
                .isFuturePlanningMode
                ? "Future-planner Base outcome"
                : "Illustrative after-tax exit"
            }
            icon={
              <TrendingUp
                size={18}
              />
            }
          />
        </section>

        {/* WORKSPACE */}

        <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">

          {/* LEFT COLUMN */}

          <div className="space-y-6">

            {/* FUTURE CONTROLS */}

            <Panel>
              <Eyebrow>
                Future Exercise Planner
              </Eyebrow>

              <h2 className="mt-1 text-xl font-black">
                When do you want to
                model exercising?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Waiting changes how many
                options may be vested and
                may also change the FMV
                used for exercise-stage
                tax.
              </p>

              <div className="mt-5 grid grid-cols-4 gap-2">
                {[
                  6,
                  12,
                  24,
                  36,
                ].map(
                  (months) => (
                    <button
                      key={
                        months
                      }
                      type="button"
                      onClick={() =>
                        selectWaitMonths(
                          months
                        )
                      }
                      className={`rounded-xl border px-2 py-3 text-xs font-black transition ${
                        planner
                          .waitMonths ===
                        months
                          ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                      }`}
                    >
                      +
                      {months}
                      m
                    </button>
                  )
                )}
              </div>

              <div className="mt-5">
                <Label className="text-xs font-black text-slate-700">
                  Future exercise FMV
                </Label>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Your planning
                  assumption — not a
                  company forecast.
                </p>

                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₹
                  </span>

                  <Input
                    type="number"
                    min={0}
                    value={
                      planner
                        .futureExerciseFMV
                    }
                    onChange={(
                      event
                    ) =>
                      updateFutureFMV(
                        event
                          .target
                          .value
                      )
                    }
                    className="h-11 rounded-xl bg-slate-50 pl-8"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <Row
                  label="Future vested"
                  value={num(
                    result.future
                      .futureVestedOptions
                  )}
                />

                <Row
                  label="Newly vested"
                  value={num(
                    result.future
                      .newlyVestedOptions
                  )}
                />

                <Row
                  label="Future vesting %"
                  value={pct(
                    result.future
                      .futureVestedPercentage
                  )}
                />

                <div className="my-3 border-t border-violet-100" />

                <Row
                  label="Future cash required"
                  value={money(
                    result.future
                      .futureTotalCashRequired
                  )}
                  strong
                />
              </div>
            </Panel>

            {/* EXERCISE QUANTITY */}

            <Panel>
              <Eyebrow>
                Exercise quantity
              </Eyebrow>

              <h2 className="mt-1 text-xl font-black">
                How much do you want to
                model?
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {result
                  .isFuturePlanningMode
                  ? `Applied to the ${num(
                      result.future
                        .futureVestedOptions
                    )} options modeled as vested after ${result.future.waitMonths} months.`
                  : "Applied only to options currently vested."}
              </p>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {(
                  [
                    0,
                    25,
                    50,
                    75,
                    100,
                  ] as ExerciseStrategyPercent[]
                ).map(
                  (value) => (
                    <button
                      key={
                        value
                      }
                      type="button"
                      disabled={
                        planningAvailableOptions <=
                        0
                      }
                      onClick={() =>
                        selectPercent(
                          value
                        )
                      }
                      className={`rounded-xl border px-2 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        !planner
                          .customMode &&
                        planner
                          .exercisePercentage ===
                          value
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                      }`}
                    >
                      {
                        value
                      }
                      %
                    </button>
                  )
                )}
              </div>

              <div className="mt-5">
                <Label className="text-xs font-black text-slate-700">
                  Custom option quantity
                </Label>

                <p className="mt-1 text-[11px] text-slate-500">
                  Maximum{" "}
                  {num(
                    planningAvailableOptions
                  )}{" "}
                  options.
                </p>

                <Input
                  type="number"
                  min={0}
                  max={
                    planningAvailableOptions
                  }
                  disabled={
                    planningAvailableOptions <=
                    0
                  }
                  value={
                    planner
                      .customMode
                      ? planner
                          .customOptions
                      : ""
                  }
                  placeholder="Enter options"
                  onChange={(
                    event
                  ) =>
                    setCustom(
                      event
                        .target
                        .value
                    )
                  }
                  className="mt-2 h-11 rounded-xl bg-slate-50"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Row
                  label="Exercise cost"
                  value={money(
                    planningExerciseCost
                  )}
                />

                <Row
                  label="Exercise-stage tax"
                  value={money(
                    planningTax
                  )}
                />

                <div className="my-3 border-t border-slate-200" />

                <Row
                  label="Total cash required"
                  value={money(
                    planningCash
                  )}
                  strong
                />
              </div>
            </Panel>

            {/* CAPITAL ASSUMPTIONS */}

            <Panel>
              <Eyebrow>
                Capital assumptions
              </Eyebrow>

              <h2 className="mt-1 text-xl font-black">
                Cost of committing cash
              </h2>

              <div className="mt-5 space-y-5">
                <Field
                  label="Opportunity-cost rate"
                  helper="Illustrative annual return you could earn elsewhere"
                  value={
                    planner
                      .opportunityCostRate
                  }
                  suffix="% p.a."
                  onChange={(
                    value
                  ) =>
                    setPlanner(
                      (
                        previous
                      ) => ({
                        ...previous,
                        opportunityCostRate:
                          Math.max(
                            0,
                            Number(
                              value
                            ) ||
                              0
                          ),
                      })
                    )
                  }
                />

                <Field
                  label="Expected years to liquidity"
                  helper="Illustrative time before a possible exit"
                  value={
                    planner
                      .yearsToLiquidity
                  }
                  suffix="years"
                  onChange={(
                    value
                  ) =>
                    setPlanner(
                      (
                        previous
                      ) => ({
                        ...previous,
                        yearsToLiquidity:
                          Math.max(
                            0,
                            Number(
                              value
                            ) ||
                              0
                          ),
                      })
                    )
                  }
                />
              </div>

              <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
                  Economic commitment
                  today
                </p>

                <p className="mt-2 text-2xl font-black">
                  {money(
                    result
                      .economicCashCommitment
                  )}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Includes{" "}
                  {money(
                    result
                      .opportunityCost
                  )}{" "}
                  modeled opportunity
                  cost on cash committed
                  today.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  resetPlanner
                }
                className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
              >
                Reset exercise planning
                assumptions
              </button>
            </Panel>

            {/* TIMING */}

            <Panel>
              <Eyebrow>
                Grant timing
              </Eyebrow>

              <h2 className="mt-1 text-xl font-black">
                How much time do you
                have?
              </h2>

              <div className="mt-5 space-y-3">
                <Timing
                  label="Grant expiry"
                  value={
                    result.timing
                      .daysUntilExpiry ===
                    null
                      ? "Not confirmed"
                      : result.timing
                            .daysUntilExpiry <
                          0
                        ? "Expired"
                        : `${num(
                            result
                              .timing
                              .daysUntilExpiry
                          )} days`
                  }
                  risk={
                    result.timing
                      .expiryRisk
                  }
                />

                <Timing
                  label="Post-termination window"
                  value={
                    result.timing
                      .postTerminationExerciseDays ===
                    null
                      ? "Not confirmed"
                      : `${result.timing.postTerminationExerciseDays} days`
                  }
                  risk={
                    result.timing
                      .terminationWindowRisk
                  }
                />

                <Timing
                  label={`Expiry after waiting ${result.future.waitMonths}m`}
                  value={
                    result.future
                      .remainingDaysToExpiry ===
                    null
                      ? "Not confirmed"
                      : result.future
                            .remainingDaysToExpiry <
                          0
                        ? "Past expiry"
                        : `${num(
                            result.future
                              .remainingDaysToExpiry
                          )} days left`
                  }
                  risk={
                    result
                      .timingComparison
                      .wait
                      .expiryRisk
                  }
                />
              </div>
            </Panel>
          </div>

          {/* RIGHT COLUMN */}

          <div className="space-y-6">

            {/* COCKPIT */}

            <section className="overflow-hidden rounded-3xl border border-slate-950 bg-slate-950 p-7 text-white shadow-sm md:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                    Phase 3 · Exercise Decision Intelligence
                  </p>

                  <h2 className="mt-2 max-w-3xl text-2xl font-black md:text-3xl">
                    {result.scorecard.headline}
                  </h2>

                  <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">
                    {result.scorecard.summary}
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-violet-200">
                  {result
                    .isFuturePlanningMode
                    ? "FUTURE PLANNER"
                    : result
                        .overallSignal}
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Dark
                  label={
                    result
                      .isFuturePlanningMode
                      ? "Future vested"
                      : "Selected options"
                  }
                  value={num(
                    result
                      .isFuturePlanningMode
                      ? result
                          .future
                          .futureVestedOptions
                      : result
                          .selectedOptions
                  )}
                />

                <Dark
                  label={
                    result
                      .isFuturePlanningMode
                      ? "Future selected"
                      : "Cash now"
                  }
                  value={
                    result
                      .isFuturePlanningMode
                      ? num(
                          result
                            .future
                            .selectedFutureOptions
                        )
                      : money(
                          result
                            .totalCashRequired
                        )
                  }
                />

                <Dark
                  label={
                    result
                      .isFuturePlanningMode
                      ? "Future FMV"
                      : "Cash preserved if waiting"
                  }
                  value={
                    result
                      .isFuturePlanningMode
                      ? unitMoney(
                          result
                            .future
                            .futureExerciseFMV
                        )
                      : money(
                          result
                            .timingComparison
                            .wait
                            .cashPreservedToday
                        )
                  }
                />

                <Dark
                  label="Base take-home"
                  value={money(
                    planningBaseTakeHome
                  )}
                />
              </div>
            </section>

            {/* PHASE 3 — COMPLETE DECISION INTELLIGENCE */}

            <section className="overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-white via-violet-50/40 to-blue-50/60 shadow-sm">
              <div className="border-b border-violet-100 p-6 md:p-7">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Eyebrow>
                        Exercise Decision Intelligence
                      </Eyebrow>

                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-700">
                        Live model
                      </span>
                    </div>

                    <h2 className="mt-2 text-2xl font-black tracking-tight">
                      Turn the exercise model into an actual decision framework.
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      Compare strategy trade-offs, fit an exercise plan to a cash
                      budget, understand Now vs Wait, and see the capital, tax,
                      liquidity and deadline pressures together.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-violet-600">
                      Active context
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {result.analysisContextLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="border-b border-violet-100 p-6 md:p-7 xl:border-b-0 xl:border-r">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Strategy intelligence
                  </p>

                  <h3 className="mt-2 text-xl font-black">
                    See what each strategy optimizes.
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    These are descriptive trade-off labels, not recommendations.
                    Click a strategy card to apply it to the complete Exercise model.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <StrategyInsight
                      label="Lowest cash"
                      strategy={result.strategyIntelligence.lowestCashStrategy}
                      helper="Smallest positive modeled capital commitment"
                      onSelect={selectPercent}
                    />

                    <StrategyInsight
                      label="Lowest exercise tax"
                      strategy={result.strategyIntelligence.lowestTaxStrategy}
                      helper="Smallest positive modeled exercise-stage tax"
                      onSelect={selectPercent}
                    />

                    <StrategyInsight
                      label="Highest take-home"
                      strategy={result.strategyIntelligence.highestTakeHomeStrategy}
                      helper="Largest Base modeled take-home"
                      onSelect={selectPercent}
                      accent
                    />

                    <StrategyInsight
                      label="Balanced partial"
                      strategy={result.strategyIntelligence.balancedStrategy}
                      helper="50% reference point for capital vs exposure"
                      onSelect={selectPercent}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                          Maximum optionality
                        </p>
                        <p className="mt-1 text-sm font-black">
                          {result.strategyIntelligence.maximumOptionalityStrategy
                            ? `${result.strategyIntelligence.maximumOptionalityStrategy.percentage}% · ${num(
                                result.strategyIntelligence.maximumOptionalityStrategy.options
                              )} options`
                            : "No positive strategy available"}
                        </p>
                      </div>

                      <p className="max-w-sm text-[10px] leading-4 text-slate-500 sm:text-right">
                        Commits the smallest positive modeled quantity while
                        retaining the largest unexercised pool.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600">
                    Cash Budget Mode
                  </p>

                  <h3 className="mt-2 text-xl font-black">
                    How much exercise can your cash budget support?
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Enter the maximum cash you are willing to model. The engine
                    solves for the largest whole-option quantity whose strike cost
                    plus modeled exercise-stage tax stays within that budget.
                  </p>

                  <div className="mt-5">
                    <Label className="text-xs font-black text-slate-700">
                      Exercise cash budget
                    </Label>

                    <div className="relative mt-2">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        ₹
                      </span>

                      <Input
                        type="number"
                        min={0}
                        step={10000}
                        value={planner.exerciseBudget}
                        onChange={(event) =>
                          updateExerciseBudget(
                            event.target.value
                          )
                        }
                        className="h-12 rounded-xl border-violet-200 bg-white pl-8 text-base font-black"
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {[100000, 200000, 500000, 1000000].map(
                        (budget) => (
                          <button
                            key={budget}
                            type="button"
                            onClick={() =>
                              updateExerciseBudget(
                                String(budget)
                              )
                            }
                            className={`rounded-xl border px-2 py-2.5 text-[10px] font-black transition ${
                              planner.exerciseBudget === budget
                                ? "border-violet-600 bg-violet-600 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
                            }`}
                          >
                            {money(budget)}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-violet-300">
                          Affordable exercise
                        </p>

                        <p className="mt-2 text-3xl font-black">
                          {num(result.budget.affordableOptions)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          options · {pct(result.budget.affordablePercentage)} of
                          the active available pool
                        </p>
                      </div>

                      <Wallet
                        size={22}
                        className="text-violet-300"
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <BudgetMetric
                        label="Strike cost"
                        value={money(result.budget.exerciseCost)}
                      />
                      <BudgetMetric
                        label="Exercise tax"
                        value={money(result.budget.exerciseStageTax)}
                      />
                      <BudgetMetric
                        label="Budget used"
                        value={money(result.budget.totalCashRequired)}
                      />
                      <BudgetMetric
                        label="Unused budget"
                        value={money(result.budget.unusedBudget)}
                        accent
                      />
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-400">
                          Base modeled take-home
                        </span>
                        <span className="text-sm font-black">
                          {money(result.budget.baseEstimatedTakeHome)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-400">
                          Base modeled return
                        </span>
                        <span className="text-sm font-black text-violet-300">
                          {multiple(result.budget.baseReturnMultiple)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {result.budget.affordableOptions > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setCustom(
                          String(result.budget.affordableOptions)
                        )
                      }
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-black text-white transition hover:bg-violet-700"
                    >
                      Use this budget-sized plan
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-violet-100 bg-white/70 p-6 md:p-7">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-600">
                      Now vs Wait intelligence
                    </p>
                    <p className="mt-2 max-w-3xl text-sm font-black text-slate-950">
                      {result.nowVsWaitIntelligence.interpretation}
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-violet-700">
                    Wait {result.future.waitMonths}m
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <IntelligenceDelta
                    label="Options difference"
                    value={signedNumber(
                      result.nowVsWaitIntelligence.optionsDifference
                    )}
                    helper="Wait vs exercise now"
                  />

                  <IntelligenceDelta
                    label="Cash difference"
                    value={signedMoney(
                      result.nowVsWaitIntelligence.cashDifference
                    )}
                    helper="Future modeled cash"
                  />

                  <IntelligenceDelta
                    label="Tax difference"
                    value={signedMoney(
                      result.nowVsWaitIntelligence.taxDifference
                    )}
                    helper="Exercise-stage tax"
                  />

                  <IntelligenceDelta
                    label="Take-home difference"
                    value={signedMoney(
                      result.nowVsWaitIntelligence.takeHomeDifference
                    )}
                    helper="Base modeled outcome"
                    accent
                  />
                </div>
              </div>
            </section>

            {/* PHASE 3 — DECISION SCORECARD */}

            <Panel>
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div>
                  <Eyebrow>
                    Exercise Decision Scorecard
                  </Eyebrow>

                  <h2 className="mt-1 text-xl font-black">
                    See the pressure points before you commit capital.
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    The scorecard summarizes modeled burdens and risks. It does
                    not convert them into a personalized exercise recommendation.
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-violet-600">
                    Base modeled upside
                  </p>
                  <p className="mt-1 text-xl font-black text-violet-900">
                    {multiple(result.scorecard.modeledUpsideMultiple)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <ScoreMetric
                  label="Capital burden"
                  risk={result.scorecard.capitalBurden}
                  helper="Cash commitment vs modeled annual income"
                />

                <ScoreMetric
                  label="Tax burden"
                  risk={result.scorecard.taxBurden}
                  helper="Exercise-stage tax share of modeled cash"
                />

                <ScoreMetric
                  label="Liquidity exposure"
                  risk={result.scorecard.liquidityExposure}
                  helper="Private equity may remain illiquid"
                />

                <ScoreMetric
                  label="Deadline pressure"
                  risk={result.scorecard.deadlinePressure}
                  helper="Expiry + post-termination timing"
                />

                <ScoreMetric
                  label="Optionality committed"
                  risk={result.scorecard.optionality}
                  helper="Share of active option pool selected"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert
                    size={18}
                    className="mt-0.5 shrink-0 text-violet-600"
                  />

                  <div>
                    <p className="text-sm font-black">
                      {result.scorecard.headline}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {result.scorecard.summary}
                    </p>
                  </div>
                </div>
              </div>
            </Panel>

            {/* NOW VS WAIT */}

            <Panel>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Eyebrow>
                    Now vs Wait
                  </Eyebrow>

                  <h2 className="mt-1 text-xl font-black">
                    Compare the cash and
                    tax trade-off
                  </h2>
                </div>

                <div className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[10px] font-black text-violet-700">
                  WAIT{" "}
                  {result.future
                    .waitMonths}
                  M
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Decision
                  title="Exercise now"
                  icon={
                    <CircleDollarSign
                      size={18}
                    />
                  }
                  rows={[
                    [
                      "Options",
                      num(
                        result
                          .selectedOptions
                      ),
                    ],
                    [
                      "Cash today",
                      money(
                        result
                          .totalCashRequired
                      ),
                    ],
                    [
                      "Exercise-stage tax",
                      money(
                        result
                          .exerciseStageTax
                      ),
                    ],
                    [
                      "Opportunity cost",
                      money(
                        result
                          .opportunityCost
                      ),
                    ],
                    [
                      "Base take-home",
                      money(
                        result
                          .timingComparison
                          .exerciseNow
                          .baseEstimatedTakeHome
                      ),
                    ],
                  ]}
                  note="Uses options actually vested today and the current exercise FMV."
                />

                <Decision
                  title={`Wait ${result.future.waitMonths} months`}
                  icon={
                    <PiggyBank
                      size={18}
                    />
                  }
                  rows={[
                    [
                      "Cash today",
                      "₹0",
                    ],
                    [
                      "Future vested",
                      num(
                        result.future
                          .futureVestedOptions
                      ),
                    ],
                    [
                      "Future selected",
                      num(
                        result.future
                          .selectedFutureOptions
                      ),
                    ],
                    [
                      "Future exercise tax",
                      money(
                        result.future
                          .futureExerciseStageTax
                      ),
                    ],
                    [
                      "Future cash required",
                      money(
                        result.future
                          .futureTotalCashRequired
                      ),
                    ],
                    [
                      "Future Base take-home",
                      money(
                        result.future
                          .futureBaseEstimatedTakeHome
                      ),
                    ],
                  ]}
                  note={`Uses your ₹${planner.futureExerciseFMV.toLocaleString(
                    "en-IN"
                  )} future FMV assumption. This is a planning scenario, not a forecast.`}
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <DeltaCard
                  label="Cash change"
                  value={signedMoney(
                    result.future
                      .cashIncreaseVsToday
                  )}
                  helper="Future cash vs today"
                />

                <DeltaCard
                  label="Tax change"
                  value={signedMoney(
                    result.future
                      .taxIncreaseVsToday
                  )}
                  helper="Exercise-stage tax"
                />

                <DeltaCard
                  label="Additional vesting"
                  value={`+${num(
                    result.future
                      .newlyVestedOptions
                  )}`}
                  helper="Options gained by waiting"
                />
              </div>
            </Panel>

            {/* INTERACTIVE FRONTIER */}

            <Panel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Eyebrow>
                  {result.isFuturePlanningMode
                    ? "Future Exercise Frontier"
                    : "Partial Exercise Frontier"}
                </Eyebrow>

                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
                  {result.analysisContextLabel}
                </span>
              </div>

              <h2 className="mt-1 text-xl font-black">
                Click a strategy to
                change the entire model
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {result.isFuturePlanningMode
                  ? `The frontier compares exercise cash with the Base modeled take-home ${result.analysisWaitMonths} months ahead. Selecting a row recalculates the complete future plan.`
                  : "The frontier compares immediate exercise cash with the Base modeled take-home. Selecting a row recalculates the current exercise plan."}
              </p>

              <div className="mt-6 space-y-3">
                {result.strategies.map(
                  (
                    strategy
                  ) => {
                    const active =
                      !planner
                        .customMode &&
                      planner
                        .exercisePercentage ===
                        strategy
                          .percentage;

                    const maxValue =
                      Math.max(
                        ...result
                          .strategies
                          .flatMap(
                            (
                              item
                            ) => [
                              item
                                .totalCashRequired,
                              item
                                .baseEstimatedTakeHome,
                            ]
                          ),
                        1
                      );

                    return (
                      <button
                        type="button"
                        key={
                          strategy
                            .percentage
                        }
                        disabled={
                          result
                            .analysisAvailableOptions <=
                          0
                        }
                        onClick={() =>
                          selectPercent(
                            strategy
                              .percentage
                          )
                        }
                        className={`w-full rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                          active
                            ? "border-violet-300 bg-violet-50 shadow-sm"
                            : "border-slate-200 bg-slate-50 hover:border-violet-200 hover:bg-white"
                        }`}
                      >
                        <div className="grid grid-cols-[56px_minmax(0,1fr)_110px] items-center gap-3">
                          <div>
                            <p className="text-sm font-black">
                              {
                                strategy
                                  .percentage
                              }
                              %
                            </p>

                            <p className="mt-1 text-[9px] text-slate-400">
                              {num(
                                strategy
                                  .options
                              )}{" "}
                              opts
                            </p>

                            <StrategyTag
                              strategy={strategy}
                              intelligence={result.strategyIntelligence}
                            />
                          </div>

                          <div className="space-y-2">
                            <Bar
                              value={
                                strategy
                                  .totalCashRequired
                              }
                              max={
                                maxValue
                              }
                              className="bg-slate-400"
                            />

                            <Bar
                              value={
                                strategy
                                  .baseEstimatedTakeHome
                              }
                              max={
                                maxValue
                              }
                              className="bg-violet-500"
                            />
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black">
                              {money(
                                strategy
                                  .totalCashRequired
                              )}
                            </p>

                            <p className="mt-1 text-[9px] text-slate-400">
                              cash
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              {result.isFuturePlanningMode && (
                <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-3 text-[11px] leading-5 text-violet-900/80">
                  <strong>
                    Future Exercise Frontier · {result.analysisWaitMonths} months ahead.
                  </strong>{" "}
                  These strategies use {num(result.analysisAvailableOptions)} modeled vested options and your {unitMoney(result.analysisExerciseFMV)} future FMV assumption. Click any row to recalculate the future plan.
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-bold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Cash required
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  Base take-home
                </span>
              </div>
            </Panel>

            {/* FUTURE VESTING TIMELINE */}

            <Panel>
              <Eyebrow>
                Vesting-to-Exercise Timeline
              </Eyebrow>

              <h2 className="mt-1 text-xl font-black">
                See how exercisable
                capacity grows over time
              </h2>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                {[
                  6,
                  12,
                  24,
                  36,
                ].map(
                  (months) => {
                    const vesting =
                      calculateVesting({
                        totalOptions:
                          normalizeProNumber(
                            proState
                              .totalOptions
                          ),

                        exercisePrice:
                          normalizeProNumber(
                            proState
                              .exercisePrice
                          ),

                        vestingPeriodMonths,

                        cliffMonths,

                        monthsCompleted:
                          currentMonthsCompleted +
                          months,
                      });

                    const active =
                      planner
                        .waitMonths ===
                      months;

                    return (
                      <button
                        key={
                          months
                        }
                        type="button"
                        onClick={() =>
                          selectWaitMonths(
                            months
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-violet-300 bg-violet-50"
                            : "border-slate-200 bg-slate-50 hover:bg-white"
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                          +
                          {
                            months
                          }
                          months
                        </p>

                        <p className="mt-2 text-xl font-black">
                          {num(
                            vesting
                              .vestedOptions
                          )}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                          {pct(
                            vesting
                              .vestedPercent
                          )}{" "}
                          vested
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </Panel>

            {/* BREAK EVEN */}

            <Panel>
              <Eyebrow>
                Break-even Map
              </Eyebrow>

              <h2 className="mt-1 text-xl font-black">
                How far is the Base exit
                above your cash-recovery
                threshold?
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Break
                  label="Strike threshold"
                  value={unitMoney(
                    result
                      .breakEven
                      .strikeBreakEvenSharePrice
                  )}
                  helper="Exercise price per option"
                />

                <Break
                  label="Cash-recovery price"
                  value={unitMoney(
                    result
                      .breakEven
                      .cashRecoverySharePrice
                  )}
                  helper="Exercise + exercise-stage tax per selected option"
                  highlight
                />

                <Break
                  label="Base exit share price"
                  value={unitMoney(
                    result
                      .breakEven
                      .baseExitSharePrice
                  )}
                  helper="After shared relative dilution"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <BreakEvenRail
                  strike={
                    result
                      .breakEven
                      .strikeBreakEvenSharePrice
                  }
                  recovery={
                    result
                      .breakEven
                      .cashRecoverySharePrice
                  }
                  base={
                    result
                      .breakEven
                      .baseExitSharePrice
                  }
                />
              </div>
            </Panel>

            {/* EXIT STRESS TEST */}

            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Eyebrow>
                    Exit Stress Test
                  </Eyebrow>

                  <h2 className="mt-1 text-2xl font-black">
                    What happens after
                    you exercise?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
  Stress-test your selected exercise against different exit valuations.
  Taxes shown in the scenarios include both exercise-stage and modeled
  exit-stage tax effects.
</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
                    {result.analysisContextLabel}
                  </span>

                  <p className="text-xs font-semibold text-slate-500">
                    Dilution fixed at{" "}
                    {pct(
                      proState
                        .futureDilutionPercentage
                    )}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {result.scenarios.map(
                  (
                    scenario
                  ) => (
                    <Scenario
                      key={
                        scenario
                          .name
                      }
                      scenario={
                        scenario
                      }
                      active={
                        planner
                          .selectedScenario ===
                        scenario
                          .name
                      }
                      onClick={() => {
                        setPlanner(
                          (
                            previous
                          ) => ({
                            ...previous,
                            selectedScenario:
                              scenario
                                .name,
                          })
                        );

                        devLog(
                          "exit_scenario_selected",
                          {
                            scenario:
                              scenario
                                .name,
                          }
                        );
                      }}
                    />
                  )
                )}
              </div>
            </section>

            {/* MONEY JOURNEY */}

            <Panel>
              <Eyebrow>
                Selected Scenario Money
                Journey
              </Eyebrow>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <Journey
                  number="01"
                  title="Gross sale"
                  value={money(
                    selectedScenario
                      .grossSaleValue
                  )}
                  helper="Modeled equity value"
                />

                <Journey
                  number="02"
                  title="Exercise"
                  value={`-${money(
                    selectedScenario
                      .exerciseCost
                  )}`}
                  helper="Strike cash"
                />

                <Journey
                  number="03"
                  title="Total modeled tax"
                  value={`-${money(
                    selectedScenario
                      .estimatedTax
                  )}`}
                  helper="Exercise-stage + modeled exit-stage tax"
                />

                <Journey
                  number="04"
                  title="Take-home"
                  value={money(
                    selectedScenario
                      .estimatedTakeHome
                  )}
                  helper={`${selectedScenario.name} scenario`}
                  highlight
                />
              </div>
            </Panel>

            {/* WHAT IF I LEAVE */}

            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Eyebrow>
                      What If I Leave?
                    </Eyebrow>

                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-800">
                      Today&apos;s position
                    </span>
                  </div>

                  <h2 className="mt-1 text-xl font-black">
                    Model the immediate
                    exercise-window
                    pressure
                  </h2>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <UserRoundX
                    size={18}
                  />
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {
                  result
                    .leaveCompany
                    .message
                }
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Risk
                  risk={
                    result.leaveCompany.risk
                  }
                />

                <span className="text-[10px] font-bold text-slate-500">
                  {result.leaveCompany.postTerminationExerciseDays === null
                    ? "Verify the post-termination exercise window in the grant."
                    : `${result.leaveCompany.postTerminationExerciseDays} days modeled to make the vested-option decision after leaving.`}
                </span>
              </div>

              {result.isFuturePlanningMode && (
                <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                    <div className="flex items-start gap-3">
                      <Clock3
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-700"
                      />

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-800">
                          Current position — used for leaving today
                        </p>

                        <p className="mt-2 text-sm font-black text-amber-950">
                          Leaving-company pressure always uses your actual vested position today.
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-950/75">
                          Your active Exercise Planner is modeling {" "}
                          <strong>{result.analysisContextLabel}</strong>, but hypothetical future vesting is intentionally excluded from this calculation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">
                          Scenario B — leave after waiting
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          If employment ended after {result.future.waitMonths} months
                        </p>
                      </div>

                      <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-violet-700">
                        Planning scenario
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-violet-900/75">
                      This scenario uses the active future planner only for comparison. It does not change today&apos;s vested position or today&apos;s post-termination calculation.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                      <MiniContextMetric
                        label="Future vested"
                        value={num(result.future.futureVestedOptions)}
                      />
                      <MiniContextMetric
                        label="Future selected"
                        value={num(result.future.selectedFutureOptions)}
                      />
                      <MiniContextMetric
                        label="Future cash"
                        value={money(result.future.futureTotalCashRequired)}
                      />
                      <MiniContextMetric
                        label="Unvested then"
                        value={num(
                          Math.max(
                            normalizeProNumber(proState.totalOptions) -
                              result.future.futureVestedOptions,
                            0
                          )
                        )}
                      />
                      <MiniContextMetric
                        label="Expiry at that point"
                        value={
                          result.future.remainingDaysToExpiry === null
                            ? "Not confirmed"
                            : result.future.remainingDaysToExpiry < 0
                              ? "Past expiry"
                              : `${num(result.future.remainingDaysToExpiry)} days left`
                        }
                      />
                      <MiniContextMetric
                        label="Modeled deadline"
                        value={futureTerminationDeadline(
                          result.future.waitMonths,
                          result.leaveCompany.postTerminationExerciseDays
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Scenario A — leave today
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Based only on the grant position that is actually vested today.
                    </p>
                  </div>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-700">
                    Today anchored
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <LeaveMetric
                    label="Vested if leaving today"
                    value={num(
                      result
                        .leaveCompany
                        .vestedOptionsIfLeavingToday
                    )}
                  />

                  <LeaveMetric
                    label="Unvested at risk"
                    value={num(
                      result
                        .leaveCompany
                        .unvestedOptionsAtRisk
                    )}
                    danger={
                      result
                        .leaveCompany
                        .unvestedOptionsAtRisk >
                      0
                    }
                  />

                  <LeaveMetric
                    label="Potential cash need"
                    value={money(
                      result
                        .leaveCompany
                        .totalCashPotentiallyRequired
                    )}
                  />

                  <LeaveMetric
                    label="Modeled deadline"
                    value={
                      result
                        .leaveCompany
                        .modeledExerciseDeadline
                        ? formatDate(
                            result
                              .leaveCompany
                              .modeledExerciseDeadline
                          )
                        : "Not confirmed"
                    }
                  />
                </div>
              </div>

              {result
                .leaveCompany
                .postTerminationExerciseDays !==
                null && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <CalendarClock
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />

                    <div>
                      <p className="text-sm font-black text-amber-950">
                        {result
                          .leaveCompany
                          .postTerminationExerciseDays}
                        -day modeled
                        post-termination
                        window
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-900/80">
                        This deadline is
                        modeled from today
                        for decision
                        planning. Always
                        verify the actual
                        employment end
                        date and plan terms.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Panel>

            {/* DECISION FACTORS */}

            <Panel>
              <Eyebrow>
                Decision Factors
              </Eyebrow>

              <h2 className="mt-1 text-xl font-black">
                Transparent signals —
                not a fake recommendation
                score
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
                  {result.analysisContextLabel}
                </span>

                <p className="text-sm leading-6 text-slate-500">
                  These signals explain the trade-off for the active
                  analytical context. Exercise Value Clarity does not
                  silently convert the assumptions into investment
                  advice.
                </p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {result
                  .decisionFactors
                  .map(
                    (
                      factor
                    ) => (
                      <Factor
                        key={
                          factor
                            .key
                        }
                        factor={
                          factor
                        }
                      />
                    )
                  )}
              </div>
            </Panel>

            {/* MODEL LIMITS */}

            <Panel>
              <div className="flex items-start gap-3">
                <ShieldAlert
                  size={20}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>
                  <p className="text-sm font-black">
                    Important modeling
                    limits
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Decision support
                    only. Liquidity, plan
                    rules, FMV, taxation,
                    company outcomes and
                    employment
                    circumstances can
                    change.
                  </p>
                </div>
              </div>

              <ul className="mt-4 grid gap-2 text-xs leading-5 text-slate-600 md:grid-cols-2">
                {result
                  .assumptions
                  .map(
                    (
                      assumption
                    ) => (
                      <li
                        key={
                          assumption
                        }
                        className="flex gap-2"
                      >
                        <span className="text-violet-600">
                          •
                        </span>

                        <span>
                          {
                            assumption
                          }
                        </span>
                      </li>
                    )
                  )}
              </ul>
            </Panel>
          </div>
        </div>

        {/* NEXT STEP */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-blue-50">
          <div className="flex flex-col justify-between gap-6 p-7 md:p-9 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
                Connected outcome
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Carry the exercise
                decision into your Exit
                model.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Exit remains the
                consolidated destination
                for valuation, dilution
                and tax. Exercise
                Intelligence adds the
                capital, timing and
                optionality decision that
                comes first.
              </p>
            </div>

            <Link
              href="/pro/exit"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Open Exit
              <ArrowRight
                size={16}
              />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function Panel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-slate-300 hover:shadow-md md:p-6">
      {children}
    </section>
  );
}

function Eyebrow({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">
      {children}
    </p>
  );
}

function Connection({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black text-blue-950">
            {title}
          </p>

          <p className="mt-1 text-[11px] text-blue-900/70">
            {value}
          </p>
        </div>
      </div>

      <Link2
        size={13}
        className="text-blue-500"
      />
    </Link>
  );
}

function Metric({
  label,
  value,
  helper,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  helper: string;
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
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          highlight
            ? "bg-white/10 text-violet-300"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-4 text-[10px] font-black uppercase tracking-[0.12em] ${
          highlight
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-black">
        {value}
      </p>

      <p
        className={`mt-1 text-xs ${
          highlight
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        {helper}
      </p>
    </div>
  );
}

function Field({
  label,
  helper,
  value,
  suffix,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  suffix: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <Label className="text-xs font-black text-slate-700">
        {label}
      </Label>

      <p className="mt-1 text-[11px] leading-5 text-slate-500">
        {helper}
      </p>

      <div className="relative mt-2">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          className="h-11 rounded-xl bg-slate-50 pr-20"
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
          {suffix}
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span
        className={
          strong
            ? "text-sm font-black"
            : "text-sm font-bold"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Timing({
  label,
  value,
  risk,
}: {
  label: string;
  value: string;
  risk: ExerciseRiskLevel;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <CalendarClock
          size={15}
          className="text-slate-400"
        />

        <span className="text-xs font-semibold text-slate-600">
          {label}
        </span>
      </div>

      <div className="text-right">
        <p className="text-xs font-black">
          {value}
        </p>

        <Risk
          risk={risk}
        />
      </div>
    </div>
  );
}

function Risk({
  risk,
}: {
  risk: ExerciseRiskLevel;
}) {
  const classes =
    risk === "CRITICAL"
      ? "bg-red-100 text-red-700"
      : risk === "HIGH"
        ? "bg-amber-100 text-amber-800"
        : risk === "MODERATE"
          ? "bg-blue-100 text-blue-700"
          : "bg-emerald-100 text-emerald-700";

  return (
    <span
      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[8px] font-black ${classes}`}
    >
      {risk}
    </span>
  );
}

function Dark({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function StrategyInsight({
  label,
  strategy,
  helper,
  onSelect,
  accent = false,
}: {
  label: string;
  strategy:
    | {
        percentage: ExerciseStrategyPercent;
        options: number;
        totalCashRequired: number;
        baseEstimatedTakeHome: number;
      }
    | null;
  helper: string;
  onSelect: (
    value: ExerciseStrategyPercent
  ) => void;
  accent?: boolean;
}) {
  if (!strategy) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-sm font-black text-slate-500">
          Not available
        </p>
        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          {helper}
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        onSelect(
          strategy.percentage
        )
      }
      className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
        accent
          ? "border-violet-200 bg-violet-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[9px] font-black uppercase tracking-[0.1em] ${
            accent
              ? "text-violet-600"
              : "text-slate-400"
          }`}>
            {label}
          </p>

          <p className="mt-2 text-xl font-black text-slate-950">
            {strategy.percentage}%
          </p>
        </div>

        <ArrowUpRight
          size={14}
          className="text-slate-300 transition group-hover:text-violet-600"
        />
      </div>

      <p className="mt-1 text-[10px] font-bold text-slate-500">
        {num(strategy.options)} options · {money(strategy.totalCashRequired)} cash
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        Base take-home {money(strategy.baseEstimatedTakeHome)}
      </p>

      <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] leading-4 text-slate-500">
        {helper}
      </p>
    </button>
  );
}

function BudgetMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className={`mt-1 text-sm font-black ${
        accent
          ? "text-emerald-300"
          : "text-white"
      }`}>
        {value}
      </p>
    </div>
  );
}

function IntelligenceDelta({
  label,
  value,
  helper,
  accent = false,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${
      accent
        ? "border-violet-200 bg-violet-50"
        : "border-slate-200 bg-white"
    }`}>
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className={`mt-2 text-lg font-black ${
        accent
          ? "text-violet-800"
          : "text-slate-950"
      }`}>
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-500">
        {helper}
      </p>
    </div>
  );
}

function ScoreMetric({
  label,
  risk,
  helper,
}: {
  label: string;
  risk: ExerciseRiskLevel;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <div className="mt-2">
        <Risk risk={risk} />
      </div>

      <p className="mt-3 text-[10px] leading-4 text-slate-500">
        {helper}
      </p>
    </div>
  );
}

function StrategyTag({
  strategy,
  intelligence,
}: {
  strategy: {
    percentage: ExerciseStrategyPercent;
  };
  intelligence: ReturnType<
    typeof calculateExerciseDecision
  >["strategyIntelligence"];
}) {
  const labels: string[] = [];

  if (
    intelligence.lowestCashStrategy?.percentage ===
    strategy.percentage
  ) {
    labels.push("LOWEST CASH");
  }

  if (
    intelligence.lowestTaxStrategy?.percentage ===
    strategy.percentage
  ) {
    labels.push("LOWEST TAX");
  }

  if (
    intelligence.highestTakeHomeStrategy?.percentage ===
    strategy.percentage
  ) {
    labels.push("HIGHEST TAKE-HOME");
  }

  if (
    intelligence.balancedStrategy?.percentage ===
    strategy.percentage
  ) {
    labels.push("BALANCED");
  }

  if (labels.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {labels.map(
        (label) => (
          <span
            key={label}
            className="rounded-full border border-violet-200 bg-white px-1.5 py-0.5 text-[7px] font-black tracking-[0.06em] text-violet-700"
          >
            {label}
          </span>
        )
      )}
    </div>
  );
}

function Decision({
  title,
  icon,
  rows,
  note,
}: {
  title: string;
  icon: React.ReactNode;
  rows: [
    string,
    string
  ][];
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
          {icon}
        </div>

        <p className="text-sm font-black">
          {title}
        </p>
      </div>

      <div className="mt-4">
        {rows.map(
          ([
            label,
            value,
          ]) => (
            <Row
              key={
                label
              }
              label={
                label
              }
              value={
                value
              }
            />
          )
        )}
      </div>

      <p className="mt-4 border-t border-slate-200 pt-4 text-[11px] leading-5 text-slate-500">
        {note}
      </p>
    </div>
  );
}

function DeltaCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-black">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-500">
        {helper}
      </p>
    </div>
  );
}

function Bar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all duration-300 ${className}`}
        style={{
          width: `${Math.min(
            Math.max(
              (value /
                Math.max(
                  max,
                  1
                )) *
                100,
              0
            ),
            100
          )}%`,
        }}
      />
    </div>
  );
}

function Break({
  label,
  value,
  helper,
  highlight = false,
}: {
  label: string;
  value: string;
  helper: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-violet-200 bg-violet-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-xl font-black">
        {value}
      </p>

      <p className="mt-1 text-[11px] leading-5 text-slate-500">
        {helper}
      </p>
    </div>
  );
}

function BreakEvenRail({
  strike,
  recovery,
  base,
}: {
  strike: number;
  recovery: number;
  base: number;
}) {
  const maximum =
    Math.max(
      strike,
      recovery,
      base,
      1
    ) *
    1.15;

  const points = [
    {
      label:
        "Strike",
      value:
        strike,
    },
    {
      label:
        "Cash recovery",
      value:
        recovery,
    },
    {
      label:
        "Base exit",
      value:
        base,
    },
  ];

  return (
    <div>
      <div className="relative h-3 rounded-full bg-gradient-to-r from-red-200 via-amber-200 to-emerald-300">
        {points.map(
          (
            point
          ) => (
            <div
              key={
                point
                  .label
              }
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${Math.min(
                  (
                    point
                      .value /
                    maximum
                  ) *
                    100,
                  100
                )}%`,
              }}
            >
              <span className="block h-5 w-1.5 rounded-full bg-slate-950 shadow-sm" />
            </div>
          )
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {points.map(
          (
            point
          ) => (
            <div
              key={
                point
                  .label
              }
            >
              <p className="text-[10px] text-slate-500">
                {
                  point
                    .label
                }
              </p>

              <p className="mt-1 text-xs font-black">
                {unitMoney(
                  point
                    .value
                )}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Scenario({
  scenario,
  active,
  onClick,
}: {
  scenario: ExerciseScenarioResult;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ease-out cursor-pointer active:scale-[0.985] hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-lg"
          : "border-slate-200 bg-white"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 origin-left transition-transform duration-500 ${
          active
            ? "scale-x-100 bg-violet-400"
            : "scale-x-0 bg-violet-500 group-hover:scale-x-100"
        }`}
      />

      <p
        className={`text-[10px] font-black uppercase tracking-[0.14em] ${
          active
            ? "text-violet-300"
            : "text-violet-600"
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
        {
          scenario
            .description
        }
      </p>

      <p className="mt-5 text-[10px] text-slate-500">
        Estimated take-home
      </p>

      <p className="mt-1 text-2xl font-black">
        {money(
          scenario
            .estimatedTakeHome
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
          <p className="text-[9px] text-slate-500">
            Exit valuation
          </p>

          <p className="mt-1 text-xs font-black">
            {money(
              scenario
                .exitValuation
            )}
          </p>
        </div>

        <div>
          <p className="text-[9px] text-slate-500">
            Return
          </p>

          <p className="mt-1 text-xs font-black">
            {multiple(
              scenario
                .returnMultiple
            )}
          </p>
        </div>
      </div>
    </button>
  );
}

function Journey({
  number,
  title,
  value,
  helper,
  highlight = false,
}: {
  number: string;
  title: string;
  value: string;
  helper: string;
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
        className={`text-[9px] font-black ${
          highlight
            ? "text-violet-300"
            : "text-violet-600"
        }`}
      >
        {number}
      </span>

      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
        {title}
      </p>

      <p className="mt-2 break-words text-lg font-black">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-500">
        {helper}
      </p>
    </div>
  );
}

function MiniContextMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white/80 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-violet-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function LeaveMetric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-lg font-black ${
          danger
            ? "text-amber-900"
            : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Factor({
  factor,
}: {
  factor: ExerciseDecisionFactor;
}) {
  const icon =
    factor.risk ===
      "HIGH" ||
    factor.risk ===
      "CRITICAL" ? (
      <AlertTriangle
        size={16}
      />
    ) : (
      <CheckCircle2
        size={16}
      />
    );

  return (
    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:bg-white hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
          {icon}
        </div>

        <Risk
          risk={
            factor.risk
          }
        />
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
          {factor.label}
        </p>
      </div>

      <p className="mt-1 text-sm font-black">
        {
          factor
            .headline
        }
      </p>

      <p className="mt-2 text-[11px] leading-5 text-slate-500">
        {
          factor
            .explanation
        }
      </p>
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function signalTitle(
  signal: string
) {
  if (
    signal ===
    "FAVORABLE"
  ) {
    return "The modeled factors are relatively supportive.";
  }

  if (
    signal ===
    "CAUTION"
  ) {
    return "The modeled trade-offs deserve careful review.";
  }

  return "The decision contains meaningful trade-offs.";
}

function money(
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

function signedNumber(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "0";
  }

  const prefix =
    value > 0
      ? "+"
      : "";

  return `${prefix}${Math.round(
    value
  ).toLocaleString(
    "en-IN"
  )}`;
}

function signedMoney(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "₹0";
  }

  const prefix =
    value > 0
      ? "+"
      : "";

  return `${prefix}${money(
    value
  )}`;
}

function unitMoney(
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
      style:
        "currency",
      currency:
        "INR",
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  ).format(value);
}

function num(
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

function pct(
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

function multiple(
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
      minimumFractionDigits:
        1,
      maximumFractionDigits:
        2,
    }
  )}×`;
}

function futureTerminationDeadline(
  waitMonths: number,
  postTerminationDays: number | null
) {
  if (postTerminationDays === null) {
    return "Not confirmed";
  }

  const futureLeaveDate = new Date();
  futureLeaveDate.setMonth(
    futureLeaveDate.getMonth() +
      Math.max(Math.round(waitMonths), 0)
  );
  futureLeaveDate.setDate(
    futureLeaveDate.getDate() +
      Math.max(Math.round(postTerminationDays), 0)
  );

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(futureLeaveDate);
}

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
    }
  ).format(date);
}

function csv(
  value: string
) {
  return `"${value.replace(
    /"/g,
    '""'
  )}"`;
}

function slug(
  value: string
) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .slice(
        0,
        80
      ) ||
    "exercise-plan"
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export type ProEquityState = {
  /* ============================================================
     SOURCE / CONFIRMED GRANT
  ============================================================ */

  sourceGrantId: string | null;
  sourceDocumentId: string | null;
  sourceCompanyName: string | null;
  sourceGrantName: string | null;
  sourceCurrency: string;
  sourceConfirmedAt: string | null;

  sourceVestingStartDate: string | null;
  sourceVestingDurationMonths: number | null;
  sourceCliffMonths: number | null;
  sourceVestingFrequency: string | null;

  sourceExpiryDate: string | null;
  sourcePostTerminationExerciseDays: number | null;

  /* ============================================================
     CORE GRANT
  ============================================================ */

  totalOptions: number;
  vestedOptions: number;
  vestedPercentage: number;
  exercisePrice: number;

  /* ============================================================
     CONNECTED VESTING MODEL
  ============================================================ */
  vestingPeriodMonths: number;
  cliffMonths: number;
  monthsCompleted: number;

  /* ============================================================
     COMPANY / OWNERSHIP
  ============================================================ */

  totalCompanyShares: number;
  currentCompanyValuation: number;

  /* ============================================================
     DILUTION
  ============================================================ */

  futureDilutionPercentage: number;
  dilutedOwnershipPercentage: number;

  /* ============================================================
     SIMULATOR
  ============================================================ */

  exitValuation: number;
  projectedExitValue: number;

  /* ============================================================
     EXERCISE PLAN

     Shared output from Exercise Intelligence.

     IMPORTANT:
     These values are planning assumptions / modeled outputs.
     They are NOT confirmed grant facts.

     Exit can use these values as an optional analysis basis.
  ============================================================ */

  exercisePlanOptions: number;
  exercisePlanWaitMonths: number;
  exercisePlanFMV: number;
  exercisePlanUpdatedAt: string | null;

  /* ============================================================
     TAX
  ============================================================ */

  exerciseFMV: number;
  salePrice: number;
  otherAnnualIncome: number;
  holdingPeriodMonths: number;

  equityType: "UNLISTED" | "LISTED";
  taxRegime: "NEW" | "OLD";
};

/* ============================================================
   STORAGE
============================================================ */

const STORAGE_KEY =
  "esop-value-clarity-pro-state";

const PRO_STATE_EVENT =
  "esop-value-clarity-pro-state-change";

/* ============================================================
   DEFAULT STATE
============================================================ */

export const DEFAULT_PRO_STATE: ProEquityState = {
  /* ==========================================================
     CONFIRMED SOURCE
  ========================================================== */

  sourceGrantId: null,
  sourceDocumentId: null,
  sourceCompanyName: null,
  sourceGrantName: null,
  sourceCurrency: "INR",
  sourceConfirmedAt: null,

  sourceVestingStartDate: null,
  sourceVestingDurationMonths: null,
  sourceCliffMonths: null,
  sourceVestingFrequency: null,

  sourceExpiryDate: null,
  sourcePostTerminationExerciseDays: null,

  /* ==========================================================
     GRANT
  ========================================================== */

  totalOptions: 10_000,
  vestedOptions: 5_000,
  vestedPercentage: 50,
  exercisePrice: 10,

  /* ==========================================================
     CONNECTED VESTING MODEL
  ========================================================== */
  vestingPeriodMonths: 48,
  cliffMonths: 12,
  monthsCompleted: 24,

  /* ==========================================================
     COMPANY
  ========================================================== */

  totalCompanyShares: 1_000_000,
  currentCompanyValuation: 100_000_000,

  /* ==========================================================
     DILUTION
  ========================================================== */

  futureDilutionPercentage: 20,
  dilutedOwnershipPercentage: 0,

  /* ==========================================================
     SIMULATOR
  ========================================================== */

  exitValuation: 500_000_000,
  projectedExitValue: 0,

  /* ==========================================================
     EXERCISE PLAN

     Empty until Exercise Intelligence publishes a modeled plan.
  ========================================================== */

  exercisePlanOptions: 0,
  exercisePlanWaitMonths: 0,
  exercisePlanFMV: 0,
  exercisePlanUpdatedAt: null,

  /* ==========================================================
     TAX
  ========================================================== */

  exerciseFMV: 100,
  salePrice: 500,
  otherAnnualIncome: 1_200_000,
  holdingPeriodMonths: 24,

  equityType: "UNLISTED",
  taxRegime: "NEW",
};

/* ============================================================
   LOGGING

   Development-only logging helps diagnose shared-state
   synchronization issues without adding noise in production.
============================================================ */

const LOG_PREFIX =
  "[EVC:PRO-STATE]";

function logProState(
  event: string,
  payload?: Record<string, unknown>
) {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return;
  }

  console.info(
    LOG_PREFIX,
    event,
    payload ?? {}
  );
}

function warnProState(
  event: string,
  payload?: Record<string, unknown>
) {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return;
  }

  console.warn(
    LOG_PREFIX,
    event,
    payload ?? {}
  );
}

/* ============================================================
   SAFE NUMBER
============================================================ */

function safeNumber(
  value: unknown
) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : 0;
}

/* ============================================================
   LOAD STATE
============================================================ */

function loadProState(): ProEquityState {
  if (
    typeof window ===
    "undefined"
  ) {
    return DEFAULT_PRO_STATE;
  }

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      logProState(
        "storage_empty_using_defaults"
      );

      return DEFAULT_PRO_STATE;
    }

    const parsed =
      JSON.parse(
        stored
      ) as Partial<ProEquityState>;

    /*
     * DEFAULT_PRO_STATE is intentionally spread first.
     *
     * This means users with an older localStorage object
     * automatically receive newly-added state fields such as:
     *
     * exercisePlanOptions
     * exercisePlanWaitMonths
     * exercisePlanFMV
     * exercisePlanUpdatedAt
     *
     * No manual storage migration is required.
     */

    const next: ProEquityState = {
      ...DEFAULT_PRO_STATE,
      ...parsed,
    };

    logProState(
      "storage_loaded",
      {
        sourceGrantId:
          next.sourceGrantId,

        totalOptions:
          next.totalOptions,

        vestedOptions:
          next.vestedOptions,

        vestingPeriodMonths:
          next.vestingPeriodMonths,

        cliffMonths:
          next.cliffMonths,

        monthsCompleted:
          next.monthsCompleted,

        exercisePlanOptions:
          next.exercisePlanOptions,

        exercisePlanWaitMonths:
          next.exercisePlanWaitMonths,

        exercisePlanFMV:
          next.exercisePlanFMV,

        exercisePlanUpdatedAt:
          next.exercisePlanUpdatedAt,
      }
    );

    return next;
  } catch (error) {
    warnProState(
      "storage_load_failed_using_defaults",
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }
    );

    return DEFAULT_PRO_STATE;
  }
}

/* ============================================================
   SAVE STATE
============================================================ */

function saveProState(
  state: ProEquityState
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

    /*
     * StorageEvent does not fire in the same tab that performs
     * localStorage.setItem().
     *
     * Therefore we dispatch our own event so multiple PRO pages /
     * hooks mounted in the same tab can stay synchronized.
     */

    window.dispatchEvent(
      new CustomEvent(
        PRO_STATE_EVENT,
        {
          detail: state,
        }
      )
    );

    logProState(
      "storage_saved",
      {
        sourceGrantId:
          state.sourceGrantId,

        vestedOptions:
          state.vestedOptions,

        vestingPeriodMonths:
          state.vestingPeriodMonths,

        cliffMonths:
          state.cliffMonths,

        monthsCompleted:
          state.monthsCompleted,

        exercisePlanOptions:
          state.exercisePlanOptions,

        exercisePlanWaitMonths:
          state.exercisePlanWaitMonths,

        exercisePlanFMV:
          state.exercisePlanFMV,
      }
    );
  } catch (error) {
    warnProState(
      "storage_save_failed",
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }
    );
  }
}

/* ============================================================
   SHARED PRO STATE HOOK
============================================================ */

export function useProEquityState() {
  const [
    state,
    setState,
  ] =
    useState<ProEquityState>(
      DEFAULT_PRO_STATE
    );

  const [
    hydrated,
    setHydrated,
  ] =
    useState(false);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    const loaded =
      loadProState();

    setState(
      loaded
    );

    setHydrated(
      true
    );

    logProState(
      "hook_hydrated",
      {
        sourceGrantId:
          loaded.sourceGrantId,

        exercisePlanOptions:
          loaded.exercisePlanOptions,
      }
    );
  }, []);

  /* ==========================================================
     CROSS-PAGE / SAME-TAB SYNC
  ========================================================== */

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    function handleStateChange(
      event: Event
    ) {
      const customEvent =
        event as CustomEvent<ProEquityState>;

      if (
        customEvent.detail
      ) {
        setState(
          customEvent.detail
        );

        logProState(
          "same_tab_state_received",
          {
            exercisePlanOptions:
              customEvent.detail
                .exercisePlanOptions,

            exercisePlanWaitMonths:
              customEvent.detail
                .exercisePlanWaitMonths,
          }
        );

        return;
      }

      setState(
        loadProState()
      );
    }

    function handleStorage(
      event: StorageEvent
    ) {
      if (
        event.key !==
        STORAGE_KEY
      ) {
        return;
      }

      const loaded =
        loadProState();

      setState(
        loaded
      );

      logProState(
        "cross_tab_state_received",
        {
          exercisePlanOptions:
            loaded
              .exercisePlanOptions,

          exercisePlanWaitMonths:
            loaded
              .exercisePlanWaitMonths,
        }
      );
    }

    window.addEventListener(
      PRO_STATE_EVENT,
      handleStateChange
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        PRO_STATE_EVENT,
        handleStateChange
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [
    hydrated,
  ]);

  /* ==========================================================
     UPDATE
  ========================================================== */

  const updateProState =
    useCallback(
      (
        updates:
          | Partial<ProEquityState>
          | ((
              previous:
                ProEquityState
            ) => ProEquityState)
      ) => {
        setState(
          (previous) => {
            const next =
              typeof updates ===
              "function"
                ? updates(
                    previous
                  )
                : {
                    ...previous,
                    ...updates,
                  };

            saveProState(
              next
            );

            return next;
          }
        );
      },
      []
    );

  /* ==========================================================
     RESET
  ========================================================== */

  const resetProState =
    useCallback(() => {
      saveProState(
        DEFAULT_PRO_STATE
      );

      setState(
        DEFAULT_PRO_STATE
      );

      logProState(
        "state_reset"
      );
    }, []);

  return {
    proState: state,
    updateProState,
    resetProState,
    hydrated,
  };
}

/* ============================================================
   NORMALIZE NUMERIC VALUE
============================================================ */

export function normalizeProNumber(
  value: string | number
) {
  if (
    typeof value ===
    "number"
  ) {
    return safeNumber(
      value
    );
  }

  if (
    value === ""
  ) {
    return 0;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}
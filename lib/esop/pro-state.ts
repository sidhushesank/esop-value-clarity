"use client";

import { useCallback, useEffect, useState } from "react";

export type ProEquityState = {
  /* ============================================================
     CORE GRANT
  ============================================================ */

  totalOptions: number;
  vestedOptions: number;
  vestedPercentage: number;
  exercisePrice: number;

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
  /* Grant */

  totalOptions: 10_000,

  vestedOptions: 10_000,

  vestedPercentage: 100,

  exercisePrice: 10,

  /* Company */

  totalCompanyShares: 1_000_000,

  currentCompanyValuation: 100_000_000,

  /* Dilution */

  futureDilutionPercentage: 20,

  dilutedOwnershipPercentage: 0,

  /* Simulator */

  exitValuation: 500_000_000,

  projectedExitValue: 0,

  /* Tax */

  exerciseFMV: 100,

  salePrice: 500,

  otherAnnualIncome: 1_200_000,

  holdingPeriodMonths: 24,

  equityType: "UNLISTED",

  taxRegime: "NEW",
};

/* ============================================================
   SAFE NUMBER
============================================================ */

function safeNumber(value: unknown) {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : 0;
}

/* ============================================================
   LOAD STATE
============================================================ */

function loadProState(): ProEquityState {
  if (typeof window === "undefined") {
    return DEFAULT_PRO_STATE;
  }

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return DEFAULT_PRO_STATE;
    }

    const parsed = JSON.parse(
      stored
    ) as Partial<ProEquityState>;

    return {
      ...DEFAULT_PRO_STATE,
      ...parsed,
    };
  } catch {
    return DEFAULT_PRO_STATE;
  }
}

/* ============================================================
   SAVE STATE
============================================================ */

function saveProState(
  state: ProEquityState
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

    window.dispatchEvent(
      new CustomEvent(
        PRO_STATE_EVENT,
        {
          detail: state,
        }
      )
    );
  } catch {
    // Ignore storage failures.
  }
}

/* ============================================================
   SHARED PRO STATE HOOK
============================================================ */

export function useProEquityState() {
  const [state, setState] =
    useState<ProEquityState>(
      DEFAULT_PRO_STATE
    );

  const [hydrated, setHydrated] =
    useState(false);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    setState(loadProState());
    setHydrated(true);
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
      } else {
        setState(
          loadProState()
        );
      }
    }

    function handleStorage(
      event: StorageEvent
    ) {
      if (
        event.key !== STORAGE_KEY
      ) {
        return;
      }

      setState(
        loadProState()
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
  }, [hydrated]);

  /* ==========================================================
     UPDATE
  ========================================================== */

  const updateProState =
    useCallback(
      (
        updates:
          | Partial<ProEquityState>
          | ((
              previous: ProEquityState
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
    typeof value === "number"
  ) {
    return safeNumber(
      value
    );
  }

  if (value === "") {
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
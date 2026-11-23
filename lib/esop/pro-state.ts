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

  /* W3: India tax residency and, for NRIs, the share of the vesting period worked in India. */
  residencyStatus: "RESIDENT" | "RNOR" | "NON_RESIDENT";
  indiaWorkSharePercent: number;
};

/* ============================================================
   STORAGE
============================================================ */

/*
 * PER-GRANT JOURNEY STORAGE
 *
 * Each confirmed grant keeps its own saved journey (exercise plan,
 * dilution, tax, exit assumptions). The browser holds a fast cache
 * keyed by grant ID, and the database (GrantJourney) is the durable
 * copy that survives a different browser/device.
 *
 * LEGACY_STORAGE_KEY is the old single-slot key. It is read once to
 * migrate an existing user's current work into their active grant.
 */
const LEGACY_STORAGE_KEY =
  "esop-value-clarity-pro-state";

const GRANT_STATE_PREFIX =
  "esop-value-clarity-pro-state:grant:";

const ACTIVE_GRANT_KEY =
  "esop-value-clarity-active-grant-id";

/* Read by /api/pro/equity/active so server-side lookups follow the
   grant the user is working on. */
const ACTIVE_GRANT_COOKIE =
  "evc-active-grant-id";

const VESTING_SCHEDULE_STORAGE_KEY =
  "esop-value-clarity-pro-vesting-schedule";

const PRO_STATE_EVENT =
  "esop-value-clarity-pro-state-change";

const REMOTE_SYNC_DELAY_MS = 1500;

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

  residencyStatus: "RESIDENT",
  indiaWorkSharePercent: 100,
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
   PER-GRANT STORAGE HELPERS
============================================================ */

function grantStateKey(grantId: string) {
  return `${GRANT_STATE_PREFIX}${grantId}`;
}

function grantSavedAtKey(grantId: string) {
  return `${GRANT_STATE_PREFIX}${grantId}:savedAt`;
}

function isStateKey(key: string | null) {
  return (
    key === LEGACY_STORAGE_KEY ||
    key === ACTIVE_GRANT_KEY ||
    (key !== null &&
      key.startsWith(GRANT_STATE_PREFIX) &&
      !key.endsWith(":savedAt"))
  );
}

export function getActiveGrantId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return (
      window.localStorage.getItem(
        ACTIVE_GRANT_KEY
      ) || null
    );
  } catch {
    return null;
  }
}

function setActiveGrantPointer(
  grantId: string | null
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (grantId) {
      window.localStorage.setItem(
        ACTIVE_GRANT_KEY,
        grantId
      );
    } else {
      window.localStorage.removeItem(
        ACTIVE_GRANT_KEY
      );
    }
  } catch {
    // The cookie below still keeps server lookups consistent.
  }

  try {
    document.cookie = grantId
      ? `${ACTIVE_GRANT_COOKIE}=${encodeURIComponent(
          grantId
        )}; path=/; max-age=31536000; SameSite=Lax`
      : `${ACTIVE_GRANT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // Cookies unavailable: server falls back to the newest grant.
  }
}

function readGrantState(
  grantId: string
): Partial<ProEquityState> | null {
  try {
    const stored =
      window.localStorage.getItem(
        grantStateKey(grantId)
      );

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    return parsed &&
      typeof parsed === "object"
      ? (parsed as Partial<ProEquityState>)
      : null;
  } catch {
    return null;
  }
}

function readGrantSavedAt(
  grantId: string
): number {
  try {
    const value = Number(
      window.localStorage.getItem(
        grantSavedAtKey(grantId)
      )
    );

    return Number.isFinite(value)
      ? value
      : 0;
  } catch {
    return 0;
  }
}

function writeGrantStateLocal(
  grantId: string,
  state: ProEquityState,
  savedAt: number = Date.now()
) {
  try {
    window.localStorage.setItem(
      grantStateKey(grantId),
      JSON.stringify(state)
    );

    window.localStorage.setItem(
      grantSavedAtKey(grantId),
      String(savedAt)
    );
  } catch (error) {
    warnProState("grant_storage_write_failed", {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}

/* The standalone Vesting page restores its schedule from its own
   key. Keep it in step with the grant being opened so Vesting never
   shows another grant's schedule. */
function writeVestingSchedule(
  state: ProEquityState
) {
  try {
    window.localStorage.setItem(
      VESTING_SCHEDULE_STORAGE_KEY,
      JSON.stringify({
        vestingPeriodMonths:
          state.vestingPeriodMonths,
        cliffMonths: state.cliffMonths,
        monthsCompleted:
          state.monthsCompleted,
      })
    );
  } catch {
    // Vesting recomputes from the grant if this is unavailable.
  }
}

/* ============================================================
   REMOTE (DATABASE) SYNC
============================================================ */

type RemoteJourney = {
  state: Partial<ProEquityState>;
  updatedAt: number;
} | null;

/* Grants whose database copy has been checked in this tab. Nothing
   is pushed for a grant until this is true, so a fresh browser can
   never overwrite a saved journey with default values. */
const remoteChecked = new Set<string>();

let syncTimer: ReturnType<
  typeof setTimeout
> | null = null;

let syncGrantId: string | null = null;

async function fetchRemoteJourney(
  grantId: string
): Promise<RemoteJourney | undefined> {
  try {
    const response = await fetch(
      `/api/pro/equity/${encodeURIComponent(
        grantId
      )}/journey`,
      {
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as {
      success?: boolean;
      journey?: {
        state: Partial<ProEquityState>;
        updatedAt: string;
      } | null;
    };

    if (!data.success) {
      return undefined;
    }

    if (!data.journey) {
      return null;
    }

    return {
      state: data.journey.state,
      updatedAt: new Date(
        data.journey.updatedAt
      ).getTime(),
    };
  } catch {
    return undefined;
  }
}

async function pushJourneyNow(
  grantId: string
) {
  if (!remoteChecked.has(grantId)) {
    return;
  }

  const state = readGrantState(grantId);

  if (!state) {
    return;
  }

  try {
    const response = await fetch(
      `/api/pro/equity/${encodeURIComponent(
        grantId
      )}/journey`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({ state }),
        keepalive: true,
      }
    );

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as {
      updatedAt?: string;
    };

    if (data.updatedAt) {
      // Align the local timestamp with the server clock so this
      // device does not later treat its own save as "older".
      try {
        window.localStorage.setItem(
          grantSavedAtKey(grantId),
          String(
            new Date(
              data.updatedAt
            ).getTime()
          )
        );
      } catch {
        // Non-fatal.
      }
    }
  } catch {
    // Offline: the local copy is kept and pushed on the next change.
  }
}

function scheduleRemoteSync(
  grantId: string
) {
  if (typeof window === "undefined") {
    return;
  }

  if (
    syncTimer &&
    syncGrantId &&
    syncGrantId !== grantId
  ) {
    // Switching grants: flush the previous grant immediately.
    clearTimeout(syncTimer);
    void pushJourneyNow(syncGrantId);
    syncTimer = null;
  }

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncGrantId = grantId;

  syncTimer = setTimeout(() => {
    syncTimer = null;

    // Reads the latest local copy at fire time, not a stale closure.
    void pushJourneyNow(grantId);
  }, REMOTE_SYNC_DELAY_MS);
}

async function flushRemoteSync() {
  if (syncTimer && syncGrantId) {
    clearTimeout(syncTimer);
    syncTimer = null;

    await pushJourneyNow(syncGrantId);
  }
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
    const activeGrantId =
      getActiveGrantId();

    if (activeGrantId) {
      const saved =
        readGrantState(activeGrantId);

      if (saved) {
        return {
          ...DEFAULT_PRO_STATE,
          ...saved,
          sourceGrantId: activeGrantId,
        };
      }
    }

    /*
     * One-time migration from the old single-slot key. The old slot
     * belongs to whichever grant it names as its source.
     */
    const legacy =
      window.localStorage.getItem(
        LEGACY_STORAGE_KEY
      );

    if (legacy) {
      const parsed = JSON.parse(
        legacy
      ) as Partial<ProEquityState>;

      const next: ProEquityState = {
        ...DEFAULT_PRO_STATE,
        ...parsed,
      };

      if (
        next.sourceGrantId &&
        (!activeGrantId ||
          activeGrantId ===
            next.sourceGrantId)
      ) {
        writeGrantStateLocal(
          next.sourceGrantId,
          next,
          0
        );

        setActiveGrantPointer(
          next.sourceGrantId
        );

        logProState(
          "legacy_state_migrated",
          {
            sourceGrantId:
              next.sourceGrantId,
          }
        );

        return next;
      }

      if (!activeGrantId) {
        return next;
      }
    }

    if (activeGrantId) {
      return {
        ...DEFAULT_PRO_STATE,
        sourceGrantId: activeGrantId,
      };
    }

    logProState(
      "storage_empty_using_defaults"
    );

    return DEFAULT_PRO_STATE;
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
    if (state.sourceGrantId) {
      writeGrantStateLocal(
        state.sourceGrantId,
        state
      );

      setActiveGrantPointer(
        state.sourceGrantId
      );

      scheduleRemoteSync(
        state.sourceGrantId
      );
    } else {
      // No confirmed grant yet: keep working values in the legacy
      // slot until a grant is attached.
      window.localStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify(state)
      );
    }

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

        exercisePlanOptions:
          state.exercisePlanOptions,
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
   SWITCH WORKING GRANT

   Called by the Equity page ("Open journey"). Saves the grant
   being left, then loads the chosen grant's own journey
   (database copy if newer than this browser's, otherwise local,
   otherwise a clean slate seeded with the grant ID).
============================================================ */

export async function switchActiveGrant(
  grantId: string
): Promise<ProEquityState> {
  if (typeof window === "undefined") {
    return DEFAULT_PRO_STATE;
  }

  await flushRemoteSync();

  const local = readGrantState(grantId);
  const localSavedAt =
    readGrantSavedAt(grantId);

  const remote =
    await fetchRemoteJourney(grantId);

  let chosen: Partial<ProEquityState> | null =
    local;

  if (remote !== undefined) {
    remoteChecked.add(grantId);

    if (
      remote &&
      (!local ||
        remote.updatedAt > localSavedAt)
    ) {
      chosen = remote.state;
    }
  }

  const next: ProEquityState = {
    ...DEFAULT_PRO_STATE,
    ...(chosen ?? {}),
    sourceGrantId: grantId,
  };

  writeGrantStateLocal(
    grantId,
    next,
    remote && chosen === remote.state
      ? remote.updatedAt
      : localSavedAt || Date.now()
  );

  setActiveGrantPointer(grantId);
  writeVestingSchedule(next);

  window.dispatchEvent(
    new CustomEvent(PRO_STATE_EVENT, {
      detail: next,
    })
  );

  logProState("active_grant_switched", {
    grantId,
    hadSavedJourney: Boolean(chosen),
  });

  return next;
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
      if (!isStateKey(event.key)) {
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
     DATABASE PULL (once per grant, per page load)

     Restores a journey saved on another browser/device, or one
     that is newer than this browser's copy. Local work that is
     newer than the database copy is kept and pushed instead.
  ========================================================== */

  const sourceGrantId =
    state.sourceGrantId;

  useEffect(() => {
    if (
      !hydrated ||
      !sourceGrantId ||
      remoteChecked.has(sourceGrantId)
    ) {
      return;
    }

    let cancelled = false;
    const grantId = sourceGrantId;

    async function pullRemoteJourney() {
      const remote =
        await fetchRemoteJourney(grantId);

      if (cancelled || remote === undefined) {
        return;
      }

      remoteChecked.add(grantId);

      const localSavedAt =
        readGrantSavedAt(grantId);

      if (
        remote &&
        remote.updatedAt > localSavedAt
      ) {
        const next: ProEquityState = {
          ...DEFAULT_PRO_STATE,
          ...remote.state,
          sourceGrantId: grantId,
        };

        writeGrantStateLocal(
          grantId,
          next,
          remote.updatedAt
        );

        writeVestingSchedule(next);
        setState(next);

        window.dispatchEvent(
          new CustomEvent(PRO_STATE_EVENT, {
            detail: next,
          })
        );

        logProState("journey_pulled", {
          grantId,
        });

        return;
      }

      // Nothing newer in the database: make sure it has this copy.
      if (readGrantState(grantId)) {
        scheduleRemoteSync(grantId);
      }
    }

    void pullRemoteJourney();

    return () => {
      cancelled = true;
    };
  }, [hydrated, sourceGrantId]);

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
            let next =
              typeof updates ===
              "function"
                ? updates(
                    previous
                  )
                : {
                    ...previous,
                    ...updates,
                  };

            /*
             * GRANT-SWITCH GUARD
             *
             * If a page attaches a DIFFERENT grant to the current
             * state (for example a direct ?grantId= link), never carry
             * the previous grant's exercise/tax/exit assumptions
             * across. Start from the new grant's own saved journey
             * (or defaults) and apply only what the page just set.
             */
            if (
              previous.sourceGrantId &&
              next.sourceGrantId &&
              previous.sourceGrantId !==
                next.sourceGrantId
            ) {
              const base: ProEquityState = {
                ...DEFAULT_PRO_STATE,
                ...(readGrantState(
                  next.sourceGrantId
                ) ?? {}),
              };

              const overlay =
                typeof updates ===
                "function"
                  ? ({
                      sourceGrantId:
                        next.sourceGrantId,
                      sourceDocumentId:
                        next.sourceDocumentId,
                      sourceCompanyName:
                        next.sourceCompanyName,
                      sourceGrantName:
                        next.sourceGrantName,
                      sourceCurrency:
                        next.sourceCurrency,
                      sourceConfirmedAt:
                        next.sourceConfirmedAt,
                    } as Partial<ProEquityState>)
                  : updates;

              next = {
                ...base,
                ...overlay,
              };
            }

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
      const grantId =
        getActiveGrantId();

      if (grantId) {
        // Reset only the current grant's working model; its source
        // grant ID stays attached.
        const cleared: ProEquityState = {
          ...DEFAULT_PRO_STATE,
          sourceGrantId: grantId,
        };

        saveProState(cleared);
        setState(cleared);
      } else {
        saveProState(DEFAULT_PRO_STATE);
        setState(DEFAULT_PRO_STATE);
      }

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
"use client";

import { createContext, useContext } from "react";

import type { Jurisdiction } from "@/lib/jurisdiction";

/**
 * The company's country (India or US), shared with every panel on the
 * Startup Equity Desk so labels, currency and rules match the company.
 */
const JurisdictionCtx = createContext<Jurisdiction>("IN");

export const JurisdictionProvider = JurisdictionCtx.Provider;

export function useJurisdiction(): Jurisdiction {
  return useContext(JurisdictionCtx);
}

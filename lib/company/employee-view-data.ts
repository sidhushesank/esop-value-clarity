import {
  addMonthsUtc,
  fullyVestedDate,
  grantPosition,
  vestingMilestones,
  wholeMonths,
} from "@/lib/company/grants";
import { termsOf } from "@/lib/company/grants-data";
import type { ResolvedGrantLink } from "@/lib/company/grant-links";

/** Everything the employee page needs, as plain JSON (no database objects). */
export type EmployeeViewData = {
  /** IN = Indian company (rupees, Indian tax). US = US company (dollars, no Indian tax). */
  jurisdiction: "IN" | "US";
  /** US only: ISO or NSO (null if not recorded or Indian company). */
  usOptionType: "ISO" | "NSO" | null;
  companyName: string;
  companyCin: string | null;
  schemeName: string;
  employeeName: string;
  status: string;
  acceptedAt: string | null;
  grantDate: string;
  options: number;
  exercisePrice: number;
  vestingStart: string;
  vestingMonths: number;
  cliffMonths: number;
  expiryDate: string | null;
  postExitDays: number;
  leftOn: string | null;
  fullyVestedOn: string;
  nextVest: { date: string; options: number } | null;
  vestedPctToday: number;
  position: {
    vested: number;
    unvested: number;
    vestedUnexercised: number;
    outstanding: number;
    lapsed: number;
    exercised: number;
    exerciseWindowEnds: string | null;
  };
  milestones: { date: string; vestedTotal: number; vestedPct: number }[];
  fmv: { perShare: number; valuationDate: string | null; valuer: string | null } | null;
  letter: { fileName: string; uploadedAt: string | null } | null;
};

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export function buildEmployeeView(link: ResolvedGrantLink): EmployeeViewData {
  const g = link.grant;
  const ws = g.workspace;
  const terms = termsOf(g);
  const today = new Date();
  const position = grantPosition(terms, today);

  let nextVest: EmployeeViewData["nextVest"] = null;
  if (!g.leftOn && position.vested < g.options) {
    const served = wholeMonths(g.vestingStart, today);
    const nextMonth = Math.max(served + 1, g.cliffMonths);
    const date = addMonthsUtc(g.vestingStart, nextMonth);
    const vestedThen = Math.min(
      g.options,
      Math.floor((g.options * nextMonth) / Math.max(1, g.vestingMonths))
    );
    nextVest = { date: date.toISOString(), options: Math.max(0, vestedThen - position.vested) };
  }

  return {
    jurisdiction: ws.jurisdiction === "US" ? "US" : "IN",
    usOptionType: ws.jurisdiction === "US" ? g.usOptionType ?? null : null,
    companyName: ws.name,
    companyCin: ws.cin,
    schemeName: g.scheme.name,
    employeeName: g.employeeName,
    status: g.status,
    acceptedAt: iso(g.acceptedAt),
    grantDate: g.grantDate.toISOString(),
    options: g.options,
    exercisePrice: g.exercisePrice,
    vestingStart: g.vestingStart.toISOString(),
    vestingMonths: g.vestingMonths,
    cliffMonths: g.cliffMonths,
    expiryDate: iso(g.expiryDate),
    postExitDays: g.postExitDays,
    leftOn: iso(g.leftOn),
    fullyVestedOn: fullyVestedDate(terms).toISOString(),
    nextVest,
    vestedPctToday: g.options > 0 ? (position.vested / g.options) * 100 : 0,
    position: {
      vested: position.vested,
      unvested: position.unvested,
      vestedUnexercised: position.vestedUnexercised,
      outstanding: position.outstanding,
      lapsed: position.lapsed,
      exercised: position.exercised,
      exerciseWindowEnds: iso(position.exerciseWindowEnds),
    },
    milestones: vestingMilestones(terms).map((m) => ({
      date: m.date.toISOString(),
      vestedTotal: m.vestedTotal,
      vestedPct: m.vestedPct,
    })),
    fmv:
      ws.currentFmvPerShare && ws.currentFmvPerShare > 0
        ? {
            perShare: ws.currentFmvPerShare,
            valuationDate: iso(ws.fmvValuationDate),
            valuer: ws.fmvValuerName,
          }
        : null,
    letter: g.letterStorageKey
      ? { fileName: g.letterFileName ?? "grant-letter.pdf", uploadedAt: iso(g.letterUploadedAt) }
      : null,
  };
}

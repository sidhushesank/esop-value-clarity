"use client";

import { useMemo, useState } from "react";

import {
  RESIDENCY_LABEL,
  determineResidency,
  indiaWorkSharePercent,
  type ResidencyInput,
  type ResidencyStatus,
} from "@/lib/esop/residency";

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500";
const SMALL = "text-xs font-semibold text-slate-600";

const HINT: Record<ResidencyStatus, string> = {
  RESIDENT: "Lived in India for the year as usual. Whole perquisite taxed in India; 87A rebate applies.",
  RNOR: "Recently returned to India, or a visitor with high Indian income. Taxed in India like a resident on this perquisite.",
  NON_RESIDENT: "Living and working abroad. Only the part earned while working in India is taxed here; no 87A rebate.",
};

function daysSince(iso: string | null) {
  if (!iso) return null;
  const start = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start)) return null;
  const d = Math.round((Date.now() - start) / 86_400_000);
  return d > 0 ? d : null;
}

/**
 * Tax residency for the PRO tax model: a dropdown, a "work it out" helper,
 * and (for NRIs) the share of the vesting period worked in India.
 */
export default function ResidencyPanel({
  status,
  sharePercent,
  vestingStartDate,
  perquisiteBeforeShare,
  taxablePerquisite,
  formatMoney,
  onChange,
}: {
  status: ResidencyStatus;
  sharePercent: number;
  vestingStartDate: string | null;
  perquisiteBeforeShare?: number;
  taxablePerquisite: number;
  formatMoney: (n: number) => string;
  onChange: (patch: { residencyStatus?: ResidencyStatus; indiaWorkSharePercent?: number }) => void;
}) {
  const [helperOpen, setHelperOpen] = useState(false);
  const [q, setQ] = useState<ResidencyInput>({
    daysThisYear: 0,
    nationality: "CITIZEN",
    situation: "NORMAL",
    indianIncomeOver15L: false,
    taxedAbroad: true,
    daysPrev4Years: 0,
    daysPrev7Years: 0,
    nonResidentYearsOfLast10: 0,
  });
  const verdict = useMemo(() => determineResidency(q), [q]);

  const defaultTotal = daysSince(vestingStartDate);
  const [totalDays, setTotalDays] = useState(defaultTotal ? String(defaultTotal) : "");
  const [outsideDays, setOutsideDays] = useState("");
  const [shareDraft, setShareDraft] = useState<string | null>(null);

  const num = (v: string) => {
    const x = Number(v.replace(/,/g, ""));
    return Number.isFinite(x) && x >= 0 ? x : 0;
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">Tax residency (India)</p>
        <select
          className={`${INPUT} mt-2`}
          value={status}
          onChange={(e) => onChange({ residencyStatus: e.target.value as ResidencyStatus })}
        >
          {(Object.keys(RESIDENCY_LABEL) as ResidencyStatus[]).map((s) => (
            <option key={s} value={s}>
              {RESIDENCY_LABEL[s]}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{HINT[status]}</p>
        <button
          type="button"
          className="mt-1 text-xs font-bold text-blue-700 hover:underline"
          onClick={() => setHelperOpen((v) => !v)}
        >
          {helperOpen ? "Hide the residency check" : "Not sure? Work it out from your days in India"}
        </button>
      </div>

      {helperOpen && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs leading-5 text-slate-500">
            For the financial year of the exercise (April to March). Count every day you were in India, including arrival and departure days.
          </p>
          <label className="block">
            <span className={SMALL}>You are</span>
            <select className={`${INPUT} mt-1`} value={q.nationality} onChange={(e) => setQ({ ...q, nationality: e.target.value as ResidencyInput["nationality"] })}>
              <option value="CITIZEN">An Indian citizen</option>
              <option value="PIO">A person of Indian origin / OCI card holder</option>
              <option value="OTHER">Neither</option>
            </select>
          </label>
          <label className="block">
            <span className={SMALL}>This year you</span>
            <select className={`${INPUT} mt-1`} value={q.situation} onChange={(e) => setQ({ ...q, situation: e.target.value as ResidencyInput["situation"] })}>
              <option value="NORMAL">Lived in India (or moved here)</option>
              <option value="LEFT_FOR_EMPLOYMENT">Left India for a job abroad</option>
              <option value="VISITING">Live abroad and visited India</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className={SMALL}>Days in India this year</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={q.daysThisYear || ""} onChange={(e) => setQ({ ...q, daysThisYear: num(e.target.value) })} />
            </label>
            <label className="block">
              <span className={SMALL}>Days in India, previous 4 years</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={q.daysPrev4Years || ""} onChange={(e) => setQ({ ...q, daysPrev4Years: num(e.target.value) })} />
            </label>
            <label className="block">
              <span className={SMALL}>Days in India, previous 7 years</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={q.daysPrev7Years || ""} onChange={(e) => setQ({ ...q, daysPrev7Years: num(e.target.value) })} />
            </label>
            <label className="block">
              <span className={SMALL}>Years you were an NRI, of the last 10</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={q.nonResidentYearsOfLast10 || ""} onChange={(e) => setQ({ ...q, nonResidentYearsOfLast10: Math.min(10, num(e.target.value)) })} />
            </label>
          </div>
          <label className="flex items-start gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" className="mt-0.5" checked={q.indianIncomeOver15L} onChange={(e) => setQ({ ...q, indianIncomeOver15L: e.target.checked })} />
            My income from India (not counting foreign income) is above ₹15 lakh
          </label>
          <label className="flex items-start gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" className="mt-0.5" checked={q.taxedAbroad} onChange={(e) => setQ({ ...q, taxedAbroad: e.target.checked })} />
            I am a tax resident of another country (I pay tax there as a resident)
          </label>

          <div className="rounded-xl border border-blue-100 bg-white p-3">
            <p className="text-sm font-black text-slate-900">Result: {RESIDENCY_LABEL[verdict.status]}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-5 text-slate-600">
              {verdict.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:opacity-40"
              disabled={verdict.status === status}
              onClick={() => onChange({ residencyStatus: verdict.status })}
            >
              {verdict.status === status ? "Already selected" : "Use this status"}
            </button>
          </div>
          <p className="text-[11px] leading-4 text-slate-400">Based on section 6 of the Income-tax Act (carried into the 2025 Act). Confirm with your CA.</p>
        </div>
      )}

      {status === "NON_RESIDENT" && (
        <div className="space-y-2 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-900">Share of the vesting period worked in India (%)</span>
            <input
              className={`${INPUT} mt-2`}
              inputMode="decimal"
              value={shareDraft ?? String(sharePercent)}
              onChange={(e) => setShareDraft(e.target.value)}
              onBlur={() => {
                if (shareDraft !== null) {
                  onChange({ indiaWorkSharePercent: Math.min(100, num(shareDraft)) });
                  setShareDraft(null);
                }
              }}
            />
          </label>
          <p className="text-xs leading-5 text-slate-600">
            From the grant (vesting start) to the exercise. Only this share of the perquisite is taxed in India
            {perquisiteBeforeShare !== undefined ? `: ${formatMoney(taxablePerquisite)} of ${formatMoney(perquisiteBeforeShare)}` : ""}.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className={SMALL}>Days from vesting start to exercise</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={totalDays} onChange={(e) => setTotalDays(e.target.value)} />
            </label>
            <label className="block">
              <span className={SMALL}>Of those, days working outside India</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={outsideDays} onChange={(e) => setOutsideDays(e.target.value)} />
            </label>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 disabled:opacity-40"
            disabled={!num(totalDays)}
            onClick={() => onChange({ indiaWorkSharePercent: indiaWorkSharePercent(num(totalDays), num(outsideDays)) })}
          >
            Work out the share: {num(totalDays) ? `${indiaWorkSharePercent(num(totalDays), num(outsideDays))}%` : "-"}
          </button>
          <p className="text-[11px] leading-4 text-slate-500">
            Keep your travel records and the employer&apos;s certificate of days worked in India. The rest may be taxed in the country where you worked (claim credit under the tax treaty there).
          </p>
        </div>
      )}
    </div>
  );
}

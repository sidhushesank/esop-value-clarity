"use client";

import { useState } from "react";
import { Building2, Globe2, Loader2, Lock } from "lucide-react";

import type { WorkspaceInfo } from "@/components/company/types";
import { BTN_DARK, CARD, INPUT, LABEL, parseNum, readJson } from "@/components/company/ui";
import {
  asJurisdiction,
  currencySymbol,
  US_STATES,
  wordingFor,
  type Jurisdiction,
} from "@/lib/jurisdiction";

export default function CompanyDetailsPanel({
  workspace,
  jurisdictionLocked = false,
  onSaved,
}: {
  workspace: WorkspaceInfo;
  jurisdictionLocked?: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    jurisdiction: asJurisdiction(workspace.jurisdiction),
    usState: workspace.usStateOfIncorporation ?? "Delaware",
    name: workspace.name,
    cin: workspace.cin ?? "",
    companyType: workspace.companyType,
    incorporationDate: workspace.incorporationDate?.slice(0, 10) ?? "",
    dpiit: workspace.dpiitRecognised === true,
    fmv: workspace.currentFmvPerShare ? String(workspace.currentFmvPerShare) : "",
    fmvDate: workspace.fmvValuationDate?.slice(0, 10) ?? "",
    valuer: workspace.fmvValuerName ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const j: Jurisdiction = form.jurisdiction;
  const us = j === "US";
  const words = wordingFor(j);

  async function save() {
    if (!form.name.trim()) return setError("Enter the company name.");
    const fmv = parseNum(form.fmv);
    if (fmv !== null && (Number.isNaN(fmv) || fmv <= 0)) return setError("Value per share must be a positive number.");
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/company/workspace", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jurisdiction: form.jurisdiction,
          usStateOfIncorporation: us ? form.usState : null,
          name: form.name.trim(),
          cin: us ? null : form.cin.trim() || null,
          companyType: form.companyType,
          incorporationDate: form.incorporationDate || null,
          dpiitRecognised: us ? null : form.dpiit,
          currentFmvPerShare: fmv,
          fmvValuationDate: form.fmvDate || null,
          fmvValuerName: form.valuer.trim() || null,
        }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not save.");
      setSaved(true);
      onSaved();
    } catch {
      setError("We could not save. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={CARD}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
          <Building2 size={20} />
        </span>
        <div>
          <h3 className="text-base font-black">Company details</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
            Shown on the cap table export, grant summaries and employee pages.
          </p>
        </div>
      </div>

      {/* Country */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Globe2 size={18} className="mt-0.5 shrink-0 text-slate-500" />
          <div className="w-full">
            <p className="text-sm font-black">Where is the company incorporated?</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Decides the currency, the rule checks on grants and the wording employees see.
              India: rupees and Companies Act checks. United States: dollars, ISO / NSO and 409A checks.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["IN", "US"] as Jurisdiction[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  disabled={jurisdictionLocked && code !== form.jurisdiction}
                  onClick={() => setForm({ ...form, jurisdiction: code })}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    form.jurisdiction === code
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {code === "IN" ? "India (₹)" : "United States ($)"}
                </button>
              ))}
            </div>
            {jurisdictionLocked && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Lock size={12} /> Locked because amounts are already recorded in this currency.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Company name *</span>
          <input className={`${INPUT} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>

        {us ? (
          <label className="block">
            <span className={LABEL}>State of incorporation</span>
            <select className={`${INPUT} mt-1`} value={form.usState} onChange={(e) => setForm({ ...form, usState: e.target.value })}>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block">
            <span className={LABEL}>CIN</span>
            <input className={`${INPUT} mt-1`} value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value })} />
          </label>
        )}

        {!us && (
          <label className="block">
            <span className={LABEL}>Company type</span>
            <select
              className={`${INPUT} mt-1`}
              value={form.companyType}
              onChange={(e) => setForm({ ...form, companyType: e.target.value as WorkspaceInfo["companyType"] })}
            >
              <option value="PRIVATE_LIMITED">Private limited company</option>
              <option value="UNLISTED_PUBLIC">Unlisted public company</option>
            </select>
          </label>
        )}

        <label className="block">
          <span className={LABEL}>Date of incorporation</span>
          <input type="date" className={`${INPUT} mt-1`} value={form.incorporationDate} onChange={(e) => setForm({ ...form, incorporationDate: e.target.value })} />
        </label>

        {!us && (
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
            <input type="checkbox" checked={form.dpiit} onChange={(e) => setForm({ ...form, dpiit: e.target.checked })} />
            DPIIT-recognised startup
          </label>
        )}

        <div className="mt-2 border-t border-slate-100 pt-4 sm:col-span-2">
          <p className="text-sm font-black">{words.fmvTitle}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{words.fmvHelp}</p>
        </div>
        <label className="block">
          <span className={LABEL}>Value per share ({currencySymbol(j)})</span>
          <input className={`${INPUT} mt-1`} inputMode="decimal" value={form.fmv} onChange={(e) => setForm({ ...form, fmv: e.target.value })} />
        </label>
        <label className="block">
          <span className={LABEL}>Valuation date</span>
          <input type="date" className={`${INPUT} mt-1`} value={form.fmvDate} onChange={(e) => setForm({ ...form, fmvDate: e.target.value })} />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>Valued by</span>
          <input className={`${INPUT} mt-1`} value={form.valuer} placeholder={words.valuerPlaceholder} onChange={(e) => setForm({ ...form, valuer: e.target.value })} />
        </label>
        <div className="sm:col-span-2">
          {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
          {saved && <p className="mb-2 text-sm font-semibold text-emerald-700">Saved.</p>}
          <button type="button" className={BTN_DARK} disabled={saving} onClick={() => void save()}>
            {saving && <Loader2 size={14} className="animate-spin" />} Save details
          </button>
        </div>
      </div>
    </section>
  );
}

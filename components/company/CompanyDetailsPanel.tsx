"use client";

import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";

import type { WorkspaceInfo } from "@/components/company/types";
import { BTN_DARK, CARD, INPUT, LABEL, parseNum, readJson } from "@/components/company/ui";

export default function CompanyDetailsPanel({
  workspace,
  onSaved,
}: {
  workspace: WorkspaceInfo;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
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
          name: form.name.trim(),
          cin: form.cin.trim() || null,
          companyType: form.companyType,
          incorporationDate: form.incorporationDate || null,
          dpiitRecognised: form.dpiit,
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

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Company name *</span>
          <input className={`${INPUT} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block">
          <span className={LABEL}>CIN</span>
          <input className={`${INPUT} mt-1`} value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value })} />
        </label>
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
        <label className="block">
          <span className={LABEL}>Date of incorporation</span>
          <input type="date" className={`${INPUT} mt-1`} value={form.incorporationDate} onChange={(e) => setForm({ ...form, incorporationDate: e.target.value })} />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" checked={form.dpiit} onChange={(e) => setForm({ ...form, dpiit: e.target.checked })} />
          DPIIT-recognised startup
        </label>

        <div className="mt-2 border-t border-slate-100 pt-4 sm:col-span-2">
          <p className="text-sm font-black">Current value per share</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Usually the fair market value from your latest merchant-banker valuation. Employees see it on
            their grant page to understand what their options are worth today. Leave blank if you have
            none yet.
          </p>
        </div>
        <label className="block">
          <span className={LABEL}>Value per share (₹)</span>
          <input className={`${INPUT} mt-1`} inputMode="decimal" value={form.fmv} onChange={(e) => setForm({ ...form, fmv: e.target.value })} />
        </label>
        <label className="block">
          <span className={LABEL}>Valuation date</span>
          <input type="date" className={`${INPUT} mt-1`} value={form.fmvDate} onChange={(e) => setForm({ ...form, fmvDate: e.target.value })} />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>Valued by</span>
          <input className={`${INPUT} mt-1`} value={form.valuer} placeholder="e.g. XYZ Capital (SEBI Cat-I merchant banker)" onChange={(e) => setForm({ ...form, valuer: e.target.value })} />
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

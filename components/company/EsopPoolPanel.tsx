"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, Loader2, Plus, Trash2, X } from "lucide-react";

import type { SchemeRow } from "@/components/company/types";
import {
  BTN_DARK,
  BTN_LIGHT,
  CARD,
  INPUT,
  LABEL,
  fmtDate,
  fmtNum,
  parseNum,
  readJson,
} from "@/components/company/ui";

const EMPTY = {
  name: "ESOP Scheme 2026",
  poolSize: "",
  boardApprovedOn: "",
  shareholderApprovedOn: "",
  resolutionVote: "" as "" | "ORDINARY" | "SPECIAL",
  mgt14FiledOn: "",
  explanatoryStatement: false,
  vestingMonths: "48",
  cliffMonths: "12",
  postExitDays: "90",
};

export default function EsopPoolPanel() {
  const [schemes, setSchemes] = useState<SchemeRow[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/company/schemes", { credentials: "include", cache: "no-store" });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not load your ESOP pool.");
      setSchemes(json.schemes as SchemeRow[]);
    } catch {
      setError("We could not connect. Please retry.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startAdd() {
    setEditingId(null);
    setForm(EMPTY);
    setFormError("");
    setOpen(true);
  }

  function startEdit(s: SchemeRow) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      poolSize: String(s.poolSize),
      boardApprovedOn: s.boardApprovedOn?.slice(0, 10) ?? "",
      shareholderApprovedOn: s.shareholderApprovedOn?.slice(0, 10) ?? "",
      resolutionVote: s.resolutionVote ?? "",
      mgt14FiledOn: s.mgt14FiledOn?.slice(0, 10) ?? "",
      explanatoryStatement: s.explanatoryStatement,
      vestingMonths: String(s.defaultVestingMonths),
      cliffMonths: String(s.defaultCliffMonths),
      postExitDays: String(s.defaultPostExitDays),
    });
    setFormError("");
    setOpen(true);
  }

  async function save() {
    const pool = parseNum(form.poolSize);
    const vest = parseNum(form.vestingMonths);
    const cliff = parseNum(form.cliffMonths);
    const post = parseNum(form.postExitDays);

    if (!form.name.trim()) return setFormError("Enter the scheme name.");
    if (!pool || !Number.isInteger(pool) || pool <= 0) return setFormError("Enter the pool size as a whole number of options.");
    for (const [label, v] of [["Vesting period", vest], ["Cliff", cliff], ["Exercise window", post]] as const) {
      if (v === null || !Number.isInteger(v) || v < 0) return setFormError(`${label} must be a whole number.`);
    }

    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(editingId ? `/api/company/schemes/${editingId}` : "/api/company/schemes", {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          poolSize: pool,
          boardApprovedOn: form.boardApprovedOn || null,
          shareholderApprovedOn: form.shareholderApprovedOn || null,
          resolutionVote: form.resolutionVote || null,
          mgt14FiledOn: form.mgt14FiledOn || null,
          explanatoryStatement: form.explanatoryStatement,
          defaultVestingMonths: vest,
          defaultCliffMonths: cliff,
          defaultPostExitDays: post,
        }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setFormError(json?.message ?? "We could not save this scheme.");
      setOpen(false);
      await load();
    } catch {
      setFormError("We could not save this scheme. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    setError("");
    try {
      const res = await fetch(`/api/company/schemes/${id}`, { method: "DELETE", credentials: "include" });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not delete this scheme.");
      await load();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <Layers size={20} />
            </span>
            <div>
              <h3 className="text-base font-black">ESOP pool</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Record your ESOP scheme as approved: the pool size and the
                dates the board and shareholders approved it. EVC does not
                draft the scheme; your CS or lawyer does. These dates are used
                to flag grants made before approval.
              </p>
            </div>
          </div>
          {open ? (
            <button type="button" className={BTN_LIGHT} onClick={() => setOpen(false)}>
              <X size={14} /> Cancel
            </button>
          ) : (
            <button type="button" className={BTN_DARK} onClick={startAdd}>
              <Plus size={14} /> Add scheme
            </button>
          )}
        </div>

        {open && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className={LABEL}>Scheme name *</span>
              <input className={`${INPUT} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Pool size (options) *</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={form.poolSize} onChange={(e) => setForm({ ...form, poolSize: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Board approved on</span>
              <input type="date" className={`${INPUT} mt-1`} value={form.boardApprovedOn} onChange={(e) => setForm({ ...form, boardApprovedOn: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Shareholders approved on</span>
              <input type="date" className={`${INPUT} mt-1`} value={form.shareholderApprovedOn} onChange={(e) => setForm({ ...form, shareholderApprovedOn: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Resolution passed</span>
              <select className={`${INPUT} mt-1`} value={form.resolutionVote} onChange={(e) => setForm({ ...form, resolutionVote: e.target.value as typeof form.resolutionVote })}>
                <option value="">Not recorded</option>
                <option value="SPECIAL">Special resolution</option>
                <option value="ORDINARY">Ordinary resolution</option>
              </select>
            </label>
            <label className="block">
              <span className={LABEL}>MGT-14 filed on</span>
              <input type="date" className={`${INPUT} mt-1`} value={form.mgt14FiledOn} onChange={(e) => setForm({ ...form, mgt14FiledOn: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Default vesting (months)</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={form.vestingMonths} onChange={(e) => setForm({ ...form, vestingMonths: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Default cliff (months)</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={form.cliffMonths} onChange={(e) => setForm({ ...form, cliffMonths: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Exercise window after leaving (days)</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={form.postExitDays} onChange={(e) => setForm({ ...form, postExitDays: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2 lg:col-span-3">
              <input type="checkbox" checked={form.explanatoryStatement} onChange={(e) => setForm({ ...form, explanatoryStatement: e.target.checked })} />
              Explanatory statement (Rule 12(2) disclosures) is on file
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              {formError && <p className="mb-2 text-sm font-semibold text-red-600">{formError}</p>}
              <button type="button" className={BTN_DARK} disabled={saving} onClick={() => void save()}>
                {saving && <Loader2 size={14} className="animate-spin" />} {editingId ? "Save changes" : "Save scheme"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      </section>

      {schemes === null && !error && (
        <div className={`${CARD} flex items-center gap-3`}>
          <Loader2 className="animate-spin text-blue-600" size={18} />
          <span className="text-sm font-bold">Loading</span>
        </div>
      )}

      {schemes?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm font-semibold text-slate-500">
          No ESOP scheme yet. Add one to start granting options.
        </p>
      )}

      {schemes?.map((s) => {
        const usedPct = s.poolSize > 0 ? Math.min(100, (s.optionsIssued / s.poolSize) * 100) : 0;
        return (
          <section key={s.id} className={CARD}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">{s.name}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Default terms: {s.defaultVestingMonths} months vesting, {s.defaultCliffMonths}-month cliff, {s.defaultPostExitDays}-day exercise window after leaving
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className={BTN_LIGHT} onClick={() => startEdit(s)}>Edit</button>
                <button type="button" className={BTN_LIGHT} disabled={deleting === s.id || s.grantCount > 0} title={s.grantCount > 0 ? "Has grants" : "Delete"} onClick={() => void remove(s.id)}>
                  {deleting === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                ["Pool size", fmtNum(s.poolSize)],
                ["Issued", fmtNum(s.optionsIssued)],
                ["In draft", fmtNum(s.optionsInDraft)],
                ["Available", fmtNum(s.optionsAvailable)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k}</p>
                  <p className="mt-1 text-lg font-black">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${usedPct}%` }} />
            </div>

            <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Board approved</dt><dd className="font-semibold">{fmtDate(s.boardApprovedOn)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Shareholders approved</dt><dd className="font-semibold">{fmtDate(s.shareholderApprovedOn)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Resolution</dt><dd className="font-semibold">{s.resolutionVote === "SPECIAL" ? "Special" : s.resolutionVote === "ORDINARY" ? "Ordinary" : "-"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">MGT-14 filed</dt><dd className="font-semibold">{fmtDate(s.mgt14FiledOn)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Explanatory statement</dt><dd className="font-semibold">{s.explanatoryStatement ? "On file" : "Not confirmed"}</dd></div>
            </dl>
          </section>
        );
      })}
    </div>
  );
}

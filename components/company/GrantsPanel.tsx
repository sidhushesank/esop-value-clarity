"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Gift,
  Info,
  Loader2,
  Plus,
  Repeat,
  Send,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";

import {
  GRANT_STATUS_LABEL,
  GRANT_STATUS_STYLE,
  type GrantDetailResponse,
  type GrantRow,
  type GrantWarning,
  type SchemeRow,
} from "@/components/company/types";
import GrantLetterCard from "@/components/company/GrantLetterCard";
import ImportCard from "@/components/company/ImportCard";
import GrantLinkCard from "@/components/company/GrantLinkCard";
import { useJurisdiction } from "@/components/company/JurisdictionContext";
import {
  currencyTag,
  formatMoney,
  formatNumber,
  formatPrice,
  wordingFor,
} from "@/lib/jurisdiction";
import {
  BTN_DARK,
  BTN_LIGHT,
  CARD,
  INPUT,
  LABEL,
  fmtDate,
  parseNum,
  readJson,
  todayIso,
} from "@/components/company/ui";

type FormState = {
  schemeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeRef: string;
  isPromoterOver10Pct: boolean;
  usOptionType: "" | "ISO" | "NSO";
  grantDate: string;
  options: string;
  exercisePrice: string;
  vestingStart: string;
  vestingMonths: string;
  cliffMonths: string;
  expiryDate: string;
  postExitDays: string;
  note: string;
};

function emptyForm(s?: SchemeRow): FormState {
  return {
    schemeId: s?.id ?? "",
    employeeName: "",
    employeeEmail: "",
    employeeRef: "",
    isPromoterOver10Pct: false,
    usOptionType: "",
    grantDate: todayIso(),
    options: "",
    exercisePrice: "",
    vestingStart: todayIso(),
    vestingMonths: String(s?.defaultVestingMonths ?? 48),
    cliffMonths: String(s?.defaultCliffMonths ?? 12),
    expiryDate: "",
    postExitDays: String(s?.defaultPostExitDays ?? 90),
    note: "",
  };
}

export default function GrantsPanel({
  companyName,
  onChanged,
}: {
  companyName: string;
  onChanged?: () => void;
}) {
  const j = useJurisdiction();
  const us = j === "US";
  const words = wordingFor(j);
  const fmtNum = (n: number) => formatNumber(n, j);
  const [grants, setGrants] = useState<GrantRow[] | null>(null);
  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState<{ name: string; warnings: GrantWarning[] } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [gRes, sRes] = await Promise.all([
        fetch("/api/company/grants", { credentials: "include", cache: "no-store" }),
        fetch("/api/company/schemes", { credentials: "include", cache: "no-store" }),
      ]);
      const [g, s] = await Promise.all([readJson(gRes), readJson(sRes)]);
      if (!gRes.ok || !g?.success) return setError(g?.message ?? "We could not load grants.");
      if (!sRes.ok || !s?.success) return setError(s?.message ?? "We could not load schemes.");
      setGrants(g.grants as GrantRow[]);
      setSchemes(s.schemes as SchemeRow[]);
    } catch {
      setError("We could not connect. Please retry.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function refresh() {
    void load();
    onChanged?.();
  }

  function pickScheme(id: string) {
    const s = schemes.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      schemeId: id,
      vestingMonths: String(s?.defaultVestingMonths ?? f.vestingMonths),
      cliffMonths: String(s?.defaultCliffMonths ?? f.cliffMonths),
      postExitDays: String(s?.defaultPostExitDays ?? f.postExitDays),
    }));
  }

  async function create() {
    const options = parseNum(form.options);
    const price = parseNum(form.exercisePrice);
    const vest = parseNum(form.vestingMonths);
    const cliff = parseNum(form.cliffMonths);
    const post = parseNum(form.postExitDays);

    if (!form.schemeId) return setFormError(us ? "Choose the equity incentive plan." : "Choose the ESOP scheme.");
    if (!form.employeeName.trim()) return setFormError("Enter the employee's name.");
    if (!options || !Number.isInteger(options) || options <= 0) return setFormError("Enter the number of options as a whole number.");
    if (price === null || Number.isNaN(price) || price < 0) return setFormError("Enter the exercise price (0 is allowed).");
    if (vest === null || cliff === null || post === null || [vest, cliff, post].some((v) => !Number.isInteger(v) || v < 0)) {
      return setFormError("Vesting, cliff and exercise window must be whole numbers.");
    }

    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/company/grants", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId: form.schemeId,
          employeeName: form.employeeName.trim(),
          employeeEmail: form.employeeEmail.trim() || null,
          employeeRef: form.employeeRef.trim() || null,
          isPromoterOver10Pct: form.isPromoterOver10Pct,
          usOptionType: us ? form.usOptionType || null : null,
          grantDate: form.grantDate,
          options,
          exercisePrice: price,
          vestingStart: form.vestingStart,
          vestingMonths: vest,
          cliffMonths: cliff,
          expiryDate: form.expiryDate || null,
          postExitDays: post,
          note: form.note.trim() || null,
        }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setFormError(json?.message ?? "We could not create this grant.");
      setCreated({ name: form.employeeName.trim(), warnings: json.warnings as GrantWarning[] });
      setOpen(false);
      setSelected(json.grant.id as string);
      refresh();
    } catch {
      setFormError("We could not create this grant. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  const noScheme = schemes.length === 0;

  return (
    <div className="space-y-5">
      <section className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <Gift size={20} />
            </span>
            <div>
              <h3 className="text-base font-black">Grants</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Create a grant as a draft, check the points flagged, download
                the draft summary for your {us ? "lawyer" : "CS or lawyer"}, then mark it issued.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/api/company/grants/register" className={BTN_LIGHT}>
              <Download size={14} /> {us ? "Option ledger" : "Options register"}
            </a>
            {open ? (
              <button type="button" className={BTN_LIGHT} onClick={() => setOpen(false)}>
                <X size={14} /> Cancel
              </button>
            ) : (
              <button
                type="button"
                className={BTN_DARK}
                disabled={noScheme}
                onClick={() => {
                  setForm(emptyForm(schemes[0]));
                  setFormError("");
                  setCreated(null);
                  setOpen(true);
                }}
              >
                <Plus size={14} /> New grant
              </button>
            )}
          </div>
        </div>

        {noScheme && grants !== null && (
          <p className="mt-3 text-xs font-semibold text-slate-400">
            {us ? "Add an equity incentive plan under Option pool first." : "Add an ESOP scheme under ESOP pool first."}
          </p>
        )}

        {open && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className={LABEL}>{us ? "Plan *" : "Scheme *"}</span>
              <select className={`${INPUT} mt-1`} value={form.schemeId} onChange={(e) => pickScheme(e.target.value)}>
                {schemes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({fmtNum(s.optionsAvailable)} available)
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={LABEL}>Employee name *</span>
              <input className={`${INPUT} mt-1`} value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Employee email</span>
              <input type="email" className={`${INPUT} mt-1`} value={form.employeeEmail} placeholder="Used for their grant page" onChange={(e) => setForm({ ...form, employeeEmail: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Employee ID</span>
              <input className={`${INPUT} mt-1`} value={form.employeeRef} onChange={(e) => setForm({ ...form, employeeRef: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Number of options *</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>{us ? "Strike price per option" : "Exercise price per option"} {currencyTag(j)} *</span>
              <input className={`${INPUT} mt-1`} inputMode="decimal" value={form.exercisePrice} onChange={(e) => setForm({ ...form, exercisePrice: e.target.value })} />
            </label>
            {us && (
              <label className="block">
                <span className={LABEL}>Option type</span>
                <select
                  className={`${INPUT} mt-1`}
                  value={form.usOptionType}
                  onChange={(e) => setForm({ ...form, usOptionType: e.target.value as FormState["usOptionType"] })}
                >
                  <option value="">Choose ISO or NSO</option>
                  <option value="ISO">ISO (incentive stock option, employees only)</option>
                  <option value="NSO">NSO (non-qualified, anyone)</option>
                </select>
              </label>
            )}
            <label className="block">
              <span className={LABEL}>Grant date *</span>
              <input type="date" className={`${INPUT} mt-1`} value={form.grantDate} onChange={(e) => setForm({ ...form, grantDate: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Vesting starts *</span>
              <input type="date" className={`${INPUT} mt-1`} value={form.vestingStart} onChange={(e) => setForm({ ...form, vestingStart: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Option expiry</span>
              <input type="date" className={`${INPUT} mt-1`} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Vesting (months) *</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={form.vestingMonths} onChange={(e) => setForm({ ...form, vestingMonths: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Cliff (months) *</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={form.cliffMonths} onChange={(e) => setForm({ ...form, cliffMonths: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Exercise window after leaving (days) *</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" value={form.postExitDays} onChange={(e) => setForm({ ...form, postExitDays: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2 lg:col-span-3">
              <input type="checkbox" checked={form.isPromoterOver10Pct} onChange={(e) => setForm({ ...form, isPromoterOver10Pct: e.target.checked })} />
              {words.bigHolderCheckbox}
            </label>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className={LABEL}>Note</span>
              <input className={`${INPUT} mt-1`} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              {formError && <p className="mb-2 text-sm font-semibold text-red-600">{formError}</p>}
              <button type="button" className={BTN_DARK} disabled={saving} onClick={() => void create()}>
                {saving && <Loader2 size={14} className="animate-spin" />} Create draft grant
              </button>
            </div>
          </div>
        )}

        {created && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
            <p className="font-bold text-emerald-800">Draft grant created for {created.name}.</p>
            {created.warnings.length > 0 ? (
              <p className="mt-1 text-emerald-900">Review the {created.warnings.length} point{created.warnings.length === 1 ? "" : "s"} flagged below before issuing.</p>
            ) : (
              <p className="mt-1 text-emerald-900">Nothing flagged. Download the summary for review, then issue it.</p>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      </section>

      {!noScheme && grants !== null && (
        <ImportCard
          kind="grants"
          schemes={schemes.map((s) => ({ id: s.id, name: s.name, optionsAvailable: s.optionsAvailable }))}
          onImported={refresh}
        />
      )}

      {grants === null && !error && (
        <div className={`${CARD} flex items-center gap-3`}>
          <Loader2 className="animate-spin text-blue-600" size={18} />
          <span className="text-sm font-bold">Loading grants</span>
        </div>
      )}

      {grants && grants.length > 0 && (
        <section className={`${CARD} p-0`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Granted</th>
                  <th className="px-3 py-3 text-right">Options</th>
                  <th className="px-3 py-3 text-right">Vested today</th>
                  <th className="px-3 py-3 text-right">Price {currencyTag(j)}</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {grants.map((g) => (
                  <tr
                    key={g.id}
                    className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${selected === g.id ? "bg-blue-50/40" : ""}`}
                    onClick={() => setSelected(selected === g.id ? null : g.id)}
                  >
                    <td className="px-6 py-3">
                      <p className="font-bold">{g.employeeName}</p>
                      <p className="text-xs text-slate-400">
                        {g.scheme.name}
                        {us && g.usOptionType ? ` · ${g.usOptionType}` : ""}
                        {g.employeeRef ? ` · ${g.employeeRef}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${GRANT_STATUS_STYLE[g.status]}`}>
                        {GRANT_STATUS_LABEL[g.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{fmtDate(g.grantDate)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtNum(g.options)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {fmtNum(g.position.vested)}
                      <span className="ml-1 text-xs text-slate-400">
                        ({g.options > 0 ? Math.round((g.position.vested / g.options) * 100) : 0}%)
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(g.exercisePrice, j, us ? 4 : 2)}</td>
                    <td className="px-6 py-3 text-right text-xs font-black text-blue-700">
                      {selected === g.id ? "Close" : "Open"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {grants && grants.length === 0 && !noScheme && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm font-semibold text-slate-500">
          No grants yet. Click New grant to create the first one.
        </p>
      )}

      {selected && (
        <GrantDetail
          key={selected}
          grantId={selected}
          companyName={companyName}
          onClose={() => setSelected(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Grant detail                                                        */
/* ------------------------------------------------------------------ */

function GrantDetail({
  grantId,
  companyName,
  onClose,
  onChanged,
}: {
  grantId: string;
  companyName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const j = useJurisdiction();
  const us = j === "US";
  const fmtNum = (n: number) => formatNumber(n, j);
  const [data, setData] = useState<GrantDetailResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [leftOn, setLeftOn] = useState(todayIso());
  const [leaving, setLeaving] = useState(false);
  const [exercising, setExercising] = useState(false);
  const [ex, setEx] = useState({ date: todayIso(), options: "", fmv: "", deferred: false, allotNow: true, allotDate: todayIso(), classId: "" });
  const [classes, setClasses] = useState<{ id: string; name: string; kind: string }[]>([]);

  async function openExercise() {
    setExercising(true);
    setError("");
    try {
      const res = await fetch("/api/company/exercises", { credentials: "include", cache: "no-store" });
      const json = await readJson(res);
      if (res.ok && json?.success) {
        const list = json.classes as { id: string; name: string; kind: string }[];
        setClasses(list);
        const first = list.find((c) => c.kind === "EQUITY") ?? list[0];
        setEx((v) => ({ ...v, classId: first?.id ?? "", allotNow: Boolean(first) }));
      }
    } catch {
      /* classes are optional: the exercise can be allotted later */
    }
  }

  async function recordExercise() {
    const options = parseNum(ex.options);
    const fmv = parseNum(ex.fmv);
    if (!options || !Number.isInteger(options) || options <= 0) return setError("Enter how many options are exercised.");
    if (fmv !== null && (Number.isNaN(fmv) || fmv <= 0)) return setError("Value per share must be a number above zero.");
    setBusy("exercise");
    setError("");
    try {
      const res = await fetch(`/api/company/grants/${grantId}/exercises`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseDate: ex.date,
          options,
          fmvPerShare: fmv,
          tdsDeferred: !us && ex.deferred,
          allot: ex.allotNow && ex.classId ? { date: ex.allotDate, classId: ex.classId } : null,
        }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "That did not work. Please retry.");
      setExercising(false);
      setEx((v) => ({ ...v, options: "", fmv: "" }));
      onChanged();
      await load();
    } catch {
      setError("That did not work. Please retry.");
    } finally {
      setBusy("");
    }
  }

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/company/grants/${grantId}`, { credentials: "include", cache: "no-store" });
      const json = (await readJson(res)) as GrantDetailResponse | null;
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not load this grant.");
      setData(json);
    } catch {
      setError("We could not connect. Please retry.");
    }
  }, [grantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(action: "issue" | "left" | "lapse" | "delete") {
    if (
      action === "lapse" &&
      !window.confirm("Lapse every option in this grant that has not been exercised? They return to the pool. This cannot be undone here.")
    ) {
      return;
    }
    if (action === "delete" && !window.confirm("Delete this draft grant?")) return;

    setBusy(action);
    setError("");
    try {
      const res = await fetch(
        action === "delete" ? `/api/company/grants/${grantId}` : `/api/company/grants/${grantId}/${action}`,
        {
          method: action === "delete" ? "DELETE" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: action === "left" ? JSON.stringify({ leftOn }) : undefined,
        }
      );
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "That did not work. Please retry.");
      setLeaving(false);
      onChanged();
      if (action === "delete") onClose();
      else await load();
    } catch {
      setError("That did not work. Please retry.");
    } finally {
      setBusy("");
    }
  }

  if (!data) {
    return (
      <div className={`${CARD} flex items-center gap-3`}>
        {error ? (
          <span className="text-sm font-semibold text-red-600">{error}</span>
        ) : (
          <>
            <Loader2 className="animate-spin text-blue-600" size={18} />
            <span className="text-sm font-bold">Loading grant</span>
          </>
        )}
      </div>
    );
  }

  const { grant, position, milestones, warnings } = data;
  const isDraft = grant.status === "DRAFT";
  const canLeave = grant.status === "ISSUED" || grant.status === "ACCEPTED";
  const canLapse = grant.status === "LEFT" || grant.status === "ISSUED" || grant.status === "ACCEPTED";
  const canExercise = canLapse && position.vestedUnexercised > 0;
  const blocked = warnings.some((w) => w.severity === "BLOCK");

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black">{grant.employeeName}</h3>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${GRANT_STATUS_STYLE[grant.status]}`}>
              {GRANT_STATUS_LABEL[grant.status]}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {grant.scheme.name}
            {us ? ` · ${grant.usOptionType ?? "option type not set"}` : ""} · granted {fmtDate(grant.grantDate)}
            {grant.employeeEmail ? ` · ${grant.employeeEmail}` : ""}
          </p>
        </div>
        <button type="button" className={BTN_LIGHT} onClick={onClose}>
          <X size={14} /> Close
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Options granted", fmtNum(grant.options)],
          ["Vested today", fmtNum(position.vested)],
          grant.leftOn
            ? ["Lapsed on leaving", fmtNum(position.lapsed)]
            : ["Still to vest", fmtNum(position.unvested)],
          ["Cost to exercise vested", formatMoney(position.exerciseCostOfVested, j, { decimals: us ? 2 : 0 })],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k}</p>
            <p className="mt-1 text-lg font-black">{v}</p>
          </div>
        ))}
      </div>

      {grant.leftOn && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Left on {fmtDate(grant.leftOn)}. {fmtNum(position.lapsed)} unvested options returned to the pool.
          {position.exerciseWindowEnds && grant.status === "LEFT"
            ? ` Vested options can be exercised until ${fmtDate(position.exerciseWindowEnds)}.`
            : ""}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-black">Vesting schedule</h4>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2 text-left">Date</th>
                <th className="py-2 text-right">Vested (total)</th>
                <th className="py-2 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.date} className="border-b border-slate-100">
                  <td className="py-2">{fmtDate(m.date)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtNum(m.vestedTotal)}</td>
                  <td className="py-2 text-right tabular-nums">{m.vestedPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-400">
            {grant.vestingMonths} months, {grant.cliffMonths}-month cliff, then monthly. {us ? "Strike price" : "Exercise price"} {formatPrice(grant.exercisePrice, j)}.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-black">Points to review</h4>
          {warnings.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={16} /> Nothing flagged.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {warnings.map((w) => (
                <li
                  key={w.code}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    w.severity === "BLOCK"
                      ? "border-red-200 bg-red-50"
                      : w.severity === "WARN"
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="flex items-start gap-2 font-semibold">
                    {w.severity === "INFO" ? <Info size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
                    {w.message}
                  </p>
                  <p className="mt-1 pl-6 text-xs text-slate-500">Basis: {w.source}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-5">
        <a href={`/api/company/grants/${grantId}/summary`} className={BTN_LIGHT}>
          <FileText size={14} /> Draft summary (PDF)
        </a>

        {isDraft && (
          <>
            <button type="button" className={BTN_DARK} disabled={!!busy || blocked} title={blocked ? "Fix the pool issue first" : undefined} onClick={() => void act("issue")}>
              {busy === "issue" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Mark as issued
            </button>
            <button type="button" className={BTN_LIGHT} disabled={!!busy} onClick={() => void act("delete")}>
              {busy === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete draft
            </button>
          </>
        )}

        {canLeave && !leaving && (
          <button type="button" className={BTN_LIGHT} disabled={!!busy} onClick={() => setLeaving(true)}>
            <UserMinus size={14} /> Employee left
          </button>
        )}

        {canLeave && leaving && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className={LABEL}>Leaving date</span>
              <input type="date" max={todayIso()} className={`${INPUT} mt-1 h-10 w-44`} value={leftOn} onChange={(e) => setLeftOn(e.target.value)} />
            </label>
            <button type="button" className={BTN_DARK} disabled={!!busy} onClick={() => void act("left")}>
              {busy === "left" && <Loader2 size={14} className="animate-spin" />} Confirm
            </button>
            <button type="button" className={BTN_LIGHT} onClick={() => setLeaving(false)}>Cancel</button>
          </div>
        )}

        {canExercise && !exercising && (
          <button type="button" className={BTN_DARK} disabled={!!busy} onClick={() => void openExercise()}>
            <Repeat size={14} /> Record exercise
          </button>
        )}

        {canLapse && (
          <button type="button" className={BTN_LIGHT} disabled={!!busy} onClick={() => void act("lapse")} title="Everything not exercised lapses back to the pool">
            {busy === "lapse" && <Loader2 size={14} className="animate-spin" />} Lapse remaining options
          </button>
        )}
      </div>

      {exercising && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-black">Record an exercise</p>
          <p className="mt-1 text-xs text-slate-500">
            {fmtNum(position.vestedUnexercised)} vested options can be exercised today at {formatPrice(grant.exercisePrice, j)} each.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className={LABEL}>Exercise date</span>
              <input type="date" max={todayIso()} className={`${INPUT} mt-1`} value={ex.date} onChange={(e) => setEx({ ...ex, date: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>Options exercised</span>
              <input inputMode="numeric" className={`${INPUT} mt-1`} placeholder={String(position.vestedUnexercised)} value={ex.options} onChange={(e) => setEx({ ...ex, options: e.target.value })} />
            </label>
            <label className="block">
              <span className={LABEL}>{us ? "FMV per share on that date" : "Value per share on that date (FMV)"}</span>
              <input inputMode="decimal" className={`${INPUT} mt-1`} placeholder="Blank = the company's current value" value={ex.fmv} onChange={(e) => setEx({ ...ex, fmv: e.target.value })} />
            </label>
          </div>
          {!us && (
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={ex.deferred} onChange={(e) => setEx({ ...ex, deferred: e.target.checked })} />
              Defer TDS (only for start-ups with the IMB certificate under s.80-IAC)
            </label>
          )}
          {classes.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={ex.allotNow} onChange={(e) => setEx({ ...ex, allotNow: e.target.checked })} />
                {us ? "Issue the shares now" : "Allot the shares now"}
              </label>
              {ex.allotNow && (
                <>
                  <label className="block">
                    <span className={LABEL}>{us ? "Issue date" : "Allotment date"}</span>
                    <input type="date" max={todayIso()} className={`${INPUT} mt-1 w-44`} value={ex.allotDate} onChange={(e) => setEx({ ...ex, allotDate: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className={LABEL}>Class</span>
                    <select className={`${INPUT} mt-1 w-52`} value={ex.classId} onChange={(e) => setEx({ ...ex, classId: e.target.value })}>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No share class yet: you can {us ? "issue" : "allot"} the shares later from the Exercises tab.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={BTN_DARK} disabled={!!busy} onClick={() => void recordExercise()}>
              {busy === "exercise" && <Loader2 size={14} className="animate-spin" />} Record exercise
            </button>
            <button type="button" className={BTN_LIGHT} onClick={() => setExercising(false)}>
              Cancel
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Filings and due dates for this exercise then appear on the Exercises tab.</p>
        </div>
      )}

      {grant.status !== "LAPSED" && (
        <GrantLetterCard
          grantId={grantId}
          fileName={grant.letterFileName}
          fileSize={grant.letterFileSize}
          uploadedAt={grant.letterUploadedAt}
          downloadedAt={grant.letterDownloadedAt}
          downloadCount={grant.letterDownloadCount}
          onChanged={() => void load()}
        />
      )}

      {!isDraft && grant.status !== "LAPSED" && (
        <GrantLinkCard
          grantId={grantId}
          employeeName={grant.employeeName}
          employeeEmail={grant.employeeEmail}
          companyName={companyName}
        />
      )}

      {grant.acceptedAt && (
        <p className="mt-4 text-sm font-semibold text-emerald-700">
          {grant.employeeName} accepted this grant on {fmtDate(grant.acceptedAt)}.
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-400">
        {us
          ? "The summary is a draft for your lawyer, not a grant agreement."
          : "The summary is a draft for your CS or lawyer, not a grant letter."}
      </p>
    </section>
  );
}

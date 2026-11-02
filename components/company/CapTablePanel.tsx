"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRightLeft,
  Download,
  Layers,
  Loader2,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  HOLDER_TYPE_LABEL,
  KIND_LABEL,
  MOVEMENT_LABEL,
  type CapTableResponse,
  type MovementKind,
  type SecurityKind,
  type ShareholderType,
} from "@/components/company/types";
import ImportCard from "@/components/company/ImportCard";
import {
  BTN_DARK,
  BTN_LIGHT,
  CARD,
  INPUT,
  LABEL,
  fmtDate,
  fmtNum,
  fmtPct,
  parseNum,
  readJson,
  todayIso,
} from "@/components/company/ui";

const AMOUNT_KINDS: SecurityKind[] = ["CONVERTIBLE_NOTE", "ISAFE"];

export default function CapTablePanel() {
  const [data, setData] = useState<CapTableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [asOf, setAsOf] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
      const res = await fetch(`/api/company/captable${qs}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await readJson(res)) as CapTableResponse | null;
      if (!res.ok || !json?.success) {
        setError(json?.message ?? "We could not load the cap table.");
        return;
      }
      setData(json);
    } catch {
      setError("We could not connect. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [asOf]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) {
    return (
      <div className={`${CARD} flex items-center gap-3`}>
        {loading ? (
          <>
            <Loader2 className="animate-spin text-blue-600" size={18} />
            <span className="text-sm font-bold">Loading cap table</span>
          </>
        ) : (
          <span className="text-sm font-semibold text-red-600">{error}</span>
        )}
      </div>
    );
  }

  const { snapshot } = data;
  const shareClasses = snapshot.classes.filter((c) => !c.amountBased);
  const amountClasses = snapshot.classes.filter((c) => c.amountBased);
  const isEmpty = snapshot.rows.length === 0;

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Equity shares issued", fmtNum(snapshot.totals.equityShares)],
          ["Fully diluted shares", fmtNum(snapshot.totals.fullyDilutedShares)],
          ["Shareholders", String(snapshot.rows.length)],
          [
            "ESOP pool (fully diluted)",
            snapshot.esop.poolSize > 0 ? fmtPct(snapshot.esop.fullyDilutedPct) : "Not set",
          ],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <ImportCard kind="captable" onImported={() => void load()} />

      {/* Cap table */}
      <section className={CARD}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-black">Cap table</h3>
            <p className="mt-1 text-sm text-slate-500">
              Worked out from every entry in the log below. Pick a date to see
              it as it was then.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className={LABEL}>As of</span>
              <input
                type="date"
                value={asOf}
                max={todayIso()}
                onChange={(e) => setAsOf(e.target.value)}
                className={`${INPUT} mt-1 h-10 w-44`}
              />
            </label>
            {asOf && (
              <button type="button" className={BTN_LIGHT} onClick={() => setAsOf("")}>
                Today
              </button>
            )}
            <a
              href={`/api/company/captable/export${asOf ? `?asOf=${asOf}` : ""}`}
              className={BTN_DARK}
            >
              <Download size={14} />
              Excel
            </a>
          </div>
        </div>

        {isEmpty ? (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
            No shares recorded yet. Add a class (for example Equity shares),
            add the founders, then record their allotment.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-4">Shareholder</th>
                  {shareClasses.map((c) => (
                    <th key={c.id} className="py-3 pr-4 text-right">{c.name}</th>
                  ))}
                  {amountClasses.map((c) => (
                    <th key={c.id} className="py-3 pr-4 text-right">{c.name} (₹)</th>
                  ))}
                  <th className="py-3 pr-4 text-right">Issued %</th>
                  <th className="py-3 text-right">Fully diluted %</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.rows.map((r) => (
                  <tr key={r.holderId} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <p className="font-bold">{r.name}</p>
                      <p className="text-xs text-slate-400">{HOLDER_TYPE_LABEL[r.type]}</p>
                    </td>
                    {shareClasses.map((c) => (
                      <td key={c.id} className="py-3 pr-4 text-right tabular-nums">
                        {r.units[c.id] ? fmtNum(r.units[c.id]) : "-"}
                      </td>
                    ))}
                    {amountClasses.map((c) => (
                      <td key={c.id} className="py-3 pr-4 text-right tabular-nums">
                        {r.amounts[c.id] ? fmtNum(r.amounts[c.id]) : "-"}
                      </td>
                    ))}
                    <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                      {fmtPct(r.issuedPct)}
                    </td>
                    <td className="py-3 text-right font-black tabular-nums">
                      {fmtPct(r.fullyDilutedPct)}
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <td className="py-3 pr-4">
                    <p className="font-bold">ESOP pool</p>
                    <p className="text-xs text-slate-400">
                      {fmtNum(snapshot.esop.outstandingOptions)} granted ·{" "}
                      {fmtNum(snapshot.esop.unallocated)} unallocated
                    </p>
                  </td>
                  {shareClasses.map((c) => <td key={c.id} />)}
                  {amountClasses.map((c) => <td key={c.id} />)}
                  <td className="py-3 pr-4 text-right text-slate-400">-</td>
                  <td className="py-3 text-right font-black tabular-nums">
                    {fmtPct(snapshot.esop.fullyDilutedPct)}
                  </td>
                </tr>
                <tr className="font-black">
                  <td className="py-3 pr-4">Total</td>
                  {shareClasses.map((c) => (
                    <td key={c.id} className="py-3 pr-4 text-right tabular-nums">{fmtNum(c.totalUnits)}</td>
                  ))}
                  {amountClasses.map((c) => (
                    <td key={c.id} className="py-3 pr-4 text-right tabular-nums">{fmtNum(c.totalUnits)}</td>
                  ))}
                  <td className="py-3 pr-4 text-right">100%</td>
                  <td className="py-3 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {snapshot.notes.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-xs leading-5 text-slate-500">
            {snapshot.notes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ClassesCard data={data} onChanged={load} />
        <HoldersCard data={data} onChanged={load} />
      </div>

      <MovementsCard data={data} onChanged={load} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Classes                                                             */
/* ------------------------------------------------------------------ */

function ClassesCard({ data, onChanged }: { data: CapTableResponse; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    kind: "EQUITY" as SecurityKind,
    faceValue: "",
    conversionRatio: "",
    liqPrefMultiple: "",
    participating: false,
    valuationCap: "",
    discountPct: "",
  });

  const isPref = form.kind === "CCPS" || form.kind === "CCD" || form.kind === "WARRANT";
  const isAmount = AMOUNT_KINDS.includes(form.kind);

  async function save() {
    if (!form.name.trim()) return setError("Enter a name, for example \"Equity shares\".");
    const nums = {
      faceValue: parseNum(form.faceValue),
      conversionRatio: parseNum(form.conversionRatio),
      liqPrefMultiple: parseNum(form.liqPrefMultiple),
      valuationCap: parseNum(form.valuationCap),
      discountPct: parseNum(form.discountPct),
    };
    if (Object.values(nums).some((v) => v !== null && (Number.isNaN(v) || v < 0))) {
      return setError("Numbers must be positive.");
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/company/captable/classes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          kind: form.kind,
          faceValue: nums.faceValue || null,
          conversionRatio: isPref ? nums.conversionRatio || null : null,
          liqPrefMultiple: form.kind === "CCPS" ? nums.liqPrefMultiple : null,
          participating: form.kind === "CCPS" ? form.participating : null,
          valuationCap: isAmount ? nums.valuationCap || null : null,
          discountPct: isAmount ? nums.discountPct : null,
        }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not add this class.");
      setOpen(false);
      setForm({ ...form, name: "", conversionRatio: "", liqPrefMultiple: "", valuationCap: "", discountPct: "" });
      onChanged();
    } catch {
      setError("We could not add this class. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    setError("");
    try {
      const res = await fetch(`/api/company/captable/classes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not delete this class.");
      onChanged();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className={CARD}>
      <CardHeader
        icon={<Layers size={20} />}
        title="Share classes"
        text="Equity shares, preference shares (CCPS), debentures, notes and iSAFEs."
        open={open}
        onOpen={() => { setError(""); setOpen(true); }}
        onClose={() => setOpen(false)}
        addLabel="Add class"
      />

      {open && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={LABEL}>Name *</span>
            <input className={`${INPUT} mt-1`} value={form.name} placeholder="Equity shares" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block">
            <span className={LABEL}>Type *</span>
            <select className={`${INPUT} mt-1`} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as SecurityKind })}>
              {(Object.keys(KIND_LABEL) as SecurityKind[]).map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
          </label>
          {!isAmount && (
            <label className="block">
              <span className={LABEL}>Face value per share (₹)</span>
              <input className={`${INPUT} mt-1`} inputMode="decimal" value={form.faceValue} placeholder="10" onChange={(e) => setForm({ ...form, faceValue: e.target.value })} />
            </label>
          )}
          {isPref && (
            <label className="block">
              <span className={LABEL}>Equity shares per unit on conversion</span>
              <input className={`${INPUT} mt-1`} inputMode="decimal" value={form.conversionRatio} placeholder="1" onChange={(e) => setForm({ ...form, conversionRatio: e.target.value })} />
            </label>
          )}
          {form.kind === "CCPS" && (
            <>
              <label className="block">
                <span className={LABEL}>Liquidation preference (×)</span>
                <input className={`${INPUT} mt-1`} inputMode="decimal" value={form.liqPrefMultiple} placeholder="1" onChange={(e) => setForm({ ...form, liqPrefMultiple: e.target.value })} />
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
                <input type="checkbox" checked={form.participating} onChange={(e) => setForm({ ...form, participating: e.target.checked })} />
                Participating
              </label>
            </>
          )}
          {isAmount && (
            <>
              <label className="block">
                <span className={LABEL}>Valuation cap (₹)</span>
                <input className={`${INPUT} mt-1`} inputMode="decimal" value={form.valuationCap} onChange={(e) => setForm({ ...form, valuationCap: e.target.value })} />
              </label>
              <label className="block">
                <span className={LABEL}>Discount (%)</span>
                <input className={`${INPUT} mt-1`} inputMode="decimal" value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value })} />
              </label>
              <p className="text-xs leading-5 text-slate-500 sm:col-span-2">
                For a note or iSAFE, record each investor&apos;s amount in ₹ as the
                quantity when you record the allotment.
              </p>
            </>
          )}
          <div className="sm:col-span-2">
            {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
            <button type="button" className={BTN_DARK} disabled={saving} onClick={() => void save()}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save class
            </button>
          </div>
        </div>
      )}

      {!open && error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <ul className="mt-5 divide-y divide-slate-100">
        {data.classes.length === 0 && (
          <li className="py-3 text-sm text-slate-400">No classes yet.</li>
        )}
        {data.classes.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate font-bold">{c.name}</p>
              <p className="text-xs text-slate-400">
                {KIND_LABEL[c.kind]}
                {c.conversionRatio ? ` · converts 1:${c.conversionRatio}` : ""}
                {c.liqPrefMultiple ? ` · ${c.liqPrefMultiple}× preference${c.participating ? ", participating" : ""}` : ""}
                {c.valuationCap ? ` · cap ₹${fmtNum(c.valuationCap)}` : ""}
                {c.discountPct ? ` · ${c.discountPct}% discount` : ""}
              </p>
            </div>
            <button type="button" title="Delete" className="text-slate-300 transition hover:text-red-600" disabled={deleting === c.id} onClick={() => void remove(c.id)}>
              {deleting === c.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shareholders                                                        */
/* ------------------------------------------------------------------ */

function HoldersCard({ data, onChanged }: { data: CapTableResponse; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "FOUNDER" as ShareholderType,
    email: "",
    isResident: true,
  });

  async function save() {
    if (!form.name.trim()) return setError("Enter the shareholder's name.");
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/company/captable/holders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim() }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not add this shareholder.");
      setOpen(false);
      setForm({ ...form, name: "", email: "" });
      onChanged();
    } catch {
      setError("We could not add this shareholder. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    setError("");
    try {
      const res = await fetch(`/api/company/captable/holders/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not delete this shareholder.");
      onChanged();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className={CARD}>
      <CardHeader
        icon={<Users size={20} />}
        title="Shareholders"
        text="Founders, investors and anyone else who holds or will hold shares."
        open={open}
        onOpen={() => { setError(""); setOpen(true); }}
        onClose={() => setOpen(false)}
        addLabel="Add shareholder"
      />

      {open && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={LABEL}>Name *</span>
            <input className={`${INPUT} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block">
            <span className={LABEL}>Type</span>
            <select className={`${INPUT} mt-1`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ShareholderType })}>
              {(Object.keys(HOLDER_TYPE_LABEL) as ShareholderType[]).map((t) => (
                <option key={t} value={t}>{HOLDER_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>Email</span>
            <input className={`${INPUT} mt-1`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
            <input type="checkbox" checked={form.isResident} onChange={(e) => setForm({ ...form, isResident: e.target.checked })} />
            Resident in India
          </label>
          <div className="sm:col-span-2">
            {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
            <button type="button" className={BTN_DARK} disabled={saving} onClick={() => void save()}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save shareholder
            </button>
          </div>
        </div>
      )}

      {!open && error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <ul className="mt-5 divide-y divide-slate-100">
        {data.holders.length === 0 && (
          <li className="py-3 text-sm text-slate-400">No shareholders yet.</li>
        )}
        {data.holders.map((h) => (
          <li key={h.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate font-bold">{h.name}</p>
              <p className="truncate text-xs text-slate-400">
                {HOLDER_TYPE_LABEL[h.type]}
                {h.email ? ` · ${h.email}` : ""}
                {!h.isResident ? " · Non-resident" : ""}
              </p>
            </div>
            <button type="button" title="Delete" className="text-slate-300 transition hover:text-red-600" disabled={deleting === h.id} onClick={() => void remove(h.id)}>
              {deleting === h.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Movements                                                           */
/* ------------------------------------------------------------------ */

function MovementsCard({ data, onChanged }: { data: CapTableResponse; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    kind: "ALLOTMENT" as MovementKind,
    date: todayIso(),
    classId: "",
    toClassId: "",
    fromHolderId: "",
    toHolderId: "",
    quantity: "",
    toQuantity: "",
    pricePerShare: "",
    note: "",
  });

  const selectedClass = useMemo(
    () => data.classes.find((c) => c.id === form.classId),
    [data.classes, form.classId]
  );
  const amountBased = selectedClass ? AMOUNT_KINDS.includes(selectedClass.kind) : false;

  const needsFrom = form.kind !== "ALLOTMENT";
  const needsTo = form.kind === "ALLOTMENT" || form.kind === "TRANSFER";
  const isConversion = form.kind === "CONVERSION";

  async function save() {
    const quantity = parseNum(form.quantity);
    const toQuantity = parseNum(form.toQuantity);
    const price = parseNum(form.pricePerShare);

    if (!form.classId) return setError("Choose a class.");
    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
      return setError(amountBased ? "Enter the amount in whole rupees." : "Enter a whole number of shares.");
    }
    if (isConversion && (!toQuantity || !Number.isInteger(toQuantity) || toQuantity <= 0)) {
      return setError("Enter how many units they receive on conversion.");
    }
    if (price !== null && (Number.isNaN(price) || price < 0)) {
      return setError("Price per share must be a positive number.");
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/company/captable/movements", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.kind,
          date: form.date,
          classId: form.classId,
          toClassId: isConversion ? form.toClassId || null : null,
          fromHolderId: needsFrom ? form.fromHolderId || null : null,
          toHolderId: needsTo ? form.toHolderId || null : null,
          quantity,
          toQuantity: isConversion ? toQuantity : null,
          pricePerShare: price,
          note: form.note.trim() || null,
        }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not save this entry.");
      setOpen(false);
      setForm({ ...form, quantity: "", toQuantity: "", pricePerShare: "", note: "" });
      onChanged();
    } catch {
      setError("We could not save this entry. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    setError("");
    try {
      const res = await fetch(`/api/company/captable/movements/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not delete this entry.");
      onChanged();
    } finally {
      setDeleting(null);
    }
  }

  const canRecord = data.classes.length > 0 && data.holders.length > 0;

  return (
    <section className={CARD}>
      <CardHeader
        icon={<ArrowRightLeft size={20} />}
        title="Share movements"
        text="Every allotment, transfer, conversion and buyback. The cap table above is built from this log."
        open={open}
        onOpen={() => { setError(""); setOpen(true); }}
        onClose={() => setOpen(false)}
        addLabel="Record entry"
        disabled={!canRecord}
      />

      {!canRecord && (
        <p className="mt-3 text-xs font-semibold text-slate-400">
          Add at least one class and one shareholder first.
        </p>
      )}

      {open && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className={LABEL}>What happened *</span>
            <select className={`${INPUT} mt-1`} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as MovementKind })}>
              {(Object.keys(MOVEMENT_LABEL) as MovementKind[]).map((k) => (
                <option key={k} value={k}>{MOVEMENT_LABEL[k]}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>Date *</span>
            <input type="date" className={`${INPUT} mt-1`} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="block">
            <span className={LABEL}>{isConversion ? "Converting from class *" : "Class *"}</span>
            <select className={`${INPUT} mt-1`} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <option value="">Choose…</option>
              {data.classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          {needsFrom && (
            <label className="block">
              <span className={LABEL}>
                {form.kind === "BUYBACK" ? "Bought back from *" : isConversion ? "Holder *" : "From *"}
              </span>
              <select className={`${INPUT} mt-1`} value={form.fromHolderId} onChange={(e) => setForm({ ...form, fromHolderId: e.target.value })}>
                <option value="">Choose…</option>
                {data.holders.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </label>
          )}

          {needsTo && (
            <label className="block">
              <span className={LABEL}>{form.kind === "ALLOTMENT" ? "Allotted to *" : "To *"}</span>
              <select className={`${INPUT} mt-1`} value={form.toHolderId} onChange={(e) => setForm({ ...form, toHolderId: e.target.value })}>
                <option value="">Choose…</option>
                {data.holders
                  .filter((h) => h.id !== form.fromHolderId)
                  .map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className={LABEL}>{amountBased ? "Amount (₹) *" : "Number of shares *"}</span>
            <input className={`${INPUT} mt-1`} inputMode="numeric" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </label>

          {isConversion && (
            <>
              <label className="block">
                <span className={LABEL}>Converts into class *</span>
                <select className={`${INPUT} mt-1`} value={form.toClassId} onChange={(e) => setForm({ ...form, toClassId: e.target.value })}>
                  <option value="">Choose…</option>
                  {data.classes
                    .filter((c) => c.id !== form.classId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </label>
              <label className="block">
                <span className={LABEL}>Units received *</span>
                <input className={`${INPUT} mt-1`} inputMode="numeric" value={form.toQuantity} onChange={(e) => setForm({ ...form, toQuantity: e.target.value })} />
              </label>
            </>
          )}

          {!amountBased && form.kind !== "CONVERSION" && (
            <label className="block">
              <span className={LABEL}>Price per share (₹)</span>
              <input className={`${INPUT} mt-1`} inputMode="decimal" value={form.pricePerShare} onChange={(e) => setForm({ ...form, pricePerShare: e.target.value })} />
            </label>
          )}

          <label className="block sm:col-span-2 lg:col-span-3">
            <span className={LABEL}>Note</span>
            <input className={`${INPUT} mt-1`} value={form.note} placeholder="e.g. Seed round, board resolution 12 Mar" onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </label>

          <div className="sm:col-span-2 lg:col-span-3">
            {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
            <button type="button" className={BTN_DARK} disabled={saving} onClick={() => void save()}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save entry
            </button>
          </div>
        </div>
      )}

      {!open && error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 pr-4">Date</th>
              <th className="py-3 pr-4">Type</th>
              <th className="py-3 pr-4">Class</th>
              <th className="py-3 pr-4">From → To</th>
              <th className="py-3 pr-4 text-right">Quantity</th>
              <th className="py-3 pr-4 text-right">Price (₹)</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {data.movements.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-sm text-slate-400">No entries yet.</td>
              </tr>
            )}
            {data.movements.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 align-top">
                <td className="py-3 pr-4 whitespace-nowrap">{fmtDate(m.date)}</td>
                <td className="py-3 pr-4">{MOVEMENT_LABEL[m.kind]}</td>
                <td className="py-3 pr-4">
                  {m.className}
                  {m.toClassName ? ` → ${m.toClassName}` : ""}
                </td>
                <td className="py-3 pr-4">
                  {m.kind === "ALLOTMENT" && <>Company → {m.toHolderName}</>}
                  {m.kind === "TRANSFER" && <>{m.fromHolderName} → {m.toHolderName}</>}
                  {m.kind === "BUYBACK" && <>{m.fromHolderName} → Company</>}
                  {m.kind === "CONVERSION" && <>{m.fromHolderName}</>}
                  {m.note && <p className="text-xs text-slate-400">{m.note}</p>}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  {fmtNum(m.quantity)}
                  {m.toQuantity ? <p className="text-xs text-slate-400">→ {fmtNum(m.toQuantity)}</p> : null}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">{m.pricePerShare !== null ? fmtNum(m.pricePerShare) : "-"}</td>
                <td className="py-3 text-right">
                  <button type="button" title="Delete" className="text-slate-300 transition hover:text-red-600" disabled={deleting === m.id} onClick={() => void remove(m.id)}>
                    {deleting === m.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

function CardHeader({
  icon,
  title,
  text,
  open,
  onOpen,
  onClose,
  addLabel,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  addLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </span>
        <div>
          <h3 className="text-base font-black">{title}</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">{text}</p>
        </div>
      </div>
      {open ? (
        <button type="button" className={BTN_LIGHT} onClick={onClose}>
          <X size={14} /> Cancel
        </button>
      ) : (
        <button type="button" className={BTN_DARK} onClick={onOpen} disabled={disabled}>
          <Plus size={14} /> {addLabel}
        </button>
      )}
    </div>
  );
}

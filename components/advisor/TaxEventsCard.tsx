"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";

import type {
  LedgerResponse,
  TaxEmployeeRow,
  TaxEventResult,
  TaxEventRow,
  TaxEventType,
} from "@/components/advisor/tax-types";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  Chip,
  Field,
  INPUT,
  Panel,
  callApi,
  day,
  isoDay,
  money,
  num,
  useConfirm,
} from "@/components/advisor/tax-ui";

const TYPE_LABEL: Record<TaxEventType, string> = {
  EXERCISE: "Exercise",
  SALE: "Sale",
  LEAVE: "Leaves company",
  BUYBACK: "Buyback",
};

type FormState = {
  employeeId: string;
  type: TaxEventType;
  eventDate: string;
  shares: string;
  exercisePrice: string;
  valuationId: string;
  pricePerShare: string;
  lotEventId: string;
  note: string;
};

const EMPTY: FormState = {
  employeeId: "",
  type: "EXERCISE",
  eventDate: "",
  shares: "",
  exercisePrice: "",
  valuationId: "",
  pricePerShare: "",
  lotEventId: "",
  note: "",
};

function summarise(r: TaxEventResult | undefined) {
  if (!r) return { value: null as number | null, tax: null as number | null, chips: [] as { colour: "red" | "amber" | "blue" | "green" | "slate"; text: string }[] };

  const chips: { colour: "red" | "amber" | "blue" | "green" | "slate"; text: string }[] = [];

  if (r.type === "EXERCISE" && r.perquisite) {
    const t = r.tds[0];

    if (r.perquisite.deferred) chips.push({ colour: "blue", text: "TDS deferred" });
    else if (t?.shortfall) chips.push({ colour: "red", text: "Funding shortfall" });
    else if (t) chips.push({ colour: "amber", text: "TDS due at exercise" });
    else if (r.perquisite.perquisite === null) chips.push({ colour: "red", text: "Not computed" });
    else chips.push({ colour: "green", text: "No TDS" });

    return { value: r.perquisite.perquisite, tax: r.perquisite.incrementalTax, chips };
  }

  if (r.capitalGain) {
    const trig = r.tds.reduce((s, t) => s + t.amount, 0);
    if (trig > 0) chips.push({ colour: "amber", text: `Deferred TDS due ${money(trig)}` });
    return { value: r.capitalGain.gain, tax: r.capitalGain.estimatedTax, chips };
  }

  const trig = r.tds.reduce((s, t) => s + t.amount, 0);
  if (trig > 0) chips.push({ colour: "amber", text: `Deferred TDS due ${money(trig)}` });
  return { value: null, tax: trig > 0 ? trig : null, chips };
}

export default function TaxEventsCard({
  clientId,
  employees,
  events,
  results,
  valuations,
  onChanged,
}: {
  clientId: string;
  employees: TaxEmployeeRow[];
  events: TaxEventRow[];
  results: Map<string, TaxEventResult>;
  valuations: LedgerResponse["valuations"];
  onChanged: () => void;
}) {
  const { ask, dialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const base = `/api/advisor/clients/${clientId}/tax/events`;
  const names = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);
  const visible = events.filter((e) => names.has(e.employeeId));

  const lots = visible.filter((e) => e.type === "EXERCISE" && e.employeeId === form.employeeId && e.id !== editId);

  function startAdd() {
    setEditId(null);
    setForm({ ...EMPTY, employeeId: employees[0]?.id ?? "" });
    setError("");
    setOpen(true);
  }

  function startEdit(e: TaxEventRow) {
    setEditId(e.id);
    setForm({
      employeeId: e.employeeId,
      type: e.type,
      eventDate: isoDay(e.eventDate),
      shares: e.shares ? String(e.shares) : "",
      exercisePrice: e.exercisePrice === null ? "" : String(e.exercisePrice),
      valuationId: e.valuationId ?? "",
      pricePerShare: e.pricePerShare === null ? "" : String(e.pricePerShare),
      lotEventId: e.lotEventId ?? "",
      note: e.note ?? "",
    });
    setError("");
    setOpen(true);
  }

  async function save() {
    if (busy) return;

    if (!form.employeeId) return setError("Choose an employee.");
    if (!form.eventDate) return setError("Enter the event date.");

    const shares = Number(form.shares);
    const needsShares = form.type !== "LEAVE";

    if (needsShares && (!Number.isInteger(shares) || shares <= 0)) {
      return setError("Enter a whole number of shares.");
    }
    if (form.type === "EXERCISE" && (form.exercisePrice.trim() === "" || Number.isNaN(Number(form.exercisePrice)))) {
      return setError("Enter the exercise price (0 if none).");
    }
    if ((form.type === "SALE" || form.type === "BUYBACK") && (form.pricePerShare.trim() === "" || Number.isNaN(Number(form.pricePerShare)))) {
      return setError("Enter the price per share.");
    }

    setBusy(true);
    setError("");

    const result = await callApi(editId ? `${base}/${editId}` : base, editId ? "PATCH" : "POST", {
      employeeId: form.employeeId,
      type: form.type,
      eventDate: form.eventDate,
      shares: needsShares ? shares : 0,
      exercisePrice: form.type === "EXERCISE" ? Number(form.exercisePrice) : null,
      valuationId: form.type === "EXERCISE" && form.valuationId ? form.valuationId : null,
      pricePerShare: form.type === "SALE" || form.type === "BUYBACK" ? Number(form.pricePerShare) : null,
      lotEventId: (form.type === "SALE" || form.type === "BUYBACK") && form.lotEventId ? form.lotEventId : null,
      note: form.note.trim() || null,
    });

    setBusy(false);

    if (!result.ok) return setError(result.message);

    setOpen(false);
    onChanged();
  }

  async function remove(e: TaxEventRow) {
    const ok = await ask({
      title: "Delete this event?",
      message: "The ledger is recalculated without it. Earlier audit records are kept.",
      confirmLabel: "Delete event",
      tone: "danger",
    });
    if (!ok) return;

    const result = await callApi(`${base}/${e.id}`, "DELETE");
    if (!result.ok) return setError(result.message);
    onChanged();
  }

  const isDisposal = form.type === "SALE" || form.type === "BUYBACK";

  return (
    <>
    {dialog}
    <Panel
      title="Events"
      caption="Exercise, sale, leave and buyback"
      action={
        <button type="button" onClick={startAdd} disabled={employees.length === 0} className={BTN_PRIMARY}>
          <Plus size={13} />
          Add event
        </button>
      }
    >
      {open && (
        <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Employee">
              <select className={INPUT} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value, lotEventId: "" })}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Event">
              <select className={INPUT} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TaxEventType })}>
                {(Object.keys(TYPE_LABEL) as TaxEventType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
            </Field>
            <Field label={form.type === "LEAVE" ? "Last working day" : form.type === "EXERCISE" ? "Exercise / allotment date" : "Event date"}>
              <input type="date" className={INPUT} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
            </Field>

            {form.type !== "LEAVE" && (
              <Field label="Shares">
                <input className={INPUT} inputMode="numeric" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} />
              </Field>
            )}

            {form.type === "EXERCISE" && (
              <>
                <Field label="Exercise price per share (Rs.)">
                  <input className={INPUT} inputMode="decimal" value={form.exercisePrice} onChange={(e) => setForm({ ...form, exercisePrice: e.target.value })} />
                </Field>
                <Field label="Valuation report" hint="Automatic uses the latest report dated on or before the exercise.">
                  <select className={INPUT} value={form.valuationId} onChange={(e) => setForm({ ...form, valuationId: e.target.value })}>
                    <option value="">Automatic</option>
                    {valuations.map((v) => (
                      <option key={v.id} value={v.id}>
                        {day(v.valuationDate)} | {money(v.fmvPerShare)}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            {isDisposal && (
              <>
                <Field label={form.type === "SALE" ? "Sale price per share (Rs.)" : "Buyback price per share (Rs.)"}>
                  <input className={INPUT} inputMode="decimal" value={form.pricePerShare} onChange={(e) => setForm({ ...form, pricePerShare: e.target.value })} />
                </Field>
                <Field label="Shares come from" hint="Leave on oldest first unless you know which exercise.">
                  <select className={INPUT} value={form.lotEventId} onChange={(e) => setForm({ ...form, lotEventId: e.target.value })}>
                    <option value="">Oldest exercise first</option>
                    {lots.map((l) => (
                      <option key={l.id} value={l.id}>
                        {day(l.eventDate)} | {num(l.shares)} shares
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            <Field label="Note (optional)">
              <input className={INPUT} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
          </div>

          {error && <p className="mt-3 text-xs font-semibold text-red-700">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => void save()} disabled={busy} className={BTN_PRIMARY}>
              {busy ? "Saving" : editId ? "Save changes" : "Add event"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className={BTN_GHOST}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex min-h-[110px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-xs font-medium text-slate-500">
          {employees.length === 0
            ? "Add an employee, then record their first event."
            : "No events yet. Add an exercise to see the perquisite and TDS working."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-[0.08em] text-slate-400">
                <th className="w-6 py-2" />
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Employee</th>
                <th className="py-2 pr-3 font-semibold">Event</th>
                <th className="py-2 pr-3 text-right font-semibold">Shares</th>
                <th className="py-2 pr-3 text-right font-semibold">Perquisite / gain</th>
                <th className="py-2 pr-3 text-right font-semibold">Tax (estimate)</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 text-right font-semibold" />
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const r = results.get(e.id);
                const s = summarise(r);
                const isOpen = expanded === e.id;

                return (
                  <Fragment key={e.id}>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="py-2.5">
                        <button type="button" onClick={() => setExpanded(isOpen ? null : e.id)} className="rounded p-1 text-slate-400 hover:text-slate-900" aria-label="Show working">
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums text-slate-700">{day(e.eventDate)}</td>
                      <td className="py-2.5 pr-3 font-semibold text-slate-900">{names.get(e.employeeId)}</td>
                      <td className="py-2.5 pr-3 text-slate-700">{TYPE_LABEL[e.type]}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-slate-700">{e.type === "LEAVE" ? "-" : num(e.shares)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-slate-900">{money(s.value)}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums text-slate-900">{money(s.tax)}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {s.chips.map((c) => (
                            <Chip key={c.text} colour={c.colour}>{c.text}</Chip>
                          ))}
                          {r && r.flags.some((f) => f.severity === "RED") && <Chip colour="red">Needs attention</Chip>}
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <button type="button" onClick={() => startEdit(e)} className="mr-1 rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Edit event">
                          <Pencil size={13} />
                        </button>
                        <button type="button" onClick={() => void remove(e)} className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-700" aria-label="Delete event">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <td />
                        <td colSpan={8} className="px-1 py-4">
                          {!r ? (
                            <p className="text-xs text-slate-500">No calculation yet.</p>
                          ) : (
                            <div className="grid gap-5 lg:grid-cols-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">How this was calculated</p>
                                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-5 text-slate-700">
                                  {r.audit.steps.map((st, i) => (
                                    <li key={i}>{st}</li>
                                  ))}
                                </ol>
                              </div>

                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Flags</p>
                                {r.flags.length === 0 ? (
                                  <p className="mt-2 text-xs text-slate-500">None.</p>
                                ) : (
                                  <ul className="mt-2 space-y-1.5">
                                    {r.flags.map((f, i) => (
                                      <li key={i} className="flex gap-2 text-xs leading-5 text-slate-700">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: f.severity === "RED" ? "#b42318" : f.severity === "AMBER" ? "#d97706" : "#2563a8" }} />
                                        {f.message}
                                      </li>
                                    ))}
                                  </ul>
                                )}

                                {r.tds.filter((t) => t.shortfallOptions.length > 0).map((t) => (
                                  <div key={t.eventId} className="mt-3 rounded border border-red-200 bg-red-50 p-2.5 text-xs leading-5 text-red-800">
                                    <p className="font-semibold">Shortfall {money(t.shortfall)}. Options:</p>
                                    <ul className="mt-1 list-disc pl-4">
                                      {t.shortfallOptions.map((o) => (
                                        <li key={o}>{o}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>

                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Audit record</p>
                                <p className="mt-2 text-xs text-slate-600">Rule-set version {r.audit.ruleSetVersion}</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {r.audit.rules.map((rule) => (
                                    <Chip key={rule.code} colour={rule.verified ? "green" : "amber"}>
                                      {rule.code}{rule.verified ? "" : " (unverified)"}
                                    </Chip>
                                  ))}
                                </div>
                                <dl className="mt-3 space-y-0.5 text-[11px] text-slate-500">
                                  {Object.entries(r.audit.inputs).map(([k, v]) => (
                                    <div key={k} className="flex justify-between gap-3">
                                      <dt>{k}</dt>
                                      <dd className="text-right tabular-nums text-slate-700">{v === null ? "-" : String(v)}</dd>
                                    </div>
                                  ))}
                                </dl>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!open && error && <p className="mt-3 text-xs font-semibold text-red-700">{error}</p>}
    </Panel>
    </>
  );
}
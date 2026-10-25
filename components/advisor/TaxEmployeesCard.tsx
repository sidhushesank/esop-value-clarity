"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";

import type { TaxEmployeeRow } from "@/components/advisor/tax-types";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  Chip,
  Field,
  INPUT,
  Panel,
  callApi,
  money,
  useConfirm,
} from "@/components/advisor/tax-ui";

type FormState = {
  name: string;
  employeeRef: string;
  pan: string;
  regime: "NEW" | "OLD";
  income: string;
  netPay: string;
  isPromoter: boolean;
};

const EMPTY: FormState = {
  name: "",
  employeeRef: "",
  pan: "",
  regime: "NEW",
  income: "",
  netPay: "",
  isPromoter: false,
};

function maskPan(pan: string | null) {
  if (!pan) return "-";
  return `${pan.slice(0, 2)}•••••${pan.slice(7)}`;
}

export default function TaxEmployeesCard({
  clientId,
  employees,
  onChanged,
}: {
  clientId: string;
  employees: TaxEmployeeRow[];
  onChanged: () => void;
}) {
  const { ask, dialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const base = `/api/advisor/clients/${clientId}/tax/employees`;

  function startAdd() {
    setEditId(null);
    setForm(EMPTY);
    setError("");
    setOpen(true);
  }

  function startEdit(e: TaxEmployeeRow) {
    setEditId(e.id);
    setForm({
      name: e.name,
      employeeRef: e.employeeRef ?? "",
      pan: e.pan ?? "",
      regime: e.regime,
      income: String(e.estimatedIncomeExclPerq),
      netPay: e.monthlyNetPay === null ? "" : String(e.monthlyNetPay),
      isPromoter: e.isPromoter,
    });
    setError("");
    setOpen(true);
  }

  async function save() {
    if (busy) return;

    const income = Number(form.income);

    if (!form.name.trim()) return setError("Employee name is required.");
    if (form.income.trim() === "" || Number.isNaN(income) || income < 0) {
      return setError("Enter the estimated annual taxable income (0 or more).");
    }
    if (form.netPay.trim() !== "" && Number.isNaN(Number(form.netPay))) {
      return setError("Monthly net pay must be a number.");
    }

    setBusy(true);
    setError("");

    const result = await callApi(editId ? `${base}/${editId}` : base, editId ? "PATCH" : "POST", {
      name: form.name,
      employeeRef: form.employeeRef.trim() || null,
      pan: form.pan.trim() || null,
      regime: form.regime,
      estimatedIncomeExclPerq: income,
      monthlyNetPay: form.netPay.trim() === "" ? null : Number(form.netPay),
      isPromoter: form.isPromoter,
    });

    setBusy(false);

    if (!result.ok) return setError(result.message);

    setOpen(false);
    onChanged();
  }

  async function archive(e: TaxEmployeeRow) {
    const ok = await ask({
      title: `Archive ${e.name}?`,
      message: "Their events stay in the audit trail but leave the ledger. You can add them again later.",
      confirmLabel: "Archive",
      tone: "danger",
    });
    if (!ok) return;

    const result = await callApi(`${base}/${e.id}`, "DELETE");
    if (!result.ok) return setError(result.message);
    onChanged();
  }

  return (
    <>
    {dialog}
    <Panel
      title="Employees"
      caption={`${employees.length} on the ledger`}
      action={
        <button type="button" onClick={startAdd} className={BTN_PRIMARY}>
          <Plus size={13} />
          Add employee
        </button>
      }
    >
      {open && (
        <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name">
              <input className={INPUT} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="PAN" hint="Used only in the exports.">
              <input className={INPUT} maxLength={10} placeholder="ABCDE1234F" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Employee ref (optional)">
              <input className={INPUT} value={form.employeeRef} onChange={(e) => setForm({ ...form, employeeRef: e.target.value })} />
            </Field>
            <Field label="Tax regime">
              <select className={INPUT} value={form.regime} onChange={(e) => setForm({ ...form, regime: e.target.value as "NEW" | "OLD" })}>
                <option value="NEW">New regime</option>
                <option value="OLD">Old regime</option>
              </select>
            </Field>
            <Field label="Annual taxable income, excluding this perquisite (Rs.)" hint="After standard deduction and any deductions the employee has declared.">
              <input className={INPUT} inputMode="decimal" value={form.income} onChange={(e) => setForm({ ...form, income: e.target.value })} />
            </Field>
            <Field label="Monthly net pay (Rs., optional)" hint="Used to flag a TDS funding shortfall.">
              <input className={INPUT} inputMode="decimal" value={form.netPay} onChange={(e) => setForm({ ...form, netPay: e.target.value })} />
            </Field>
          </div>

          <label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600">
            <input type="checkbox" checked={form.isPromoter} onChange={(e) => setForm({ ...form, isPromoter: e.target.checked })} />
            Promoter (affects the buyback view)
          </label>

          {error && <p className="mt-3 text-xs font-semibold text-red-700">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => void save()} disabled={busy} className={BTN_PRIMARY}>
              {busy ? "Saving" : editId ? "Save changes" : "Add employee"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className={BTN_GHOST}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {employees.length === 0 ? (
        <div className="flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-xs font-medium text-slate-500">
          <UserRound size={18} className="text-slate-400" />
          Add an employee first. Events are recorded against employees.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-[0.08em] text-slate-400">
                <th className="py-2 pr-3 font-semibold">Employee</th>
                <th className="py-2 pr-3 font-semibold">PAN</th>
                <th className="py-2 pr-3 font-semibold">Regime</th>
                <th className="py-2 pr-3 text-right font-semibold">Income est.</th>
                <th className="py-2 pr-3 text-right font-semibold">Net pay / month</th>
                <th className="py-2 text-right font-semibold" />
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-slate-50">
                  <td className="py-2.5 pr-3 font-semibold text-slate-900">
                    {e.name}
                    {e.isPromoter && <span className="ml-2"><Chip colour="blue">Promoter</Chip></span>}
                    {e.employeeRef && <span className="ml-2 font-normal text-slate-400">{e.employeeRef}</span>}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums text-slate-600">{maskPan(e.pan)}</td>
                  <td className="py-2.5 pr-3 text-slate-600">{e.regime === "NEW" ? "New" : "Old"}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-900">{money(e.estimatedIncomeExclPerq)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-900">{money(e.monthlyNetPay)}</td>
                  <td className="py-2.5 text-right">
                    <button type="button" onClick={() => startEdit(e)} className="mr-1 rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit ${e.name}`}>
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={() => void archive(e)} className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-700" aria-label={`Archive ${e.name}`}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!open && error && <p className="mt-3 text-xs font-semibold text-red-700">{error}</p>}
    </Panel>
    </>
  );
}
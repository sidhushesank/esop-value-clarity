"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, Download, FileText, Loader2, Pencil, Wand2, X } from "lucide-react";

import { useJurisdiction } from "@/components/company/JurisdictionContext";
import { BTN_DARK, BTN_LIGHT, CARD, INPUT, LABEL, readJson } from "@/components/company/ui";
import { formatMoney, formatNumber } from "@/lib/jurisdiction";

type Policy = {
  standard: "IND_AS_102" | "ICAI_GUIDANCE_NOTE" | "ASC_718";
  attribution: "GRADED" | "STRAIGHT_LINE";
  valuationBasis: "FAIR_VALUE" | "INTRINSIC";
  volatility: number | null;
  riskFreeRate: number | null;
  dividendYield: number;
  forfeitureRate: number;
  contractualYears: number;
  fyEndMonth: number;
};

type Value = {
  fmvPerShare: number | null;
  volatility: number | null;
  riskFreeRate: number | null;
  dividendYield: number;
  expectedTermYears: number;
  termIsDefault: boolean;
  valuePerOption: number | null;
  source: "OVERRIDE" | "BLACK_SCHOLES" | "INTRINSIC" | "MISSING";
  missing: string[];
};

type Row = {
  id: string;
  employeeName: string;
  schemeName: string;
  status: string;
  grantDate: string;
  options: number;
  exercisePrice: number;
  value: Value;
  totalFairValue: number | null;
  expenseOpening: number | null;
  expenseThisYear: number | null;
  expenseClosing: number | null;
  unrecognised: number | null;
  quarters: (number | null)[];
  forfeitedOn: string | null;
};

type Line = { options: number; waep: number | null };

type Report = {
  period: { label: string; start: string; end: string };
  quarters: { label: string; start: string; end: string }[];
  policy: Policy;
  rows: Row[];
  totals: { expenseThisYear: number; expenseOpening: number; expenseClosing: number; unrecognised: number; quarters: number[]; incomplete: boolean };
  future: { label: string; expense: number }[];
  movement: { opening: Line; granted: Line; forfeited: Line; exercised: Line; closing: Line; exercisable: Line };
  weightedRemainingLifeYears: number | null;
  weightedValueGrantedThisYear: number | null;
  journal: { debit: string; credit: string; amount: number };
  warnings: { level: "BLOCK" | "WARN" | "INFO"; message: string }[];
};

type Data = {
  confirmed: boolean;
  settings: Policy;
  years: number[];
  fy: number;
  report: Report;
  companyFmv: { value: number; date: string | null } | null;
  canEdit: boolean;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STD_LABEL: Record<Policy["standard"], string> = {
  IND_AS_102: "Ind AS 102",
  ICAI_GUIDANCE_NOTE: "ICAI Guidance Note (Indian GAAP)",
  ASC_718: "ASC 718 (US GAAP)",
};

const toPct = (v: number | null) => (v === null || v === undefined ? "" : String(Math.round(v * 10000) / 100));
const fromPct = (s: string) => (s.trim() === "" ? null : Number(s) / 100);
const fromNum = (s: string) => (s.trim() === "" ? null : Number(s.replace(/,/g, "")));

export default function ExpensePanel() {
  const j = useJurisdiction();
  const us = j === "US";
  const [data, setData] = useState<Data | null>(null);
  const [fy, setFy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [busy, setBusy] = useState("");

  const load = useCallback(async (year?: number | null) => {
    try {
      const res = await fetch(`/api/company/expense${year ? `?fy=${year}` : ""}`, { credentials: "include", cache: "no-store" });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not load the expense report.");
      setError("");
      setData(json as Data);
      setFy(json.fy);
      if (!json.confirmed) setPolicyOpen(true);
    } catch {
      setError("We could not connect. Please retry.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const m = (n: number | null | undefined) => formatMoney(n ?? null, j, { decimals: 0 });
  const m2 = (n: number | null | undefined) => formatMoney(n ?? null, j, { decimals: 2 });

  async function fillFmv() {
    setBusy("fill");
    try {
      const res = await fetch("/api/company/expense/valuations/fill", { method: "POST", credentials: "include" });
      const json = await readJson(res);
      if (!res.ok || !json?.success) setError(json?.message ?? "That did not work.");
      await load(fy);
    } finally {
      setBusy("");
    }
  }

  if (!data) {
    return (
      <div className={`${CARD} flex items-center gap-3`}>
        {error ? <span className="text-sm font-semibold text-red-600">{error}</span> : <Loader2 className="animate-spin text-blue-600" size={18} />}
        {!error && <span className="text-sm font-bold">Working out the expense</span>}
      </div>
    );
  }

  const r = data.report;
  const t = r.totals;
  const blanks = r.rows.filter((x) => x.value.fmvPerShare === null && x.value.source !== "OVERRIDE").length;
  const qs = fy ? `?fy=${fy}` : "";

  return (
    <div className="space-y-5">
      <section className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Calculator size={18} /> {us ? "Stock-based compensation" : "ESOP expense"} · {STD_LABEL[r.policy.standard]}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              The cost of options for the company&apos;s accounts: each grant valued at its grant date, spread over the vesting period, with leavers
              reversed. Hand the Excel or PDF to your accountant and auditor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${INPUT} w-40`} value={fy ?? ""} onChange={(e) => void load(Number(e.target.value))}>
              {data.years.map((y) => (
                <option key={y} value={y}>
                  {r.policy.fyEndMonth === 12 ? `FY ${y}` : `FY ${y - 1}-${String(y).slice(2)}`}
                </option>
              ))}
            </select>
            <a href={`/api/company/expense/export${qs}`} className={BTN_LIGHT}>
              <Download size={14} /> Excel
            </a>
            <a href={`/api/company/expense/pdf${qs}`} className={BTN_LIGHT}>
              <FileText size={14} /> PDF
            </a>
          </div>
        </div>
        {!data.confirmed && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Set the accounting policy and assumptions below first. The figures stay incomplete until volatility and the risk-free rate are filled in.
          </p>
        )}
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      </section>

      <PolicyCard
        open={policyOpen}
        onToggle={() => setPolicyOpen((v) => !v)}
        policy={data.settings}
        canEdit={data.canEdit}
        onSaved={() => {
          setPolicyOpen(false);
          void load(fy);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [`Expense ${r.period.label}`, m(t.expenseThisYear)],
          [`Cumulative to ${r.period.end}`, m(t.expenseClosing)],
          ["Still to recognise", m(t.unrecognised)],
          [`Options outstanding ${r.period.end}`, formatNumber(r.movement.closing.options, j)],
        ].map(([k, v]) => (
          <div key={k} className={CARD}>
            <p className={LABEL}>{k}</p>
            <p className="mt-2 text-2xl font-black">{v}</p>
          </div>
        ))}
      </div>

      {r.warnings.length > 0 && (
        <section className={`${CARD} ${r.warnings.some((w) => w.level === "BLOCK") ? "border-red-200" : ""}`}>
          <p className="flex items-center gap-2 text-sm font-black">
            <AlertTriangle size={15} /> Points to check
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {r.warnings.map((w, i) => (
              <li key={i} className={w.level === "BLOCK" ? "font-semibold text-red-700" : "text-slate-600"}>
                <b>{w.level}</b> {w.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-black">Grants and their value</h3>
          {blanks > 0 && data.companyFmv && data.canEdit && (
            <button type="button" className={BTN_LIGHT} disabled={!!busy} onClick={() => void fillFmv()}>
              {busy === "fill" ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              Fill {blanks} blank grant-date value{blanks > 1 ? "s" : ""} with {m2(data.companyFmv.value)}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Value per share is the share&apos;s value on each grant date (from a valuation report). Blank volatility, risk-free rate and dividend use the
          company defaults; blank expected term uses the simplified estimate. A valuer&apos;s value per option replaces the Black-Scholes figure.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                {["Employee", "Grant date", "Options", us ? "Strike" : "Exercise price", "Value/share", "Value/option", `Expense ${r.period.label}`, "Cumulative", "Still to come", ""].map((h) => (
                  <th key={h} className="px-2 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {r.rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-2 py-6 text-slate-400">
                    No issued grants by {r.period.end}.
                  </td>
                </tr>
              )}
              {r.rows.map((row) => (
                <GrantRow
                  key={row.id}
                  row={row}
                  editing={editing === row.id}
                  canEdit={data.canEdit}
                  onEdit={() => setEditing(editing === row.id ? null : row.id)}
                  onSaved={() => {
                    setEditing(null);
                    void load(fy);
                  }}
                  m={m}
                  m2={m2}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={CARD}>
          <h3 className="text-base font-black">By quarter</h3>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {r.quarters.map((q, i) => (
              <li key={q.label} className="flex justify-between py-2">
                <span>{q.label}</span>
                <b>{m(t.quarters[i])}</b>
              </li>
            ))}
          </ul>
          <h3 className="mt-5 text-base font-black">Still to come</h3>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {r.future.length === 0 && <li className="py-2 text-slate-400">Nothing after {r.period.label}.</li>}
            {r.future.map((f) => (
              <li key={f.label} className="flex justify-between py-2">
                <span>{f.label}</span>
                <b>{m(f.expense)}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className={CARD}>
          <h3 className="text-base font-black">Option movement {r.period.label}</h3>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                <th className="py-1" />
                <th className="py-1 text-right">Options</th>
                <th className="py-1 text-right">Avg. {us ? "strike" : "exercise price"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(
                [
                  [`Outstanding ${r.period.start}`, r.movement.opening],
                  ["Granted", r.movement.granted],
                  ["Forfeited / lapsed", r.movement.forfeited],
                  ["Exercised", r.movement.exercised],
                  [`Outstanding ${r.period.end}`, r.movement.closing],
                  [`Exercisable ${r.period.end}`, r.movement.exercisable],
                ] as [string, Line][]
              ).map(([k, v]) => (
                <tr key={k}>
                  <td className="py-2">{k}</td>
                  <td className="py-2 text-right font-bold">{formatNumber(v.options, j)}</td>
                  <td className="py-2 text-right">{v.waep === null ? "-" : m2(v.waep)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">
            {r.weightedRemainingLifeYears !== null ? `Weighted remaining contractual life: ${r.weightedRemainingLifeYears} years. ` : ""}
            {r.weightedValueGrantedThisYear !== null ? `Weighted value per option granted this year: ${m2(r.weightedValueGrantedThisYear)}.` : ""}
          </p>

          <h3 className="mt-5 text-base font-black">Journal entry</h3>
          <div className="mt-2 rounded-xl bg-slate-50 p-3 font-mono text-xs leading-6">
            <div className="flex justify-between gap-3">
              <span>Dr {r.journal.amount >= 0 ? r.journal.debit : r.journal.credit}</span>
              <span>{m2(Math.abs(r.journal.amount))}</span>
            </div>
            <div className="flex justify-between gap-3 pl-6">
              <span>Cr {r.journal.amount >= 0 ? r.journal.credit : r.journal.debit}</span>
              <span>{m2(Math.abs(r.journal.amount))}</span>
            </div>
          </div>
        </section>
      </div>

      <p className="text-xs leading-5 text-slate-400">
        A working for your accountant and auditor, not an audit opinion. The value per share, volatility, risk-free rate and expected term are the
        company&apos;s assumptions and should be backed by a valuation report.
      </p>
    </div>
  );
}

function PolicyCard({ open, onToggle, policy, canEdit, onSaved }: { open: boolean; onToggle: () => void; policy: Policy; canEdit: boolean; onSaved: () => void }) {
  const j = useJurisdiction();
  const us = j === "US";
  const [f, setF] = useState({
    standard: policy.standard,
    attribution: policy.attribution,
    valuationBasis: policy.valuationBasis,
    volatility: toPct(policy.volatility),
    riskFreeRate: toPct(policy.riskFreeRate),
    dividendYield: toPct(policy.dividendYield),
    forfeitureRate: toPct(policy.forfeitureRate),
    contractualYears: String(policy.contractualYears),
    fyEndMonth: policy.fyEndMonth,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/company/expense/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standard: f.standard,
          attribution: f.attribution,
          valuationBasis: f.valuationBasis,
          volatility: fromPct(f.volatility),
          riskFreeRate: fromPct(f.riskFreeRate),
          dividendYield: fromPct(f.dividendYield) ?? 0,
          forfeitureRate: fromPct(f.forfeitureRate) ?? 0,
          contractualYears: Number(f.contractualYears) || 10,
          fyEndMonth: f.fyEndMonth,
        }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "Could not save.");
      onSaved();
    } catch {
      setError("Could not save.");
    } finally {
      setBusy(false);
    }
  }

  const pctField = (key: "volatility" | "riskFreeRate" | "dividendYield" | "forfeitureRate", label: string, hint: string) => (
    <label className="block">
      <span className={LABEL}>{label} (%)</span>
      <input disabled={!canEdit} inputMode="decimal" className={`${INPUT} mt-1`} value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
      <span className="mt-1 block text-[11px] leading-4 text-slate-400">{hint}</span>
    </label>
  );

  return (
    <section className={CARD}>
      <button type="button" className="flex w-full items-center justify-between text-left" onClick={onToggle}>
        <span className="text-base font-black">Accounting policy and assumptions</span>
        <span className="text-xs font-black text-blue-700">{open ? "Hide" : "Show / change"}</span>
      </button>
      {open && (
        <div className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className={LABEL}>Accounting standard</span>
              <select disabled={!canEdit} className={`${INPUT} mt-1`} value={f.standard} onChange={(e) => setF({ ...f, standard: e.target.value as Policy["standard"] })}>
                {(us ? ["ASC_718"] : ["ICAI_GUIDANCE_NOTE", "IND_AS_102"]).map((s) => (
                  <option key={s} value={s}>
                    {STD_LABEL[s as Policy["standard"]]}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] leading-4 text-slate-400">
                {us ? "US GAAP." : "Ind AS applies to listed and larger companies; most startups follow Indian GAAP and the ICAI Guidance Note. Ask your auditor."}
              </span>
            </label>
            {f.standard === "ASC_718" && (
              <label className="block">
                <span className={LABEL}>Attribution</span>
                <select disabled={!canEdit} className={`${INPUT} mt-1`} value={f.attribution} onChange={(e) => setF({ ...f, attribution: e.target.value as Policy["attribution"] })}>
                  <option value="GRADED">Graded (each vesting date separately)</option>
                  <option value="STRAIGHT_LINE">Straight-line over the whole award</option>
                </select>
              </label>
            )}
            {f.standard === "ICAI_GUIDANCE_NOTE" && (
              <label className="block">
                <span className={LABEL}>Measurement</span>
                <select disabled={!canEdit} className={`${INPUT} mt-1`} value={f.valuationBasis} onChange={(e) => setF({ ...f, valuationBasis: e.target.value as Policy["valuationBasis"] })}>
                  <option value="FAIR_VALUE">Fair value (Black-Scholes)</option>
                  <option value="INTRINSIC">Intrinsic value (value per share − exercise price)</option>
                </select>
              </label>
            )}
            <label className="block">
              <span className={LABEL}>Financial year ends in</span>
              <select disabled={!canEdit} className={`${INPUT} mt-1`} value={f.fyEndMonth} onChange={(e) => setF({ ...f, fyEndMonth: Number(e.target.value) })}>
                {MONTHS.map((mo, i) => (
                  <option key={mo} value={i + 1}>
                    {mo}
                  </option>
                ))}
              </select>
            </label>
            {pctField("volatility", "Expected volatility", "Unlisted companies use listed peers' share-price volatility, e.g. 40–70%. From your valuer.")}
            {pctField("riskFreeRate", "Risk-free rate", us ? "US Treasury yield for the expected term." : "Government security (G-sec) yield for the expected term.")}
            {pctField("dividendYield", "Dividend yield", "Usually 0 for startups.")}
            {pctField("forfeitureRate", "Expected yearly leaving rate", us ? "0 = record forfeitures when people leave (policy choice)." : "Ind AS / Guidance Note expect an estimate of leavers; 0 = none expected.")}
            <label className="block">
              <span className={LABEL}>Contractual term if a grant has no expiry (years)</span>
              <input disabled={!canEdit} inputMode="decimal" className={`${INPUT} mt-1`} value={f.contractualYears} onChange={(e) => setF({ ...f, contractualYears: e.target.value })} />
            </label>
          </div>
          {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
          {canEdit && (
            <button type="button" className={`${BTN_DARK} mt-4`} disabled={busy} onClick={() => void save()}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save policy
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function GrantRow({
  row,
  editing,
  canEdit,
  onEdit,
  onSaved,
  m,
  m2,
}: {
  row: Row;
  editing: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onSaved: () => void;
  m: (n: number | null | undefined) => string;
  m2: (n: number | null | undefined) => string;
}) {
  const j = useJurisdiction();
  const v = row.value;
  return (
    <>
      <tr className={v.valuePerOption === null ? "bg-red-50/40" : ""}>
        <td className="px-2 py-2">
          <p className="font-bold">{row.employeeName}</p>
          <p className="text-xs text-slate-400">
            {row.schemeName} · {row.status.toLowerCase()}
            {row.forfeitedOn ? ` · unvested forfeited ${row.forfeitedOn}` : ""}
          </p>
        </td>
        <td className="px-2 py-2">{row.grantDate}</td>
        <td className="px-2 py-2">{formatNumber(row.options, j)}</td>
        <td className="px-2 py-2">{m2(row.exercisePrice)}</td>
        <td className="px-2 py-2">{v.fmvPerShare === null ? <span className="font-bold text-red-600">missing</span> : m2(v.fmvPerShare)}</td>
        <td className="px-2 py-2">
          {v.valuePerOption === null ? <span className="font-bold text-red-600">missing</span> : m2(v.valuePerOption)}
          <span className="block text-[10px] text-slate-400">
            {{ OVERRIDE: "valuer", BLACK_SCHOLES: `BS · ${v.expectedTermYears.toFixed(2)}y`, INTRINSIC: "intrinsic", MISSING: v.missing.join(", ") }[v.source]}
          </span>
        </td>
        <td className="px-2 py-2 font-bold">{m(row.expenseThisYear)}</td>
        <td className="px-2 py-2">{m(row.expenseClosing)}</td>
        <td className="px-2 py-2">{m(row.unrecognised)}</td>
        <td className="px-2 py-2">
          {canEdit && (
            <button type="button" className="text-slate-400 hover:text-slate-900" title="Valuation inputs" onClick={onEdit}>
              {editing ? <X size={15} /> : <Pencil size={15} />}
            </button>
          )}
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={10} className="bg-slate-50 px-3 py-4">
            <ValuationEditor row={row} onSaved={onSaved} />
          </td>
        </tr>
      )}
    </>
  );
}

function ValuationEditor({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const v = row.value;
  const [f, setF] = useState({
    fmvPerShare: v.fmvPerShare?.toString() ?? "",
    volatility: "",
    riskFreeRate: "",
    dividendYield: "",
    expectedTermYears: v.termIsDefault ? "" : v.expectedTermYears.toFixed(2),
    fairValueOverride: v.source === "OVERRIDE" ? String(v.valuePerOption) : "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/company/expense/valuations/${row.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fmvPerShare: fromNum(f.fmvPerShare),
          volatility: fromPct(f.volatility),
          riskFreeRate: fromPct(f.riskFreeRate),
          dividendYield: fromPct(f.dividendYield),
          expectedTermYears: fromNum(f.expectedTermYears),
          fairValueOverride: fromNum(f.fairValueOverride),
        }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "Could not save.");
      onSaved();
    } catch {
      setError("Could not save.");
    } finally {
      setBusy(false);
    }
  }

  const field = (key: keyof typeof f, label: string, placeholder: string) => (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input inputMode="decimal" className={`${INPUT} mt-1`} placeholder={placeholder} value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
    </label>
  );

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {field("fmvPerShare", "Value per share on grant date", "required")}
        {field("volatility", "Volatility %", v.volatility !== null ? `now ${toPct(v.volatility)}; blank = default` : "blank = default")}
        {field("riskFreeRate", "Risk-free %", v.riskFreeRate !== null ? `now ${toPct(v.riskFreeRate)}; blank = default` : "blank = default")}
        {field("dividendYield", "Dividend %", `now ${toPct(v.dividendYield)}; blank = default`)}
        {field("expectedTermYears", "Expected term (years)", `auto ${v.expectedTermYears.toFixed(2)}`)}
        {field("fairValueOverride", "Valuer's value per option", "optional")}
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
      <button type="button" className={`${BTN_DARK} mt-3`} disabled={busy} onClick={() => void save()}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save
      </button>
    </div>
  );
}

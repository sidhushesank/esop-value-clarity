"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Coins,
  Download,
  FileText,
  Info,
  Loader2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import type { EmployeeViewData } from "@/lib/company/employee-view-data";
import { runScenarios, type ScenarioResult } from "@/lib/company/employee-maths";
import {
  currencySymbol,
  formatMoney,
  formatNumber,
  formatPrice,
  wordingFor,
  type Jurisdiction,
} from "@/lib/jurisdiction";

function fmtDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

const INPUT =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

type Regime = "NEW" | "OLD";

type Row = { label: string; cell: (s: ScenarioResult) => string };

/**
 * India: the full after-tax illustration (Indian slab tax at exercise,
 * long-term gains at sale).
 * US: value and exercise cost only, before tax. US tax depends on ISO vs
 * NSO, AMT and the employee's state; it is not estimated on this page.
 */
function scenarioRows(j: Jurisdiction): Row[] {
  const money = (n: number) => formatMoney(Math.round(n), j);
  const minus = (n: number) => (n > 0 ? `−${money(n)}` : money(0));
  const rows: Row[] = [
    { label: "Value per share after dilution", cell: (s) => formatPrice(s.pricePerShare, j) },
    { label: "Value of your options", cell: (s) => money(s.grossValue) },
    { label: "Less: cost to exercise", cell: (s) => (s.underwater ? "-" : minus(s.exerciseCost)) },
  ];
  if (j === "IN") {
    rows.push(
      { label: "Less: tax when you exercise", cell: (s) => (s.underwater ? "-" : minus(s.exerciseTax)) },
      { label: "Less: tax when you sell", cell: (s) => (s.underwater ? "-" : minus(s.saleTax)) }
    );
  }
  return rows;
}

/** India: take-home after the estimated tax. US: gain before tax. */
function outcome(s: ScenarioResult, j: Jurisdiction): number {
  return j === "US" ? Math.max(0, s.grossValue - s.exerciseCost) : s.takeHome;
}

export default function EmployeeGrantView({ token, data }: { token: string; data: EmployeeViewData }) {
  const j: Jurisdiction = data.jurisdiction ?? "IN";
  const us = j === "US";
  const words = wordingFor(j);
  const fmtNum = (n: number) => formatNumber(Math.round(n), j, 0);
  const fmtRs = (n: number) => formatMoney(Math.round(n), j);
  const fmtPer = (n: number) => formatPrice(n, j);
  const SCENARIO_ROWS = scenarioRows(j);
  const left = !!data.leftOn;
  const [accepted, setAccepted] = useState<string | null>(data.acceptedAt);
  const status = accepted ? "ACCEPTED" : data.status;

  /* ---------------- Inputs for the illustration (kept in this browser only) ---------------- */
  const [income, setIncome] = useState(us ? "0" : "1200000");
  const [regime, setRegime] = useState<Regime>("NEW");
  const [basis, setBasis] = useState<"ALL" | "VESTED">(left ? "VESTED" : "ALL");
  const [dilution, setDilution] = useState("20");
  const [multiples, setMultiples] = useState({ low: "1", mid: "3", high: "10" });

  const optionsCounted =
    basis === "VESTED" ? data.position.vestedUnexercised : Math.max(0, data.options - data.position.lapsed - data.position.exercised);

  const result = useMemo(() => {
    if (!data.fmv) return null;
    return runScenarios({
      options: optionsCounted,
      exercisePrice: data.exercisePrice,
      fmvPerShare: data.fmv.perShare,
      annualIncome: Number(income.replace(/,/g, "")) || 0,
      regime,
      dilutionPct: Number(dilution) || 0,
      scenarios: [
        { label: "Low", multiple: Number(multiples.low) || 0 },
        { label: "Middle", multiple: Number(multiples.mid) || 0 },
        { label: "High", multiple: Number(multiples.high) || 0 },
      ],
    });
  }, [data.fmv, data.exercisePrice, optionsCounted, income, regime, dilution, multiples]);

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
      <div className="mx-auto max-w-[980px] px-5 py-8 md:px-8">
        {/* Header */}
        <section className="overflow-hidden rounded-[28px] bg-[#07111f] px-6 py-8 text-white md:px-9">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
            {data.companyName} · {data.schemeName}
          </p>
          <h1 className="mt-3 text-2xl font-black leading-tight md:text-3xl">
            {data.employeeName}, {words.employeeGrantHeading}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            What you were granted, when it becomes yours, what it costs to
            exercise, and what it could be worth. The value figures are
            illustrations you can change, not a promise.
            {us && data.usOptionType ? ` These are ${data.usOptionType === "ISO" ? "incentive stock options (ISOs)" : "non-qualified stock options (NSOs)"}.` : ""}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-black">
            <span className="rounded-full bg-white/10 px-3 py-1.5">Granted {fmtDate(data.grantDate)}</span>
            <span className={`rounded-full px-3 py-1.5 ${status === "ACCEPTED" ? "bg-emerald-400/20 text-emerald-200" : left ? "bg-amber-400/20 text-amber-200" : "bg-blue-400/20 text-blue-200"}`}>
              {status === "ACCEPTED" ? "Accepted" : left ? "You have left the company" : status === "EXERCISED" ? "Exercised" : "Waiting for your acceptance"}
            </span>
          </div>
        </section>

        {/* Key numbers */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Options granted", fmtNum(data.options)],
            ["Yours today (vested)", fmtNum(data.position.vested)],
            ["Exercise price", `${fmtPer(data.exercisePrice)} per option`],
            left
              ? ["Lapsed on leaving", fmtNum(data.position.lapsed)]
              : ["Next vesting", data.nextVest ? `${fmtNum(data.nextVest.options)} on ${fmtDate(data.nextVest.date)}` : "Fully vested"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k}</p>
              <p className="mt-2 text-lg font-black">{v}</p>
            </div>
          ))}
        </div>

        {left && data.position.exerciseWindowEnds && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            <p className="font-black">You left on {fmtDate(data.leftOn)}.</p>
            <p>
              {fmtNum(data.position.vestedUnexercised)} vested options can be exercised until{" "}
              <b>{fmtDate(data.position.exerciseWindowEnds)}</b>. After that they lapse. Exercising
              costs {fmtRs(data.position.vestedUnexercised * data.exercisePrice)} plus tax{us ? "" : " (see below)"}.
            </p>
          </div>
        )}

        {/* Vesting */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700"><CalendarClock size={20} /></span>
            <div>
              <h2 className="text-base font-black">When your options become yours</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {data.vestingMonths} months from {fmtDate(data.vestingStart)}. Nothing vests in the first{" "}
                {data.cliffMonths} months; after that, a part vests every month. Fully vested on {fmtDate(data.fullyVestedOn)}.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Vested today</span>
              <span>{data.vestedPctToday.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, data.vestedPctToday)}%` }} />
            </div>
          </div>

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2 text-left">Date</th>
                <th className="py-2 text-right">Vested by then</th>
                <th className="py-2 text-right">Share of grant</th>
              </tr>
            </thead>
            <tbody>
              {data.milestones.map((m) => (
                <tr key={m.date} className="border-b border-slate-100">
                  <td className="py-2.5">{fmtDate(m.date)}</td>
                  <td className="py-2.5 text-right tabular-nums">{fmtNum(m.vestedTotal)}</td>
                  <td className="py-2.5 text-right tabular-nums">{m.vestedPct.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.expiryDate && (
            <p className="mt-3 text-xs text-slate-500">Options expire on {fmtDate(data.expiryDate)} if not exercised.</p>
          )}
          {!left && (
            <p className="mt-3 text-xs text-slate-500">
              If you leave, unvested options lapse and vested options can be exercised for {data.postExitDays} days.
            </p>
          )}
        </section>

        {/* Value and tax */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700"><TrendingUp size={20} /></span>
            <div>
              <h2 className="text-base font-black">{us ? "What it could be worth to you" : "What it could be worth to you, after tax"}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Change the numbers to match your situation. Nothing you type here is saved or sent to your company.
              </p>
            </div>
          </div>

          {!data.fmv ? (
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              <p className="font-bold">Your company has not recorded a current value per share yet.</p>
              <p>
                Until it does, the most useful number is the cost to exercise: {fmtRs(data.position.vestedUnexercised * data.exercisePrice)} for
                the options vested today, {fmtRs(data.options * data.exercisePrice)} for the whole grant.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {!us && (
                  <>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500">Your annual taxable salary ({currencySymbol(j)})</span>
                      <input className={`${INPUT} mt-1`} inputMode="numeric" value={income} onChange={(e) => setIncome(e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-500">Tax regime</span>
                      <select className={`${INPUT} mt-1`} value={regime} onChange={(e) => setRegime(e.target.value as Regime)}>
                        <option value="NEW">New regime</option>
                        <option value="OLD">Old regime</option>
                      </select>
                    </label>
                  </>
                )}
                <label className="block">
                  <span className="text-xs font-bold text-slate-500">Options to count</span>
                  <select className={`${INPUT} mt-1`} value={basis} onChange={(e) => setBasis(e.target.value as "ALL" | "VESTED")}>
                    {!left && <option value="ALL">Whole grant (if I stay)</option>}
                    <option value="VESTED">Only vested today</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-500">Future dilution (%)</span>
                  <input className={`${INPUT} mt-1`} inputMode="decimal" value={dilution} onChange={(e) => setDilution(e.target.value)} />
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(["low", "mid", "high"] as const).map((k) => (
                  <label key={k} className="block">
                    <span className="text-xs font-bold text-slate-500">
                      {k === "low" ? "Low" : k === "mid" ? "Middle" : "High"}: company value grows ×
                    </span>
                    <input className={`${INPUT} mt-1`} inputMode="decimal" value={multiples[k]} onChange={(e) => setMultiples({ ...multiples, [k]: e.target.value })} />
                  </label>
                ))}
              </div>

              {result && (
                <>
                  <div className="mt-5 rounded-xl bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-950">
                    {us ? (
                      <p>
                        <b>Today</b> ({fmtNum(optionsCounted)} options at a 409A value of {fmtPer(data.fmv.perShare)} per share
                        {data.fmv.valuationDate ? `, valued ${fmtDate(data.fmv.valuationDate)}` : ""}):{" "}
                        worth {fmtRs(result.today.value)} on paper. Exercising costs {fmtRs(result.today.exerciseCost)}.
                        {" "}The spread of {fmtRs(result.today.exerciseTax.perquisite)} is{" "}
                        {data.usOptionType === "ISO"
                          ? "not regular income for an ISO, but it can count towards the alternative minimum tax (AMT)."
                          : data.usOptionType === "NSO"
                            ? "taxed as ordinary income when you exercise an NSO, even though you cannot sell yet."
                            : "taxed differently for ISOs and NSOs; ask your company which you have."}
                      </p>
                    ) : (
                      <p>
                        <b>Today</b> ({fmtNum(optionsCounted)} options at {fmtPer(data.fmv.perShare)} per share
                        {data.fmv.valuationDate ? `, valued ${fmtDate(data.fmv.valuationDate)}` : ""}):{" "}
                        worth {fmtRs(result.today.value)} on paper. Exercising costs {fmtRs(result.today.exerciseCost)}
                        {" "}and adds {fmtRs(result.today.exerciseTax.perquisite)} to your taxable income, so about{" "}
                        <b>{fmtRs(result.today.exerciseTax.tax)}</b> in tax when you exercise, even though you cannot sell yet.
                      </p>
                    )}
                  </div>

                  {/* Phones: one card per scenario */}
                  <div className="mt-5 space-y-3 sm:hidden">
                    {result.scenarios.map((s) => (
                      <div key={s.label} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-baseline justify-between">
                          <p className="text-sm font-black">{s.label}</p>
                          <p className="text-xs font-bold text-slate-400">value grows ×{s.multiple}</p>
                        </div>
                        <dl className="mt-3 space-y-1.5 text-sm">
                          {SCENARIO_ROWS.map((row) => (
                            <div key={row.label} className="flex justify-between gap-3">
                              <dt className="text-slate-500">{row.label}</dt>
                              <dd className="whitespace-nowrap tabular-nums">{row.cell(s)}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3">
                          <p className="font-black">{us ? "Your gain before tax" : "You take home"}</p>
                          <p className="font-black tabular-nums">
                            {s.underwater ? <span className="text-xs font-bold text-slate-400">Not worth exercising</span> : fmtRs(outcome(s, j))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Wider screens: table */}
                  <div className="mt-5 hidden overflow-x-auto sm:block">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-2 text-left">At a future sale</th>
                          {result.scenarios.map((s) => (
                            <th key={s.label} className="py-2 text-right">{s.label} (×{s.multiple})</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SCENARIO_ROWS.map((row) => (
                          <tr key={row.label} className="border-b border-slate-100">
                            <td className="py-2.5 text-slate-600">{row.label}</td>
                            {result.scenarios.map((s) => (
                              <td key={s.label} className="py-2.5 text-right tabular-nums">
                                {row.cell(s)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr>
                          <td className="py-3 font-black">{us ? "Your gain before tax (estimate)" : "You take home (estimate)"}</td>
                          {result.scenarios.map((s) => (
                            <td key={s.label} className="py-3 text-right font-black tabular-nums">
                              {s.underwater ? <span className="text-xs font-bold text-slate-400">Not worth exercising</span> : fmtRs(outcome(s, j))}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {us ? (
                  <ul className="mt-4 space-y-1.5 text-xs leading-5 text-slate-500">
                    <li className="flex gap-2"><Info size={13} className="mt-0.5 shrink-0" /> Figures are before tax. US tax depends on whether these are ISOs or NSOs, when you exercise and sell, the alternative minimum tax (AMT) and your state, so it is not estimated here. Talk to a US tax adviser before exercising.</li>
                    <li className="flex gap-2"><Info size={13} className="mt-0.5 shrink-0" /> If you exercise early, an 83(b) election may apply; it must be filed with the IRS within 30 days of exercise. Ask your company whether early exercise is allowed.</li>
                    <li className="flex gap-2"><Info size={13} className="mt-0.5 shrink-0" /> There may be no buyer for your shares until a tender offer, secondary sale, acquisition or IPO.</li>
                  </ul>
                  ) : (
                  <ul className="mt-4 space-y-1.5 text-xs leading-5 text-slate-500">
                    <li className="flex gap-2"><Info size={13} className="mt-0.5 shrink-0" /> Assumes you exercise at today&apos;s value per share and later sell after holding the shares for more than 24 months (long-term: 12.5% plus 4% cess on the gain above today&apos;s value).</li>
                    <li className="flex gap-2"><Info size={13} className="mt-0.5 shrink-0" /> Tax when you exercise is the extra income tax on your salary slab. Surcharge relief and other income are not included.</li>
                    <li className="flex gap-2"><Info size={13} className="mt-0.5 shrink-0" /> Some startups let employees defer this tax; ask your company whether it applies to you.</li>
                    <li className="flex gap-2"><Info size={13} className="mt-0.5 shrink-0" /> There may be no buyer for your shares until a buyback, secondary sale or IPO.</li>
                  </ul>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* Documents */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700"><FileText size={20} /></span>
            <div>
              <h2 className="text-base font-black">Your documents</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {data.letter
                  ? "Your grant letter from the company, and a one-page summary of this grant."
                  : "Your company has not uploaded your grant letter here yet. You can download a summary of this grant."}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {data.letter && (
              <a
                href={`/api/grant/${token}/letter`}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
              >
                <Download size={14} /> Download grant letter
              </a>
            )}
            <a
              href={`/api/grant/${token}/summary`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-slate-300"
            >
              <Download size={14} /> Download grant summary (PDF)
            </a>
          </div>
          {data.letter?.uploadedAt && (
            <p className="mt-3 text-xs text-slate-400">
              {data.letter.fileName} · uploaded {fmtDate(data.letter.uploadedAt)}
            </p>
          )}
        </section>

        {/* Accept */}
        <AcceptCard
          token={token}
          employeeName={data.employeeName}
          status={status}
          acceptedAt={accepted}
          onAccepted={(at) => setAccepted(at)}
        />

        {/* Footer */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700"><Coins size={20} /></span>
            <div>
              <p className="font-black text-slate-950">Want to plan exercising, leaving or selling in detail?</p>
              <p>
                {us
                  ? "ESOP Value Clarity PRO models exercise timing, dilution and exit scenarios for your own grant."
                  : "ESOP Value Clarity PRO compares exercise strategies, tax and exit scenarios for your own grant."}{" "}
                <a href="/pricing" className="font-bold text-blue-700 underline">See PRO</a>
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Prepared by {data.companyName} using ESOP Value Clarity. Your grant {us ? "agreement and the equity plan" : "letter and the ESOP scheme"} are the
            documents that count. Figures here are estimates, not legal, tax or investment advice.
          </p>
        </section>
      </div>
    </main>
  );
}

function AcceptCard({
  token,
  employeeName,
  status,
  acceptedAt,
  onAccepted,
}: {
  token: string;
  employeeName: string;
  status: string;
  acceptedAt: string | null;
  onAccepted: (at: string) => void;
}) {
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (status === "ACCEPTED") {
    return (
      <section className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-black">You accepted this grant{acceptedAt ? ` on ${fmtDate(acceptedAt)}` : ""}.</p>
          <p>Your company can see this. Keep your grant letter for your records.</p>
        </div>
      </section>
    );
  }

  if (status !== "ISSUED") return null;

  async function accept() {
    if (!name.trim()) return setError("Type your full name.");
    if (!confirm) return setError("Tick the box to confirm.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/grant/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name.trim(), confirm: true }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) return setError(json?.message ?? "Could not record your acceptance.");
      onAccepted(new Date().toISOString());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><ShieldCheck size={20} /></span>
        <div>
          <h2 className="text-base font-black">Accept your grant</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Confirms to your company that you have received and read your grant. Your grant letter from
            the company is the legal document.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold text-slate-500">Type your full name ({employeeName})</span>
          <input className={`${INPUT} mt-1`} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          I have received and read my grant
        </label>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void accept()}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {busy && <Loader2 size={15} className="animate-spin" />} Accept grant
      </button>
    </section>
  );
}

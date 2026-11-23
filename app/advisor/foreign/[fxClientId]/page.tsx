"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Globe2,
  History as HistoryIcon,
  Landmark,
  ListOrdered,
  Receipt,
  Settings2,
  Trash2,
} from "lucide-react";

import TxnAdd from "@/components/fx/TxnAdd";
import TxnImport from "@/components/fx/TxnImport";
import type { FxClient, Report, Txn } from "@/components/fx/types";
import { BTN_DARK, BTN_LIGHT, CARD, INPUT, LABEL, inr, num, readJson } from "@/components/fx/ui";
import ChangeHistoryPanel from "@/components/history/ChangeHistoryPanel";

type TabKey = "txns" | "cg" | "fa" | "div" | "settings" | "history";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "txns", label: "Transactions", icon: <ListOrdered size={14} /> },
  { key: "cg", label: "Capital gains", icon: <Receipt size={14} /> },
  { key: "fa", label: "Schedule FA", icon: <Globe2 size={14} /> },
  { key: "div", label: "Dividends & FTC", icon: <Landmark size={14} /> },
  { key: "settings", label: "Settings", icon: <Settings2 size={14} /> },
  { key: "history", label: "History", icon: <HistoryIcon size={14} /> },
];

const TYPE_LABEL: Record<Txn["type"], string> = {
  VEST: "Vest",
  BUY: "Buy",
  SELL: "Sell",
  DIVIDEND: "Dividend",
  TAX_WITHHELD: "Tax withheld",
};

const TH = "px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400";
const TD = "px-3 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap";

export default function FxClientPage() {
  const router = useRouter();
  const { fxClientId } = useParams<{ fxClientId: string }>();
  const [client, setClient] = useState<FxClient | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("txns");
  const [faYear, setFaYear] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/advisor/fx/clients/${fxClientId}`, { credentials: "include", cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await readJson(res);
      if (!res.ok || !data.success) {
        setError(String(data.message ?? "We could not load this client."));
        setClient(null);
        return;
      }
      setError("");
      setClient(data.client as FxClient);
      setTxns(data.transactions as Txn[]);
      setReport(data.report as Report);
      setCanEdit(Boolean(data.canEdit));
    } catch {
      setError("We could not connect. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, [fxClientId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function deleteTxn(id: string) {
    const res = await fetch(`/api/advisor/fx/clients/${fxClientId}/transactions/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) void load();
  }

  async function clearAll() {
    if (!window.confirm("Remove every transaction for this client? You can import again afterwards.")) return;
    const res = await fetch(`/api/advisor/fx/clients/${fxClientId}/transactions?all=1`, { method: "DELETE", credentials: "include" });
    if (res.ok) void load();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8fc]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </main>
    );
  }

  if (!client || !report) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] px-6 py-24 text-center text-slate-950">
        <h1 className="text-xl font-black">Client not available</h1>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <button type="button" className={`${BTN_DARK} mt-6`} onClick={() => router.push("/advisor/foreign")}>
          <ArrowLeft size={15} />
          Back
        </button>
      </main>
    );
  }

  const blocks = report.warnings.filter((w) => w.level === "BLOCK");
  const years = report.faYears;
  const year = faYear ?? years[years.length - 1] ?? null;

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
      <div className="mx-auto max-w-[1100px] px-5 py-6 md:px-8 md:py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/advisor/foreign")}
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Individuals
            </button>
            <span className="text-slate-300">/</span>
            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight">{client.name}</p>
              <p className="text-xs font-semibold text-slate-400">
                {txns.length} transactions | {report.lots.length} lots | holding{" "}
                {report.holdings.map((h) => `${num(h.shares)} ${h.symbol}`).join(", ") || "nothing"}
              </p>
            </div>
          </div>
          <a href={`/api/advisor/fx/clients/${fxClientId}/report/export`} className={BTN_DARK}>
            <FileSpreadsheet size={14} />
            Download tax workbook
          </a>
        </header>

        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        {report.warnings.length > 0 && (
          <div className={`mt-5 rounded-2xl border px-4 py-3 ${blocks.length ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
            <p className="flex items-center gap-2 text-sm font-black">
              <AlertTriangle size={15} />
              {blocks.length ? `${blocks.length} problem(s) to fix before filing` : "Things to check"}
            </p>
            <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-auto pl-5 text-xs font-semibold text-slate-700">
              {report.warnings.map((w, i) => (
                <li key={i}>
                  <b>{w.level}</b> {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <nav className="mt-6 flex max-w-full flex-wrap rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                tab === t.key ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-5">
          {tab === "txns" && (
            <>
              {canEdit && (
                <div className="flex flex-wrap items-center gap-2">
                  <a href="/api/advisor/fx/template" className={BTN_LIGHT}>
                    <Download size={14} />
                    EVC template
                  </a>
                  {txns.length > 0 && (
                    <button type="button" className={BTN_LIGHT} onClick={() => void clearAll()}>
                      <Trash2 size={14} />
                      Remove all
                    </button>
                  )}
                </div>
              )}
              {canEdit && <TxnImport fxClientId={fxClientId} onImported={() => void load()} />}
              {canEdit && <TxnAdd fxClientId={fxClientId} onAdded={() => void load()} />}

              <section className={CARD}>
                <h2 className="font-black">Transactions</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        {["Date", "Type", "Symbol", "Broker", "Shares", "Price", "Amount", "Fees", "Lot", ""].map((h) => (
                          <th key={h} className={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {txns.length === 0 && (
                        <tr><td colSpan={10} className="px-3 py-6 text-sm text-slate-400">No transactions yet.</td></tr>
                      )}
                      {txns.map((t) => (
                        <tr key={t.id}>
                          <td className={TD}>{t.date}</td>
                          <td className={TD}>{TYPE_LABEL[t.type]}</td>
                          <td className={TD}>{t.symbol}</td>
                          <td className={TD}>{t.broker ?? "-"}</td>
                          <td className={TD}>{t.quantity ? num(t.quantity) : "-"}</td>
                          <td className={TD}>{t.priceUsd !== null ? `${num(t.priceUsd)} ${t.currency}` : "-"}</td>
                          <td className={TD}>{t.amountUsd !== null ? `${num(t.amountUsd)} ${t.currency}` : "-"}</td>
                          <td className={TD}>{t.feesUsd ? num(t.feesUsd) : "-"}</td>
                          <td className={TD}>{t.lotRef ?? "-"}</td>
                          <td className={TD}>
                            {canEdit && (
                              <button type="button" aria-label="Delete" className="text-slate-400 hover:text-red-600" onClick={() => void deleteTxn(t.id)}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {tab === "cg" && (
            <>
              <section className={CARD}>
                <h2 className="font-black">Capital gains by financial year</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Foreign shares count as unlisted: long-term after 24 months (12.5%, no indexation), short-term at the slab
                  rate in Settings. Estimates include 4% cess, not surcharge or loss set-off.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>{["FY", "Short-term gain", "Long-term gain", "Est. tax", ""].map((h) => <th key={h} className={TH}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.gainsByFy.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-sm text-slate-400">No sales yet.</td></tr>}
                      {report.gainsByFy.map((g) => (
                        <tr key={g.fy}>
                          <td className={TD}>FY {g.fy}</td>
                          <td className={TD}>{inr(g.shortTerm.gain)}</td>
                          <td className={TD}>{inr(g.longTerm.gain)}</td>
                          <td className={TD}>{inr(g.estimatedTax.shortTerm + g.estimatedTax.longTerm)}</td>
                          <td className={TD}>{g.incomplete ? <span className="text-red-600">Incomplete</span> : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className={CARD}>
                <h2 className="font-black">Each sale, lot by lot</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        {["FY", "Term", "Bucket", "Symbol", "Lot", "Acquired", "Sold", "Months", "Shares", "TTBR", "Proceeds", "Cost", "Fees", "Gain"].map((h) => (
                          <th key={h} className={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.pieces.map((p, i) => (
                        <tr key={i}>
                          <td className={TD}>{p.fy}</td>
                          <td className={TD}>{p.longTerm ? "Long" : "Short"}</td>
                          <td className={TD}>{p.bucket}</td>
                          <td className={TD}>{p.symbol}</td>
                          <td className={TD}>{p.lotRef}</td>
                          <td className={TD}>{p.acquiredOn}</td>
                          <td className={TD}>{p.soldOn}</td>
                          <td className={TD}>{p.holdingMonths}</td>
                          <td className={TD}>{num(p.quantity)}</td>
                          <td className={TD}>{p.saleRate ? `${p.saleRate.ttbr} (${p.saleRate.rateDate})` : "missing"}</td>
                          <td className={TD}>{inr(p.proceedsInr)}</td>
                          <td className={TD}>{inr(p.costInr)}</td>
                          <td className={TD}>{inr(p.feesInr)}</td>
                          <td className={TD}>{inr(p.gainInr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {tab === "fa" && (
            <section className={CARD}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-black">Schedule FA (calendar year)</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Shown for completed calendar years. Peak and closing values need daily prices for each share; upload
                    them on the Individuals page.
                  </p>
                </div>
                {years.length > 0 && (
                  <select className={`${INPUT} w-36`} value={year ?? ""} onChange={(e) => setFaYear(Number(e.target.value))}>
                    {years.map((y) => <option key={y} value={y}>CY {y}</option>)}
                  </select>
                )}
              </div>
              {years.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">No completed calendar year with holdings yet.</p>
              ) : (
                <>
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-slate-400">A3: equity interest, per lot</p>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>{["Company", "Lot", "Acquired", "Initial value", "Peak value", "Peak date", "Closing value", "Shares 31 Dec", "Sale proceeds", "Missing"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.faLots.filter((l) => l.year === year).map((l, i) => (
                          <tr key={i}>
                            <td className={TD}>{l.company} ({l.symbol})</td>
                            <td className={TD}>{l.lotRef}</td>
                            <td className={TD}>{l.acquiredOn}</td>
                            <td className={TD}>{inr(l.initialValueInr)}</td>
                            <td className={TD}>{inr(l.peakValueInr)}</td>
                            <td className={TD}>{l.peakDate ?? "-"}</td>
                            <td className={TD}>{inr(l.closingValueInr)}</td>
                            <td className={TD}>{num(l.sharesAtYearEnd)}</td>
                            <td className={TD}>{inr(l.saleProceedsInr)}</td>
                            <td className={`${TD} text-red-600`}>{l.missing.join("; ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-6 text-xs font-black uppercase tracking-[0.12em] text-slate-400">A2: custodial accounts (shares only)</p>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>{["Broker", "Account", "Peak value", "Peak date", "Closing value", "Gross credited", "Missing"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.faAccounts.filter((a) => a.year === year).map((a, i) => (
                          <tr key={i}>
                            <td className={TD}>{a.broker}</td>
                            <td className={TD}>{a.account || "-"}</td>
                            <td className={TD}>{inr(a.peakValueInr)}</td>
                            <td className={TD}>{a.peakDate ?? "-"}</td>
                            <td className={TD}>{inr(a.closingValueInr)}</td>
                            <td className={TD}>{inr(a.grossCreditedInr)}</td>
                            <td className={`${TD} text-red-600`}>{a.missing.join("; ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}

          {tab === "div" && (
            <section className={CARD}>
              <h2 className="font-black">Dividends and foreign tax credit</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Dividends go to Schedule OS / FSI; tax withheld to Schedule TR and Form 67 (filed before the return). Credit
                is the lower of foreign tax and Indian tax on that income (verify the DTAA rate).
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>{["FY", "Gross dividend", "Tax withheld", "Indian tax on it (est.)", "FTC estimate", ""].map((h) => <th key={h} className={TH}>{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.dividendsByFy.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-sm text-slate-400">No dividends yet.</td></tr>}
                    {report.dividendsByFy.map((d) => (
                      <tr key={d.fy}>
                        <td className={TD}>FY {d.fy}</td>
                        <td className={TD}>{inr(d.grossInr)}</td>
                        <td className={TD}>{inr(d.taxWithheldInr)}</td>
                        <td className={TD}>{inr(d.indianTaxOnDividendInr)}</td>
                        <td className={TD}>{inr(d.ftcEstimateInr)}</td>
                        <td className={TD}>{d.incomplete ? <span className="text-red-600">Incomplete</span> : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "settings" && (
            <SettingsPanel key={client.updatedAt} client={client} canEdit={canEdit} onSaved={() => void load()} />
          )}

          {tab === "history" && (
            <ChangeHistoryPanel
              endpoint={`/api/advisor/fx/clients/${fxClientId}/history`}
              exportHref={`/api/advisor/fx/clients/${fxClientId}/history/export`}
              filters={[]}
              intro="Every import, edit and download for this client, with who did it and when."
            />
          )}
        </div>
      </div>
    </main>
  );
}

const RULES = [
  { value: "SAME_DAY", label: "Rate on the same day" },
  { value: "PREV_MONTH_END", label: "Last day of previous month (Rule 115)" },
];

function SettingsPanel({ client, canEdit, onSaved }: { client: FxClient; canEdit: boolean; onSaved: () => void }) {
  const router = useRouter();
  const [s, setS] = useState({
    name: client.name,
    email: client.email ?? "",
    notes: client.notes ?? "",
    slab: String(Math.round(client.slabRate * 1000) / 10),
    costRateRule: client.costRateRule,
    saleRateRule: client.saleRateRule,
    dividendRateRule: client.dividendRateRule,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/advisor/fx/clients/${client.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s.name,
          email: s.email,
          notes: s.notes,
          slabRate: Number(s.slab) / 100,
          costRateRule: s.costRateRule,
          saleRateRule: s.saleRateRule,
          dividendRateRule: s.dividendRateRule,
        }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.success) {
        setMsg(String(data.message ?? "Could not save."));
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!window.confirm(`Archive ${client.name}? They will be hidden from your list.`)) return;
    const res = await fetch(`/api/advisor/fx/clients/${client.id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) router.push("/advisor/foreign");
  }

  const ruleSelect = (k: "costRateRule" | "saleRateRule" | "dividendRateRule") => (
    <select className={INPUT} disabled={!canEdit} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value as FxClient[typeof k] })}>
      {RULES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
    </select>
  );

  return (
    <section className={CARD}>
      <h2 className="font-black">Client and calculation settings</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label><span className={LABEL}>Name</span><input className={INPUT} disabled={!canEdit} value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></label>
        <label><span className={LABEL}>Email</span><input className={INPUT} disabled={!canEdit} value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })} /></label>
        <label><span className={LABEL}>Slab rate for short-term gains (%)</span><input className={INPUT} disabled={!canEdit} inputMode="decimal" value={s.slab} onChange={(e) => setS({ ...s, slab: e.target.value })} /></label>
        <label><span className={LABEL}>Cost (vest / buy) converted at</span>{ruleSelect("costRateRule")}</label>
        <label><span className={LABEL}>Sale proceeds converted at</span>{ruleSelect("saleRateRule")}</label>
        <label><span className={LABEL}>Dividends and tax withheld converted at</span>{ruleSelect("dividendRateRule")}</label>
        <label className="sm:col-span-2"><span className={LABEL}>Notes</span><textarea className={INPUT} rows={3} disabled={!canEdit} value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} /></label>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Defaults: cost at the vest/buy date rate (matches the Form 16 perquisite), sale and dividends at the last day of
        the previous month. Change these if your view differs; every figure updates.
      </p>
      {canEdit && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className={BTN_DARK} disabled={busy} onClick={() => void save()}>{busy ? "Saving..." : "Save"}</button>
          <button type="button" className={BTN_LIGHT} onClick={() => void archive()}><Trash2 size={14} />Archive client</button>
          {msg && <p className="text-sm font-semibold text-red-600">{msg}</p>}
        </div>
      )}
    </section>
  );
}

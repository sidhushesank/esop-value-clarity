"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Download, Globe2, Plus, X } from "lucide-react";

import FileUpload from "@/components/fx/FileUpload";
import { BTN_DARK, BTN_LIGHT, CARD, INPUT, LABEL, readJson } from "@/components/fx/ui";

type Row = { id: string; name: string; email: string | null; createdAt: string; _count: { transactions: number } };
type Cov = {
  rates: { currency: string; shared: boolean; from: string | null; to: string | null; days: number }[];
  prices: { symbol: string; from: string | null; to: string | null; days: number }[];
};

export default function ForeignEquityPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Row[] | null>(null);
  const [cov, setCov] = useState<Cov>({ rates: [], prices: [] });
  const [limit, setLimit] = useState(0);
  const [canEdit, setCanEdit] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [rateCurrency, setRateCurrency] = useState("USD");
  const [rateShared, setRateShared] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [priceOrder, setPriceOrder] = useState("MDY");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/advisor/fx/clients", { credentials: "include", cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await readJson(res);
      if (!res.ok || !data.success) {
        setError(String(data.message ?? "We could not load your clients."));
        setClients([]);
        return;
      }
      setError("");
      setClients(data.clients as Row[]);
      setCov(data.coverage as Cov);
      setLimit(Number(data.limit));
      setCanEdit(Boolean(data.canEdit));
      setIsFounder(Boolean(data.isFounder));
    } catch {
      setError("We could not connect. Please check your connection and retry.");
      setClients([]);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addClient() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/advisor/fx/clients", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.success) {
        setError(String(data.message ?? "Could not add the client."));
        return;
      }
      const c = data.client as { id: string };
      router.push(`/advisor/foreign/${c.id}`);
    } finally {
      setSaving(false);
    }
  }

  const usd = cov.rates.filter((r) => r.currency === "USD");

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
      <div className="mx-auto max-w-[1000px] px-5 py-6 md:px-8 md:py-8">
        <button
          type="button"
          onClick={() => router.push("/advisor")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          Advisor Console
        </button>

        <section className="mt-5 rounded-[2rem] bg-[#0b1530] p-6 text-white md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-300">
            <Globe2 size={12} />
            Foreign equity tax
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">US RSUs, ESPP and ESOPs, worked out.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            For individual clients holding foreign company shares. Import their broker transactions (any broker, any
            column layout) and get capital gains for Schedule CG, Schedule FA (A2 and A3), dividends and foreign tax
            credit for Form 67, all at SBI TT buying rates, in one Excel.
          </p>
          <p className="mt-4 text-xs font-semibold text-slate-400">
            {clients ? `${clients.length} of ${limit} individual clients` : "Loading..."}
          </p>
        </section>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
        )}

        <section className={`${CARD} mt-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Individual clients</h2>
              <p className="text-xs font-semibold text-slate-400">Separate from your client companies.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/api/advisor/fx/template" className={BTN_LIGHT}>
                <Download size={14} />
                Transactions template
              </a>
              {canEdit && (
                <button type="button" className={BTN_DARK} onClick={() => setAdding((v) => !v)}>
                  {adding ? <X size={14} /> : <Plus size={14} />}
                  {adding ? "Cancel" : "Add client"}
                </button>
              )}
            </div>
          </div>

          {adding && (
            <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label>
                <span className={LABEL}>Name</span>
                <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
              </label>
              <label>
                <span className={LABEL}>Email (optional)</span>
                <input className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <button type="button" className={BTN_DARK} disabled={!name.trim() || saving} onClick={() => void addClient()}>
                {saving ? "Adding..." : "Add"}
              </button>
            </div>
          )}

          <div className="mt-5 divide-y divide-slate-100">
            {clients === null && <p className="py-6 text-sm text-slate-400">Loading...</p>}
            {clients?.length === 0 && (
              <p className="py-6 text-sm text-slate-500">No individual clients yet. Add one to import their broker statements.</p>
            )}
            {clients?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/advisor/foreign/${c.id}`)}
                className="flex w-full items-center justify-between gap-3 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-black">{c.name}</p>
                  <p className="text-xs font-semibold text-slate-400">
                    {c._count.transactions} transactions{c.email ? ` | ${c.email}` : ""}
                  </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        </section>

        <section className={`${CARD} mt-6`}>
          <h2 className="text-lg font-black">Rates and prices</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Every rupee figure needs the SBI TT buying rate for that day. Schedule FA peak and closing values also need
            daily closing prices for each share. Upload once; every client uses them.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-black">SBI TT buying rates</p>
              <div className="mt-2 space-y-1 text-xs font-semibold text-slate-500">
                {usd.length === 0 && <p className="text-amber-700">No USD rates yet.</p>}
                {cov.rates.map((r) => (
                  <p key={`${r.currency}${r.shared}`}>
                    {r.currency} ({r.shared ? "EVC shared" : "your firm"}): {r.days} days, {r.from} to {r.to}
                  </p>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                File with a Date column and a TT BUY (or TTBR) column, e.g. the public SBI reference-rate archive. Your
                own rates win over EVC&apos;s shared rates for the same day.
              </p>
              {canEdit && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <input className={`${INPUT} w-24`} value={rateCurrency} maxLength={3} onChange={(e) => setRateCurrency(e.target.value.toUpperCase())} />
                    {isFounder && (
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <input type="checkbox" checked={rateShared} onChange={(e) => setRateShared(e.target.checked)} />
                        Save as EVC shared rates
                      </label>
                    )}
                  </div>
                  <FileUpload
                    url="/api/advisor/fx/rates"
                    fields={{ currency: rateCurrency, scope: rateShared ? "shared" : "firm" }}
                    label="Upload rates"
                    onDone={() => void load()}
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-black">Daily closing prices</p>
              <div className="mt-2 space-y-1 text-xs font-semibold text-slate-500">
                {cov.prices.length === 0 && <p className="text-amber-700">No prices yet.</p>}
                {cov.prices.map((p) => (
                  <p key={p.symbol}>
                    {p.symbol}: {p.days} days, {p.from} to {p.to}
                  </p>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                A price-history download (Date and Close columns) for one share, covering the whole calendar year.
              </p>
              {canEdit && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <input className={INPUT} placeholder="Symbol, e.g. GOOGL" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
                    <select className={`${INPUT} w-40`} value={priceOrder} onChange={(e) => setPriceOrder(e.target.value)}>
                      <option value="MDY">Dates MM/DD</option>
                      <option value="DMY">Dates DD/MM</option>
                    </select>
                  </div>
                  <FileUpload
                    url="/api/advisor/fx/prices"
                    fields={{ symbol, dateOrder: priceOrder }}
                    label="Upload prices"
                    disabled={!symbol.trim()}
                    onDone={() => void load()}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

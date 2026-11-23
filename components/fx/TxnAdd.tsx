"use client";

import { useState } from "react";

import { BTN_DARK, INPUT, LABEL, readJson } from "@/components/fx/ui";

const EMPTY = { type: "VEST", date: "", symbol: "", company: "", broker: "", account: "", quantity: "", priceUsd: "", amountUsd: "", feesUsd: "", currency: "USD", lotRef: "", costInrPerShare: "" };

export default function TxnAdd({ fxClientId, onAdded }: { fxClientId: string; onAdded: () => void }) {
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shares = f.type === "VEST" || f.type === "BUY" || f.type === "SELL";
  const n = (v: string) => (v.trim() === "" ? null : Number(v));
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/advisor/fx/clients/${fxClientId}/transactions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          quantity: shares ? n(f.quantity) : null,
          priceUsd: shares ? n(f.priceUsd) : null,
          amountUsd: shares ? null : n(f.amountUsd),
          feesUsd: n(f.feesUsd),
          costInrPerShare: n(f.costInrPerShare),
        }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.success) {
        setError(String(data.message ?? "Could not save."));
        return;
      }
      setF({ ...EMPTY, type: f.type, symbol: f.symbol, company: f.company, broker: f.broker, account: f.account, currency: f.currency });
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="font-black">Add one transaction</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <label>
          <span className={LABEL}>Type</span>
          <select className={INPUT} value={f.type} onChange={set("type")}>
            <option value="VEST">Vest (RSU)</option>
            <option value="BUY">Buy / ESPP / exercise</option>
            <option value="SELL">Sell</option>
            <option value="DIVIDEND">Dividend</option>
            <option value="TAX_WITHHELD">Tax withheld</option>
          </select>
        </label>
        <label>
          <span className={LABEL}>Date</span>
          <input type="date" className={INPUT} value={f.date} onChange={set("date")} />
        </label>
        <label>
          <span className={LABEL}>Symbol</span>
          <input className={INPUT} value={f.symbol} onChange={set("symbol")} placeholder="GOOGL" />
        </label>
        <label>
          <span className={LABEL}>Company</span>
          <input className={INPUT} value={f.company} onChange={set("company")} />
        </label>
        <label>
          <span className={LABEL}>Broker</span>
          <input className={INPUT} value={f.broker} onChange={set("broker")} />
        </label>
        <label>
          <span className={LABEL}>Account</span>
          <input className={INPUT} value={f.account} onChange={set("account")} />
        </label>
        {shares ? (
          <>
            <label>
              <span className={LABEL}>Shares</span>
              <input className={INPUT} inputMode="decimal" value={f.quantity} onChange={set("quantity")} />
            </label>
            <label>
              <span className={LABEL}>{f.type === "VEST" ? "Value per share at vest" : f.type === "BUY" ? "Price paid per share" : "Sale price per share"} ({f.currency})</span>
              <input className={INPUT} inputMode="decimal" value={f.priceUsd} onChange={set("priceUsd")} />
            </label>
          </>
        ) : (
          <label>
            <span className={LABEL}>Amount ({f.currency})</span>
            <input className={INPUT} inputMode="decimal" value={f.amountUsd} onChange={set("amountUsd")} />
          </label>
        )}
        {f.type === "SELL" && (
          <>
            <label>
              <span className={LABEL}>Fees ({f.currency})</span>
              <input className={INPUT} inputMode="decimal" value={f.feesUsd} onChange={set("feesUsd")} />
            </label>
            <label>
              <span className={LABEL}>From lot (optional)</span>
              <input className={INPUT} value={f.lotRef} onChange={set("lotRef")} />
            </label>
          </>
        )}
        {(f.type === "VEST" || f.type === "BUY") && (
          <>
            <label>
              <span className={LABEL}>Lot ref (optional)</span>
              <input className={INPUT} value={f.lotRef} onChange={set("lotRef")} />
            </label>
            <label>
              <span className={LABEL}>Form 16 value / share (Rs., optional)</span>
              <input className={INPUT} inputMode="decimal" value={f.costInrPerShare} onChange={set("costInrPerShare")} />
            </label>
          </>
        )}
        <label>
          <span className={LABEL}>Currency</span>
          <input className={INPUT} maxLength={3} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" className={BTN_DARK} disabled={busy || !f.date || !f.symbol.trim()} onClick={() => void save()}>
          {busy ? "Saving..." : "Add"}
        </button>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      </div>
    </div>
  );
}

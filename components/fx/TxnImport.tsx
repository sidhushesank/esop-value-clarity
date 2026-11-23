"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";

import { BTN_DARK, BTN_LIGHT, INPUT, LABEL, readJson } from "@/components/fx/ui";

type RowError = { rowNumber: number; errors: string[] };
type Matched = { field: string; column: string }[];

export default function TxnImport({ fxClientId, onImported }: { fxClientId: string; onImported: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [broker, setBroker] = useState("");
  const [dateOrder, setDateOrder] = useState("AUTO");
  const [notes, setNotes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<{ count: number; matched: Matched } | null>(null);
  const [error, setError] = useState("");
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [matched, setMatched] = useState<Matched>([]);
  const [done, setDone] = useState("");

  function reset() {
    setChecked(null);
    setError("");
    setRowErrors([]);
    setMatched([]);
    setNotes([]);
    setDone("");
  }

  async function send(dryRun: boolean) {
    if (!file) return;
    setBusy(true);
    setError("");
    setRowErrors([]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("broker", broker);
      form.append("dateOrder", dateOrder);
      if (dryRun) form.append("dryRun", "1");
      const res = await fetch(`/api/advisor/fx/clients/${fxClientId}/transactions/import`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await readJson(res);
      setMatched((data.matched as Matched) ?? []);
      setNotes((data.notes as string[]) ?? []);
      if (!res.ok || !data.success) {
        setChecked(null);
        setError(String(data.message ?? "Import failed."));
        setRowErrors((data.errors as RowError[]) ?? []);
        return;
      }
      if (dryRun) {
        setChecked({ count: Number(data.count), matched: (data.matched as Matched) ?? [] });
      } else {
        setDone(`Imported ${data.count} transactions.`);
        setChecked(null);
        setFile(null);
        if (ref.current) ref.current.value = "";
        onImported();
      }
    } catch {
      setError("Could not connect. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-black">Import a broker file</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Either a transaction history (one row per vest, buy, sale, dividend or tax: columns like Type / Action, Date,
        Symbol, Quantity, Price, Amount) or a realised gains report (Date Acquired, Date Sold, Cost basis, Proceeds).
        Columns are matched by name. One file per broker; don&apos;t load the same sale from both kinds of file. Nothing
        is saved until every row reads cleanly.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label>
          <span className={LABEL}>File</span>
          <input
            ref={ref}
            type="file"
            accept=".xlsx,.csv"
            className={INPUT}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              reset();
            }}
          />
        </label>
        <label>
          <span className={LABEL}>Broker (if not in the file)</span>
          <input className={INPUT} value={broker} placeholder="e.g. Schwab, E*TRADE" onChange={(e) => { setBroker(e.target.value); reset(); }} />
        </label>
        <label>
          <span className={LABEL}>Dates in the file</span>
          <select className={INPUT} value={dateOrder} onChange={(e) => { setDateOrder(e.target.value); reset(); }}>
            <option value="AUTO">Detect automatically</option>
            <option value="DMY">DD/MM/YYYY (India)</option>
            <option value="MDY">MM/DD/YYYY (US brokers)</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={BTN_LIGHT} disabled={!file || busy} onClick={() => void send(true)}>
          <FileSpreadsheet size={14} />
          {busy && !checked ? "Checking..." : "Check file"}
        </button>
        {checked && (
          <button type="button" className={BTN_DARK} disabled={busy} onClick={() => void send(false)}>
            <Upload size={14} />
            {busy ? "Importing..." : `Import ${checked.count} transactions`}
          </button>
        )}
      </div>

      {matched.length > 0 && (
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Columns used: {matched.map((m) => `${m.field} ← "${m.column}"`).join(", ")}
        </p>
      )}
      {notes.map((n) => (
        <p key={n} className="mt-1 text-xs font-semibold text-blue-700">{n}</p>
      ))}
      {checked && (
        <p className="mt-2 inline-flex items-center gap-2 text-xs font-black text-emerald-700">
          <CheckCircle2 size={14} />
          All {checked.count} rows read cleanly. Check the columns above, then import.
        </p>
      )}
      {done && <p className="mt-2 text-xs font-black text-emerald-700">{done}</p>}
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      {rowErrors.length > 0 && (
        <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-red-100 bg-white p-3 text-xs text-red-700">
          {rowErrors.map((r) => (
            <p key={r.rowNumber}>
              <b>Row {r.rowNumber}:</b> {r.errors.join(" ")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

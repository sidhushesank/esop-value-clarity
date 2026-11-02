"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";

import { BTN_DARK, BTN_LIGHT, INPUT, LABEL, fmtDate, fmtNum, readJson, todayIso } from "@/components/company/ui";

type Kind = "captable" | "grants";

type Field = { key: string; label: string; required: boolean; hint: string };

type Preview = {
  success: boolean;
  message?: string;
  fileName: string;
  headers: string[];
  rowCount: number;
  fields: Field[];
  mapping: Record<string, number | null>;
  missing: string[];
  ready: boolean;
  validCount?: number;
  invalid?: { rowNumber: number; errors: string[] }[];
  invalidCount?: number;
  // cap table
  newClasses?: { name: string; kind: string }[];
  newHolders?: { name: string; type: string }[];
  matchedHolders?: number;
  totalsByClass?: { className: string; quantity: number }[];
  // grants
  schemeName?: string;
  blockers?: string[];
  pool?: { size: number; usedBefore: number; importing: number; usedAfter: number };
  holders?: { existing: number; adding: number; limit: number | null };
  warningRows?: number;
  warnings?: { rowNumber: number; employeeName: string; messages: string[] }[];
  byStatus?: Record<string, number>;
  sample?: Record<string, unknown>[];
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  ACCEPTED: "Accepted",
  LEFT: "Left",
  LAPSED: "Lapsed",
  EXERCISED: "Exercised",
};

export default function ImportCard({
  kind,
  schemes,
  onImported,
}: {
  kind: Kind;
  schemes?: { id: string; name: string; optionsAvailable: number }[];
  onImported: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [asOf, setAsOf] = useState(todayIso());
  const [schemeId, setSchemeId] = useState(schemes?.[0]?.id ?? "");
  const [mapping, setMapping] = useState<Record<string, number | null> | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<"" | "preview" | "commit">("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const title = kind === "captable" ? "Import cap table from Excel" : "Import existing grants from Excel";

  function reset() {
    setFile(null);
    setMapping(null);
    setPreview(null);
    setError("");
    if (input.current) input.current.value = "";
  }

  function form(f: File, map: Record<string, number | null> | null) {
    const body = new FormData();
    body.append("file", f);
    if (map) body.append("mapping", JSON.stringify(map));
    if (kind === "captable") body.append("asOf", asOf);
    else body.append("schemeId", schemeId);
    return body;
  }

  async function runPreview(f: File, map: Record<string, number | null> | null) {
    if (kind === "grants" && !schemeId) return setError("Choose the ESOP scheme first.");
    setBusy("preview");
    setError("");
    setDone("");
    try {
      const res = await fetch(`/api/company/import/${kind}/preview`, {
        method: "POST",
        credentials: "include",
        body: form(f, map),
      });
      const json = (await readJson(res)) as Preview | null;
      if (!res.ok || !json?.success) {
        setPreview(null);
        return setError(json?.message ?? "We could not read this file.");
      }
      setPreview(json);
      setMapping(json.mapping);
    } catch {
      setError("We could not read this file. Please retry.");
    } finally {
      setBusy("");
    }
  }

  async function commit() {
    if (!file || !preview?.ready) return;
    setBusy("commit");
    setError("");
    try {
      const res = await fetch(`/api/company/import/${kind}/commit`, {
        method: "POST",
        credentials: "include",
        body: form(file, mapping),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "The import did not go through. Nothing was saved.");
      setDone(
        kind === "captable"
          ? `Imported ${fmtNum(json.movements)} shareholding${json.movements === 1 ? "" : "s"} (${json.newHolders} new shareholder${json.newHolders === 1 ? "" : "s"}, ${json.newClasses} new class${json.newClasses === 1 ? "" : "es"}).`
          : `Imported ${fmtNum(json.grants)} grant${json.grants === 1 ? "" : "s"} into ${json.scheme}.`
      );
      reset();
      setOpen(false);
      onImported();
    } catch {
      setError("The import did not go through. Nothing was saved.");
    } finally {
      setBusy("");
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={20} className="text-slate-500" />
          <div>
            <p className="text-sm font-black">{title}</p>
            <p className="text-xs text-slate-500">
              {kind === "captable"
                ? "Already have a cap table in Excel? Bring it in instead of typing it."
                : "Already granted ESOPs? Bring them all in at once."}
            </p>
          </div>
        </div>
        <button type="button" className={BTN_LIGHT} onClick={() => { setOpen(true); setDone(""); }}>
          <Upload size={14} /> Import
        </button>
        {done && <p className="w-full text-sm font-semibold text-emerald-700">{done}</p>}
      </div>
    );
  }

  const invalid = preview?.invalid ?? [];

  return (
    <section className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <FileSpreadsheet size={20} />
          </span>
          <div>
            <h3 className="text-base font-black">{title}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Upload a .xlsx or .csv file. You will see every row checked before anything is saved, and the
              import only goes ahead if every row is valid.
            </p>
          </div>
        </div>
        <button type="button" className={BTN_LIGHT} onClick={() => { reset(); setOpen(false); }}>
          <X size={14} /> Close
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <a href={`/api/company/import/${kind}/template`} className={BTN_LIGHT}>
          <Download size={14} /> Download template
        </a>

        {kind === "captable" ? (
          <label className="block">
            <span className={LABEL}>Date for rows without a date</span>
            <input type="date" max={todayIso()} className={`${INPUT} mt-1 h-10 w-48`} value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </label>
        ) : (
          <label className="block">
            <span className={LABEL}>ESOP scheme</span>
            <select className={`${INPUT} mt-1 h-10 w-64`} value={schemeId} onChange={(e) => setSchemeId(e.target.value)}>
              {(schemes ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({fmtNum(s.optionsAvailable)} available)</option>
              ))}
            </select>
          </label>
        )}

        <input
          ref={input}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setMapping(null);
            setPreview(null);
            if (f) void runPreview(f, null);
          }}
        />
        <button type="button" className={BTN_DARK} disabled={!!busy || (kind === "grants" && !schemeId)} onClick={() => input.current?.click()}>
          {busy === "preview" ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {file ? "Choose another file" : "Choose file"}
        </button>
        {file && preview && (
          <button type="button" className={BTN_LIGHT} disabled={!!busy} onClick={() => void runPreview(file, mapping)}>
            Check again
          </button>
        )}
      </div>

      {kind === "grants" && (!schemes || schemes.length === 0) && (
        <p className="mt-3 text-sm font-semibold text-amber-700">Add your ESOP scheme under ESOP pool first.</p>
      )}

      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

      {preview && (
        <div className="mt-6 space-y-5">
          {/* Column matching */}
          <div>
            <p className="text-sm font-black">
              Columns in {preview.fileName} <span className="font-semibold text-slate-400">· {fmtNum(preview.rowCount)} rows</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">We matched your columns automatically. Change any that are wrong, then click Check again.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {preview.fields.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-[11px] font-bold text-slate-500">
                    {f.label}{f.required ? " *" : ""}
                  </span>
                  <select
                    className={`${INPUT} mt-1 h-9 text-xs ${f.required && (mapping?.[f.key] ?? null) === null ? "border-red-300" : ""}`}
                    value={mapping?.[f.key] ?? ""}
                    onChange={(e) =>
                      setMapping({ ...(mapping ?? {}), [f.key]: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  >
                    <option value="">{f.required ? "Choose a column" : "Not in my file"}</option>
                    {preview.headers.map((h, i) => (
                      <option key={`${h}-${i}`} value={i}>{h}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {preview.missing.length > 0 && (
              <p className="mt-3 text-sm font-semibold text-red-600">
                Choose a column for: {preview.missing.join(", ")}. Then click Check again.
              </p>
            )}
          </div>

          {preview.missing.length === 0 && (
            <>
              {/* Summary */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Ready to import</p>
                  <p className="mt-1 text-lg font-black text-emerald-900">{fmtNum(preview.validCount ?? 0)} rows</p>
                </div>
                <div className={`rounded-xl px-4 py-3 ${preview.invalidCount ? "bg-red-50" : "bg-slate-50"}`}>
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${preview.invalidCount ? "text-red-700" : "text-slate-400"}`}>Need fixing</p>
                  <p className={`mt-1 text-lg font-black ${preview.invalidCount ? "text-red-900" : ""}`}>{fmtNum(preview.invalidCount ?? 0)} rows</p>
                </div>
                {kind === "captable" ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">New to EVC</p>
                    <p className="mt-1 text-sm font-black">
                      {preview.newHolders?.length ?? 0} shareholders · {preview.newClasses?.length ?? 0} classes
                    </p>
                    <p className="text-xs text-slate-500">{preview.matchedHolders ?? 0} matched to existing shareholders</p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pool after import</p>
                    <p className="mt-1 text-sm font-black">
                      {fmtNum(preview.pool?.usedAfter ?? 0)} of {fmtNum(preview.pool?.size ?? 0)} used
                    </p>
                    <p className="text-xs text-slate-500">
                      +{preview.holders?.adding ?? 0} option holders
                      {preview.holders?.limit ? ` (plan: ${preview.holders.existing + (preview.holders.adding ?? 0)} of ${preview.holders.limit})` : ""}
                    </p>
                  </div>
                )}
              </div>

              {kind === "captable" && preview.totalsByClass && preview.totalsByClass.length > 0 && (
                <p className="text-sm text-slate-600">
                  Adds: {preview.totalsByClass.map((t) => `${fmtNum(t.quantity)} ${t.className}`).join(" · ")}
                  {preview.newClasses && preview.newClasses.length > 0 && (
                    <> · New classes: {preview.newClasses.map((c) => `${c.name} (${c.kind})`).join(", ")}</>
                  )}
                </p>
              )}

              {kind === "grants" && preview.byStatus && (
                <p className="text-sm text-slate-600">
                  {Object.entries(preview.byStatus).map(([k, v]) => `${v} ${STATUS_LABEL[k] ?? k}`).join(" · ")}
                </p>
              )}

              {/* Blockers */}
              {preview.blockers && preview.blockers.length > 0 && (
                <div className="space-y-2">
                  {preview.blockers.map((b) => (
                    <p key={b} className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {b}
                    </p>
                  ))}
                </div>
              )}

              {/* Row errors */}
              {invalid.length > 0 && (
                <div>
                  <p className="text-sm font-black text-red-700">Fix these rows in your file, then upload it again</p>
                  <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-red-100">
                    <table className="w-full text-sm">
                      <tbody>
                        {invalid.map((r) => (
                          <tr key={r.rowNumber} className="border-b border-red-50 align-top">
                            <td className="w-20 px-3 py-2 font-bold text-red-700">Row {r.rowNumber}</td>
                            <td className="px-3 py-2 text-slate-700">{r.errors.join(" ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(preview.invalidCount ?? 0) > invalid.length && (
                    <p className="mt-1 text-xs text-slate-500">Showing the first {invalid.length} of {preview.invalidCount}.</p>
                  )}
                </div>
              )}

              {/* Warnings (grants) */}
              {kind === "grants" && preview.warnings && preview.warnings.length > 0 && (
                <details className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                  <summary className="cursor-pointer font-bold text-amber-900">
                    {preview.warningRows} grant{preview.warningRows === 1 ? "" : "s"} with points to review (they will still import)
                  </summary>
                  <ul className="mt-2 space-y-1.5 text-amber-900">
                    {preview.warnings.map((w) => (
                      <li key={w.rowNumber}>
                        <b>Row {w.rowNumber}, {w.employeeName}:</b> {w.messages.join(" ")}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {/* Sample */}
              {preview.sample && preview.sample.length > 0 && (
                <details className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <summary className="cursor-pointer font-bold">Preview what will be saved (first {preview.sample.length})</summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-400">
                          {kind === "captable" ? (
                            <><th className="py-1.5">Row</th><th>Shareholder</th><th>Class</th><th className="text-right">Shares</th><th className="text-right">Date</th></>
                          ) : (
                            <><th className="py-1.5">Row</th><th>Employee</th><th>Status</th><th className="text-right">Options</th><th className="text-right">Granted</th><th className="text-right">Lapsed</th></>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sample.map((r) => (
                          <tr key={String(r.rowNumber)} className="border-b border-slate-50">
                            {kind === "captable" ? (
                              <>
                                <td className="py-1.5">{String(r.rowNumber)}</td>
                                <td>{String(r.holderName)}</td>
                                <td>{String(r.className)}</td>
                                <td className="text-right">{fmtNum(Number(r.quantity))}</td>
                                <td className="text-right">{fmtDate(String(r.date))}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-1.5">{String(r.rowNumber)}</td>
                                <td>{String(r.employeeName)}</td>
                                <td>{STATUS_LABEL[String(r.status)] ?? String(r.status)}</td>
                                <td className="text-right">{fmtNum(Number(r.options))}</td>
                                <td className="text-right">{fmtDate(String(r.grantDate))}</td>
                                <td className="text-right">{fmtNum(Number(r.optionsLapsed))}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <button type="button" className={BTN_DARK} disabled={!preview.ready || !!busy} onClick={() => void commit()}>
                  {busy === "commit" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Import {fmtNum(preview.validCount ?? 0)} rows
                </button>
                {!preview.ready && (
                  <p className="text-xs font-semibold text-slate-500">
                    Fix the problems above and upload the file again. Nothing has been saved.
                  </p>
                )}
                {kind === "grants" && preview.ready && (
                  <p className="text-xs text-slate-500">Grants are added as recorded in your file (issued, left, lapsed…).</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

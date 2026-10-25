"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";

export type ImportKind = "register" | "exercises" | "captable";

type Mode = "append" | "replace";
type Mapping = Record<string, number | null>;

type FieldInfo = { key: string; label: string; required: boolean };
type InvalidRow = { rowNumber: number; errors: string[] };

type PreviewResponse = {
  success: boolean;
  code?: string;
  message?: string;
  fileName?: string;
  headers?: string[];
  fields?: FieldInfo[];
  mapping?: Mapping;
  totalRows?: number;
  ready?: boolean;
  missingRequired?: string[];
  validCount?: number;
  invalidCount?: number;
  invalid?: InvalidRow[];
};

const TEMPLATES: Record<ImportKind, { file: string; csv: string }> = {
  register: {
    file: "esop-register-template.csv",
    csv:
      "Employee Name,Employee ID,Grant Date,Options Granted,Exercise Price,Vesting Period (Months),Cliff (Months),Expiry Date,Post-Exit Exercise Window (Days),Options Lapsed,Status,Date of Leaving\n" +
      "Asha Rao,E001,15/01/2023,10000,150,48,12,15/01/2033,90,0,Active,\n",
  },
  exercises: {
    file: "exercise-log-template.csv",
    csv:
      "Employee Name,Employee ID,Grant Date,Exercise Date,Options Exercised,Allotment Date,PAS-3 Filed On\n" +
      "Asha Rao,E001,15/01/2023,10/03/2025,2000,20/03/2025,15/04/2025\n",
  },
  captable: {
    file: "cap-table-template.csv",
    csv:
      "Shareholder Name,Holder Type,Number of Shares\n" +
      "Founder A,Founder,600000\n" +
      "Seed Fund,Investor,250000\n" +
      "ESOP Pool,ESOP Pool,150000\n",
  },
};

const REPLACE_WARNING: Record<ImportKind, string> = {
  register:
    "Replace removes the grants from earlier register imports, together with any exercises recorded against them.",
  exercises: "Replace clears this company's entire exercise log.",
  captable: "Replace clears this company's cap table.",
};

function downloadTemplate(kind: ImportKind) {
  const template = TEMPLATES[kind];
  const blob = new Blob([template.csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = template.file;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function ImportPanel({
  clientId,
  kind,
  title,
  description,
  existingCount,
  disabledReason,
  onImported,
}: {
  clientId: string;
  kind: ImportKind;
  title: string;
  description: string;
  existingCount: number;
  disabledReason?: string;
  onImported: () => void;
}) {
  const base =
    `/api/advisor/clients/${clientId}/import` +
    (kind === "register" ? "" : `/${kind}`);

  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [mode, setMode] = useState<Mode>("append");
  const [skipInvalid, setSkipInvalid] = useState(false);

  const [previewing, setPreviewing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  async function runPreview(f: File, m: Mapping | null, md: Mode) {
    const id = ++requestId.current;

    setPreviewing(true);
    setError("");

    try {
      const form = new FormData();
      form.append("file", f);
      form.append("mode", md);
      if (m) form.append("mapping", JSON.stringify(m));

      const res = await fetch(`${base}/preview`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const data = (await res.json()) as PreviewResponse;

      if (id !== requestId.current) return;

      if (!res.ok || !data.success) {
        setPreview(null);
        setError(data.message ?? "We could not read this file.");
        return;
      }

      setPreview(data);
      setMapping(data.mapping ?? {});
    } catch {
      if (id === requestId.current) {
        setPreview(null);
        setError("We could not read this file. Please try again.");
      }
    } finally {
      if (id === requestId.current) setPreviewing(false);
    }
  }

  function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = "";

    if (!chosen) return;

    setFile(chosen);
    setResult("");
    setSkipInvalid(false);
    void runPreview(chosen, null, mode);
  }

  function changeMapping(key: string, value: string) {
    if (!file) return;

    const next: Mapping = {
      ...mapping,
      [key]: value === "" ? null : Number(value),
    };

    setMapping(next);
    setSkipInvalid(false);
    void runPreview(file, next, mode);
  }

  function changeMode(next: Mode) {
    setMode(next);
    if (file) void runPreview(file, mapping, next);
  }

  async function commit() {
    if (!file || !preview?.ready) return;

    setCommitting(true);
    setError("");
    setResult("");

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mapping", JSON.stringify(mapping));
      form.append("mode", mode);
      form.append("skipInvalid", String(skipInvalid));

      const res = await fetch(`${base}/commit`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? "We could not import this file.");
        return;
      }

      const imported = Number(data.imported ?? 0);
      const skipped = Number(data.skipped ?? 0);

      setResult(
        `Imported ${imported} row${imported === 1 ? "" : "s"}` +
          (skipped > 0 ? `, skipped ${skipped} with problems.` : ".")
      );

      setFile(null);
      setPreview(null);
      setMapping({});
      setSkipInvalid(false);
      setMode("append");

      onImported();
    } catch {
      setError("We could not import this file. Please try again.");
    } finally {
      setCommitting(false);
    }
  }

  const invalidCount = preview?.invalidCount ?? 0;
  const validCount = preview?.validCount ?? 0;

  const canCommit =
    Boolean(preview?.ready) &&
    validCount > 0 &&
    (invalidCount === 0 || skipInvalid) &&
    !previewing &&
    !committing;

  if (disabledReason) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
        <div className="flex items-start gap-3">
          <FileSpreadsheet size={20} className="mt-0.5 text-slate-400" />
          <div>
            <h3 className="text-base font-black text-slate-700">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{disabledReason}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <FileSpreadsheet size={20} />
          </span>

          <div>
            <h3 className="text-base font-black">{title}</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
            existingCount > 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          {existingCount > 0
            ? `${existingCount} row${existingCount === 1 ? "" : "s"} on file`
            : "Nothing imported"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          onChange={onFileChosen}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={previewing || committing}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          <Upload size={14} />
          {file ? "Choose a different file" : "Choose file (.xlsx or .csv)"}
        </button>

        <button
          type="button"
          onClick={() => downloadTemplate(kind)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-slate-300"
        >
          <Download size={14} />
          Download template
        </button>

        {file && (
          <span className="truncate text-xs font-semibold text-slate-500">
            {file.name}
          </span>
        )}

        {previewing && (
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 size={13} className="animate-spin" />
            Reading file...
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={15} />
          {result}
        </div>
      )}

      {preview && preview.headers && preview.fields && (
        <div className="mt-6 space-y-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Column matching
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Columns were matched automatically. Change any that look wrong.
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {preview.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-xs font-bold text-slate-700">
                    {field.label}
                    {field.required && (
                      <span className="ml-1 text-red-600">*</span>
                    )}
                  </span>

                  <select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => changeMapping(field.key, e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">Not in this file</option>
                    {preview.headers!.map((header, index) => (
                      <option key={index} value={index}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          {preview.ready === false &&
            (preview.missingRequired?.length ?? 0) > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>
                  Choose a column for: {preview.missingRequired!.join(", ")}.
                </span>
              </div>
            )}

          {preview.ready && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Summary label="Rows in file" value={preview.totalRows ?? 0} />
                <Summary label="Ready to import" value={validCount} good />
                <Summary
                  label="With problems"
                  value={invalidCount}
                  bad={invalidCount > 0}
                />
              </div>

              {invalidCount > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Rows with problems
                  </p>

                  <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-red-100 bg-red-50/50 p-3">
                    {(preview.invalid ?? []).map((row) => (
                      <p
                        key={row.rowNumber}
                        className="text-xs leading-5 text-red-800"
                      >
                        <span className="font-black">Row {row.rowNumber}:</span>{" "}
                        {row.errors.join("; ")}
                      </p>
                    ))}

                    {invalidCount > (preview.invalid?.length ?? 0) && (
                      <p className="text-xs font-semibold text-red-700">
                        and {invalidCount - (preview.invalid?.length ?? 0)} more
                      </p>
                    )}
                  </div>

                  <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={skipInvalid}
                      onChange={(e) => setSkipInvalid(e.target.checked)}
                      className="mt-0.5"
                    />
                    Skip these {invalidCount} row
                    {invalidCount === 1 ? "" : "s"} and import the rest. Fixing
                    the file and uploading it again is safer.
                  </label>
                </div>
              )}

              {existingCount > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    What to do with the {existingCount} existing row
                    {existingCount === 1 ? "" : "s"}
                  </p>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <ModeOption
                      active={mode === "append"}
                      title="Add to existing"
                      text="Keep what is already there."
                      onClick={() => changeMode("append")}
                    />
                    <ModeOption
                      active={mode === "replace"}
                      title="Replace existing"
                      text={REPLACE_WARNING[kind]}
                      onClick={() => changeMode("replace")}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => void commit()}
                disabled={!canCommit}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {committing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    Import {validCount} row{validCount === 1 ? "" : "s"}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Summary({
  label,
  value,
  good = false,
  bad = false,
}: {
  label: string;
  value: number;
  good?: boolean;
  bad?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-3 ${
        bad ? "bg-red-50" : good ? "bg-emerald-50" : "bg-slate-50"
      }`}
    >
      <p
        className={`text-xl font-black leading-none ${
          bad ? "text-red-700" : good ? "text-emerald-700" : "text-slate-950"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function ModeOption({
  active,
  title,
  text,
  onClick,
}: {
  active: boolean;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${
        active
          ? "border-slate-950 bg-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <p className="text-xs font-black text-slate-950">{title}</p>
      <p className="mt-1 text-[11px] leading-4 text-slate-500">{text}</p>
    </button>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Download, Loader2, Repeat, Trash2 } from "lucide-react";

import { useJurisdiction } from "@/components/company/JurisdictionContext";
import { BTN_DARK, BTN_LIGHT, CARD, INPUT, LABEL, fmtDate, readJson, todayIso } from "@/components/company/ui";
import { formatMoney, formatNumber, formatPrice } from "@/lib/jurisdiction";

type Obligation = {
  code: string;
  label: string;
  due: string | null;
  done: string | null;
  status: "DONE" | "OVERDUE" | "DUE" | "TODO" | "INFO";
  note: string;
};

type Row = {
  id: string;
  employeeName: string;
  employeeEmail: string | null;
  schemeName: string;
  grantDate: string | null;
  usOptionType: "ISO" | "NSO" | null;
  exerciseDate: string | null;
  options: number;
  exercisePrice: number;
  amountPayable: number;
  fmvPerShare: number | null;
  perquisite: number | null;
  allotmentDate: string | null;
  className: string | null;
  pas3FiledOn: string | null;
  pas3Srn: string | null;
  shareCertificateOn: string | null;
  tdsDeferred: boolean;
  tdsAmount: number | null;
  tdsDeductedOn: string | null;
  tdsDepositedOn: string | null;
  tdsChallanRef: string | null;
  form3921FurnishedOn: string | null;
  form3921FiledOn: string | null;
  note: string | null;
  obligations: Obligation[];
};

type ClassRow = { id: string; name: string; kind: string };

const CHIP: Record<Obligation["status"], string> = {
  DONE: "bg-emerald-50 text-emerald-700",
  OVERDUE: "bg-red-50 text-red-700",
  DUE: "bg-amber-50 text-amber-800",
  TODO: "bg-slate-100 text-slate-600",
  INFO: "bg-blue-50 text-blue-700",
};
const STATUS_WORD: Record<Obligation["status"], string> = { DONE: "Done", OVERDUE: "Overdue", DUE: "Due", TODO: "To do", INFO: "Note" };

export default function ExercisesPanel() {
  const j = useJurisdiction();
  const us = j === "US";
  const [rows, setRows] = useState<Row[] | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [counts, setCounts] = useState({ overdue: 0, due: 0, todo: 0 });
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/company/exercises", { credentials: "include", cache: "no-store" });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not load exercises.");
      setError("");
      setRows(json.exercises as Row[]);
      setClasses(json.classes as ClassRow[]);
      setCounts(json.counts);
      setCanEdit(Boolean(json.canEdit));
    } catch {
      setError("We could not connect. Please retry.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <section className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Repeat size={18} /> Exercises and {us ? "share issuance" : "allotment"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Record an exercise from a grant (Grants tab, open the grant, &quot;Record exercise&quot;). {us ? "Issuing" : "Allotting"} the shares adds
              them to the cap table. Each exercise lists what has to be filed and by when:{" "}
              {us ? "Form 3921 for ISOs, payroll withholding for NSOs." : "PAS-3, share certificate or demat credit, and TDS on the perquisite."}
            </p>
          </div>
          <a href="/api/company/exercises/export" className={BTN_LIGHT}>
            <Download size={14} /> Excel{us ? " (with Form 3921 data)" : ""}
          </a>
        </div>
        {rows && rows.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
            <span className={`rounded-full px-3 py-1 ${counts.overdue ? CHIP.OVERDUE : CHIP.DONE}`}>{counts.overdue} overdue</span>
            <span className={`rounded-full px-3 py-1 ${CHIP.DUE}`}>{counts.due} due</span>
            <span className={`rounded-full px-3 py-1 ${CHIP.TODO}`}>{counts.todo} to do</span>
          </div>
        )}
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      </section>

      {rows === null && !error && (
        <div className={`${CARD} flex items-center gap-3`}>
          <Loader2 className="animate-spin text-blue-600" size={18} />
          <span className="text-sm font-bold">Loading exercises</span>
        </div>
      )}
      {rows?.length === 0 && <div className={`${CARD} text-sm text-slate-500`}>No exercises yet.</div>}

      {rows?.map((r) => (
        <section key={r.id} className={CARD}>
          <div className="flex w-full flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-black">
                {r.employeeName} · {formatNumber(r.options, j)} options on {fmtDate(r.exerciseDate)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {r.schemeName}
                {us && r.usOptionType ? ` · ${r.usOptionType}` : ""} · {us ? "strike" : "exercise price"} {formatPrice(r.exercisePrice, j)} · payable{" "}
                {formatMoney(r.amountPayable, j, { decimals: us ? 2 : 0 })}
                {r.perquisite !== null ? ` · ${us ? "spread" : "perquisite"} ${formatMoney(r.perquisite, j, { decimals: us ? 2 : 0 })}` : ""}
                {r.allotmentDate ? ` · ${us ? "issued" : "allotted"} ${fmtDate(r.allotmentDate)} (${r.className})` : ` · not yet ${us ? "issued" : "allotted"}`}
              </p>
            </div>
            <button type="button" className={open === r.id ? BTN_LIGHT : BTN_DARK} onClick={() => setOpen(open === r.id ? null : r.id)}>
              {open === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {open === r.id ? "Close" : canEdit ? (r.allotmentDate ? "Record filings" : us ? "Issue shares / record filings" : "Allot shares / record filings") : "Details"}
            </button>
          </div>

          {open === r.id && <ExerciseEditor row={r} classes={classes} canEdit={canEdit} onSaved={() => void load()} />}

          <ul className="mt-4 space-y-2">
            {r.obligations.map((o) => (
              <li key={o.code} className="flex flex-wrap items-start gap-2 text-sm">
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black ${CHIP[o.status]}`}>{STATUS_WORD[o.status]}</span>
                <span className="font-semibold">
                  {o.label}
                  {o.due && o.status !== "DONE" ? ` by ${fmtDate(o.due)}` : ""}
                  {o.done ? ` (done ${fmtDate(o.done)})` : ""}
                </span>
                <span className="basis-full pl-[60px] text-xs text-slate-500">{o.note}</span>
              </li>
            ))}
          </ul>

        </section>
      ))}

      <p className="text-xs leading-5 text-slate-400">
        Due dates come from secondary sources and are marked verify: confirm them with your {us ? "lawyer or payroll provider" : "CS and CA"}.
      </p>
    </div>
  );
}

function ExerciseEditor({ row, classes, canEdit, onSaved }: { row: Row; classes: ClassRow[]; canEdit: boolean; onSaved: () => void }) {
  const j = useJurisdiction();
  const us = j === "US";
  const [f, setF] = useState({
    fmvPerShare: row.fmvPerShare?.toString() ?? "",
    pas3FiledOn: row.pas3FiledOn ?? "",
    pas3Srn: row.pas3Srn ?? "",
    shareCertificateOn: row.shareCertificateOn ?? "",
    tdsDeferred: row.tdsDeferred,
    tdsAmount: row.tdsAmount?.toString() ?? "",
    tdsDeductedOn: row.tdsDeductedOn ?? "",
    tdsDepositedOn: row.tdsDepositedOn ?? "",
    tdsChallanRef: row.tdsChallanRef ?? "",
    form3921FurnishedOn: row.form3921FurnishedOn ?? "",
    form3921FiledOn: row.form3921FiledOn ?? "",
    note: row.note ?? "",
  });
  const equity = classes.filter((c) => c.kind === "EQUITY");
  const [allotDate, setAllotDate] = useState(todayIso());
  const [classId, setClassId] = useState(equity[0]?.id ?? classes[0]?.id ?? "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/,/g, "")));
  const dt = (v: string) => (v ? v : null);

  async function send(method: "PATCH" | "DELETE", body?: unknown, tag = "save") {
    setBusy(tag);
    setError("");
    try {
      const res = await fetch(`/api/company/exercises/${row.id}`, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "That did not work. Please retry.");
      onSaved();
    } catch {
      setError("That did not work. Please retry.");
    } finally {
      setBusy("");
    }
  }

  function save() {
    void send("PATCH", {
      fmvPerShare: num(f.fmvPerShare),
      shareCertificateOn: dt(f.shareCertificateOn),
      note: f.note || null,
      ...(us
        ? { form3921FurnishedOn: dt(f.form3921FurnishedOn), form3921FiledOn: dt(f.form3921FiledOn) }
        : {
            pas3FiledOn: dt(f.pas3FiledOn),
            pas3Srn: f.pas3Srn || null,
            tdsDeferred: f.tdsDeferred,
            tdsAmount: num(f.tdsAmount),
            tdsDeductedOn: dt(f.tdsDeductedOn),
            tdsDepositedOn: dt(f.tdsDepositedOn),
            tdsChallanRef: f.tdsChallanRef || null,
          }),
    });
  }

  const field = (key: keyof typeof f, label: string, type: "date" | "text" = "date") => (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input
        type={type}
        disabled={!canEdit}
        className={`${INPUT} mt-1`}
        value={f[key] as string}
        onChange={(e) => setF({ ...f, [key]: e.target.value })}
      />
    </label>
  );

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      {!row.allotmentDate && canEdit && (
        <div className="mb-5 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-black">{us ? "Issue the shares" : "Allot the shares"}</p>
          {classes.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Add a share class on the Cap table tab first.</p>
          ) : (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className={LABEL}>{us ? "Issue date" : "Allotment date"}</span>
                <input type="date" min={row.exerciseDate ?? undefined} max={todayIso()} className={`${INPUT} mt-1 w-44`} value={allotDate} onChange={(e) => setAllotDate(e.target.value)} />
              </label>
              <label className="block">
                <span className={LABEL}>Class</span>
                <select className={`${INPUT} mt-1 w-56`} value={classId} onChange={(e) => setClassId(e.target.value)}>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className={BTN_DARK} disabled={!!busy || !classId} onClick={() => void send("PATCH", { allot: { date: allotDate, classId } }, "allot")}>
                {busy === "allot" && <Loader2 size={14} className="animate-spin" />}
                {us ? "Issue" : "Allot"} {formatNumber(row.options, j)} shares
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Adds {row.employeeName} to the {us ? "stockholder" : "shareholder"} list if needed and records the {us ? "issuance" : "allotment"} on the cap table.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className={LABEL}>{us ? "FMV per share on exercise date" : "Value per share on exercise date (FMV)"}</span>
          <input disabled={!canEdit} inputMode="decimal" className={`${INPUT} mt-1`} value={f.fmvPerShare} onChange={(e) => setF({ ...f, fmvPerShare: e.target.value })} />
        </label>
        {field("shareCertificateOn", us ? "Stock certificate / ledger entry on" : "Share certificate issued / demat credit on")}
        {us ? (
          <>
            {row.usOptionType === "ISO" && field("form3921FurnishedOn", "Form 3921 Copy B given to employee on")}
            {row.usOptionType === "ISO" && field("form3921FiledOn", "Form 3921 Copy A filed with IRS on")}
          </>
        ) : (
          <>
            {field("pas3FiledOn", "PAS-3 filed on")}
            {field("pas3Srn", "PAS-3 SRN", "text")}
            <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
              <input type="checkbox" disabled={!canEdit} checked={f.tdsDeferred} onChange={(e) => setF({ ...f, tdsDeferred: e.target.checked })} />
              TDS deferred (eligible start-up with IMB certificate)
            </label>
            {field("tdsAmount", "TDS amount (Rs.)", "text")}
            {field("tdsDeductedOn", "TDS deducted on")}
            {field("tdsDepositedOn", "TDS deposited on")}
            {field("tdsChallanRef", "Challan / BSR reference", "text")}
          </>
        )}
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={LABEL}>Note</span>
          <input disabled={!canEdit} className={`${INPUT} mt-1`} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </label>
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-600">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      {canEdit && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={BTN_DARK} disabled={!!busy} onClick={save}>
            {busy === "save" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save
          </button>
          <button
            type="button"
            className={BTN_LIGHT}
            disabled={!!busy}
            onClick={() => {
              if (window.confirm(`Undo this exercise? ${row.allotmentDate ? `The ${us ? "issued" : "allotted"} shares are removed from the cap table and ` : ""}the options go back to the grant.`)) {
                void send("DELETE", undefined, "undo");
              }
            }}
          >
            {busy === "undo" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Undo exercise
          </button>
        </div>
      )}
    </div>
  );
}

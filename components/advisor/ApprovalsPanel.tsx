"use client";

import { useState } from "react";
import { FileCheck2, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";

import type {
  ClientDetail,
  ResolutionRow,
  ValuationRow,
} from "@/components/advisor/types";

const INPUT =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const KIND_LABEL: Record<ResolutionRow["kind"], string> = {
  BOARD_SCHEME_APPROVAL: "Board approval of the scheme",
  SHAREHOLDER_SCHEME_APPROVAL: "Shareholder approval of the scheme",
};

const VOTE_LABEL: Record<ResolutionRow["vote"], string> = {
  ORDINARY: "Ordinary resolution",
  SPECIAL: "Special resolution",
};

function fmtDate(value: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function addDays(value: string, days: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return fmtDate(new Date(date.getTime() + days * 86_400_000).toISOString());
}

async function readJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function ApprovalsPanel({
  client,
  onChanged,
}: {
  client: ClientDetail;
  onChanged: () => void;
}) {
  return (
    <div className="space-y-5">
      <ResolutionsSection
        clientId={client.id}
        items={client.resolutions}
        onChanged={onChanged}
      />

      <ValuationsSection
        clientId={client.id}
        items={client.valuations}
        onChanged={onChanged}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Resolutions                                                         */
/* ------------------------------------------------------------------ */

function ResolutionsSection({
  clientId,
  items,
  onChanged,
}: {
  clientId: string;
  items: ResolutionRow[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    kind: "SHAREHOLDER_SCHEME_APPROVAL" as ResolutionRow["kind"],
    vote: "SPECIAL" as ResolutionRow["vote"],
    passedOn: "",
    mgt14: "",
    statement: false,
  });

  async function add() {
    if (!form.passedOn) {
      setError("Enter the date the resolution was passed.");
      return;
    }

    if (form.mgt14 && form.mgt14 < form.passedOn) {
      setError("The MGT-14 date cannot be before the resolution date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/resolutions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.kind,
          vote: form.vote,
          passedOn: form.passedOn,
          mgt14Filed: form.mgt14 || null,
          explanatoryStatementOnFile: form.statement,
        }),
      });

      const data = await readJson(res);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? "We could not save this resolution.");
        return;
      }

      setOpen(false);
      setForm((f) => ({ ...f, passedOn: "", mgt14: "", statement: false }));
      onChanged();
    } catch {
      setError("We could not save this resolution. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeletingId(id);
    setError("");

    try {
      const res = await fetch(
        `/api/advisor/clients/${clientId}/resolutions/${id}`,
        { method: "DELETE", credentials: "include" }
      );

      const data = await readJson(res);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? "We could not remove this resolution.");
        return;
      }

      setConfirmId(null);
      onChanged();
    } catch {
      setError("We could not remove this resolution. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <ShieldCheck size={20} />
          </span>

          <div>
            <h3 className="text-base font-black">Scheme approvals</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              Record the resolutions that approved the ESOP scheme. The
              checks use the shareholder approval to test grant dates, the
              vote type and the MGT-14 filing. A board approval is kept for
              the record only.
            </p>
          </div>
        </div>

        {!open && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
          >
            <Plus size={14} />
            Add resolution
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
          {error}
        </div>
      )}

      {open && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Approval">
              <select
                value={form.kind}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    kind: e.target.value as ResolutionRow["kind"],
                  }))
                }
                className={INPUT}
              >
                <option value="SHAREHOLDER_SCHEME_APPROVAL">
                  Shareholder approval
                </option>
                <option value="BOARD_SCHEME_APPROVAL">Board approval</option>
              </select>
            </Field>

            <Field label="Type of resolution">
              <select
                value={form.vote}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    vote: e.target.value as ResolutionRow["vote"],
                  }))
                }
                className={INPUT}
              >
                <option value="SPECIAL">Special resolution</option>
                <option value="ORDINARY">Ordinary resolution</option>
              </select>
            </Field>

            <Field label="Date passed">
              <input
                type="date"
                value={form.passedOn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, passedOn: e.target.value }))
                }
                className={INPUT}
              />
            </Field>

            <Field label="MGT-14 filed on (if filed)">
              <input
                type="date"
                value={form.mgt14}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mgt14: e.target.value }))
                }
                className={INPUT}
              />
            </Field>
          </div>

          <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.statement}
              onChange={(e) =>
                setForm((f) => ({ ...f, statement: e.target.checked }))
              }
              className="mt-0.5"
            />
            The Rule 12 explanatory statement is on file for this resolution
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void add()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save resolution"
              )}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No resolutions recorded. The report will list the missing
          shareholder approval as an open item.
        </p>
      ) : (
        <div className="mt-5 space-y-2">
          {items.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-black">
                  {KIND_LABEL[r.kind]}
                  <span className="ml-2 text-xs font-semibold text-slate-500">
                    {VOTE_LABEL[r.vote]}
                  </span>
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Passed {fmtDate(r.passedOn)}
                  {"  |  "}
                  MGT-14:{" "}
                  {r.mgt14Filed
                    ? `filed ${fmtDate(r.mgt14Filed)}`
                    : "not recorded"}
                  {"  |  "}
                  Explanatory statement:{" "}
                  {r.explanatoryStatementOnFile ? "on file" : "not confirmed"}
                </p>
              </div>

              {confirmId === r.id ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    disabled={deletingId === r.id}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => void remove(r.id)}
                    disabled={deletingId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deletingId === r.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(r.id)}
                  aria-label="Remove resolution"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Valuations                                                          */
/* ------------------------------------------------------------------ */

function ValuationsSection({
  clientId,
  items,
  onChanged,
}: {
  clientId: string;
  items: ValuationRow[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: "",
    fmv: "",
    valuer: "",
    signed: false,
    reference: "",
  });

  async function add() {
    if (!form.date) {
      setError("Enter the valuation date.");
      return;
    }

    const fmv = Number(form.fmv.replace(/,/g, ""));

    if (!Number.isFinite(fmv) || fmv <= 0) {
      setError("Enter the FMV per share as a number more than zero.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/valuations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valuationDate: form.date,
          fmvPerShare: fmv,
          valuerName: form.valuer.trim() || null,
          signedBySebiCat1MerchantBanker: form.signed,
          reference: form.reference.trim() || null,
        }),
      });

      const data = await readJson(res);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? "We could not save this valuation.");
        return;
      }

      setOpen(false);
      setForm({ date: "", fmv: "", valuer: "", signed: false, reference: "" });
      onChanged();
    } catch {
      setError("We could not save this valuation. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeletingId(id);
    setError("");

    try {
      const res = await fetch(
        `/api/advisor/clients/${clientId}/valuations/${id}`,
        { method: "DELETE", credentials: "include" }
      );

      const data = await readJson(res);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? "We could not remove this valuation.");
        return;
      }

      setConfirmId(null);
      onChanged();
    } catch {
      setError("We could not remove this valuation. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <FileCheck2 size={20} />
          </span>

          <div>
            <h3 className="text-base font-black">
              Valuation reports (FMV)
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              Enter each merchant banker report. For every exercise the check
              uses the latest report dated on or before the exercise date,
              and tests its age and signatory.
            </p>
          </div>
        </div>

        {!open && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
          >
            <Plus size={14} />
            Add valuation
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
          {error}
        </div>
      )}

      {open && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Valuation date">
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className={INPUT}
              />
            </Field>

            <Field label="FMV per share (₹)">
              <input
                value={form.fmv}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fmv: e.target.value }))
                }
                inputMode="decimal"
                placeholder="e.g. 450"
                className={INPUT}
              />
            </Field>

            <Field label="Valuer (merchant banker)">
              <input
                value={form.valuer}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valuer: e.target.value }))
                }
                maxLength={200}
                className={INPUT}
              />
            </Field>

            <Field label="Report reference (optional)">
              <input
                value={form.reference}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reference: e.target.value }))
                }
                maxLength={200}
                className={INPUT}
              />
            </Field>
          </div>

          <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.signed}
              onChange={(e) =>
                setForm((f) => ({ ...f, signed: e.target.checked }))
              }
              className="mt-0.5"
            />
            Signed by a SEBI-registered Category I merchant banker
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void add()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save valuation"
              )}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No valuations recorded. Every exercise will be reported as having
          no valuation on or before its date.
        </p>
      ) : (
        <div className="mt-5 space-y-2">
          {items.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-black">
                  {fmtDate(v.valuationDate)}
                  <span className="ml-2 text-xs font-semibold text-slate-500">
                    ₹{v.fmvPerShare.toLocaleString("en-IN")} per share
                  </span>
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {v.valuerName ? `${v.valuerName}  |  ` : ""}
                  {v.signedBySebiCat1MerchantBanker
                    ? "Category I merchant banker"
                    : "Not marked as signed by a Category I merchant banker"}
                  {v.reference ? `  |  Ref ${v.reference}` : ""}
                </p>

                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  Covers exercises up to {addDays(v.valuationDate, 180)} (180
                  days; rule awaiting verification)
                </p>
              </div>

              {confirmId === v.id ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    disabled={deletingId === v.id}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => void remove(v.id)}
                    disabled={deletingId === v.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deletingId === v.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(v.id)}
                  aria-label="Remove valuation"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
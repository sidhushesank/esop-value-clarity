"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, Save } from "lucide-react";

import type { ClientDetail, CompanyType } from "@/components/advisor/types";

type Tri = "" | "yes" | "no";

function toTri(value: boolean | null): Tri {
  if (value === null) return "";
  return value ? "yes" : "no";
}

function fromTri(value: Tri): boolean | null {
  if (value === "") return null;
  return value === "yes";
}

const INPUT =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function ClientDetailsPanel({
  client,
  onSaved,
}: {
  client: ClientDetail;
  onSaved: () => void;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: client.name,
    cin: client.cin ?? "",
    type: client.companyType as CompanyType,
    incorporation: client.incorporationDate
      ? client.incorporationDate.slice(0, 10)
      : "",
    pool: client.approvedPoolSize ? String(client.approvedPoolSize) : "",
    dpiit: toTri(client.dpiitRecognised),
    imb: toTri(client.imbCertificate),
    overseas: toTri(client.overseasParent),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function save() {
    const name = form.name.trim();

    if (!name) {
      setError("Enter the company name.");
      return;
    }

    let pool: number | null = null;

    if (form.pool.trim()) {
      const parsed = Number(form.pool.replace(/,/g, ""));

      if (!Number.isInteger(parsed) || parsed <= 0) {
        setError("Approved pool must be a whole number of options.");
        return;
      }

      pool = parsed;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/advisor/clients/${client.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cin: form.cin.trim() || null,
          companyType: form.type,
          incorporationDate: form.incorporation || null,
          approvedPoolSize: pool,
          dpiitRecognised: fromTri(form.dpiit),
          imbCertificate: fromTri(form.imb),
          overseasParent: fromTri(form.overseas),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? "We could not save the changes.");
        return;
      }

      setMessage("Saved.");
      onSaved();
    } catch {
      setError("We could not save the changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    setArchiving(true);
    setError("");

    try {
      const res = await fetch(`/api/advisor/clients/${client.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? "We could not archive this company.");
        setConfirmArchive(false);
        return;
      }

      router.push("/advisor");
    } catch {
      setError("We could not archive this company. Please try again.");
      setConfirmArchive(false);
    } finally {
      setArchiving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
        Company details
      </p>
      <h2 className="mt-2 text-xl font-black tracking-tight">
        About this company
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        These answers feed the checks. Leave a question as &quot;Not
        answered&quot; if you do not know yet; the report will list it as
        open instead of guessing.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Company name">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={200}
            className={INPUT}
          />
        </Field>

        <Field label="CIN">
          <input
            value={form.cin}
            onChange={(e) => setForm((f) => ({ ...f, cin: e.target.value }))}
            maxLength={30}
            className={INPUT}
          />
        </Field>

        <Field label="Company type">
          <select
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as CompanyType }))
            }
            className={INPUT}
          >
            <option value="PRIVATE_LIMITED">Private limited</option>
            <option value="UNLISTED_PUBLIC">Unlisted public</option>
          </select>
        </Field>

        <Field label="Date of incorporation">
          <input
            type="date"
            value={form.incorporation}
            onChange={(e) =>
              setForm((f) => ({ ...f, incorporation: e.target.value }))
            }
            className={INPUT}
          />
        </Field>

        <Field label="Approved ESOP pool (options)">
          <input
            value={form.pool}
            onChange={(e) => setForm((f) => ({ ...f, pool: e.target.value }))}
            inputMode="numeric"
            placeholder="e.g. 150000"
            className={INPUT}
          />
        </Field>

        <Field label="DPIIT recognised startup">
          <TriSelect
            value={form.dpiit}
            onChange={(v) => setForm((f) => ({ ...f, dpiit: v }))}
          />
        </Field>

        <Field label="Inter-Ministerial Board (80-IAC) certificate">
          <TriSelect
            value={form.imb}
            onChange={(v) => setForm((f) => ({ ...f, imb: v }))}
          />
        </Field>

        <Field label="Has an overseas parent or holding company">
          <TriSelect
            value={form.overseas}
            onChange={(v) => setForm((f) => ({ ...f, overseas: v }))}
          />
        </Field>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
          {error}
        </div>
      )}

      {message && !error && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
          {message}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={15} />
              Save changes
            </>
          )}
        </button>

        {confirmArchive ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Archive this company?
            </span>

            <button
              type="button"
              onClick={() => setConfirmArchive(false)}
              disabled={archiving}
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void archive()}
              disabled={archiving}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3.5 py-2.5 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {archiving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Archive size={13} />
              )}
              Confirm archive
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmArchive(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600 transition hover:border-red-200 hover:text-red-700"
          >
            <Archive size={14} />
            Archive company
          </button>
        )}
      </div>

      <p className="mt-3 text-[11px] font-semibold text-slate-400">
        Archiving hides the company and switches off its share links. Its
        history is kept.
      </p>
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

function TriSelect({
  value,
  onChange,
}: {
  value: Tri;
  onChange: (value: Tri) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Tri)}
      className={INPUT}
    >
      <option value="">Not answered</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
}
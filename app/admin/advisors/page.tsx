"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";

type FirmRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "EXPIRED";
  isFounder: boolean;
  isCurrentlyActive: boolean;
  clientLimit: number;
  activeClients: number;
  source: string;
  grantReason: string | null;
  paymentReference: string | null;
  startedAt: string;
  expiresAt: string;
  owner: { id: string; name: string | null; email: string };
};

type ListResponse = {
  success: boolean;
  message?: string;
  summary: {
    totalFirms: number;
    activeFirms: number;
    expiredFirms: number;
    paidPayments: number;
    revenuePaise: number;
  };
  defaults: { clientLimit: number; pricePaise: number };
  pagination: { page: number; totalPages: number; total: number };
  firms: FirmRow[];
};

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function rupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function daysLeft(value: string) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

const DURATIONS = [
  { label: "1 month (trial)", months: 1 },
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "12 months", months: 12 },
  { label: "24 months", months: 24 },
];

type FormState = {
  ownerEmail: string;
  firmName: string;
  clientLimit: string;
  mode: "MONTHS" | "DATE";
  months: string;
  date: string;
  paymentReference: string;
  reason: string;
  sendEmail: boolean;
};

export default function AdminAdvisorsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm(25));
  const [dialog, setDialog] = useState<
    { type: "LIMIT" | "REVOKE"; firm: FirmRow } | null
  >(null);
  const [limitInput, setLimitInput] = useState("");

  function emptyForm(limit: number): FormState {
    return {
      ownerEmail: "",
      firmName: "",
      clientLimit: String(limit),
      mode: "MONTHS",
      months: "12",
      date: "",
      paymentReference: "",
      reason: "",
      sendEmail: true,
    };
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        status,
      });
      if (query) params.set("search", query);

      const res = await fetch(`/api/admin/advisors?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await res.json()) as ListResponse;

      if (!res.ok || !json.success) {
        throw new Error(json.message ?? "Could not load Advisor firms.");
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load Advisor firms.");
    } finally {
      setLoading(false);
    }
  }, [page, status, query]);

  useEffect(() => {
    void load();
  }, [load]);

  function openGrant(firm?: FirmRow) {
    const limit = data?.defaults.clientLimit ?? 25;
    setFormError("");
    setForm(
      firm
        ? {
            ...emptyForm(firm.clientLimit),
            ownerEmail: firm.owner.email,
            firmName: firm.name,
          }
        : emptyForm(limit)
    );
    setOpen(true);
  }

  async function submitGrant(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError("");

    try {
      const payload: Record<string, unknown> = {
        ownerEmail: form.ownerEmail,
        firmName: form.firmName,
        clientLimit: form.clientLimit,
        paymentReference: form.paymentReference,
        reason: form.reason,
        sendEmail: form.sendEmail,
      };
      if (form.mode === "MONTHS") payload.durationMonths = Number(form.months);
      else payload.expiresAt = form.date ? `${form.date}T23:59:59+05:30` : "";

      const res = await fetch("/api/admin/advisors", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message ?? "Could not save.");
      }

      setOpen(false);
      setNotice(
        `${json.message} ${
          form.sendEmail
            ? json.emailSent
              ? "Email sent to the firm."
              : "Email could not be sent. Check SMTP settings."
            : ""
        }`.trim()
      );
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function patchFirm(
    firm: FirmRow,
    body: Record<string, unknown>,
    okMessage: string
  ) {
    setNotice("");
    setError("");
    try {
      const res = await fetch(`/api/admin/advisors/${firm.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? "Could not save.");
      }
      setNotice(okMessage);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    }
  }

  function changeLimit(firm: FirmRow) {
    setLimitInput(String(firm.clientLimit));
    setDialog({ type: "LIMIT", firm });
  }

  function revoke(firm: FirmRow) {
    setDialog({ type: "REVOKE", firm });
  }

  async function confirmDialog() {
    if (!dialog) return;
    const { type, firm } = dialog;
    setDialog(null);
    if (type === "LIMIT") {
      await patchFirm(
        firm,
        { action: "UPDATE", clientLimit: Number(limitInput) },
        "Client limit updated."
      );
    } else {
      await patchFirm(
        firm,
        { action: "REVOKE", sendEmail: false },
        "Access revoked."
      );
    }
  }

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Advisors</h1>
          <p className="mt-1 text-sm text-slate-500">
            CA / CS firms on the Advisor plan. Grant or extend access after a
            payment, trial or meeting.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openGrant()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <Plus size={16} /> Grant access
        </button>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Firms", s?.totalFirms ?? "–"],
          ["Active now", s?.activeFirms ?? "–"],
          ["Lapsed / locked", s?.expiredFirms ?? "–"],
          ["Self-serve revenue", s ? rupees(s.revenuePaise) : "–"],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
        className="flex flex-wrap gap-3"
      >
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search firm, owner, email or payment reference"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
        >
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Lapsed</option>
        </select>
        <button
          type="submit"
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold hover:bg-slate-50"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Firm / owner</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Ends</th>
              <th className="px-4 py-3">Clients</th>
              <th className="px-4 py-3">Source / reference</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  <Loader2 className="mx-auto animate-spin" size={20} />
                </td>
              </tr>
            )}
            {!loading && data?.firms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No Advisor firms yet.
                </td>
              </tr>
            )}
            {!loading &&
              data?.firms.map((f) => {
                const left = daysLeft(f.expiresAt);
                return (
                  <tr key={f.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-bold">{f.name}</p>
                      <p className="text-xs text-slate-500">
                        {f.owner.name ? `${f.owner.name} · ` : ""}
                        {f.owner.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {f.isFounder ? (
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                          Founder · unlimited
                        </span>
                      ) : f.isCurrentlyActive ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                          Locked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {f.isFounder ? (
                        "–"
                      ) : (
                        <>
                          <p className="font-semibold">{fmtDate(f.expiresAt)}</p>
                          {f.isCurrentlyActive && (
                            <p className="text-xs text-slate-500">
                              {left} day{left === 1 ? "" : "s"} left
                            </p>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {f.activeClients} /{" "}
                      {f.isFounder ? "∞" : f.clientLimit}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p className="font-semibold">
                        {f.source === "PAYMENT" ? "Self-serve payment" : "Granted by founder"}
                      </p>
                      {f.paymentReference && (
                        <p className="break-all text-slate-500">{f.paymentReference}</p>
                      )}
                      {f.grantReason && (
                        <p className="text-slate-500">{f.grantReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!f.isFounder && (
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openGrant(f)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50"
                          >
                            Extend
                          </button>
                          <button
                            type="button"
                            onClick={() => changeLimit(f)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50"
                          >
                            Limit
                          </button>
                          {f.isCurrentlyActive && (
                            <button
                              type="button"
                              onClick={() => revoke(f)}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-bold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-slate-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-bold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {dialog && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setDialog(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black">
              {dialog.type === "LIMIT"
                ? "Change client limit"
                : `Lock ${dialog.firm.name} out?`}
            </h2>
            {dialog.type === "LIMIT" ? (
              <label className="mt-4 block">
                <span className="text-xs font-bold text-slate-500">
                  Client companies allowed
                </span>
                <input
                  autoFocus
                  type="number"
                  min={1}
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </label>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Access ends immediately. Their data is kept and returns if you
                grant access again.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus={dialog.type === "REVOKE"}
                onClick={confirmDialog}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white ${
                  dialog.type === "REVOKE" ? "bg-red-600" : "bg-slate-950"
                }`}
              >
                {dialog.type === "LIMIT" ? "Save" : "Revoke access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={submitGrant}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black">Grant or extend access</h2>
                <p className="mt-1 text-xs text-slate-500">
                  The owner must already have an EVC account. Extending adds
                  time on top of the current end date.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-500">Owner email *</span>
                <input
                  required
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-500">Firm name</span>
                <input
                  value={form.firmName}
                  onChange={(e) => setForm({ ...form, firmName: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-500">Client companies allowed</span>
                <input
                  type="number"
                  min={1}
                  value={form.clientLimit}
                  onChange={(e) => setForm({ ...form, clientLimit: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </label>

              <div>
                <span className="text-xs font-bold text-slate-500">Duration</span>
                <div className="mt-1 flex gap-2 text-xs font-bold">
                  {(["MONTHS", "DATE"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, mode: m })}
                      className={`rounded-lg border px-3 py-1.5 ${
                        form.mode === m
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200"
                      }`}
                    >
                      {m === "MONTHS" ? "Add months" : "Exact end date"}
                    </button>
                  ))}
                </div>
                {form.mode === "MONTHS" ? (
                  <select
                    value={form.months}
                    onChange={(e) => setForm({ ...form, months: e.target.value })}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.months} value={d.months}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                )}
              </div>

              <label className="block">
                <span className="text-xs font-bold text-slate-500">
                  Razorpay payment id / invoice number
                </span>
                <input
                  value={form.paymentReference}
                  onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                  placeholder="pay_… or INV-…  (leave blank for a free trial)"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-500">Note (internal)</span>
                <input
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Free trial after demo call"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.sendEmail}
                  onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
                />
                Email the firm with the access period and end date
              </label>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {formError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save access
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

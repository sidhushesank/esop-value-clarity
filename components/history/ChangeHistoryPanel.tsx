"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Download, History as HistoryIcon, Loader2, RefreshCw } from "lucide-react";

type ChangeRow = {
  id: string;
  createdAt: string;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  details: unknown;
};

export type HistoryFilter = { value: string; label: string };

const BTN_LIGHT =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40";

const TAG_STYLE: Record<string, string> = {
  created: "bg-emerald-50 text-emerald-700",
  uploaded: "bg-emerald-50 text-emerald-700",
  issued: "bg-blue-50 text-blue-700",
  accepted: "bg-blue-50 text-blue-700",
  run: "bg-blue-50 text-blue-700",
  updated: "bg-slate-100 text-slate-600",
  replaced: "bg-slate-100 text-slate-600",
  details_updated: "bg-slate-100 text-slate-600",
  deleted: "bg-red-50 text-red-700",
  removed: "bg-red-50 text-red-700",
  revoked: "bg-red-50 text-red-700",
  archived: "bg-amber-50 text-amber-700",
  lapsed: "bg-amber-50 text-amber-700",
  left: "bg-amber-50 text-amber-700",
};

function verb(action: string): string {
  const v = action.split(".").pop() ?? action;
  return v.replace(/^letter_|^link_/, "");
}

function when(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

function DetailList({ details }: { details: unknown }) {
  if (!details || typeof details !== "object") return null;
  const entries = Object.entries(details as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );
  if (!entries.length) return null;
  return (
    <dl className="mt-2 grid gap-x-6 gap-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-slate-400">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</dt>
          <dd className="truncate font-semibold text-slate-700">
            {Array.isArray(v) ? v.join(", ") || "-" : typeof v === "boolean" ? (v ? "yes" : "no") : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Change history list, shared by the Startup Equity Desk and the Advisor
 * Console. Newest first, 100 at a time, with a type filter and Excel export.
 */
export default function ChangeHistoryPanel({
  endpoint,
  exportHref,
  filters,
  intro,
}: {
  endpoint: string;
  exportHref: string;
  filters: HistoryFilter[];
  intro: string;
}) {
  const [rows, setRows] = useState<ChangeRow[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(
    async (before?: string) => {
      setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams();
        if (type) qs.set("type", type);
        if (before) qs.set("before", before);
        const res = await fetch(`${endpoint}${qs.toString() ? `?${qs}` : ""}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          setError(json?.message ?? "We could not load the history.");
          return;
        }
        setRows((prev) => (before && prev ? [...prev, ...json.rows] : json.rows));
        setHasMore(Boolean(json.hasMore));
      } catch {
        setError("We could not connect. Please retry.");
      } finally {
        setLoading(false);
      }
    },
    [endpoint, type]
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <HistoryIcon size={20} />
          </span>
          <div>
            <h3 className="text-base font-black">Change history</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{intro}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-blue-500"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Everything</option>
            {filters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <button type="button" className={BTN_LIGHT} disabled={loading} onClick={() => void load()}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <a href={exportHref} className={BTN_LIGHT}>
            <Download size={14} /> Excel
          </a>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

      {rows === null && !error && (
        <div className="mt-6 flex items-center gap-3 text-sm font-bold">
          <Loader2 className="animate-spin text-blue-600" size={18} /> Loading
        </div>
      )}

      {rows && rows.length === 0 && (
        <p className="mt-6 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
          No changes recorded yet{type ? " for this filter" : ""}. Changes made from now on appear here.
        </p>
      )}

      {rows && rows.length > 0 && (
        <ol className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
          {rows.map((r) => {
            const t = when(r.createdAt);
            const v = verb(r.action);
            const hasDetails = !!r.details && typeof r.details === "object" && Object.keys(r.details as object).length > 0;
            return (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
                  <div className="w-28 shrink-0 text-xs text-slate-400">
                    <p className="font-bold text-slate-600">{t.date}</p>
                    <p>{t.time}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${TAG_STYLE[v] ?? "bg-slate-100 text-slate-600"}`}>
                        {v.replace(/_/g, " ")}
                      </span>
                      {r.summary}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">by {r.actorLabel}</p>
                    {open === r.id && <DetailList details={r.details} />}
                  </div>
                  {hasDetails && (
                    <button
                      type="button"
                      className="text-xs font-black text-blue-700"
                      onClick={() => setOpen(open === r.id ? null : r.id)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {open === r.id ? "Hide" : "Details"}
                        <ChevronDown size={12} className={open === r.id ? "rotate-180" : ""} />
                      </span>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {hasMore && rows && (
        <button
          type="button"
          className={`${BTN_LIGHT} mt-4`}
          disabled={loading}
          onClick={() => void load(rows[rows.length - 1]?.createdAt)}
        >
          {loading && <Loader2 size={14} className="animate-spin" />} Load older changes
        </button>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-400">
        Written automatically when a change is saved. Entries can&apos;t be edited or deleted in EVC. Times are in your browser&apos;s time zone.
      </p>
    </section>
  );
}

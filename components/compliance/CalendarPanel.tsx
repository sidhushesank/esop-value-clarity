"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Download, ExternalLink, Loader2, Mail, RotateCcw } from "lucide-react";

type Item = {
  key: string;
  category: "MCA" | "TAX" | "ESOP" | "VALUATION";
  subject: string;
  title: string;
  detail: string;
  due: string;
  done: string | null;
  href: string;
  remindedElsewhere?: boolean;
  status: "DONE" | "OVERDUE" | "DUE_SOON" | "UPCOMING";
};

type Filter = "OPEN" | "OVERDUE" | "DUE_SOON" | "UPCOMING" | "DONE" | "ALL";

const CARD = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6";
const BTN_LIGHT =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40";
const CHIP: Record<Item["status"], string> = {
  OVERDUE: "bg-red-50 text-red-700",
  DUE_SOON: "bg-amber-50 text-amber-800",
  UPCOMING: "bg-slate-100 text-slate-600",
  DONE: "bg-emerald-50 text-emerald-700",
};
const WORD: Record<Item["status"], string> = { OVERDUE: "Overdue", DUE_SOON: "Due soon", UPCOMING: "Upcoming", DONE: "Done" };
const CAT: Record<Item["category"], string> = { MCA: "MCA filing", TAX: "Tax", ESOP: "ESOP", VALUATION: "Valuation" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function fmt(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return `${String(day).padStart(2, "0")} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

function daysText(due: string) {
  const t = new Date();
  const today = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  const d = Math.round((Date.parse(`${due}T00:00:00Z`) - today) / 86_400_000);
  if (d === 0) return "today";
  return d < 0 ? `${-d} day${d === -1 ? "" : "s"} late` : `in ${d} day${d === 1 ? "" : "s"}`;
}

async function readJson(res: Response) {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Shared by the Startup Equity Desk (apiBase /api/company/calendar) and the Advisor Console (/api/advisor/calendar). */
export default function CalendarPanel({ apiBase, intro }: { apiBase: string; intro: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [category, setCategory] = useState<"" | Item["category"]>("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(apiBase, { credentials: "include", cache: "no-store" });
      const json = await readJson(res);
      if (!res.ok || !json.success) return setError(String(json.message ?? "We could not load the calendar."));
      setError("");
      setItems(json.items as Item[]);
      setCanEdit(Boolean(json.canEdit));
      setEmail((json.reminderEmail as string | null) ?? null);
    } catch {
      setError("We could not connect. Please retry.");
    }
  }, [apiBase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function mark(item: Item, done: boolean) {
    setBusy(item.key);
    try {
      const res = await fetch(`${apiBase}/done`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: item.key, done, title: item.title, subject: item.subject }),
      });
      const json = await readJson(res);
      if (!res.ok || !json.success) setError(String(json.message ?? "That did not work."));
      await load();
    } finally {
      setBusy("");
    }
  }

  const counts = useMemo(() => {
    const c = { OVERDUE: 0, DUE_SOON: 0, UPCOMING: 0, DONE: 0 };
    for (const i of items ?? []) c[i.status] += 1;
    return c;
  }, [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((i) => {
      if (filter === "OPEN" && i.status === "DONE") return false;
      if (filter !== "OPEN" && filter !== "ALL" && i.status !== filter) return false;
      if (category && i.category !== category) return false;
      if (q && !`${i.subject} ${i.title}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, category, query]);

  // Group open items by month for easy scanning.
  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const i of shown) {
      const label = i.status === "OVERDUE" ? "Overdue" : `${MONTHS[Number(i.due.slice(5, 7)) - 1]} ${i.due.slice(0, 4)}`;
      map.set(label, [...(map.get(label) ?? []), i]);
    }
    return [...map.entries()];
  }, [shown]);

  return (
    <div className="space-y-5">
      <section className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <CalendarDays size={18} /> Compliance calendar
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{intro}</p>
            {email && (
              <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Mail size={13} /> Reminder emails go to {email} at 30, 7 and 1 day before, and on the due date. Marking an item done stops them.
              </p>
            )}
          </div>
          <a href={`${apiBase}/ics`} className={BTN_LIGHT}>
            <Download size={14} /> Add to Google / Outlook calendar (.ics)
          </a>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
          {(
            [
              ["OPEN", `Open (${counts.OVERDUE + counts.DUE_SOON + counts.UPCOMING})`],
              ["OVERDUE", `Overdue (${counts.OVERDUE})`],
              ["DUE_SOON", `Next 30 days (${counts.DUE_SOON})`],
              ["UPCOMING", `Later (${counts.UPCOMING})`],
              ["DONE", `Done (${counts.DONE})`],
              ["ALL", "All"],
            ] as [Filter, string][]
          ).map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 transition ${filter === f ? "bg-slate-950 text-white" : f === "OVERDUE" && counts.OVERDUE ? CHIP.OVERDUE : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {label}
            </button>
          ))}
          <select className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black" value={category} onChange={(e) => setCategory(e.target.value as "" | Item["category"])}>
            <option value="">All types</option>
            {(Object.keys(CAT) as Item["category"][]).map((c) => (
              <option key={c} value={c}>
                {CAT[c]}
              </option>
            ))}
          </select>
          <input
            className="min-w-[180px] flex-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-blue-500"
            placeholder="Search a company, client or person"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      </section>

      {items === null && !error && (
        <div className={`${CARD} flex items-center gap-3`}>
          <Loader2 className="animate-spin text-blue-600" size={18} />
          <span className="text-sm font-bold">Collecting due dates</span>
        </div>
      )}

      {items !== null && shown.length === 0 && (
        <div className={`${CARD} text-sm text-slate-500`}>{filter === "OPEN" ? "Nothing open. All clear." : "Nothing here."}</div>
      )}

      {groups.map(([label, list]) => (
        <section key={label} className={CARD}>
          <h3 className={`text-sm font-black uppercase tracking-[0.12em] ${label === "Overdue" ? "text-red-700" : "text-slate-400"}`}>{label}</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {list.map((i) => (
              <li key={i.key} className="flex flex-wrap items-start gap-3 py-3">
                <div className="w-28 shrink-0">
                  <p className="text-sm font-black">{fmt(i.due)}</p>
                  <p className={`text-xs font-semibold ${i.status === "OVERDUE" ? "text-red-600" : "text-slate-400"}`}>{i.status === "DONE" ? `done ${fmt(i.done as string)}` : daysText(i.due)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-black">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${CHIP[i.status]}`}>{WORD[i.status]}</span>
                    <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">{CAT[i.category]}</span>
                    {i.title}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">{i.subject}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{i.detail}</p>
                  {i.remindedElsewhere && <p className="mt-0.5 text-[11px] text-slate-400">Reminders for this come from the client&apos;s tax-event ledger.</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <a href={i.href} className={BTN_LIGHT} title="Open where this is recorded">
                    <ExternalLink size={13} /> Open
                  </a>
                  {canEdit &&
                    (i.status === "DONE" ? (
                      <button type="button" className={BTN_LIGHT} disabled={busy === i.key} onClick={() => void mark(i, false)} title="Reopen">
                        {busy === i.key ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Reopen
                      </button>
                    ) : (
                      <button type="button" className={BTN_LIGHT} disabled={busy === i.key} onClick={() => void mark(i, true)}>
                        {busy === i.key ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Mark done
                      </button>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="flex items-start gap-2 text-xs leading-5 text-slate-400">
        <AlertTriangle size={13} className="mt-0.5 shrink-0" /> Dates come from secondary sources and the records in EVC; confirm them with your CS or CA. EVC reminds,
        it doesn&apos;t file.
      </p>
    </div>
  );
}

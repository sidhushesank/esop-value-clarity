"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, Eye, Loader2, Mail, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";

type Role = "OWNER" | "ADMIN" | "VIEWER";

type Member = {
  id: string;
  email: string;
  role: "ADMIN" | "VIEWER";
  invitedAt: string;
  joinedAt: string | null;
  name: string | null;
  lastActiveAt: string | null;
};

type TeamResponse = {
  success: boolean;
  message?: string;
  yourRole: Role;
  limit: number | null;
  owner: { name: string; email: string };
  members: Member[];
  recent: { id: string; createdAt: string; actorLabel: string; summary: string }[];
};

const BTN_DARK =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";
const INPUT =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function fmt(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function RoleBadge({ role }: { role: Role }) {
  const map = {
    OWNER: { icon: <Crown size={11} />, text: "Owner", cls: "bg-amber-50 text-amber-700" },
    ADMIN: { icon: <ShieldCheck size={11} />, text: "Admin", cls: "bg-blue-50 text-blue-700" },
    VIEWER: { icon: <Eye size={11} />, text: "View only", cls: "bg-slate-100 text-slate-600" },
  }[role];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${map.cls}`}>
      {map.icon}
      {map.text}
    </span>
  );
}

/**
 * Team logins for the Startup Equity Desk ("company") and the Advisor
 * Console ("advisor"). Owner and admins invite by email and set roles;
 * view-only members see the list.
 */
export default function TeamPanel({ kind }: { kind: "company" | "advisor" }) {
  const base = kind === "company" ? "/api/company/team" : "/api/advisor/team";
  const product = kind === "company" ? "Startup Equity Desk" : "Advisor Console";

  const [data, setData] = useState<TeamResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "VIEWER">("VIEWER");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(base, { credentials: "include", cache: "no-store" });
      const json = (await res.json().catch(() => null)) as TeamResponse | null;
      if (!res.ok || !json?.success) {
        setError(json?.message ?? "We could not load the team.");
        return;
      }
      setData(json);
    } catch {
      setError("We could not connect. Please retry.");
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function call(url: string, init: RequestInit, ok: string, key: string) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.message ?? "That didn't work. Please retry.");
        return false;
      }
      setNotice(
        json?.emailed === false
          ? `${ok} The invitation email could not be sent, so tell them yourself to sign up with that email.`
          : ok
      );
      await load();
      return true;
    } catch {
      setError("We could not connect. Please retry.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function invite() {
    const e = email.trim();
    if (!e) return setError("Enter their email address.");
    const done = await call(
      base,
      { method: "POST", body: JSON.stringify({ email: e, role }) },
      `Added ${e}. They'll get an email; they sign up or log in with that address to get in.`,
      "invite"
    );
    if (done) setEmail("");
  }

  const canManage = data?.yourRole === "OWNER" || data?.yourRole === "ADMIN";
  const used = data?.members.length ?? 0;
  const full = data?.limit !== null && data?.limit !== undefined && used >= data.limit;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
          <Users size={20} />
        </span>
        <div>
          <h3 className="text-base font-black">Team</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Give co-founders, finance, HR{kind === "advisor" ? " and your firm's staff" : " and your CS"} their own login to this {product}.
            <b> Admins</b> can change everything and manage the team. <b>View only</b> can see and download everything but not change it.
            Only the owner can buy or renew the plan.
          </p>
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {notice && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}

      {!data && !error && (
        <div className="mt-6 flex items-center gap-3 text-sm font-bold">
          <Loader2 className="animate-spin text-blue-600" size={18} /> Loading
        </div>
      )}

      {data && (
        <>
          {canManage && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black">Add a team member</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
                <input
                  className={INPUT}
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={full}
                />
                <select className={INPUT} value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "VIEWER")} disabled={full}>
                  <option value="VIEWER">View only</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button type="button" className={BTN_DARK} disabled={busy === "invite" || full} onClick={() => void invite()}>
                  {busy === "invite" ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Add
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {data.limit === null
                  ? "Unlimited members on this account."
                  : `${used} of ${data.limit} members used (the owner doesn't count).`}{" "}
                They need to sign up or log in with exactly this email and verify it.
                {full && " Remove someone or contact us to add more."}
              </p>
            </div>
          )}

          <ul className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
            <li className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900">{data.owner.name || data.owner.email}</p>
                <p className="text-xs text-slate-500">{data.owner.email}</p>
              </div>
              <RoleBadge role="OWNER" />
            </li>

            {data.members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-900">{m.name || m.email}</p>
                  <p className="text-xs text-slate-500">
                    {m.email} ·{" "}
                    {m.joinedAt ? (
                      <>joined {fmt(m.joinedAt)}{m.lastActiveAt ? ` · last active ${fmt(m.lastActiveAt)}` : ""}</>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                        <Mail size={11} /> invited {fmt(m.invitedAt)}, not logged in yet
                      </span>
                    )}
                  </p>
                </div>

                {canManage ? (
                  <>
                    <select
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold"
                      value={m.role}
                      disabled={busy === m.id}
                      onChange={(e) =>
                        void call(
                          `${base}/${m.id}`,
                          { method: "PATCH", body: JSON.stringify({ role: e.target.value }) },
                          `${m.email} is now ${e.target.value === "ADMIN" ? "an admin" : "view only"}.`,
                          m.id
                        )
                      }
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="VIEWER">View only</option>
                    </select>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 bg-white px-3 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-50"
                      disabled={busy === m.id}
                      onClick={() => {
                        if (!window.confirm(`Remove ${m.email}? Their access stops immediately.`)) return;
                        void call(`${base}/${m.id}`, { method: "DELETE" }, `Removed ${m.email}.`, m.id);
                      }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </>
                ) : (
                  <RoleBadge role={m.role} />
                )}
              </li>
            ))}
          </ul>

          {data.members.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">No team members yet. Only the owner can log in.</p>
          )}

          {data.recent.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Recent team changes</p>
              <ul className="mt-2 space-y-1.5">
                {data.recent.map((r) => (
                  <li key={r.id} className="text-xs text-slate-600">
                    <span className="font-bold text-slate-400">{fmt(r.createdAt)}</span> · {r.summary}{" "}
                    <span className="text-slate-400">({r.actorLabel})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

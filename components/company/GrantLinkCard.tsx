"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, Link2, Loader2, Mail, XCircle } from "lucide-react";

import type { GrantLinkStatus } from "@/components/company/types";
import { BTN_DARK, BTN_LIGHT, INPUT, LABEL, fmtDate, readJson } from "@/components/company/ui";

/**
 * Founder side of the employee link: create (URL shown once), see views,
 * stop the link. Shown on an issued grant.
 */
export default function GrantLinkCard({
  grantId,
  employeeName,
  employeeEmail,
  companyName,
}: {
  grantId: string;
  employeeName: string;
  employeeEmail: string | null;
  companyName: string;
}) {
  const [link, setLink] = useState<GrantLinkStatus | null | undefined>(undefined);
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [days, setDays] = useState("90");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/company/grants/${grantId}/link`, { credentials: "include", cache: "no-store" });
      const json = await readJson(res);
      if (res.ok && json?.success) setLink((json.link as GrantLinkStatus | null) ?? null);
    } catch {
      setLink(null);
    }
  }, [grantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    const d = Number(days);
    if (!Number.isInteger(d) || d < 1 || d > 365) return setError("Days must be a whole number from 1 to 365.");
    if (passcode && passcode.trim().length < 4) return setError("A passcode needs at least 4 characters, or leave it blank.");
    if (link && !window.confirm("Creating a new link stops the current one working. Continue?")) return;

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/company/grants/${grantId}/link`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() || null, expiresInDays: d }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not create the link.");
      setUrl(json.url as string);
      setLink(json.link as GrantLinkStatus);
      setOpen(false);
      setCopied(false);
    } catch {
      setError("We could not create the link. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!window.confirm("Stop this link working now? The employee will need a new link.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/company/grants/${grantId}/link`, { method: "DELETE", credentials: "include" });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? "We could not stop the link.");
      setLink(null);
      setUrl(null);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const mailto =
    url && employeeEmail
      ? `mailto:${encodeURIComponent(employeeEmail)}?subject=${encodeURIComponent(
          `Your ESOP grant at ${companyName}`
        )}&body=${encodeURIComponent(
          `Hi ${employeeName},\n\nHere is your ESOP grant: what you were granted, when it vests, what it costs to exercise and what it could be worth.\n\n${url}\n\n${
            link?.hasPasscode ? "I will send you the passcode separately.\n\n" : ""
          }Please open it and accept the grant.\n`
        )}`
      : null;

  return (
    <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
            <Link2 size={18} />
          </span>
          <div>
            <h4 className="text-sm font-black">Employee link</h4>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
              A private page for {employeeName}: vesting, exercise cost, estimated tax and what the grant
              could be worth, with an Accept button. No login needed.
            </p>
          </div>
        </div>
        {!open && (
          <button type="button" className={BTN_DARK} disabled={busy} onClick={() => { setError(""); setOpen(true); }}>
            {link ? "New link" : "Create link"}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className={LABEL}>Passcode (optional)</span>
            <input className={`${INPUT} mt-1`} value={passcode} placeholder="Send it separately" onChange={(e) => setPasscode(e.target.value)} />
          </label>
          <label className="block">
            <span className={LABEL}>Link works for (days)</span>
            <input className={`${INPUT} mt-1`} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
          </label>
          <div className="flex items-end gap-2">
            <button type="button" className={BTN_DARK} disabled={busy} onClick={() => void create()}>
              {busy && <Loader2 size={14} className="animate-spin" />} Create
            </button>
            <button type="button" className={BTN_LIGHT} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {url && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
          <p className="text-xs font-bold text-emerald-700">
            Copy this link now. For security it is shown only once; you can always create a new one.
          </p>
          <p className="mt-2 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs">{url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={BTN_DARK} onClick={() => void copy()}>
              <Copy size={14} /> {copied ? "Copied" : "Copy link"}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className={BTN_LIGHT}>
              <ExternalLink size={14} /> Preview
            </a>
            {mailto && (
              <a href={mailto} className={BTN_LIGHT}>
                <Mail size={14} /> Email to {employeeEmail}
              </a>
            )}
          </div>
        </div>
      )}

      {link === undefined ? null : link ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-slate-600">
            Active link · {link.hasPasscode ? "passcode protected" : "no passcode"} · works until {fmtDate(link.expiresAt)} ·{" "}
            {link.viewCount === 0
              ? "not opened yet"
              : `opened ${link.viewCount} time${link.viewCount === 1 ? "" : "s"}, last ${fmtDate(link.lastViewedAt)}`}
            {link.locked ? " · locked after wrong passcodes" : ""}
          </p>
          <button type="button" className={BTN_LIGHT} disabled={busy} onClick={() => void revoke()}>
            <XCircle size={14} /> Stop link
          </button>
        </div>
      ) : (
        !url && <p className="mt-4 text-sm text-slate-500">No active link.</p>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}

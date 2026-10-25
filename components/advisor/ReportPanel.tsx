"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Link2,
  Loader2,
  Play,
  Trash2,
} from "lucide-react";

import ReportOverview from "@/components/advisor/ReportOverview";
import type { ClientDetail } from "@/components/advisor/types";

type Severity = "RED" | "AMBER" | "INFO" | "GREEN";

type Finding = {
  id: string;
  ruleCode: string;
  severity: Severity;
  title: string;
  detail: string;
  sourceRef: Record<string, unknown> | null;
  suggestedOwner: string | null;
  dueDate: string | null;
  ruleVerified: boolean;
};

type Run = {
  id: string;
  score: number;
  createdAt: string;
  rulesSnapshot: { asOf?: string; skipped?: unknown } | null;
  findings: Finding[];
};

type HistoryItem = { id: string; score: number; createdAt: string };

type ShareLinkRow = {
  id: string;
  label: string | null;
  runId: string | null;
  expiresAt: string;
  revokedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
  hasPasscode: boolean;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
};

const ORDER: Severity[] = ["RED", "AMBER", "INFO", "GREEN"];

const LABEL: Record<Severity, string> = {
  RED: "Action needed",
  AMBER: "Review",
  INFO: "Notes",
  GREEN: "Passed",
};

const BAR: Record<Severity, string> = {
  RED: "border-red-600",
  AMBER: "border-amber-500",
  INFO: "border-blue-600",
  GREEN: "border-green-600",
};

const TEXT: Record<Severity, string> = {
  RED: "text-red-700",
  AMBER: "text-amber-700",
  INFO: "text-blue-700",
  GREEN: "text-green-700",
};

const INPUT =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

async function readJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function fmtDateTime(value: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

function fmtDay(value: string | null): string {
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

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export default function ReportPanel({ client }: { client: ClientDetail }) {
  const [run, setRun] = useState<Run | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(
    async (runId?: string) => {
      setLoading(true);
      setError("");

      try {
        const qs = runId ? `?runId=${encodeURIComponent(runId)}` : "";
        const res = await fetch(
          `/api/advisor/clients/${client.id}/diligence${qs}`,
          { credentials: "include", cache: "no-store" }
        );

        const data = await readJson(res);

        if (!res.ok || !data?.success) {
          setError(data?.message ?? "We could not load the diligence report.");
          return;
        }

        setRun((data.run as Run | null) ?? null);
        setHistory((data.history as HistoryItem[] | undefined) ?? []);
      } catch {
        setError("We could not load the diligence report. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [client.id]
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function runCheck() {
    setRunning(true);
    setError("");

    try {
      const res = await fetch(`/api/advisor/clients/${client.id}/diligence`, {
        method: "POST",
        credentials: "include",
      });

      const data = await readJson(res);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? "We could not run the diligence check.");
        return;
      }

      await load();
    } catch {
      setError("We could not run the diligence check. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  async function download(kind: "pdf" | "excel") {
    if (!run || downloading) return;

    setDownloading(kind);
    setError("");

    try {
      const res = await fetch(
        `/api/advisor/clients/${client.id}/diligence/${kind}?runId=${encodeURIComponent(run.id)}`,
        { credentials: "include", cache: "no-store" }
      );

      const type = res.headers.get("content-type") ?? "";

      if (!res.ok || type.includes("application/json")) {
        const data = await readJson(res);
        throw new Error(data?.message ?? "We could not create the file.");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition");
      const match = disposition?.match(/filename="([^"]+)"/i);

      const filename =
        match?.[1] ??
        (kind === "pdf"
          ? "esop-diligence-report.pdf"
          : "esop-diligence-annex.xlsx");

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not create the file. Please try again."
      );
    } finally {
      setDownloading(null);
    }
  }

  const noData = client._count.grants === 0;

  const skipped: string[] = Array.isArray(run?.rulesSnapshot?.skipped)
    ? (run!.rulesSnapshot!.skipped as unknown[]).filter(
        (s): s is string => typeof s === "string"
      )
    : [];

  const flagged = (run?.findings ?? []).filter(
    (f) => f.severity === "RED" || f.severity === "AMBER"
  );
  const unverified = flagged.filter((f) => !f.ruleVerified).length;

  return (
    <div className="space-y-5">
      <section className="relative animate-in overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm duration-500 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-emerald-400" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
              ESOP Diligence Pack
            </p>
            <h2 className="mt-2 text-xl font-black tracking-tight">
              Run the check
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              Runs all nine checks on the data held for this company and saves
              the result. Run it again after changing any data; earlier runs
              stay available below.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void runCheck()}
            disabled={running || noData}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {running ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={15} />
                {run ? "Run again" : "Run diligence check"}
              </>
            )}
          </button>
        </div>

        {noData && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            Import the ESOP register on the Data tab before running the check.
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
            {error}
          </div>
        )}
      </section>

      {loading && !run && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading report...
        </div>
      )}

      {!loading && !run && !noData && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          No check has been run for this company yet.
        </p>
      )}

      {run && (
        <>
          <section className="animate-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm duration-500 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  Executive overview
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Run {fmtDateTime(run.createdAt)}
                  {run.rulesSnapshot?.asOf
                    ? `  |  Position as of ${fmtDay(run.rulesSnapshot.asOf)}`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void download("pdf")}
                  disabled={Boolean(downloading)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm active:translate-y-0 disabled:opacity-60"
                >
                  {downloading === "pdf" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  PDF report
                </button>

                <button
                  type="button"
                  onClick={() => void download("excel")}
                  disabled={Boolean(downloading)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm active:translate-y-0 disabled:opacity-60"
                >
                  {downloading === "excel" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileSpreadsheet size={14} />
                  )}
                  Excel annex
                </button>
              </div>
            </div>

            {history.length > 1 && (
              <label className="mt-5 block max-w-sm">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Earlier runs
                </span>
                <select
                  value={run.id}
                  onChange={(e) => void load(e.target.value)}
                  className={`${INPUT} mt-2`}
                >
                  {history.map((h) => (
                    <option key={h.id} value={h.id}>
                      {fmtDateTime(h.createdAt)} - score {h.score}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {unverified > 0 && (
              <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
                {unverified} of the {flagged.length} flagged findings rest on
                rules that have not yet been verified against the Act or Rules
                text. The report says so; verify the rules before you hand it
                to a client.
              </p>
            )}
          </section>

          <ReportOverview
            key={run.id}
            score={run.score}
            asOf={run.rulesSnapshot?.asOf ?? run.createdAt.slice(0, 10)}
            unverified={unverified}
            flagged={flagged.length}
            notRun={skipped.length}
            findings={run.findings.map((f) => ({
              severity: f.severity,
              title: f.title,
              owner: f.suggestedOwner,
              dueDate: f.dueDate,
            }))}
          />

          {ORDER.map((sev) => {
            const group = run.findings.filter((f) => f.severity === sev);
            if (group.length === 0) return null;

            return (
              <section
                key={sev}
                className="animate-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm duration-500 fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
              >
                <h3 className={`text-sm font-black ${TEXT[sev]}`}>
                  {LABEL[sev]} ({group.length})
                </h3>

                <div className="mt-4 space-y-3">
                  {group.map((f, idx) => {
                    const ruleSource =
                      typeof f.sourceRef?.ruleSource === "string"
                        ? f.sourceRef.ruleSource
                        : null;

                    return (
                      <div
                        key={f.id}
                        style={{
                          animationDelay: `${Math.min(idx, 10) * 45}ms`,
                          animationFillMode: "backwards",
                        }}
                        className={`animate-in rounded-lg border-l-4 bg-slate-50 p-4 duration-500 fade-in slide-in-from-bottom-1 transition hover:bg-slate-100/70 motion-reduce:animate-none ${BAR[f.severity]}`}
                      >
                        <p className="text-sm font-black text-slate-950">
                          {f.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {f.detail}
                        </p>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {f.suggestedOwner ? `Owner: ${f.suggestedOwner}` : ""}
                          {f.suggestedOwner && f.dueDate ? "  |  " : ""}
                          {f.dueDate ? `Due: ${fmtDay(f.dueDate)}` : ""}
                          {(f.suggestedOwner || f.dueDate) && ruleSource
                            ? "  |  "
                            : ""}
                          {ruleSource ? `Rule: ${ruleSource}` : ""}
                          {f.severity !== "GREEN" && !f.ruleVerified
                            ? "  |  rule awaiting verification"
                            : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {skipped.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-950">
                Checks not run
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                These could not run because the information was not available.
                They are not passes.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {skipped.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <ShareSection clientId={client.id} run={run} history={history} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sharing                                                             */
/* ------------------------------------------------------------------ */

function ShareSection({
  clientId,
  run,
  history,
}: {
  clientId: string;
  run: Run | null;
  history: HistoryItem[];
}) {
  const [links, setLinks] = useState<ShareLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ label: "", days: "30", passcode: "" });
  const [creating, setCreating] = useState(false);

  const [createdUrl, setCreatedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/share-links`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await readJson(res);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? "We could not load the share links.");
        return;
      }

      setLinks(data.links as ShareLinkRow[]);
    } catch {
      setError("We could not load the share links. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  async function create() {
    if (!run) return;

    if (form.passcode && form.passcode.length < 6) {
      setError("The passcode must be at least 6 characters.");
      return;
    }

    setCreating(true);
    setError("");
    setCreatedUrl("");
    setCopied(false);

    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/share-links`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: run.id,
          label: form.label.trim() || null,
          expiresInDays: Number(form.days),
          passcode: form.passcode || null,
        }),
      });

      const data = await readJson(res);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? "We could not create the link.");
        return;
      }

      setCreatedUrl(data.url as string);
      setForm((f) => ({ ...f, label: "", passcode: "" }));
      await loadLinks();
    } catch {
      setError("We could not create the link. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("Could not copy automatically. Select the link and copy it.");
    }
  }

  async function revoke(id: string) {
    setRevokingId(id);
    setError("");

    try {
      const res = await fetch(
        `/api/advisor/clients/${clientId}/share-links/${id}`,
        { method: "DELETE", credentials: "include" }
      );

      const data = await readJson(res);

      if (!res.ok || !data?.success) {
        setError(data?.message ?? "We could not revoke this link.");
        return;
      }

      setConfirmId(null);
      await loadLinks();
    } catch {
      setError("We could not revoke this link. Please try again.");
    } finally {
      setRevokingId(null);
    }
  }

  const runInfo = (runId: string | null) => {
    const item = history.find((h) => h.id === runId);
    return item
      ? `Run of ${fmtDateTime(item.createdAt)} (score ${item.score})`
      : "Earlier run";
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
          <Link2 size={20} />
        </span>

        <div>
          <h3 className="text-base font-black">Share with the client</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
            Create a private link to the report you are viewing. The client
            needs no login. The link shows that run only, it can be revoked at
            any time, and it stops working when it expires. Employee names
            appear in the report, so add a passcode and send it separately.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
          {error}
        </div>
      )}

      {!run ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Run the check first, then you can share the report.
        </p>
      ) : (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">
            Sharing: {runInfo(run.id)}
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Label (optional)
              </span>
              <input
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                maxLength={100}
                placeholder="e.g. Sent to CFO"
                className={`${INPUT} mt-2`}
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Expires after
              </span>
              <select
                value={form.days}
                onChange={(e) =>
                  setForm((f) => ({ ...f, days: e.target.value }))
                }
                className={`${INPUT} mt-2`}
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Passcode (optional)
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={form.passcode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, passcode: e.target.value }))
                }
                placeholder="At least 6 characters"
                className={`${INPUT} mt-2`}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void create()}
            disabled={creating}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Link2 size={15} />
                Create share link
              </>
            )}
          </button>
        </div>
      )}

      {createdUrl && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-black text-emerald-800">
            Copy this link now. It cannot be shown again. If you lose it,
            revoke it and create a new one.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={createdUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="h-11 min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none"
            />

            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Links for this company
        </p>

        {loading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </p>
        ) : links.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No links created yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {links.map((link) => {
              const locked =
                link.lockedUntil && new Date(link.lockedUntil) > new Date();

              return (
                <div
                  key={link.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-black">
                      {link.label || "Untitled link"}

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                          link.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        {link.status === "ACTIVE"
                          ? "Active"
                          : link.status === "REVOKED"
                            ? "Revoked"
                            : "Expired"}
                      </span>

                      {link.hasPasscode && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-700">
                          Passcode
                        </span>
                      )}

                      {locked && (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-red-700">
                          Locked
                        </span>
                      )}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {runInfo(link.runId)}
                      {"  |  "}
                      Created {fmtDay(link.createdAt)}
                      {"  |  "}
                      Expires {fmtDay(link.expiresAt)}
                    </p>

                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                      {link.viewCount} view{link.viewCount === 1 ? "" : "s"}
                      {link.lastViewedAt
                        ? `, last ${fmtDateTime(link.lastViewedAt)}`
                        : ""}
                      . Link previews from chat apps can count as views.
                    </p>
                  </div>

                  {link.status === "ACTIVE" &&
                    (confirmId === link.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          disabled={revokingId === link.id}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => void revoke(link.id)}
                          disabled={revokingId === link.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {revokingId === link.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          Revoke
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(link.id)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:border-red-200 hover:text-red-700"
                      >
                        Revoke
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
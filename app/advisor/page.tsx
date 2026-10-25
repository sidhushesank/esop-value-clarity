"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  FileText,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type CompanyType = "PRIVATE_LIMITED" | "UNLISTED_PUBLIC";

type ClientRow = {
  id: string;
  name: string;
  cin: string | null;
  companyType: CompanyType;
  approvedPoolSize: number | null;
  createdAt: string;
  _count: { grants: number; exercises: number; runs: number };
  runs: { id: string; score: number; createdAt: string }[];
};

type FirmResponse = {
  success: boolean;
  firm?: { name: string; expiresAt: string };
  isFounder?: boolean;
  clientLimit?: number | null;
  activeClients?: number;
  code?: string;
  message?: string;
};

const EMPTY_FORM = {
  name: "",
  cin: "",
  type: "PRIVATE_LIMITED" as CompanyType,
  pool: "",
};

function companyTypeLabel(type: CompanyType) {
  return type === "UNLISTED_PUBLIC"
    ? "Unlisted public company"
    : "Private limited company";
}

function scoreStyle(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdvisorHomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState("");
  const [blockedCode, setBlockedCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [firmName, setFirmName] = useState("");
  const [isFounder, setIsFounder] = useState(false);
  const [clientLimit, setClientLimit] = useState<number | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Sequential on purpose: the first call creates the founder's firm
      // on first use, and two parallel first calls could collide.
      const firmRes = await fetch("/api/advisor/firm", {
        credentials: "include",
        cache: "no-store",
      });

      if (firmRes.status === 401) {
        router.push("/login");
        return;
      }

      const firmData = (await firmRes.json()) as FirmResponse;

      if (!firmRes.ok || !firmData.success || !firmData.firm) {
        setBlockedCode(firmData.code ?? "");
        setBlocked(
          firmData.code === "ADVISOR_FIRM_REQUIRED"
            ? "Advisor Console is not active on this account. Subscribe to the Advisor plan to manage your client companies."
            : firmData.code === "ADVISOR_FIRM_EXPIRED"
              ? "Your Advisor plan is not active, so access is paused. Any client data you already added is safe and will be available again as soon as the plan is renewed."
              : (firmData.message ?? "Advisor Console is not available.")
        );
        return;
      }

      setBlocked("");
      setBlockedCode("");
      setExpiresAt(firmData.isFounder ? null : firmData.firm.expiresAt);
      setFirmName(firmData.firm.name);
      setIsFounder(firmData.isFounder === true);
      setClientLimit(firmData.clientLimit ?? null);

      const clientsRes = await fetch("/api/advisor/clients", {
        credentials: "include",
        cache: "no-store",
      });

      const clientsData = await clientsRes.json();

      if (!clientsRes.ok || !clientsData.success) {
        setError(clientsData.message ?? "We could not load your clients.");
        return;
      }

      setClients(clientsData.clients as ClientRow[]);
    } catch {
      setError("We could not connect. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createClient() {
    const name = form.name.trim();

    if (!name) {
      setFormError("Enter the company name.");
      return;
    }

    let pool: number | null = null;

    if (form.pool.trim()) {
      const parsed = Number(form.pool.replace(/,/g, ""));

      if (!Number.isInteger(parsed) || parsed <= 0) {
        setFormError("Approved pool must be a whole number of options.");
        return;
      }

      pool = parsed;
    }

    setSaving(true);
    setFormError("");

    try {
      const res = await fetch("/api/advisor/clients", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cin: form.cin.trim() || null,
          companyType: form.type,
          approvedPoolSize: pool,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.message ?? "We could not add this company.");
        return;
      }

      setAddOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch {
      setFormError("We could not add this company. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const atLimit =
    !isFounder && clientLimit !== null && clients.length >= clientLimit;

  if (loading && !firmName && !blocked) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
        <div className="mx-auto flex min-h-screen max-w-[1200px] items-center justify-center px-6">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="text-sm font-black text-slate-950">
              Opening Advisor Console
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (blocked) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
        <div className="mx-auto max-w-xl px-6 py-24">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
              <Briefcase size={22} />
            </div>

            <h1 className="mt-4 text-xl font-black">Advisor Console</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{blocked}</p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {(blockedCode === "ADVISOR_FIRM_REQUIRED" ||
                blockedCode === "ADVISOR_FIRM_EXPIRED") && (
                <button
                  type="button"
                  onClick={() => router.push("/pricing#advisor")}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
                >
                  {blockedCode === "ADVISOR_FIRM_EXPIRED"
                    ? "Renew Advisor plan"
                    : "View Advisor plan"}
                  <ArrowRight size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <ArrowLeft size={15} />
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
      <div className="relative mx-auto max-w-[1200px] px-5 py-6 md:px-8 md:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>

            <span className="text-slate-300">/</span>

            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight">
                {firmName}
              </p>
              <p className="text-xs font-semibold text-slate-400">
                Advisor Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              disabled={atLimit}
              onClick={() => {
                setFormError("");
                setAddOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={14} />
              Add client company
            </button>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-[28px] bg-[#07111f] px-6 py-8 text-white md:px-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-200">
              <ShieldCheck size={12} />
              ESOP Diligence Pack
            </span>

            {isFounder && (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-amber-200">
                Founder access
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Your client companies.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Import a client&apos;s ESOP register, record approvals and
            valuations, run the diligence check and share a report with the
            client through a private link.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <Users size={16} className="text-slate-300" />

            <p className="text-sm font-black">
              {isFounder
                ? `${clients.length} client ${clients.length === 1 ? "company" : "companies"}`
                : `${clients.length} of ${clientLimit} client companies`}
            </p>

            <span className="text-[10px] font-semibold text-slate-400">
              {isFounder ? "Unlimited" : "Plan limit"}
            </span>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {atLimit && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            You have reached your plan&apos;s client company limit. Archive a
            company to add another, or{" "}
            <a href="/pricing#advisor" className="underline">
              contact us to add more client companies
            </a>
            .
          </div>
        )}

        {expiresAt &&
          !isFounder &&
          new Date(expiresAt).getTime() - Date.now() <= 30 * 86400000 && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Your Advisor plan ends on{" "}
              {new Date(expiresAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              . Renew before then to keep uninterrupted access.{" "}
              <a href="/pricing#advisor" className="underline">
                Renew now
              </a>
            </div>
          )}

        {clients.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-600">
              <Building2 size={24} />
            </div>

            <h2 className="mt-5 text-lg font-black">
              No client companies yet.
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Add your first client company, then import its ESOP register
              to run the diligence check.
            </p>

            <button
              type="button"
              onClick={() => {
                setFormError("");
                setAddOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <Plus size={15} />
              Add first client
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {clients.map((client, index) => {
              const latest = client.runs[0] ?? null;

              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.3) }}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black">
                        {client.name}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {companyTypeLabel(client.companyType)}
                        {client.cin ? `  |  CIN ${client.cin}` : ""}
                      </p>
                    </div>

                    {latest ? (
                      <div
                        className={`shrink-0 rounded-xl border px-3 py-2 text-center ${scoreStyle(latest.score)}`}
                      >
                        <p className="text-lg font-black leading-none">
                          {latest.score}
                        </p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-wide">
                          Score
                        </p>
                      </div>
                    ) : (
                      <span className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Not run
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Stat label="Grants" value={client._count.grants} />
                    <Stat label="Exercises" value={client._count.exercises} />
                    <Stat label="Checks run" value={client._count.runs} />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <FileText size={12} />
                      {latest
                        ? `Last check ${formatDate(latest.createdAt)}`
                        : `Added ${formatDate(client.createdAt)}`}
                    </p>

                    <button
                      type="button"
                      onClick={() => router.push(`/advisor/${client.id}`)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
                    >
                      Open
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {addOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-5 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) {
                setAddOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
            >
              <div className="flex items-start justify-between border-b border-slate-200 p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                    New client
                  </p>
                  <h3 className="mt-2 text-xl font-black tracking-tight">
                    Add a client company
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    You can complete the other details on the company page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  disabled={saving}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 p-6">
                <Field label="Company name">
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    maxLength={200}
                    placeholder="e.g. Acme Technologies Private Limited"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="CIN (optional)">
                    <input
                      value={form.cin}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, cin: e.target.value }))
                      }
                      maxLength={30}
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </Field>

                  <Field label="Company type">
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          type: e.target.value as CompanyType,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="PRIVATE_LIMITED">Private limited</option>
                      <option value="UNLISTED_PUBLIC">Unlisted public</option>
                    </select>
                  </Field>
                </div>

                <Field label="Approved ESOP pool, in options (optional)">
                  <input
                    value={form.pool}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pool: e.target.value }))
                    }
                    inputMode="numeric"
                    placeholder="e.g. 150000"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </Field>

                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
                    {formError}
                  </div>
                )}

                <div className="grid gap-3 pt-1 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => void createClient()}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        Add company
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-lg font-black leading-none text-slate-950">{value}</p>
      <p className="mt-1 text-[10px] font-semibold text-slate-500">{label}</p>
    </div>
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
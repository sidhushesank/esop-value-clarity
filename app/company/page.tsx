"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Gift,
  Layers,
  PieChart,
  RefreshCw,
  Rocket,
} from "lucide-react";

import CapTablePanel from "@/components/company/CapTablePanel";
import CompanyDetailsPanel from "@/components/company/CompanyDetailsPanel";
import EsopPoolPanel from "@/components/company/EsopPoolPanel";
import GrantsPanel from "@/components/company/GrantsPanel";
import type { WorkspaceInfo } from "@/components/company/types";
import { BTN_LIGHT, fmtDate, readJson } from "@/components/company/ui";

type WorkspaceResponse = {
  success: boolean;
  workspace?: WorkspaceInfo;
  isEvcOwner?: boolean;
  holderLimit?: number | null;
  optionHolders?: number;
  code?: string;
  message?: string;
};

type Tab = "CAPTABLE" | "POOL" | "GRANTS" | "DETAILS";

const TABS: { id: Tab; label: string; icon: ReactNode; soon?: boolean }[] = [
  { id: "CAPTABLE", label: "Cap table", icon: <PieChart size={15} /> },
  { id: "POOL", label: "ESOP pool", icon: <Layers size={15} /> },
  { id: "GRANTS", label: "Grants", icon: <Gift size={15} /> },
  { id: "DETAILS", label: "Company details", icon: <Building2 size={15} /> },
];

export default function CompanyHomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<WorkspaceResponse | null>(null);
  const [blocked, setBlocked] = useState<{ code: string; message: string } | null>(null);
  const [tab, setTab] = useState<Tab>("CAPTABLE");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/company/workspace", {
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const json = (await readJson(res)) as WorkspaceResponse | null;

      if (!res.ok || !json?.success || !json.workspace) {
        const code = json?.code ?? "";
        setBlocked({
          code,
          message:
            code === "COMPANY_WORKSPACE_REQUIRED"
              ? "The Startup Equity Desk is not active on this account. Get the Startup plan to build your cap table and issue ESOPs to your team."
              : code === "COMPANY_WORKSPACE_EXPIRED"
                ? "Your Startup plan has ended, so access is paused. Everything you added is kept and comes back as soon as you renew."
                : (json?.message ?? "The Startup Equity Desk is not available."),
        });
        return;
      }

      setBlocked(null);
      setInfo(json);
    } catch {
      setBlocked({ code: "", message: "We could not connect. Please check your connection and retry." });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !info && !blocked) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
        <div className="mx-auto flex min-h-screen max-w-[1200px] items-center justify-center px-6">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="text-sm font-black">Opening Startup Equity Desk</p>
          </div>
        </div>
      </main>
    );
  }

  if (blocked) {
    const planCode =
      blocked.code === "COMPANY_WORKSPACE_REQUIRED" ||
      blocked.code === "COMPANY_WORKSPACE_EXPIRED";

    return (
      <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
        <div className="mx-auto max-w-xl px-6 py-24">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
              <Rocket size={22} />
            </div>
            <h1 className="mt-4 text-xl font-black">Startup Equity Desk</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{blocked.message}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {planCode && (
                <button
                  type="button"
                  onClick={() => router.push("/pricing#startup")}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
                >
                  {blocked.code === "COMPANY_WORKSPACE_EXPIRED" ? "Renew Startup plan" : "View Startup plan"}
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

  const ws = info!.workspace!;
  const isOwner = info!.isEvcOwner === true;

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
      <div className="mx-auto max-w-[1200px] px-5 py-6 md:px-8 md:py-8">
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
              <p className="truncate text-lg font-black tracking-tight">{ws.name}</p>
              <p className="text-xs font-semibold text-slate-400">Startup Equity Desk</p>
            </div>
          </div>

          <button type="button" className={BTN_LIGHT} onClick={() => void load()}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        <section className="mt-6 overflow-hidden rounded-[28px] bg-[#07111f] px-6 py-8 text-white md:px-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-200">
              <Rocket size={12} />
              Startup plan
            </span>
            {isOwner && (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-amber-200">
                EVC owner · test workspace
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-2xl text-2xl font-black leading-tight md:text-3xl">
            Your cap table, your ESOP pool and every grant, in one place.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Each employee gets a clear page showing what their options could be
            worth. Records here are a preparation aid for your CS or lawyer, not
            legal or tax advice.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
            <span>
              Option holders: {info!.optionHolders ?? 0}
              {info!.holderLimit ? ` of ${info!.holderLimit}` : ""}
            </span>
            {!isOwner && <span>Plan valid until {fmtDate(ws.expiresAt)}</span>}
          </div>
        </section>

        <nav className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={t.soon}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                tab === t.id
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {t.icon}
              {t.label}
              {t.soon && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500">
                  Next
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-5">
          {tab === "CAPTABLE" && <CapTablePanel />}
          {tab === "POOL" && <EsopPoolPanel />}
          {tab === "GRANTS" && <GrantsPanel companyName={ws.name} onChanged={() => void load()} />}
          {tab === "DETAILS" && <CompanyDetailsPanel workspace={ws} onSaved={() => void load()} />}
        </div>
      </div>
    </main>
  );
}

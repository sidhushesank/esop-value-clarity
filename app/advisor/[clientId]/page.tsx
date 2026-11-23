"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calculator,
  ClipboardCheck,
  Database,
  History as HistoryIcon,
  ShieldCheck,
} from "lucide-react";

import ApprovalsPanel from "@/components/advisor/ApprovalsPanel";
import ClientDetailsPanel from "@/components/advisor/ClientDetailsPanel";
import ImportPanel from "@/components/advisor/ImportPanel";
import ReportPanel from "@/components/advisor/ReportPanel";
import TaxLedgerPanel from "@/components/advisor/TaxLedgerPanel";
import ChangeHistoryPanel from "@/components/history/ChangeHistoryPanel";
import type { ClientDetail } from "@/components/advisor/types";

type TabKey = "company" | "data" | "approvals" | "report" | "tax" | "history";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "company", label: "Company", icon: <Building2 size={14} /> },
  { key: "data", label: "Data", icon: <Database size={14} /> },
  { key: "approvals", label: "Approvals", icon: <ShieldCheck size={14} /> },
  { key: "report", label: "Check & report", icon: <ClipboardCheck size={14} /> },
  { key: "tax", label: "Tax ledger", icon: <Calculator size={14} /> },
  { key: "history", label: "History", icon: <HistoryIcon size={14} /> },
];

export default function AdvisorClientPage() {
  const router = useRouter();
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("company");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success || !data.client) {
        setClient(null);
        setError(
          res.status === 404
            ? "This company could not be found."
            : (data.message ?? "We could not load this company.")
        );
        return;
      }

      setError("");
      setClient(data.client as ClientDetail);
    } catch {
      setError("We could not connect. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f8fc]">
        <div className="mx-auto flex min-h-screen max-w-[1000px] items-center justify-center px-6">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="text-sm font-black text-slate-950">
              Opening company
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!client) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
        <div className="mx-auto max-w-xl px-6 py-24">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-black">Company not available</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>

            <button
              type="button"
              onClick={() => router.push("/advisor")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <ArrowLeft size={15} />
              Back to clients
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
      <div className="mx-auto max-w-[1000px] px-5 py-6 md:px-8 md:py-8">
        <header className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/advisor")}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Clients
          </button>

          <span className="text-slate-300">/</span>

          <div className="min-w-0">
            <p className="truncate text-lg font-black tracking-tight">
              {client.name}
            </p>
            <p className="text-xs font-semibold text-slate-400">
              {client._count.grants} grants | {client._count.exercises}{" "}
              exercises | {client._count.capTable} cap-table rows |{" "}
              {client.resolutions.length} resolutions |{" "}
              {client.valuations.length} valuations
            </p>
          </div>
        </header>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <nav className="mt-6 flex max-w-full flex-wrap rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                tab === t.key
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-5">
          {tab === "company" && (
            <ClientDetailsPanel
              key={client.updatedAt}
              client={client}
              onSaved={() => void load()}
            />
          )}

          {tab === "data" && (
            <>
              <p className="text-sm leading-6 text-slate-500">
                Import in this order: the ESOP register first, then the
                exercise log, then the cap table. Each step reads your file,
                shows what it found and saves nothing until you confirm.
              </p>

              <ImportPanel
                clientId={client.id}
                kind="register"
                title="1. ESOP register"
                description="One row per grant: employee, grant date, options, exercise price, vesting and expiry."
                existingCount={client._count.grants}
                onImported={() => void load()}
              />

              <ImportPanel
                clientId={client.id}
                kind="exercises"
                title="2. Exercise log"
                description="One row per exercise: exercise date, options exercised, board allotment date and the date PAS-3 was filed."
                existingCount={client._count.exercises}
                disabledReason={
                  client._count.grants === 0
                    ? "Import the ESOP register first, so each exercise can be matched to a grant."
                    : undefined
                }
                onImported={() => void load()}
              />

              <ImportPanel
                clientId={client.id}
                kind="captable"
                title="3. Cap table"
                description="One row per shareholder, with the number of shares and the holder type (founder, investor or ESOP pool)."
                existingCount={client._count.capTable}
                onImported={() => void load()}
              />
            </>
          )}

          {tab === "approvals" && (
            <ApprovalsPanel client={client} onChanged={() => void load()} />
          )}

          {tab === "report" && <ReportPanel client={client} />}

          {tab === "tax" && <TaxLedgerPanel client={client} />}

          {tab === "history" && (
            <ChangeHistoryPanel
              endpoint={`/api/advisor/clients/${client.id}/history`}
              exportHref={`/api/advisor/clients/${client.id}/history/export`}
              intro="Every change your firm made for this client: imports, approvals, valuations, diligence runs, share links and tax events, with who made it and when."
              filters={[
                { value: "import", label: "Imports" },
                { value: "resolution", label: "Approvals" },
                { value: "valuation", label: "Valuations" },
                { value: "diligence", label: "Diligence runs" },
                { value: "sharelink", label: "Share links" },
                { value: "tax_event", label: "Tax events" },
                { value: "tax_employee", label: "Tax employees" },
                { value: "client", label: "Company details" },
              ]}
            />
          )}
        </div>
      </div>
    </main>
  );
}
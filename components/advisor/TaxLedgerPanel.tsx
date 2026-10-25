"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CircleCheck, Info } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Reveal } from "@/components/advisor/ReportOverview";
import TaxDeadlinesCard from "@/components/advisor/TaxDeadlinesCard";
import TaxEmployeesCard from "@/components/advisor/TaxEmployeesCard";
import TaxEventsCard from "@/components/advisor/TaxEventsCard";
import TaxToolsCard from "@/components/advisor/TaxToolsCard";
import type {
  LedgerResponse,
  TaxEventResult,
  TaxEventRow,
  TaxRuleView,
} from "@/components/advisor/tax-types";
import { COLOUR, Kpi, Panel, daysFrom, money } from "@/components/advisor/tax-ui";
import type { ClientDetail } from "@/components/advisor/types";

type SubTab = "overview" | "events" | "deadlines" | "tools";

const SUBTABS: { key: SubTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "events", label: "Employees & events" },
  { key: "deadlines", label: "Deadlines" },
  { key: "tools", label: "Exports & rules" },
];

const AXIS_TICK = { fontSize: 11, fill: "#64748b" } as const;

const TOOLTIP_STYLE = {
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  fontSize: 12,
  padding: "6px 10px",
} as const;

export default function TaxLedgerPanel({ client }: { client: ClientDetail }) {
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [events, setEvents] = useState<TaxEventRow[]>([]);
  const [rules, setRules] = useState<TaxRuleView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<SubTab>("overview");

  const base = `/api/advisor/clients/${client.id}/tax`;

  const load = useCallback(async () => {
    try {
      const opts = { credentials: "include" as const, cache: "no-store" as const };

      const [l, e, r] = await Promise.all([
        fetch(`${base}/ledger`, opts),
        fetch(`${base}/events`, opts),
        fetch(`/api/advisor/tax/rules`, opts),
      ]);

      // The rules list is secondary: if it fails, the rest still loads.
      const [lj, ej, rj] = await Promise.all([
        l.json(),
        e.json().catch(() => null),
        r.json().catch(() => null),
      ]);

      if (!l.ok || !lj.success) {
        setError(lj.message ?? "We could not load the tax ledger.");
        return;
      }

      setError("");
      setData(lj as LedgerResponse);
      setEvents(ej?.success ? (ej.events as TaxEventRow[]) : []);
      setRules(rj?.success ? (rj.rules as TaxRuleView[]) : []);
    } catch {
      setError("We could not connect. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  const results = useMemo(() => {
    const m = new Map<string, TaxEventResult>();
    for (const e of data?.ledger.employees ?? []) {
      for (const r of e.ledger.results) m.set(r.eventId, r);
    }
    return m;
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="text-sm font-semibold text-slate-900">Opening tax ledger</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {error || "The tax ledger is not available."}
      </div>
    );
  }

  const employees = data.ledger.employees.map((e) => e.employee);
  const totals = data.ledger.employees.reduce(
    (t, e) => ({
      perquisite: t.perquisite + e.ledger.totals.perquisite,
      due: t.due + e.ledger.totals.tdsDueNow,
      deferred: t.deferred + e.ledger.totals.tdsDeferred,
      triggered: t.triggered + e.ledger.totals.tdsTriggered,
    }),
    { perquisite: 0, due: 0, deferred: 0, triggered: 0 }
  );

  const asOf = data.ledger.asOf;
  const overdue = data.ledger.deadlines.filter((d) => daysFrom(asOf, d.dueDate) < 0).length;
  const soon = data.ledger.deadlines.filter((d) => {
    const left = daysFrom(asOf, d.dueDate);
    return left >= 0 && left <= 30;
  }).length;

  const chart = data.ledger.employees
    .map((e) => ({
      name: e.employee.name,
      "Due at exercise": e.ledger.totals.tdsDueNow,
      Deferred: e.ledger.totals.tdsDeferred,
      "Deferral ended": e.ledger.totals.tdsTriggered,
    }))
    .filter((c) => c["Due at exercise"] + c.Deferred + c["Deferral ended"] > 0);

  const unverified = data.ledger.unverifiedRules.length;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium leading-5 text-amber-800">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <p>
          Every figure here is an <strong>estimate</strong> for professional review, not tax advice.
          {unverified > 0
            ? ` ${unverified} of the rules used are not yet verified against the Act and Rules text.`
            : results.size > 0
            ? " All rules used are marked verified."
            : " No events recorded yet."}{" "}
          Rule-set version {data.ledger.ruleSetVersion}.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {SUBTABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold transition ${
              tab === t.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {tab === "overview" && (
        <div className="space-y-4">
          <Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Kpi label="Perquisite recorded" value={money(totals.perquisite)} sub={`${employees.length} employee${employees.length === 1 ? "" : "s"} on the ledger`} accent={COLOUR.blue} />
              <Kpi label="TDS due at exercise" value={money(totals.due)} sub="Deposit by the 7th of next month" accent={COLOUR.amber} />
              <Kpi label="TDS deferred" value={money(totals.deferred)} sub="Start-up deferral, not yet triggered" accent={COLOUR.slate} />
              <Kpi label="Deferral ended, TDS due" value={money(totals.triggered)} sub="Sale or exit brought it forward" accent={COLOUR.red} />
              <Kpi label="Deadlines in 30 days" value={String(soon)} sub={overdue > 0 ? `${overdue} overdue` : "None overdue"} accent={overdue > 0 ? COLOUR.red : COLOUR.green} />
              <Kpi label="Unverified rules in use" value={String(unverified)} sub="Figures stay estimates until verified" accent={unverified > 0 ? COLOUR.amber : COLOUR.green} />
            </div>
          </Reveal>

          <Reveal>
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Estimated TDS by employee" caption="Rupees" className="lg:col-span-2">
                {chart.length === 0 ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-xs font-medium text-slate-500">
                    Record an exercise on the Employees &amp; events tab to see TDS here.
                  </div>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#eef2f6" />
                        <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                        <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={TOOLTIP_STYLE} formatter={(v) => money(Number(v))} />
                        <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Due at exercise" stackId="t" fill={COLOUR.amber} maxBarSize={44} />
                        <Bar dataKey="Deferred" stackId="t" fill={COLOUR.blue} maxBarSize={44} />
                        <Bar dataKey="Deferral ended" stackId="t" fill={COLOUR.red} maxBarSize={44} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>

              <Panel title="Start-up deferral">
                {data.ledger.deferralEligible ? (
                  <div className="flex gap-2.5 text-xs leading-5 text-slate-700">
                    <CircleCheck size={16} className="mt-0.5 shrink-0 text-green-600" />
                    <p>
                      Applied. DPIIT recognition and the Inter-Ministerial Board certificate are marked on the Company tab, so TDS on new exercises is deferred until the earliest of the window end, a sale, or the employee leaving.
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2.5 text-xs leading-5 text-slate-700">
                    <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <p>
                      Not applied. TDS is worked out at each exercise. If the company is a DPIIT-recognised start-up with the certificate, mark both on the Company tab.
                    </p>
                  </div>
                )}
              </Panel>
            </div>
          </Reveal>
        </div>
      )}

      {tab === "events" && (
        <div className="space-y-4">
          <TaxEmployeesCard clientId={client.id} employees={employees} onChanged={() => void load()} />
          <TaxEventsCard
            clientId={client.id}
            employees={employees}
            events={events}
            results={results}
            valuations={data.valuations}
            onChanged={() => void load()}
          />
        </div>
      )}

      {tab === "deadlines" && <TaxDeadlinesCard deadlines={data.ledger.deadlines} asOf={asOf} />}

      {tab === "tools" && (
        <TaxToolsCard clientId={client.id} rules={rules} isFounder={data.isFounder} onChanged={() => void load()} />
      )}
    </div>
  );
}
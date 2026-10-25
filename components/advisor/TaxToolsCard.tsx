"use client";

import { useState } from "react";
import { Download, ShieldCheck } from "lucide-react";

import type { TaxRuleView } from "@/components/advisor/tax-types";
import { BTN_GHOST, BTN_PRIMARY, Chip, Field, INPUT, Panel, callApi, day, useConfirm } from "@/components/advisor/tax-ui";

const FYS = ["2025-26", "2026-27", "2027-28"];

export default function TaxToolsCard({
  clientId,
  rules,
  isFounder,
  onChanged,
}: {
  clientId: string;
  rules: TaxRuleView[];
  isFounder: boolean;
  onChanged: () => void;
}) {
  const { ask, dialog } = useConfirm();
  const [fy, setFy] = useState("2026-27");
  const [quarter, setQuarter] = useState("Q3");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const base = `/api/advisor/clients/${clientId}/tax/export`;

  async function toggle(rule: TaxRuleView) {
    if (busy) return;

    const next = !rule.verified;
    const ok = await ask(
      next
        ? {
            title: `Mark ${rule.code} as verified?`,
            message: "Do this only after checking the rule against the Act and Rules text. Figures that use it stop showing as unverified.",
            confirmLabel: "Mark verified",
          }
        : {
            title: `Mark ${rule.code} as not verified?`,
            message: "Figures that use this rule will show as unverified estimates again.",
            confirmLabel: "Mark not verified",
          }
    );
    if (!ok) return;

    setBusy(rule.code);
    setError("");

    const result = await callApi(`/api/advisor/tax/rules/${rule.code}`, "PATCH", { verified: next });

    setBusy(null);

    if (!result.ok) return setError(result.message);
    onChanged();
  }

  return (
    <div className="space-y-4">
      {dialog}
      <Panel title="Data exports" caption="Excel. Every sheet carries the rule version and the estimate notice">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Financial year">
            <select className={INPUT} value={fy} onChange={(e) => setFy(e.target.value)}>
              {FYS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Field label="Quarter (for the quarterly sheet)">
            <select className={INPUT} value={quarter} onChange={(e) => setQuarter(e.target.value)}>
              <option value="Q1">Q1 (Apr - Jun)</option>
              <option value="Q2">Q2 (Jul - Sep)</option>
              <option value="Q3">Q3 (Oct - Dec)</option>
              <option value="Q4">Q4 (Jan - Mar)</option>
            </select>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`${base}?type=quarterly&fy=${fy}&q=${quarter}`} className={BTN_PRIMARY}>
            <Download size={13} />
            Quarterly perquisite sheet (24Q / Form 138)
          </a>
          <a href={`${base}?type=annual&fy=${fy}`} className={BTN_GHOST}>
            <Download size={13} />
            Annual per-employee breakup (Form 16 annexure)
          </a>
        </div>

        <p className="mt-3 text-[11px] leading-4 text-slate-400">
          These are data aids for preparing the return and the perquisite statement. They are not a filed return or a certificate.
        </p>
      </Panel>

      <Panel
        title="Rules behind the numbers"
        caption={isFounder ? "You can verify rules" : "Verified by the founder"}
      >
        {error && <p className="mb-3 text-xs font-semibold text-red-700">{error}</p>}

        <div className="divide-y divide-slate-100">
          {rules.map((r) => (
            <div key={r.code} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-900">
                  {r.title}
                  {r.verified ? <Chip colour="green">Verified {r.verifiedAt ? day(r.verifiedAt) : ""}</Chip> : <Chip colour="amber">Not yet verified</Chip>}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">{r.source}</p>
                {r.notes && <p className="mt-1 text-[11px] leading-4 text-slate-400">{r.notes}</p>}
              </div>

              {isFounder && (
                <button type="button" onClick={() => void toggle(r)} disabled={busy === r.code} className={BTN_GHOST}>
                  <ShieldCheck size={13} />
                  {r.verified ? "Unverify" : "Mark verified"}
                </button>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
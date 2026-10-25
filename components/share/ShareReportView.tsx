"use client";

import { Download, Info, ShieldCheck } from "lucide-react";

import ReportOverview, {
  Reveal,
  type OverviewSeverity,
} from "@/components/advisor/ReportOverview";

export type ShareFinding = {
  severity: OverviewSeverity;
  title: string;
  detail: string;
  owner: string | null;
  /** ISO date string, or null. */
  dueDate: string | null;
  /** Pre-formatted due date for display. */
  dueLabel: string | null;
  ruleSource: string | null;
  ruleVerified: boolean;
};

export type ShareReportViewProps = {
  token: string;
  brand: string;
  footerNote: string | null;
  clientName: string;
  companyType: string;
  cin: string | null;
  asOf: string;
  asOfLabel: string;
  score: number;
  findings: ShareFinding[];
  skipped: string[];
};

const ORDER: OverviewSeverity[] = ["RED", "AMBER", "INFO", "GREEN"];

const LABEL: Record<OverviewSeverity, string> = {
  RED: "Action needed",
  AMBER: "Review",
  INFO: "Notes",
  GREEN: "Passed",
};

const BAR: Record<OverviewSeverity, string> = {
  RED: "border-red-600",
  AMBER: "border-amber-500",
  INFO: "border-blue-600",
  GREEN: "border-green-600",
};

const TEXT: Record<OverviewSeverity, string> = {
  RED: "text-red-700",
  AMBER: "text-amber-700",
  INFO: "text-blue-700",
  GREEN: "text-green-700",
};

export default function ShareReportView({
  token,
  brand,
  footerNote,
  clientName,
  companyType,
  cin,
  asOf,
  asOfLabel,
  score,
  findings,
  skipped,
}: ShareReportViewProps) {
  const flagged = findings.filter(
    (f) => f.severity === "RED" || f.severity === "AMBER"
  );
  const unverified = flagged.filter((f) => !f.ruleVerified).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-8">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* ------------------------------ Hero ----------------------- */}
        <header className="animate-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#050b16] via-[#0b1730] to-[#10244d] p-7 text-white shadow-xl shadow-slate-900/10 duration-700 fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:p-9">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-[100px]" />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
                <ShieldCheck size={12} />
                {brand}
              </p>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                ESOP Diligence Report
              </h1>

              <p className="mt-2 text-lg font-bold text-slate-200">
                {clientName}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-400">
                {companyType}
                {cin ? `  |  CIN ${cin}` : ""}
                {"  |  "}Position as of {asOfLabel}
              </p>
            </div>

            <a
              href={`/api/share/${token}/pdf`}
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 active:translate-y-0 active:scale-[0.98]"
            >
              <Download
                size={15}
                className="transition group-hover:translate-y-0.5"
              />
              Download PDF
            </a>
          </div>

          <p className="relative mt-6 flex items-start gap-2 text-[11px] leading-5 text-slate-400">
            <Info size={13} className="mt-0.5 shrink-0" />
            Preparation aid for professional review. Not legal, tax or
            financial advice.
          </p>
        </header>

        {/* ---------------------------- Overview --------------------- */}
        <ReportOverview
          score={score}
          asOf={asOf}
          unverified={unverified}
          flagged={flagged.length}
          notRun={skipped.length}
          findings={findings.map((f) => ({
            severity: f.severity,
            title: f.title,
            owner: f.owner,
            dueDate: f.dueDate,
          }))}
        />

        {unverified > 0 && (
          <Reveal>
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs font-semibold leading-5 text-amber-800">
              {unverified} of the {flagged.length} flagged findings rest on
              rules not yet verified against the Act or Rules text. Please
              confirm these before relying on them.
            </p>
          </Reveal>
        )}

        {/* ---------------------------- Findings --------------------- */}
        {ORDER.map((sev) => {
          const group = findings.filter((f) => f.severity === sev);
          if (group.length === 0) return null;

          return (
            <Reveal key={sev}>
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className={`text-sm font-black ${TEXT[sev]}`}>
                  {LABEL[sev]} ({group.length})
                </h2>

                <div className="mt-4 space-y-3">
                  {group.map((f, i) => (
                    <div
                      key={`${f.title}-${i}`}
                      style={{
                        animationDelay: `${Math.min(i, 10) * 45}ms`,
                        animationFillMode: "backwards",
                      }}
                      className={`animate-in rounded-lg border-l-4 bg-slate-50 p-4 transition duration-500 fade-in slide-in-from-bottom-1 hover:bg-slate-100/70 motion-reduce:animate-none ${BAR[f.severity]}`}
                    >
                      <p className="text-sm font-black text-slate-950">
                        {f.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {f.detail}
                      </p>

                      {(f.owner || f.dueLabel || f.ruleSource) && (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {f.owner ? `Owner: ${f.owner}` : ""}
                          {f.owner && f.dueLabel ? "  |  " : ""}
                          {f.dueLabel ? `Due: ${f.dueLabel}` : ""}
                          {(f.owner || f.dueLabel) && f.ruleSource
                            ? "  |  "
                            : ""}
                          {f.ruleSource ? `Rule: ${f.ruleSource}` : ""}
                          {!f.ruleVerified && f.severity !== "GREEN"
                            ? "  |  rule awaiting verification"
                            : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          );
        })}

        {skipped.length > 0 && (
          <Reveal>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black text-slate-950">
                Checks not run
              </h2>
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
          </Reveal>
        )}

        {footerNote && (
          <p className="pt-4 text-center text-xs text-slate-400">
            {footerNote}
          </p>
        )}
      </div>
    </main>
  );
}
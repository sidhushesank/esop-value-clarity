import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { LockKeyhole, LinkIcon } from "lucide-react";

import ShareReportView, {
  type ShareFinding,
} from "@/components/share/ShareReportView";
import SharePasscodeForm from "@/components/share/SharePasscodeForm";
import { companyTypeLabel, loadReportData } from "@/lib/advisor/report-data";
import {
  logShareView,
  resolveShareLink,
  shareCookieName,
  verifyShareCookie,
} from "@/lib/advisor/share";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ESOP Diligence Report",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

type PageProps = {
  params: Promise<{ token: string }>;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function fmtIso(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? iso : fmtDate(d);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}

function Unavailable() {
  return (
    <Shell>
      <div className="animate-in rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm duration-500 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <LinkIcon size={20} />
        </span>

        <h1 className="mt-5 text-lg font-black text-slate-950">
          This link is not available
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          It may have expired or been withdrawn. Please contact the firm that
          sent it to you.
        </p>
      </div>
    </Shell>
  );
}

export default async function SharedReportPage({ params }: PageProps) {
  const { token } = await params;
  const link = await resolveShareLink(token);

  if (!link) return <Unavailable />;

  if (link.passcodeHash) {
    const cookieStore = await cookies();
    const value = cookieStore.get(shareCookieName(link.id))?.value;

    if (!verifyShareCookie(value, link.id)) {
      return (
        <Shell>
          <div className="animate-in rounded-3xl border border-slate-200 bg-white p-8 shadow-sm duration-500 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <LockKeyhole size={20} />
            </span>

            <h1 className="mt-5 text-lg font-black text-slate-950">
              Protected report
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter the passcode you were given to view this report.
            </p>

            <SharePasscodeForm token={token} />
          </div>
        </Shell>
      );
    }
  }

  const data = await loadReportData(link.clientId, link.runId);

  if (!data) return <Unavailable />;

  await logShareView(link.id, await headers());

  const findings: ShareFinding[] = data.findings.map((f) => ({
    severity: f.severity,
    title: f.title,
    detail: f.detail,
    owner: f.owner,
    dueDate: f.dueDate ? f.dueDate.toISOString() : null,
    dueLabel: f.dueDate ? fmtDate(f.dueDate) : null,
    ruleSource: f.ruleSource,
    ruleVerified: f.ruleVerified,
  }));

  return (
    <ShareReportView
      token={token}
      brand={data.brand}
      footerNote={data.footer}
      clientName={data.client.name}
      companyType={companyTypeLabel(data.client.companyType)}
      cin={data.client.cin}
      asOf={data.run.asOf}
      asOfLabel={fmtIso(data.run.asOf)}
      score={data.run.score}
      findings={findings}
      skipped={data.skipped}
    />
  );
}
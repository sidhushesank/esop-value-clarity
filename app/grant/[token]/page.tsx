import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { LinkIcon, LockKeyhole } from "lucide-react";

import EmployeeGrantView from "@/components/company/EmployeeGrantView";
import GrantPasscodeForm from "@/components/company/GrantPasscodeForm";
import {
  grantCookieName,
  logGrantView,
  resolveGrantLink,
  verifyGrantCookie,
} from "@/lib/company/grant-links";
import { buildEmployeeView } from "@/lib/company/employee-view-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your ESOP grant",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

type PageProps = { params: Promise<{ token: string }> };

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}

function Unavailable() {
  return (
    <Shell>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <LinkIcon size={20} />
        </span>
        <h1 className="mt-5 text-lg font-black text-slate-950">This link is not available</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          It may have expired or been replaced, or your company&apos;s ESOP Value Clarity plan may have
          ended. Please ask your company for a new link.
        </p>
      </div>
    </Shell>
  );
}

export default async function EmployeeGrantPage({ params }: PageProps) {
  const { token } = await params;
  const link = await resolveGrantLink(token);

  if (!link) return <Unavailable />;

  if (link.passcodeHash) {
    const store = await cookies();
    if (!verifyGrantCookie(store.get(grantCookieName(link.id))?.value, link.id)) {
      return (
        <Shell>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <LockKeyhole size={20} />
            </span>
            <h1 className="mt-5 text-lg font-black text-slate-950">Your ESOP grant</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {link.grant.workspace.name} protected this page. Enter the passcode they gave you.
            </p>
            <GrantPasscodeForm token={token} />
          </div>
        </Shell>
      );
    }
  }

  await logGrantView(link.id);

  return <EmployeeGrantView token={token} data={buildEmployeeView(link)} />;
}

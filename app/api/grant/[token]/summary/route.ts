import { NextResponse } from "next/server";

import { requireOpenGrantLink } from "@/lib/company/grant-link-guard";
import { buildEmployeeView } from "@/lib/company/employee-view-data";
import { buildGrantSummaryPdf } from "@/lib/company/grant-summary-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

const STATUS_LABEL: Record<string, string> = {
  ISSUED: "Issued, awaiting your acceptance",
  ACCEPTED: "Accepted",
  LEFT: "You have left the company",
  EXERCISED: "Exercised",
};

/** GET /api/grant/[token]/summary: the employee's own grant summary PDF. */
export async function GET(_request: Request, { params }: Ctx) {
  const { token } = await params;
  const link = await requireOpenGrantLink(token);

  if (!link) {
    return NextResponse.json(
      { success: false, code: "UNAVAILABLE", message: "This document is not available." },
      { status: 404 }
    );
  }

  const g = link.grant;
  const view = buildEmployeeView(link);

  const bytes = await buildGrantSummaryPdf({
    audience: "EMPLOYEE",
    companyName: g.workspace.name,
    companyCin: g.workspace.cin,
    schemeName: g.scheme.name,
    employeeName: g.employeeName,
    employeeRef: g.employeeRef,
    status: STATUS_LABEL[g.status] ?? g.status,
    grantDate: g.grantDate,
    options: g.options,
    exercisePrice: g.exercisePrice,
    vestingStart: g.vestingStart,
    vestingMonths: g.vestingMonths,
    cliffMonths: g.cliffMonths,
    expiryDate: g.expiryDate,
    postExitDays: g.postExitDays,
    milestones: view.milestones.map((m) => ({ ...m, date: new Date(m.date) })),
    warnings: [],
    vestedToday: view.position.vested,
    fmvPerShare: view.fmv?.perShare ?? null,
    fmvDate: g.workspace.fmvValuationDate,
    leftOn: g.leftOn,
    exerciseWindowEnds: view.position.exerciseWindowEnds ? new Date(view.position.exerciseWindowEnds) : null,
  });

  const safe = g.employeeName.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "employee";

  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="my-grant-summary-${safe}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse } from "@/lib/company-http";
import { grantDetail } from "@/lib/company/grants-data";
import { buildGrantSummaryPdf } from "@/lib/company/grant-summary-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ grantId: string }> };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft (not issued)",
  ISSUED: "Issued",
  ACCEPTED: "Accepted by employee",
  LEFT: "Employee has left",
  LAPSED: "Lapsed",
  EXERCISED: "Exercised",
};

/** GET /api/company/grants/[grantId]/summary: draft grant summary PDF. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { grantId } = await params;

    const grant = await prisma.optionGrant.findFirst({
      where: { id: grantId, workspaceId: workspace.id },
      include: { scheme: true },
    });
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);

    const detail = await grantDetail(grant, workspace);

    const bytes = await buildGrantSummaryPdf({
      companyName: workspace.name,
      companyCin: workspace.cin,
      schemeName: grant.scheme.name,
      employeeName: grant.employeeName,
      employeeRef: grant.employeeRef,
      status: STATUS_LABEL[grant.status] ?? grant.status,
      grantDate: grant.grantDate,
      options: grant.options,
      exercisePrice: grant.exercisePrice,
      vestingStart: grant.vestingStart,
      vestingMonths: grant.vestingMonths,
      cliffMonths: grant.cliffMonths,
      expiryDate: grant.expiryDate,
      postExitDays: grant.postExitDays,
      milestones: detail.milestones,
      warnings: detail.warnings,
    });

    const safe = grant.employeeName.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "employee";

    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="grant-summary-${safe}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

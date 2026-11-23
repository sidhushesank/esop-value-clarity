import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import { loadExpense } from "@/lib/company/expense-data";
import { buildExpensePdf } from "@/lib/company/expense-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const data = await loadExpense(workspace, new URL(request.url).searchParams.get("fy"));
    const bytes = await buildExpensePdf(workspace.name, data.jurisdiction, data.report);
    const safe = workspace.name.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40) || "company";
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safe}_ESOP_expense_${data.report.period.label.replace(/\s+/g, "_")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

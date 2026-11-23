import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import { loadExpense } from "@/lib/company/expense-data";

export const dynamic = "force-dynamic";

/** GET /api/company/expense?fy=2026: policy, per-grant values and the expense report for a financial year. */
export async function GET(request: Request) {
  try {
    const { workspace, role } = await requireCompanyWorkspace();
    const data = await loadExpense(workspace, new URL(request.url).searchParams.get("fy"));
    return NextResponse.json({ success: true, ...data, canEdit: role !== "VIEWER" });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

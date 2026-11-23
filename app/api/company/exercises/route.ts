import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import { listExercises } from "@/lib/company/exercises-data";

export const dynamic = "force-dynamic";

/** GET /api/company/exercises: every exercise with its allotment and filings. */
export async function GET() {
  try {
    const { workspace, role } = await requireCompanyWorkspace();
    const data = await listExercises(workspace.id, workspace.jurisdiction === "US" ? "US" : "IN");
    return NextResponse.json({ success: true, ...data, canEdit: role !== "VIEWER" });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

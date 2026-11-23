import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import { listExercises } from "@/lib/company/exercises-data";
import { buildExercisesWorkbook } from "@/lib/company/exercises-excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const j = workspace.jurisdiction === "US" ? "US" : "IN";
    const { exercises } = await listExercises(workspace.id, j);
    const bytes = await buildExercisesWorkbook(workspace.name, j, exercises);
    const safe = workspace.name.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40) || "company";
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safe}_exercises.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

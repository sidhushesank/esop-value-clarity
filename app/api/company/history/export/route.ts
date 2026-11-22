import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import { listChanges } from "@/lib/change-log";
import { buildChangeLogWorkbook, changeLogFileName } from "@/lib/change-log-excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/company/history/export: the full change history as Excel. */
export async function GET() {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { rows } = await listChanges({ scope: "COMPANY", workspaceId: workspace.id }, { all: true });
    const bytes = await buildChangeLogWorkbook(workspace.name, rows);

    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${changeLogFileName(workspace.name)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

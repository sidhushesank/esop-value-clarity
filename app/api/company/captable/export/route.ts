import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse, badRequest } from "@/lib/company-http";
import { loadCapTable } from "@/lib/company/captable-data";
import { buildCapTableWorkbook, capTableFileName } from "@/lib/company/captable-excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/company/captable/export[?asOf=YYYY-MM-DD]: Excel cap table + movement log. */
export async function GET(request: Request) {
  try {
    const { workspace } = await requireCompanyWorkspace();

    const asOfRaw = new URL(request.url).searchParams.get("asOf");
    let asOf: Date | undefined;
    if (asOfRaw) {
      asOf = new Date(asOfRaw);
      if (Number.isNaN(asOf.getTime())) return badRequest("The date is not valid.");
    }

    const data = await loadCapTable(workspace.id, asOf);
    const bytes = await buildCapTableWorkbook(workspace.name, data, workspace.jurisdiction);

    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${capTableFileName(workspace.name)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

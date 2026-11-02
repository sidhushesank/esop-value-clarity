import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse, badRequest } from "@/lib/company-http";
import { loadCapTable } from "@/lib/company/captable-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/company/captable[?asOf=YYYY-MM-DD]
 * Classes, shareholders, the movement log and the computed cap table.
 */
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

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

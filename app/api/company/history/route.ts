import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import { listChanges } from "@/lib/change-log";

export const dynamic = "force-dynamic";

const TYPES = new Set(["company", "class", "holder", "movement", "scheme", "grant", "exercise", "import", "team"]);

/** GET /api/company/history?before=<iso>&type=<entityType>: change history, newest first. */
export async function GET(request: Request) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    const result = await listChanges(
      { scope: "COMPANY", workspaceId: workspace.id },
      { before: url.searchParams.get("before"), entityType: type && TYPES.has(type) ? type : null }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

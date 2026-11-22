import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import { listGrants } from "@/lib/company/grants-data";
import { buildRegisterWorkbook, registerFileName } from "@/lib/company/register-excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/company/grants/register: options register (Excel). */
export async function GET() {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const grants = await listGrants(workspace.id);
    const bytes = await buildRegisterWorkbook(workspace.name, grants, workspace.jurisdiction);

    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${registerFileName(workspace.name, workspace.jurisdiction)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

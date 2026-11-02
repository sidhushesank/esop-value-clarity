import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import { parseKind } from "@/lib/company/import/server";
import { buildImportTemplate } from "@/lib/company/import/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kind: string }> };

/** GET /api/company/import/[kind]/template: blank Excel template with instructions. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    await requireCompanyWorkspace();
    const kind = parseKind((await params).kind);
    const bytes = await buildImportTemplate(kind);

    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="evc-${kind === "captable" ? "cap-table" : "grants"}-import-template.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

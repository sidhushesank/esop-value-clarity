import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse, validationError } from "@/lib/company-http";
import { esopSchemeSchema } from "@/lib/company/schemas";
import { listSchemes } from "@/lib/company/grants-data";

export const dynamic = "force-dynamic";

/** GET /api/company/schemes: schemes with pool usage. */
export async function GET() {
  try {
    const { workspace } = await requireCompanyWorkspace();
    return NextResponse.json({ success: true, schemes: await listSchemes(workspace.id) });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** POST /api/company/schemes: record an ESOP scheme and its pool. */
export async function POST(request: Request) {
  try {
    const { workspace } = await requireCompanyWorkspace();

    const body = await request.json().catch(() => null);
    const parsed = esopSchemeSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const scheme = await prisma.esopScheme.create({
      data: { ...parsed.data, workspaceId: workspace.id },
    });

    return NextResponse.json({ success: true, scheme }, { status: 201 });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

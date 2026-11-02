import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse, validationError } from "@/lib/company-http";
import { shareholderSchema } from "@/lib/company/schemas";

/** POST /api/company/captable/holders: add a shareholder. */
export async function POST(request: Request) {
  try {
    const { workspace } = await requireCompanyWorkspace();

    const body = await request.json().catch(() => null);
    const parsed = shareholderSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const holder = await prisma.shareholder.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        email: parsed.data.email ?? null,
        isResident: parsed.data.isResident,
        workspaceId: workspace.id,
      },
    });

    return NextResponse.json({ success: true, holder }, { status: 201 });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse, validationError } from "@/lib/company-http";
import { shareholderSchema } from "@/lib/company/schemas";
import { logCompanyChange } from "@/lib/change-log";

/** POST /api/company/captable/holders: add a shareholder. */
export async function POST(request: Request) {
  try {
    const { workspace, user } = await requireCompanyWorkspace();

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

    await logCompanyChange({ user, workspace }, {
      action: "holder.created",
      entityType: "holder",
      entityId: holder.id,
      summary: `Added ${holder.type.toLowerCase()} "${holder.name}" to the cap table.`,
    });
    return NextResponse.json({ success: true, holder }, { status: 201 });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

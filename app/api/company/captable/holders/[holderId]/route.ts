import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { shareholderSchema } from "@/lib/company/schemas";
import { logCompanyChange } from "@/lib/change-log";

type Ctx = { params: Promise<{ holderId: string }> };

async function findHolder(workspaceId: string, holderId: string) {
  return prisma.shareholder.findFirst({ where: { id: holderId, workspaceId } });
}

/** PATCH: edit a shareholder. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const { holderId } = await params;

    const existing = await findHolder(workspace.id, holderId);
    if (!existing) return badRequest("Shareholder not found.", "NOT_FOUND", 404);

    const body = await request.json().catch(() => null);
    const parsed = shareholderSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const holder = await prisma.shareholder.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        email: parsed.data.email ?? null,
        isResident: parsed.data.isResident,
      },
    });

    await logCompanyChange({ user, workspace }, {
      action: "holder.updated",
      entityType: "holder",
      entityId: holder.id,
      summary: `Edited "${holder.name}".`,
      details: { before: existing.name, after: holder.name, type: holder.type },
    });
    return NextResponse.json({ success: true, holder });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** DELETE: only a shareholder with no movements can be removed. */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const { holderId } = await params;

    const existing = await findHolder(workspace.id, holderId);
    if (!existing) return badRequest("Shareholder not found.", "NOT_FOUND", 404);

    const used = await prisma.shareMovement.count({
      where: {
        workspaceId: workspace.id,
        OR: [{ fromHolderId: existing.id }, { toHolderId: existing.id }],
      },
    });

    if (used > 0) {
      return badRequest(
        "This shareholder has share movements. Delete those movements first.",
        "IN_USE",
        409
      );
    }

    await logCompanyChange({ user, workspace }, {
      action: "holder.deleted",
      entityType: "holder",
      entityId: existing.id,
      summary: `Removed "${existing.name}" from the cap table.`,
    });
    await prisma.shareholder.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

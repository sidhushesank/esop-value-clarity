import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { securityClassSchema } from "@/lib/company/schemas";
import { logCompanyChange } from "@/lib/change-log";

type Ctx = { params: Promise<{ classId: string }> };

async function findClass(workspaceId: string, classId: string) {
  return prisma.securityClass.findFirst({ where: { id: classId, workspaceId } });
}

/** PATCH: edit a class's terms. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace();
    const { classId } = await params;

    const existing = await findClass(workspace.id, classId);
    if (!existing) return badRequest("Class not found.", "NOT_FOUND", 404);

    const body = await request.json().catch(() => null);
    const parsed = securityClassSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    try {
      const updated = await prisma.securityClass.update({
        where: { id: existing.id },
        data: parsed.data,
      });
      await logCompanyChange({ user, workspace }, {
        action: "class.updated",
        entityType: "class",
        entityId: updated.id,
        summary: `Edited share class "${updated.name}".`,
        details: { before: existing.name, after: updated.name, kind: updated.kind },
      });
      return NextResponse.json({ success: true, class: updated });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return badRequest("A class with this name already exists.", "DUPLICATE", 409);
      }
      throw e;
    }
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** DELETE: only a class with no movements can be removed. */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace();
    const { classId } = await params;

    const existing = await findClass(workspace.id, classId);
    if (!existing) return badRequest("Class not found.", "NOT_FOUND", 404);

    const used = await prisma.shareMovement.count({
      where: {
        workspaceId: workspace.id,
        OR: [{ classId: existing.id }, { toClassId: existing.id }],
      },
    });

    if (used > 0) {
      return badRequest(
        "This class has share movements. Delete those movements first.",
        "IN_USE",
        409
      );
    }

    await logCompanyChange({ user, workspace }, {
      action: "class.deleted",
      entityType: "class",
      entityId: existing.id,
      summary: `Deleted share class "${existing.name}".`,
    });
    await prisma.securityClass.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

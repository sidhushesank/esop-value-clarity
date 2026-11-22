import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { securityClassSchema } from "@/lib/company/schemas";
import { logCompanyChange } from "@/lib/change-log";

/** POST /api/company/captable/classes: add a class (Equity, Series A CCPS, iSAFE...). */
export async function POST(request: Request) {
  try {
    const { workspace, user } = await requireCompanyWorkspace();

    const body = await request.json().catch(() => null);
    const parsed = securityClassSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    try {
      const created = await prisma.securityClass.create({
        data: { ...parsed.data, workspaceId: workspace.id },
      });
      await logCompanyChange({ user, workspace }, {
        action: "class.created",
        entityType: "class",
        entityId: created.id,
        summary: `Added share class "${created.name}" (${created.kind}).`,
      });
      return NextResponse.json({ success: true, class: created }, { status: 201 });
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

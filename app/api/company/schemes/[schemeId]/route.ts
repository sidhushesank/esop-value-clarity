import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { esopSchemeSchema } from "@/lib/company/schemas";
import { poolUsed } from "@/lib/company/grants-data";

type Ctx = { params: Promise<{ schemeId: string }> };

async function findScheme(workspaceId: string, schemeId: string) {
  return prisma.esopScheme.findFirst({
    where: { id: schemeId, workspaceId, archivedAt: null },
  });
}

/** PATCH: edit a scheme. The pool cannot shrink below options already issued. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { schemeId } = await params;

    const scheme = await findScheme(workspace.id, schemeId);
    if (!scheme) return badRequest("Scheme not found.", "NOT_FOUND", 404);

    const body = await request.json().catch(() => null);
    const parsed = esopSchemeSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const used = await poolUsed(scheme.id);
    if (parsed.data.poolSize < used) {
      return badRequest(
        `${used.toLocaleString("en-IN")} options are already issued from this pool, so it cannot be smaller than that.`,
        "POOL_TOO_SMALL",
        409
      );
    }

    const updated = await prisma.esopScheme.update({
      where: { id: scheme.id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, scheme: updated });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** DELETE: only a scheme with no grants can be removed. */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { schemeId } = await params;

    const scheme = await findScheme(workspace.id, schemeId);
    if (!scheme) return badRequest("Scheme not found.", "NOT_FOUND", 404);

    const grants = await prisma.optionGrant.count({ where: { schemeId: scheme.id } });
    if (grants > 0) {
      return badRequest("This scheme has grants. Delete or keep them first.", "IN_USE", 409);
    }

    await prisma.esopScheme.delete({ where: { id: scheme.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse } from "@/lib/company-http";
import { findNegativeBalance } from "@/lib/company/captable";
import { loadMovements } from "@/lib/company/captable-data";
import { describeNegative } from "@/lib/company/movement-errors";

type Ctx = { params: Promise<{ movementId: string }> };

/**
 * DELETE /api/company/captable/movements/[movementId]
 * Refused if removing it would leave a later transfer, buyback or conversion
 * spending units the holder never had.
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { movementId } = await params;

    const target = await prisma.shareMovement.findFirst({
      where: { id: movementId, workspaceId: workspace.id },
      select: { id: true },
    });

    if (!target) return badRequest("Entry not found.", "NOT_FOUND", 404);

    const remaining = (await loadMovements(workspace.id)).filter(
      (m) => m.id !== target.id
    );

    const negative = findNegativeBalance(remaining);
    if (negative) {
      return badRequest(
        `This entry cannot be deleted: a later entry depends on it. ${await describeNegative(negative)}`,
        "IN_USE",
        409
      );
    }

    await prisma.shareMovement.delete({ where: { id: target.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

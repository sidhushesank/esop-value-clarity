import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { shareMovementSchema } from "@/lib/company/schemas";
import { findNegativeBalance } from "@/lib/company/captable";
import { loadMovements } from "@/lib/company/captable-data";
import { describeNegative } from "@/lib/company/movement-errors";

/**
 * POST /api/company/captable/movements
 * Records an allotment, transfer, conversion or buyback. Rejected if any
 * holder would hold fewer than zero units of a class at any point in time.
 */
export async function POST(request: Request) {
  try {
    const { workspace } = await requireCompanyWorkspace();

    const body = await request.json().catch(() => null);
    const parsed = shareMovementSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const input = parsed.data;

    // Every referenced class and holder must belong to this workspace.
    const classIds = [input.classId, input.toClassId].filter(Boolean) as string[];
    const holderIds = [input.fromHolderId, input.toHolderId].filter(Boolean) as string[];

    const [classes, holders] = await Promise.all([
      prisma.securityClass.findMany({
        where: { id: { in: classIds }, workspaceId: workspace.id, archivedAt: null },
        select: { id: true },
      }),
      prisma.shareholder.findMany({
        where: { id: { in: holderIds }, workspaceId: workspace.id, archivedAt: null },
        select: { id: true },
      }),
    ]);

    if (classes.length !== new Set(classIds).size) {
      return badRequest("A chosen class was not found.", "NOT_FOUND", 404);
    }
    if (holders.length !== new Set(holderIds).size) {
      return badRequest("A chosen shareholder was not found.", "NOT_FOUND", 404);
    }

    const candidate = {
      id: "__new__",
      kind: input.kind,
      date: input.date,
      createdAt: new Date(),
      classId: input.classId,
      toClassId: input.kind === "CONVERSION" ? (input.toClassId ?? null) : null,
      fromHolderId: input.kind === "ALLOTMENT" ? null : (input.fromHolderId ?? null),
      toHolderId:
        input.kind === "BUYBACK" || input.kind === "CONVERSION"
          ? null
          : (input.toHolderId ?? null),
      quantity: input.quantity,
      toQuantity: input.kind === "CONVERSION" ? (input.toQuantity ?? null) : null,
    };

    const existing = await loadMovements(workspace.id);
    const negative = findNegativeBalance([...existing, candidate]);

    if (negative) {
      return badRequest(await describeNegative(negative, workspace.jurisdiction), "INSUFFICIENT_UNITS", 409);
    }

    const movement = await prisma.shareMovement.create({
      data: {
        workspaceId: workspace.id,
        kind: candidate.kind,
        date: candidate.date,
        classId: candidate.classId,
        toClassId: candidate.toClassId,
        fromHolderId: candidate.fromHolderId,
        toHolderId: candidate.toHolderId,
        quantity: candidate.quantity,
        toQuantity: candidate.toQuantity,
        pricePerShare: input.pricePerShare ?? null,
        note: input.note,
      },
    });

    return NextResponse.json({ success: true, movement }, { status: 201 });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

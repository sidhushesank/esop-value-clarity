import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { clientInputSchema } from "@/lib/advisor-schemas";

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;

    await requireClientInFirm(firm.id, clientId);

    const client = await prisma.clientCompany.findUnique({
      where: { id: clientId },
      include: {
        resolutions: { orderBy: { passedOn: "asc" } },
        valuations: { orderBy: { valuationDate: "desc" } },
        batches: { orderBy: { createdAt: "desc" } },
        _count: { select: { grants: true, exercises: true, capTable: true } },
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;

    await requireClientInFirm(firm.id, clientId);

    const body = await request.json().catch(() => null);
    const parsed = clientInputSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid input.",
        },
        { status: 400 }
      );
    }

    const client = await prisma.clientCompany.update({
      where: { id: clientId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, client });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

// Archive, not hard delete: the firm's history and reports stay intact.
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;

    await requireClientInFirm(firm.id, clientId);

    await prisma.clientCompany.update({
      where: { id: clientId },
      data: { archivedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  assertCanAddClient,
  requireAdvisorFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { clientInputSchema } from "@/lib/advisor-schemas";
import { logAdvisorChange } from "@/lib/change-log";

export async function GET() {
  try {
    const { firm } = await requireAdvisorFirm();

    const clients = await prisma.clientCompany.findMany({
      where: { firmId: firm.id, archivedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { grants: true, exercises: true, runs: true },
        },
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, score: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({ success: true, clients });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { firm, isFounder, clientLimit, user } = await requireAdvisorFirm({ write: true });

    const body = await request.json().catch(() => null);
    const parsed = clientInputSchema.safeParse(body);

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

    await assertCanAddClient(firm.id, clientLimit, isFounder);

    const client = await prisma.clientCompany.create({
      data: { ...parsed.data, firmId: firm.id },
    });

    await logAdvisorChange({ user, firm }, client.id, {
      action: "client.created",
      entityType: "client",
      entityId: client.id,
      summary: `Added client company "${client.name}".`,
    });
    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
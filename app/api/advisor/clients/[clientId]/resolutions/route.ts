import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import {
  resolutionInputSchema,
  validationFailure,
} from "@/lib/advisor-schemas";
import { logAdvisorChange } from "@/lib/change-log";

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;
    await requireClientInFirm(firm.id, clientId);

    const resolutions = await prisma.clientResolution.findMany({
      where: { clientId },
      orderBy: { passedOn: "asc" },
    });

    return NextResponse.json({ success: true, resolutions });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { firm, user } = await requireAdvisorFirm();
    const { clientId } = await params;
    await requireClientInFirm(firm.id, clientId);

    const body = await request.json().catch(() => null);
    const parsed = resolutionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        validationFailure(parsed.error.issues[0]?.message ?? "Invalid input."),
        { status: 400 }
      );
    }

    const resolution = await prisma.clientResolution.create({
      data: { ...parsed.data, clientId },
    });

    await logAdvisorChange({ user, firm }, clientId, {
      action: "resolution.created",
      entityType: "resolution",
      entityId: resolution.id,
      summary: `Recorded the ${resolution.kind === "BOARD_SCHEME_APPROVAL" ? "board" : "shareholder"} approval of the ESOP scheme passed on ${resolution.passedOn.toISOString().slice(0, 10)}.`,
      details: { kind: resolution.kind, vote: resolution.vote, passedOn: resolution.passedOn, mgt14Filed: resolution.mgt14Filed },
    });
    return NextResponse.json({ success: true, resolution }, { status: 201 });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
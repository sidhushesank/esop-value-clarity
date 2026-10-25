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
    const { firm } = await requireAdvisorFirm();
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

    return NextResponse.json({ success: true, resolution }, { status: 201 });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
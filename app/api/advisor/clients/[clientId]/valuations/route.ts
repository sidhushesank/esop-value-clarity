import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import {
  valuationInputSchema,
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

    const valuations = await prisma.clientValuation.findMany({
      where: { clientId },
      orderBy: { valuationDate: "desc" },
    });

    return NextResponse.json({ success: true, valuations });
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
    const parsed = valuationInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        validationFailure(parsed.error.issues[0]?.message ?? "Invalid input."),
        { status: 400 }
      );
    }

    const valuation = await prisma.clientValuation.create({
      data: { ...parsed.data, clientId },
    });

    await logAdvisorChange({ user, firm }, clientId, {
      action: "valuation.created",
      entityType: "valuation",
      entityId: valuation.id,
      summary: `Recorded a valuation of Rs. ${valuation.fmvPerShare.toLocaleString("en-IN")} per share dated ${valuation.valuationDate.toISOString().slice(0, 10)}${valuation.valuerName ? ` by ${valuation.valuerName}` : ""}.`,
      details: { fmvPerShare: valuation.fmvPerShare, valuationDate: valuation.valuationDate, valuer: valuation.valuerName },
    });
    return NextResponse.json({ success: true, valuation }, { status: 201 });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
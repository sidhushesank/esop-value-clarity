import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import {
  taxEventInputSchema,
  validationFailure,
} from "@/lib/advisor-schemas";
import { validateEventOwnership } from "@/lib/advisor/tax/event-validation";
import { computeClientLedger, dayStart } from "@/lib/advisor/tax/ledger-data";

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;

    await requireClientInFirm(firm.id, clientId);

    const events = await prisma.taxEvent.findMany({
      where: { clientId, employee: { archivedAt: null } },
      orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, events });
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
    const parsed = taxEventInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        validationFailure(parsed.error.issues[0]?.message ?? "Invalid input."),
        { status: 400 }
      );
    }

    const data = await validateEventOwnership(clientId, parsed.data);

    const event = await prisma.taxEvent.create({
      data: { clientId, ...data },
    });

    // Store the audit record for the new state of the ledger.
    await computeClientLedger(clientId, dayStart(new Date()), { persist: true });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
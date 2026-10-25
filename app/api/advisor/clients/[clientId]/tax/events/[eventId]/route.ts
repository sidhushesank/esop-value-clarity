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
import { ProAccessError } from "@/lib/pro-access";
import { validateEventOwnership } from "@/lib/advisor/tax/event-validation";
import { computeClientLedger, dayStart } from "@/lib/advisor/tax/ledger-data";


type RouteContext = {
  params: Promise<{ clientId: string; eventId: string }>;
};

async function requireEvent(clientId: string, eventId: string) {
  const event = await prisma.taxEvent.findFirst({
    where: { id: eventId, clientId },
    select: { id: true },
  });

  if (!event) {
    throw new ProAccessError("Event not found.", 404, "EVENT_NOT_FOUND");
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId, eventId } = await params;

    await requireClientInFirm(firm.id, clientId);
    await requireEvent(clientId, eventId);

    const body = await request.json().catch(() => null);
    const parsed = taxEventInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        validationFailure(parsed.error.issues[0]?.message ?? "Invalid input."),
        { status: 400 }
      );
    }

    const data = await validateEventOwnership(clientId, parsed.data, eventId);

    const event = await prisma.taxEvent.update({
      where: { id: eventId },
      data,
    });

    await computeClientLedger(clientId, dayStart(new Date()), { persist: true });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId, eventId } = await params;

    await requireClientInFirm(firm.id, clientId);
    await requireEvent(clientId, eventId);

    // Sales pinned to this exercise fall back to oldest-lot-first.
    await prisma.taxEvent.updateMany({
      where: { clientId, lotEventId: eventId },
      data: { lotEventId: null },
    });

    await prisma.taxEvent.delete({ where: { id: eventId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
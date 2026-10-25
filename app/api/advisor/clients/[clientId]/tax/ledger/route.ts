import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { computeClientLedger, dayStart, syncTaxRules } from "@/lib/advisor/tax/ledger-data";

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { firm, isFounder } = await requireAdvisorFirm();
    const { clientId } = await params;

    const client = await requireClientInFirm(firm.id, clientId);

    // Make sure every rule exists (verification flags are never touched).
    await syncTaxRules();

    const ledger = await computeClientLedger(clientId, dayStart(new Date()));

    const valuations = await prisma.clientValuation.findMany({
      where: { clientId },
      orderBy: { valuationDate: "desc" },
      select: { id: true, valuationDate: true, fmvPerShare: true, reference: true },
    });

    return NextResponse.json({
      success: true,
      isFounder,
      client: {
        id: client.id,
        name: client.name,
        dpiitRecognised: client.dpiitRecognised,
        imbCertificate: client.imbCertificate,
      },
      valuations,
      ledger,
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
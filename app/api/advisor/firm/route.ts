import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";

export async function GET() {
  try {
    const { firm, isFounder, clientLimit } = await requireAdvisorFirm();

    const activeClients = await prisma.clientCompany.count({
      where: { firmId: firm.id, archivedAt: null },
    });

    return NextResponse.json({
      success: true,
      firm,
      isFounder,
      clientLimit: isFounder ? null : clientLimit,
      activeClients,
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
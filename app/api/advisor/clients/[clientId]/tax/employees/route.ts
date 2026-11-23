import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import {
  taxEmployeeInputSchema,
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

    const employees = await prisma.taxEmployee.findMany({
      where: { clientId, archivedAt: null },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, employees });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { firm, user } = await requireAdvisorFirm({ write: true });
    const { clientId } = await params;

    await requireClientInFirm(firm.id, clientId);

    const body = await request.json().catch(() => null);
    const parsed = taxEmployeeInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        validationFailure(parsed.error.issues[0]?.message ?? "Invalid input."),
        { status: 400 }
      );
    }

    const employee = await prisma.taxEmployee.create({
      data: {
        clientId,
        name: parsed.data.name,
        employeeRef: parsed.data.employeeRef,
        pan: parsed.data.pan ?? null,
        regime: parsed.data.regime,
        estimatedIncomeExclPerq: parsed.data.estimatedIncomeExclPerq,
        monthlyNetPay: parsed.data.monthlyNetPay ?? null,
        isPromoter: parsed.data.isPromoter,
      },
    });

    await logAdvisorChange({ user, firm }, clientId, {
      action: "tax_employee.created",
      entityType: "tax_employee",
      entityId: employee.id,
      summary: `Added employee "${employee.name}" to the Tax-Event Ledger.`,
      details: { regime: employee.regime },
    });
    return NextResponse.json({ success: true, employee }, { status: 201 });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
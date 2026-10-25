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
import { ProAccessError } from "@/lib/pro-access";

type RouteContext = {
  params: Promise<{ clientId: string; employeeId: string }>;
};

async function loadEmployee(clientId: string, employeeId: string) {
  const employee = await prisma.taxEmployee.findFirst({
    where: { id: employeeId, clientId, archivedAt: null },
    select: { id: true },
  });

  if (!employee) {
    throw new ProAccessError("Employee not found.", 404, "EMPLOYEE_NOT_FOUND");
  }

  return employee;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId, employeeId } = await params;

    await requireClientInFirm(firm.id, clientId);
    await loadEmployee(clientId, employeeId);

    const body = await request.json().catch(() => null);
    const parsed = taxEmployeeInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        validationFailure(parsed.error.issues[0]?.message ?? "Invalid input."),
        { status: 400 }
      );
    }

    const employee = await prisma.taxEmployee.update({
      where: { id: employeeId },
      data: {
        name: parsed.data.name,
        employeeRef: parsed.data.employeeRef,
        pan: parsed.data.pan ?? null,
        regime: parsed.data.regime,
        estimatedIncomeExclPerq: parsed.data.estimatedIncomeExclPerq,
        monthlyNetPay: parsed.data.monthlyNetPay ?? null,
        isPromoter: parsed.data.isPromoter,
      },
    });

    return NextResponse.json({ success: true, employee });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

// Archive, not delete: the employee's events and audit trail are kept.
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId, employeeId } = await params;

    await requireClientInFirm(firm.id, clientId);
    await loadEmployee(clientId, employeeId);

    await prisma.taxEmployee.update({
      where: { id: employeeId },
      data: { archivedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
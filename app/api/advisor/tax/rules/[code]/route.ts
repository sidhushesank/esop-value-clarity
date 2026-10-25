import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ProAccessError } from "@/lib/pro-access";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { taxRulePatchSchema, validationFailure } from "@/lib/advisor-schemas";

type RouteContext = {
  params: Promise<{ code: string }>;
};

// Founder only: marks a tax rule as verified (or not).
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { isFounder } = await requireAdvisorFirm();

    if (!isFounder) {
      throw new ProAccessError(
        "Only the founder can change rule verification.",
        403,
        "FOUNDER_ONLY"
      );
    }

    const { code } = await params;
    const body = await request.json().catch(() => null);
    const parsed = taxRulePatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(validationFailure("Invalid input."), { status: 400 });
    }

    const existing = await prisma.taxRule.findUnique({ where: { code } });

    if (!existing) {
      return NextResponse.json(
        { success: false, code: "NOT_FOUND", message: "Rule not found." },
        { status: 404 }
      );
    }

    const rule = await prisma.taxRule.update({
      where: { code },
      data: {
        verified: parsed.data.verified,
        verifiedAt: parsed.data.verified ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
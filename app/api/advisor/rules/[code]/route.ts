import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ProAccessError } from "@/lib/pro-access";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";

const patchSchema = z.object({
  verified: z.boolean().optional(),
  notes: z.string().trim().max(1000).optional(),
});

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { isFounder } = await requireAdvisorFirm({ write: true });

    if (!isFounder) {
      throw new ProAccessError(
        "Only the founder can change rule verification.",
        403,
        "FOUNDER_ONLY"
      );
    }

    const { code } = await params;
    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, code: "VALIDATION_ERROR", message: "Invalid input." },
        { status: 400 }
      );
    }

    const existing = await prisma.ruleDefinition.findUnique({ where: { code } });
    if (!existing) {
      return NextResponse.json(
        { success: false, code: "NOT_FOUND", message: "Rule not found." },
        { status: 404 }
      );
    }

    const rule = await prisma.ruleDefinition.update({
      where: { code },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
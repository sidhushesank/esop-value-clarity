import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { logAdvisorChange } from "@/lib/change-log";
import { coverage, fxClientLimit } from "@/lib/fx/data";
import { fxClientCreateSchema, validationError } from "@/lib/fx/schemas";

export const dynamic = "force-dynamic";

/** GET: the firm's individual (foreign equity) clients plus rate / price coverage. */
export async function GET() {
  try {
    const { firm, clientLimit, isFounder, role } = await requireAdvisorFirm();
    const [clients, cov] = await Promise.all([
      prisma.fxClient.findMany({
        where: { firmId: firm.id, archivedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, createdAt: true, _count: { select: { transactions: true } } },
      }),
      coverage(firm.id),
    ]);
    return NextResponse.json({
      success: true,
      clients,
      coverage: cov,
      limit: fxClientLimit(clientLimit, isFounder),
      canEdit: role !== "VIEWER",
      isFounder,
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdvisorFirm({ write: true });
    const parsed = fxClientCreateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json(validationError(parsed.error.issues[0]?.message), { status: 400 });

    const limit = fxClientLimit(ctx.clientLimit, ctx.isFounder);
    const count = await prisma.fxClient.count({ where: { firmId: ctx.firm.id, archivedAt: null } });
    if (count >= limit) {
      return NextResponse.json(
        { success: false, code: "FX_CLIENT_LIMIT", message: `Your plan allows ${limit} individual clients. Archive one or contact EVC to raise the limit.` },
        { status: 403 }
      );
    }

    const client = await prisma.fxClient.create({
      data: {
        firmId: ctx.firm.id,
        name: parsed.data.name,
        email: parsed.data.email || null,
        notes: parsed.data.notes || null,
      },
    });
    await logAdvisorChange(ctx, client.id, {
      action: "fx.client.created",
      entityType: "fx",
      entityId: client.id,
      summary: `Added individual client "${client.name}" (foreign equity tax).`,
    });
    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

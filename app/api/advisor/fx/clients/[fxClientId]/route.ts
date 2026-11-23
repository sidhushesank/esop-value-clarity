import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { logAdvisorChange } from "@/lib/change-log";
import { buildClientReport, requireFxClient } from "@/lib/fx/data";
import { iso } from "@/lib/fx/engine";
import { fxClientUpdateSchema, validationError } from "@/lib/fx/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The first view of a client may fetch SBI rates and share prices.
export const maxDuration = 60;

type RouteContext = { params: Promise<{ fxClientId: string }> };

/** GET: client, transactions and the full computed report. */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { firm, role } = await requireAdvisorFirm();
    const { fxClientId } = await params;
    const client = await requireFxClient(firm.id, fxClientId);
    const { txns, report, dataStatus } = await buildClientReport(firm.id, client, { sync: true });
    return NextResponse.json({
      success: true,
      client,
      dataStatus,
      canEdit: role !== "VIEWER",
      transactions: txns.map((t) => ({ ...t, date: iso(t.date) })),
      // Dates as "YYYY-MM-DD" (toJSON runs before a replacer sees the value, so check the holder).
      report: JSON.parse(
        JSON.stringify(report, function (this: Record<string, unknown>, k: string, v: unknown) {
          const raw = this[k];
          return raw instanceof Date ? iso(raw) : v;
        })
      ),
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const ctx = await requireAdvisorFirm({ write: true });
    const { fxClientId } = await params;
    const before = await requireFxClient(ctx.firm.id, fxClientId);
    const parsed = fxClientUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json(validationError(parsed.error.issues[0]?.message), { status: 400 });

    const d = parsed.data;
    const client = await prisma.fxClient.update({
      where: { id: before.id },
      data: {
        ...d,
        email: d.email === undefined ? undefined : d.email || null,
        notes: d.notes === undefined ? undefined : d.notes || null,
      },
    });
    const changed = Object.keys(d).filter(
      (k) => (before as Record<string, unknown>)[k] !== (client as Record<string, unknown>)[k]
    );
    if (changed.length) {
      await logAdvisorChange(ctx, client.id, {
        action: "fx.client.updated",
        entityType: "fx",
        entityId: client.id,
        summary: `Updated "${client.name}": ${changed.join(", ")}.`,
        details: Object.fromEntries(
          changed.map((k) => [k, { from: (before as Record<string, unknown>)[k], to: (client as Record<string, unknown>)[k] }])
        ),
      });
    }
    return NextResponse.json({ success: true, client });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

/** DELETE: archive (kept for history, hidden from lists). */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await requireAdvisorFirm({ write: true });
    const { fxClientId } = await params;
    const client = await requireFxClient(ctx.firm.id, fxClientId);
    await prisma.fxClient.update({ where: { id: client.id }, data: { archivedAt: new Date() } });
    await logAdvisorChange(ctx, client.id, {
      action: "fx.client.archived",
      entityType: "fx",
      entityId: client.id,
      summary: `Archived individual client "${client.name}".`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

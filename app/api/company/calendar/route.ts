import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import { collectDesk } from "@/lib/compliance/collect";

export const dynamic = "force-dynamic";

/** GET: every dated compliance item for the company. */
export async function GET() {
  try {
    const { workspace, role } = await requireCompanyWorkspace();
    const [items, owner] = await Promise.all([
      collectDesk(workspace),
      prisma.user.findUnique({ where: { id: workspace.ownerId }, select: { email: true } }),
    ]);
    return NextResponse.json({ success: true, items, canEdit: role !== "VIEWER", reminderEmail: owner?.email ?? null });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

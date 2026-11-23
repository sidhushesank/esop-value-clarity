import { NextResponse } from "next/server";

import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { buildIcs } from "@/lib/compliance/calendar";
import { collectFirm } from "@/lib/compliance/collect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const { firm } = await requireAdvisorFirm();
    const items = await collectFirm(firm);
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://esopvalueclarity.com";
    const name = firm.brandName || firm.name;
    const body = buildIcs(`${name} · client compliance`, items, site);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40) || "firm"}_compliance.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

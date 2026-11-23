import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import { buildIcs } from "@/lib/compliance/calendar";
import { collectDesk } from "@/lib/compliance/collect";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const items = await collectDesk(workspace);
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://esopvalueclarity.com";
    const body = buildIcs(`${workspace.name} · compliance`, items, site);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${workspace.name.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40) || "company"}_compliance.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

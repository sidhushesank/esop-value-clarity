import { NextResponse } from "next/server";

import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { syncRules } from "@/lib/advisor/rules";

export async function GET() {
  try {
    await requireAdvisorFirm();

    const rules = await syncRules();

    return NextResponse.json({ success: true, rules });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
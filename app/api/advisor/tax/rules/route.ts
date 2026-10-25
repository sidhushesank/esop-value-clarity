import { NextResponse } from "next/server";

import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { syncTaxRules } from "@/lib/advisor/tax/ledger-data";
import { TAX_RULE_SEEDS, TAX_RULE_SET_VERSION } from "@/lib/advisor/tax/rules";

export async function GET() {
  try {
    const { isFounder } = await requireAdvisorFirm();
    const rules = await syncTaxRules();

    const owners = new Map(TAX_RULE_SEEDS.map((r) => [r.code, r.owner]));

    return NextResponse.json({
      success: true,
      isFounder,
      ruleSetVersion: TAX_RULE_SET_VERSION,
      rules: rules.map((r) => ({
        code: r.code,
        title: r.title,
        source: r.source,
        notes: r.notes,
        verified: r.verified,
        verifiedAt: r.verifiedAt,
        owner: owners.get(r.code) ?? null,
      })),
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
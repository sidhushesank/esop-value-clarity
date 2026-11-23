import { NextResponse } from "next/server";

import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { getUploadedFile, readSheet } from "@/lib/advisor/import-parse";
import {
  analyseOther,
  fieldsFor,
  missingOtherFields,
  parseKind,
  parseOtherMapping,
  suggestOtherMapping,
} from "@/lib/advisor/import-other";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ clientId: string; kind: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm({ write: true });
    const { clientId, kind: kindParam } = await params;

    await requireClientInFirm(firm.id, clientId);

    const kind = parseKind(kindParam);
    const defs = fieldsFor(kind);

    const form = await request.formData();
    const { buffer, fileName } = await getUploadedFile(form);
    const sheet = await readSheet(buffer, fileName);

    const suggestedMapping = suggestOtherMapping(sheet.headers, defs);
    const mapping =
      parseOtherMapping(form.get("mapping"), sheet.headers.length, defs) ??
      suggestedMapping;

    const mode = form.get("mode") === "replace" ? "replace" : "append";
    const missing = missingOtherFields(mapping, defs);

    const base = {
      success: true,
      kind,
      fileName,
      headers: sheet.headers,
      fields: defs.map((d) => ({
        key: d.key,
        label: d.label,
        required: d.required,
      })),
      suggestedMapping,
      mapping,
      totalRows: sheet.rows.length,
    };

    if (missing.length > 0) {
      return NextResponse.json({ ...base, ready: false, missingRequired: missing });
    }

    const analysis = await analyseOther(kind, clientId, sheet.rows, mapping, mode);

    return NextResponse.json({
      ...base,
      ready: true,
      missingRequired: [],
      validCount: analysis.valid.length,
      invalidCount: analysis.invalid.length,
      invalid: analysis.invalid.slice(0, 50),
      sample: analysis.valid.slice(0, 5),
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
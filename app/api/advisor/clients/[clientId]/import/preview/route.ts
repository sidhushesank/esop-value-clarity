import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import {
  GRANT_FIELDS,
  missingRequiredFields,
  suggestMapping,
} from "@/lib/advisor/import-fields";
import {
  buildGrantRows,
  getUploadedFile,
  parseMappingField,
  readSheet,
} from "@/lib/advisor/import-parse";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm({ write: true });
    const { clientId } = await params;

    await requireClientInFirm(firm.id, clientId);

    const form = await request.formData();
    const { buffer, fileName } = await getUploadedFile(form);
    const sheet = await readSheet(buffer, fileName);

    const suggestedMapping = suggestMapping(sheet.headers);
    const mapping =
      parseMappingField(form.get("mapping"), sheet.headers.length) ??
      suggestedMapping;

    const missing = missingRequiredFields(mapping);

    const existingGrants = await prisma.registerGrant.count({
      where: { clientId },
    });

    const base = {
      success: true,
      fileName,
      headers: sheet.headers,
      fields: GRANT_FIELDS.map((f) => ({
        key: f.key,
        label: f.label,
        required: f.required,
      })),
      suggestedMapping,
      mapping,
      totalRows: sheet.rows.length,
      existingGrants,
    };

    if (missing.length > 0) {
      return NextResponse.json({
        ...base,
        ready: false,
        missingRequired: missing,
      });
    }

    const { valid, invalid } = buildGrantRows(sheet.rows, mapping);

    return NextResponse.json({
      ...base,
      ready: true,
      missingRequired: [],
      validCount: valid.length,
      invalidCount: invalid.length,
      invalid: invalid.slice(0, 50),
      sample: valid.slice(0, 5).map((g) => ({
        ...g,
        grantDate: g.grantDate.toISOString().slice(0, 10),
        vestingStartDate: g.vestingStartDate?.toISOString().slice(0, 10) ?? null,
        expiryDate: g.expiryDate?.toISOString().slice(0, 10) ?? null,
        leftOn: g.leftOn?.toISOString().slice(0, 10) ?? null,
      })),
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
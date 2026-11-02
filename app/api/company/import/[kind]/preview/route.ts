import { NextResponse } from "next/server";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { companyErrorResponse } from "@/lib/company-http";
import {
  capTableAnalysis,
  grantsAnalysis,
  parseKind,
  readImportForm,
} from "@/lib/company/import/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kind: string }> };

const MAX_LISTED = 200;

/**
 * POST /api/company/import/[kind]/preview (multipart: file, mapping?, asOf | schemeId)
 * Reads the file and checks every row. Nothing is saved.
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { workspace, holderLimit, isEvcOwner } = await requireCompanyWorkspace();
    const kind = parseKind((await params).kind);
    const { form, fileName, sheet, fields, mapping, missing } = await readImportForm(request, kind);

    const base = {
      success: true,
      kind,
      fileName,
      headers: sheet.headers,
      rowCount: sheet.rows.length,
      fields: fields.map(({ key, label, required, hint }) => ({ key, label, required, hint })),
      mapping,
      missing,
    };

    if (missing.length) return NextResponse.json({ ...base, ready: false });

    if (kind === "captable") {
      const { analysis, asOf } = await capTableAnalysis(workspace.id, sheet.rows, mapping, form.get("asOf"));
      return NextResponse.json({
        ...base,
        ready: analysis.invalid.length === 0 && analysis.items.length > 0,
        asOf,
        validCount: analysis.items.length,
        invalid: analysis.invalid.slice(0, MAX_LISTED),
        invalidCount: analysis.invalid.length,
        newClasses: analysis.newClasses,
        newHolders: analysis.newHolders,
        matchedHolders: analysis.matchedHolders,
        totalsByClass: analysis.totalsByClass,
        sample: analysis.items.slice(0, 50).map((i) => ({
          rowNumber: i.rowNumber,
          holderName: i.holderName,
          holderType: i.holderType,
          className: i.className,
          quantity: i.quantity,
          date: i.date,
          price: i.price,
        })),
      });
    }

    const { analysis, scheme } = await grantsAnalysis(
      workspace,
      sheet.rows,
      mapping,
      form.get("schemeId"),
      isEvcOwner ? null : holderLimit
    );

    return NextResponse.json({
      ...base,
      ready: analysis.invalid.length === 0 && analysis.blockers.length === 0 && analysis.items.length > 0,
      schemeName: scheme.name,
      validCount: analysis.items.length,
      invalid: analysis.invalid.slice(0, MAX_LISTED),
      invalidCount: analysis.invalid.length,
      blockers: analysis.blockers,
      pool: analysis.pool,
      holders: analysis.holders,
      warningRows: analysis.warningRows,
      warnings: analysis.items
        .filter((i) => i.warnings.length)
        .slice(0, MAX_LISTED)
        .map((i) => ({ rowNumber: i.rowNumber, employeeName: i.employeeName, messages: i.warnings.map((w) => w.message) })),
      byStatus: analysis.items.reduce<Record<string, number>>((acc, i) => {
        acc[i.status] = (acc[i.status] ?? 0) + 1;
        return acc;
      }, {}),
      sample: analysis.items.slice(0, 50).map((i) => ({
        rowNumber: i.rowNumber,
        employeeName: i.employeeName,
        options: i.options,
        exercisePrice: i.exercisePrice,
        grantDate: i.grantDate,
        status: i.status,
        optionsLapsed: i.optionsLapsed,
        optionsExercised: i.optionsExercised,
      })),
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

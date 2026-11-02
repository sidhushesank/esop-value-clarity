import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse } from "@/lib/company-http";
import {
  capTableAnalysis,
  grantsAnalysis,
  parseKind,
  readImportForm,
} from "@/lib/company/import/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ kind: string }> };

const IMPORT_NOTE = "Imported opening balance";

/**
 * POST /api/company/import/[kind]/commit (same form as preview)
 * The file is read and checked again on the server (nothing from the
 * preview is trusted). Saved only if every row is valid: all or nothing.
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { workspace, holderLimit, isEvcOwner } = await requireCompanyWorkspace();
    const kind = parseKind((await params).kind);
    const { form, sheet, mapping, missing } = await readImportForm(request, kind);

    if (missing.length) {
      return badRequest(`Choose a column for: ${missing.join(", ")}.`, "MAPPING_INCOMPLETE");
    }

    /* ---------------- Cap table ---------------- */
    if (kind === "captable") {
      const { analysis, classes, holders } = await capTableAnalysis(workspace.id, sheet.rows, mapping, form.get("asOf"));

      if (analysis.invalid.length) {
        return badRequest(`${analysis.invalid.length} row(s) have problems. Fix them and upload again.`, "INVALID_ROWS");
      }
      if (analysis.items.length === 0) return badRequest("There are no rows to import.", "EMPTY");

      const result = await prisma.$transaction(async (tx) => {
        const classIdByKey = new Map(classes.map((c) => [c.name.trim().toLowerCase().replace(/\s+/g, " "), c.id]));
        for (const c of analysis.newClasses) {
          const created = await tx.securityClass.create({
            data: { workspaceId: workspace.id, name: c.name, kind: c.kind },
            select: { id: true },
          });
          classIdByKey.set(c.name.trim().toLowerCase().replace(/\s+/g, " "), created.id);
        }

        const holderIdByKey = new Map(holders.map((h) => [h.name.trim().toLowerCase().replace(/\s+/g, " "), h.id]));
        for (const it of analysis.items) {
          if (holderIdByKey.has(it.holderKey)) continue;
          const created = await tx.shareholder.create({
            data: {
              workspaceId: workspace.id,
              name: it.holderName,
              type: it.holderType,
              email: it.email,
              isResident: it.isResident,
            },
            select: { id: true },
          });
          holderIdByKey.set(it.holderKey, created.id);
        }

        const movements = await tx.shareMovement.createMany({
          data: analysis.items.map((it) => ({
            workspaceId: workspace.id,
            kind: "ALLOTMENT" as const,
            date: it.date,
            classId: classIdByKey.get(it.classKey) as string,
            toHolderId: holderIdByKey.get(it.holderKey) as string,
            quantity: it.quantity,
            pricePerShare: it.price,
            note: IMPORT_NOTE,
          })),
        });

        return {
          movements: movements.count,
          newClasses: analysis.newClasses.length,
          newHolders: analysis.newHolders.length,
        };
      }, { timeout: 30_000 });

      return NextResponse.json({ success: true, kind, ...result });
    }

    /* ---------------- Grants ---------------- */
    const { analysis, scheme } = await grantsAnalysis(
      workspace,
      sheet.rows,
      mapping,
      form.get("schemeId"),
      isEvcOwner ? null : holderLimit
    );

    if (analysis.invalid.length) {
      return badRequest(`${analysis.invalid.length} row(s) have problems. Fix them and upload again.`, "INVALID_ROWS");
    }
    if (analysis.blockers.length) return badRequest(analysis.blockers[0], "BLOCKED", 409);
    if (analysis.items.length === 0) return badRequest("There are no rows to import.", "EMPTY");

    const now = new Date();
    const created = await prisma.optionGrant.createMany({
      data: analysis.items.map((it) => ({
        workspaceId: workspace.id,
        schemeId: scheme.id,
        employeeName: it.employeeName,
        employeeEmail: it.employeeEmail,
        employeeRef: it.employeeRef,
        holderKey: it.holderKey,
        isPromoterOver10Pct: it.isPromoterOver10Pct,
        grantDate: it.grantDate,
        options: it.options,
        exercisePrice: it.exercisePrice,
        vestingStart: it.vestingStart,
        vestingMonths: it.vestingMonths,
        cliffMonths: it.cliffMonths,
        expiryDate: it.expiryDate,
        postExitDays: it.postExitDays,
        status: it.status,
        issuedAt: it.status === "DRAFT" ? null : now,
        acceptedAt: it.status === "ACCEPTED" ? now : null,
        leftOn: it.leftOn,
        optionsLapsed: it.optionsLapsed,
        optionsExercised: it.optionsExercised,
        note: "Imported from spreadsheet",
      })),
    });

    return NextResponse.json({ success: true, kind, grants: created.count, scheme: scheme.name });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

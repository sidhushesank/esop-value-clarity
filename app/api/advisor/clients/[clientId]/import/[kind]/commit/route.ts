import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
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
} from "@/lib/advisor/import-other";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ clientId: string; kind: string }>;
};

function failure(message: string, code: string, extra?: object) {
  return NextResponse.json(
    { success: false, code, message, ...extra },
    { status: 400 }
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId, kind: kindParam } = await params;

    await requireClientInFirm(firm.id, clientId);

    const kind = parseKind(kindParam);
    const defs = fieldsFor(kind);

    const form = await request.formData();
    const { buffer, fileName } = await getUploadedFile(form);
    const sheet = await readSheet(buffer, fileName);

    const mapping = parseOtherMapping(
      form.get("mapping"),
      sheet.headers.length,
      defs
    );
    if (!mapping) {
      return failure("A column mapping is required.", "MAPPING_REQUIRED");
    }

    const missing = missingOtherFields(mapping, defs);
    if (missing.length > 0) {
      return failure(
        `Map these required columns first: ${missing.join(", ")}.`,
        "MAPPING_INCOMPLETE"
      );
    }

    const mode = form.get("mode") === "replace" ? "replace" : "append";
    const skipInvalid = form.get("skipInvalid") === "true";

    const analysis = await analyseOther(kind, clientId, sheet.rows, mapping, mode);

    if (analysis.invalid.length > 0 && !skipInvalid) {
      return failure(
        `${analysis.invalid.length} row(s) have problems. Fix the file, or confirm to skip them.`,
        "INVALID_ROWS",
        { invalid: analysis.invalid.slice(0, 50) }
      );
    }
    if (analysis.valid.length === 0) {
      return failure("There are no valid rows to import.", "NO_VALID_ROWS");
    }

    if (analysis.kind === "exercises") {
      const rows = analysis.valid;

      await prisma.$transaction(async (tx) => {
        // Exercise rows carry no batch, so "replace" clears this client's exercise log.
        if (mode === "replace") {
          await tx.registerExercise.deleteMany({ where: { clientId } });
        }

        await tx.registerExercise.createMany({
          data: rows.map((r) => ({
            clientId,
            grantId: r.grantId,
            exerciseDate: r.exerciseDate,
            optionsExercised: r.optionsExercised,
            allotmentDate: r.allotmentDate,
            pas3FiledOn: r.pas3FiledOn,
          })),
        });
      });
    } else {
      const rows = analysis.valid;

      await prisma.$transaction(async (tx) => {
        if (mode === "replace") {
          await tx.capTableRow.deleteMany({ where: { clientId } });
        }

        const batch = await tx.importBatch.create({
          data: {
            clientId,
            kind: "CAP_TABLE",
            fileName,
            rowCount: rows.length,
            mapping,
          },
        });

        await tx.capTableRow.createMany({
          data: rows.map((r) => ({
            clientId,
            batchId: batch.id,
            holderName: r.holderName,
            holderType: r.holderType,
            shares: r.shares,
          })),
        });
      });
    }

    return NextResponse.json({
      success: true,
      kind,
      imported: analysis.valid.length,
      skipped: analysis.invalid.length,
      skippedRows: analysis.invalid.slice(0, 50),
      mode,
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
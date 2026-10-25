import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { missingRequiredFields } from "@/lib/advisor/import-fields";
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

function failure(message: string, code: string, extra?: object) {
  return NextResponse.json(
    { success: false, code, message, ...extra },
    { status: 400 }
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;

    await requireClientInFirm(firm.id, clientId);

    const form = await request.formData();
    const { buffer, fileName } = await getUploadedFile(form);
    const sheet = await readSheet(buffer, fileName);

    const mapping = parseMappingField(form.get("mapping"), sheet.headers.length);

    if (!mapping) {
      return failure("A column mapping is required.", "MAPPING_REQUIRED");
    }

    const missing = missingRequiredFields(mapping);
    if (missing.length > 0) {
      return failure(
        `Map these required columns first: ${missing.join(", ")}.`,
        "MAPPING_INCOMPLETE"
      );
    }

    const mode = form.get("mode") === "replace" ? "replace" : "append";
    const skipInvalid = form.get("skipInvalid") === "true";

    const { valid, invalid } = buildGrantRows(sheet.rows, mapping);

    if (invalid.length > 0 && !skipInvalid) {
      return failure(
        `${invalid.length} row(s) have problems. Fix the file, or confirm to skip them.`,
        "INVALID_ROWS",
        { invalid: invalid.slice(0, 50) }
      );
    }

    if (valid.length === 0) {
      return failure("There are no valid rows to import.", "NO_VALID_ROWS");
    }

    const result = await prisma.$transaction(async (tx) => {
      // "replace" removes grants from earlier register imports of this client.
      // Their exercise rows are removed with them.
      if (mode === "replace") {
        await tx.registerGrant.deleteMany({
          where: { clientId, batch: { is: { kind: "REGISTER" } } },
        });
      }

      const batch = await tx.importBatch.create({
        data: {
          clientId,
          kind: "REGISTER",
          fileName,
          rowCount: valid.length,
          mapping,
        },
      });

      await tx.registerGrant.createMany({
        data: valid.map((grant) => ({
          clientId,
          batchId: batch.id,
          sourceRow: grant.sourceRow,
          employeeName: grant.employeeName,
          employeeRef: grant.employeeRef,
          grantDate: grant.grantDate,
          optionsGranted: grant.optionsGranted,
          exercisePrice: grant.exercisePrice,
          vestingStartDate: grant.vestingStartDate,
          vestingMonths: grant.vestingMonths,
          cliffMonths: grant.cliffMonths,
          expiryDate: grant.expiryDate,
          postExitExerciseDays: grant.postExitExerciseDays,
          optionsLapsed: grant.optionsLapsed,
          status: grant.status,
          leftOn: grant.leftOn,
        })),
      });

      return batch;
    });

    return NextResponse.json({
      success: true,
      batchId: result.id,
      imported: valid.length,
      skipped: invalid.length,
      skippedRows: invalid.slice(0, 50),
      mode,
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
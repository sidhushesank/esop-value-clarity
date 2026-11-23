import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { logCompanyChange } from "@/lib/change-log";
import { findNegativeBalance } from "@/lib/company/captable";
import { loadMovements } from "@/lib/company/captable-data";
import { allotShares, statusAfterExercise } from "@/lib/company/exercises-data";
import { updateExerciseSchema } from "@/lib/company/exercise-schemas";

type Ctx = { params: Promise<{ exerciseId: string }> };

const LABELS: Record<string, string> = {
  fmvPerShare: "value per share",
  pas3FiledOn: "PAS-3 filed on",
  pas3Srn: "PAS-3 SRN",
  shareCertificateOn: "share certificate date",
  tdsDeferred: "TDS deferral",
  tdsAmount: "TDS amount",
  tdsDeductedOn: "TDS deducted on",
  tdsDepositedOn: "TDS deposited on",
  tdsChallanRef: "challan",
  form3921FurnishedOn: "Form 3921 Copy B date",
  form3921FiledOn: "Form 3921 Copy A date",
  note: "note",
};

const show = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v === null || v === undefined || v === "" ? "blank" : String(v));

/** PATCH: record allotment and filing dates. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const { exerciseId } = await params;
    const parsed = updateExerciseSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const { allot, ...fields } = parsed.data;
    const us = workspace.jurisdiction === "US";

    const before = await prisma.optionExercise.findFirst({
      where: { id: exerciseId, workspaceId: workspace.id },
      include: { grant: { select: { id: true, employeeName: true, employeeEmail: true } } },
    });
    if (!before) return badRequest("Exercise not found.", "NOT_FOUND", 404);
    if (allot && before.movementId) return badRequest("These shares are already allotted.", "ALREADY_ALLOTTED", 409);
    if (allot && allot.date.getTime() < before.exerciseDate.getTime()) return badRequest("The allotment date can't be before the exercise date.");

    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined) continue;
      data[k] = typeof v === "string" ? v || null : v;
    }
    if (us) {
      for (const k of ["tdsDeferred", "tdsAmount", "tdsDeductedOn", "tdsDepositedOn", "tdsChallanRef", "pas3FiledOn", "pas3Srn"]) delete data[k];
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.optionExercise.update({ where: { id: before.id }, data });
      const allotted = allot
        ? await allotShares(tx, {
            workspaceId: workspace.id,
            exercise: updated,
            grant: before.grant,
            allotmentDate: allot.date,
            classId: allot.classId,
          })
        : null;
      return { updated, allotted };
    });

    const changed = Object.keys(data).filter((k) => show((before as Record<string, unknown>)[k]) !== show((result.updated as Record<string, unknown>)[k]));
    const parts = changed.map((k) => `${LABELS[k] ?? k} ${show((result.updated as Record<string, unknown>)[k])}`);
    if (result.allotted) parts.unshift(`${us ? "issued" : "allotted"} ${before.options} ${result.allotted.className} shares on ${allot!.date.toISOString().slice(0, 10)}`);
    if (parts.length) {
      await logCompanyChange({ user, workspace }, {
        action: result.allotted ? "exercise.allotted" : "exercise.updated",
        entityType: "exercise",
        entityId: before.id,
        summary: `${before.grant.employeeName}'s exercise of ${before.exerciseDate.toISOString().slice(0, 10)}: ${parts.join("; ")}.`.slice(0, 500),
        details: Object.fromEntries(changed.map((k) => [k, { from: show((before as Record<string, unknown>)[k]), to: show((result.updated as Record<string, unknown>)[k]) }])),
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "CLASS_NOT_FOUND") return badRequest("The chosen share class was not found.", "NOT_FOUND", 404);
    return companyErrorResponse(error);
  }
}

/** DELETE: undo an exercise recorded by mistake (and its allotment, if nothing depends on it). */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const { exerciseId } = await params;
    const ex = await prisma.optionExercise.findFirst({
      where: { id: exerciseId, workspaceId: workspace.id },
      include: { grant: true },
    });
    if (!ex) return badRequest("Exercise not found.", "NOT_FOUND", 404);

    if (ex.movementId) {
      const movements = await loadMovements(workspace.id);
      const negative = findNegativeBalance(movements.filter((m) => m.id !== ex.movementId));
      if (negative) {
        return badRequest(
          "Some of these shares were later transferred or bought back. Remove those cap table entries first, then undo this exercise.",
          "SHARES_IN_USE",
          409
        );
      }
    }

    const exercised = Math.max(0, ex.grant.optionsExercised - ex.options);
    await prisma.$transaction(async (tx) => {
      await tx.optionExercise.delete({ where: { id: ex.id } });
      if (ex.movementId) await tx.shareMovement.deleteMany({ where: { id: ex.movementId, workspaceId: workspace.id } });
      await tx.optionGrant.update({
        where: { id: ex.grantId },
        data: { optionsExercised: exercised, status: statusAfterExercise(ex.grant, exercised) },
      });
    });

    await logCompanyChange({ user, workspace }, {
      action: "exercise.undone",
      entityType: "exercise",
      entityId: ex.id,
      summary: `Undid ${ex.grant.employeeName}'s exercise of ${ex.options} options on ${ex.exerciseDate.toISOString().slice(0, 10)}${ex.movementId ? " and its allotment" : ""}.`,
      details: { options: ex.options },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

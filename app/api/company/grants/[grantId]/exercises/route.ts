import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { logCompanyChange } from "@/lib/change-log";
import { addDaysUtc, vestedOn } from "@/lib/company/grants";
import { termsOf } from "@/lib/company/grants-data";
import { exercisableOn } from "@/lib/company/exercises";
import { allotShares, statusAfterExercise } from "@/lib/company/exercises-data";
import { recordExerciseSchema } from "@/lib/company/exercise-schemas";

type Ctx = { params: Promise<{ grantId: string }> };

/**
 * POST /api/company/grants/[grantId]/exercises
 * Records an exercise of vested options, and optionally allots the shares at once.
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const { grantId } = await params;
    const parsed = recordExerciseSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;
    const us = workspace.jurisdiction === "US";
    const n = (v: number) => v.toLocaleString(us ? "en-US" : "en-IN");

    const grant = await prisma.optionGrant.findFirst({ where: { id: grantId, workspaceId: workspace.id } });
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);
    if (!["ISSUED", "ACCEPTED", "LEFT"].includes(grant.status)) {
      return badRequest("Only issued grants with options left can be exercised.", "BAD_STATUS", 409);
    }

    const on = input.exerciseDate;
    const today = new Date();
    if (on.getTime() > today.getTime()) return badRequest("The exercise date can't be in the future.");
    if (on.getTime() < grant.grantDate.getTime()) return badRequest("The exercise date is before the grant date.");
    if (grant.expiryDate && on.getTime() > grant.expiryDate.getTime()) {
      return badRequest(`These options expired on ${grant.expiryDate.toISOString().slice(0, 10)}.`, "EXPIRED", 409);
    }
    if (grant.leftOn) {
      const windowEnds = addDaysUtc(grant.leftOn, grant.postExitDays);
      if (on.getTime() > windowEnds.getTime()) {
        return badRequest(`The exercise window after leaving ended on ${windowEnds.toISOString().slice(0, 10)}.`, "WINDOW_CLOSED", 409);
      }
    }

    const terms = termsOf(grant);
    const available = exercisableOn((d) => vestedOn(terms, d), on, grant.leftOn, grant.optionsExercised);
    if (input.options > available) {
      return badRequest(`Only ${n(available)} vested options can be exercised on that date.`, "NOT_VESTED", 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Someone else may have recorded an exercise meanwhile.
      const fresh = await tx.optionGrant.findUnique({ where: { id: grant.id }, select: { optionsExercised: true } });
      if (!fresh || fresh.optionsExercised !== grant.optionsExercised) throw new Error("GRANT_CHANGED");
      const exercise = await tx.optionExercise.create({
        data: {
          workspaceId: workspace.id,
          grantId: grant.id,
          exerciseDate: on,
          options: input.options,
          exercisePrice: grant.exercisePrice,
          fmvPerShare: input.fmvPerShare ?? workspace.currentFmvPerShare ?? null,
          tdsDeferred: !us && Boolean(input.tdsDeferred),
          note: input.note || null,
        },
      });
      const exercised = grant.optionsExercised + input.options;
      const updated = await tx.optionGrant.update({
        where: { id: grant.id },
        data: { optionsExercised: exercised, status: statusAfterExercise(grant, exercised) },
      });
      let allotted: Awaited<ReturnType<typeof allotShares>> | null = null;
      if (input.allot) {
        if (input.allot.date.getTime() < on.getTime()) throw new Error("ALLOT_BEFORE_EXERCISE");
        allotted = await allotShares(tx, {
          workspaceId: workspace.id,
          exercise,
          grant,
          allotmentDate: input.allot.date,
          classId: input.allot.classId,
        });
      }
      return { exercise, updated, allotted };
    });

    await logCompanyChange({ user, workspace }, {
      action: "exercise.recorded",
      entityType: "exercise",
      entityId: result.exercise.id,
      summary: `${grant.employeeName} exercised ${n(input.options)} options on ${on.toISOString().slice(0, 10)}${
        result.allotted ? `; ${n(input.options)} ${result.allotted.className} shares ${us ? "issued" : "allotted"} on ${input.allot!.date.toISOString().slice(0, 10)}` : ""
      }.`,
      details: {
        options: input.options,
        exercisePrice: grant.exercisePrice,
        fmvPerShare: result.exercise.fmvPerShare,
        grantStatus: result.updated.status,
      },
    });
    return NextResponse.json({ success: true, exercise: result.exercise, grant: result.updated }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "CLASS_NOT_FOUND") return badRequest("The chosen share class was not found.", "NOT_FOUND", 404);
    if (error instanceof Error && error.message === "GRANT_CHANGED") return badRequest("This grant just changed. Refresh and try again.", "CONFLICT", 409);
    if (error instanceof Error && error.message === "ALLOT_BEFORE_EXERCISE") return badRequest("The allotment date can't be before the exercise date.");
    return companyErrorResponse(error);
  }
}

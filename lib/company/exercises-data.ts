import type { OptionExercise, OptionGrant, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { obligationsFor, perquisiteOf } from "@/lib/company/exercises";

type Tx = Prisma.TransactionClient;

/** Grant status after its exercised count changes. */
export function statusAfterExercise(g: Pick<OptionGrant, "status" | "options" | "optionsLapsed" | "leftOn" | "acceptedAt">, exercised: number) {
  if (g.options - g.optionsLapsed - exercised <= 0) return "EXERCISED" as const;
  if (g.status === "EXERCISED") return g.leftOn ? ("LEFT" as const) : g.acceptedAt ? ("ACCEPTED" as const) : ("ISSUED" as const);
  return g.status;
}

/** Finds the employee on the shareholder list (email first, then exact name), or adds them. */
async function holderFor(tx: Tx, workspaceId: string, name: string, email: string | null) {
  const em = email?.trim().toLowerCase() || null;
  const candidates = await tx.shareholder.findMany({
    where: { workspaceId, archivedAt: null },
    select: { id: true, name: true, email: true },
  });
  const match =
    (em && candidates.find((c) => c.email?.trim().toLowerCase() === em)) ||
    candidates.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (match) return { id: match.id, created: false };
  const created = await tx.shareholder.create({
    data: { workspaceId, name: name.trim(), email: em, type: "EMPLOYEE" },
    select: { id: true },
  });
  return { id: created.id, created: true };
}

/** Allots (issues) the exercised shares: shareholder + ALLOTMENT movement, linked to the exercise. */
export async function allotShares(
  tx: Tx,
  input: {
    workspaceId: string;
    exercise: Pick<OptionExercise, "id" | "options" | "exercisePrice">;
    grant: Pick<OptionGrant, "id" | "employeeName" | "employeeEmail">;
    allotmentDate: Date;
    classId: string;
  }
) {
  const cls = await tx.securityClass.findFirst({
    where: { id: input.classId, workspaceId: input.workspaceId, archivedAt: null },
    select: { id: true, name: true },
  });
  if (!cls) throw new Error("CLASS_NOT_FOUND");
  const holder = await holderFor(tx, input.workspaceId, input.grant.employeeName, input.grant.employeeEmail);
  const movement = await tx.shareMovement.create({
    data: {
      workspaceId: input.workspaceId,
      kind: "ALLOTMENT",
      date: input.allotmentDate,
      classId: cls.id,
      toHolderId: holder.id,
      quantity: input.exercise.options,
      pricePerShare: input.exercise.exercisePrice,
      note: `ESOP exercise by ${input.grant.employeeName}`,
    },
    select: { id: true },
  });
  await tx.optionExercise.update({
    where: { id: input.exercise.id },
    data: { allotmentDate: input.allotmentDate, classId: cls.id, shareholderId: holder.id, movementId: movement.id },
  });
  return { className: cls.name, holderCreated: holder.created, movementId: movement.id };
}

/** "Equity shares" stays as is; "Class A" becomes "Class A shares". */
export function sharesLabel(className: string) {
  return /(shares?|stock)$/i.test(className.trim()) ? className.trim() : `${className.trim()} shares`;
}

const dateOut = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

/** Every exercise in the workspace with its filings, newest first. */
export async function listExercises(workspaceId: string, jurisdiction: "IN" | "US") {
  const [rows, classes] = await Promise.all([
    prisma.optionExercise.findMany({
      where: { workspaceId },
      orderBy: [{ exerciseDate: "desc" }, { createdAt: "desc" }],
      include: {
        grant: {
          select: {
            id: true,
            employeeName: true,
            employeeEmail: true,
            grantDate: true,
            usOptionType: true,
            leftOn: true,
            scheme: { select: { name: true } },
          },
        },
      },
    }),
    prisma.securityClass.findMany({
      where: { workspaceId, archivedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, kind: true },
    }),
  ]);
  const classNames = new Map(classes.map((c) => [c.id, c.name]));
  const today = new Date();

  const exercises = rows.map((e) => {
    const obligations = obligationsFor(e, { usOptionType: e.grant.usOptionType, leftOn: e.grant.leftOn }, jurisdiction, today);
    return {
      id: e.id,
      grantId: e.grantId,
      employeeName: e.grant.employeeName,
      employeeEmail: e.grant.employeeEmail,
      schemeName: e.grant.scheme.name,
      grantDate: dateOut(e.grant.grantDate),
      usOptionType: e.grant.usOptionType,
      exerciseDate: dateOut(e.exerciseDate),
      options: e.options,
      exercisePrice: e.exercisePrice,
      amountPayable: e.options * e.exercisePrice,
      fmvPerShare: e.fmvPerShare,
      perquisite: perquisiteOf(e),
      allotmentDate: dateOut(e.allotmentDate),
      className: e.classId ? (classNames.get(e.classId) ?? "(class removed)") : null,
      pas3FiledOn: dateOut(e.pas3FiledOn),
      pas3Srn: e.pas3Srn,
      shareCertificateOn: dateOut(e.shareCertificateOn),
      tdsDeferred: e.tdsDeferred,
      tdsAmount: e.tdsAmount,
      tdsDeductedOn: dateOut(e.tdsDeductedOn),
      tdsDepositedOn: dateOut(e.tdsDepositedOn),
      tdsChallanRef: e.tdsChallanRef,
      form3921FurnishedOn: dateOut(e.form3921FurnishedOn),
      form3921FiledOn: dateOut(e.form3921FiledOn),
      note: e.note,
      obligations,
    };
  });

  const counts = { overdue: 0, due: 0, todo: 0 };
  for (const e of exercises) {
    for (const o of e.obligations) {
      if (o.status === "OVERDUE") counts.overdue += 1;
      else if (o.status === "DUE") counts.due += 1;
      else if (o.status === "TODO") counts.todo += 1;
    }
  }
  return { exercises, classes, counts };
}

export type ExerciseListRow = Awaited<ReturnType<typeof listExercises>>["exercises"][number];

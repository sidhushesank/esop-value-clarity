import { prisma } from "@/lib/prisma";
import { ProAccessError } from "@/lib/pro-access";
import type { taxEventInputSchema } from "@/lib/advisor-schemas";
import type { z } from "zod";

type EventInput = z.output<typeof taxEventInputSchema>;

/**
 * Every id in the body must belong to this client. Returns the cleaned
 * fields to store (irrelevant fields for the event type are cleared).
 */
export async function validateEventOwnership(
  clientId: string,
  input: EventInput,
  ignoreEventId?: string
) {
  const employee = await prisma.taxEmployee.findFirst({
    where: { id: input.employeeId, clientId, archivedAt: null },
    select: { id: true },
  });

  if (!employee) {
    throw new ProAccessError("Employee not found.", 404, "EMPLOYEE_NOT_FOUND");
  }

  let valuationId: string | null = null;

  if (input.type === "EXERCISE" && input.valuationId) {
    const val = await prisma.clientValuation.findFirst({
      where: { id: input.valuationId, clientId },
      select: { id: true },
    });

    if (!val) {
      throw new ProAccessError(
        "That valuation report was not found for this company.",
        400,
        "VALUATION_NOT_FOUND"
      );
    }

    valuationId = val.id;
  }

  let lotEventId: string | null = null;

  if ((input.type === "SALE" || input.type === "BUYBACK") && input.lotEventId) {
    const lot = await prisma.taxEvent.findFirst({
      where: {
        id: input.lotEventId,
        clientId,
        employeeId: input.employeeId,
        type: "EXERCISE",
        NOT: ignoreEventId ? { id: ignoreEventId } : undefined,
      },
      select: { id: true },
    });

    if (!lot) {
      throw new ProAccessError(
        "The chosen exercise was not found for this employee.",
        400,
        "LOT_NOT_FOUND"
      );
    }

    lotEventId = lot.id;
  }

  const isExercise = input.type === "EXERCISE";
  const isDisposal = input.type === "SALE" || input.type === "BUYBACK";

  return {
    employeeId: input.employeeId,
    type: input.type,
    eventDate: input.eventDate,
    shares: input.type === "LEAVE" ? 0 : input.shares,
    exercisePrice: isExercise ? (input.exercisePrice ?? 0) : null,
    valuationId,
    pricePerShare: isDisposal ? (input.pricePerShare ?? 0) : null,
    lotEventId,
    note: input.note,
  };
}
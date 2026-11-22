import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  assertCanAddOptionHolder,
  holderKeyFor,
  requireCompanyWorkspace,
} from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { optionGrantSchema } from "@/lib/company/schemas";
import { grantDetail } from "@/lib/company/grants-data";
import { logCompanyChange } from "@/lib/change-log";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ grantId: string }> };

async function findGrant(workspaceId: string, grantId: string) {
  return prisma.optionGrant.findFirst({
    where: { id: grantId, workspaceId },
    include: { scheme: true },
  });
}

/** GET: one grant with vesting position, schedule and warnings. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { grantId } = await params;

    const grant = await findGrant(workspace.id, grantId);
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);

    return NextResponse.json({ success: true, ...(await grantDetail(grant, workspace)) });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** PATCH: edit a grant while it is still a draft. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { workspace, holderLimit, isEvcOwner, user } = await requireCompanyWorkspace();
    const { grantId } = await params;

    const existing = await findGrant(workspace.id, grantId);
    if (!existing) return badRequest("Grant not found.", "NOT_FOUND", 404);
    if (existing.status !== "DRAFT") {
      return badRequest("Only a draft grant can be edited. Issued grants are kept as issued.", "NOT_DRAFT", 409);
    }

    const body = await request.json().catch(() => null);
    const parsed = optionGrantSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;

    const scheme = await prisma.esopScheme.findFirst({
      where: { id: input.schemeId, workspaceId: workspace.id, archivedAt: null },
    });
    if (!scheme) return badRequest("Choose a valid ESOP scheme.", "NOT_FOUND", 404);

    const holderKey = holderKeyFor({
      employeeEmail: input.employeeEmail ?? null,
      employeeName: input.employeeName,
    });
    if (holderKey !== existing.holderKey) {
      await assertCanAddOptionHolder(workspace.id, holderKey, holderLimit, isEvcOwner);
    }

    const updated = await prisma.optionGrant.update({
      where: { id: existing.id },
      data: {
        schemeId: scheme.id,
        employeeName: input.employeeName,
        employeeEmail: input.employeeEmail ?? null,
        employeeRef: input.employeeRef,
        holderKey,
        isPromoterOver10Pct: input.isPromoterOver10Pct,
        usOptionType:
          workspace.jurisdiction === "US"
            ? input.usOptionType === undefined
              ? existing.usOptionType
              : input.usOptionType
            : null,
        grantDate: input.grantDate,
        options: input.options,
        exercisePrice: input.exercisePrice,
        vestingStart: input.vestingStart,
        vestingMonths: input.vestingMonths,
        cliffMonths: input.cliffMonths,
        expiryDate: input.expiryDate ?? null,
        postExitDays: input.postExitDays,
        note: input.note,
      },
      include: { scheme: true },
    });

    await logCompanyChange({ user, workspace }, {
      action: "grant.updated",
      entityType: "grant",
      entityId: updated.id,
      summary: `Edited the draft grant for ${updated.employeeName}.`,
      details: {
        optionsBefore: existing.options,
        optionsAfter: updated.options,
        priceBefore: existing.exercisePrice,
        priceAfter: updated.exercisePrice,
      },
    });
    return NextResponse.json({ success: true, ...(await grantDetail(updated, workspace)) });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** DELETE: only drafts can be deleted. */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace();
    const { grantId } = await params;

    const existing = await findGrant(workspace.id, grantId);
    if (!existing) return badRequest("Grant not found.", "NOT_FOUND", 404);
    if (existing.status !== "DRAFT") {
      return badRequest("Only a draft grant can be deleted.", "NOT_DRAFT", 409);
    }

    await prisma.optionGrant.delete({ where: { id: existing.id } });
    await logCompanyChange({ user, workspace }, {
      action: "grant.deleted",
      entityType: "grant",
      entityId: existing.id,
      summary: `Deleted the draft grant of ${existing.options.toLocaleString(workspace.jurisdiction === "US" ? "en-US" : "en-IN")} options for ${existing.employeeName}.`,
      details: { employee: existing.employeeName, options: existing.options },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

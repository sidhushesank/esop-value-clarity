import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse, validationError } from "@/lib/company-http";
import { grantLinkCreateSchema } from "@/lib/company/schemas";
import {
  LINKABLE_STATUSES,
  appBaseUrl,
  generateGrantToken,
  hashGrantToken,
  hashPasscode,
} from "@/lib/company/grant-links";
import { logCompanyChange } from "@/lib/change-log";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ grantId: string }> };

async function findGrant(workspaceId: string, grantId: string) {
  return prisma.optionGrant.findFirst({
    where: { id: grantId, workspaceId },
    select: { id: true, status: true, employeeName: true },
  });
}

function linkStatus(link: {
  id: string;
  passcodeHash: string | null;
  expiresAt: Date;
  viewCount: number;
  lastViewedAt: Date | null;
  createdAt: Date;
  lockedUntil: Date | null;
}) {
  return {
    id: link.id,
    hasPasscode: !!link.passcodeHash,
    expiresAt: link.expiresAt,
    viewCount: link.viewCount,
    lastViewedAt: link.lastViewedAt,
    createdAt: link.createdAt,
    locked: !!link.lockedUntil && link.lockedUntil > new Date(),
  };
}

/** GET: the grant's current active link (the URL itself is never shown again). */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { grantId } = await params;

    const grant = await findGrant(workspace.id, grantId);
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);

    const link = await prisma.grantLink.findFirst({
      where: { grantId: grant.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, link: link ? linkStatus(link) : null });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/**
 * POST { passcode?, expiresInDays }: create a new employee link.
 * Any earlier link for this grant stops working. The URL is returned once.
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const { grantId } = await params;

    const grant = await findGrant(workspace.id, grantId);
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);
    if (!(LINKABLE_STATUSES as readonly string[]).includes(grant.status)) {
      return badRequest("Issue the grant before sharing it with the employee.", "NOT_ISSUED", 409);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = grantLinkCreateSchema.safeParse(body ?? {});
    if (!parsed.success) return validationError(parsed.error);

    const token = generateGrantToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + parsed.data.expiresInDays * 86_400_000);

    const link = await prisma.$transaction(async (tx) => {
      await tx.grantLink.updateMany({
        where: { grantId: grant.id, revokedAt: null },
        data: { revokedAt: now },
      });

      return tx.grantLink.create({
        data: {
          grantId: grant.id,
          tokenHash: hashGrantToken(token),
          passcodeHash: parsed.data.passcode ? await hashPasscode(parsed.data.passcode) : null,
          expiresAt,
        },
      });
    });

    await logCompanyChange({ user, workspace }, {
      action: "grant.link_created",
      entityType: "grant",
      entityId: grant.id,
      summary: `Created a new employee page link for ${grant.employeeName}${parsed.data.passcode ? " with a passcode" : ""}, valid ${parsed.data.expiresInDays} days. Older links stopped working.`,
      details: { expiresInDays: parsed.data.expiresInDays, passcode: Boolean(parsed.data.passcode) },
    });
    return NextResponse.json(
      {
        success: true,
        url: `${appBaseUrl(request)}/grant/${token}`,
        link: linkStatus(link),
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** DELETE: stop every link for this grant working immediately. */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { workspace, user } = await requireCompanyWorkspace({ write: true });
    const { grantId } = await params;

    const grant = await findGrant(workspace.id, grantId);
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);

    await prisma.grantLink.updateMany({
      where: { grantId: grant.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await logCompanyChange({ user, workspace }, {
      action: "grant.link_revoked",
      entityType: "grant",
      entityId: grant.id,
      summary: `Turned off the employee page link for ${grant.employeeName}.`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

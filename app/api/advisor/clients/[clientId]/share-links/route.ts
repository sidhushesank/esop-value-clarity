import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import {
  MAX_ACTIVE_LINKS_PER_CLIENT,
  generateShareToken,
  hashPasscode,
  hashShareToken,
} from "@/lib/advisor/share";
import { logAdvisorChange } from "@/lib/change-log";

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

const createSchema = z.object({
  label: z.string().trim().max(100).nullable().optional(),
  expiresInDays: z.number().int().min(1).max(90).optional(),
  passcode: z
    .string()
    .min(6, "The passcode must be at least 6 characters.")
    .max(40)
    .nullable()
    .optional(),
  runId: z.string().min(1).optional(),
});

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;
    await requireClientInFirm(firm.id, clientId);

    const links = await prisma.shareLink.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        runId: true,
        passcodeHash: true,
        expiresAt: true,
        revokedAt: true,
        viewCount: true,
        lastViewedAt: true,
        lockedUntil: true,
        createdAt: true,
      },
    });

    const now = new Date();

    return NextResponse.json({
      success: true,
      links: links.map(({ passcodeHash, ...rest }) => ({
        ...rest,
        hasPasscode: passcodeHash !== null,
        status: rest.revokedAt
          ? "REVOKED"
          : rest.expiresAt <= now
            ? "EXPIRED"
            : "ACTIVE",
      })),
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { firm, user } = await requireAdvisorFirm();
    const { clientId } = await params;
    await requireClientInFirm(firm.id, clientId);

    const body = await request.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid input.",
        },
        { status: 400 }
      );
    }

    const { label, passcode, runId } = parsed.data;
    const expiresInDays = parsed.data.expiresInDays ?? 30;

    const run = await prisma.diligenceRun.findFirst({
      where: { clientId, ...(runId ? { id: runId } : {}) },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!run) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_RUN",
          message: "Run the diligence check before sharing a report.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const activeLinks = await prisma.shareLink.count({
      where: { clientId, revokedAt: null, expiresAt: { gt: now } },
    });

    if (activeLinks >= MAX_ACTIVE_LINKS_PER_CLIENT) {
      return NextResponse.json(
        {
          success: false,
          code: "LINK_LIMIT",
          message: `This client already has ${MAX_ACTIVE_LINKS_PER_CLIENT} active links. Revoke one first.`,
        },
        { status: 400 }
      );
    }

    const token = generateShareToken();

    const link = await prisma.shareLink.create({
      data: {
        clientId,
        runId: run.id,
        tokenHash: hashShareToken(token),
        label: label || null,
        passcodeHash: passcode ? await hashPasscode(passcode) : null,
        expiresAt: new Date(now.getTime() + expiresInDays * 86_400_000),
        createdById: firm.id,
      },
      select: {
        id: true,
        label: true,
        runId: true,
        expiresAt: true,
      },
    });

    await logAdvisorChange({ user, firm }, clientId, {
      action: "sharelink.created",
      entityType: "sharelink",
      entityId: link.id,
      summary: `Created a client share link${link.label ? ` "${link.label}"` : ""}${passcode ? " with a passcode" : ""}, valid until ${link.expiresAt.toISOString().slice(0, 10)}.`,
      details: { label: link.label, passcode: Boolean(passcode), expiresAt: link.expiresAt },
    });
    // The token is shown once and cannot be recovered.
    const url = `${new URL(request.url).origin}/share/${token}`;

    return NextResponse.json(
      {
        success: true,
        link: { ...link, hasPasscode: Boolean(passcode) },
        url,
        notice:
          "Copy this link now. It cannot be shown again. If you lose it, revoke it and create a new one.",
      },
      { status: 201 }
    );
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
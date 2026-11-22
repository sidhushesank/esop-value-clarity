import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { grantAcceptSchema } from "@/lib/company/schemas";
import {
  grantCookieName,
  resolveGrantLink,
  verifyGrantCookie,
} from "@/lib/company/grant-links";
import { logEmployeeAction } from "@/lib/change-log";

type Ctx = { params: Promise<{ token: string }> };

const UNAVAILABLE = { success: false, code: "UNAVAILABLE", message: "This link is not available." };

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * POST /api/grant/[token]/accept { fullName, confirm: true }
 * The employee acknowledges the grant. Recorded as accepted in EVC with the
 * time; it is not a signed legal document.
 */
export async function POST(request: Request, { params }: Ctx) {
  const { token } = await params;
  const link = await resolveGrantLink(token);
  if (!link) return NextResponse.json(UNAVAILABLE, { status: 404 });

  if (link.passcodeHash) {
    const store = await cookies();
    if (!verifyGrantCookie(store.get(grantCookieName(link.id))?.value, link.id)) {
      return NextResponse.json(
        { success: false, code: "LOCKED", message: "Enter the passcode first." },
        { status: 401 }
      );
    }
  }

  const body = await request.json().catch(() => null);
  const parsed = grantAcceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const grant = link.grant;

  if (grant.status === "ACCEPTED") {
    return NextResponse.json({ success: true, acceptedAt: grant.acceptedAt });
  }
  if (grant.status !== "ISSUED") {
    return NextResponse.json(
      { success: false, code: "BAD_STATUS", message: "This grant can no longer be accepted here." },
      { status: 409 }
    );
  }

  if (norm(parsed.data.fullName) !== norm(grant.employeeName)) {
    return NextResponse.json(
      {
        success: false,
        code: "NAME_MISMATCH",
        message: `Type your name exactly as it appears on this grant: ${grant.employeeName}.`,
      },
      { status: 400 }
    );
  }

  const updated = await prisma.optionGrant.updateMany({
    where: { id: grant.id, status: "ISSUED" },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      { success: false, code: "BAD_STATUS", message: "This grant can no longer be accepted here." },
      { status: 409 }
    );
  }

  await logEmployeeAction(link.grant.workspace.id, grant.employeeName, {
    action: "grant.accepted",
    entityType: "grant",
    entityId: grant.id,
    summary: `${grant.employeeName} accepted the grant of ${grant.options.toLocaleString(link.grant.workspace.jurisdiction === "US" ? "en-US" : "en-IN")} options on their grant page.`,
    details: { typedName: parsed.data.fullName },
  });
  return NextResponse.json({ success: true, acceptedAt: new Date() });
}

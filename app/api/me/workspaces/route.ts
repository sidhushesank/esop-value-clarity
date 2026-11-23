import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/me/workspaces
 * Which paid workspaces the signed-in user can open, for the user menu.
 * Read-only: never creates anything. The EVC owner (FOUNDER_EMAIL) sees all.
 */
export async function GET(request: Request) {
  const none = { success: true, company: false, advisor: false };

  try {
    const cookie = request.headers.get("cookie") ?? "";
    const token = cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="))
      ?.slice("token=".length);

    const userId = token ? await getSessionUserId(decodeURIComponent(token)) : null;
    if (!userId) return NextResponse.json(none);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        emailVerified: true,
        accountStatus: true,
        ownedCompanyWorkspace: { select: { status: true, expiresAt: true } },
        ownedAdvisorFirm: { select: { status: true, expiresAt: true } },
      },
    });

    if (!user || user.accountStatus !== "ACTIVE") return NextResponse.json(none);

    if (process.env.FOUNDER_EMAIL && user.email === process.env.FOUNDER_EMAIL) {
      return NextResponse.json({ success: true, company: true, advisor: true });
    }

    const now = new Date();
    const active = (w: { status: string; expiresAt: Date } | null) =>
      !!w && w.status === "ACTIVE" && w.expiresAt > now;

    // Team members (invited by verified email) also get the menu links.
    let memberCompany = false;
    let memberAdvisor = false;
    if (user.emailVerified) {
      const seats = await prisma.seatMember.findMany({
        where: { email: user.email.trim().toLowerCase(), revokedAt: null },
        select: { kind: true, workspaceId: true, firmId: true },
      });
      const ws = seats.find((x) => x.kind === "COMPANY" && x.workspaceId);
      const fm = seats.find((x) => x.kind === "ADVISOR" && x.firmId);
      if (ws?.workspaceId) {
        memberCompany = active(
          await prisma.companyWorkspace.findUnique({
            where: { id: ws.workspaceId },
            select: { status: true, expiresAt: true },
          })
        );
      }
      if (fm?.firmId) {
        memberAdvisor = active(
          await prisma.advisorFirm.findUnique({
            where: { id: fm.firmId },
            select: { status: true, expiresAt: true },
          })
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        company: active(user.ownedCompanyWorkspace) || (!user.ownedCompanyWorkspace && memberCompany),
        advisor: active(user.ownedAdvisorFirm) || (!user.ownedAdvisorFirm && memberAdvisor),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[me/workspaces]", error);
    return NextResponse.json(none);
  }
}

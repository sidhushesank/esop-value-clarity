import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdvisorFirm } from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { badRequest } from "@/lib/company-http";
import { addMember, listTeam, TEAM_LIMITS } from "@/lib/seats";
import { listChanges, logAdvisorChange } from "@/lib/change-log";
import { sendSeatInviteEmail } from "@/lib/seat-mail";

export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  role: z.enum(["ADMIN", "VIEWER"]),
});

/** GET /api/advisor/team: owner, members, your role, the limit and recent team changes. */
export async function GET() {
  try {
    const { firm, role, ownerId, isFounder } = await requireAdvisorFirm();
    const team = await listTeam({ kind: "ADVISOR", ownerId, firmId: firm.id });
    const recent = await listChanges(
      { scope: "ADVISOR", firmId: firm.id, clientId: null },
      { entityType: "team" }
    );

    return NextResponse.json({
      success: true,
      yourRole: role,
      limit: isFounder ? null : TEAM_LIMITS.ADVISOR,
      ...team,
      recent: recent.rows.slice(0, 20),
    });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

/** POST /api/advisor/team: invite someone by email as ADMIN or VIEWER. */
export async function POST(request: Request) {
  try {
    const { firm, user, ownerId, isFounder } = await requireAdvisorFirm({ manageTeam: true });

    const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Check the email and role.");

    const member = await addMember(
      { kind: "ADVISOR", ownerId, firmId: firm.id, unlimited: isFounder },
      { email: parsed.data.email, role: parsed.data.role, invitedById: user.id }
    );

    const emailed = await sendSeatInviteEmail({
      to: member.email,
      kind: "ADVISOR",
      teamName: firm.name,
      role: parsed.data.role,
      invitedBy: user.name || user.email,
    });

    await logAdvisorChange({ user, firm }, null, {
      action: "team.invited",
      entityType: "team",
      entityId: member.id,
      summary: `Added ${member.email} to the team as ${parsed.data.role === "ADMIN" ? "an admin" : "view-only"}.`,
      details: { email: member.email, role: parsed.data.role, inviteEmailSent: emailed },
    });

    return NextResponse.json({ success: true, member: { id: member.id, email: member.email }, emailed }, { status: 201 });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse } from "@/lib/company-http";
import { addMember, listTeam, TEAM_LIMITS } from "@/lib/seats";
import { listChanges, logCompanyChange } from "@/lib/change-log";
import { sendSeatInviteEmail } from "@/lib/seat-mail";

export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  role: z.enum(["ADMIN", "VIEWER"]),
});

/** GET /api/company/team: owner, members, your role, the limit and recent team changes. */
export async function GET() {
  try {
    const { workspace, role, ownerId, isEvcOwner } = await requireCompanyWorkspace();
    const team = await listTeam({ kind: "COMPANY", ownerId, workspaceId: workspace.id });
    const recent = await listChanges(
      { scope: "COMPANY", workspaceId: workspace.id },
      { entityType: "team" }
    );

    return NextResponse.json({
      success: true,
      yourRole: role,
      limit: isEvcOwner ? null : TEAM_LIMITS.COMPANY,
      ...team,
      recent: recent.rows.slice(0, 20),
    });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** POST /api/company/team: invite someone by email as ADMIN or VIEWER. */
export async function POST(request: Request) {
  try {
    const { workspace, user, ownerId, isEvcOwner } = await requireCompanyWorkspace({ manageTeam: true });

    const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Check the email and role.");

    const member = await addMember(
      { kind: "COMPANY", ownerId, workspaceId: workspace.id, unlimited: isEvcOwner },
      { email: parsed.data.email, role: parsed.data.role, invitedById: user.id }
    );

    const emailed = await sendSeatInviteEmail({
      to: member.email,
      kind: "COMPANY",
      teamName: workspace.name,
      role: parsed.data.role,
      invitedBy: user.name || user.email,
    });

    await logCompanyChange({ user, workspace }, {
      action: "team.invited",
      entityType: "team",
      entityId: member.id,
      summary: `Added ${member.email} to the team as ${parsed.data.role === "ADMIN" ? "an admin" : "view-only"}.`,
      details: { email: member.email, role: parsed.data.role, inviteEmailSent: emailed },
    });

    return NextResponse.json({ success: true, member: { id: member.id, email: member.email }, emailed }, { status: 201 });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

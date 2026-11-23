import { NextResponse } from "next/server";
import { z } from "zod";

import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse } from "@/lib/company-http";
import { changeRole, findMemberInScope, removeMember } from "@/lib/seats";
import { logCompanyChange } from "@/lib/change-log";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ memberId: string }> };

const roleSchema = z.object({ role: z.enum(["ADMIN", "VIEWER"]) });

/** PATCH: change a member's role. */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { workspace, user, ownerId } = await requireCompanyWorkspace({ manageTeam: true });
    const { memberId } = await params;

    const parsed = roleSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return badRequest("Choose Admin or View only.");

    const member = await findMemberInScope({ kind: "COMPANY", ownerId, workspaceId: workspace.id }, memberId);
    if (member.userId === user.id) return badRequest("You can't change your own role. Ask the owner or another admin.");

    await changeRole(member.id, parsed.data.role);
    await logCompanyChange({ user, workspace }, {
      action: "team.role_changed",
      entityType: "team",
      entityId: member.id,
      summary: `Changed ${member.email} from ${member.role === "ADMIN" ? "admin" : "view-only"} to ${parsed.data.role === "ADMIN" ? "admin" : "view-only"}.`,
      details: { email: member.email, before: member.role, after: parsed.data.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** DELETE: remove a member. Their access stops on their next click. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { workspace, user, ownerId } = await requireCompanyWorkspace({ manageTeam: true });
    const { memberId } = await params;

    const member = await findMemberInScope({ kind: "COMPANY", ownerId, workspaceId: workspace.id }, memberId);

    await removeMember(member.id);
    await logCompanyChange({ user, workspace }, {
      action: "team.removed",
      entityType: "team",
      entityId: member.id,
      summary:
        member.userId === user.id
          ? `${member.email} left the team.`
          : `Removed ${member.email} from the team.`,
      details: { email: member.email, role: member.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

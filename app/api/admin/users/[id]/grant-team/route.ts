import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/*
 * ============================================================
 * ADMIN: GRANT TEAM INTELLIGENCE PLAN (MANUAL / OFFLINE PAYMENT)
 * ============================================================
 *
 * Use when a customer pays outside the in-app Razorpay checkout
 * (bank transfer against invoice, payment link, etc.).
 *
 * Mirrors what /api/payments/verify does for a Team purchase:
 * - creates exactly ONE TeamWorkspace for the user (ACTIVE, 1 year)
 * - the owner becomes Team Admin (PRO via Team entitlement)
 *
 * Additionally:
 * - records a TeamPayment (status SUCCESS) so Team revenue is tracked
 * - writes an AdminAuditLog entry with the payment reference
 *
 * No schema migration required.
 * ============================================================
 */

const DEFAULT_TEAM_AMOUNT_RUPEES = 145000;
const MAX_TEAM_AMOUNT_RUPEES = 10000000; // ₹1 crore safety cap
const MAX_PAST_START_DAYS = 364;
const MAX_FUTURE_START_DAYS = 90;

interface GrantTeamBody {
  amountRupees?: number | string;
  reference?: string;
  startDate?: string; // "YYYY-MM-DD" (IST)
  reason?: string;
}

/* ============================================================ */
/* HELPERS                                                      */
/* ============================================================ */

function todayInIST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseStartDate(
  value: string | undefined
): Date | null {
  const now = new Date();

  if (!value || value === todayInIST()) {
    return now;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00+05:30`);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function addOneYear(date: Date): Date {
  const expiresAt = new Date(date);

  expiresAt.setFullYear(
    expiresAt.getFullYear() + 1
  );

  return expiresAt;
}

function badRequest(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
    }
  );
}

/* ============================================================ */
/* POST                                                         */
/* ============================================================ */

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // ==========================================================
    // 1. REQUIRE ADMIN
    // ==========================================================

    const auth = await requireAdmin(request);

    if (!auth.success) {
      return auth.response;
    }

    const { id: targetUserId } =
      await context.params;

    // ==========================================================
    // 2. READ REQUEST BODY
    // ==========================================================

    let body: GrantTeamBody;

    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid request body");
    }

    // ==========================================================
    // 3. VALIDATE AMOUNT
    // ==========================================================

    const amountRupees =
      body.amountRupees === undefined ||
      body.amountRupees === ""
        ? DEFAULT_TEAM_AMOUNT_RUPEES
        : Number(body.amountRupees);

    if (
      !Number.isFinite(amountRupees) ||
      amountRupees <= 0 ||
      amountRupees > MAX_TEAM_AMOUNT_RUPEES
    ) {
      return badRequest(
        "Enter a valid amount in rupees."
      );
    }

    // Stored in paise, like Razorpay amounts.
    const amountPaise = Math.round(
      amountRupees * 100
    );

    // ==========================================================
    // 4. VALIDATE PAYMENT REFERENCE
    // ==========================================================

    const reference =
      body.reference?.trim() || "";

    if (
      reference.length < 3 ||
      reference.length > 120
    ) {
      return badRequest(
        "Enter the payment reference (bank UTR, invoice number or Razorpay payment ID)."
      );
    }

    const reason =
      body.reason?.trim() ||
      "Team Intelligence plan activated manually after offline payment";

    // ==========================================================
    // 5. VALIDATE START DATE
    // ==========================================================

    const startedAt = parseStartDate(
      body.startDate
    );

    if (!startedAt) {
      return badRequest(
        "Invalid start date. Use YYYY-MM-DD."
      );
    }

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    if (
      startedAt.getTime() <
      now.getTime() - MAX_PAST_START_DAYS * dayMs
    ) {
      return badRequest(
        "Start date is too far in the past."
      );
    }

    if (
      startedAt.getTime() >
      now.getTime() + MAX_FUTURE_START_DAYS * dayMs
    ) {
      return badRequest(
        "Start date is too far in the future."
      );
    }

    const expiresAt = addOneYear(startedAt);

    // ==========================================================
    // 6. FIND TARGET USER
    // ==========================================================

    const targetUser =
      await prisma.user.findUnique({
        where: {
          id: targetUserId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          accountStatus: true,

          ownedTeamWorkspace: {
            select: {
              id: true,
              name: true,
              status: true,
              expiresAt: true,
            },
          },

          teamMemberships: {
            where: {
              status: "ACTIVE",
              workspace: {
                status: "ACTIVE",
              },
            },
            take: 1,
            select: {
              workspace: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

    if (!targetUser) {
      return badRequest("User not found", 404);
    }

    // ==========================================================
    // 7. ELIGIBILITY CHECKS
    // ==========================================================

    if (
      targetUser.accountStatus === "SUSPENDED"
    ) {
      return badRequest(
        "Cannot grant a Team plan to a suspended account. Reactivate the account first.",
        409
      );
    }

    if (
      targetUser.email ===
      process.env.FOUNDER_EMAIL
    ) {
      return badRequest(
        "The founder account already has unlimited Team access.",
        409
      );
    }

    if (targetUser.role === "ADMIN") {
      return badRequest(
        "Team plans should be granted to a customer account, not an admin account.",
        409
      );
    }

    if (targetUser.ownedTeamWorkspace) {
      return badRequest(
        `This user already owns a Team workspace ("${targetUser.ownedTeamWorkspace.name}", ${targetUser.ownedTeamWorkspace.status}). Nothing was changed.`,
        409
      );
    }

    if (targetUser.teamMemberships.length > 0) {
      return badRequest(
        `This user is currently a sponsored member of "${targetUser.teamMemberships[0].workspace.name}". Remove them from that workspace before making them a Team Admin.`,
        409
      );
    }

    // ==========================================================
    // 8. CREATE WORKSPACE + TEAM PAYMENT + AUDIT LOG ATOMICALLY
    // ==========================================================

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Same default name as Razorpay checkout.
         * The customer names it from /team.
         */
        const workspace =
          await tx.teamWorkspace.create({
            data: {
              ownerId: targetUser.id,
              name: "Team Intelligence Workspace",
              status: "ACTIVE",
              startedAt,
              expiresAt,
            },

            select: {
              id: true,
              name: true,
              status: true,
              startedAt: true,
              expiresAt: true,
            },
          });

        const teamPayment =
          await tx.teamPayment.create({
            data: {
              workspaceId: workspace.id,
              userId: targetUser.id,

              amount: amountPaise,
              currency: "INR",

              status: "SUCCESS",

              /*
               * Offline payment: no Razorpay IDs.
               * The reference is kept in the audit log.
               */
              razorpayOrderId: null,
              razorpayPaymentId: null,
              razorpaySignature: null,

              startedAt,
              expiresAt,
            },

            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
            },
          });

        /*
         * AdminActionType has no TEAM_GRANTED value yet, so this
         * reuses PRO_GRANTED with grantType = TEAM_PLAN_MANUAL.
         * (Adding a dedicated enum value needs a migration.)
         */
        await tx.adminAuditLog.create({
          data: {
            adminId: auth.admin.id,
            targetUserId: targetUser.id,

            action: "PRO_GRANTED",

            metadata: {
              grantType: "TEAM_PLAN_MANUAL",

              workspaceId: workspace.id,
              teamPaymentId: teamPayment.id,

              amountRupees,
              amountPaise,
              currency: "INR",

              paymentReference: reference,
              reason,

              startedAt: startedAt.toISOString(),
              expiresAt: expiresAt.toISOString(),

              targetEmail: targetUser.email,
            },
          },
        });

        return {
          workspace,
          teamPayment,
        };
      }
    );

    // ==========================================================
    // 9. RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,

        message: `Team Intelligence plan activated for ${targetUser.name} until ${expiresAt.toLocaleDateString("en-IN")}.`,

        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },

        team: {
          workspaceId: result.workspace.id,
          workspaceName: result.workspace.name,
          status: result.workspace.status,
          startedAt: result.workspace.startedAt,
          expiresAt: result.workspace.expiresAt,
          maxMembers: 20,
        },

        payment: {
          id: result.teamPayment.id,
          amountRupees,
          currency: result.teamPayment.currency,
          status: result.teamPayment.status,
          reference,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /*
     * ownerId is unique on TeamWorkspace: a double click or a
     * parallel checkout cannot create a second workspace.
     */
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return badRequest(
        "This user already owns a Team workspace. Nothing was changed.",
        409
      );
    }

    console.error(
      "========== ADMIN GRANT TEAM ERROR =========="
    );
    console.error(error);
    console.error(
      "============================================"
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
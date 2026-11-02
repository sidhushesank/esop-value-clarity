import { NextRequest, NextResponse } from "next/server";
import { Prisma, SubscriptionSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { STARTUP_PLAN, addMonths } from "@/lib/company-pricing";
import { sendStartupPlanEmail } from "@/lib/company-billing-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const MAX_HOLDER_LIMIT = 10_000;
const MAX_MONTHS = 60;

function fail(message: string, status: number, code?: string) {
  return NextResponse.json(
    { success: false, message, code },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function durationLabel(months: number) {
  if (months % 12 === 0) {
    const y = months / 12;
    return y === 1 ? "1 year" : `${y} years`;
  }
  return months === 1 ? "1 month" : `${months} months`;
}

/* ============================================================
   GET /api/admin/companies  — list companies
============================================================ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").trim();
    const status = searchParams.get("status") ?? "ALL"; // ALL | ACTIVE | EXPIRED
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

    const now = new Date();

    const where: Prisma.CompanyWorkspaceWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { owner: { email: { contains: search, mode: "insensitive" } } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
        { paymentReference: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status === "ACTIVE") {
      where.status = "ACTIVE";
      where.expiresAt = { gt: now };
    } else if (status === "EXPIRED") {
      where.AND = [
        { OR: [{ status: "EXPIRED" }, { expiresAt: { lte: now } }] },
      ];
    }

    const [total, companies, activeCount, totalCount, paid] = await Promise.all([
      prisma.companyWorkspace.count({ where }),
      prisma.companyWorkspace.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          status: true,
          holderLimit: true,
          source: true,
          grantReason: true,
          paymentReference: true,
          startedAt: true,
          expiresAt: true,
          createdAt: true,
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { grants: true } },
        },
      }),
      prisma.companyWorkspace.count({
        where: { status: "ACTIVE", expiresAt: { gt: now } },
      }),
      prisma.companyWorkspace.count(),
      prisma.companyPayment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const founderEmail = process.env.FOUNDER_EMAIL;

    return NextResponse.json({
      success: true,
      summary: {
        totalCompanies: totalCount,
        activeCompanies: activeCount,
        expiredCompanies: totalCount - activeCount,
        paidPayments: paid._count,
        revenuePaise: paid._sum.amount ?? 0,
      },
      defaults: {
        holderLimit: STARTUP_PLAN.includedOptionHolders,
        pricePaise: STARTUP_PLAN.amountPaise,
      },
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
      companies: companies.map((f) => ({
        id: f.id,
        name: f.name,
        status: f.status,
        isFounder: !!founderEmail && f.owner.email === founderEmail,
        isCurrentlyActive:
          f.status === "ACTIVE" && f.expiresAt > now,
        holderLimit: f.holderLimit,
        optionGrants: f._count.grants,
        source: f.source,
        grantReason: f.grantReason,
        paymentReference: f.paymentReference,
        startedAt: f.startedAt,
        expiresAt: f.expiresAt,
        createdAt: f.createdAt,
        owner: f.owner,
      })),
    });
  } catch (error) {
    console.error("[ADMIN_COMPANIES_LIST]", error);
    return fail("We could not load startup companies.", 500);
  }
}

/* ============================================================
   POST /api/admin/companies — grant or extend access

   Body:
     ownerEmail        required (user must already have an account)
     companyName          optional
     holderLimit       optional (default: keep current, or 25 for new)
     durationMonths    1..60  -> added on top of the current end date
                               (or from today if lapsed / new)
     expiresAt         ISO date -> sets the end date exactly
                               (use one of durationMonths / expiresAt)
     paymentReference  Razorpay payment id or invoice number
     reason            short note (e.g. "Annual – meeting 24 Oct")
     sendEmail         default true
============================================================ */

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) return auth.response;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid request.", 400);
    }

    const ownerEmail =
      typeof body.ownerEmail === "string"
        ? body.ownerEmail.trim().toLowerCase()
        : "";
    const companyName =
      typeof body.companyName === "string" ? body.companyName.trim() : "";
    const paymentReference =
      typeof body.paymentReference === "string"
        ? body.paymentReference.trim().slice(0, 120)
        : "";
    const reason =
      typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : "";
    const sendEmail = body.sendEmail !== false;

    if (!ownerEmail) return fail("Enter the workspace owner's email.", 400);

    const holderLimitRaw =
      body.holderLimit === undefined ||
      body.holderLimit === null ||
      body.holderLimit === ""
        ? null
        : Number(body.holderLimit);

    if (
      holderLimitRaw !== null &&
      (!Number.isInteger(holderLimitRaw) ||
        holderLimitRaw < 1 ||
        holderLimitRaw > MAX_HOLDER_LIMIT)
    ) {
      return fail(
        `Option-holder limit must be a whole number from 1 to ${MAX_HOLDER_LIMIT}.`,
        400
      );
    }

    const months =
      body.durationMonths === undefined ||
      body.durationMonths === null ||
      body.durationMonths === ""
        ? null
        : Number(body.durationMonths);

    if (
      months !== null &&
      (!Number.isInteger(months) || months < 1 || months > MAX_MONTHS)
    ) {
      return fail(
        `Duration must be a whole number of months from 1 to ${MAX_MONTHS}.`,
        400
      );
    }

    const exactEnd =
      typeof body.expiresAt === "string" && body.expiresAt
        ? new Date(body.expiresAt)
        : null;

    if (exactEnd && Number.isNaN(exactEnd.getTime())) {
      return fail("The end date is not valid.", 400);
    }

    if ((months === null) === (exactEnd === null)) {
      return fail(
        "Give either a duration in months or an exact end date.",
        400
      );
    }

    const now = new Date();

    if (exactEnd && exactEnd <= now) {
      return fail("The end date must be in the future.", 400);
    }

    const owner = await prisma.user.findUnique({
      where: { email: ownerEmail },
      select: { id: true, name: true, email: true },
    });

    if (!owner) {
      return fail(
        "No account exists with that email. Ask them to sign up first, then grant access.",
        404,
        "OWNER_NOT_FOUND"
      );
    }

    if (
      process.env.FOUNDER_EMAIL &&
      owner.email === process.env.FOUNDER_EMAIL
    ) {
      return fail(
        "The founder already has unlimited access. Nothing to grant.",
        400
      );
    }

    const existing = await prisma.companyWorkspace.findUnique({
      where: { ownerId: owner.id },
    });

    const wasActive =
      !!existing && existing.status === "ACTIVE" && existing.expiresAt > now;

    const base = wasActive ? existing!.expiresAt : now;
    const newExpiry = exactEnd ?? addMonths(base, months!);
    const holderLimit =
      holderLimitRaw ?? existing?.holderLimit ?? STARTUP_PLAN.includedOptionHolders;

    const data = {
      status: "ACTIVE" as const,
      expiresAt: newExpiry,
      holderLimit,
      source: SubscriptionSource.ADMIN_GRANT,
      grantedById: auth.admin.id,
      grantReason: reason || null,
      paymentReference: paymentReference || null,
      expiryReminderFor: null,
    };

    const workspace = await prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.companyWorkspace.update({
            where: { id: existing.id },
            data: { ...data, ...(companyName ? { name: companyName } : {}) },
          })
        : await tx.companyWorkspace.create({
            data: {
              ...data,
              ownerId: owner.id,
              name:
                companyName ||
                (owner.name ? `${owner.name}'s company` : "My company"),
              startedAt: now,
            },
          });

      await tx.adminAuditLog.create({
        data: {
          adminId: auth.admin.id,
          targetUserId: owner.id,
          action: wasActive ? "COMPANY_WORKSPACE_EXTENDED" : "COMPANY_WORKSPACE_GRANTED",
          metadata: {
            workspaceId: saved.id,
            previousExpiresAt: existing?.expiresAt ?? null,
            newExpiresAt: newExpiry,
            previousHolderLimit: existing?.holderLimit ?? null,
            holderLimit,
            durationMonths: months,
            paymentReference: paymentReference || null,
            reason: reason || null,
          },
        },
      });

      return saved;
    });

    let emailSent = false;
    if (sendEmail) {
      emailSent = await sendStartupPlanEmail({
        to: owner.email,
        kind: wasActive ? "EXTENDED" : "GRANTED",
        ownerName: owner.name,
        companyName: workspace.name,
        expiresAt: workspace.expiresAt,
        holderLimit: workspace.holderLimit,
        reference: paymentReference || null,
        duration: months ? durationLabel(months) : null,
      });
    }

    return NextResponse.json({
      success: true,
      message: wasActive
        ? "Access extended."
        : "Access granted.",
      emailSent,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        expiresAt: workspace.expiresAt,
        holderLimit: workspace.holderLimit,
      },
    });
  } catch (error) {
    console.error("[ADMIN_COMPANIES_GRANT]", error);
    return fail("We could not save this change.", 500);
  }
}

import { NextResponse } from "next/server";
import type { FindingSeverity, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  requireAdvisorFirm,
  requireClientInFirm,
} from "@/lib/advisor-access";
import { advisorErrorResponse } from "@/lib/advisor-http";
import { runDiligence } from "@/lib/advisor/engine";
import { syncRules } from "@/lib/advisor/rules";
import { logAdvisorChange } from "@/lib/change-log";

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  RED: 0,
  AMBER: 1,
  INFO: 2,
  GREEN: 3,
};

// "Today" in India, as a UTC-midnight date, so runs before 5:30am IST
// do not count as the previous day.
function todayIst(): Date {
  const ist = new Date(Date.now() + 330 * 60 * 1000);
  return new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate())
  );
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { firm, user } = await requireAdvisorFirm({ write: true });
    const { clientId } = await params;

    const client = await requireClientInFirm(firm.id, clientId);

    const [rules, resolutions, valuations, grants, exercises, capTable] =
      await Promise.all([
        syncRules(),
        prisma.clientResolution.findMany({ where: { clientId } }),
        prisma.clientValuation.findMany({ where: { clientId } }),
        prisma.registerGrant.findMany({ where: { clientId } }),
        prisma.registerExercise.findMany({ where: { clientId } }),
        prisma.capTableRow.findMany({ where: { clientId } }),
      ]);

    if (grants.length === 0) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_DATA",
          message: "Import the ESOP register before running the diligence check.",
        },
        { status: 400 }
      );
    }

    const result = runDiligence({
      asOf: todayIst(),
      client,
      resolutions,
      valuations,
      grants,
      exercises,
      capTable,
      rules,
    });

    const snapshot = {
      asOf: result.asOf,
      skipped: result.skipped,
      summary: result.summary,
      rules: rules.map((r) => ({
        code: r.code,
        verified: r.verified,
        severityVerified: r.severityVerified,
        severityUnverified: r.severityUnverified,
      })),
    };

    const run = await prisma.diligenceRun.create({
      data: {
        clientId,
        score: result.score,
        rulesSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        findings: {
          create: result.findings.map((f) => ({
            ruleCode: f.ruleCode,
            severity: f.severity,
            title: f.title,
            detail: f.detail,
            sourceRef: {
              ...f.sourceRef,
              count: f.count,
            } as unknown as Prisma.InputJsonValue,
            suggestedOwner: f.suggestedOwner,
            dueDate: f.dueDate,
            ruleVerified: f.ruleVerified,
          })),
        },
      },
      include: { findings: true },
    });

    await logAdvisorChange({ user, firm }, clientId, {
      action: "diligence.run",
      entityType: "diligence",
      entityId: run.id,
      summary: `Ran the ESOP Diligence check: score ${run.score}, ${run.findings.length} finding${run.findings.length === 1 ? "" : "s"}.`,
      details: { score: run.score, findings: run.findings.length },
    });
    run.findings.sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );

    return NextResponse.json(
      {
        success: true,
        run,
        summary: result.summary,
        skipped: result.skipped,
      },
      { status: 201 }
    );
  } catch (error) {
    return advisorErrorResponse(error);
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { firm } = await requireAdvisorFirm();
    const { clientId } = await params;

    await requireClientInFirm(firm.id, clientId);

    const runId = new URL(request.url).searchParams.get("runId");

    const run = await prisma.diligenceRun.findFirst({
      where: { clientId, ...(runId ? { id: runId } : {}) },
      orderBy: { createdAt: "desc" },
      include: { findings: true },
    });

    if (!run) {
      return NextResponse.json({ success: true, run: null });
    }

    run.findings.sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );

    const history = await prisma.diligenceRun.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, score: true, createdAt: true },
    });

    return NextResponse.json({ success: true, run, history });
  } catch (error) {
    return advisorErrorResponse(error);
  }
}
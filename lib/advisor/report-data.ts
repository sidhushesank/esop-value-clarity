import type { FindingSeverity, RegisterGrantStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  RED: 0,
  AMBER: 1,
  INFO: 2,
  GREEN: 3,
};

export type ReportFinding = {
  severity: FindingSeverity;
  ruleCode: string;
  title: string;
  detail: string;
  ruleSource: string | null;
  rows: number[];
  count: number;
  owner: string | null;
  dueDate: Date | null;
  ruleVerified: boolean;
};

export type ReportGrant = {
  sourceRow: number | null;
  employeeName: string;
  grantDate: Date;
  optionsGranted: number;
  optionsLapsed: number;
  optionsExercised: number;
  exercisePrice: number;
  vestingMonths: number | null;
  cliffMonths: number | null;
  expiryDate: Date | null;
  postExitExerciseDays: number | null;
  status: RegisterGrantStatus;
  leftOn: Date | null;
};

export type ReportExercise = {
  employeeName: string;
  exerciseDate: Date;
  optionsExercised: number;
  allotmentDate: Date | null;
  pas3FiledOn: Date | null;
};

export type ReportData = {
  brand: string;
  footer: string | null;
  client: {
    id: string;
    name: string;
    cin: string | null;
    companyType: string;
  };
  run: {
    id: string;
    score: number;
    createdAt: Date;
    asOf: string;
  };
  summary: { red: number; amber: number; info: number; green: number };
  skipped: string[];
  findings: ReportFinding[];
  grants: ReportGrant[];
  exercises: ReportExercise[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function companyTypeLabel(type: string): string {
  return type === "UNLISTED_PUBLIC"
    ? "Unlisted public company"
    : "Private limited company";
}

export function formatIst(date: Date): string {
  return (
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(date)
      .replace(/[\u202F\u00A0]/g, " ") + " IST"
  );
}

/**
 * The fix list shown in the PDF and the Excel annex: every flagged finding
 * (plus dated notes), most severe first, then earliest due date, then
 * undated items.
 */
export function buildFixList(findings: ReportFinding[]): ReportFinding[] {
  return findings
    .filter(
      (f) =>
        f.severity === "RED" ||
        f.severity === "AMBER" ||
        (f.severity === "INFO" && f.dueDate !== null)
    )
    .sort((a, b) => {
      const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (bySeverity !== 0) return bySeverity;
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
}

export function reportFileName(data: ReportData, ext: "pdf" | "xlsx"): string {
  const slug =
    data.client.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "client";

  return `${slug}-esop-diligence-${data.run.asOf}.${ext}`;
}

/**
 * Loads a diligence run (latest if runId is null) with everything the PDF
 * and Excel builders need. Performs NO authorization: callers must already
 * have verified access to this client.
 */
export async function loadReportData(
  clientId: string,
  runId: string | null
): Promise<ReportData | null> {
  const client = await prisma.clientCompany.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      name: true,
      cin: true,
      companyType: true,
      firm: {
        select: { name: true, brandName: true, brandFooter: true },
      },
    },
  });

  if (!client) return null;

  const run = await prisma.diligenceRun.findFirst({
    where: { clientId, ...(runId ? { id: runId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { findings: true },
  });

  if (!run) return null;

  const [grants, exercises] = await Promise.all([
    prisma.registerGrant.findMany({
      where: { clientId },
      orderBy: [{ sourceRow: "asc" }, { employeeName: "asc" }],
    }),
    prisma.registerExercise.findMany({
      where: { clientId },
      orderBy: { exerciseDate: "asc" },
      include: { grant: { select: { employeeName: true } } },
    }),
  ]);

  const exercisedByGrant = new Map<string, number>();
  for (const ex of exercises) {
    exercisedByGrant.set(
      ex.grantId,
      (exercisedByGrant.get(ex.grantId) ?? 0) + ex.optionsExercised
    );
  }

  const snapshot = asRecord(run.rulesSnapshot);
  const skipped = Array.isArray(snapshot.skipped)
    ? snapshot.skipped.filter((s): s is string => typeof s === "string")
    : [];
  const asOf =
    typeof snapshot.asOf === "string"
      ? snapshot.asOf
      : run.createdAt.toISOString().slice(0, 10);

  const findings: ReportFinding[] = run.findings
    .map((f) => {
      const ref = asRecord(f.sourceRef);
      return {
        severity: f.severity,
        ruleCode: f.ruleCode,
        title: f.title,
        detail: f.detail,
        ruleSource: typeof ref.ruleSource === "string" ? ref.ruleSource : null,
        rows: Array.isArray(ref.rows)
          ? ref.rows.filter((n): n is number => typeof n === "number")
          : [],
        count: typeof ref.count === "number" ? ref.count : 1,
        owner: f.suggestedOwner,
        dueDate: f.dueDate,
        ruleVerified: f.ruleVerified,
      };
    })
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const summary = { red: 0, amber: 0, info: 0, green: 0 };
  for (const f of findings) {
    if (f.severity === "RED") summary.red++;
    else if (f.severity === "AMBER") summary.amber++;
    else if (f.severity === "INFO") summary.info++;
    else summary.green++;
  }

  return {
    brand: client.firm.brandName?.trim() || client.firm.name,
    footer: client.firm.brandFooter?.trim() || null,
    client: {
      id: client.id,
      name: client.name,
      cin: client.cin,
      companyType: client.companyType,
    },
    run: {
      id: run.id,
      score: run.score,
      createdAt: run.createdAt,
      asOf,
    },
    summary,
    skipped,
    findings,
    grants: grants.map((g) => ({
      sourceRow: g.sourceRow,
      employeeName: g.employeeName,
      grantDate: g.grantDate,
      optionsGranted: g.optionsGranted,
      optionsLapsed: g.optionsLapsed,
      optionsExercised: exercisedByGrant.get(g.id) ?? 0,
      exercisePrice: g.exercisePrice,
      vestingMonths: g.vestingMonths,
      cliffMonths: g.cliffMonths,
      expiryDate: g.expiryDate,
      postExitExerciseDays: g.postExitExerciseDays,
      status: g.status,
      leftOn: g.leftOn,
    })),
    exercises: exercises.map((e) => ({
      employeeName: e.grant.employeeName,
      exerciseDate: e.exerciseDate,
      optionsExercised: e.optionsExercised,
      allotmentDate: e.allotmentDate,
      pas3FiledOn: e.pas3FiledOn,
    })),
  };
}
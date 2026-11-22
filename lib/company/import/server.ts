import { prisma } from "@/lib/prisma";
import { ProAccessError } from "@/lib/pro-access";
import { getUploadedFile, readSheet } from "@/lib/advisor/import-parse";
import {
  fieldsFor,
  missingRequired,
  parseMapping,
  suggestMapping,
  type ImportKind,
  type ImportMapping,
} from "@/lib/company/import/fields";
import { analyseCapTable, type SecurityKindLite } from "@/lib/company/import/captable-import";
import { analyseGrants, grantDupKey } from "@/lib/company/import/grants-import";

function bad(message: string): never {
  throw new ProAccessError(message, 400, "IMPORT_ERROR");
}

export function parseKind(value: string): ImportKind {
  if (value === "captable" || value === "grants") return value;
  throw new ProAccessError("Unknown import type.", 404, "NOT_FOUND");
}

export function todayUtc(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

/** Reads the uploaded sheet and the (optional) column mapping from the form. */
export async function readImportForm(request: Request, kind: ImportKind) {
  const form = await request.formData().catch(() => null);
  if (!form) bad("Attach a .xlsx or .csv file.");

  const { buffer, fileName } = await getUploadedFile(form);
  const sheet = await readSheet(buffer, fileName);
  const fields = fieldsFor(kind);

  let mapping: ImportMapping;
  try {
    mapping = parseMapping(form.get("mapping"), fields, sheet.headers.length) ?? suggestMapping(sheet.headers, fields);
  } catch (e) {
    bad(e instanceof Error ? e.message : "The column mapping is not valid.");
  }

  return { form, fileName, sheet, fields, mapping, missing: missingRequired(mapping, fields) };
}

/* ------------------------------------------------------------------ */
/* Cap table                                                           */
/* ------------------------------------------------------------------ */

export async function capTableAnalysis(
  workspaceId: string,
  rows: { rowNumber: number; cells: unknown[] }[],
  mapping: ImportMapping,
  asOfRaw: FormDataEntryValue | null
) {
  const today = todayUtc();
  let asOf = today;
  if (typeof asOfRaw === "string" && asOfRaw) {
    const d = new Date(`${asOfRaw}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) bad("The date for rows without a date is not valid.");
    if (d.getTime() > today.getTime()) bad("The date for rows without a date cannot be in the future.");
    asOf = d;
  }

  const [classes, holders] = await Promise.all([
    prisma.securityClass.findMany({
      where: { workspaceId, archivedAt: null },
      select: { id: true, name: true, kind: true },
    }),
    prisma.shareholder.findMany({
      where: { workspaceId, archivedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  const analysis = analyseCapTable(rows, mapping, {
    asOf,
    today,
    existingClasses: classes.map((c) => ({ name: c.name, kind: c.kind as SecurityKindLite })),
    existingHolders: holders,
  });

  return { analysis, classes, holders, asOf };
}

/* ------------------------------------------------------------------ */
/* Grants                                                              */
/* ------------------------------------------------------------------ */

const POOL_STATUSES = ["ISSUED", "ACCEPTED", "LEFT", "EXERCISED", "LAPSED"] as const;
const HOLDER_STATUSES = ["DRAFT", "ISSUED", "ACCEPTED", "LEFT", "EXERCISED"] as const;

export async function grantsAnalysis(
  workspace: {
    id: string;
    dpiitRecognised: boolean | null;
    incorporationDate: Date | null;
    jurisdiction?: "IN" | "US";
    currentFmvPerShare?: number | null;
    fmvValuationDate?: Date | null;
  },
  rows: { rowNumber: number; cells: unknown[] }[],
  mapping: ImportMapping,
  schemeIdRaw: FormDataEntryValue | null,
  holderLimit: number | null
) {
  if (typeof schemeIdRaw !== "string" || !schemeIdRaw) bad("Choose the ESOP scheme these grants belong to.");

  const scheme = await prisma.esopScheme.findFirst({
    where: { id: schemeIdRaw, workspaceId: workspace.id, archivedAt: null },
  });
  if (!scheme) bad("Choose a valid ESOP scheme.");

  const [schemeGrants, allGrants] = await Promise.all([
    prisma.optionGrant.findMany({
      where: { schemeId: scheme.id, status: { in: [...POOL_STATUSES] } },
      select: { options: true, optionsLapsed: true },
    }),
    prisma.optionGrant.findMany({
      where: { workspaceId: workspace.id },
      select: { holderKey: true, grantDate: true, options: true, status: true },
    }),
  ]);

  const poolUsed = schemeGrants.reduce((s, g) => s + (g.options - g.optionsLapsed), 0);
  const existingHolderKeys = new Set<string>(
    allGrants
      .filter((g: { status: string }) => (HOLDER_STATUSES as readonly string[]).includes(g.status))
      .map((g: { holderKey: string }) => g.holderKey)
  );
  const existingGrantKeys = new Set<string>(
    allGrants.map((g: { holderKey: string; grantDate: Date; options: number }) =>
      grantDupKey(g.holderKey, g.grantDate, g.options)
    )
  );

  const analysis = analyseGrants(rows, mapping, {
    today: todayUtc(),
    scheme: {
      poolSize: scheme.poolSize,
      poolUsed,
      shareholderApprovedOn: scheme.shareholderApprovedOn,
      boardApprovedOn: scheme.boardApprovedOn,
      defaultVestingMonths: scheme.defaultVestingMonths,
      defaultCliffMonths: scheme.defaultCliffMonths,
      defaultPostExitDays: scheme.defaultPostExitDays,
    },
    workspace: {
      dpiitRecognised: workspace.dpiitRecognised,
      incorporationDate: workspace.incorporationDate,
      jurisdiction: workspace.jurisdiction ?? "IN",
      currentFmvPerShare: workspace.currentFmvPerShare ?? null,
      fmvValuationDate: workspace.fmvValuationDate ?? null,
    },
    existingHolderKeys,
    existingGrantKeys,
    holderLimit,
  });

  return { analysis, scheme };
}

import type { HolderType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ProAccessError } from "@/lib/pro-access";
import { normaliseHeader } from "@/lib/advisor/import-fields";
import {
  parseDateValue,
  parseIntegerValue,
  type SheetRow,
} from "@/lib/advisor/import-parse";

export type OtherKind = "exercises" | "captable";

export type OtherFieldDef = {
  key: string;
  label: string;
  required: boolean;
  synonyms: string[];
};

export type OtherMapping = Record<string, number | null>;

function importError(message: string, status = 400) {
  return new ProAccessError(message, status, "IMPORT_ERROR");
}

export function parseKind(value: string): OtherKind {
  if (value === "exercises" || value === "captable") return value;
  throw importError("Unknown import type.", 404);
}

/* ------------------------------------------------------------------ */
/* Field definitions                                                   */
/* ------------------------------------------------------------------ */

export const EXERCISE_FIELDS: OtherFieldDef[] = [
  {
    key: "employeeName",
    label: "Employee name",
    required: true,
    synonyms: [
      "employeename",
      "nameofemployee",
      "nameoftheemployee",
      "nameofgrantee",
      "grantee",
      "optionholder",
      "employee",
      "name",
    ],
  },
  {
    key: "employeeRef",
    label: "Employee ID",
    required: false,
    synonyms: ["employeeid", "empid", "employeecode", "empcode", "employeeno"],
  },
  {
    key: "grantDate",
    label: "Grant date (needed only if an employee has several grants)",
    required: false,
    synonyms: ["grantdate", "dateofgrant"],
  },
  {
    key: "exerciseDate",
    label: "Exercise date",
    required: true,
    synonyms: ["exercisedate", "dateofexercise", "dateofexerciseofoptions"],
  },
  {
    key: "optionsExercised",
    label: "Options exercised",
    required: true,
    synonyms: [
      "optionsexercised",
      "noofoptionsexercised",
      "numberofoptionsexercised",
      "exercisedoptions",
      "sharesallotted",
      "noofsharesallotted",
    ],
  },
  {
    key: "allotmentDate",
    label: "Allotment date (board resolution)",
    required: false,
    synonyms: ["allotmentdate", "dateofallotment", "boardallotmentdate"],
  },
  {
    key: "pas3FiledOn",
    label: "PAS-3 filed on",
    required: false,
    synonyms: ["pas3filedon", "pas3filingdate", "pas3date", "dateofpas3", "pas3filed"],
  },
];

export const CAPTABLE_FIELDS: OtherFieldDef[] = [
  {
    key: "holderName",
    label: "Shareholder name",
    required: true,
    synonyms: [
      "shareholdername",
      "nameofshareholder",
      "nameofholder",
      "shareholder",
      "holder",
      "name",
    ],
  },
  {
    key: "holderType",
    label: "Holder type",
    required: false,
    synonyms: ["holdertype", "typeofholder", "shareholdercategory", "category", "type"],
  },
  {
    key: "shares",
    label: "Number of shares",
    required: true,
    synonyms: [
      "numberofshares",
      "noofshares",
      "sharesheld",
      "totalshares",
      "noofequityshares",
      "equityshares",
      "shares",
    ],
  },
];

export function fieldsFor(kind: OtherKind): OtherFieldDef[] {
  return kind === "exercises" ? EXERCISE_FIELDS : CAPTABLE_FIELDS;
}

/* ------------------------------------------------------------------ */
/* Mapping helpers                                                     */
/* ------------------------------------------------------------------ */

export function suggestOtherMapping(
  headers: string[],
  defs: OtherFieldDef[]
): OtherMapping {
  const normalised = headers.map(normaliseHeader);
  const used = new Set<number>();
  const mapping: OtherMapping = {};

  for (const def of defs) mapping[def.key] = null;

  for (const def of defs) {
    const index = normalised.findIndex(
      (h, i) => !used.has(i) && def.synonyms.includes(h)
    );
    if (index >= 0) {
      mapping[def.key] = index;
      used.add(index);
    }
  }

  for (const def of defs) {
    if (mapping[def.key] !== null) continue;
    const index = normalised.findIndex(
      (h, i) =>
        !used.has(i) &&
        h.length > 0 &&
        def.synonyms.some((s) => s.length >= 8 && h.includes(s))
    );
    if (index >= 0) {
      mapping[def.key] = index;
      used.add(index);
    }
  }

  return mapping;
}

export function missingOtherFields(
  mapping: OtherMapping,
  defs: OtherFieldDef[]
): string[] {
  return defs
    .filter((d) => d.required && mapping[d.key] === null)
    .map((d) => d.label);
}

export function parseOtherMapping(
  raw: FormDataEntryValue | null,
  headerCount: number,
  defs: OtherFieldDef[]
): OtherMapping | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw importError("The column mapping is not valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw importError("The column mapping is not valid.");
  }

  const input = parsed as Record<string, unknown>;
  const mapping: OtherMapping = {};

  for (const def of defs) {
    const value = input[def.key];
    if (value === null || value === undefined) {
      mapping[def.key] = null;
      continue;
    }
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 0 ||
      value >= headerCount
    ) {
      throw importError(`The column chosen for "${def.label}" is not valid.`);
    }
    mapping[def.key] = value;
  }

  return mapping;
}

/* ------------------------------------------------------------------ */
/* Row helpers                                                         */
/* ------------------------------------------------------------------ */

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.replace(/^\uFEFF/, "").trim() === "";
  return false;
}

function textOf(value: unknown): string {
  return String(value).replace(/^\uFEFF/, "").trim();
}

function normName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normRef(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function saneYear(date: Date): boolean {
  const y = date.getUTCFullYear();
  return y >= 1990 && y <= 2100;
}

export type InvalidRow = { rowNumber: number; errors: string[] };

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

export type ParsedExercise = {
  sourceRow: number;
  grantId: string;
  employeeName: string;
  exerciseDate: Date;
  optionsExercised: number;
  allotmentDate: Date | null;
  pas3FiledOn: Date | null;
};

async function buildExercises(
  clientId: string,
  rows: SheetRow[],
  mapping: OtherMapping,
  mode: "append" | "replace"
) {
  const grants = await prisma.registerGrant.findMany({
    where: { clientId },
    select: {
      id: true,
      employeeName: true,
      employeeRef: true,
      grantDate: true,
      optionsGranted: true,
      optionsLapsed: true,
    },
  });

  if (grants.length === 0) {
    throw importError("Import the ESOP register first, then the exercise log.");
  }

  const running = new Map<string, number>();

  if (mode === "append") {
    const sums = await prisma.registerExercise.groupBy({
      by: ["grantId"],
      where: { clientId },
      _sum: { optionsExercised: true },
    });
    for (const s of sums) {
      running.set(s.grantId, s._sum.optionsExercised ?? 0);
    }
  }

  const valid: ParsedExercise[] = [];
  const invalid: InvalidRow[] = [];

  for (const row of rows) {
    const errors: string[] = [];

    const cell = (key: string): unknown => {
      const index = mapping[key];
      if (index === null || index === undefined) return null;
      const value = row.cells[index];
      return isBlank(value) ? null : value;
    };

    const nameRaw = cell("employeeName");
    const refRaw = cell("employeeRef");
    const name = nameRaw === null ? "" : textOf(nameRaw);
    if (!name) errors.push("Employee name is missing");

    let exerciseDate: Date | null = null;
    const exerciseRaw = cell("exerciseDate");
    if (exerciseRaw === null) {
      errors.push("Exercise date is missing");
    } else {
      const r = parseDateValue(exerciseRaw);
      if (r.ok) exerciseDate = r.value;
      else errors.push(`Exercise date ${r.error}`);
    }

    let optionsExercised: number | null = null;
    const optionsRaw = cell("optionsExercised");
    if (optionsRaw === null) {
      errors.push("Options exercised is missing");
    } else {
      const r = parseIntegerValue(optionsRaw);
      if (!r.ok) errors.push(`Options exercised ${r.error}`);
      else if (r.value <= 0) errors.push("Options exercised must be more than zero");
      else optionsExercised = r.value;
    }

    let allotmentDate: Date | null = null;
    const allotRaw = cell("allotmentDate");
    if (allotRaw !== null) {
      const r = parseDateValue(allotRaw);
      if (r.ok) allotmentDate = r.value;
      else errors.push(`Allotment date ${r.error}`);
    }

    let pas3FiledOn: Date | null = null;
    const pas3Raw = cell("pas3FiledOn");
    if (pas3Raw !== null) {
      const r = parseDateValue(pas3Raw);
      if (r.ok) pas3FiledOn = r.value;
      else errors.push(`PAS-3 date ${r.error}`);
    }

    let grantDate: Date | null = null;
    const grantDateRaw = cell("grantDate");
    if (grantDateRaw !== null) {
      const r = parseDateValue(grantDateRaw);
      if (r.ok) grantDate = r.value;
      else errors.push(`Grant date ${r.error}`);
    }

    for (const [label, d] of [
      ["Exercise date", exerciseDate],
      ["Allotment date", allotmentDate],
      ["PAS-3 date", pas3FiledOn],
    ] as const) {
      if (d && !saneYear(d)) {
        errors.push(`${label} looks wrong (year ${d.getUTCFullYear()})`);
      }
    }

    if (exerciseDate && allotmentDate && allotmentDate < exerciseDate) {
      errors.push("Allotment date is before the exercise date");
    }
    if (allotmentDate && pas3FiledOn && pas3FiledOn < allotmentDate) {
      errors.push("PAS-3 date is before the allotment date");
    }
    if (!allotmentDate && pas3FiledOn && exerciseDate && pas3FiledOn < exerciseDate) {
      errors.push("PAS-3 date is before the exercise date");
    }

    // Match the grant.
    let grantId: string | null = null;

    if (name) {
      let candidates: typeof grants = [];

      if (refRaw !== null) {
        const ref = normRef(textOf(refRaw));
        candidates = grants.filter(
          (g) => g.employeeRef && normRef(g.employeeRef) === ref
        );
      }
      if (candidates.length === 0) {
        candidates = grants.filter(
          (g) => normName(g.employeeName) === normName(name)
        );
      }

      if (candidates.length > 1 && grantDate) {
        candidates = candidates.filter(
          (g) => isoDay(g.grantDate) === isoDay(grantDate!)
        );
      }

      if (candidates.length === 0) {
        errors.push(`No grant found in the register for "${name}"`);
      } else if (candidates.length > 1) {
        errors.push(
          `"${name}" has ${candidates.length} grants. Add a grant date column so the right one can be chosen`
        );
      } else {
        grantId = candidates[0].id;

        if (optionsExercised !== null && errors.length === 0) {
          const g = candidates[0];
          const available = g.optionsGranted - g.optionsLapsed;
          const total = (running.get(g.id) ?? 0) + optionsExercised;

          if (total > available) {
            errors.push(
              `Exercises for "${name}" total ${total}, but only ${available} options are available`
            );
          } else {
            running.set(g.id, total);
          }
        }
      }
    }

    if (errors.length > 0 || !grantId || !exerciseDate || optionsExercised === null) {
      invalid.push({ rowNumber: row.rowNumber, errors });
      continue;
    }

    valid.push({
      sourceRow: row.rowNumber,
      grantId,
      employeeName: name,
      exerciseDate,
      optionsExercised,
      allotmentDate,
      pas3FiledOn,
    });
  }

  return { valid, invalid };
}

/* ------------------------------------------------------------------ */
/* Cap table                                                           */
/* ------------------------------------------------------------------ */

export type ParsedHolder = {
  sourceRow: number;
  holderName: string;
  holderType: HolderType;
  shares: number;
};

export function parseHolderType(value: unknown): HolderType {
  const text = textOf(value).toLowerCase();

  if (/(esop|pool|option|trust)/.test(text)) return "ESOP_POOL";
  if (/(founder|promoter|director)/.test(text)) return "FOUNDER";
  if (/(investor|fund|vc|venture|angel|seed|series|capital)/.test(text)) {
    return "INVESTOR";
  }
  return "OTHER";
}

function buildCapTable(rows: SheetRow[], mapping: OtherMapping) {
  const valid: ParsedHolder[] = [];
  const invalid: InvalidRow[] = [];

  for (const row of rows) {
    const errors: string[] = [];

    const cell = (key: string): unknown => {
      const index = mapping[key];
      if (index === null || index === undefined) return null;
      const value = row.cells[index];
      return isBlank(value) ? null : value;
    };

    const nameRaw = cell("holderName");
    const name = nameRaw === null ? "" : textOf(nameRaw);
    if (!name) errors.push("Shareholder name is missing");

    let shares: number | null = null;
    const sharesRaw = cell("shares");
    if (sharesRaw === null) {
      errors.push("Number of shares is missing");
    } else {
      const r = parseIntegerValue(sharesRaw);
      if (!r.ok) errors.push(`Number of shares ${r.error}`);
      else if (r.value <= 0) errors.push("Number of shares must be more than zero");
      else shares = r.value;
    }

    const typeRaw = cell("holderType");
    const holderType: HolderType =
      typeRaw === null ? parseHolderType(name) : parseHolderType(typeRaw);

    if (errors.length > 0 || !name || shares === null) {
      invalid.push({ rowNumber: row.rowNumber, errors });
      continue;
    }

    valid.push({ sourceRow: row.rowNumber, holderName: name, holderType, shares });
  }

  return { valid, invalid };
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export type OtherAnalysis =
  | { kind: "exercises"; valid: ParsedExercise[]; invalid: InvalidRow[] }
  | { kind: "captable"; valid: ParsedHolder[]; invalid: InvalidRow[] };

export async function analyseOther(
  kind: OtherKind,
  clientId: string,
  rows: SheetRow[],
  mapping: OtherMapping,
  mode: "append" | "replace"
): Promise<OtherAnalysis> {
  if (kind === "exercises") {
    const result = await buildExercises(clientId, rows, mapping, mode);
    return { kind, ...result };
  }
  const result = buildCapTable(rows, mapping);
  return { kind, ...result };
}
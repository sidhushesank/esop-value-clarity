import { Readable } from "node:stream";

import ExcelJS from "exceljs";
import type { RegisterGrantStatus } from "@prisma/client";

import { ProAccessError } from "@/lib/pro-access";
import {
  GRANT_FIELDS,
  GRANT_FIELD_KEYS,
  emptyMapping,
  type ColumnMapping,
  type GrantFieldKey,
} from "@/lib/advisor/import-fields";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;

function importError(message: string) {
  return new ProAccessError(message, 400, "IMPORT_ERROR");
}

/* ------------------------------------------------------------------ */
/* Reading the file                                                    */
/* ------------------------------------------------------------------ */

export type SheetRow = { rowNumber: number; cells: unknown[] };

export type RawSheet = {
  headers: string[];
  rows: SheetRow[];
};

function cellToPrimitive(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value !== "object") return value;

  const obj = value as unknown as Record<string, unknown>;

  if ("result" in obj) {
    return cellToPrimitive(obj.result as ExcelJS.CellValue);
  }
  if (Array.isArray(obj.richText)) {
    return (obj.richText as { text: string }[]).map((p) => p.text).join("");
  }
  if (typeof obj.text === "string") return obj.text;

  return null;
}

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.replace(/^\uFEFF/, "").trim() === "";
  return false;
}

export async function getUploadedFile(form: FormData) {
  const file = form.get("file");

  if (!(file instanceof File)) {
    throw importError("Please attach a .xlsx or .csv file.");
  }
  if (file.size === 0) {
    throw importError("The uploaded file is empty.");
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw importError("The file is larger than 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return { buffer, fileName: file.name };
}

export async function readSheet(
  buffer: Buffer,
  fileName: string
): Promise<RawSheet> {
  const workbook = new ExcelJS.Workbook();
  const lower = fileName.toLowerCase();
  let sheet: ExcelJS.Worksheet | undefined;

  try {
    if (lower.endsWith(".xlsx")) {
      await workbook.xlsx.load(
        buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]
      );
      sheet = workbook.worksheets[0];
    } else if (lower.endsWith(".csv")) {
      sheet = await workbook.csv.read(Readable.from([buffer]));
    } else {
      throw importError("Only .xlsx and .csv files are supported. Save .xls files as .xlsx first.");
    }
  } catch (error) {
    if (error instanceof ProAccessError) throw error;
    throw importError("The file could not be read. Check that it is a valid spreadsheet.");
  }

  if (!sheet) {
    throw importError("The file has no sheets.");
  }

  const columnCount = sheet.columnCount;
  const grid: SheetRow[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells: unknown[] = [];
    for (let c = 1; c <= columnCount; c++) {
      cells.push(cellToPrimitive(row.getCell(c).value));
    }
    grid.push({ rowNumber, cells });
  });

  // The header is the first row (within the first 10) with 3+ text cells.
  const headerIndex = grid
    .slice(0, 10)
    .findIndex(
      (row) =>
        row.cells.filter((c) => typeof c === "string" && !isBlank(c)).length >= 3
    );

  if (headerIndex < 0) {
    throw importError("Could not find a header row. The first rows should contain column names.");
  }

  const headers = grid[headerIndex].cells.map((cell, i) =>
    isBlank(cell)
      ? `Column ${i + 1}`
      : String(cell).replace(/^\uFEFF/, "").trim()
  );

  const rows = grid
    .slice(headerIndex + 1)
    .filter((row) => row.cells.some((c) => !isBlank(c)));

  if (rows.length === 0) {
    throw importError("No data rows found under the header.");
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw importError(`The file has more than ${MAX_IMPORT_ROWS} rows. Split it and import in parts.`);
  }

  return { headers, rows };
}

/* ------------------------------------------------------------------ */
/* Mapping from the request                                            */
/* ------------------------------------------------------------------ */

export function parseMappingField(
  raw: FormDataEntryValue | null,
  headerCount: number
): ColumnMapping | null {
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
  const mapping = emptyMapping();

  for (const key of GRANT_FIELD_KEYS) {
    const value = input[key];
    if (value === null || value === undefined) continue;

    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 0 ||
      value >= headerCount
    ) {
      throw importError(`The column chosen for "${key}" is not valid.`);
    }
    mapping[key as GrantFieldKey] = value;
  }

  return mapping;
}

/* ------------------------------------------------------------------ */
/* Value parsers                                                       */
/* ------------------------------------------------------------------ */

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const MONTH_NAMES: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function textOf(value: unknown): string {
  return String(value).replace(/^\uFEFF/, "").trim();
}

function makeUtcDate(y: number, m: number, d: number): Date | null {
  const date = new Date(Date.UTC(y, m, d));
  return date.getUTCFullYear() === y &&
    date.getUTCMonth() === m &&
    date.getUTCDate() === d
    ? date
    : null;
}

function toFullYear(y: number): number {
  return y < 100 ? 2000 + y : y;
}

export function parseDateValue(value: unknown): Parsed<Date> {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return { ok: false, error: "is not a valid date" };
    return {
      ok: true,
      value: new Date(
        Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
      ),
    };
  }

  // Excel serial date number
  if (typeof value === "number" && value > 20000 && value < 80000) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return {
      ok: true,
      value: new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      ),
    };
  }

  if (typeof value !== "string") {
    return { ok: false, error: `could not be read as a date ("${textOf(value)}")` };
  }

  const text = textOf(value);

  // yyyy-mm-dd
  let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (m) {
    const date = makeUtcDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (date) return { ok: true, value: date };
  }

  // dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy (day first, as used in India)
  m = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})(?:\s.*)?$/);
  if (m) {
    const date = makeUtcDate(toFullYear(Number(m[3])), Number(m[2]) - 1, Number(m[1]));
    if (date) return { ok: true, value: date };
  }

  // 15 Jan 2023, 15-Jan-23, 15th January 2023
  m = text.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\-/,]+([A-Za-z]{3,9})\.?[\s\-/,]+(\d{2,4})/);
  if (m) {
    const month = MONTH_NAMES[m[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      const date = makeUtcDate(toFullYear(Number(m[3])), month, Number(m[1]));
      if (date) return { ok: true, value: date };
    }
  }

  return { ok: false, error: `could not be read as a date ("${text}")` };
}

export function parseNumberValue(value: unknown): Parsed<number> {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? { ok: true, value }
      : { ok: false, error: "is not a valid number" };
  }

  if (typeof value !== "string") {
    return { ok: false, error: `could not be read as a number ("${textOf(value)}")` };
  }

  const cleaned = textOf(value)
    .replace(/[₹,]/g, "")
    .replace(/\b(rs|inr)\.?/gi, "")
    .replace(/\/-/g, "")
    .replace(/\s+/g, "");

  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return { ok: false, error: `could not be read as a number ("${textOf(value)}")` };
  }

  return { ok: true, value: Number(cleaned) };
}

export function parseIntegerValue(value: unknown): Parsed<number> {
  const parsed = parseNumberValue(value);
  if (!parsed.ok) return parsed;

  if (!Number.isInteger(parsed.value)) {
    return { ok: false, error: `must be a whole number ("${textOf(value)}")` };
  }
  return parsed;
}

/**
 * Durations: "48", "48 months", "4 years", "90 days", "3 months".
 * A bare number is taken in the field's own unit.
 * Months <-> days uses 30 days a month (approximate).
 */
export function parseDurationValue(
  value: unknown,
  target: "months" | "days"
): Parsed<number> {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0
      ? { ok: true, value: Math.round(value) }
      : { ok: false, error: "is not a valid duration" };
  }

  const text = textOf(value).toLowerCase();
  const m = text.match(/^(\d+(?:\.\d+)?)\s*([a-z]*)/);

  if (!m) {
    return { ok: false, error: `could not be read as a duration ("${textOf(value)}")` };
  }

  const amount = Number(m[1]);
  const unitText = m[2];

  let unit: "years" | "months" | "days" = target;
  if (unitText.startsWith("y")) unit = "years";
  else if (unitText.startsWith("mo") || unitText === "m") unit = "months";
  else if (unitText.startsWith("d")) unit = "days";
  else if (unitText !== "") {
    return { ok: false, error: `has an unknown unit ("${textOf(value)}")` };
  }

  let result: number;
  if (target === "months") {
    result = unit === "years" ? amount * 12 : unit === "days" ? amount / 30 : amount;
  } else {
    result = unit === "years" ? amount * 365 : unit === "months" ? amount * 30 : amount;
  }

  return { ok: true, value: Math.round(result) };
}

export function parseStatusValue(value: unknown): RegisterGrantStatus {
  const text = textOf(value).toLowerCase();

  if (text.includes("lapse")) return "LAPSED";
  if (/(left|resign|separat|terminat|exit)/.test(text)) return "LEFT";
  if (text.includes("exercis")) return "FULLY_EXERCISED";
  return "ACTIVE";
}

/* ------------------------------------------------------------------ */
/* Turning rows into grants                                            */
/* ------------------------------------------------------------------ */

export type ParsedGrant = {
  sourceRow: number;
  employeeName: string;
  employeeRef: string | null;
  grantDate: Date;
  optionsGranted: number;
  exercisePrice: number;
  vestingStartDate: Date | null;
  vestingMonths: number | null;
  cliffMonths: number | null;
  expiryDate: Date | null;
  postExitExerciseDays: number | null;
  optionsLapsed: number;
  status: RegisterGrantStatus;
  leftOn: Date | null;
};

export type InvalidRow = { rowNumber: number; errors: string[] };

function dateLooksSane(date: Date): boolean {
  const year = date.getUTCFullYear();
  return year >= 1990 && year <= 2100;
}

export function buildGrantRows(rows: SheetRow[], mapping: ColumnMapping) {
  const valid: ParsedGrant[] = [];
  const invalid: InvalidRow[] = [];

  for (const row of rows) {
    const errors: string[] = [];

    const raw = (key: GrantFieldKey): unknown => {
      const index = mapping[key];
      if (index === null) return null;
      const cell = row.cells[index];
      return isBlank(cell) ? null : cell;
    };

    const labelOf = (key: GrantFieldKey) =>
      GRANT_FIELDS.find((f) => f.key === key)?.label ?? key;

    const required = <T>(
      key: GrantFieldKey,
      parse: (v: unknown) => Parsed<T>
    ): T | null => {
      const cell = raw(key);
      if (cell === null) {
        errors.push(`${labelOf(key)} is missing`);
        return null;
      }
      const result = parse(cell);
      if (!result.ok) {
        errors.push(`${labelOf(key)} ${result.error}`);
        return null;
      }
      return result.value;
    };

    const optional = <T>(
      key: GrantFieldKey,
      parse: (v: unknown) => Parsed<T>
    ): T | null => {
      const cell = raw(key);
      if (cell === null) return null;
      const result = parse(cell);
      if (!result.ok) {
        errors.push(`${labelOf(key)} ${result.error}`);
        return null;
      }
      return result.value;
    };

    const employeeNameRaw = raw("employeeName");
    const employeeName =
      employeeNameRaw === null ? null : textOf(employeeNameRaw);
    if (!employeeName) errors.push("Employee name is missing");

    const refRaw = raw("employeeRef");
    const employeeRef = refRaw === null ? null : textOf(refRaw);

    const grantDate = required("grantDate", parseDateValue);
    const optionsGranted = required("optionsGranted", parseIntegerValue);
    const exercisePrice = required("exercisePrice", parseNumberValue);

    const vestingStartDate = optional("vestingStartDate", parseDateValue);
    const vestingMonths = optional("vestingMonths", (v) => parseDurationValue(v, "months"));
    const cliffMonths = optional("cliffMonths", (v) => parseDurationValue(v, "months"));
    const expiryDate = optional("expiryDate", parseDateValue);
    const postExitExerciseDays = optional("postExitExerciseDays", (v) =>
      parseDurationValue(v, "days")
    );
    const optionsLapsed = optional("optionsLapsed", parseIntegerValue) ?? 0;
    const leftOn = optional("leftOn", parseDateValue);

    const statusRaw = raw("status");
    const status: RegisterGrantStatus =
      statusRaw === null ? (leftOn ? "LEFT" : "ACTIVE") : parseStatusValue(statusRaw);

    for (const [label, date] of [
      ["Grant date", grantDate],
      ["Vesting start date", vestingStartDate],
      ["Expiry date", expiryDate],
      ["Date of leaving", leftOn],
    ] as const) {
      if (date && !dateLooksSane(date)) {
        errors.push(`${label} looks wrong (year ${date.getUTCFullYear()})`);
      }
    }

    if (optionsGranted !== null && optionsGranted <= 0) {
      errors.push("Options granted must be more than zero");
    }
    if (exercisePrice !== null && exercisePrice < 0) {
      errors.push("Exercise price cannot be negative");
    }
    if (optionsGranted !== null && optionsLapsed > optionsGranted) {
      errors.push("Options lapsed is more than options granted");
    }
    if (grantDate && expiryDate && expiryDate <= grantDate) {
      errors.push("Expiry date is not after the grant date");
    }

    if (
      errors.length > 0 ||
      !employeeName ||
      !grantDate ||
      optionsGranted === null ||
      exercisePrice === null
    ) {
      invalid.push({ rowNumber: row.rowNumber, errors });
      continue;
    }

    valid.push({
      sourceRow: row.rowNumber,
      employeeName,
      employeeRef,
      grantDate,
      optionsGranted,
      exercisePrice,
      vestingStartDate,
      vestingMonths,
      cliffMonths,
      expiryDate,
      postExitExerciseDays,
      optionsLapsed,
      status,
      leftOn,
    });
  }

  return { valid, invalid };
}
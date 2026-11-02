/**
 * Grants import: one row per grant, all into the ESOP scheme the founder
 * picks. Every row is checked; the import only goes ahead when every row is
 * valid (all or nothing), the pool is big enough and the plan's option-holder
 * limit is not exceeded. Rule warnings (approval date, one-year vesting,
 * promoter) are shown but do not block, same as creating a grant by hand.
 *
 * Pure: the route passes in the scheme, existing grants and limits.
 */

import type { ImportMapping } from "@/lib/company/import/fields";
import {
  isBlank,
  parseDateValue,
  parseDurationValue,
  parseIntegerValue,
  parseNumberValue,
  parseYesNo,
  text,
} from "@/lib/company/import/values";
import { grantWarnings, vestedOn, type GrantTerms, type GrantWarning } from "@/lib/company/grants";

export type Row = { rowNumber: number; cells: unknown[] };

export type ImportStatus = "DRAFT" | "ISSUED" | "ACCEPTED" | "LEFT" | "LAPSED" | "EXERCISED";

export type GrantImportItem = {
  rowNumber: number;
  employeeName: string;
  employeeEmail: string | null;
  employeeRef: string | null;
  holderKey: string;
  isPromoterOver10Pct: boolean;
  grantDate: Date;
  options: number;
  exercisePrice: number;
  vestingStart: Date;
  vestingMonths: number;
  cliffMonths: number;
  expiryDate: Date | null;
  postExitDays: number;
  status: ImportStatus;
  leftOn: Date | null;
  optionsLapsed: number;
  optionsExercised: number;
  /** Options this grant uses from the pool (issued, net of lapsed). */
  poolUse: number;
  warnings: GrantWarning[];
};

export type GrantImportAnalysis = {
  items: GrantImportItem[];
  invalid: { rowNumber: number; errors: string[] }[];
  pool: { size: number; usedBefore: number; importing: number; usedAfter: number };
  holders: { existing: number; adding: number; limit: number | null };
  /** Whole-file problems that stop the import even if every row is valid. */
  blockers: string[];
  warningRows: number;
};

export type GrantImportContext = {
  today: Date;
  scheme: {
    poolSize: number;
    poolUsed: number;
    shareholderApprovedOn: Date | null;
    boardApprovedOn: Date | null;
    defaultVestingMonths: number;
    defaultCliffMonths: number;
    defaultPostExitDays: number;
  };
  workspace: { dpiitRecognised: boolean | null; incorporationDate: Date | null };
  existingHolderKeys: Set<string>;
  /** "holderKey|yyyy-mm-dd|options" for grants already in EVC (duplicate check). */
  existingGrantKeys: Set<string>;
  holderLimit: number | null; // null = unlimited (EVC owner)
};

const POOL_STATUSES: ImportStatus[] = ["ISSUED", "ACCEPTED", "LEFT", "EXERCISED", "LAPSED"];

export function holderKeyFor(email: string | null, name: string): string {
  if (email) return `email:${email.trim().toLowerCase()}`;
  return `name:${name.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

export function grantDupKey(holderKey: string, grantDate: Date, options: number): string {
  return `${holderKey}|${grantDate.toISOString().slice(0, 10)}|${options}`;
}

export function parseImportStatus(value: unknown): ImportStatus | null {
  const t = text(value).toLowerCase();
  if (!t) return null;
  if (/draft/.test(t)) return "DRAFT";
  if (/(lapse|cancel|forfeit)/.test(t)) return "LAPSED";
  if (/(left|resign|separat|terminat|exit)/.test(t)) return "LEFT";
  if (/exercis/.test(t)) return "EXERCISED";
  if (/accept|signed/.test(t)) return "ACCEPTED";
  if (/(issued|active|granted|current|employed|live)/.test(t)) return "ISSUED";
  return null;
}

function cell(row: Row, mapping: ImportMapping, key: string): unknown {
  const i = mapping[key];
  return i === null || i === undefined ? null : row.cells[i];
}

function dateField(
  row: Row,
  mapping: ImportMapping,
  key: string,
  label: string,
  errors: string[],
  today: Date,
  allowFuture = false
): Date | null {
  const v = cell(row, mapping, key);
  if (isBlank(v)) return null;
  const d = parseDateValue(v);
  if (!d.ok) {
    errors.push(`${label} ${d.error}.`);
    return null;
  }
  if (d.value.getUTCFullYear() < 1990 || d.value.getUTCFullYear() > 2100) {
    errors.push(`${label} looks wrong.`);
    return null;
  }
  if (!allowFuture && d.value.getTime() > today.getTime()) {
    errors.push(`${label} is in the future.`);
    return null;
  }
  return d.value;
}

export function analyseGrants(rows: Row[], mapping: ImportMapping, ctx: GrantImportContext): GrantImportAnalysis {
  const items: GrantImportItem[] = [];
  const invalid: GrantImportAnalysis["invalid"] = [];
  const seenInFile = new Map<string, number>();
  const s = ctx.scheme;

  for (const row of rows) {
    const errors: string[] = [];

    const employeeName = text(cell(row, mapping, "employeeName"));
    if (!employeeName) errors.push("Employee name is empty.");
    else if (employeeName.length > 200) errors.push("Employee name is longer than 200 characters.");

    const emailRaw = text(cell(row, mapping, "employeeEmail")).toLowerCase();
    let employeeEmail: string | null = null;
    if (emailRaw) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) errors.push(`Email "${emailRaw}" is not valid.`);
      else employeeEmail = emailRaw;
    }

    const employeeRef = text(cell(row, mapping, "employeeRef")).slice(0, 60) || null;

    let options = 0;
    const optCell = cell(row, mapping, "options");
    const opt = parseIntegerValue(optCell);
    if (isBlank(optCell)) errors.push("Options granted is empty.");
    else if (!opt.ok) errors.push(`Options granted ${opt.error}.`);
    else if (opt.value <= 0) errors.push("Options granted must be more than zero.");
    else options = opt.value;

    let exercisePrice = 0;
    const priceCell = cell(row, mapping, "exercisePrice");
    const price = parseNumberValue(priceCell);
    if (isBlank(priceCell)) errors.push("Exercise price is empty (enter 0 if there is none).");
    else if (!price.ok) errors.push(`Exercise price ${price.error}.`);
    else if (price.value < 0) errors.push("Exercise price cannot be negative.");
    else exercisePrice = price.value;

    const grantDate = dateField(row, mapping, "grantDate", "Grant date", errors, ctx.today);
    if (!grantDate && isBlank(cell(row, mapping, "grantDate"))) errors.push("Grant date is empty.");

    const vestingStart = dateField(row, mapping, "vestingStart", "Vesting start", errors, ctx.today, true) ?? grantDate;

    let vestingMonths = s.defaultVestingMonths;
    const vmCell = cell(row, mapping, "vestingMonths");
    if (!isBlank(vmCell)) {
      const v = parseDurationValue(vmCell, "months");
      if (!v.ok) errors.push(`Vesting period ${v.error}.`);
      else if (v.value > 240) errors.push("Vesting period is longer than 20 years.");
      else vestingMonths = v.value;
    }

    let cliffMonths = s.defaultCliffMonths;
    const cmCell = cell(row, mapping, "cliffMonths");
    if (!isBlank(cmCell)) {
      const v = parseDurationValue(cmCell, "months");
      if (!v.ok) errors.push(`Cliff ${v.error}.`);
      else cliffMonths = v.value;
    }
    if (cliffMonths > vestingMonths) errors.push("The cliff is longer than the vesting period.");

    let postExitDays = s.defaultPostExitDays;
    const peCell = cell(row, mapping, "postExitDays");
    if (!isBlank(peCell)) {
      const v = parseDurationValue(peCell, "days");
      if (!v.ok) errors.push(`Exercise window ${v.error}.`);
      else if (v.value > 3650) errors.push("Exercise window is longer than 10 years.");
      else postExitDays = v.value;
    }

    const expiryDate = dateField(row, mapping, "expiryDate", "Expiry date", errors, ctx.today, true);
    if (expiryDate && grantDate && expiryDate.getTime() <= grantDate.getTime()) {
      errors.push("Expiry date is not after the grant date.");
    }

    const leftOn = dateField(row, mapping, "leftOn", "Date of leaving", errors, ctx.today);

    const statusCell = cell(row, mapping, "status");
    let status = parseImportStatus(statusCell);
    if (!isBlank(statusCell) && !status) {
      errors.push(`Status "${text(statusCell)}" is not recognised (use Issued, Accepted, Left, Lapsed, Exercised or Draft).`);
    }
    if (!status) status = leftOn ? "LEFT" : "ISSUED";
    if (status === "LEFT" && !leftOn) errors.push("Status is Left but the date of leaving is empty.");
    if (leftOn && grantDate && leftOn.getTime() < grantDate.getTime()) errors.push("Date of leaving is before the grant date.");
    if (leftOn && status !== "LEFT" && status !== "LAPSED" && status !== "EXERCISED") {
      errors.push(`A date of leaving is given but the status is ${status.toLowerCase()}.`);
    }

    let optionsExercised = 0;
    const exCell = cell(row, mapping, "optionsExercised");
    if (!isBlank(exCell)) {
      const v = parseIntegerValue(exCell);
      if (!v.ok) errors.push(`Options exercised ${v.error}.`);
      else if (v.value < 0) errors.push("Options exercised cannot be negative.");
      else optionsExercised = v.value;
    }
    if (status === "EXERCISED" && optionsExercised === 0) {
      errors.push("Status is Exercised but options exercised is 0 or empty.");
    }
    if (status === "DRAFT" && optionsExercised > 0) errors.push("A draft grant cannot have exercised options.");

    const promoterCell = cell(row, mapping, "promoter");
    const promoter = parseYesNo(promoterCell);
    if (!isBlank(promoterCell) && promoter === null) errors.push(`Promoter "${text(promoterCell)}" should be Yes or No.`);

    // Arithmetic that needs a valid grant
    let optionsLapsed = 0;
    let terms: GrantTerms | null = null;

    if (errors.length === 0 && grantDate && vestingStart) {
      terms = {
        grantDate,
        options,
        exercisePrice,
        vestingStart,
        vestingMonths,
        cliffMonths,
        expiryDate,
        postExitDays,
      };

      const vestedCutoff = leftOn ?? ctx.today;
      const vested = vestedOn(terms, vestedCutoff);

      if (optionsExercised > vested) {
        errors.push(
          `Options exercised (${optionsExercised.toLocaleString("en-IN")}) is more than had vested by ${leftOn ? "the leaving date" : "today"} (${vested.toLocaleString("en-IN")}).`
        );
      }

      if (status === "LEFT") optionsLapsed = Math.max(0, options - vested);
      if (status === "LAPSED") optionsLapsed = Math.max(0, options - optionsExercised);
    }

    const holderKey = employeeName ? holderKeyFor(employeeEmail, employeeName) : "";

    if (errors.length === 0 && grantDate) {
      const dup = grantDupKey(holderKey, grantDate, options);
      if (ctx.existingGrantKeys.has(dup)) {
        errors.push("This grant is already in EVC (same employee, grant date and options).");
      } else if (seenInFile.has(dup)) {
        errors.push(`Same employee, grant date and options as row ${seenInFile.get(dup)}.`);
      } else {
        seenInFile.set(dup, row.rowNumber);
      }
    }

    if (errors.length || !terms || !grantDate || !vestingStart) {
      invalid.push({ rowNumber: row.rowNumber, errors: errors.length ? errors : ["This row could not be read."] });
      continue;
    }

    const poolUse = POOL_STATUSES.includes(status) ? options - optionsLapsed : 0;

    items.push({
      rowNumber: row.rowNumber,
      employeeName,
      employeeEmail,
      employeeRef,
      holderKey,
      isPromoterOver10Pct: promoter ?? false,
      grantDate,
      options,
      exercisePrice,
      vestingStart,
      vestingMonths,
      cliffMonths,
      expiryDate,
      postExitDays,
      status,
      leftOn,
      optionsLapsed,
      optionsExercised,
      poolUse,
      // The pool is checked for the whole file below, so it is left out here.
      warnings: grantWarnings(terms, {
        poolSize: Number.MAX_SAFE_INTEGER,
        poolUsedByOthers: 0,
        shareholderApprovedOn: s.shareholderApprovedOn,
        boardApprovedOn: s.boardApprovedOn,
        dpiitRecognised: ctx.workspace.dpiitRecognised,
        incorporationDate: ctx.workspace.incorporationDate,
        isPromoterOver10Pct: promoter ?? false,
      }),
    });
  }

  const importing = items.reduce((sum, it) => sum + it.poolUse, 0);
  const usedAfter = s.poolUsed + importing;

  const newHolderKeys = new Set(items.map((i) => i.holderKey).filter((k) => !ctx.existingHolderKeys.has(k)));

  const blockers: string[] = [];
  if (usedAfter > s.poolSize) {
    blockers.push(
      `These grants need ${importing.toLocaleString("en-IN")} options from the pool, but only ${Math.max(0, s.poolSize - s.poolUsed).toLocaleString("en-IN")} are left (pool ${s.poolSize.toLocaleString("en-IN")}). Increase the pool under ESOP pool if your shareholders approved a bigger one.`
    );
  }
  if (ctx.holderLimit !== null && ctx.existingHolderKeys.size + newHolderKeys.size > ctx.holderLimit) {
    blockers.push(
      `This adds ${newHolderKeys.size} option holders, making ${ctx.existingHolderKeys.size + newHolderKeys.size}. Your plan covers ${ctx.holderLimit}. Contact us to add more.`
    );
  }

  return {
    items,
    invalid,
    pool: { size: s.poolSize, usedBefore: s.poolUsed, importing, usedAfter },
    holders: { existing: ctx.existingHolderKeys.size, adding: newHolderKeys.size, limit: ctx.holderLimit },
    blockers,
    warningRows: items.filter((i) => i.warnings.length > 0).length,
  };
}

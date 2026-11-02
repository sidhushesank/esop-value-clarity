/**
 * Column definitions for the Startup Equity Desk imports, plus generic
 * header matching. Pure (no server imports) so the browser can use the
 * labels too.
 */

export type ImportKind = "captable" | "grants";

export type ImportField = {
  key: string;
  label: string;
  required: boolean;
  hint: string;
  synonyms: string[];
};

export type ImportMapping = Record<string, number | null>;

export const CAPTABLE_IMPORT_FIELDS: ImportField[] = [
  { key: "holderName", label: "Shareholder name", required: true, hint: "Person or entity", synonyms: ["shareholdername", "shareholder", "name", "holder", "holdername", "membername", "investor", "investorname"] },
  { key: "holderType", label: "Shareholder type", required: false, hint: "Founder / Investor / Employee / Other", synonyms: ["type", "holdertype", "shareholdertype", "category", "role"] },
  { key: "email", label: "Email", required: false, hint: "", synonyms: ["email", "emailid", "emailaddress", "mail"] },
  { key: "resident", label: "Resident in India", required: false, hint: "Yes / No (default Yes)", synonyms: ["resident", "residentinindia", "residency", "residentstatus", "nri"] },
  { key: "className", label: "Share class", required: false, hint: "e.g. Equity shares, Series A CCPS (default Equity shares)", synonyms: ["class", "shareclass", "classname", "security", "securityclass", "instrument", "classofshares"] },
  { key: "classType", label: "Class type", required: false, hint: "Equity / CCPS / CCD / Note / iSAFE / Warrant", synonyms: ["classtype", "securitytype", "instrumenttype", "kind"] },
  { key: "quantity", label: "Number of shares", required: true, hint: "For notes / iSAFE: amount in ₹", synonyms: ["shares", "numberofshares", "noofshares", "quantity", "qty", "units", "sharesheld", "holding", "amount"] },
  { key: "date", label: "Date acquired", required: false, hint: "Default: the date you choose", synonyms: ["date", "dateacquired", "allotmentdate", "dateofallotment", "acquisitiondate", "issuedate"] },
  { key: "price", label: "Price per share (₹)", required: false, hint: "", synonyms: ["price", "pricepershare", "issueprice", "rate", "pershareprice"] },
];

export const GRANT_IMPORT_FIELDS: ImportField[] = [
  { key: "employeeName", label: "Employee name", required: true, hint: "", synonyms: ["employeename", "employee", "name", "granteename", "grantee", "optionholder", "fullname"] },
  { key: "employeeEmail", label: "Employee email", required: false, hint: "Used for their grant page", synonyms: ["email", "employeeemail", "emailid", "emailaddress", "workemail"] },
  { key: "employeeRef", label: "Employee ID", required: false, hint: "", synonyms: ["employeeid", "empid", "employeecode", "empcode", "employeeno", "staffid", "id"] },
  { key: "options", label: "Options granted", required: true, hint: "Whole number", synonyms: ["options", "optionsgranted", "noofoptions", "numberofoptions", "esops", "esopsgranted", "granted", "quantity"] },
  { key: "exercisePrice", label: "Exercise price (₹)", required: true, hint: "0 is allowed", synonyms: ["exerciseprice", "strikeprice", "strike", "price", "exercisepricepershare"] },
  { key: "grantDate", label: "Grant date", required: true, hint: "dd/mm/yyyy works", synonyms: ["grantdate", "dateofgrant", "granteddate", "date"] },
  { key: "vestingStart", label: "Vesting start", required: false, hint: "Default: grant date", synonyms: ["vestingstart", "vestingstartdate", "vestingcommencement", "vestingcommencementdate"] },
  { key: "vestingMonths", label: "Vesting period (months)", required: false, hint: "48, 48 months or 4 years (default: scheme)", synonyms: ["vestingmonths", "vestingperiod", "vesting", "vestingduration", "vestingschedule"] },
  { key: "cliffMonths", label: "Cliff (months)", required: false, hint: "Default: scheme", synonyms: ["cliff", "cliffmonths", "cliffperiod"] },
  { key: "expiryDate", label: "Expiry date", required: false, hint: "", synonyms: ["expiry", "expirydate", "expirationdate", "lapsedate"] },
  { key: "postExitDays", label: "Exercise window after leaving (days)", required: false, hint: "Default: scheme", synonyms: ["exercisewindow", "postexitdays", "exerciseperiod", "postterminationexerciseperiod", "exerciseperiodafterexit"] },
  { key: "status", label: "Status", required: false, hint: "Issued / Accepted / Left / Lapsed / Exercised / Draft (default Issued)", synonyms: ["status", "grantstatus", "employmentstatus", "state"] },
  { key: "leftOn", label: "Date of leaving", required: false, hint: "Needed for leavers", synonyms: ["leftdate", "dateofleaving", "leavingdate", "lastworkingday", "exitdate", "dateofexit", "leavedate", "lefton"] },
  { key: "optionsExercised", label: "Options exercised", required: false, hint: "Default 0", synonyms: ["exercised", "optionsexercised", "noofoptionsexercised", "exercisedoptions"] },
  { key: "promoter", label: "Promoter or >10% director", required: false, hint: "Yes / No (default No)", synonyms: ["promoter", "ispromoter", "director", "promoterordirector"] },
];

export function fieldsFor(kind: ImportKind): ImportField[] {
  return kind === "captable" ? CAPTABLE_IMPORT_FIELDS : GRANT_IMPORT_FIELDS;
}

export function normaliseHeader(header: string): string {
  return header.replace(/^﻿/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Exact synonym matches first, then partial; a column is never used twice. */
export function suggestMapping(headers: string[], fields: ImportField[]): ImportMapping {
  const norm = headers.map(normaliseHeader);
  const used = new Set<number>();
  const mapping: ImportMapping = {};
  for (const f of fields) mapping[f.key] = null;

  for (const f of fields) {
    const i = norm.findIndex((h, idx) => !used.has(idx) && f.synonyms.includes(h));
    if (i >= 0) {
      mapping[f.key] = i;
      used.add(i);
    }
  }
  for (const f of fields) {
    if (mapping[f.key] !== null) continue;
    const i = norm.findIndex(
      (h, idx) => !used.has(idx) && h.length > 0 && f.synonyms.some((s) => s.length >= 6 && h.includes(s))
    );
    if (i >= 0) {
      mapping[f.key] = i;
      used.add(i);
    }
  }
  return mapping;
}

export function missingRequired(mapping: ImportMapping, fields: ImportField[]): string[] {
  return fields.filter((f) => f.required && mapping[f.key] == null).map((f) => f.label);
}

/** Validates a mapping sent back by the browser. Returns null if none sent. */
export function parseMapping(
  raw: unknown,
  fields: ImportField[],
  headerCount: number
): ImportMapping | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The column mapping is not valid.");
  }
  if (typeof parsed !== "object" || parsed === null) throw new Error("The column mapping is not valid.");

  const input = parsed as Record<string, unknown>;
  const mapping: ImportMapping = {};
  for (const f of fields) {
    const v = input[f.key];
    if (v === null || v === undefined) {
      mapping[f.key] = null;
      continue;
    }
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v >= headerCount) {
      throw new Error(`The column chosen for "${f.label}" is not valid.`);
    }
    mapping[f.key] = v;
  }
  return mapping;
}

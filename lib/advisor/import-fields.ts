export const GRANT_FIELD_KEYS = [
  "employeeName",
  "employeeRef",
  "grantDate",
  "optionsGranted",
  "exercisePrice",
  "vestingStartDate",
  "vestingMonths",
  "cliffMonths",
  "expiryDate",
  "postExitExerciseDays",
  "optionsLapsed",
  "status",
  "leftOn",
] as const;

export type GrantFieldKey = (typeof GRANT_FIELD_KEYS)[number];

export type FieldKind =
  | "text"
  | "date"
  | "int"
  | "float"
  | "months"
  | "days"
  | "status";

export type FieldDef = {
  key: GrantFieldKey;
  label: string;
  required: boolean;
  kind: FieldKind;
  synonyms: string[];
};

// Synonyms are stored normalised: lowercase, letters and digits only.
export const GRANT_FIELDS: FieldDef[] = [
  {
    key: "employeeName",
    label: "Employee name",
    required: true,
    kind: "text",
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
    kind: "text",
    synonyms: ["employeeid", "empid", "employeecode", "empcode", "employeeno"],
  },
  {
    key: "grantDate",
    label: "Grant date",
    required: true,
    kind: "date",
    synonyms: ["grantdate", "dateofgrant", "dateofgranting", "dateofgrantofoptions"],
  },
  {
    key: "optionsGranted",
    label: "Options granted",
    required: true,
    kind: "int",
    synonyms: [
      "optionsgranted",
      "noofoptionsgranted",
      "numberofoptionsgranted",
      "noofoptions",
      "numberofoptions",
      "totaloptions",
      "nooptions",
      "options",
    ],
  },
  {
    key: "exercisePrice",
    label: "Exercise price",
    required: true,
    kind: "float",
    synonyms: [
      "exerciseprice",
      "exercisepricepershare",
      "exercisepricers",
      "exercisepriceinr",
      "strikeprice",
      "strike",
      "pricepershare",
    ],
  },
  {
    key: "vestingStartDate",
    label: "Vesting start date",
    required: false,
    kind: "date",
    synonyms: ["vestingstartdate", "vestingcommencementdate", "vestingcommencement", "vestingstart"],
  },
  {
    key: "vestingMonths",
    label: "Vesting period (months)",
    required: false,
    kind: "months",
    synonyms: [
      "vestingperiodmonths",
      "vestingdurationmonths",
      "vestingperiod",
      "vestingduration",
      "totalvestingperiod",
    ],
  },
  {
    key: "cliffMonths",
    label: "Cliff (months)",
    required: false,
    kind: "months",
    synonyms: ["cliffmonths", "cliffperiod", "cliff"],
  },
  {
    key: "expiryDate",
    label: "Expiry date",
    required: false,
    kind: "date",
    synonyms: ["expirydate", "dateofexpiry", "optionexpirydate", "expiryofoptions", "expiry"],
  },
  {
    key: "postExitExerciseDays",
    label: "Post-exit exercise window",
    required: false,
    kind: "days",
    synonyms: [
      "postexitexercisewindowdays",
      "postexitexercisewindow",
      "postterminationexercisewindow",
      "exercisewindowafterleaving",
      "postexitexerciseperiod",
    ],
  },
  {
    key: "optionsLapsed",
    label: "Options lapsed",
    required: false,
    kind: "int",
    synonyms: ["optionslapsed", "lapsedoptions", "optionsforfeited", "forfeited", "optionscancelled", "cancelled"],
  },
  {
    key: "status",
    label: "Status",
    required: false,
    kind: "status",
    synonyms: ["status", "grantstatus", "employmentstatus"],
  },
  {
    key: "leftOn",
    label: "Date of leaving",
    required: false,
    kind: "date",
    synonyms: ["dateofleaving", "leavingdate", "dateofseparation", "lastworkingday"],
  },
];

export type ColumnMapping = Record<GrantFieldKey, number | null>;

export function normaliseHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function emptyMapping(): ColumnMapping {
  const mapping = {} as ColumnMapping;
  for (const field of GRANT_FIELDS) mapping[field.key] = null;
  return mapping;
}

/**
 * Suggest a column for each field. Exact synonym matches win first,
 * then partial matches. A column is never used for two fields.
 * The user can always override this in the preview step.
 */
export function suggestMapping(headers: string[]): ColumnMapping {
  const normalised = headers.map(normaliseHeader);
  const used = new Set<number>();
  const mapping = emptyMapping();

  for (const field of GRANT_FIELDS) {
    const index = normalised.findIndex(
      (header, i) => !used.has(i) && field.synonyms.includes(header)
    );
    if (index >= 0) {
      mapping[field.key] = index;
      used.add(index);
    }
  }

  for (const field of GRANT_FIELDS) {
    if (mapping[field.key] !== null) continue;

    const index = normalised.findIndex(
      (header, i) =>
        !used.has(i) &&
        header.length > 0 &&
        field.synonyms.some((s) => s.length >= 8 && header.includes(s))
    );
    if (index >= 0) {
      mapping[field.key] = index;
      used.add(index);
    }
  }

  return mapping;
}

export function missingRequiredFields(mapping: ColumnMapping): string[] {
  return GRANT_FIELDS.filter(
    (field) => field.required && mapping[field.key] === null
  ).map((field) => field.label);
}
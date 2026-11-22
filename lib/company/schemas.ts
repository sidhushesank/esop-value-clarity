import { z } from "zod";

const saneDate = (label: string) =>
  z.coerce.date().refine(
    (d) => d.getUTCFullYear() >= 1990 && d.getUTCFullYear() <= 2100,
    { message: `${label} looks wrong.` }
  );

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));

const optionalPositive = z.number().positive().nullable().optional();

/* ------------------------------------------------------------------ */
/* Company details                                                     */
/* ------------------------------------------------------------------ */

export const companyDetailsSchema = z.object({
  name: z.string().trim().min(1, "Company name is required.").max(200),
  cin: optionalText(30),
  companyType: z.enum(["PRIVATE_LIMITED", "UNLISTED_PUBLIC"]).optional(),
  incorporationDate: saneDate("Incorporation date").nullable().optional(),
  dpiitRecognised: z.boolean().nullable().optional(),
  jurisdiction: z.enum(["IN", "US"]).optional(),
  usStateOfIncorporation: optionalText(60),
  currentFmvPerShare: z.number().positive("Value per share must be more than zero.").max(10_000_000).nullable().optional(),
  fmvValuationDate: saneDate("Valuation date").nullable().optional(),
  fmvValuerName: optionalText(200),
});

/* ------------------------------------------------------------------ */
/* Employee grant links                                                */
/* ------------------------------------------------------------------ */

export const grantLinkCreateSchema = z.object({
  passcode: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().min(4, "Passcode must be at least 4 characters.").max(50).nullable().optional()
  ),
  expiresInDays: z.number().int().min(1).max(365).default(90),
});

export const grantAcceptSchema = z.object({
  fullName: z.string().trim().min(1, "Type your full name.").max(200),
  confirm: z.literal(true, { message: "Tick the box to confirm." }),
});

/* ------------------------------------------------------------------ */
/* Security classes                                                    */
/* ------------------------------------------------------------------ */

export const securityClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required.").max(80),
  kind: z.enum(["EQUITY", "CCPS", "CCD", "CONVERTIBLE_NOTE", "ISAFE", "WARRANT"]),
  faceValue: optionalPositive,
  conversionRatio: optionalPositive,
  liqPrefMultiple: z.number().min(0).max(100).nullable().optional(),
  participating: z.boolean().nullable().optional(),
  valuationCap: optionalPositive,
  discountPct: z.number().min(0).max(100).nullable().optional(),
  principalAmount: optionalPositive,
});

/* ------------------------------------------------------------------ */
/* Shareholders                                                        */
/* ------------------------------------------------------------------ */

export const shareholderSchema = z.object({
  name: z.string().trim().min(1, "Shareholder name is required.").max(200),
  type: z.enum(["FOUNDER", "INVESTOR", "EMPLOYEE", "OTHER"]).default("OTHER"),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().toLowerCase().email("Enter a valid email.").nullable().optional()
  ),
  isResident: z.boolean().default(true),
});

/* ------------------------------------------------------------------ */
/* Share movements                                                     */
/* ------------------------------------------------------------------ */

export const shareMovementSchema = z
  .object({
    kind: z.enum(["ALLOTMENT", "TRANSFER", "CONVERSION", "BUYBACK"]),
    date: saneDate("Date"),
    classId: z.string().min(1, "Choose a class."),
    toClassId: z.string().min(1).nullable().optional(),
    fromHolderId: z.string().min(1).nullable().optional(),
    toHolderId: z.string().min(1).nullable().optional(),
    quantity: z
      .number()
      .int("Quantity must be a whole number.")
      .positive("Quantity must be more than zero.")
      .max(10_000_000_000),
    toQuantity: z.number().int().positive().max(10_000_000_000).nullable().optional(),
    pricePerShare: z.number().min(0).max(1_000_000_000).nullable().optional(),
    note: optionalText(300),
  })
  .superRefine((v, ctx) => {
    const need = (field: "fromHolderId" | "toHolderId", message: string) => {
      if (!v[field]) ctx.addIssue({ code: "custom", path: [field], message });
    };

    switch (v.kind) {
      case "ALLOTMENT":
        need("toHolderId", "Choose who receives the shares.");
        if (v.fromHolderId) {
          ctx.addIssue({
            code: "custom",
            path: ["fromHolderId"],
            message: "An allotment is new shares from the company, so it has no seller.",
          });
        }
        break;
      case "TRANSFER":
        need("fromHolderId", "Choose who transfers the shares.");
        need("toHolderId", "Choose who receives the shares.");
        if (v.fromHolderId && v.fromHolderId === v.toHolderId) {
          ctx.addIssue({
            code: "custom",
            path: ["toHolderId"],
            message: "The buyer and seller cannot be the same shareholder.",
          });
        }
        break;
      case "BUYBACK":
        need("fromHolderId", "Choose whose shares the company buys back.");
        break;
      case "CONVERSION":
        need("fromHolderId", "Choose the holder whose units convert.");
        if (!v.toClassId) {
          ctx.addIssue({ code: "custom", path: ["toClassId"], message: "Choose the class they convert into." });
        }
        if (!v.toQuantity) {
          ctx.addIssue({ code: "custom", path: ["toQuantity"], message: "Enter how many units they receive." });
        }
        if (v.toClassId && v.toClassId === v.classId) {
          ctx.addIssue({ code: "custom", path: ["toClassId"], message: "A class cannot convert into itself." });
        }
        break;
    }
  });

export type ShareMovementInput = z.infer<typeof shareMovementSchema>;

/* ------------------------------------------------------------------ */
/* ESOP schemes                                                        */
/* ------------------------------------------------------------------ */

export const esopSchemeSchema = z
  .object({
    name: z.string().trim().min(1, "Scheme name is required.").max(120),
    poolSize: z
      .number()
      .int("Pool size must be a whole number of options.")
      .positive("Pool size must be more than zero.")
      .max(10_000_000_000),
    boardApprovedOn: saneDate("Board approval date").nullable().optional(),
    shareholderApprovedOn: saneDate("Shareholder approval date").nullable().optional(),
    resolutionVote: z.enum(["ORDINARY", "SPECIAL"]).nullable().optional(),
    mgt14FiledOn: saneDate("MGT-14 date").nullable().optional(),
    explanatoryStatement: z.boolean().default(false),
    defaultVestingMonths: z.number().int().min(0).max(240).default(48),
    defaultCliffMonths: z.number().int().min(0).max(120).default(12),
    defaultPostExitDays: z.number().int().min(0).max(3650).default(90),
  })
  .refine(
    (v) => !v.mgt14FiledOn || !v.shareholderApprovedOn || v.mgt14FiledOn >= v.shareholderApprovedOn,
    { message: "The MGT-14 date cannot be before the shareholder approval.", path: ["mgt14FiledOn"] }
  )
  .refine((v) => v.defaultCliffMonths <= v.defaultVestingMonths, {
    message: "The cliff cannot be longer than the vesting period.",
    path: ["defaultCliffMonths"],
  });

/* ------------------------------------------------------------------ */
/* Option grants                                                       */
/* ------------------------------------------------------------------ */

export const optionGrantSchema = z
  .object({
    schemeId: z.string().min(1, "Choose the ESOP scheme."),
    employeeName: z.string().trim().min(1, "Employee name is required.").max(200),
    employeeEmail: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.string().trim().toLowerCase().email("Enter a valid email.").nullable().optional()
    ),
    employeeRef: optionalText(60),
    isPromoterOver10Pct: z.boolean().default(false),
    // US companies only: ISO or NSO. Ignored (stored as null) for Indian companies.
    usOptionType: z.enum(["ISO", "NSO"]).nullable().optional(),
    grantDate: saneDate("Grant date"),
    options: z
      .number()
      .int("Options must be a whole number.")
      .positive("Options must be more than zero.")
      .max(10_000_000_000),
    exercisePrice: z.number().min(0, "Exercise price cannot be negative.").max(1_000_000_000),
    vestingStart: saneDate("Vesting start date"),
    vestingMonths: z.number().int().min(0).max(240),
    cliffMonths: z.number().int().min(0).max(120),
    expiryDate: saneDate("Expiry date").nullable().optional(),
    postExitDays: z.number().int().min(0).max(3650),
    note: optionalText(500),
  })
  .refine((v) => v.cliffMonths <= v.vestingMonths, {
    message: "The cliff cannot be longer than the vesting period.",
    path: ["cliffMonths"],
  })
  .refine((v) => !v.expiryDate || v.expiryDate > v.grantDate, {
    message: "The expiry date must be after the grant date.",
    path: ["expiryDate"],
  });

export const grantLeftSchema = z.object({
  leftOn: saneDate("Leaving date"),
});

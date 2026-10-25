import { z } from "zod";

export const clientInputSchema = z.object({
  name: z.string().trim().min(1, "Company name is required.").max(200),
  cin: z.string().trim().max(30).nullable().optional(),
  companyType: z.enum(["PRIVATE_LIMITED", "UNLISTED_PUBLIC"]).optional(),
  incorporationDate: z.coerce.date().nullable().optional(),
  approvedPoolSize: z.number().int().positive().nullable().optional(),
  dpiitRecognised: z.boolean().nullable().optional(),
  imbCertificate: z.boolean().nullable().optional(),
  overseasParent: z.boolean().nullable().optional(),
});
const saneDate = (label: string) =>
  z.coerce.date().refine(
    (d) => d.getUTCFullYear() >= 1990 && d.getUTCFullYear() <= 2100,
    { message: `${label} looks wrong.` }
  );

export const resolutionInputSchema = z
  .object({
    kind: z.enum(["BOARD_SCHEME_APPROVAL", "SHAREHOLDER_SCHEME_APPROVAL"]),
    vote: z.enum(["ORDINARY", "SPECIAL"]),
    passedOn: saneDate("Resolution date"),
    mgt14Filed: saneDate("MGT-14 date").nullable().optional(),
    explanatoryStatementOnFile: z.boolean().optional(),
  })
  .refine((v) => !v.mgt14Filed || v.mgt14Filed >= v.passedOn, {
    message: "The MGT-14 date cannot be before the resolution date.",
    path: ["mgt14Filed"],
  });

export const valuationInputSchema = z.object({
  valuationDate: saneDate("Valuation date"),
  fmvPerShare: z.number().positive("FMV per share must be more than zero."),
  valuerName: z.string().trim().max(200).nullable().optional(),
  signedBySebiCat1MerchantBanker: z.boolean().optional(),
  reference: z.string().trim().max(200).nullable().optional(),
});

/* ------------------------------------------------------------------ */
/* Tax-Event Ledger                                                    */
/* ------------------------------------------------------------------ */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));

export const taxEmployeeInputSchema = z.object({
  name: z.string().trim().min(1, "Employee name is required.").max(200),
  employeeRef: optionalText(60),
  pan: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN must look like ABCDE1234F.")
      .nullable()
      .optional()
  ),
  regime: z.enum(["NEW", "OLD"]).default("NEW"),
  estimatedIncomeExclPerq: z
    .number()
    .min(0, "Income cannot be negative.")
    .max(10_000_000_000),
  monthlyNetPay: z.number().min(0).max(10_000_000_000).nullable().optional(),
  isPromoter: z.boolean().default(false),
});

export const taxEventInputSchema = z
  .object({
    employeeId: z.string().min(1, "Choose an employee."),
    type: z.enum(["EXERCISE", "SALE", "LEAVE", "BUYBACK"]),
    eventDate: saneDate("Event date"),
    shares: z.number().int().min(0).max(1_000_000_000).default(0),
    exercisePrice: z.number().min(0).nullable().optional(),
    valuationId: z.string().nullable().optional(),
    pricePerShare: z.number().min(0).nullable().optional(),
    lotEventId: z.string().nullable().optional(),
    note: optionalText(500),
  })
  .superRefine((v, ctx) => {
    if (v.type === "EXERCISE") {
      if (v.shares <= 0) {
        ctx.addIssue({ code: "custom", path: ["shares"], message: "Enter the number of shares exercised." });
      }
      if (v.exercisePrice === null || v.exercisePrice === undefined) {
        ctx.addIssue({ code: "custom", path: ["exercisePrice"], message: "Enter the exercise price (0 if none)." });
      }
    }

    if (v.type === "SALE" || v.type === "BUYBACK") {
      if (v.shares <= 0) {
        ctx.addIssue({ code: "custom", path: ["shares"], message: "Enter the number of shares." });
      }
      if (v.pricePerShare === null || v.pricePerShare === undefined) {
        ctx.addIssue({ code: "custom", path: ["pricePerShare"], message: "Enter the price per share." });
      }
    }
  });

export const taxRulePatchSchema = z.object({
  verified: z.boolean(),
});

export function validationFailure(message: string) {
  return {
    success: false as const,
    code: "VALIDATION_ERROR" as const,
    message,
  };
}
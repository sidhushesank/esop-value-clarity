import { z } from "zod";

/** "YYYY-MM-DD" as a UTC date. */
const day = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} should be a date.`)
    .transform((v) => new Date(`${v}T00:00:00.000Z`))
    .refine((d) => !Number.isNaN(d.getTime()) && d.getUTCFullYear() >= 1990 && d.getUTCFullYear() <= 2100, `${label} looks wrong.`);

/** A date, or null to clear it, or absent to leave it unchanged. */
const optDay = (label: string) => day(label).nullable().optional();

export const recordExerciseSchema = z.object({
  exerciseDate: day("Exercise date"),
  options: z.number().int("Options must be a whole number.").positive("Enter how many options are exercised."),
  fmvPerShare: z.number().positive("Value per share must be more than zero.").max(10_000_000).nullable().optional(),
  tdsDeferred: z.boolean().optional(),
  allot: z.object({ date: day("Allotment date"), classId: z.string().min(1, "Choose the share class.") }).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

export const updateExerciseSchema = z.object({
  fmvPerShare: z.number().positive("Value per share must be more than zero.").max(10_000_000).nullable().optional(),
  allot: z.object({ date: day("Allotment date"), classId: z.string().min(1, "Choose the share class.") }).optional(),
  pas3FiledOn: optDay("PAS-3 date"),
  pas3Srn: z.string().trim().max(40).nullable().optional(),
  shareCertificateOn: optDay("Certificate date"),
  tdsDeferred: z.boolean().optional(),
  tdsAmount: z.number().min(0).max(1e12).nullable().optional(),
  tdsDeductedOn: optDay("TDS deduction date"),
  tdsDepositedOn: optDay("TDS deposit date"),
  tdsChallanRef: z.string().trim().max(60).nullable().optional(),
  form3921FurnishedOn: optDay("Form 3921 Copy B date"),
  form3921FiledOn: optDay("Form 3921 Copy A date"),
  note: z.string().trim().max(500).nullable().optional(),
});

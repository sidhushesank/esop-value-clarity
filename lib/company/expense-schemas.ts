import { z } from "zod";

const pct = (label: string, max: number) => z.number().min(0, `${label} can't be negative.`).max(max, `${label} looks too high.`);

export const expenseSettingsSchema = z.object({
  standard: z.enum(["IND_AS_102", "ICAI_GUIDANCE_NOTE", "ASC_718"]),
  attribution: z.enum(["GRADED", "STRAIGHT_LINE"]),
  valuationBasis: z.enum(["FAIR_VALUE", "INTRINSIC"]),
  volatility: pct("Volatility", 3).nullable(),
  riskFreeRate: pct("Risk-free rate", 0.3).nullable(),
  dividendYield: pct("Dividend yield", 0.3),
  forfeitureRate: pct("Leaving rate", 0.9),
  contractualYears: z.number().min(1, "Contractual term should be at least a year.").max(15, "Contractual term looks too long."),
  fyEndMonth: z.number().int().min(1).max(12),
});

const optPos = (label: string, max: number) => z.number().min(0, `${label} can't be negative.`).max(max, `${label} looks too high.`).nullable().optional();

export const grantValuationSchema = z.object({
  fmvPerShare: optPos("Value per share", 1e9),
  volatility: optPos("Volatility", 3),
  riskFreeRate: optPos("Risk-free rate", 0.3),
  dividendYield: optPos("Dividend yield", 0.3),
  expectedTermYears: optPos("Expected term", 15),
  fairValueOverride: optPos("Value per option", 1e9),
  note: z.string().trim().max(300).nullable().optional(),
});

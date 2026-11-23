import { z } from "zod";

const rule = z.enum(["SAME_DAY", "PREV_MONTH_END"]);

export const fxClientCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().email("Enter a valid email.").max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional(),
});

export const fxClientUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120).optional(),
  email: z.string().trim().email("Enter a valid email.").max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional(),
  slabRate: z.number().min(0, "Slab rate can't be negative.").max(0.5, "Slab rate looks too high (max 50%).").optional(),
  costRateRule: rule.optional(),
  saleRateRule: rule.optional(),
  dividendRateRule: rule.optional(),
});

const optNum = z.number().finite().nullable().optional();

export const fxTxnSchema = z
  .object({
    type: z.enum(["VEST", "BUY", "SELL", "DIVIDEND", "TAX_WITHHELD"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date should be YYYY-MM-DD."),
    symbol: z.string().trim().min(1, "Symbol is required.").max(20),
    company: z.string().trim().max(120).optional(),
    broker: z.string().trim().max(120).optional(),
    account: z.string().trim().max(60).optional(),
    quantity: optNum,
    priceUsd: optNum,
    amountUsd: optNum,
    feesUsd: optNum,
    currency: z.string().trim().regex(/^[A-Za-z]{3}$/, "Currency should be a 3-letter code.").optional(),
    lotRef: z.string().trim().max(120).optional(),
    costInrPerShare: optNum,
  })
  .superRefine((v, ctx) => {
    const shares = v.type === "VEST" || v.type === "BUY" || v.type === "SELL";
    if (shares && !(v.quantity && v.quantity > 0)) ctx.addIssue({ code: "custom", message: "Quantity is needed." });
    if (shares && !(v.priceUsd && v.priceUsd > 0)) ctx.addIssue({ code: "custom", message: "Price per share is needed." });
    if (!shares && !(v.amountUsd && v.amountUsd > 0)) ctx.addIssue({ code: "custom", message: "Amount is needed." });
  });

export function validationError(message: string | undefined) {
  return { success: false, code: "VALIDATION_ERROR", message: message ?? "Invalid input." };
}

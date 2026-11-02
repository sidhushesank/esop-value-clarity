/**
 * Startup plan (Startup Equity Desk) commercial terms — single source of truth.
 * Used by checkout (server), the pricing page (client) and emails.
 *
 * Change the price here only. Amounts are in paise (INR).
 */
export const STARTUP_PLAN = {
  name: "Startup plan",
  productName: "Startup Equity Desk",
  /** Shown on the pricing page (rupees). Whether GST is added on top is for your CA to confirm. */
  priceRupees: 14999,
  /** Charged at checkout (paise). Must equal priceRupees * 100. */
  amountPaise: 1_499_900,
  currency: "INR",
  /** Option holders (employees with grants) included. More are granted by the EVC founder from the admin portal. */
  includedOptionHolders: 25,
  /** Annual only, self-serve. Anything else is arranged by the EVC founder. */
  termMonths: 12,
} as const;

if (STARTUP_PLAN.amountPaise !== STARTUP_PLAN.priceRupees * 100) {
  throw new Error("STARTUP_PLAN.amountPaise must equal priceRupees * 100.");
}

/** Adds whole calendar months to a date. Same behaviour as the Advisor plan helper. */
export function addMonths(base: Date, months: number): Date {
  const d = new Date(base.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}
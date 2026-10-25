/**
 * Advisor plan commercial terms — single source of truth.
 * Used by checkout (server), the pricing page (client) and emails.
 *
 * Change the price here only. Amounts are in paise (INR).
 */
export const ADVISOR_PLAN = {
  name: "Advisor plan",
  /** Shown on the pricing page (rupees). Whether GST is added on top is for your CA to confirm. */
  priceRupees: 60000,
  /** Charged at checkout (paise). Must equal priceRupees * 100. */
  amountPaise: 6_000_000,
  currency: "INR",
  /** Client companies included. More are granted by the founder from the admin portal. */
  includedClients: 25,
  /** Annual only, self-serve. Anything else is arranged by the founder. */
  termMonths: 12,
} as const;

/** Adds whole calendar months to a date (UTC-safe enough for billing terms). */
export function addMonths(base: Date, months: number): Date {
  const d = new Date(base.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

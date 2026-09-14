import { BillingCycle } from "@prisma/client";

export const PRICING = {
  [BillingCycle.MONTHLY]: {
    amount: 299900, // ₹2,999 in paise
    displayAmount: 2999,
    months: 1,
    label: "Monthly",
    planLabel: "Professional Monthly",
  },

  [BillingCycle.SIX_MONTHS]: {
    amount: 1499900, // ₹14,999 in paise
    displayAmount: 14999,
    months: 6,
    label: "6 Months",
    planLabel: "Professional 6 Months",
  },

  [BillingCycle.YEARLY]: {
    amount: 2499900, // ₹24,999 in paise
    displayAmount: 24999,
    months: 12,
    label: "Yearly",
    planLabel: "Professional Annual",
  },
} as const;
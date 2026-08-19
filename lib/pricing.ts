import { BillingCycle } from "@prisma/client";

export const PRICING = {
  [BillingCycle.MONTHLY]: {
    amount: 19900, // ₹199 in paise
    displayAmount: 199,
    months: 1,
    label: "Monthly",
  },

  [BillingCycle.SIX_MONTHS]: {
    amount: 65000, // ₹650
    displayAmount: 650,
    months: 6,
    label: "6 Months",
  },

  [BillingCycle.YEARLY]: {
    amount: 120000, // ₹1200
    displayAmount: 1200,
    months: 12,
    label: "Yearly",
  },
} as const;
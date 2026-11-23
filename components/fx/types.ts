export type RateHit = { ttbr: number; rateDate: string };
export type Warning = { level: "BLOCK" | "WARN" | "INFO"; message: string };

export type FxClient = {
  id: string;
  name: string;
  email: string | null;
  notes: string | null;
  slabRate: number;
  costRateRule: "SAME_DAY" | "PREV_MONTH_END";
  saleRateRule: "SAME_DAY" | "PREV_MONTH_END";
  dividendRateRule: "SAME_DAY" | "PREV_MONTH_END";
  updatedAt: string;
};

export type Txn = {
  id: string;
  type: "VEST" | "BUY" | "SELL" | "DIVIDEND" | "TAX_WITHHELD";
  date: string;
  symbol: string;
  company: string | null;
  broker: string | null;
  account: string | null;
  quantity: number;
  priceUsd: number | null;
  amountUsd: number | null;
  feesUsd: number | null;
  currency: string;
  lotRef: string | null;
  costInrPerShare: number | null;
};

type Money = { proceeds: number; cost: number; fees: number; gain: number };

export type Report = {
  lots: {
    id: string; ref: string; type: string; date: string; symbol: string; broker: string; quantity: number;
    priceUsd: number; costInrPerShare: number | null; costSource: string; rateUsed: RateHit | null; remaining: number;
  }[];
  pieces: {
    lotRef: string; symbol: string; broker: string; acquiredOn: string; soldOn: string; quantity: number;
    salePriceUsd: number; saleRate: RateHit | null; proceedsInr: number | null; feesInr: number | null;
    costInr: number | null; gainInr: number | null; holdingMonths: number; longTerm: boolean; fy: string; bucket: string;
  }[];
  gainsByFy: {
    fy: string; shortTerm: Money; longTerm: Money; byBucket: Record<string, { shortTerm: number; longTerm: number }>;
    estimatedTax: { shortTerm: number; longTerm: number }; incomplete: boolean;
  }[];
  dividends: {
    id: string; date: string; symbol: string; broker: string; kind: "DIVIDEND" | "TAX_WITHHELD";
    amountUsd: number; currency: string; rate: RateHit | null; amountInr: number | null; fy: string;
  }[];
  dividendsByFy: {
    fy: string; grossInr: number; taxWithheldInr: number; indianTaxOnDividendInr: number; ftcEstimateInr: number; incomplete: boolean;
  }[];
  faYears: number[];
  faLots: {
    year: number; lotRef: string; symbol: string; company: string; broker: string; acquiredOn: string;
    sharesAtYearEnd: number; initialValueInr: number | null; peakValueInr: number | null; peakDate: string | null;
    closingValueInr: number | null; saleProceedsInr: number; missing: string[];
  }[];
  faAccounts: {
    year: number; broker: string; account: string; peakValueInr: number | null; peakDate: string | null;
    closingValueInr: number | null; grossCreditedInr: number; missing: string[];
  }[];
  holdings: { symbol: string; company: string; shares: number }[];
  warnings: Warning[];
  ratesUsed: { currency: string; date: string; ttbr: number }[];
};

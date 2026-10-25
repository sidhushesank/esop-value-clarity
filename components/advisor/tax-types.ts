export type TaxRegime = "NEW" | "OLD";
export type TaxEventType = "EXERCISE" | "SALE" | "LEAVE" | "BUYBACK";
export type FlagSeverity = "RED" | "AMBER" | "INFO";

export type TaxFlag = {
  code: string;
  severity: FlagSeverity;
  message: string;
};

export type TaxAudit = {
  ruleSetVersion: string;
  rules: { code: string; title: string; verified: boolean }[];
  inputs: Record<string, string | number | boolean | null>;
  steps: string[];
};

export type TaxTds = {
  lotId: string;
  eventId: string;
  status: "DUE_NOW" | "DEFERRED" | "TRIGGERED";
  amount: number;
  shares: number;
  trigger: "EXERCISE" | "WINDOW_END" | "SALE" | "LEAVE" | null;
  deductOnOrBefore: string | null;
  depositBy: string | null;
  shortfall: number | null;
  shortfallOptions: string[];
};

export type TaxEventResult = {
  eventId: string;
  type: TaxEventType;
  eventDate: string;
  perquisite?: {
    fmvPerShare: number | null;
    valuationId: string | null;
    valuationDate: string | null;
    valuationAgeDays: number | null;
    perquisitePerShare: number | null;
    perquisite: number | null;
    incrementalTax: number | null;
    averageRate: number | null;
    deferred: boolean;
  };
  capitalGain?: {
    proceeds: number;
    cost: number;
    gain: number;
    longTerm: boolean;
    rateLabel: string;
    estimatedTax: number | null;
  };
  tds: TaxTds[];
  flags: TaxFlag[];
  audit: TaxAudit;
};

export type TaxDeadline = {
  code: string;
  label: string;
  dueDate: string;
  ruleCode: string;
  owner: string;
  eventId: string | null;
  note?: string;
  employeeId: string;
  employeeName: string;
};

export type TaxEmployeeRow = {
  id: string;
  name: string;
  employeeRef: string | null;
  pan: string | null;
  regime: TaxRegime;
  estimatedIncomeExclPerq: number;
  monthlyNetPay: number | null;
  isPromoter: boolean;
};

export type EmployeeLedgerView = {
  employee: TaxEmployeeRow;
  ledger: {
    results: TaxEventResult[];
    totals: {
      perquisite: number;
      tdsDueNow: number;
      tdsDeferred: number;
      tdsTriggered: number;
    };
  };
};

export type LedgerResponse = {
  success: boolean;
  isFounder: boolean;
  client: {
    id: string;
    name: string;
    dpiitRecognised: boolean | null;
    imbCertificate: boolean | null;
  };
  valuations: {
    id: string;
    valuationDate: string;
    fmvPerShare: number;
    reference: string | null;
  }[];
  ledger: {
    asOf: string;
    ruleSetVersion: string;
    deferralEligible: boolean;
    employees: EmployeeLedgerView[];
    deadlines: TaxDeadline[];
    unverifiedRules: string[];
  };
};

export type TaxEventRow = {
  id: string;
  employeeId: string;
  type: TaxEventType;
  eventDate: string;
  shares: number;
  exercisePrice: number | null;
  valuationId: string | null;
  pricePerShare: number | null;
  lotEventId: string | null;
  note: string | null;
};

export type TaxRuleView = {
  code: string;
  title: string;
  source: string;
  notes: string | null;
  verified: boolean;
  verifiedAt: string | null;
  owner: string | null;
};
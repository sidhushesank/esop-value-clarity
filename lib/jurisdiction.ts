/**
 * ============================================================================
 * JURISDICTION: country, currency, number formats and wording
 * ============================================================================
 *
 * One place that decides how a company's money, numbers and legal words are
 * shown. Safe to import from both server code and client components (no
 * database, no Node-only APIs).
 *
 * IN = Indian company (rupees, lakh/crore grouping, Companies Act wording).
 * US = US company (dollars, US grouping, stock-plan wording, 409A).
 *
 * The currency is decided by the jurisdiction, never chosen separately, so a
 * company can never end up with an impossible mix like "India + dollars".
 * ============================================================================
 */

export type Jurisdiction = "IN" | "US";

export const JURISDICTIONS: Jurisdiction[] = ["IN", "US"];

export function asJurisdiction(value: unknown): Jurisdiction {
  return value === "US" ? "US" : "IN";
}

export type CurrencyCode = "INR" | "USD";

export function currencyOf(j: Jurisdiction): CurrencyCode {
  return j === "US" ? "USD" : "INR";
}

export function numberLocale(j: Jurisdiction): string {
  return j === "US" ? "en-US" : "en-IN";
}

/** Symbol for on-screen use ("₹" or "$"). */
export function currencySymbol(j: Jurisdiction): string {
  return j === "US" ? "$" : "₹";
}

/**
 * Prefix for PDFs and Excel headers. The PDF fonts have no ₹ glyph, so India
 * prints "Rs." (as before); "$" is a plain ASCII character and is safe.
 */
export function plainCurrencyPrefix(j: Jurisdiction): string {
  return j === "US" ? "$" : "Rs. ";
}

/** Short code for column headers, e.g. "Price (₹)" / "Price ($)". */
export function currencyTag(j: Jurisdiction): string {
  return `(${currencySymbol(j)})`;
}

export function plainCurrencyTag(j: Jurisdiction): string {
  return j === "US" ? "($)" : "(Rs.)";
}

/** Plain number with the right grouping: 1,00,000 (IN) or 100,000 (US). */
export function formatNumber(
  n: number | null | undefined,
  j: Jurisdiction,
  maxDecimals = 2
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString(numberLocale(j), { maximumFractionDigits: maxDecimals });
}

/** Money for screens: "₹1,20,000" / "$120,000". Whole units unless decimals asked. */
export function formatMoney(
  n: number | null | undefined,
  j: Jurisdiction,
  opts: { decimals?: number } = {}
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  const decimals = opts.decimals ?? 0;
  const abs = Math.abs(n).toLocaleString(numberLocale(j), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${n < 0 ? "−" : ""}${currencySymbol(j)}${abs}`;
}

/**
 * Money for per-share prices. US strikes are often fractions of a dollar
 * ("$0.0125"), so up to 4 decimals; rupee prices up to 2.
 */
export function formatPrice(n: number | null | undefined, j: Jurisdiction): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  const abs = Math.abs(n).toLocaleString(numberLocale(j), { maximumFractionDigits: j === "US" ? 4 : 2 });
  return `${n < 0 ? "−" : ""}${currencySymbol(j)}${abs}`;
}

/** Money for PDFs: "Rs. 1,20,000" / "$120,000". */
export function formatPlainMoney(n: number, j: Jurisdiction, maxDecimals = 2): string {
  return `${plainCurrencyPrefix(j)}${formatNumber(n, j, maxDecimals)}`;
}

/** Dates are shown the same way everywhere: "02 Jan 2027" (no US/IN day-month confusion). */
export function formatDateFor(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* ------------------------------------------------------------------ */
/* Wording                                                             */
/* ------------------------------------------------------------------ */

export type Wording = {
  countryName: string;
  pool: string;
  poolShort: string;
  scheme: string;
  schemeDefaultName: string;
  shareholders: string;
  shareholdersLower: string;
  equityShares: string;
  faceValue: string;
  fmvTitle: string;
  fmvHelp: string;
  valuerPlaceholder: string;
  optionsRegisterTitle: string;
  optionsRegisterFile: string;
  employeeGrantHeading: string;
  bigHolderCheckbox: string;
  residentCheckbox: string | null;
  nonResidentTag: string | null;
};

const WORDING: Record<Jurisdiction, Wording> = {
  IN: {
    countryName: "India",
    pool: "ESOP pool",
    poolShort: "pool",
    scheme: "ESOP scheme",
    schemeDefaultName: `ESOP Scheme ${new Date().getUTCFullYear()}`,
    shareholders: "Shareholders",
    shareholdersLower: "shareholders",
    equityShares: "equity shares",
    faceValue: "Face value per share",
    fmvTitle: "Current value per share",
    fmvHelp:
      "Usually the fair market value from your latest merchant-banker valuation. Employees see it on their grant page to understand what their options are worth today. Leave blank if you have none yet.",
    valuerPlaceholder: "e.g. XYZ Capital (SEBI Cat-I merchant banker)",
    optionsRegisterTitle: "register of options",
    optionsRegisterFile: "options-register",
    employeeGrantHeading: "here is your ESOP grant",
    bigHolderCheckbox: "This person is a promoter, or a director holding more than 10% of the company",
    residentCheckbox: "Resident in India",
    nonResidentTag: "Non-resident",
  },
  US: {
    countryName: "United States",
    pool: "Option pool",
    poolShort: "pool",
    scheme: "Equity incentive plan",
    schemeDefaultName: `${new Date().getUTCFullYear()} Equity Incentive Plan`,
    shareholders: "Stockholders",
    shareholdersLower: "stockholders",
    equityShares: "common shares",
    faceValue: "Par value per share",
    fmvTitle: "409A fair market value per share",
    fmvHelp:
      "The common-stock value from your latest independent 409A valuation. It is used to check strike prices and is shown to employees on their grant page. EVC does not produce 409A valuations; record the one from your appraiser.",
    valuerPlaceholder: "e.g. name of your independent 409A appraiser",
    optionsRegisterTitle: "option ledger",
    optionsRegisterFile: "option-ledger",
    employeeGrantHeading: "here is your stock option grant",
    bigHolderCheckbox: "This person owns more than 10% of the company's voting stock (ISO 10% holder)",
    residentCheckbox: null,
    nonResidentTag: null,
  },
};

export function wordingFor(j: Jurisdiction): Wording {
  return WORDING[j];
}

/* ------------------------------------------------------------------ */
/* Security kinds                                                      */
/* ------------------------------------------------------------------ */

export type SecurityKindCode =
  | "EQUITY"
  | "CCPS"
  | "CCD"
  | "CONVERTIBLE_NOTE"
  | "ISAFE"
  | "WARRANT";

const KIND_LABELS: Record<Jurisdiction, Record<SecurityKindCode, string>> = {
  IN: {
    EQUITY: "Equity shares",
    CCPS: "CCPS (preference)",
    CCD: "CCD (debentures)",
    CONVERTIBLE_NOTE: "Convertible note",
    ISAFE: "iSAFE",
    WARRANT: "Warrants",
  },
  US: {
    EQUITY: "Common stock",
    CCPS: "Preferred stock",
    CCD: "Convertible debt",
    CONVERTIBLE_NOTE: "Convertible note",
    ISAFE: "SAFE",
    WARRANT: "Warrants",
  },
};

export function kindLabel(kind: SecurityKindCode, j: Jurisdiction): string {
  return KIND_LABELS[j][kind];
}

/** Kinds offered when adding a class. A US company has no CCDs. */
export function kindsFor(j: Jurisdiction): SecurityKindCode[] {
  return j === "US"
    ? ["EQUITY", "CCPS", "CONVERTIBLE_NOTE", "ISAFE", "WARRANT"]
    : ["EQUITY", "CCPS", "CCD", "CONVERTIBLE_NOTE", "ISAFE", "WARRANT"];
}

/* ------------------------------------------------------------------ */
/* US states (for state of incorporation)                              */
/* ------------------------------------------------------------------ */

export const US_STATES: string[] = [
  "Delaware", "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

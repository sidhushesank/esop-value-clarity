/**
 * India ESOP Buyback & Liquidity Tracker: EVC's own dataset.
 *
 * Why it matters most of everything in this zip: Google's AI guide says
 * "non-commodity" content (unique, first-hand) is what wins over time; GEO
 * research says pages with concrete statistics and cited sources get cited more.
 * Nobody else in India keeps a clean, sourced, downloadable table of ESOP
 * buybacks. Journalists, VCs and AI engines need one number ("how much did
 * Indian startups pay out in ESOP buybacks in 2026?"), and this page is where it comes from.
 *
 * Seeded ONLY from facts already published in your own articles (each row links
 * its source). Add a row every time you publish a daily buyback article.
 * Never add a number you can't source. Leave it null.
 */

export interface LiquidityEvent {
  company: string;
  /** ISO date of announcement / first report */
  date: string;
  type: "buyback" | "secondary" | "liquidity-programme";
  amountInrCrore: number | null;
  amountUsdMillion: number | null;
  employeesCovered: string | null; // free text, as reported
  eligibility: string | null;
  pricePerOptionInr: number | null;
  evcArticle: string; // path on esopvalueclarity.com
  primarySources: { title: string; url?: string }[];
}

export const LIQUIDITY_EVENTS: LiquidityEvent[] = [
  {
    company: "BrowserStack",
    date: "2026-01-12",
    type: "buyback",
    amountInrCrore: null,
    amountUsdMillion: 125,
    employeesCovered: "500+ current and former employees, plus early investors",
    eligibility: "Vested options; programme shared between employees (about half) and early backers",
    pricePerOptionInr: null,
    evcArticle: "/blog/browserstack-esop-buyback-2026",
    primarySources: [{ title: "BrowserStack press release (12 Jan 2026)" }, { title: "Entrepreneur India" }],
  },
  {
    company: "Unacademy",
    date: "2026-02-27",
    type: "buyback",
    amountInrCrore: 50,
    amountUsdMillion: null,
    employeesCovered: "8 employees above ₹1 crore each, 17 above ₹50 lakh, 38 above ₹10 lakh (total not disclosed)",
    eligibility: "Eligible employees; former employees given a one-time 30-day window to exercise vested options",
    pricePerOptionInr: null,
    evcArticle: "/blog/unacademy-esop-buyback-2026",
    primarySources: [{ title: "Business Today (27 Feb 2026)" }],
  },
  {
    company: "Flipkart",
    date: "2026-07-06",
    type: "liquidity-programme",
    amountInrCrore: null,
    amountUsdMillion: null,
    employeesCovered: "Current staff active on 15 Jul 2026",
    eligibility: "Up to 5% of vested options; current employees only",
    pricePerOptionInr: 713.4,
    evcArticle: "/blog/flipkart-esop-liquidity-2026",
    primarySources: [{ title: "StartupFeed (7 Jul 2026), citing internal email" }, { title: "Inc42" }],
  },
  {
    company: "Scapia",
    date: "2026-07-20",
    type: "buyback",
    amountInrCrore: 20,
    amountUsdMillion: null,
    employeesCovered: null,
    eligibility: "Up to 10% of vested options",
    pricePerOptionInr: null,
    evcArticle: "/blog/scapia-esop-buyback-2026",
    primarySources: [{ title: "Entrackr" }, { title: "Inc42" }],
  },
];

export const TRACKER_LAST_UPDATED = "2026-11-22";

export function summarise(events: LiquidityEvent[] = LIQUIDITY_EVENTS) {
  const inr = events.reduce((s, e) => s + (e.amountInrCrore ?? 0), 0);
  const usd = events.reduce((s, e) => s + (e.amountUsdMillion ?? 0), 0);
  return {
    count: events.length,
    disclosedInrCrore: inr,
    disclosedUsdMillion: usd,
    undisclosedAmount: events.filter((e) => e.amountInrCrore == null && e.amountUsdMillion == null).length,
  };
}

export function toCsv(events: LiquidityEvent[] = LIQUIDITY_EVENTS): string {
  const head = [
    "company", "date", "type", "amount_inr_crore", "amount_usd_million",
    "employees_covered", "eligibility", "price_per_option_inr", "evc_article", "sources",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = events.map((e) => [
    e.company, e.date, e.type, e.amountInrCrore, e.amountUsdMillion, e.employeesCovered,
    e.eligibility, e.pricePerOptionInr, `https://esopvalueclarity.com${e.evcArticle}`,
    e.primarySources.map((p) => p.title).join(" | "),
  ].map(esc).join(","));
  return [head.join(","), ...rows].join("\n");
}

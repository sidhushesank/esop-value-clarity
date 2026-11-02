import type { MetadataRoute } from "next";

const BASE_URL = "https://esopvalueclarity.com";

// Keep in sync with the article list in app/blog/[slug]/page.tsx.
const articles = [
  "startup-offered-25000-esops",
  "should-i-negotiate-esops",
  "esop-exercise-cost",
  "leaving-startup-esop-options",
  "startup-raised-funding-dilution",
  "compare-startup-offers-equity",
  "what-is-an-esop",
  "esop-vs-rsu",
  "dilution-explained",
  "vesting-schedule",
  "esop-valuation-india",
  "cap-table-india",
];

// IMPORTANT: use fixed dates. `new Date()` makes every URL look "modified
// right now" on every crawl, which teaches Google to ignore lastmod.
// Bump these when the page content genuinely changes.
const SITE_UPDATED = new Date("2026-11-02");
const LEGAL_UPDATED = new Date("2026-10-01");
const ARTICLES_UPDATED = new Date("2026-11-02");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: SITE_UPDATED, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/simulator`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/cap-table`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: ARTICLES_UPDATED, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/meeting`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    ...articles.map((slug) => ({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified: ARTICLES_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

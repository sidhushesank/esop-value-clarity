import type { MetadataRoute } from "next";

import { getContentArticles } from "@/lib/blog-content";
import { TRACKER_LAST_UPDATED } from "@/data/esop-liquidity-events";

const BASE_URL = "https://esopvalueclarity.com";

// The original articles in app/blog/[slug]/page.tsx. New articles are JSON
// files in content/articles/ and are added below automatically.
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
const SITE_UPDATED = new Date("2026-11-25");
const LEGAL_UPDATED = new Date("2026-10-01");
const ARTICLES_UPDATED = new Date("2026-11-18");
// Articles edited after ARTICLES_UPDATED. Keep in step with `updatedAt` on the
// article in app/blog/[slug]/page.tsx.
const ARTICLE_UPDATED: Record<string, Date> = {
  "esop-exercise-cost": new Date("2026-11-26"),
  "vesting-schedule": new Date("2026-11-26"),
};
// The buyback tracker carries its own "last updated" date in its data file.
const TRACKER_UPDATED = new Date(TRACKER_LAST_UPDATED);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: SITE_UPDATED, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/simulator`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/cap-table`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: ARTICLES_UPDATED, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/esop-buyback-tracker`, lastModified: TRACKER_UPDATED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/esop-management-software-pricing`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/meeting`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/partners/taxbuddy`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    ...articles.map((slug) => ({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified: ARTICLE_UPDATED[slug] ?? ARTICLES_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getContentArticles()
      .filter((a) => !articles.includes(a.slug))
      .map((a) => ({
        url: `${BASE_URL}/blog/${a.slug}`,
        lastModified: new Date(a.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
  ];
}

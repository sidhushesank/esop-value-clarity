import type { MetadataRoute } from "next";

const BASE_URL = "https://esopvalueclarity.com";

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
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },

    {
      url: `${BASE_URL}/simulator`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },

    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },

    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },

    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },

    ...articles.map((slug) => ({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
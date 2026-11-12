import type { MetadataRoute } from "next";

const BASE_URL = "https://esopvalueclarity.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Only block the API. Private pages are NOT blocked here on purpose:
        // they send "X-Robots-Tag: noindex" (next.config.ts), and Google must
        // be allowed to crawl them to see that noindex and drop them.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
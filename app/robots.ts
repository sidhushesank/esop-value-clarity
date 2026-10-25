import type { MetadataRoute } from "next";

const BASE_URL = "https://esopvalueclarity.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / logged-in / transactional areas should never be crawled.
        disallow: [
          "/api/",
          "/admin",
          "/advisor",
          "/pro",
          "/dashboard",
          "/history",
          "/profile",
          "/team",
          "/share/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}

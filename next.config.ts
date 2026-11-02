import type { NextConfig } from "next";

// Private areas: even if a link leaks, tell search engines not to index them.
const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
const privatePaths = [
  "/admin/:path*",
  "/advisor/:path*",
  "/pro/:path*",
  "/dashboard/:path*",
  "/history/:path*",
  "/profile/:path*",
  "/team/:path*",
  "/share/:path*",
  "/company/:path*",
  "/grant/:path*",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],

  async headers() {
    return privatePaths.map((source) => ({ source, headers: NOINDEX }));
  },

  // One address for Google: send www.esopvalueclarity.com to esopvalueclarity.com
  // (permanent 308), so rankings are not split across two copies of every page.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.esopvalueclarity.com" }],
        destination: "https://esopvalueclarity.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

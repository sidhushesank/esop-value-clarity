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
};

export default nextConfig;

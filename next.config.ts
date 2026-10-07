import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  // Unique per deployment; stored on process.env so build workers share one value.
  process.env.NEXT_PUBLIC_APP_VERSION ||= phase === PHASE_DEVELOPMENT_SERVER
    ? "dev"
    : process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now());

  return {
    env: {
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    },
    turbopack: {
      root: process.cwd(),
    },
    async rewrites() {
      const apiUrl = (
        process.env.API_URL ||
        (process.env.VERCEL ? "https://o-ushers.vercel.app" : "http://localhost:4000")
      ).replace(/\/$/, "");
      return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
    },
  };
}

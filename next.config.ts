import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;

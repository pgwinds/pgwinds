import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
};

export default nextConfig;

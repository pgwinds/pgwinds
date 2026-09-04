import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "pdomkhrzqviamzlfxcia.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
};

export default nextConfig;

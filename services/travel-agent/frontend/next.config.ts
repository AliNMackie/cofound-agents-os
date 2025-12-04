import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-expect-error - eslint config is valid but missing from types in this version
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

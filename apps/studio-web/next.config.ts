import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true
  },
  transpilePackages: [
    "@product-studio/shared-types",
    "@product-studio/ux-audit",
    "@product-studio/theme-engine",
  ]
};

export default nextConfig;

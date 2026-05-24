import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true
  },
  transpilePackages: ["@product-studio/shared-types", "@product-studio/ux-audit"]
};

export default nextConfig;

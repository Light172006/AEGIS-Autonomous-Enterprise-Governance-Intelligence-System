import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Lint is run separately via `npx eslint .`
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

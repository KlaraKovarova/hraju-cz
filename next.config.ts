import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  outputFileTracingExcludes: {
    "*": [
      "./public/images/blog/**",
      "./public/images/sports/**",
    ],
  },
};

export default nextConfig;

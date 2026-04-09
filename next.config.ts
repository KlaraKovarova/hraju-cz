import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
  async redirects() {
    return [
      // Redirect disabled locale prefixes to Czech (default) — SIL-589/SIL-590
      { source: "/en/:path*", destination: "/:path*", permanent: true },
      { source: "/de/:path*", destination: "/:path*", permanent: true },
      { source: "/pl/:path*", destination: "/:path*", permanent: true },
      { source: "/en", destination: "/", permanent: true },
      { source: "/de", destination: "/", permanent: true },
      { source: "/pl", destination: "/", permanent: true },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);

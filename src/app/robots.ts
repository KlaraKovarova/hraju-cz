import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/hledat",
    },
    sitemap: "https://www.hraju.cz/sitemap.xml",
  };
}

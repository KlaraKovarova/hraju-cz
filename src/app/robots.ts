import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/hledat", "/admin", "/api/", "/muj-ucet", "/moje-sportoviste", "/en/", "/de/", "/pl/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "Claude-Web",
          "PerplexityBot",
          "Applebot-Extended",
          "cohere-ai",
        ],
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/admin", "/api/", "/muj-ucet", "/moje-sportoviste", "/en/", "/de/", "/pl/"],
      },
    ],
    sitemap: [
      "https://www.hraju.cz/sitemap.xml",
      "https://www.hraju.cz/sitemap-images.xml",
    ],
  };
}

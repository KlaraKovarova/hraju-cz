import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/hledat", "/admin", "/api/", "/muj-ucet", "/moje-sportoviste"],
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
        disallow: ["/admin", "/api/", "/muj-ucet", "/moje-sportoviste"],
      },
    ],
    sitemap: "https://www.hraju.cz/sitemap.xml",
  };
}

import type { MetadataRoute } from "next";

const BASE_URL = "https://menuair.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/platform", "/garcom", "/api"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
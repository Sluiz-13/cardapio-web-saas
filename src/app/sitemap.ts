import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = "https://menuair.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = await db.restaurant.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true },
  });

  const restaurantUrls: MetadataRoute.Sitemap = restaurants.map((r) => ({
    url: `${BASE_URL}/r/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/termos`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacidade`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...restaurantUrls,
  ];
}
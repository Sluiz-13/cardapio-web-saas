import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import MenuClient from "./_components/menu-client";

export default async function RestaurantMenuPage({ params }: { params: { slug: string } }) {
  const restaurant = await db.restaurant.findUnique({
    where: { slug: params.slug },
  });
  if (!restaurant) notFound();

  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { order: "asc" },
  });

  const products = await db.product.findMany({
    where: { restaurantId: restaurant.id, active: true },
    include: { removableOptions: true, extraOptions: true },
  });

  return (
    <MenuClient
      restaurant={{ id: restaurant.id, name: restaurant.name, isOpen: restaurant.isOpen }}
      categories={categories}
      products={products}
    />
  );
}
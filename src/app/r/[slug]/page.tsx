import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isRestaurantOpenNow } from "@/lib/business-hours";
import MenuClient from "./_components/menu-client";

export default async function RestaurantMenuPage({ params }: { params: { slug: string } }) {
  const restaurant = await db.restaurant.findUnique({ where: { slug: params.slug } });
  if (!restaurant) notFound();

  const [categories, products, businessHours] = await Promise.all([
    db.category.findMany({ where: { restaurantId: restaurant.id }, orderBy: { order: "asc" } }),
    db.product.findMany({
      where: { restaurantId: restaurant.id, active: true },
      include: { removableOptions: true, extraOptions: true },
    }),
    db.businessHours.findMany({ where: { restaurantId: restaurant.id } }),
  ]);

  const isOpenNow = isRestaurantOpenNow(restaurant.isOpen, businessHours);

  return (
    <MenuClient
      restaurant={{ id: restaurant.id, name: restaurant.name, isOpen: isOpenNow }}
      categories={categories}
      products={products}
    />
  );
}
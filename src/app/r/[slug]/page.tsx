import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isRestaurantOpenNow } from "@/lib/business-hours";
import MenuClient from "./_components/menu-client";

export default async function RestaurantMenuPage({ params }: { params: { slug: string } }) {
  const restaurant = await db.restaurant.findUnique({ where: { slug: params.slug } });

  if (!restaurant || !restaurant.active) notFound();

  const [categories, products, businessHours] = await Promise.all([
    db.category.findMany({ where: { restaurantId: restaurant.id }, orderBy: { order: "asc" } }),
    db.product.findMany({
        where: { restaurantId: restaurant.id, active: true },
        include: { removableOptions: true, extraOptions: true },
    }).then((products) => {
        const today = new Date().getDay();
        return products.filter((p) => p.availableDays.length === 0 || p.availableDays.includes(today));
    }),
    db.businessHours.findMany({ where: { restaurantId: restaurant.id } }),
  ]);

  const isOpenNow = isRestaurantOpenNow(restaurant.isOpen, businessHours);

  return (
    <MenuClient
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        isOpen: isOpenNow,
        phone: restaurant.phone,
        address: restaurant.address,
        avgDeliveryTime: restaurant.avgDeliveryTime,
      }}
      categories={categories}
      products={products}
    />
  );
}
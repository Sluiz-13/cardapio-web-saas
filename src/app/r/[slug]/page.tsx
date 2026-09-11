import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { isRestaurantOpenNow } from "@/lib/business-hours";
import { getBrazilTimeParts } from "@/lib/timezone";
import MenuClient from "./_components/menu-client";
import { planAllows } from "@/lib/plan-features";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const restaurant = await db.restaurant.findUnique({
    where: { slug: params.slug },
    select: { name: true, logoUrl: true, active: true },
  });

  if (!restaurant || !restaurant.active) {
    return { title: "Cardápio não encontrado | Menuair" };
  }

  const title = `${restaurant.name} - Cardápio Online`;
  const description = `Peça já no cardápio digital de ${restaurant.name}. Pedidos online, pagamento via Pix e entrega rápida.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: restaurant.logoUrl ? [{ url: restaurant.logoUrl }] : undefined,
      type: "website",
    },
  };
}

export default async function RestaurantMenuPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { mesa?: string };
}) {
  const restaurant = await db.restaurant.findUnique({ where: { slug: params.slug } });

  if (!restaurant || !restaurant.active) notFound();

  const [categories, products, businessHours, table] = await Promise.all([
    db.category.findMany({ where: { restaurantId: restaurant.id }, orderBy: { order: "asc" } }),
    db.product.findMany({
        where: { restaurantId: restaurant.id, active: true, visibleToCustomer: true },
        include: {
          removableOptions: true,
          extraOptions: true,
          optionGroups: { include: { items: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
    }).then((products) => {
        const { dayOfWeek: today } = getBrazilTimeParts();
        return products.filter((p) => p.availableDays.length === 0 || p.availableDays.includes(today));
    }),
    db.businessHours.findMany({ where: { restaurantId: restaurant.id } }),
    searchParams.mesa && planAllows(restaurant.plan, "qrSelfOrder")
      ? db.table.findFirst({
          where: { id: searchParams.mesa, restaurantId: restaurant.id },
          select: { id: true, label: true },
        })
      : Promise.resolve(null),
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
        logoUrl: restaurant.logoUrl,
      }}
      categories={categories}
      products={products}
      table={table}
      businessHours={businessHours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        isOpen: h.isOpen,
        openTime: h.openTime,
        closeTime: h.closeTime,
      }))}
    />
  );
}
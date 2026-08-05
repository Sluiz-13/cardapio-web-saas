import { db } from "@/lib/db";
import RestaurantsTable from "./_components/restaurants-table";

export default async function PlatformDashboardPage() {
  const restaurants = await db.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true, adminUsers: true } },
    },
  });

  const PAYMENT_GRACE_DAYS = 35; // ~1 mês + margem

  const revenueByRestaurant = await db.order.groupBy({
    by: ["restaurantId"],
    where: { status: "DELIVERED" },
    _sum: { totalCents: true },
  });
  const revenueMap = new Map(revenueByRestaurant.map((r) => [r.restaurantId, r._sum.totalCents ?? 0]));

  const now = Date.now();
  const rows = restaurants.map((r) => {
    const daysSincePayment = r.lastPaymentConfirmedAt
      ? (now - r.lastPaymentConfirmedAt.getTime()) / (1000 * 60 * 60 * 24)
      : null;
    const paymentPending = daysSincePayment === null || daysSincePayment > PAYMENT_GRACE_DAYS;

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      plan: r.plan,
      active: r.active,
      ordersCount: r._count.orders,
      adminsCount: r._count.adminUsers,
      revenueCents: revenueMap.get(r.id) ?? 0,
      createdAt: r.createdAt.toISOString(),
      lastPaymentConfirmedAt: r.lastPaymentConfirmedAt?.toISOString() ?? null,
      paymentPending,
    };
  });

  const totalRevenueCents = rows.reduce((sum, r) => sum + r.revenueCents, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-1 mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Restaurantes</h1>
          <p className="text-sm text-gray-500">{rows.length} tenant(s) cadastrado(s) na plataforma.</p>
        </div>
        <div className="text-sm text-gray-600">
          Faturamento total (entregues):{" "}
          <span className="font-semibold text-gray-900">
            {(totalRevenueCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </div>
      </div>

      <RestaurantsTable initialRestaurants={rows} />
    </div>
  );
}
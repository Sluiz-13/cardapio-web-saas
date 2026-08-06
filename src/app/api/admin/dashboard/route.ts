import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { planAllows } from "@/lib/plan-features";

const PAID_STATUSES = ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { plan: true },
  });
  if (!restaurant) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!planAllows(restaurant.plan, "dashboard")) {
    return NextResponse.json({ error: "Recurso disponível apenas no plano Pro." }, { status: 403 });
  }

  const restaurantId = session.user.restaurantId;
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now);
  startOfMonth.setDate(startOfMonth.getDate() - 29);
  startOfMonth.setHours(0, 0, 0, 0);

  const [ordersLast14Days, activeOrders, itemsLast30Days, todayOrders, weekOrders, monthOrders] = await Promise.all([
    db.order.findMany({
      where: { restaurantId, status: { in: [...PAID_STATUSES] }, createdAt: { gte: startOfMonth } },
      select: { totalCents: true, createdAt: true },
    }),
    db.order.groupBy({
      by: ["status"],
      where: { restaurantId, status: { in: [...PAID_STATUSES] } },
      _count: { _all: true },
    }),
    db.orderItem.findMany({
      where: { order: { restaurantId, createdAt: { gte: startOfMonth } } },
      select: { productName: true, qty: true },
    }),
    db.order.findMany({
      where: { restaurantId, status: { in: [...PAID_STATUSES] }, createdAt: { gte: startOfToday } },
      select: { totalCents: true },
    }),
    db.order.findMany({
      where: { restaurantId, status: { in: [...PAID_STATUSES] }, createdAt: { gte: startOfWeek } },
      select: { totalCents: true },
    }),
    db.order.findMany({
      where: { restaurantId, status: { in: [...PAID_STATUSES] }, createdAt: { gte: startOfMonth } },
      select: { totalCents: true },
    }),
  ]);

  // Agrupa faturamento por dia (últimos 14 dias) pro gráfico.
  const revenueByDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    revenueByDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of ordersLast14Days) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + o.totalCents);
    }
  }
  const revenueChart = Array.from(revenueByDay.entries()).map(([date, totalCents]) => ({ date, totalCents }));

  // Top 5 produtos mais vendidos (últimos 30 dias).
  const productTotals = new Map<string, number>();
  for (const item of itemsLast30Days) {
    productTotals.set(item.productName, (productTotals.get(item.productName) ?? 0) + item.qty);
  }
  const topProducts = Array.from(productTotals.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const sum = (orders: { totalCents: number }[]) => orders.reduce((s, o) => s + o.totalCents, 0);

  return NextResponse.json({
    revenueTodayCents: sum(todayOrders),
    revenueWeekCents: sum(weekOrders),
    revenueMonthCents: sum(monthOrders),
    ordersByStatus: activeOrders.map((o) => ({ status: o.status, count: o._count._all })),
    revenueChart,
    topProducts,
  });
}
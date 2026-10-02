import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dateParam = req.nextUrl.searchParams.get("date"); // formato YYYY-MM-DD
  const date = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

  const orders = await db.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      deliveryType: "DELIVERY",
      status: "DELIVERED",
      driverId: { not: null },
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    select: {
      id: true,
      street: true,
      number: true,
      neighborhood: true,
      city: true,
      deliveryFeeCents: true,
      createdAt: true,
      driver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Agrupa por entregador — cada um com a lista de entregas + total/média.
  const byDriver = new Map<
    string,
    { driverName: string; deliveries: typeof orders; totalCents: number }
  >();

  for (const order of orders) {
    if (!order.driver) continue;
    const key = order.driver.id;
    if (!byDriver.has(key)) {
      byDriver.set(key, { driverName: order.driver.name, deliveries: [], totalCents: 0 });
    }
    const entry = byDriver.get(key)!;
    entry.deliveries.push(order);
    entry.totalCents += order.deliveryFeeCents;
  }

  const report = Array.from(byDriver.values()).map((d) => ({
    driverName: d.driverName,
    totalCents: d.totalCents,
    averageCents: d.deliveries.length > 0 ? Math.round(d.totalCents / d.deliveries.length) : 0,
    deliveries: d.deliveries.map((o) => ({
      id: o.id,
      address: `${o.street ?? ""}, ${o.number ?? ""}`,
      neighborhood: o.neighborhood,
      feeCents: o.deliveryFeeCents,
      time: o.createdAt,
    })),
  }));

  return NextResponse.json(report);
}
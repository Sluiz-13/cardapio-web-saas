import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const customers = await db.customer.findMany({
    where: { restaurantId: session.user.restaurantId },
    select: {
      id: true,
      name: true,
      phone: true,
      loyaltyPoints: true,
      cashbackBalanceCents: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      loyaltyPoints: c.loyaltyPoints,
      cashbackBalanceCents: c.cashbackBalanceCents,
      ordersCount: c._count.orders,
      createdAt: c.createdAt,
    }))
  );
}
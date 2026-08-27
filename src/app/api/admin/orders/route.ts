import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orders = await db.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      status: { in: ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] },
    },
    include: { items: true, table: { select: { label: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(orders);
}
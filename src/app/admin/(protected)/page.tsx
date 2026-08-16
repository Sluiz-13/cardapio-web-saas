import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import OrdersBoard from "./_components/orders-board";


export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null; // middleware já protege, isso é só type-safety

  const [orders, restaurant] = await Promise.all([
    db.order.findMany({
      where: {
        restaurantId: session.user.restaurantId,
        status: { in: ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] },
      },
      include: { items: true, table: { select: { label: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: { printMethod: true },
    }),
  ]);

  return <OrdersBoard initialOrders={orders} printMethod={restaurant?.printMethod ?? "MANUAL"} />;
}
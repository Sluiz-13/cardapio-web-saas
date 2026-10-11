import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import OrdersBoard from "./_components/orders-board";
import { getBoardOrders } from "@/lib/board-orders";


export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null; // middleware já protege, isso é só type-safety

  const [orders, restaurant] = await Promise.all([
    getBoardOrders(session.user.restaurantId),
       db.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: { printMethod: true, printerIp: true, printerPort: true, printerBluetoothAddress: true, printerQzName: true },
    }),
  ]);

  return (
    <OrdersBoard
      initialOrders={orders}
      printMethod={restaurant?.printMethod ?? "MANUAL"}
      printerIp={restaurant?.printerIp}
      printerPort={restaurant?.printerPort}
      printerBluetoothAddress={restaurant?.printerBluetoothAddress}
      printerQzName={restaurant?.printerQzName}
    />
  );
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { planAllows } from "@/lib/plan-features";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: {
      plan: true,
      printMethod: true,
      printerIp: true,
      printerPort: true,
      printerBluetoothAddress: true,
      printerQzName: true,
    },
  });
  if (!restaurant) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  if (!planAllows(restaurant.plan, "tableOrdering")) {
    return NextResponse.json({ error: "Recurso disponível apenas no plano Pro." }, { status: 403 });
  }

  const comandas = await db.comanda.findMany({
    where: { restaurantId: session.user.restaurantId, status: "OPEN" },
    include: {
      table: { select: { label: true } },
      orders: {
        select: {
          id: true,
          customerName: true,
          totalCents: true,
          createdAt: true,
          items: { select: { productName: true, qty: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { openedAt: "asc" },
  });

  return NextResponse.json({
    comandas,
    printMethod: restaurant.printMethod,
    printerIp: restaurant.printerIp,
    printerPort: restaurant.printerPort,
    printerBluetoothAddress: restaurant.printerBluetoothAddress,
    printerQzName: restaurant.printerQzName,
  });
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurantId = session.user.restaurantId;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // "Faturado" = pedido que passou de PENDING_PAYMENT, ou seja, todo status
  // exceto pendente/cancelado. Isso já reflete corretamente pedidos em
  // dinheiro (nascem como NEW) e os que vierem de gateway (viram NEW só após
  // o webhook confirmar).
  const paidStatuses = ["NEW", "PREPARING", "READY", "DELIVERED"] as const;

  const [todayOrders, last10] = await Promise.all([
    db.order.findMany({
      where: { restaurantId, status: { in: [...paidStatuses] }, createdAt: { gte: startOfDay } },
      select: { totalCents: true, paymentMethod: true, customerName: true, createdAt: true },
    }),
    db.order.findMany({
      where: { restaurantId, status: { in: [...paidStatuses] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, customerName: true, totalCents: true, paymentMethod: true, createdAt: true },
    }),
  ]);

  const faturamentoHojeCents = todayOrders.reduce((s, o) => s + o.totalCents, 0);
  const pedidosHoje = todayOrders.length;
  const ticketMedioCents = pedidosHoje > 0 ? Math.round(faturamentoHojeCents / pedidosHoje) : 0;

  return NextResponse.json({
    faturamentoHojeCents,
    pedidosHoje,
    ticketMedioCents,
    ultimasVendas: last10,
  });
}
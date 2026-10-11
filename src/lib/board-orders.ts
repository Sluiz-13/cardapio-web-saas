import { db } from "@/lib/db";

const ACTIVE_STATUSES = ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY"] as const;
const DELIVERED_VISIBLE_HOURS = 12;

// Pedidos do quadro de operação. Pedido entregue some do quadro 12h depois
// da entrega, ou na hora em que o caixa é fechado — o que vier primeiro.
// Não apaga nada: continua no Histórico, relatórios e financeiro.
// A data de entrega vem do OrderStatusHistory (registro DELIVERED).
export async function getBoardOrders(restaurantId: string) {
  const lastClosed = await db.cashSession.findFirst({
    where: { restaurantId, status: "CLOSED", closedAt: { not: null } },
    orderBy: { closedAt: "desc" },
    select: { closedAt: true },
  });

  const hoursAgo = new Date(Date.now() - DELIVERED_VISIBLE_HOURS * 60 * 60 * 1000);
  const cutoff =
    lastClosed?.closedAt && lastClosed.closedAt > hoursAgo ? lastClosed.closedAt : hoursAgo;

  return db.order.findMany({
    where: {
      restaurantId,
      OR: [
        { status: { in: [...ACTIVE_STATUSES] } },
        {
          status: "DELIVERED",
          statusHistory: { some: { status: "DELIVERED", changedAt: { gte: cutoff } } },
        },
      ],
    },
    include: { items: true, table: { select: { label: true } }, driver: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
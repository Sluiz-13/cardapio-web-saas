import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string; itemId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const item = await db.orderItem.findFirst({
    where: {
      id: params.itemId,
      order: { comandaId: params.id, restaurantId: session.user.restaurantId },
    },
    include: { order: { include: { items: true } } },
  });
  if (!item) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const removedCents = item.unitPriceCents * item.qty;
  const remainingItems = item.order.items.filter((i) => i.id !== item.id);

  await db.$transaction([
    db.orderItem.delete({ where: { id: item.id } }),
    db.order.update({
      where: { id: item.orderId },
      data: {
        totalCents: { decrement: removedCents },
        // Se era o último item do pedido, cancela o pedido — não faz sentido
        // uma comanda ter um "pedido" vazio contando na conta.
        ...(remainingItems.length === 0 ? { status: "CANCELED" as const } : {}),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
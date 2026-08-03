import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Confere que o pedido é do restaurante logado antes de devolver qualquer coisa.
  const order = await db.order.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    select: { id: true },
  });
  if (!order) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const history = await db.orderStatusHistory.findMany({
    where: { orderId: params.id },
    orderBy: { changedAt: "asc" },
  });

  return NextResponse.json(history);
}
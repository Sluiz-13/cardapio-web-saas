import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const table = await db.table.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (!table) return NextResponse.json({ error: "não encontrada" }, { status: 404 });

  // Se já existe comanda aberta nessa mesa, pega nome/telefone do primeiro
  // pedido dela — assim o garçom não precisa perguntar de novo a cada
  // rodada nova, só na primeira vez que a mesa abre a conta.
  const openComanda = await db.comanda.findFirst({
    where: { tableId: params.id, status: "OPEN" },
    include: {
      orders: {
        select: { customerName: true, customerPhone: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  const existingCustomer = openComanda?.orders[0]
    ? { name: openComanda.orders[0].customerName, phone: openComanda.orders[0].customerPhone }
    : null;

  return NextResponse.json({ id: table.id, label: table.label, existingCustomer });
}
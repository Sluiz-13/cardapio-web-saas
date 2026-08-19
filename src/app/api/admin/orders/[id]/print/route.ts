import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { buildReceiptEscPos } from "@/lib/receipt-builder";

// Endpoint genérico de impressão: qualquer método (RawBT, Agent via TCP, ou
// um botão manual de "reimprimir") passa por aqui. Ele é a única porta de
// entrada que sabe montar o cupom E marcar printedAt — assim nenhum método
// de impressão duplica essa lógica. Devolve o mesmo cupom em 2 formatos:
// base64 (pro link do RawBT) e hex (pro plugin de socket TCP do Agent).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const order = await db.order.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    include: { items: true, restaurant: { select: { name: true } } },
  });
  if (!order) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const bytes = buildReceiptEscPos(order);
  const rawbtUrl = `rawbt:base64,${bytes.toString("base64")}`;
  const hex = bytes.toString("hex");

  await db.order.update({
    where: { id: order.id },
    data: { printedAt: new Date() },
  });

  return NextResponse.json({ rawbtUrl, hex });
}
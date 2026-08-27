import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { buildComandaReceiptEscPos } from "@/lib/receipt-builder";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const comanda = await db.comanda.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    include: {
      table: { select: { label: true } },
      restaurant: { select: { name: true } },
      orders: {
        select: {
          customerName: true,
          totalCents: true,
          items: { select: { productName: true, qty: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!comanda) return NextResponse.json({ error: "não encontrada" }, { status: 404 });

  const bytes = buildComandaReceiptEscPos(comanda);
  const rawbtUrl = `rawbt:base64,${bytes.toString("base64")}`;
  const hex = bytes.toString("hex");

  return NextResponse.json({ rawbtUrl, hex });
}
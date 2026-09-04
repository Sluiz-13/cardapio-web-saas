import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const closeSchema = z.object({
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = closeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Escolha a forma de pagamento." }, { status: 400 });
  }

  const comanda = await db.comanda.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    include: { orders: { where: { status: { not: "CANCELED" } } } },
  });
  if (!comanda) return NextResponse.json({ error: "não encontrada" }, { status: 404 });
  if (comanda.status === "CLOSED") {
    return NextResponse.json({ error: "Essa comanda já está fechada." }, { status: 409 });
  }

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { serviceFeePercent: true },
  });
  const pct = restaurant?.serviceFeePercent ?? 0;
  const baseTotalCents = comanda.orders.reduce((s, o) => s + o.totalCents, 0);
  const feeCents = pct > 0 ? Math.round((baseTotalCents * pct) / 100) : 0;

  await db.$transaction(async (tx) => {
    if (feeCents > 0) {
      await tx.order.create({
        data: {
          restaurantId: session.user.restaurantId,
          customerName: `Taxa de serviço (${pct}%)`,
          deliveryType: "DINE_IN",
          paymentMethod: parsed.data.paymentMethod,
          tableId: comanda.tableId,
          comandaId: comanda.id,
          totalCents: feeCents,
          status: "DELIVERED",
          paymentConfirmed: true,
          items: {
            create: {
              productName: `Taxa de serviço (${pct}%)`,
              unitPriceCents: feeCents,
              qty: 1,
            },
          },
          statusHistory: { create: { status: "DELIVERED" } },
        },
      });
    }

    await tx.comanda.update({
      where: { id: params.id },
      data: { status: "CLOSED", closedAt: new Date(), paymentMethod: parsed.data.paymentMethod },
    });
  });

  return NextResponse.json({ ok: true, feeCents });
}
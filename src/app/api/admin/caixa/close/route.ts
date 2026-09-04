import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const bodySchema = z.object({
  closingAmountCents: z.number().int().nonnegative(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const cashSession = await db.cashSession.findFirst({
    where: { restaurantId: session.user.restaurantId, status: "OPEN" },
    include: { movements: true },
  });
  if (!cashSession) return NextResponse.json({ error: "Nenhum caixa aberto." }, { status: 400 });

  const orders = await db.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      status: { not: "CANCELED" },
      paymentConfirmed: true,
      paymentMethod: "CASH",
      createdAt: { gte: cashSession.openedAt },
    },
    select: { totalCents: true },
  });
  const cashSales = orders.reduce((s, o) => s + o.totalCents, 0);

  const sangrias = cashSession.movements.filter((m) => m.type === "SANGRIA").reduce((s, m) => s + m.amountCents, 0);
  const suprimentos = cashSession.movements
    .filter((m) => m.type === "SUPRIMENTO")
    .reduce((s, m) => s + m.amountCents, 0);
  const expectedAmountCents = cashSession.openingAmountCents + cashSales + suprimentos - sangrias;

  const updated = await db.cashSession.update({
    where: { id: cashSession.id },
    data: {
      status: "CLOSED",
      closedById: session.user.id,
      closedAt: new Date(),
      closingAmountCents: parsed.data.closingAmountCents,
      expectedAmountCents,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json({
    ...updated,
    differenceCents: parsed.data.closingAmountCents - expectedAmountCents,
  });
}
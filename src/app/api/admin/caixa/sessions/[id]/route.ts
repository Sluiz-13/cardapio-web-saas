import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const cashSession = await db.cashSession.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    include: {
      movements: { orderBy: { createdAt: "asc" } },
      openedBy: { select: { name: true } },
      closedBy: { select: { name: true } },
    },
  });
  if (!cashSession) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const orders = await db.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      status: { not: "CANCELED" },
      paymentConfirmed: true,
      createdAt: { gte: cashSession.openedAt, ...(cashSession.closedAt ? { lte: cashSession.closedAt } : {}) },
    },
    select: { paymentMethod: true, totalCents: true },
  });

  const byMethod: Record<string, number> = {};
  for (const o of orders) byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] ?? 0) + o.totalCents;

  return NextResponse.json({
    id: cashSession.id,
    openedAt: cashSession.openedAt,
    closedAt: cashSession.closedAt,
    openedByName: cashSession.openedBy.name,
    closedByName: cashSession.closedBy?.name ?? null,
    openingAmountCents: cashSession.openingAmountCents,
    closingAmountCents: cashSession.closingAmountCents,
    expectedAmountCents: cashSession.expectedAmountCents,
    differenceCents: (cashSession.closingAmountCents ?? 0) - (cashSession.expectedAmountCents ?? 0),
    notes: cashSession.notes,
    movements: cashSession.movements,
    byMethod,
    ordersCount: orders.length,
  });
}
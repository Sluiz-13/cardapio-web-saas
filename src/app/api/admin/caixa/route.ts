import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const openSchema = z.object({
  openingAmountCents: z.number().int().nonnegative(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const cashSession = await db.cashSession.findFirst({
    where: { restaurantId: session.user.restaurantId, status: "OPEN" },
    include: { movements: { orderBy: { createdAt: "desc" } }, openedBy: { select: { name: true } } },
  });

  if (!cashSession) return NextResponse.json({ open: false });

  const orders = await db.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      status: { not: "CANCELED" },
      paymentConfirmed: true,
      createdAt: { gte: cashSession.openedAt },
    },
    select: { paymentMethod: true, totalCents: true },
  });

  const byMethod: Record<string, number> = {};
  for (const o of orders) byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] ?? 0) + o.totalCents;

  const sangrias = cashSession.movements.filter((m) => m.type === "SANGRIA").reduce((s, m) => s + m.amountCents, 0);
  const suprimentos = cashSession.movements
    .filter((m) => m.type === "SUPRIMENTO")
    .reduce((s, m) => s + m.amountCents, 0);
  const expectedNowCents = cashSession.openingAmountCents + (byMethod["CASH"] ?? 0) + suprimentos - sangrias;

  return NextResponse.json({
    open: true,
    session: {
      id: cashSession.id,
      openingAmountCents: cashSession.openingAmountCents,
      openedAt: cashSession.openedAt,
      openedByName: cashSession.openedBy.name,
      movements: cashSession.movements,
    },
    byMethod,
    expectedNowCents,
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await db.cashSession.findFirst({
    where: { restaurantId: session.user.restaurantId, status: "OPEN" },
  });
  if (existing) return NextResponse.json({ error: "Já existe um caixa aberto." }, { status: 400 });

  const parsed = openSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const created = await db.cashSession.create({
    data: {
      restaurantId: session.user.restaurantId,
      openedById: session.user.id,
      openingAmountCents: parsed.data.openingAmountCents,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
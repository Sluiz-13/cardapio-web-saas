import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { buildRawBtIntentUrl } from "@/lib/receipt-builder";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const order = await db.order.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    include: { items: true, restaurant: { select: { name: true } } },
  });
  if (!order) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const rawbtUrl = buildRawBtIntentUrl(order);

  await db.order.update({
    where: { id: order.id },
    data: { printedAt: new Date() },
  });

  return NextResponse.json({ rawbtUrl });
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { matchDeliveryFee } from "@/lib/delivery-fee";

const bodySchema = z.object({ neighborhood: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { defaultDeliveryFeeCents: true },
  });

  const fees = await db.deliveryFee.findMany({
    where: { restaurantId: session.user.restaurantId },
    select: { neighborhood: true, feeCents: true, active: true },
  });

  const match = matchDeliveryFee(parsed.data.neighborhood, fees, restaurant?.defaultDeliveryFeeCents ?? 0);
  return NextResponse.json(match);
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { matchDeliveryFee } from "@/lib/delivery-fee";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-client-ip";

const schema = z.object({
  restaurantId: z.string().min(1),
  neighborhood: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await rateLimit(`delivery-fee:${ip}`, 30, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: parsed.data.restaurantId },
    select: { defaultDeliveryFeeCents: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const fees = await db.deliveryFee.findMany({
    where: { restaurantId: parsed.data.restaurantId },
    select: { neighborhood: true, feeCents: true },
  });

  const feeCents = matchDeliveryFee(parsed.data.neighborhood, fees, restaurant.defaultDeliveryFeeCents);
  return NextResponse.json({ feeCents });
}
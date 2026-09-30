import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveDeliveryFeeByPoint } from "@/lib/delivery-fee";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-client-ip";

const schema = z.object({
  restaurantId: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await rateLimit(`delivery-fee-point:${ip}`, 30, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });

  const match = await resolveDeliveryFeeByPoint(parsed.data.restaurantId, parsed.data.lat, parsed.data.lng);
  return NextResponse.json(match);
}
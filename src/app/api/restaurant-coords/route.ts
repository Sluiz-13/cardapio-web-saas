import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get("restaurantId");
  if (!restaurantId) return NextResponse.json({ error: "restaurantId obrigatório." }, { status: 400 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { restaurantLat: true, restaurantLng: true },
  });

  return NextResponse.json({
    lat: restaurant?.restaurantLat ?? -23.55,
    lng: restaurant?.restaurantLng ?? -46.63,
  });
}
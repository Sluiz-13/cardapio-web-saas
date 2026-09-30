import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get("restaurantId");
  if (!restaurantId) return NextResponse.json({ error: "restaurantId obrigatório." }, { status: 400 });

  const zones = await db.deliveryZone.findMany({
    where: { restaurantId },
    select: { id: true, name: true, active: true, geoJson: true },
  });
  return NextResponse.json(zones);
}
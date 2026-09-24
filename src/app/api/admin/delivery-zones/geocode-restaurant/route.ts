import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { address: true },
  });

  if (!restaurant?.address) {
    return NextResponse.json({ lat: -23.55, lng: -46.63 }); // fallback: São Paulo
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(restaurant.address)}`,
      { headers: { "User-Agent": "Menuair/1.0 (contato@menuair.com.br)" } }
    );
    const data = await res.json();
    if (data[0]) return NextResponse.json({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
  } catch {
    // falha silenciosa — cai no fallback abaixo
  }

  return NextResponse.json({ lat: -23.55, lng: -46.63 });
}
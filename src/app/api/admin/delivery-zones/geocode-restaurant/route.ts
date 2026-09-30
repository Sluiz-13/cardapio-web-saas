import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { address: true, restaurantLat: true, restaurantLng: true },
  });

  // Já cacheado — nunca chama o Nominatim de novo pra esse restaurante.
  if (restaurant?.restaurantLat != null && restaurant?.restaurantLng != null) {
    return NextResponse.json({ lat: restaurant.restaurantLat, lng: restaurant.restaurantLng });
  }

  if (!restaurant?.address) {
    return NextResponse.json({ lat: -23.55, lng: -46.63 }); // fallback: São Paulo
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(restaurant.address)}`,
      { headers: { "User-Agent": "Menuair/1.0 (contato@menuair.com.br)" } }
    );
    const data = await res.json();
    if (data[0]) {
      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      await db.restaurant.update({
        where: { id: session.user.restaurantId },
        data: { restaurantLat: lat, restaurantLng: lng },
      });
      return NextResponse.json({ lat, lng });
    }
  } catch {
    // falha silenciosa — cai no fallback abaixo
  }

  return NextResponse.json({ lat: -23.55, lng: -46.63 });
}
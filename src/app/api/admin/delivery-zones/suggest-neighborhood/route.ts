import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/session";

const schema = z.object({ lat: z.number(), lng: z.number() });

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsed.data.lat}&lon=${parsed.data.lng}&zoom=16&addressdetails=1`,
      { headers: { "User-Agent": "Menuair/1.0 (contato@menuair.com.br)" } }
    );
    const data = await res.json();
    const addr = data?.address ?? {};
    // Nominatim usa nomes diferentes dependendo da região — tenta os mais comuns.
    const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || null;
    return NextResponse.json({ neighborhood });
  } catch {
    return NextResponse.json({ neighborhood: null });
  }
}
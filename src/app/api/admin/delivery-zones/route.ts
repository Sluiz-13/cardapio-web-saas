import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const polygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

const createSchema = z.object({
  name: z.string().min(1),
  feeCents: z.number().int().nonnegative(),
  minOrderCents: z.number().int().nonnegative().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  neighborhoods: z.array(z.string()).default([]),
  geoJson: polygonSchema,
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const zones = await db.deliveryZone.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(zones);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const zone = await db.deliveryZone.create({
    data: { ...parsed.data, restaurantId: session.user.restaurantId },
  });
  return NextResponse.json(zone, { status: 201 });
}
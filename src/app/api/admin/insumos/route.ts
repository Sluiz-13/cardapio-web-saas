import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const createSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  costPerUnit: z.number().int().nonnegative(),
  currentStock: z.number().nonnegative().default(0),
  minStock: z.number().nonnegative().default(0),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const insumos = await db.insumo.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(insumos);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const insumo = await db.insumo.create({
    data: { ...parsed.data, restaurantId: session.user.restaurantId },
  });
  return NextResponse.json(insumo, { status: 201 });
}
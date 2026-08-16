import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { planAllows } from "@/lib/plan-features";

const createSchema = z.object({
  label: z.string().min(1).max(40),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { plan: true, slug: true },
  });
  if (!restaurant) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  if (!planAllows(restaurant.plan, "tableOrdering")) {
    return NextResponse.json({ error: "Recurso disponível apenas no plano Pro." }, { status: 403 });
  }

  const tables = await db.table.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ tables, restaurantSlug: restaurant.slug });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { plan: true },
  });
  if (!restaurant || !planAllows(restaurant.plan, "tableOrdering")) {
    return NextResponse.json({ error: "Recurso disponível apenas no plano Pro." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Nome da mesa inválido." }, { status: 400 });
  }

  const table = await db.table.create({
    data: { restaurantId: session.user.restaurantId, label: parsed.data.label },
  });

  return NextResponse.json(table);
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { planAllows } from "@/lib/plan-features";

// Acessível por OWNER e STAFF (garçom) — diferente das rotas /api/admin,
// que a partir de hoje bloqueiam STAFF. Aqui é justamente a área que o
// garçom PODE usar.
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { plan: true },
  });
  if (!restaurant) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  if (!planAllows(restaurant.plan, "tableOrdering")) {
    return NextResponse.json({ error: "Recurso disponível apenas no plano Pro." }, { status: 403 });
  }

  const tables = await db.table.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { createdAt: "asc" },
    include: {
      comandas: { where: { status: "OPEN" }, select: { id: true }, take: 1 },
    },
  });

  return NextResponse.json(
    tables.map((t) => ({ id: t.id, label: t.label, hasOpenComanda: t.comandas.length > 0 }))
  );
}
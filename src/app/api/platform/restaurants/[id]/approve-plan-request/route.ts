import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: params.id },
    select: { pendingPlanRequest: true },
  });
  if (!restaurant?.pendingPlanRequest) {
    return NextResponse.json({ error: "Não há solicitação pendente pra esse restaurante." }, { status: 400 });
  }

  const updated = await db.restaurant.update({
    where: { id: params.id },
    data: {
      plan: restaurant.pendingPlanRequest,
      pendingPlanRequest: null,
      pendingPlanRequestedAt: null,
    },
    select: { plan: true },
  });

  return NextResponse.json({ ok: true, plan: updated.plan });
}
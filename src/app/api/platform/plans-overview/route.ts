import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [startCount, proCount, pendingRequests] = await Promise.all([
    db.restaurant.count({ where: { plan: "START" } }),
    db.restaurant.count({ where: { plan: "PRO" } }),
    db.restaurant.findMany({
      where: { pendingPlanRequest: { not: null } },
      select: { id: true, name: true, slug: true, plan: true, pendingPlanRequest: true, pendingPlanRequestedAt: true },
      orderBy: { pendingPlanRequestedAt: "asc" },
    }),
  ]);

  return NextResponse.json({ startCount, proCount, pendingRequests });
}
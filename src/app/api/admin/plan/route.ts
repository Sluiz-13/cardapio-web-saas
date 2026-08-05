import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getNextDueDate, getDaysUntilDue } from "@/lib/billing";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: {
      plan: true,
      lastPaymentConfirmedAt: true,
      createdAt: true,
      pendingPlanRequest: true,
      pendingPlanRequestedAt: true,
    },
  });
  if (!restaurant) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const dueDate = getNextDueDate(restaurant.lastPaymentConfirmedAt, restaurant.createdAt);

  return NextResponse.json({
    plan: restaurant.plan,
    dueDate: dueDate.toISOString(),
    daysUntilDue: getDaysUntilDue(dueDate),
    pendingPlanRequest: restaurant.pendingPlanRequest,
    pendingPlanRequestedAt: restaurant.pendingPlanRequestedAt?.toISOString() ?? null,
  });
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";
import { getNextDueDate, PAYMENT_GRACE_DAYS } from "@/lib/billing";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1);

  const [
    totalRestaurants,
    newThisMonth,
    activeCount,
    inactiveCount,
    revenueThisMonth,
    revenueLastMonth,
    recentRestaurants,
  ] = await Promise.all([
    db.restaurant.count(),
    db.restaurant.count({ where: { createdAt: { gte: startOfThisMonth } } }),
    db.restaurant.count({ where: { active: true } }),
    db.restaurant.count({ where: { active: false } }),
    db.platformPayment.aggregate({
      _sum: { amountCents: true },
      where: { confirmedAt: { gte: startOfThisMonth } },
    }),
    db.platformPayment.aggregate({
      _sum: { amountCents: true },
      where: { confirmedAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    db.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, plan: true, active: true, createdAt: true, lastPaymentConfirmedAt: true },
    }),
  ]);

  const revenueThisMonthCents = revenueThisMonth._sum.amountCents ?? 0;
  const revenueLastMonthCents = revenueLastMonth._sum.amountCents ?? 0;
  const revenueGrowthPct =
    revenueLastMonthCents > 0
      ? Math.round(((revenueThisMonthCents - revenueLastMonthCents) / revenueLastMonthCents) * 100)
      : null;

  const recent = recentRestaurants.map((r) => {
    const dueDate = getNextDueDate(r.lastPaymentConfirmedAt, r.createdAt);
    const daysSincePayment = r.lastPaymentConfirmedAt
      ? (now.getTime() - r.lastPaymentConfirmedAt.getTime()) / (1000 * 60 * 60 * 24)
      : null;
    const paymentPending = daysSincePayment === null || daysSincePayment > PAYMENT_GRACE_DAYS;
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      plan: r.plan,
      active: r.active,
      dueDate: dueDate.toISOString(),
      paymentPending,
    };
  });

  return NextResponse.json({
    totalRestaurants,
    newThisMonth,
    activeCount,
    activePct: totalRestaurants > 0 ? Math.round((activeCount / totalRestaurants) * 100) : 0,
    pendingCount: inactiveCount,
    revenueThisMonthCents,
    revenueGrowthPct,
    recentRestaurants: recent,
  });
}
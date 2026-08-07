import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";
import { getNextDueDate, PAYMENT_GRACE_DAYS } from "@/lib/billing";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();

  const [payments, overdueCandidates] = await Promise.all([
    db.platformPayment.findMany({
      orderBy: { confirmedAt: "desc" },
      take: 20,
      include: { restaurant: { select: { name: true } } },
    }),
    db.restaurant.findMany({
      where: { active: true },
      select: { id: true, name: true, createdAt: true, lastPaymentConfirmedAt: true },
    }),
  ]);

  // Últimos 6 meses de receita, agrupado por mês (feito em memória — volume baixo).
  const monthsBack = 6;
  const monthlyRevenue: { month: string; totalCents: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    monthlyRevenue.push({
      month: start.toISOString().slice(0, 7),
      totalCents: 0,
      start,
      end,
    } as any);
  }

  const allPaymentsForChart = await db.platformPayment.findMany({
    where: { confirmedAt: { gte: monthlyRevenue[0].start as any } },
    select: { amountCents: true, confirmedAt: true },
  });

  for (const bucket of monthlyRevenue as any[]) {
    bucket.totalCents = allPaymentsForChart
      .filter((p) => p.confirmedAt >= bucket.start && p.confirmedAt < bucket.end)
      .reduce((sum, p) => sum + p.amountCents, 0);
    delete bucket.start;
    delete bucket.end;
  }

  const overdue = overdueCandidates
    .map((r) => {
      const dueDate = getNextDueDate(r.lastPaymentConfirmedAt, r.createdAt);
      const daysSincePayment = r.lastPaymentConfirmedAt
        ? (now.getTime() - r.lastPaymentConfirmedAt.getTime()) / (1000 * 60 * 60 * 24)
        : null;
      const paymentPending = daysSincePayment === null || daysSincePayment > PAYMENT_GRACE_DAYS;
      return { id: r.id, name: r.name, dueDate: dueDate.toISOString(), paymentPending };
    })
    .filter((r) => r.paymentPending);

  return NextResponse.json({
    monthlyRevenue,
    recentPayments: payments.map((p) => ({
      id: p.id,
      restaurantName: p.restaurant.name,
      amountCents: p.amountCents,
      confirmedAt: p.confirmedAt.toISOString(),
    })),
    overdue,
  });
}
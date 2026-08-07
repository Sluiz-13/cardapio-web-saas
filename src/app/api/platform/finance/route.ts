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

  // Últimos 6 meses, um bucket por mês, com o range de datas guardado
  // separado do que vai pra resposta (evita misturar tipo "interno" com
  // o formato final que o front espera).
  const monthsBack = 6;
  const buckets = Array.from({ length: monthsBack }, (_, idx) => {
    const i = monthsBack - 1 - idx;
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    return { month: start.toISOString().slice(0, 7), start, end };
  });

  const earliestStart = buckets[0].start;
  const paymentsForChart = await db.platformPayment.findMany({
    where: { confirmedAt: { gte: earliestStart } },
    select: { amountCents: true, confirmedAt: true },
  });

  const monthlyRevenue = buckets.map((bucket) => ({
    month: bucket.month,
    totalCents: paymentsForChart
      .filter((p) => p.confirmedAt >= bucket.start && p.confirmedAt < bucket.end)
      .reduce((sum, p) => sum + p.amountCents, 0),
  }));

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
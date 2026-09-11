import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";
import { computeChargeAmount } from "@/lib/plan-billing";
import { resolveDueDate, BILLING_CYCLE_DAYS } from "@/lib/billing";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: params.id },
    select: { plan: true, welcomeCouponCode: true, lastPaymentConfirmedAt: true, nextDueDate: true, createdAt: true },
  });
  if (!restaurant) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isFirstCharge = restaurant.lastPaymentConfirmedAt === null;
  const coupon =
    isFirstCharge && restaurant.welcomeCouponCode
      ? await db.platformCoupon.findUnique({ where: { code: restaurant.welcomeCouponCode } })
      : null;

  const { amountCents } = computeChargeAmount(restaurant.plan, isFirstCharge, coupon);

  // Avança a partir do vencimento ATUAL (fixo ou calculado), não de "hoje" —
  // isso é o que mantém o dia de vencimento fixo, mesmo se o pagamento
  // for confirmado atrasado ou adiantado.
  const currentDue = resolveDueDate(restaurant);
  const newDueDate = new Date(currentDue);
  newDueDate.setDate(newDueDate.getDate() + BILLING_CYCLE_DAYS);

  await db.$transaction([
    db.restaurant.update({
      where: { id: params.id },
      data: { lastPaymentConfirmedAt: new Date(), nextDueDate: newDueDate },
    }),
    db.platformPayment.create({ data: { restaurantId: params.id, amountCents } }),
  ]);

  return NextResponse.json({ ok: true, amountCents });
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";
import { computeChargeAmount } from "@/lib/plan-billing";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: params.id },
    select: { plan: true, welcomeCouponCode: true, lastPaymentConfirmedAt: true },
  });
  if (!restaurant) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isFirstCharge = restaurant.lastPaymentConfirmedAt === null;
  const coupon =
    isFirstCharge && restaurant.welcomeCouponCode
      ? await db.platformCoupon.findUnique({ where: { code: restaurant.welcomeCouponCode } })
      : null;

  const { amountCents } = computeChargeAmount(restaurant.plan, isFirstCharge, coupon);

  await db.$transaction([
    db.restaurant.update({ where: { id: params.id }, data: { lastPaymentConfirmedAt: new Date() } }),
    db.platformPayment.create({ data: { restaurantId: params.id, amountCents } }),
  ]);

  return NextResponse.json({ ok: true, amountCents });
}
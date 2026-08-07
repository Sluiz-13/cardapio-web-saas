import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";
import { generatePixPayload } from "@/lib/pix";
import { computeChargeAmount } from "@/lib/plan-billing";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [settings, restaurant] = await Promise.all([
    db.platformSettings.findUnique({ where: { id: "singleton" } }),
    db.restaurant.findUnique({
      where: { id: params.id },
      select: { slug: true, plan: true, welcomeCouponCode: true, lastPaymentConfirmedAt: true },
    }),
  ]);

  if (!restaurant) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!settings?.pixKey) {
    return NextResponse.json(
      { error: "Configure sua chave Pix em /platform/configuracoes antes de gerar cobrança." },
      { status: 400 }
    );
  }

  const isFirstCharge = restaurant.lastPaymentConfirmedAt === null;
  const coupon =
    isFirstCharge && restaurant.welcomeCouponCode
      ? await db.platformCoupon.findUnique({ where: { code: restaurant.welcomeCouponCode } })
      : null;

  const { amountCents, fullPriceCents, discountApplied } = computeChargeAmount(restaurant.plan, isFirstCharge, coupon);

  const payload = generatePixPayload({
    pixKey: settings.pixKey,
    pixKeyType: settings.pixKeyType,
    merchantName: settings.pixMerchantName ?? "CARDAPIO SAAS",
    merchantCity: settings.pixMerchantCity ?? "BRASIL",
    amountCents,
    txid: restaurant.slug,
  });

  return NextResponse.json({ payload, amountCents, fullPriceCents, discountApplied, plan: restaurant.plan });
}
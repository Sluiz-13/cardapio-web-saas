import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";
import { generatePixPayload } from "@/lib/pix";
import { PLAN_PRICE_CENTS } from "@/lib/plan-pricing";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [settings, restaurant] = await Promise.all([
    db.platformSettings.findUnique({ where: { id: "singleton" } }),
    db.restaurant.findUnique({
      where: { id: params.id },
      select: { slug: true, name: true, plan: true, welcomeCouponCode: true, lastPaymentConfirmedAt: true },
    }),
  ]);

  if (!restaurant) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!settings?.pixKey) {
    return NextResponse.json(
      { error: "Configure sua chave Pix em /platform/configuracoes antes de gerar cobrança." },
      { status: 400 }
    );
  }

  const fullPriceCents = PLAN_PRICE_CENTS[restaurant.plan];
  let amountCents = fullPriceCents;
  let discountApplied = false;

  // Cupom de boas-vindas só vale enquanto o restaurante nunca pagou ainda.
  const isFirstCharge = restaurant.lastPaymentConfirmedAt === null;
  if (isFirstCharge && restaurant.welcomeCouponCode) {
    const coupon = await db.platformCoupon.findUnique({ where: { code: restaurant.welcomeCouponCode } });
    if (coupon?.active && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
      const discountCents =
        coupon.discountType === "PERCENTAGE"
          ? Math.round((fullPriceCents * coupon.discountValue) / 100)
          : coupon.discountValue;
      amountCents = Math.max(0, fullPriceCents - discountCents);
      discountApplied = true;
    }
  }

  const payload = generatePixPayload({
    pixKey: settings.pixKey,
    pixKeyType: settings.pixKeyType,
    merchantName: settings.pixMerchantName ?? "CARDAPIO SAAS",
    merchantCity: settings.pixMerchantCity ?? "BRASIL",
    amountCents,
    txid: restaurant.slug,
  });

  return NextResponse.json({
    payload,
    amountCents,
    fullPriceCents,
    discountApplied,
    plan: restaurant.plan,
  });
}
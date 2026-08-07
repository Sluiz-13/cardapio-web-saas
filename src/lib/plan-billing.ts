import type { Plan, PlatformCoupon } from "@prisma/client";
import { PLAN_PRICE_CENTS } from "./plan-pricing";

export function computeChargeAmount(
  plan: Plan,
  isFirstCharge: boolean,
  coupon: PlatformCoupon | null
): { amountCents: number; fullPriceCents: number; discountApplied: boolean } {
  const fullPriceCents = PLAN_PRICE_CENTS[plan];

  if (isFirstCharge && coupon?.active && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
    const discountCents =
      coupon.discountType === "PERCENTAGE"
        ? Math.round((fullPriceCents * coupon.discountValue) / 100)
        : coupon.discountValue;
    return { amountCents: Math.max(0, fullPriceCents - discountCents), fullPriceCents, discountApplied: true };
  }

  return { amountCents: fullPriceCents, fullPriceCents, discountApplied: false };
}
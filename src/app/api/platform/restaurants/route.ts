import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";

const createRestaurantSchema = z.object({
  restaurantName: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
  plan: z.enum(["START", "PRO"]).default("START"),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createRestaurantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { restaurantName, slug, ownerName, ownerEmail, ownerPassword, plan, couponCode } = parsed.data;

  const [slugTaken, emailTaken] = await Promise.all([
    db.restaurant.findUnique({ where: { slug } }),
    db.adminUser.findUnique({ where: { email: ownerEmail } }),
  ]);
  if (slugTaken) {
    return NextResponse.json({ error: "Esse slug já está em uso por outro restaurante." }, { status: 409 });
  }
  if (emailTaken) {
    return NextResponse.json({ error: "Esse e-mail já está em uso por outro admin." }, { status: 409 });
  }

  let normalizedCouponCode: string | undefined;
  if (couponCode?.trim()) {
    normalizedCouponCode = couponCode.trim().toUpperCase();
    const coupon = await db.platformCoupon.findUnique({ where: { code: normalizedCouponCode } });
    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Cupom inválido ou inativo." }, { status: 400 });
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: "Cupom expirado." }, { status: 400 });
    }
    if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
      return NextResponse.json({ error: "Cupom esgotado." }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  const restaurant = await db.$transaction(async (tx) => {
    const created = await tx.restaurant.create({
      data: {
        name: restaurantName,
        slug,
        plan,
        isOpen: true,
        active: true,
        welcomeCouponCode: normalizedCouponCode,
      },
    });
    await tx.adminUser.create({
      data: {
        restaurantId: created.id,
        name: ownerName,
        email: ownerEmail,
        passwordHash,
        role: "OWNER",
      },
    });
    if (normalizedCouponCode) {
      await tx.platformCoupon.update({
        where: { code: normalizedCouponCode },
        data: { usageCount: { increment: 1 } },
      });
    }
    return created;
  });

  return NextResponse.json({ id: restaurant.id, slug: restaurant.slug }, { status: 201 });
}
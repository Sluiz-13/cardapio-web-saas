import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";

const createCouponSchema = z.object({
  code: z.string().min(3).transform((v) => v.trim().toUpperCase()),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().int().positive(),
  maxUsage: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const coupons = await db.platformCoupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createCouponSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.platformCoupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) return NextResponse.json({ error: "Já existe um cupom com esse código." }, { status: 409 });

  const coupon = await db.platformCoupon.create({
    data: {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    },
  });
  return NextResponse.json(coupon, { status: 201 });
}
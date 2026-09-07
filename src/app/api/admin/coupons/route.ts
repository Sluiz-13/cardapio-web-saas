import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().int().positive(),
  minOrderCents: z.number().int().nonnegative().optional(),
  maxUsage: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  productId: z.string().optional(),
  oncePerCustomer: z.boolean().optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const coupons = await db.coupon.findMany({
    where: { restaurantId: session.user.restaurantId },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createCouponSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.discountType === "PERCENTAGE" && parsed.data.discountValue > 100) {
    return NextResponse.json({ error: "Desconto percentual não pode passar de 100." }, { status: 400 });
  }

  try {
    const coupon = await db.coupon.create({
      data: {
        ...parsed.data,
        code: parsed.data.code.trim().toUpperCase(),
        restaurantId: session.user.restaurantId,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      },
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Já existe um cupom com esse código." }, { status: 400 });
  }
}
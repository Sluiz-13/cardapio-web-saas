import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const createProductSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
  removableOptions: z.array(z.string()).default([]),
  extraOptions: z.array(z.object({ name: z.string(), priceCents: z.number().int().nonnegative() })).default([]),
  availableDays: z.array(z.number().int().min(0).max(6)).default([]),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const products = await db.product.findMany({
    where: { restaurantId: session.user.restaurantId },
    include: { category: true, removableOptions: true, extraOptions: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createProductSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { removableOptions, extraOptions, ...data } = parsed.data;

  const category = await db.category.findFirst({
    where: { id: data.categoryId, restaurantId: session.user.restaurantId },
  });
  if (!category) return NextResponse.json({ error: "categoria inválida" }, { status: 400 });

  const product = await db.product.create({
    data: {
      ...data,
      restaurantId: session.user.restaurantId,
      removableOptions: { create: removableOptions.map((name) => ({ name })) },
      extraOptions: { create: extraOptions },
    },
    include: { removableOptions: true, extraOptions: true },
  });
  return NextResponse.json(product, { status: 201 });
}
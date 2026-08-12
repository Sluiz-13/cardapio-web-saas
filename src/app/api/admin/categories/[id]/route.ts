import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  order: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateCategorySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await db.category.updateMany({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    data: parsed.data,
  });
  if (result.count === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const category = await db.category.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (!category) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const productCount = await db.product.count({ where: { categoryId: params.id } });
  if (productCount > 0) {
    return NextResponse.json(
      {
        error: `Essa categoria tem ${productCount} produto${productCount > 1 ? "s" : ""}. Mova ou exclua ${productCount > 1 ? "eles" : "ele"} antes de excluir a categoria.`,
      },
      { status: 409 }
    );
  }

  await db.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
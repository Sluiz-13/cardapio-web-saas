import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().positive().optional(),
  imageUrl: z
    .string()
    .refine((val) => val === "" || val.startsWith("/") || /^https?:\/\//.test(val), {
      message: "URL de imagem inválida",
    })
    .optional(),
  active: z.boolean().optional(),
  categoryId: z.string().optional(),
  removableOptions: z.array(z.string()).optional(),
  extraOptions: z.array(z.object({ name: z.string(), priceCents: z.number().int().nonnegative() })).optional(),
  availableDays: z.array(z.number().int().min(0).max(6)).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateProductSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { removableOptions, extraOptions, ...data } = parsed.data;

  // Confirma que o produto é do restaurante logado ANTES de mexer em qualquer coisa.
  const existing = await db.product.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (!existing) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  // Se trocou de categoria, garante que a nova categoria também é do mesmo restaurante.
  if (data.categoryId) {
    const category = await db.category.findFirst({
      where: { id: data.categoryId, restaurantId: session.user.restaurantId },
    });
    if (!category) return NextResponse.json({ error: "categoria inválida" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id: params.id }, data });

    if (removableOptions) {
      await tx.productRemovable.deleteMany({ where: { productId: params.id } });
      await tx.productRemovable.createMany({
        data: removableOptions.map((name) => ({ productId: params.id, name })),
      });
    }

    if (extraOptions) {
      await tx.productExtra.deleteMany({ where: { productId: params.id } });
      await tx.productExtra.createMany({
        data: extraOptions.map((e) => ({ productId: params.id, name: e.name, priceCents: e.priceCents })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await db.product.deleteMany({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (result.count === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
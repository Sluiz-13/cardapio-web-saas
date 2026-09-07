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
  maxAccompaniments: z.number().int().positive().nullable().optional(),
  optionGroups: z
    .array(
      z.object({
        name: z.string().min(1),
        minSelect: z.number().int().min(0).default(0),
        maxSelect: z.number().int().positive().nullable().optional(),
        pricingStyle: z.enum(["SUM", "FIXED", "HIGHEST"]).default("SUM"),
        fixedPriceCents: z.number().int().nonnegative().nullable().optional(),
        order: z.number().int().default(0),
        items: z.array(z.object({ name: z.string().min(1), priceCents: z.number().int().nonnegative(), order: z.number().int().default(0) })),
      })
    )
    .optional(),
  availableDays: z.array(z.number().int().min(0).max(6)).optional(),
  visibleToCustomer: z.boolean().optional(),
  visibleToStaff: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateProductSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { removableOptions, extraOptions, optionGroups, ...data } = parsed.data;

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

    if (optionGroups) {
      // Grupos têm itens aninhados — createMany não suporta relação aninhada,
      // então cria grupo por grupo (cada um já com seus itens dentro).
      await tx.productOptionGroup.deleteMany({ where: { productId: params.id } });
      for (const group of optionGroups) {
        await tx.productOptionGroup.create({
          data: { ...group, productId: params.id, items: { create: group.items } },
        });
      }
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
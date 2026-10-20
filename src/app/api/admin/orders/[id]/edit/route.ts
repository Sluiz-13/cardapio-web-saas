import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { resolveDeliveryFee } from "@/lib/delivery-fee";

const addressSchema = z.object({
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  referenceNote: z.string().optional(),
});

const editSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8).optional().or(z.literal("")),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]).optional(),
  address: addressSchema.optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().positive(),
        removedItems: z.array(z.string()).default([]),
        extraNames: z.array(z.string()).default([]),
        selectedGroupOptions: z
          .array(z.object({ groupId: z.string().min(1), itemIds: z.array(z.string().min(1)) }))
          .default([]),
      })
    )
    .min(1),
});

const LOCKED_STATUSES = ["DELIVERED", "CANCELED"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const order = await db.order.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      paymentMethod: true,
      deliveryType: true,
      status: true,
      street: true,
      number: true,
      complement: true,
      neighborhood: true,
      city: true,
      referenceNote: true,
      items: {
        select: {
          productId: true,
          productName: true,
          unitPriceCents: true,
          qty: true,
          removedItems: true,
          extras: true,
          selectedOptions: true,
        },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  return NextResponse.json({ ...order, editable: !LOCKED_STATUSES.includes(order.status) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = editSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const restaurantId = session.user.restaurantId;
  const { customerName, address, paymentMethod, items } = parsed.data;
  const customerPhone = parsed.data.customerPhone?.trim() || null;

  const existing = await db.order.findFirst({
    where: { id: params.id, restaurantId },
    include: { items: true },
  });
  if (!existing) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (LOCKED_STATUSES.includes(existing.status)) {
    return NextResponse.json({ error: "Pedido já entregue ou cancelado — não pode mais ser editado." }, { status: 400 });
  }

  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, restaurantId, active: true },
    include: {
      extraOptions: true,
      category: { select: { name: true } },
      optionGroups: { include: { items: true } },
      recipeItems: true,
    },
  });
  if (products.length !== new Set(productIds).size) {
    return NextResponse.json({ error: "Um ou mais produtos são inválidos." }, { status: 400 });
  }

  let groupValidationError: string | null = null;
  let itemsSubtotalCents = 0;

  const newItemsData = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const extras = item.extraNames
      .map((name) => product.extraOptions.find((e) => e.name === name))
      .filter((e): e is { name: string; priceCents: number; id: string; productId: string } => !!e);
    const extrasTotal = extras.reduce((s, e) => s + e.priceCents, 0);

    let groupsTotal = 0;
    const selectedOptions = product.optionGroups
      .map((group) => {
        const selected = item.selectedGroupOptions.find((s) => s.groupId === group.id);
        const itemIds = selected?.itemIds ?? [];
        const chosenItems = group.items.filter((gi) => itemIds.includes(gi.id));

        if (chosenItems.length < group.minSelect) groupValidationError = `Escolha pelo menos ${group.minSelect} em "${group.name}".`;
        if (group.maxSelect !== null && chosenItems.length > group.maxSelect) groupValidationError = `Máximo de ${group.maxSelect} em "${group.name}".`;
        if (chosenItems.length !== itemIds.length) groupValidationError = `Opção inválida em "${group.name}".`;
        if (chosenItems.length === 0) return null;

        const chargedCents =
          group.pricingStyle === "FIXED"
            ? group.fixedPriceCents ?? 0
            : group.pricingStyle === "HIGHEST"
            ? Math.max(...chosenItems.map((i) => i.priceCents))
            : chosenItems.reduce((s, i) => s + i.priceCents, 0);
        groupsTotal += chargedCents;

        return {
          groupName: group.name,
          pricingStyle: group.pricingStyle,
          chargedCents,
          items: chosenItems.map((i) => ({ name: i.name, priceCents: i.priceCents })),
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);

    const unitPriceCents = product.priceCents + extrasTotal + groupsTotal;
    itemsSubtotalCents += unitPriceCents * item.qty;

    return {
      productId: product.id,
      productName: product.name,
      categoryName: product.category?.name ?? null,
      unitPriceCents,
      qty: item.qty,
      removedItems: item.removedItems,
      extras: extras.map((e) => ({ name: e.name, priceCents: e.priceCents })),
      selectedOptions,
      recipeItems: product.recipeItems,
    };
  });

  if (groupValidationError) return NextResponse.json({ error: groupValidationError }, { status: 400 });

  // Taxa de entrega: recalcula só se o pedido é de entrega — usa o bairro
  // novo (se endereço foi alterado) pra achar a taxa certa. resolveDeliveryFee
  // já decide sozinho se usa zona (mapa) ou a lista simples de bairro,
  // dependendo do que o restaurante tiver configurado.
  let deliveryFeeCents = existing.deliveryFeeCents;
  if (existing.deliveryType === "DELIVERY" && address) {
    const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId }, select: { defaultDeliveryFeeCents: true } });
    const match = await resolveDeliveryFee(restaurantId, address.neighborhood, restaurant?.defaultDeliveryFeeCents ?? 0);
    if (!match.disabled) deliveryFeeCents = match.feeCents;
  }

  // Fidelidade/cashback aplicados na criação ficam congelados — só o valor
  // dos itens e da entrega muda com a edição.
  const totalCents = Math.max(
    itemsSubtotalCents - existing.discountCents - existing.loyaltyDiscountCents + deliveryFeeCents - existing.cashbackUsedCents,
    0
  );

  await db.$transaction(async (tx) => {
    // Devolve pro estoque tudo que tinha sido baixado pelos itens ANTIGOS.
    for (const oldItem of existing.items) {
      const product = await tx.product.findUnique({
        where: { id: oldItem.productId ?? "" },
        include: { recipeItems: true },
      });
      if (!product) continue;
      for (const recipeItem of product.recipeItems) {
        const restore = recipeItem.quantity * oldItem.qty;
        await tx.insumo.update({ where: { id: recipeItem.insumoId }, data: { currentStock: { increment: restore } } });
        await tx.stockMovement.create({
          data: { insumoId: recipeItem.insumoId, type: "AJUSTE", quantity: restore, note: "Edição de pedido — reverte itens antigos", orderId: existing.id },
        });
      }
    }

    // Apaga os itens antigos e recria com os novos.
    await tx.orderItem.deleteMany({ where: { orderId: existing.id } });
    await tx.orderItem.createMany({
      data: newItemsData.map((i) => ({
        orderId: existing.id,
        productId: i.productId,
        productName: i.productName,
        categoryName: i.categoryName,
        unitPriceCents: i.unitPriceCents,
        qty: i.qty,
        removedItems: i.removedItems,
        extras: i.extras,
        selectedOptions: i.selectedOptions,
      })),
    });

    // Baixa estoque dos itens NOVOS.
    for (const newItem of newItemsData) {
      for (const recipeItem of newItem.recipeItems) {
        const deduct = recipeItem.quantity * newItem.qty;
        await tx.insumo.update({ where: { id: recipeItem.insumoId }, data: { currentStock: { decrement: deduct } } });
        await tx.stockMovement.create({
          data: { insumoId: recipeItem.insumoId, type: "SAIDA_VENDA", quantity: deduct, orderId: existing.id },
        });
      }
    }

    await tx.order.update({
      where: { id: existing.id },
      data: {
        customerName,
        customerPhone,
        paymentMethod: paymentMethod ?? existing.paymentMethod,
        ...(existing.deliveryType === "DELIVERY" && address ? address : {}),
        deliveryFeeCents,
        totalCents,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
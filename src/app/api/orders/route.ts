import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notificationsClient } from "@/lib/notifications-client";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-client-ip";
import { matchDeliveryFee } from "@/lib/delivery-fee";
import { generatePixPayload } from "@/lib/pix";

const addressSchema = z.object({
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  zipCode: z.string().optional(),
  referenceNote: z.string().optional(),
});

const createOrderSchema = z
  .object({
    restaurantId: z.string().min(1),
    customerName: z.string().min(2),
    customerPhone: z.string().min(8),
    deliveryType: z.enum(["DELIVERY", "PICKUP", "DINE_IN"]).default("DELIVERY"),
    paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]),
    address: addressSchema.optional(),
    tableId: z.string().optional(),
    couponCode: z.string().optional(),
    changeForCents: z.number().int().positive().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          qty: z.number().int().positive(),
          removedItems: z.array(z.string()).default([]),
          extraNames: z.array(z.string()).default([]),
        })
      )
      .min(1),
  })
  .refine((data) => data.deliveryType !== "DELIVERY" || !!data.address, {
    message: "Endereço é obrigatório para pedidos com entrega.",
    path: ["address"],
  })
  .refine((data) => data.deliveryType !== "DINE_IN" || !!data.tableId, {
    message: "Mesa é obrigatória para pedidos feitos na mesa.",
    path: ["tableId"],
  });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await rateLimit(`orders:${ip}`, 5, 5 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  const parsed = createOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const {
    restaurantId,
    customerName,
    customerPhone,
    deliveryType,
    paymentMethod,
    address,
    tableId,
    couponCode,
    changeForCents,
    items,
  } = parsed.data;

  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, restaurantId, active: true },
    include: { extraOptions: true },
  });

  if (products.length !== new Set(productIds).size) {
    return NextResponse.json({ error: "Um ou mais produtos são inválidos." }, { status: 400 });
  }

  let table: { id: string; label: string } | null = null;
  if (deliveryType === "DINE_IN" && tableId) {
    table = await db.table.findFirst({
      where: { id: tableId, restaurantId },
      select: { id: true, label: true },
    });
    if (!table) {
      return NextResponse.json({ error: "Mesa inválida." }, { status: 400 });
    }
  }

  type ProductWithExtras = (typeof products)[number];
  type ExtraOption = ProductWithExtras["extraOptions"][number];

  let subtotalCents = 0;
  const orderItemsData = items.map((item) => {
    const product = products.find((p: ProductWithExtras) => p.id === item.productId)!;
    const extras = product.extraOptions.filter((e: ExtraOption) => item.extraNames.includes(e.name));
    const extrasTotal = extras.reduce((sum: number, e: ExtraOption) => sum + e.priceCents, 0);
    const unitPriceCents = product.priceCents + extrasTotal;
    subtotalCents += unitPriceCents * item.qty;

    return {
      productId: product.id,
      productName: product.name,
      unitPriceCents,
      qty: item.qty,
      removedItems: item.removedItems,
      extras: extras.map((e: ExtraOption) => ({ name: e.name, priceCents: e.priceCents })),
    };
  });

  // Busca dados do restaurante uma única vez — serve pra taxa de entrega
  // padrão e pra gerar o QR Code Pix (se configurado).
const restaurant = await db.restaurant.findUnique({
  where: { id: restaurantId },
  select: {
    active: true,
    isOpen: true,
    defaultDeliveryFeeCents: true,
    pixKey: true,
    pixKeyType: true,
    pixMerchantName: true,
    pixMerchantCity: true,
  },
});


if (!restaurant || !restaurant.active) {
  return NextResponse.json({ error: "Restaurante indisponível no momento." }, { status: 403 });
}
if (!restaurant.isOpen) {
  return NextResponse.json({ error: "Restaurante fechado no momento." }, { status: 403 });
}

  let deliveryFeeCents = 0;
  if (deliveryType === "DELIVERY" && address) {
    const fees = await db.deliveryFee.findMany({
      where: { restaurantId },
      select: { neighborhood: true, feeCents: true },
    });
    deliveryFeeCents = matchDeliveryFee(address.neighborhood, fees, restaurant?.defaultDeliveryFeeCents ?? 0);
  }

  // Validação de cupom — sempre no servidor, nunca confia em desconto vindo do client.
  let discountCents = 0;
  let appliedCouponCode: string | undefined;

  if (couponCode) {
    const coupon = await db.coupon.findUnique({
      where: { restaurantId_code: { restaurantId, code: couponCode.trim().toUpperCase() } },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Cupom inválido." }, { status: 400 });
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: "Cupom expirado." }, { status: 400 });
    }
    if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
      return NextResponse.json({ error: "Cupom esgotado." }, { status: 400 });
    }
    if (coupon.minOrderCents && subtotalCents < coupon.minOrderCents) {
      return NextResponse.json(
        { error: `Pedido mínimo de ${(coupon.minOrderCents / 100).toFixed(2)} para usar esse cupom.` },
        { status: 400 }
      );
    }

    let baseCents = subtotalCents;
    if (coupon.productId) {
      const matchingItems = orderItemsData.filter((i) => i.productId === coupon.productId);
      if (matchingItems.length === 0) {
        return NextResponse.json({ error: "Cupom não é válido para os itens deste pedido." }, { status: 400 });
      }
      baseCents = matchingItems.reduce((sum, i) => sum + i.unitPriceCents * i.qty, 0);
    }

    discountCents =
      coupon.discountType === "PERCENTAGE"
        ? Math.round((baseCents * coupon.discountValue) / 100)
        : Math.min(coupon.discountValue, baseCents);
    appliedCouponCode = coupon.code;
  }

  const totalCents = subtotalCents - discountCents + deliveryFeeCents;

  // Troco só faz sentido pra pagamento em dinheiro, e o valor que o cliente
  // vai pagar não pode ser menor que o total do pedido.
  if (changeForCents !== undefined) {
    if (paymentMethod !== "CASH") {
      return NextResponse.json({ error: "Troco só se aplica a pagamento em dinheiro." }, { status: 400 });
    }
    if (changeForCents < totalCents) {
      return NextResponse.json(
        { error: "O valor para troco não pode ser menor que o total do pedido." },
        { status: 400 }
      );
    }
  }

  // Cartão e Pix cobrados fisicamente/manualmente pelo restaurante (sem
  // gateway integrado) — pedido confirma na hora, igual dinheiro. A diferença
  // do Pix fica só no selo "aguardando conferência" mostrado no admin.
  const confirmsImmediately = true;

  const order = await db.$transaction(async (tx) => {
    // Mesa: acha a comanda ABERTA dessa mesa, ou abre uma nova se ainda
    // não tiver nenhuma. O índice único parcial no banco (da migration)
    // garante que 2 pedidos quase simultâneos nunca criem 2 comandas
    // para a mesma mesa.
    let comandaId: string | undefined;
    if (table) {
      const openComanda = await tx.comanda.findFirst({
        where: { tableId: table.id, status: "OPEN" },
      });
      comandaId = openComanda
        ? openComanda.id
        : (await tx.comanda.create({ data: { restaurantId, tableId: table.id } })).id;
    }

    const created = await tx.order.create({
      data: {
        restaurantId,
        customerName,
        customerPhone,
        deliveryType,
        paymentMethod,
        ...(deliveryType === "DELIVERY" ? address : {}),
        tableId: table?.id,
        comandaId,
        deliveryFeeCents,
        totalCents,
        discountCents,
        couponCode: appliedCouponCode,
        changeForCents: paymentMethod === "CASH" ? changeForCents : undefined,
        paymentConfirmed: paymentMethod !== "PIX",
        status: confirmsImmediately ? "NEW" : "PENDING_PAYMENT",
        items: { create: orderItemsData },
        statusHistory: { create: { status: confirmsImmediately ? "NEW" : "PENDING_PAYMENT" } },
      },
    });

    if (appliedCouponCode) {
      await tx.coupon.update({
        where: { restaurantId_code: { restaurantId, code: appliedCouponCode } },
        data: { usageCount: { increment: 1 } },
      });
    }

    return created;
  });

  if (confirmsImmediately) {
    await notificationsClient.orderCreated({
      restaurantId,
      orderId: order.id,
      customerName,
      totalCents,
    });
  }

  // Gera o QR Code Pix só se o restaurante já cadastrou a própria chave.
  let pixPayload: string | undefined;
  if (paymentMethod === "PIX" && restaurant?.pixKey) {
    pixPayload = generatePixPayload({
      pixKey: restaurant.pixKey,
      pixKeyType: restaurant.pixKeyType,
      merchantName: restaurant.pixMerchantName ?? "RESTAURANTE",
      merchantCity: restaurant.pixMerchantCity ?? "BRASIL",
      amountCents: totalCents,
      txid: order.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25),
    });
  }

  return NextResponse.json(
    { orderId: order.id, totalCents, discountCents, deliveryFeeCents, status: order.status, pixPayload },
    { status: 201 }
  );
}
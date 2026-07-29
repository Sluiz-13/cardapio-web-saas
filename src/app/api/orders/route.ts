import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notificationsClient } from "@/lib/notifications-client";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-client-ip";

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
    deliveryType: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
    paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]),
    address: addressSchema.optional(),
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
  // Endereço só é exigido se for entrega — retirada no balcão não precisa.
  .refine((data) => data.deliveryType === "PICKUP" || !!data.address, {
    message: "Endereço é obrigatório para pedidos com entrega.",
    path: ["address"],
  });

export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
    const { allowed } = rateLimit(`orders:${ip}`, 5, 5 * 60 * 1000); // 5 pedidos a cada 5 minutos por IP
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
  const { restaurantId, customerName, customerPhone, deliveryType, paymentMethod, address, items } = parsed.data;

  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, restaurantId, active: true },
    include: { extraOptions: true },
  });

  if (products.length !== new Set(productIds).size) {
    return NextResponse.json({ error: "Um ou mais produtos são inválidos." }, { status: 400 });
  }

  type ProductWithExtras = (typeof products)[number];
  type ExtraOption = ProductWithExtras["extraOptions"][number];

  let totalCents = 0;
  const orderItemsData = items.map((item) => {
    const product = products.find((p: ProductWithExtras) => p.id === item.productId)!;
    const extras = product.extraOptions.filter((e: ExtraOption) => item.extraNames.includes(e.name));
    const extrasTotal = extras.reduce((sum: number, e: ExtraOption) => sum + e.priceCents, 0);
    const unitPriceCents = product.priceCents + extrasTotal;
    totalCents += unitPriceCents * item.qty;

    return {
      productId: product.id,
      productName: product.name,
      unitPriceCents,
      qty: item.qty,
      removedItems: item.removedItems,
      extras: extras.map((e: ExtraOption) => ({ name: e.name, priceCents: e.priceCents })),
    };
  });

  // Dinheiro na entrega não passa pelo gateway: pedido já nasce confirmado
  // pra cozinha. Qualquer outra forma de pagamento espera o webhook.
  const isCash = paymentMethod === "CASH";

  const order = await db.order.create({
    data: {
      restaurantId,
      customerName,
      customerPhone,
      deliveryType,
      paymentMethod,
      ...(deliveryType === "DELIVERY" ? address : {}),
      totalCents,
      status: isCash ? "NEW" : "PENDING_PAYMENT",
      items: { create: orderItemsData },
    },
  });

  if (isCash) {
    await notificationsClient.orderCreated({
      restaurantId,
      orderId: order.id,
      customerName,
      totalCents,
    });
  }

  // TODO próximo passo: se paymentMethod for PIX/CREDIT_CARD/DEBIT_CARD,
  // chamar o gateway aqui e devolver checkoutUrl/qrCode. A confirmação
  // definitiva continua vindo só pelo webhook em /api/payments/webhook.

  return NextResponse.json({ orderId: order.id, totalCents, status: order.status }, { status: 201 });
}
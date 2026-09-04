import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const createSchema = z.object({
  tableId: z.string().min(1).optional(),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]).optional(),
  changeForCents: z.number().int().positive().optional(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8).optional().or(z.literal("")),
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
});

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { tableId, customerName, items } = parsed.data;
  const customerPhone = parsed.data.customerPhone?.trim() || null;
  const restaurantId = session.user.restaurantId;
  const isBalcao = !tableId;

  if (!isBalcao) {
    const table = await db.table.findFirst({ where: { id: tableId, restaurantId } });
    if (!table) return NextResponse.json({ error: "Mesa inválida." }, { status: 400 });
  }
  if (isBalcao && !parsed.data.paymentMethod) {
    return NextResponse.json({ error: "Informe a forma de pagamento." }, { status: 400 });
  }

  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, restaurantId, active: true },
    include: { extraOptions: true, category: { select: { name: true } } },
  });
  if (products.length !== new Set(productIds).size) {
    return NextResponse.json({ error: "Um ou mais produtos são inválidos." }, { status: 400 });
  }

  let totalCents = 0;
  const orderItemsData = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const extras = item.extraNames
      .map((name) => product.extraOptions.find((e) => e.name === name))
      .filter((e): e is { name: string; priceCents: number; id: string; productId: string } => !!e);
    const extrasTotal = extras.reduce((s, e) => s + e.priceCents, 0);
    const unitPriceCents = product.priceCents + extrasTotal;
    totalCents += unitPriceCents * item.qty;

    return {
      productId: product.id,
      productName: product.name,
      categoryName: product.category?.name ?? null,
      unitPriceCents,
      qty: item.qty,
      removedItems: item.removedItems,
      extras: extras.map((e) => ({ name: e.name, priceCents: e.priceCents })),
    };
  });

  const order = await db.$transaction(async (tx) => {
    let comandaId: string | undefined;
    if (!isBalcao) {
      const openComanda = await tx.comanda.findFirst({ where: { tableId, status: "OPEN" } });
      comandaId = openComanda
        ? openComanda.id
        : (await tx.comanda.create({ data: { restaurantId, tableId } })).id;
    }

    return tx.order.create({
      data: {
        restaurantId,
        customerName,
        customerPhone,
        deliveryType: isBalcao ? "PICKUP" : "DINE_IN",
        // Balcão: cliente escolhe a forma de pagamento na hora, igual ao cardápio do cliente.
        // Mesa: pagamento real só acontece no fechamento da comanda.
        paymentMethod: isBalcao ? parsed.data.paymentMethod! : "CASH",
        changeForCents: isBalcao && parsed.data.paymentMethod === "CASH" ? parsed.data.changeForCents : undefined,
        tableId,
        comandaId,
        totalCents,
        status: "NEW",
        paymentConfirmed: isBalcao ? parsed.data.paymentMethod !== "PIX" : true,
        items: { create: orderItemsData },
        statusHistory: { create: { status: "NEW" } },
      },
    });
  });

  return NextResponse.json({ orderId: order.id });
}
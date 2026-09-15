import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { planAllows } from "@/lib/plan-features";

const PAID_STATUSES = ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { plan: true },
  });
  if (!restaurant) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!planAllows(restaurant.plan, "reports")) {
    return NextResponse.json({ error: "Recurso disponível apenas no plano Pro." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Parâmetros from/to obrigatórios." }, { status: 400 });
  }

  const restaurantId = session.user.restaurantId;
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);
  const periodMs = toDate.getTime() - fromDate.getTime();
  const prevFromDate = new Date(fromDate.getTime() - periodMs - 1);
  const prevToDate = new Date(fromDate.getTime() - 1);

  const [orders, prevOrders] = await Promise.all([
    db.order.findMany({
      where: { restaurantId, status: { in: [...PAID_STATUSES] }, createdAt: { gte: fromDate, lte: toDate } },
      include: { items: true },
    }),
    db.order.findMany({
      where: { restaurantId, status: { in: [...PAID_STATUSES] }, createdAt: { gte: prevFromDate, lte: prevToDate } },
      select: { totalCents: true },
    }),
  ]);

  const totalCents = orders.reduce((s, o) => s + o.totalCents, 0);
  const prevTotalCents = prevOrders.reduce((s, o) => s + o.totalCents, 0);
  const growthPct = prevTotalCents > 0 ? Math.round(((totalCents - prevTotalCents) / prevTotalCents) * 100) : null;

  const byPaymentMethod = new Map<string, number>();
  for (const o of orders) {
    byPaymentMethod.set(o.paymentMethod, (byPaymentMethod.get(o.paymentMethod) ?? 0) + o.totalCents);
  }

  const productQty = new Map<string, number>();
  for (const o of orders) {
    for (const item of o.items) {
      productQty.set(item.productName, (productQty.get(item.productName) ?? 0) + item.qty);
    }
  }
  const topProducts = Array.from(productQty.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const couponsUsed = new Map<string, number>();
  for (const o of orders) {
    if (o.couponCode) couponsUsed.set(o.couponCode, (couponsUsed.get(o.couponCode) ?? 0) + 1);
  }

  // CMV — custo dos insumos vs receita, por produto. Usa a ficha técnica
  // ATUAL (não uma foto do custo no momento da venda) — se o preço do
  // insumo mudou depois, o relatório reflete o custo de hoje.
  const productIds = Array.from(
    new Set(orders.flatMap((o) => o.items.map((i) => i.productId).filter((id): id is string => !!id)))
  );
  const productsWithRecipe = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      recipeItems: { select: { quantity: true, insumo: { select: { costPerUnit: true } } } },
    },
  });
  const unitCostByProductId = new Map(
    productsWithRecipe.map((p) => [p.id, p.recipeItems.reduce((s, r) => s + r.quantity * r.insumo.costPerUnit, 0)])
  );

  const cmvByProduct = new Map<string, { name: string; qty: number; revenueCents: number; costCents: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      if (!item.productId) continue;
      const unitCost = unitCostByProductId.get(item.productId);
      if (!unitCost) continue; // sem ficha técnica cadastrada — não entra no CMV
      const entry = cmvByProduct.get(item.productId) ?? { name: item.productName, qty: 0, revenueCents: 0, costCents: 0 };
      entry.qty += item.qty;
      entry.revenueCents += item.unitPriceCents * item.qty;
      entry.costCents += unitCost * item.qty;
      cmvByProduct.set(item.productId, entry);
    }
  }

  const cmvReport = Array.from(cmvByProduct.values())
    .map((p) => ({
      ...p,
      marginCents: p.revenueCents - p.costCents,
      marginPct: p.revenueCents > 0 ? Math.round(((p.revenueCents - p.costCents) / p.revenueCents) * 100) : 0,
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);

  const totalCmvCostCents = cmvReport.reduce((s, p) => s + p.costCents, 0);
  const totalCmvRevenueCents = cmvReport.reduce((s, p) => s + p.revenueCents, 0);

  return NextResponse.json({
    totalCents,
    ordersCount: orders.length,
    ticketMedioCents: orders.length > 0 ? Math.round(totalCents / orders.length) : 0,
    growthPct,
    byPaymentMethod: Array.from(byPaymentMethod.entries()).map(([method, cents]) => ({ method, cents })),
    topProducts,
    couponsUsed: Array.from(couponsUsed.entries()).map(([code, count]) => ({ code, count })),
    cmvReport,
    totalCmvCostCents,
    totalCmvRevenueCents,
  });
}
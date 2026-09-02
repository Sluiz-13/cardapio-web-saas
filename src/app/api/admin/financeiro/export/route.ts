import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
};

const currency = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

const DELIMITER = ";";

function csvField(value: string): string {
  if (new RegExp(`[";\n]`).test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Parâmetros from/to obrigatórios." }, { status: 400 });
  }

  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);

  const orders = await db.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      status: { in: ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] },
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "Data",
    "Hora",
    "Cliente",
    "Telefone",
    "Pagamento",
    "Itens",
    "Subtotal",
    "Desconto",
    "Cupom",
    "Taxa de Entrega",
    "Total",
  ].join(DELIMITER);

  const rows = orders.map((o) => {
    const subtotalCents = o.totalCents - o.deliveryFeeCents + o.discountCents;
    const itemsSummary = o.items.map((i) => `${i.qty}x ${i.productName}`).join(" | ");
    const createdAt = new Date(o.createdAt);

    return [
      csvField(createdAt.toLocaleDateString("pt-BR")),
      csvField(createdAt.toLocaleTimeString("pt-BR")),
      csvField(o.customerName),
      csvField(o.customerPhone ?? ""),
      csvField(PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod),
      csvField(itemsSummary),
      csvField(currency(subtotalCents)),
      csvField(currency(o.discountCents)),
      csvField(o.couponCode ?? ""),
      csvField(currency(o.deliveryFeeCents)),
      csvField(currency(o.totalCents)),
    ].join(DELIMITER);
  });

  const csv = "\uFEFF" + [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio_${from}_a_${to}.csv"`,
    },
  });
}
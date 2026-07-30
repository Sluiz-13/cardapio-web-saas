"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Clock, Printer, MapPin, Phone, Bike } from "lucide-react";

const STATUS_FLOW = ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_LABEL: Record<Status, string> = {
  NEW: "Novo",
  PREPARING: "Em Preparo",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu p/ Entrega",
  DELIVERED: "Entregue",
};

const STATUS_BORDER_COLOR: Record<Status, string> = {
  NEW: "#C1440E",
  PREPARING: "#D97706",
  READY: "#059669",
  OUT_FOR_DELIVERY: "#2563EB",
  DELIVERED: "#9CA3AF",
};

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
};

type OrderItem = { id: string; productName: string; qty: number };
type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  status: string;
  totalCents: number;
  createdAt: string | Date;
  items: OrderItem[];
  deliveryType: "DELIVERY" | "PICKUP";
  paymentMethod: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

function isBoardStatus(status: string): status is Status {
  return (STATUS_FLOW as readonly string[]).includes(status);
}

/**
 * Retirada no balcão (PICKUP) não passa por "Saiu para entrega" — não faz
 * sentido pro fluxo. Essa função calcula o próximo status pulando essa
 * etapa quando necessário, em vez de simplesmente pegar o próximo item
 * da lista.
 */
function getNextStatus(order: Order): Status | null {
  if (!isBoardStatus(order.status)) return null;
  const idx = STATUS_FLOW.indexOf(order.status);
  let next = STATUS_FLOW[idx + 1];
  if (next === "OUT_FOR_DELIVERY" && order.deliveryType === "PICKUP") {
    next = STATUS_FLOW[idx + 2];
  }
  return next ?? null;
}

function getNextActionLabel(order: Order): string {
  if (!isBoardStatus(order.status)) return "";
  switch (order.status) {
    case "NEW":
      return "Iniciar preparo";
    case "PREPARING":
      return "Marcar pronto";
    case "READY":
      return order.deliveryType === "DELIVERY" ? "Saiu para entrega" : "Marcar entregue";
    case "OUT_FOR_DELIVERY":
      return "Marcar entregue";
    default:
      return "";
  }
}

export default function OrdersBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);

  async function advance(order: Order) {
    const next = getNextStatus(order);
    if (!next) return;

    setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: next } : o)));

    const res = await fetch(`/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: order.status } : o)));
    }
  }

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {STATUS_FLOW.map((status) => (
        <div key={status}>
          <p className="text-xs uppercase tracking-wide font-semibold mb-2.5 flex items-center gap-1.5 text-gray-500">
            {status === "NEW" && <Flame size={13} className="text-chili" />}
            {status === "PREPARING" && <Clock size={13} className="text-amber-500" />}
            {status === "OUT_FOR_DELIVERY" && <Bike size={13} className="text-blue-500" />}
            {STATUS_LABEL[status]}
            <span className="text-gray-400 font-normal">({orders.filter((o) => o.status === status).length})</span>
          </p>
          <div className="space-y-3">
            {orders
              .filter((o) => o.status === status)
              .map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl bg-white shadow-sm border-l-4 p-3.5"
                  style={{ borderLeftColor: STATUS_BORDER_COLOR[status] }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-400">#{o.id.slice(-5)}</span>
                    <span className="text-xs font-mono text-gray-400">
                      {new Date(o.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-gray-900">{o.customerName}</p>

                  <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Phone size={11} /> {o.customerPhone}
                  </p>

                  {o.deliveryType === "DELIVERY" && o.street && (
                    <p className="flex items-start gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin size={11} className="mt-0.5 shrink-0" />
                      {o.street}, {o.number} — {o.neighborhood}, {o.city}
                    </p>
                  )}

                  <p className="text-xs mt-2 text-gray-600">
                    {o.items.map((i) => `${i.qty}x ${i.productName}`).join(", ")}
                  </p>

                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-emerald-600 font-bold text-sm">{currency(o.totalCents)}</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {status !== "DELIVERED" && (
                      <button
                        onClick={() => advance(o)}
                        className="flex-1 text-xs font-semibold px-2.5 py-2 rounded-full bg-chili text-white shadow-sm active:scale-[0.98] transition-transform"
                      >
                        {getNextActionLabel(o)}
                      </button>
                    )}
                    <Link
                      href={`/admin/pedidos/${o.id}/imprimir`}
                      target="_blank"
                      className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
                      title="Imprimir pedido"
                    >
                      <Printer size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            {orders.filter((o) => o.status === status).length === 0 && (
              <p className="text-xs italic text-gray-300">Nenhum pedido</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

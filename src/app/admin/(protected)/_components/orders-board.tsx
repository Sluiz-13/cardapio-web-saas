"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Clock, Printer, MapPin, Phone } from "lucide-react";

const STATUS_FLOW = ["NEW", "PREPARING", "READY", "DELIVERED"] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_LABEL: Record<Status, string> = {
  NEW: "Novo",
  PREPARING: "Em Preparo",
  READY: "Pronto",
  DELIVERED: "Entregue",
};

const NEXT_ACTION_LABEL: Record<Status, string> = {
  NEW: "Iniciar preparo",
  PREPARING: "Marcar pronto",
  READY: "Marcar entregue",
  DELIVERED: "",
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

export default function OrdersBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);

  function isBoardStatus(status: string): status is Status {
    return (STATUS_FLOW as readonly string[]).includes(status);
  }

  async function advance(order: Order) {
    if (!isBoardStatus(order.status)) return; 
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[idx + 1];
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
    <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      {STATUS_FLOW.map((status) => (
        <div key={status}>
          <p className="font-mono text-[11px] uppercase tracking-wide mb-2 flex items-center gap-1 text-ink/60">
            {status === "NEW" && <Flame size={12} />}
            {status === "PREPARING" && <Clock size={12} />}
            {STATUS_LABEL[status]}
            <span className="ml-1">({orders.filter((o) => o.status === status).length})</span>
          </p>
          <div className="space-y-3">
            {orders
              .filter((o) => o.status === status)
              .map((o) => (
                <div key={o.id} className="rounded-sm bg-chalk text-paper p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-brass">#{o.id.slice(-5)}</span>
                    <span className="font-mono text-[10px] text-white/40">
                      {new Date(o.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="font-display text-sm uppercase">{o.customerName}</p>

                  <p className="flex items-center gap-1 text-[11px] text-white/60 mt-1">
                    <Phone size={11} /> {o.customerPhone}
                  </p>

                  {o.deliveryType === "DELIVERY" && o.street && (
                    <p className="flex items-start gap-1 text-[11px] text-white/60 mt-0.5">
                      <MapPin size={11} className="mt-0.5 shrink-0" />
                      {o.street}, {o.number} — {o.neighborhood}, {o.city}
                    </p>
                  )}

                  <p className="text-xs mt-2 text-white/60">
                    {o.items.map((i) => `${i.qty}x ${i.productName}`).join(", ")}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-sm font-semibold">{currency(o.totalCents)}</span>
                    <span className="text-[10px] font-mono uppercase text-brass">
                      {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {status !== "DELIVERED" && (
                      <button
                        onClick={() => advance(o)}
                        className="flex-1 text-[11px] font-display uppercase px-2.5 py-1.5 rounded-sm bg-chili text-paper"
                      >
                        {NEXT_ACTION_LABEL[status]}
                      </button>
                    )}
                    <Link
                      href={`/admin/pedidos/${o.id}/imprimir`}
                      target="_blank"
                      className="flex items-center justify-center px-2.5 py-1.5 rounded-sm border border-white/20 text-white/70"
                      title="Imprimir pedido"
                    >
                      <Printer size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            {orders.filter((o) => o.status === status).length === 0 && (
              <p className="text-xs italic text-ink/40">Nenhum pedido</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
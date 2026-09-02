"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, Clock, Printer, MapPin, Phone, Bike, MessageCircle, Inbox, Trash2, ClipboardList } from "lucide-react";
import OrderHistoryModal from "./order-history-modal";
import { buildWhatsAppLink, buildOrderStatusMessage } from "@/lib/whatsapp";
import { playNotificationSound } from "@/lib/notification-sound";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { isMenuairApp, printViaAgent, printViaBluetoothAgent, openPrintPageExternally } from "@/lib/print-agent";
import clsx from "clsx";

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
  NEW: "#C75A1B",
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

type OrderItem = { id: string; productName: string; categoryName: string | null; qty: number };
type Order = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  status: string;
  totalCents: number;
  createdAt: string | Date;
  items: OrderItem[];
  deliveryType: "DELIVERY" | "PICKUP" | "DINE_IN";
  paymentMethod: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  changeForCents: number | null;
  paymentConfirmed: boolean;
  printedAt: string | Date | null;
  table: { label: string } | null;
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
const POLL_INTERVAL_MS = 2000;
const FLASH_DURATION_MS = 6000;

function isBoardStatus(status: string): status is Status {
  return (STATUS_FLOW as readonly string[]).includes(status);
}

function getNextStatus(order: Order): Status | null {
  if (!isBoardStatus(order.status)) return null;
  const idx = STATUS_FLOW.indexOf(order.status);
  let next = STATUS_FLOW[idx + 1];
  // Só pedido DELIVERY passa por "Saiu para entrega" — PICKUP e DINE_IN
  // pulam direto pra "Entregue" (ninguém "sai para entrega" na mesa).
  if (next === "OUT_FOR_DELIVERY" && order.deliveryType !== "DELIVERY") {
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
      if (order.deliveryType === "DELIVERY") return "Saiu para entrega";
      return order.deliveryType === "DINE_IN" ? "Marcar como servido" : "Marcar entregue";
    case "OUT_FOR_DELIVERY":
      return "Marcar entregue";
    default:
      return "";
  }
}

export default function OrdersBoard({
  initialOrders,
  printMethod,
  printerIp,
  printerPort,
  printerBluetoothAddress,
}: {
  initialOrders: Order[];
  printMethod: string;
  printerIp?: string | null;
  printerPort?: number | null;
  printerBluetoothAddress?: string | null;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [historyOrderId, setHistoryOrderId] = useState<string | null>(null);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());

  const knownIds = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const isFirstPoll = useRef(true);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/admin/orders");
        if (!res.ok) return;
        const fetched: Order[] = await res.json();

        const newOnes = fetched.filter((o) => !knownIds.current.has(o.id));

        if (newOnes.length > 0 && !isFirstPoll.current) {
          playNotificationSound();
          setFlashingIds((prev) => {
            const next = new Set(prev);
            newOnes.forEach((o) => next.add(o.id));
            return next;
          });
          newOnes.forEach((o) => {
            setTimeout(() => {
              setFlashingIds((prev) => {
                const next = new Set(prev);
                next.delete(o.id);
                return next;
              });
            }, FLASH_DURATION_MS);
          });

          if (printMethod === "RAWBT" || printMethod === "AGENT" || printMethod === "AGENT_BLUETOOTH") {
            newOnes.forEach((o, i) => {
              setTimeout(() => triggerAutoPrint(o.id), i * 1200);
            });
          }
        }

        knownIds.current = new Set(fetched.map((o) => o.id));
        isFirstPoll.current = false;
        setOrders(fetched);
      } catch {
        // Falha de rede no polling não deve quebrar a tela — só tenta de novo no próximo ciclo.
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

    async function triggerAutoPrint(orderId: string) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/print`, { method: "POST" });
      if (!res.ok) return; // falha silenciosa — impressão manual continua disponível
      const { rawbtUrl, hex } = await res.json();

      if (printMethod === "AGENT" && printerIp && (await isMenuairApp())) {
        const success = await printViaAgent(hex, printerIp, printerPort ?? 9100);
        if (!success) {
          console.warn(`Impressão automática falhou pro pedido ${orderId} — usa o botão manual.`);
        }
        return;
      }

      if (printMethod === "AGENT_BLUETOOTH" && printerBluetoothAddress && (await isMenuairApp())) {
        const success = await printViaBluetoothAgent(hex, printerBluetoothAddress);
        if (!success) {
          console.warn(`Impressão automática (Bluetooth) falhou pro pedido ${orderId} — usa o botão manual.`);
        }
        return;
      }

      if (printMethod === "RAWBT") {
        window.location.href = rawbtUrl;
      }
    } catch {
    }
  }

  async function advance(order: Order) {
    const next = getNextStatus(order);
    if (!next) return;

    setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    knownIds.current.add(order.id);

    const res = await fetch(`/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: order.status } : o)));
    }
  }

  async function confirmPayment(orderId: string) {
    setOrders((os) => os.map((o) => (o.id === orderId ? { ...o, paymentConfirmed: true } : o)));
    await fetch(`/api/admin/orders/${orderId}/confirm-payment`, { method: "PATCH" });
  }

  async function deleteOrder(orderId: string) {
    if (!confirm("Excluir esse pedido? Ele sai do painel, mas fica registrado como cancelado.")) return;
    setOrders((os) => os.filter((o) => o.id !== orderId));
    await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
  }

  const activeCount = orders.filter((o) => o.status !== "DELIVERED").length;

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <PageHeader icon={ClipboardList} title="Pedidos" />
        <span className="text-xs font-semibold text-gray-400 shrink-0">
          {activeCount} {activeCount === 1 ? "pedido ativo" : "pedidos ativos"}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {STATUS_FLOW.map((status) => (
        <div key={status}>
          <p className="text-xs uppercase tracking-wide font-semibold mb-2.5 flex items-center gap-1.5 text-gray-500">
            {status === "NEW" && <Flame size={13} className="text-brand" />}
            {status === "PREPARING" && <Clock size={13} className="text-amber-500" />}
            {status === "OUT_FOR_DELIVERY" && <Bike size={13} className="text-blue-500" />}
            {STATUS_LABEL[status]}
            <span className="text-gray-400 font-normal">({orders.filter((o) => o.status === status).length})</span>
          </p>
          <div className="space-y-3">
            {orders
              .filter((o) => o.status === status)
              .map((o) => {
                const isFlashing = flashingIds.has(o.id);
                return (
                  <div
                    key={o.id}
                    onClick={() => setHistoryOrderId(o.id)}
                    className={clsx(
                      "rounded-2xl bg-white shadow-sm border border-surface-border border-l-4 p-3.5 cursor-pointer hover:shadow-md transition-shadow duration-[180ms]",
                      isFlashing && "animate-pulse ring-2 ring-brand"
                    )}
                    style={{ borderLeftColor: STATUS_BORDER_COLOR[status] }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-gray-400">#{o.id.slice(-5)}</span>
                      <span className="text-xs font-mono text-gray-400">
                        {new Date(o.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-gray-900">{o.customerName}</p>

                    {o.customerPhone && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Phone size={11} /> {o.customerPhone}
                      </p>
                    )}

                    {o.deliveryType === "DELIVERY" && o.street && (
                      <p className="flex items-start gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin size={11} className="mt-0.5 shrink-0" />
                        {o.street}, {o.number} — {o.neighborhood}, {o.city}
                      </p>
                    )}

                    {o.deliveryType === "DINE_IN" && o.table && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-900 text-white">
                        🍽️ {o.table.label}
                      </span>
                    )}

                    <p className="text-xs mt-2 text-gray-600">
                      {o.items.map((i) => `${i.qty}x ${i.productName}${i.categoryName ? ` (${i.categoryName})` : ""}`).join(", ")}
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-emerald-600 font-bold text-sm">{currency(o.totalCents)}</span>
                      <Badge tone="neutral">{PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}</Badge>
                    </div>

                    {o.paymentMethod === "CASH" && o.changeForCents && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Troco para {currency(o.changeForCents)} (levar {currency(o.changeForCents - o.totalCents)})
                      </p>
                    )}

                    {o.paymentMethod === "PIX" && !o.paymentConfirmed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmPayment(o.id);
                        }}
                        className="w-full mt-2 text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors duration-[180ms]"
                      >
                        ⏳ Pix aguardando conferência — toque para confirmar
                      </button>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      {status !== "DELIVERED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            advance(o);
                          }}
                          className="flex-1 text-xs font-semibold px-2.5 py-2 rounded-full bg-brand text-white shadow-sm hover:bg-brand-dark active:scale-[0.98] transition-all duration-[180ms]"
                        >
                          {getNextActionLabel(o)}
                        </button>
                      )}

                      
                      <a href={buildWhatsAppLink(o.customerPhone, buildOrderStatusMessage(o.status, o.customerName, o.id.slice(-5)))}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center w-9 h-9 rounded-full border border-surface-border text-emerald-600 hover:bg-emerald-50 transition-colors duration-[180ms] shrink-0"
                        title="Enviar mensagem no WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPrintPageExternally(`/admin/pedidos/${o.id}/imprimir`);
                        }}
                        className="flex items-center justify-center w-9 h-9 rounded-full border border-surface-border text-gray-500 hover:bg-gray-50 transition-colors duration-[180ms] shrink-0"
                        title="Imprimir pedido"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOrder(o.id);
                        }}
                        className="flex items-center justify-center w-9 h-9 rounded-full border border-surface-border text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors duration-[180ms] shrink-0"
                        title="Excluir pedido"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            {orders.filter((o) => o.status === status).length === 0 && (
              <div className="rounded-2xl border border-dashed border-surface-border p-4 flex flex-col items-center text-center gap-1.5">
                <Inbox size={14} className="text-gray-300" />
                <p className="text-xs italic text-gray-300">Nenhum pedido</p>
              </div>
            )}
          </div>
        </div>
      ))}
      {historyOrderId && <OrderHistoryModal orderId={historyOrderId} onClose={() => setHistoryOrderId(null)} />}
      </div>
    </div>
  );
}
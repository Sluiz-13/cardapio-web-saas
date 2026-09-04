"use client";

import { useEffect, useState } from "react";
import { History, Inbox } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "Novo",
  PREPARING: "Em Preparo",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu p/ Entrega",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  PENDING_PAYMENT: "Aguardando pagamento",
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

type HistOrder = {
  id: string;
  customerName: string;
  status: string;
  totalCents: number;
  createdAt: string;
  paymentMethod: string;
  deliveryType: "DELIVERY" | "PICKUP" | "DINE_IN";
  items: { id: string; productName: string; qty: number }[];
  table: { label: string } | null;
  driver: { name: string } | null;
};

function defaultRange() {
  const to = new Date().toISOString().slice(0, 10);
  return { from: to, to };
}

export default function HistoricoPage() {
  const [range, setRange] = useState(defaultRange());
  const [orders, setOrders] = useState<HistOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  function load(nextPage = 1, append = false) {
    setLoading(true);
    fetch(`/api/admin/historico?from=${range.from}&to=${range.to}&page=${nextPage}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders((prev) => (append ? [...prev, ...data.orders] : data.orders));
        setTotal(data.total);
        setPage(nextPage);
        setLoading(false);
      });
  }

  useEffect(() => {
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasMore = orders.length < total;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <PageHeader icon={History} title="Histórico" subtitle="Navegue pelos pedidos de qualquer período." />

      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">De</label>
            <input
              type="date"
              className="px-3 py-2 rounded-xl border border-surface-border bg-white text-sm"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Até</label>
            <input
              type="date"
              className="px-3 py-2 rounded-xl border border-surface-border bg-white text-sm"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            />
          </div>
          <Button onClick={() => load(1, false)} variant="primary" size="md">
            Buscar
          </Button>
        </CardBody>
      </Card>

      {!loading && orders.length === 0 ? (
        <EmptyState icon={<Inbox size={18} />} title="Nenhum pedido no período" description="Tente ampliar o intervalo de datas." />
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-2">{total} pedido{total === 1 ? "" : "s"} encontrado{total === 1 ? "" : "s"}</p>
          <div className="space-y-2">
            {orders.map((o) => (
              <Card key={o.id}>
                <CardBody className="!py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-400">#{o.id.slice(-5)}</span>
                    <span className="text-xs font-mono text-gray-400">{fmtDateTime(o.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-gray-900">{o.customerName}</p>
                    <Badge tone={o.status === "CANCELED" ? "danger" : "neutral"}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
                  </div>
                  <p className="text-xs mt-1.5 text-gray-600">
                    {o.items.map((i) => `${i.qty}x ${i.productName}`).join(", ")}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {o.deliveryType === "DINE_IN" && o.table ? `Mesa ${o.table.label}` : o.deliveryType === "DELIVERY" ? "Entrega" : "Balcão"}
                      {o.driver && ` · ${o.driver.name}`}
                    </span>
                    <span className="text-emerald-600 font-bold text-sm">{currency(o.totalCents)}</span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {hasMore && (
            <Button variant="secondary" className="w-full mt-4" onClick={() => load(page + 1, true)} isLoading={loading}>
              Carregar mais
            </Button>
          )}
        </>
      )}

      {loading && orders.length === 0 && (
        <div className="space-y-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}
    </div>
  );
}
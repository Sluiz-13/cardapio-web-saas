"use client";

import { useEffect, useState } from "react";
import { DollarSign, Receipt, TrendingUp, Inbox, Wallet } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
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

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

type Venda = { id: string; customerName: string; totalCents: number; paymentMethod: string; createdAt: string };
type FinanceiroData = {
  faturamentoHojeCents: number;
  pedidosHoje: number;
  ticketMedioCents: number;
  ultimasVendas: Venda[];
};

export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceiroData | null>(null);

  useEffect(() => {
    fetch("/api/admin/financeiro")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  const cards = [
    { label: "Faturamento hoje", value: currency(data.faturamentoHojeCents), icon: DollarSign },
    { label: "Pedidos hoje", value: String(data.pedidosHoje), icon: Receipt },
    { label: "Ticket médio", value: currency(data.ticketMedioCents), icon: TrendingUp },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <PageHeader icon={Wallet} title="Financeiro" subtitle="Faturamento e últimas vendas de hoje." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardBody>
              <c.icon size={16} className="text-brand mb-2" />
              <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">{c.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{c.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">Últimas vendas</h2>
        {data.ultimasVendas.length === 0 ? (
          <EmptyState icon={<Inbox size={18} />} title="Nenhuma venda ainda" description="Suas vendas confirmadas aparecem aqui." />
        ) : (
          <div className="space-y-2">
            {data.ultimasVendas.map((v) => (
              <Card key={v.id}>
                <CardBody className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between !py-3.5">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{v.customerName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge tone="neutral">{PAYMENT_LABEL[v.paymentMethod] ?? v.paymentMethod}</Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(v.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <span className="text-emerald-600 font-bold text-sm">+ {currency(v.totalCents)}</span>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
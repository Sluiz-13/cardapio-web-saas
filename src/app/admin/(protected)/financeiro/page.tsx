"use client";

import { useEffect, useState } from "react";
import { DollarSign, Receipt, TrendingUp } from "lucide-react";

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

  if (!data) return <div className="p-6 text-sm text-ink/50">Carregando…</div>;

  const cards = [
    { label: "Faturamento hoje", value: currency(data.faturamentoHojeCents), icon: DollarSign },
    { label: "Pedidos hoje", value: String(data.pedidosHoje), icon: Receipt },
    { label: "Ticket médio", value: currency(data.ticketMedioCents), icon: TrendingUp },
  ];

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl uppercase mb-4">Financeiro</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-2xl">
        {cards.map((c) => (
          <div key={c.label} className="p-4 rounded-sm bg-paper-dim border border-ink/10">
            <c.icon size={16} className="text-chili mb-2" />
            <p className="font-mono text-[10px] uppercase tracking-wide text-ink/50">{c.label}</p>
            <p className="font-display text-xl mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="max-w-2xl">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-ink/50 mb-2">Últimas vendas</h2>
        <div className="space-y-1.5">
          {data.ultimasVendas.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-3 py-2.5 rounded-sm bg-paper-dim border border-ink/10">
              <div>
                <p className="font-display text-sm uppercase">{v.customerName}</p>
                <p className="text-[11px] text-ink/50">
                  {PAYMENT_LABEL[v.paymentMethod] ?? v.paymentMethod} ·{" "}
                  {new Date(v.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-herb">+ {currency(v.totalCents)}</span>
            </div>
          ))}
          {data.ultimasVendas.length === 0 && <p className="text-sm text-ink/50">Nenhuma venda ainda.</p>}
        </div>
      </div>
    </div>
  );
}
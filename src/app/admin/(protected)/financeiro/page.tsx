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

  if (!data) return <div className="p-6 text-sm text-gray-400">Carregando…</div>;

  const cards = [
    { label: "Faturamento hoje", value: currency(data.faturamentoHojeCents), icon: DollarSign },
    { label: "Pedidos hoje", value: String(data.pedidosHoje), icon: Receipt },
    { label: "Ticket médio", value: currency(data.ticketMedioCents), icon: TrendingUp },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Financeiro</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-2xl">
        {cards.map((c) => (
          <div key={c.label} className="p-4 rounded-xl bg-white shadow-sm border border-gray-100">
            <c.icon size={16} className="text-chili mb-2" />
            <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="max-w-2xl">
        <h2 className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">Últimas vendas</h2>
        <div className="space-y-1.5">
          {data.ultimasVendas.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white shadow-sm border border-gray-100">
              <div>
                <p className="font-bold text-sm text-gray-900">{v.customerName}</p>
                <p className="text-xs text-gray-400">
                  {PAYMENT_LABEL[v.paymentMethod] ?? v.paymentMethod} ·{" "}
                  {new Date(v.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className="text-emerald-600 font-bold text-sm">+ {currency(v.totalCents)}</span>
            </div>
          ))}
          {data.ultimasVendas.length === 0 && <p className="text-sm text-gray-400">Nenhuma venda ainda.</p>}
        </div>
      </div>
    </div>
  );
}
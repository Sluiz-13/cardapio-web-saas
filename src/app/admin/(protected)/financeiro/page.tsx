"use client";

import { useEffect, useState } from "react";
import { DollarSign, Receipt, TrendingUp } from "lucide-react";
import { Download } from "lucide-react";

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
  const [rangeMode, setRangeMode] = useState<"today" | "week" | "custom">("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

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

    function getRangeDates(): { from: string; to: string } {
    const today = new Date();
    const toStr = today.toISOString().slice(0, 10);

    if (rangeMode === "today") {
      return { from: toStr, to: toStr };
    }
    if (rangeMode === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);
      return { from: weekAgo.toISOString().slice(0, 10), to: toStr };
    }
    return { from: customFrom, to: customTo };
  }

  function handleExport() {
    const { from, to } = getRangeDates();
    if (!from || !to) return;
    window.open(`/api/admin/financeiro/export?from=${from}&to=${to}`, "_blank");
  }

  return (
    <div className="p-4 sm:p-6">
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

        <div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 mb-6 max-w-2xl">
          <p className="font-bold text-sm text-gray-900 mb-3">Exportar relatório</p>
          <div className="flex gap-2 mb-3">
            {(["today", "week", "custom"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setRangeMode(mode)}
                className="px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors"
                style={{
                  background: rangeMode === mode ? "#111827" : "#FFFFFF",
                  color: rangeMode === mode ? "#FFFFFF" : "#374151",
                  borderColor: "#E5E7EB",
                }}
              >
                {mode === "today" ? "Hoje" : mode === "week" ? "Últimos 7 dias" : "Personalizado"}
              </button>
            ))}
          </div>

          {rangeMode === "custom" && (
            <div className="flex items-center gap-2 mb-3">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <span className="text-gray-400 text-sm">até</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={rangeMode === "custom" && (!customFrom || !customTo)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full font-semibold text-sm bg-emerald-600 text-white shadow-sm disabled:opacity-40"
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>



      <div className="max-w-2xl">
        <h2 className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">Últimas vendas</h2>
        <div className="space-y-1.5">
          {data.ultimasVendas.map((v) => (
            <div key={v.id} className="flex flex-col items-start gap-1 px-4 py-3 rounded-xl bg-white shadow-sm border border-gray-100 sm:flex-row sm:items-center sm:justify-between">
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

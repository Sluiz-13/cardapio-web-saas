"use client";

import { useEffect, useState } from "react";
import { DollarSign, Receipt, TrendingUp, Download, Inbox } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import clsx from "clsx";

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

  function getRangeDates(): { from: string; to: string } {
    const today = new Date();
    const toStr = today.toISOString().slice(0, 10);
    if (rangeMode === "today") return { from: toStr, to: toStr };
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
      <h1 className="text-xl font-bold text-gray-900 mb-6">Financeiro</h1>

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

      {/*
      <Card className="mb-6">
        <CardBody>
          <p className="text-sm font-semibold text-gray-800 mb-3">Exportar relatório</p>
          <div className="flex gap-2 mb-3">
            {(["today", "week", "custom"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setRangeMode(mode)}
                className={clsx(
                  "px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors duration-[180ms]",
                  rangeMode === mode
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-surface-border hover:bg-gray-50"
                )}
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
                className="px-3 py-2 rounded-xl border border-surface-border text-sm"
              />
              <span className="text-gray-400 text-sm">até</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 rounded-xl border border-surface-border text-sm"
              />
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={rangeMode === "custom" && (!customFrom || !customTo)}
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Download size={14} /> Exportar CSV
          </Button>
        </CardBody>
      </Card>
      */}

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
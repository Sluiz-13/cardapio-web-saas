"use client";

import { useEffect, useState } from "react";
import { Lock, TrendingUp, TrendingDown } from "lucide-react";

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
};

type ReportData = {
  totalCents: number;
  ordersCount: number;
  ticketMedioCents: number;
  growthPct: number | null;
  byPaymentMethod: { method: string; cents: number }[];
  topProducts: { name: string; qty: number }[];
  couponsUsed: { code: string; count: number }[];
};

function defaultRange() {
  const to = new Date().toISOString().slice(0, 10);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 29);
  return { from: fromDate.toISOString().slice(0, 10), to };
}

export default function RelatoriosPage() {
  const [range, setRange] = useState(defaultRange());
  const [data, setData] = useState<ReportData | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/admin/reports?from=${range.from}&to=${range.to}`).then(async (res) => {
      if (res.status === 403) {
        setLocked(true);
        setLoading(false);
        return;
      }
      setData(await res.json());
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (locked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <Lock size={20} className="text-gray-400" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Recurso disponível apenas no Plano Pro</h1>
        <p className="text-sm text-gray-500 mb-6">
          Relatórios avançados, comparativo de período e muito mais.
        </p>
        
        <a href="/admin/planos"
          className="inline-block px-5 py-2.5 rounded-full font-semibold text-sm bg-ink text-white shadow-sm"
        >
          Fazer upgrade para o Pro
        </a>
      </div>
    );
  }

  const inputClass = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Relatórios</h1>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs text-gray-400 mb-1">De</label>
          <input
            type="date"
            className={inputClass}
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Até</label>
          <input
            type="date"
            className={inputClass}
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          />
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-full font-semibold text-sm bg-ink text-white shadow-sm"
        >
          Aplicar
        </button>
      </div>

      {loading || !data ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">Faturamento no período</p>
              <p className="text-xl font-bold text-gray-900">{currency(data.totalCents)}</p>
              {data.growthPct !== null && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${data.growthPct >= 0 ? "text-emerald-600" : "text-chili"}`}>
                  {data.growthPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(data.growthPct)}% vs período anterior
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">Pedidos</p>
              <p className="text-xl font-bold text-gray-900">{data.ordersCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">Ticket médio</p>
              <p className="text-xl font-bold text-gray-900">{currency(data.ticketMedioCents)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">Por forma de pagamento</p>
              {data.byPaymentMethod.length === 0 ? (
                <p className="text-xs text-gray-400">Sem dados no período.</p>
              ) : (
                <ul className="space-y-2">
                  {data.byPaymentMethod.map((p) => (
                    <li key={p.method} className="flex justify-between text-sm">
                      <span className="text-gray-600">{PAYMENT_LABEL[p.method] ?? p.method}</span>
                      <span className="font-semibold text-gray-900">{currency(p.cents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">Cupons usados</p>
              {data.couponsUsed.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum cupom usado no período.</p>
              ) : (
                <ul className="space-y-2">
                  {data.couponsUsed.map((c) => (
                    <li key={c.code} className="flex justify-between text-sm">
                      <span className="text-gray-600">{c.code}</span>
                      <span className="font-semibold text-gray-900">{c.count}x</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-800 mb-3">Produtos mais vendidos</p>
            {data.topProducts.length === 0 ? (
              <p className="text-xs text-gray-400">Sem vendas no período.</p>
            ) : (
              <ol className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <li key={p.name} className="flex justify-between text-sm">
                    <span className="text-gray-600">{i + 1}. {p.name}</span>
                    <span className="font-semibold text-gray-900">{p.qty}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  );
}
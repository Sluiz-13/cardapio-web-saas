"use client";

import { useEffect, useState } from "react";
import { Lock, TrendingUp, TrendingDown, PieChart, Download } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

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
      <div className="max-w-md mx-auto px-4 py-16">
        <EmptyState
          icon={<Lock size={18} />}
          title="Recurso disponível apenas no Plano Pro"
          description="Relatórios avançados, comparativo de período e muito mais."
          action={{ label: "Fazer upgrade para o Pro", onClick: () => (window.location.href = "/admin/planos") }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Relatórios</h1>

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
          <Button onClick={load} variant="primary" size="md">
            Aplicar
          </Button>
          <Button
            onClick={() => window.open(`/api/admin/financeiro/export?from=${range.from}&to=${range.to}`, "_blank")}
            variant="secondary"
            size="md"
            className="!bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700"
          >
            <Download size={14} /> Exportar CSV
          </Button>
        </CardBody>
      </Card>
      {loading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardBody>
                <p className="text-xs text-gray-400 mb-1">Faturamento no período</p>
                <p className="text-xl font-bold text-gray-900">{currency(data.totalCents)}</p>
                {data.growthPct !== null && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${data.growthPct >= 0 ? "text-emerald-600" : "text-chili"}`}>
                    {data.growthPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(data.growthPct)}% vs período anterior
                  </p>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-gray-400 mb-1">Pedidos</p>
                <p className="text-xl font-bold text-gray-900">{data.ordersCount}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-gray-400 mb-1">Ticket médio</p>
                <p className="text-xl font-bold text-gray-900">{currency(data.ticketMedioCents)}</p>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardBody>
                <p className="text-sm font-semibold text-gray-800 mb-3">Por forma de pagamento</p>
                {data.byPaymentMethod.length === 0 ? (
                  <EmptyState icon={<PieChart size={18} />} title="Sem dados no período" />
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
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="text-sm font-semibold text-gray-800 mb-3">Cupons usados</p>
                {data.couponsUsed.length === 0 ? (
                  <EmptyState icon={<PieChart size={18} />} title="Nenhum cupom usado" />
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
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody>
              <p className="text-sm font-semibold text-gray-800 mb-3">Produtos mais vendidos</p>
              {data.topProducts.length === 0 ? (
                <EmptyState icon={<PieChart size={18} />} title="Sem vendas no período" />
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
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
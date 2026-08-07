"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Lock, BarChart3 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

const STATUS_LABEL: Record<string, string> = {
  NEW: "Novo",
  PREPARING: "Preparando",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu p/ entrega",
  DELIVERED: "Entregue",
};

type DashboardData = {
  revenueTodayCents: number;
  revenueWeekCents: number;
  revenueMonthCents: number;
  ordersByStatus: { status: string; count: number }[];
  revenueChart: { date: string; totalCents: number }[];
  topProducts: { name: string; qty: number }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard").then(async (res) => {
      if (res.status === 403) {
        setLocked(true);
        setLoading(false);
        return;
      }
      setData(await res.json());
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <EmptyState
          icon={<Lock size={18} />}
          title="Recurso disponível apenas no Plano Pro"
          description="Tenha acesso a gráficos, métricas detalhadas e muito mais com o Dashboard Completo."
          action={{ label: "Fazer upgrade para o Pro", onClick: () => (window.location.href = "/admin/planos") }}
        />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody>
            <p className="text-xs text-gray-400 mb-1">Faturamento hoje</p>
            <p className="text-xl font-bold text-gray-900">{currency(data.revenueTodayCents)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-400 mb-1">Últimos 7 dias</p>
            <p className="text-xl font-bold text-gray-900">{currency(data.revenueWeekCents)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-400 mb-1">Últimos 30 dias</p>
            <p className="text-xl font-bold text-gray-900">{currency(data.revenueMonthCents)}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardBody>
          <p className="text-sm font-semibold text-gray-800 mb-4">Faturamento — últimos 14 dias</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.revenueChart}>
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(8, 10) + "/" + d.slice(5, 7)} fontSize={11} stroke="#9CA3AF" />
              <YAxis tickFormatter={(v) => `R$${Math.round(v / 100)}`} fontSize={11} stroke="#9CA3AF" width={50} />
              <Tooltip formatter={(v) => currency(Number(v))} labelFormatter={(d) => d} />
              <Area type="monotone" dataKey="totalCents" stroke="#C75A1B" fill="#C75A1B22" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-gray-800 mb-3">Pedidos por status</p>
            {data.ordersByStatus.length === 0 ? (
              <EmptyState icon={<BarChart3 size={18} />} title="Sem pedidos ativos" />
            ) : (
              <ul className="space-y-2">
                {data.ordersByStatus.map((s) => (
                  <li key={s.status} className="flex justify-between text-sm">
                    <span className="text-gray-600">{STATUS_LABEL[s.status] ?? s.status}</span>
                    <span className="font-semibold text-gray-900">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-gray-800 mb-3">Mais vendidos (30 dias)</p>
            {data.topProducts.length === 0 ? (
              <EmptyState icon={<BarChart3 size={18} />} title="Sem vendas no período" />
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
      </div>
    </div>
  );
}
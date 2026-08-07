"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, Receipt } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const currency = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type FinanceData = {
  monthlyRevenue: { month: string; totalCents: number }[];
  recentPayments: { id: string; restaurantName: string; amountCents: number; confirmedAt: string }[];
  overdue: { id: string; name: string; dueDate: string }[];
};

export default function PlatformFinanceiroPage() {
  const [data, setData] = useState<FinanceData | null>(null);

  useEffect(() => {
    fetch("/api/platform/finance")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Financeiro</h1>

      <Card className="mb-6">
        <CardBody>
          <p className="text-sm font-semibold text-gray-800 mb-4">Receita — últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyRevenue}>
              <XAxis dataKey="month" fontSize={11} stroke="#9CA3AF" />
              <YAxis tickFormatter={(v) => `R$${Math.round(v / 100)}`} fontSize={11} stroke="#9CA3AF" width={50} />
              <Tooltip formatter={(v) => currency(Number(v))} />
              <Bar dataKey="totalCents" fill="#C75A1B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {data.overdue.length > 0 && (
        <Card className="mb-6 !border-amber-200 !bg-amber-50">
          <CardBody>
            <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} /> Mensalidade pendente ({data.overdue.length})
            </p>
            <ul className="space-y-1">
              {data.overdue.map((r) => (
                <li key={r.id} className="text-sm text-amber-800 flex justify-between">
                  <span>{r.name}</span>
                  <span>venceu em {new Date(r.dueDate).toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <p className="text-sm font-semibold text-gray-800 mb-2">Últimos pagamentos confirmados</p>
      {data.recentPayments.length === 0 ? (
        <EmptyState icon={<Receipt size={18} />} title="Nenhum pagamento confirmado ainda" />
      ) : (
        <div className="space-y-2">
          {data.recentPayments.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex items-center justify-between !py-3.5">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{p.restaurantName}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(p.confirmedAt).toLocaleDateString("pt-BR")} às{" "}
                    {new Date(p.confirmedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-emerald-600 font-bold text-sm">{currency(p.amountCents)}</span>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
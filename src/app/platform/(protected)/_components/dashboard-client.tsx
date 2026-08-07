"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, DollarSign, CheckCircle2, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";

const currency = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type DashboardData = {
  totalRestaurants: number;
  newThisMonth: number;
  activeCount: number;
  activePct: number;
  pendingCount: number;
  revenueThisMonthCents: number;
  revenueGrowthPct: number | null;
  recentRestaurants: {
    id: string;
    name: string;
    slug: string;
    plan: "START" | "PRO";
    active: boolean;
    dueDate: string;
    paymentPending: boolean;
  }[];
};

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/platform/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-56" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <Store size={16} className="text-brand mb-2" />
            <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Total de Restaurantes</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{data.totalRestaurants}</p>
            {data.newThisMonth > 0 && (
              <p className="text-xs text-emerald-600 mt-1">+{data.newThisMonth} esse mês</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <DollarSign size={16} className="text-brand mb-2" />
            <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Receita Mensal</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{currency(data.revenueThisMonthCents)}</p>
            {data.revenueGrowthPct !== null && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${data.revenueGrowthPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {data.revenueGrowthPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(data.revenueGrowthPct)}% vs mês passado
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
            <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Restaurantes Ativos</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{data.activeCount}</p>
            <p className="text-xs text-gray-400 mt-1">{data.activePct}% do total</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Clock size={16} className="text-amber-500 mb-2" />
            <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Pendentes</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{data.pendingCount}</p>
            <p className="text-xs text-gray-400 mt-1">Desativados</p>
          </CardBody>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-800">Restaurantes Recentes</p>
        <Link href="/platform/restaurantes" className="text-xs font-semibold text-brand hover:underline">
          Ver todos →
        </Link>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Plano</Th>
            <Th>Status</Th>
            <Th>Vencimento</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.recentRestaurants.map((r) => (
            <Tr key={r.id}>
              <Td>
                <Link href="/platform/restaurantes" className="font-semibold text-gray-800 hover:text-brand">
                  {r.name}
                </Link>
              </Td>
              <Td>
                <Badge tone={r.plan === "PRO" ? "brand" : "neutral"}>{r.plan}</Badge>
              </Td>
              <Td>
                <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "Ativo" : "Desativado"}</Badge>
              </Td>
              <Td>
                <span className={r.paymentPending ? "text-red-500 font-semibold" : "text-gray-500"}>
                  {new Date(r.dueDate).toLocaleDateString("pt-BR")}
                </span>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}
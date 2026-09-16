"use client";

import { useEffect, useState } from "react";
import { Users, Inbox } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type Customer = {
  id: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
  cashbackBalanceCents: number;
  ordersCount: number;
  createdAt: string;
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then(setCustomers);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <PageHeader icon={Users} title="Clientes" subtitle="Quem já criou conta no seu cardápio." />

      {!customers ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Inbox size={18} />}
          title="Nenhum cliente cadastrado ainda"
          description="Quando alguém criar conta no seu cardápio pra pedir, aparece aqui."
        />
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Card key={c.id}>
              <CardBody className="flex items-center gap-3 !py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">
                    {c.phone} · {c.ordersCount} pedido{c.ordersCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{c.loyaltyPoints} pts</p>
                  <p className="text-xs text-emerald-600 font-semibold">{currency(c.cashbackBalanceCents)}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
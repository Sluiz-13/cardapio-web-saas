"use client";

import { useEffect, useState } from "react";
import { Receipt, Lock, CheckCircle2, Printer } from "lucide-react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type ComandaOrder = {
  id: string;
  customerName: string;
  totalCents: number;
  createdAt: string;
  items: { productName: string; qty: number }[];
};
type Comanda = {
  id: string;
  openedAt: string;
  table: { label: string };
  orders: ComandaOrder[];
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default function ComandasPage() {
  const { show } = useToast();
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/comandas");
    if (res.status === 403) {
      setLocked(true);
      setLoading(false);
      return;
    }
    setComandas(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Atualiza sozinho a cada 15s — comanda muda de valor toda hora que
    // chega pedido novo na mesa, então vale manter isso fresco sem precisar
    // ficar dando F5.
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function closeComanda(comanda: Comanda) {
    const total = comanda.orders.reduce((s, o) => s + o.totalCents, 0);
    if (!confirm(`Fechar a conta de ${comanda.table.label}? Total: ${currency(total)}`)) return;

    setClosingId(comanda.id);
    const res = await fetch(`/api/admin/comandas/${comanda.id}/close`, { method: "POST" });
    setClosingId(null);

    if (!res.ok) {
      show("Não foi possível fechar a comanda.", "error");
      return;
    }
    show(`Conta de ${comanda.table.label} fechada.`, "success");
    load();
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-40 mb-4" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <EmptyState
          icon={<Lock size={18} />}
          title="Recurso disponível apenas no Plano Pro"
          description="Acompanhe as contas abertas por mesa com o Pro."
          action={{ label: "Fazer upgrade para o Pro", onClick: () => (window.location.href = "/admin/planos") }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
      <PageHeader icon={Receipt} title="Comandas" subtitle="Contas abertas por mesa. Some os pedidos e feche quando o cliente pedir a conta." />

      {comandas.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={18} />}
          title="Nenhuma comanda aberta agora"
          description="Assim que um pedido chegar via QR Code de mesa, a comanda aparece aqui."
        />
      ) : (
        <div className="space-y-4">
          {comandas.map((c) => {
            const total = c.orders.reduce((s, o) => s + o.totalCents, 0);
            return (
              <Card key={c.id}>
                <CardBody>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-base text-gray-900">{c.table.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Aberta às {new Date(c.openedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}
                        {c.orders.length} {c.orders.length === 1 ? "pedido" : "pedidos"}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">{currency(total)}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {c.orders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-sm border-t border-surface-border pt-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{o.customerName}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {o.items.map((i) => `${i.qty}x ${i.productName}`).join(", ")}
                          </p>
                        </div>
                        <span className="text-gray-600 font-medium shrink-0 ml-2">{currency(o.totalCents)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/comandas/${c.id}/imprimir`}
                      target="_blank"
                      className="shrink-0 flex items-center justify-center w-10 rounded-xl border border-surface-border text-gray-500 hover:bg-gray-50 transition-colors duration-[180ms]"
                    >
                      <Printer size={15} />
                    </Link>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      isLoading={closingId === c.id}
                      onClick={() => closeComanda(c)}
                    >
                      Fechar conta
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
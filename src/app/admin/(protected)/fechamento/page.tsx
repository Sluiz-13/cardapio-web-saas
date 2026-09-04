"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, X, Inbox } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

type SessionSummary = {
  id: string;
  openedAt: string;
  closedAt: string;
  openedByName: string;
  closedByName: string | null;
  openingAmountCents: number;
  closingAmountCents: number;
  expectedAmountCents: number;
  differenceCents: number;
};

type SessionDetail = SessionSummary & {
  notes: string | null;
  movements: { id: string; type: "SANGRIA" | "SUPRIMENTO"; amountCents: number; note: string | null; createdAt: string }[];
  byMethod: Record<string, number>;
  ordersCount: number;
};

function DifferenceBadge({ cents }: { cents: number }) {
  if (cents === 0) return <span className="text-xs font-semibold text-emerald-600">Bateu certinho</span>;
  return (
    <span className={`text-xs font-semibold ${cents > 0 ? "text-blue-600" : "text-red-500"}`}>
      {cents > 0 ? "Sobrou" : "Faltou"} {currency(Math.abs(cents))}
    </span>
  );
}

export default function FechamentoPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch("/api/admin/caixa/sessions")
      .then((r) => r.json())
      .then(setSessions);
  }, []);

  async function openDetail(id: string) {
    setLoadingDetail(true);
    const res = await fetch(`/api/admin/caixa/sessions/${id}`);
    setDetail(await res.json());
    setLoadingDetail(false);
  }

  if (!sessions) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-20 mb-2" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <PageHeader icon={CalendarCheck} title="Fechamento Diário" subtitle="Histórico de caixas fechados." />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Inbox size={18} />}
          title="Nenhum fechamento ainda"
          description="Assim que você fechar um caixa, ele aparece aqui."
        />
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(s.id)}>
              <CardBody className="flex items-center justify-between !py-3.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{fmtDateTime(s.closedAt)}</p>
                  <p className="text-xs text-gray-400">
                    Aberto por {s.openedByName} · fechado por {s.closedByName ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{currency(s.closingAmountCents)}</p>
                  <DifferenceBadge cents={s.differenceCents} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {(detail || loadingDetail) && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setDetail(null)}>
          <div
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="font-bold text-lg text-gray-900">Detalhe do fechamento</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>

            {loadingDetail || !detail ? (
              <div className="p-5">
                <Skeleton className="h-24" />
              </div>
            ) : (
              <div className="overflow-y-auto px-5 pb-5 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Abertura</p>
                    <p className="text-base font-bold text-gray-900">{currency(detail.openingAmountCents)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Contado no fechamento</p>
                    <p className="text-base font-bold text-gray-900">{currency(detail.closingAmountCents)}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-1">Resultado</p>
                  <DifferenceBadge cents={detail.differenceCents} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">
                    Vendas por forma de pagamento ({detail.ordersCount} pedidos)
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(detail.byMethod).map(([method, cents]) => (
                      <div key={method} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{PAYMENT_LABEL[method] ?? method}</span>
                        <span className="font-semibold text-gray-900">{currency(cents)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {detail.movements.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">Movimentações</p>
                    <div className="space-y-1.5">
                      {detail.movements.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {m.type === "SANGRIA" ? "Sangria" : "Suprimento"}
                            {m.note ? ` — ${m.note}` : ""}
                          </span>
                          <span className={`font-semibold ${m.type === "SANGRIA" ? "text-red-500" : "text-emerald-600"}`}>
                            {m.type === "SANGRIA" ? "-" : "+"}
                            {currency(m.amountCents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
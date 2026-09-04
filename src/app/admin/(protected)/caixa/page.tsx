"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Lock, Unlock, X } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
};

type Movement = { id: string; type: "SANGRIA" | "SUPRIMENTO"; amountCents: number; note: string | null; createdAt: string };
type CaixaData =
  | { open: false }
  | {
      open: true;
      session: { id: string; openingAmountCents: number; openedAt: string; openedByName: string; movements: Movement[] };
      byMethod: Record<string, number>;
      expectedNowCents: number;
    };

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default function CaixaPage() {
  const { show } = useToast();
  const [data, setData] = useState<CaixaData | null>(null);
  const [openingAmount, setOpeningAmount] = useState("0");
  const [movementType, setMovementType] = useState<"SANGRIA" | "SUPRIMENTO" | null>(null);
  const [movementAmount, setMovementAmount] = useState("");
  const [movementNote, setMovementNote] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);
  const [closingAmount, setClosingAmount] = useState("");
  const [closeResult, setCloseResult] = useState<{ differenceCents: number } | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/admin/caixa")
      .then((r) => r.json())
      .then(setData);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleOpen() {
    setSaving(true);
    const res = await fetch("/api/admin/caixa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingAmountCents: Math.round(Number(openingAmount) * 100) }),
    });
    setSaving(false);
    if (!res.ok) {
      show("Não foi possível abrir o caixa.", "error");
      return;
    }
    show("Caixa aberto.", "success");
    load();
  }

  async function handleMovement() {
    if (!movementType || !movementAmount) return;
    setSaving(true);
    const res = await fetch("/api/admin/caixa/movement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: movementType,
        amountCents: Math.round(Number(movementAmount) * 100),
        note: movementNote.trim() || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      show("Não foi possível registrar.", "error");
      return;
    }
    setMovementType(null);
    setMovementAmount("");
    setMovementNote("");
    show(movementType === "SANGRIA" ? "Sangria registrada." : "Suprimento registrado.", "success");
    load();
  }

  async function handleClose() {
    setSaving(true);
    const res = await fetch("/api/admin/caixa/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closingAmountCents: Math.round(Number(closingAmount) * 100) }),
    });
    setSaving(false);
    if (!res.ok) {
      show("Não foi possível fechar o caixa.", "error");
      return;
    }
    const result = await res.json();
    setCloseResult(result);
  }

  function finishClose() {
    setCloseOpen(false);
    setCloseResult(null);
    setClosingAmount("");
    show("Caixa fechado.", "success");
    load();
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!data.open) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <PageHeader icon={Wallet} title="Caixa" subtitle="Abra o caixa pra começar a registrar o dia." />
        <Card>
          <CardBody>
            <p className="font-bold text-sm text-gray-900 mb-1">Abrir caixa</p>
            <p className="text-xs text-gray-500 mb-3">Informe o valor em dinheiro que está começando na gaveta.</p>
            <div className="flex gap-2">
              <input
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                className="px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm w-32 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <Button onClick={handleOpen} isLoading={saving}>
                <Unlock size={14} /> Abrir caixa
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { session, byMethod, expectedNowCents } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <PageHeader icon={Wallet} title="Caixa" subtitle={`Aberto por ${session.openedByName} às ${new Date(session.openedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`} />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardBody>
            <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Abertura</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{currency(session.openingAmountCents)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Esperado em dinheiro agora</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{currency(expectedNowCents)}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-4">
        <CardBody>
          <p className="font-bold text-sm text-gray-900 mb-2">Vendas por forma de pagamento</p>
          {Object.keys(byMethod).length === 0 ? (
            <p className="text-xs text-gray-400 italic">Nenhuma venda desde a abertura.</p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(byMethod).map(([method, cents]) => (
                <div key={method} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{PAYMENT_LABEL[method] ?? method}</span>
                  <span className="font-semibold text-gray-900">{currency(cents)}</span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex gap-2 mb-4">
        <Button variant="secondary" className="flex-1" onClick={() => setMovementType("SANGRIA")}>
          <ArrowDownCircle size={14} /> Sangria
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setMovementType("SUPRIMENTO")}>
          <ArrowUpCircle size={14} /> Suprimento
        </Button>
      </div>

      {session.movements.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs uppercase tracking-wide font-semibold text-gray-400">Movimentações</p>
          {session.movements.map((m) => (
            <Card key={m.id}>
              <CardBody className="flex items-center gap-3 !py-3">
                {m.type === "SANGRIA" ? (
                  <ArrowDownCircle size={15} className="text-red-500 shrink-0" />
                ) : (
                  <ArrowUpCircle size={15} className="text-emerald-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{m.type === "SANGRIA" ? "Sangria" : "Suprimento"}</p>
                  {m.note && <p className="text-xs text-gray-400 truncate">{m.note}</p>}
                </div>
                <span className={`font-bold text-sm ${m.type === "SANGRIA" ? "text-red-500" : "text-emerald-600"}`}>
                  {m.type === "SANGRIA" ? "-" : "+"}
                  {currency(m.amountCents)}
                </span>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Button variant="secondary" className="w-full" onClick={() => setCloseOpen(true)}>
        <Lock size={14} /> Fechar caixa
      </Button>

      {movementType && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setMovementType(null)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-900">{movementType === "SANGRIA" ? "Registrar sangria" : "Registrar suprimento"}</h2>
              <button onClick={() => setMovementType(null)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Valor</label>
            <input
              value={movementAmount}
              onChange={(e) => setMovementAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm mb-3"
              autoFocus
            />
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Motivo (opcional)</label>
            <input
              value={movementNote}
              onChange={(e) => setMovementNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm mb-4"
            />
            <Button onClick={handleMovement} isLoading={saving} className="w-full">
              Confirmar
            </Button>
          </div>
        </div>
      )}

      {closeOpen && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40" onClick={() => !closeResult && setCloseOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            {!closeResult ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-gray-900">Fechar caixa</h2>
                  <button onClick={() => setCloseOpen(false)} className="text-gray-400">
                    <X size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Esperado no dinheiro: <strong>{currency(expectedNowCents)}</strong>. Conte a gaveta e informe o valor real.
                </p>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Valor contado</label>
                <input
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm mb-4"
                  autoFocus
                />
                <Button onClick={handleClose} isLoading={saving} className="w-full">
                  Confirmar fechamento
                </Button>
              </>
            ) : (
              <>
                <h2 className="font-bold text-lg text-gray-900 mb-3">Caixa fechado</h2>
                <p
                  className={`text-2xl font-bold mb-1 ${
                    closeResult.differenceCents === 0
                      ? "text-emerald-600"
                      : closeResult.differenceCents > 0
                      ? "text-blue-600"
                      : "text-red-500"
                  }`}
                >
                  {closeResult.differenceCents === 0
                    ? "Bateu certinho!"
                    : `${closeResult.differenceCents > 0 ? "Sobrou" : "Faltou"} ${currency(Math.abs(closeResult.differenceCents))}`}
                </p>
                <Button onClick={finishClose} className="w-full mt-4">
                  Concluir
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Receipt, Lock, CheckCircle2, Printer, Wallet, CreditCard, Banknote, X } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { isMenuairApp, printViaAgent, printViaBluetoothAgent, openPrintPageExternally } from "@/lib/print-agent";
import { printViaQzTray } from "@/lib/qz-print";


const PAYMENT_OPTIONS = [
  { value: "PIX", label: "Pix", icon: Wallet },
  { value: "CREDIT_CARD", label: "Cartão de Crédito", icon: CreditCard },
  { value: "DEBIT_CARD", label: "Cartão de Débito", icon: CreditCard },
  { value: "CASH", label: "Dinheiro", icon: Banknote },
] as const;

type ComandaOrder = {
  id: string;
  customerName: string;
  totalCents: number;
  createdAt: string;
  items: { id: string; productName: string; qty: number; unitPriceCents: number }[];
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
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [closingComanda, setClosingComanda] = useState<Comanda | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [printMethod, setPrintMethod] = useState("MANUAL");
  const [printerIp, setPrinterIp] = useState<string | null>(null);
  const [printerPort, setPrinterPort] = useState<number | null>(null);
  const [printerBluetoothAddress, setPrinterBluetoothAddress] = useState<string | null>(null);
  const [printerQzName, setPrinterQzName] = useState<string | null>(null);
  const [cancelingItemId, setCancelingItemId] = useState<string | null>(null);
  const [serviceFeePercent, setServiceFeePercent] = useState(0);

  async function cancelItem(comandaId: string, itemId: string) {
    if (!confirm("Cancelar esse item? Ele sai da conta do cliente.")) return;
    setCancelingItemId(itemId);
    const res = await fetch(`/api/admin/comandas/${comandaId}/items/${itemId}`, { method: "DELETE" });
    setCancelingItemId(null);
    if (!res.ok) {
      show("Não foi possível cancelar o item.", "error");
      return;
    }
    show("Item cancelado.", "info");
    load();
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/comandas");
    if (res.status === 403) {
      setLocked(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setComandas(data.comandas);
    setPrintMethod(data.printMethod ?? "MANUAL");
    setPrinterIp(data.printerIp);
    setPrinterPort(data.printerPort);
    setPrinterBluetoothAddress(data.printerBluetoothAddress);
    setPrinterQzName(data.printerQzName);
    setServiceFeePercent(data.serviceFeePercent ?? 0);
    setLoading(false);
  }

  async function printComanda(comanda: Comanda) {
    const isAgentMethod = printMethod === "AGENT" || printMethod === "AGENT_BLUETOOTH";
    const isQzMethod = printMethod === "QZ_TRAY" && !!printerQzName;

    if ((isAgentMethod && (await isMenuairApp())) || isQzMethod) {
      setPrintingId(comanda.id);
      const res = await fetch(`/api/admin/comandas/${comanda.id}/print`, { method: "POST" });
      if (!res.ok) {
        show("Não foi possível gerar o recibo.", "error");
        setPrintingId(null);
        return;
      }
      const { hex } = await res.json();

      const success = isQzMethod
        ? await printViaQzTray(hex, printerQzName!)
        : printMethod === "AGENT"
          ? printerIp && (await printViaAgent(hex, printerIp, printerPort ?? 9100))
          : printerBluetoothAddress && (await printViaBluetoothAgent(hex, printerBluetoothAddress));

      setPrintingId(null);

      if (!success) {
        show("Impressora não respondeu — abrindo impressão manual...", "error");
        await openPrintPageExternally(`/admin/imprimir-comanda/${comanda.id}`);
      }
      return;
    }

    await openPrintPageExternally(`/admin/imprimir-comanda/${comanda.id}`);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function confirmCloseComanda() {
    if (!closingComanda || !selectedPaymentMethod) return;
    setClosingId(closingComanda.id);

    const res = await fetch(`/api/admin/comandas/${closingComanda.id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: selectedPaymentMethod }),
    });

    setClosingId(null);
    const closedTableLabel = closingComanda.table.label;
    setClosingComanda(null);
    setSelectedPaymentMethod(null);

    if (!res.ok) {
      show("Não foi possível fechar a comanda.", "error");
      return;
    }
    show(`Conta de ${closedTableLabel} fechada.`, "success");
    load();
  }

  function closeModal() {
    setClosingComanda(null);
    setSelectedPaymentMethod(null);
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
                      <div key={o.id} className="border-t border-surface-border pt-2 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-800 truncate">{o.customerName}</p>
                          <span className="text-gray-600 font-medium shrink-0 ml-2">{currency(o.totalCents)}</span>
                        </div>
                        <div className="space-y-1">
                          {o.items.map((i) => (
                            <div key={i.id} className="flex items-center justify-between text-xs text-gray-400 pl-1">
                              <span className="truncate">
                                {i.qty}x {i.productName}
                              </span>
                              <button
                                onClick={() => cancelItem(c.id, i.id)}
                                disabled={cancelingItemId === i.id}
                                title="Cancelar item"
                                className="shrink-0 ml-2 text-gray-300 hover:text-red-500 transition-colors duration-[180ms] disabled:opacity-50"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => printComanda(c)}
                      disabled={printingId === c.id}
                      title="Imprimir automático"
                      className="shrink-0 flex items-center justify-center w-10 rounded-xl border border-surface-border text-gray-500 hover:bg-gray-50 transition-colors duration-[180ms] disabled:opacity-50"
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      onClick={() => openPrintPageExternally(`/admin/imprimir-comanda/${c.id}`)}
                      title="Imprimir manualmente"
                      className="shrink-0 flex items-center justify-center w-10 rounded-xl border border-surface-border text-gray-400 hover:bg-gray-50 transition-colors duration-[180ms]"
                    >
                      <Receipt size={15} />
                    </button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      isLoading={closingId === c.id}
                      onClick={() => {
                        setSelectedPaymentMethod(null);
                        setClosingComanda(c);
                      }}
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

      {closingComanda && (
        <Modal open={true} onClose={closeModal} title={`Fechar conta — ${closingComanda.table.label}`}>
          {(() => {
            const baseTotal = closingComanda.orders.reduce((s, o) => s + o.totalCents, 0);
            const feeCents = serviceFeePercent > 0 ? Math.round((baseTotal * serviceFeePercent) / 100) : 0;
            return (
              <>
                <p className="text-sm text-gray-600 mb-1">Total a receber</p>
                {feeCents > 0 && (
                  <div className="text-xs text-gray-400 mb-1 flex justify-between">
                    <span>Subtotal</span>
                    <span>{currency(baseTotal)}</span>
                  </div>
                )}
                {feeCents > 0 && (
                  <div className="text-xs text-gray-400 mb-1 flex justify-between">
                    <span>Taxa de serviço ({serviceFeePercent}%)</span>
                    <span>{currency(feeCents)}</span>
                  </div>
                )}
                <p className="text-2xl font-bold text-emerald-600 mb-5">{currency(baseTotal + feeCents)}</p>
              </>
            );
          })()}
          <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">
            Como o cliente pagou?
          </p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {PAYMENT_OPTIONS.map((opt) => {
              const active = selectedPaymentMethod === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedPaymentMethod(opt.value)}
                  disabled={closingId !== null}
                  className="flex items-center gap-2 px-3.5 py-3 rounded-xl border text-sm font-semibold transition-colors duration-[180ms] disabled:opacity-50"
                  style={{
                    borderColor: active ? "var(--brand, #C75A1B)" : undefined,
                    background: active ? "var(--brand-light, #FDF1EA)" : undefined,
                    color: active ? "var(--brand, #C75A1B)" : undefined,
                  }}
                >
                  <opt.icon size={16} /> {opt.label}
                </button>
              );
            })}
          </div>
          <Button
            className="w-full"
            disabled={!selectedPaymentMethod}
            isLoading={closingId === closingComanda.id}
            onClick={confirmCloseComanda}
          >
            Confirmar pagamento
          </Button>
        </Modal>
      )}
    </div>
  );
}

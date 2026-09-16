"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, QrCode, Lock, LayoutGrid, CircleDot } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import TableQrCode from "./_components/table-qr-code";

type Table = { id: string; label: string };

export default function MesasPage() {
  const { show } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [qrSelfOrderAllowed, setQrSelfOrderAllowed] = useState(true);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [occupiedTableIds, setOccupiedTableIds] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/tables");
    if (res.status === 403) {
      setLocked(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTables(data.tables);
    setRestaurantSlug(data.restaurantSlug);
    setQrSelfOrderAllowed(data.qrSelfOrderAllowed);

    // Cruza com as comandas abertas pra saber quais mesas estão ocupadas
    // agora — não trava a tela se isso falhar por algum motivo.
    try {
      const comandasRes = await fetch("/api/admin/comandas");
      if (comandasRes.ok) {
        const comandasData = await comandasRes.json();
        const ids = new Set<string>(
          comandasData.comandas.map((c: { tableId: string | null }) => c.tableId).filter((id: string | null): id is string => !!id)
        );
        setOccupiedTableIds(ids);
      }
    } catch {
      // silencioso — status de ocupação é um extra, não algo crítico
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(typeof data?.error === "string" ? data.error : "Não foi possível criar a mesa.");
      return;
    }

    setLabel("");
    show("Mesa criada.", "success");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover essa mesa?")) return;
    const res = await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      show(typeof data?.error === "string" ? data.error : "Não foi possível remover.", "error");
      return;
    }
    show("Mesa removida.", "info");
    load();
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-14 mb-2" />
        <Skeleton className="h-14" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <EmptyState
          icon={<Lock size={18} />}
          title="Recurso disponível apenas no Plano Pro"
          description="Gere QR Codes por mesa e receba pedidos direto na comanda com o Pro."
          action={{ label: "Fazer upgrade para o Pro", onClick: () => (window.location.href = "/admin/planos") }}
        />
      </div>
    );
  }

  const qrUrl = qrTable ? `${window.location.origin}/r/${restaurantSlug}?mesa=${qrTable.id}` : "";

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:px-6">
      <PageHeader icon={LayoutGrid} title="Mesas" subtitle="Gere um QR Code por mesa pra receber pedidos direto na comanda." />

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2 items-start">
            <div className="flex-1 w-full">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nome da mesa (ex: Mesa 1, Varanda)"
                className="mb-0"
                error={error || undefined}
              />
            </div>
            <Button type="submit" isLoading={saving} className="shrink-0">
              <Plus size={14} /> Adicionar
            </Button>
          </form>
        </CardBody>
      </Card>

      {tables.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={18} />}
          title="Nenhuma mesa cadastrada ainda"
          description="Crie a primeira mesa acima pra gerar o QR Code dela."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tables.map((t) => {
            const occupied = occupiedTableIds.has(t.id);
            return (
              <div key={t.id} className="relative rounded-2xl border border-surface-border bg-white p-4 flex flex-col items-center text-center">
                <button
                  onClick={() => handleDelete(t.id)}
                  className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors duration-[180ms]"
                  aria-label="Remover mesa"
                >
                  <Trash2 size={12} />
                </button>

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 ${
                    occupied ? "bg-brand-light text-brand" : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <LayoutGrid size={18} />
                </div>

                <p className="font-bold text-sm text-gray-900 mb-0.5">{t.label}</p>
                <div className="flex items-center gap-1 mb-3">
                  <CircleDot size={9} className={occupied ? "text-brand" : "text-emerald-500"} fill="currentColor" />
                  <span className={`text-xs font-medium ${occupied ? "text-brand" : "text-emerald-600"}`}>
                    {occupied ? "Ocupada" : "Livre"}
                  </span>
                </div>

                {qrSelfOrderAllowed ? (
                  <button
                    onClick={() => setQrTable(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-surface-border text-gray-600 hover:bg-brand-light hover:text-brand hover:border-brand/30 transition-colors duration-[180ms] w-full justify-center"
                  >
                    <QrCode size={13} /> QR Code
                  </button>
                ) : (
                  <button
                    onClick={() => (window.location.href = "/admin/planos")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors duration-[180ms] w-full justify-center"
                  >
                    <QrCode size={13} /> É Pro
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={qrTable !== null} onClose={() => setQrTable(null)} title={qrTable?.label}>
        {qrTable && (
          <div className="p-2">
            <TableQrCode url={qrUrl} label={qrTable.label} />
            <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
              Imprime e cola na mesa. Quem escanear abre o cardápio já identificado
              nessa mesa — sem precisar preencher endereço.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
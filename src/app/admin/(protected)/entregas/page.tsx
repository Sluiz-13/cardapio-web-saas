"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Truck, MapPinOff } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Fee = { id: string; neighborhood: string; feeCents: number };

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default function EntregasPage() {
  const { show } = useToast();
  const [fees, setFees] = useState<Fee[]>([]);
  const [defaultFee, setDefaultFee] = useState("0");
  const [loading, setLoading] = useState(true);
  const [savingDefault, setSavingDefault] = useState(false);
  const [neighborhood, setNeighborhood] = useState("");
  const [feeValue, setFeeValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [feesRes, settingsRes] = await Promise.all([
      fetch("/api/admin/delivery-fees").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);
    setFees(feesRes);
    setDefaultFee(String((settingsRes.restaurant.defaultDeliveryFeeCents ?? 0) / 100));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveDefaultFee() {
    setSavingDefault(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultDeliveryFeeCents: Math.round(Number(defaultFee) * 100) }),
    });
    setSavingDefault(false);
    show("Taxa padrão salva.", "success");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!neighborhood.trim() || !feeValue) {
      setError("Preencha o bairro e o valor.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/delivery-fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ neighborhood: neighborhood.trim(), feeCents: Math.round(Number(feeValue) * 100) }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível salvar.");
      return;
    }
    setNeighborhood("");
    setFeeValue("");
    show("Bairro adicionado.", "success");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover essa taxa de bairro?")) return;
    await fetch(`/api/admin/delivery-fees/${id}`, { method: "DELETE" });
    show("Bairro removido.", "info");
    load();
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-24 mb-6" />
        <Skeleton className="h-14 mb-2" />
        <Skeleton className="h-14" />
      </div>
    );
  }

  const inputClass =
    "px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow duration-[180ms]";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <PageHeader icon={Truck} title="Taxas de Entrega" subtitle="Valor cobrado por bairro na entrega." />

      <Card className="mb-6">
        <CardBody>
          <p className="font-bold text-sm text-gray-900 mb-1">Taxa padrão</p>
          <p className="text-xs text-gray-500 mb-3">
            Cobrada quando o bairro digitado pelo cliente não está na lista abaixo.
          </p>
          <div className="flex gap-2">
            <input
              value={defaultFee}
              onChange={(e) => setDefaultFee(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              className={`${inputClass} w-32`}
            />
            <Button onClick={saveDefaultFee} isLoading={savingDefault} variant="secondary">
              Salvar
            </Button>
          </div>
        </CardBody>
      </Card>

      <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">Taxas por bairro</p>

      <Card className="mb-4">
        <CardBody>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Nome do bairro"
              className={`flex-1 ${inputClass}`}
            />
            <input
              value={feeValue}
              onChange={(e) => setFeeValue(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              placeholder="R$"
              className={`sm:w-28 ${inputClass}`}
            />
            <Button type="submit" isLoading={saving} className="shrink-0">
              <Plus size={14} /> Adicionar
            </Button>
          </form>
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
        </CardBody>
      </Card>

      {fees.length === 0 ? (
        <EmptyState
          icon={<MapPinOff size={18} />}
          title="Nenhum bairro cadastrado"
          description="Todos os clientes pagam a taxa padrão até você cadastrar um bairro específico."
        />
      ) : (
        <div className="space-y-2">
          {fees.map((f) => (
            <Card key={f.id}>
              <CardBody className="flex items-center gap-3 !py-3.5">
                <Truck size={15} className="text-brand shrink-0" />
                <span className="flex-1 font-semibold text-sm text-gray-800">{f.neighborhood}</span>
                <span className="text-emerald-600 font-bold text-sm">{currency(f.feeCents)}</span>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors duration-[180ms]"
                  aria-label="Remover"
                >
                  <Trash2 size={15} />
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
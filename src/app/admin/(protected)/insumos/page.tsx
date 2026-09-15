"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Pencil, Package2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Insumo = {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default function InsumosPage() {
  const { show } = useToast();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Insumo | null>(null);
  const [movementTarget, setMovementTarget] = useState<Insumo | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/insumos").then((r) => r.json());
    setInsumos(res);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Remover esse insumo? Isso também remove ele de qualquer ficha técnica que o use.")) return;
    await fetch(`/api/admin/insumos/${id}`, { method: "DELETE" });
    show("Insumo removido.", "info");
    load();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <PageHeader icon={Package2} title="Insumos" subtitle="Matéria-prima usada nos seus produtos, com controle de estoque." />
        <Button onClick={() => setShowForm(true)} className="shrink-0">
          <Plus size={14} /> Novo
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : insumos.length === 0 ? (
        <EmptyState
          icon={<Package2 size={18} />}
          title="Nenhum insumo cadastrado ainda"
          description="Cadastre a matéria-prima que seus produtos usam pra controlar estoque e custo."
        />
      ) : (
        <div className="space-y-2">
          {insumos.map((i) => {
            const low = i.currentStock <= i.minStock;
            return (
              <Card key={i.id}>
                <CardBody className="flex items-center gap-3 !py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-gray-900 truncate">{i.name}</p>
                      {low && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 shrink-0">
                          Estoque baixo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {i.currentStock} {i.unit} em estoque · {currency(i.costPerUnit)}/{i.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => setMovementTarget(i)}
                    className="text-gray-300 hover:text-brand transition-colors duration-[180ms] shrink-0"
                    aria-label="Registrar movimento"
                    title="Registrar entrada/ajuste"
                  >
                    <ArrowUpCircle size={16} />
                  </button>
                  <button onClick={() => setEditing(i)} className="text-gray-300 hover:text-brand transition-colors duration-[180ms] shrink-0" aria-label="Editar">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(i.id)} className="text-gray-300 hover:text-red-500 transition-colors duration-[180ms] shrink-0" aria-label="Remover">
                    <Trash2 size={15} />
                  </button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {(showForm || editing) && (
        <InsumoFormModal
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            show(editing ? "Insumo atualizado." : "Insumo criado.", "success");
            load();
          }}
        />
      )}

      {movementTarget && (
        <MovementModal
          insumo={movementTarget}
          onClose={() => setMovementTarget(null)}
          onSaved={() => {
            setMovementTarget(null);
            show("Movimento registrado.", "success");
            load();
          }}
        />
      )}
    </div>
  );
}

function InsumoFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Insumo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "un");
  const [costPerUnit, setCostPerUnit] = useState(initial ? String(initial.costPerUnit / 100) : "");
  const [currentStock, setCurrentStock] = useState(initial ? String(initial.currentStock) : "0");
  const [minStock, setMinStock] = useState(initial ? String(initial.minStock) : "0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow duration-[180ms]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !unit.trim()) {
      setError("Preencha nome e unidade.");
      return;
    }
    setSaving(true);

    const payload = {
      name,
      unit,
      costPerUnit: Math.round(Number(costPerUnit || "0") * 100),
      ...(isEditing ? { minStock: Number(minStock) || 0 } : { currentStock: Number(currentStock) || 0, minStock: Number(minStock) || 0 }),
    };

    const res = isEditing
      ? await fetch(`/api/admin/insumos/${initial!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/insumos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (!res.ok) {
      setError("Não foi possível salvar.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-border">
          <h2 className="text-lg font-bold text-gray-900">{isEditing ? "Editar Insumo" : "Novo Insumo"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <Label>Nome</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Pão de hambúrguer" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unidade</Label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, g, L, un..." className={inputClass} />
            </div>
            <div>
              <Label>Custo por unidade (R$)</Label>
              <input value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} type="number" step="0.01" min="0" className={inputClass} />
            </div>
          </div>
          {!isEditing && (
            <div>
              <Label>Estoque inicial</Label>
              <input value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} type="number" step="0.01" min="0" className={inputClass} />
            </div>
          )}
          <div>
            <Label>Estoque mínimo (alerta)</Label>
            <input value={minStock} onChange={(e) => setMinStock(e.target.value)} type="number" step="0.01" min="0" className={inputClass} />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-surface-border">
          <Button type="submit" isLoading={saving} className="w-full">
            {isEditing ? "Salvar Alterações" : "Salvar Insumo"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function MovementModal({
  insumo,
  onClose,
  onSaved,
}: {
  insumo: Insumo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<"ENTRADA" | "AJUSTE">("ENTRADA");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow duration-[180ms]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const qty = Number(quantity);
    if (!qty) {
      setError("Informe uma quantidade.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/insumos/${insumo.id}/movement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        quantity: type === "AJUSTE" ? qty : Math.abs(qty),
        note: note || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível registrar.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-border">
          <h2 className="text-lg font-bold text-gray-900">Movimentar: {insumo.name}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-400">
            Estoque atual: <strong>{insumo.currentStock} {insumo.unit}</strong>
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("ENTRADA")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors duration-[180ms] ${
                type === "ENTRADA" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-surface-border text-gray-500"
              }`}
            >
              <ArrowDownCircle size={13} /> Entrada (compra)
            </button>
            <button
              type="button"
              onClick={() => setType("AJUSTE")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors duration-[180ms] ${
                type === "AJUSTE" ? "bg-amber-50 border-amber-500 text-amber-700" : "border-surface-border text-gray-500"
              }`}
            >
              <ArrowUpCircle size={13} /> Ajuste (perda/contagem)
            </button>
          </div>

          <div>
            <Label>{type === "ENTRADA" ? `Quantidade recebida (${insumo.unit})` : `Ajuste (${insumo.unit}) — negativo pra perda`}</Label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              type="number"
              step="0.01"
              placeholder={type === "AJUSTE" ? "ex: -2 (perdeu 2)" : "ex: 10"}
              className={inputClass}
            />
          </div>
          <div>
            <Label>Observação (opcional)</Label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex: Nota fiscal 1234" className={inputClass} />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-surface-border">
          <Button type="submit" isLoading={saving} className="w-full">
            Registrar
          </Button>
        </div>
      </form>
    </div>
  );
}
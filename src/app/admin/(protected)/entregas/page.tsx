"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Truck } from "lucide-react";

type Fee = { id: string; neighborhood: string; feeCents: number };

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default function EntregasPage() {
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
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover essa taxa de bairro?")) return;
    await fetch(`/api/admin/delivery-fees/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Carregando…</div>;

  const inputClass =
    "px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-chili/30 focus:border-chili transition-shadow";

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Taxas de Entrega</h1>

      <div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 mb-6">
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
          <button
            onClick={saveDefaultFee}
            disabled={savingDefault}
            className="px-4 py-2 rounded-full font-semibold text-sm bg-gray-900 text-white disabled:opacity-50"
          >
            {savingDefault ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">Taxas por bairro</p>

      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
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
          className={`w-28 ${inputClass}`}
        />
        <button disabled={saving} className="flex items-center gap-1 px-4 py-2.5 rounded-full font-semibold text-sm bg-emerald-600 text-white shadow-sm disabled:opacity-50">
          <Plus size={14} /> Adicionar
        </button>
      </form>
      {error && <p className="text-chili text-xs mb-3">{error}</p>}

      <div className="space-y-2">
        {fees.map((f) => (
          <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100">
            <Truck size={15} className="text-chili shrink-0" />
            <span className="flex-1 font-semibold text-sm text-gray-800">{f.neighborhood}</span>
            <span className="text-emerald-600 font-bold text-sm">{currency(f.feeCents)}</span>
            <button onClick={() => handleDelete(f.id)} className="text-gray-300 hover:text-chili transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {fees.length === 0 && <p className="text-sm text-gray-400">Nenhum bairro cadastrado — todos pagam a taxa padrão.</p>}
      </div>
    </div>
  );
}
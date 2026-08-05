"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  active: boolean;
  maxUsage: number | null;
  usageCount: number;
  expiresAt: string | null;
};

export default function PlatformCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUsage, setMaxUsage] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/platform/coupons");
    setCoupons(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/platform/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        discountType,
        discountValue: Number(discountValue),
        maxUsage: maxUsage ? Number(maxUsage) : undefined,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(typeof data?.error === "string" ? data.error : "Não foi possível criar o cupom.");
      return;
    }

    setCode("");
    setDiscountValue("");
    setMaxUsage("");
    load();
  }

  async function toggleActive(c: Coupon) {
    await fetch(`/api/platform/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    load();
  }

  const inputClass =
    "px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-shadow";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Cupons de boas-vindas</h1>
      <p className="text-sm text-gray-500 mb-6">
        Desconto válido só na 1ª cobrança de um restaurante novo, aplicado no cadastro dele.
      </p>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 grid grid-cols-2 gap-3"
      >
        <input
          className={`${inputClass} col-span-2`}
          placeholder="Código (ex: BEMVINDO20)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
        />
        <select className={inputClass} value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
          <option value="PERCENTAGE">Percentual (%)</option>
          <option value="FIXED">Valor fixo (R$)</option>
        </select>
        <input
          className={inputClass}
          type="number"
          placeholder={discountType === "PERCENTAGE" ? "Ex: 20" : "Ex: 3000 (centavos)"}
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          required
        />
        <input
          className={`${inputClass} col-span-2`}
          type="number"
          placeholder="Limite de usos (opcional)"
          value={maxUsage}
          onChange={(e) => setMaxUsage(e.target.value)}
        />
        {error && <p className="col-span-2 text-chili text-xs">{error}</p>}
        <button
          disabled={saving}
          className="col-span-2 flex items-center justify-center gap-1 py-2.5 rounded-full font-semibold text-sm bg-ink text-white shadow-sm disabled:opacity-50"
        >
          <Plus size={14} /> Criar cupom
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : coupons.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhum cupom criado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {coupons.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-white shadow-sm border border-gray-100"
            >
              <div>
                <p className="font-semibold text-sm text-gray-800">{c.code}</p>
                <p className="text-xs text-gray-400">
                  {c.discountType === "PERCENTAGE" ? `${c.discountValue}% off` : `R$ ${(c.discountValue / 100).toFixed(2)} off`}
                  {" · "}
                  {c.usageCount} uso(s){c.maxUsage ? ` / ${c.maxUsage}` : ""}
                </p>
              </div>
              <button
                onClick={() => toggleActive(c)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  c.active ? "border-gray-200 text-gray-600" : "border-gray-200 text-gray-400"
                }`}
              >
                {c.active ? "Ativo" : "Inativo"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
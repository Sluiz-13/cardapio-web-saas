"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  active: boolean;
  usageCount: number;
  maxUsage: number | null;
  expiresAt: string | null;
  productId?: string | null;
  product?: { name: string } | null;
};

type ProductOption = { id: string; name: string };

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const [couponsRes, productsRes] = await Promise.all([
      fetch("/api/admin/coupons").then((r) => r.json()),
      fetch("/api/admin/products").then((r) => r.json()),
    ]);
    setCoupons(couponsRes);
    setProducts(productsRes.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(coupon: Coupon) {
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esse cupom?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Cupons de Desconto</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-4 py-2.5 rounded-full font-semibold text-sm bg-emerald-600 text-white shadow-sm"
        >
          <Plus size={14} /> Novo Cupom
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {coupons.map((c) => (
            <div key={c.id} className="p-3 rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <Tag size={16} className="text-chili shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 font-mono">{c.code}</p>
                  <p className="text-xs text-gray-400">
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}% off` : `${currency(c.discountValue)} off`}
                    {" · "}
                    {c.usageCount} uso{c.usageCount !== 1 ? "s" : ""}
                    {c.maxUsage ? ` / ${c.maxUsage}` : ""}
                    {c.expiresAt && ` · expira em ${new Date(c.expiresAt).toLocaleDateString("pt-BR")}`}
                  </p>
                  {c.product && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                      Válido só para: {c.product.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleActive(c)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: c.active ? "#059669" : "#D1D5DB", color: "#FFFFFF" }}
                >
                  {c.active ? "Ativo" : "Inativo"}
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-chili transition-colors shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && <p className="text-sm text-gray-400">Nenhum cupom cadastrado ainda.</p>}
        </div>
      )}

      {showForm && (
        <CouponFormModal
          products={products}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CouponFormModal({
  products,
  onClose,
  onSaved,
}: {
  products: ProductOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUsage, setMaxUsage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [productId, setProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-chili/30 focus:border-chili transition-shadow";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim() || !discountValue) {
      setError("Preencha o código e o valor do desconto.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code.trim(),
        discountType,
        discountValue: discountType === "PERCENTAGE" ? Number(discountValue) : Math.round(Number(discountValue) * 100),
        minOrderCents: minOrder ? Math.round(Number(minOrder) * 100) : undefined,
        maxUsage: maxUsage ? Number(maxUsage) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        productId: productId || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível salvar o cupom.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl p-5 max-h-[88vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Cupom</h2>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Código</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ex: BEMVINDO10" className={inputClass} />
          </div>

          <div className="flex gap-2">
            {(["PERCENTAGE", "FIXED"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setDiscountType(t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{
                  background: discountType === t ? "#111827" : "#FFFFFF",
                  color: discountType === t ? "#FFFFFF" : "#374151",
                  borderColor: "#E5E7EB",
                }}
              >
                {t === "PERCENTAGE" ? "Porcentagem" : "Valor Fixo (R$)"}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">
              {discountType === "PERCENTAGE" ? "Desconto (%)" : "Desconto (R$)"}
            </label>
            <input
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              type="number"
              step={discountType === "PERCENTAGE" ? "1" : "0.01"}
              min={discountType === "PERCENTAGE" ? "1" : "0.01"}
              max={discountType === "PERCENTAGE" ? "100" : undefined}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">
                Pedido mínimo (opcional)
              </label>
              <input value={minOrder} onChange={(e) => setMinOrder(e.target.value)} type="number" step="0.01" min="0" placeholder="R$" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">
                Limite de usos (opcional)
              </label>
              <input value={maxUsage} onChange={(e) => setMaxUsage(e.target.value)} type="number" min="1" placeholder="ilimitado" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Expira em (opcional)</label>
            <input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">
              Restringir a um produto (opcional)
            </label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
              <option value="">Pedido inteiro</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-chili text-xs mb-3">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full font-medium text-sm border border-gray-200 text-gray-600">
            Cancelar
          </button>
          <button disabled={saving} className="flex-1 py-3 rounded-full font-semibold text-sm bg-chili text-white shadow-sm disabled:opacity-50">
            {saving ? "Salvando…" : "Criar Cupom"}
          </button>
        </div>
      </form>
    </div>
  );
}
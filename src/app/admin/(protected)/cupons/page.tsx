"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import clsx from "clsx";

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
  const { show } = useToast();
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
    show("Cupom removido.", "info");
    load();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <PageHeader icon={Tag} title="Cupons de Desconto" subtitle="Códigos promocionais pro seu cardápio." />
        <Button onClick={() => setShowForm(true)} className="shrink-0">
          <Plus size={14} /> Novo
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : coupons.length === 0 ? (
        <EmptyState icon={<Tag size={18} />} title="Nenhum cupom cadastrado ainda" description="Crie o primeiro cupom pra oferecer desconto." />
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <Card key={c.id}>
              <CardBody className="flex items-center gap-3 !py-3.5">
                <Tag size={16} className="text-brand shrink-0" />
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
                    <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Válido só para: {c.product.name}</p>
                  )}
                </div>
                <button onClick={() => toggleActive(c)} className="shrink-0">
                  <Badge tone={c.active ? "success" : "neutral"}>{c.active ? "Ativo" : "Inativo"}</Badge>
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors duration-[180ms] shrink-0"
                  aria-label="Remover cupom"
                >
                  <Trash2 size={15} />
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo Cupom">
        <CouponForm
          products={products}
          onSaved={() => {
            setShowForm(false);
            show("Cupom criado.", "success");
            load();
          }}
        />
      </Modal>
    </div>
  );
}

function CouponForm({ products, onSaved }: { products: ProductOption[]; onSaved: () => void }) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUsage, setMaxUsage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [productId, setProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectClass =
    "w-full mb-4 px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow duration-[180ms]";

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
    <form onSubmit={handleSubmit}>
      <Label>Código</Label>
      <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ex: BEMVINDO10" />

      <div className="flex gap-2 mb-4">
        {(["PERCENTAGE", "FIXED"] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setDiscountType(t)}
            className={clsx(
              "flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors duration-[180ms]",
              discountType === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-surface-border"
            )}
          >
            {t === "PERCENTAGE" ? "Porcentagem" : "Valor Fixo (R$)"}
          </button>
        ))}
      </div>

      <Label>{discountType === "PERCENTAGE" ? "Desconto (%)" : "Desconto (R$)"}</Label>
      <Input
        value={discountValue}
        onChange={(e) => setDiscountValue(e.target.value)}
        type="number"
        step={discountType === "PERCENTAGE" ? "1" : "0.01"}
        min={discountType === "PERCENTAGE" ? "1" : "0.01"}
        max={discountType === "PERCENTAGE" ? "100" : undefined}
      />

      <div className="grid grid-cols-2 gap-2 mb-0">
        <div>
          <Label>Pedido mínimo (opcional)</Label>
          <Input value={minOrder} onChange={(e) => setMinOrder(e.target.value)} type="number" step="0.01" min="0" placeholder="R$" />
        </div>
        <div>
          <Label>Limite de usos (opcional)</Label>
          <Input value={maxUsage} onChange={(e) => setMaxUsage(e.target.value)} type="number" min="1" placeholder="ilimitado" />
        </div>
      </div>

      <Label>Expira em (opcional)</Label>
      <Input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" />

      <Label>Restringir a um produto (opcional)</Label>
      <select value={productId} onChange={(e) => setProductId(e.target.value)} className={selectClass}>
        <option value="">Pedido inteiro</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

      <Button type="submit" isLoading={saving} className="w-full">
        Criar Cupom
      </Button>
    </form>
  );
}
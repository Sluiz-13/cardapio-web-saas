"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Pencil, Package, Upload, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  active: boolean;
  category: Category;
  categoryId: string;
  order: number;
  removableOptions: { id: string; name: string }[];
  extraOptions: { id: string; name: string; priceCents: number }[];
  maxAccompaniments: number | null;
  optionGroups: {
    id: string;
    name: string;
    minSelect: number;
    maxSelect: number | null;
    pricingStyle: "SUM" | "FIXED" | "HIGHEST";
    fixedPriceCents: number | null;
    order: number;
    items: { id: string; name: string; priceCents: number; order: number }[];
  }[];
  recipeItems: { insumo: { id: string; name: string; unit: string; costPerUnit: number }; quantity: number }[];
  availableDays: number[];
  visibleToCustomer: boolean;
  visibleToStaff: boolean;
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function ProdutosPage() {
  const { show } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [p, c] = await Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]);
    setProducts(p);
    setCategories(c);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(product: Product) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esse produto do cardápio? Pedidos antigos continuam salvos, só perdem o vínculo com esse produto específico.")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      show("Não foi possível remover.", "error");
      return;
    }
    show("Produto removido.", "info");
    load();
  }

  // Move dentro da MESMA categoria só — trocar posição entre categorias
  // diferentes não faz sentido aqui (isso é papel do campo "Categoria" no
  // formulário de edição, não da seta de reordenar).
  async function moveProduct(categoryItems: Product[], index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categoryItems.length) return;

    const current = categoryItems[index];
    const target = categoryItems[targetIndex];
    setMovingId(current.id);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === current.id) return { ...p, order: target.order };
        if (p.id === target.id) return { ...p, order: current.order };
        return p;
      })
    );

    await Promise.all([
      fetch(`/api/admin/products/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: target.order }),
      }),
      fetch(`/api/admin/products/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: current.order }),
      }),
    ]);

    setMovingId(null);
    load(); // confirma com o servidor, corrige se algo deu errado
  }

  const modalOpen = showCreateForm || editingProduct !== null;

  // Categorias já vêm ordenadas por `order` da própria API de categorias —
  // então os grupos aqui aparecem na mesma sequência de sempre.
  const groups = categories
    .map((cat) => ({
      category: cat,
      items: products.filter((p) => p.categoryId === cat.id).sort((a, b) => a.order - b.order),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <PageHeader icon={Package} title="Produtos" subtitle="O que aparece no seu cardápio, com preço e categoria." />
        <Button onClick={() => setShowCreateForm(true)} disabled={categories.length === 0} className="shrink-0">
          <Plus size={14} /> Novo
        </Button>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-brand mb-4">Cadastre pelo menos uma categoria antes de adicionar produtos.</p>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={<Package size={18} />} title="Nenhum produto cadastrado ainda" description="Adicione o primeiro produto ao seu cardápio." />
      ) : (
        <div className="space-y-6">
          {groups.map(({ category, items }) => (
            <div key={category.id}>
              <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">{category.name}</p>
              <div className="space-y-2">
                {items.map((p, index) => (
                  <Card key={p.id}>
                    <CardBody className="flex items-center gap-3 !py-3">
                      {/* Pill agrupado igual em Categorias — as duas setas
                          compartilham uma borda só. */}
                      <div className="flex flex-col rounded-lg border border-surface-border overflow-hidden shrink-0">
                        <button
                          onClick={() => moveProduct(items, index, "up")}
                          disabled={index === 0 || movingId !== null}
                          className="flex items-center justify-center w-7 h-6 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-25 disabled:hover:bg-transparent transition-colors duration-[180ms] border-b border-surface-border"
                          aria-label="Mover para cima"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          onClick={() => moveProduct(items, index, "down")}
                          disabled={index === items.length - 1 || movingId !== null}
                          className="flex items-center justify-center w-7 h-6 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-25 disabled:hover:bg-transparent transition-colors duration-[180ms]"
                          aria-label="Mover para baixo"
                        >
                          <ChevronDown size={13} />
                        </button>
                      </div>

                      {p.imageUrl && <img src={p.imageUrl} className="w-12 h-12 object-cover rounded-lg shrink-0" alt="" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{p.name}</p>
                        {p.availableDays.length > 0 && (
                          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                            Só: {p.availableDays.map((d) => DAY_SHORT[d]).join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="text-emerald-600 font-bold text-sm shrink-0">{currency(p.priceCents)}</span>
                      <button onClick={() => toggleActive(p)} className="shrink-0">
                        <Badge tone={p.active ? "success" : "neutral"}>{p.active ? "Ativo" : "Inativo"}</Badge>
                      </button>
                      <button onClick={() => setEditingProduct(p)} className="text-gray-300 hover:text-brand transition-colors duration-[180ms] shrink-0" aria-label="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-500 transition-colors duration-[180ms] shrink-0" aria-label="Remover">
                        <Trash2 size={15} />
                      </button>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ProductFormModal
          categories={categories}
          initialProduct={editingProduct}
          onClose={() => {
            setShowCreateForm(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            setShowCreateForm(false);
            setEditingProduct(null);
            show(editingProduct ? "Produto atualizado." : "Produto criado.", "success");
            load();
          }}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  categories,
  initialProduct,
  onClose,
  onSaved,
}: {
  categories: Category[];
  initialProduct: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!initialProduct;

  const [name, setName] = useState(initialProduct?.name ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.priceCents / 100) : "");
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl ?? "");
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId ?? categories[0]?.id ?? "");
  const [removables, setRemovables] = useState<string[]>(initialProduct?.removableOptions.map((r) => r.name) ?? []);
  const [removableInput, setRemovableInput] = useState("");
  const [extras, setExtras] = useState<{ name: string; priceCents: number }[]>(
    initialProduct?.extraOptions.map((e) => ({ name: e.name, priceCents: e.priceCents })) ?? []
  );
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [maxAccompaniments, setMaxAccompaniments] = useState(
    initialProduct?.maxAccompaniments != null ? String(initialProduct.maxAccompaniments) : ""
  );
const [optionGroups, setOptionGroups] = useState <
  {
    name: string;
    minSelect: number;
    maxSelect: number | null;
    pricingStyle: "SUM" | "FIXED" | "HIGHEST";
    fixedPriceCents: number | null;
    order: number;
    items: { name: string; priceCents: number; order: number }[];
  }[]
>(
  initialProduct?.optionGroups.map((g) => ({
    name: g.name,
    minSelect: g.minSelect,
    maxSelect: g.maxSelect,
    pricingStyle: g.pricingStyle,
    fixedPriceCents: g.fixedPriceCents,
    order: g.order,
    items: g.items.map((i) => ({ name: i.name, priceCents: i.priceCents, order: i.order })),
  })) ?? []
);
  const [groupItemDrafts, setGroupItemDrafts] = useState<{ name: string; price: string }[]>([]);

  const [availableInsumos, setAvailableInsumos] = useState<{ id: string; name: string; unit: string; costPerUnit: number }[]>([]);
  const [recipeItems, setRecipeItems] = useState<{ insumoId: string; quantity: number }[]>(
    initialProduct?.recipeItems.map((r) => ({ insumoId: r.insumo.id, quantity: r.quantity })) ?? []
  );
  const [recipeDraft, setRecipeDraft] = useState({ insumoId: "", quantity: "" });

  useEffect(() => {
    fetch("/api/admin/insumos")
      .then((r) => r.json())
      .then(setAvailableInsumos)
      .catch(() => {});
  }, []);

  function addRecipeItem() {
    if (!recipeDraft.insumoId || !recipeDraft.quantity) return;
    setRecipeItems((cur) => [
      ...cur.filter((r) => r.insumoId !== recipeDraft.insumoId),
      { insumoId: recipeDraft.insumoId, quantity: Number(recipeDraft.quantity) },
    ]);
    setRecipeDraft({ insumoId: "", quantity: "" });
  }

  function removeRecipeItem(insumoId: string) {
    setRecipeItems((cur) => cur.filter((r) => r.insumoId !== insumoId));
  }

  const recipeCostCents = recipeItems.reduce((sum, r) => {
    const insumo = availableInsumos.find((i) => i.id === r.insumoId);
    return sum + (insumo ? insumo.costPerUnit * r.quantity : 0);
  }, 0);

  function addGroup() {
    setOptionGroups((gs) => [
      ...gs,
      { name: "", minSelect: 0, maxSelect: null, pricingStyle: "SUM", fixedPriceCents: null, order: gs.length, items: [] },
    ]);
    setGroupItemDrafts((d) => [...d, { name: "", price: "" }]);
  }

  function removeGroup(index: number) {
    setOptionGroups((gs) => gs.filter((_, i) => i !== index));
    setGroupItemDrafts((d) => d.filter((_, i) => i !== index));
  }

  function updateGroup(index: number, patch: Partial<(typeof optionGroups)[number]>) {
    setOptionGroups((gs) => gs.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }

  function addItemToGroup(groupIndex: number) {
    const draft = groupItemDrafts[groupIndex];
    if (!draft?.name.trim()) return;
    const priceCents = Math.round(Number(draft.price || "0") * 100);
    setOptionGroups((gs) =>
      gs.map((g, i) =>
        i === groupIndex ? { ...g, items: [...g.items, { name: draft.name.trim(), priceCents, order: g.items.length }] } : g
      )
    );
    setGroupItemDrafts((d) => d.map((x, i) => (i === groupIndex ? { name: "", price: "" } : x)));
  }

  function removeItemFromGroup(groupIndex: number, itemIndex: number) {
    setOptionGroups((gs) =>
      gs.map((g, i) => (i === groupIndex ? { ...g, items: g.items.filter((_, ii) => ii !== itemIndex) } : g))
    );
  }
  const [availableDays, setAvailableDays] = useState<number[]>(initialProduct?.availableDays ?? []);
  const [visibleToCustomer, setVisibleToCustomer] = useState(initialProduct?.visibleToCustomer ?? true);
  const [visibleToStaff, setVisibleToStaff] = useState(initialProduct?.visibleToStaff ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function addRemovable() {
    if (!removableInput.trim()) return;
    setRemovables((r) => [...r, removableInput.trim()]);
    setRemovableInput("");
  }

  function removeRemovable(index: number) {
    setRemovables((r) => r.filter((_, i) => i !== index));
  }

  function addExtra() {
    if (!extraName.trim() || !extraPrice) return;
    setExtras((ex) => [...ex, { name: extraName.trim(), priceCents: Math.round(Number(extraPrice) * 100) }]);
    setExtraName("");
    setExtraPrice("");
  }

  function removeExtra(index: number) {
    setExtras((ex) => ex.filter((_, i) => i !== index));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/products/image", { method: "POST", body: formData });

    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível enviar a imagem.");
      return;
    }
    const data = await res.json();
    setImageUrl(data.imageUrl);
    e.target.value = ""; // permite escolher o mesmo arquivo de novo, se precisar
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const priceCents = Math.round(Number(price) * 100);
    if (!name.trim() || !priceCents || !categoryId) {
      setError("Preencha nome, preço e categoria.");
      return;
    }
    setSaving(true);

    const payload = {
      name,
      description: description || undefined,
      priceCents,
      imageUrl,
      categoryId,
      removableOptions: removables,
      extraOptions: extras,
      maxAccompaniments: maxAccompaniments ? Number(maxAccompaniments) : undefined,
      optionGroups,
      recipeItems,
      availableDays,
      visibleToCustomer,
      visibleToStaff,
    };

    const res = isEditing
      ? await fetch(`/api/admin/products/${initialProduct!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (!res.ok) {
      setError("Não foi possível salvar. Confira os campos.");
      return;
    }
    onSaved();
  }

  const inputBaseClass =
    "px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow duration-[180ms]";
  const inputClass = `w-full ${inputBaseClass}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-2xl max-h-[88vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-border shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{isEditing ? "Editar Produto" : "Novo Produto"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors duration-[180ms]" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <Label>Nome</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço (R$)</Label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" min="0.01" className={inputClass} />
            </div>
            <div>
              <Label>Categoria</Label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={2} />
          </div>

          <div>
            <Label>Imagem do prato</Label>
            <div className="flex items-center gap-3">
              {imageUrl && (
                <img src={imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg border border-surface-border shrink-0" />
              )}
              <label
                className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-surface-border text-sm text-gray-500 cursor-pointer hover:border-brand hover:text-brand transition-colors duration-[180ms] ${uploading ? "opacity-60 pointer-events-none" : ""}`}
              >
                <Upload size={16} />
                {uploading ? "Enviando..." : imageUrl ? "Trocar imagem" : "Enviar imagem do PC"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <details className="mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer select-none">ou colar uma URL de imagem</summary>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={`${inputClass} mt-2`}
                placeholder="https://..."
              />
            </details>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-start gap-2 p-3 rounded-xl border border-surface-border cursor-pointer hover:border-brand transition-colors duration-[180ms]">
              <input
                type="checkbox"
                checked={visibleToCustomer}
                onChange={(e) => setVisibleToCustomer(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-gray-600">
                <span className="block font-semibold text-gray-800">Visível pro cliente</span>
                Aparece no cardápio público (delivery / QR code)
              </span>
            </label>
            <label className="flex items-start gap-2 p-3 rounded-xl border border-surface-border cursor-pointer hover:border-brand transition-colors duration-[180ms]">
              <input
                type="checkbox"
                checked={visibleToStaff}
                onChange={(e) => setVisibleToStaff(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-gray-600">
                <span className="block font-semibold text-gray-800">Visível pro garçom</span>
                Aparece no app do garçom pra montar pedido
              </span>
            </label>
          </div>

          <hr className="border-surface-border" />

          <div>
            <Label>Ingredientes removíveis</Label>
            <div className="flex gap-2 mb-2">
              <input
                value={removableInput}
                onChange={(e) => setRemovableInput(e.target.value)}
                placeholder="ex: Cebola"
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="button"
                onClick={addRemovable}
                className="px-3.5 py-2 rounded-full border border-surface-border text-xs font-semibold text-gray-600 shrink-0 hover:bg-gray-50 transition-colors duration-[180ms]"
              >
                Adicionar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {removables.map((r, i) => (
                <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  {r}
                  <button type="button" onClick={() => removeRemovable(i)} className="text-gray-400 hover:text-red-500">
                    <X size={11} />
                  </button>
                </span>
              ))}
              {removables.length === 0 && <span className="text-xs text-gray-300">Nenhum</span>}
            </div>
          </div>

          <div>
            <Label>Extras pagos</Label>
            <div className="flex gap-2 mb-3">
              <input
                value={extraName}
                onChange={(e) => setExtraName(e.target.value)}
                placeholder="ex: Ovo frito"
                className={`flex-1 min-w-0 ${inputBaseClass}`}
              />
              <input
                value={extraPrice}
                onChange={(e) => setExtraPrice(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="R$"
                className={`w-20 shrink-0 ${inputBaseClass}`}
              />
              <button
                type="button"
                onClick={addExtra}
                className="px-3.5 py-2 rounded-full border border-surface-border text-xs font-semibold text-gray-600 shrink-0 hover:bg-gray-50 transition-colors duration-[180ms]"
              >
                Adicionar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {extras.map((ex, i) => (
                <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  {ex.name} · {currency(ex.priceCents)}
                  <button type="button" onClick={() => removeExtra(i)} className="text-gray-400 hover:text-red-500">
                    <X size={11} />
                  </button>
                </span>
              ))}
              {extras.length === 0 && <span className="text-xs text-gray-300">Nenhum</span>}
            </div>

            <div className="mt-3">
              <Label>Monte seu prato — limite de acompanhamentos (opcional)</Label>
              <p className="text-xs text-gray-400 mb-1.5">
                Preenchido, o cliente só consegue escolher até esse número de itens da lista acima. Vazio = sem limite (como hoje).
              </p>
              <input
                value={maxAccompaniments}
                onChange={(e) => setMaxAccompaniments(e.target.value)}
                type="number"
                min="1"
                placeholder="ex: 3"
                className={`w-24 ${inputBaseClass}`}
              />
            </div>
          </div>

          <hr className="border-surface-border" />

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Grupos de opção (avançado)</Label>
              <button
                type="button"
                onClick={addGroup}
                className="text-xs font-semibold text-brand hover:underline shrink-0"
              >
                + Adicionar grupo
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Pra produtos tipo &quot;Monte seu Pedido&quot;: várias etapas, cada uma com seu próprio mínimo/máximo e forma de cobrar. Não mexe em nada se você não usar isso.
            </p>

            {optionGroups.length === 0 && <span className="text-xs text-gray-300">Nenhum grupo</span>}

            <div className="space-y-3">
              {optionGroups.map((group, gi) => (
                <div key={gi} className="rounded-xl border border-surface-border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={group.name}
                      onChange={(e) => updateGroup(gi, { name: e.target.value })}
                      placeholder="Nome do grupo (ex: Acompanhamentos)"
                      className={`flex-1 ${inputBaseClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeGroup(gi)}
                      className="text-gray-300 hover:text-red-500 shrink-0"
                      aria-label="Remover grupo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <Label>Mínimo</Label>
                      <input
                        value={group.minSelect}
                        onChange={(e) => updateGroup(gi, { minSelect: Number(e.target.value) || 0 })}
                        type="number"
                        min="0"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <Label>Máximo</Label>
                      <input
                        value={group.maxSelect ?? ""}
                        onChange={(e) => updateGroup(gi, { maxSelect: e.target.value ? Number(e.target.value) : null })}
                        type="number"
                        min="1"
                        placeholder="Sem limite"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <Label>Estilo de preço</Label>
                      <select
                        value={group.pricingStyle}
                        onChange={(e) => updateGroup(gi, { pricingStyle: e.target.value as typeof group.pricingStyle })}
                        className={inputClass}
                      >
                        <option value="SUM">Somatório</option>
                        <option value="FIXED">Preço fixo</option>
                        <option value="HIGHEST">Maior valor</option>
                      </select>
                    </div>
                  </div>

                  {group.pricingStyle === "FIXED" && (
                    <div className="mb-2">
                      <Label>Valor fixo do grupo (R$)</Label>
                      <input
                        value={group.fixedPriceCents != null ? group.fixedPriceCents / 100 : ""}
                        onChange={(e) => updateGroup(gi, { fixedPriceCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="ex: 5.00"
                        className={`w-32 ${inputBaseClass}`}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mb-2">
                    <input
                      value={groupItemDrafts[gi]?.name ?? ""}
                      onChange={(e) =>
                        setGroupItemDrafts((d) => d.map((x, i) => (i === gi ? { ...x, name: e.target.value } : x)))
                      }
                      placeholder="Nome da opção (ex: Manga)"
                      className={`flex-1 min-w-0 ${inputBaseClass}`}
                    />
                    <input
                      value={groupItemDrafts[gi]?.price ?? ""}
                      onChange={(e) =>
                        setGroupItemDrafts((d) => d.map((x, i) => (i === gi ? { ...x, price: e.target.value } : x)))
                      }
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$"
                      className={`w-20 shrink-0 ${inputBaseClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => addItemToGroup(gi)}
                      className="px-3.5 py-2 rounded-full border border-surface-border text-xs font-semibold text-gray-600 shrink-0 hover:bg-gray-50 transition-colors duration-[180ms]"
                    >
                      Adicionar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item, ii) => (
                      <span key={ii} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {item.name} · {currency(item.priceCents)}
                        <button type="button" onClick={() => removeItemFromGroup(gi, ii)} className="text-gray-400 hover:text-red-500">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    {group.items.length === 0 && <span className="text-xs text-gray-300">Nenhuma opção ainda</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-surface-border" />

          <div>
            <Label>Ficha técnica (opcional)</Label>
            <p className="text-xs text-gray-400 mb-3">
              Quais insumos esse prato consome, e quanto de cada um. Deixe vazio se não quiser controlar estoque pra esse produto.
            </p>

            {availableInsumos.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Nenhum insumo cadastrado ainda —{" "}
                <a href="/admin/insumos" target="_blank" className="text-brand underline">
                  cadastre em Insumos
                </a>{" "}
                primeiro.
              </p>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <select
                    value={recipeDraft.insumoId}
                    onChange={(e) => setRecipeDraft((d) => ({ ...d, insumoId: e.target.value }))}
                    className={`flex-1 min-w-0 ${inputBaseClass}`}
                  >
                    <option value="">Selecione o insumo</option>
                    {availableInsumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    value={recipeDraft.quantity}
                    onChange={(e) => setRecipeDraft((d) => ({ ...d, quantity: e.target.value }))}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Qtd"
                    className={`w-20 shrink-0 ${inputBaseClass}`}
                  />
                  <button
                    type="button"
                    onClick={addRecipeItem}
                    className="px-3.5 py-2 rounded-full border border-surface-border text-xs font-semibold text-gray-600 shrink-0 hover:bg-gray-50 transition-colors duration-[180ms]"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {recipeItems.map((r) => {
                    const insumo = availableInsumos.find((i) => i.id === r.insumoId);
                    if (!insumo) return null;
                    return (
                      <span key={r.insumoId} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {r.quantity} {insumo.unit} de {insumo.name}
                        <button type="button" onClick={() => removeRecipeItem(r.insumoId)} className="text-gray-400 hover:text-red-500">
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })}
                  {recipeItems.length === 0 && <span className="text-xs text-gray-300">Nenhum insumo vinculado</span>}
                </div>

                {recipeItems.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Custo de produção estimado: <strong className="text-gray-700">{currency(recipeCostCents)}</strong>
                    {price && Number(price) > 0 && (
                      <> · Margem: <strong className="text-emerald-600">{currency(Math.round(Number(price) * 100) - recipeCostCents)}</strong></>
                    )}
                  </p>
                )}
              </>
            )}
          </div>

          <hr className="border-surface-border" />

          <div>
            <Label>Disponível em (deixe tudo desmarcado para aparecer todo dia)</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_SHORT.map((label, day) => {
                const active = availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setAvailableDays((cur) => (active ? cur.filter((d) => d !== day) : [...cur, day]))}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors duration-[180ms]"
                    style={{
                      borderColor: active ? "#059669" : "#E5E7EB",
                      background: active ? "#059669" : "#FFFFFF",
                      color: active ? "#FFFFFF" : "#374151",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-surface-border shrink-0">
          <Button type="submit" isLoading={saving} className="w-full">
            {isEditing ? "Salvar Alterações" : "Salvar Produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
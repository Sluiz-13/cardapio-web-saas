"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Pencil } from "lucide-react";

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
  removableOptions: { id: string; name: string }[];
  extraOptions: { id: string; name: string; priceCents: number }[];
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
    if (!confirm("Remover esse produto do cardápio?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  const modalOpen = showCreateForm || editingProduct !== null;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col items-start gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={categories.length === 0}
          className="flex items-center gap-1 px-4 py-2.5 rounded-full font-semibold text-sm bg-emerald-600 text-white shadow-sm disabled:opacity-40"
          title={categories.length === 0 ? "Cadastre uma categoria primeiro" : ""}
        >
          <Plus size={14} /> Novo Produto
        </button>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-chili mb-4">
          Cadastre pelo menos uma categoria antes de adicionar produtos.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100 sm:flex-nowrap"
            >
              {p.imageUrl && (
                <img src={p.imageUrl} className="w-12 h-12 object-cover rounded-lg" alt="" />
              )}
              <div className="flex-1 min-w-[8rem]">
                <p className="font-bold text-sm text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-400">{p.category.name}</p>
              </div>
              <span className="text-emerald-600 font-bold text-sm">{currency(p.priceCents)}</span>
              <button
                onClick={() => toggleActive(p)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: p.active ? "#059669" : "#D1D5DB",
                  color: "#FFFFFF",
                }}
              >
                {p.active ? "Ativo" : "Inativo"}
              </button>
              <button onClick={() => setEditingProduct(p)} className="text-gray-300 hover:text-emerald-600 transition-colors">
                <Pencil size={15} />
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-chili transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {products.length === 0 && <p className="text-sm text-gray-400">Nenhum produto cadastrado ainda.</p>}
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
  const [removables, setRemovables] = useState<string[]>(
    initialProduct?.removableOptions.map((r) => r.name) ?? []
  );
  const [removableInput, setRemovableInput] = useState("");
  const [extras, setExtras] = useState<{ name: string; priceCents: number }[]>(
    initialProduct?.extraOptions.map((e) => ({ name: e.name, priceCents: e.priceCents })) ?? []
  );
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [saving, setSaving] = useState(false);
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
      imageUrl: imageUrl || undefined,
      categoryId,
      removableOptions: removables,
      extraOptions: extras,
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

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-chili/30 focus:border-chili transition-shadow";

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-2xl p-4 sm:p-5 max-h-[88vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Preço (R$)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Categoria</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={2} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">URL da imagem</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputClass} placeholder="https://..." />
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Ingredientes removíveis</label>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input
              value={removableInput}
              onChange={(e) => setRemovableInput(e.target.value)}
              placeholder="ex: Cebola"
              className={`flex-1 ${inputClass}`}
            />
            <button type="button" onClick={addRemovable} className="px-3.5 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-600">
              Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {removables.map((r, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {r}
                <button type="button" onClick={() => removeRemovable(i)} className="text-gray-400 hover:text-chili">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Extras pagos</label>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input value={extraName} onChange={(e) => setExtraName(e.target.value)} placeholder="ex: Ovo frito" className={`flex-1 ${inputClass}`} />
            <input value={extraPrice} onChange={(e) => setExtraPrice(e.target.value)} type="number" step="0.01" placeholder="R$" className={`w-full sm:w-24 ${inputClass}`} />
            <button type="button" onClick={addExtra} className="px-3.5 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-600">
              Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {extras.map((ex, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {ex.name} · {currency(ex.priceCents)}
                <button type="button" onClick={() => removeExtra(i)} className="text-gray-400 hover:text-chili">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {error && <p className="text-chili text-xs mb-3">{error}</p>}

        <button
          disabled={saving}
          className="w-full py-3 rounded-full font-semibold text-sm bg-chili text-white shadow-sm disabled:opacity-50"
        >
          {saving ? "Salvando…" : isEditing ? "Salvar Alterações" : "Salvar Produto"}
        </button>
      </form>
    </div>
  );
}

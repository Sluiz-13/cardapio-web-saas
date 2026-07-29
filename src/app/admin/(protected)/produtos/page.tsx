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
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl uppercase">Produtos</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={categories.length === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-sm font-display uppercase text-xs bg-herb text-paper disabled:opacity-40"
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
        <p className="text-sm text-ink/50">Carregando…</p>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-sm bg-paper-dim border border-ink/10"
            >
              {p.imageUrl && (
                <img src={p.imageUrl} className="w-12 h-12 object-cover rounded-sm" alt="" />
              )}
              <div className="flex-1">
                <p className="font-display text-sm uppercase">{p.name}</p>
                <p className="text-[11px] text-ink/50">{p.category.name}</p>
              </div>
              <span className="font-mono text-sm">{currency(p.priceCents)}</span>
              <button
                onClick={() => toggleActive(p)}
                className="text-[11px] font-display uppercase px-2.5 py-1 rounded-sm"
                style={{
                  background: p.active ? "#4C6449" : "#B0A896",
                  color: "#F6EFE3",
                }}
              >
                {p.active ? "Ativo" : "Inativo"}
              </button>
              <button onClick={() => setEditingProduct(p)} className="text-ink/40 hover:text-herb">
                <Pencil size={15} />
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-ink/40 hover:text-chili">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {products.length === 0 && <p className="text-sm text-ink/50">Nenhum produto cadastrado ainda.</p>}
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

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-paper rounded-sm p-5 max-h-[88vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg uppercase">
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </h2>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Preço (R$)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Categoria</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" rows={2} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-mono uppercase mb-1 text-ink/60">URL da imagem</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" placeholder="https://..." />
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Ingredientes removíveis</label>
          <div className="flex gap-2 mb-2">
            <input
              value={removableInput}
              onChange={(e) => setRemovableInput(e.target.value)}
              placeholder="ex: Cebola"
              className="flex-1 px-3 py-1.5 rounded-sm border border-ink/15 bg-white text-sm"
            />
            <button type="button" onClick={addRemovable} className="px-3 py-1.5 rounded-sm border border-ink/15 text-xs font-display uppercase">
              Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {removables.map((r, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-sm bg-paper-dim border border-ink/10">
                {r}
                <button type="button" onClick={() => removeRemovable(i)} className="text-ink/40 hover:text-chili">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Extras pagos</label>
          <div className="flex gap-2 mb-2">
            <input value={extraName} onChange={(e) => setExtraName(e.target.value)} placeholder="ex: Ovo frito" className="flex-1 px-3 py-1.5 rounded-sm border border-ink/15 bg-white text-sm" />
            <input value={extraPrice} onChange={(e) => setExtraPrice(e.target.value)} type="number" step="0.01" placeholder="R$" className="w-20 px-3 py-1.5 rounded-sm border border-ink/15 bg-white text-sm" />
            <button type="button" onClick={addExtra} className="px-3 py-1.5 rounded-sm border border-ink/15 text-xs font-display uppercase">
              Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {extras.map((ex, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-sm bg-paper-dim border border-ink/10">
                {ex.name} · {currency(ex.priceCents)}
                <button type="button" onClick={() => removeExtra(i)} className="text-ink/40 hover:text-chili">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {error && <p className="text-chili text-xs mb-3">{error}</p>}

        <button
          disabled={saving}
          className="w-full py-3 rounded-sm font-display uppercase text-sm bg-chili text-paper disabled:opacity-50"
        >
          {saving ? "Salvando…" : isEditing ? "Salvar Alterações" : "Salvar Produto"}
        </button>
      </form>
    </div>
  );
}
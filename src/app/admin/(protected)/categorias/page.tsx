"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Category = { id: string; name: string; order: number };

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, order: categories.length }),
    });
    setName("");
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover essa categoria? Produtos vinculados também serão afetados.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="font-display text-2xl uppercase mb-4">Categorias</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da categoria (ex: Carnes)"
          className="flex-1 px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm"
        />
        <button
          disabled={saving}
          className="flex items-center gap-1 px-4 py-2 rounded-sm font-display uppercase text-xs bg-herb text-paper disabled:opacity-50"
        >
          <Plus size={14} /> Adicionar
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-ink/50">Carregando…</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-ink/50">Nenhuma categoria cadastrada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-sm bg-paper-dim border border-ink/10"
            >
              <span className="font-display uppercase text-sm">{cat.name}</span>
              <button onClick={() => handleDelete(cat.id)} className="text-ink/40 hover:text-chili">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
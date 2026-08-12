"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, FolderOpen, Pencil, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Category = { id: string; name: string; order: number };

export default function CategoriasPage() {
  const { show } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Edição inline de nome
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Evita clique duplo nas setas de mover enquanto uma troca ainda está salvando
  const [movingId, setMovingId] = useState<string | null>(null);

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
    setError("");

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, order: categories.length }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(typeof data?.error === "string" ? data.error : "Não foi possível criar a categoria.");
      return;
    }

    setName("");
    show("Categoria criada.", "success");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover essa categoria?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      show(typeof data?.error === "string" ? data.error : "Não foi possível remover.", "error");
      return;
    }
    show("Categoria removida.", "info");
    load();
  }

  function startEditing(cat: Category) {
    setEditingId(cat.id);
    setEditValue(cat.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditValue("");
  }

  async function saveRename(id: string) {
    if (!editValue.trim() || editValue.trim().length < 2) {
      show("O nome precisa ter pelo menos 2 letras.", "error");
      return;
    }
    setRenaming(true);
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editValue.trim() }),
    });
    setRenaming(false);

    if (!res.ok) {
      show("Não foi possível renomear.", "error");
      return;
    }
    setEditingId(null);
    setEditValue("");
    show("Categoria renomeada.", "success");
    load();
  }

  // Troca a posição de duas categorias adjacentes, trocando o campo `order`
  // de cada uma. As duas chamadas rodam em paralelo — como são categorias
  // diferentes, não há risco de conflito entre elas.
  async function move(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const current = categories[index];
    const target = categories[targetIndex];
    setMovingId(current.id);

    // Atualização otimista: já reordena na tela antes da resposta do
    // servidor voltar, pra parecer instantâneo.
    const reordered = [...categories];
    reordered[index] = target;
    reordered[targetIndex] = current;
    setCategories(reordered);

    await Promise.all([
      fetch(`/api/admin/categories/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: target.order }),
      }),
      fetch(`/api/admin/categories/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: current.order }),
      }),
    ]);

    setMovingId(null);
    load(); // confirma com o servidor, corrige se algo deu errado
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Categorias</h1>

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2 items-start">
            <div className="flex-1 w-full">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da categoria (ex: Carnes)"
                className="mb-0"
                error={error || undefined}
              />
            </div>
            <Button type="submit" isLoading={saving} className="shrink-0">
              <Plus size={14} /> Adicionar
            </Button>
          </form>
        </CardBody>
      </Card>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={18} />}
          title="Nenhuma categoria cadastrada ainda"
          description="Crie a primeira categoria acima."
        />
      ) : (
        <div className="space-y-2">
          {categories.map((cat, index) => (
            <Card key={cat.id}>
              <CardBody className="flex items-center justify-between !py-3.5 gap-2">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(cat.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-brand/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                      onClick={() => saveRename(cat.id)}
                      disabled={renaming}
                      className="text-emerald-600 hover:text-emerald-700 shrink-0 disabled:opacity-50"
                      aria-label="Salvar nome"
                    >
                      <Check size={17} />
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={renaming}
                      className="text-gray-400 hover:text-gray-600 shrink-0 disabled:opacity-50"
                      aria-label="Cancelar"
                    >
                      <X size={17} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => move(index, "up")}
                        disabled={index === 0 || movingId !== null}
                        className="text-gray-300 hover:text-gray-700 disabled:opacity-20 disabled:hover:text-gray-300 transition-colors duration-[180ms]"
                        aria-label="Mover para cima"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => move(index, "down")}
                        disabled={index === categories.length - 1 || movingId !== null}
                        className="text-gray-300 hover:text-gray-700 disabled:opacity-20 disabled:hover:text-gray-300 transition-colors duration-[180ms]"
                        aria-label="Mover para baixo"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <span className="font-semibold text-sm text-gray-800 flex-1 min-w-0 truncate">{cat.name}</span>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => startEditing(cat)}
                        className="text-gray-300 hover:text-brand transition-colors duration-[180ms]"
                        aria-label="Editar nome"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors duration-[180ms]"
                        aria-label="Remover categoria"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
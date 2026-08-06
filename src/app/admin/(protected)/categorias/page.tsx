"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, FolderOpen } from "lucide-react";
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
    if (!confirm("Remover essa categoria? Produtos vinculados também serão afetados.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    show("Categoria removida.", "info");
    load();
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
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardBody className="flex items-center justify-between !py-3.5">
                <span className="font-semibold text-sm text-gray-800">{cat.name}</span>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors duration-[180ms]"
                  aria-label="Remover categoria"
                >
                  <Trash2 size={15} />
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
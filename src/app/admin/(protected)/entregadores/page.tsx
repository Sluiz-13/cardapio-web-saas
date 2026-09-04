"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Bike, UserX, Power } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Driver = { id: string; name: string; phone: string; active: boolean };

export default function EntregadoresPage() {
  const { show } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/drivers").then((r) => r.json());
    setDrivers(res);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("Preencha o nome e o telefone.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível salvar.");
      return;
    }
    setName("");
    setPhone("");
    show("Entregador adicionado.", "success");
    load();
  }

  async function toggleActive(driver: Driver) {
    await fetch(`/api/admin/drivers/${driver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !driver.active }),
    });
    show(driver.active ? "Entregador desativado." : "Entregador ativado.", "info");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esse entregador?")) return;
    await fetch(`/api/admin/drivers/${id}`, { method: "DELETE" });
    show("Entregador removido.", "info");
    load();
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-24 mb-6" />
        <Skeleton className="h-14 mb-2" />
        <Skeleton className="h-14" />
      </div>
    );
  }

  const inputClass =
    "px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow duration-[180ms]";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <PageHeader icon={Bike} title="Entregadores" subtitle="Cadastre quem faz as entregas do seu restaurante." />

      <Card className="mb-4">
        <CardBody>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do entregador"
              className={`flex-1 ${inputClass}`}
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefone"
              className={`sm:w-44 ${inputClass}`}
            />
            <Button type="submit" isLoading={saving} className="shrink-0">
              <Plus size={14} /> Adicionar
            </Button>
          </form>
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
        </CardBody>
      </Card>

      {drivers.length === 0 ? (
        <EmptyState
          icon={<UserX size={18} />}
          title="Nenhum entregador cadastrado"
          description="Cadastre seus entregadores pra poder atribuí-los aos pedidos de delivery."
        />
      ) : (
        <div className="space-y-2">
          {drivers.map((d) => (
            <Card key={d.id}>
              <CardBody className="flex items-center gap-3 !py-3.5">
                <Bike size={15} className={d.active ? "text-brand shrink-0" : "text-gray-300 shrink-0"} />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${d.active ? "text-gray-800" : "text-gray-400"}`}>
                    {d.name}
                  </p>
                  <p className="text-xs text-gray-400">{d.phone}</p>
                </div>
                <button
                  onClick={() => toggleActive(d)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors duration-[180ms] ${
                    d.active
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  <Power size={11} className="inline mr-1 -mt-0.5" />
                  {d.active ? "Ativo" : "Inativo"}
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors duration-[180ms]"
                  aria-label="Remover"
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
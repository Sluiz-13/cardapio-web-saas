"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Users, Lock } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type StaffMember = { id: string; name: string; email: string; role: "OWNER" | "GERENTE" | "CAIXA" | "STAFF" };

const ROLE_LABEL: Record<StaffMember["role"], string> = {
  OWNER: "Dono",
  GERENTE: "Gerente",
  CAIXA: "Caixa",
  STAFF: "Garçom",
};

const ROLE_DESCRIPTION: Record<"GERENTE" | "CAIXA" | "STAFF", string> = {
  GERENTE: "Vê tudo, menos Equipe, Configurações e Plano.",
  CAIXA: "Pedidos, mesas, comandas, caixa e entregas — sem financeiro/relatórios/cadastro.",
  STAFF: "Só a tela de anotar pedido por mesa (garçom), sem acesso ao painel.",
};

export default function EquipePage() {
  const { show } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STAFF" | "CAIXA" | "GERENTE">("STAFF");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/staff");
    setStaff(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(typeof data?.error === "string" ? data.error : "Não foi possível criar o acesso.");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setShowForm(false);
    show("Acesso criado. Passe o e-mail e a senha pro funcionário.", "success");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esse acesso? A pessoa não conseguirá mais logar.")) return;
    const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    if (!res.ok) {
      show("Não foi possível remover.", "error");
      return;
    }
    show("Acesso removido.", "info");
    load();
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-16 mb-2" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <PageHeader icon={Users} title="Equipe" subtitle="Quem tem acesso ao painel — dono e garçons." />
        <Button onClick={() => setShowForm(true)} className="shrink-0">
          <Plus size={14} /> Novo acesso
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardBody>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div>
                <Label>Papel</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["STAFF", "CAIXA", "GERENTE"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 rounded-xl text-sm font-semibold border transition-colors duration-[180ms] ${
                        role === r ? "border-brand bg-brand-light text-brand" : "border-surface-border text-gray-500"
                      }`}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">{ROLE_DESCRIPTION[role]}</p>
              </div>
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" isLoading={saving} className="flex-1">
                  Criar acesso
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {staff.length === 0 ? (
        <EmptyState icon={<Users size={18} />} title="Só você tem acesso ainda" description="Adicione um acesso de garçom quando precisar." />
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <Card key={s.id}>
              <CardBody className="flex items-center justify-between !py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={s.role === "OWNER" ? "brand" : "neutral"}>{ROLE_LABEL[s.role]}</Badge>
                  {s.role !== "OWNER" && (
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors duration-[180ms]"
                      aria-label="Remover acesso"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
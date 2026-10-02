"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Bike, UserX, Power, Calendar, Printer } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Driver = { id: string; name: string; phone: string; active: boolean };
type ReportDelivery = { id: string; address: string; neighborhood: string | null; feeCents: number; time: string };
type ReportEntry = { driverName: string; totalCents: number; averageCents: number; deliveries: ReportDelivery[] };

export default function EntregadoresPage() {
  const { show } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<ReportEntry[]>([]);
  const [loadingReport, setLoadingReport] = useState(true);

  async function loadReport(date: string) {
    setLoadingReport(true);
    const res = await fetch(`/api/admin/drivers/report?date=${date}`).then((r) => r.json());
    setReport(res);
    setLoadingReport(false);
  }

  useEffect(() => {
    loadReport(reportDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportDate]);

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
        <div className="space-y-2 mb-8">
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

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-gray-400" />
          <p className="text-xs uppercase tracking-wide font-semibold text-gray-400">Relatório do dia</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-surface-border text-sm"
          />
          <button
            onClick={() => window.open(`/admin/entregadores/relatorio/imprimir?date=${reportDate}`, "_blank")}
            disabled={report.length === 0}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-surface-border text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors duration-[180ms]"
            title="Imprimir relatório"
          >
            <Printer size={14} />
          </button>
        </div>
      </div>

      {loadingReport ? (
        <Skeleton className="h-20" />
      ) : report.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Nenhuma entrega concluída nesse dia.</p>
      ) : (
        <div className="space-y-3">
          {report.map((entry) => (
            <Card key={entry.driverName}>
              <CardBody>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm text-gray-900">{entry.driverName}</p>
                  <div className="text-right">
                    <p className="font-bold text-sm text-emerald-600">
                      {(entry.totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-xs text-gray-400">
                      média {(entry.averageCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-surface-border">
                  {entry.deliveries.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate pr-2">
                        {d.address}
                        {d.neighborhood ? ` — ${d.neighborhood}` : ""}
                      </span>
                      <span className="shrink-0 font-medium text-gray-700">
                        {(d.feeCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
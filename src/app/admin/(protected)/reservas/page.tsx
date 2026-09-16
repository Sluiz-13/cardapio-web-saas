"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, CalendarClock, Users2, Clock3 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Reservation = {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedFor: string;
  note: string | null;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED";
  table: { id: string; label: string } | null;
};
type TableOption = { id: string; label: string };

const STATUS_LABEL: Record<Reservation["status"], string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
};
const STATUS_TONE: Record<Reservation["status"], "neutral" | "success" | "brand" | "danger"> = {
  PENDING: "neutral",
  CONFIRMED: "success",
  COMPLETED: "brand",
  CANCELED: "danger",
};

export default function ReservasPage() {
  const { show } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const [r, t] = await Promise.all([
      fetch("/api/admin/reservations").then((r) => r.json()),
      fetch("/api/admin/tables").then((r) => r.json()),
    ]);
    setReservations(r);
    setTables(t.tables ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateReservation(id: string, patch: Partial<{ status: Reservation["status"]; tableId: string | null }>) {
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover essa reserva?")) return;
    await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    show("Reserva removida.", "info");
    load();
  }

  const activeReservations = reservations.filter((r) => r.status !== "CANCELED" && r.status !== "COMPLETED");
  const others = reservations.filter((r) => r.status === "CANCELED" || r.status === "COMPLETED");

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const now = new Date();
  const todayReservations = activeReservations.filter((r) => isSameDay(new Date(r.reservedFor), now));
  const upcomingReservations = activeReservations.filter((r) => !isSameDay(new Date(r.reservedFor), now));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <PageHeader icon={CalendarClock} title="Reservas" subtitle="Mesas reservadas por telefone/WhatsApp." />
        <Button onClick={() => setShowForm(true)} className="shrink-0">
          <Plus size={14} /> Nova
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState icon={<CalendarClock size={18} />} title="Nenhuma reserva ainda" description="Registre aqui quando alguém ligar ou mandar mensagem reservando mesa." />
      ) : (
        <>
          {todayReservations.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock3 size={13} className="text-brand" />
                <p className="text-xs uppercase tracking-wide font-bold text-brand">Hoje</p>
              </div>
              <div className="space-y-2">
                {todayReservations.map((r) => (
                  <ReservationCard key={r.id} reservation={r} tables={tables} onUpdate={updateReservation} onDelete={handleDelete} highlight />
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">Próximas</p>
            <div className="space-y-2">
              {upcomingReservations.map((r) => (
                <ReservationCard key={r.id} reservation={r} tables={tables} onUpdate={updateReservation} onDelete={handleDelete} />
              ))}
              {upcomingReservations.length === 0 && todayReservations.length === 0 && (
                <p className="text-sm text-gray-400">Nenhuma reserva pendente ou confirmada.</p>
              )}
              {upcomingReservations.length === 0 && todayReservations.length > 0 && (
                <p className="text-sm text-gray-400">Nenhuma outra reserva além de hoje.</p>
              )}
            </div>
          </div>

          {others.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">Concluídas / Canceladas</p>
              <div className="space-y-2 opacity-60">
                {others.map((r) => (
                  <ReservationCard key={r.id} reservation={r} tables={tables} onUpdate={updateReservation} onDelete={handleDelete} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showForm && (
        <ReservationFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            show("Reserva criada.", "success");
            load();
          }}
        />
      )}
    </div>
  );
}

function ReservationCard({
  reservation,
  tables,
  onUpdate,
  onDelete,
  highlight,
}: {
  reservation: Reservation;
  tables: TableOption[];
  onUpdate: (id: string, patch: Partial<{ status: Reservation["status"]; tableId: string | null }>) => void;
  onDelete: (id: string) => void;
  highlight?: boolean;
}) {
  const date = new Date(reservation.reservedFor);
  const timeLabel = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Card className={highlight ? "border-brand/40 bg-brand-light/30" : undefined}>
      <CardBody className="!py-3.5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {highlight && (
                <span className="font-bold text-base text-brand shrink-0">{timeLabel}</span>
              )}
              <p className="font-bold text-sm text-gray-900">{reservation.customerName}</p>
            </div>
            <p className="text-xs text-gray-400">
              {!highlight && (
                <>{date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às {timeLabel} · </>
              )}
              <Users2 size={11} className="inline -mt-0.5" /> {reservation.partySize} pessoa{reservation.partySize > 1 ? "s" : ""} · {reservation.customerPhone}
            </p>
            {reservation.note && <p className="text-xs text-gray-500 mt-1">{reservation.note}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge tone={STATUS_TONE[reservation.status]}>{STATUS_LABEL[reservation.status]}</Badge>
            <button onClick={() => onDelete(reservation.id)} className="text-gray-300 hover:text-red-500 transition-colors duration-[180ms]" aria-label="Remover">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-surface-border">
          <select
            value={reservation.status}
            onChange={(e) => onUpdate(reservation.id, { status: e.target.value as Reservation["status"] })}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-surface-border"
          >
            <option value="PENDING">Pendente</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="COMPLETED">Concluída</option>
            <option value="CANCELED">Cancelada</option>
          </select>
          <select
            value={reservation.table?.id ?? ""}
            onChange={(e) => onUpdate(reservation.id, { tableId: e.target.value || null })}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-surface-border"
          >
            <option value="">Sem mesa atribuída</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </CardBody>
    </Card>
  );
}

function ReservationFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow duration-[180ms]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!customerName.trim() || !customerPhone.trim() || !date || !time) {
      setError("Preencha nome, telefone, data e horário.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerPhone,
        partySize: Number(partySize) || 1,
        reservedFor: new Date(`${date}T${time}`).toISOString(),
        note: note || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Não foi possível salvar.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-border">
          <h2 className="text-lg font-bold text-gray-900">Nova Reserva</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <Label>Nome</Label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <Label>Telefone</Label>
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(35) 99999-9999" className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label>Data</Label>
              <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className={inputClass} />
            </div>
            <div>
              <Label>Hora</Label>
              <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className={inputClass} />
            </div>
          </div>
          <div>
            <Label>Nº de pessoas</Label>
            <input value={partySize} onChange={(e) => setPartySize(e.target.value)} type="number" min="1" className={`${inputClass} w-24`} />
          </div>
          <div>
            <Label>Observação (opcional)</Label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex: aniversário, mesa perto da janela" className={inputClass} />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-surface-border">
          <Button type="submit" isLoading={saving} className="w-full">
            Salvar Reserva
          </Button>
        </div>
      </form>
    </div>
  );
}
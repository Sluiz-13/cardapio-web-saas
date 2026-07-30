"use client";

import { useEffect, useState } from "react";
import { Power } from "lucide-react";

const DAY_LABELS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

type BusinessHour = { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string };

export default function ConfiguracoesPage() {
  const [restaurantIsOpen, setRestaurantIsOpen] = useState(true);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setRestaurantIsOpen(data.restaurant.isOpen);
        setHours(data.businessHours.sort((a: BusinessHour, b: BusinessHour) => a.dayOfWeek - b.dayOfWeek));
        setLoading(false);
      });
  }, []);

  function updateDay(dayOfWeek: number, patch: Partial<BusinessHour>) {
    setHours((hs) => hs.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)));
  }

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOpen: restaurantIsOpen, businessHours: hours }),
    });
    setSaving(false);
    if (res.ok) setSuccess(true);
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Carregando…</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Configurações</h1>

      <div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
            <Power size={14} className={restaurantIsOpen ? "text-emerald-600" : "text-chili"} />
            Loja {restaurantIsOpen ? "aberta" : "fechada"} manualmente
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Desligar aqui fecha a loja na hora, mesmo dentro do horário programado. Use para emergências.
          </p>
        </div>
        <button
          onClick={() => setRestaurantIsOpen((v) => !v)}
          className="relative w-12 h-7 rounded-full transition-colors shrink-0"
          style={{ background: restaurantIsOpen ? "#059669" : "#D1D5DB" }}
        >
          <span
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
            style={{ left: restaurantIsOpen ? "26px" : "4px" }}
          />
        </button>
      </div>

      <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">Horário de funcionamento</p>
      <div className="space-y-2 mb-6">
        {hours.map((h) => (
          <div
            key={h.dayOfWeek}
            className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100"
          >
            <button
              onClick={() => updateDay(h.dayOfWeek, { isOpen: !h.isOpen })}
              className="relative w-10 h-6 rounded-full transition-colors shrink-0"
              style={{ background: h.isOpen ? "#059669" : "#D1D5DB" }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                style={{ left: h.isOpen ? "20px" : "4px" }}
              />
            </button>
            <span className="text-sm font-medium text-gray-800 w-32 shrink-0">{DAY_LABELS[h.dayOfWeek]}</span>
            {h.isOpen ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={h.openTime}
                  onChange={(e) => updateDay(h.dayOfWeek, { openTime: e.target.value })}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm"
                />
                <span className="text-gray-400 text-sm">até</span>
                <input
                  type="time"
                  value={h.closeTime}
                  onChange={(e) => updateDay(h.dayOfWeek, { closeTime: e.target.value })}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">Fechado</span>
            )}
          </div>
        ))}
      </div>

      {success && <p className="text-emerald-600 text-xs mb-3">Configurações salvas.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-3 rounded-full font-semibold text-sm bg-chili text-white shadow-sm disabled:opacity-50"
      >
        {saving ? "Salvando…" : "Salvar Configurações"}
      </button>
    </div>
  );
}
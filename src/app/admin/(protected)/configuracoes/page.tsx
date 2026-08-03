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
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("RANDOM");
  const [pixMerchantName, setPixMerchantName] = useState("");
  const [pixMerchantCity, setPixMerchantCity] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setRestaurantIsOpen(data.restaurant.isOpen);
        setHours(data.businessHours.sort((a: BusinessHour, b: BusinessHour) => a.dayOfWeek - b.dayOfWeek));
        setLoading(false);
        setPixKey(data.restaurant.pixKey ?? "");
        setPixKeyType(data.restaurant.pixKeyType ?? "RANDOM");
        setPixMerchantName(data.restaurant.pixMerchantName ?? "");
        setPixMerchantCity(data.restaurant.pixMerchantCity ?? "");
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
      body: JSON.stringify({
        isOpen: restaurantIsOpen,
        businessHours: hours,
        pixKey: pixKey || undefined,
        pixKeyType,
        pixMerchantName: pixMerchantName || undefined,
        pixMerchantCity: pixMerchantCity || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) setSuccess(true);
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Carregando…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
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
         
      <div className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 mb-6">
        <p className="font-bold text-sm text-gray-900 mb-1">Pix</p>
        <p className="text-xs text-gray-500 mb-3">
          Sem gateway: o cliente paga direto na sua chave e você confere manualmente pelo app do banco.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Chave Pix</label>
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Tipo</label>
            <select value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm">
              <option value="RANDOM">Aleatória</option>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="EMAIL">E-mail</option>
              <option value="PHONE">Telefone</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Nome do titular</label>
            <input
              value={pixMerchantName}
              onChange={(e) => setPixMerchantName(e.target.value.slice(0, 25))}
              placeholder="Nome que aparece no Pix"
              maxLength={25}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Cidade</label>
            <input
              value={pixMerchantCity}
              onChange={(e) => setPixMerchantCity(e.target.value.slice(0, 15))}
              placeholder="ex: SAO PAULO"
              maxLength={15}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
            />
          </div>
        </div>
      </div>

      <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-2">Horário de funcionamento</p>
      <div className="space-y-2 mb-6">
        {hours.map((h) => (
          <div
            key={h.dayOfWeek}
            className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100 sm:flex-nowrap"
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
            <span className="text-sm font-medium text-gray-800 w-24 sm:w-32 shrink-0">{DAY_LABELS[h.dayOfWeek]}</span>
            {h.isOpen ? (
              <div className="flex flex-wrap items-center gap-2 flex-1">
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

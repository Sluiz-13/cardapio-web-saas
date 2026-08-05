"use client";

import { useEffect, useState } from "react";

export default function PlatformConfiguracoesPage() {
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("RANDOM");
  const [pixMerchantName, setPixMerchantName] = useState("");
  const [pixMerchantCity, setPixMerchantCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/platform/settings")
      .then((r) => r.json())
      .then((data) => {
        setPixKey(data.pixKey ?? "");
        setPixKeyType(data.pixKeyType ?? "RANDOM");
        setPixMerchantName(data.pixMerchantName ?? "");
        setPixMerchantCity(data.pixMerchantCity ?? "");
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    const res = await fetch("/api/platform/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pixKey, pixKeyType, pixMerchantName, pixMerchantCity }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(typeof data?.error === "string" ? data.error : "Não foi possível salvar.");
      return;
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  }

  const inputClass =
    "w-full mb-4 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-shadow";
  const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400";

  if (loading) return <p className="p-6 text-sm text-gray-400">Carregando…</p>;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Chave Pix da plataforma</h1>
      <p className="text-sm text-gray-500 mb-6">
        Usada pra gerar a cobrança de mensalidade que você envia manualmente pros donos de restaurante.
      </p>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className={labelClass}>Tipo de chave</label>
        <select className={inputClass} value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value)}>
          <option value="RANDOM">Aleatória</option>
          <option value="CPF">CPF</option>
          <option value="CNPJ">CNPJ</option>
          <option value="EMAIL">E-mail</option>
          <option value="PHONE">Telefone</option>
        </select>

        <label className={labelClass}>Chave Pix</label>
        <input className={inputClass} required value={pixKey} onChange={(e) => setPixKey(e.target.value)} />

        <label className={labelClass}>Nome do recebedor (máx. 25 caracteres)</label>
        <input
          className={inputClass}
          required
          maxLength={25}
          value={pixMerchantName}
          onChange={(e) => setPixMerchantName(e.target.value)}
        />

        <label className={labelClass}>Cidade (máx. 15 caracteres)</label>
        <input
          className={inputClass}
          required
          maxLength={15}
          value={pixMerchantCity}
          onChange={(e) => setPixMerchantCity(e.target.value)}
        />

        {error && <p className="text-chili text-xs mb-4">{error}</p>}
        {success && <p className="text-emerald-600 text-xs mb-4">Salvo com sucesso.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-full font-semibold text-sm bg-ink text-white shadow-sm disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </div>
  );
}
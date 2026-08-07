"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoRestaurantePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    restaurantName: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    plan: "START" as "START" | "PRO",
    couponCode: "",
    contactEmail: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function slugify(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/platform/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(typeof data?.error === "string" ? data.error : "Não foi possível criar o restaurante.");
      return;
    }

    router.push("/platform");
    router.refresh();
  }

  const inputClass =
    "w-full mb-4 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-shadow";
  const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Novo restaurante</h1>
      <p className="text-sm text-gray-500 mb-6">Crie Restaurante e o primeiro admin (OWNER) de uma vez.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className={labelClass}>Nome do restaurante</label>
        <input
          className={inputClass}
          required
          value={form.restaurantName}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              restaurantName: e.target.value,
              slug: f.slug === slugify(f.restaurantName) ? slugify(e.target.value) : f.slug,
            }))
          }
        />

        <label className={labelClass}>Slug (URL: /r/slug)</label>
        <input
          className={inputClass}
          required
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
        />

        <label className={labelClass}>Plano</label>
        <select
          className={inputClass}
          value={form.plan}
          onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as "START" | "PRO" }))}
        >
          <option value="START">START</option>
        </select>

        <hr className="my-4 border-gray-100" />

        <label className={labelClass}>Nome do dono (OWNER)</label>
        <input
          className={inputClass}
          required
          value={form.ownerName}
          onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
        />

        <label className={labelClass}>E-mail do dono</label>
        <input
          type="email"
          className={inputClass}
          required
          value={form.ownerEmail}
          onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
        />

        <label className={labelClass}>Senha inicial (mín. 8 caracteres)</label>
        <input
          type="password"
          className={inputClass}
          required
          minLength={8}
          value={form.ownerPassword}
          onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))}
        />
        <label className={labelClass}>E-mail de contato do restaurante (opcional)</label>
        <input
          type="email"
          className={inputClass}
          placeholder="contato@restaurante.com"
          value={form.contactEmail}
          onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
        />
        <p className="text-xs text-gray-400 -mt-3 mb-4">Separado do e-mail de login do dono. Usado pra notificações futuras.</p>

        <label className={labelClass}>Cupom de boas-vindas (opcional)</label>
        
        <input
          className={inputClass}
          placeholder="Ex: BEMVINDO20"
          value={form.couponCode}
          onChange={(e) => setForm((f) => ({ ...f, couponCode: e.target.value.toUpperCase() }))}
        />

        {error && <p className="text-chili text-xs mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full font-semibold text-sm bg-ink text-white shadow-sm disabled:opacity-50"
        >
          {loading ? "Criando…" : "Criar restaurante"}
        </button>
      </form>
    </div>
  );
}
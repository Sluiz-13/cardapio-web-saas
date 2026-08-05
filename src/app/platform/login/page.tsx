"use client";

import { useState } from "react";
import { platformSignIn } from "@/lib/platform-auth-client";
import { useRouter } from "next/navigation";

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { ok } = await platformSignIn(email, password);

    setLoading(false);

    if (!ok) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.push("/platform");
    router.refresh();
  }

  const inputClass =
    "w-full mb-4 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-shadow";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-1">
          cardapio-saas
        </p>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Painel da Plataforma</h1>
        <p className="text-xs text-gray-500 mb-6">Acesso restrito à equipe do SaaS.</p>

        <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />

        <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClass}
        />

        {error && <p className="text-chili text-xs mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full font-semibold text-sm bg-ink text-white shadow-sm disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
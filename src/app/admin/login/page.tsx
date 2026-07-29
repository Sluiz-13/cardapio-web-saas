"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-chalk px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-paper rounded-sm p-6"
      >
        <h1 className="font-display text-xl uppercase mb-1">Painel Administrativo</h1>
        <p className="text-xs text-ink/60 mb-6">Entre com sua conta para gerenciar o cardápio.</p>

        <label className="block text-xs font-mono uppercase mb-1 text-ink/60">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm"
        />

        <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm"
        />

        {error && <p className="text-chili text-xs mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-sm font-display uppercase text-sm bg-chili text-paper disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
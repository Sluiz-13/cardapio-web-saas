"use client";

import { useState } from "react";
import { platformSignIn } from "@/lib/platform-auth-client";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
          <ShieldCheck size={18} className="text-brand" />
        </div>
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">cardapio-saas</p>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Painel da Plataforma</h1>
        <p className="text-xs text-gray-500 mb-6">Acesso restrito à equipe do SaaS.</p>

        <Label>E-mail</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <Label>Senha</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="text-red-600 text-xs mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full font-semibold text-sm bg-gray-900 text-white shadow-sm hover:bg-black transition-colors duration-[180ms] disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
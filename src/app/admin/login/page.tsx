"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

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
    <div className="min-h-screen flex items-center justify-center bg-surface-bg px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-surface-border p-6">
        <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center mb-4">
          <UtensilsCrossed size={18} className="text-brand" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Painel Administrativo</h1>
        <p className="text-xs text-gray-500 mb-6">Entre com sua conta para gerenciar o cardápio.</p>

        <Label>E-mail</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <Label>Senha</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="text-red-600 text-xs mb-4">{error}</p>}

        <Button type="submit" isLoading={loading} className="w-full">
          Entrar
        </Button>
      </form>
    </div>
  );
}
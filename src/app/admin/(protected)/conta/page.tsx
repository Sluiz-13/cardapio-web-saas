"use client";

import { useState } from "react";

export default function ContaPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmação não bate com a nova senha.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível trocar a senha.");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="p-6 max-w-sm">
      <h1 className="font-display text-2xl uppercase mb-4">Minha Conta</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Senha atual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Nova senha</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm"
          />
        </div>

        {error && <p className="text-chili text-xs">{error}</p>}
        {success && <p className="text-herb text-xs">Senha alterada com sucesso.</p>}

        <button
          disabled={saving}
          className="w-full py-3 rounded-sm font-display uppercase text-sm bg-chili text-paper disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Trocar Senha"}
        </button>
      </form>
    </div>
  );
}
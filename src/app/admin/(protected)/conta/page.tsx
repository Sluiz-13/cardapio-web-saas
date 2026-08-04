"use client";

import { useState } from "react";

export default function ContaPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

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

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess(false);

    if (!newEmail.trim() || !currentPasswordForEmail) {
      setEmailError("Preencha a senha atual e o novo e-mail.");
      return;
    }

    setSavingEmail(true);
    const res = await fetch("/api/admin/account/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPasswordForEmail, newEmail }),
    });
    setSavingEmail(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setEmailError(data?.error ?? "Não foi possível trocar o e-mail.");
      return;
    }

    setEmailSuccess(true);
    setCurrentPasswordForEmail("");
    setNewEmail("");
  }

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-chili/30 focus:border-chili transition-shadow";

  return (
    <div className="p-4 sm:p-6 max-w-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Minha Conta</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Senha atual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Nova senha</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className="text-chili text-xs">{error}</p>}
        {success && <p className="text-emerald-600 text-xs">Senha alterada com sucesso.</p>}

        <button
          disabled={saving}
          className="w-full py-3 rounded-full font-semibold text-sm bg-chili text-white shadow-sm disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Trocar Senha"}
        </button>
      </form>
      <hr className="my-6 border-gray-100" />

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Trocar E-mail</h2>
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Senha atual</label>
            <input
              type="password"
              value={currentPasswordForEmail}
              onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Novo e-mail</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          {emailError && <p className="text-chili text-xs">{emailError}</p>}
          {emailSuccess && (
            <p className="text-emerald-600 text-xs">
              E-mail alterado. Use o novo e-mail no próximo login.
            </p>
          )}

          <button
            disabled={savingEmail}
            className="w-full py-3 rounded-full font-semibold text-sm bg-chili text-white shadow-sm disabled:opacity-50"
          >
            {savingEmail ? "Salvando…" : "Trocar E-mail"}
          </button>
        </form>
    </div>
  );
}

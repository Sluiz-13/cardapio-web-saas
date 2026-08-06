"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function ContaPage() {
  const { show } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

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

    show("Senha alterada com sucesso.", "success");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");

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

    show("E-mail alterado. Use o novo e-mail no próximo login.", "success");
    setCurrentPasswordForEmail("");
    setNewEmail("");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Minha Conta</h1>

      <Card className="mb-4">
        <CardBody>
          <p className="text-sm font-semibold text-gray-800 mb-3">Trocar Senha</p>
          <form onSubmit={handleSubmit}>
            <Label>Senha atual</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <Label>Nova senha</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Label>Confirmar nova senha</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

            {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

            <Button type="submit" isLoading={saving} className="w-full">
              Trocar Senha
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="text-sm font-semibold text-gray-800 mb-3">Trocar E-mail</p>
          <form onSubmit={handleEmailSubmit}>
            <Label>Senha atual</Label>
            <Input
              type="password"
              value={currentPasswordForEmail}
              onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
            />
            <Label>Novo e-mail</Label>
            <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />

            {emailError && <p className="text-red-600 text-xs mb-3">{emailError}</p>}

            <Button type="submit" isLoading={savingEmail} className="w-full">
              Trocar E-mail
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
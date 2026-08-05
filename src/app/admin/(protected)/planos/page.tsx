"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type PlanInfo = {
  plan: "START" | "PRO";
  dueDate: string;
  daysUntilDue: number;
  pendingPlanRequest: "START" | "PRO" | null;
  pendingPlanRequestedAt: string | null;
};

const FEATURES: { label: string; start: boolean; pro: boolean }[] = [
  { label: "Cardápio online", start: true, pro: true },
  { label: "Até 50 produtos / Ilimitado", start: true, pro: true },
  { label: "Até 6 categorias / Ilimitado", start: true, pro: true },
  { label: "Financeiro", start: true, pro: true },
  { label: "Cupons de desconto", start: false, pro: true },
  { label: "Notificações sonoras", start: false, pro: true },
  { label: "Exportação CSV", start: false, pro: true },
];

export default function PlanosPage() {
  const [info, setInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [charging, setCharging] = useState(false);
  const [charge, setCharge] = useState<{ payload: string; amountCents: number } | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/plan");
    setInfo(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function requestPlan(target: "START" | "PRO") {
    setRequesting(true);
    setError("");
    const res = await fetch("/api/admin/plan/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: target }),
    });
    setRequesting(false);
    if (!res.ok) {
      setError("Não foi possível registrar a solicitação.");
      return;
    }
    load();
  }

  async function generateCharge() {
    setCharging(true);
    setError("");
    const res = await fetch("/api/admin/plan/charge", { method: "POST" });
    setCharging(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(typeof data?.error === "string" ? data.error : "Não foi possível gerar a cobrança.");
      return;
    }
    const data = await res.json();
    setCharge({ payload: data.payload, amountCents: data.amountCents });
  }

  if (loading || !info) return <p className="p-6 text-sm text-gray-400">Carregando…</p>;

  const dueDateFormatted = new Date(info.dueDate).toLocaleDateString("pt-BR");
  const overdue = info.daysUntilDue < 0;
  const dueSoon = info.daysUntilDue >= 0 && info.daysUntilDue <= 3;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Seu plano</h1>
      <p className="text-sm text-gray-500 mb-4">
        Plano atual: <span className="font-semibold text-gray-800">{info.plan}</span> · Vencimento:{" "}
        <span className="font-semibold text-gray-800">{dueDateFormatted}</span>
      </p>

      {(overdue || dueSoon) && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            {overdue
              ? `Sua mensalidade venceu há ${Math.abs(info.daysUntilDue)} dia(s). Regularize para evitar suspensão.`
              : `Sua mensalidade vence em ${info.daysUntilDue} dia(s).`}
          </span>
        </div>
      )}

      {info.pendingPlanRequest && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-xl px-4 py-3 mb-4">
          Solicitação de troca pra <strong>{info.pendingPlanRequest}</strong> registrada. Gere a cobrança abaixo e
          pague — a troca é confirmada assim que o pagamento cair.
          <button
            onClick={generateCharge}
            disabled={charging}
            className="block mt-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-600 text-white disabled:opacity-50"
          >
            {charging ? "Gerando…" : "Gerar cobrança Pix"}
          </button>
        </div>
      )}

      {error && <p className="text-chili text-sm mb-4">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3 font-medium">Recurso</th>
              <th className="px-4 py-3 font-medium text-center">Start</th>
              <th className="px-4 py-3 font-medium text-center">Pro</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <tr key={f.label} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 text-gray-700">{f.label}</td>
                <td className="px-4 py-3 text-center">
                  {f.start ? (
                    <CheckCircle2 size={16} className="inline text-emerald-500" />
                  ) : (
                    <XCircle size={16} className="inline text-gray-300" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {f.pro ? (
                    <CheckCircle2 size={16} className="inline text-emerald-500" />
                  ) : (
                    <XCircle size={16} className="inline text-gray-300" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        {info.plan !== "PRO" && (
          <button
            onClick={() => requestPlan("PRO")}
            disabled={requesting || info.pendingPlanRequest === "PRO"}
            className="flex-1 py-3 rounded-full font-semibold text-sm bg-ink text-white shadow-sm disabled:opacity-50"
          >
            {info.pendingPlanRequest === "PRO" ? "Upgrade já solicitado" : "Fazer upgrade pra Pro"}
          </button>
        )}
        {info.plan !== "START" && (
          <button
            onClick={() => requestPlan("START")}
            disabled={requesting || info.pendingPlanRequest === "START"}
            className="flex-1 py-3 rounded-full font-semibold text-sm border border-gray-200 text-gray-600 disabled:opacity-50"
          >
            {info.pendingPlanRequest === "START" ? "Downgrade já solicitado" : "Voltar pro Start"}
          </button>
        )}
      </div>

      {charge && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {(charge.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-xs text-gray-400 mb-4">Escaneie no app do seu banco</p>
          <img
            src={`data:image/svg+xml;base64,${btoa(
              `<svg xmlns="http://www.w3.org/2000/svg"></svg>`
            )}`}
            className="hidden"
            alt=""
          />
          <p className="text-xs break-all bg-gray-50 rounded-lg p-3 font-mono">{charge.payload}</p>
        </div>
      )}
    </div>
  );
}
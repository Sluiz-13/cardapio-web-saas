"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Crown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";

type PlanInfo = {
  plan: "START" | "PRO";
  dueDate: string;
  daysUntilDue: number;
  pendingPlanRequest: "START" | "PRO" | null;
  pendingPlanRequestedAt: string | null;
};

const FEATURES: { label: string; start: boolean; pro: boolean }[] = [
  { label: "Cardápio online", start: true, pro: true },
  { label: "Até 150 produtos / Ilimitado", start: true, pro: true },
  { label: "Até 15 categorias / Ilimitado", start: true, pro: true },
  { label: "Financeiro", start: true, pro: true },
  { label: "Dashboard com gráfico", start: false, pro: true },
  { label: "Relatórios avançados", start: false, pro: true },
  { label: "Cupons de desconto", start: false, pro: true },
  { label: "Notificações sonoras", start: true, pro: true },
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

  if (loading || !info) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  const dueDateFormatted = new Date(info.dueDate).toLocaleDateString("pt-BR");
  const overdue = info.daysUntilDue < 0;
  const dueSoon = info.daysUntilDue >= 0 && info.daysUntilDue <= 3;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <PageHeader icon={Crown} title="Seu plano" />
        <Badge tone={info.plan === "PRO" ? "brand" : "neutral"}>{info.plan}</Badge>
      </div>
      <p className="text-sm text-gray-500 mb-6 -mt-4">
        Vencimento: <span className="font-semibold text-gray-800">{dueDateFormatted}</span>
      </p>

      {(overdue || dueSoon) && (
        <Card className="mb-4 !border-amber-200 !bg-amber-50">
          <CardBody className="!py-3.5">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <span className="text-sm text-amber-800">
                {overdue
                  ? `Sua mensalidade venceu há ${Math.abs(info.daysUntilDue)} dia(s). Regularize para evitar suspensão.`
                  : `Sua mensalidade vence em ${info.daysUntilDue} dia(s).`}
              </span>
            </div>
            <Button onClick={generateCharge} isLoading={charging} size="sm" className="mt-3 !bg-amber-600 hover:!bg-amber-700">
              Gerar cobrança Pix pra renovar
            </Button>
          </CardBody>
        </Card>
      )}

      {info.pendingPlanRequest && (
        <Card className="mb-4 !border-blue-200 !bg-blue-50">
          <CardBody className="!py-3.5">
            <p className="text-sm text-blue-800">
              Solicitação de troca pra <strong>{info.pendingPlanRequest}</strong> registrada. Gere a cobrança e
              pague — a troca é confirmada assim que o pagamento cair.
            </p>
            <Button
              onClick={generateCharge}
              isLoading={charging}
              size="sm"
              className="mt-3 !bg-blue-600 hover:!bg-blue-700"
            >
              Gerar cobrança Pix
            </Button>
          </CardBody>
        </Card>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <Table>
        <Thead>
          <Tr>
            <Th>Recurso</Th>
            <Th className="text-center">Start</Th>
            <Th className="text-center">Pro</Th>
          </Tr>
        </Thead>
        <Tbody>
          {FEATURES.map((f) => (
            <Tr key={f.label}>
              <Td>{f.label}</Td>
              <Td className="text-center">
                {f.start ? (
                  <CheckCircle2 size={16} className="inline text-emerald-500" />
                ) : (
                  <XCircle size={16} className="inline text-gray-300" />
                )}
              </Td>
              <Td className="text-center">
                {f.pro ? (
                  <CheckCircle2 size={16} className="inline text-emerald-500" />
                ) : (
                  <XCircle size={16} className="inline text-gray-300" />
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <div className="flex gap-3 mt-6">
        {info.plan !== "PRO" && (
          <Button
            onClick={() => requestPlan("PRO")}
            disabled={requesting || info.pendingPlanRequest === "PRO"}
            className="flex-1"
          >
            <Crown size={14} />
            {info.pendingPlanRequest === "PRO" ? "Upgrade já solicitado" : "Fazer upgrade pra Pro"}
          </Button>
        )}
        {info.plan !== "START" && (
          <Button
            variant="secondary"
            onClick={() => requestPlan("START")}
            disabled={requesting || info.pendingPlanRequest === "START"}
            className="flex-1"
          >
            {info.pendingPlanRequest === "START" ? "Downgrade já solicitado" : "Voltar pro Start"}
          </Button>
        )}
      </div>

      {charge && (
        <Card className="mt-6">
          <CardBody className="text-center">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {(charge.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <p className="text-xs text-gray-400 mb-4">Copie o código abaixo no app do seu banco</p>
            <p className="text-xs break-all bg-gray-50 rounded-lg p-3 font-mono">{charge.payload}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Crown, TrendingUp } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type PendingRequest = {
  id: string;
  name: string;
  slug: string;
  plan: "START" | "PRO";
  pendingPlanRequest: "START" | "PRO";
  pendingPlanRequestedAt: string;
};

type Overview = {
  startCount: number;
  proCount: number;
  pendingRequests: PendingRequest[];
};

export default function PlanosOverviewPage() {
  const { show } = useToast();
  const [data, setData] = useState<Overview | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/platform/plans-overview");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(r: PendingRequest) {
    setApprovingId(r.id);
    const res = await fetch(`/api/platform/restaurants/${r.id}/approve-plan-request`, { method: "POST" });
    setApprovingId(null);
    if (!res.ok) {
      show("Não foi possível aprovar.", "error");
      return;
    }
    show(`${r.name} agora está no plano ${r.pendingPlanRequest}.`, "success");
    load();
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-24 mb-6" />
      </div>
    );
  }

  const total = data.startCount + data.proCount;
  const proPct = total > 0 ? Math.round((data.proCount / total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Planos</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardBody>
            <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-1">Start</p>
            <p className="text-xl font-bold text-gray-900">{data.startCount} restaurantes</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-1.5 mb-1">
              <Crown size={13} className="text-brand" />
              <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Pro</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{data.proCount} restaurantes</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp size={11} /> {proPct}% da base
            </p>
          </CardBody>
        </Card>
      </div>

      <p className="text-sm font-semibold text-gray-800 mb-2">Solicitações pendentes</p>
      {data.pendingRequests.length === 0 ? (
        <EmptyState icon={<Crown size={18} />} title="Nenhuma solicitação pendente" description="Upgrades e downgrades pedidos pelos donos de restaurante aparecem aqui." />
      ) : (
        <div className="space-y-2">
          {data.pendingRequests.map((r) => (
            <Card key={r.id}>
              <CardBody className="flex items-center justify-between !py-3.5">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <Badge tone="neutral">{r.plan}</Badge>
                    <span>→</span>
                    <Badge tone={r.pendingPlanRequest === "PRO" ? "brand" : "neutral"}>{r.pendingPlanRequest}</Badge>
                  </p>
                </div>
                <Button size="sm" isLoading={approvingId === r.id} onClick={() => handleApprove(r)}>
                  Aprovar
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
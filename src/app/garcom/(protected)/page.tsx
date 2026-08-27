"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Lock } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type Table = { id: string; label: string; hasOpenComanda: boolean };

export default function GarcomMesasPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    fetch("/api/garcom/tables").then(async (res) => {
      if (res.status === 403) {
        setLocked(true);
        setLoading(false);
        return;
      }
      setTables(await res.json());
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <EmptyState
          icon={<Lock size={18} />}
          title="Recurso disponível apenas no Plano Pro"
          description="Fale com o dono do restaurante sobre o upgrade."
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <LayoutGrid size={18} className="text-brand" />
        <h1 className="text-lg font-bold text-gray-900">Escolha a mesa</h1>
      </div>

      {tables.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={18} />}
          title="Nenhuma mesa cadastrada"
          description="Peça pro dono cadastrar as mesas em Configurações → Mesas."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tables.map((t) => (
            <button key={t.id} onClick={() => router.push(`/garcom/mesa/${t.id}`)}>
              <Card>
                <CardBody className="flex flex-col items-center justify-center py-6 gap-1.5">
                  <span className="font-bold text-sm text-gray-900">{t.label}</span>
                  {t.hasOpenComanda && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Comanda aberta
                    </span>
                  )}
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
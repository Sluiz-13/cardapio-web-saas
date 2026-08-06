"use client";

import { useEffect, useState } from "react";
import { X, Clock } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  NEW: "Pedido recebido",
  PREPARING: "Em preparo",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

type HistoryEntry = { id: string; status: string; changedAt: string };

export default function OrderHistoryModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}/history`)
      .then((r) => r.json())
      .then(setHistory);
  }, [orderId]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Pedido #{orderId.slice(-5)}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors duration-[180ms]" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {!history ? (
          <p className="text-sm text-gray-400">Carregando…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">Sem histórico registrado.</p>
        ) : (
          <div className="space-y-4">
            {history.map((entry, i) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: i === history.length - 1 ? "#059669" : "#D1D5DB" }}
                  />
                  {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(entry.changedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{STATUS_LABEL[entry.status] ?? entry.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
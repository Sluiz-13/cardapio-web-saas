"use client";

import { useState } from "react";
import PixQrCode from "@/app/r/[slug]/_components/pix-qr-code";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  plan: "START" | "PRO";
  active: boolean;
  ordersCount: number;
  adminsCount: number;
  revenueCents: number;
  createdAt: string;
  lastPaymentConfirmedAt: string | null;
  paymentPending: boolean;
};

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function RestaurantsTable({ initialRestaurants }: { initialRestaurants: Restaurant[] }) {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [charge, setCharge] = useState<{
    restaurantName: string;
    payload: string;
    amountCents: number;
    fullPriceCents: number;
    discountApplied: boolean;
  } | null>(null);

  async function updateRestaurant(id: string, patch: Partial<Pick<Restaurant, "active" | "plan">>) {
    setLoadingId(id);
    const res = await fetch(`/api/platform/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setLoadingId(null);
    if (!res.ok) {
      alert("Não foi possível atualizar. Tente novamente.");
      return;
    }
    setRestaurants((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function toggleActive(r: Restaurant) {
    updateRestaurant(r.id, { active: !r.active });
  }

  function changePlan(r: Restaurant, plan: "START" | "PRO") {
    if (plan === r.plan) return;
    updateRestaurant(r.id, { plan });
  }

  async function handleCharge(r: Restaurant) {
    setLoadingId(r.id);
    const res = await fetch(`/api/platform/restaurants/${r.id}/charge`, { method: "POST" });
    setLoadingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(typeof data?.error === "string" ? data.error : "Não foi possível gerar a cobrança.");
      return;
    }
   const data = await res.json();
    setCharge({
      restaurantName: r.name,
      payload: data.payload,
      amountCents: data.amountCents,
      fullPriceCents: data.fullPriceCents,
      discountApplied: data.discountApplied,
    });
  }

  async function handleConfirmPayment(r: Restaurant) {
    setLoadingId(r.id);
    const res = await fetch(`/api/platform/restaurants/${r.id}/confirm-payment`, { method: "POST" });
    setLoadingId(null);
    if (!res.ok) {
      alert("Não foi possível confirmar o pagamento.");
      return;
    }
    setRestaurants((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, lastPaymentConfirmedAt: new Date().toISOString(), paymentPending: false } : x
      )
    );
  }


  if (restaurants.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
        Nenhum restaurante cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3 font-medium">Restaurante</th>
            <th className="px-4 py-3 font-medium">Plano</th>
            <th className="px-4 py-3 font-medium">Pedidos</th>
            <th className="px-4 py-3 font-medium">Faturamento</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Mensalidade</th>
            <th className="px-4 py-3 font-medium text-right">Ação</th>
          </tr>
        </thead>
        <tbody>
          {restaurants.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-400">/r/{r.slug}</p>
              </td>
              <td className="px-4 py-3">
                <select
                  value={r.plan}
                  disabled={loadingId === r.id}
                  onChange={(e) => changePlan(r, e.target.value as "START" | "PRO")}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold border-none cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: r.plan === "PRO" ? "#111827" : "#F3F4F6",
                    color: r.plan === "PRO" ? "#FFFFFF" : "#6B7280",
                  }}
                >
                  <option value="START">START</option>
                  <option value="PRO">PRO</option>
                </select>
              </td>
              <td className="px-4 py-3 text-gray-600">{r.ordersCount}</td>
              <td className="px-4 py-3 text-gray-600">{money(r.revenueCents)}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold ${r.active ? "text-green-600" : "text-gray-400"}`}>
                  {r.active ? "Ativo" : "Desativado"}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold ${r.paymentPending ? "text-chili" : "text-green-600"}`}>
                  {r.paymentPending ? "Pendente" : "Em dia"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleCharge(r)}
                    disabled={loadingId === r.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cobrar
                  </button>
                  {r.paymentPending && (
                    <button
                      onClick={() => handleConfirmPayment(r)}
                      disabled={loadingId === r.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Confirmar pagamento
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(r)}
                    disabled={loadingId === r.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loadingId === r.id ? "..." : r.active ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    {charge && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setCharge(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-gray-900 mb-1">{charge.restaurantName}</p>
            <p className="text-xs text-gray-400 mb-1">
              {(charge.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              {charge.discountApplied && (
                <span className="line-through ml-2 text-gray-300">
                  {(charge.fullPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              )}
            </p>
            {charge.discountApplied && (
              <p className="text-xs text-emerald-600 mb-3">Cupom de boas-vindas aplicado</p>
            )}
            <PixQrCode payload={charge.payload} />
            <button
              onClick={() => setCharge(null)}
              className="mt-4 text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
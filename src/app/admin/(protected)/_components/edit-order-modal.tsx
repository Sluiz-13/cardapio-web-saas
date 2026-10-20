"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type EditableItem = {
  productId: string;
  productName: string;
  unitPriceCents: number;
  qty: number;
  removedItems: string[];
  extras: { name: string; priceCents: number }[];
  groupSelections: Record<string, string[]>; // groupId -> ids das opções escolhidas
};

type OptionGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number | null;
  items: { id: string; name: string; priceCents: number }[];
};

type ProductOption = { id: string; name: string; priceCents: number; optionGroups: OptionGroup[] };

function selectionsFromSnapshot(product: ProductOption | undefined, snapshot: unknown): Record<string, string[]> {
  if (!product || !Array.isArray(snapshot)) return {};
  const result: Record<string, string[]> = {};
  for (const s of snapshot as { groupName?: string; items?: { name?: string }[] }[]) {
    const group = product.optionGroups.find((g) => g.name === s.groupName);
    if (!group) continue;
    const names = (s.items ?? []).map((i) => i.name);
    result[group.id] = group.items.filter((gi) => names.includes(gi.name)).map((gi) => gi.id);
  }
  return result;
}

type OrderDetail = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  paymentMethod: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH";
  deliveryType: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  referenceNote: string | null;
  editable: boolean;
  items: {
    productId: string | null;
    productName: string;
    unitPriceCents: number;
    qty: number;
    removedItems: unknown;
    extras: unknown;
    selectedOptions: unknown;
  }[];
};
export default function EditOrderModal({
  orderId,
  onClose,
  onSaved,
}: {
  orderId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { show } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH">("CASH");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [addingProductId, setAddingProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/orders/${orderId}/edit`).then((r) => r.json()),
      fetch("/api/admin/products").then((r) => r.json()),
    ]).then(([orderData, productsData]: [OrderDetail, ProductOption[]]) => {
      const productList: ProductOption[] = productsData.map((p) => ({
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        optionGroups: p.optionGroups ?? [],
      }));
      setOrder(orderData);
      setCustomerName(orderData.customerName);
      setCustomerPhone(orderData.customerPhone ?? "");
      setPaymentMethod(orderData.paymentMethod);
      setStreet(orderData.street ?? "");
      setNumber(orderData.number ?? "");
      setComplement(orderData.complement ?? "");
      setNeighborhood(orderData.neighborhood ?? "");
      setCity(orderData.city ?? "");
      setReferenceNote(orderData.referenceNote ?? "");
      setItems(
        orderData.items.map((i) => ({
          productId: i.productId ?? "",
          productName: i.productName,
          unitPriceCents: i.unitPriceCents,
          qty: i.qty,
          removedItems: Array.isArray(i.removedItems) ? (i.removedItems as string[]) : [],
          extras: Array.isArray(i.extras) ? (i.extras as { name: string; priceCents: number }[]) : [],
          groupSelections: selectionsFromSnapshot(
            productList.find((p) => p.id === i.productId),
            i.selectedOptions
          ),
        }))
      );
      setProducts(productList);
      setLoading(false);
    });
  }, [orderId]);

  const isDelivery = order?.deliveryType === "DELIVERY";

  function changeQty(index: number, delta: number) {
    setItems((cur) =>
      cur.map((it, i) => (i === index ? { ...it, qty: Math.max(0, it.qty + delta) } : it)).filter((it) => it.qty > 0)
    );
  }

  function removeItem(index: number) {
    setItems((cur) => cur.filter((_, i) => i !== index));
  }

  function addProduct() {
    const product = products.find((p) => p.id === addingProductId);
    if (!product) return;
    setItems((cur) => [
      ...cur,
      {
        productId: product.id,
        productName: product.name,
        unitPriceCents: product.priceCents,
        qty: 1,
        removedItems: [],
        extras: [],
        groupSelections: {},
      },
    ]);
    setAddingProductId("");
  }

  function toggleGroupItem(index: number, group: OptionGroup, itemId: string) {
    setItems((cur) =>
      cur.map((it, i) => {
        if (i !== index) return it;
        const current = it.groupSelections[group.id] ?? [];
        let next: string[];
        if (current.includes(itemId)) next = current.filter((id) => id !== itemId);
        else if (group.maxSelect === 1) next = [itemId];
        else if (group.maxSelect !== null && current.length >= group.maxSelect) return it;
        else next = [...current, itemId];
        return { ...it, groupSelections: { ...it.groupSelections, [group.id]: next } };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!order) return;
    if (items.length === 0) {
      setError("O pedido precisa ter pelo menos 1 item.");
      return;
    }
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      for (const group of product?.optionGroups ?? []) {
        const count = item.groupSelections[group.id]?.length ?? 0;
        if (count < group.minSelect) {
          setError(`Escolha pelo menos ${group.minSelect} em "${group.name}" (${item.productName}).`);
          return;
        }
      }
    }
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${order.id}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerPhone: customerPhone || undefined,
        paymentMethod,
        address: isDelivery
          ? { street, number, complement: complement || undefined, neighborhood, city, referenceNote: referenceNote || undefined }
          : undefined,
        items: items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          removedItems: i.removedItems,
          extraNames: i.extras.map((e) => e.name),
          selectedGroupOptions: Object.entries(i.groupSelections)
            .filter(([, ids]) => ids.length > 0)
            .map(([groupId, itemIds]) => ({ groupId, itemIds })),
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(typeof data?.error === "string" ? data.error : "Não foi possível salvar.");
      return;
    }
    show("Pedido atualizado.", "success");
    onSaved();
  }

  const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm";

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 text-sm text-gray-400" onClick={(e) => e.stopPropagation()}>
          Carregando pedido...
        </div>
      </div>
    );
  }

  if (order && !order.editable) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-gray-700 mb-4">Esse pedido já foi entregue ou cancelado — não pode mais ser editado.</p>
          <button onClick={onClose} className="text-sm font-semibold text-brand">Fechar</button>
        </div>
      </div>
    );
  }

  function handleCloseAttempt() {
    if (confirm("Tem certeza? Os dados preenchidos serão perdidos.")) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCloseAttempt}>
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-2xl max-h-[88vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Editar Pedido</h2>
          <button type="button" onClick={handleCloseAttempt} className="text-gray-400 hover:text-gray-700" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Nome</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Telefone</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Forma de pagamento</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)} className={inputClass}>
              <option value="PIX">Pix</option>
              <option value="CREDIT_CARD">Cartão de Crédito</option>
              <option value="DEBIT_CARD">Cartão de Débito</option>
              <option value="CASH">Dinheiro</option>
            </select>
          </div>

          {isDelivery && (
            <div className="grid grid-cols-3 gap-2">
              <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua" className={`col-span-2 ${inputClass}`} />
              <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Número" className={inputClass} />
              <input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Complemento" className={`col-span-3 ${inputClass}`} />
              <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className={`col-span-2 ${inputClass}`} />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className={inputClass} />
              <input value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} placeholder="Referência" className={`col-span-3 ${inputClass}`} />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-gray-400">Itens</label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-2.5">
                  <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">{currency(item.unitPriceCents)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => changeQty(i, -1)} className="w-6 h-6 rounded-full border border-gray-200 text-xs">−</button>
                    <span className="text-sm w-4 text-center">{item.qty}</span>
                    <button type="button" onClick={() => changeQty(i, 1)} className="w-6 h-6 rounded-full border border-gray-200 text-xs">+</button>
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs ml-1">
                      remover
                    </button>
                  </div>
                  </div>

                  {(products.find((p) => p.id === item.productId)?.optionGroups ?? []).map((group) => {
                    const selected = item.groupSelections[group.id] ?? [];
                    return (
                      <div key={group.id} className="mt-2">
                        <p className="text-xs font-semibold text-gray-600">
                          {group.name}{" "}
                          {group.minSelect > 0 && <span className="text-chili">· obrigatório</span>}
                          <span className="text-gray-400 font-normal">
                            {" "}({selected.length}{group.maxSelect ? `/${group.maxSelect}` : ""})
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {group.items.map((opt) => {
                            const active = selected.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleGroupItem(i, group, opt.id)}
                                className={`px-2.5 py-1 rounded-full border text-xs ${
                                  active ? "bg-chili text-white border-chili" : "border-gray-200 text-gray-600"
                                }`}
                              >
                                {opt.name}
                                {opt.priceCents > 0 ? ` +${currency(opt.priceCents)}` : ""}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <select value={addingProductId} onChange={(e) => setAddingProductId(e.target.value)} className={`flex-1 ${inputClass}`}>
                <option value="">Adicionar produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {currency(p.priceCents)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addProduct}
                disabled={!addingProductId}
                className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-40"
              >
                Adicionar
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button type="submit" disabled={saving} className="w-full py-3 rounded-full font-semibold text-sm bg-chili text-white disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
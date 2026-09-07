"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Minus, X, ShoppingCart, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Extra = { id: string; name: string; priceCents: number };
type Removable = { id: string; name: string };
type OptionItem = { id: string; name: string; priceCents: number };
type OptionGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number | null;
  pricingStyle: "SUM" | "FIXED" | "HIGHEST";
  fixedPriceCents: number | null;
  items: OptionItem[];
};
type Product = {
  id: string;
  name: string;
  priceCents: number;
  active: boolean;
  categoryId: string;
  removableOptions: Removable[];
  extraOptions: Extra[];
  optionGroups: OptionGroup[];
};
type Category = { id: string; name: string };
type SelectedOption = { groupId: string; groupName: string; itemIds: string[]; itemNames: string[]; chargedCents: number };
type CartLine = {
  key: string;
  productId: string;
  name: string;
  unitPriceCents: number;
  qty: number;
  removedItems: string[];
  extraNames: string[];
  selectedOptions: SelectedOption[];
};

function computeGroupChargeCents(group: OptionGroup, chosenItems: OptionItem[]): number {
  if (chosenItems.length === 0) return 0;
  if (group.pricingStyle === "FIXED") return group.fixedPriceCents ?? 0;
  if (group.pricingStyle === "HIGHEST") return Math.max(...chosenItems.map((i) => i.priceCents));
  return chosenItems.reduce((s, i) => s + i.priceCents, 0);
}

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

const PAYMENT_OPTIONS: { value: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH"; label: string }[] = [
  { value: "PIX", label: "Pix" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CASH", label: "Dinheiro" },
];

export default function GarcomMesaPage() {
  const router = useRouter();
  const params = useParams<{ tableId: string }>();
  const searchParams = useSearchParams();
  const { show } = useToast();
  const isBalcao = params.tableId === "balcao";
  const cameFromAdmin = searchParams.get("from") === "admin";
  const backHref = cameFromAdmin ? "/admin" : "/garcom";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [existingCustomer, setExistingCustomer] = useState<{ name: string; phone: string } | null>(null);
  const [activeCat, setActiveCat] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH">("CASH");
  const [changeFor, setChangeFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calls = [
      fetch("/api/garcom/categories").then((r) => r.json()),
      fetch("/api/garcom/products").then((r) => r.json()),
    ];
    if (!isBalcao) calls.push(fetch(`/api/garcom/tables/${params.tableId}`).then((r) => r.json()));

    Promise.all(calls)
      .then(([cats, prods, tableInfo]) => {
        setCategories(cats);
        setProducts(prods);
        setActiveCat(cats[0]?.id ?? "");
        if (tableInfo?.existingCustomer) {
          setExistingCustomer(tableInfo.existingCustomer);
          setCustomerName(tableInfo.existingCustomer.name);
          setCustomerPhone(tableInfo.existingCustomer.phone ?? "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar cardápio:", err);
        setLoading(false);
        show("Não foi possível carregar o cardápio.", "error");
      });
  }, [params.tableId, isBalcao]);

  const filtered = products.filter((p) => p.categoryId === activeCat);
  const total = cart.reduce((s, l) => s + l.unitPriceCents * l.qty, 0);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);

  function addToCart(
    product: Product,
    removed: string[],
    extras: Extra[],
    groupSelections: Record<string, string[]>
  ) {
    const extrasTotal = extras.reduce((s, e) => s + e.priceCents, 0);

    const selectedOptions: SelectedOption[] = product.optionGroups
      .map((group) => {
        const ids = groupSelections[group.id] ?? [];
        const chosen = group.items.filter((i) => ids.includes(i.id));
        if (chosen.length === 0) return null;
        return {
          groupId: group.id,
          groupName: group.name,
          itemIds: chosen.map((i) => i.id),
          itemNames: chosen.map((i) => i.name),
          chargedCents: computeGroupChargeCents(group, chosen),
        };
      })
      .filter((o): o is SelectedOption => o !== null);

    const groupsTotal = selectedOptions.reduce((s, o) => s + o.chargedCents, 0);

    setCart((c) => [
      ...c,
      {
        key: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        unitPriceCents: product.priceCents + extrasTotal + groupsTotal,
        qty: 1,
        removedItems: removed,
        extraNames: extras.map((e) => e.name),
        selectedOptions,
      },
    ]);
    setModalProduct(null);
  }
  function changeQty(key: string, delta: number) {
    setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: Math.max(0, l.qty + delta) } : l)).filter((l) => l.qty > 0));
  }

  async function handleSubmit() {
    if (!customerName.trim()) {
      show("Preencha o nome do cliente.", "error");
      return;
    }
    if (isBalcao && paymentMethod === "CASH" && changeFor && Math.round(Number(changeFor) * 100) < total) {
      show("O valor para troco não pode ser menor que o total do pedido.", "error");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/garcom/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: isBalcao ? undefined : params.tableId,
        paymentMethod: isBalcao ? paymentMethod : undefined,
        changeForCents: isBalcao && paymentMethod === "CASH" && changeFor ? Math.round(Number(changeFor) * 100) : undefined,
        customerName,
        customerPhone,
        items: cart.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          removedItems: l.removedItems,
          extraNames: l.extraNames,
          selectedGroupOptions: l.selectedOptions.map((o) => ({ groupId: o.groupId, itemIds: o.itemIds })),
        })),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      show("Não foi possível enviar o pedido.", "error");
      return;
    }
    show("Pedido enviado pra cozinha!", "success");
    router.push(backHref);
  }

  if (loading) return <div className="p-6 text-center text-sm text-gray-400">Carregando cardápio…</div>;

  return (
    <div className="pb-24 max-w-xl mx-auto">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border bg-white sticky top-[57px] z-10">
        <button onClick={() => router.push(backHref)} className="text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {isBalcao ? (cameFromAdmin ? "Voltar pro admin" : "Pedido no balcão") : "Voltar pra mesas"}
        </span>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-surface-border bg-white sticky top-[105px] z-10">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className="text-sm font-medium whitespace-nowrap px-4 py-2 rounded-full transition-colors"
            style={{
              background: cat.id === activeCat ? "#C1440E" : "#FFFFFF",
              color: cat.id === activeCat ? "#FFFFFF" : "#6B7280",
              border: cat.id === activeCat ? "1px solid #C1440E" : "1px solid #E5E7EB",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => setModalProduct(p)}
            className="text-left bg-white rounded-xl p-3 border border-surface-border active:scale-[0.98] transition-transform"
          >
            <p className="font-semibold text-sm text-gray-900">{p.name}</p>
            <p className="text-emerald-600 font-bold text-sm mt-1">{currency(p.priceCents)}</p>
          </button>
        ))}
      </div>

      {cartCount > 0 && !checkoutOpen && (
        <div className="fixed bottom-4 inset-x-0 px-4 flex justify-center z-20">
          <button
            onClick={() => setCheckoutOpen(true)}
            className="w-full max-w-xl flex items-center justify-between px-5 py-3.5 rounded-full shadow-xl bg-chili text-white"
          >
            <span className="flex items-center gap-2 font-semibold text-sm">
              <ShoppingCart size={16} /> Ver pedido ({cartCount})
            </span>
            <span className="font-bold text-sm">{currency(total)}</span>
          </button>
        </div>
      )}

      {modalProduct && (
        <ProductPickerModal product={modalProduct} onClose={() => setModalProduct(null)} onConfirm={addToCart} />
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setCheckoutOpen(false)}>
          <div
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="font-bold text-lg text-gray-900">Confirmar pedido</h2>
              <button onClick={() => setCheckoutOpen(false)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 flex-1">
              {cart.map((l) => (
                <div key={l.key} className="flex items-center justify-between border-b border-gray-100 py-2.5">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-sm text-gray-900">{l.name}</p>
                    {(l.removedItems.length > 0 || l.extraNames.length > 0 || l.selectedOptions.length > 0) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {l.selectedOptions.map((o) => o.itemNames.join(", ")).join(" · ")}
                        {l.selectedOptions.length > 0 && (l.removedItems.length > 0 || l.extraNames.length > 0) ? " · " : ""}
                        {l.removedItems.map((r) => `Sem ${r}`).join(", ")}
                        {l.removedItems.length > 0 && l.extraNames.length > 0 ? " · " : ""}
                        {l.extraNames.map((e) => `+ ${e}`).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => changeQty(l.key, -1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center">
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center">{l.qty}</span>
                    <button onClick={() => changeQty(l.key, 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {existingCustomer ? (
                <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500">Pedido pra a mesma comanda de</p>
                  <p className="text-sm font-semibold text-gray-800">{existingCustomer.name}</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Nome do cliente</label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Telefone (opcional)</label>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(35) 99999-9999"
                      inputMode="tel"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 pt-3 border-t border-gray-100">
              {isBalcao && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-gray-400">Forma de pagamento</p>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPaymentMethod(opt.value)}
                        className="text-sm font-medium px-3.5 py-1.5 rounded-full border"
                        style={{
                          borderColor: paymentMethod === opt.value ? "#C1440E" : "#E5E7EB",
                          background: paymentMethod === opt.value ? "#C1440E" : "#FFFFFF",
                          color: paymentMethod === opt.value ? "#FFFFFF" : "#374151",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isBalcao && paymentMethod === "CASH" && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">
                    Precisa de troco para quanto? (opcional)
                  </label>
                  <input
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="ex: 50"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              )}
              <div className="flex items-center justify-between font-bold text-base mb-4">
                <span>Total</span>
                <span className="text-emerald-600">{currency(total)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-full font-semibold text-sm bg-chili text-white shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={16} /> {submitting ? "Enviando…" : "Enviar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductPickerModal({
  product,
  onClose,
  onConfirm,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: (product: Product, removed: string[], extras: Extra[], groupSelections: Record<string, string[]>) => void;
}) {
  const [removed, setRemoved] = useState<string[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [groupSelections, setGroupSelections] = useState<Record<string, string[]>>({});

  function toggleGroupItem(group: OptionGroup, itemId: string) {
    setGroupSelections((cur) => {
      const current = cur[group.id] ?? [];
      if (current.includes(itemId)) {
        return { ...cur, [group.id]: current.filter((id) => id !== itemId) };
      }
      if (group.maxSelect === 1) {
        return { ...cur, [group.id]: [itemId] };
      }
      if (group.maxSelect !== null && current.length >= group.maxSelect) {
        return cur;
      }
      return { ...cur, [group.id]: [...current, itemId] };
    });
  }

  const groupsValid = product.optionGroups.every((group) => {
    const count = groupSelections[group.id]?.length ?? 0;
    return count >= group.minSelect && (group.maxSelect === null || count <= group.maxSelect);
  });

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900">{product.name}</h2>
          <button onClick={onClose} className="text-gray-400">
            <X size={20} />
          </button>
        </div>

        {product.optionGroups.map((group) => {
          const selectedIds = groupSelections[group.id] ?? [];
          const atLimit = group.maxSelect !== null && selectedIds.length >= group.maxSelect;
          return (
            <div key={group.id} className="mb-4">
              <p className="text-xs uppercase tracking-wide font-semibold mb-1 text-gray-400">
                {group.name} {group.minSelect > 0 && <span className="text-chili">· obrigatório</span>}
              </p>
              <p className="text-[11px] text-gray-400 mb-2">
                {group.maxSelect
                  ? `Escolha ${group.minSelect > 0 ? `${group.minSelect} a ` : "até "}${group.maxSelect}`
                  : group.minSelect > 0
                  ? `Escolha pelo menos ${group.minSelect}`
                  : "Escolha quantos quiser"}{" "}
                ({selectedIds.length}
                {group.maxSelect ? `/${group.maxSelect}` : ""})
              </p>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const active = selectedIds.includes(item.id);
                  const disabled = !active && atLimit && group.maxSelect !== 1;
                  return (
                    <button
                      key={item.id}
                      disabled={disabled}
                      onClick={() => toggleGroupItem(group, item.id)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm disabled:opacity-40"
                      style={{ borderColor: active ? "#059669" : "#E5E7EB", background: active ? "rgba(5,150,105,0.06)" : "#FFFFFF" }}
                    >
                      <span>{item.name}</span>
                      {item.priceCents > 0 && group.pricingStyle !== "FIXED" && (
                        <span className="text-emerald-600 font-semibold">+ {currency(item.priceCents)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {product.removableOptions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide font-semibold mb-2 text-gray-400">Retirar algum item?</p>
            <div className="flex flex-wrap gap-2">
              {product.removableOptions.map((r) => {
                const active = removed.includes(r.name);
                return (
                  <button
                    key={r.id}
                    onClick={() => setRemoved((cur) => (active ? cur.filter((x) => x !== r.name) : [...cur, r.name]))}
                    className="text-sm font-medium px-3.5 py-1.5 rounded-full border"
                    style={{
                      borderColor: active ? "#C1440E" : "#E5E7EB",
                      background: active ? "#C1440E" : "#FFFFFF",
                      color: active ? "#FFFFFF" : "#374151",
                    }}
                  >
                    Sem {r.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {product.extraOptions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide font-semibold mb-2 text-gray-400">Extras</p>
            <div className="space-y-2">
              {product.extraOptions.map((ex) => {
                const active = extras.some((e) => e.id === ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => setExtras((cur) => (active ? cur.filter((e) => e.id !== ex.id) : [...cur, ex]))}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: active ? "#059669" : "#E5E7EB" }}
                  >
                    <span>+ {ex.name}</span>
                    <span className="text-emerald-600 font-semibold">{currency(ex.priceCents)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => onConfirm(product, removed, extras, groupSelections)}
          disabled={!groupsValid}
          className="w-full py-3 rounded-full font-semibold text-sm bg-chili text-white disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
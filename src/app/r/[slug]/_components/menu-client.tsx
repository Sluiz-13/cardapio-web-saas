"use client";

import { useMemo, useState } from "react";
import { ShoppingCart, Plus, Minus, X, ChefHat, Check, CircleDot } from "lucide-react";

type Extra = { id: string; name: string; priceCents: number };
type Removable = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  categoryId: string;
  removableOptions: Removable[];
  extraOptions: Extra[];
};
type Category = { id: string; name: string };
type Restaurant = { id: string; name: string; isOpen: boolean };

type CartLine = {
  key: string;
  productId: string;
  name: string;
  unitPriceCents: number;
  qty: number;
  removedItems: string[];
  extraNames: string[];
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

const PAYMENT_OPTIONS = [
  { value: "PIX", label: "Pix" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CASH", label: "Dinheiro na entrega" },
] as const;

export default function MenuClient({
  restaurant,
  categories,
  products,
}: {
  restaurant: Restaurant;
  categories: Category[];
  products: Product[];
}) {
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [drawer, setDrawer] = useState<null | "cart" | "checkout" | "confirmed">(null);
  const [orderResult, setOrderResult] = useState<{ status: string } | null>(null);

  const filtered = products.filter((p) => p.categoryId === activeCat);
  const total = useMemo(() => cart.reduce((s, l) => s + l.unitPriceCents * l.qty, 0), [cart]);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);

  function addToCart(product: Product, removed: string[], extras: Extra[]) {
    const extrasTotal = extras.reduce((s, e) => s + e.priceCents, 0);
    setCart((c) => [
      ...c,
      {
        key: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        unitPriceCents: product.priceCents + extrasTotal,
        qty: 1,
        removedItems: removed,
        extraNames: extras.map((e) => e.name),
      },
    ]);
    setModalProduct(null);
  }

  function changeQty(key: string, delta: number) {
    setCart((c) =>
      c.map((l) => (l.key === key ? { ...l, qty: Math.max(0, l.qty + delta) } : l)).filter((l) => l.qty > 0)
    );
  }

  if (!restaurant.isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chalk px-4 text-center">
        <div>
          <ChefHat size={32} className="mx-auto mb-3 text-brass" />
          <h1 className="font-display text-2xl uppercase text-paper">{restaurant.name}</h1>
          <p className="text-white/50 mt-2">No momento estamos fechados. Volte mais tarde!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chalk">
      <div className="px-5 pt-6 pb-4 bg-chalk-2">
        <div className="flex items-center gap-2 mb-1">
          <ChefHat size={20} className="text-brass" />
          <span className="font-mono text-[11px] tracking-widest uppercase text-brass">Cardápio Digital</span>
        </div>
        <h1 className="font-display text-3xl uppercase text-paper">{restaurant.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <CircleDot size={12} className="text-[#7CA982]" fill="#7CA982" />
          <span className="text-xs font-mono text-white/50">Aberto agora</span>
        </div>
      </div>

      <div className="flex gap-2 px-5 py-4 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className="font-display text-sm uppercase whitespace-nowrap px-4 py-2 rounded-sm border"
            style={{
              background: cat.id === activeCat ? "#C1440E" : "transparent",
              color: cat.id === activeCat ? "#F6EFE3" : "#9C9384",
              borderColor: cat.id === activeCat ? "#C1440E" : "rgba(246,239,227,0.15)",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="px-5 pb-32 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="overflow-hidden flex bg-paper rounded-sm">
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover m-3 rounded-sm" />
            )}
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base uppercase leading-tight">{product.name}</h3>
                {product.description && (
                  <p className="text-xs mt-1 text-ink/60">{product.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono text-sm font-semibold">{currency(product.priceCents)}</span>
                <button
                  onClick={() => setModalProduct(product)}
                  className="flex items-center gap-1 text-xs font-display uppercase px-3 py-1.5 rounded-sm bg-chili text-paper"
                >
                  <Plus size={13} /> Adicionar
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-white/40 text-sm col-span-2">Nenhum item nessa categoria ainda.</p>
        )}
      </div>

      {cartCount > 0 && drawer === null && (
        <button
          onClick={() => setDrawer("cart")}
          className="fixed bottom-4 left-4 right-4 max-w-md mx-auto flex items-center justify-between px-5 py-3.5 rounded-sm shadow-lg bg-herb text-paper"
        >
          <span className="flex items-center gap-2 font-display uppercase text-sm">
            <ShoppingCart size={16} /> Ver Carrinho ({cartCount})
          </span>
          <span className="font-mono text-sm font-semibold">{currency(total)}</span>
        </button>
      )}

      {modalProduct && (
        <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} onConfirm={addToCart} />
      )}

      {drawer === "cart" && (
        <CartDrawer
          cart={cart}
          total={total}
          onChangeQty={changeQty}
          onClose={() => setDrawer(null)}
          onCheckout={() => setDrawer("checkout")}
        />
      )}

      {drawer === "checkout" && (
        <CheckoutDrawer
          restaurantId={restaurant.id}
          cart={cart}
          total={total}
          onClose={() => setDrawer("cart")}
          onSuccess={(result) => {
            setOrderResult(result);
            setDrawer("confirmed");
          }}
        />
      )}

      {drawer === "confirmed" && orderResult && (
        <ConfirmedDrawer
          isCash={orderResult.status === "NEW"}
          onNewOrder={() => {
            setCart([]);
            setOrderResult(null);
            setDrawer(null);
          }}
        />
      )}
    </div>
  );
}

function ProductModal({
  product,
  onClose,
  onConfirm,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: (product: Product, removed: string[], extras: Extra[]) => void;
}) {
  const [removed, setRemoved] = useState<string[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/55">
      <div className="w-full max-w-md rounded-t-lg sm:rounded-sm p-5 max-h-[85vh] overflow-y-auto bg-paper">
        <div className="flex items-start justify-between mb-3">
          <h2 className="font-display text-xl uppercase">{product.name}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {product.imageUrl && (
          <img src={product.imageUrl} className="w-full h-40 object-cover rounded-sm mb-4" alt="" />
        )}

        {product.removableOptions.length > 0 && (
          <div className="mb-4">
            <p className="font-mono text-[11px] uppercase tracking-wide mb-2 text-ink/60">Deseja retirar algum item?</p>
            <div className="flex flex-wrap gap-2">
              {product.removableOptions.map((r) => {
                const active = removed.includes(r.name);
                return (
                  <button
                    key={r.id}
                    onClick={() => setRemoved((cur) => (active ? cur.filter((x) => x !== r.name) : [...cur, r.name]))}
                    className="text-xs font-display uppercase px-3 py-1.5 rounded-sm border"
                    style={{
                      borderColor: active ? "#C1440E" : "rgba(33,29,26,0.15)",
                      background: active ? "#C1440E" : "transparent",
                      color: active ? "#F6EFE3" : "#211D1A",
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
            <p className="font-mono text-[11px] uppercase tracking-wide mb-2 text-ink/60">Turbine sua refeição</p>
            <div className="space-y-2">
              {product.extraOptions.map((ex) => {
                const active = extras.some((e) => e.id === ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => setExtras((cur) => (active ? cur.filter((e) => e.id !== ex.id) : [...cur, ex]))}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-sm border text-sm"
                    style={{ borderColor: active ? "#4C6449" : "rgba(33,29,26,0.15)", background: active ? "rgba(76,100,73,0.1)" : "transparent" }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-sm border flex items-center justify-center" style={{ borderColor: "#4C6449", background: active ? "#4C6449" : "transparent" }}>
                        {active && <Check size={11} color="#F6EFE3" />}
                      </span>
                      + {ex.name}
                    </span>
                    <span className="font-mono">{currency(ex.priceCents)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-sm font-display uppercase text-sm border border-ink/15">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(product, removed, extras)}
            className="flex-1 py-3 rounded-sm font-display uppercase text-sm bg-chili text-paper"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  cart,
  total,
  onChangeQty,
  onClose,
  onCheckout,
}: {
  cart: CartLine[];
  total: number;
  onChangeQty: (key: string, delta: number) => void;
  onClose: () => void;
  onCheckout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/55">
      <div className="w-full max-w-md rounded-t-lg sm:rounded-sm max-h-[88vh] overflow-y-auto bg-paper p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl uppercase flex items-center gap-2">
            <ShoppingCart size={18} /> Seu Pedido
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {cart.length === 0 ? (
          <p className="text-sm text-ink/60">Seu carrinho está vazio.</p>
        ) : (
          <div className="space-y-3 mb-5">
            {cart.map((l) => (
              <div key={l.key} className="flex items-start justify-between border-b pb-3 border-ink/10">
                <div className="flex-1 pr-2">
                  <p className="font-display text-sm uppercase">{l.name}</p>
                  {(l.removedItems.length > 0 || l.extraNames.length > 0) && (
                    <p className="text-xs mt-0.5 text-ink/40">
                      {l.removedItems.map((r) => `Sem ${r}`).join(", ")}
                      {l.removedItems.length > 0 && l.extraNames.length > 0 ? " · " : ""}
                      {l.extraNames.map((e) => `+ ${e}`).join(", ")}
                    </p>
                  )}
                  <p className="font-mono text-sm mt-1">{currency(l.unitPriceCents)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onChangeQty(l.key, -1)} className="w-6 h-6 rounded-sm border border-ink/15 flex items-center justify-center">
                    <Minus size={12} />
                  </button>
                  <span className="font-mono text-sm w-4 text-center">{l.qty}</span>
                  <button onClick={() => onChangeQty(l.key, 1)} className="w-6 h-6 rounded-sm border border-ink/15 flex items-center justify-center">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between font-display uppercase text-base mb-4">
          <span>Total</span>
          <span className="font-mono">{currency(total)}</span>
        </div>

        <button
          disabled={cart.length === 0}
          onClick={onCheckout}
          className="w-full py-3.5 rounded-sm font-display uppercase text-sm bg-herb text-paper disabled:opacity-40"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

function CheckoutDrawer({
  restaurantId,
  cart,
  total,
  onClose,
  onSuccess,
}: {
  restaurantId: string;
  cart: CartLine[];
  total: number;
  onClose: () => void;
  onSuccess: (result: { status: string }) => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_OPTIONS)[number]["value"]>("PIX");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Preencha seu nome e telefone.");
      return;
    }
    if (deliveryType === "DELIVERY" && (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim())) {
      setError("Preencha o endereço completo para entrega.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        customerName,
        customerPhone,
        deliveryType,
        paymentMethod,
        address:
          deliveryType === "DELIVERY"
            ? { street, number, complement: complement || undefined, neighborhood, city, referenceNote: referenceNote || undefined }
            : undefined,
        items: cart.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          removedItems: l.removedItems,
          extraNames: l.extraNames,
        })),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      setError("Não foi possível enviar seu pedido. Tente novamente.");
      return;
    }
    const data = await res.json();
    onSuccess({ status: data.status });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/55">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-t-lg sm:rounded-sm max-h-[88vh] overflow-y-auto bg-paper p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl uppercase">Seus Dados</h2>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Nome</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Telefone</label>
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(35) 99999-9999" className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" />
          </div>

          <div className="flex gap-2">
            {(["DELIVERY", "PICKUP"] as const).map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => setDeliveryType(opt)}
                className="flex-1 py-2 rounded-sm text-xs font-display uppercase border"
                style={{
                  background: deliveryType === opt ? "#211D1A" : "transparent",
                  color: deliveryType === opt ? "#F6EFE3" : "#211D1A",
                  borderColor: "rgba(33,29,26,0.15)",
                }}
              >
                {opt === "DELIVERY" ? "Entrega" : "Retirar no local"}
              </button>
            ))}
          </div>

          {deliveryType === "DELIVERY" && (
            <div className="grid grid-cols-3 gap-2">
              <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua" className="col-span-2 px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" />
              <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Número" className="px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" />
              <input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Complemento (opcional)" className="col-span-3 px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" />
              <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="col-span-2 px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className="px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" />
              <input value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} placeholder="Ponto de referência (opcional)" className="col-span-3 px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm" />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase mb-1 text-ink/60">Forma de pagamento</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              className="w-full px-3 py-2 rounded-sm border border-ink/15 bg-white text-sm"
            >
              {PAYMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between font-display uppercase text-base mb-4">
          <span>Total</span>
          <span className="font-mono">{currency(total)}</span>
        </div>
        
        <p className="text-[11px] text-ink/50 mb-3">
          Ao finalizar, você concorda com o uso do seu nome, telefone
          {deliveryType === "DELIVERY" ? " e endereço " : " "}
          apenas para processar este pedido.{" "}
          <a href="/privacidade" target="_blank" className="underline">Saiba mais</a>.
        </p>

        {error && <p className="text-chili text-xs mb-3">{error}</p>}

        <button disabled={submitting} className="w-full py-3.5 rounded-sm font-display uppercase text-sm bg-chili text-paper disabled:opacity-50">
          {submitting ? "Enviando…" : "Finalizar Pedido"}
        </button>
      </form>
    </div>
  );
}

function ConfirmedDrawer({ isCash, onNewOrder }: { isCash: boolean; onNewOrder: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/55">
      <div className="w-full max-w-md rounded-t-lg sm:rounded-sm bg-paper p-5">
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 bg-herb">
            <Check size={26} color="#F6EFE3" />
          </div>
          <h2 className="font-display text-xl uppercase mb-1">
            {isCash ? "Pedido Confirmado" : "Pedido Recebido"}
          </h2>
          <p className="text-sm mb-1 text-ink/60">
            {isCash
              ? "Seu pedido já está sendo preparado."
              : "Assim que confirmarmos o pagamento, seu pedido entra na cozinha."}
          </p>
          <button
            onClick={onNewOrder}
            className="mt-6 px-5 py-2.5 rounded-sm font-display uppercase text-sm bg-chili text-paper"
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
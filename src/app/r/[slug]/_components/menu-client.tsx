"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  ChefHat,
  Check,
  CircleDot,
  ImageOff,
  MapPin,
  Phone,
} from "lucide-react";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { getSavedCustomerInfo, saveCustomerInfo } from "@/lib/customer-storage";
import PixQrCode from "./pix-qr-code";

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
type Restaurant = {
  id: string;
  name: string;
  isOpen: boolean;
  phone?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  avgDeliveryTime?: string | null;
};

type Table = { id: string; label: string };

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
  table,
}: {
  restaurant: Restaurant;
  categories: Category[];
  products: Product[];
  table: Table | null;
}) {
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [drawer, setDrawer] = useState<null | "cart" | "checkout" | "confirmed">(null);
  const [orderResult, setOrderResult] = useState<{ status: string; pixPayload?: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const catRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const filtered = products.filter((p) => p.categoryId === activeCat);
  const total = useMemo(() => cart.reduce((s, l) => s + l.unitPriceCents * l.qty, 0), [cart]);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);

  useBodyScrollLock(modalProduct !== null || drawer !== null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  function selectCategory(id: string) {
    setActiveCat(id);
    catRefs.current[id]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

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
    setToast(`${product.name} adicionado!`);
  }

  function changeQty(key: string, delta: number) {
    setCart((c) =>
      c.map((l) => (l.key === key ? { ...l, qty: Math.max(0, l.qty + delta) } : l)).filter((l) => l.qty > 0)
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto bg-gray-50">
        <div className="sticky top-0 z-20 px-5 pt-5 pb-4 bg-white border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <ChefHat size={16} className="text-chili" />
                <span className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                  Cardápio Digital
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {restaurant.logoUrl && (
                  <img
                    src={restaurant.logoUrl}
                    alt={restaurant.name}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0"
                  />
                )}
                <h1 className="font-bold text-2xl sm:text-3xl text-chili leading-tight">
                  {restaurant.name}
                </h1>
              </div>
              {restaurant.address && (
                
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 hover:text-chili hover:underline w-fit"
                >
                  <MapPin size={12} />
                  {restaurant.address}
                </a>
              )}
              {restaurant.phone && (
                
                <a href={`tel:${restaurant.phone.replace(/\D/g, "")}`}
                  className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 hover:text-chili hover:underline w-fit"
                >
                  <Phone size={12} />
                  {restaurant.phone}
                </a>
              )}
              <div className="flex items-center gap-1.5 mt-1.5">
                <CircleDot size={10} className={restaurant.isOpen ? "text-emerald-500" : "text-gray-400"} fill="currentColor" />
                <span className="text-xs text-gray-500">{restaurant.isOpen ? "Aberto agora" : "Fechado agora"}</span>
                {restaurant.avgDeliveryTime && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">{restaurant.avgDeliveryTime}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => cartCount > 0 && setDrawer("cart")}
              className="relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-700 shadow-sm active:scale-95 transition-transform"
              aria-label="Ver carrinho"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-chili text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="sticky top-[84px] sm:top-[92px] z-10 flex gap-2 px-5 py-3 overflow-x-auto bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              ref={(el) => {
                catRefs.current[cat.id] = el;
              }}
              onClick={() => selectCategory(cat.id)}
              className="text-sm font-medium whitespace-nowrap px-4 py-2 rounded-full transition-colors active:scale-95"
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

        {!restaurant.isOpen && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            Estamos fechados no momento. 
          </div>
        )}

        <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onOpen={() => setModalProduct(product)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <ChefHat size={28} className="text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">Nenhum item nessa categoria ainda.</p>
            </div>
          )}
        </div>

        <Footer restaurant={restaurant} />
        <div className="pb-24" />

        {cartCount > 0 && drawer === null && (
          <button
            onClick={() => setDrawer("cart")}
            className="fixed bottom-4 left-4 right-4 max-w-md mx-auto flex items-center justify-between px-5 py-3.5 rounded-full shadow-xl bg-chili text-white animate-fade-in-up z-20"
          >
            <span className="flex items-center gap-2 font-semibold text-sm">
              <ShoppingCart size={16} /> Ver Carrinho ({cartCount})
            </span>
            <span className="font-bold text-sm">{currency(total)}</span>
          </button>
        )}

        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium shadow-lg animate-fade-in-up flex items-center gap-2">
            <Check size={14} className="text-emerald-400" /> {toast}
          </div>
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
            restaurantIsOpen={restaurant.isOpen}
            cart={cart}
            total={total}
            table={table}
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
            pixPayload={orderResult.pixPayload}
            onNewOrder={() => {
              setCart([]);
              setOrderResult(null);
              setDrawer(null);
            }}
          />
        )}
      </div>
    </div>
  );
}


function Footer({ restaurant }: { restaurant: Restaurant }) {
  const devWhatsApp =
    "https://wa.me/5535999603944?text=" +
    encodeURIComponent("Olá! Vi um cardápio digital feito por você e gostaria de saber mais.");

  return (
    <footer className="px-5 py-6 border-t border-gray-100 mt-2">
      <p className="text-center text-[11px] text-gray-400">
        © 2026 Desenvolvido por{" "}
        
        <a href={devWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-gray-500 hover:text-chili underline"
        >
          Luiz Felippe
        </a>
      </p>
      <p className="text-center text-[11px] text-gray-400">
        Todos os direitos reservados
      </p>
    </footer>
  );
}


function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onOpen}
      className="text-left bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 active:scale-[0.98] transition-all duration-150"
    >
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={22} className="text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-base text-gray-900 leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-sm mt-1 text-gray-500 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-emerald-600 font-bold text-lg">{currency(product.priceCents)}</span>
          <span className="flex items-center gap-1 text-sm font-medium px-3.5 py-2 rounded-full bg-chili text-white shadow-sm">
            <Plus size={14} /> Adicionar
          </span>
        </div>
      </div>
    </button>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
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
  const [imgError, setImgError] = useState(false);

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col bg-white animate-fade-in-up">
        <div className="flex items-start justify-between p-5 pb-3">
          <h2 className="font-bold text-xl text-gray-900 pr-4">{product.name}</h2>
          <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-700" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 flex-1">
          {product.imageUrl && !imgError ? (
            <img
              src={product.imageUrl}
              onError={() => setImgError(true)}
              className="w-full h-44 object-cover rounded-xl mb-4"
              alt=""
            />
          ) : (
            <div className="w-full h-44 rounded-xl mb-4 bg-gray-100 flex items-center justify-center">
              <ImageOff size={24} className="text-gray-300" />
            </div>
          )}

          {product.description && <p className="text-sm text-gray-600 mb-4">{product.description}</p>}

          {product.removableOptions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide font-semibold mb-2 text-gray-400">
                Deseja retirar algum item?
              </p>
              <div className="flex flex-wrap gap-2">
                {product.removableOptions.map((r) => {
                  const active = removed.includes(r.name);
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRemoved((cur) => (active ? cur.filter((x) => x !== r.name) : [...cur, r.name]))}
                      className="text-sm font-medium px-3.5 py-1.5 rounded-full border transition-colors active:scale-95"
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
              <p className="text-xs uppercase tracking-wide font-semibold mb-2 text-gray-400">
                Turbine sua refeição
              </p>
              <div className="space-y-2">
                {product.extraOptions.map((ex) => {
                  const active = extras.some((e) => e.id === ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => setExtras((cur) => (active ? cur.filter((e) => e.id !== ex.id) : [...cur, ex]))}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-colors active:scale-[0.98]"
                      style={{
                        borderColor: active ? "#059669" : "#E5E7EB",
                        background: active ? "rgba(5,150,105,0.06)" : "#FFFFFF",
                      }}
                    >
                      <span className="flex items-center gap-2 text-gray-800 font-medium">
                        <span
                          className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                          style={{ borderColor: "#059669", background: active ? "#059669" : "transparent" }}
                        >
                          {active && <Check size={11} color="#FFFFFF" />}
                        </span>
                        + {ex.name}
                      </span>
                      <span className="text-emerald-600 font-semibold">{currency(ex.priceCents)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-5 pt-3 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-3 rounded-full font-medium text-sm border border-gray-200 text-gray-600">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(product, removed, extras)}
            className="flex-1 py-3 rounded-full font-semibold text-sm bg-chili text-white shadow-sm active:scale-[0.98] transition-transform"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Overlay>
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
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col bg-white animate-fade-in-up">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
            <ShoppingCart size={18} /> Seu Pedido
          </h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto px-5 flex-1">
          {cart.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Seu carrinho está vazio.</p>
          ) : (
            <div className="space-y-3 mb-2">
              {cart.map((l) => (
                <div key={l.key} className="flex items-start justify-between border-b pb-3 border-gray-100">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-sm text-gray-900">{l.name}</p>
                    {(l.removedItems.length > 0 || l.extraNames.length > 0) && (
                      <p className="text-xs mt-0.5 text-gray-400">
                        {l.removedItems.map((r) => `Sem ${r}`).join(", ")}
                        {l.removedItems.length > 0 && l.extraNames.length > 0 ? " · " : ""}
                        {l.extraNames.map((e) => `+ ${e}`).join(", ")}
                      </p>
                    )}
                    <p className="text-emerald-600 font-semibold text-sm mt-1">{currency(l.unitPriceCents)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onChangeQty(l.key, -1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center active:scale-90 transition-transform text-gray-600"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center font-medium">{l.qty}</span>
                    <button
                      onClick={() => onChangeQty(l.key, 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center active:scale-90 transition-transform text-gray-600"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 pt-3 border-t border-gray-100 pb-safe">
          <div className="flex items-center justify-between font-bold text-base mb-4 text-gray-900">
            <span>Total</span>
            <span className="text-emerald-600">{currency(total)}</span>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={onCheckout}
            className="w-full py-3.5 rounded-full font-semibold text-sm bg-chili text-white shadow-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            Continuar
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function CheckoutDrawer({
  restaurantId,
  restaurantIsOpen,
  cart,
  total,
  table,
  onClose,
  onSuccess,
}: {
  restaurantId: string;
  restaurantIsOpen: boolean;
  cart: CartLine[];
  total: number;
  table: Table | null;
  onClose: () => void;
  onSuccess: (result: { status: string; pixPayload?: string }) => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  // Com mesa: já entra travado em DINE_IN, sem opção de trocar — não faz
  // sentido perguntar "entrega ou retirada" pra alguém sentado na mesa.
  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP" | "DINE_IN">(
    table ? "DINE_IN" : "DELIVERY"
  );
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [savedInfo, setSavedInfo] = useState(() => getSavedCustomerInfo(restaurantId));
  const [confirmingSaved, setConfirmingSaved] = useState(() => getSavedCustomerInfo(restaurantId) !== null);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_OPTIONS)[number]["value"]>("PIX");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<null | { discountCents: number; code: string }>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [deliveryFeeCents, setDeliveryFeeCents] = useState(0);
  const [changeFor, setChangeFor] = useState("");

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        code: couponCode,
        subtotalCents: total,
        items: cart.map((l) => ({ productId: l.productId, lineTotalCents: l.unitPriceCents * l.qty })),
      }),
    });
    const data = await res.json();
    setValidatingCoupon(false);

    if (!data.valid) {
      setCouponError(data.error ?? "Cupom inválido.");
      setCouponStatus(null);
      return;
    }
    setCouponStatus({ discountCents: data.discountCents, code: data.code });
  }

  function useSavedInfo() {
    if (!savedInfo) return;
    setCustomerName(savedInfo.customerName);
    setCustomerPhone(savedInfo.customerPhone);
    setDeliveryType(savedInfo.deliveryType);
    setStreet(savedInfo.street);
    setNumber(savedInfo.number);
    setComplement(savedInfo.complement);
    setNeighborhood(savedInfo.neighborhood);
    setCity(savedInfo.city);
    setReferenceNote(savedInfo.referenceNote);
    setConfirmingSaved(false);
  }

  function rejectSavedInfo() {
    setSavedInfo(null);
    setConfirmingSaved(false);
  }

  async function checkDeliveryFee() {
    if (!neighborhood.trim()) return;
    const res = await fetch("/api/delivery-fee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, neighborhood }),
    });
    const data = await res.json();
    if (res.ok) setDeliveryFeeCents(data.feeCents);
  }

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
    if (deliveryType === "DINE_IN" && !table) {
      setError("Mesa inválida. Escaneie o QR Code novamente.");
      return;
    }

    const finalTotal = total - (couponStatus?.discountCents ?? 0) + (deliveryType === "DELIVERY" ? deliveryFeeCents : 0);

    if (paymentMethod === "CASH" && changeFor && Math.round(Number(changeFor) * 100) < finalTotal) {
      setError("O valor para troco não pode ser menor que o total do pedido.");
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
        couponCode: couponStatus?.code,
        changeForCents: paymentMethod === "CASH" && changeFor ? Math.round(Number(changeFor) * 100) : undefined,
        tableId: table?.id,
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
    saveCustomerInfo(restaurantId, {
      customerName,
      customerPhone,
      deliveryType,
      street,
      number,
      complement,
      neighborhood,
      city,
      referenceNote,
    });
    onSuccess({ status: data.status, pixPayload: data.pixPayload });
  }
const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-chili/30 focus:border-chili transition-shadow placeholder:text-gray-400";
  

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col bg-white animate-fade-in-up">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-bold text-xl text-gray-900">Seus Dados</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto px-5 flex-1">
          {confirmingSaved && savedInfo && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm font-semibold text-gray-800 mb-1">Usar seus dados salvos?</p>
              <p className="text-xs text-gray-600 mb-3">
                {savedInfo.customerName} · {savedInfo.customerPhone}
                {savedInfo.deliveryType === "DELIVERY" && savedInfo.street && (
                  <> · {savedInfo.street}, {savedInfo.number} — {savedInfo.neighborhood}</>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={useSavedInfo}
                  className="flex-1 py-2 rounded-full text-xs font-semibold bg-chili text-white"
                >
                  Sim, é esse mesmo
                </button>
                <button
                  type="button"
                  onClick={rejectSavedInfo}
                  className="flex-1 py-2 rounded-full text-xs font-semibold border border-gray-200 text-gray-600"
                >
                  Não, outro endereço
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Nome</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Telefone</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(35) 99999-9999"
                inputMode="tel"
                className={inputClass}
              />
            </div>

            {table ? (
              <div className="py-2.5 px-3.5 rounded-xl text-sm font-semibold bg-gray-900 text-white flex items-center gap-2">
                🍽️ Pedido para {table.label}
              </div>
            ) : (
              <div className="flex gap-2">
                {(["DELIVERY", "PICKUP"] as const).map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setDeliveryType(opt)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors active:scale-95"
                    style={{
                      background: deliveryType === opt ? "#111827" : "#FFFFFF",
                      color: deliveryType === opt ? "#FFFFFF" : "#374151",
                      borderColor: "#E5E7EB",
                    }}
                  >
                    {opt === "DELIVERY" ? "Entrega" : "Retirar no local"}
                  </button>
                ))}
              </div>
            )}

            {deliveryType === "DELIVERY" && (
              <div className="grid grid-cols-3 gap-2">
                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua" className={`col-span-2 ${inputClass}`} />
                <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Número" inputMode="numeric" className={inputClass} />
                <input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Complemento (opcional)" className={`col-span-3 ${inputClass}`} />
                <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} onBlur={checkDeliveryFee} placeholder="Bairro" className={`col-span-2 ${inputClass}`} />
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className={inputClass} />
                <input value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} placeholder="Ponto de referência (opcional)" className={`col-span-3 ${inputClass}`} />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Forma de pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                className={inputClass}
              >
                {PAYMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {paymentMethod === "CASH" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">
                  Precisa de troco para quanto? (opcional)
                </label>
                <input
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="ex: 100"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-3">
            Ao finalizar, você concorda com o uso do seu nome, telefone
            {deliveryType === "DELIVERY" ? " e endereço " : " "}
            apenas para processar este pedido.{" "}
            <a href="/privacidade" target="_blank" className="underline">Saiba mais</a>.
          </p>

          {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
        </div>

        <div className="p-5 pt-3 border-t border-gray-100 pb-safe">
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">
              Cupom de desconto
            </label>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponStatus(null);
                  setCouponError("");
                }}
                placeholder="Digite o código"
                className={inputClass}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={validatingCoupon || !couponCode.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 disabled:opacity-40 whitespace-nowrap"
              >
                {validatingCoupon ? "..." : "Aplicar"}
              </button>
            </div>
            {couponError && <p className="text-chili text-xs mt-1.5">{couponError}</p>}
            {couponStatus && (
              <p className="text-emerald-600 text-xs mt-1.5 font-medium">
                Cupom {couponStatus.code} aplicado: -{currency(couponStatus.discountCents)}
              </p>
            )}
          </div>

          <div className="space-y-1 mb-4">
            {couponStatus && couponStatus.discountCents > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{currency(total)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-emerald-600">
                  <span>Desconto</span>
                  <span>-{currency(couponStatus.discountCents)}</span>
                </div>
              </>
            )}
            {deliveryType === "DELIVERY" && deliveryFeeCents > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Taxa de entrega</span>
                <span>{currency(deliveryFeeCents)}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-bold text-base text-gray-900">
              <span>Total</span>
              <span className="text-emerald-600">
                {currency(total - (couponStatus?.discountCents ?? 0) + (deliveryType === "DELIVERY" ? deliveryFeeCents : 0))}
              </span>
            </div>
          </div>

          <button
            disabled={submitting || !restaurantIsOpen}
            className="w-full py-3.5 rounded-full font-semibold text-sm bg-chili text-white shadow-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {!restaurantIsOpen ? "Restaurante fechado no momento" : submitting ? "Enviando…" : "Finalizar Pedido"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function ConfirmedDrawer({
  isCash,
  pixPayload,
  onNewOrder,
}: {
  isCash: boolean;
  pixPayload?: string;
  onNewOrder: () => void;
}) {
  return (
    <Overlay onClose={onNewOrder}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 bg-emerald-500">
            <Check size={26} color="#FFFFFF" />
          </div>
          <h2 className="font-bold text-xl text-gray-900 mb-1">
            {isCash ? "Pedido Confirmado" : "Pedido Recebido"}
          </h2>
          <p className="text-sm mb-1 text-gray-500">
            {isCash
              ? "Seu pedido já está sendo preparado."
              : "Assim que confirmarmos o pagamento, seu pedido entra na cozinha."}
          </p>

          {pixPayload && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-800 mb-3">Pague com Pix para confirmar</p>
              <PixQrCode payload={pixPayload} />
            </div>
          )}

          <button
            onClick={onNewOrder}
            className="mt-6 px-5 py-2.5 rounded-full font-semibold text-sm bg-chili text-white shadow-sm active:scale-95 transition-transform"
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    </Overlay>
  );
}
"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  User,
  LogOut,
} from "lucide-react";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { getSavedCustomerInfo, saveCustomerInfo } from "@/lib/customer-storage";
import PixQrCode from "@/components/ui/PixQrCode";
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
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  categoryId: string;
  removableOptions: Removable[];
  extraOptions: Extra[];
  maxAccompaniments: number | null;
  optionGroups: OptionGroup[];
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
  menuTheme?: "CLASSIC" | "PREMIUM";
  loyaltyPointsEnabled?: boolean;
  loyaltyPointsRedeemThreshold?: number;
  loyaltyPointsRedeemValueCents?: number;
  cashbackEnabled?: boolean;
  useDeliveryZones?: boolean;
};
type Table = { id: string; label: string };
type CustomerAccount = {
  id: string;
  name: string;
  phone?: string;
  loyaltyPoints: number;
  cashbackBalanceCents: number;
  restaurantId?: string;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  referenceNote?: string | null;
};
type BusinessHour = { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string };
const DAY_LABELS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

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

const THEMES = {
  CLASSIC: {
    bg: "#F9FAFB",
    surface: "#FFFFFF",
    accent: "#C1440E",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    divider: "#F3F4F6",
    border: "#F3F4F6",
    fontDisplay: "inherit",
    radius: "1rem",
  },
  PREMIUM: {
    bg: "#15130F",
    surface: "#15130F",
    accent: "#B08D57",
    textPrimary: "#F3EEE4",
    textSecondary: "#7D7768",
    divider: "#221F19",
    border: "#2A2620",
    fontDisplay: "Georgia, serif",
    radius: "0.25rem",
  },
} as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];
const ThemeContext = createContext<Theme>(THEMES.CLASSIC);
const useTheme = () => useContext(ThemeContext);

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
  businessHours,
}: {
  restaurant: Restaurant;
  categories: Category[];
  products: Product[];
  table: Table | null;
  businessHours: BusinessHour[];
}) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [drawer, setDrawer] = useState<null | "cart" | "checkout" | "confirmed">(null);
  const [orderResult, setOrderResult] = useState<{ status: string; pixPayload?: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const theme = THEMES[restaurant.menuTheme ?? "CLASSIC"];
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  useEffect(() => {
    fetch("/api/customer-auth/me")
      .then((r) => r.json())
      .then((data) => {
        setCustomer(data.customer && data.customer.restaurantId === restaurant.id ? data.customer : null);
        setLoadingCustomer(false);
      })
      .catch(() => setLoadingCustomer(false));
  }, [restaurant.id]);

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
    setToast(`${product.name} adicionado!`);
  }

  function changeQty(key: string, delta: number) {
    setCart((c) =>
      c.map((l) => (l.key === key ? { ...l, qty: Math.max(0, l.qty + delta) } : l)).filter((l) => l.qty > 0)
    );
  }

  return (
    <ThemeContext.Provider value={THEMES[restaurant.menuTheme ?? "CLASSIC"]}>
      <div className="min-h-screen" style={{ background: theme.bg }}>
        <div className="max-w-5xl mx-auto" style={{ background: theme.bg }}>
          <div className="sticky top-0 z-20 px-5 pt-5 pb-4 border-b" style={{ background: theme.surface, borderColor: theme.border }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ChefHat size={16} style={{ color: theme.accent }} />
                  <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: theme.textSecondary }}>
                    Cardápio Digital
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {restaurant.logoUrl && (
                    <img
                      src={restaurant.logoUrl}
                      alt={restaurant.name}
                      className="w-11 h-11 rounded-xl object-cover border shrink-0"
                      style={{ borderColor: theme.border }}
                    />
                  )}
                  <h1
                    className="font-bold text-2xl sm:text-3xl leading-tight"
                    style={{ color: theme.accent, fontFamily: theme.fontDisplay }}
                  >
                    {restaurant.name}
                  </h1>
                </div>
                {restaurant.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 mt-0.5 text-xs hover:underline w-fit"
                    style={{ color: theme.textSecondary }}
                  >
                    <MapPin size={12} />
                    {restaurant.address}
                  </a>
                )}
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone.replace(/\D/g, "")}`}
                    className="flex items-center gap-1 mt-0.5 text-xs hover:underline w-fit"
                    style={{ color: theme.textSecondary }}
                  >
                    <Phone size={12} />
                    {restaurant.phone}
                  </a>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CircleDot size={10} className={restaurant.isOpen ? "text-emerald-500" : ""} style={!restaurant.isOpen ? { color: theme.textSecondary } : undefined} fill="currentColor" />
                  <span className="text-xs" style={{ color: theme.textSecondary }}>{restaurant.isOpen ? "Aberto agora" : "Fechado agora"}</span>
                  {restaurant.avgDeliveryTime && (
                    <>
                      <span style={{ color: theme.textSecondary }}>•</span>
                      <span className="text-xs" style={{ color: theme.textSecondary }}>{restaurant.avgDeliveryTime}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setAccountOpen(true)}
                  className="w-11 h-11 rounded-full flex items-center justify-center border shadow-sm active:scale-95 transition-transform"
                  style={{ borderColor: theme.border, background: theme.surface, color: theme.textPrimary }}
                  aria-label={customer ? "Minha conta" : "Entrar"}
                >
                  <User size={18} />
                </button>

                <button
                  onClick={() => cartCount > 0 && setDrawer("cart")}
                  className="relative w-11 h-11 rounded-full flex items-center justify-center border shadow-sm active:scale-95 transition-transform"
                  style={{ borderColor: theme.border, background: theme.surface, color: theme.textPrimary }}
                  aria-label="Ver carrinho"
                >
                  <ShoppingCart size={18} />
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ background: theme.accent }}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div
            className="sticky top-[84px] sm:top-[92px] z-10 flex gap-2 px-5 py-3 overflow-x-auto backdrop-blur-sm border-b scrollbar-none"
            style={{ background: theme.bg, borderColor: theme.border }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                ref={(el) => {
                  catRefs.current[cat.id] = el;
                }}
                onClick={() => selectCategory(cat.id)}
                className="text-sm font-medium whitespace-nowrap px-4 py-2 transition-colors active:scale-95"
                style={{
                  borderRadius: theme.radius === "0.25rem" ? "0px" : "999px",
                  background: cat.id === activeCat ? theme.accent : "transparent",
                  color: cat.id === activeCat ? "#FFFFFF" : theme.textSecondary,
                  border: cat.id === activeCat ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {!restaurant.isOpen && (
            <div className="mx-5 mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              Estamos fechados no momento. Por Favor volte mais tarde.
            </div>
          )}

          <div className="px-4 py-2 divide-y" style={{ borderColor: theme.divider }}>
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
              className="fixed bottom-4 left-4 right-4 max-w-md mx-auto flex items-center justify-between px-5 py-3.5 shadow-xl text-white animate-fade-in-up z-20"
              style={{ background: theme.accent, borderRadius: theme.radius === "0.25rem" ? "2px" : "999px" }}
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

          {accountOpen && (
            <AccountModal
              restaurantId={restaurant.id}
              customer={customer}
              onClose={() => setAccountOpen(false)}
              onAuthenticated={(c) => {
                setCustomer(c);
                setAccountOpen(false);
              }}
              onLoggedOut={() => {
                setCustomer(null);
                setAccountOpen(false);
              }}
            />
          )}

          {hoursOpen && (
            <Overlay onClose={() => setHoursOpen(false)}>
              <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white p-5 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-gray-900">Horário de funcionamento</h2>
                  <button onClick={() => setHoursOpen(false)} className="text-gray-400 hover:text-gray-700" aria-label="Fechar">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {DAY_LABELS.map((label, day) => {
                    const today = new Date().getDay() === day;
                    const hour = businessHours.find((h) => h.dayOfWeek === day);
                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between text-sm px-2.5 py-1.5 rounded-lg ${today ? "bg-gray-50 font-semibold text-gray-900" : "text-gray-600"}`}
                      >
                        <span>{label}</span>
                        <span>{hour?.isOpen ? `${hour.openTime} – ${hour.closeTime}` : "Fechado"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Overlay>
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
              restaurantPhone={restaurant.phone}
              cart={cart}
              total={total}
              table={table}
              customer={customer}
              loyaltyPointsEnabled={restaurant.loyaltyPointsEnabled ?? false}
              loyaltyPointsRedeemThreshold={restaurant.loyaltyPointsRedeemThreshold ?? 0}
              loyaltyPointsRedeemValueCents={restaurant.loyaltyPointsRedeemValueCents ?? 0}
              cashbackEnabled={restaurant.cashbackEnabled ?? false}
              useDeliveryZones={restaurant.useDeliveryZones ?? false}
              onClose={() => setDrawer("cart")}
              onSuccess={(result) => {
                setOrderResult(result);
                setDrawer("confirmed");
                // Recarrega o saldo de verdade — pontos/cashback mudaram
                // depois desse pedido (ganhou e/ou gastou).
                if (customer) {
                  fetch("/api/customer-auth/me")
                    .then((r) => r.json())
                    .then((data) => {
                      if (data.customer && data.customer.restaurantId === restaurant.id) {
                        setCustomer(data.customer);
                      }
                    })
                    .catch(() => {});
                }
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
    </ThemeContext.Provider>
  );
}


function AccountModal({
  restaurantId,
  customer,
  onClose,
  onAuthenticated,
  onLoggedOut,
}: {
  restaurantId: string;
  customer: CustomerAccount | null;
  onClose: () => void;
  onAuthenticated: (customer: CustomerAccount) => void;
  onLoggedOut: () => void;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(customer?.name ?? "");
  const [editPhone, setEditPhone] = useState(customer?.phone ?? "");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    if (!editName.trim() || !editPhone.trim() || !editPassword.trim()) {
      setEditError("Preencha todos os campos, incluindo a senha atual.");
      return;
    }
    setEditSubmitting(true);
    const res = await fetch("/api/customer-auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, phone: editPhone, currentPassword: editPassword }),
    });
    setEditSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setEditError(data?.error ?? "Não foi possível salvar.");
      return;
    }
    const updated = await res.json();
    onAuthenticated({ ...customer!, ...updated });
    setEditMode(false);
    setEditPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim() || !password.trim() || (mode === "signup" && !name.trim())) {
      setError("Preencha todos os campos.");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/customer-auth/${mode === "login" ? "login" : "signup"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, name, phone, password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível continuar.");
      return;
    }
    const data = await res.json();
    onAuthenticated({ ...data, loyaltyPoints: 0, cashbackBalanceCents: 0 });
  }

  async function handleLogout() {
    await fetch("/api/customer-auth/logout", { method: "POST" });
    onLoggedOut();
  }

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border bg-transparent text-base focus:outline-none focus:ring-2 transition-shadow";
  const inputStyle = { borderColor: theme.border, color: theme.textPrimary };

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 animate-fade-in-up" style={{ background: theme.surface }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: theme.textPrimary, fontFamily: theme.fontDisplay }}>
            {customer ? "Minha conta" : mode === "login" ? "Entrar" : "Criar conta"}
          </h2>
          <button onClick={onClose} style={{ color: theme.textSecondary }} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {customer ? (
          editMode ? (
            <form onSubmit={handleProfileSave}>
              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>Nome</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>Telefone</label>
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>Senha atual (pra confirmar)</label>
                <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} type="password" className={inputClass} style={inputStyle} />
              </div>

              {editError && <p className="text-xs mb-3" style={{ color: theme.accent }}>{editError}</p>}

              <button
                type="submit"
                disabled={editSubmitting}
                className="w-full py-3 font-semibold text-sm text-white shadow-sm disabled:opacity-50 mb-2"
                style={{ background: theme.accent, borderRadius: theme.radius === "0.25rem" ? "2px" : "999px" }}
              >
                {editSubmitting ? "Salvando..." : "Salvar alterações"}
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="w-full text-center text-xs underline"
                style={{ color: theme.textSecondary }}
              >
                Cancelar
              </button>
            </form>
          ) : (
            <div>
              <p className="text-sm mb-1" style={{ color: theme.textPrimary }}>
                <strong>{customer.name}</strong>
              </p>
              <p className="text-xs mb-4" style={{ color: theme.textSecondary }}>{customer.phone}</p>
              <button
                onClick={() => {
                  setEditName(customer.name);
                  setEditPhone(customer.phone ?? "");
                  setEditMode(true);
                }}
                className="w-full py-3 rounded-full font-semibold text-sm border mb-2"
                style={{ borderColor: theme.border, color: theme.textPrimary }}
              >
                Editar dados
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm border"
                style={{ borderColor: theme.border, color: theme.textSecondary }}
              >
                <LogOut size={15} /> Sair
              </button>
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>Nome</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
            )}
            <div className="mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>Telefone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(35) 99999-9999" inputMode="tel" className={inputClass} style={inputStyle} />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>Senha</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className={inputClass} style={inputStyle} />
            </div>

            {error && <p className="text-xs mb-3" style={{ color: theme.accent }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 font-semibold text-sm text-white shadow-sm disabled:opacity-50"
              style={{ background: theme.accent, borderRadius: theme.radius === "0.25rem" ? "2px" : "999px" }}
            >
              {submitting ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="w-full text-center text-xs mt-3 underline"
              style={{ color: theme.textSecondary }}
            >
              {mode === "login" ? "Não tem conta? Criar uma" : "Já tem conta? Entrar"}
            </button>
          </form>
        )}
      </div>
    </Overlay>
  );
}

function Footer({ restaurant }: { restaurant: Restaurant }) {
  const theme = useTheme();
  const devWhatsApp =
    "https://wa.me/553599722478?text=" +
    encodeURIComponent("Olá! Vi um cardápio digital feito por você e gostaria de saber mais.");

  return (
    <footer className="px-5 py-6 border-t mt-2" style={{ borderColor: theme.border }}>
      <p className="text-center text-[11px]" style={{ color: theme.textSecondary }}>
        © 2026 Desenvolvido por{" "}
        <a href={devWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
          style={{ color: theme.textSecondary }}
        >
          MenurAir
        </a>
      </p>
      <p className="text-center text-[11px]" style={{ color: theme.textSecondary }}>
        Todos os direitos reservados
      </p>
    </footer>
  );
}


function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const [imgError, setImgError] = useState(false);
  const theme = useTheme();

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 py-3.5 text-left transition-colors duration-150"
    >
      <div className="w-20 h-20 relative overflow-hidden shrink-0" style={{ borderRadius: theme.radius === "0.25rem" ? "4px" : "0.75rem", background: theme.divider }}>
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
            <ImageOff size={18} style={{ color: theme.textSecondary }} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm leading-tight" style={{ color: theme.textPrimary, fontFamily: theme.fontDisplay }}>
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: theme.textSecondary }}>
            {product.description}
          </p>
        )}
        <span className="font-bold text-sm mt-1 block" style={{ color: theme.accent }}>
          {currency(product.priceCents)}
        </span>
      </div>
      <span
        className="flex items-center justify-center w-7 h-7 shrink-0"
        style={{
          borderRadius: theme.radius === "0.25rem" ? "2px" : "999px",
          background: theme.radius === "0.25rem" ? "transparent" : theme.accent,
          border: theme.radius === "0.25rem" ? `1px solid ${theme.accent}` : "none",
          color: theme.radius === "0.25rem" ? theme.accent : "#FFFFFF",
        }}
      >
        <Plus size={14} />
      </span>
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
  onConfirm: (product: Product, removed: string[], extras: Extra[], groupSelections: Record<string, string[]>) => void;
}) {
  const [removed, setRemoved] = useState<string[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [groupSelections, setGroupSelections] = useState<Record<string, string[]>>({});
  const [imgError, setImgError] = useState(false);

  function toggleGroupItem(group: OptionGroup, itemId: string) {
    setGroupSelections((cur) => {
      const current = cur[group.id] ?? [];
      if (current.includes(itemId)) {
        return { ...cur, [group.id]: current.filter((id) => id !== itemId) };
      }
      // Máximo 1 = comportamento de escolha única (troca em vez de acumular).
      if (group.maxSelect === 1) {
        return { ...cur, [group.id]: [itemId] };
      }
      if (group.maxSelect !== null && current.length >= group.maxSelect) {
        return cur; // já no limite, ignora o clique
      }
      return { ...cur, [group.id]: [...current, itemId] };
    });
  }

  const groupsValid = product.optionGroups.every((group) => {
    const count = groupSelections[group.id]?.length ?? 0;
    return count >= group.minSelect && (group.maxSelect === null || count <= group.maxSelect);
  });

  const theme = useTheme();

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-fade-in-up" style={{ background: theme.surface }}>
        <div className="flex items-start justify-between p-5 pb-3">
          <h2 className="font-bold text-xl pr-4" style={{ color: theme.textPrimary, fontFamily: theme.fontDisplay }}>{product.name}</h2>
          <button onClick={onClose} className="shrink-0" style={{ color: theme.textSecondary }} aria-label="Fechar">
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
            <div className="w-full h-44 rounded-xl mb-4 flex items-center justify-center" style={{ background: theme.divider }}>
              <ImageOff size={24} style={{ color: theme.textSecondary }} />
            </div>
          )}

          {product.description && <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>{product.description}</p>}

          {product.removableOptions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide font-semibold mb-2" style={{ color: theme.textSecondary }}>
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
                        borderColor: active ? theme.accent : theme.border,
                        background: active ? theme.accent : "transparent",
                        color: active ? "#FFFFFF" : theme.textSecondary,
                      }}
                    >
                      Sem {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.optionGroups.map((group) => {
            const selectedIds = groupSelections[group.id] ?? [];
            const atLimit = group.maxSelect !== null && selectedIds.length >= group.maxSelect;
            return (
              <div key={group.id} className="mb-4">
                <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: theme.textSecondary }}>
                  {group.name} {group.minSelect > 0 && <span style={{ color: theme.accent }}>· obrigatório</span>}
                </p>
                <p className="text-[11px] mb-2" style={{ color: theme.textSecondary }}>
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
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleGroupItem(group, item.id)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-colors active:scale-[0.98] disabled:opacity-40"
                        style={{
                          borderColor: active ? theme.accent : theme.border,
                          background: active ? `${theme.accent}18` : "transparent",
                        }}
                      >
                        <span className="flex items-center gap-2 font-medium" style={{ color: theme.textPrimary }}>
                          <span
                            className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                            style={{ borderColor: theme.accent, background: active ? theme.accent : "transparent" }}
                          >
                            {active && <Check size={11} color="#FFFFFF" />}
                          </span>
                          {item.name}
                        </span>
                        {item.priceCents > 0 && group.pricingStyle !== "FIXED" && (
                          <span className="font-semibold" style={{ color: theme.accent }}>+ {currency(item.priceCents)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {product.extraOptions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide font-semibold mb-2" style={{ color: theme.textSecondary }}>
                {product.maxAccompaniments
                  ? `Monte seu prato — escolha até ${product.maxAccompaniments} (${extras.length}/${product.maxAccompaniments})`
                  : "Turbine sua refeição"}
              </p>
              <div className="space-y-2">
                {product.extraOptions.map((ex) => {
                  const active = extras.some((e) => e.id === ex.id);
                  const atLimit = !!product.maxAccompaniments && extras.length >= product.maxAccompaniments;
                  const disabled = !active && atLimit;
                  return (
                    <button
                      key={ex.id}
                      disabled={disabled}
                      onClick={() => setExtras((cur) => (active ? cur.filter((e) => e.id !== ex.id) : [...cur, ex]))}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-colors active:scale-[0.98] disabled:opacity-40"
                      style={{
                        borderColor: active ? theme.accent : theme.border,
                        background: active ? `${theme.accent}18` : "transparent",
                      }}
                    >
                      <span className="flex items-center gap-2 font-medium" style={{ color: theme.textPrimary }}>
                        <span
                          className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                          style={{ borderColor: theme.accent, background: active ? theme.accent : "transparent" }}
                        >
                          {active && <Check size={11} color="#FFFFFF" />}
                        </span>
                        + {ex.name}
                      </span>
                      <span className="font-semibold" style={{ color: theme.accent }}>{currency(ex.priceCents)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-5 pt-3 border-t" style={{ borderColor: theme.border }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-full font-medium text-sm border" style={{ borderColor: theme.border, color: theme.textSecondary }}>
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(product, removed, extras, groupSelections)}
            disabled={!groupsValid}
            className="flex-1 py-3 font-semibold text-sm text-white shadow-sm active:scale-[0.98] transition-transform disabled:opacity-40"
            style={{ background: theme.accent, borderRadius: theme.radius === "0.25rem" ? "2px" : "999px" }}
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
  const theme = useTheme();
  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-fade-in-up" style={{ background: theme.surface }}>
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: theme.textPrimary, fontFamily: theme.fontDisplay }}>
            <ShoppingCart size={18} /> Seu Pedido
          </h2>
          <button onClick={onClose} aria-label="Fechar" style={{ color: theme.textSecondary }}><X size={20} /></button>
        </div>

        <div className="overflow-y-auto px-5 flex-1">
          {cart.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: theme.textSecondary }}>Seu carrinho está vazio.</p>
          ) : (
            <div className="space-y-3 mb-2">
              {cart.map((l) => (
                <div key={l.key} className="flex items-start justify-between border-b pb-3" style={{ borderColor: theme.divider }}>
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-sm" style={{ color: theme.textPrimary }}>{l.name}</p>
                    {(l.removedItems.length > 0 || l.extraNames.length > 0 || l.selectedOptions.length > 0) && (
                      <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                        {l.selectedOptions.map((o) => o.itemNames.join(", ")).join(" · ")}
                        {l.selectedOptions.length > 0 && (l.removedItems.length > 0 || l.extraNames.length > 0) ? " · " : ""}
                        {l.removedItems.map((r) => `Sem ${r}`).join(", ")}
                        {l.removedItems.length > 0 && l.extraNames.length > 0 ? " · " : ""}
                        {l.extraNames.map((e) => `+ ${e}`).join(", ")}
                      </p>
                    )}
                    <p className="font-semibold text-sm mt-1" style={{ color: theme.accent }}>{currency(l.unitPriceCents)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onChangeQty(l.key, -1)}
                      className="w-7 h-7 rounded-full border flex items-center justify-center active:scale-90 transition-transform"
                      style={{ borderColor: theme.border, color: theme.textSecondary }}
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center font-medium" style={{ color: theme.textPrimary }}>{l.qty}</span>
                    <button
                      onClick={() => onChangeQty(l.key, 1)}
                      className="w-7 h-7 rounded-full border flex items-center justify-center active:scale-90 transition-transform"
                      style={{ borderColor: theme.border, color: theme.textSecondary }}
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

        <div className="p-5 pt-3 border-t pb-safe" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between font-bold text-base mb-4" style={{ color: theme.textPrimary }}>
            <span>Total</span>
            <span style={{ color: theme.accent }}>{currency(total)}</span>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={onCheckout}
            className="w-full py-3.5 font-semibold text-sm text-white shadow-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
            style={{ background: theme.accent, borderRadius: theme.radius === "0.25rem" ? "2px" : "999px" }}
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
  restaurantPhone,
  cart,
  total,
  table,
  customer,
  loyaltyPointsEnabled,
  loyaltyPointsRedeemThreshold,
  loyaltyPointsRedeemValueCents,
  cashbackEnabled,
  useDeliveryZones,
  onClose,
  onSuccess,
}: {
  restaurantId: string;
  restaurantIsOpen: boolean;
  restaurantPhone?: string | null;
  cart: CartLine[];
  total: number;
  table: Table | null;
  customer: CustomerAccount | null;
  loyaltyPointsEnabled: boolean;
  loyaltyPointsRedeemThreshold: number;
  loyaltyPointsRedeemValueCents: number;
  cashbackEnabled: boolean;
  useDeliveryZones: boolean;
  onClose: () => void;
  onSuccess: (result: { status: string; pixPayload?: string }) => void;
}) {
  const [customerName, setCustomerName] = useState(customer?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState(customer?.phone ?? "");
  // Com mesa: já entra travado em DINE_IN, sem opção de trocar — não faz
  // sentido perguntar "entrega ou retirada" pra alguém sentado na mesa.
  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP" | "DINE_IN">(
    table ? "DINE_IN" : "DELIVERY"
  );
  const [street, setStreet] = useState(customer?.street ?? "");
  const [number, setNumber] = useState(customer?.number ?? "");
  const [complement, setComplement] = useState(customer?.complement ?? "");
  const [neighborhood, setNeighborhood] = useState(customer?.neighborhood ?? "");
  const [city, setCity] = useState(customer?.city ?? "");
  const [referenceNote, setReferenceNote] = useState(customer?.referenceNote ?? "");
  const [savedInfo, setSavedInfo] = useState(() => getSavedCustomerInfo(restaurantId));
  const [confirmingSaved, setConfirmingSaved] = useState(() => !customer && getSavedCustomerInfo(restaurantId) !== null);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_OPTIONS)[number]["value"] | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<null | { discountCents: number; code: string }>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [deliveryFeeCents, setDeliveryFeeCents] = useState(0);
  const [changeFor, setChangeFor] = useState("");
  const [note, setNote] = useState("");
  const [neighborhoodDisabled, setNeighborhoodDisabled] = useState(false);
  const [neighborhoodOutsideArea, setNeighborhoodOutsideArea] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [useCashback, setUseCashback] = useState(false);

  const canRedeemPoints =
    loyaltyPointsEnabled && !!customer && customer.loyaltyPoints >= loyaltyPointsRedeemThreshold && loyaltyPointsRedeemThreshold > 0;
  const canUseCashback = cashbackEnabled && !!customer && customer.cashbackBalanceCents > 0;

  const loyaltyDiscountCents = redeemPoints && canRedeemPoints ? loyaltyPointsRedeemValueCents : 0;
  const preCashbackTotal =
    total - (couponStatus?.discountCents ?? 0) - loyaltyDiscountCents + (deliveryType === "DELIVERY" ? deliveryFeeCents : 0);
  const cashbackUsedCents =
    useCashback && canUseCashback ? Math.min(customer!.cashbackBalanceCents, Math.max(preCashbackTotal, 0)) : 0;
  const finalTotalCents = Math.max(preCashbackTotal - cashbackUsedCents, 0);

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
        customerPhone: customerPhone.trim() || undefined,
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

    // O input de bairro não dispara onBlur aqui (foi preenchido pelo
    // código, não digitado) — então a taxa precisa ser buscada na mão.
    if (savedInfo.deliveryType === "DELIVERY" && savedInfo.neighborhood.trim()) {
      checkDeliveryFee(savedInfo.neighborhood);
    }
  }

  function rejectSavedInfo() {
    setSavedInfo(null);
    setConfirmingSaved(false);
  }

  useEffect(() => {
    if (customer?.neighborhood) checkDeliveryFee(customer.neighborhood);
  }, []);

  async function checkDeliveryFee(neighborhoodValue: string = neighborhood) {
    if (!neighborhoodValue.trim()) return;
    const res = await fetch("/api/delivery-fee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, neighborhood: neighborhoodValue }),
    });
    const data = await res.json();
    if (!res.ok) return;
    if (data.disabled) {
      setNeighborhoodDisabled(true);
      setNeighborhoodOutsideArea(false);
      setDeliveryFeeCents(0);
      return;
    }
    if (data.outsideArea) {
      setNeighborhoodOutsideArea(true);
      setNeighborhoodDisabled(false);
      setDeliveryFeeCents(0);
      return;
    }
    setNeighborhoodDisabled(false);
    setNeighborhoodOutsideArea(false);
    setDeliveryFeeCents(data.feeCents);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Preencha seu nome e telefone.");
      return;
    }
    if (deliveryType === "DELIVERY" && neighborhoodDisabled) {
      setError("Não estamos entregando nesse bairro no momento.");
      return;
    }
    if (deliveryType === "DELIVERY" && neighborhoodOutsideArea) {
      setError("Esse bairro está fora da nossa área de entrega.");
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

    if (!table && !paymentMethod) {
      setError("Selecione a forma de pagamento.");
      return;
    }

    if (paymentMethod === "CASH" && changeFor && Math.round(Number(changeFor) * 100) < finalTotalCents) {
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
        customerId: customer?.id,
        deliveryType,
        paymentMethod: table ? "CASH" : paymentMethod,
        couponCode: couponStatus?.code,
        redeemLoyaltyPoints: redeemPoints && canRedeemPoints,
        useCashback: useCashback && canUseCashback,
        changeForCents: paymentMethod === "CASH" && changeFor ? Math.round(Number(changeFor) * 100) : undefined,
        note: note.trim() || undefined,
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
          selectedGroupOptions: l.selectedOptions.map((o) => ({ groupId: o.groupId, itemIds: o.itemIds })),
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
  const theme = useTheme();
  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border bg-transparent text-base focus:outline-none focus:ring-2 transition-shadow";
  const inputStyle = { borderColor: theme.border, color: theme.textPrimary };

  function handleCloseAttempt() {
    if (confirm("Tem certeza? Os dados preenchidos serão perdidos.")) onClose();
  }

  return (
    <Overlay onClose={handleCloseAttempt}>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-fade-in-up" style={{ background: theme.surface }}>
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-bold text-xl" style={{ color: theme.textPrimary, fontFamily: theme.fontDisplay }}>Seus Dados</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" style={{ color: theme.textSecondary }}><X size={20} /></button>
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
                  className="flex-1 py-2 rounded-full text-xs font-semibold text-white"
                  style={{ background: theme.accent }}
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
            {customer ? (
              <div className="p-3 rounded-xl text-sm" style={{ background: theme.divider, color: theme.textPrimary }}>
                Pedindo como <strong>{customer.name}</strong> · {customer.phone}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>Nome</label>
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>Telefone</label>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(35) 99999-9999"
                    inputMode="tel"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </>
            )}

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
                      background: deliveryType === opt ? theme.accent : "transparent",
                      color: deliveryType === opt ? "#FFFFFF" : theme.textSecondary,
                      borderColor: theme.border,
                    }}
                  >
                    {opt === "DELIVERY" ? "Entrega" : "Retirar no local"}
                  </button>
                ))}
              </div>
            )}

            {deliveryType === "DELIVERY" && (
              <div className="grid grid-cols-3 gap-2">
                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua" className={`col-span-2 ${inputClass}`} style={inputStyle} />
                <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Número" inputMode="numeric" className={inputClass} style={inputStyle} />
                <input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Complemento (opcional)" className={`col-span-3 ${inputClass}`} style={inputStyle} />
                <input
                  value={neighborhood}
                  onChange={(e) => { setNeighborhood(e.target.value); setNeighborhoodDisabled(false); }}
                  onBlur={() => checkDeliveryFee()}
                  placeholder="Bairro"
                  className={`col-span-2 ${inputClass}`}
                  style={inputStyle}
                />
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className={inputClass} style={inputStyle} />
                <input value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} placeholder="Ponto de referência (opcional)" className={`col-span-3 ${inputClass}`} style={inputStyle} />
                {neighborhoodDisabled && (
                  <div className="col-span-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
                    Não estamos entregando nesse bairro no momento.{" "}
                    {restaurantPhone && (
                      <a href={`https://wa.me/55${restaurantPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Oi! Vi que a entrega pro meu bairro tá pausada, queria fazer um pedido")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold"
                      >
                        Fala com a gente pelo WhatsApp
                      </a>
                    )}
                    .
                  </div>
                )}
                {neighborhoodOutsideArea && (
                  <div className="col-span-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
                    Esse bairro está fora da nossa área de entrega.{" "}
                    {restaurantPhone && (
                      <a href={`https://wa.me/55${restaurantPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Oi! Vi que meu bairro não está na área de entrega, queria saber se dá pra fazer um pedido")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold"
                      >
                        Fala com a gente pelo WhatsApp
                      </a>
                    )}
                    .
                  </div>
                )}
              </div>
            )}
            {!table && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>Forma de pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="" disabled>
                    Selecione o meio de pagamento
                  </option>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {!table && paymentMethod === "CASH" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>
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
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>
              Observação (opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 300))}
              placeholder="ex: sem cebola, trazer troco, tocar o interfone 2"
              rows={2}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <p className="text-xs mb-3" style={{ color: theme.textSecondary }}>
            Ao finalizar, você concorda com o uso do seu nome, telefone
            {deliveryType === "DELIVERY" ? " e endereço " : " "}
            apenas para processar este pedido.{" "}
            <a href="/privacidade" target="_blank" className="underline">Saiba mais</a>.
          </p>

          {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
        </div>

        <div className="p-5 pt-3 border-t pb-safe" style={{ borderColor: theme.border }}>
          {canRedeemPoints && (
            <button
              type="button"
              onClick={() => setRedeemPoints((v) => !v)}
              className="w-full flex items-center justify-between p-3 rounded-xl border mb-3 text-left"
              style={{ borderColor: redeemPoints ? theme.accent : theme.border, background: redeemPoints ? `${theme.accent}18` : "transparent" }}
            >
              <span className="text-sm" style={{ color: theme.textPrimary }}>
                Usar {loyaltyPointsRedeemThreshold} pontos ({customer!.loyaltyPoints} disponíveis)
              </span>
              <span className="text-sm font-bold" style={{ color: theme.accent }}>-{currency(loyaltyPointsRedeemValueCents)}</span>
            </button>
          )}
          {canUseCashback && (
            <button
              type="button"
              onClick={() => setUseCashback((v) => !v)}
              className="w-full flex items-center justify-between p-3 rounded-xl border mb-4 text-left"
              style={{ borderColor: useCashback ? theme.accent : theme.border, background: useCashback ? `${theme.accent}18` : "transparent" }}
            >
              <span className="text-sm" style={{ color: theme.textPrimary }}>
                Usar cashback disponível ({currency(customer!.cashbackBalanceCents)})
              </span>
              <span className="text-sm font-bold" style={{ color: theme.accent }}>
                -{currency(useCashback ? cashbackUsedCents : 0)}
              </span>
            </button>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textSecondary }}>
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
                style={inputStyle}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={validatingCoupon || !couponCode.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border disabled:opacity-40 whitespace-nowrap"
                style={{ borderColor: theme.border, color: theme.textSecondary }}
              >
                {validatingCoupon ? "..." : "Aplicar"}
              </button>
            </div>
            {couponError && <p className="text-xs mt-1.5" style={{ color: theme.accent }}>{couponError}</p>}
            {couponStatus && (
              <p className="text-emerald-600 text-xs mt-1.5 font-medium">
                Cupom {couponStatus.code} aplicado: -{currency(couponStatus.discountCents)}
              </p>
            )}
          </div>

          <div className="space-y-1 mb-4">
            {(couponStatus?.discountCents ?? 0) > 0 || loyaltyDiscountCents > 0 || cashbackUsedCents > 0 ? (
              <div className="flex items-center justify-between text-sm" style={{ color: theme.textSecondary }}>
                <span>Subtotal</span>
                <span>{currency(total)}</span>
              </div>
            ) : null}
            {couponStatus && couponStatus.discountCents > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span>Cupom</span>
                <span>-{currency(couponStatus.discountCents)}</span>
              </div>
            )}
            {loyaltyDiscountCents > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span>Pontos resgatados</span>
                <span>-{currency(loyaltyDiscountCents)}</span>
              </div>
            )}
            {cashbackUsedCents > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span>Cashback usado</span>
                <span>-{currency(cashbackUsedCents)}</span>
              </div>
            )}
            {deliveryType === "DELIVERY" && deliveryFeeCents > 0 && (
              <div className="flex items-center justify-between text-sm" style={{ color: theme.textSecondary }}>
                <span>Taxa de entrega</span>
                <span>{currency(deliveryFeeCents)}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-bold text-base" style={{ color: theme.textPrimary }}>
              <span>Total</span>
              <span style={{ color: theme.accent }}>{currency(finalTotalCents)}</span>
            </div>
          </div>
          <button
            disabled={submitting || !restaurantIsOpen}
            className="w-full py-3.5 font-semibold text-sm text-white shadow-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
            style={{ background: theme.accent, borderRadius: theme.radius === "0.25rem" ? "2px" : "999px" }}
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
  const theme = useTheme();
  return (
    <Overlay onClose={onNewOrder}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 animate-fade-in-up max-h-[90vh] overflow-y-auto" style={{ background: theme.surface }}>
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 bg-emerald-500">
            <Check size={26} color="#FFFFFF" />
          </div>
          <h2 className="font-bold text-xl mb-1" style={{ color: theme.textPrimary, fontFamily: theme.fontDisplay }}>
            {isCash ? "Pedido Confirmado" : "Pedido Recebido"}
          </h2>
          <p className="text-sm mb-1" style={{ color: theme.textSecondary }}>
            {isCash
              ? "Seu pedido já está sendo preparado."
              : "Assim que confirmarmos o pagamento, seu pedido entra na cozinha."}
          </p>

          {pixPayload && (
            <div className="mt-5 pt-5 border-t" style={{ borderColor: theme.border }}>
              <p className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>Pague com Pix para confirmar</p>
              <PixQrCode payload={pixPayload} />
            </div>
          )}

          <button
            onClick={onNewOrder}
            className="mt-6 px-5 py-2.5 font-semibold text-sm text-white shadow-sm active:scale-95 transition-transform"
            style={{ background: theme.accent, borderRadius: theme.radius === "0.25rem" ? "2px" : "999px" }}
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    </Overlay>
  );
}
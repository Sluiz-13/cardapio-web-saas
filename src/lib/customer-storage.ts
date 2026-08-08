export type SavedCustomerInfo = {
  customerName: string;
  customerPhone: string;
  deliveryType: "DELIVERY" | "PICKUP";
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  referenceNote: string;
};

function storageKey(restaurantId: string) {
  return `menuair:lastCustomer:${restaurantId}`;
}

export function getSavedCustomerInfo(restaurantId: string): SavedCustomerInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(restaurantId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomerInfo(restaurantId: string, info: SavedCustomerInfo) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(restaurantId), JSON.stringify(info));
  } catch {
    // localStorage pode falhar (modo privado, quota cheia) — não é crítico, ignora.
  }
}
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string {
  // Se o telefone for nulo, undefined ou string vazia, retorna um link vazio ou aborta
  if (!phone) {
    return "";
  }

  const digits = phone.replace(/\D/g, "");
  
  // Se já vier com DDI (55), usa como está; senão, assume Brasil e adiciona.
  const withCountryCode = digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`;
  
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

// Pega só o primeiro nome — "Olá Luiz Felipe da Silva" soa formal demais
// pra uma mensagem de delivery.
function firstName(fullName: string): string {
  return fullName.trim().split(" ")[0];
}

const STATUS_MESSAGE: Record<string, (name: string, orderShortId: string) => string> = {
  NEW: (name, id) => `Olá, ${name}! Recebemos seu pedido #${id} e já estamos preparando. 🍽️`,
  PREPARING: (name, id) => `${name}, seu pedido #${id} está sendo preparado agora. 👨‍🍳`,
  READY: (name, id) => `${name}, seu pedido #${id} está pronto!`,
  OUT_FOR_DELIVERY: (name, id) => `${name}, seu pedido #${id} saiu para entrega. 🛵`,
  DELIVERED: (name, id) => `${name}, seu pedido #${id} foi entregue. Bom apetite! 😋`,
};

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  CASH: "Dinheiro",
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export type OrderMessageDetails = {
  items: { productName: string; qty: number }[];
  paymentMethod: string;
  totalCents: number;
};

// Resumo que vai abaixo da frase do status. Negrito com *...* é a
// formatação nativa do WhatsApp.
function buildOrderSummary(d: OrderMessageDetails): string {
  const itemLines = d.items.map((i) => `${i.qty}x ${i.productName}`).join("\n");
  return [
    "*Seu pedido:*",
    itemLines,
    "",
    `*Pagamento:* ${PAYMENT_LABEL[d.paymentMethod] ?? d.paymentMethod}`,
    `*Total:* ${currency(d.totalCents)}`,
  ].join("\n");
}

export function buildOrderStatusMessage(
  status: string,
  customerName: string,
  orderShortId: string,
  details?: OrderMessageDetails
): string {
  const builder = STATUS_MESSAGE[status];
  const name = firstName(customerName);
  const headline = builder ? builder(name, orderShortId) : `Olá, ${name}! Sobre o seu pedido #${orderShortId}:`;
  if (!details || details.items.length === 0) return headline;
  return `${headline}\n\n${buildOrderSummary(details)}`;
}
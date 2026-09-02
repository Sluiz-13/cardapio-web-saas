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

export function buildOrderStatusMessage(status: string, customerName: string, orderShortId: string): string {
  const builder = STATUS_MESSAGE[status];
  const name = firstName(customerName);
  return builder ? builder(name, orderShortId) : `Olá, ${name}! Sobre o seu pedido #${orderShortId}:`;
}
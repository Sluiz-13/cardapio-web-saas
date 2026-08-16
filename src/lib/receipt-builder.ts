import type { Order, OrderItem, Restaurant } from "@prisma/client";

/**
 * Gera os bytes ESC/POS de um cupom de pedido, a partir dos MESMOS dados
 * usados na tela de impressão manual (src/app/admin/pedidos/[id]/imprimir).
 *
 * Esse módulo é a ÚNICA fonte de verdade do conteúdo/formatação do cupom.
 * Tanto o disparo via RawBT quanto o futuro Print Agent (PC/notebook) devem
 * consumir a saída daqui — nenhum dos dois deve remontar o texto do cupom
 * por conta própria. Se um dia adicionarmos um 4º método de impressão
 * (ex: Epson ePOS via HTTP), ele também consome esses bytes.
 *
 * Decisão de design: removemos acentos do texto impresso. Impressoras
 * genéricas sem marca conhecida variam muito na code page suportada, e
 * configurar isso errado imprime caracteres quebrados (ex: "EndereÃ§o").
 * Sem acento sempre imprime legível, em qualquer modelo.
 */

type OrderItemForReceipt = Pick<
  OrderItem,
  "productName" | "unitPriceCents" | "qty" | "removedItems" | "extras"
>;

type OrderForReceipt = Pick<
  Order,
  | "id"
  | "createdAt"
  | "customerName"
  | "customerPhone"
  | "deliveryType"
  | "street"
  | "number"
  | "complement"
  | "neighborhood"
  | "city"
  | "referenceNote"
  | "totalCents"
  | "paymentMethod"
  | "changeForCents"
> & {
  items: OrderItemForReceipt[];
  restaurant: Pick<Restaurant, "name">;
};

// 32 colunas é o padrão seguro pra impressora térmica de 58mm, a mais comum
// em impressora genérica de delivery. Se um cliente usar 80mm, dá pra vir a
// ser um campo configurável por restaurante — por enquanto, fixo e seguro.
const CHARS_PER_LINE = 32;

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartao de Credito",
  DEBIT_CARD: "Cartao de Debito",
  CASH: "Dinheiro",
};

const currency = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

// Remove acentos e caracteres fora do ASCII básico, pra garantir compatibilidade
// universal com qualquer code page de impressora térmica genérica.
function stripAccents(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

function padLine(left: string, right: string): string {
  left = stripAccents(left);
  right = stripAccents(right);
  const space = CHARS_PER_LINE - left.length - right.length;
  if (space <= 0) return `${left}\n${" ".repeat(Math.max(CHARS_PER_LINE - right.length, 0))}${right}`;
  return left + " ".repeat(space) + right;
}

// Quebra texto longo (endereço, nome de produto grande) em várias linhas
// respeitando a largura da impressora, sem cortar palavra no meio.
function wrapText(text: string, prefix = ""): string[] {
  const clean = stripAccents(text);
  const width = CHARS_PER_LINE - prefix.length;
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > width) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);

  return lines.map((line, i) => (i === 0 ? prefix + line : " ".repeat(prefix.length) + line));
}

function centerText(text: string): string {
  const clean = stripAccents(text);
  if (clean.length >= CHARS_PER_LINE) return clean.slice(0, CHARS_PER_LINE);
  const padding = Math.floor((CHARS_PER_LINE - clean.length) / 2);
  return " ".repeat(padding) + clean;
}

// Comandos ESC/POS puros — funcionam na esmagadora maioria de impressoras
// térmicas genéricas, mesmo sem marca conhecida, porque ESC/POS é o
// "protocolo de fato" que praticamente todo clone implementa.
const ESC = 0x1b;
const GS = 0x1d;

const CMD = {
  INIT: Buffer.from([ESC, 0x40]), // reseta a impressora pro estado padrão
  BOLD_ON: Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([ESC, 0x45, 0x00]),
  CUT: Buffer.from([GS, 0x56, 0x42, 0x00]), // corte parcial com avanço de papel
  FEED: (lines: number) => Buffer.from([ESC, 0x64, lines]),
};

export function buildReceiptEscPos(order: OrderForReceipt): Buffer {
  const lines: string[] = [];

  lines.push(centerText(order.restaurant.name.toUpperCase()));
  lines.push(centerText(`Pedido #${order.id.slice(-5)}`));
  lines.push(centerText(new Date(order.createdAt).toLocaleString("pt-BR")));
  lines.push("-".repeat(CHARS_PER_LINE));

  lines.push(...wrapText(`Cliente: ${order.customerName}`));
  lines.push(...wrapText(`Telefone: ${order.customerPhone}`));
  lines.push(
    `Entrega: ${order.deliveryType === "DELIVERY" ? "Entrega" : "Retirada no local"}`
  );

  if (order.deliveryType === "DELIVERY" && order.street) {
    lines.push(...wrapText(`End: ${order.street}, ${order.number ?? ""}${order.complement ? " - " + order.complement : ""}`));
    lines.push(...wrapText(`${order.neighborhood ?? ""} - ${order.city ?? ""}`));
    if (order.referenceNote) lines.push(...wrapText(`Ref: ${order.referenceNote}`));
  }

  lines.push("-".repeat(CHARS_PER_LINE));

  for (const item of order.items) {
    const removed = Array.isArray(item.removedItems) ? (item.removedItems as string[]) : [];
    const extras = Array.isArray(item.extras)
      ? (item.extras as { name: string; priceCents: number }[])
      : [];

    lines.push(padLine(`${item.qty}x ${item.productName}`, currency(item.unitPriceCents * item.qty)));
    if (removed.length > 0) lines.push(...wrapText(`Sem: ${removed.join(", ")}`, "  "));
    if (extras.length > 0) lines.push(...wrapText(`+ ${extras.map((e) => e.name).join(", ")}`, "  "));
  }

  lines.push("-".repeat(CHARS_PER_LINE));
  lines.push(padLine("TOTAL", currency(order.totalCents)));
  lines.push(`Pagamento: ${PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}`);

  if (order.paymentMethod === "CASH" && order.changeForCents) {
    lines.push(...wrapText(`Troco para: ${currency(order.changeForCents)}`));
    lines.push(...wrapText(`Levar: ${currency(order.changeForCents - order.totalCents)}`));
  }

  const body = lines.join("\n") + "\n";

  return Buffer.concat([
    CMD.INIT,
    Buffer.from(body, "ascii"),
    CMD.FEED(3),
    CMD.CUT,
  ]);
}

// RawBT recebe o payload como base64 dos bytes ESC/POS puros, via URL scheme
// customizado (rawbt:base64,<payload>). Isso é consumido pelo componente
// client-side que dispara a impressão — mantido aqui perto do builder pra
// não duplicar a regra de encoding em mais de um lugar.
export function buildRawBtIntentUrl(order: OrderForReceipt): string {
  const bytes = buildReceiptEscPos(order);
  return `rawbt:base64,${bytes.toString("base64")}`;
}

type ComandaForReceipt = {
  openedAt: Date;
  table: { label: string };
  restaurant: { name: string };
  orders: {
    customerName: string;
    totalCents: number;
    items: { productName: string; qty: number }[];
  }[];
};

/**
 * Recibo da CONTA FECHADA de uma comanda — diferente do cupom de pedido
 * individual: soma todos os pedidos da mesa numa única via, pro cliente
 * conferir antes de pagar.
 */

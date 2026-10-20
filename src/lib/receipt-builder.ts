import type { Order, OrderItem, Restaurant } from "@prisma/client";

type OrderItemForReceipt = Pick <
  OrderItem,
  "productName" | "categoryName" | "unitPriceCents" | "qty" | "removedItems" | "extras" | "selectedOptions"
>;

type OrderForReceipt = Pick<
  Order,
  | "id"
  | "dailyNumber"
  | "note"
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
  | "deliveryFeeCents"
  | "discountCents"
  | "loyaltyDiscountCents"
  | "cashbackUsedCents"
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
  // Só dobra a ALTURA, não a largura — assim o texto fica visivelmente
  // maior sem bagunçar o alinhamento de 32 colunas que já está calibrado.
  SIZE_TALL: Buffer.from([GS, 0x21, 0x01]),
  // Dobra altura E largura — usado só no número do pedido, que fica numa
  // linha separada, então não afeta o alinhamento de 32 colunas do resto.
  SIZE_BIG: Buffer.from([GS, 0x21, 0x11]),
  SIZE_NORMAL: Buffer.from([GS, 0x21, 0x00]),
  FONT_A: Buffer.from([ESC, 0x4d, 0x00]), // fonte normal
  FONT_B: Buffer.from([ESC, 0x4d, 0x01]), // fonte compacta (nem toda impressora genérica tem; sem ela, sai igual à normal)
  CUT: Buffer.from([GS, 0x56, 0x42, 0x00]), // corte parcial com avanço de papel
  FEED: (lines: number) => Buffer.from([ESC, 0x64, lines]),
};

const EMPTY = Buffer.alloc(0);

export type PrintFontSizeOpt = "AUTO" | "SMALL" | "MEDIUM" | "LARGE";
export type PrintSpacingOpt = "COMPACT" | "NORMAL" | "WIDE";
type ReceiptOpts = { showCategory?: boolean; fontSize?: PrintFontSizeOpt; spacing?: PrintSpacingOpt };
type ResolvedSize = "SMALL" | "MEDIUM" | "LARGE";

// AUTO mantém o comportamento antigo: cada via tem seu tamanho padrão.
function resolveSize(size: PrintFontSizeOpt | undefined, autoDefault: ResolvedSize): ResolvedSize {
  return !size || size === "AUTO" ? autoDefault : size;
}

// Altura aproximada do caractere em pontos (203dpi). O espaçamento é
// calculado em cima disso pra nunca ficar menor que a letra e encavalar.
const CHAR_HEIGHT_DOTS: Record<ResolvedSize, number> = { SMALL: 17, MEDIUM: 24, LARGE: 48 };

function spacingCmd(spacing: PrintSpacingOpt | undefined, size: ResolvedSize): Buffer {
  if (!spacing || spacing === "NORMAL") return EMPTY; // padrão da impressora, como sempre foi
  const h = CHAR_HEIGHT_DOTS[size];
  const n = spacing === "COMPACT" ? h + 2 : Math.round(h * 1.6);
  return Buffer.from([ESC, 0x33, Math.min(n, 255)]);
}

// Estilo do cabeçalho (nome do restaurante / "VIA DA COZINHA").
function headerStyle(size: ResolvedSize): Buffer {
  if (size === "LARGE") return CMD.SIZE_TALL;
  if (size === "SMALL") return CMD.FONT_B;
  return EMPTY;
}

// Estilo do corpo, aplicado depois do número do pedido.
function bodyStyle(size: ResolvedSize, spacing: PrintSpacingOpt | undefined): Buffer {
  return Buffer.concat([headerStyle(size), spacingCmd(spacing, size)]);
}

// Número do pedido em destaque. Com largura dobrada cabem só 16 colunas,
// por isso centraliza em CHARS_PER_LINE / 2.
function bigOrderNumber(order: { id: string; dailyNumber: number | null }): Buffer {
  const label = stripAccents(`PEDIDO #${order.dailyNumber ?? order.id.slice(-5)}`);
  const width = CHARS_PER_LINE / 2;
  const pad = Math.max(Math.floor((width - label.length) / 2), 0);
  return Buffer.concat([
    CMD.BOLD_ON,
    CMD.SIZE_BIG,
    Buffer.from(" ".repeat(pad) + label + "\n", "ascii"),
    CMD.SIZE_NORMAL,
    CMD.BOLD_OFF,
  ]);
}

export function buildReceiptEscPos(order: OrderForReceipt, opts: ReceiptOpts = {}): Buffer {
  const showCategory = opts.showCategory ?? true;
  const size = resolveSize(opts.fontSize, "LARGE");
  const wideGap = opts.spacing === "WIDE";
  const lines: string[] = [];

  const headerLine = centerText(order.restaurant.name.toUpperCase());
  lines.push(centerText(new Date(order.createdAt).toLocaleString("pt-BR")));
  lines.push("-".repeat(CHARS_PER_LINE));

  lines.push(...wrapText(`Cliente: ${order.customerName}`));
  if (order.customerPhone) {
    lines.push(...wrapText(`Telefone: ${order.customerPhone}`));
  }
  lines.push(
    `Entrega: ${order.deliveryType === "DELIVERY" ? "Entrega" : "Retirada no local"}`
  );

  if (order.deliveryType === "DELIVERY" && order.street) {
    lines.push(...wrapText(`End: ${order.street}, ${order.number ?? ""}${order.complement ? " - " + order.complement : ""}`));
    lines.push(...wrapText(`${order.neighborhood ?? ""} - ${order.city ?? ""}`));
    if (order.referenceNote) lines.push(...wrapText(`Ref: ${order.referenceNote}`));
  }

  if (order.note) {
    lines.push(...wrapText(`Obs: ${order.note}`));
  }

  lines.push("-".repeat(CHARS_PER_LINE));

  for (const item of order.items) {
    const removed = Array.isArray(item.removedItems) ? (item.removedItems as string[]) : [];
    const extras = Array.isArray(item.extras)
      ? (item.extras as { name: string; priceCents: number }[])
      : [];
    const selectedOptions = Array.isArray(item.selectedOptions)
      ? (item.selectedOptions as { groupName: string; items: { name: string }[] }[])
      : [];

    if (wideGap && item !== order.items[0]) lines.push("");
    lines.push(padLine(`${item.qty}x ${item.productName}`, currency(item.unitPriceCents * item.qty)));
    if (showCategory && item.categoryName) lines.push(...wrapText(item.categoryName, "  "));

    for (const group of selectedOptions) {
      lines.push(...wrapText(`${group.groupName}: ${group.items.map((i) => i.name).join(", ")}`, "  "));
    }
    if (removed.length > 0) lines.push(...wrapText(`Sem: ${removed.join(", ")}`, "  "));
    if (extras.length > 0) lines.push(...wrapText(`+ ${extras.map((e) => e.name).join(", ")}`, "  "));
  }

  const itemsSubtotalCents = order.items.reduce((s, item) => s + item.unitPriceCents * item.qty, 0);
  const hasAdjustments =
    order.discountCents > 0 ||
    order.loyaltyDiscountCents > 0 ||
    order.cashbackUsedCents > 0 ||
    (order.deliveryType === "DELIVERY" && order.deliveryFeeCents > 0);

  lines.push("-".repeat(CHARS_PER_LINE));
  if (hasAdjustments) {
    lines.push(padLine("Subtotal", currency(itemsSubtotalCents)));
    if (order.discountCents > 0) lines.push(padLine("Cupom", `-${currency(order.discountCents)}`));
    if (order.loyaltyDiscountCents > 0) lines.push(padLine("Pontos resgatados", `-${currency(order.loyaltyDiscountCents)}`));
    if (order.deliveryType === "DELIVERY" && order.deliveryFeeCents) {
      lines.push(padLine("Taxa de entrega", currency(order.deliveryFeeCents)));
    }
    if (order.cashbackUsedCents > 0) lines.push(padLine("Cashback usado", `-${currency(order.cashbackUsedCents)}`));
  }
  lines.push(padLine("TOTAL", currency(order.totalCents)));
  lines.push(`Pagamento: ${PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}`);

  if (order.paymentMethod === "CASH" && order.changeForCents) {
    lines.push(...wrapText(`Troco para: ${currency(order.changeForCents)}`));
    lines.push(...wrapText(`Levar: ${currency(order.changeForCents - order.totalCents)}`));
  }

  const body = lines.join("\n") + "\n";

  return Buffer.concat([
    CMD.INIT,
    headerStyle(size),
    Buffer.from(headerLine + "\n", "ascii"),
    size === "SMALL" ? CMD.FONT_A : EMPTY, // número do pedido sempre na fonte normal
    bigOrderNumber(order),
    bodyStyle(size, opts.spacing),
    Buffer.from(body, "ascii"),
    CMD.SIZE_NORMAL,
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

export function buildComandaReceiptEscPos(comanda: ComandaForReceipt): Buffer {
  const lines: string[] = [];

  lines.push(centerText(comanda.restaurant.name.toUpperCase()));
  lines.push(centerText(`CONTA — ${comanda.table.label}`));
  lines.push(centerText(new Date().toLocaleString("pt-BR")));
  lines.push("-".repeat(CHARS_PER_LINE));

  let total = 0;
  for (const order of comanda.orders) {
    lines.push(...wrapText(order.customerName));
    for (const item of order.items) {
      lines.push(`  ${item.qty}x ${item.productName}`);
    }
    lines.push(padLine("", currency(order.totalCents)));
    lines.push("");
    total += order.totalCents;
  }

  lines.push("-".repeat(CHARS_PER_LINE));
  lines.push(padLine("TOTAL DA CONTA", currency(total)));

  const body = lines.join("\n") + "\n";

  return Buffer.concat([
    CMD.INIT,
    Buffer.from(body, "ascii"),
    CMD.FEED(3),
    CMD.CUT,
  ]);
}

type KitchenOrderForReceipt = Pick<Order, "id" | "dailyNumber" | "createdAt" | "customerName" | "customerPhone" | "deliveryType" | "note"> & {
  items: Pick<OrderItem, "productName" | "categoryName" | "qty" | "removedItems" | "extras" | "selectedOptions">[];
  table?: { label: string } | null;
};

// Via da cozinha: só o essencial pra preparar — sem preço, sem forma de
// pagamento, sem troco. Reduz erro de quem prepara ficar lendo valor em vez
// de item, e evita expor preço pro cliente que às vezes acompanha de perto.
export function buildKitchenReceiptEscPos(order: KitchenOrderForReceipt, opts: ReceiptOpts = {}): Buffer {
  const showCategory = opts.showCategory ?? true;
  const size = resolveSize(opts.fontSize, "MEDIUM");
  const wideGap = opts.spacing === "WIDE";
  const lines: string[] = [];

  lines.push(centerText(new Date(order.createdAt).toLocaleString("pt-BR")));
  lines.push("-".repeat(CHARS_PER_LINE));

  lines.push(...wrapText(`Cliente: ${order.customerName}`));
  if (order.customerPhone) lines.push(...wrapText(`Telefone: ${order.customerPhone}`));
  if (order.deliveryType === "DINE_IN" && order.table) lines.push(`Mesa: ${order.table.label}`);
  if (order.note) lines.push(...wrapText(`Obs: ${order.note}`));

  lines.push("-".repeat(CHARS_PER_LINE));

  for (const item of order.items) {
    const removed = Array.isArray(item.removedItems) ? (item.removedItems as string[]) : [];
    const extras = Array.isArray(item.extras) ? (item.extras as { name: string }[]) : [];
    const selectedOptions = Array.isArray(item.selectedOptions)
      ? (item.selectedOptions as { groupName: string; items: { name: string }[] }[])
      : [];

    if (wideGap && item !== order.items[0]) lines.push("");
    lines.push(`${item.qty}x ${item.productName}`);
    if (showCategory && item.categoryName) lines.push(...wrapText(item.categoryName, "  "));
    for (const group of selectedOptions) {
      lines.push(...wrapText(`${group.groupName}: ${group.items.map((i) => i.name).join(", ")}`, "  "));
    }
    if (removed.length > 0) lines.push(...wrapText(`Sem: ${removed.join(", ")}`, "  "));
    if (extras.length > 0) lines.push(...wrapText(`+ ${extras.map((e) => e.name).join(", ")}`, "  "));
  }

  const body = lines.join("\n") + "\n";

  return Buffer.concat([
    CMD.INIT,
    headerStyle(size),
    Buffer.from(centerText("VIA DA COZINHA") + "\n", "ascii"),
    size === "SMALL" ? CMD.FONT_A : EMPTY,
    bigOrderNumber(order),
    bodyStyle(size, opts.spacing),
    Buffer.from(body, "ascii"),
    CMD.FEED(3),
    CMD.CUT,
  ]);
}
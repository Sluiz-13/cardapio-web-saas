// Demo tenant for the launch video — LOCAL DEV DB ONLY.
// Creates "Menuair Burger" (slug menuair-burger-demo) with 14 days of realistic activity.
// Run:    npx tsx brag-output/work/seed-demo.ts
// Remove: npx tsx brag-output/work/seed-demo.ts --delete
// Admin login is written to brag-output/work/demo-credentials.txt (local only).
import { PrismaClient, PaymentMethod, DeliveryType, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const db = new PrismaClient();
const SLUG = "menuair-burger-demo";
const EMAIL = "demo@menuair-burger.test";

// deterministic RNG so re-seeding gives the same numbers
let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const between = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

async function remove() {
  const r = await db.restaurant.findUnique({ where: { slug: SLUG } });
  if (!r) return console.log("nothing to delete");
  // children with non-cascading FKs first
  await db.cashSession.deleteMany({ where: { restaurantId: r.id } });
  await db.order.deleteMany({ where: { restaurantId: r.id } });
  await db.product.deleteMany({ where: { restaurantId: r.id } });
  await db.restaurant.delete({ where: { id: r.id } });
  console.log("deleted", SLUG);
}

async function main() {
  if (process.argv.includes("--delete")) return remove();
  await remove();

  const now = new Date();
  const LAT = -23.5614, LNG = -46.6559; // Av. Paulista
  const r = await db.restaurant.create({
    data: {
      name: "Menuair Burger", slug: SLUG, plan: "PRO", isOpen: true,
      lastPaymentConfirmedAt: now, nextDueDate: new Date(now.getTime() + 25 * 864e5),
      phone: "(11) 4002-8922", address: "Avenida Paulista, 1000 — Bela Vista", avgDeliveryTime: "30-40",
      defaultDeliveryFeeCents: 700, serviceFeePercent: 10, menuTheme: "PREMIUM",
      useDeliveryZones: true, restaurantLat: LAT, restaurantLng: LNG,
      loyaltyPointsEnabled: true, loyaltyPointsPerReal: 1, loyaltyPointsRedeemThreshold: 200, loyaltyPointsRedeemValueCents: 1500,
      cashbackEnabled: true, cashbackPercent: 5,
      pixKey: "demo@menuair-burger.test", pixKeyType: "email", pixMerchantName: "MENUAIR BURGER", pixMerchantCity: "SAO PAULO",
      businessHours: { create: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, isOpen: true, openTime: "00:00", closeTime: "23:59" })) },
    },
  });

  const password = crypto.randomBytes(9).toString("base64url");
  const admin = await db.adminUser.create({
    data: { restaurantId: r.id, name: "Luiz Felippe", email: EMAIL, role: "OWNER", passwordHash: await bcrypt.hash(password, 10) },
  });
  fs.writeFileSync(path.join(__dirname, "demo-credentials.txt"), `email=${EMAIL}\npassword=${password}\n`);

  // menu
  const MENU: [string, [string, number, string][]][] = [
    ["Hambúrguer", [
      ["Classic Smash Cheeseburger", 2690, "Pão selado na manteiga, dois discos de smash 80g, queijo americano e molho da casa."],
      ["Bacon BBQ Supreme", 3690, "Brioche, hambúrguer artesanal 180g, bacon crocante, cheddar e barbecue."],
      ["Duplo Salada Especial", 3200, "Dois hambúrgueres de 120g, queijo prato, alface, tomate e maionese verde."],
      ["Gorgonzola & Caramelized Onion", 3890, "Australiano, blend 180g, creme de gorgonzola e cebola caramelizada."],
    ]],
    ["Acompanhamentos", [["Batata frita rústica", 1890, "Porção 300g com páprica."], ["Onion rings", 2190, "Anéis de cebola empanados."]]],
    ["Bebidas", [["Coca-Cola lata", 700, ""], ["Suco de laranja 500ml", 1200, ""], ["Chopp artesanal 400ml", 1690, ""]]],
    ["Sobremesas", [["Brownie com sorvete", 1890, ""], ["Milkshake de Ovomaltine", 2290, ""]]],
  ];
  const products: { id: string; name: string; price: number; cat: string }[] = [];
  for (const [ci, [cat, items]] of MENU.entries()) {
    const c = await db.category.create({ data: { restaurantId: r.id, name: cat, order: ci } });
    for (const [pi, [name, price, description]] of items.entries()) {
      const p = await db.product.create({ data: { restaurantId: r.id, categoryId: c.id, name, priceCents: price, description: description || null, order: pi } });
      products.push({ id: p.id, name, price, cat });
    }
  }
  const burgers = products.filter((p) => p.cat === "Hambúrguer");

  // stock + recipes (CMV)
  const INS: [string, string, number, number, number][] = [
    ["Pão brioche", "un", 46, 60, 180], ["Blend bovino 180g", "un", 38, 50, 690], ["Queijo cheddar", "kg", 4.2, 3, 5490],
    ["Bacon fatiado", "kg", 1.1, 2, 4990], ["Batata congelada", "kg", 18, 10, 1290], ["Cebola roxa", "kg", 6.5, 3, 590],
  ];
  const ins: Record<string, string> = {};
  for (const [name, unit, cur, min, cost] of INS) {
    const i = await db.insumo.create({ data: { restaurantId: r.id, name, unit, currentStock: cur, minStock: min, costPerUnit: cost } });
    ins[name] = i.id;
  }
  for (const b of burgers) {
    await db.productRecipeItem.createMany({ data: [
      { productId: b.id, insumoId: ins["Pão brioche"], quantity: 1 },
      { productId: b.id, insumoId: ins["Blend bovino 180g"], quantity: b.name.startsWith("Duplo") || b.name.startsWith("Classic") ? 2 : 1 },
      { productId: b.id, insumoId: ins["Queijo cheddar"], quantity: 0.03 },
      ...(b.name.startsWith("Bacon") ? [{ productId: b.id, insumoId: ins["Bacon fatiado"], quantity: 0.04 }] : []),
    ] });
  }
  const fries = products.find((p) => p.name.startsWith("Batata"))!;
  await db.productRecipeItem.create({ data: { productId: fries.id, insumoId: ins["Batata congelada"], quantity: 0.3 } });

  // tables, drivers, customers
  const tableLabels = ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5", "Mesa 6", "Mesa 7", "Mesa 8", "Varanda 1", "Varanda 2", "Varanda 3", "Balcão"];
  const tables = [];
  for (const label of tableLabels) tables.push(await db.table.create({ data: { restaurantId: r.id, label } }));
  const drivers = [];
  for (const [name, phone] of [["Carlos Mendes", "11988881111"], ["Rafaela Souza", "11988882222"], ["Diego Lima", "11988883333"]])
    drivers.push(await db.driver.create({ data: { restaurantId: r.id, name, phone } }));

  const NAMES = ["Ana Paula", "Bruno Costa", "Camila Rocha", "Daniel Alves", "Eduarda Lima", "Felipe Martins", "Gabriela Nunes", "Henrique Dias",
    "Isabela Freitas", "João Pedro", "Larissa Melo", "Marcos Vieira", "Natália Ribeiro", "Otávio Pires", "Patrícia Gomes", "Rafael Torres"];
  const HOODS = ["Bela Vista", "Consolação", "Jardins", "Paraíso", "Liberdade", "Cerqueira César"];
  const STREETS = ["Rua Augusta", "Alameda Santos", "Rua Haddock Lobo", "Rua Frei Caneca", "Rua Pamplona", "Rua Treze de Maio"];
  const custHash = await bcrypt.hash(crypto.randomBytes(12).toString("hex"), 8);
  const customers = [];
  for (const [i, name] of NAMES.entries()) {
    customers.push(await db.customer.create({ data: {
      restaurantId: r.id, name, phone: `119${String(70000000 + i * 137911).slice(0, 8)}`, passwordHash: custHash,
      loyaltyPoints: between(40, 420), cashbackBalanceCents: between(0, 45) * 100,
      street: pick(STREETS), number: String(between(10, 1900)), neighborhood: pick(HOODS), city: "São Paulo",
    } }));
  }

  // 14 days of orders
  let daily = 1;
  const mkItems = () => {
    const n = between(1, 3), items = [];
    for (let k = 0; k < n; k++) {
      const p = k === 0 ? pick(burgers) : pick(products);
      items.push({ productId: p.id, productName: p.name, categoryName: p.cat, unitPriceCents: p.price, qty: k === 0 ? between(1, 2) : 1 });
    }
    return items;
  };
  const PAY: PaymentMethod[] = ["PIX", "PIX", "PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"];
  async function order(at: Date, status: OrderStatus, type: DeliveryType, extra: Record<string, unknown> = {}) {
    const items = mkItems();
    const fee = type === "DELIVERY" ? pick([600, 700, 900]) : 0;
    const total = items.reduce((s, i) => s + i.unitPriceCents * i.qty, 0) + fee;
    const c = pick(customers);
    return db.order.create({ data: {
      restaurantId: r.id, customerName: c.name, customerPhone: c.phone, customerId: c.id, status, totalCents: total,
      deliveryFeeCents: fee, deliveryType: type, paymentMethod: pick(PAY), paymentConfirmed: true, createdAt: at, dailyNumber: daily++,
      ...(type === "DELIVERY" ? { street: c.street, number: c.number, neighborhood: c.neighborhood, city: "São Paulo" } : {}),
      printedAt: at, items: { create: items }, ...extra,
    } });
  }
  for (let d = 14; d >= 1; d--) {
    const day = new Date(now); day.setDate(now.getDate() - d);
    const weekend = [0, 5, 6].includes(day.getDay());
    const n = between(weekend ? 26 : 14, weekend ? 38 : 24);
    for (let k = 0; k < n; k++) {
      const at = new Date(day); at.setHours(between(11, 22), between(0, 59), 0, 0);
      await order(at, rnd() < 0.04 ? "CANCELED" : "DELIVERED", pick<DeliveryType>(["DELIVERY", "DELIVERY", "PICKUP", "DINE_IN"]),
        { driverId: pick(drivers).id });
    }
  }
  // today: closed earlier orders + a live board
  const today = (h: number, m: number) => { const t = new Date(now); t.setHours(h, m, 0, 0); return t.getTime() > now.getTime() ? new Date(now.getTime() - 60e3 * between(5, 90)) : t; };
  for (let k = 0; k < 12; k++) await order(today(between(11, 13), between(0, 59)), "DELIVERED", pick<DeliveryType>(["DELIVERY", "PICKUP"]), { driverId: pick(drivers).id });
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60e3);
  for (const m of [2, 4, 7]) await order(minsAgo(m), "NEW", "DELIVERY");
  for (const m of [11, 15]) await order(minsAgo(m), "PREPARING", "DELIVERY");
  await order(minsAgo(14), "PREPARING", "PICKUP");
  for (const m of [19, 24]) await order(minsAgo(m), "READY", "PICKUP");
  for (const [i, m] of [27, 31].entries()) await order(minsAgo(m), "OUT_FOR_DELIVERY", "DELIVERY", { driverId: drivers[i].id });

  // open comandas on some tables (dine-in orders attached)
  for (const ti of [0, 2, 3, 6, 8, 11]) {
    const cmd = await db.comanda.create({ data: { restaurantId: r.id, tableId: tables[ti].id, openedAt: minsAgo(between(20, 70)) } });
    for (let k = 0; k < between(1, 3); k++)
      await order(minsAgo(between(5, 60)), pick<OrderStatus>(["PREPARING", "DELIVERED", "DELIVERED"]), "DINE_IN", { tableId: tables[ti].id, comandaId: cmd.id });
  }

  // cash register open today with movements
  const cs = await db.cashSession.create({ data: { restaurantId: r.id, openedById: admin.id, openingAmountCents: 20000, openedAt: today(10, 45) } });
  await db.cashMovement.createMany({ data: [
    { cashSessionId: cs.id, type: "SUPRIMENTO", amountCents: 5000, note: "Troco extra", createdAt: today(12, 10) },
    { cashSessionId: cs.id, type: "SANGRIA", amountCents: 15000, note: "Depósito no cofre", createdAt: today(14, 30) },
  ] });

  // reservations
  const at = (dayOffset: number, h: number, m: number) => { const t = new Date(now); t.setDate(t.getDate() + dayOffset); t.setHours(h, m, 0, 0); return t; };
  const RES: [string, number, Date, string, string | null][] = [
    ["Mariana Castro", 4, at(0, 20, 0), "CONFIRMED", "Aniversário"], ["Roberto Andrade", 2, at(0, 20, 30), "CONFIRMED", null],
    ["Família Oliveira", 6, at(0, 21, 0), "PENDING", "Cadeirinha de bebê"], ["Juliana Prado", 3, at(1, 19, 30), "PENDING", null],
    ["Thiago Moreira", 8, at(1, 21, 0), "CONFIRMED", "Confraternização"],
  ];
  for (const [i, [customerName, partySize, reservedFor, status, note]] of RES.entries())
    await db.reservation.create({ data: { restaurantId: r.id, customerName, customerPhone: `1197777${1000 + i}`, partySize, reservedFor, status: status as any, note, tableId: tables[4 + i]?.id } });

  // delivery zones drawn as polygons around the restaurant
  const ring = (rKm: number, sides: number, rot = 0) => {
    const pts = [];
    for (let i = 0; i <= sides; i++) {
      const a = rot + (i % sides) * 2 * Math.PI / sides;
      pts.push([LNG + (rKm / 102) * Math.cos(a), LAT + (rKm / 111) * Math.sin(a)]);
    }
    return { type: "Polygon", coordinates: [pts] };
  };
  const ZONES: [string, number, number, string[], object][] = [
    ["Centro expandido", 600, 25, ["Bela Vista", "Consolação", "Paraíso"], ring(1.6, 7, 0.3)],
    ["Jardins", 900, 35, ["Jardins", "Cerqueira César", "Jardim Paulista"], { type: "Polygon", coordinates: [[[LNG - 0.012, LAT - 0.004], [LNG - 0.034, LAT - 0.012], [LNG - 0.04, LAT - 0.03], [LNG - 0.016, LAT - 0.03], [LNG - 0.006, LAT - 0.016], [LNG - 0.012, LAT - 0.004]]] }],
    ["Liberdade e Aclimação", 1100, 40, ["Liberdade", "Aclimação", "Cambuci"], { type: "Polygon", coordinates: [[[LNG + 0.014, LAT + 0.004], [LNG + 0.036, LAT + 0.002], [LNG + 0.042, LAT - 0.018], [LNG + 0.022, LAT - 0.024], [LNG + 0.01, LAT - 0.012], [LNG + 0.014, LAT + 0.004]]] }],
  ];
  for (const [name, feeCents, estimatedMinutes, neighborhoods, geoJson] of ZONES)
    await db.deliveryZone.create({ data: { restaurantId: r.id, name, feeCents, estimatedMinutes, minOrderCents: 3000, neighborhoods, geoJson: geoJson as any } });

  const count = await db.order.count({ where: { restaurantId: r.id } });
  console.log("seeded", SLUG, "orders:", count);
}

main().finally(() => db.$disconnect());

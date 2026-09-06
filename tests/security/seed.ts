import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

export type TenantFixture = {
  restaurantId: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  adminUserId: string;
  categoryId: string;
  productId: string;
  couponId: string;
  deliveryFeeId: string;
  orderId: string;
  driverId: string;
  cashSessionId: string;
  closedCashSessionId: string;
  comandaId: string;
  comandaOrderId: string;
  comandaItemId: string;
};

async function createTenant(label: "A" | "B"): Promise<TenantFixture> {
  const suffix = `${label.toLowerCase()}${Date.now()}`;
  const slug = `audit-${suffix}`;
  const adminEmail = `audit-${suffix}@example.com`;
  const adminPassword = "AuditTest123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const restaurant = await db.restaurant.create({
    data: { name: `Auditoria ${label}`, slug, plan: "START", isOpen: true, active: true },
  });

  const adminUser = await db.adminUser.create({
    data: { restaurantId: restaurant.id, name: `Admin ${label}`, email: adminEmail, passwordHash, role: "OWNER" },
  });
  const category = await db.category.create({
    data: { restaurantId: restaurant.id, name: `Categoria ${label}`, order: 0 },
  });

  const product = await db.product.create({
    data: { restaurantId: restaurant.id, categoryId: category.id, name: `Produto ${label}`, priceCents: 1000 },
  });

  const coupon = await db.coupon.create({
    data: {
      restaurantId: restaurant.id,
      code: `AUD${suffix.toUpperCase()}`.slice(0, 20),
      discountType: "PERCENTAGE",
      discountValue: 10,
    },
  });

  const deliveryFee = await db.deliveryFee.create({
    data: { restaurantId: restaurant.id, neighborhood: `Bairro ${label} ${suffix}`, feeCents: 500 },
  });

  const order = await db.order.create({
    data: {
      restaurantId: restaurant.id,
      customerName: `ClienteAuditoria${label}`,
      customerPhone: "11999999999",
      status: "NEW",
      totalCents: 1000,
      paymentMethod: "CASH",
      deliveryType: "PICKUP",
    },
  });

  const driver = await db.driver.create({
    data: { restaurantId: restaurant.id, name: `Entregador ${label}`, phone: "11988887777" },
  });

  const cashSession = await db.cashSession.create({
    data: { restaurantId: restaurant.id, openedById: adminUser.id, openingAmountCents: 10000 },
  });

  const closedCashSession = await db.cashSession.create({
    data: {
      restaurantId: restaurant.id,
      openedById: adminUser.id,
      openingAmountCents: 10000,
      status: "CLOSED",
      closedById: adminUser.id,
      closedAt: new Date(),
      closingAmountCents: 10000,
      expectedAmountCents: 10000,
    },
  });

  const table = await db.table.create({
    data: { restaurantId: restaurant.id, label: `Mesa Auditoria ${label}` },
  });

  const comanda = await db.comanda.create({
    data: { restaurantId: restaurant.id, tableId: table.id },
  });

  const comandaOrder = await db.order.create({
    data: {
      restaurantId: restaurant.id,
      customerName: `ClienteComanda${label}`,
      status: "NEW",
      totalCents: 2000,
      paymentMethod: "CASH",
      deliveryType: "DINE_IN",
      tableId: table.id,
      comandaId: comanda.id,
    },
  });

  const comandaItem = await db.orderItem.create({
    data: {
      orderId: comandaOrder.id,
      productId: product.id,
      productName: `Produto ${label}`,
      unitPriceCents: 2000,
      qty: 1,
    },
  });

  return {
    restaurantId: restaurant.id,
    slug,
    adminEmail,
    adminPassword,
    adminUserId: adminUser.id,
    categoryId: category.id,
    productId: product.id,
    couponId: coupon.id,
    deliveryFeeId: deliveryFee.id,
    orderId: order.id,
    driverId: driver.id,
    cashSessionId: cashSession.id,
    closedCashSessionId: closedCashSession.id,
    comandaId: comanda.id,
    comandaOrderId: comandaOrder.id,
    comandaItemId: comandaItem.id,
  };
}

export async function seedFixtures() {
  const tenantA = await createTenant("A");
  const tenantB = await createTenant("B");
  return { tenantA, tenantB };
}

export async function teardownFixtures(restaurantIds: string[]) {
  // onDelete: Cascade no schema cuida do resto (categorias, produtos, pedidos, etc)
  await db.restaurant.deleteMany({ where: { id: { in: restaurantIds } } });
  await db.$disconnect();
}
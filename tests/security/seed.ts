import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

export type TenantFixture = {
  restaurantId: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  categoryId: string;
  productId: string;
  couponId: string;
  deliveryFeeId: string;
  orderId: string;
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

  await db.adminUser.create({
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

  return {
    restaurantId: restaurant.id,
    slug,
    adminEmail,
    adminPassword,
    categoryId: category.id,
    productId: product.id,
    couponId: coupon.id,
    deliveryFeeId: deliveryFee.id,
    orderId: order.id,
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
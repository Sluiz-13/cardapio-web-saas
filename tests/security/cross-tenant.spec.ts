import { test, expect, request, APIRequestContext } from "@playwright/test";
import { seedFixtures, teardownFixtures, TenantFixture } from "./seed";
import { createAuthedContext } from "./helpers";

test.describe.configure({ mode: "serial" });

let tenantA: TenantFixture;
let tenantB: TenantFixture;
let ctxA: APIRequestContext;
let ctxAnon: APIRequestContext;

test.beforeAll(async () => {
  const seeded = await seedFixtures();
  tenantA = seeded.tenantA;
  tenantB = seeded.tenantB;
  ctxA = await createAuthedContext(tenantA.adminEmail, tenantA.adminPassword);
  ctxAnon = await request.newContext({ baseURL: process.env.TEST_BASE_URL ?? "http://localhost:3000" });
});



test.afterAll(async () => {
  await ctxA.dispose();
  await ctxAnon.dispose();
  await teardownFixtures([tenantA.restaurantId, tenantB.restaurantId]);
});

// --- Listagens não podem vazar dado de outro tenant ---

test("listagem de produtos não inclui produto do Tenant B", async () => {
  const res = await ctxA.get("/api/admin/products");
  const products = await res.json();
  expect(products.map((p: any) => p.id)).not.toContain(tenantB.productId);
});

test("listagem de categorias não inclui categoria do Tenant B", async () => {
  const res = await ctxA.get("/api/admin/categories");
  const categories = await res.json();
  expect(categories.map((c: any) => c.id)).not.toContain(tenantB.categoryId);
});

test("listagem de pedidos não inclui pedido do Tenant B", async () => {
  const res = await ctxA.get("/api/admin/orders");
  const orders = await res.json();
  expect(orders.map((o: any) => o.id)).not.toContain(tenantB.orderId);
});

test("listagem de cupons não inclui cupom do Tenant B", async () => {
  const res = await ctxA.get("/api/admin/coupons");
  const coupons = await res.json();
  expect(coupons.map((c: any) => c.id)).not.toContain(tenantB.couponId);
});

test("listagem de taxas de entrega não inclui taxa do Tenant B", async () => {
  const res = await ctxA.get("/api/admin/delivery-fees");
  const fees = await res.json();
  expect(fees.map((f: any) => f.id)).not.toContain(tenantB.deliveryFeeId);
});

// --- Editar/apagar recurso do Tenant B logado como Tenant A ---

test("PATCH produto do Tenant B é recusado (404)", async () => {
  const res = await ctxA.patch(`/api/admin/products/${tenantB.productId}`, {
    data: { name: "Produto invadido" },
  });
  expect(res.status()).toBe(404);
});

test("DELETE produto do Tenant B é recusado (404)", async () => {
  const res = await ctxA.delete(`/api/admin/products/${tenantB.productId}`);
  expect(res.status()).toBe(404);
});

test("PATCH categoria do Tenant B é recusado (404)", async () => {
  const res = await ctxA.patch(`/api/admin/categories/${tenantB.categoryId}`, {
    data: { name: "Categoria invadida" },
  });
  expect(res.status()).toBe(404);
});

test("DELETE categoria do Tenant B é recusado (404)", async () => {
  const res = await ctxA.delete(`/api/admin/categories/${tenantB.categoryId}`);
  expect(res.status()).toBe(404);
});

test("PATCH cupom do Tenant B é recusado (404)", async () => {
  const res = await ctxA.patch(`/api/admin/coupons/${tenantB.couponId}`, {
    data: { active: false },
  });
  expect(res.status()).toBe(404);
});

test("DELETE cupom do Tenant B é recusado (404)", async () => {
  const res = await ctxA.delete(`/api/admin/coupons/${tenantB.couponId}`);
  expect(res.status()).toBe(404);
});

test("DELETE taxa de entrega do Tenant B é recusado (404)", async () => {
  const res = await ctxA.delete(`/api/admin/delivery-fees/${tenantB.deliveryFeeId}`);
  expect(res.status()).toBe(404);
});

test("PATCH status de pedido do Tenant B é recusado (404)", async () => {
  const res = await ctxA.patch(`/api/admin/orders/${tenantB.orderId}/status`, {
    data: { status: "PREPARING" },
  });
  expect(res.status()).toBe(404);
});

test("Confirmar pagamento de pedido do Tenant B é recusado (404)", async () => {
  const res = await ctxA.patch(`/api/admin/orders/${tenantB.orderId}/confirm-payment`);
  expect(res.status()).toBe(404);
});

test("Ver histórico de pedido do Tenant B é recusado (404)", async () => {
  const res = await ctxA.get(`/api/admin/orders/${tenantB.orderId}/history`);
  expect(res.status()).toBe(404);
});

// --- Tentar criar recurso vinculando a dado de outro tenant ---

test("Criar produto usando categoria do Tenant B é recusado (400)", async () => {
  const res = await ctxA.post("/api/admin/products", {
    data: { categoryId: tenantB.categoryId, name: "Produto cross-tenant", priceCents: 1000 },
  });
  expect(res.status()).toBe(400);
});

// --- Financeiro não pode misturar dado entre tenants ---

test("Exportação CSV do financeiro não inclui pedido do Tenant B", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const res = await ctxA.get(`/api/admin/financeiro/export?from=${today}&to=${today}`);
  const csv = await res.text();
  expect(csv).not.toContain("ClienteAuditoriaB");
});

// --- Sessão de admin de restaurante nunca acessa rotas de plataforma ---
// (cookie diferente do platform-session-token: isso testa o isolamento de
// sessão de verdade, não só uma checagem de authOptions)

test("Sessão de admin de restaurante não cria restaurante via rota de plataforma (401)", async () => {
  const res = await ctxA.post("/api/platform/restaurants", {
    data: {
      restaurantName: "Invasor",
      slug: `invasor-${Date.now()}`,
      ownerName: "x",
      ownerEmail: `invasor-${Date.now()}@example.com`,
      ownerPassword: "12345678",
    },
  });
  expect(res.status()).toBe(401);
});

test("Sessão de admin de restaurante não troca plano de outro restaurante via rota de plataforma (401)", async () => {
  const res = await ctxA.patch(`/api/platform/restaurants/${tenantB.restaurantId}`, {
    data: { plan: "PRO" },
  });
  expect(res.status()).toBe(401);
});

test("Sessão de admin de restaurante não desativa restaurante via rota de plataforma (401)", async () => {
  const res = await ctxA.patch(`/api/platform/restaurants/${tenantB.restaurantId}`, {
    data: { active: false },
  });
  expect(res.status()).toBe(401);
});

// --- Rotas novas do /api/admin/* recusam acesso sem sessão ---
// (não têm parâmetro :id — o próprio design já impede IDOR direto, já que
// tudo é resolvido a partir do restaurantId da sessão — mas TODAS precisam
// recusar visitante anônimo, senão qualquer um lê dado de qualquer tenant)

test("GET /api/admin/dashboard sem sessão retorna 401", async () => {
  const res = await ctxAnon.get("/api/admin/dashboard");
  expect(res.status()).toBe(401);
});

test("GET /api/admin/reports sem sessão retorna 401", async () => {
  const res = await ctxAnon.get("/api/admin/reports?from=2026-01-01&to=2026-01-31");
  expect(res.status()).toBe(401);
});

test("POST /api/admin/logo sem sessão retorna 401", async () => {
  const res = await ctxAnon.post("/api/admin/logo");
  expect(res.status()).toBe(401);
});

test("DELETE /api/admin/logo sem sessão retorna 401", async () => {
  const res = await ctxAnon.delete("/api/admin/logo");
  expect(res.status()).toBe(401);
});

test("GET /api/admin/plan sem sessão retorna 401", async () => {
  const res = await ctxAnon.get("/api/admin/plan");
  expect(res.status()).toBe(401);
});

test("POST /api/admin/plan/request sem sessão retorna 401", async () => {
  const res = await ctxAnon.post("/api/admin/plan/request", { data: { plan: "PRO" } });
  expect(res.status()).toBe(401);
});

test("POST /api/admin/plan/charge sem sessão retorna 401", async () => {
  const res = await ctxAnon.post("/api/admin/plan/charge");
  expect(res.status()).toBe(401);
});

// --- Rotas novas do /platform recusam sessão de admin de restaurante ---
// (cookie diferente do platform-session-token — testa isolamento de sessão)

test("Sessão de admin de restaurante não acessa /api/platform/finance (401)", async () => {
  const res = await ctxA.get("/api/platform/finance");
  expect(res.status()).toBe(401);
});

test("Sessão de admin de restaurante não acessa /api/platform/users (401)", async () => {
  const res = await ctxA.get("/api/platform/users");
  expect(res.status()).toBe(401);
});

test("Sessão de admin de restaurante não acessa /api/platform/plans-overview (401)", async () => {
  const res = await ctxA.get("/api/platform/plans-overview");
  expect(res.status()).toBe(401);
});

test("Sessão de admin de restaurante não troca e-mail do Super Admin (401)", async () => {
  const res = await ctxA.patch("/api/platform/account/email", {
    data: { currentPassword: "qualquer", newEmail: "invasor@example.com" },
  });
  expect(res.status()).toBe(401);
});

test("Sessão de admin de restaurante não troca senha do Super Admin (401)", async () => {
  const res = await ctxA.patch("/api/platform/account/password", {
    data: { currentPassword: "qualquer", newPassword: "12345678" },
  });
  expect(res.status()).toBe(401);
});

test("Sessão de admin de restaurante não aprova solicitação de plano de outro restaurante (401)", async () => {
  const res = await ctxA.post(`/api/platform/restaurants/${tenantB.restaurantId}/approve-plan-request`);
  expect(res.status()).toBe(401);
});

// --- Rotas novas do /platform recusam acesso totalmente anônimo ---

test("GET /api/platform/finance sem sessão retorna 401", async () => {
  const res = await ctxAnon.get("/api/platform/finance");
  expect(res.status()).toBe(401);
});

test("GET /api/platform/users sem sessão retorna 401", async () => {
  const res = await ctxAnon.get("/api/platform/users");
  expect(res.status()).toBe(401);
});
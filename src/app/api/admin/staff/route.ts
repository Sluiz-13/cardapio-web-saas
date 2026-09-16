import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getLimit } from "@/lib/plan-features";

const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["STAFF", "CAIXA", "GERENTE"]).default("STAFF"),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const staff = await db.adminUser.findMany({
    where: { restaurantId: session.user.restaurantId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Só o OWNER pode convidar gente pra equipe — STAFF já está bloqueado de
  // chegar aqui pelo middleware, mas essa checagem extra não custa nada.
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Apenas o dono pode gerenciar a equipe." }, { status: 403 });
  }

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { plan: true },
  });
  if (!restaurant) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const currentCount = await db.adminUser.count({
    where: { restaurantId: session.user.restaurantId },
  });
  const limit = getLimit(restaurant.plan, "maxAdminUsers");
  if (limit !== null && currentCount >= limit) {
    return NextResponse.json(
      { error: `Seu plano permite até ${limit} usuário(s). Faça upgrade pra Pro pra adicionar mais.` },
      { status: 403 }
    );
  }

  const parsed = createStaffSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha nome, e-mail válido e senha com 8+ caracteres." }, { status: 400 });
  }

  const existing = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Esse e-mail já está em uso." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await db.adminUser.create({
    data: {
      restaurantId: session.user.restaurantId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role, // essa rota NUNCA cria OWNER — só Garçom/Caixa/Gerente
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
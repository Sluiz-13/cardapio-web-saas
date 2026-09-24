import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-session";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  currentPassword: z.string().min(1),
});

export async function PATCH(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, currentPassword } = parsed.data;
  const normalizedPhone = parsed.data.phone.replace(/\D/g, "");

  const customer = await db.customer.findUnique({ where: { id: session.customerId } });
  if (!customer || customer.restaurantId !== session.restaurantId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const validPassword = await bcrypt.compare(currentPassword, customer.passwordHash);
  if (!validPassword) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });

  if (normalizedPhone !== customer.phone) {
    const existing = await db.customer.findUnique({
      where: { restaurantId_phone: { restaurantId: session.restaurantId, phone: normalizedPhone } },
    });
    if (existing) return NextResponse.json({ error: "Já existe uma conta com esse telefone." }, { status: 409 });
  }

  const updated = await db.customer.update({
    where: { id: customer.id },
    data: { name, phone: normalizedPhone },
    select: { id: true, name: true, phone: true, loyaltyPoints: true, cashbackBalanceCents: true },
  });

  return NextResponse.json(updated);
}
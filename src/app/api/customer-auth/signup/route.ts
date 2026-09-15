import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createCustomerSessionToken, customerSessionCookieOptions } from "@/lib/customer-session";

const schema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2),
  phone: z.string().min(8),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { restaurantId, name, phone, password } = parsed.data;
  const normalizedPhone = phone.replace(/\D/g, "");

  const existing = await db.customer.findUnique({
    where: { restaurantId_phone: { restaurantId, phone: normalizedPhone } },
  });
  if (existing) {
    return NextResponse.json({ error: "Já existe uma conta com esse telefone." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const customer = await db.customer.create({
    data: { restaurantId, name, phone: normalizedPhone, passwordHash },
  });

  const token = createCustomerSessionToken(customer.id, restaurantId);
  const res = NextResponse.json({ id: customer.id, name: customer.name, phone: customer.phone });
  res.cookies.set({ ...customerSessionCookieOptions(), value: token });
  return res;
}
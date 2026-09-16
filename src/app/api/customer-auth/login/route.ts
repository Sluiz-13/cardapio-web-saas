import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createCustomerSessionToken, customerSessionCookieOptions } from "@/lib/customer-session";

const schema = z.object({
  restaurantId: z.string().min(1),
  phone: z.string().min(8),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { restaurantId, phone, password } = parsed.data;
  const normalizedPhone = phone.replace(/\D/g, "");

  const customer = await db.customer.findUnique({
    where: { restaurantId_phone: { restaurantId, phone: normalizedPhone } },
  });
  if (!customer) return NextResponse.json({ error: "Telefone ou senha incorretos." }, { status: 401 });

  const valid = await bcrypt.compare(password, customer.passwordHash);
  if (!valid) return NextResponse.json({ error: "Telefone ou senha incorretos." }, { status: 401 });

  const token = createCustomerSessionToken(customer.id, restaurantId);
  const res = NextResponse.json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    street: customer.street,
    number: customer.number,
    complement: customer.complement,
    neighborhood: customer.neighborhood,
    city: customer.city,
    referenceNote: customer.referenceNote,
  });
  res.cookies.set({ ...customerSessionCookieOptions(), value: token });
  return res;
}
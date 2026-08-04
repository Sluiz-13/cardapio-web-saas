import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const schema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().email("E-mail inválido."),
});

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = await db.adminUser.findUnique({ where: { id: session.user.id } });
  if (!admin) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const validPassword = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 400 });
  }

  const newEmail = parsed.data.newEmail.trim().toLowerCase();

  try {
    await db.adminUser.update({
      where: { id: admin.id },
      data: { email: newEmail },
    });
  } catch {
    // Violação da constraint @unique do email
    return NextResponse.json({ error: "Esse e-mail já está em uso." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
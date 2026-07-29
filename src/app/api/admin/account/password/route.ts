import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres."),
});

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = await db.adminUser.findUnique({ where: { id: session.user.id } });
  if (!admin) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const validCurrent = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
  if (!validCurrent) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ ok: true });
}
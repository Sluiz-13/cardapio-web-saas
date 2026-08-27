import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Apenas o dono pode gerenciar a equipe." }, { status: 403 });
  }

  const target = await db.adminUser.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (!target) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Não é possível remover o dono da conta." }, { status: 400 });
  }

  await db.adminUser.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
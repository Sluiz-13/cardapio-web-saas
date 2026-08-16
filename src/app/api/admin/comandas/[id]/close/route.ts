import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const comanda = await db.comanda.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (!comanda) return NextResponse.json({ error: "não encontrada" }, { status: 404 });
  if (comanda.status === "CLOSED") {
    return NextResponse.json({ error: "Essa comanda já está fechada." }, { status: 409 });
  }

  await db.comanda.update({
    where: { id: params.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const table = await db.table.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (!table) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const openComanda = await db.comanda.findFirst({
    where: { tableId: params.id, status: "OPEN" },
  });
  if (openComanda) {
    return NextResponse.json(
      { error: "Essa mesa tem uma comanda aberta agora. Feche a conta antes de excluir a mesa." },
      { status: 409 }
    );
  }

  // Igual fizemos com produto: pedidos antigos dessa mesa mantêm o
  // histórico intacto (tableId vira null via onDelete: SetNull no schema),
  // só o vínculo "vivo" com a mesa é que some.
  await db.table.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await db.order.updateMany({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    data: { status: "CANCELED" },
  });
  if (result.count === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
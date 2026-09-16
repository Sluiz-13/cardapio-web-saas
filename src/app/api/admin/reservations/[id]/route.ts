import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const updateSchema = z.object({
  customerName: z.string().min(2).optional(),
  customerPhone: z.string().min(8).optional(),
  partySize: z.number().int().positive().optional(),
  reservedFor: z.string().min(1).optional(),
  note: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELED"]).optional(),
  tableId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { reservedFor, tableId, ...rest } = parsed.data;

  // Se veio tableId, confirma que a mesa é desse restaurante — nunca confia
  // no id vindo do navegador sozinho.
  if (tableId) {
    const table = await db.table.findFirst({ where: { id: tableId, restaurantId: session.user.restaurantId } });
    if (!table) return NextResponse.json({ error: "Mesa inválida." }, { status: 400 });
  }

  const result = await db.reservation.updateMany({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    data: { ...rest, ...(reservedFor ? { reservedFor: new Date(reservedFor) } : {}), ...(tableId !== undefined ? { tableId } : {}) },
  });
  if (result.count === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await db.reservation.deleteMany({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (result.count === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
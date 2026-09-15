import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const bodySchema = z.object({
  type: z.enum(["ENTRADA", "AJUSTE"]),
  // Entrada: sempre positivo (compra). Ajuste: pode ser negativo (perda) ou positivo (correção pra mais).
  quantity: z.number(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { type, quantity, note } = parsed.data;
  if (type === "ENTRADA" && quantity <= 0) {
    return NextResponse.json({ error: "Entrada precisa ser um valor positivo." }, { status: 400 });
  }

  const insumo = await db.insumo.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (!insumo) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  await db.$transaction([
    db.insumo.update({
      where: { id: insumo.id },
      data: { currentStock: insumo.currentStock + quantity },
    }),
    db.stockMovement.create({
      data: { insumoId: insumo.id, type, quantity: Math.abs(quantity), note },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
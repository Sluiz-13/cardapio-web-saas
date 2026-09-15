import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  costPerUnit: z.number().int().nonnegative().optional(),
  minStock: z.number().nonnegative().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const result = await db.insumo.updateMany({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    data: parsed.data,
  });
  if (result.count === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await db.insumo.deleteMany({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (result.count === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
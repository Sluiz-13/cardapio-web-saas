import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const bodySchema = z.object({
  driverId: z.string().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Garante que o entregador pertence ao mesmo restaurante antes de vincular
  if (parsed.data.driverId) {
    const driver = await db.driver.findFirst({
      where: { id: parsed.data.driverId, restaurantId: session.user.restaurantId },
    });
    if (!driver) return NextResponse.json({ error: "entregador não encontrado" }, { status: 404 });
  }

  const result = await db.order.updateMany({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    data: { driverId: parsed.data.driverId },
  });
  if (result.count === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { notificationsClient } from "@/lib/notifications-client";

const STATUS_FLOW = ["NEW", "PREPARING", "READY", "DELIVERED"] as const;

const bodySchema = z.object({
  status: z.enum(STATUS_FLOW),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await db.order.updateMany({
    where: { id: params.id, restaurantId: session.user.restaurantId },
    data: { status: parsed.data.status },
  });
  if (result.count === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  await notificationsClient.orderStatusChanged({
    restaurantId: session.user.restaurantId,
    orderId: params.id,
    status: parsed.data.status,
  });

  return NextResponse.json({ ok: true });
}
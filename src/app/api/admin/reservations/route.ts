import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const createSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  partySize: z.number().int().positive(),
  reservedFor: z.string().min(1), // ISO datetime
  note: z.string().optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const reservations = await db.reservation.findMany({
    where: { restaurantId: session.user.restaurantId },
    include: { table: { select: { id: true, label: true } } },
    orderBy: { reservedFor: "asc" },
  });
  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const reservation = await db.reservation.create({
    data: { ...parsed.data, reservedFor: new Date(parsed.data.reservedFor), restaurantId: session.user.restaurantId },
  });
  return NextResponse.json(reservation, { status: 201 });
}
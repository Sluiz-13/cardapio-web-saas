import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const bodySchema = z.object({
  type: z.enum(["SANGRIA", "SUPRIMENTO"]),
  amountCents: z.number().int().positive(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const cashSession = await db.cashSession.findFirst({
    where: { restaurantId: session.user.restaurantId, status: "OPEN" },
  });
  if (!cashSession) return NextResponse.json({ error: "Nenhum caixa aberto." }, { status: 400 });

  const movement = await db.cashMovement.create({
    data: { cashSessionId: cashSession.id, ...parsed.data },
  });

  return NextResponse.json(movement, { status: 201 });
}
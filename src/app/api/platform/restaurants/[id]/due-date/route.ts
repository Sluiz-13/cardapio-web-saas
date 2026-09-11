import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";

const bodySchema = z.object({
  nextDueDate: z.string().min(1), // "YYYY-MM-DD"
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Data inválida." }, { status: 400 });

  const nextDueDate = new Date(`${parsed.data.nextDueDate}T12:00:00`); // meio-dia evita virar o dia errado por fuso
  if (isNaN(nextDueDate.getTime())) {
    return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  }

  const result = await db.restaurant.updateMany({
    where: { id: params.id },
    data: { nextDueDate },
  });
  if (result.count === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
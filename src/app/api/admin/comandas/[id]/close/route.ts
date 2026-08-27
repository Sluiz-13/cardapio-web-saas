import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const closeSchema = z.object({
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = closeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Escolha a forma de pagamento." }, { status: 400 });
  }

  const comanda = await db.comanda.findFirst({
    where: { id: params.id, restaurantId: session.user.restaurantId },
  });
  if (!comanda) return NextResponse.json({ error: "não encontrada" }, { status: 404 });
  if (comanda.status === "CLOSED") {
    return NextResponse.json({ error: "Essa comanda já está fechada." }, { status: 409 });
  }

  await db.comanda.update({
    where: { id: params.id },
    data: { status: "CLOSED", closedAt: new Date(), paymentMethod: parsed.data.paymentMethod },
  });

  return NextResponse.json({ ok: true });
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const createSchema = z.object({
  neighborhood: z.string().min(2),
  feeCents: z.number().int().nonnegative(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const fees = await db.deliveryFee.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { neighborhood: "asc" },
  });
  return NextResponse.json(fees);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const fee = await db.deliveryFee.create({
      data: { ...parsed.data, restaurantId: session.user.restaurantId },
    });
    return NextResponse.json(fee, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Esse bairro já está cadastrado." }, { status: 400 });
  }
}
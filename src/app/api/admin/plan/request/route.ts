import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const requestSchema = z.object({ plan: z.enum(["START", "PRO"]) });

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Só o dono do restaurante pode solicitar troca de plano." }, { status: 403 });
  }

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db.restaurant.updateMany({
    where: { id: session.user.restaurantId },
    data: { pendingPlanRequest: parsed.data.plan, pendingPlanRequestedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";

const patchSchema = z.object({ active: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.platformCoupon.updateMany({
    where: { id: params.id },
    data: { active: parsed.data.active },
  });
  if (updated.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
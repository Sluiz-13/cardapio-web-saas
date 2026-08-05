import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const updated = await db.restaurant.updateMany({
    where: { id: params.id },
    data: { lastPaymentConfirmedAt: new Date() },
  });
  if (updated.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
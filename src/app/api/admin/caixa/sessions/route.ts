import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sessions = await db.cashSession.findMany({
    where: { restaurantId: session.user.restaurantId, status: "CLOSED" },
    include: { openedBy: { select: { name: true } }, closedBy: { select: { name: true } } },
    orderBy: { closedAt: "desc" },
    take: 90,
  });

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      openedByName: s.openedBy.name,
      closedByName: s.closedBy?.name ?? null,
      openingAmountCents: s.openingAmountCents,
      closingAmountCents: s.closingAmountCents,
      expectedAmountCents: s.expectedAmountCents,
      differenceCents: (s.closingAmountCents ?? 0) - (s.expectedAmountCents ?? 0),
    }))
  );
}
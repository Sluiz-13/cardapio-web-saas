import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const users = await db.adminUser.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      restaurant: { select: { id: true, name: true, slug: true, active: true } },
    },
  });

  return NextResponse.json(users);
}
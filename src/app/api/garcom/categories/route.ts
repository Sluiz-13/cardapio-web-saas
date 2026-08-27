import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const categories = await db.category.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(categories);
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const products = await db.product.findMany({
    where: { restaurantId: session.user.restaurantId, active: true },
    include: { category: true, removableOptions: true, extraOptions: true },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });

  return NextResponse.json(products);
}
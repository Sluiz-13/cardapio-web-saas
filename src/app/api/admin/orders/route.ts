import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getBoardOrders } from "@/lib/board-orders";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orders = await getBoardOrders(session.user.restaurantId);

  return NextResponse.json(orders);
}
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const PAGE_SIZE = 30;

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  if (!from || !to) {
    return NextResponse.json({ error: "Parâmetros from/to obrigatórios." }, { status: 400 });
  }

  const restaurantId = session.user.restaurantId;
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);

  const where = { restaurantId, createdAt: { gte: fromDate, lte: toDate } };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: true,
        table: { select: { label: true } },
        driver: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, pageSize: PAGE_SIZE });
}
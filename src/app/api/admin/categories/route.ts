import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { assertUnderPlanLimit } from "@/lib/plan-guard";

const createCategorySchema = z.object({
  name: z.string().min(2),
  order: z.number().int().default(0),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const categories = await db.category.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createCategorySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const limitCheck = await assertUnderPlanLimit(session.user.restaurantId, "maxCategories");
  if (!limitCheck.ok) return NextResponse.json({ error: limitCheck.message }, { status: 403 });

  const category = await db.category.create({
    data: { ...parsed.data, restaurantId: session.user.restaurantId },
  });
  return NextResponse.json(category, { status: 201 });
}
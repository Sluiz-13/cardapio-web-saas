import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const updateSchema = z.object({
  isOpen: z.boolean().optional(),
  businessHours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        isOpen: z.boolean(),
        openTime: z.string().regex(timeRegex, "Horário inválido, use HH:mm"),
        closeTime: z.string().regex(timeRegex, "Horário inválido, use HH:mm"),
      })
    )
    .optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { id: true, name: true, isOpen: true },
  });

  const businessHours = await db.businessHours.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ restaurant, businessHours });
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { isOpen, businessHours } = parsed.data;

  if (isOpen !== undefined) {
    await db.restaurant.update({
      where: { id: session.user.restaurantId },
      data: { isOpen },
    });
  }

  if (businessHours) {
    await db.$transaction(
      businessHours.map((h) =>
        db.businessHours.upsert({
          where: { restaurantId_dayOfWeek: { restaurantId: session.user.restaurantId, dayOfWeek: h.dayOfWeek } },
          update: { isOpen: h.isOpen, openTime: h.openTime, closeTime: h.closeTime },
          create: { ...h, restaurantId: session.user.restaurantId },
        })
      )
    );
  }

  return NextResponse.json({ ok: true });
}
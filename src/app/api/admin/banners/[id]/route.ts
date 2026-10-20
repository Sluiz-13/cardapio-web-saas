import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const patchSchema = z.object({
  active: z.boolean().optional(),
  couponId: z.string().nullable().optional(), // null = remove o vínculo
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;

  const banner = await db.restaurantBanner.findFirst({ where: { id: params.id, restaurantId }, select: { id: true } });
  if (!banner) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { active, couponId } = parsed.data;

  if (couponId) {
    const coupon = await db.coupon.findFirst({ where: { id: couponId, restaurantId }, select: { id: true } });
    if (!coupon) return NextResponse.json({ error: "Cupom inválido." }, { status: 400 });
  }

  const data: { active?: boolean; couponId?: string | null } = {};
  if (active !== undefined) data.active = active;
  if (couponId !== undefined) data.couponId = couponId;

  const updated = await db.restaurantBanner.update({
    where: { id: banner.id },
    data,
    select: {
      id: true,
      imageUrl: true,
      position: true,
      active: true,
      couponId: true,
      coupon: { select: { id: true, code: true, active: true } },
    },
  });

  return NextResponse.json({ banner: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;

  const banner = await db.restaurantBanner.findFirst({
    where: { id: params.id, restaurantId },
    select: { id: true, imageUrl: true },
  });
  if (!banner) return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  await db.restaurantBanner.delete({ where: { id: banner.id } });

  // Só apaga arquivo dentro da pasta de banners (evita path traversal).
  if (banner.imageUrl.startsWith("/uploads/banners/")) {
    await unlink(path.join(process.cwd(), "public", banner.imageUrl)).catch(() => {});
  }

  // Recompacta as posições (0, 1, 2) pra não ficar buraco na ordem.
  const rest = await db.restaurantBanner.findMany({
    where: { restaurantId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  await db.$transaction(
    rest.map((b, index) => db.restaurantBanner.update({ where: { id: b.id }, data: { position: index } }))
  );

  return NextResponse.json({ ok: true });
}
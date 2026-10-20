import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const MAX_BANNERS = 3;
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB — banner costuma ser maior que logo
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "banners");

const bannerSelect = {
  id: true,
  imageUrl: true,
  position: true,
  active: true,
  couponId: true,
  coupon: { select: { id: true, code: true, active: true } },
} as const;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const banners = await db.restaurantBanner.findMany({
    where: { restaurantId: session.user.restaurantId },
    select: bannerSelect,
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ banners, max: MAX_BANNERS });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;

  const count = await db.restaurantBanner.count({ where: { restaurantId } });
  if (count >= MAX_BANNERS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_BANNERS} banners atingido. Exclua um para adicionar outro.` },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const couponIdRaw = formData.get("couponId");
  const couponId = typeof couponIdRaw === "string" && couponIdRaw ? couponIdRaw : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Imagem muito grande. Máximo 3MB." }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Formato inválido. Use PNG, JPG ou WEBP." }, { status: 400 });
  }

  // Nunca confiar no couponId do cliente: tem que ser deste restaurante.
  if (couponId) {
    const coupon = await db.coupon.findFirst({ where: { id: couponId, restaurantId }, select: { id: true } });
    if (!coupon) return NextResponse.json({ error: "Cupom inválido." }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `${restaurantId}-${Date.now()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(await file.arrayBuffer()));

  const banner = await db.restaurantBanner.create({
    data: {
      restaurantId,
      imageUrl: `/uploads/banners/${fileName}`,
      position: count, // entra no fim da fila
      couponId,
    },
    select: bannerSelect,
  });

  return NextResponse.json({ banner }, { status: 201 });
}

const reorderSchema = z.object({ order: z.array(z.string()).min(1).max(MAX_BANNERS) });

// Reordena: recebe os ids na ordem desejada.
export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;

  const parsed = reorderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { order } = parsed.data;

  // Todos os ids precisam ser deste restaurante.
  const owned = await db.restaurantBanner.count({ where: { restaurantId, id: { in: order } } });
  if (owned !== new Set(order).size || owned !== order.length) {
    return NextResponse.json({ error: "Banner inválido." }, { status: 400 });
  }

  await db.$transaction(
    order.map((id, index) =>
      db.restaurantBanner.updateMany({ where: { id, restaurantId }, data: { position: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
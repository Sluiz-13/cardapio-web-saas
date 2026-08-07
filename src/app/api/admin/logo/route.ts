import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logos");

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Imagem muito grande. Máximo 2MB." }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Formato inválido. Use PNG, JPG ou WEBP." }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { logoUrl: true },
  });

  // Remove o logo antigo do disco, se existir, pra não acumular lixo.
  if (restaurant?.logoUrl) {
    const oldPath = path.join(process.cwd(), "public", restaurant.logoUrl);
    await unlink(oldPath).catch(() => {});
  }

  const fileName = `${session.user.restaurantId}-${Date.now()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const publicUrl = `/uploads/logos/${fileName}`;
  await db.restaurant.update({
    where: { id: session.user.restaurantId },
    data: { logoUrl: publicUrl },
  });

  return NextResponse.json({ logoUrl: publicUrl });
}

export async function DELETE() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { logoUrl: true },
  });

  if (restaurant?.logoUrl) {
    const oldPath = path.join(process.cwd(), "public", restaurant.logoUrl);
    await unlink(oldPath).catch(() => {});
  }

  await db.restaurant.update({ where: { id: session.user.restaurantId }, data: { logoUrl: null } });
  return NextResponse.json({ ok: true });
}
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAdminSession } from "@/lib/session";

// Upload independente de productId de propósito: no formulário de produto,
// a imagem pode ser escolhida ANTES do produto existir (fluxo de criação).
// Essa rota só sobe o arquivo e devolve a URL pública; quem associa a URL
// ao produto é o POST/PUT normal de /api/admin/products, que já existe.
//
// Trade-off consciente: se o usuário subir uma imagem e desistir de criar o
// produto, o arquivo fica órfão no disco (não é deletado sozinho). Aceitável
// pro lançamento — não afeta funcionamento nem segurança, só acumula uns KB
// de disco ao longo do tempo. Dá pra fazer uma limpeza periódica depois se
// virar volume relevante.

const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB — imagem de prato tende a ser maior que logo
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

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

  await mkdir(UPLOAD_DIR, { recursive: true });

  // Prefixo com restaurantId evita qualquer colisão de nome entre
  // restaurantes diferentes subindo arquivo no mesmo milissegundo.
  const fileName = `${session.user.restaurantId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const publicUrl = `/uploads/products/${fileName}`;
  return NextResponse.json({ imageUrl: publicUrl });
}
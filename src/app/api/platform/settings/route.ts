import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPlatformSession } from "@/lib/platform-session";

const settingsSchema = z.object({
  pixKey: z.string().min(1),
  pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]),
  pixMerchantName: z.string().min(1),
  pixMerchantCity: z.string().min(1),
});

export async function GET() {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const settings = await db.platformSettings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(settings ?? {});
}

export async function PATCH(req: NextRequest) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = settingsSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const settings = await db.platformSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });

  return NextResponse.json(settings);
}
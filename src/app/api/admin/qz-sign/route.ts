import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSession } from "@/lib/session";

function getPrivateKey(): string | null {
  const base64 = process.env.QZ_TRAY_PRIVATE_KEY_BASE64;
  if (!base64) return null;
  return Buffer.from(base64, "base64").toString("utf-8");
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const privateKey = getPrivateKey();
  if (!privateKey) {
    return NextResponse.json({ error: "QZ Tray não configurado no servidor" }, { status: 500 });
  }

  const { toSign } = await req.json();
  if (typeof toSign !== "string") {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  const signer = crypto.createSign("SHA512");
  signer.update(toSign);
  signer.end();
  const signature = signer.sign(privateKey, "base64");

  return NextResponse.json({ signature });
}
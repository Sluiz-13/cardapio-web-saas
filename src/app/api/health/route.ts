import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Rota pública de health check — usada por monitores externos (ex: UptimeRobot).
// Não expõe nenhum dado sensível, só confirma que a aplicação e o banco
// estão respondendo. Sempre mantenha essa rota fora de qualquer proteção
// de sessão/admin — o monitor externo não tem cookie de login.
export async function GET() {
  try {
    // Query mínima só pra validar que a conexão com o Postgres está de pé.
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        db: "up",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[health] falha ao conectar no banco:", error);

    return NextResponse.json(
      {
        status: "error",
        db: "down",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
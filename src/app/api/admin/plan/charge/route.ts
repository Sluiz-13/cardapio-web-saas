import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { generatePixPayload } from "@/lib/pix";
import { PLAN_PRICE_CENTS } from "@/lib/plan-pricing";

export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [settings, restaurant] = await Promise.all([
    db.platformSettings.findUnique({ where: { id: "singleton" } }),
    db.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: { slug: true, plan: true, pendingPlanRequest: true },
    }),
  ]);

  if (!restaurant) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!settings?.pixKey) {
    return NextResponse.json({ error: "Pagamento indisponível no momento. Fale com o suporte." }, { status: 400 });
  }

  // Se tem troca de plano pendente, cobra o plano solicitado.
  // Senão, é renovação normal — cobra o plano atual mesmo.
  const targetPlan = restaurant.pendingPlanRequest ?? restaurant.plan;
  const amountCents = PLAN_PRICE_CENTS[targetPlan];

  const payload = generatePixPayload({
    pixKey: settings.pixKey,
    pixKeyType: settings.pixKeyType,
    merchantName: settings.pixMerchantName ?? "CARDAPIO SAAS",
    merchantCity: settings.pixMerchantCity ?? "BRASIL",
    amountCents,
    txid: restaurant.slug,
  });

  return NextResponse.json({ payload, amountCents, plan: targetPlan });
}
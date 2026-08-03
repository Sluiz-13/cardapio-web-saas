import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-client-ip";

const schema = z.object({
  restaurantId: z.string().min(1),
  code: z.string().min(1),
  subtotalCents: z.number().int().nonnegative(),
  // Necessário para cupons restritos a um produto específico: sem isso não
  // dá pra calcular o desconto só na linha certa do carrinho.
  items: z.array(z.object({ productId: z.string(), lineTotalCents: z.number().int().nonnegative() })).default([]),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`coupon-validate:${ip}`, 15, 5 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ valid: false, error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ valid: false, error: "Requisição inválida." }, { status: 400 });

  const { restaurantId, code, subtotalCents, items } = parsed.data;

  const coupon = await db.coupon.findUnique({
    where: { restaurantId_code: { restaurantId, code: code.trim().toUpperCase() } },
    include: { product: { select: { name: true } } },
  });

  if (!coupon || !coupon.active) {
    return NextResponse.json({ valid: false, error: "Cupom inválido." });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "Cupom expirado." });
  }
  if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
    return NextResponse.json({ valid: false, error: "Cupom esgotado." });
  }
  if (coupon.minOrderCents && subtotalCents < coupon.minOrderCents) {
    return NextResponse.json({
      valid: false,
      error: `Pedido mínimo de R$ ${(coupon.minOrderCents / 100).toFixed(2).replace(".", ",")} para usar esse cupom.`,
    });
  }

  // Base de cálculo do desconto: pedido inteiro, ou só as linhas do produto alvo.
  let baseCents = subtotalCents;
  if (coupon.productId) {
    const matchingLines = items.filter((i) => i.productId === coupon.productId);
    if (matchingLines.length === 0) {
      return NextResponse.json({
        valid: false,
        error: `Esse cupom só vale para o produto "${coupon.product?.name}". Adicione-o ao carrinho.`,
      });
    }
    baseCents = matchingLines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  }

  const discountCents =
    coupon.discountType === "PERCENTAGE"
      ? Math.round((baseCents * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, baseCents);

  return NextResponse.json({ valid: true, discountCents, code: coupon.code });
}
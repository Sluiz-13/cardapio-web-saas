/**
 * Rate limiter em memória (fixed window), por chave arbitrária (ex: IP).
 *
 * LIMITAÇÃO CONHECIDA: o contador vive na memória do processo Node. Funciona
 * corretamente com 1 instância do servidor rodando (nosso caso hoje, 1
 * container Docker). Se no futuro isso rodar em múltiplas instâncias atrás
 * de um load balancer, cada instância terá seu próprio contador e o limite
 * real efetivo vira (limite × nº de instâncias). Quando chegar nesse ponto,
 * trocar por um limiter baseado em Redis (ex: Upstash Ratelimit).
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Evita crescimento infinito do Map com IPs que nunca mais voltam.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (bucket.count >= limit) {
    return { allowed: false };
  }
  bucket.count += 1;
  return { allowed: true };
}
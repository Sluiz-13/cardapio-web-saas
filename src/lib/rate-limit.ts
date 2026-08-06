import Redis from "ioredis";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Evita crescimento infinito do Map com IPs que nunca mais voltam.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

function rateLimitMemory(key: string, limit: number, windowMs: number): { allowed: boolean } {
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

let redis: Redis | null = null;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
  redis.on("error", (err) => {
    console.error("[rate-limit] Redis com problema, caindo pra memória local nessa chamada:", err.message);
  });
}

// Incrementa e, só na 1ª vez que a chave é criada, define o TTL da janela —
// atômico, sem race condition entre instâncias concorrentes.
const INCR_WITH_TTL_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if tonumber(current) == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return current
`;

async function rateLimitRedis(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean } | null> {
  if (!redis) return null;
  try {
    const count = (await redis.eval(INCR_WITH_TTL_SCRIPT, 1, `ratelimit:${key}`, windowMs)) as number;
    return { allowed: count <= limit };
  } catch (err) {
    console.error("[rate-limit] Falha ao falar com Redis, usando fallback em memória:", (err as Error).message);
    return null;
  }
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean }> {
  const redisResult = await rateLimitRedis(key, limit, windowMs);
  if (redisResult) return redisResult;
  return rateLimitMemory(key, limit, windowMs);
}